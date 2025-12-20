import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    Chip,
    Snackbar,
    Alert,
    Skeleton,
    CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
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
import ImageViewerDialog from '../components/ImageViewerDialog';
import {
    getOrCreateChat,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    uploadImage,
    uploadVoice,
    getCachedVoiceMessage
} from '../services/chatService';
import { 
    subscribeToChat, 
    removeMessageHandler,
    setCurrentlyViewingChat,
    clearCurrentlyViewingChat
} from '../services/ablyService';
import { useUnreadCount } from '../contexts/UnreadCountContext';

export default function ChatPage() {
    const theme = useTheme();
    const { resetUnreadCount } = useUnreadCount();
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState({});
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerImage, setViewerImage] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [voiceBlob, setVoiceBlob] = useState(null);
    const [playingVoice, setPlayingVoice] = useState({});
    const [loadingVoice, setLoadingVoice] = useState({});
    const [audioProgress, setAudioProgress] = useState({});
    const [isDragging, setIsDragging] = useState(null);
    const messagesEndRef = useRef(null);
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
    }, [messages, loading]);

    const loadChat = async () => {
        try {
            const chatResponse = await getOrCreateChat();
            setChat(chatResponse);
            
            if (chatResponse.chatId) {
                const messagesResponse = await getMessages(chatResponse.chatId);
                setMessages(messagesResponse.messages);
                await markMessagesAsRead(chatResponse.chatId);
                setCurrentlyViewingChat(chatResponse.chatId);
                resetUnreadCount();
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setSnackbar({ open: true, message: 'Image size must be less than 5MB', severity: 'error' });
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setSnackbar({ open: true, message: 'Only JPEG, PNG, GIF, and WebP images are allowed', severity: 'error' });
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
                            setSnackbar({ open: true, message: 'Maximum recording time reached (60s)', severity: 'info' });
                        }, 0);
                    }
                    return newTime;
                });
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            setSnackbar({ open: true, message: 'Failed to access microphone', severity: 'error' });
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
        if (loadingVoice[messageId]) return;

        const audio = audioRefs.current[messageId];
        
        if (!audio) {
            try {
                setLoadingVoice(prev => ({ ...prev, [messageId]: true }));
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
                    setSnackbar({ open: true, message: 'Failed to play voice message', severity: 'error' });
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
                setSnackbar({ open: true, message: 'Failed to play voice message', severity: 'error' });
            } finally {
                setLoadingVoice(prev => ({ ...prev, [messageId]: false }));
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
        if ((!newMessage.trim() && !selectedFile && !voiceBlob) || !chat || sending || uploading) return;

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
                    setSnackbar({ open: true, message: 'Failed to upload voice message', severity: 'error' });
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
                    setSnackbar({ open: true, message: 'Failed to upload image', severity: 'error' });
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
                chat.chatId, 
                content, 
                messageType,
                imageUrl,
                imageDeleteUrl,
                voiceUrl,
                voiceDeleteUrl,
                voiceDuration
            );
            
            setMessages(prev => {
                const exists = prev.some(m => m._id === response._id);
                if (exists) return prev;
                return [...prev, response];
            });
            setNewMessage('');
            handleRemoveImage();
            cancelVoiceRecording();
        } catch (error) {
            console.error('Error sending message:', error);
            setSnackbar({ open: true, message: 'Failed to send message', severity: 'error' });
        } finally {
            setSending(false);
        }
    };

    const handleImageClick = (imageUrl) => {
        setViewerImage(imageUrl);
        setViewerOpen(true);
    };

    useEffect(() => {
        if (chat?.userId && !hasSubscribed.current) {
            hasSubscribed.current = true;

            const handleMessage = (messageData, eventType) => {
                if (eventType === 'messages-read') {
                    console.log('User received read receipt:', messageData);
                    
                    if (messageData.readBy === 'admin') {
                        setMessages(prev => 
                            prev.map(msg => ({
                                ...msg,
                                readByAdmins: true
                            }))
                        );
                    }
                    return;
                }
                setMessages(prev => {
                    const exists = prev.some(m => m._id === messageData._id);
                    if (exists) return prev;
                    
                    return [...prev, messageData];
                });

                if (messageData.senderRole !== 'user') {
                    markMessagesAsRead(chat.chatId).catch(err => 
                        console.error('Error marking messages as read:', err)
                    );
                }
            };

            subscribeToChat(chat.userId, handleMessage).catch(error => {
                console.error('Error subscribing to chat:', error);
            });

            return () => {
                removeMessageHandler(`chat:${chat.userId}:messages`, handleMessage);
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
                <Box sx={{ 
                    height: { xs: 'calc(100vh - 60px)', sm: 'calc(100vh - 60px)', md: 'calc(100vh - 10vh - 48px)' }, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    p: { xs: 2, md: 4 },
                    overflow: 'hidden',
                    background: theme.palette.mode === 'dark' 
                        ? 'radial-gradient(circle at 50% 50%, #2d3748 0%, #1a202c 100%)' 
                        : 'radial-gradient(circle at 50% 50%, #f7fafc 0%, #edf2f7 100%)'
                }}>
                    <Paper 
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        sx={{ 
                            width: '100%', 
                            maxWidth: { xs: '100%', md: 900 },
                            display: 'flex', 
                            flexDirection: 'column', 
                            background: theme.palette.mode === 'dark' 
                                ? 'rgba(30, 30, 30, 0.6)' 
                                : 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.18)',
                            borderRadius: { xs: 2, md: 3 },
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header Skeleton */}
                        <Box sx={{ 
                            p: 2, 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            minHeight: 70
                        }}>
                            <Skeleton variant="circular" width={45} height={45} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="40%" height={30} />
                                <Skeleton variant="text" width="60%" height={20} sx={{ mt: 0.5 }} />
                            </Box>
                        </Box>

                        {/* Messages Skeleton */}
                        <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Skeleton variant="rounded" width="60%" height={60} sx={{ borderRadius: '20px 20px 5px 20px' }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1.5 }}>
                                <Skeleton variant="circular" width={35} height={35} />
                                <Skeleton variant="rounded" width="60%" height={80} sx={{ borderRadius: '20px 20px 20px 5px' }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Skeleton variant="rounded" width="50%" height={50} sx={{ borderRadius: '20px 20px 5px 20px' }} />
                            </Box>
                        </Box>

                        {/* Input Skeleton */}
                        <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Skeleton variant="rounded" width="100%" height={60} sx={{ borderRadius: 3 }} />
                        </Box>
                    </Paper>
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box sx={{ 
                height: { xs: 'calc(100vh - (60px + env(safe-area-inset-bottom)))', sm: 'calc(100vh - (60px + env(safe-area-inset-bottom)))', md: 'calc(100vh - 10vh - 48px)' }, 
                display: 'flex', 
                justifyContent: 'center', 
                p: { xs: 0, sm: 1, md: 2 },
                overflow: 'hidden'
            }}>
                <Paper 
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    sx={{ 
                        width: '100%', 
                        maxWidth: { xs: '100%', md: 900 },
                        display: 'flex', 
                        flexDirection: 'column', 
                        background: theme.palette.mode === 'dark' 
                            ? 'rgba(30, 30, 30, 0.6)' 
                            : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: { xs: 0, md: 3 },
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ 
                        p: 2, 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        minHeight: 70,
                        background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Avatar sx={{ 
                            width: 45,
                            height: 45,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}>
                            <SupportAgentIcon sx={{ fontSize: 24, color: 'white' }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" sx={{ 
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                letterSpacing: 0.5
                            }}>
                                Chat with Carina
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50', boxShadow: '0 0 5px #4caf50' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Online
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ 
                        flexGrow: 1, 
                        overflow: 'auto', 
                        overflowX: 'hidden',
                        p: 3, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2,
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'smooth'
                    }}>
                        {messages.length === 0 ? (
                            <Box sx={{ 
                                flexGrow: 1, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                flexDirection: 'column', 
                                gap: 2,
                                opacity: 0.7
                            }}>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <SupportAgentIcon sx={{ fontSize: 80, color: theme.palette.text.disabled }} />
                                </motion.div>
                                <Typography 
                                    color="text.secondary" 
                                    align="center" 
                                    sx={{ fontWeight: 500 }}
                                >
                                    No messages yet. Start a conversation with Carina!
                                </Typography>
                            </Box>
                        ) : (
                            <AnimatePresence>
                                {messages.map((message, index) => {
                                    const isUser = message.senderRole === 'user';
                                    const isImage = message.messageType === 'image';
                                    const isVoice = message.messageType === 'voice';
                                    return (
                                        <motion.div
                                            key={message._id || index}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                display: 'flex',
                                                justifyContent: isUser ? 'flex-end' : 'flex-start',
                                                marginBottom: 8
                                            }}
                                        >
                                            {!isUser && (
                                                <Avatar sx={{ 
                                                    width: 32, 
                                                    height: 32, 
                                                    mr: 1.5, 
                                                    mt: 0.5,
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                }}>
                                                    <SupportAgentIcon sx={{ fontSize: 18, color: 'white' }} />
                                                </Avatar>
                                            )}
                                            <Box sx={{ 
                                                maxWidth: { xs: '85%', sm: '80%', md: '70%' }, 
                                                p: 2, 
                                                borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                                                background: isUser 
                                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                                    : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                                                color: isUser ? 'white' : theme.palette.text.primary,
                                                boxShadow: isUser 
                                                    ? '0 4px 15px rgba(118, 75, 162, 0.3)' 
                                                    : '0 4px 15px rgba(0,0,0,0.05)',
                                                position: 'relative',
                                                backdropFilter: !isUser ? 'blur(10px)' : 'none',
                                                border: !isUser ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                                wordWrap: 'break-word',
                                                overflowWrap: 'break-word'
                                            }}>
                                                {/* Content Logic */}
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
                                                            disabled={loadingVoice[message._id]}
                                                            sx={{
                                                                color: isUser ? 'white' : theme.palette.primary.main,
                                                                backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                                                '&:hover': {
                                                                    backgroundColor: isUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                                                                }
                                                            }}
                                                        >
                                                            {loadingVoice[message._id] ? (
                                                                <CircularProgress size={20} color="inherit" />
                                                            ) : (
                                                                playingVoice[message._id] ? <PauseIcon /> : <PlayArrowIcon />
                                                            )}
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
                                                                backgroundColor: isUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                                                                borderRadius: 2,
                                                                position: 'relative',
                                                                overflow: 'visible'
                                                            }}>
                                                                <Box sx={{
                                                                    width: `${audioProgress[message._id] || 0}%`,
                                                                    height: '100%',
                                                                    backgroundColor: isUser ? 'white' : theme.palette.primary.main,
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
                                                                            backgroundColor: isUser ? 'white' : theme.palette.primary.main,
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
                                                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: isUser ? 'rgba(255,255,255,0.9)' : 'text.secondary' }}>
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
                                                            borderRadius: 2,
                                                            cursor: 'pointer',
                                                            mb: message.content && message.content !== 'Sent an image' ? 1 : 0,
                                                            display: 'block',
                                                            touchAction: 'manipulation',
                                                            transition: 'transform 0.2s',
                                                            '&:hover': {
                                                                transform: 'scale(1.02)'
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
                                                                lineHeight: 1.6
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
                                                                    color: isUser ? 'rgba(255,255,255,0.9)' : theme.palette.primary.main,
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.85rem',
                                                                    '&:hover': {
                                                                        textDecoration: 'underline'
                                                                    }
                                                                }}
                                                            >
                                                                {expandedMessages[message._id] ? 'Read less' : 'Read more'}
                                                            </Typography>
                                                        )}
                                                    </>
                                                )}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, justifyContent: 'flex-end' }}>
                                                    <Typography variant="caption" sx={{ 
                                                        opacity: 0.7,
                                                        fontSize: '0.7rem',
                                                        color: isUser ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                                                    }}>
                                                        {formatTime(message.createdAt)}
                                                    </Typography>
                                                    {isUser && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                                                            {message.readByAdmins ? (
                                                                <DoneAllIcon sx={{ 
                                                                    fontSize: 16,
                                                                    color: 'white',
                                                                    opacity: 0.9
                                                                }} />
                                                            ) : (
                                                                <DoneAllIcon sx={{ 
                                                                    fontSize: 16,
                                                                    color: 'white',
                                                                    opacity: 0.5
                                                                }} />
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>
                    <Box sx={{ 
                        p: 2, 
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(10px)',
                        flexShrink: 0
                    }}>
                        {imagePreview && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <Box sx={{ 
                                    mb: 2, 
                                    position: 'relative', 
                                    display: 'inline-block',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}>
                                    <Box 
                                        component="img" 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        sx={{ 
                                            maxWidth: 200,
                                            maxHeight: 150,
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
                                            '&:hover': {
                                                backgroundColor: 'rgba(0,0,0,0.8)'
                                            }
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </motion.div>
                        )}
                        {voiceBlob && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Box sx={{ 
                                    mb: 2, 
                                    p: 2,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    boxShadow: '0 4px 12px rgba(118, 75, 162, 0.2)'
                                }}>
                                    <MicIcon />
                                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                                        Voice message ({formatRecordingTime(recordingTime)})
                                    </Typography>
                                    <IconButton 
                                        size="small" 
                                        onClick={cancelVoiceRecording}
                                        sx={{ color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            </motion.div>
                        )}
                        {isRecording && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Box sx={{ 
                                    mb: 2, 
                                    p: 2,
                                    backgroundColor: '#ef5350',
                                    color: 'white',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    boxShadow: '0 4px 12px rgba(239, 83, 80, 0.3)'
                                }}>
                                    <MicIcon sx={{ animation: 'pulse 1.5s infinite' }} />
                                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                                        Recording... {formatRecordingTime(recordingTime)}
                                    </Typography>
                                    <IconButton 
                                        size="small" 
                                        onClick={stopRecording}
                                        sx={{ color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}
                                    >
                                        <StopIcon />
                                    </IconButton>
                                </Box>
                            </motion.div>
                        )}
                        <Box component="form" onSubmit={handleSendMessage} sx={{ 
                            display: 'flex', 
                            gap: 1,
                            alignItems: 'center',
                            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                            p: '8px 12px',
                            borderRadius: 4,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
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
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={sending || uploading}
                                        sx={{ 
                                            color: theme.palette.text.secondary,
                                            '&:hover': { color: theme.palette.primary.main, background: 'rgba(102, 126, 234, 0.1)' }
                                        }}
                                    >
                                        <ImageIcon />
                                    </IconButton>
                                    <IconButton 
                                        onClick={startRecording}
                                        disabled={sending || uploading || selectedFile}
                                        sx={{ 
                                            color: theme.palette.text.secondary,
                                            '&:hover': { color: '#ef5350', background: 'rgba(239, 83, 80, 0.1)' }
                                        }}
                                    >
                                        <MicIcon />
                                    </IconButton>
                                </>
                            )}
                            <TextField 
                                fullWidth 
                                placeholder={selectedFile ? "Add a caption..." : voiceBlob ? "Add a caption..." : "Type a message..."} 
                                value={newMessage} 
                                onChange={(e) => setNewMessage(e.target.value)} 
                                disabled={sending || uploading || isRecording} 
                                multiline 
                                maxRows={4}
                                variant="standard"
                                InputProps={{
                                    disableUnderline: true
                                }}
                                sx={{ 
                                    px: 1,
                                    '& .MuiInputBase-root': {
                                        fontSize: '0.95rem',
                                        padding: '4px 0'
                                    }
                                }}
                            />
                            <IconButton 
                                type="submit" 
                                disabled={(!newMessage.trim() && !selectedFile && !voiceBlob) || sending || uploading || isRecording}
                                sx={{ 
                                    bgcolor: (!newMessage.trim() && !selectedFile && !voiceBlob) ? 'action.disabledBackground' : 'primary.main',
                                    color: 'white',
                                    width: 40,
                                    height: 40,
                                    '&:hover': {
                                        bgcolor: 'primary.dark'
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: 'action.disabledBackground',
                                        color: 'action.disabled'
                                    },
                                    transition: 'all 0.2s'
                                }}
                            >
                                {(sending || uploading) ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                            </IconButton>
                        </Box>
                    </Box>
                    <ImageViewerDialog 
                        open={viewerOpen} 
                        imageUrl={viewerImage} 
                        onClose={() => setViewerOpen(false)} 
                    />
                    <Snackbar 
                        open={snackbar.open} 
                        autoHideDuration={6000} 
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                    >
                        <Alert 
                            onClose={() => setSnackbar({ ...snackbar, open: false })} 
                            severity={snackbar.severity}
                            sx={{ width: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        >
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Paper>
            </Box>
        </PageFade>
    );
}
