import React, { useContext } from 'react';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Button,
} from '@mui/material';

import theme from './theme';
import { ThemeProvider } from '@mui/material/styles';
import LoginComponent from './Login';
import EmailSenderComponent from './EmailSenderComponent';
import { AuthContext, AuthProvider } from './AuthContext';
import SentEmailsList from './SentEmailsList';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const AppContent = () => {
  const { token, loadingApp, viewMode, setViewMode, logout, user } =
    useContext(AuthContext);

  if (loadingApp) {
    return (
      <Container className="flex items-center justify-center max-h-screen">
        <CircularProgress />
        <Typography variant="h6" className="ml-4">
          Loading application...
        </Typography>
      </Container>
    );
  }

  if (!token) return <LoginComponent />;

  return (
    <Container
      maxWidth="md"
      sx={{
        padding: 0,
        mx: 'auto',
        fontFamily: 'sans-serif',
      }}
    >
      <Box
        sx={{ padding: 1, borderRadius: 2, boxShadow: 3, minHeight: '97vh' }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 'semibold', color: 'text.primary' }}
          >
            MailEz
          </Typography>
          <Button variant="outlined" color="secondary" onClick={logout}>
            Logout
          </Button>
        </Box>

        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
          Welcome,{' '}
          <Box
            component="span"
            sx={{ fontWeight: 'medium', color: 'primary.main' }}
          >
            {user?.name || user?.email || 'User'}
          </Box>
        </Typography>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, val) => val && setViewMode(val)}
          sx={{
            mb: 2,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <ToggleButton sx={{ width: '50%' }} value="compose">
            Compose Email
          </ToggleButton>
          <ToggleButton sx={{ width: '50%' }} value="view">
            Sent Emails
          </ToggleButton>
        </ToggleButtonGroup>
        {viewMode === 'view' && <SentEmailsList />}
        {viewMode === 'compose' && <EmailSenderComponent />}
      </Box>
    </Container>
  );
};

export default App;
