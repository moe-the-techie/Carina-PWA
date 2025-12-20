import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function PlanListItem ({ form, plan, onClick }) {
    const theme = useTheme();

    return (
        <Box
            onClick={onClick}
            sx={{ 
                backgroundColor: theme.palette.background.container, 
                p: 2, 
                m: 1, 
                borderRadius: 4, 
                alignSelf: 'stretch',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: theme.palette.background.darker,
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                    {plan ? (
                        <>
                            <Typography sx={{ color: theme.palette.contrastText.primary, fontWeight: 'bold' }}>
                                Plan{plan.title ? `: ${plan.title}` : ''}
                            </Typography>
                            {plan.status && (
                                <Typography variant="caption" sx={{ color: theme.palette.contrastText.secondary }}>
                                    Status: {plan.status}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <>
                            <Typography sx={{ color: theme.palette.contrastText.primary, fontWeight: 'bold' }}>
                                Form Submitted
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.contrastText.secondary }}>
                                {form.reviewed ? 'Plan being prepared' : 'Pending review'}
                            </Typography>
                        </>
                    )}
                </Box>
            </Box>
            
            <Typography variant="body2" sx={{ color: theme.palette.contrastText.secondary }}>
                Date: {new Date(form.createdAt).toLocaleString()}
            </Typography>
            
            {plan?.goals?.targetCalories && (
                <Typography variant="caption" sx={{ color: theme.palette.contrastText.secondary }}>
                    Target: {plan.goals.targetCalories} kcal/day
                </Typography>
            )}
        </Box>
    );
}