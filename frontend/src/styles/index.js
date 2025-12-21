/**
 * Unified Styles Export
 * Central entry point for all style utilities
 */

// Constants
export {
    spacing,
    borderRadius,
    opacity,
    accentColors,
    priorityColors,
    statusColors,
    shadows,
    transitions,
    gradients,
    zIndex,
} from './constants';

// Glassmorphism
export {
    glassCard,
    glassContainer,
    glassInput,
    glassButton,
    glassDialog,
    glassCardHover,
} from './glassmorphism';

// Animations
export {
    pageVariants,
    containerVariants,
    itemVariants,
    fadeVariants,
    slideVariants,
    scaleVariants,
    cardVariants,
    listItemVariants,
    modalVariants,
    backdropVariants,
    notificationVariants,
    fabVariants,
    staggerOptions,
    springPresets,
} from './animations';

// Typography
export {
    gradientText,
    pageTitle,
    sectionTitle,
    subtitle,
    cardTitle,
    label,
    bodyText,
    linkText,
    errorText,
    successText,
    truncateText,
    statValue,
    statLabel,
} from './typography';

// Styled Components
export {
    GlassCard,
    GlassPaper,
    PageWrapper,
    GradientText,
    PageTitle,
    SectionTitle,
    StatCard,
    PrimaryButton,
    SecondaryButton,
    GlassIconButton,
    StatusChip,
    GlassTextField,
    HeaderSection,
    ContentContainer,
    GridContainer,
    EmptyState,
    LoadingState,
    ScrollableContainer,
    IconWrapper,
    DividerWithText,
} from './components';

// ===== COMMON PAGE STYLES =====

/**
 * Creates consistent page wrapper styles
 * @param {object} theme - MUI theme object
 */
export const pageWrapper = (theme) => ({
    minHeight: '100vh',
    background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #121212 0%, #1a1a2e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    py: { xs: 2, sm: 3, md: 4 },
    px: { xs: 2, sm: 3, md: 4 },
});

/**
 * Creates consistent admin page wrapper styles
 * @param {object} theme - MUI theme object
 */
export const adminPageWrapper = (theme) => ({
    ...pageWrapper(theme),
    pb: { xs: 4, sm: 5 },
});

/**
 * Creates consistent content container styles
 * @param {object} theme - MUI theme object
 * @param {string} maxWidth - Optional max width
 */
export const contentContainer = (theme, maxWidth = '1200px') => ({
    maxWidth,
    mx: 'auto',
    width: '100%',
});

/**
 * Creates consistent header section styles
 */
export const headerSection = () => ({
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', sm: 'center' },
    gap: 2,
    mb: { xs: 3, sm: 4 },
});

/**
 * Creates consistent grid container styles
 */
export const gridContainer = () => ({
    display: 'grid',
    gap: { xs: 2, sm: 3 },
});

/**
 * Creates responsive grid columns
 * @param {object} columns - Column configuration
 */
export const gridColumns = (columns = { xs: 1, sm: 2, md: 3, lg: 4 }) => ({
    gridTemplateColumns: {
        xs: `repeat(${columns.xs}, 1fr)`,
        sm: `repeat(${columns.sm}, 1fr)`,
        md: `repeat(${columns.md}, 1fr)`,
        lg: `repeat(${columns.lg}, 1fr)`,
    },
});

/**
 * Flex utilities
 */
export const flex = {
    center: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    between: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    start: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    end: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
    },
    columnCenter: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wrap: {
        display: 'flex',
        flexWrap: 'wrap',
    },
};

/**
 * Creates empty state container styles
 * @param {object} theme - MUI theme object
 */
export const emptyState = (theme) => ({
    ...flex.columnCenter,
    py: { xs: 4, sm: 6, md: 8 },
    textAlign: 'center',
    color: theme.palette.text.secondary,
});

/**
 * Creates loading state container styles
 */
export const loadingState = () => ({
    ...flex.center,
    minHeight: '200px',
});

/**
 * Creates icon button styles
 * @param {object} theme - MUI theme object
 * @param {string} variant - 'default', 'primary', 'error'
 */
export const iconButton = (theme, variant = 'default') => {
    const isDark = theme.palette.mode === 'dark';
    
    const variants = {
        default: {
            color: theme.palette.text.secondary,
            '&:hover': {
                color: theme.palette.text.primary,
                backgroundColor: isDark 
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
            },
        },
        primary: {
            color: theme.palette.primary.main,
            '&:hover': {
                backgroundColor: `${theme.palette.primary.main}15`,
            },
        },
        error: {
            color: theme.palette.error.main,
            '&:hover': {
                backgroundColor: `${theme.palette.error.main}15`,
            },
        },
    };

    return {
        transition: 'all 0.2s ease',
        ...variants[variant],
    };
};

/**
 * Creates chip styles
 * @param {object} theme - MUI theme object
 * @param {string} color - Color value or theme path
 */
export const chip = (theme, color) => ({
    backgroundColor: `${color}20`,
    color: color,
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 'auto',
    py: 0.5,
    '& .MuiChip-label': {
        px: 1.5,
    },
});

/**
 * Creates badge styles
 * @param {string} color - Badge color
 */
export const badge = (color) => ({
    '& .MuiBadge-badge': {
        backgroundColor: color,
        color: '#fff',
    },
});

/**
 * Creates scrollable container styles
 * @param {object} theme - MUI theme object
 */
export const scrollableContainer = (theme) => ({
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
});
