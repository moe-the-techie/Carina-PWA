import FormData from 'form-data';
import fetch from 'node-fetch';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export const uploadToImgBB = async (imageBuffer, imageName = 'chat-image') => {
    if (!IMGBB_API_KEY) {
        throw new Error('ImgBB API key is not configured');
    }

    try {
        const formData = new FormData();
        
        const base64Image = imageBuffer.toString('base64');
        formData.append('image', base64Image);
        formData.append('name', imageName);
        formData.append('expiration', '2592000'); // 30 days

        const response = await fetch(`${IMGBB_UPLOAD_URL}?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error?.message || 'Failed to upload image to ImgBB');
        }

        return {
            url: data.data.url,
            displayUrl: data.data.display_url,
            deleteUrl: data.data.delete_url,
            thumb: data.data.thumb,
            medium: data.data.medium,
            size: data.data.size
        };
    } catch (error) {
        console.error('ImgBB upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};

export const deleteFromImgBB = async (deleteUrl) => {
    try {
        if (!deleteUrl) {
            console.warn('No delete URL provided');
            return false;
        }

        const response = await fetch(deleteUrl, { method: 'GET' });
        return response.ok;
    } catch (error) {
        console.error('ImgBB delete error:', error);
        return false;
    }
};

export default { uploadToImgBB, deleteFromImgBB };
