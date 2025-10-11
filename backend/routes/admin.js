import express from 'express';
const router = express.Router();
import { adminOnly } from '../middleware/auth.js';
import { getDashboardStats, getAllUsersAdmin, getUserDetails } from '../controllers/adminController.js';

router.get('/admin/dashboard', adminOnly, getDashboardStats);
router.get('/admin/users', adminOnly, getAllUsersAdmin);
router.get('/admin/users/:userId', adminOnly, getUserDetails);

export default router;