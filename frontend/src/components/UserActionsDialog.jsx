import React, { useState } from 'react';
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
    useTheme,
    TextField,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Message as MessageIcon,
    Block as BanIcon,
    Delete as DeleteIcon,
    Category as CategoryIcon,
    CardGiftcard as CreditsIcon
} from '@mui/icons-material';
import { spacing, transitions } from '../styles';
import { glassDialog } from '../styles/glassmorphism';

export default function UserActionsDialog({ 
    open, 
    onClose, 
    user,
    onViewDetails,
    onMessage,
    onBan,
    onDelete,
    onAssignClass,
    onGiveCredits,
    creditsLoading
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedAction, setSelectedAction] = useState(null);
    const [showCreditsForm, setShowCreditsForm] = useState(false);
    const [creditsAmount, setCreditsAmount] = useState(1);

    const handleActionClick = (action) => {
        setSelectedAction(action);
        
        // Execute the action
        switch(action) {
            case 'view':
                onClose();
                onViewDetails(user);
                break;
            case 'message':
                onClose();
                onMessage(user._id);
                break;
            case 'assignClass':
                onClose();
                onAssignClass(user);
                break;
            case 'ban':
                onClose();
                onBan(user);
                break;
            case 'delete':
                onClose();
                onDelete(user);
                break;
            case 'giveCredits':
                setShowCreditsForm(true);
                return; // Don't close dialog yet
            default:
                break;
        }
    };

    const handleConfirmGiveCredits = async () => {
        setSelectedAction('giveCredits');
        if (onGiveCredits && user?._id) {
            await onGiveCredits(user._id, creditsAmount);
        }
        setShowCreditsForm(false);
        setCreditsAmount(1);
        onClose();
    };

    const handleCancelCredits = () => {
        setShowCreditsForm(false);
        setCreditsAmount(1);
        setSelectedAction(null);
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
                        src={user?.profileImageUrl}
                        alt={user?.name}
                        sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}
                    >
                        {!user?.profileImageUrl && user?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant={isMobile ? "h6" : "h6"}>User Actions</Typography>
                        <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {user?.name}
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
                                secondary={!isMobile ? "See complete user information" : null}
                                primaryTypographyProps={{ 
                                    variant: isMobile ? 'body1' : 'body2' 
                                }}
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
                                secondary={!isMobile ? "Send a direct message" : null}
                                primaryTypographyProps={{ 
                                    variant: isMobile ? 'body1' : 'body2' 
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                    <Divider />
                    {import.meta.env.VITE_ENABLE_USER_CLASSES !== 'false' && (
                        <>
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleActionClick('assignClass')}
                                    sx={{ py: { xs: 2, sm: 1.5 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                        <CategoryIcon color="info" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Assign Class" 
                                        secondary={!isMobile ? "Set user classification" : null}
                                        primaryTypographyProps={{ 
                                            variant: isMobile ? 'body1' : 'body2' 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                            <Divider />
                        </>
                    )}
                    {/* Give Form Credits Action */}
                    {onGiveCredits && (
                        <>
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleActionClick('giveCredits')}
                                    disabled={creditsLoading}
                                    sx={{ py: { xs: 2, sm: 1.5 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                        <CreditsIcon color="success" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Give Form Credits" 
                                        secondary={!isMobile ? "Add form submission credits" : null}
                                        primaryTypographyProps={{ 
                                            variant: isMobile ? 'body1' : 'body2' 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                            <Divider />
                        </>
                    )}
                    <ListItem disablePadding>
                        <ListItemButton 
                            onClick={() => handleActionClick('ban')}
                            sx={{ py: { xs: 2, sm: 1.5 } }}
                        >
                            <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                <BanIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Ban User" 
                                secondary={!isMobile ? "Prevent future access" : null}
                                primaryTypographyProps={{ 
                                    variant: isMobile ? 'body1' : 'body2' 
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                    <Divider />
                    <ListItem disablePadding>
                        <ListItemButton 
                            onClick={() => handleActionClick('delete')}
                            sx={{ py: { xs: 2, sm: 1.5 } }}
                        >
                            <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                <DeleteIcon color="error" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Delete User" 
                                secondary={!isMobile ? "Permanently remove account" : null}
                                primaryTypographyProps={{ 
                                    variant: isMobile ? 'body1' : 'body2' 
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                </List>

                {/* Give Credits Form */}
                {showCreditsForm && (
                    <Box sx={{ p: 2 }}>
                        <Alert 
                            severity="info" 
                            sx={{ mb: 2 }}
                        >
                            <Typography variant="body2" fontWeight="medium">
                                Give form credits to {user?.name || 'this user'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Credits allow users to submit new forms.
                            </Typography>
                        </Alert>
                        <TextField
                            type="number"
                            label="Number of Credits"
                            value={creditsAmount}
                            onChange={(e) => setCreditsAmount(Math.max(1, parseInt(e.target.value) || 1))}
                            inputProps={{ min: 1 }}
                            fullWidth
                            size="small"
                            sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button 
                                onClick={handleCancelCredits}
                                disabled={creditsLoading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="contained" 
                                color="success"
                                onClick={handleConfirmGiveCredits}
                                disabled={creditsLoading || creditsAmount < 1}
                                startIcon={creditsLoading ? <CircularProgress size={16} color="inherit" /> : <CreditsIcon />}
                            >
                                {creditsLoading ? 'Adding...' : `Give ${creditsAmount} Credit${creditsAmount > 1 ? 's' : ''}`}
                            </Button>
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1 } }}>
                <Button onClick={onClose} fullWidth={isMobile} size={isMobile ? "large" : "medium"}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}
