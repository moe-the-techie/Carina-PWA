import express from 'express';
const router = express.Router();
import { getAllForms, getUserForms, newForm, getMyForms } from '../controllers/formController.js';
import { protect } from '../middleware/auth.js';
import Plan from '../models/Plan.js';

router.get('/forms',  protect, getAllForms);
router.get('/forms/user/:id', protect, getUserForms);
router.get('/forms/my', protect, getMyForms);
router.post('/forms', protect, newForm);

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
            .populate('createdBy', 'name')
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
