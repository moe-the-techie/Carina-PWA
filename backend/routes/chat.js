import express from 'express';
const router = express.Router();
import { protect, adminOnly } from '../middleware/auth.js';
import {
    getOrCreateChat,
    sendMessage,
    getMessages,
    markMessagesAsRead,
    getUnreadCount,
    getAllChats,
    getChatById,
    getChatByUserId,
    getOrCreateChatByUserId,
    getAdminUnreadCount,
    getAblyAuthToken
} from '../controllers/chatController.js';

// User routes (protected)
router.get('/chat', protect, getOrCreateChat);
router.post('/chat/messages', protect, sendMessage);
router.get('/chat/:chatId/messages', protect, getMessages);
router.put('/chat/:chatId/read', protect, markMessagesAsRead);
router.get('/chat/unread/count', protect, getUnreadCount);
router.get('/chat/ably/auth', protect, getAblyAuthToken);

// Admin routes
router.get('/admin/chats', adminOnly, getAllChats);
router.get('/admin/chats/unread/count', adminOnly, getAdminUnreadCount);
router.get('/admin/chat/:chatId', adminOnly, getChatById);
router.get('/admin/chat/user/:userId', adminOnly, getChatByUserId);
router.post('/admin/chat/user/:userId', adminOnly, getOrCreateChatByUserId);

export default router;

