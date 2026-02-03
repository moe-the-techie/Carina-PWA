import express from 'express';
const router = express.Router();
import { adminOnly } from '../middleware/auth.js';
import { checkFeatureEnabled } from '../middleware/featureFlags.js';
import { 
    getDashboardStats, 
    getAllUsersAdmin, 
    getUserDetails,
    getAllFormsAdmin, 
    deleteUserByAdmin,
    banUserByAdmin,
    getAllUserClasses,
    getUserClassById,
    createUserClass,
    updateUserClass,
    deleteUserClass,
    assignUserClass,
    getAllPaymentsAdmin,
    verifyPaymentAdmin,
    updatePaymentStatusAdmin,
    getAllActivePlansAdmin,
    getPlanProgressAdmin,
    triggerPlanReminders,
    triggerExpiredPlanUpdates
} from '../controllers/adminController.js';

router.get('/admin/dashboard', adminOnly, getDashboardStats);
router.get('/admin/users', adminOnly, getAllUsersAdmin);
router.get('/admin/users/:userId', adminOnly, getUserDetails);
router.delete('/admin/users/:userId', adminOnly, deleteUserByAdmin);
router.put('/admin/users/:userId/ban', adminOnly, banUserByAdmin);
router.put('/admin/users/:userId/class', adminOnly, checkFeatureEnabled('ENABLE_USER_CLASSES'), assignUserClass);

router.get('/admin/forms', adminOnly, getAllFormsAdmin);

router.get('/admin/classes', adminOnly, checkFeatureEnabled('ENABLE_USER_CLASSES'), getAllUserClasses);
router.get('/admin/classes/:classId', adminOnly, checkFeatureEnabled('ENABLE_USER_CLASSES'), getUserClassById);
router.post('/admin/classes', adminOnly, checkFeatureEnabled('ENABLE_USER_CLASSES'), createUserClass);
router.put('/admin/classes/:classId', adminOnly, checkFeatureEnabled('ENABLE_USER_CLASSES'), updateUserClass);
router.delete('/admin/classes/:classId', adminOnly, checkFeatureEnabled('ENABLE_USER_CLASSES'), deleteUserClass);

router.get('/admin/payments', adminOnly, getAllPaymentsAdmin);
router.post('/admin/payments/:paymentId/verify', adminOnly, verifyPaymentAdmin);
router.put('/admin/payments/:paymentId/status', adminOnly, updatePaymentStatusAdmin);

// Active Plans routes
router.get('/admin/active-plans', adminOnly, getAllActivePlansAdmin);
router.get('/admin/active-plans/:planId/progress', adminOnly, getPlanProgressAdmin);

// Plan reminder service routes (for testing/manual triggering)
router.post('/admin/trigger-plan-reminders', adminOnly, triggerPlanReminders);
router.post('/admin/trigger-expired-plan-updates', adminOnly, triggerExpiredPlanUpdates);

export default router;
