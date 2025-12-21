import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { spacing, borderRadius, transitions } from '../styles';
import { glassCard, glassCardHover } from '../styles/glassmorphism';

export default function PlanListItem ({ form, plan, onClick }) {
    const theme = useTheme();

    return (
        <Box
            onClick={onClick}
            sx={{ 
                ...glassCard(theme),
                p: spacing.md, 
                mb: spacing.sm, 
                borderRadius: borderRadius.md, 
                alignSelf: 'stretch',
                cursor: 'pointer',
                transition: transitions.normal,
                '&:hover': glassCardHover(theme),
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: spacing.sm }}>
                <Box>
                    {plan ? (
                        <>
                            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                Plan{plan.title ? `: ${plan.title}` : ''}
                            </Typography>
                            {plan.status && (
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    Status: {plan.status}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <>
                            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                Form Submitted
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {form.reviewed ? 'Plan being prepared' : 'Pending review'}
                            </Typography>
                        </>
                    )}
                </Box>
            </Box>
            
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Date: {new Date(form.createdAt).toLocaleString()}
            </Typography>
            
            {plan?.goals?.targetCalories && (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Target: {plan.goals.targetCalories} kcal/day
                </Typography>
            )}
        </Box>
    );
}