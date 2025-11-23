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
            <Container maxWidth="md" sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Badge badgeContent={unreadCount} color="error" sx={{ mr: 2 }}>
                        <AnnouncementIcon />
                    </Badge>
                    <Typography variant="h4">
                        Announcements
                    </Typography>
                    {unreadCount > 0 && (
                        <Chip
                            label={`${unreadCount} unread`}
                            color="error"
                            size="small"
                            sx={{ ml: 2 }}
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
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <AnnouncementIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No announcements yet
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Check back later for updates from administrators
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ) : (
                    <Grid container spacing={3}>
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
                                        }}
                                    >
                                        {!announcement.isRead && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    bgcolor: 'error.main',
                                                    zIndex: 1
                                                }}
                                            />
                                        )}
                                        
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="h6" component="div">
                                                        {announcement.title}
                                                    </Typography>
                                                    
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                        <Chip
                                                            label={announcement.priority.toUpperCase()}
                                                            size="small"
                                                            color={priorityColors[announcement.priority]}
                                                        />
                                                        
                                                        {announcement.authorId && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <PersonIcon sx={{ fontSize: 16 }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {announcement.authorId.name}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <ScheduleIcon sx={{ fontSize: 16 }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatDate(announcement.createdAt)}
                                                            </Typography>
                                                        </Box>
                                                        
                                                        {announcement.isRead && (
                                                            <Chip
                                                                icon={<CheckIcon />}
                                                                label="Read"
                                                                size="small"
                                                                color="success"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                        
                                                        {expired && (
                                                            <Chip
                                                                label="Expired"
                                                                size="small"
                                                                color="default"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                                
                                                <IconButton
                                                    onClick={() => handleExpandClick(announcement._id)}
                                                    aria-expanded={isCardExpanded}
                                                    aria-label="show more"
                                                >
                                                    {isCardExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Box>

                                            <Collapse in={isCardExpanded} timeout="auto" unmountOnExit>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {announcement.message}
                                                </Typography>
                                                
                                                {announcement.targetClasses && announcement.targetClasses.length > 0 && (
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Target Classes:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                            {announcement.targetClasses.map((cls) => (
                                                                <Chip
                                                                    key={cls._id}
                                                                    label={cls.name}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: cls.color + '20',
                                                                        color: cls.color,
                                                                        border: `1px solid ${cls.color}40`
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                                
                                                {announcement.expiresAt && (
                                                    <Typography variant="caption" color="text.secondary">
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
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        mt: 1
                                                    }}
                                                >
                                                    {announcement.message}
                                                </Typography>
                                            )}
                                        </CardContent>

                                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                                            {!announcement.isRead && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleMarkAsRead(announcement._id)}
                                                    startIcon={<CheckIcon />}
                                                >
                                                    Mark as Read
                                                </Button>
                                            )}
                                            <Button
                                                size="small"
                                                onClick={() => handleExpandClick(announcement._id)}
                                            >
                                                {isCardExpanded ? 'Show Less' : 'Show More'}
                                            </Button>
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