import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { publishMessage, generateAblyToken, generateAdminAblyToken } from '../config/ably.js';
import { uploadToImgBB, hideAudioInImage, extractAudioFromImage } from '../config/imgbb.js';

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
        const { chatId, content, messageType = 'text', imageUrl, imageDeleteUrl, voiceUrl, voiceDeleteUrl, voiceDuration } = req.body;
        const senderId = req.user._id;
        const senderRole = req.user.role;

        // Validate message based on type
        if (messageType === 'text' && (!content || content.trim().length === 0)) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        
        if (messageType === 'image' && !imageUrl) {
            return res.status(400).json({ error: 'Image URL is required for image messages' });
        }
        
        if (messageType === 'voice' && !voiceUrl) {
            return res.status(400).json({ error: 'Voice URL is required for voice messages' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (senderRole !== 'admin' && chat.userId.toString() !== senderId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messageData = {
            chatId,
            senderId,
            senderRole,
            messageType,
            readByAdmins: senderRole === 'admin',
            readByUser: senderRole === 'user'
        };

        if (messageType === 'text') {
            messageData.content = content.trim();
        } else if (messageType === 'image') {
            messageData.imageUrl = imageUrl;
            messageData.imageDeleteUrl = imageDeleteUrl;
            messageData.content = content ? content.trim() : 'Sent an image';
        } else if (messageType === 'voice') {
            messageData.voiceUrl = voiceUrl;
            messageData.voiceDeleteUrl = voiceDeleteUrl;
            messageData.voiceDuration = voiceDuration;
            messageData.content = content ? content.trim() : 'Sent a voice message';
        }

        const message = new Message(messageData);

        await message.save();

        chat.lastMessageAt = new Date();
        if (senderRole === 'user') {
            chat.unreadByAdmins += 1;
        } else {
            chat.unreadByUser += 1;
        }
        await chat.save();

        await message.populate('senderId', 'name email profileImageUrl');

        // Publish message to Ably for real-time updates
        const publishData = {
            _id: message._id,
            chatId: message.chatId,
            senderId: message.senderId,
            senderRole: message.senderRole,
            messageType: message.messageType,
            content: message.content,
            imageUrl: message.imageUrl,
            voiceUrl: message.voiceUrl,
            voiceDuration: message.voiceDuration,
            createdAt: message.createdAt,
            readByAdmins: message.readByAdmins,
            readByUser: message.readByUser
        };
        
        await publishMessage(`chat:${chat.userId}:messages`, 'new-message', publishData);
        
        await publishMessage('admin:chats', 'new-message', {
            ...publishData,
            chatId: chat._id,
            userId: chat.userId,
            unreadByAdmins: chat.unreadByAdmins,
            unreadByUser: chat.unreadByUser
        });

        res.status(201).json(publishData);
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
            // If 'before' is a message ID, fetch that message to get its createdAt timestamp
            const beforeMessage = await Message.findById(before);
            if (beforeMessage) {
                query.createdAt = { $lt: beforeMessage.createdAt };
            } else {
                // If not found as ID, try as a date string
                const beforeDate = new Date(before);
                if (!isNaN(beforeDate.getTime())) {
                    query.createdAt = { $lt: beforeDate };
                }
            }
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
            await publishMessage(`chat:${chat.userId}:messages`, 'messages-read', {
                chatId: chat._id,
                readBy: 'admin',
                timestamp: new Date()
            });
        } else {
            await Message.updateMany(
                { chatId, readByUser: false },
                { readByUser: true }
            );
            chat.unreadByUser = 0;
            await publishMessage('admin:chats', 'messages-read', {
                chatId: chat._id,
                userId: chat.userId,
                readBy: 'user',
                timestamp: new Date()
            });
        }

        await chat.save();

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};

// Admin: Get all chats - OPTIMIZED to avoid N+1 query problem
export const getAllChats = async (req, res) => {
    try {
        const { skip = 0, limit = 50, search = '' } = req.query;
        const skipNum = parseInt(skip);
        const limitNum = parseInt(limit);

        let matchStage = {};
        
        // If search is provided, find matching users first
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const users = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex }
                ]
            }).select('_id').lean();
            
            const userIds = users.map(u => u._id);
            matchStage.userId = { $in: userIds };
        }

        // Use aggregation pipeline to fetch chats with last message in a single query
        // This solves the N+1 query problem
        const [result] = await Chat.aggregate([
            { $match: matchStage },
            { $sort: { lastMessageAt: -1 } },
            {
                $facet: {
                    // Get paginated chats with their last message
                    chats: [
                        { $skip: skipNum },
                        { $limit: limitNum },
                        // Lookup last message for each chat
                        {
                            $lookup: {
                                from: 'messages',
                                let: { chatId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$chatId', '$$chatId'] } } },
                                    { $sort: { createdAt: -1 } },
                                    { $limit: 1 },
                                    {
                                        $lookup: {
                                            from: 'users',
                                            localField: 'senderId',
                                            foreignField: '_id',
                                            as: 'sender',
                                            pipeline: [
                                                { $project: { name: 1, role: 1 } }
                                            ]
                                        }
                                    },
                                    { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } }
                                ],
                                as: 'lastMessageArr'
                            }
                        },
                        // Lookup user details
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user',
                                pipeline: [
                                    { $project: { name: 1, email: 1, profileImageUrl: 1 } }
                                ]
                            }
                        },
                        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                        // Project final shape
                        {
                            $project: {
                                chatId: '$_id',
                                user: 1,
                                lastMessageAt: 1,
                                unreadByAdmins: 1,
                                createdAt: 1,
                                lastMessage: {
                                    $cond: {
                                        if: { $gt: [{ $size: '$lastMessageArr' }, 0] },
                                        then: {
                                            content: { $arrayElemAt: ['$lastMessageArr.content', 0] },
                                            senderId: { $arrayElemAt: ['$lastMessageArr.sender', 0] },
                                            senderRole: { $arrayElemAt: ['$lastMessageArr.senderRole', 0] },
                                            createdAt: { $arrayElemAt: ['$lastMessageArr.createdAt', 0] }
                                        },
                                        else: null
                                    }
                                }
                            }
                        }
                    ],
                    // Get total count in the same query
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const chats = result.chats || [];
        const totalChats = result.totalCount[0]?.count || 0;

        res.status(200).json({
            chats: chats,
            total: totalChats,
            hasMore: skipNum + chats.length < totalChats
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

// Upload image to ImgBB
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const userId = req.user._id;
        const timestamp = Date.now();
        const imageName = `chat-${userId}-${timestamp}`;

        const uploadResult = await uploadToImgBB(req.file.buffer, imageName);

        res.status(200).json({
            imageUrl: uploadResult.url,
            displayUrl: uploadResult.displayUrl,
            deleteUrl: uploadResult.deleteUrl,
            thumb: uploadResult.thumb,
            medium: uploadResult.medium,
            size: uploadResult.size
        });
    } catch (error) {
        console.error('Error in uploadImage:', error);
        res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
};

// Upload voice message to ImgBB (hide audio data inside a PNG image)
export const uploadVoice = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No voice file provided' });
        }

        const userId = req.user._id;
        const timestamp = Date.now();
        const voiceName = `voice-${userId}-${timestamp}`;
        const imageBuffer = hideAudioInImage(req.file.buffer);
        const uploadResult = await uploadToImgBB(imageBuffer, voiceName);

        res.status(200).json({
            voiceUrl: uploadResult.url,
            displayUrl: uploadResult.displayUrl,
            deleteUrl: uploadResult.deleteUrl,
            size: uploadResult.size,
            originalSize: req.file.buffer.length
        });
    } catch (error) {
        console.error('Error in uploadVoice:', error);
        res.status(500).json({ error: error.message || 'Failed to upload voice message' });
    }
};

// Get voice audio by extracting from image
export const getVoiceAudio = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.messageType !== 'voice' || !message.voiceUrl) {
            return res.status(400).json({ error: 'Not a voice message' });
        }

        const chat = await Chat.findById(message.chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (userRole !== 'admin' && chat.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const audioBuffer = await extractAudioFromImage(message.voiceUrl);

        // Determine content type based on magic numbers
        let contentType = 'audio/webm'; // Default
        if (audioBuffer.length > 8) {
            const header = audioBuffer.toString('hex', 0, 4);
            if (header === '1a45dfa3') {
                contentType = 'audio/webm';
            } else {
                const ftyp = audioBuffer.toString('ascii', 4, 8);
                if (ftyp === 'ftyp') {
                    contentType = 'audio/mp4';
                }
            }
        }

        // Send as audio file
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', audioBuffer.length);
        res.send(audioBuffer);
    } catch (error) {
        console.error('Error in getVoiceAudio:', error);
        res.status(500).json({ error: error.message || 'Failed to get voice audio' });
    }
};
