import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import UserClass from '../models/UserClass.js';
import { publishMessage, sendPushNotification } from '../config/ably.js';

// Get all announcements for current user
export const getUserAnnouncements = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('userClass');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const announcements = await Announcement.getForUser(user);
        const announcementsWithReadStatus = announcements.map(announcement => {
            const isRead = announcement.readBy.some(read => 
                read.userId.toString() === user._id.toString()
            );
            
            return {
                ...announcement.toObject(),
                isRead
            };
        });

        res.status(200).json(announcementsWithReadStatus);
    } catch (error) {
        console.error('Error in getUserAnnouncements:', error);
        res.status(500).json({ error: 'Failed to get announcements' });
    }
};

// Mark announcement as read for current user
export const markAnnouncementAsRead = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const userId = req.user._id;

        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        const user = await User.findById(userId).populate('userClass');
        if (!announcement.isVisibleToUser(user)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await announcement.markAsReadByUser(userId);

        res.status(200).json({ message: 'Announcement marked as read' });
    } catch (error) {
        console.error('Error in markAnnouncementAsRead:', error);
        res.status(500).json({ error: 'Failed to mark announcement as read' });
    }
};

// Get unread announcements count for current user
export const getUnreadAnnouncementsCount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('userClass');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const announcements = await Announcement.getForUser(user);
        
        const unreadCount = announcements.filter(announcement => {
            return !announcement.readBy.some(read => 
                read.userId.toString() === user._id.toString()
            );
        }).length;

        res.status(200).json({ unreadCount });
    } catch (error) {
        console.error('Error in getUnreadAnnouncementsCount:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

// Admin: Get all announcements
export const getAllAnnouncements = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        
        let query = {};
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        const announcements = await Announcement.find(query)
            .populate('authorId', 'name email')
            .populate('targetClasses', 'name color')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Announcement.countDocuments(query);

        // Add read statistics for each announcement
        const announcementsWithStats = announcements.map(announcement => {
            const readCount = announcement.readBy.length;
            return {
                ...announcement.toObject(),
                readCount
            };
        });

        res.status(200).json({
            announcements: announcementsWithStats,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Error in getAllAnnouncements:', error);
        res.status(500).json({ error: 'Failed to get announcements' });
    }
};

// Admin: Create new announcement
export const createAnnouncement = async (req, res) => {
    try {
        const { title, message, priority, targetAudience, targetClasses, expiresAt } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }

        if (targetAudience === 'classes' && (!targetClasses || targetClasses.length === 0)) {
            return res.status(400).json({ error: 'Target classes are required when targeting specific classes' });
        }

        const announcementData = {
            title,
            message,
            priority: priority || 'normal',
            targetAudience: targetAudience || 'all',
            authorId: req.user._id
        };

        if (targetAudience === 'classes' && targetClasses) {
            const validClasses = await UserClass.find({ _id: { $in: targetClasses } });
            if (validClasses.length !== targetClasses.length) {
                return res.status(400).json({ error: 'One or more target classes are invalid' });
            }
            announcementData.targetClasses = targetClasses;
        }

        if (expiresAt) {
            announcementData.expiresAt = new Date(expiresAt);
        }

        const announcement = new Announcement(announcementData);
        await announcement.save();

        await announcement.populate('authorId', 'name email');
        await announcement.populate('targetClasses', 'name color');

        await publishAnnouncementNotification(announcement);

        res.status(201).json(announcement);
    } catch (error) {
        console.error('Error in createAnnouncement:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
};

// Admin: Update announcement
export const updateAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const { title, message, priority, targetAudience, targetClasses, isActive, expiresAt } = req.body;

        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        if (title !== undefined) announcement.title = title;
        if (message !== undefined) announcement.message = message;
        if (priority !== undefined) announcement.priority = priority;
        if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
        if (isActive !== undefined) announcement.isActive = isActive;
        if (expiresAt !== undefined) {
            announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;
        }

        if (targetAudience === 'classes' && targetClasses) {
            const validClasses = await UserClass.find({ _id: { $in: targetClasses } });
            if (validClasses.length !== targetClasses.length) {
                return res.status(400).json({ error: 'One or more target classes are invalid' });
            }
            announcement.targetClasses = targetClasses;
        } else if (targetAudience === 'all') {
            announcement.targetClasses = [];
        }

        await announcement.save();
        await announcement.populate('authorId', 'name email');
        await announcement.populate('targetClasses', 'name color');

        res.status(200).json(announcement);
    } catch (error) {
        console.error('Error in updateAnnouncement:', error);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
};

// Admin: Delete announcement
export const deleteAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params;

        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        await Announcement.findByIdAndDelete(announcementId);

        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error in deleteAnnouncement:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
};

// Admin: Get announcement statistics
export const getAnnouncementStats = async (req, res) => {
    try {
        const { announcementId } = req.params;

        const announcement = await Announcement.findById(announcementId)
            .populate('authorId', 'name email')
            .populate('targetClasses', 'name color')
            .populate('readBy.userId', 'name email');

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        let targetUsersCount = 0;
        if (announcement.targetAudience === 'all') {
            targetUsersCount = await User.countDocuments({ role: 'user' });
        } else if (announcement.targetAudience === 'classes') {
            targetUsersCount = await User.countDocuments({ 
                role: 'user',
                userClass: { $in: announcement.targetClasses }
            });
        }

        const readCount = announcement.readBy.length;
        const unreadCount = targetUsersCount - readCount;
        const readPercentage = targetUsersCount > 0 ? (readCount / targetUsersCount * 100).toFixed(1) : 0;

        res.status(200).json({
            announcement,
            stats: {
                targetUsersCount,
                readCount,
                unreadCount,
                readPercentage: parseFloat(readPercentage)
            }
        });
    } catch (error) {
        console.error('Error in getAnnouncementStats:', error);
        res.status(500).json({ error: 'Failed to get announcement statistics' });
    }
};

// Helper function to publish announcement notifications
const publishAnnouncementNotification = async (announcement) => {
    try {
        let targetUsers = [];

        if (announcement.targetAudience === 'all') {
            targetUsers = await User.find({ role: 'user' }).select('_id name email');
        } else if (announcement.targetAudience === 'classes') {
            targetUsers = await User.find({ 
                role: 'user',
                userClass: { $in: announcement.targetClasses }
            }).select('_id name email');
        }

        const notificationData = {
            _id: announcement._id,
            title: announcement.title,
            message: announcement.message,
            priority: announcement.priority,
            authorId: announcement.authorId,
            targetAudience: announcement.targetAudience,
            targetClasses: announcement.targetClasses,
            createdAt: announcement.createdAt,
            type: 'announcement'
        };

        // Publish to general announcements channel for real-time updates
        await publishMessage('announcements', 'new-announcement', notificationData);

        // Publish to individual user channels for targeted notifications
        for (const user of targetUsers) {
            const userNotificationData = {
                ...notificationData,
                userId: user._id,
                userName: user.name
            };
            
            //channel for real-time updates and notifications
            await publishMessage(`user:${user._id}:announcements`, 'new-announcement', userNotificationData);

            // Send push notification (works even when app is closed)
            const pushTitle = announcement.priority === 'urgent' 
                ? `🚨 ${announcement.title}` 
                : `📢 ${announcement.title}`;
            const pushBody = announcement.message.length > 100 
                ? announcement.message.substring(0, 100) + '...' 
                : announcement.message;

            sendPushNotification(user._id.toString(), {
                title: pushTitle,
                body: pushBody,
                data: {
                    type: 'announcement',
                    announcementId: announcement._id.toString(),
                    priority: announcement.priority,
                    url: '/announcements'
                }
            }).catch(err => console.error('Push notification error for user:', user._id, err));
        }

        console.log(`Published announcement ${announcement._id} to ${targetUsers.length} users (with push notifications)`);
    } catch (error) {
        console.error('Error publishing announcement notification:', error);
    }
};

export default {
    getUserAnnouncements,
    markAnnouncementAsRead,
    getUnreadAnnouncementsCount,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementStats
};
