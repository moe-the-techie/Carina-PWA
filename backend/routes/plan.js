import express from 'express';
const router = express.Router();
import { protect, adminOnly } from '../middleware/auth.js';
import {
    createPlan,
    getAllPlans,
    getPlanDetails,
    updatePlan,
    activatePlan,
    deletePlan,
    getPlansForUser,
    getPlanByForm,
    submitPlanFeedback,
    getPlanFeedback,
    logDailyProgress,
    getPlanProgress,
    getTodayProgress
} from '../controllers/planController.js';

router.post('/admin/plans', adminOnly, createPlan);
router.get('/admin/plans', adminOnly, getAllPlans);
router.get('/admin/plans/:planId', adminOnly, getPlanDetails);
router.put('/admin/plans/:planId', adminOnly, updatePlan);
router.put('/admin/plans/:planId/activate', adminOnly, activatePlan);
router.delete('/admin/plans/:planId', adminOnly, deletePlan);
router.get('/admin/users/:userId/plans', adminOnly, getPlansForUser);
router.get('/admin/forms/:formId/plan', adminOnly, getPlanByForm);

router.get('/plans/my', protect, async (req, res) => {
    try {
        const Plan = (await import('../models/Plan.js')).default;
        const plans = await Plan.find({ user: req.user._id })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ plans });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// User routes for feedback
router.post('/plans/:planId/feedback', protect, submitPlanFeedback);

// User routes for progress tracking
router.post('/plans/:planId/progress', protect, logDailyProgress);
router.get('/plans/:planId/progress', protect, getPlanProgress);
router.get('/plans/:planId/progress/today', protect, getTodayProgress);

// Admin routes for feedback
router.get('/admin/plans/:planId/feedback', adminOnly, getPlanFeedback);

export default router;