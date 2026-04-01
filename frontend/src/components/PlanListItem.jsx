import React from 'react';
import { Box, Typography, Chip, LinearProgress, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { spacing, borderRadius, transitions, accentColors } from '../styles';
import { glassCard, glassCardHover } from '../styles/glassmorphism';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import EditIcon from '@mui/icons-material/Edit';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

// Helper function to calculate plan progress
const calculatePlanProgress = (plan) => {
    if (!plan?.activatedAt || !plan?.duration) return 0;
    
    const activatedDate = new Date(plan.activatedAt);
    const now = new Date();
    const durationInDays = plan.duration * 7; // Duration is in weeks
    const daysPassed = Math.floor((now - activatedDate) / (1000 * 60 * 60 * 24));
    
    return Math.min(Math.round((daysPassed / durationInDays) * 100), 100);
};

// Get status configuration
const getStatusConfig = (status, theme) => {
    const configs = {
        active: {
            color: accentColors.emerald.main,
            bgColor: alpha(accentColors.emerald.main, 0.15),
            icon: PlayCircleFilledIcon,
            label: 'Active',
            glow: `0 0 20px ${alpha(accentColors.emerald.main, 0.3)}`
        },
        completed: {
            color: theme.palette.info.main,
            bgColor: alpha(theme.palette.info.main, 0.15),
            icon: CheckCircleIcon,
            label: 'Completed',
            glow: 'none'
        },
        paused: {
            color: accentColors.amber.main,
            bgColor: alpha(accentColors.amber.main, 0.15),
            icon: PauseCircleFilledIcon,
            label: 'Paused',
            glow: 'none'
        },
        draft: {
            color: theme.palette.text.secondary,
            bgColor: alpha(theme.palette.text.secondary, 0.1),
            icon: EditIcon,
            label: 'Draft',
            glow: 'none'
        }
    };
    return configs[status] || configs.draft;
};

export default function PlanListItem ({ form, plan, onClick }) {
    const theme = useTheme();
    const progress = plan?.status === 'active' ? calculatePlanProgress(plan) : 0;
    const statusConfig = plan?.status ? getStatusConfig(plan.status, theme) : null;
    const StatusIcon = statusConfig?.icon;

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
                ...(plan?.status === 'active' && {
                    borderLeft: `4px solid ${accentColors.emerald.main}`,
                    boxShadow: statusConfig.glow,
                })
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: spacing.sm }}>
                <Box sx={{ flex: 1 }}>
                    {plan ? (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                    {plan.title || 'Nutrition Plan'}
                                </Typography>
                            </Box>
                            {plan.description && (
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: theme.palette.text.secondary, 
                                        mb: 0.5,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '250px'
                                    }}
                                >
                                    {plan.description}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <>
                            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                Form Submitted
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HourglassEmptyIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    {form.reviewed ? 'Plan being prepared' : 'Pending review'}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
                
                {/* Status Chip */}
                {plan?.status && statusConfig && (
                    <Chip
                        icon={<StatusIcon sx={{ fontSize: 16 }} />}
                        label={statusConfig.label}
                        size="small"
                        sx={{
                            backgroundColor: statusConfig.bgColor,
                            color: statusConfig.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                                color: statusConfig.color
                            }
                        }}
                    />
                )}
            </Box>
            
            {/* Progress bar for active plans */}
            {plan?.status === 'active' && (
                <Box sx={{ mb: spacing.sm }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Progress
                        </Typography>
                        <Typography variant="caption" sx={{ color: statusConfig.color, fontWeight: 600 }}>
                            {progress}%
                        </Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(statusConfig.color, 0.2),
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: statusConfig.color
                            }
                        }}
                    />
                </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {new Date(form.createdAt).toLocaleDateString()}
                </Typography>
                
                {plan?.goals?.targetCalories && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocalFireDepartmentIcon sx={{ fontSize: 14, color: accentColors.amber.main }} />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {plan.goals.targetCalories} kcal/day
                        </Typography>
                    </Box>
                )}
                
                {plan?.duration && (
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {plan.duration} week{plan.duration > 1 ? 's' : ''}
                    </Typography>
                )}

                {Array.isArray(plan?.fruits) && plan.fruits.length > 0 && (
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Fruits: {plan.fruits.length}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}