import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme ({
    palette: {
        mode: 'light',
        primary: {
            main: '#91EB4E',
            darker: '#65A436',
            lighter: '#A7EF71'
        },
        secondary: {
            main: '#6E14B1',
            darker: '#4D0E7B',
            lighter: '#8B43C0'
        },
        background: {
            // Surface
            default: '#FFFFFF',
            // Surface Container
            container: `#f7f2fa`,
            paper: '#FFFFFF',
        },
        contrastText: {
            primary: '#000',
            secondary: '#828282',
        }
    },
    typography: {
        fontFamily: 'roboto',
        fontSize: 14,
        h1: {
            fontSize: '2.5rem',
            '@media (max-width:600px)': {
                fontSize: '2rem',
            },
        },
        h2: {
            fontSize: '2rem',
            '@media (max-width:600px)': {
                fontSize: '1.75rem',
            },
        },
        h3: {
            fontSize: '1.75rem',
            '@media (max-width:600px)': {
                fontSize: '1.5rem',
            },
        },
        h4: {
            fontSize: '1.5rem',
            '@media (max-width:600px)': {
                fontSize: '1.25rem',
            },
        },
        h5: {
            fontSize: '1.25rem',
            '@media (max-width:600px)': {
                fontSize: '1.125rem',
            },
        },
        h6: {
            fontSize: '1.125rem',
            '@media (max-width:600px)': {
                fontSize: '1rem',
            },
        },
        body1: {
            fontSize: '1rem',
            '@media (max-width:600px)': {
                fontSize: '0.875rem',
            },
        },
        body2: {
            fontSize: '0.875rem',
            '@media (max-width:600px)': {
                fontSize: '0.75rem',
            },
        },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    spacing: (factor) => `${0.25 * factor}rem`,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    fontWeight: 'bold',
                    '@media (max-width:600px)': {
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                    },
                },
            },
            defaultProps: {
                disableElevation: true,
                disableRipple: true
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    '@media (max-width:600px)': {
                        borderRadius: '8px',
                    },
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    '&:last-child': {
                        paddingBottom: '16px',
                        '@media (max-width:600px)': {
                            paddingBottom: '12px',
                        },
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    '@media (max-width:600px)': {
                        padding: '8px 4px',
                        fontSize: '0.75rem',
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    '@media (max-width:900px)': {
                        width: '280px',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 24,
                    backdropFilter: 'blur(12px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
                    backgroundImage: 'none',
                }
            }
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    padding: '24px 32px',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(to right, rgba(145, 235, 78, 0.1), transparent)',
                }
            }
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    padding: '24px 32px',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                    },
                }
            }
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '16px 32px 24px',
                }
            }
        },
        Box: {
            styleOverrides: {
                defaultProps: {
                    boxShadow: '0px',
                    disableElevation: true,
                }
            }
        }
    }
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#91EB4E',
            darker: '#65A436',
            lighter: '#A7EF71'
        },
        secondary: {
            main: '#8B43C0',
            darker: '#6E14B1',
            lighter: '#A865D1'
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
            container: '#2a2a2a',
        },
        text: {
            primary: '#ffffff',
            secondary: '#aaaaaa',
        },
        contrastText: {
            primary: '#fff',
            secondary: '#aaaaaa',
        }
    },
    typography: {
        fontFamily: 'roboto',
        fontSize: 14,
        h1: {
            fontSize: '2.5rem',
            '@media (max-width:600px)': {
                fontSize: '2rem',
            },
        },
        h2: {
            fontSize: '2rem',
            '@media (max-width:600px)': {
                fontSize: '1.75rem',
            },
        },
        h3: {
            fontSize: '1.75rem',
            '@media (max-width:600px)': {
                fontSize: '1.5rem',
            },
        },
        h4: {
            fontSize: '1.5rem',
            '@media (max-width:600px)': {
                fontSize: '1.25rem',
            },
        },
        h5: {
            fontSize: '1.25rem',
            '@media (max-width:600px)': {
                fontSize: '1.125rem',
            },
        },
        h6: {
            fontSize: '1.125rem',
            '@media (max-width:600px)': {
                fontSize: '1rem',
            },
        },
        body1: {
            fontSize: '1rem',
            '@media (max-width:600px)': {
                fontSize: '0.875rem',
            },
        },
        body2: {
            fontSize: '0.875rem',
            '@media (max-width:600px)': {
                fontSize: '0.75rem',
            },
        },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    spacing: (factor) => `${0.25 * factor}rem`,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    fontWeight: 'bold',
                    '@media (max-width:600px)': {
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                    },
                },
            },
            defaultProps: {
                disableElevation: true,
                disableRipple: true
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    borderRadius: '12px',
                    '@media (max-width:600px)': {
                        borderRadius: '8px',
                    },
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    '&:last-child': {
                        paddingBottom: '16px',
                        '@media (max-width:600px)': {
                            paddingBottom: '12px',
                        },
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    '@media (max-width:600px)': {
                        padding: '8px 4px',
                        fontSize: '0.75rem',
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    '@media (max-width:900px)': {
                        width: '280px',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 24,
                    backdropFilter: 'blur(12px)',
                    backgroundColor: 'rgba(30, 30, 30, 0.8)',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                    backgroundImage: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                }
            }
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    padding: '24px 32px',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(to right, rgba(145, 235, 78, 0.1), transparent)',
                }
            }
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    padding: '24px 32px',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                    },
                }
            }
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '16px 32px 24px',
                }
            }
        },
        Box: {
            styleOverrides: {
                defaultProps: {
                    boxShadow: '0px',
                    disableElevation: true,
                }
            }
        }
    }
});

export const theme = lightTheme;
  