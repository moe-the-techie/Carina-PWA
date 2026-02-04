import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Pagination,
    Grid,
    Card,
    CardContent,
    Divider,
    Avatar,
    Alert,
    Snackbar,
    useMediaQuery,
    useTheme,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Skeleton,
    IconButton,
    Tooltip,
    InputAdornment,
    Container,
    alpha,
    FormControlLabel,
    Checkbox,
    CircularProgress
} from '@mui/material';
import {
    Circle as CircleIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    MoreVert as MoreVertIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Cake as CakeIcon,
    AccessTime as AccessTimeIcon,
    Wc as GenderIcon,
    ChildCare as ChildCareIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageFade from '../components/PageFade';
import ImageViewerDialog from '../components/ImageViewerDialog';
import UserActionsDialog from '../components/UserActionsDialog';
import { spacing, borderRadius, transitions, accentColors } from '../styles';
import { glassCard, glassInput, glassDialog } from '../styles/glassmorphism';
import { containerVariants, itemVariants } from '../styles/animations';
import { useCachedData } from '../hooks/useCachedData';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetailsOpen, setUserDetailsOpen] = useState(false);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [userToBan, setUserToBan] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
    const [selectedUserForActions, setSelectedUserForActions] = useState(null);
    const [classDialogOpen, setClassDialogOpen] = useState(false);
    const [userToAssignClass, setUserToAssignClass] = useState(null);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [includeUnverified, setIncludeUnverified] = useState(false);
    const [userDetailsLoading, setUserDetailsLoading] = useState(false);
    const [creditsLoading, setCreditsLoading] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [search]);

    // Fetch users with caching - stale-while-revalidate
    const fetchUsersData = useCallback(async () => {
        const response = await fetch(
            `${apiBaseUrl}/api/admin/users?page=${page}&limit=10&search=${debouncedSearch}&classFilter=${classFilter}&includeUnverified=${includeUnverified}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        return response.json();
    }, [page, debouncedSearch, classFilter, includeUnverified]);

    const {
        data: usersData,
        isLoading: loading,
        isRefreshing,
        refetch: refetchUsers,
        setData: setUsersData,
    } = useCachedData(
        `admin_users_p${page}_s${debouncedSearch}_c${classFilter}_u${includeUnverified}`,
        fetchUsersData,
        {
            cacheTTL: 2 * 60 * 1000, // 2 minutes
            initialData: { users: [], totalPages: 1 },
            dependencies: [page, debouncedSearch, classFilter, includeUnverified],
        }
    );

    const users = usersData?.users || [];
    const totalPages = usersData?.totalPages || 1;

    // Fetch classes
    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        if (import.meta.env.VITE_ENABLE_USER_CLASSES === 'false') return;
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/classes`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAvailableClasses(data.classes.filter(c => c.isActive));
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchUserDetails = async (userId) => {
        try {
            setUserDetailsLoading(true);
            setUserDetailsOpen(true);
            setSelectedUser(null);
            const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }

            const data = await response.json();
            setSelectedUser(data);
        } catch (error) {
            console.error('Error fetching user details:', error);
            setError(error.message);
            setUserDetailsOpen(false);
        } finally {
            setUserDetailsLoading(false);
        }
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(1);
    };

    const handleClassFilterChange = (event) => {
        setClassFilter(event.target.value);
        setPage(1);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleMessageUser = (userId) => {
        if (!userId || userId === 'null' || userId === 'undefined') {
            setError('Cannot message user: Invalid user ID');
            return;
        }
        
        navigate('/admin/chats', { state: { userId } });
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleBanClick = (user) => {
        setUserToBan(user);
        setBanDialogOpen(true);
    };

    const handleGiveCredits = async (userId, credits) => {
        if (!userId) {
            setSnackbar({ open: true, message: 'Invalid user', severity: 'error' });
            return;
        }
        
        try {
            setCreditsLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/credits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ credits, mode: 'add' })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to give credits');
            }

            const data = await response.json();
            
            // Close the actions dialog
            setActionsDialogOpen(false);
            setSelectedUserForActions(null);
            
            // Show success snackbar
            setSnackbar({ 
                open: true, 
                message: `Added ${credits} credit${credits > 1 ? 's' : ''} to ${data.user.name}. New total: ${data.user.formCredits}`, 
                severity: 'success' 
            });
        } catch (error) {
            console.error('Error giving credits:', error);
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setCreditsLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/users/${userToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            setSnackbar({
                open: true,
                message: 'User deleted successfully',
                severity: 'success'
            });
            
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            refetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Error deleting user:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to delete user',
                severity: 'error'
            });
        }
    };

    const handleBanConfirm = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/users/${userToBan._id}/ban`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to ban user');
            }

            setSnackbar({
                open: true,
                message: 'User banned successfully',
                severity: 'success'
            });
            
            setBanDialogOpen(false);
            setUserToBan(null);
            refetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Error banning user:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to ban user',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleOpenActionsDialog = (user) => {
        setSelectedUserForActions(user);
        setActionsDialogOpen(true);
    };

    const handleAssignClassClick = (user) => {
        setUserToAssignClass(user);
        setSelectedClassId(user.userClass?._id || '');
        setClassDialogOpen(true);
    };

    const handleAssignClassConfirm = async () => {
        if (!userToAssignClass) return;

        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/users/${userToAssignClass._id}/class`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ classId: selectedClassId || null })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to assign class');
            }

            setSnackbar({
                open: true,
                message: selectedClassId ? 'Class assigned successfully' : 'Class removed successfully',
                severity: 'success'
            });
            
            setClassDialogOpen(false);
            setUserToAssignClass(null);
            setSelectedClassId('');
            refetchUsers();
        } catch (error) {
            console.error('Error assigning class:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to assign class',
                severity: 'error'
            });
        }
    };

    return (
        <PageFade>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header Section */}
                <Box sx={{ 
                    mb: 5, 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: 2
                }}>
                    <Box>
                        <Typography variant="h4" sx={{ 
                            fontWeight: 800, 
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}>
                            User Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your users, assign classes, and monitor activity.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {isRefreshing && (
                            <CircularProgress size={20} sx={{ color: accentColors.emerald.main }} />
                        )}
                        <Button 
                            variant="outlined" 
                            startIcon={<RefreshIcon />}
                            onClick={refetchUsers}
                            sx={{ 
                                borderRadius: 3,
                                textTransform: 'none',
                                borderWidth: 2,
                                '&:hover': { borderWidth: 2 }
                            }}
                        >
                            Refresh List
                        </Button>
                    </Box>
                </Box>

                {/* Search and Filter Bar */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 4,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                    }}
                >
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        alignItems: 'center'
                    }}>
                        <TextField
                            fullWidth
                            placeholder={isMobile ? "Search users..." : "Search users by name or email..."}
                            value={search}
                            onChange={handleSearchChange}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                                sx: { 
                                    borderRadius: 3,
                                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                                    '& fieldset': { border: 'none' }
                                }
                            }}
                        />
                        
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'row', 
                            gap: 2, 
                            width: { xs: '100%', md: 'auto' },
                            alignItems: 'center',
                            justifyContent: { xs: 'space-between', md: 'flex-start' }
                        }}>
                            {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && (
                                <FormControl sx={{ minWidth: { xs: '120px', md: 200 }, flex: { xs: 1, md: 'none' } }}>
                                    <Select
                                        value={classFilter}
                                        onChange={handleClassFilterChange}
                                        displayEmpty
                                        variant="outlined"
                                        sx={{ 
                                            borderRadius: 3,
                                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                                            '& fieldset': { border: 'none' }
                                        }}
                                        renderValue={(selected) => {
                                            if (selected === '') {
                                                return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}><FilterListIcon fontSize="small" /> {isMobile ? 'Class' : 'All Classes'}</Box>;
                                            }
                                            const selectedClass = availableClasses.find(c => c._id === selected);
                                            if (selected === 'unassigned') return 'Unassigned';
                                            return selectedClass ? selectedClass.name : selected;
                                        }}
                                    >
                                        <MenuItem value="">All Classes</MenuItem>
                                        <MenuItem value="unassigned">Unassigned</MenuItem>
                                        {availableClasses.map((classItem) => (
                                            <MenuItem key={classItem._id} value={classItem._id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CircleIcon 
                                                        sx={{ 
                                                            fontSize: 12, 
                                                            color: classItem.color 
                                                        }} 
                                                    />
                                                    {classItem.name}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeUnverified}
                                        onChange={(e) => setIncludeUnverified(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={isMobile ? "Unverified" : "Include Unverified"}
                                sx={{ whiteSpace: 'nowrap', mr: 0 }}
                            />
                        </Box>
                    </Box>
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Users Content */}
                {isMobile ? (
                    // Mobile Card View
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {loading && users.length === 0 ? (
                            Array.from(new Array(5)).map((_, index) => (
                                <Card key={index} sx={{ borderRadius: 4, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                            <Skeleton variant="circular" width={56} height={56} />
                                            <Box sx={{ flex: 1 }}>
                                                <Skeleton variant="text" width="60%" height={32} />
                                                <Skeleton variant="text" width="40%" height={20} />
                                            </Box>
                                        </Box>
                                        <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 2 }} />
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            users.map((user) => (
                                <Card 
                                    key={user._id}
                                    sx={{
                                        borderRadius: 4,
                                        border: '1px solid transparent',
                                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Avatar
                                                    src={user.profileImageUrl}
                                                    alt={user.name}
                                                    sx={{ 
                                                        width: 56, 
                                                        height: 56,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                        border: `2px solid ${theme.palette.background.paper}`,
                                                        cursor: user.profileImageUrl ? 'pointer' : 'default',
                                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                        fontSize: '1.5rem',
                                                        fontWeight: 600
                                                    }}
                                                    onClick={() => {
                                                        if (user.profileImageUrl) {
                                                            setSelectedImage(user.profileImageUrl);
                                                            setImageDialogOpen(true);
                                                        }
                                                    }}
                                                >
                                                    {!user.profileImageUrl && user.name?.charAt(0)?.toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                        {user.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <EmailIcon sx={{ fontSize: 14 }} /> {user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <IconButton onClick={() => handleOpenActionsDialog(user)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                            {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && user.userClass && (
                                                <Chip 
                                                    icon={<CircleIcon sx={{ fontSize: 10, color: user.userClass.color + ' !important' }} />}
                                                    label={user.userClass.name}
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: alpha(user.userClass.color, 0.1),
                                                        color: user.userClass.color,
                                                        fontWeight: 600,
                                                        border: 'none'
                                                    }}
                                                />
                                            )}
                                            <Chip 
                                                label={user.gender || 'Not specified'} 
                                                size="small"
                                                icon={<GenderIcon sx={{ fontSize: 14 }} />}
                                                sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, fontWeight: 600 }}
                                            />
                                            {user.gender === 'female' && user.isMother && (
                                                <Chip 
                                                    label="Mother" 
                                                    size="small"
                                                    icon={<ChildCareIcon sx={{ fontSize: 14 }} />}
                                                    sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, fontWeight: 600 }}
                                                />
                                            )}
                                        </Box>

                                        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CakeIcon sx={{ fontSize: 14 }} /> Date of Birth
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {user.dateOfBirth 
                                                        ? new Date(user.dateOfBirth).toLocaleDateString()
                                                        : 'Not provided'
                                                    }
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTimeIcon sx={{ fontSize: 14 }} /> Joined
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </Box>
                ) : (
                    // Desktop Table View
                    <TableContainer 
                        component={Paper} 
                        elevation={0}
                        sx={{ 
                            borderRadius: 4,
                            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            overflow: 'hidden'
                        }}
                    >
                        <Table>
                            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>User</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Contact</TableCell>
                                    {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Class</TableCell>}
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Details</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Joined</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && users.length === 0 ? (
                                    Array.from(new Array(5)).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell><Box sx={{ display: 'flex', gap: 2 }}><Skeleton variant="circular" width={40} height={40} /><Skeleton variant="text" width={120} /></Box></TableCell>
                                            <TableCell><Skeleton variant="text" width={180} /></TableCell>
                                            {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>}
                                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                            <TableCell><Skeleton variant="rectangular" width={64} height={30} /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    users.map((user) => (
                                        <TableRow 
                                            key={user._id}
                                            sx={{ 
                                                '&:hover': { 
                                                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                                                    transform: 'scale(1.002)',
                                                    transition: 'all 0.2s ease'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        src={user.profileImageUrl}
                                                        alt={user.name}
                                                        sx={{ 
                                                            width: 44, 
                                                            height: 44,
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                            cursor: user.profileImageUrl ? 'pointer' : 'default',
                                                            transition: 'transform 0.2s',
                                                            '&:hover': { transform: 'scale(1.1)' },
                                                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                            fontSize: '1rem',
                                                            fontWeight: 600
                                                        }}
                                                        onClick={() => {
                                                            if (user.profileImageUrl) {
                                                                setSelectedImage(user.profileImageUrl);
                                                                setImageDialogOpen(true);
                                                            }
                                                        }}
                                                    >
                                                        {!user.profileImageUrl && user.name?.charAt(0)?.toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            {user.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {user.gender || 'Unknown'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2">{user.email}</Typography>
                                                </Box>
                                            </TableCell>
                                            {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && (
                                                <TableCell>
                                                    {user.userClass ? (
                                                        <Chip 
                                                            icon={<CircleIcon sx={{ fontSize: 10, color: user.userClass.color + ' !important' }} />}
                                                            label={user.userClass.name}
                                                            size="small"
                                                            sx={{ 
                                                                bgcolor: alpha(user.userClass.color, 0.1),
                                                                color: user.userClass.color,
                                                                fontWeight: 600,
                                                                border: 'none'
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                            Unassigned
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {user.gender === 'female' && user.isMother && (
                                                        <Tooltip title="Mother">
                                                            <Chip 
                                                                label="Mom" 
                                                                size="small" 
                                                                sx={{ 
                                                                    height: 24, 
                                                                    fontSize: '0.7rem',
                                                                    bgcolor: alpha(theme.palette.success.main, 0.1), 
                                                                    color: theme.palette.success.main 
                                                                }} 
                                                            />
                                                        </Tooltip>
                                                    )}
                                                    {user.dateOfBirth && (
                                                        <Tooltip title={`DOB: ${new Date(user.dateOfBirth).toLocaleDateString()}`}>
                                                            <Chip 
                                                                icon={<CakeIcon sx={{ fontSize: '12px !important' }} />}
                                                                label={new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()} 
                                                                size="small" 
                                                                sx={{ height: 24, fontSize: '0.7rem' }} 
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleOpenActionsDialog(user)}
                                                    sx={{ 
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        boxShadow: 'none',
                                                        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                                                    }}
                                                >
                                                    Actions
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                borderRadius: 2
                            }
                        }}
                    />
                </Box>

                {/* User Details Dialog */}
                <Dialog 
                    open={userDetailsOpen} 
                    onClose={() => setUserDetailsOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 4 }
                    }}
                >
                    <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                        <Typography variant="h5" fontWeight={700}>User Details</Typography>
                    </DialogTitle>
                    <DialogContent sx={{ py: 3 }}>
                        {userDetailsLoading ? (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
                                        <CardContent>
                                            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, mt: 2 }}>
                                                <Skeleton variant="circular" width={80} height={80} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Skeleton variant="text" width="70%" height={28} />
                                                    <Skeleton variant="text" width="90%" height={20} />
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                {[1, 2, 3, 4].map((i) => (
                                                    <Box key={i}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                            <Skeleton variant="text" width="30%" />
                                                            <Skeleton variant="text" width="40%" />
                                                        </Box>
                                                        {i < 4 && <Divider />}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                                            <CardContent>
                                                <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
                                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                    <Skeleton variant="rounded" sx={{ flex: 1, height: 100, borderRadius: 2 }} />
                                                    <Skeleton variant="rounded" sx={{ flex: 1, height: 100, borderRadius: 2 }} />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, flex: 1 }}>
                                            <CardContent>
                                                <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                                                {[1, 2, 3].map((i) => (
                                                    <Box key={i} sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                            <Skeleton variant="text" width="25%" />
                                                            <Skeleton variant="rounded" width={60} height={20} />
                                                        </Box>
                                                        <Skeleton variant="text" width="80%" />
                                                        <Skeleton variant="text" width="30%" />
                                                    </Box>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </Box>
                                </Grid>
                            </Grid>
                        ) : selectedUser && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                                                Personal Information
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, mt: 2 }}>
                                                <Avatar
                                                    src={selectedUser.user.profileImageUrl}
                                                    alt={selectedUser.user.name}
                                                    sx={{ 
                                                        width: 80, 
                                                        height: 80,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                        cursor: selectedUser.user.profileImageUrl ? 'pointer' : 'default',
                                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                        fontSize: '2rem',
                                                        fontWeight: 600
                                                    }}
                                                    onClick={() => {
                                                        if (selectedUser.user.profileImageUrl) {
                                                            setSelectedImage(selectedUser.user.profileImageUrl);
                                                            setImageDialogOpen(true);
                                                        }
                                                    }}
                                                >
                                                    {!selectedUser.user.profileImageUrl && selectedUser.user.name?.charAt(0)?.toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" fontWeight={700}>{selectedUser.user.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {selectedUser.user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography color="text.secondary">Gender</Typography>
                                                    <Typography fontWeight={500}>{selectedUser.user.gender || 'Not specified'}</Typography>
                                                </Box>
                                                <Divider />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography color="text.secondary">Date of Birth</Typography>
                                                    <Typography fontWeight={500}>{
                                                        selectedUser.user.dateOfBirth 
                                                            ? new Date(selectedUser.user.dateOfBirth).toLocaleDateString()
                                                            : 'Not provided'
                                                        }</Typography>
                                                </Box>
                                                {selectedUser.user.gender === 'female' && (
                                                    <>
                                                        <Divider />
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <Typography color="text.secondary">Is Mother</Typography>
                                                            <Typography fontWeight={500}>{selectedUser.user.isMother ? 'Yes' : 'No'}</Typography>
                                                        </Box>
                                                    </>
                                                )}
                                                <Divider />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography color="text.secondary">Joined</Typography>
                                                    <Typography fontWeight={500}>{new Date(selectedUser.user.createdAt).toLocaleDateString()}</Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                                                    Activity Summary
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                    <Paper elevation={0} sx={{ flex: 1, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, textAlign: 'center' }}>
                                                        <Typography variant="h4" color="primary" fontWeight={700}>{selectedUser.forms.length}</Typography>
                                                        <Typography variant="body2" color="text.secondary">Forms Submitted</Typography>
                                                    </Paper>
                                                    <Paper elevation={0} sx={{ flex: 1, p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 2, textAlign: 'center' }}>
                                                        <Typography variant="h4" color="secondary" fontWeight={700}>{selectedUser.plans.length}</Typography>
                                                        <Typography variant="body2" color="text.secondary">Plans Created</Typography>
                                                    </Paper>
                                                </Box>
                                            </CardContent>
                                        </Card>

                                        {selectedUser.forms.length > 0 && (
                                            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, flex: 1 }}>
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                                                        Recent Forms
                                                    </Typography>
                                                    {selectedUser.forms.slice(0, 3).map((form, index) => (
                                                        <Box key={form._id} sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                                <Typography variant="subtitle2" fontWeight={600}>
                                                                    Form {index + 1}
                                                                </Typography>
                                                                <Chip 
                                                                    label={form.reviewed ? 'Reviewed' : 'Pending'} 
                                                                    size="small" 
                                                                    color={form.reviewed ? 'success' : 'warning'}
                                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                                />
                                                            </Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Weight: {form.currentWeight}kg → {form.desiredWeight}kg
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                                {new Date(form.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Button onClick={() => setUserDetailsOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
                        {userDetailsLoading ? (
                            <>
                                <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 2 }} />
                                <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 2 }} />
                                <Skeleton variant="rounded" width={110} height={36} sx={{ borderRadius: 2 }} />
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    onClick={() => {
                                        setUserDetailsOpen(false);
                                        handleMessageUser(selectedUser?.user?._id);
                                    }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Message User
                                </Button>
                                <Button 
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => {
                                        setUserDetailsOpen(false);
                                        handleBanClick(selectedUser?.user);
                                    }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Ban User
                                </Button>
                                <Button 
                                    variant="outlined"
                                    color="error"
                                    onClick={() => {
                                        setUserDetailsOpen(false);
                                        handleDeleteClick(selectedUser?.user);
                                    }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Delete User
                                </Button>
                            </>
                        )}
                    </DialogActions>
                </Dialog>

                <ImageViewerDialog
                    open={imageDialogOpen}
                    imageUrl={selectedImage}
                    onClose={() => setImageDialogOpen(false)}
                />

                {/* User Actions Dialog */}
                <UserActionsDialog
                    open={actionsDialogOpen}
                    onClose={() => setActionsDialogOpen(false)}
                    user={selectedUserForActions}
                    onViewDetails={(user) => fetchUserDetails(user._id)}
                    onMessage={handleMessageUser}
                    onAssignClass={handleAssignClassClick}
                    onBan={handleBanClick}
                    onDelete={handleDeleteClick}
                    onGiveCredits={handleGiveCredits}
                    creditsLoading={creditsLoading}
                />

                {/* Class Assignment Dialog */}
                <Dialog
                    open={classDialogOpen}
                    onClose={() => setClassDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle>Assign User Class</DialogTitle>
                    <DialogContent>
                        <Typography sx={{ mb: 2 }}>
                            Assign a class to <strong>{userToAssignClass?.name}</strong>
                        </Typography>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>User Class</InputLabel>
                            <Select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                label="User Class"
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {availableClasses.map((classOption) => (
                                    <MenuItem key={classOption._id} value={classOption._id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CircleIcon sx={{ fontSize: 16, color: classOption.color }} />
                                            {classOption.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setClassDialogOpen(false)} sx={{ borderRadius: 2 }}>
                            Cancel
                        </Button>
                        <Button onClick={handleAssignClassConfirm} variant="contained" sx={{ borderRadius: 2 }}>
                            Assign
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle>Confirm Delete User</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete user <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                        </Typography>
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold">This action cannot be undone.</Typography>
                            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                <li>Permanently delete the user account</li>
                                <li>Delete all their forms and plans</li>
                                <li>Delete all their chat messages</li>
                                <li>Delete their profile image</li>
                            </ul>
                        </Alert>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
                        <Button 
                            onClick={handleDeleteConfirm} 
                            color="error" 
                            variant="contained"
                            sx={{ borderRadius: 2 }}
                        >
                            Delete User
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Ban Confirmation Dialog */}
                <Dialog
                    open={banDialogOpen}
                    onClose={() => setBanDialogOpen(false)}
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle>Confirm Ban User</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to ban user <strong>{userToBan?.name}</strong> ({userToBan?.email})?
                        </Typography>
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold">Warning</Typography>
                            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                <li>Mark the user account as banned</li>
                                <li>User will not be able to log in</li>
                                <li><strong>User CANNOT recreate an account with the same email</strong></li>
                            </ul>
                        </Alert>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setBanDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
                        <Button 
                            onClick={handleBanConfirm} 
                            color="warning" 
                            variant="contained"
                            sx={{ borderRadius: 2 }}
                        >
                            Ban User
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={handleCloseSnackbar} 
                        severity={snackbar.severity}
                        sx={{ width: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </PageFade>
    );
}
