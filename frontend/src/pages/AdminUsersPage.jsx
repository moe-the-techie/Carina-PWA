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
    Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageFade from '../components/PageFade';
import ImageViewerDialog from '../components/ImageViewerDialog';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetailsOpen, setUserDetailsOpen] = useState(false);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${apiBaseUrl}/api/admin/users?page=${page}&limit=10&search=${debouncedSearch}`,
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

                {/* Search */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Search users by name or email"
                        value={search}
                        onChange={handleSearchChange}
                        variant="outlined"
                    />
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        Error: {error}
                    </Typography>
                )}

                {/* Users Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Photo</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
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
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                onClick={() => fetchUserDetails(user._id)}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleMessageUser(user._id)}
                                            >
                                                Message
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

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
                    </DialogActions>
                </Dialog>

                <ImageViewerDialog
                    open={imageDialogOpen}
                    imageUrl={selectedImage}
                    onClose={() => setImageDialogOpen(false)}
                />
            </Box>
        </PageFade>
    );
}
