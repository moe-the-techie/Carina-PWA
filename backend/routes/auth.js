import express from 'express';
const router = express.Router();
import { register, login, validateToken } from '../controllers/authController.js';

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/validateToken', validateToken);

export default router;
