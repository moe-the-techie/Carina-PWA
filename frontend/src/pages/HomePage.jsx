import React, { useState, useEffect } from 'react';
import PageFade from '../components/PageFade';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import PlanListItem from '../components/PlanListItem';
import { useNavigate } from 'react-router-dom';
import { spacing, borderRadius, shadows } from '../styles';
import { glassCard } from '../styles/glassmorphism';
import { pageTitle } from '../styles/typography';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function HomePage() {
  const navigate = useNavigate();
  const [backendError, setBackendError] = useState('');
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await fetch(`${apiBaseUrl}/api/forms/my`, {
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
          pt: spacing.md,
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

            <Button
              onClick={() => navigate('/new-form')}
              variant="contained"
              color="primary"
              sx={{
                width: { xs: '100%', md: '30%' },
                mt: spacing.lg,
                borderRadius: borderRadius.md,
                boxShadow: shadows.button,
              }}
            >
              Submit New Form
            </Button>

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
