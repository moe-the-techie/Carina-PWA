import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import { glassInput } from '../styles';
import dayjs from 'dayjs';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function SignUpPage({ onLogin }) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profession, setProfession] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [gender, setGender] = useState('');
  const [isMother, setIsMother] = useState('');
  const [dob, setDob] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errors = {};

    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Invalid email format';
    }
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!passwordConfirmation.trim()) {
      errors.passwordConfirmation = 'Password confirmation is required';
    } else if (password !== passwordConfirmation) {
      errors.passwordConfirmation = 'Passwords do not match';
    }
    if (!gender) errors.gender = 'Gender is required';
    if (gender === 'female' && !isMother) errors.isMother = 'Please select an option';
    if (!dob) errors.dob = 'Date of birth is required';

    setFormErrors(errors);
    setBackendError('');

    if (Object.keys(errors).length === 0) {
      try {
        setSubmitting(true);
        const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email, password, passwordConfirmation, name, gender,
            isMother: isMother === 'yes',
            dateOfBirth: dob?.toISOString(),
            phoneNumber, profession
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setBackendError(data?.error || `Registration failed: ${response.status}`);
          return;
        }

        if (data.requiresEmailVerification) {
          alert('Account created successfully! Please check your email to verify your account, then sign in.');
          navigate('/login');
        } else if (data.token) {
          localStorage.setItem('token', data.token);
          onLogin();
          navigate('/');
        } else {
          setBackendError('Registration succeeded but unexpected response received.');
        }
      } catch (error) {
        console.error('Network error:', error);
        setBackendError('Network error: ' + error.message);
      } finally {
        setSubmitting(false);
      }

      setEmail(''); setPassword(''); setPasswordConfirmation('');
      setPhoneNumber(''); setProfession('');
      setGender(''); setIsMother(''); setDob(null);
    }
  };

  const inputStyles = glassInput(theme);

  const selectStyles = {
    '& .MuiOutlinedInput-root': {
      background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: 2,
    },
  };

  return (
    <PageFade>
      <LoadingBackdrop open={submitting} />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 3,
          py: 4,
          textAlign: 'center',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #121212 0%, #1a1a2e 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <Box
          component="img"
          src="/logo.PNG"
          alt="App Logo"
          sx={{ width: 160, height: 160, mb: 4, borderRadius: 4 }}
        />

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: theme.palette.text.primary }}>
          Create an Account
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Name" fullWidth variant="outlined" value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!formErrors.name} helperText={formErrors.name}
            sx={inputStyles}
          />

          <TextField
            label="Email" fullWidth variant="outlined" value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!formErrors.email} helperText={formErrors.email}
            sx={inputStyles}
          />

          <TextField
            label="Phone Number" fullWidth variant="outlined" value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            sx={inputStyles}
          />

          <TextField
            label="Password" fullWidth variant="outlined"
            type={showPassword ? 'text' : 'password'} value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!formErrors.password} helperText={formErrors.password}
            sx={inputStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirm Password" fullWidth variant="outlined"
            type={showPasswordConfirmation ? 'text' : 'password'} value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            error={!!formErrors.passwordConfirmation} helperText={formErrors.passwordConfirmation}
            sx={inputStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)} edge="end">
                    {showPasswordConfirmation ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth error={!!formErrors.gender} sx={selectStyles}>
            <InputLabel>Gender</InputLabel>
            <Select
              value={gender} label="Gender"
              onChange={(e) => { setGender(e.target.value); setIsMother(''); }}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
            <FormHelperText>{formErrors.gender}</FormHelperText>
          </FormControl>

          {gender === 'female' && (
            <FormControl fullWidth error={!!formErrors.isMother} sx={selectStyles}>
              <InputLabel>Are You a Mother?</InputLabel>
              <Select value={isMother} label="Are You a Mother?" onChange={(e) => setIsMother(e.target.value)}>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
              <FormHelperText>{formErrors.isMother}</FormHelperText>
            </FormControl>
          )}

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth" value={dob} onChange={(newValue) => setDob(newValue)}
              maxDate={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true, required: true,
                  error: !!formErrors.dob, helperText: formErrors.dob,
                  sx: inputStyles,
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Profession" fullWidth variant="outlined" value={profession}
            onChange={(e) => setProfession(e.target.value)}
            sx={inputStyles}
          />

          <Box sx={{ minHeight: 48 }}>
            {backendError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{backendError}</Alert>
            )}
          </Box>

          <Box sx={{ mt: 4 }}>
            <LandingButton type="submit">Sign Up</LandingButton>
          </Box>

          <Typography sx={{ color: theme.palette.text.secondary }}>
            Already Registered?{' '}
            <Link to="/login" style={{ color: theme.palette.primary.main, fontWeight: 600, textDecoration: 'none' }}>
              Log In
            </Link>
          </Typography>
        </Box>
      </Box>
    </PageFade>
  );
}
