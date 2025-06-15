import express from 'express';
const router = express.Router();
import { getAllForms, getUserForms, newForm, getMyForms } from '../controllers/formController.js';
import { protect } from '../middleware/auth.js';

router.get('/forms',  protect, getAllForms);
router.get('/forms/user/:id', protect, getUserForms);
router.get('/forms/my', protect, getMyForms);
router.post('/forms', protect, newForm);

export default router;
