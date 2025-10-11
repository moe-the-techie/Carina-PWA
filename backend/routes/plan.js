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
    getPlansForUser
} from '../controllers/planController.js';

router.post('/admin/plans', adminOnly, createPlan);
router.get('/admin/plans', adminOnly, getAllPlans);
router.get('/admin/plans/:planId', adminOnly, getPlanDetails);
router.put('/admin/plans/:planId', adminOnly, updatePlan);
router.put('/admin/plans/:planId/activate', adminOnly, activatePlan);
router.delete('/admin/plans/:planId', adminOnly, deletePlan);
router.get('/admin/users/:userId/plans', adminOnly, getPlansForUser);

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

export default router;