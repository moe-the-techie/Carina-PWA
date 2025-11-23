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
    Pagination
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
            setCurrentAnnouncement(announcement);
            const stats = await getAnnouncementStats(announcement._id);
            setAnnouncementStats(stats);
            setStatsDialogOpen(true);
        } catch (error) {
            console.error('Error fetching announcement stats:', error);
            setError('Failed to fetch announcement statistics');
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
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <AnnouncementIcon sx={{ mr: 2 }} />
                        Announcements
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setCreateDialogOpen(true)}
                            >
                                Create Announcement
                            </Button>
                        </Grid>
                        <Grid item>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
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

                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(e, value) => setPage(value)}
                                color="primary"
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
                    >
                        <DialogTitle>
                            {createDialogOpen ? 'Create Announcement' : 'Edit Announcement'}
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Message"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        multiline
                                        rows={4}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
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
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
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
                                        <FormControl fullWidth>
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
                                                                    size="small"
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
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button 
                                onClick={() => {
                                    setCreateDialogOpen(false);
                                    setEditDialogOpen(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={createDialogOpen ? handleCreateAnnouncement : handleUpdateAnnouncement}
                                variant="contained"
                            >
                                {createDialogOpen ? 'Create' : 'Update'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Delete Dialog */}
                    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                        <DialogTitle>Delete Announcement</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Are you sure you want to delete the announcement "{currentAnnouncement?.title}"?
                                This action cannot be undone.
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleDeleteAnnouncement} color="error" variant="contained">
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
                    >
                        <DialogTitle>Announcement Statistics</DialogTitle>
                        <DialogContent>
                            {announcementStats && (
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Typography variant="h6">{announcementStats.announcement.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {announcementStats.announcement.message}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card>
                                            <CardContent>
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