import express from 'express';
const router = express.Router();
import { adminOnly } from '../middleware/auth.js';
import { getDashboardStats } from '../controllers/adminController.js';

router.get('/admin/dashboard', adminOnly, getDashboardStats);

export default router;