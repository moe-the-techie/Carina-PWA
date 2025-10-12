import express from 'express';
const router = express.Router();
import { adminOnly } from '../middleware/auth.js';
import {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
    createTemplateFromPlan,
    duplicateTemplate,
    getTemplateStats
} from '../controllers/templateController.js';

// Template CRUD routes
router.get('/admin/templates', adminOnly, getAllTemplates);
router.get('/admin/templates/stats', adminOnly, getTemplateStats);
router.get('/admin/templates/:templateId', adminOnly, getTemplateById);
router.post('/admin/templates', adminOnly, createTemplate);
router.put('/admin/templates/:templateId', adminOnly, updateTemplate);
router.delete('/admin/templates/:templateId', adminOnly, deleteTemplate);

// Template actions
router.put('/admin/templates/:templateId/toggle-status', adminOnly, toggleTemplateStatus);
router.post('/admin/templates/:templateId/duplicate', adminOnly, duplicateTemplate);
router.post('/admin/plans/:planId/create-template', adminOnly, createTemplateFromPlan);

export default router;