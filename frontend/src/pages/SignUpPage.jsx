import React, { useState } from 'react';
import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import dayjs from 'dayjs';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function SignUpPage({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

    if (!name.trim()) {
      errors.name = 'Name is required';
    }

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

    if (!gender) {
      errors.gender = 'Gender is required';
    }

    if (gender === 'female' && !isMother) {
      errors.isMother = 'Please select an option';
    }

    if (!dob) {
      errors.dob = 'Date of birth is required';
    }

    setFormErrors(errors);
    setBackendError('');

    if (Object.keys(errors).length === 0) {
      try {
        setSubmitting(true);
        const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            passwordConfirmation,
            name,
            gender,
            isMother: isMother === 'yes',
            dob: dob?.toISOString(), // Format as ISO string
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data && data.error) {
            setBackendError(data.error);
          } else {
            setBackendError(`Registration failed: ${response.status}`);
          }
          return;
        }

        if (data.token) {
          localStorage.setItem('token', data.token);
          onLogin();
          navigate('/');
        } else {
          setBackendError('Registration succeeded but token is missing.');
        }
      } catch (error) {
        console.error('Network error:', error);
        setBackendError('Network error: ' + error.message);
      } finally {
        setSubmitting(false);
      }

      setEmail('');
      setPassword('');
      setPasswordConfirmation('');
      setGender('');
      setIsMother('');
      setDob(null);
    }
  };

  return (
    <PageFade>
      <LoadingBackdrop open={submitting} />
      <div className="min-h-screen flex flex-col justify-center items-center px-6 text-center">
        <img src="/logo.PNG" alt="App Logo" className="w-40 h-40 mb-8" />
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Create an Account</h1>
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
          <div className="flex flex-col justify-ccenter items-center gap-3">
            <TextField
              label="Name"
              fullWidth
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              label="Email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              label="Password"
              fullWidth
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
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
              label="Confirm Password"
              fullWidth
              variant="outlined"
              type={showPasswordConfirmation ? 'text' : 'password'}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              error={!!formErrors.passwordConfirmation}
              helperText={formErrors.passwordConfirmation}
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
            <FormControl fullWidth error={!!formErrors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={gender}
                label="Gender"
                onChange={(e) => {
                  setGender(e.target.value);
                  setIsMother(''); // reset motherhood status
                }}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
              <FormHelperText>{formErrors.gender}</FormHelperText>
            </FormControl>

            {gender === 'female' && (
              <FormControl fullWidth error={!!formErrors.isMother}>
                <InputLabel>Are You a Mother?</InputLabel>
                <Select
                  value={isMother}
                  label="Are You a Mother?"
                  onChange={(e) => setIsMother(e.target.value)}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
                <FormHelperText>{formErrors.isMother}</FormHelperText>
              </FormControl>
            )}

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Birth"
                value={dob}
                onChange={(newValue) => setDob(newValue)}
                maxDate={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!formErrors.dob,
                    helperText: formErrors.dob,
                  },
                }}
              />
            </LocalizationProvider>

            <div className="h-5">
              {backendError && (
                <p className="text-red-600 text-base font-light py-1 inline-block">
                  {backendError}
                </p>
              )}
            </div>
      
          </div>
          <div className="mt-10">
            <LandingButton type="submit">Sign Up</LandingButton>
          </div>
          <div className="text-gray-600 text-base">
            Already Registered?{' '}
            <Link to="/login" className="text-lime-400 font-semibold hover:underline">
              Log In
            </Link>
          </div>
        </form>
      </div>
    </PageFade>
  );
}
