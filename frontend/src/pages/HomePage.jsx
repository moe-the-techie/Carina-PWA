import React, { useState, useEffect, useMemo } from 'react';
import PageFade from '../components/PageFade';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Pagination from '@mui/material/Pagination';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { alpha } from '@mui/material/styles';
import PlanListItem from '../components/PlanListItem';
import { useNavigate } from 'react-router-dom';
import { spacing, borderRadius, shadows, zIndex, gradients, accentColors } from '../styles';
import { glassCard, glassButton } from '../styles/glassmorphism';
import { pageTitle } from '../styles/typography';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function HomePage() {
  const navigate = useNavigate();
  const [backendError, setBackendError] = useState('');
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formCredits, setFormCredits] = useState(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [filterTab, setFilterTab] = useState(0); // 0: All, 1: Active, 2: Pending
  const theme = useTheme();

  useEffect(() => {
    fetchData();
    fetchCredits();
  }, [page]);

  async function fetchCredits() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/payments/credits`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormCredits(data.formCredits);
        setPaymentsEnabled(data.paymentsEnabled !== false && import.meta.env.VITE_ENABLE_PAYMENTS !== 'false');
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const data = await fetch(`${apiBaseUrl}/api/forms/my?page=${page}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!data.ok) {
        if (data.status === 404) return;

        const errorResponse = await data.json();
        setBackendError(errorResponse?.error || `An error occurred: ${data.status}`);
        return;
      }

      const response = await data.json();
      const formsWithPlans = response.forms || [];
      setTotalPages(response.totalPages || 1);
      
      // Fetch plan data for each form
      const formsWithPlanData = await Promise.all(
        formsWithPlans.map(async (form) => {
          try {
            const planResponse = await fetch(`${apiBaseUrl}/api/forms/my/${form._id}/plan`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
            });
            
            if (planResponse.ok) {
              const planData = await planResponse.json();
              return { ...form, plan: planData.plan };
            }
          } catch (error) {
            console.log(`No plan found for form ${form._id}`);
          }
          return form;
        })
      );
      
      setForms(formsWithPlanData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      setBackendError(`An error occurred while fetching forms: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Filter forms based on selected tab
  const filteredForms = useMemo(() => {
    switch (filterTab) {
      case 1: // Active Plans
        return forms.filter(form => form.plan?.status === 'active');
      case 2: // Pending
        return forms.filter(form => !form.plan || !form.reviewed);
      default: // All
        return forms;
    }
  }, [forms, filterTab]);

  // Count active and pending for tab badges
  const activePlansCount = useMemo(() => 
    forms.filter(form => form.plan?.status === 'active').length, 
  [forms]);
  
  const pendingCount = useMemo(() => 
    forms.filter(form => !form.plan || !form.reviewed).length, 
  [forms]);

  return (
    <PageFade>
      <Box
        sx={{
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          pb: spacing.md,
          pt: { xs: `calc(${theme.spacing(spacing.lg)} + env(safe-area-inset-top))`, md: spacing.md },
          px: spacing.sm,
          mx: 'auto',
        }}
      >
        <Typography 
          variant="h4" 
          align="start" 
          gutterBottom
          sx={pageTitle(theme, { align: 'left' })}
        >
          My Forms & Plans
        </Typography>

        {/* Filter Tabs */}
        <Box sx={{ width: '100%', mb: spacing.md }}>
          <Tabs
            value={filterTab}
            onChange={(e, newValue) => setFilterTab(newValue)}
            variant="fullWidth"
            sx={{
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.9)',
              borderRadius: borderRadius.md,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48,
              },
              '& .Mui-selected': {
                fontWeight: 600,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              }
            }}
          >
            <Tab 
              icon={<ListAltIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`All (${forms.length})`}
            />
            <Tab 
              icon={<PlayCircleFilledIcon sx={{ fontSize: 18, color: filterTab === 1 ? accentColors.emerald.main : 'inherit' }} />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Active
                  {activePlansCount > 0 && (
                    <Chip 
                      label={activePlansCount} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        backgroundColor: alpha(accentColors.emerald.main, 0.2),
                        color: accentColors.emerald.main,
                        fontWeight: 600
                      }} 
                    />
                  )}
                </Box>
              }
            />
            <Tab 
              icon={<HourglassEmptyIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`Pending (${pendingCount})`}
            />
          </Tabs>
        </Box>

        {/* Credits Banner */}
        {paymentsEnabled && (
          <Box
            sx={{
              width: '100%',
              mb: spacing.md,
              p: 2,
              borderRadius: borderRadius.md,
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" fontWeight={500}>
                Form Credits:
              </Typography>
              <Chip
                label={formCredits !== null ? `${formCredits} forms` : 'Loading...'}
                color={formCredits > 0 ? 'success' : 'warning'}
                size="small"
              />
            </Box>
            <Button
              variant={formCredits === 0 ? 'contained' : 'outlined'}
              size="small"
              startIcon={<PaymentIcon />}
              onClick={() => navigate('/payment')}
              sx={{ borderRadius: 2 }}
            >
              {formCredits === 0 ? 'Buy Credits' : 'Buy More'}
            </Button>
          </Box>
        )}

        {loading ? (
          // Skeleton loading state
          <>
            {[1, 2, 3].map((item) => (
              <Card 
                key={item} 
                sx={{ 
                  ...glassCard(theme),
                  width: '100%', 
                  mb: spacing.md,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', gap: spacing.md }}>
                    <Skeleton variant="circular" width={56} height={56} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={28} />
                      <Skeleton variant="text" width="40%" height={20} sx={{ mt: spacing.sm }} />
                      <Skeleton variant="text" width="80%" height={20} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height={42} 
              sx={{ 
                mt: spacing.lg, 
                borderRadius: borderRadius.sm,
              }} 
            />
          </>
        ) : (
          <>
            {filteredForms.length === 0 && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                px: 2,
                ...glassCard(theme),
                width: '100%',
                borderRadius: borderRadius.md
              }}>
                {filterTab === 1 ? (
                  <>
                    <PlayCircleFilledIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      No active plans
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Your active plans will appear here once activated by our team.
                    </Typography>
                  </>
                ) : filterTab === 2 ? (
                  <>
                    <HourglassEmptyIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      No pending forms
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      All your forms have been reviewed!
                    </Typography>
                  </>
                ) : (
                  <Typography color="textSecondary">
                    No forms submitted yet.
                  </Typography>
                )}
              </Box>
            )}

            {filteredForms.map((form) => (
              <PlanListItem key={form._id} form={form} plan={form.plan} onClick={() => navigate(`/view-plan/${form._id}`, { state: { form } })} />
            ))}

            {totalPages > 1 && filterTab === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 8 }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={(e, value) => setPage(value)} 
                  color="primary" 
                  size="medium"
                />
              </Box>
            )}

            <Fab
              variant="extended"
              onClick={() => navigate('/new-form')}
              sx={{
                position: 'fixed',
                bottom: { xs: 'calc(80px + env(safe-area-inset-bottom) + 16px)', md: spacing.lg },
                right: spacing.lg,
                zIndex: zIndex.fab,
                ...glassButton(theme, 'primary'),
                boxShadow: shadows.glow(theme.palette.primary.main),
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              Submit New Form
            </Fab>

            {backendError && (
              <Typography align="center" color="error" sx={{ mt: spacing.md }}>
                {backendError}
              </Typography>
            )}
          </>
        )}
      </Box>
    </PageFade>
  );
}
