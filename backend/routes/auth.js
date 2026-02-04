import express from 'express';
const router = express.Router();
import { register, login, validateToken, resendVerificationWithAuth, forgotPassword, canResendPasswordReset } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

// Auth routes with strict rate limiting to prevent brute force
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.post('/auth/validateToken', validateToken); // No strict limit - just token validation
router.post('/auth/resend-verification-with-auth', authLimiter, resendVerificationWithAuth);
router.post('/auth/forgot-password', authLimiter, forgotPassword);
router.post('/auth/can-resend-password-reset', canResendPasswordReset);

export default router;
