import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { publishMessage, generateAblyToken, generateAdminAblyToken } from '../config/ably.js';

// Get or create a chat for the current user
export const getOrCreateChat = async (req, res) => {
    try {
        const userId = req.user._id;

        let chat = await Chat.findOne({ userId });

        if (!chat) {
            chat = new Chat({ userId });
            await chat.save();
        }

        res.status(200).json({
            chatId: chat._id,
            userId: chat.userId,
            lastMessageAt: chat.lastMessageAt,
            unreadByUser: chat.unreadByUser,
            createdAt: chat.createdAt
        });
    } catch (error) {
        console.error('Error in getOrCreateChat:', error);
        res.status(500).json({ error: 'Failed to get or create chat' });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;
        const senderId = req.user._id;
        const senderRole = req.user.role;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (senderRole !== 'admin' && chat.userId.toString() !== senderId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const message = new Message({
            chatId,
            senderId,
            senderRole,
            content: content.trim(),
            readByAdmins: senderRole === 'admin',
            readByUser: senderRole === 'user'
        });

        await message.save();

        chat.lastMessageAt = new Date();
        if (senderRole === 'user') {
            chat.unreadByAdmins += 1;
        } else {
            chat.unreadByUser += 1;
        }
        await chat.save();

        await message.populate('senderId', 'name email');

        // Publish message to Ably for real-time updates
        const messageData = {
            messageId: message._id,
            chatId: message.chatId,
            senderId: message.senderId,
            senderRole: message.senderRole,
            content: message.content,
            createdAt: message.createdAt,
            readByAdmins: message.readByAdmins,
            readByUser: message.readByUser
        };
        
        await publishMessage(`chat:${chat.userId}:messages`, 'new-message', messageData);
        
        await publishMessage('admin:chats', 'new-message', {
            ...messageData,
            chatId: chat._id,
            userId: chat.userId,
            unreadByAdmins: chat.unreadByAdmins,
            unreadByUser: chat.unreadByUser
        });

        res.status(201).json(messageData);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Get messages for a chat
export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { before, limit = 50 } = req.query;
        const userId = req.user._id;
        const userRole = req.user.role;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (userRole !== 'admin' && chat.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const query = { chatId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('senderId', 'name email role');

        res.status(200).json({
            messages: messages.reverse(),
            hasMore: messages.length === parseInt(limit)
        });
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (userRole !== 'admin' && chat.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (userRole === 'admin') {
            await Message.updateMany(
                { chatId, readByAdmins: false },
                { readByAdmins: true }
            );
            chat.unreadByAdmins = 0;
        } else {
            await Message.updateMany(
                { chatId, readByUser: false },
                { readByUser: true }
            );
            chat.unreadByUser = 0;
        }

        await chat.save();

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};

// Admin: Get all chats
export const getAllChats = async (req, res) => {
    try {
        const { skip = 0, limit = 50, search = '' } = req.query;

        let query = {};
        
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const users = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex }
                ]
            }).select('_id');
            
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const chats = await Chat.find(query)
            .sort({ lastMessageAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .populate('userId', 'name email profileImageUrl');

        const chatsWithLastMessage = await Promise.all(
            chats.map(async (chat) => {
                const lastMessage = await Message.findOne({ chatId: chat._id })
                    .sort({ createdAt: -1 })
                    .populate('senderId', 'name role');

                return {
                    chatId: chat._id,
                    user: chat.userId,
                    lastMessageAt: chat.lastMessageAt,
                    unreadByAdmins: chat.unreadByAdmins,
                    lastMessage: lastMessage ? {
                        content: lastMessage.content,
                        senderId: lastMessage.senderId,
                        senderRole: lastMessage.senderRole,
                        createdAt: lastMessage.createdAt
                    } : null,
                    createdAt: chat.createdAt
                };
            })
        );

        const totalChats = await Chat.countDocuments(query);

        res.status(200).json({
            chats: chatsWithLastMessage,
            total: totalChats,
            hasMore: parseInt(skip) + chats.length < totalChats
        });
    } catch (error) {
        console.error('Error in getAllChats:', error);
        res.status(500).json({ error: 'Failed to get chats' });
    }
};

// Admin: Get chat by ID
export const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findById(chatId).populate('userId', 'name email');
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.status(200).json({
            chatId: chat._id,
            user: chat.userId,
            lastMessageAt: chat.lastMessageAt,
            unreadByAdmins: chat.unreadByAdmins,
            unreadByUser: chat.unreadByUser,
            createdAt: chat.createdAt
        });
    } catch (error) {
        console.error('Error in getChatById:', error);
        res.status(500).json({ error: 'Failed to get chat' });
    }
};

// Admin: Get chat by user ID
export const getChatByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const chat = await Chat.findOne({ userId }).populate('userId', 'name email');
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.status(200).json({
            chatId: chat._id,
            user: chat.userId,
            lastMessageAt: chat.lastMessageAt,
            unreadByAdmins: chat.unreadByAdmins,
            unreadByUser: chat.unreadByUser,
            createdAt: chat.createdAt
        });
    } catch (error) {
        console.error('Error in getChatByUserId:', error);
        res.status(500).json({ error: 'Failed to get chat' });
    }
};

// Admin: Get or create chat by user ID (for initiating chats from admin side)
export const getOrCreateChatByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Guard: Check if userId is null or invalid
        if (!userId || userId === 'null' || userId === 'undefined') {
            return res.status(400).json({ error: 'Invalid user ID provided' });
        }

        const user = await User.findById(userId).select('name email profileImageUrl');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let chat = await Chat.findOne({ userId });

        if (!chat) {
            chat = new Chat({ userId });
            await chat.save();
        }

        await chat.populate('userId', 'name email profileImageUrl');

        res.status(200).json({
            chatId: chat._id,
            user: chat.userId,
            lastMessageAt: chat.lastMessageAt,
            unreadByAdmins: chat.unreadByAdmins,
            unreadByUser: chat.unreadByUser,
            createdAt: chat.createdAt
        });
    } catch (error) {
        console.error('Error in getOrCreateChatByUserId:', error);
        res.status(500).json({ error: 'Failed to get or create chat' });
    }
};

// Get unread count for current user
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const chat = await Chat.findOne({ userId });
        
        if (!chat) {
            return res.status(200).json({ unreadCount: 0 });
        }

        res.status(200).json({ unreadCount: chat.unreadByUser });
    } catch (error) {
        console.error('Error in getUnreadCount:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

// Admin: Get total unread count across all chats
export const getAdminUnreadCount = async (req, res) => {
    try {
        const result = await Chat.aggregate([
            {
                $group: {
                    _id: null,
                    totalUnread: { $sum: '$unreadByAdmins' }
                }
            }
        ]);

        const totalUnread = result.length > 0 ? result[0].totalUnread : 0;

        res.status(200).json({ unreadCount: totalUnread });
    } catch (error) {
        console.error('Error in getAdminUnreadCount:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

// Get Ably authentication token
export const getAblyAuthToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        let tokenRequest;
        if (userRole === 'admin') {
            tokenRequest = await generateAdminAblyToken(userId);
        } else {
            tokenRequest = await generateAblyToken(userId);
        }

        res.status(200).json(tokenRequest);
    } catch (error) {
        console.error('Error in getAblyAuthToken:', error);
        res.status(500).json({ error: 'Failed to generate Ably token' });
    }
};

// Admin: Delete a chat and all its messages
export const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        await Message.deleteMany({ chatId });
        await Chat.findByIdAndDelete(chatId);

        await publishMessage(`chat:${chat.userId}:messages`, 'chat-deleted', {
            chatId: chat._id,
            deletedAt: new Date()
        });

        res.status(200).json({ message: 'Chat and all messages deleted successfully' });
    } catch (error) {
        console.error('Error in deleteChat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
};
