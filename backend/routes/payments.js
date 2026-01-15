import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    createPaymentIntention,
    handlePaymentCallback,
    handleRedirectCallback,
    getPaymentStatus,
    getPaymentHistory,
    getFormCredits
} from '../controllers/paymentController.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/payments/create-intention', protect, createPaymentIntention);
router.get('/payments/credits', protect, getFormCredits);
router.get('/payments/history', protect, getPaymentHistory);
router.get('/payments/:paymentId/status', protect, getPaymentStatus);

// Public routes (Paymob callbacks - no auth required)
router.post('/payments/callback', handlePaymentCallback);
router.get('/payments/redirect-callback', handleRedirectCallback);

export default router;
