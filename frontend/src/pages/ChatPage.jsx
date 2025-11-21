import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    CircularProgress,
    Chip,
    Snackbar,
    Alert
} from '@mui/material';
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
    uploadVoice
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
        const audio = audioRefs.current[messageId];
        
        if (!audio) {
            try {
                const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const token = localStorage.getItem('token');
                
                const response = await fetch(`${API_URL}/api/chat/voice/${messageId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch voice audio');
                }
                
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                const newAudio = new Audio(audioUrl);
                audioRefs.current[messageId] = newAudio;
                
                newAudio.onended = () => {
                    setPlayingVoice(prev => ({ ...prev, [messageId]: false }));
                };
                
                newAudio.onerror = (e) => {
                    console.error('Error playing audio:', e);
                    setSnackbar({ open: true, message: 'Failed to play voice message', severity: 'error' });
                    setPlayingVoice(prev => ({ ...prev, [messageId]: false }));
                };
                
                await newAudio.play();
                setPlayingVoice(prev => ({ ...prev, [messageId]: true }));
            } catch (err) {
                console.error('Error loading/playing audio:', err);
                setSnackbar({ open: true, message: 'Failed to play voice message', severity: 'error' });
            }
        } else {
            if (playingVoice[messageId]) {
                audio.pause();
                setPlayingVoice(prev => ({ ...prev, [messageId]: false }));
            } else {
                audio.play();
                setPlayingVoice(prev => ({ ...prev, [messageId]: true }));
            }
        }
    };

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
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
                    <CircularProgress />
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box sx={{ 
                height: { xs: 'calc(100vh - 60px)', sm: 'calc(100vh - 60px)', md: 'calc(100vh - 10vh - 48px)' }, 
                display: 'flex', 
                justifyContent: 'center', 
                p: { xs: 0, sm: 1, md: 2 },
                overflow: 'hidden'
            }}>
                <Paper sx={{ 
                    width: '100%', 
                    maxWidth: { xs: '100%', md: 800 },
                    display: 'flex', 
                    flexDirection: 'column', 
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: { xs: 0, sm: 2, md: 1 },
                    overflow: 'hidden'
                }}>
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
                        <Avatar sx={{ 
                            bgcolor: theme.palette.primary.main,
                            width: { xs: 36, sm: 38, md: 40 },
                            height: { xs: 36, sm: 38, md: 40 }
                        }}>
                            <SupportAgentIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" sx={{ 
                                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.25rem' },
                                fontWeight: 600
                            }}>
                                Chat with Carina
                            </Typography>
                            <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.725rem', md: '0.75rem' },
                                    display: { xs: 'none', sm: 'block' }
                                }}
                            >
                                Send us a message and we'll get back to you soon
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ 
                        flexGrow: 1, 
                        overflow: 'auto', 
                        overflowX: 'hidden',
                        p: { xs: 1, sm: 1.5, md: 2 }, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: { xs: 0.75, md: 1 },
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
                                gap: { xs: 1.5, md: 2 },
                                p: { xs: 2, sm: 3, md: 4 }
                            }}>
                                <SupportAgentIcon sx={{ 
                                    fontSize: { xs: 48, sm: 54, md: 60 }, 
                                    color: theme.palette.grey[400] 
                                }} />
                                <Typography 
                                    color="text.secondary" 
                                    align="center" 
                                    sx={{ 
                                        fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                                        px: 2
                                    }}
                                >
                                    No messages yet. Start a conversation with Carina!
                                </Typography>
                            </Box>
                        ) : (
                            messages.map((message, index) => {
                                const isUser = message.senderRole === 'user';
                                const isImage = message.messageType === 'image';
                                const isVoice = message.messageType === 'voice';
                                return (
                                    <Box key={message._id || index} sx={{ 
                                        display: 'flex', 
                                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                                        mb: 0.5
                                    }}>
                                        <Box sx={{ 
                                            maxWidth: { xs: '85%', sm: '80%', md: '70%' }, 
                                            p: { xs: 1.25, sm: 1.375, md: 1.5 }, 
                                            borderRadius: { xs: 2.5, md: 2 },
                                            backgroundColor: isUser 
                                                ? theme.palette.primary.main 
                                                : theme.palette.mode === 'dark' 
                                                    ? theme.palette.grey[800] 
                                                    : theme.palette.grey[200], 
                                            color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word'
                                        }}>
                                            {!isUser && (
                                                <Chip 
                                                    label="Carina" 
                                                    size="small" 
                                                    sx={{ 
                                                        mb: 0.5, 
                                                        height: { xs: 20, sm: 22, md: 24 }, 
                                                        backgroundColor: 'rgba(0,0,0,0.1)',
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
                                                            color: isUser ? 'white' : theme.palette.primary.main,
                                                            backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                                            '&:hover': {
                                                                backgroundColor: isUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                                                            }
                                                        }}
                                                    >
                                                        {playingVoice[message._id] ? <PauseIcon /> : <PlayArrowIcon />}
                                                    </IconButton>
                                                    <Box sx={{ 
                                                        flex: 1, 
                                                        height: 4, 
                                                        backgroundColor: isUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                                                        borderRadius: 2,
                                                        minWidth: 100
                                                    }} />
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
                                                                color: isUser ? 'rgba(255,255,255,0.9)' : theme.palette.primary.main,
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
                                                <Typography variant="caption" sx={{ 
                                                    opacity: 0.7,
                                                    fontSize: { xs: '0.7rem', sm: '0.725rem', md: '0.75rem' },
                                                    lineHeight: 1
                                                }}>
                                                    {formatTime(message.createdAt)}
                                                </Typography>
                                                {isUser && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                                                        {message.readByAdmins ? (
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
                            })
                        )}
                        <div ref={messagesEndRef} />
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
                        <Box component="form" onSubmit={handleSendMessage} sx={{ 
                            display: 'flex', 
                            gap: { xs: 0.75, md: 1 },
                            alignItems: 'flex-end'
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
                            sx={{ width: '100%' }}
                        >
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Paper>
            </Box>
        </PageFade>
    );
}
