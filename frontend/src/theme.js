import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A standard blue for primary actions
    },
    secondary: {
      main: '#dc004e', // A standard red for destructive actions or emphasis
    },
    background: {
      default: '#ffffff', // Ensures the main app background is white
      paper: '#ffffff', // Ensures Material-UI components like Box, Card have a white background
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif', // Consistent font family
    h5: {
      fontWeight: 600, // Make headings slightly bolder
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase buttons
          borderRadius: 8, // Slightly more rounded buttons
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined', // All text fields will default to outlined
        size: 'small', // All text fields will default to small size
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // More rounded cards
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)', // Subtle shadow for cards
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          padding: '8px 20px',
        },
      },
    },
  },
});

export default theme;
