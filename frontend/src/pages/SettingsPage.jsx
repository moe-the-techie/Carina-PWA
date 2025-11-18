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
  Alert
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import EditAccountDialog from '../components/EditAccountDialog.jsx';
import { useThemeMode } from '../contexts/ThemeContext';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function SettingsPage({ onLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const [user, setUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState('');

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

    fetchUserProfile();
  }, []);

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
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
      </Box>
    </PageFade>
  );
}
