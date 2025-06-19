import React, { useState, useEffect } from 'react';
import PageFade from '../components/PageFade';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PlanListItem from '../components/PlanListItem';
import { useNavigate } from 'react-router-dom';
import LoadingBackdrop from '../components/LoadingBackdrop';

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
      setForms(response.forms || []);
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
          pb: 2,
          pt: 2,
          px: 1,
          mx: 'auto',
        }}
      >
        <Typography variant="h4" align="start" sx={{ color: theme.palette.contrastText.main }} gutterBottom>
          My Forms
        </Typography>

        {forms.length === 0 && (
          <Typography align="center" color="textSecondary">
            No forms submitted yet.
          </Typography>
        )}

        {forms.map((form) => (
          <PlanListItem key={form._id} form={form} onClick={() => navigate(`/view-form/${form._id}`)} />
        ))}

        <Button
          onClick={() => navigate('/new-form')}
          variant="contained"
          color="primary"
          sx={{
            width: { xs: '100%', md: '30%' },
            mt: 4,
          }}
        >
          Submit New Form
        </Button>

        {backendError && (
          <Typography align="center" color="error" sx={{ mt: 2 }}>
            {backendError}
          </Typography>
        )}
      </Box>
      <LoadingBackdrop open={loading} />
    </PageFade>
  );
}
