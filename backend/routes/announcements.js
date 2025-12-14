import express from 'express';
const router = express.Router();
import { protect, adminOnly } from '../middleware/auth.js';
import { checkFeatureEnabled } from '../middleware/featureFlags.js';
import {
    getUserAnnouncements,
    markAnnouncementAsRead,
    getUnreadAnnouncementsCount,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementStats
} from '../controllers/announcementController.js';

// Check if feature is enabled
router.use(checkFeatureEnabled('ENABLE_ANNOUNCEMENTS'));

// User routes
router.get('/announcements', protect, getUserAnnouncements);
router.put('/announcements/:announcementId/read', protect, markAnnouncementAsRead);
router.get('/announcements/unread/count', protect, getUnreadAnnouncementsCount);

// Admin routes
router.get('/admin/announcements', adminOnly, getAllAnnouncements);
router.post('/admin/announcements', adminOnly, createAnnouncement);
router.put('/admin/announcements/:announcementId', adminOnly, updateAnnouncement);
router.delete('/admin/announcements/:announcementId', adminOnly, deleteAnnouncement);
router.get('/admin/announcements/:announcementId/stats', adminOnly, getAnnouncementStats);

export default router;