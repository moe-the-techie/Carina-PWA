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
  Delete as DeleteIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import LandingButton from '../components/LandingButton.jsx';
import OnboardingOverlay from '../components/OnboardingOverlay';
import PageFade from '../components/PageFade';
import EditAccountDialog from '../components/EditAccountDialog.jsx';
import ImageViewerDialog from '../components/ImageViewerDialog';
import { useThemeMode } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserContext';
import { 
  clearVoiceCache, 
  getVoiceCacheStats 
} from '../services/chatService';
import { spacing, borderRadius, transitions } from '../styles';
import { glassCard, glassDialog } from '../styles/glassmorphism';
import { pageTitle } from '../styles/typography';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function SettingsPage({ onLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const { userProfile, setUserProfile, isLoading: isUserLoading, error: userError } = useUserProfile();
  const user = userProfile?.user;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cacheStats, setCacheStats] = useState({ count: 0, size: 0, maxSize: 0, expiry: 0 });
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (userError) {
        setError('Failed to load profile information');
    }
  }, [userError]);

  useEffect(() => {
    const loadCacheStats = () => {
      const stats = getVoiceCacheStats();
      setCacheStats(stats);
    };

    loadCacheStats();
  }, []);

  const handleUserUpdate = (updatedUser) => {
    setUserProfile({ user: updatedUser });
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
    if (user.phoneNumber) parts.push(user.phoneNumber);
    if (user.profession) parts.push(user.profession);
    
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
        p: spacing.md
      }}>
        <Card sx={{ 
          ...glassCard(theme),
          maxWidth: 600, 
          width: '100%',
        }}>
          <CardContent>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                ...pageTitle(theme),
                mb: spacing.lg,
              }}
            >
              Settings
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: spacing.md, borderRadius: borderRadius.sm }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: spacing.md, borderRadius: borderRadius.sm }}>
                {success}
              </Alert>
            )}
            
            {/* Profile Photo Section */}
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: spacing.lg, gap: spacing.md }}>
                <Avatar
                  src={user.profileImageUrl}
                  alt={user.name}
                  sx={{ 
                    width: 64, 
                    height: 64,
                    cursor: user.profileImageUrl ? 'pointer' : 'default',
                    transition: transitions.fast,
                    '&:hover': user.profileImageUrl ? {
                      opacity: 0.8,
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
              
              <Divider sx={{ my: spacing.md }} />
              
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
                    sx={{ 
                      width: { xs: '40px', md: '48px' },
                      height: { xs: '40px', md: '48px' }
                    }}
                  >
                    <EditIcon sx={{ fontSize: { xs: '20px', md: '24px' } }} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider sx={{ my: spacing.md }} />
              
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
                    sx={{ 
                      width: { xs: '40px', md: '48px' },
                      height: { xs: '40px', md: '48px' },
                      transition: transitions.fast,
                    }}
                    color="primary"
                  >
                    <DeleteIcon sx={{ fontSize: { xs: '20px', md: '24px' } }} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider sx={{ my: spacing.md }} />
              
              {/* App Guide Section */}
              <ListItem>
                <ListItemText 
                  primary="App Guide" 
                  secondary="View the app introduction and PWA installation guide"
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => setShowOnboarding(true)}
                    color="primary"
                    sx={{ 
                      width: { xs: '40px', md: '48px' },
                      height: { xs: '40px', md: '48px' },
                      transition: transitions.fast,
                    }}
                  >
                    <HelpOutlineIcon sx={{ fontSize: { xs: '20px', md: '24px' } }} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Box sx={{ mt: spacing.lg, display: 'flex', justifyContent: 'center' }}>
              <LandingButton 
                onClick={async () => { 
                  await onLogout(); 
                  navigate('/', { replace: true }); 
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
          PaperProps={{
            sx: glassDialog(theme)
          }}
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

        {/* Onboarding Overlay */}
        {showOnboarding && (
          <OnboardingOverlay 
            forceShow={true} 
            onClose={() => setShowOnboarding(false)} 
          />
        )}
      </Box>
    </PageFade>
  );
}
