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
    banUserByAdmin,
    getAllUserClasses,
    getUserClassById,
    createUserClass,
    updateUserClass,
    deleteUserClass,
    assignUserClass
} from '../controllers/adminController.js';

router.get('/admin/dashboard', adminOnly, getDashboardStats);
router.get('/admin/users', adminOnly, getAllUsersAdmin);
router.get('/admin/users/:userId', adminOnly, getUserDetails);
router.delete('/admin/users/:userId', adminOnly, deleteUserByAdmin);
router.put('/admin/users/:userId/ban', adminOnly, banUserByAdmin);
router.put('/admin/users/:userId/class', adminOnly, assignUserClass);

router.get('/admin/forms', adminOnly, getAllFormsAdmin);
router.put('/admin/forms/:formId/reviewed', adminOnly, markFormReviewed);

router.get('/admin/classes', adminOnly, getAllUserClasses);
router.get('/admin/classes/:classId', adminOnly, getUserClassById);
router.post('/admin/classes', adminOnly, createUserClass);
router.put('/admin/classes/:classId', adminOnly, updateUserClass);
router.delete('/admin/classes/:classId', adminOnly, deleteUserClass);

export default router;