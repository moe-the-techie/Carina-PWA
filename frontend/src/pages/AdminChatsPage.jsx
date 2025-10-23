import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
    Chip,
    Alert,
    Button,
    useMediaQuery,
    AppBar,
    Toolbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';
import {
    getAllChats,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    getOrCreateChatByUserId
} from '../services/chatService';
import { 
    subscribeToAdminChats, 
    removeMessageHandler, 
    requestNotificationPermission,
    setCurrentlyViewingChat,
    clearCurrentlyViewingChat
} from '../services/ablyService';

export default function AdminChatsPage() {
    const theme = useTheme();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [hasMoreChats, setHasMoreChats] = useState(false);
    const [loadingMoreChats, setLoadingMoreChats] = useState(false);
    const [showChatView, setShowChatView] = useState(false); // New state for mobile view toggle
    const messagesEndRef = useRef(null);
    const hasInitializedChat = useRef(false);
    const hasSubscribed = useRef(false);

    // Request notification permission on mount
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChats = async (resetPagination = false) => {
        try {
            if (resetPagination) {
                setChats([]);
            }
            const response = await getAllChats(0, 50);
            setChats(response.chats);
            setHasMoreChats(response.hasMore);
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMoreChats = async () => {
        if (loadingMoreChats || !hasMoreChats) return;
        
        try {
            setLoadingMoreChats(true);
            const response = await getAllChats(chats.length, 50);
            setChats(prev => [...prev, ...response.chats]);
            setHasMoreChats(response.hasMore);
        } catch (error) {
            console.error('Error loading more chats:', error);
        } finally {
            setLoadingMoreChats(false);
        }
    };

    const loadMessages = async (chatId) => {
        try {
            const response = await getMessages(chatId);
            setMessages(response.messages);
            await markMessagesAsRead(chatId);
            setCurrentlyViewingChat(chatId);
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
        setError('');
        await loadMessages(chat.chatId);
        
        if (isMobile) {
            setShowChatView(true);
        }
    };

    const handleBackToList = () => {
        setShowChatView(false);
        setSelectedChat(null);
        clearCurrentlyViewingChat();
    };

    // Handle opening chat from userId (when navigating from users page)
    const openChatByUserId = async (userId) => {
        try {
            if (!userId || userId === 'null' || userId === 'undefined') {
                setError('Cannot open chat: Invalid user ID');
                return;
            }

            setLoading(true);
            setError('');
            
            const chatData = await getOrCreateChatByUserId(userId);
            
            const chatObject = {
                chatId: chatData.chatId,
                user: chatData.user,
                lastMessageAt: chatData.lastMessageAt,
                unreadByAdmins: chatData.unreadByAdmins,
                lastMessage: null,
                createdAt: chatData.createdAt
            };
            
            setChats(prevChats => {
                const existingChatIndex = prevChats.findIndex(
                    chat => chat.chatId === chatData.chatId
                );
                
                if (existingChatIndex >= 0) {
                    const updatedChats = [...prevChats];
                    updatedChats[existingChatIndex] = {
                        ...updatedChats[existingChatIndex],
                        ...chatObject
                    };
                    return updatedChats;
                } else {
                    return [chatObject, ...prevChats];
                }
            });
            
            setSelectedChat(chatObject);
            
            await loadMessages(chatData.chatId);
            
            if (isMobile) {
                setShowChatView(true);
            }
        } catch (error) {
            console.error('Error opening chat by user ID:', error);
            setError(error.message || 'Failed to open chat with user');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || sending) return;

        setSending(true);
        try {
            const response = await sendMessage(selectedChat.chatId, newMessage.trim());
            // Message will be added via Ably subscription, but add it locally for immediate feedback
            setMessages(prev => {
                const exists = prev.some(m => m.messageId === response.messageId);
                if (exists) return prev;
                return [...prev, response];
            });
            setNewMessage('');
            
            // Update chats list
            setChats(prevChats => {
                const updatedChats = prevChats.map(chat =>
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
                );
                
                return updatedChats.sort((a, b) => 
                    new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
                );
            });
            
            setSelectedChat(prev => ({
                ...prev,
                lastMessageAt: response.createdAt,
                lastMessage: {
                    content: response.content,
                    senderId: response.senderId,
                    senderRole: response.senderRole,
                    createdAt: response.createdAt
                }
            }));
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    // Subscribe to real-time admin chat updates using Ably
    useEffect(() => {
        if (!hasSubscribed.current) {
            hasSubscribed.current = true;

            const handleNewMessage = (messageData) => {
                // Update messages if this is the selected chat
                if (selectedChat && messageData.chatId === selectedChat.chatId) {
                    setMessages(prev => {
                        const exists = prev.some(m => m.messageId === messageData.messageId);
                        if (exists) return prev;
                        return [...prev, messageData];
                    });

                    // Mark as read if viewing this chat
                    markMessagesAsRead(selectedChat.chatId).catch(err => 
                        console.error('Error marking messages as read:', err)
                    );
                }

                // Update chat list
                setChats(prevChats => {
                    const updatedChats = prevChats.map(chat =>
                        chat.chatId === messageData.chatId
                            ? {
                                ...chat,
                                lastMessage: {
                                    content: messageData.content,
                                    senderId: messageData.senderId,
                                    senderRole: messageData.senderRole,
                                    createdAt: messageData.createdAt
                                },
                                lastMessageAt: messageData.createdAt,
                                unreadByAdmins: messageData.senderRole === 'user' 
                                    ? (chat.unreadByAdmins || 0) + 1 
                                    : chat.unreadByAdmins
                            }
                            : chat
                    );
                    
                    return updatedChats.sort((a, b) => 
                        new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
                    );
                });
            };

            subscribeToAdminChats(handleNewMessage).catch(error => {
                console.error('Error subscribing to admin chats:', error);
            });

            // Cleanup function
            return () => {
                removeMessageHandler('admin:chats', handleNewMessage);
                hasSubscribed.current = false;
            };
        }
    }, [selectedChat]);

    useEffect(() => {
        return () => {
            clearCurrentlyViewingChat();
        };
    }, []);

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (!isMobile) {
            setShowChatView(false);
        }
    }, [isMobile]);

    // Handle userId from navigation state (when coming from users page)
    useEffect(() => {
        if (location.state?.userId && !hasInitializedChat.current) {
            hasInitializedChat.current = true;
            openChatByUserId(location.state.userId);
        }
    }, [location.state?.userId]);

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

    const renderChatList = () => (
        <Paper sx={{ 
            width: { xs: '100%', md: 350 }, 
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: theme.palette.background.paper,
            height: { xs: '100%', md: 'auto' }
        }}>
            <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    User Chats
                </Typography>
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
                    <>
                        {filteredChats.map((chat) => (
                            <ListItem key={chat.chatId} disablePadding>
                                <ListItemButton
                                    selected={selectedChat?.chatId === chat.chatId}
                                    onClick={() => handleChatSelect(chat)}
                                    sx={{ p: { xs: 1, md: 1.5 } }}
                                >
                                    <Badge badgeContent={chat.unreadByAdmins} color="primary" sx={{ mr: 2 }}>
                                        <Avatar sx={{ width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                                            <PersonIcon sx={{ fontSize: { xs: 18, md: 24 } }} />
                                        </Avatar>
                                    </Badge>
                                    <ListItemText
                                        primary={
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontSize: { xs: '0.875rem', md: '1rem' },
                                                    fontWeight: chat.unreadByAdmins > 0 ? 'bold' : 'normal'
                                                }}
                                            >
                                                {chat.user?.name || 'Unknown User'}
                                            </Typography>
                                        }
                                        secondary={
                                            <React.Fragment>
                                                <Typography 
                                                    component="span" 
                                                    variant="body2" 
                                                    color="text.primary" 
                                                    sx={{ 
                                                        display: 'block', 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap',
                                                        fontSize: { xs: '0.75rem', md: '0.875rem' }
                                                    }}
                                                >
                                                    {chat.lastMessage?.content || 'No messages yet'}
                                                </Typography>
                                                <Typography 
                                                    component="span" 
                                                    variant="caption" 
                                                    color="text.secondary"
                                                    sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                                                >
                                                    {formatTime(chat.lastMessageAt)}
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                        {!searchQuery && hasMoreChats && (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={loadMoreChats}
                                    disabled={loadingMoreChats}
                                    fullWidth
                                    size="small"
                                >
                                    {loadingMoreChats ? <CircularProgress size={20} /> : 'Load More Chats'}
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </List>
        </Paper>
    );

    const renderChatView = () => (
        <Paper sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: theme.palette.background.paper,
            width: { xs: '100%', md: 'auto' },
            height: { xs: '100%', md: 'auto' }
        }}>
            {selectedChat ? (
                <>
                    {/* Chat Header */}
                    <Box sx={{ 
                        p: { xs: 1.5, md: 2 }, 
                        borderBottom: 1, 
                        borderColor: 'divider', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 1, md: 2 } 
                    }}>
                        {isMobile && (
                            <IconButton 
                                onClick={handleBackToList}
                                sx={{ mr: 1 }}
                                aria-label="Back to chat list"
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        )}
                        <Avatar sx={{ width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                            <PersonIcon sx={{ fontSize: { xs: 18, md: 24 } }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                {selectedChat.user?.name}
                            </Typography>
                            <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                            >
                                {selectedChat.user?.email}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ 
                        flexGrow: 1, 
                        overflow: 'auto', 
                        p: { xs: 1, md: 2 }, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1 
                    }}>
                        {messages.map((message, index) => {
                            const isAdmin = message.senderRole === 'admin';
                            return (
                                <Box 
                                    key={message.messageId || index} 
                                    sx={{ 
                                        display: 'flex', 
                                        justifyContent: isAdmin ? 'flex-end' : 'flex-start' 
                                    }}
                                >
                                    <Box sx={{ 
                                        maxWidth: { xs: '85%', md: '70%' }, 
                                        p: { xs: 1, md: 1.5 }, 
                                        borderRadius: 2, 
                                        backgroundColor: isAdmin ? theme.palette.primary.main : theme.palette.grey[200], 
                                        color: isAdmin ? theme.palette.primary.contrastText : theme.palette.text.primary 
                                    }}>
                                        {isAdmin && (
                                            <Chip 
                                                label="Admin" 
                                                size="small" 
                                                sx={{ 
                                                    mb: 0.5, 
                                                    height: { xs: 18, md: 20 }, 
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    fontSize: { xs: '0.65rem', md: '0.75rem' }
                                                }} 
                                            />
                                        )}
                                        <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                                            {message.content}
                                        </Typography>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                display: 'block', 
                                                mt: 0.5, 
                                                opacity: 0.7,
                                                fontSize: { xs: '0.7rem', md: '0.75rem' }
                                            }}
                                        >
                                            {formatTime(message.createdAt)}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Box>
                    
                    <Box 
                        component="form" 
                        onSubmit={handleSendMessage} 
                        sx={{ 
                            p: { xs: 1, md: 2 }, 
                            borderTop: 1, 
                            borderColor: 'divider', 
                            display: 'flex', 
                            gap: 1 
                        }}
                    >
                        <TextField 
                            fullWidth 
                            placeholder="Type your message..." 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            disabled={sending} 
                            multiline 
                            maxRows={4}
                            size="small"
                            sx={{ 
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.875rem', md: '1rem' }
                                }
                            }}
                        />
                        <IconButton 
                            color="primary" 
                            type="submit" 
                            disabled={!newMessage.trim() || sending}
                            sx={{ 
                                width: { xs: 40, md: 48 },
                                height: { xs: 40, md: 48 }
                            }}
                        >
                            {sending ? <CircularProgress size={20} /> : <SendIcon sx={{ fontSize: { xs: 18, md: 24 } }} />}
                        </IconButton>
                    </Box>
                </>
            ) : (
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 4
                }}>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                        Select a chat to start messaging
                    </Typography>
                </Box>
            )}
        </Paper>
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
            <Box sx={{ 
                height: { xs: 'calc(100vh - 140px)', md: 'calc(100vh - 120px)' }, 
                display: 'flex', 
                gap: { xs: 0, md: 2 }, 
                p: { xs: 0, md: 2 },
                position: 'relative'
            }}>
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            position: 'absolute', 
                            top: { xs: 10, md: 80 }, 
                            left: '50%', 
                            transform: 'translateX(-50%)', 
                            zIndex: 1000,
                            width: { xs: '90%', md: 'auto' }
                        }}
                    >
                        {error}
                    </Alert>
                )}
                
                {!isMobile && (
                    <>
                        {renderChatList()}
                        {renderChatView()}
                    </>
                )}
                
                {isMobile && (
                    <>
                        {!showChatView ? renderChatList() : renderChatView()}
                    </>
                )}
            </Box>
        </PageFade>
    );
}
