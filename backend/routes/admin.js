import express from 'express';
const router = express.Router();
import { adminOnly } from '../middleware/auth.js';
import { 
    getDashboardStats, 
    getAllUsersAdmin, 
    getUserDetails,
    getAllFormsAdmin, 
    markFormReviewed,
    deleteUserByAdmin,
    banUserByAdmin
} from '../controllers/adminController.js';

router.get('/admin/dashboard', adminOnly, getDashboardStats);
router.get('/admin/users', adminOnly, getAllUsersAdmin);
router.get('/admin/users/:userId', adminOnly, getUserDetails);
router.delete('/admin/users/:userId', adminOnly, deleteUserByAdmin);
router.put('/admin/users/:userId/ban', adminOnly, banUserByAdmin);

router.get('/admin/forms', adminOnly, getAllFormsAdmin);
router.put('/admin/forms/:formId/reviewed', adminOnly, markFormReviewed);


export default router;