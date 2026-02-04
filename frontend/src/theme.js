import { createTheme } from '@mui/material/styles';
import { accentColors, borderRadius as radiusTokens } from './styles/constants';

// ===== SHARED PALETTE EXTENSIONS =====
const sharedPalette = {
    primary: {
        main: '#91EB4E',
        dark: '#65A436',
        darker: '#65A436',
        light: '#A7EF71',
        lighter: '#A7EF71',
        contrastText: '#000000',
    },
    secondary: {
        main: '#6E14B1',
        dark: '#4D0E7B',
        darker: '#4D0E7B',
        light: '#8B43C0',
        lighter: '#8B43C0',
        contrastText: '#FFFFFF',
    },
    success: {
        main: '#4caf50',
        dark: '#388e3c',
        light: '#81c784',
    },
    warning: {
        main: '#ff9800',
        dark: '#f57c00',
        light: '#ffb74d',
    },
    error: {
        main: '#f44336',
        dark: '#d32f2f',
        light: '#e57373',
    },
    info: {
        main: '#2196f3',
        dark: '#1976d2',
        light: '#64b5f6',
    },
    accent: accentColors,
};

// ===== SHARED TYPOGRAPHY =====
const sharedTypography = {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
        fontSize: '2.5rem',
        fontWeight: 800,
        lineHeight: 1.2,
        '@media (max-width:600px)': { fontSize: '2rem' },
    },
    h2: {
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.3,
        '@media (max-width:600px)': { fontSize: '1.75rem' },
    },
    h3: {
        fontSize: '1.75rem',
        fontWeight: 700,
        lineHeight: 1.3,
        '@media (max-width:600px)': { fontSize: '1.5rem' },
    },
    h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:600px)': { fontSize: '1.25rem' },
    },
    h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:600px)': { fontSize: '1.125rem' },
    },
    h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:600px)': { fontSize: '1rem' },
    },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
    body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        '@media (max-width:600px)': { fontSize: '0.875rem' },
    },
    body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        '@media (max-width:600px)': { fontSize: '0.75rem' },
    },
    button: { fontWeight: 600, textTransform: 'none' },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    overline: { fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' },
};

// ===== SHARED BREAKPOINTS =====
const sharedBreakpoints = {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
};

// ===== SHARED SPACING (4px base unit) =====
const sharedSpacing = (factor) => `${0.25 * factor}rem`;

// ===== SHARED SHAPE =====
const sharedShape = {
    borderRadius: 8,
    borderRadiusXs: radiusTokens.xs * 4,
    borderRadiusSm: radiusTokens.sm * 4,
    borderRadiusMd: radiusTokens.md * 4,
    borderRadiusLg: radiusTokens.lg * 4,
    borderRadiusXl: radiusTokens.xl * 4,
};

// ===== SHARED COMPONENT OVERRIDES =====
const createSharedComponents = (mode) => ({
    MuiCssBaseline: {
        styleOverrides: {
            body: {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.2)',
                },
            },
        },
    },
    MuiButton: {
        styleOverrides: {
            root: {
                fontWeight: 600,
                borderRadius: sharedShape.borderRadiusSm,
                textTransform: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '@media (max-width:600px)': { fontSize: '0.875rem', padding: '8px 16px' },
            },
            contained: {
                boxShadow: 'none',
                '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', transform: 'translateY(-1px)' },
            },
            outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } },
        },
        defaultProps: { disableElevation: true },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                boxShadow: mode === 'dark' ? '0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' : '0 2px 12px rgba(0,0,0,0.08)',
                borderRadius: sharedShape.borderRadiusMd,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: mode === 'dark' ? '#1f1f1f' : undefined,
                '@media (max-width:600px)': { borderRadius: sharedShape.borderRadiusSm },
            },
        },
    },
    MuiCardContent: {
        styleOverrides: {
            root: {
                padding: '20px',
                '&:last-child': { paddingBottom: '20px' },
                '@media (max-width:600px)': { padding: '16px', '&:last-child': { paddingBottom: '16px' } },
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: { backgroundImage: 'none' },
            rounded: { borderRadius: sharedShape.borderRadiusMd },
        },
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: sharedShape.borderRadiusSm,
                    transition: 'all 0.2s ease',
                    '&:hover': { '& .MuiOutlinedInput-notchedOutline': { borderColor: sharedPalette.primary.main } },
                },
            },
        },
    },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: sharedShape.borderRadiusSm } } },
    MuiChip: { styleOverrides: { root: { borderRadius: sharedShape.borderRadiusXs, fontWeight: 500 } } },
    MuiTableCell: {
        styleOverrides: {
            root: { '@media (max-width:600px)': { padding: '8px 4px', fontSize: '0.75rem' } },
        },
    },
    MuiDrawer: { styleOverrides: { paper: { '@media (max-width:900px)': { width: '280px' } } } },
    MuiDialogTitle: {
        styleOverrides: {
            root: {
                padding: '24px 32px',
                fontSize: '1.5rem',
                fontWeight: 700,
                background: 'linear-gradient(to right, rgba(145, 235, 78, 0.1), transparent)',
                '@media (max-width:600px)': { padding: '16px 20px', fontSize: '1.25rem' },
            },
        },
    },
    MuiDialogContent: {
        styleOverrides: {
            root: {
                padding: '24px 32px',
                '@media (max-width:600px)': { padding: '16px 20px' },
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                },
            },
        },
    },
    MuiDialogActions: {
        styleOverrides: {
            root: {
                padding: '16px 32px 24px',
                gap: '12px',
                '@media (max-width:600px)': { padding: '12px 20px 16px' },
            },
        },
    },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: sharedShape.borderRadiusXs, fontSize: '0.75rem', padding: '8px 12px' } } },
    MuiFab: {
        styleOverrides: {
            root: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', '&:hover': { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)' } },
        },
    },
    MuiIconButton: { styleOverrides: { root: { transition: 'all 0.2s ease' } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: sharedShape.borderRadiusXs } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: sharedShape.borderRadiusSm } } },
    MuiSnackbar: { styleOverrides: { root: { '& .MuiAlert-root': { borderRadius: sharedShape.borderRadiusSm } } } },
    MuiAccordion: {
        styleOverrides: {
            root: { borderRadius: sharedShape.borderRadiusSm, '&:before': { display: 'none' }, '&.Mui-expanded': { margin: 0 } },
        },
    },
    MuiAccordionSummary: {
        styleOverrides: { root: { minHeight: 56, '&.Mui-expanded': { minHeight: 56 } }, content: { '&.Mui-expanded': { margin: '12px 0' } } },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minHeight: 48 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: '3px 3px 0 0' } } },
    MuiSwitch: { styleOverrides: { root: { padding: 8 }, thumb: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' } } },
    MuiListItemButton: {
        styleOverrides: {
            root: {
                borderRadius: sharedShape.borderRadiusSm,
                '&.Mui-selected': { backgroundColor: 'rgba(145, 235, 78, 0.12)', '&:hover': { backgroundColor: 'rgba(145, 235, 78, 0.16)' } },
            },
        },
    },
    MuiBadge: { styleOverrides: { badge: { fontWeight: 600, fontSize: '0.7rem' } } },
});

// ===== LIGHT THEME =====
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        ...sharedPalette,
        background: { default: '#FFFFFF', paper: '#FFFFFF', container: '#f7f2fa', gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
        text: { primary: '#1a1a1a', secondary: '#666666', disabled: '#9e9e9e' },
        divider: 'rgba(0, 0, 0, 0.08)',
        action: { hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(145, 235, 78, 0.12)', focus: 'rgba(145, 235, 78, 0.12)' },
        contrastText: { primary: '#000', secondary: '#828282' },
    },
    typography: sharedTypography,
    breakpoints: sharedBreakpoints,
    spacing: sharedSpacing,
    shape: sharedShape,
    components: {
        ...createSharedComponents('light'),
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: sharedShape.borderRadiusLg,
                    backdropFilter: 'blur(12px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
                    backgroundImage: 'none',
                    '@media (max-width:600px)': { margin: '16px', maxHeight: 'calc(100% - 32px)', borderRadius: sharedShape.borderRadiusMd },
                },
            },
        },
    },
});

// ===== DARK THEME =====
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        ...sharedPalette,
        secondary: { main: '#8B43C0', dark: '#6E14B1', darker: '#6E14B1', light: '#A865D1', lighter: '#A865D1', contrastText: '#FFFFFF' },
        background: { 
            default: '#0a0a0a', 
            paper: '#1a1a1a', 
            container: '#2d2d2d', 
            gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' 
        },
        text: { 
            primary: '#ffffff', 
            secondary: '#c5c5c5', 
            disabled: '#7a7a7a' 
        },
        divider: 'rgba(255, 255, 255, 0.15)',
        action: { 
            hover: 'rgba(255, 255, 255, 0.12)', 
            selected: 'rgba(145, 235, 78, 0.2)', 
            focus: 'rgba(145, 235, 78, 0.15)' 
        },
        contrastText: { 
            primary: '#fff', 
            secondary: '#c5c5c5' 
        },
    },
    typography: sharedTypography,
    breakpoints: sharedBreakpoints,
    spacing: sharedSpacing,
    shape: sharedShape,
    components: {
        ...createSharedComponents('dark'),
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: sharedShape.borderRadiusLg,
                    backdropFilter: 'blur(16px)',
                    backgroundColor: 'rgba(20, 20, 20, 0.96)',
                    boxShadow: '0 32px 64px rgba(0, 0, 0, 0.8)',
                    backgroundImage: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '@media (max-width:600px)': { margin: '16px', maxHeight: 'calc(100% - 32px)', borderRadius: sharedShape.borderRadiusMd },
                },
            },
        },
    },
});

export const theme = lightTheme;
