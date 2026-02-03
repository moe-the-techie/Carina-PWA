/**
 * Unified Style Constants
 * Central location for all reusable style values and patterns
 */

// ===== SPACING TOKENS =====
export const spacing = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6,
    page: {
        padding: { xs: 2, sm: 3, md: 4 },
        paddingTop: { xs: 2, sm: 3 },
    },
    section: {
        marginBottom: { xs: 3, sm: 4 },
    },
    card: {
        padding: { xs: 2, sm: 3 },
        gap: { xs: 2, sm: 3 },
    },
    input: {
        marginBottom: { xs: 1.5, sm: 2 },
    },
};

// ===== BORDER RADIUS TOKENS =====
export const borderRadius = {
    xs: 1,      // 4px - small elements like chips
    sm: 2,      // 8px - buttons, inputs
    md: 3,      // 12px - cards, dialogs
    lg: 4,      // 16px - large cards, containers
    xl: 6,      // 24px - hero sections
    full: '50%', // circular
};

// ===== OPACITY TOKENS =====
export const opacity = {
    subtle: 0.03,
    light: 0.05,
    soft: 0.08,
    medium: 0.1,
    strong: 0.2,
    heavy: 0.3,
};

// ===== ACCENT COLORS =====
// These extend the theme palette for gradients and special UI elements
export const accentColors = {
    amber: {
        main: '#F59E0B',
        dark: '#D97706',
        light: '#FBBF24',
    },
    emerald: {
        main: '#10B981',
        dark: '#059669',
        light: '#34D399',
    },
    violet: {
        main: '#8B5CF6',
        dark: '#7C3AED',
        light: '#A78BFA',
    },
    rose: {
        main: '#F43F5E',
        dark: '#E11D48',
        light: '#FB7185',
    },
    sky: {
        main: '#0EA5E9',
        dark: '#0284C7',
        light: '#38BDF8',
    },
    slate: {
        main: '#64748B',
        dark: '#475569',
        light: '#94A3B8',
    },
};

// ===== PRIORITY COLORS =====
export const priorityColors = {
    low: '#4caf50',
    normal: '#2196f3',
    high: '#ff9800',
    urgent: '#f44336',
};

// ===== STATUS COLORS =====
export const statusColors = {
    success: '#4caf50',
    info: '#2196f3',
    warning: '#ff9800',
    error: '#f44336',
    pending: '#9e9e9e',
};

// ===== SHADOW TOKENS =====
export const shadows = {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    glow: (color) => `0 0 20px ${color}40`,
    card: {
        light: '0 2px 12px rgba(0, 0, 0, 0.08)',
        dark: '0 4px 20px rgba(0, 0, 0, 0.4)',
    },
    button: '0 4px 6px rgba(0, 0, 0, 0.12)',
};

// ===== TRANSITION TOKENS =====
export const transitions = {
    fast: 'all 0.15s ease',
    normal: 'all 0.25s ease',
    slow: 'all 0.4s ease',
    bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    // Mobile-specific transitions (use these with CSS custom properties)
    mobileFast: 'all 0.1s ease',
    mobileNormal: 'all 0.2s ease',
    mobileSlow: 'all 0.3s ease',
};

// ===== GRADIENT PRESETS =====
export const gradients = {
    primary: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    primarySoft: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
    amber: `linear-gradient(135deg, ${accentColors.amber.main}, ${accentColors.amber.dark})`,
    emerald: `linear-gradient(135deg, ${accentColors.emerald.main}, ${accentColors.emerald.dark})`,
    violet: `linear-gradient(135deg, ${accentColors.violet.main}, ${accentColors.violet.dark})`,
    rose: `linear-gradient(135deg, ${accentColors.rose.main}, ${accentColors.rose.dark})`,
    sky: `linear-gradient(135deg, ${accentColors.sky.main}, ${accentColors.sky.dark})`,
    background: {
        light: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        dark: 'linear-gradient(135deg, #121212 0%, #1a1a2e 100%)',
    },
    page: (theme) => theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #121212 0%, #1a1a2e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
};

// ===== Z-INDEX TOKENS =====
export const zIndex = {
    navigation: 1000,
    fab: 1050,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
};
