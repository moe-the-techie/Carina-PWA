import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  MobileStepper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import ChatIcon from '@mui/icons-material/Chat';
import CampaignIcon from '@mui/icons-material/Campaign';
import DownloadIcon from '@mui/icons-material/Download';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import AndroidIcon from '@mui/icons-material/Android';
import LaptopIcon from '@mui/icons-material/Laptop';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxIcon from '@mui/icons-material/AddBox';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { glassDialog, glassButton } from '../styles/glassmorphism';
import { borderRadius, spacing } from '../styles/constants';

const ONBOARDING_STORAGE_KEY = 'carina_onboarding_completed';

const steps = [
  {
    label: 'Welcome',
    title: 'Welcome to Carina! 🎉',
    description: 'Your personalized fitness and nutrition planning assistant. Let us show you around and help you get the most out of your experience.',
    icon: <HomeIcon sx={{ fontSize: 60 }} />,
  },
  {
    label: 'Forms',
    title: 'Submit Your Information',
    description: 'Start by filling out a form with your goals, preferences, and current fitness level. Our team will use this to create a personalized plan just for you.',
    icon: <DescriptionIcon sx={{ fontSize: 60 }} />,
  },
  {
    label: 'Plans',
    title: 'View Your Plans',
    description: 'Once your plan is ready, you can view it anytime from your home page. Track your progress and stay motivated with your customized workout and nutrition schedule.',
    icon: <HomeIcon sx={{ fontSize: 60 }} />,
  },
  {
    label: 'Chat',
    title: 'Stay Connected',
    description: 'Have questions? Use the chat feature to communicate directly with your coach. Get real-time support and guidance whenever you need it.',
    icon: <ChatIcon sx={{ fontSize: 60 }} />,
  },
  {
    label: 'Announcements',
    title: 'Stay Updated',
    description: 'Check the announcements page for important updates, tips, and news. Never miss out on new features or special promotions.',
    icon: <CampaignIcon sx={{ fontSize: 60 }} />,
  },
  {
    label: 'Install App',
    title: 'Install the App',
    description: 'For the best experience, install Carina as an app on your device. It works offline and gives you quick access to all features!',
    icon: <DownloadIcon sx={{ fontSize: 60 }} />,
    isPWAStep: true,
  },
];

function PWAInstallInstructions() {
  const theme = useTheme();
  const [platform, setPlatform] = useState('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  const instructionCardStyle = {
    p: 2,
    borderRadius: borderRadius.md,
    background: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.03)',
    mb: 2,
  };

  const instructions = {
    ios: (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <PhoneIphoneIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            iPhone / iPad
          </Typography>
        </Box>
        <Box sx={instructionCardStyle}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>1.</strong> Tap the Share button <IosShareIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} /> at the bottom of Safari
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>2.</strong> Scroll down and tap "Add to Home Screen" <AddBoxIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} />
          </Typography>
          <Typography variant="body2">
            <strong>3.</strong> Tap "Add" in the top right corner
          </Typography>
        </Box>
      </Box>
    ),
    android: (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <AndroidIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            Android
          </Typography>
        </Box>
        <Box sx={instructionCardStyle}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>1.</strong> Tap the menu button <MoreVertIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} /> in Chrome
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>2.</strong> Tap "Install app" or "Add to Home screen"
          </Typography>
          <Typography variant="body2">
            <strong>3.</strong> Confirm by tapping "Install"
          </Typography>
        </Box>
      </Box>
    ),
    desktop: (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <LaptopIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            Desktop (Chrome, Edge)
          </Typography>
        </Box>
        <Box sx={instructionCardStyle}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>1.</strong> Look for the install icon <DownloadIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} /> in the address bar
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>2.</strong> Click "Install" in the popup
          </Typography>
          <Typography variant="body2">
            <strong>3.</strong> The app will open in its own window
          </Typography>
        </Box>
      </Box>
    ),
  };

  return (
    <Box sx={{ mt: 2 }}>
      {instructions[platform]}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
        {['ios', 'android', 'desktop'].map((p) => (
          <Button
            key={p}
            size="small"
            variant={platform === p ? 'contained' : 'outlined'}
            onClick={() => setPlatform(p)}
            sx={{ 
              minWidth: 'auto', 
              px: 1.5,
              textTransform: 'capitalize',
            }}
          >
            {p === 'ios' ? 'iOS' : p === 'android' ? 'Android' : 'Desktop'}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

export default function OnboardingOverlay({ forceShow = false, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setOpen(true);
      return;
    }
    
    const onboardingCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!onboardingCompleted) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setOpen(false);
    onClose?.();
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setOpen(false);
    onClose?.();
  };

  const currentStep = steps[activeStep];

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          ...glassDialog(theme),
          borderRadius: isMobile ? 0 : borderRadius.lg,
          maxHeight: isMobile ? '100%' : '90vh',
          m: isMobile ? 0 : 2,
        },
      }}
    >
      <IconButton
        onClick={handleSkip}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.text.secondary,
          zIndex: 1,
        }}
        aria-label="close"
      >
        <CloseIcon />
      </IconButton>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
          p: { xs: 3, sm: 4 },
          pt: { xs: 5, sm: 5 },
          minHeight: isMobile ? '100vh' : 'auto',
        }}
      >
        {/* Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 400,
            py: 2,
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
              border: `2px solid ${theme.palette.primary.main}40`,
              color: theme.palette.primary.main,
            }}
          >
            {currentStep.icon}
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {currentStep.title}
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 2, lineHeight: 1.6 }}
          >
            {currentStep.description}
          </Typography>

          {/* PWA Install Instructions */}
          {currentStep.isPWAStep && <PWAInstallInstructions />}
        </Box>

        {/* Stepper & Navigation */}
        <Box sx={{ width: '100%', mt: 3 }}>
          {!isMobile && (
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.75rem',
                        display: { xs: 'none', sm: 'block' },
                      },
                    }}
                  />
                </Step>
              ))}
            </Stepper>
          )}

          {isMobile && (
            <MobileStepper
              variant="dots"
              steps={steps.length}
              position="static"
              activeStep={activeStep}
              sx={{
                background: 'transparent',
                justifyContent: 'center',
                mb: 2,
                '& .MuiMobileStepper-dot': {
                  mx: 0.5,
                },
                '& .MuiMobileStepper-dotActive': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
              backButton={null}
              nextButton={null}
            />
          )}

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<KeyboardArrowLeft />}
              sx={{ 
                visibility: activeStep === 0 ? 'hidden' : 'visible',
                minWidth: 100,
              }}
            >
              Back
            </Button>

            <Button
              onClick={handleSkip}
              color="inherit"
              sx={{ 
                opacity: 0.7,
                fontSize: '0.875rem',
              }}
            >
              Skip
            </Button>

            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={activeStep !== steps.length - 1 && <KeyboardArrowRight />}
              sx={{
                minWidth: 100,
                ...glassButton(theme),
              }}
            >
              {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
