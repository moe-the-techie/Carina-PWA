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
    useTheme
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Message as MessageIcon,
    Block as BanIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

export default function UserActionsDialog({ 
    open, 
    onClose, 
    user,
    onViewDetails,
    onMessage,
    onBan,
    onDelete
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedAction, setSelectedAction] = useState(null);

    const handleActionClick = (action) => {
        setSelectedAction(action);
        onClose();
        
        // Execute the action
        switch(action) {
            case 'view':
                onViewDetails(user);
                break;
            case 'message':
                onMessage(user._id);
                break;
            case 'ban':
                onBan(user);
                break;
            case 'delete':
                onDelete(user);
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
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1 } }}>
                <Button onClick={onClose} fullWidth={isMobile} size={isMobile ? "large" : "medium"}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}
