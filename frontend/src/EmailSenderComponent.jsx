import React, { useState, useContext } from 'react';
import {
  Button,
  Container,
  Typography,
  TextField,
  CircularProgress,
  Box,
  IconButton,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import BodyEditor from './BodyEditor';
import { AuthContext } from './AuthContext';

const EmailSenderComponent = () => {
  const { token, user, logout, showMessage } = useContext(AuthContext);
  const [inputMode, setInputMode] = useState('csv');
  const [csvFile, setCsvFile] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const [globalVariables, setGlobalVariables] = useState([
    { id: crypto.randomUUID(), name: '' },
  ]);

  const [recipients, setRecipients] = useState([
    { id: crypto.randomUUID(), email: '', variableValues: [''] },
  ]);

  const addGlobalVariable = () => {
    setGlobalVariables([
      ...globalVariables,
      { id: crypto.randomUUID(), name: '' },
    ]);
    setRecipients(
      recipients.map((rec) => ({
        ...rec,
        variableValues: [...rec.variableValues, ''],
      }))
    );
  };

  const removeGlobalVariable = (idToRemove) => {
    const indexToRemove = globalVariables.findIndex((v) => v.id === idToRemove);
    if (indexToRemove === -1) return;

    setGlobalVariables(globalVariables.filter((v) => v.id !== idToRemove));
    setRecipients(
      recipients.map((rec) => {
        const newVariableValues = [...rec.variableValues];
        newVariableValues.splice(indexToRemove, 1);
        return { ...rec, variableValues: newVariableValues };
      })
    );
  };

  const updateGlobalVariable = (id, newName) => {
    setGlobalVariables(
      globalVariables.map((v) => (v.id === id ? { ...v, name: newName } : v))
    );
  };

  const handleInputModeChange = (event, newMode) => {
    if (newMode !== null) {
      setInputMode(newMode);
      if (newMode === 'manual') {
        if (globalVariables.length === 0) {
          setGlobalVariables([{ id: crypto.randomUUID(), name: '' }]);
        }
        setRecipients([
          {
            id: crypto.randomUUID(),
            email: '',
            variableValues: Array(globalVariables.length).fill(''),
          },
        ]);
        setCsvFile(null); // Clear CSV file selection
      } else {
        setRecipients([
          { id: crypto.randomUUID(), email: '', variableValues: [''] },
        ]);
        setGlobalVariables([{ id: crypto.randomUUID(), name: '' }]); // Clear global variables
      }
    }
  };

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      {
        id: crypto.randomUUID(),
        email: '',
        variableValues: Array(globalVariables.length).fill(''), // Initialize with empty values
      },
    ]);
  };

  const removeRecipient = (id) => {
    setRecipients(recipients.filter((rec) => rec.id !== id));
  };

  const updateRecipientEmail = (id, newEmail) => {
    setRecipients(
      recipients.map((rec) =>
        rec.id === id ? { ...rec, email: newEmail } : rec
      )
    );
  };

  const updateRecipientVariableValue = (recipientId, varIndex, newValue) => {
    setRecipients(
      recipients.map((rec) =>
        rec.id === recipientId
          ? {
              ...rec,
              variableValues: rec.variableValues.map((val, idx) =>
                idx === varIndex ? newValue : val
              ),
            }
          : rec
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showMessage({
        open: true,
        title: 'Error',
        message: 'Authentication token missing. Please log in again.',
      });
      return;
    }
    if (inputMode === 'csv' && !csvFile) {
      showMessage({
        open: true,
        title: 'Validation Error',
        message: 'Please upload a CSV file.',
      });
      return;
    }
    if (inputMode === 'manual') {
      const hasEmptyGlobalVariable = globalVariables.some(
        (v) => !v.name.trim()
      );
      if (hasEmptyGlobalVariable) {
        showMessage({
          open: true,
          title: 'Validation Error',
          message: 'Please ensure all global variable names are filled.',
        });
        return;
      }
      const uniqueGlobalVariableNames = new Set(
        globalVariables.map((v) => v.name.trim().toLowerCase())
      );
      if (uniqueGlobalVariableNames.size !== globalVariables.length) {
        showMessage({
          open: true,
          title: 'Validation Error',
          message: 'Global variable names must be unique (case-insensitive).',
        });
        return;
      }
      const allRecipientsValid = recipients.every(
        (rec) =>
          rec.email &&
          rec.email.includes('@') &&
          rec.email.includes('.') && // Basic email validation
          rec.variableValues.every((val) => val !== '') // All values for global variables must be filled
      );
      if (recipients.length === 0 || !allRecipientsValid) {
        showMessage({
          open: true,
          title: 'Validation Error',
          message:
            'Please ensure all recipients have valid emails and all variable values are filled for each recipient.',
        });
        return;
      }
    }

    showMessage({
      open: true,
      title: 'Sending Emails',
      message: 'Simulating email sending. Please wait...',
    });
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('body', body);
      if (attachment) formData.append('attachments', attachment);

      if (inputMode === 'csv') {
        formData.append('csvFile', csvFile);
        formData.append('isManual', false);
      } else {
        formData.append('isManual', true);
        const globalVariableNames = globalVariables.map((v) => v.name);
        formData.append('variables', JSON.stringify(globalVariableNames)); // Add global variable names
        formData.append(
          'recipients',
          JSON.stringify(
            recipients.map((rec) => ({
              email: rec.email,
              variableValues: rec.variableValues,
            }))
          )
        );
      }

      const response = await axios.post(
        'http://localhost:5001/api/user/sendMails', // Replace with your backend route
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`, // if you need auth on the backend
          },
        }
      );

      console.log({ response });
      showMessage({
        open: true,
        title: 'Success',
        message: 'Emails simulated successfully! (No actual emails were sent)',
      });

      if (inputMode === 'csv') {
        setCsvFile(null);
        document.getElementById('csv-file-input').value = '';
      } else {
        setGlobalVariables([{ id: crypto.randomUUID(), name: '' }]); // Reset global variables
        setRecipients([
          { id: crypto.randomUUID(), email: '', variableValues: [''] },
        ]); // Reset manual input
      }
      setAttachment(null);
      setSubject('');
      setBody('');
      document.getElementById('attachment-file-input').value = '';
    } catch (err) {
      console.error('Failed to send emails (simulated):', err);
      showMessage({
        open: true,
        title: 'Error',
        message: 'Failed to send emails (simulated).',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{ padding: 0, mx: 'auto', fontFamily: 'sans-serif' }}
    >
      <Box sx={{ padding: 1, borderRadius: 2, boxShadow: 3 }}>
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

        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 4 }}>
          Welcome,{' '}
          <Box
            component="span"
            sx={{ fontWeight: 'medium', color: 'primary.main' }}
          >
            {user?.name || user?.email || 'User'}
          </Box>
        </Typography>

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={inputMode}
            exclusive
            onChange={handleInputModeChange}
            aria-label="email input mode"
          >
            <ToggleButton value="csv" aria-label="upload csv">
              <FileUploadIcon sx={{ mr: 1 }} /> Upload CSV
            </ToggleButton>
            <ToggleButton value="manual" aria-label="manual entry">
              <GroupAddIcon sx={{ mr: 1 }} /> Manual Entry
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <form onSubmit={handleSubmit} style={{}}>
          {inputMode === 'csv' ? (
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<FileUploadIcon />}
              >
                Upload CSV File
                <input
                  id="csv-file-input"
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  required
                />
              </Button>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', ml: 2 }}
              >
                {csvFile ? csvFile.name : 'No CSV file selected'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'success.dark',
                    fontWeight: 'semibold',
                  }}
                >
                  Placeholders
                </Typography>
                <Tooltip
                  title={
                    <Typography variant="body2">
                      These variable names will be used as placeholders in your
                      email body, like "{`{{ firstName }}`}".
                    </Typography>
                  }
                  placement="top" // You can adjust placement (e.g., "top", "bottom", "left", "right")
                  arrow // Adds a small arrow to the tooltip
                >
                  <InfoIcon color="action" sx={{ ml: 1, cursor: 'help' }} />{' '}
                </Tooltip>
              </Box>
              <TableContainer
                component={Paper}
                elevation={0}
                variant="outlined"
                sx={{
                  border: '1px solid rgba(224, 224, 224, 1)',
                  borderRadius: 2,
                }}
              >
                <Table size="small" aria-label="global variables table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Variable Name
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {globalVariables.map((variable, index) => (
                      <TableRow key={variable.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            label={`Variable ${index + 1}`}
                            value={variable.name}
                            onChange={(e) =>
                              updateGlobalVariable(variable.id, e.target.value)
                            }
                            required
                            size="small"
                            placeholder="e.g., firstName, company"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {globalVariables.length > 1 && (
                            <IconButton
                              color="error"
                              onClick={() => removeGlobalVariable(variable.id)}
                              aria-label="remove global variable"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addGlobalVariable}
                size="small"
                sx={{ mt: 2 }}
              >
                Add Placeholder
              </Button>

              <Divider sx={{ my: '0.5' }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'success.dark',
                    fontWeight: 'semibold',
                  }}
                >
                  Recipient Details
                </Typography>
                <Tooltip
                  title={
                    <Typography variant="body2">
                      Provide email addresses and the specific values for each
                      placeholder defined above.
                    </Typography>
                  }
                  placement="top" // You can adjust placement (e.g., "top", "bottom", "left", "right")
                  arrow // Adds a small arrow to the tooltip
                >
                  <InfoIcon color="action" sx={{ ml: 1, cursor: 'help' }} />{' '}
                </Tooltip>
              </Box>

              <TableContainer
                component={Paper}
                elevation={0}
                variant="outlined"
                sx={{
                  border: '1px solid rgba(224, 224, 224, 1)',
                  borderRadius: 2,
                }}
              >
                <Table size="small" aria-label="recipients table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>
                        Recipient Email
                      </TableCell>
                      {globalVariables.map((globalVar, index) => (
                        <TableCell
                          key={globalVar.id}
                          sx={{ fontWeight: 'bold', minWidth: 120 }}
                        >
                          {globalVar.name || `Variable ${index + 1}`}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recipients.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={globalVariables.length + 2}
                          sx={{ textAlign: 'center', py: 3 }}
                        >
                          <Typography color="textSecondary">
                            No recipients added yet. Click "Add Recipient"
                            below.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {recipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            type="email"
                            value={recipient.email}
                            onChange={(e) =>
                              updateRecipientEmail(recipient.id, e.target.value)
                            }
                            required
                            size="small"
                            placeholder="email@example.com"
                          />
                        </TableCell>
                        {globalVariables.map((globalVar, varIndex) => (
                          <TableCell key={globalVar.id}>
                            <TextField
                              fullWidth
                              value={recipient.variableValues[varIndex] || ''}
                              onChange={(e) =>
                                updateRecipientVariableValue(
                                  recipient.id,
                                  varIndex,
                                  e.target.value
                                )
                              }
                              required
                              size="small"
                              placeholder={`Value for ${globalVar.name}`}
                            />
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          {recipients.length > 1 && (
                            <IconButton
                              color="error"
                              onClick={() => removeRecipient(recipient.id)}
                              aria-label="remove recipient"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                variant="contained"
                startIcon={<GroupAddIcon />}
                onClick={addRecipient}
                sx={{ width: '100%', py: 1.5, mt: 2 }}
              >
                Add Another Recipient
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            margin="normal"
            placeholder="e.g., Your personalized update!"
          />

          <Box sx={{ mt: 2, mb: 1 }}>
            <BodyEditor
              content={body}
              onContentChange={setBody}
              label="Email Body"
            />
          </Box>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<FileUploadIcon />}
            >
              Upload Attachment (Optional)
              <input
                id="attachment-file-input"
                type="file"
                hidden
                onChange={(e) => setAttachment(e.target.files[0])}
              />
            </Button>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', ml: 2, wordBreak: 'break-all' }}
            >
              {attachment ? attachment.name : 'No attachment selected'}
            </Typography>
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || !token}
            sx={{
              py: 1.5,
              boxShadow: 2,
              '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Send Emails'
            )}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default EmailSenderComponent;
