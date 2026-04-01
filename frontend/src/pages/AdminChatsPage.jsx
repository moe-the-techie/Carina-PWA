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
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
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
import PageErrorIndicator from '../components/PageErrorIndicator';
import { spacing, borderRadius, transitions, zIndex } from '../styles';
import { glassCard, glassInput, glassDialog } from '../styles/glassmorphism';
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
    clearCurrentlyViewingChat,
    isActivelyViewingChat
} from '../services/ablyService';
import { useUnreadCount } from '../contexts/UnreadCountContext';
import {
    getCachedChatState,
    cacheChatSnapshot,
    appendMessageToChatCache,
    shouldFetchMessagesFromServer
} from '../services/chatMessageCache';

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
    const [loadingVoice, setLoadingVoice] = useState({});
    const [audioProgress, setAudioProgress] = useState({});
    const [isDragging, setIsDragging] = useState(null);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const previousScrollHeight = useRef(0);
    const isLoadingOlderRef = useRef(false);
    const hasInitializedChat = useRef(false);
    const hasSubscribed = useRef(false);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRefs = useRef({});
    const selectedChatRef = useRef(selectedChat);
    const loadMessagesRequestRef = useRef(0);

    const mergeUniqueMessages = (currentMessages, incomingMessages) => {
        const byId = new Map();
        [...currentMessages, ...incomingMessages].forEach((msg) => {
            if (msg?._id) {
                byId.set(msg._id, msg);
            }
        });

        return Array.from(byId.values()).sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    };

    const sameChatId = (left, right) => {
        if (left === undefined || left === null || right === undefined || right === null) {
            return false;
        }
        return String(left).trim() === String(right).trim();
    };

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (messagesContainerRef.current && !isLoadingOlderRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        }, 100);
    };

    useEffect(() => {
        if (!isLoadingOlderRef.current) {
            scrollToBottom();
        }
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

    const loadMessages = async (chatId, options = {}) => {
        const requestId = ++loadMessagesRequestRef.current;
        const shouldShowLoading = options.silent !== true;
        if (shouldShowLoading) {
            setLoadingMessages(true);
        }

        setCurrentlyViewingChat(chatId);
        try {
            const cachedState = getCachedChatState(chatId);
            if (cachedState.hasMessages) {
                setMessages(cachedState.messages);
                setHasMoreMessages(cachedState.hasMore);
            } else {
                setMessages([]);
                setHasMoreMessages(true);
            }

            if (cachedState.hasMessages && options.forceSync !== true) {
                const online = typeof navigator === 'undefined' || navigator.onLine;
                if (online) {
                    await markMessagesAsRead(chatId);
                    setChats(prevChats =>
                        prevChats.map(chat =>
                            sameChatId(chat.chatId, chatId)
                                ? { ...chat, unreadByAdmins: 0 }
                                : chat
                        )
                    );
                    fetchUnreadCount();
                }

                setTimeout(() => scrollToBottom(), 50);
                return;
            }

            const online = typeof navigator === 'undefined' || navigator.onLine;
            const shouldFetch = shouldFetchMessagesFromServer(chatId, {
                forceSync: options.forceSync === true || !cachedState.hasMessages,
                maxServerSyncAgeMs: 60 * 1000,
                online
            });

            if (!shouldFetch) {
                if (online) {
                    await markMessagesAsRead(chatId);
                    setChats(prevChats =>
                        prevChats.map(chat =>
                            sameChatId(chat.chatId, chatId)
                                ? { ...chat, unreadByAdmins: 0 }
                                : chat
                        )
                    );
                    fetchUnreadCount();
                }

                // Ensure selected chat opens at the latest message even in cache-only path.
                setTimeout(() => scrollToBottom(), 50);
                return;
            }

            const response = await getMessages(chatId);

            // Ignore outdated responses when users switch chats quickly.
            if (requestId !== loadMessagesRequestRef.current || !sameChatId(selectedChatRef.current?.chatId, chatId)) {
                return;
            }

            setMessages(response.messages);
            setHasMoreMessages(response.hasMore !== false);
            cacheChatSnapshot(chatId, response.messages, {
                hasMore: response.hasMore !== false,
                serverSynced: true
            });
            await markMessagesAsRead(chatId);
            setChats(prevChats =>
                prevChats.map(chat =>
                    sameChatId(chat.chatId, chatId)
                        ? { ...chat, unreadByAdmins: 0 }
                        : chat
                )
            );
            // Refresh the global unread count
            fetchUnreadCount();
            // Scroll to bottom after loading messages
            setTimeout(() => scrollToBottom(), 200);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            if (shouldShowLoading && requestId === loadMessagesRequestRef.current) {
                setLoadingMessages(false);
            }
        }
    };

    const loadOlderMessages = async () => {
        if (loadingOlderMessages || !hasMoreMessages || !selectedChat || messages.length === 0) return;

        isLoadingOlderRef.current = true;
        setLoadingOlderMessages(true);
        try {
            const oldestMessage = messages[0];
            const messagesResponse = await getMessages(selectedChat.chatId, oldestMessage._id);
            
            if (messagesResponse.messages.length > 0) {
                const container = messagesContainerRef.current;
                if (container) {
                    previousScrollHeight.current = container.scrollHeight;
                }
                
                setMessages(prev => {
                    const nextMessages = mergeUniqueMessages(messagesResponse.messages, prev);
                    cacheChatSnapshot(selectedChat.chatId, nextMessages, {
                        hasMore: messagesResponse.hasMore !== false,
                        serverSynced: true
                    });
                    return nextMessages;
                });
                setHasMoreMessages(messagesResponse.hasMore !== false);
                
                // Maintain scroll position after prepending messages
                setTimeout(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - previousScrollHeight.current;
                    }
                    isLoadingOlderRef.current = false;
                }, 50);
            } else {
                setHasMoreMessages(false);
                isLoadingOlderRef.current = false;
            }
        } catch (error) {
            console.error('Error loading older messages:', error);
            isLoadingOlderRef.current = false;
        } finally {
            setLoadingOlderMessages(false);
        }
    };

    const handleScroll = (e) => {
        const container = e.target;
        // Load more messages when scrolled near the top (within 100px)
        if (container.scrollTop < 100 && !loadingOlderMessages && hasMoreMessages) {
            loadOlderMessages();
        }
    };

    const handleChatSelect = async (chat) => {
        selectedChatRef.current = chat;
        setSelectedChat(chat);
        setError('');
        
        // On mobile, immediately switch to chat view to show skeleton
        if (isMobile) {
            setShowChatView(true);
        }
        
        await loadMessages(chat.chatId);
    };

    const handleBackToList = () => {
        selectedChatRef.current = null;
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
            
            selectedChatRef.current = chatObject;
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
            
            let options = {};
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus' };
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' };
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const type = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type });
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

                const nextMessages = [...prev, response];
                cacheChatSnapshot(selectedChat.chatId, nextMessages, { serverSynced: true });
                return nextMessages;
            });
            setNewMessage('');
            handleRemoveImage();
            cancelVoiceRecording();
            // Scroll to bottom after sending message
            setTimeout(() => scrollToBottom(), 100);
            
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
                    
                    if (selectedChatRef.current && sameChatId(messageData.chatId, selectedChatRef.current.chatId) && messageData.readBy === 'user') {
                        setMessages(prev => 
                            prev.map(msg => ({
                                ...msg,
                                readByUser: true
                            }))
                        );
                    }
                    return;
                }

                appendMessageToChatCache(messageData.chatId, messageData, { serverSynced: true });

                // Update messages if this is the selected chat
                if (selectedChatRef.current && sameChatId(messageData.chatId, selectedChatRef.current.chatId)) {
                    setMessages(prev => {
                        const exists = prev.some(m => m._id === messageData._id);
                        if (exists) return prev;
                        return [...prev, messageData];
                    });

                    // Mark as read only when that chat is actively visible/focused.
                    if (isActivelyViewingChat(selectedChatRef.current.chatId)) {
                        markMessagesAsRead(selectedChatRef.current.chatId)
                            .then(() => {
                                // Refresh the global unread count after marking as read
                                fetchUnreadCount();
                            })
                            .catch(err => 
                                console.error('Error marking messages as read:', err)
                            );
                    }
                }

                // Update chat list
                setChats(prevChats => {
                    const chatExists = prevChats.some(chat => sameChatId(chat.chatId, messageData.chatId));

                    if (!chatExists && messageData.senderRole === 'user') {
                        const newChat = {
                            chatId: messageData.chatId,
                            user: messageData.senderId,
                            lastMessageAt: messageData.createdAt,
                            unreadByAdmins: messageData.unreadByAdmins,
                            lastMessage: {
                                content: messageData.content,
                                senderId: messageData.senderId,
                                senderRole: messageData.senderRole,
                                createdAt: messageData.createdAt
                            },
                            createdAt: messageData.createdAt
                        };
                        return [newChat, ...prevChats];
                    }

                    const updatedChats = prevChats.map(chat =>
                        sameChatId(chat.chatId, messageData.chatId)
                            ? {
                                ...chat,
                                lastMessage: {
                                    content: messageData.content,
                                    senderId: messageData.senderId,
                                    senderRole: messageData.senderRole,
                                    createdAt: messageData.createdAt
                                },
                                lastMessageAt: messageData.createdAt,
                                unreadByAdmins: messageData.senderRole === 'user' && (!selectedChatRef.current || !sameChatId(selectedChatRef.current.chatId, messageData.chatId))
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
    }, []);

    useEffect(() => {
        if (selectedChat?.chatId) {
            setCurrentlyViewingChat(selectedChat.chatId);
            return;
        }

        clearCurrentlyViewingChat();
    }, [selectedChat]);

    useEffect(() => {
        const syncViewingState = () => {
            const activeChatId = selectedChatRef.current?.chatId;
            const isVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
            const hasFocus = typeof document === 'undefined' || typeof document.hasFocus !== 'function' || document.hasFocus();

            if (activeChatId && isVisible && hasFocus) {
                setCurrentlyViewingChat(activeChatId);
            } else {
                clearCurrentlyViewingChat();
            }
        };

        const handleWindowBlur = () => clearCurrentlyViewingChat();
        const handlePageHide = () => clearCurrentlyViewingChat();

        document.addEventListener('visibilitychange', syncViewingState);
        window.addEventListener('focus', syncViewingState);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            document.removeEventListener('visibilitychange', syncViewingState);
            window.removeEventListener('focus', syncViewingState);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, []);

    useEffect(() => {
        const activeChatId = selectedChatRef.current?.chatId;
        if (!activeChatId) return;

        const handleRecoverySync = () => {
            const isVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
            const isOnline = typeof navigator === 'undefined' || navigator.onLine;

            if (!isVisible || !isOnline) {
                return;
            }

            loadMessages(activeChatId, { forceSync: true, silent: true }).catch((syncError) => {
                console.error('Error syncing selected chat after recovery:', syncError);
            });
        };

        window.addEventListener('online', handleRecoverySync);
        document.addEventListener('visibilitychange', handleRecoverySync);

        return () => {
            window.removeEventListener('online', handleRecoverySync);
            document.removeEventListener('visibilitychange', handleRecoverySync);
        };
    }, [selectedChat?.chatId]);

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

    useEffect(() => {
        if (selectedChat?.chatId && !loadingMessages) {
            setTimeout(() => scrollToBottom(), 50);
        }
    }, [selectedChat?.chatId, loadingMessages]);

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
                selectedChatRef.current = null;
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
        <Paper 
            component={motion.div}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            sx={{ 
                width: { xs: '100%', md: 350 },
                minWidth: { md: 350 },
                flexShrink: 0,
                display: 'flex', 
                flexDirection: 'column', 
                background: theme.palette.mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.6)' 
                    : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                height: '100%',
                borderRadius: { xs: 0, md: 3 },
                overflow: 'hidden'
            }}
        >
            <Box sx={{ 
                p: 2,
                flexShrink: 0,
                background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(10px)'
            }}>
                <Typography variant="h6" gutterBottom sx={{ 
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    mb: 2,
                    letterSpacing: 0.5
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
                        startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>),
                        disableUnderline: true
                    }}
                    variant="filled"
                    sx={{
                        '& .MuiFilledInput-root': {
                            borderRadius: 2,
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            },
                            '&.Mui-focused': {
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            }
                        }
                    }}
                />
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
                {filteredChats.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">No chats found</Typography>
                    </Box>
                ) : (
                    <>
                        {filteredChats.map((chat) => (
                            <ListItem key={chat.chatId} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    selected={selectedChat?.chatId === chat.chatId}
                                    onClick={() => handleChatSelect(chat)}
                                    sx={{ 
                                        p: 1.5,
                                        borderRadius: 2,
                                        transition: 'all 0.2s',
                                        '&.Mui-selected': {
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)',
                                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)',
                                            }
                                        },
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                            transform: 'translateX(4px)'
                                        }
                                    }}
                                >
                                    <Badge 
                                        badgeContent={chat.unreadByAdmins} 
                                        color="primary" 
                                        sx={{ 
                                            mr: 2,
                                            '& .MuiBadge-badge': {
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                            }
                                        }}
                                    >
                                        <Avatar 
                                            src={chat.user?.profileImageUrl}
                                            alt={chat.user?.name}
                                            sx={{ 
                                                width: 48, 
                                                height: 48,
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                cursor: chat.user?.profileImageUrl ? 'pointer' : 'default',
                                                border: `2px solid ${theme.palette.background.paper}`
                                            }}
                                            onClick={(e) => {
                                                if (chat.user?.profileImageUrl) {
                                                    e.stopPropagation();
                                                    handleImageClick(chat.user.profileImageUrl);
                                                }
                                            }}
                                        >
                                            {chat.user?.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                    </Badge>
                                    <ListItemText
                                        primary={
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontWeight: chat.unreadByAdmins > 0 ? 700 : 600,
                                                    color: theme.palette.text.primary
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
                                                    color="text.secondary" 
                                                    sx={{ 
                                                        display: 'block', 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap',
                                                        mt: 0.5,
                                                        fontWeight: chat.unreadByAdmins > 0 ? 500 : 400
                                                    }}
                                                >
                                                    {chat.lastMessage?.content || 'No messages yet'}
                                                </Typography>
                                                <Typography 
                                                    component="span" 
                                                    variant="caption" 
                                                    color="text.disabled"
                                                    sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}
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
                                    sx={{ borderRadius: 2 }}
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
        <Paper 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ 
                flexGrow: 1,
                minWidth: 0,
                display: 'flex', 
                flexDirection: 'column', 
                background: theme.palette.mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.6)' 
                    : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                width: { xs: '100%', md: 'auto' },
                height: '100%',
                borderRadius: { xs: 0, md: 3 },
                overflow: 'hidden'
            }}
        >
            {selectedChat ? (
                <>
                    {/* Chat Header */}
                    <Box sx={{ 
                        p: 2, 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        minHeight: 70,
                        flexShrink: 0,
                        background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {isMobile && (
                            <IconButton 
                                onClick={handleBackToList}
                                sx={{ 
                                    mr: 0.5,
                                    width: 40,
                                    height: 40,
                                    bgcolor: 'rgba(0,0,0,0.05)'
                                }}
                                aria-label="Back to chat list"
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        )}
                        <Avatar 
                            src={selectedChat.user?.profileImageUrl}
                            alt={selectedChat.user?.name}
                            sx={{ 
                                width: 45, 
                                height: 45,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                cursor: selectedChat.user?.profileImageUrl ? 'pointer' : 'default',
                                border: `2px solid ${theme.palette.background.paper}`
                            }}
                            onClick={() => {
                                if (selectedChat.user?.profileImageUrl) {
                                    handleImageClick(selectedChat.user.profileImageUrl);
                                }
                            }}
                        >
                            {selectedChat.user?.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="h6" sx={{ 
                                fontSize: '1.1rem',
                                fontWeight: 700,
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
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'block',
                                    fontWeight: 500
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
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                bgcolor: 'rgba(211, 47, 47, 0.1)',
                                '&:hover': {
                                    bgcolor: 'rgba(211, 47, 47, 0.2)'
                                }
                            }}
                            aria-label="Delete chat"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    
                    <Box 
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        sx={{ 
                            flexGrow: 1,
                            minHeight: 0,
                            overflow: 'auto',
                            overflowX: 'hidden', 
                            p: 3, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 2,
                            WebkitOverflowScrolling: 'touch'
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
                                                sx={{ borderRadius: 2 }}
                                            />
                                        </Box>
                                    </Box>
                                ))}
                            </>
                        ) : (
                            <>
                                {loadingOlderMessages && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                )}
                                <AnimatePresence>
                                {messages.map((message, index) => {
                            const isAdmin = message.senderRole === 'admin';
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
                                        justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                        marginBottom: 8
                                    }}
                                >
                                    <Box sx={{ 
                                        maxWidth: { xs: '85%', sm: '80%', md: '70%' },
                                        minWidth: 0,
                                        p: 2, 
                                        borderRadius: isAdmin ? '20px 20px 5px 20px' : '20px 20px 20px 5px', 
                                        background: isAdmin 
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                            : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                                        color: isAdmin ? 'white' : theme.palette.text.primary,
                                        boxShadow: isAdmin 
                                            ? '0 4px 15px rgba(118, 75, 162, 0.3)' 
                                            : '0 4px 15px rgba(0,0,0,0.05)',
                                        position: 'relative',
                                        backdropFilter: !isAdmin ? 'blur(10px)' : 'none',
                                        border: !isAdmin ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                    }}>
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
                                                        color: isAdmin ? 'white' : theme.palette.primary.main,
                                                        backgroundColor: isAdmin ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                                        '&:hover': {
                                                            backgroundColor: isAdmin ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
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
                                                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: isAdmin ? 'rgba(255,255,255,0.9)' : 'text.secondary' }}>
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
                                                            color: isAdmin ? 'rgba(255,255,255,0.9)' : theme.palette.primary.main,
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
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    opacity: 0.7,
                                                    fontSize: '0.7rem',
                                                    color: isAdmin ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                                                }}
                                            >
                                                {formatTime(message.createdAt)}
                                            </Typography>
                                            {isAdmin && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                                                    {message.readByUser ? (
                                                        <DoneAllIcon sx={{ 
                                                            fontSize: 16,
                                                            color: '#4ade80'
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
                            <div ref={messagesEndRef} />
                            </>
                        )}
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
                        <Box 
                            component="form" 
                            onSubmit={handleSendMessage} 
                            sx={{ 
                                display: 'flex', 
                                gap: 1,
                                alignItems: 'center',
                                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                                p: '8px 12px',
                                borderRadius: 4,
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)'
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
                </>
            ) : (
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: { xs: 2, sm: 3, md: 4 },
                    flexDirection: 'column',
                    gap: 2,
                    opacity: 0.7
                }}>
                    <SupportAgentIcon sx={{ fontSize: 60, color: theme.palette.text.disabled }} />
                    <Typography color="text.secondary" sx={{ 
                        fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                        textAlign: 'center',
                        fontWeight: 500
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
                height: '100%', 
                display: 'flex', 
                gap: { xs: 0, md: 2 }, 
                position: 'relative',
                overflow: 'hidden',
                p: { xs: 0, md: 3 },
                background: theme.palette.mode === 'dark' 
                    ? 'radial-gradient(circle at 50% 50%, #2d3748 0%, #1a202c 100%)' 
                    : 'radial-gradient(circle at 50% 50%, #f7fafc 0%, #edf2f7 100%)'
            }}>
                <PageErrorIndicator
                    error={error}
                    onClose={() => setError('')}
                    sx={{
                        position: 'absolute',
                        top: { xs: 10, md: 80 },
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        width: { xs: '90%', md: 'auto' },
                        mb: 0,
                    }}
                />
                
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
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)',
                        background: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)'
                    }
                }}
            >
                <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 700 }}>
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
                        sx={{ borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        disabled={deleting}
                        fullWidth={isMobile}
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                        sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)' }}
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
