import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
    Box,
    Avatar,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Message as MessageIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

export default function PlanActionsDialog({
    open,
    onClose,
    plan,
    onViewDetails,
    onMessage,
    onEdit,
    onDelete,
    isDeleting = false
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleActionClick = (action) => {
        if (!plan) return;

        onClose();

        switch (action) {
            case 'view':
                onViewDetails?.(plan);
                break;
            case 'message':
                onMessage?.(plan.user?._id);
                break;
            case 'edit':
                onEdit?.(plan);
                break;
            case 'delete':
                onDelete?.(plan);
                break;
            default:
                break;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                    <Avatar
                        src={plan?.user?.profileImageUrl}
                        alt={plan?.user?.name}
                        sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}
                    >
                        {!plan?.user?.profileImageUrl && plan?.user?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6">Plan Actions</Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {plan?.title || 'Nutrition Plan'}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                            }}
                        >
                            {plan?.user?.name || 'Unknown user'}
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleActionClick('view')}
                            sx={{ py: { xs: 2, sm: 1.5 } }}
                        >
                            <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                <ViewIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="View Details"
                                secondary={!isMobile ? 'Open full progress details' : null}
                            />
                        </ListItemButton>
                    </ListItem>
                    <Divider />
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleActionClick('message')}
                            sx={{ py: { xs: 2, sm: 1.5 } }}
                        >
                            <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                <MessageIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Message User"
                                secondary={!isMobile ? 'Send a direct message' : null}
                            />
                        </ListItemButton>
                    </ListItem>
                    <Divider />
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleActionClick('edit')}
                            sx={{ py: { xs: 2, sm: 1.5 } }}
                        >
                            <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                <EditIcon color="info" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Edit Plan"
                                secondary={!isMobile ? 'Open plan builder for this user' : null}
                            />
                        </ListItemButton>
                    </ListItem>
                    <Divider />
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleActionClick('delete')}
                            disabled={isDeleting}
                            sx={{ py: { xs: 2, sm: 1.5 } }}
                        >
                            <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                <DeleteIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Delete Plan"
                                secondary={!isMobile ? 'Permanently remove this plan' : null}
                            />
                        </ListItemButton>
                    </ListItem>
                </List>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1 } }}>
                <Button onClick={onClose} fullWidth={isMobile} size={isMobile ? 'large' : 'medium'}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
