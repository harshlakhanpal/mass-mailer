import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';
import { setAuthToken, getAuthToken, removeAuthToken } from '../indexedDB';
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const CustomMessageBox = ({ open, title, message, onClose }) => {
  useEffect(() => {
    let timer;
    if (open) {
      timer = setTimeout(() => {
        onClose();
      }, 3000);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [open, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="message-dialog-title"
    >
      <DialogTitle id="message-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
    </Dialog>
  );
};

export const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [messageBox, setMessageBox] = useState({
    open: false,
    title: '',
    message: '',
  });

  const showMessage = ({ open, title, message }) => {
    setMessageBox({ open, title, message });
  };

  const closeMessageBox = () => {
    setMessageBox({ ...messageBox, open: false });
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authToken = await getAuthToken();
        if (authToken) {
          setToken(authToken);
          const response = await axios.get(
            'http://localhost:5001/api/user/profile', // Replace with your backend route
            {
              headers: {
                Authorization: `Bearer ${authToken}`, // if you need auth on the backend
              },
            }
          );
          console.log({ response });
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error loading auth data from IndexedDB:', error);
        showMessage({
          open: true,
          title: 'Error',
          message: 'Failed to load session. Please log in.',
        });
      } finally {
        setLoadingApp(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (newToken, newUser) => {
    try {
      await setAuthToken(newToken);
      setToken(newToken);
      setUser(newUser);
      showMessage({
        open: true,
        title: 'Login Status',
        message: 'Login successful! Token stored.',
      });
    } catch (err) {
      console.error('Login failed during save:', err);
      showMessage({
        open: true,
        title: 'Login Error',
        message: 'Failed to log in or store token.',
      });
    }
  };

  const logout = async () => {
    setLoadingApp(true);
    try {
      await removeAuthToken();
      setToken(null);
      setUser(null);
      showMessage({
        open: true,
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      showMessage({
        open: true,
        title: 'Error',
        message: 'Failed to log out.',
      });
    } finally {
      setLoadingApp(false);
    }
  };

  const authContextValue = {
    token,
    user,
    login,
    logout,
    loadingApp,
    showMessage,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      <CustomMessageBox
        open={messageBox.open}
        title={messageBox.title}
        message={messageBox.message}
        onClose={closeMessageBox}
      />
    </AuthContext.Provider>
  );
};
