import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function PlanListItem ({ form, plan, onClick }) {
    const theme = useTheme();

    // Calculate average daily calories if plan exists
    const getAverageCalories = () => {
        if (!plan?.weeklyPlans || plan.weeklyPlans.length === 0) return null;
        
        const totalCalories = plan.weeklyPlans.reduce((sum, day) => {
            return sum + (day.totalCalories || 0);
        }, 0);
        
        return Math.round(totalCalories / plan.weeklyPlans.length);
    };

    const averageCalories = getAverageCalories();

    return (
        <Box
            onClick={onClick}
            sx={{ 
                backgroundColor: theme.palette.background.container, 
                p: 2, 
                m: 1, 
                borderRadius: 4, 
                width: '100%',
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
                
                {averageCalories && (
                    <Chip 
                        label={`~${averageCalories} kcal/day`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                )}
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