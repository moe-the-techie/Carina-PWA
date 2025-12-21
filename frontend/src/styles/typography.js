/**
 * Typography Style Utilities
 * Consistent text styles across the application
 */

import { gradients } from './constants';

/**
 * Creates a gradient text style
 * @param {object} theme - MUI theme object
 * @param {string} gradient - Optional custom gradient
 */
export const gradientText = (theme, gradient = null) => ({
    fontWeight: 700,
    background: gradient || gradients.primary(theme),
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textFillColor: 'transparent',
});

/**
 * Page title style
 * @param {object} theme - MUI theme object
 * @param {object} options - Optional customizations
 */
export const pageTitle = (theme, options = {}) => {
    const { gradient = true, size = 'large' } = options;

    const sizeMap = {
        small: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
        medium: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
        large: { xs: '2rem', sm: '2.25rem', md: '2.5rem' },
    };

    const baseStyle = {
        fontWeight: 800,
        fontSize: sizeMap[size],
        lineHeight: 1.2,
        mb: { xs: 1, sm: 2 },
    };

    if (gradient) {
        return {
            ...baseStyle,
            ...gradientText(theme),
        };
    }

    return {
        ...baseStyle,
        color: theme.palette.text.primary,
    };
};

/**
 * Section title style
 * @param {object} theme - MUI theme object
 */
export const sectionTitle = (theme) => ({
    fontWeight: 700,
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    color: theme.palette.text.primary,
    mb: 2,
});

/**
 * Subtitle style
 * @param {object} theme - MUI theme object
 */
export const subtitle = (theme) => ({
    fontWeight: 400,
    fontSize: { xs: '0.875rem', sm: '1rem' },
    color: theme.palette.text.secondary,
    lineHeight: 1.6,
});

/**
 * Card title style
 * @param {object} theme - MUI theme object
 */
export const cardTitle = (theme) => ({
    fontWeight: 600,
    fontSize: { xs: '1rem', sm: '1.125rem' },
    color: theme.palette.text.primary,
    lineHeight: 1.3,
});

/**
 * Label style
 * @param {object} theme - MUI theme object
 */
export const label = (theme) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
});

/**
 * Body text styles
 * @param {object} theme - MUI theme object
 * @param {string} variant - 'primary', 'secondary', 'muted'
 */
export const bodyText = (theme, variant = 'primary') => {
    const variants = {
        primary: {
            color: theme.palette.text.primary,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            lineHeight: 1.6,
        },
        secondary: {
            color: theme.palette.text.secondary,
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            lineHeight: 1.5,
        },
        muted: {
            color: theme.palette.text.disabled || 'rgba(0, 0, 0, 0.38)',
            fontSize: '0.75rem',
            lineHeight: 1.4,
        },
    };

    return variants[variant];
};

/**
 * Link text style
 * @param {object} theme - MUI theme object
 */
export const linkText = (theme) => ({
    color: theme.palette.primary.main,
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    '&:hover': {
        color: theme.palette.primary.darker,
        textDecoration: 'underline',
    },
});

/**
 * Error text style
 * @param {object} theme - MUI theme object
 */
export const errorText = (theme) => ({
    color: theme.palette.error.main,
    fontSize: '0.75rem',
    fontWeight: 500,
    mt: 0.5,
});

/**
 * Success text style
 * @param {object} theme - MUI theme object
 */
export const successText = (theme) => ({
    color: theme.palette.success?.main || '#4caf50',
    fontSize: '0.75rem',
    fontWeight: 500,
    mt: 0.5,
});

/**
 * Truncate text with ellipsis
 */
export const truncateText = (lines = 1) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    ...(lines === 1
        ? { whiteSpace: 'nowrap' }
        : {
            display: '-webkit-box',
            WebkitLineClamp: lines,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'normal',
        }),
});

/**
 * Stat value style (for dashboard cards)
 * @param {object} theme - MUI theme object
 * @param {string} color - Optional color override
 */
export const statValue = (theme, color) => ({
    fontWeight: 800,
    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
    lineHeight: 1,
    color: color || theme.palette.text.primary,
});

/**
 * Stat label style (for dashboard cards)
 * @param {object} theme - MUI theme object
 */
export const statLabel = (theme) => ({
    fontWeight: 500,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    mt: 1,
});
