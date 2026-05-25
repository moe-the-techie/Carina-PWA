import { useState, useEffect, useCallback, useMemo } from 'react';
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
    Tooltip,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import PageFade from '../components/PageFade';
import { glassCard, glassInput, glassDialog } from '../styles/glassmorphism';
import { useCachedData } from '../hooks/useCachedData';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminPaymentsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [verifyLoading, setVerifyLoading] = useState(null);

    const [packageSettingsLoading, setPackageSettingsLoading] = useState(false);
    const [packageSettingsSaving, setPackageSettingsSaving] = useState(false);
    const [packageSettings, setPackageSettings] = useState({
        firstTimePrice: '',
        firstTimeFormsPerPackage: '',
        followUpPrice: '',
        followUpFormsPerPackage: '',
        firstTimeResetEnabled: false,
        firstTimeResetAfterDays: ''
    });

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    // Debounce search to reduce unnecessary API and cache churn
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const loadSettings = async () => {
            setPackageSettingsLoading(true);
            try {
                const response = await fetch(`${apiBaseUrl}/api/admin/payment-package-settings`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to load payment package settings');
                }

                const settings = data.settings;
                setPackageSettings({
                    firstTimePrice: settings?.firstTime?.price ?? '',
                    firstTimeFormsPerPackage: settings?.firstTime?.formsPerPackage ?? '',
                    followUpPrice: settings?.followUp?.price ?? '',
                    followUpFormsPerPackage: settings?.followUp?.formsPerPackage ?? '',
                    firstTimeResetEnabled: settings?.firstTimeResetEnabled === true,
                    firstTimeResetAfterDays: settings?.firstTimeResetAfterDays ?? ''
                });
            } catch (err) {
                setMessage({ type: 'error', text: err.message || 'Failed to load payment package settings' });
            } finally {
                setPackageSettingsLoading(false);
            }
        };

        loadSettings();
    }, []);

    const savePackageSettings = async () => {
        setPackageSettingsSaving(true);
        try {
            const payload = {};
            if (packageSettings.firstTimePrice !== '') payload.firstTimePrice = packageSettings.firstTimePrice;
            if (packageSettings.firstTimeFormsPerPackage !== '') payload.firstTimeFormsPerPackage = packageSettings.firstTimeFormsPerPackage;
            if (packageSettings.followUpPrice !== '') payload.followUpPrice = packageSettings.followUpPrice;
            if (packageSettings.followUpFormsPerPackage !== '') payload.followUpFormsPerPackage = packageSettings.followUpFormsPerPackage;
            payload.firstTimeResetEnabled = packageSettings.firstTimeResetEnabled;
            if (packageSettings.firstTimeResetAfterDays !== '') payload.firstTimeResetAfterDays = packageSettings.firstTimeResetAfterDays;

            const response = await fetch(`${apiBaseUrl}/api/admin/payment-package-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || 'Failed to save settings');
            }

            setMessage({ type: 'success', text: 'Payment package settings saved' });
            const settings = data.settings;
            setPackageSettings({
                firstTimePrice: settings?.firstTime?.price ?? packageSettings.firstTimePrice,
                firstTimeFormsPerPackage: settings?.firstTime?.formsPerPackage ?? packageSettings.firstTimeFormsPerPackage,
                followUpPrice: settings?.followUp?.price ?? packageSettings.followUpPrice,
                followUpFormsPerPackage: settings?.followUp?.formsPerPackage ?? packageSettings.followUpFormsPerPackage,
                firstTimeResetEnabled: settings?.firstTimeResetEnabled === true,
                firstTimeResetAfterDays: settings?.firstTimeResetAfterDays ?? packageSettings.firstTimeResetAfterDays
            });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
        } finally {
            setPackageSettingsSaving(false);
        }
    };

    const paymentsCacheKey = useMemo(
        () => `admin_payments_p${page}_s${statusFilter || 'all'}_q${debouncedSearch || 'all'}`,
        [page, statusFilter, debouncedSearch]
    );

    const fetchPaymentsData = useCallback(async () => {
        let url = `${apiBaseUrl}/api/admin/payments?page=${page}&limit=10`;
        if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
        if (statusFilter) url += `&status=${statusFilter}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch payments');
        }

        return response.json();
    }, [page, statusFilter, debouncedSearch]);

    const {
        data: paymentsData,
        isLoading: loading,
        isRefreshing,
        refetch: refetchPayments,
        setData: setPaymentsData,
    } = useCachedData(
        paymentsCacheKey,
        fetchPaymentsData,
        {
            cacheTTL: 2 * 60 * 1000,
            initialData: { payments: [], totalPages: 1 },
            dependencies: [page, statusFilter, debouncedSearch],
        }
    );

    const payments = paymentsData?.payments || [];
    const totalPages = paymentsData?.totalPages || 1;

    const invalidateOtherAdminPaymentCaches = useCallback((keepCacheKey) => {
        const keepDataKey = `carina_cache_${keepCacheKey}`;
        const keepExpiryKey = `${keepDataKey}_expiry`;

        Object.keys(localStorage).forEach((storageKey) => {
            if (!storageKey.startsWith('carina_cache_admin_payments_')) {
                return;
            }

            if (storageKey === keepDataKey || storageKey === keepExpiryKey) {
                return;
            }

            localStorage.removeItem(storageKey);
        });
    }, []);

    const applyPaymentStatusToCache = useCallback((paymentId, status) => {
        if (!paymentId || !status) return;

        setPaymentsData((previousData) => {
            if (!previousData?.payments) return previousData;

            return {
                ...previousData,
                payments: previousData.payments.map((payment) => (
                    payment._id === paymentId
                        ? { ...payment, status }
                        : payment
                )),
            };
        });
    }, [setPaymentsData]);

    const mapGatewayStatusToLocal = (statusText) => {
        const normalized = statusText?.toLowerCase();
        if (!normalized) return null;

        if (['paid', 'success', 'successful'].includes(normalized)) return 'paid';
        if (['pending', 'processing'].includes(normalized)) return 'pending';
        if (normalized === 'refunded') return 'refunded';
        if (['failed', 'declined', 'expired', 'canceled', 'cancelled'].includes(normalized)) return 'failed';
        return null;
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
                const mappedStatus = mapGatewayStatusToLocal(data.fawaterkStatus);
                if (mappedStatus) {
                    applyPaymentStatusToCache(paymentId, mappedStatus);
                    invalidateOtherAdminPaymentCaches(paymentsCacheKey);
                }
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

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                setMessage({ type: 'success', text: 'Payment status updated successfully' });
                setEditDialogOpen(false);
                applyPaymentStatusToCache(selectedPayment._id, data?.payment?.status || newStatus);
                invalidateOtherAdminPaymentCaches(paymentsCacheKey);
            } else {
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Payment Package Settings
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={savePackageSettings}
                            disabled={packageSettingsLoading || packageSettingsSaving}
                        >
                            {packageSettingsSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            label="First-time price"
                            value={packageSettings.firstTimePrice}
                            onChange={(e) => setPackageSettings(prev => ({ ...prev, firstTimePrice: e.target.value }))}
                            disabled={packageSettingsLoading}
                            sx={{ ...glassInput, minWidth: 220 }}
                        />
                        <TextField
                            label="First-time forms"
                            value={packageSettings.firstTimeFormsPerPackage}
                            onChange={(e) => setPackageSettings(prev => ({ ...prev, firstTimeFormsPerPackage: e.target.value }))}
                            disabled={packageSettingsLoading}
                            sx={{ ...glassInput, minWidth: 220 }}
                        />
                        <TextField
                            label="Follow-up price"
                            value={packageSettings.followUpPrice}
                            onChange={(e) => setPackageSettings(prev => ({ ...prev, followUpPrice: e.target.value }))}
                            disabled={packageSettingsLoading}
                            sx={{ ...glassInput, minWidth: 220 }}
                        />
                        <TextField
                            label="Follow-up forms"
                            value={packageSettings.followUpFormsPerPackage}
                            onChange={(e) => setPackageSettings(prev => ({ ...prev, followUpFormsPerPackage: e.target.value }))}
                            disabled={packageSettingsLoading}
                            sx={{ ...glassInput, minWidth: 220 }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={packageSettings.firstTimeResetEnabled}
                                    onChange={(e) => setPackageSettings(prev => ({ ...prev, firstTimeResetEnabled: e.target.checked }))}
                                    disabled={packageSettingsLoading}
                                />
                            }
                            label="Enable first-time reset"
                        />
                        <TextField
                            label="Reset after (days)"
                            value={packageSettings.firstTimeResetAfterDays}
                            onChange={(e) => setPackageSettings(prev => ({ ...prev, firstTimeResetAfterDays: e.target.value }))}
                            disabled={packageSettingsLoading || !packageSettings.firstTimeResetEnabled}
                            sx={{ ...glassInput, minWidth: 220 }}
                        />
                    </Box>
                </Paper>

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
                            onClick={refetchPayments}
                            disabled={isRefreshing}
                            sx={{ ml: 'auto' }}
                        >
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
