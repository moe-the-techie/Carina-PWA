import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    CircularProgress,
    Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';
import {
    getOrCreateChat,
    getMessages,
    sendMessage,
    markMessagesAsRead
} from '../services/chatService';
import { 
    subscribeToChat, 
    removeMessageHandler, 
    requestNotificationPermission,
    setCurrentlyViewingChat,
    clearCurrentlyViewingChat
} from '../services/ablyService';

export default function ChatPage() {
    const theme = useTheme();
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const hasSubscribed = useRef(false);

    useEffect(() => {
        requestNotificationPermission();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChat = async () => {
        try {
            const chatResponse = await getOrCreateChat();
            setChat(chatResponse);
            
            if (chatResponse.chatId) {
                const messagesResponse = await getMessages(chatResponse.chatId);
                setMessages(messagesResponse.messages);
                await markMessagesAsRead(chatResponse.chatId);
                setCurrentlyViewingChat(chatResponse.chatId);
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chat || sending) return;

        setSending(true);
        try {
            const response = await sendMessage(chat.chatId, newMessage.trim());
            setMessages(prev => {
                const exists = prev.some(m => m.messageId === response.messageId);
                if (exists) return prev;
                return [...prev, response];
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        if (chat?.userId && !hasSubscribed.current) {
            hasSubscribed.current = true;

            const handleNewMessage = (messageData) => {
                setMessages(prev => {
                    const exists = prev.some(m => m.messageId === messageData.messageId);
                    if (exists) return prev;
                    
                    return [...prev, messageData];
                });

                if (messageData.senderRole !== 'user') {
                    markMessagesAsRead(chat.chatId).catch(err => 
                        console.error('Error marking messages as read:', err)
                    );
                }
            };

            subscribeToChat(chat.userId, handleNewMessage).catch(error => {
                console.error('Error subscribing to chat:', error);
            });

            return () => {
                removeMessageHandler(`chat:${chat.userId}:messages`, handleNewMessage);
                hasSubscribed.current = false;
            };
        }
    }, [chat]);

    useEffect(() => {
        loadChat();
        
        return () => {
            clearCurrentlyViewingChat();
        };
    }, []);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (loading) {
        return (
            <PageFade>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
                    <CircularProgress />
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', justifyContent: 'center', p: 2 }}>
                <Paper sx={{ width: '100%', maxWidth: 800, display: 'flex', flexDirection: 'column', backgroundColor: theme.palette.background.paper }}>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <SupportAgentIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6">Chat with Carina</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Send us a message and we'll get back to you soon
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {messages.length === 0 ? (
                            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                                <SupportAgentIcon sx={{ fontSize: 60, color: theme.palette.grey[400] }} />
                                <Typography color="text.secondary" align="center">
                                    No messages yet. Start a conversation with Carina!
                                </Typography>
                            </Box>
                        ) : (
                            messages.map((message, index) => {
                                const isUser = message.senderRole === 'user';
                                return (
                                    <Box key={message.messageId || index} sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                                        <Box sx={{ maxWidth: '70%', p: 1.5, borderRadius: 2, backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[200], color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary }}>
                                            {!isUser && (<Chip label="Carina" size="small" sx={{ mb: 0.5, height: 20, backgroundColor: 'rgba(0,0,0,0.1)' }} />)}
                                            <Typography variant="body1">{message.content}</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                                                {formatTime(message.createdAt)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </Box>
                    <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
                        <TextField fullWidth placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={sending} multiline maxRows={4} />
                        <IconButton color="primary" type="submit" disabled={!newMessage.trim() || sending}>
                            {sending ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                    </Box>
                </Paper>
            </Box>
        </PageFade>
    );
}
