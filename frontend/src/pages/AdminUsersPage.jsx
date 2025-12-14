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
    Stack,
    Avatar,
    Alert,
    Snackbar,
    useMediaQuery,
    useTheme,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageFade from '../components/PageFade';
import ImageViewerDialog from '../components/ImageViewerDialog';
import UserActionsDialog from '../components/UserActionsDialog';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
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

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchUsers();
        fetchClasses();
    }, [page, debouncedSearch, classFilter]);

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

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${apiBaseUrl}/api/admin/users?page=${page}&limit=10&search=${debouncedSearch}&classFilter=${classFilter}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId) => {
        try {
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
            setUserDetailsOpen(true);
        } catch (error) {
            console.error('Error fetching user details:', error);
            setError(error.message);
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
            fetchUsers(); // Refresh the list
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
            fetchUsers(); // Refresh the list
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
            fetchUsers();
        } catch (error) {
            console.error('Error assigning class:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to assign class',
                severity: 'error'
            });
        }
    };

    if (loading && users.length === 0) {
        return (
            <PageFade>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Loading users...</Typography>
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    User Management
                </Typography>

                {/* Search and Filter */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <TextField
                        fullWidth
                        label="Search users by name or email"
                        value={search}
                        onChange={handleSearchChange}
                        variant="outlined"
                    />
                    {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && (
                        <FormControl sx={{ minWidth: 200, width: { xs: '100%', md: 'auto' } }}>
                            <InputLabel>Filter by Class</InputLabel>
                            <Select
                                value={classFilter}
                                onChange={handleClassFilterChange}
                                label="Filter by Class"
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
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        Error: {error}
                    </Typography>
                )}

                {/* Users Table/Cards */}
                {isMobile ? (
                    // Mobile Card View
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {users.map((user) => (
                            <Card key={user._id}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                        <Avatar
                                            src={user.profileImageUrl}
                                            alt={user.name}
                                            sx={{ 
                                                width: 56, 
                                                height: 56,
                                                cursor: user.profileImageUrl ? 'pointer' : 'default',
                                                '&:hover': user.profileImageUrl ? {
                                                    opacity: 0.8,
                                                    transition: 'opacity 0.2s'
                                                } : {}
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
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="h6" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {user.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {user.email}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && user.userClass && (
                                                    <Chip 
                                                        icon={<CircleIcon sx={{ fontSize: 12, color: user.userClass.color + ' !important' }} />}
                                                        label={user.userClass.name}
                                                        size="small"
                                                        sx={{ 
                                                            borderColor: user.userClass.color,
                                                            color: user.userClass.color
                                                        }}
                                                        variant="outlined"
                                                    />
                                                )}
                                                <Chip 
                                                    label={user.gender || 'Not specified'} 
                                                    size="small"
                                                    color={user.gender === 'female' ? 'secondary' : 'primary'}
                                                />
                                                {user.gender === 'female' && (
                                                    <Chip 
                                                        label={user.isMother ? 'Mother' : 'Not Mother'} 
                                                        size="small"
                                                        color={user.isMother ? 'success' : 'default'}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                    {!isSmallMobile && (
                                        <>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                                                    <Typography variant="body2">
                                                        {user.dateOfBirth 
                                                            ? new Date(user.dateOfBirth).toLocaleDateString()
                                                            : 'Not provided'
                                                        }
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Joined</Typography>
                                                    <Typography variant="body2">
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </>
                                    )}
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleOpenActionsDialog(user)}
                                        >
                                            Actions
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                ) : (
                    // Desktop Table View
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Photo</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && <TableCell>Class</TableCell>}
                                    <TableCell>Gender</TableCell>
                                    <TableCell>Date of Birth</TableCell>
                                    <TableCell>Is Mother</TableCell>
                                    <TableCell>Joined</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <Avatar
                                                src={user.profileImageUrl}
                                                alt={user.name}
                                                sx={{ 
                                                    width: 40, 
                                                    height: 40,
                                                    cursor: user.profileImageUrl ? 'pointer' : 'default',
                                                    '&:hover': user.profileImageUrl ? {
                                                        opacity: 0.8,
                                                        transition: 'opacity 0.2s'
                                                    } : {}
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
                                        </TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && (
                                            <TableCell>
                                                {user.userClass ? (
                                                    <Chip 
                                                        icon={<CircleIcon sx={{ fontSize: 12, color: user.userClass.color + ' !important' }} />}
                                                        label={user.userClass.name}
                                                        size="small"
                                                        sx={{ 
                                                            borderColor: user.userClass.color,
                                                            color: user.userClass.color
                                                        }}
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                        None
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Chip 
                                                label={user.gender || 'Not specified'} 
                                                size="small"
                                                color={user.gender === 'female' ? 'secondary' : 'primary'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {user.dateOfBirth 
                                                ? new Date(user.dateOfBirth).toLocaleDateString()
                                                : 'Not provided'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {user.gender === 'female' ? (
                                                <Chip 
                                                    label={user.isMother ? 'Yes' : 'No'} 
                                                    size="small"
                                                    color={user.isMother ? 'success' : 'default'}
                                                />
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleOpenActionsDialog(user)}
                                            >
                                                Actions
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>

                {/* User Details Dialog */}
                <Dialog 
                    open={userDetailsOpen} 
                    onClose={() => setUserDetailsOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>User Details</DialogTitle>
                    <DialogContent>
                        {selectedUser && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Personal Information
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                                <Avatar
                                                    src={selectedUser.user.profileImageUrl}
                                                    alt={selectedUser.user.name}
                                                    sx={{ 
                                                        width: 64, 
                                                        height: 64,
                                                        cursor: selectedUser.user.profileImageUrl ? 'pointer' : 'default',
                                                        '&:hover': selectedUser.user.profileImageUrl ? {
                                                            opacity: 0.8,
                                                            transition: 'opacity 0.2s'
                                                        } : {}
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
                                                    <Typography variant="h6">{selectedUser.user.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {selectedUser.user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography><strong>Name:</strong> {selectedUser.user.name}</Typography>
                                            <Typography><strong>Email:</strong> {selectedUser.user.email}</Typography>
                                            <Typography><strong>Gender:</strong> {selectedUser.user.gender || 'Not specified'}</Typography>
                                            <Typography><strong>Date of Birth:</strong> {
                                                selectedUser.user.dateOfBirth 
                                                    ? new Date(selectedUser.user.dateOfBirth).toLocaleDateString()
                                                    : 'Not provided'
                                            }</Typography>
                                            {selectedUser.user.gender === 'female' && (
                                                <Typography><strong>Is Mother:</strong> {selectedUser.user.isMother ? 'Yes' : 'No'}</Typography>
                                            )}
                                            <Typography><strong>Joined:</strong> {new Date(selectedUser.user.createdAt).toLocaleDateString()}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Activity Summary
                                            </Typography>
                                            <Typography><strong>Forms Submitted:</strong> {selectedUser.forms.length}</Typography>
                                            <Typography><strong>Plans Created:</strong> {selectedUser.plans.length}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {selectedUser.forms.length > 0 && (
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Recent Forms
                                                </Typography>
                                                {selectedUser.forms.slice(0, 3).map((form, index) => (
                                                    <Box key={form._id} sx={{ mb: 1 }}>
                                                        <Typography variant="body2">
                                                            <strong>Form {index + 1}:</strong> Weight: {form.currentWeight}kg → {form.desiredWeight}kg 
                                                            <Chip 
                                                                label={form.reviewed ? 'Reviewed' : 'Pending'} 
                                                                size="small" 
                                                                color={form.reviewed ? 'success' : 'warning'}
                                                                sx={{ ml: 1 }}
                                                            />
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {new Date(form.createdAt).toLocaleDateString()}
                                                        </Typography>
                                                        {index < 2 && <Divider sx={{ my: 1 }} />}
                                                    </Box>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setUserDetailsOpen(false)}>Close</Button>
                        <Button 
                            variant="contained" 
                            color="primary"
                            onClick={() => {
                                setUserDetailsOpen(false);
                                handleMessageUser(selectedUser?.user?._id);
                            }}
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
                        >
                            Delete User
                        </Button>
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
                    onViewDetails={fetchUserDetails}
                    onMessage={handleMessageUser}
                    onAssignClass={handleAssignClassClick}
                    onBan={handleBanClick}
                    onDelete={handleDeleteClick}
                />

                {/* Class Assignment Dialog */}
                <Dialog
                    open={classDialogOpen}
                    onClose={() => setClassDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
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
                    <DialogActions>
                        <Button onClick={() => setClassDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAssignClassConfirm} variant="contained">
                            Assign
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                >
                    <DialogTitle>Confirm Delete User</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete user <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                        </Typography>
                        <Typography color="error" sx={{ mt: 2 }}>
                            This action will:
                        </Typography>
                        <ul>
                            <li>Permanently delete the user account</li>
                            <li>Delete all their forms and plans</li>
                            <li>Delete all their chat messages</li>
                            <li>Delete their profile image</li>
                            <li>Delete their Firebase authentication</li>
                            <li><strong>User can recreate an account with the same email</strong></li>
                        </ul>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleDeleteConfirm} 
                            color="error" 
                            variant="contained"
                        >
                            Delete User
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Ban Confirmation Dialog */}
                <Dialog
                    open={banDialogOpen}
                    onClose={() => setBanDialogOpen(false)}
                >
                    <DialogTitle>Confirm Ban User</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to ban user <strong>{userToBan?.name}</strong> ({userToBan?.email})?
                        </Typography>
                        <Typography color="warning.main" sx={{ mt: 2 }}>
                            This action will:
                        </Typography>
                        <ul>
                            <li>Mark the user account as banned</li>
                            <li>Delete all their forms and plans</li>
                            <li>Delete all their chat messages</li>
                            <li>Delete their profile image</li>
                            <li>Delete their Firebase authentication</li>
                            <li><strong>User CANNOT recreate an account with the same email</strong></li>
                        </ul>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleBanConfirm} 
                            color="warning" 
                            variant="contained"
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
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </PageFade>
    );
}
