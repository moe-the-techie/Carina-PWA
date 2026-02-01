import Form from '../models/Form.js';
import User from '../models/User.js';
import { uploadBodyImageToCloudinary } from '../config/cloudinary.js';

// TODO: Add route for admin to get all forms that were not reviewed

export async function getAllForms (req, res) {
    // TODO: protect this route for admin only
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const forms = await Form.find()
            .populate('user', 'name email dateOfBirth isMother gender')
            .skip(skip)
            .limit(limit);

        const total = await Form.countDocuments();

        if (!forms || forms.length === 0) {
            if (total === 0) {
                return res.status(404).json({ error: '404: No forms found' });
            }
        }

        res.status(200).json({ 
            message: 'Forms fetched successfully', 
            forms: forms,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalForms: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getMyForms (req, res) {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const forms = await Form.find({ user: userId })
            .populate('user', 'name email dateOfBirth isMother gender')
            .skip(skip)
            .limit(limit);

        const total = await Form.countDocuments({ user: userId });

        if (!forms || forms.length === 0) {
            if (total === 0) {
                return res.status(404).json({ error: 'No forms found for this user' });
            }
        }

        res.status(200).json({ 
            message: 'Forms fetched successfully', 
            forms: forms,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalForms: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUserForms (req, res) {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const forms = await Form.find({ user: userId })
            .populate('user', 'name email dateOfBirth isMother gender')
            .skip(skip)
            .limit(limit);

        const total = await Form.countDocuments({ user: userId });

        if (!forms || forms.length === 0) {
            if (total === 0) {
                return res.status(404).json({ error: `404: No forms found for user with ID ${userId}` });
            }
        }

        res.status(200).json({ 
            message: 'Forms fetched successfully', 
            forms: forms,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalForms: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function newForm(req, res) {
    try {
        const userId = req.user._id;
        
        // Check if user has form credits
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if payments are enabled
        const paymentsEnabled = process.env.ENABLE_PAYMENTS !== 'false';

        // Check for form credits (admins have unlimited credits, skip if payments disabled)
        if (paymentsEnabled && user.role !== 'admin' && (!user.formCredits || user.formCredits <= 0)) {
            return res.status(403).json({ 
                error: 'No form credits available',
                code: 'NO_CREDITS',
                message: 'You need to purchase form credits to submit a new form.'
            });
        }

        const formData = { ...req.body, user: userId };

        const newForm = new Form(formData);
        await newForm.save();

        // Deduct one form credit (only for non-admin users when payments are enabled)
        if (paymentsEnabled && user.role !== 'admin') {
            user.formCredits -= 1;
            await user.save();
        }

        res.status(201).json({ 
            message: 'Form created successfully', 
            form: newForm,
            remainingCredits: user.formCredits
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Upload body image to Cloudinary
export async function uploadBodyImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const imageName = `body-image-${req.user._id}-${Date.now()}`;
        const uploadResult = await uploadBodyImageToCloudinary(req.file.buffer, imageName);

        res.status(200).json({
            imageUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            size: uploadResult.bytes
        });
    } catch (error) {
        console.error('Error in uploadBodyImage:', error);
        res.status(500).json({ error: error.message || 'Failed to upload body image' });
    }
}

