import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Grid,
    FormControlLabel,
    Switch,
    Alert,
    Pagination,
    Skeleton
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Campaign as AnnouncementIcon,
    Groups as GroupsIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import PageErrorIndicator from '../components/PageErrorIndicator';
import ExpandableTextField from '../components/ExpandableTextField';
import { spacing, borderRadius, transitions, priorityColors as sharedPriorityColors } from '../styles';
import { glassCard, glassDialog } from '../styles/glassmorphism';
import { containerVariants, itemVariants } from '../styles/animations';
import {
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementStats
} from '../services/announcementService';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const priorityColors = {
    low: '#4caf50',
    normal: '#2196f3',
    high: '#ff9800',
    urgent: '#f44336'
};

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [statsDialogOpen, setStatsDialogOpen] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        priority: 'normal',
        targetAudience: 'all',
        targetClasses: [],
        expiresAt: null
    });
    
    const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
    const [announcementStats, setAnnouncementStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchAnnouncements();
        fetchClasses();
    }, [page, statusFilter]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await getAllAnnouncements(page, 10, statusFilter);
            setAnnouncements(response.announcements);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            setError('Failed to fetch announcements');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/classes`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setClasses(data.classes || []);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleCreateAnnouncement = async () => {
        try {
            if (!formData.title.trim() || !formData.message.trim()) {
                setError('Title and message are required');
                return;
            }

            await createAnnouncement(formData);
            setSuccess('Announcement created successfully');
            setCreateDialogOpen(false);
            resetForm();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error creating announcement:', error);
            setError(error.message || 'Failed to create announcement');
        }
    };

    const handleUpdateAnnouncement = async () => {
        try {
            if (!formData.title.trim() || !formData.message.trim()) {
                setError('Title and message are required');
                return;
            }

            await updateAnnouncement(currentAnnouncement._id, formData);
            setSuccess('Announcement updated successfully');
            setEditDialogOpen(false);
            resetForm();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error updating announcement:', error);
            setError(error.message || 'Failed to update announcement');
        }
    };

    const handleDeleteAnnouncement = async () => {
        try {
            await deleteAnnouncement(currentAnnouncement._id);
            setSuccess('Announcement deleted successfully');
            setDeleteDialogOpen(false);
            setCurrentAnnouncement(null);
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            setError(error.message || 'Failed to delete announcement');
        }
    };

    const handleViewStats = async (announcement) => {
        try {
            setStatsLoading(true);
            setStatsDialogOpen(true);
            setCurrentAnnouncement(announcement);
            setAnnouncementStats(null);
            const stats = await getAnnouncementStats(announcement._id);
            setAnnouncementStats(stats);
        } catch (error) {
            console.error('Error fetching announcement stats:', error);
            setError('Failed to fetch announcement statistics');
        } finally {
            setStatsLoading(false);
        }
    };

    const openEditDialog = (announcement) => {
        setCurrentAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            message: announcement.message,
            priority: announcement.priority,
            targetAudience: announcement.targetAudience,
            targetClasses: announcement.targetClasses.map(cls => cls._id),
            expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : null
        });
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (announcement) => {
        setCurrentAnnouncement(announcement);
        setDeleteDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            message: '',
            priority: 'normal',
            targetAudience: 'all',
            targetClasses: [],
            expiresAt: null
        });
        setCurrentAnnouncement(null);
    };

    const getPriorityColor = (priority) => {
        return priorityColors[priority] || priorityColors.normal;
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

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <PageFade>
                <Box sx={{ 
                    p: { xs: 2, sm: 3, md: 3 },
                    minHeight: '100vh'
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        mb: { xs: 2, sm: 3 },
                        gap: { xs: 2, sm: 0 }
                    }}>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                fontSize: { xs: '1.75rem', sm: '2.125rem' }
                            }}
                        >
                            <AnnouncementIcon sx={{ mr: 2, fontSize: { xs: '1.75rem', sm: '2.125rem' } }} />
                            Announcements
                        </Typography>
                    </Box>

                    <PageErrorIndicator error={error} onClose={() => setError('')} sx={{ mb: 2 }} />

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    <Grid 
                        container 
                        spacing={{ xs: 1, sm: 2 }} 
                        sx={{ 
                            mb: { xs: 2, sm: 3 },
                            alignItems: 'center'
                        }}
                    >
                        <Grid item xs={12} sm="auto">
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setCreateDialogOpen(true)}
                                size={window.innerWidth < 600 ? "small" : "medium"}
                                fullWidth={window.innerWidth < 600}
                                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                            >
                                {window.innerWidth < 600 ? 'New Announcement' : 'Create Announcement'}
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm="auto">
                            <FormControl 
                                size="small" 
                                sx={{ 
                                    minWidth: { xs: '100%', sm: 120 },
                                    width: { xs: '100%', sm: 'auto' }
                                }}
                            >
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* Desktop Table - Hidden on mobile */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Priority</TableCell>
                                        <TableCell>Target</TableCell>
                                        <TableCell>Author</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Read Count</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {announcements.map((announcement) => (
                                        <TableRow key={announcement._id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {announcement.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {announcement.message.substring(0, 60)}
                                                    {announcement.message.length > 60 ? '...' : ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={announcement.priority.toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getPriorityColor(announcement.priority),
                                                        color: 'white'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {announcement.targetAudience === 'all' ? (
                                                    <Chip
                                                        icon={<GroupsIcon />}
                                                        label="All Users"
                                                        size="small"
                                                        color="primary"
                                                    />
                                                ) : (
                                                    <Box>
                                                        <Chip
                                                            icon={<PersonIcon />}
                                                            label={`${announcement.targetClasses.length} Classes`}
                                                            size="small"
                                                            color="secondary"
                                                        />
                                                        <Typography variant="caption" display="block">
                                                            {announcement.targetClasses.map(cls => cls.name).join(', ')}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>{announcement.authorId?.name}</TableCell>
                                            <TableCell>{formatDate(announcement.createdAt)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={announcement.isActive ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    color={announcement.isActive ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>{announcement.readCount || 0}</TableCell>
                                            <TableCell>
                                                <Tooltip title="View Statistics">
                                                    <IconButton onClick={() => handleViewStats(announcement)} size="small">
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton onClick={() => openEditDialog(announcement)} size="small">
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton 
                                                        onClick={() => openDeleteDialog(announcement)} 
                                                        size="small"
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Mobile Cards - Hidden on desktop */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        {announcements.map((announcement) => (
                            <Card key={announcement._id} sx={{ mb: 2 }}>
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                    {/* Header */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'flex-start',
                                        mb: 2
                                    }}>
                                        <Box sx={{ flex: 1, mr: 2 }}>
                                            <Typography 
                                                variant="h6" 
                                                fontWeight="medium"
                                                sx={{ 
                                                    fontSize: { xs: '1rem', sm: '1.125rem' },
                                                    lineHeight: 1.3,
                                                    mb: 0.5
                                                }}
                                            >
                                                {announcement.title}
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                            >
                                                {announcement.message.substring(0, 100)}
                                                {announcement.message.length > 100 ? '...' : ''}
                                            </Typography>
                                        </Box>
                                        
                                        <Chip
                                            label={announcement.priority.toUpperCase()}
                                            size="small"
                                            sx={{
                                                bgcolor: getPriorityColor(announcement.priority),
                                                color: 'white',
                                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                                minWidth: 'fit-content'
                                            }}
                                        />
                                    </Box>

                                    {/* Meta Information */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexWrap: 'wrap',
                                        gap: { xs: 1, sm: 2 },
                                        mb: 2
                                    }}>
                                        {announcement.targetAudience === 'all' ? (
                                            <Chip
                                                icon={<GroupsIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                                                label="All Users"
                                                size="small"
                                                color="primary"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                            />
                                        ) : (
                                            <Chip
                                                icon={<PersonIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                                                label={`${announcement.targetClasses.length} Classes`}
                                                size="small"
                                                color="secondary"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                            />
                                        )}
                                        
                                        <Chip
                                            label={announcement.isActive ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={announcement.isActive ? 'success' : 'default'}
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                        />
                                        
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                            }}
                                        >
                                            Read: {announcement.readCount || 0}
                                        </Typography>
                                    </Box>

                                    {/* Footer */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: { xs: 1, sm: 0 }
                                    }}>
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                        >
                                            {announcement.authorId?.name} • {formatDate(announcement.createdAt)}
                                        </Typography>
                                        
                                        <Box sx={{ 
                                            display: 'flex',
                                            gap: 0.5,
                                            alignSelf: { xs: 'stretch', sm: 'auto' },
                                            justifyContent: { xs: 'space-evenly', sm: 'flex-end' }
                                        }}>
                                            <IconButton 
                                                onClick={() => handleViewStats(announcement)} 
                                                size="small"
                                                sx={{ p: { xs: 1, sm: 1 } }}
                                            >
                                                <ViewIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                                            </IconButton>
                                            <IconButton 
                                                onClick={() => openEditDialog(announcement)} 
                                                size="small"
                                                sx={{ p: { xs: 1, sm: 1 } }}
                                            >
                                                <EditIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                                            </IconButton>
                                            <IconButton 
                                                onClick={() => openDeleteDialog(announcement)} 
                                                size="small"
                                                color="error"
                                                sx={{ p: { xs: 1, sm: 1 } }}
                                            >
                                                <DeleteIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    
                                    {/* Show target classes for mobile if not all users */}
                                    {announcement.targetAudience !== 'all' && announcement.targetClasses.length > 0 && (
                                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary" 
                                                display="block"
                                                sx={{ mb: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                            >
                                                Target Classes:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {announcement.targetClasses.map((cls) => (
                                                    <Chip
                                                        key={cls._id}
                                                        label={cls.name}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: cls.color + '20',
                                                            color: cls.color,
                                                            border: `1px solid ${cls.color}40`,
                                                            fontSize: { xs: '0.65rem', sm: '0.7rem' }
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    {totalPages > 1 && (
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            mt: { xs: 2, sm: 3 },
                            px: { xs: 1, sm: 0 }
                        }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(e, value) => setPage(value)}
                                color="primary"
                                size={window.innerWidth < 600 ? "small" : "medium"}
                                siblingCount={window.innerWidth < 600 ? 0 : 1}
                                boundaryCount={window.innerWidth < 600 ? 1 : 2}
                            />
                        </Box>
                    )}

                    {/* Create/Edit Dialog */}
                    <Dialog 
                        open={createDialogOpen || editDialogOpen} 
                        onClose={() => {
                            setCreateDialogOpen(false);
                            setEditDialogOpen(false);
                            resetForm();
                        }}
                        maxWidth="md"
                        fullWidth
                        fullScreen={window.innerWidth < 600}
                        sx={{ '& .MuiDialog-paper': { margin: { xs: 1, sm: 2 } } }}
                    >
                        <DialogTitle sx={{ 
                            fontSize: { xs: '1.125rem', sm: '1.25rem' },
                            pb: { xs: 1, sm: 2 }
                        }}>
                            {createDialogOpen ? 'Create Announcement' : 'Edit Announcement'}
                        </DialogTitle>
                        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                            <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mt: { xs: 0.5, sm: 1 } }}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        size={window.innerWidth < 600 ? "small" : "medium"}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <ExpandableTextField
                                        fullWidth
                                        label="Message"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        compactRows={2}
                                        expandedRows={window.innerWidth < 600 ? 10 : 12}
                                        dialogTitle="Announcement Message"
                                        required
                                        size={window.innerWidth < 600 ? "small" : "medium"}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size={window.innerWidth < 600 ? "small" : "medium"}>
                                        <InputLabel>Priority</InputLabel>
                                        <Select
                                            value={formData.priority}
                                            label="Priority"
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <MenuItem value="low">Low</MenuItem>
                                            <MenuItem value="normal">Normal</MenuItem>
                                            <MenuItem value="high">High</MenuItem>
                                            <MenuItem value="urgent">Urgent</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size={window.innerWidth < 600 ? "small" : "medium"}>
                                        <InputLabel>Target Audience</InputLabel>
                                        <Select
                                            value={formData.targetAudience}
                                            label="Target Audience"
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                targetAudience: e.target.value,
                                                targetClasses: e.target.value === 'all' ? [] : formData.targetClasses
                                            })}
                                        >
                                            <MenuItem value="all">All Users</MenuItem>
                                            <MenuItem value="classes">Specific Classes</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {formData.targetAudience === 'classes' && (
                                    <Grid item xs={12}>
                                        <FormControl fullWidth size={window.innerWidth < 600 ? "small" : "medium"}>
                                            <InputLabel>Target Classes</InputLabel>
                                            <Select
                                                multiple
                                                value={formData.targetClasses}
                                                label="Target Classes"
                                                onChange={(e) => setFormData({ ...formData, targetClasses: e.target.value })}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((value) => {
                                                            const cls = classes.find(c => c._id === value);
                                                            return (
                                                                <Chip 
                                                                    key={value} 
                                                                    label={cls?.name || value}
                                                                    size={window.innerWidth < 600 ? "small" : "small"}
                                                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                                />
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            >
                                                {classes.map((cls) => (
                                                    <MenuItem key={cls._id} value={cls._id}>
                                                        {cls.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <DateTimePicker
                                        label="Expires At (Optional)"
                                        value={formData.expiresAt}
                                        onChange={(newValue) => setFormData({ ...formData, expiresAt: newValue })}
                                        renderInput={(params) => <TextField {...params} fullWidth size={window.innerWidth < 600 ? "small" : "medium"} />}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ 
                            px: { xs: 2, sm: 3 },
                            pb: { xs: 2, sm: 3 },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1, sm: 0 }
                        }}>
                            <Button 
                                onClick={() => {
                                    setCreateDialogOpen(false);
                                    setEditDialogOpen(false);
                                    resetForm();
                                }}
                                size={window.innerWidth < 600 ? "small" : "medium"}
                                fullWidth={window.innerWidth < 600}
                                sx={{ order: { xs: 2, sm: 1 } }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={createDialogOpen ? handleCreateAnnouncement : handleUpdateAnnouncement}
                                variant="contained"
                                size={window.innerWidth < 600 ? "small" : "medium"}
                                fullWidth={window.innerWidth < 600}
                                sx={{ order: { xs: 1, sm: 2 } }}
                            >
                                {createDialogOpen ? 'Create' : 'Update'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Delete Dialog */}
                    <Dialog 
                        open={deleteDialogOpen} 
                        onClose={() => setDeleteDialogOpen(false)}
                        maxWidth="sm"
                        fullWidth
                        fullScreen={window.innerWidth < 600}
                        sx={{ '& .MuiDialog-paper': { margin: { xs: 1, sm: 2 } } }}
                    >
                        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                            Delete Announcement
                        </DialogTitle>
                        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                Are you sure you want to delete the announcement "{currentAnnouncement?.title}"?
                                This action cannot be undone.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ 
                            px: { xs: 2, sm: 3 },
                            pb: { xs: 2, sm: 3 },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1, sm: 0 }
                        }}>
                            <Button 
                                onClick={() => setDeleteDialogOpen(false)}
                                size={window.innerWidth < 600 ? "small" : "medium"}
                                fullWidth={window.innerWidth < 600}
                                sx={{ order: { xs: 2, sm: 1 } }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleDeleteAnnouncement} 
                                color="error" 
                                variant="contained"
                                size={window.innerWidth < 600 ? "small" : "medium"}
                                fullWidth={window.innerWidth < 600}
                                sx={{ order: { xs: 1, sm: 2 } }}
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Statistics Dialog */}
                    <Dialog 
                        open={statsDialogOpen} 
                        onClose={() => setStatsDialogOpen(false)}
                        maxWidth="md"
                        fullWidth
                        fullScreen={window.innerWidth < 600}
                        sx={{ '& .MuiDialog-paper': { margin: { xs: 1, sm: 2 } } }}
                    >
                        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                            Announcement Statistics
                        </DialogTitle>
                        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                            {statsLoading ? (
                                <Grid container spacing={{ xs: 2, sm: 3 }}>
                                    <Grid item xs={12}>
                                        <Skeleton variant="text" width="60%" height={32} />
                                        <Skeleton variant="text" width="90%" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Card>
                                            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                                <Skeleton variant="text" width="40%" height={60} />
                                                <Skeleton variant="text" width="60%" />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card>
                                            <CardContent>
                                                <Skeleton variant="text" width="40%" height={60} />
                                                <Skeleton variant="text" width="60%" />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent>
                                                <Skeleton variant="text" width="40%" height={60} />
                                                <Skeleton variant="text" width="60%" />
                                                <Skeleton variant="text" width="30%" />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            ) : announcementStats && (
                                <Grid container spacing={{ xs: 2, sm: 3 }}>
                                    <Grid item xs={12}>
                                        <Typography 
                                            variant="h6"
                                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                        >
                                            {announcementStats.announcement.title}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                        >
                                            {announcementStats.announcement.message}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Card>
                                            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                                <Typography variant="h4" color="primary">
                                                    {announcementStats.stats.readCount}
                                                </Typography>
                                                <Typography variant="body2">Users Read</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h4" color="error">
                                                    {announcementStats.stats.unreadCount}
                                                </Typography>
                                                <Typography variant="body2">Users Unread</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h4" color="success.main">
                                                    {announcementStats.stats.readPercentage}%
                                                </Typography>
                                                <Typography variant="body2">Read Percentage</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {announcementStats.stats.readCount} of {announcementStats.stats.targetUsersCount} users
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
                        </DialogActions>
                    </Dialog>

                    <LoadingBackdrop open={loading} />
                </Box>
            </PageFade>
        </LocalizationProvider>
    );
}