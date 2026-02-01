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

// Middleware to check if payments are enabled
const checkPaymentsEnabled = (req, res, next) => {
    const paymentsEnabled = process.env.ENABLE_PAYMENTS !== 'false';
    if (!paymentsEnabled) {
        return res.status(403).json({ 
            error: 'Payments are currently disabled',
            paymentsEnabled: false 
        });
    }
    next();
};

// Protected routes (require authentication)
router.post('/payments/create-intention', protect, checkPaymentsEnabled, createPaymentIntention);
router.get('/payments/credits', protect, getFormCredits);
router.get('/payments/history', protect, checkPaymentsEnabled, getPaymentHistory);
router.get('/payments/:paymentId/status', protect, checkPaymentsEnabled, getPaymentStatus);

// Public routes (Fawaterk callbacks - no auth required)
router.post('/payments/callback', checkPaymentsEnabled, handlePaymentCallback);
router.get('/payments/redirect-callback', checkPaymentsEnabled, handleRedirectCallback);

export default router;
