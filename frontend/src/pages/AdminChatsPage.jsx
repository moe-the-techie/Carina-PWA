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
    Toolbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Skeleton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import ImageViewerDialog from '../components/ImageViewerDialog';
import {
    getAllChats,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    getOrCreateChatByUserId,
    deleteChat,
    uploadImage,
    uploadVoice,
    getCachedVoiceMessage
} from '../services/chatService';
import { 
    subscribeToAdminChats, 
    removeMessageHandler,
    setCurrentlyViewingChat,
    clearCurrentlyViewingChat
} from '../services/ablyService';
import { useUnreadCount } from '../contexts/UnreadCountContext';

export default function AdminChatsPage() {
    const theme = useTheme();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { fetchUnreadCount } = useUnreadCount();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [hasMoreChats, setHasMoreChats] = useState(false);
    const [loadingMoreChats, setLoadingMoreChats] = useState(false);
    const [showChatView, setShowChatView] = useState(false); // New state for mobile view toggle
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState({});
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [voiceBlob, setVoiceBlob] = useState(null);
    const [playingVoice, setPlayingVoice] = useState({});
    const [audioProgress, setAudioProgress] = useState({});
    const [isDragging, setIsDragging] = useState(null);
    const messagesEndRef = useRef(null);
    const hasInitializedChat = useRef(false);
    const hasSubscribed = useRef(false);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRefs = useRef({});

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
        setLoadingMessages(true);
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
            // Refresh the global unread count
            fetchUnreadCount();
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleChatSelect = async (chat) => {
        setSelectedChat(chat);
        setError('');
        
        // On mobile, immediately switch to chat view to show skeleton
        if (isMobile) {
            setShowChatView(true);
        }
        
        await loadMessages(chat.chatId);
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
            
            // On mobile, immediately switch to chat view to show skeleton
            if (isMobile) {
                setShowChatView(true);
            }
            
            await loadMessages(chatData.chatId);
        } catch (error) {
            console.error('Error opening chat by user ID:', error);
            setError(error.message || 'Failed to open chat with user');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setError('Only JPEG, PNG, GIF, and WebP images are allowed');
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setVoiceBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    // Auto-stop at 60 seconds
                    if (newTime >= 60) {
                        setTimeout(() => {
                            stopRecording();
                            setError('Maximum recording time reached (60s)');
                        }, 0);
                    }
                    return newTime;
                });
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            setError('Failed to access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
    };

    const cancelVoiceRecording = () => {
        if (isRecording) {
            stopRecording();
        }
        setVoiceBlob(null);
        setRecordingTime(0);
        audioChunksRef.current = [];
    };

    const toggleVoicePlayback = async (messageId) => {
        const audio = audioRefs.current[messageId];
        
        if (!audio) {
            try {
                // Pause all other playing audio
                Object.entries(audioRefs.current).forEach(([id, audioElement]) => {
                    if (id !== messageId && audioElement && !audioElement.paused) {
                        audioElement.pause();
                        setPlayingVoice(prev => ({ ...prev, [id]: false }));
                    }
                });

                // Use cached voice message function
                const result = await getCachedVoiceMessage(messageId);
                const audioUrl = typeof result === 'string' ? result : result.url;
                
                const newAudio = new Audio(audioUrl);
                audioRefs.current[messageId] = newAudio;
                
                newAudio.onended = () => {
                    setPlayingVoice(prev => ({ ...prev, [messageId]: false }));
                    setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
                };
                
                newAudio.onerror = (e) => {
                    console.error('Error playing audio:', e);
                    setError('Failed to play voice message');
                    setPlayingVoice(prev => ({ ...prev, [messageId]: false }));
                };
                
                newAudio.ontimeupdate = () => {
                    if (newAudio.duration) {
                        const progress = (newAudio.currentTime / newAudio.duration) * 100;
                        setAudioProgress(prev => ({ ...prev, [messageId]: progress }));
                    }
                };
                
                await newAudio.play();
                setPlayingVoice(prev => ({ ...prev, [messageId]: true }));
            } catch (err) {
                console.error('Error loading/playing audio:', err);
                setError('Failed to play voice message');
            }
        } else {
            if (playingVoice[messageId]) {
                audio.pause();
                setPlayingVoice(prev => ({ ...prev, [messageId]: false }));
            } else {
                // Pause all other playing audio
                Object.entries(audioRefs.current).forEach(([id, audioElement]) => {
                    if (id !== messageId && audioElement && !audioElement.paused) {
                        audioElement.pause();
                        setPlayingVoice(prev => ({ ...prev, [id]: false }));
                    }
                });
                
                audio.play();
                setPlayingVoice(prev => ({ ...prev, [messageId]: true }));
            }
        }
    };

    const handleProgressBarClick = (messageId, event) => {
        const audio = audioRefs.current[messageId];
        if (!audio) return;
        
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        
        audio.currentTime = percentage * audio.duration;
        setAudioProgress(prev => ({ ...prev, [messageId]: percentage * 100 }));
    };

    const handleMouseDown = (messageId, event) => {
        event.preventDefault();
        setIsDragging(messageId);
    };

    const handleMouseMove = (messageId, event) => {
        if (isDragging !== messageId) return;
        
        const audio = audioRefs.current[messageId];
        if (!audio) return;
        
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        
        audio.currentTime = percentage * audio.duration;
        setAudioProgress(prev => ({ ...prev, [messageId]: percentage * 100 }));
    };

    const handleMouseUp = () => {
        setIsDragging(null);
    };

    useEffect(() => {
        if (isDragging !== null) {
            window.addEventListener('mouseup', handleMouseUp);
            return () => window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isDragging]);

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile && !voiceBlob) || !selectedChat || sending || uploading) return;

        setSending(true);
        try {
            let messageType = 'text';
            let imageUrl = null;
            let imageDeleteUrl = null;
            let voiceUrl = null;
            let voiceDeleteUrl = null;
            let voiceDuration = null;

            if (voiceBlob) {
                setUploading(true);
                try {
                    const uploadResult = await uploadVoice(voiceBlob);
                    voiceUrl = uploadResult.voiceUrl;
                    voiceDeleteUrl = uploadResult.deleteUrl;
                    voiceDuration = recordingTime;
                    messageType = 'voice';
                } catch (uploadError) {
                    setError('Failed to upload voice message');
                    console.error('Error uploading voice:', uploadError);
                    return;
                } finally {
                    setUploading(false);
                }
            } else if (selectedFile) {
                setUploading(true);
                try {
                    const uploadResult = await uploadImage(selectedFile);
                    imageUrl = uploadResult.imageUrl;
                    imageDeleteUrl = uploadResult.deleteUrl;
                    messageType = 'image';
                } catch (uploadError) {
                    setError('Failed to upload image');
                    console.error('Error uploading image:', uploadError);
                    return;
                } finally {
                    setUploading(false);
                }
            }

            let content = newMessage.trim();
            if (!content) {
                if (messageType === 'image') content = 'Sent an image';
                else if (messageType === 'voice') content = 'Sent a voice message';
            }

            const response = await sendMessage(
                selectedChat.chatId, 
                content,
                messageType,
                imageUrl,
                imageDeleteUrl,
                voiceUrl,
                voiceDeleteUrl,
                voiceDuration
            );
            // Message will be added via Ably subscription, but add it locally for immediate feedback
            setMessages(prev => {
                const exists = prev.some(m => m._id === response._id);
                if (exists) return prev;
                return [...prev, response];
            });
            setNewMessage('');
            handleRemoveImage();
            cancelVoiceRecording();
            
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

            const handleMessage = (messageData, eventType) => {
                // Handle read receipts
                if (eventType === 'messages-read') {
                    console.log('Handling read receipt:', messageData);
                    
                    if (selectedChat && messageData.chatId === selectedChat.chatId && messageData.readBy === 'user') {
                        setMessages(prev => 
                            prev.map(msg => ({
                                ...msg,
                                readByUser: true
                            }))
                        );
                    }
                    return;
                }
                // Update messages if this is the selected chat
                if (selectedChat && messageData.chatId === selectedChat.chatId) {
                    setMessages(prev => {
                        const exists = prev.some(m => m._id === messageData._id);
                        if (exists) return prev;
                        return [...prev, messageData];
                    });

                    // Mark as read if viewing this chat
                    markMessagesAsRead(selectedChat.chatId)
                        .then(() => {
                            // Refresh the global unread count after marking as read
                            fetchUnreadCount();
                        })
                        .catch(err => 
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
                                unreadByAdmins: messageData.senderRole === 'user' && selectedChat?.chatId !== messageData.chatId
                                    ? messageData.unreadByAdmins
                                    : chat.unreadByAdmins
                            }
                            : chat
                    );
                    
                    return updatedChats.sort((a, b) => 
                        new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
                    );
                });
            };

            subscribeToAdminChats(handleMessage).catch(error => {
                console.error('Error subscribing to admin chats:', error);
            });

            // Cleanup function
            return () => {
                removeMessageHandler('admin:chats', handleMessage);
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

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setImageDialogOpen(true);
    };

    const handleCloseImageDialog = () => {
        setImageDialogOpen(false);
        setSelectedImage(null);
    };

    const handleDeleteClick = (e, chat) => {
        e.stopPropagation();
        setChatToDelete(chat);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!chatToDelete) return;

        setDeleting(true);
        try {
            await deleteChat(chatToDelete.chatId);
            
            // Remove from chats list
            setChats(prevChats => prevChats.filter(c => c.chatId !== chatToDelete.chatId));
            
            // Clear selected chat if it was deleted
            if (selectedChat?.chatId === chatToDelete.chatId) {
                setSelectedChat(null);
                setMessages([]);
                setShowChatView(false);
                clearCurrentlyViewingChat();
            }
            
            setDeleteDialogOpen(false);
            setChatToDelete(null);
        } catch (error) {
            console.error('Error deleting chat:', error);
            setError('Failed to delete chat');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setChatToDelete(null);
    };

    const renderChatList = () => (
        <Paper sx={{ 
            width: { xs: '100%', md: 350 },
            minWidth: { md: 350 },
            flexShrink: 0,
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: theme.palette.background.paper,
            height: { xs: '100%', md: 'auto' },
            borderRadius: { xs: 0, md: 1 },
            overflow: 'hidden'
        }}>
            <Box sx={{ 
                p: { xs: 1.25, sm: 1.5, md: 2 },
                flexShrink: 0
            }}>
                <Typography variant="h6" gutterBottom sx={{ 
                    fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
                    fontWeight: 600,
                    mb: 1.5
                }}>
                    User Chats
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ fontSize: { xs: 20, md: 24 } }} /></InputAdornment>)
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            fontSize: { xs: '0.9rem', md: '1rem' }
                        }
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
                                    sx={{ 
                                        p: { xs: 1.25, sm: 1.375, md: 1.5 },
                                        minHeight: { xs: 64, md: 72 }
                                    }}
                                >
                                    <Badge badgeContent={chat.unreadByAdmins} color="primary" sx={{ mr: { xs: 1.5, md: 2 } }}>
                                        <Avatar 
                                            src={chat.user?.profileImageUrl}
                                            alt={chat.user?.name}
                                            sx={{ 
                                                width: { xs: 40, sm: 42, md: 44 }, 
                                                height: { xs: 40, sm: 42, md: 44 },
                                                cursor: chat.user?.profileImageUrl ? 'pointer' : 'default',
                                                '&:hover': chat.user?.profileImageUrl ? {
                                                    opacity: 0.8,
                                                    transition: 'opacity 0.2s'
                                                } : {}
                                            }}
                                            onClick={(e) => {
                                                if (chat.user?.profileImageUrl) {
                                                    e.stopPropagation();
                                                    handleImageClick(chat.user.profileImageUrl);
                                                }
                                            }}
                                        >
                                            {!chat.user?.profileImageUrl && (
                                                chat.user?.name?.charAt(0)?.toUpperCase() || <PersonIcon sx={{ fontSize: { xs: 18, md: 24 } }} />
                                            )}
                                        </Avatar>
                                    </Badge>
                                    <ListItemText
                                        primary={
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontSize: { xs: '0.9rem', sm: '0.9375rem', md: '1rem' },
                                                    fontWeight: chat.unreadByAdmins > 0 ? 600 : 'normal',
                                                    lineHeight: 1.4
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
                                                        fontSize: { xs: '0.8rem', sm: '0.8125rem', md: '0.875rem' },
                                                        lineHeight: 1.4,
                                                        mt: 0.25
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
            minWidth: 0,
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: theme.palette.background.paper,
            width: { xs: '100%', md: 'auto' },
            height: { xs: '100%', md: 'auto' },
            borderRadius: { xs: 0, md: 1 },
            overflow: 'hidden'
        }}>
            {selectedChat ? (
                <>
                    {/* Chat Header */}
                    <Box sx={{ 
                        p: { xs: 1.25, sm: 1.5, md: 2 }, 
                        borderBottom: 1, 
                        borderColor: 'divider', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 1, md: 2 },
                        minHeight: { xs: 56, md: 64 },
                        flexShrink: 0
                    }}>
                        {isMobile && (
                            <IconButton 
                                onClick={handleBackToList}
                                sx={{ 
                                    mr: 0.5,
                                    width: 44,
                                    height: 44
                                }}
                                aria-label="Back to chat list"
                            >
                                <ArrowBackIcon sx={{ fontSize: 24 }} />
                            </IconButton>
                        )}
                        <Avatar 
                            src={selectedChat.user?.profileImageUrl}
                            alt={selectedChat.user?.name}
                            sx={{ 
                                width: { xs: 36, sm: 38, md: 40 }, 
                                height: { xs: 36, sm: 38, md: 40 },
                                cursor: selectedChat.user?.profileImageUrl ? 'pointer' : 'default',
                                '&:hover': selectedChat.user?.profileImageUrl ? {
                                    opacity: 0.8,
                                    transition: 'opacity 0.2s'
                                } : {}
                            }}
                            onClick={() => {
                                if (selectedChat.user?.profileImageUrl) {
                                    handleImageClick(selectedChat.user.profileImageUrl);
                                }
                            }}
                        >
                            {!selectedChat.user?.profileImageUrl && (
                                selectedChat.user?.name?.charAt(0)?.toUpperCase() || <PersonIcon sx={{ fontSize: { xs: 18, md: 24 } }} />
                            )}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="h6" sx={{ 
                                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.25rem' },
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {selectedChat.user?.name}
                            </Typography>
                            <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.725rem', md: '0.75rem' },
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'block'
                                }}
                            >
                                {selectedChat.user?.email}
                            </Typography>
                        </Box>
                        <IconButton
                            color="error"
                            onClick={(e) => handleDeleteClick(e, selectedChat)}
                            size="small"
                            sx={{ 
                                ml: 0.5,
                                width: { xs: 44, md: 40 },
                                height: { xs: 44, md: 40 },
                                flexShrink: 0
                            }}
                            aria-label="Delete chat"
                        >
                            <DeleteIcon sx={{ fontSize: { xs: 18, md: 22 } }} />
                        </IconButton>
                    </Box>
                    
                    <Box sx={{ 
                        flexGrow: 1,
                        minHeight: 0,
                        overflow: 'auto',
                        overflowX: 'hidden', 
                        p: { xs: 1, sm: 1.5, md: 2 }, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: { xs: 0.75, md: 1 },
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'smooth'
                    }}>
                        {loadingMessages ? (
                            // Skeleton loader for messages
                            <>
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <Box
                                        key={item}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: item % 2 === 0 ? 'flex-end' : 'flex-start',
                                            mb: 0.5
                                        }}
                                    >
                                        <Box sx={{ maxWidth: { xs: '85%', sm: '80%', md: '70%' } }}>
                                            <Skeleton 
                                                variant="rounded" 
                                                width={item % 3 === 0 ? 180 : item % 2 === 0 ? 250 : 200}
                                                height={60}
                                                sx={{ borderRadius: { xs: 2.5, md: 2 } }}
                                            />
                                        </Box>
                                    </Box>
                                ))}
                            </>
                        ) : (
                            <>
                                {messages.map((message, index) => {
                            const isAdmin = message.senderRole === 'admin';
                            const isImage = message.messageType === 'image';
                            const isVoice = message.messageType === 'voice';
                            return (
                                <Box 
                                    key={message._id || index} 
                                    sx={{ 
                                        display: 'flex', 
                                        justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                        mb: 0.5
                                    }}
                                >
                                    <Box sx={{ 
                                        maxWidth: { xs: '85%', sm: '80%', md: '70%' },
                                        minWidth: 0,
                                        p: { xs: 1.25, sm: 1.375, md: 1.5 }, 
                                        borderRadius: { xs: 2.5, md: 2 }, 
                                        backgroundColor: isAdmin 
                                            ? theme.palette.primary.main 
                                            : theme.palette.mode === 'dark' 
                                                ? theme.palette.grey[800] 
                                                : theme.palette.grey[200], 
                                        color: isAdmin ? theme.palette.primary.contrastText : theme.palette.text.primary 
                                    }}>
                                        {isAdmin && (
                                            <Chip 
                                                label="Admin" 
                                                size="small" 
                                                sx={{ 
                                                    mb: 0.5, 
                                                    height: { xs: 20, sm: 22, md: 24 }, 
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    fontSize: { xs: '0.7rem', sm: '0.725rem', md: '0.75rem' },
                                                    fontWeight: 500
                                                }} 
                                            />
                                        )}
                                        {isVoice && message.voiceUrl && (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 1,
                                                mb: message.content && message.content !== 'Sent a voice message' ? 1 : 0
                                            }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleVoicePlayback(message._id)}
                                                    sx={{
                                                        color: isAdmin ? 'white' : theme.palette.primary.main,
                                                        backgroundColor: isAdmin ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                                        '&:hover': {
                                                            backgroundColor: isAdmin ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                                                        }
                                                    }}
                                                >
                                                    {playingVoice[message._id] ? <PauseIcon /> : <PlayArrowIcon />}
                                                </IconButton>
                                                <Box 
                                                    onClick={(e) => handleProgressBarClick(message._id, e)}
                                                    onMouseMove={(e) => handleMouseMove(message._id, e)}
                                                    sx={{ 
                                                        flex: 1, 
                                                        height: 24,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        cursor: 'pointer',
                                                        minWidth: 100,
                                                        position: 'relative',
                                                        userSelect: 'none'
                                                    }}
                                                >
                                                    <Box sx={{
                                                        width: '100%',
                                                        height: 4,
                                                        backgroundColor: isAdmin ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                                                        borderRadius: 2,
                                                        position: 'relative',
                                                        overflow: 'visible'
                                                    }}>
                                                        <Box sx={{
                                                            width: `${audioProgress[message._id] || 0}%`,
                                                            height: '100%',
                                                            backgroundColor: isAdmin ? 'white' : theme.palette.primary.main,
                                                            borderRadius: 2,
                                                            transition: isDragging === message._id ? 'none' : 'width 0.1s linear',
                                                            position: 'relative'
                                                        }}>
                                                            <Box
                                                                onMouseDown={(e) => handleMouseDown(message._id, e)}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    right: -6,
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                    width: 12,
                                                                    height: 12,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: isAdmin ? 'white' : theme.palette.primary.main,
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                                    cursor: 'grab',
                                                                    '&:active': {
                                                                        cursor: 'grabbing'
                                                                    },
                                                                    '&:hover': {
                                                                        transform: 'translateY(-50%) scale(1.2)'
                                                                    },
                                                                    transition: 'transform 0.1s ease'
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                                    {message.voiceDuration ? formatRecordingTime(message.voiceDuration) : '0:00'}
                                                </Typography>
                                            </Box>
                                        )}
                                        {isImage && message.imageUrl && (
                                            <Box 
                                                component="img" 
                                                src={message.imageUrl} 
                                                alt="Shared image" 
                                                onClick={() => handleImageClick(message.imageUrl)}
                                                loading="lazy"
                                                sx={{ 
                                                    width: '100%', 
                                                    maxWidth: { xs: 280, sm: 300 },
                                                    borderRadius: { xs: 1.5, md: 1 },
                                                    cursor: 'pointer',
                                                    mb: message.content && message.content !== 'Sent an image' ? 1 : 0,
                                                    display: 'block',
                                                    touchAction: 'manipulation',
                                                    '&:hover': {
                                                        opacity: 0.9
                                                    },
                                                    '&:active': {
                                                        opacity: 0.85
                                                    }
                                                }} 
                                            />
                                        )}
                                        {message.content && (!isImage || message.content !== 'Sent an image') && (!isVoice || message.content !== 'Sent a voice message') && (
                                            <>
                                                <Typography 
                                                    variant="body1" 
                                                    sx={{ 
                                                        fontSize: { xs: '0.9rem', sm: '0.9375rem', md: '1rem' },
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        lineHeight: { xs: 1.5, md: 1.6 }
                                                    }}
                                                >
                                                    {message.content.length > 300 && !expandedMessages[message._id] 
                                                        ? `${message.content.substring(0, 300)}...` 
                                                        : message.content}
                                                </Typography>
                                                {message.content.length > 300 && (
                                                    <Typography
                                                        variant="caption"
                                                        onClick={() => setExpandedMessages(prev => ({
                                                            ...prev,
                                                            [message._id]: !prev[message._id]
                                                        }))}
                                                        sx={{
                                                            display: 'inline-flex',
                                                            mt: 0.5,
                                                            cursor: 'pointer',
                                                            color: isAdmin ? 'rgba(255,255,255,0.9)' : theme.palette.primary.main,
                                                            fontWeight: 'bold',
                                                            fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                                                            minHeight: { xs: 32, md: 24 },
                                                            alignItems: 'center',
                                                            touchAction: 'manipulation',
                                                            '&:hover': {
                                                                textDecoration: 'underline'
                                                            },
                                                            '&:active': {
                                                                opacity: 0.7
                                                            }
                                                        }}
                                                    >
                                                        {expandedMessages[message._id] ? 'Read less' : 'Read more'}
                                                    </Typography>
                                                )}
                                            </>
                                        )}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    opacity: 0.7,
                                                    fontSize: { xs: '0.7rem', sm: '0.725rem', md: '0.75rem' },
                                                    lineHeight: 1
                                                }}
                                            >
                                                {formatTime(message.createdAt)}
                                            </Typography>
                                            {isAdmin && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                                                    {message.readByUser ? (
                                                        <DoneAllIcon sx={{ 
                                                            fontSize: { xs: 13, sm: 14, md: 16 },
                                                            color: '#4fc3f7',
                                                            opacity: 0.9
                                                        }} />
                                                    ) : (
                                                        <DoneAllIcon sx={{ 
                                                            fontSize: { xs: 13, sm: 14, md: 16 },
                                                            opacity: 0.5
                                                        }} />
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </Box>
                    
                    <Box sx={{ 
                        p: { xs: 1.25, sm: 1.5, md: 2 }, 
                        borderTop: 1, 
                        borderColor: 'divider',
                        backgroundColor: theme.palette.background.paper,
                        flexShrink: 0
                    }}>
                        {imagePreview && (
                            <Box sx={{ 
                                mb: 1, 
                                position: 'relative', 
                                display: 'inline-block' 
                            }}>
                                <Box 
                                    component="img" 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    sx={{ 
                                        maxWidth: { xs: 150, sm: 180, md: 200 },
                                        maxHeight: { xs: 120, sm: 140, md: 150 },
                                        borderRadius: { xs: 1.5, md: 1 },
                                        display: 'block'
                                    }} 
                                />
                                <IconButton 
                                    size="small" 
                                    onClick={handleRemoveImage}
                                    sx={{ 
                                        position: 'absolute', 
                                        top: 4, 
                                        right: 4, 
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        width: { xs: 32, md: 28 },
                                        height: { xs: 32, md: 28 },
                                        '&:hover': {
                                            backgroundColor: 'rgba(0,0,0,0.8)'
                                        },
                                        '&:active': {
                                            backgroundColor: 'rgba(0,0,0,0.9)'
                                        }
                                    }}
                                >
                                    <CloseIcon sx={{ fontSize: { xs: 18, md: 16 } }} />
                                </IconButton>
                            </Box>
                        )}
                        {voiceBlob && (
                            <Box sx={{ 
                                mb: 1, 
                                p: 1.5,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <MicIcon color="primary" />
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                    Voice message ({formatRecordingTime(recordingTime)})
                                </Typography>
                                <IconButton 
                                    size="small" 
                                    onClick={cancelVoiceRecording}
                                    sx={{ color: 'error.main' }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        )}
                        {isRecording && (
                            <Box sx={{ 
                                mb: 1, 
                                p: 1.5,
                                backgroundColor: 'error.main',
                                color: 'white',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <MicIcon sx={{ animation: 'pulse 1.5s infinite' }} />
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                    Recording... {formatRecordingTime(recordingTime)}
                                </Typography>
                                <IconButton 
                                    size="small" 
                                    onClick={stopRecording}
                                    sx={{ color: 'white' }}
                                >
                                    <StopIcon />
                                </IconButton>
                            </Box>
                        )}
                        <Box 
                            component="form" 
                            onSubmit={handleSendMessage} 
                            sx={{ 
                                display: 'flex', 
                                gap: { xs: 0.75, md: 1 },
                                alignItems: 'flex-end'
                            }}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            {!voiceBlob && !isRecording && (
                                <>
                                    <IconButton 
                                        color="primary" 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={sending || uploading}
                                        aria-label="Attach image"
                                        sx={{ 
                                            width: { xs: 44, sm: 46, md: 48 },
                                            height: { xs: 44, sm: 46, md: 48 },
                                            flexShrink: 0
                                        }}
                                    >
                                        <ImageIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
                                    </IconButton>
                                    <IconButton 
                                        color="error" 
                                        onClick={startRecording}
                                        disabled={sending || uploading || selectedFile}
                                        aria-label="Record voice"
                                        sx={{ 
                                            width: { xs: 44, sm: 46, md: 48 },
                                            height: { xs: 44, sm: 46, md: 48 },
                                            flexShrink: 0
                                        }}
                                    >
                                        <MicIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
                                    </IconButton>
                                </>
                            )}
                            <TextField 
                                fullWidth 
                                placeholder={selectedFile ? "Add a caption (optional)..." : voiceBlob ? "Add a caption (optional)..." : "Type your message..."} 
                                value={newMessage} 
                                onChange={(e) => setNewMessage(e.target.value)} 
                                disabled={sending || uploading || isRecording} 
                            multiline 
                            maxRows={4}
                            size="small"
                            sx={{ 
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.9rem', sm: '0.9375rem', md: '1rem' },
                                    padding: { xs: '10px 12px', md: '8px 14px' }
                                },
                                '& .MuiInputBase-input': {
                                    lineHeight: 1.5
                                }
                            }}
                        />
                            <IconButton 
                                color="primary" 
                                type="submit" 
                                disabled={(!newMessage.trim() && !selectedFile && !voiceBlob) || sending || uploading || isRecording}
                                aria-label="Send message"
                                sx={{ 
                                    width: { xs: 44, sm: 46, md: 48 },
                                    height: { xs: 44, sm: 46, md: 48 },
                                    flexShrink: 0
                                }}
                            >
                                {(sending || uploading) ? <CircularProgress size={20} /> : <SendIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />}
                            </IconButton>
                        </Box>
                    </Box>
                </>
            ) : (
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: { xs: 2, sm: 3, md: 4 }
                }}>
                    <Typography color="text.secondary" sx={{ 
                        fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                        textAlign: 'center'
                    }}>
                        Select a chat to start messaging
                    </Typography>
                </Box>
            )}
        </Paper>
    );

    if (loading) {
        return (
            <PageFade>
                <Box sx={{ display: 'flex', height: 'calc(100vh - 10vh)', overflow: 'hidden' }}>
                    {/* Chat List Skeleton */}
                    <Paper sx={{ width: { xs: '100%', md: 320 }, borderRadius: 0, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Skeleton variant="text" width="60%" height={32} />
                            <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 2 }} />
                        </Box>
                        <List sx={{ p: 0 }}>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <React.Fragment key={item}>
                                    <ListItem sx={{ gap: 2 }}>
                                        <Skeleton variant="circular" width={40} height={40} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton variant="text" width="70%" height={20} />
                                            <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />
                                        </Box>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>

                    {/* Chat Area Skeleton - Hidden on mobile */}
                    <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', backgroundColor: theme.palette.background.default }}>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 2 }}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="40%" height={24} />
                                <Skeleton variant="text" width="30%" height={16} sx={{ mt: 0.5 }} />
                            </Box>
                        </Box>
                        <Box sx={{ flex: 1, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', color: 'text.secondary' }}>
                                <Typography>Select a chat to view messages</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box sx={{ 
                height: { xs: 'calc(100vh - 60px)', sm: 'calc(100vh - 60px)', md: 'calc(100vh - 10vh - 48px)' }, 
                display: 'flex', 
                gap: { xs: 0, md: 2 }, 
                p: { xs: 0, md: 2 },
                position: 'relative',
                overflow: 'hidden'
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

            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle id="delete-dialog-title">
                    Delete Chat?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this chat with <strong>{chatToDelete?.user?.name}</strong>? 
                        This will permanently delete all messages and cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button 
                        onClick={handleDeleteCancel} 
                        variant="outlined"
                        disabled={deleting}
                        fullWidth={isMobile}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        disabled={deleting}
                        fullWidth={isMobile}
                        startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ImageViewerDialog
                open={imageDialogOpen}
                imageUrl={selectedImage}
                onClose={handleCloseImageDialog}
            />
        </PageFade>
    );
}
