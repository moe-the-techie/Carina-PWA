import express from 'express';
const router = express.Router();
import multer from 'multer';
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
    getAblyAuthToken,
    deleteChat,
    uploadImage,
    uploadVoice,
    getVoiceAudio
} from '../controllers/chatController.js';

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
        }
    }
});

// Configure multer for voice messages
const voiceUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'));
        }
    }
});

// User routes (protected)
router.get('/chat', protect, getOrCreateChat);
router.post('/chat/messages', protect, sendMessage);
router.post('/chat/upload-image', protect, upload.single('image'), uploadImage);
router.post('/chat/upload-voice', protect, voiceUpload.single('voice'), uploadVoice);
router.get('/chat/voice/:messageId', protect, getVoiceAudio);
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
router.delete('/admin/chat/:chatId', adminOnly, deleteChat);

export default router;

