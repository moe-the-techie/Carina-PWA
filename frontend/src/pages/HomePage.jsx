import React, { useState, useEffect } from 'react';
import PageFade from '../components/PageFade';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Pagination from '@mui/material/Pagination';
import PlanListItem from '../components/PlanListItem';
import { useNavigate } from 'react-router-dom';
import { spacing, borderRadius, shadows, zIndex, gradients } from '../styles';
import { glassCard, glassButton } from '../styles/glassmorphism';
import { pageTitle } from '../styles/typography';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function HomePage() {
  const navigate = useNavigate();
  const [backendError, setBackendError] = useState('');
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, [page]);

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
          My Forms
        </Typography>

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
            {forms.length === 0 && (
              <Typography align="center" color="textSecondary">
                No forms submitted yet.
              </Typography>
            )}

            {forms.map((form) => (
              <PlanListItem key={form._id} form={form} plan={form.plan} onClick={() => navigate(`/view-plan/${form._id}`, { state: { form } })} />
            ))}

            {totalPages > 1 && (
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
