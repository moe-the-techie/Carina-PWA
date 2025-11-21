import FormData from 'form-data';
import fetch from 'node-fetch';
import zlib from 'zlib';

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

// Hide audio data inside a PNG image
export const hideAudioInImage = (audioBuffer) => {
    try {
        const audioSize = audioBuffer.length;
        
        // Store audio size in first 4 bytes (as 32-bit integer)
        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(audioSize, 0);
        
        // Combine size + audio data
        const dataWithSize = Buffer.concat([sizeBuffer, audioBuffer]);
        const totalSize = dataWithSize.length;
        
        // Calculate PNG dimensions (3 bytes per pixel: RGB)
        const pixelsNeeded = Math.ceil(totalSize / 3);
        const width = Math.ceil(Math.sqrt(pixelsNeeded));
        const height = Math.ceil(pixelsNeeded / width);
        
        // Create PNG
        const png = createPNG(width, height, dataWithSize);
        return png;
    } catch (error) {
        console.error('Error hiding audio in image:', error);
        throw new Error(`Failed to hide audio in image: ${error.message}`);
    }
};

// Create PNG image from raw data
const createPNG = (width, height, dataBuffer) => {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk
    const ihdr = createChunk('IHDR', Buffer.concat([
        Buffer.from([
            width >> 24, width >> 16, width >> 8, width,
            height >> 24, height >> 16, height >> 8, height,
            8, // bit depth
            2, // color type (RGB)
            0, // compression
            0, // filter
            0  // interlace
        ])
    ]));
    
    // Create image data with scanlines
    const bytesPerPixel = 3; // RGB
    const bytesPerLine = width * bytesPerPixel;
    const imageData = Buffer.alloc(height * (bytesPerLine + 1)); // +1 for filter byte
    
    let dataIndex = 0;
    for (let y = 0; y < height; y++) {
        imageData[y * (bytesPerLine + 1)] = 0; // No filter
        
        for (let x = 0; x < width; x++) {
            const offset = y * (bytesPerLine + 1) + 1 + x * bytesPerPixel;
            
            // Embed data in RGB
            imageData[offset] = dataIndex < dataBuffer.length ? dataBuffer[dataIndex++] : 0;
            imageData[offset + 1] = dataIndex < dataBuffer.length ? dataBuffer[dataIndex++] : 0;
            imageData[offset + 2] = dataIndex < dataBuffer.length ? dataBuffer[dataIndex++] : 0;
        }
    }
    
    // Compress image data
    const compressed = zlib.deflateSync(imageData);
    
    // IDAT chunk
    const idat = createChunk('IDAT', compressed);
    
    // IEND chunk
    const iend = createChunk('IEND', Buffer.alloc(0));
    
    return Buffer.concat([signature, ihdr, idat, iend]);
};

// Create PNG chunk
const createChunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    
    const typeBuffer = Buffer.from(type, 'ascii');
    const crc = zlib.crc32(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);
    
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
};

// Extract audio data from PNG image
export const extractAudioFromImage = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pngBuffer = Buffer.from(arrayBuffer);
        
        // Parse PNG chunks
        let offset = 8; // Skip PNG signature
        let imageData = Buffer.alloc(0);
        
        while (offset < pngBuffer.length) {
            const length = pngBuffer.readUInt32BE(offset);
            const type = pngBuffer.toString('ascii', offset + 4, offset + 8);
            const data = pngBuffer.subarray(offset + 8, offset + 8 + length);
            
            if (type === 'IDAT') {
                imageData = Buffer.concat([imageData, data]);
            } else if (type === 'IEND') {
                break;
            }
            
            offset += 12 + length; // length(4) + type(4) + data(length) + crc(4)
        }
        
        // Decompress image data
        const decompressed = zlib.inflateSync(imageData);
        
        // Read IHDR for dimensions
        offset = 8;
        const ihdrLength = pngBuffer.readUInt32BE(offset);
        const ihdrData = pngBuffer.subarray(offset + 8, offset + 8 + ihdrLength);
        const width = ihdrData.readUInt32BE(0);
        const height = ihdrData.readUInt32BE(4);
        
        // Extract pixel data (skip filter bytes)
        const bytesPerPixel = 3; // RGB
        const bytesPerLine = width * bytesPerPixel;
        const extractedData = [];
        
        for (let y = 0; y < height; y++) {
            const lineStart = y * (bytesPerLine + 1) + 1; // +1 for filter byte
            
            for (let x = 0; x < width; x++) {
                const offset = lineStart + x * bytesPerPixel;
                extractedData.push(decompressed[offset]);     // R
                extractedData.push(decompressed[offset + 1]); // G
                extractedData.push(decompressed[offset + 2]); // B
            }
        }
        
        const dataWithSize = Buffer.from(extractedData);
        
        // Read original audio size from first 4 bytes
        const audioSize = dataWithSize.readUInt32BE(0);
        
        // Extract audio data (skip size header)
        const audioData = dataWithSize.subarray(4, 4 + audioSize);
        
        return audioData;
    } catch (error) {
        console.error('Error extracting audio from image:', error);
        throw new Error(`Failed to extract audio from image: ${error.message}`);
    }
};

export default { uploadToImgBB, deleteFromImgBB, hideAudioInImage, extractAudioFromImage };
