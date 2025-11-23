import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Alert,
    Container,
    Grid,
    IconButton,
    Collapse,
    Avatar,
    Pagination,
    Badge,
    Skeleton
} from '@mui/material';
import {
    Campaign as AnnouncementIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    CheckCircle as CheckIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';
import {
    getUserAnnouncements,
    markAnnouncementAsRead,
    getUnreadAnnouncementsCount
} from '../services/announcementService';
import { subscribeToAnnouncements } from '../services/ablyService';
import { useAnnouncementNotifications } from '../contexts/AnnouncementNotificationContext';

const priorityColors = {
    low: 'success',
    normal: 'info',
    high: 'warning',
    urgent: 'error'
};

export default function AnnouncementsPage({ user }) {
    const theme = useTheme();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [page, setPage] = useState(1);
    const { unreadCount, markAnnouncementAsRead: contextMarkAsRead } = useAnnouncementNotifications();

    useEffect(() => {
        fetchAnnouncements();
        
        // Subscribe to real-time announcement updates
        if (user?._id) {
            subscribeToAnnouncements(user._id, handleNewAnnouncement);
        }

        // Request notification permissions for push notifications
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }

        // Register for service worker messages (push notifications)
        const handleServiceWorkerMessage = (event) => {
            if (event.data.type === 'ANNOUNCEMENT_NOTIFICATION_CLICKED') {
                // Handle notification click if needed
                console.log('Announcement notification clicked:', event.data);
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }

        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            }
        };
    }, [user]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await getUserAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            setError('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const { unreadCount } = await getUnreadAnnouncementsCount();
            setUnreadCount(unreadCount);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleNewAnnouncement = (announcementData) => {
        // Add new announcement to the top of the list
        setAnnouncements(prev => [
            { ...announcementData, isRead: false },
            ...prev
        ]);
    };

    const handleMarkAsRead = async (announcementId) => {
        try {
            await markAnnouncementAsRead(announcementId);
            
            // Update local state
            setAnnouncements(prev =>
                prev.map(announcement =>
                    announcement._id === announcementId
                        ? { ...announcement, isRead: true }
                        : announcement
                )
            );
            
            // Update context unread count
            contextMarkAsRead();
        } catch (error) {
            console.error('Error marking announcement as read:', error);
            setError('Failed to mark announcement as read');
        }
    };

    const handleExpandClick = (announcementId) => {
        setExpandedCards(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(announcementId)) {
                newExpanded.delete(announcementId);
            } else {
                newExpanded.add(announcementId);
            }
            return newExpanded;
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isExpired = (announcement) => {
        return announcement.expiresAt && new Date(announcement.expiresAt) < new Date();
    };

    const LoadingSkeleton = () => (
        <Grid container spacing={3}>
            {[1, 2, 3].map((item) => (
                <Grid item xs={12} key={item}>
                    <Card>
                        <CardContent>
                            <Skeleton variant="text" width="40%" height={40} />
                            <Skeleton variant="text" width="20%" height={20} sx={{ mb: 2 }} />
                            <Skeleton variant="text" width="100%" height={20} />
                            <Skeleton variant="text" width="80%" height={20} />
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    if (loading) {
        return (
            <PageFade>
                <Container maxWidth="md" sx={{ py: 3 }}>
                    <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <AnnouncementIcon sx={{ mr: 2 }} />
                        Announcements
                    </Typography>
                    <LoadingSkeleton />
                </Container>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2, md: 3 }, px: { xs: 1, sm: 2 } }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 2 },
                    textAlign: { xs: 'center', sm: 'left' }
                }}>
                    <Badge badgeContent={unreadCount} color="error" sx={{ mr: { xs: 0, sm: 2 } }}>
                        <AnnouncementIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                    </Badge>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        Announcements
                    </Typography>
                    {unreadCount > 0 && (
                        <Chip
                            label={`${unreadCount} unread`}
                            color="error"
                            size="small"
                            sx={{ ml: { xs: 0, sm: 2 } }}
                        />
                    )}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {announcements.length === 0 ? (
                    <Card>
                        <CardContent>
                            <Box sx={{ 
                                textAlign: 'center', 
                                py: { xs: 3, sm: 4 },
                                px: { xs: 2, sm: 3 }
                            }}>
                                <AnnouncementIcon sx={{ 
                                    fontSize: { xs: 48, sm: 64 }, 
                                    color: 'text.secondary', 
                                    mb: { xs: 1, sm: 2 } 
                                }} />
                                <Typography 
                                    variant="h6" 
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    No announcements yet
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ mt: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                >
                                    Check back later for updates from administrators
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ) : (
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                        {announcements.map((announcement) => {
                            const isCardExpanded = expandedCards.has(announcement._id);
                            const expired = isExpired(announcement);
                            
                            return (
                                <Grid item xs={12} key={announcement._id}>
                                    <Card
                                        sx={{
                                            position: 'relative',
                                            opacity: expired ? 0.6 : 1,
                                            border: !announcement.isRead ? `2px solid ${theme.palette.primary.main}` : 'none',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: theme.shadows[4]
                                            }
                                        }}
                                    >
                                        {!announcement.isRead && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: { xs: 6, sm: 8 },
                                                    right: { xs: 6, sm: 8 },
                                                    width: { xs: 8, sm: 12 },
                                                    height: { xs: 8, sm: 12 },
                                                    borderRadius: '50%',
                                                    bgcolor: 'error.main',
                                                    zIndex: 1
                                                }}
                                            />
                                        )}
                                        
                                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start', 
                                                mb: { xs: 1.5, sm: 2 },
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                gap: { xs: 1, sm: 2 }
                                            }}>
                                                <Box sx={{ flexGrow: 1, width: '100%' }}>
                                                    <Typography 
                                                        variant="h6" 
                                                        component="div"
                                                        sx={{ 
                                                            fontSize: { xs: '1rem', sm: '1.25rem' },
                                                            lineHeight: 1.3,
                                                            mb: { xs: 1, sm: 1.5 }
                                                        }}
                                                    >
                                                        {announcement.title}
                                                    </Typography>
                                                    
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: { xs: 0.5, sm: 1 }, 
                                                        flexWrap: 'wrap',
                                                        '& > *': {
                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                        }
                                                    }}>
                                                        <Chip
                                                            label={announcement.priority.toUpperCase()}
                                                            size="small"
                                                            color={priorityColors[announcement.priority]}
                                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                        />
                                                        
                                                        {announcement.authorId && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <PersonIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                                                                <Typography 
                                                                    variant="caption" 
                                                                    color="text.secondary"
                                                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                                >
                                                                    {announcement.authorId.name}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <ScheduleIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                                                            <Typography 
                                                                variant="caption" 
                                                                color="text.secondary"
                                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                            >
                                                                {formatDate(announcement.createdAt)}
                                                            </Typography>
                                                        </Box>
                                                        
                                                        {announcement.isRead && (
                                                            <Chip
                                                                icon={<CheckIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }} />}
                                                                label="Read"
                                                                size="small"
                                                                color="success"
                                                                variant="outlined"
                                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                            />
                                                        )}
                                                        
                                                        {expired && (
                                                            <Chip
                                                                label="Expired"
                                                                size="small"
                                                                color="default"
                                                                variant="outlined"
                                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                                
                                                <IconButton
                                                    onClick={() => handleExpandClick(announcement._id)}
                                                    aria-expanded={isCardExpanded}
                                                    aria-label="show more"
                                                    size={window.innerWidth < 600 ? "small" : "medium"}
                                                    sx={{ 
                                                        alignSelf: { xs: 'flex-end', sm: 'flex-start' },
                                                        mt: { xs: 0, sm: -1 }
                                                    }}
                                                >
                                                    {isCardExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Box>

                                            <Collapse in={isCardExpanded} timeout="auto" unmountOnExit>
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary" 
                                                    sx={{ 
                                                        mb: { xs: 1.5, sm: 2 },
                                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                                        lineHeight: 1.5
                                                    }}
                                                >
                                                    {announcement.message}
                                                </Typography>
                                                
                                                {announcement.targetClasses && announcement.targetClasses.length > 0 && (
                                                    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                                                        <Typography 
                                                            variant="caption" 
                                                            color="text.secondary" 
                                                            display="block"
                                                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                                        >
                                                            Target Classes:
                                                        </Typography>
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            flexWrap: 'wrap', 
                                                            gap: { xs: 0.5, sm: 0.5 }, 
                                                            mt: { xs: 0.5, sm: 0.5 } 
                                                        }}>
                                                            {announcement.targetClasses.map((cls) => (
                                                                <Chip
                                                                    key={cls._id}
                                                                    label={cls.name}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: cls.color + '20',
                                                                        color: cls.color,
                                                                        border: `1px solid ${cls.color}40`,
                                                                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                                
                                                {announcement.expiresAt && (
                                                    <Typography 
                                                        variant="caption" 
                                                        color="text.secondary"
                                                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                                    >
                                                        Expires: {formatDate(announcement.expiresAt)}
                                                    </Typography>
                                                )}
                                            </Collapse>

                                            {!isCardExpanded && (
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary"
                                                    sx={{ 
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: { xs: 2, sm: 3 },
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        mt: { xs: 1, sm: 1 },
                                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                                        lineHeight: 1.4
                                                    }}
                                                >
                                                    {announcement.message}
                                                </Typography>
                                            )}
                                        </CardContent>

                                        <CardActions sx={{ 
                                            justifyContent: 'space-between',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            gap: { xs: 1, sm: 0 },
                                            p: { xs: 2, sm: 2 },
                                            pt: 0
                                        }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                gap: 1, 
                                                width: { xs: '100%', sm: 'auto' },
                                                justifyContent: { xs: 'space-between', sm: 'flex-start' }
                                            }}>
                                                {!announcement.isRead && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => handleMarkAsRead(announcement._id)}
                                                        startIcon={<CheckIcon />}
                                                        sx={{ 
                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                            minWidth: { xs: 'auto', sm: 64 }
                                                        }}
                                                    >
                                                        {window.innerWidth < 600 ? 'Read' : 'Mark as Read'}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="small"
                                                    onClick={() => handleExpandClick(announcement._id)}
                                                    sx={{ 
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                        minWidth: { xs: 'auto', sm: 64 }
                                                    }}
                                                >
                                                    {isCardExpanded ? 'Less' : 'More'}
                                                </Button>
                                            </Box>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Container>
        </PageFade>
    );
}