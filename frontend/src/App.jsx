import React, { useContext } from 'react';
import { Container, Typography, CircularProgress } from '@mui/material';

import theme from './theme';
import { ThemeProvider } from '@mui/material/styles';
import LoginComponent from './Login';
import EmailSenderComponent from './EmailSenderComponent';
import { AuthContext, AuthProvider } from './AuthContext';

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
  const { token, loadingApp } = useContext(AuthContext);

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

  return <>{token ? <EmailSenderComponent /> : <LoginComponent />}</>;
};

export default App;
