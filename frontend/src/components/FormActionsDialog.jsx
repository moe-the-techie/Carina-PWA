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
    Chip,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Backdrop
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Send as SendIcon,
    Assignment as PlanIcon,
    Edit as EditIcon,
    Message as MessageIcon,
    Feedback as FeedbackIcon
} from '@mui/icons-material';

export default function FormActionsDialog({ 
    open, 
    onClose, 
    form,
    onViewDetails,
    onSendPlan,
    onViewPlan,
    onEditPlan,
    onMessageUser,
    onViewFeedback,
    planLoading
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedAction, setSelectedAction] = useState(null);

    const handleActionClick = async (action) => {
        setSelectedAction(action);
        
        // Execute the action
        switch(action) {
            case 'view':
                await onViewDetails(form);
                break;
            case 'send':
                await onSendPlan(form);
                break;
            case 'viewPlan':
                await onViewPlan(form);
                break;
            case 'editPlan':
                await onEditPlan(form);
                break;
            case 'message':
                await onMessageUser(form.user._id);
                break;
            case 'viewFeedback':
                await onViewFeedback(form);
                break;
            default:
                break;
        }
        
        // Close dialog after action completes
        onClose();
    };

    const showSendPlan = !form?.reviewed;
    const showViewPlan = form?.reviewed && form?.planSent;
    const showEditPlan = form?.reviewed && form?.planSent;
    const showViewFeedback = form?.reviewed && form?.planSent;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle>
                <Box>
                    <Typography variant={isMobile ? "h6" : "h6"}>Form Actions</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                        <Chip 
                            label={form?.reviewed ? 'Reviewed' : 'Pending'} 
                            color={form?.reviewed ? 'success' : 'warning'}
                            size="small"
                        />
                        {form?.reviewed && form?.planSent && (
                            <Chip 
                                label="Plan Sent" 
                                color="success" 
                                size="small" 
                            />
                        )}
                    </Box>
                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                            mt: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        User: {form?.user?.name || 'Unknown'}
                    </Typography>
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
                                secondary={!isMobile ? "See complete form information" : null}
                                primaryTypographyProps={{ 
                                    variant: isMobile ? 'body1' : 'body2' 
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                    
                    {form?.user?._id && (
                        <>
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
                        </>
                    )}

                    {showSendPlan && (
                        <>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleActionClick('send')}
                                    sx={{ py: { xs: 2, sm: 1.5 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                        <SendIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Send Plan" 
                                        secondary={!isMobile ? "Create and send a meal plan" : null}
                                        primaryTypographyProps={{ 
                                            variant: isMobile ? 'body1' : 'body2' 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </>
                    )}

                    {showViewPlan && (
                        <>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleActionClick('viewPlan')}
                                    disabled={planLoading}
                                    sx={{ py: { xs: 2, sm: 1.5 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                        <PlanIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="View Plan" 
                                        secondary={!isMobile ? "See the sent meal plan" : null}
                                        primaryTypographyProps={{ 
                                            variant: isMobile ? 'body1' : 'body2' 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </>
                    )}

                    {showEditPlan && (
                        <>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleActionClick('editPlan')}
                                    sx={{ py: { xs: 2, sm: 1.5 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                        <EditIcon color="secondary" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Edit Plan" 
                                        secondary={!isMobile ? "Modify the existing meal plan" : null}
                                        primaryTypographyProps={{ 
                                            variant: isMobile ? 'body1' : 'body2' 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </>
                    )}

                    {showViewFeedback && (
                        <>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleActionClick('viewFeedback')}
                                    disabled={planLoading}
                                    sx={{ py: { xs: 2, sm: 1.5 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                                        <FeedbackIcon color="info" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="View Plan Feedback" 
                                        secondary={!isMobile ? "See user's feedback and complete plan details" : null}
                                        primaryTypographyProps={{ 
                                            variant: isMobile ? 'body1' : 'body2' 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </>
                    )}
                </List>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1 } }}>
                <Button onClick={onClose} fullWidth={isMobile} size={isMobile ? "large" : "medium"}>Cancel</Button>
            </DialogActions>
            
            {/* Full screen loading backdrop */}
            <Backdrop
                sx={{ 
                    color: (theme) => theme.palette.primary.main,
                    zIndex: (theme) => theme.zIndex.modal + 1,
                    position: 'absolute'
                }}
                open={planLoading}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress color="primary" size={60} />
                    <Typography sx={{ mt: 2, color: 'primary.main' }}>
                        {selectedAction === 'editPlan' ? 'Loading Plan Builder...' : 'Processing...'}
                    </Typography>
                </Box>
            </Backdrop>
        </Dialog>
    );
}
