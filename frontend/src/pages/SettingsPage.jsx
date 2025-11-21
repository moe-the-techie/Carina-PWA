import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import { 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Switch,
  Divider,
  IconButton,
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  Edit as EditIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import EditAccountDialog from '../components/EditAccountDialog.jsx';
import ImageViewerDialog from '../components/ImageViewerDialog';
import { useThemeMode } from '../contexts/ThemeContext';
import { 
  clearVoiceCache, 
  getVoiceCacheStats 
} from '../services/chatService';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function SettingsPage({ onLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const [user, setUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cacheStats, setCacheStats] = useState({ count: 0, size: 0, maxSize: 0, expiry: 0 });
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${apiBaseUrl}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile information');
      }
    };

    const loadCacheStats = () => {
      const stats = getVoiceCacheStats();
      setCacheStats(stats);
    };

    fetchUserProfile();
    loadCacheStats();
  }, []);

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleClearCache = () => {
    try {
      clearVoiceCache();
      setCacheStats({ count: 0, size: 0, maxSize: 0, expiry: 0 });
      setSuccess('Voice message cache cleared successfully');
      setClearCacheDialogOpen(false);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      setError('Failed to clear voice message cache');
      setClearCacheDialogOpen(false);
    }
  };

  const formatUserInfo = () => {
    if (!user) return 'Loading...';
    
    const parts = [user.name];
    if (user.email) parts.push(user.email);
    
    return parts.join(' • ');
  };

  return (
    <PageFade>
      <Box sx={{ 
        minHeight: '90vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 2
      }}>
        <Card sx={{ 
          maxWidth: 600, 
          width: '100%',
          backgroundColor: theme.palette.background.container 
        }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              Settings
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {/* Profile Photo Section */}
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Avatar
                  src={user.profileImageUrl}
                  alt={user.name}
                  sx={{ 
                    width: 64, 
                    height: 64,
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
                <Box>
                  <Typography variant="h6">{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            )}
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="Dark Mode" 
                  secondary={`Currently using ${mode === 'dark' ? 'dark' : 'light'} theme`}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    onChange={toggleTheme}
                    checked={mode === 'dark'}
                    inputProps={{ 'aria-label': 'toggle dark mode' }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider sx={{ my: 2 }} />
              
              <ListItem>
                <ListItemText 
                  primary="Account Information" 
                  secondary={formatUserInfo()}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => setEditDialogOpen(true)}
                    disabled={!user}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Voice Message Cache Section */}
              <ListItem>
                <ListItemText 
                  primary="Voice Message Cache" 
                  secondary={
                    `${cacheStats.count} messages cached • ${cacheStats.size} KB used • Auto-expires after ${cacheStats.expiry} days`
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => setClearCacheDialogOpen(true)}
                    disabled={cacheStats.count === 0}
                    color="primary"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <LandingButton 
                onClick={() => { 
                  onLogout(); 
                  navigate('/'); 
                }}
              >
                Logout
              </LandingButton>
            </Box>
          </CardContent>
        </Card>

        <EditAccountDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          user={user}
          onUserUpdate={handleUserUpdate}
        />

        <ImageViewerDialog
          open={imageDialogOpen}
          imageUrl={selectedImage}
          onClose={() => setImageDialogOpen(false)}
        />

        {/* Clear Cache Confirmation Dialog */}
        <Dialog
          open={clearCacheDialogOpen}
          onClose={() => setClearCacheDialogOpen(false)}
          aria-labelledby="clear-cache-dialog-title"
          aria-describedby="clear-cache-dialog-description"
        >
          <DialogTitle id="clear-cache-dialog-title">
            Clear Voice Message Cache
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="clear-cache-dialog-description">
              This will remove all cached voice messages ({cacheStats.count} messages, {cacheStats.size} KB). 
              Voice messages will need to be downloaded again when played. 
              Are you sure you want to continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearCacheDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClearCache} autoFocus color="primary">
              Clear Cache
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageFade>
  );
}
