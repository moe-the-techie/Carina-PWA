import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Box,
  Alert,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PhotoCamera, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const startCountdown = (initialSeconds, setTimeoutState, setCanChangeState) => {
  setTimeoutState(initialSeconds);
  const interval = setInterval(() => {
    setTimeoutState(prev => {
      if (prev <= 1) {
        clearInterval(interval);
        setCanChangeState(true);
        return null;
      }
      return prev - 1;
    });
  }, 1000);
  return interval;
};

export default function EditAccountDialog({ open, onClose, user, onUserUpdate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: null,
    gender: '',
    isMother: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoChangeTimeout, setPhotoChangeTimeout] = useState(null);
  const [canChangePhoto, setCanChangePhoto] = useState(true);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [canResendPasswordReset, setCanResendPasswordReset] = useState(true);
  const [passwordResetRemainingSeconds, setPasswordResetRemainingSeconds] = useState(0);
  const [passwordResetEmailSent, setPasswordResetEmailSent] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        gender: user.gender || '',
        isMother: user.isMother || false,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setError('');
      setSuccess('');
      setPasswordResetSuccess('');
      setPasswordResetError('');
      setPasswordResetEmailSent(false);
      setCanResendPasswordReset(true);
      setPasswordResetRemainingSeconds(0);
      setPhotoChangeTimeout(null);
      setCanChangePhoto(true);
      setPhotoFile(null); // Clear photo file when dialog closes
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } else if (open) {
      // Check photo timeout when dialog opens
      checkPhotoTimeout();
    }
  }, [open]);

  // Countdown timer effect for password reset
  useEffect(() => {
    if (passwordResetRemainingSeconds > 0) {
      const timer = setTimeout(() => {
        setPasswordResetRemainingSeconds(passwordResetRemainingSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (passwordResetRemainingSeconds === 0 && !canResendPasswordReset && passwordResetEmailSent) {
      setCanResendPasswordReset(true);
    }
  }, [passwordResetRemainingSeconds, canResendPasswordReset, passwordResetEmailSent]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      if (field === 'gender' && value === 'male') {
        newData.isMother = false;
      }
      
      return newData;
    });
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handlePasswordReset = async () => {
    if (!canResendPasswordReset || !user?.email) return;

    try {
      setPasswordResetLoading(true);
      setPasswordResetError('');
      setPasswordResetSuccess('');

      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.error) {
          setPasswordResetError(data.error);
          
          if (response.status === 429 && data.remainingSeconds) {
            setPasswordResetRemainingSeconds(data.remainingSeconds);
            setCanResendPasswordReset(false);
          }
        } else {
          setPasswordResetError(`Request failed: ${response.status}`);
        }
        return;
      }

      setPasswordResetSuccess(data.message || 'Password reset email sent successfully!');
      setPasswordResetEmailSent(true);
      setCanResendPasswordReset(false);
      setPasswordResetRemainingSeconds(120); // 2 minutes in seconds
      setPasswordResetError('');
      
    } catch (error) {
      console.error('Password reset error:', error);
      setPasswordResetError('Network error: ' + error.message);
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: date
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file && canChangePhoto) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      setPhotoFile(file);
      setError('');
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const checkPhotoTimeout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/api/profile/photo-timeout`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCanChangePhoto(data.canChange);
        if (!data.canChange) {
          setPhotoFile(null); // Clear any selected photo file if user can't change photo
          if (data.remainingSeconds > 0) {
            startCountdown(data.remainingSeconds, setPhotoChangeTimeout, setCanChangePhoto);
          }
        }
      }
    } catch (error) {
      console.error('Error checking photo timeout:', error);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;
    
    setPhotoLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await fetch(`${apiBaseUrl}/api/profile/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.remainingSeconds) {
          setCanChangePhoto(false);
          startCountdown(data.remainingSeconds, setPhotoChangeTimeout, setCanChangePhoto);
        }
        throw new Error(data.error || 'Failed to upload photo');
      }

      setSuccess('Profile photo updated successfully!');
      onUserUpdate(data.user);
      setPhotoFile(null);
      await checkPhotoTimeout();
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError(error.message);
    } finally {
      setPhotoLoading(false);
    }
  };

  const deletePhoto = async () => {
    setPhotoLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiBaseUrl}/api/profile/photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.remainingSeconds) {
          setCanChangePhoto(false);
          startCountdown(data.remainingSeconds, setPhotoChangeTimeout, setCanChangePhoto);
        }
        throw new Error(data.error || 'Failed to delete photo');
      }

      setSuccess('Profile photo deleted successfully!');
      onUserUpdate(data.user);
      await checkPhotoTimeout();
      
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError(error.message);
    } finally {
      setPhotoLoading(false);
    }
  };

  const validateForm = () => {
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirmation do not match');
      return false;
    }

    if (formData.newPassword && !user?.firebaseUid && !formData.currentPassword) {
      setError('Current password is required to change password');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : null,
        gender: formData.gender,
        isMother: formData.isMother
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      onUserUpdate(data.user); // Update parent component's user data
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFirebaseUser = user?.firebaseUid;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={false}
        PaperProps={{
          sx: { 
            minHeight: { xs: '90vh', sm: '70vh', md: '600px' },
            maxHeight: { xs: '95vh', sm: '90vh', md: '85vh' },
            m: { xs: 1, sm: 2 },
            width: { xs: '95vw', sm: '90vw', md: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            Edit Account Information
          </Typography>
        </DialogTitle>
        
        <DialogContent 
          dividers 
          sx={{ 
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            overflow: 'auto'
          }}
        >
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

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 2, sm: 3 },
            width: '100%'
          }}>
            {/* Profile Photo Section */}
            <Box>
              <Typography 
                variant="h6" 
                color="primary" 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Profile Photo
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' }, 
                gap: { xs: 2, sm: 3 }, 
                mb: { xs: 1.5, sm: 2 }
              }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      color="primary"
                      component="label"
                      size="small"
                      disabled={!canChangePhoto || photoLoading}
                      sx={{ 
                        bgcolor: 'background.paper', 
                        '&:hover': { bgcolor: !canChangePhoto || photoLoading ? 'background.paper' : 'grey.100' },
                        opacity: !canChangePhoto || photoLoading ? 0.6 : 1,
                        cursor: !canChangePhoto || photoLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <PhotoCamera fontSize="small" />
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handlePhotoChange}
                        disabled={!canChangePhoto || photoLoading}
                        key={canChangePhoto ? 'enabled' : 'disabled'}
                      />
                    </IconButton>
                  }
                >
                  <Avatar
                    src={user?.profileImageUrl}
                    alt={user?.name}
                    sx={{ 
                      width: { xs: 64, sm: 80, md: 96 }, 
                      height: { xs: 64, sm: 80, md: 96 }
                    }}
                  >
                    {!user?.profileImageUrl && user?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Badge>
                <br></br>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: { xs: 'center', sm: 'flex-start' },
                  gap: 1,
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  {!canChangePhoto && photoChangeTimeout && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mb: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        width: { xs: '100%', sm: 'auto' },
                        textAlign: { xs: 'center', sm: 'left' }
                      }}
                    >
                      Please wait {Math.floor(photoChangeTimeout / 60)}m {photoChangeTimeout % 60}s before changing your photo again
                    </Alert>
                  )}
                  {photoFile && canChangePhoto && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: { xs: '250px', sm: '300px', md: '350px' }
                      }}
                    >
                      Selected: {photoFile.name}
                    </Typography>
                  )}
                  {photoFile && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                      <Button
                        variant="contained"
                        size={isMobile ? "small" : "medium"}
                        onClick={uploadPhoto}
                        disabled={photoLoading || !canChangePhoto}
                        sx={{ minWidth: { xs: '80px', sm: 'auto' } }}
                      >
                        {photoLoading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </Box>
                  )}
                  {user?.profileImageUrl && (
                    <Button
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      color="error"
                      onClick={deletePhoto}
                      disabled={photoLoading || !canChangePhoto}
                      startIcon={<Delete />}
                      sx={{ minWidth: { xs: '80px', sm: 'auto' } }}
                    >
                      {photoLoading ? 'Deleting...' : 'Remove'}
                    </Button>
                  )}
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Supported formats: JPG, PNG, JPEG. Maximum size: 5MB
                {!canChangePhoto && (
                  <><br />Photo changes are limited to once every 5 minutes to prevent abuse</>
                )}
              </Typography>
              <Divider sx={{ mt: 2 }} />
            </Box>

            <Typography 
              variant="h6" 
              color="primary"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                mt: { xs: 1, sm: 0 }
              }}
            >
              Basic Information
            </Typography>
            
            <TextField
              label="Full Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
              size={isMobile ? "small" : "medium"}
              sx={{ mb: { xs: 1, sm: 0 } }}
            />

            <TextField
              label="Email"
              value={user?.email || ''}
              fullWidth
              disabled
              size={isMobile ? "small" : "medium"}
              helperText="Email cannot be changed"
              sx={{ mb: { xs: 1, sm: 0 } }}
            />

            <DatePicker
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth size={isMobile ? "small" : "medium"} />}
              maxDate={dayjs()}
              sx={{ mb: { xs: 1, sm: 0 } }}
            />

            <FormControl component="fieldset" sx={{ mb: { xs: 1, sm: 0 } }}>
              <FormLabel 
                component="legend"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Gender
              </FormLabel>
              <RadioGroup
                row={!isMobile}
                value={formData.gender}
                onChange={handleInputChange('gender')}
                sx={{ mt: { xs: 0.5, sm: 1 } }}
              >
                <FormControlLabel 
                  value="male" 
                  control={<Radio size={isMobile ? "small" : "medium"} />} 
                  label="Male"
                  sx={{ mr: { xs: 0, sm: 2 } }}
                />
                <FormControlLabel 
                  value="female" 
                  control={<Radio size={isMobile ? "small" : "medium"} />} 
                  label="Female" 
                />
              </RadioGroup>
            </FormControl>

            {formData.gender === 'female' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isMother}
                    onChange={handleSwitchChange('isMother')}
                    size={isMobile ? "small" : "medium"}
                  />
                }
                label="I am a mother"
                sx={{ 
                  mb: { xs: 1, sm: 0 },
                  '& .MuiFormControlLabel-label': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            )}

            {!isFirebaseUser && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" color="primary">Change Password</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Leave password fields empty if you don't want to change your password
                </Typography>
                
                <TextField
                  label="Current Password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange('currentPassword')}
                  fullWidth
                />

                <TextField
                  label="New Password"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange('newPassword')}
                  fullWidth
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  fullWidth
                />
              </>
            )}

            {isFirebaseUser && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" color="primary">Password Management</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  password changes must be done through a password reset email.
                </Typography>
                
                {passwordResetError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {passwordResetError}
                  </Alert>
                )}
                
                {passwordResetSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {passwordResetSuccess}
                  </Alert>
                )}

                {passwordResetEmailSent && !canResendPasswordReset && passwordResetRemainingSeconds > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    You can request another password reset email in {formatTime(passwordResetRemainingSeconds)}
                  </Alert>
                )}

                <Button 
                  onClick={handlePasswordReset}
                  disabled={passwordResetLoading || (!canResendPasswordReset && passwordResetEmailSent)}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {passwordResetLoading ? 'Sending...' : 
                   passwordResetEmailSent && canResendPasswordReset ? 'Resend Password Reset Email' : 
                   'Send Password Reset Email'}
                </Button>
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          justifyContent: { xs: 'stretch', sm: 'flex-end' }
        }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
            size={isMobile ? "medium" : "large"}
            sx={{ 
              order: { xs: 2, sm: 1 },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            size={isMobile ? "medium" : "large"}
            sx={{ 
              order: { xs: 1, sm: 2 },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}