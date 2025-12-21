/**
 * Reusable Styled Components
 * Pre-built components with consistent styling
 */

import { styled } from '@mui/material/styles';
import { Box, Paper, Card, Typography, Button, IconButton, Chip, TextField } from '@mui/material';
import { borderRadius, shadows, accentColors } from './constants';

// ===== GLASS CARD =====
export const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: borderRadius.md * 4,
    border: `1px solid ${theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.06)'}`,
    boxShadow: theme.palette.mode === 'dark' 
        ? shadows.card.dark 
        : shadows.card.light,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 40px rgba(0, 0, 0, 0.5)'
            : `0 12px 40px ${theme.palette.primary.main}20`,
        borderColor: `${theme.palette.primary.main}40`,
    },
}));

// ===== GLASS PAPER =====
export const GlassPaper = styled(Paper)(({ theme }) => ({
    background: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: borderRadius.md * 4,
    border: `1px solid ${theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.06)'}`,
    boxShadow: 'none',
}));

// ===== PAGE WRAPPER =====
export const PageWrapper = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #121212 0%, #1a1a2e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
    },
}));

// ===== GRADIENT TEXT =====
export const GradientText = styled(Typography)(({ theme }) => ({
    fontWeight: 800,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textFillColor: 'transparent',
}));

// ===== PAGE TITLE =====
export const PageTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 800,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textFillColor: 'transparent',
    fontSize: '2.25rem',
    lineHeight: 1.2,
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.75rem',
    },
}));

// ===== SECTION TITLE =====
export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    fontSize: '1.5rem',
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.25rem',
    },
}));

// ===== STAT CARD =====
export const StatCard = styled(Box)(({ theme, gradient }) => {
    const gradientColors = {
        amber: accentColors.amber,
        emerald: accentColors.emerald,
        violet: accentColors.violet,
        rose: accentColors.rose,
        sky: accentColors.sky,
        primary: { main: theme.palette.primary.main, dark: theme.palette.primary.dark },
    };

    const colors = gradientColors[gradient] || gradientColors.primary;

    return {
        background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: borderRadius.md * 4,
        border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(0, 0, 0, 0.06)'}`,
        padding: theme.spacing(3),
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colors.main}, ${colors.dark})`,
        },
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 30px ${colors.main}25`,
        },
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(2),
        },
    };
});

// ===== PRIMARY BUTTON =====
export const PrimaryButton = styled(Button)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    color: '#000',
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: borderRadius.sm * 4,
    textTransform: 'none',
    boxShadow: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${theme.palette.primary.main}40`,
    },
    '&:active': {
        transform: 'translateY(0)',
    },
    '&.Mui-disabled': {
        background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.12)',
        color: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(0, 0, 0, 0.26)',
    },
}));

// ===== SECONDARY BUTTON =====
export const SecondaryButton = styled(Button)(({ theme }) => ({
    background: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
    color: theme.palette.text.primary,
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: borderRadius.sm * 4,
    textTransform: 'none',
    border: `1px solid ${theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.12)' 
        : 'rgba(0, 0, 0, 0.08)'}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.06)',
        transform: 'translateY(-2px)',
    },
}));

// ===== GLASS ICON BUTTON =====
export const GlassIconButton = styled(IconButton)(({ theme }) => ({
    background: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.06)'}`,
    transition: 'all 0.2s ease',
    '&:hover': {
        background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.06)',
        transform: 'scale(1.05)',
    },
}));

// ===== STATUS CHIP =====
export const StatusChip = styled(Chip)(({ theme, status }) => {
    const statusColors = {
        success: { bg: '#4caf5020', color: '#4caf50' },
        warning: { bg: '#ff980020', color: '#ff9800' },
        error: { bg: '#f4433620', color: '#f44336' },
        info: { bg: '#2196f320', color: '#2196f3' },
        pending: { bg: '#9e9e9e20', color: '#9e9e9e' },
        primary: { bg: `${theme.palette.primary.main}20`, color: theme.palette.primary.main },
    };

    const colors = statusColors[status] || statusColors.primary;

    return {
        backgroundColor: colors.bg,
        color: colors.color,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 'auto',
        padding: '4px 0',
        borderRadius: borderRadius.xs * 4,
        '& .MuiChip-label': {
            padding: '0 12px',
        },
    };
});

// ===== GLASS TEXT FIELD =====
export const GlassTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: borderRadius.sm * 4,
        transition: 'all 0.2s ease',
        '& fieldset': {
            borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            transition: 'border-color 0.2s ease',
        },
        '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
        },
    },
    '& .MuiInputLabel-root': {
        color: theme.palette.text.secondary,
        '&.Mui-focused': {
            color: theme.palette.primary.main,
        },
    },
}));

// ===== HEADER SECTION =====
export const HeaderSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(4),
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: theme.spacing(3),
    },
}));

// ===== CONTENT CONTAINER =====
export const ContentContainer = styled(Box)(({ theme, maxWidth = '1200px' }) => ({
    maxWidth,
    margin: '0 auto',
    width: '100%',
}));

// ===== GRID CONTAINER =====
export const GridContainer = styled(Box)(({ theme, columns = { xs: 1, sm: 2, md: 3, lg: 4 } }) => ({
    display: 'grid',
    gap: theme.spacing(3),
    gridTemplateColumns: `repeat(${columns.xs}, 1fr)`,
    [theme.breakpoints.up('sm')]: {
        gridTemplateColumns: `repeat(${columns.sm}, 1fr)`,
    },
    [theme.breakpoints.up('md')]: {
        gridTemplateColumns: `repeat(${columns.md}, 1fr)`,
    },
    [theme.breakpoints.up('lg')]: {
        gridTemplateColumns: `repeat(${columns.lg}, 1fr)`,
    },
}));

// ===== EMPTY STATE =====
export const EmptyState = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(4),
    },
}));

// ===== LOADING STATE =====
export const LoadingState = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
});

// ===== SCROLLABLE CONTAINER =====
export const ScrollableContainer = styled(Box)(({ theme }) => ({
    overflow: 'auto',
    '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
        borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(0, 0, 0, 0.2)',
    },
}));

// ===== ICON WRAPPER =====
export const IconWrapper = styled(Box)(({ theme, color, size = 48 }) => ({
    width: size,
    height: size,
    borderRadius: borderRadius.sm * 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color 
        ? `linear-gradient(135deg, ${color}20, ${color}10)`
        : `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.main}10)`,
    color: color || theme.palette.primary.main,
    '& svg': {
        fontSize: size * 0.5,
    },
}));

// ===== DIVIDER WITH TEXT =====
export const DividerWithText = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    margin: `${theme.spacing(3)} 0`,
    '&::before, &::after': {
        content: '""',
        flex: 1,
        height: '1px',
        background: theme.palette.divider,
    },
    '& span': {
        color: theme.palette.text.secondary,
        fontSize: '0.875rem',
        fontWeight: 500,
    },
}));
