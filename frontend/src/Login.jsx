import React, { useContext } from 'react';
import { Button, Container, Typography, Box } from '@mui/material';

import axios from 'axios';

import { AuthContext } from './AuthContext';

const LoginComponent = () => {
  const { login, showMessage } = useContext(AuthContext);

  const handleGoogleLogin = () => {
    showMessage({
      open: true,
      title: 'Login Status',
      message: 'Attempting Google login via Chrome extension...',
    });

    if (chrome.runtime && chrome.runtime.sendMessage) {
      console.log(
        'Detected Chrome extension environment. Sending message for OAuth.'
      );
      chrome.runtime.sendMessage({ type: 'OAUTH_GOOGLE' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error from chrome.runtime.sendMessage:',
            chrome.runtime.lastError.message
          );
          showMessage({
            open: true,
            title: 'Login Error',
            message: `Extension login failed: ${chrome.runtime.lastError.message}`,
          });
          return;
        }

        if (response?.token) {
          console.log(
            'Received Google Access Token from extension:',
            response.token
          );
          try {
            console.log(
              'Sending access token to backend at http://localhost:5001/api/auth/google-login...'
            );
            const res = await axios.post(
              'http://localhost:5001/api/auth/google-login',
              {
                accessToken: response.token,
                redirectUri: `https://${chrome.runtime.id}.chromiumapp.org`,
              }
            );
            console.log('Backend authentication response:', res.data);
            if (res.data && res.data.token && res.data.user) {
              console.log(
                'Backend response contains token and user. Calling login function.'
              );
              await login(res.data.token, res.data.user);
            } else {
              console.error(
                'Backend response missing token or user data:',
                res.data
              );
              showMessage({
                open: true,
                title: 'Backend Response Error',
                message:
                  'Backend response missing essential authentication data.',
              });
            }
          } catch (err) {
            console.error('Error during backend authentication:', err);
            const errorMessage =
              err.response?.data?.message ||
              err.message ||
              'Unknown backend error.';
            showMessage({
              open: true,
              title: 'Backend Auth Failed',
              message: `Backend authentication failed: ${errorMessage}`,
            });
          }
        } else {
          console.error(
            'Login failed: No token received from extension message.',
            response
          );
          showMessage({
            open: true,
            title: 'Login Failed',
            message: `Login failed: ${
              response?.error || 'No token from extension.'
            }`,
          });
        }
      });
    } else {
      console.warn(
        'Chrome extension environment not detected. Cannot proceed with Google login.'
      );
      showMessage({
        open: true,
        title: 'Environment Error',
        message:
          'This application needs to be run as a Chrome extension for Google login to work. Please ensure it is loaded as an unpacked extension.',
      });
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 4, // p-4
      }}
    >
      <Box
        sx={{
          padding: 4, // p-8, adjusted for a slightly less bulky look
          borderRadius: 2, // rounded-lg
          boxShadow: 3, // shadow-lg
          textAlign: 'center', // text-center
          width: '100%', // w-full
          maxWidth: 400, // max-w-md, adjusted to a fixed pixel value for clarity
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'semibold', // font-semibold
            color: 'text.primary', // text-gray-800
            marginBottom: 3, // mb-6, adjusted
          }}
        >
          Welcome to MailEz
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary', // text-gray-600
            marginBottom: 4, // mb-8, adjusted
          }}
        >
          Please log in with your Google account to proceed.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGoogleLogin}
          sx={{
            width: '100%', // w-full
            paddingY: 1.5, // py-3
            boxShadow: 2, // shadow-md
            '&:hover': {
              boxShadow: 4, // hover:shadow-lg
              transform: 'translateY(-2px)', // transform hover:-translate-y-1
            },
            transition: 'all 0.3s ease-in-out', // transition duration-300 ease-in-out
          }}
        >
          Login with Google
        </Button>
      </Box>
    </Container>
  );
};

export default LoginComponent;
