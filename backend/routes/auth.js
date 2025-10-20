import express from 'express';
const router = express.Router();
import { register, login, validateToken, resendVerificationWithAuth, forgotPassword, canResendPasswordReset } from '../controllers/authController.js';

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/validateToken', validateToken);
router.post('/auth/resend-verification-with-auth', resendVerificationWithAuth);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/can-resend-password-reset', canResendPasswordReset);

export default router;
