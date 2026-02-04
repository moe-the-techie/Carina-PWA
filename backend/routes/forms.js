import express from 'express';
const router = express.Router();
import multer from 'multer';
import { getAllForms, getUserForms, newForm, getMyForms, uploadBodyImage, deleteFormAdmin, deleteMyForm } from '../controllers/formController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { expensiveOperationLimiter, uploadLimiter } from '../middleware/rateLimiter.js';
import Plan from '../models/Plan.js';

// Configure multer for body image upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
        }
    }
});

router.get('/forms',  protect, getAllForms);
router.get('/forms/user/:id', protect, getUserForms);
router.get('/forms/my', protect, getMyForms);

// Get specific form for the user
router.get('/forms/my/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const Form = (await import('../models/Form.js')).default;
        const form = await Form.findOne({ _id: id, user: req.user._id })
            .populate('user', 'name email dateOfBirth isMother gender profileImageUrl phoneNumber profession');

        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        res.status(200).json({ form });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/forms', protect, expensiveOperationLimiter, newForm);
router.post('/forms/upload-body-image', protect, uploadLimiter, upload.single('image'), uploadBodyImage);

// Delete user's own unreviewed form (refunds credit)
router.delete('/forms/my/:formId', protect, deleteMyForm);

// Admin: Delete any form and its corresponding plan
router.delete('/admin/forms/:formId', adminOnly, deleteFormAdmin);

// Get user's plan associated with a specific form
router.get('/forms/my/:formId/plan', protect, async (req, res) => {
    try {
        const { formId } = req.params;
        
        const Form = (await import('../models/Form.js')).default;
        const form = await Form.findOne({ _id: formId, user: req.user._id });
        
        if (!form) {
            return res.status(404).json({ error: 'Form not found or does not belong to user' });
        }
        
        const plan = await Plan.findOne({ form: formId, user: req.user._id })
            .populate('user', 'name email dateOfBirth gender profileImageUrl isMother phoneNumber profession')
            .populate('createdBy', 'name email')
            .populate('form', 'createdAt currentWeight desiredWeight');
        
        if (!plan) {
            return res.status(404).json({ error: 'No plan found for this form' });
        }
        
        res.status(200).json({ plan });
    } catch (error) {
        console.error('Error fetching user plan:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
