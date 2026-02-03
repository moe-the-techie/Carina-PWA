import { useState, useEffect } from 'react';
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
    Alert,
    IconButton,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import PageFade from '../components/PageFade';
import { glassCard, glassInput, glassDialog } from '../styles/glassmorphism';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminPaymentsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [verifyLoading, setVerifyLoading] = useState(null);

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetchPayments();
    }, [page, statusFilter]);
    
    // Simple debounce for search
    useEffect(() => {
        const timer = setTimeout(() => {
             fetchPayments();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            let url = `${apiBaseUrl}/api/admin/payments?page=${page}&limit=10`;
            if (search) url += `&search=${search}`;
            if (statusFilter) url += `&status=${statusFilter}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayload = async (paymentId) => {
        setVerifyLoading(paymentId);
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/payments/${paymentId}/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setMessage({ type: 'success', text: `Verification: ${data.message} (Fawaterk: ${data.fawaterkStatus})` });
                fetchPayments();
            } else {
                setMessage({ type: 'error', text: data.message || 'Verification failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error connecting to server' });
        } finally {
             setVerifyLoading(null);
        }
    };

    const handleOpenEdit = (payment) => {
        setSelectedPayment(payment);
        setNewStatus(payment.status);
        setEditDialogOpen(true);
    };

    const handleUpdateStatus = async () => {
        try {
             const response = await fetch(`${apiBaseUrl}/api/admin/payments/${selectedPayment._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Payment status updated successfully' });
                setEditDialogOpen(false);
                fetchPayments();
            } else {
                 const data = await response.json();
                 setMessage({ type: 'error', text: data.message || 'Update failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error updating payment' });
        }
    };
    
    const getStatusColor = (status) => {
        switch(status) {
            case 'paid': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'error';
            case 'refunded': return 'info';
            default: return 'default';
        }
    };

    return (
        <PageFade>
            <Box sx={{ p: isMobile ? 2 : 4, maxWidth: 1600, mx: 'auto' }}>
                 <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Payments Management
                </Typography>
                
                {message.text && (
                    <Alert severity={message.type} onClose={() => setMessage({type: '', text: ''})} sx={{ mb: 2 }}>
                        {message.text}
                    </Alert>
                )}

                <Paper sx={{ ...glassCard, mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                         <TextField
                            placeholder="Search User / Invoice..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ ...glassInput, minWidth: 250 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={glassInput}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="paid">Paid</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                                <MenuItem value="refunded">Refunded</MenuItem>
                            </Select>
                        </FormControl>
                         <Button 
                            variant="outlined" 
                            startIcon={<RefreshIcon />}
                            onClick={fetchPayments}
                            sx={{ ml: 'auto' }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Paper>

                <TableContainer component={Paper} sx={{ ...glassCard }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Invoice ID</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
                                </TableRow>
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No payments found</TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment._id}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">{payment.user?.name || 'Unknown'}</Typography>
                                                <Typography variant="caption" color="textSecondary">{payment.user?.email}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {payment.amount / 100} {payment.currency}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={payment.status.toUpperCase()} 
                                                color={getStatusColor(payment.status)} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" fontFamily="monospace">
                                                {payment.fawaterkInvoiceId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                <Tooltip title="Verify Status with Fawaterk">
                                                    <span>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleVerifyPayload(payment._id)}
                                                            disabled={verifyLoading === payment._id}
                                                        >
                                                            {verifyLoading === payment._id ? <CircularProgress size={20} /> : <CheckCircleIcon color="info" />}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                 <Tooltip title="Edit Status Manually">
                                                    <IconButton size="small" onClick={() => handleOpenEdit(payment)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                 <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                        count={totalPages} 
                        page={page} 
                        onChange={(e, p) => setPage(p)} 
                        color="primary" 
                    />
                </Box>

                 {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} PaperProps={{ sx: glassDialog }}>
                    <DialogTitle>Update Payment Status</DialogTitle>
                    <DialogContent>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Manually updating status affects user credits!
                            Setting to PAID will Add credits.
                        </Alert>
                         <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={newStatus}
                                label="Status"
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="paid">Paid</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                                <MenuItem value="refunded">Refunded</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateStatus} variant="contained" color="primary">Update</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </PageFade>
    );
}
