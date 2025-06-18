import { createTheme } from '@mui/material/styles';

export const theme = createTheme ({
    palette: {
        primary: {
            main: '#91EB4E',
            darker: '#65A436',
            lighter: '#A7EF71',
            contrastText: '#000',
        },
        Secondary: {
            main: '#6E14B1',
            darker: '#4D0E7B',
            lighter: '#8B43C0',
            contrastText: '#000',
        },
        background: {
            // Surface
            default: '#FFFFFF',
            // Surface Container
            container: `#EDEDED`
        },
        contrastText: {
            primary: '#000',
            secondary: '#000',
        }
    },
    typography: {
        fontFamily: 'roboto',
        fontSize: 14,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    fontWeight: 'bold',
                },
                defaultProps: {
                    disableElevation: true,
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

// Placeholder darkmode for now
// export const darkTheme = createTheme({
//     palette: {
//       mode: 'dark',
//       primary: {
//         main: '#90caf9',
//         contrastText: '#fff',
//       },
//       secondary: {
//         main: '#f48fb1',
//       },
//       background: {
//         default: '#121212',
//         paper: '#1e1e1e',
//       },
//       text: {
//         primary: '#ffffff',
//         secondary: '#aaaaaa',
//       },
//     },
//   });
  