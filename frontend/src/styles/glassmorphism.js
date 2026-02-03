/**
 * Glassmorphism Style Utilities
 * Consistent glass-effect styles across the application
 */

import { borderRadius, opacity, shadows } from './constants';

/**
 * Creates a glassmorphism card style
 * @param {object} theme - MUI theme object
 * @param {object} options - Optional customizations
 */
export const glassCard = (theme, options = {}) => {
    const {
        blur = 20,
        elevation = 'normal', // 'subtle', 'normal', 'elevated'
        rounded = 'md',
    } = options;

    const isDark = theme.palette.mode === 'dark';

    const backgroundOpacity = {
        subtle: isDark ? opacity.subtle : 0.7,
        normal: isDark ? opacity.light : 0.9,
        elevated: isDark ? opacity.soft : 0.95,
    };

    const borderOpacity = {
        subtle: isDark ? opacity.light : opacity.medium,
        normal: isDark ? opacity.soft : opacity.light,
        elevated: isDark ? opacity.medium : opacity.soft,
    };

    return {
        background: isDark
            ? `rgba(255, 255, 255, ${backgroundOpacity[elevation]})`
            : `rgba(255, 255, 255, ${backgroundOpacity[elevation]})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        borderRadius: borderRadius[rounded],
        border: `1px solid ${isDark 
            ? `rgba(255, 255, 255, ${borderOpacity[elevation]})` 
            : `rgba(0, 0, 0, ${borderOpacity[elevation]})`}`,
        boxShadow: isDark ? shadows.card.dark : shadows.card.light,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };
};

/**
 * Creates a glass container style (for page backgrounds)
 * @param {object} theme - MUI theme object
 */
export const glassContainer = (theme) => {
    const isDark = theme.palette.mode === 'dark';
    
    return {
        background: isDark
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: borderRadius.lg,
        border: `1px solid ${isDark 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)'}`,
    };
};

/**
 * Creates a glass input field style
 * @param {object} theme - MUI theme object
 */
export const glassInput = (theme) => {
    const isDark = theme.palette.mode === 'dark';
    
    return {
        '& .MuiOutlinedInput-root': {
            background: isDark
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: borderRadius.sm,
            transition: 'all 0.2s ease',
            '& fieldset': {
                borderColor: isDark
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
    };
};

/**
 * Creates a glass button style
 * @param {object} theme - MUI theme object
 * @param {string} variant - 'primary', 'secondary', 'subtle'
 */
export const glassButton = (theme, variant = 'primary') => {
    const isDark = theme.palette.mode === 'dark';
    
    const variants = {
        primary: {
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.darker})`,
            color: isDark ? '#000' : '#000',
            '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.lighter}, ${theme.palette.primary.main})`,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${theme.palette.primary.main}40`,
            },
        },
        secondary: {
            background: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
            color: theme.palette.text.primary,
            border: `1px solid ${isDark 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(0, 0, 0, 0.1)'}`,
            '&:hover': {
                background: isDark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.08)',
                transform: 'translateY(-2px)',
            },
        },
        subtle: {
            background: 'transparent',
            color: theme.palette.text.secondary,
            '&:hover': {
                background: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
            },
        },
    };

    return {
        borderRadius: borderRadius.sm,
        textTransform: 'none',
        fontWeight: 600,
        transition: 'all var(--transition-normal, 0.3s) cubic-bezier(0.4, 0, 0.2, 1)',
        ...variants[variant],
    };
};

/**
 * Creates a glass dialog style
 * @param {object} theme - MUI theme object
 */
export const glassDialog = (theme) => {
    const isDark = theme.palette.mode === 'dark';
    
    return {
        '& .MuiDialog-paper': {
            background: isDark
                ? 'rgba(30, 30, 30, 0.95)'
                : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: borderRadius.lg,
            border: `1px solid ${isDark 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.06)'}`,
            boxShadow: isDark
                ? '0 24px 48px rgba(0, 0, 0, 0.5)'
                : '0 24px 48px rgba(0, 0, 0, 0.15)',
        },
    };
};

/**
 * Hover effect for glass cards
 * @param {object} theme - MUI theme object
 */
export const glassCardHover = (theme) => ({
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 40px rgba(0, 0, 0, 0.5)'
            : `0 12px 40px ${theme.palette.primary.main}20`,
        borderColor: `${theme.palette.primary.main}40`,
    },
});
