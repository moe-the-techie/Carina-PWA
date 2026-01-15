import React from 'react';
import { Snackbar, Alert, Box } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Component that displays online/offline status notifications
 */
const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showOffline, setShowOffline] = React.useState(false);
  const [showOnline, setShowOnline] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
    } else {
      setShowOffline(false);
      if (wasOffline) {
        setShowOnline(true);
      }
    }
  }, [isOnline, wasOffline]);

  const handleCloseOffline = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowOffline(false);
  };

  const handleCloseOnline = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowOnline(false);
  };

  return (
    <>
      {/* Persistent offline banner */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            boxShadow: 2,
          }}
        >
          <WifiOffIcon fontSize="small" />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>
            You're offline. Some features may be limited.
          </span>
        </Box>
      )}

      {/* Offline notification snackbar */}
      <Snackbar
        open={showOffline}
        autoHideDuration={6000}
        onClose={handleCloseOffline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseOffline} 
          severity="warning" 
          sx={{ width: '100%' }}
          icon={<WifiOffIcon />}
        >
          Connection lost. Working in offline mode.
        </Alert>
      </Snackbar>

      {/* Back online notification */}
      <Snackbar
        open={showOnline}
        autoHideDuration={3000}
        onClose={handleCloseOnline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseOnline} 
          severity="success" 
          sx={{ width: '100%' }}
          icon={<WifiIcon />}
        >
          Back online!
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator;
