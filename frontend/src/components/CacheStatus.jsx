import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getCacheSize,
  getTotalStorageSize,
  getVoiceCacheSize,
  formatBytes,
  clearExpiredCache,
  clearAllCache,
} from '../utils/offlineCache';

/**
 * Cache status component for settings page
 * Shows cache size, allows clearing cache
 */
const CacheStatus = () => {
  const [cacheSize, setCacheSize] = useState(0);
  const [voiceCacheSize, setVoiceCacheSize] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState('checking');

  useEffect(() => {
    updateCacheSize();
    checkServiceWorker();
  }, []);

  const updateCacheSize = () => {
    const size = getCacheSize();
    const voiceSize = getVoiceCacheSize();
    const total = getTotalStorageSize();
    setCacheSize(size);
    setVoiceCacheSize(voiceSize);
    setTotalSize(total);
  };

  const checkServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          setServiceWorkerStatus('active');
        } else {
          setServiceWorkerStatus('inactive');
        }
      });
    } else {
      setServiceWorkerStatus('unsupported');
    }
  };

  const handleClearExpired = async () => {
    setIsClearing(true);
    try {
      const cleared = clearExpiredCache();
      setMessage({
        type: 'success',
        text: `Cleared ${cleared} expired cache entries`,
      });
      updateCacheSize();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to clear expired cache',
      });
    }
    setIsClearing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all cached data? This will remove offline content.')) {
      return;
    }

    setIsClearing(true);
    try {
      const cleared = clearAllCache();
      
      // Also clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      setMessage({
        type: 'success',
        text: `Cleared all cached data (${cleared} entries)`,
      });
      updateCacheSize();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to clear cache',
      });
    }
    setIsClearing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusColor = () => {
    if (serviceWorkerStatus === 'active') return 'success';
    if (serviceWorkerStatus === 'inactive') return 'warning';
    return 'default';
  };

  const getStatusText = () => {
    if (serviceWorkerStatus === 'active') return 'Active';
    if (serviceWorkerStatus === 'inactive') return 'Inactive';
    if (serviceWorkerStatus === 'unsupported') return 'Not Supported';
    return 'Checking...';
  };

  const maxSize = 5 * 1024 * 1024; // 5MB estimate for localStorage
  const usagePercent = (totalSize / maxSize) * 100;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Offline Cache Status
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Storage Used
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatBytes(totalSize)} / {formatBytes(maxSize)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(usagePercent, 100)}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {usagePercent.toFixed(1)}% used
          </Typography>
        </Box>

        {/* Cache breakdown */}
        <Box sx={{ mb: 2, pl: 1, borderLeft: 2, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              App Data Cache
            </Typography>
            <Typography variant="caption" fontWeight="500">
              {formatBytes(cacheSize)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Voice Messages
            </Typography>
            <Typography variant="caption" fontWeight="500">
              {formatBytes(voiceCacheSize)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Other Data
            </Typography>
            <Typography variant="caption" fontWeight="500">
              {formatBytes(totalSize - cacheSize - voiceCacheSize)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Service Worker Status
          </Typography>
          <Chip
            icon={serviceWorkerStatus === 'active' ? <CheckCircleIcon /> : undefined}
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleClearExpired}
            disabled={isClearing}
          >
            Clear Expired
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleClearAll}
            disabled={isClearing}
          >
            Clear All Cache
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Cached data allows the app to work offline. Voice messages are cached separately (up to 3MB, 7 days). Clearing cache will remove offline content but won't affect your account data.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CacheStatus;
