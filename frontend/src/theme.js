import { createTheme } from '@mui/material/styles';

export const theme = createTheme ({
    palette: {
        primary: {
            main: '#91EB4E',
            darker: '#78D235',
            contrastText: '#000',
        },
        Secondary: {
            main: '#FFFACD',
            darker: '#E6E1B4',
            contrastText: '#000',
        },
        background: {
            default: '#ffffe0',
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
  