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
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function EditAccountDialog({ open, onClose, user, onUserUpdate }) {
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
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
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
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Typography variant="h5">Edit Account Information</Typography>
        </DialogTitle>
        
        <DialogContent dividers>
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" color="primary">Basic Information</Typography>
            
            <TextField
              label="Full Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
            />

            <TextField
              label="Email"
              value={user?.email || ''}
              fullWidth
              disabled
              helperText="Email cannot be changed"
            />

            <DatePicker
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
              maxDate={dayjs()}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">Gender</FormLabel>
              <RadioGroup
                row
                value={formData.gender}
                onChange={handleInputChange('gender')}
              >
                <FormControlLabel value="male" control={<Radio />} label="Male" />
                <FormControlLabel value="female" control={<Radio />} label="Female" />
              </RadioGroup>
            </FormControl>

            {formData.gender === 'female' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isMother}
                    onChange={handleSwitchChange('isMother')}
                  />
                }
                label="I am a mother"
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

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}