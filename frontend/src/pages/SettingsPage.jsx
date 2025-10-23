import React from 'react';
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
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import { useThemeMode } from '../contexts/ThemeContext';

export default function SettingsPage({ onLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();

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
                  primary="Account" 
                  secondary="You are currently logged in"
                />
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
      </Box>
    </PageFade>
  );
}
