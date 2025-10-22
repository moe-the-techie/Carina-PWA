import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    TextField,
    IconButton,
    Avatar,
    Divider,
    Badge,
    CircularProgress,
    InputAdornment,
    Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';
import {
    getAllChats,
    getMessages,
    sendMessage,
    markMessagesAsRead
} from '../services/chatService';

export default function AdminChatsPage() {
    const theme = useTheme();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChats = async () => {
        try {
            const response = await getAllChats(0, 50);
            setChats(response.chats);
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (chatId) => {
        try {
            const response = await getMessages(chatId);
            setMessages(response.messages);
            await markMessagesAsRead(chatId);
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat.chatId === chatId
                        ? { ...chat, unreadByAdmins: 0 }
                        : chat
                )
            );
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleChatSelect = async (chat) => {
        setSelectedChat(chat);
        await loadMessages(chat.chatId);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || sending) return;

        setSending(true);
        try {
            const response = await sendMessage(selectedChat.chatId, newMessage.trim());
            setMessages(prev => [...prev, response]);
            setNewMessage('');
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat.chatId === selectedChat.chatId
                        ? {
                            ...chat,
                            lastMessage: {
                                content: response.content,
                                senderId: response.senderId,
                                senderRole: response.senderRole,
                                createdAt: response.createdAt
                            },
                            lastMessageAt: response.createdAt
                        }
                        : chat
                ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
            );
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        if (selectedChat) {
            pollingIntervalRef.current = setInterval(async () => {
                try {
                    const response = await getMessages(selectedChat.chatId);
                    if (response.messages.length !== messages.length) {
                        setMessages(response.messages);
                        await markMessagesAsRead(selectedChat.chatId);
                    }
                } catch (error) {
                    console.error('Error polling messages:', error);
                }
            }, 3000);

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
            };
        }
    }, [selectedChat, messages.length]);

    useEffect(() => {
        loadChats();
        const chatListInterval = setInterval(() => {
            loadChats();
        }, 5000);
        return () => clearInterval(chatListInterval);
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

    const filteredChats = chats.filter(chat =>
        chat.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 2, p: 2 }}>
                <Paper sx={{ width: 350, display: 'flex', flexDirection: 'column', backgroundColor: theme.palette.background.paper }}>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>User Chats</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>)
                            }}
                        />
                    </Box>
                    <Divider />
                    <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                        {filteredChats.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">No chats found</Typography>
                            </Box>
                        ) : (
                            filteredChats.map((chat) => (
                                <ListItem key={chat.chatId} disablePadding>
                                    <ListItemButton
                                        selected={selectedChat?.chatId === chat.chatId}
                                        onClick={() => handleChatSelect(chat)}
                                    >
                                        <Badge badgeContent={chat.unreadByAdmins} color="primary" sx={{ mr: 2 }}>
                                            <Avatar><PersonIcon /></Avatar>
                                        </Badge>
                                        <ListItemText
                                            primary={chat.user?.name || 'Unknown User'}
                                            secondary={
                                                <React.Fragment>
                                                    <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {chat.lastMessage?.content || 'No messages yet'}
                                                    </Typography>
                                                    <Typography component="span" variant="caption" color="text.secondary">
                                                        {formatTime(chat.lastMessageAt)}
                                                    </Typography>
                                                </React.Fragment>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))
                        )}
                    </List>
                </Paper>
                <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: theme.palette.background.paper }}>
                    {selectedChat ? (
                        <>
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar><PersonIcon /></Avatar>
                                <Box>
                                    <Typography variant="h6">{selectedChat.user?.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{selectedChat.user?.email}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {messages.map((message, index) => {
                                    const isAdmin = message.senderRole === 'admin';
                                    return (
                                        <Box key={message.messageId || index} sx={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                                            <Box sx={{ maxWidth: '70%', p: 1.5, borderRadius: 2, backgroundColor: isAdmin ? theme.palette.primary.main : theme.palette.grey[200], color: isAdmin ? theme.palette.primary.contrastText : theme.palette.text.primary }}>
                                                {isAdmin && (<Chip label="Admin" size="small" sx={{ mb: 0.5, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' }} />)}
                                                <Typography variant="body1">{message.content}</Typography>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                                                    {formatTime(message.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </Box>
                            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
                                <TextField fullWidth placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={sending} multiline maxRows={4} />
                                <IconButton color="primary" type="submit" disabled={!newMessage.trim() || sending}>
                                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Select a chat to start messaging</Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </PageFade>
    );
}
