import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Box,
  Divider,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AuthContext } from './AuthContext';
import BodyEditor from './BodyEditor';

const SentEmailsList = () => {
  const { token } = useContext(AuthContext);

  const [emails, setEmails] = useState([]);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5001/api/user/listMails',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setEmails(response.data.emails);
      } catch (err) {
        console.error('Error fetching emails:', err);
      }
    };

    fetchEmails();
  }, []);

  const renderRecipient = (recipient, variables) => {
    const keyValuePairs = variables.map((key, index) => ({
      key,
      value: recipient.variableValues?.[index] || '',
    }));

    return (
      <Box key={recipient.email} mb={2}>
        <Typography
          variant="body1"
          fontWeight="bold"
          color={recipient?.mailSuccessful ? 'green' : 'red'}
        >
          {recipient.email}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
          {keyValuePairs.map(({ key, value }) => (
            <Chip
              key={key}
              label={
                <code style={{ fontSize: '0.8rem' }}>
                  {key}: {value}
                </code>
              }
              variant="outlined"
              sx={{ bgcolor: '#f5f5f5', borderColor: '#ccc' }}
            />
          ))}
        </Stack>
        <Divider sx={{ my: 1 }} />
      </Box>
    );
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        Sent Emails
      </Typography>

      {emails.map((email) => (
        <Accordion key={email._id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{email.subject || '(No Subject)'}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>
              Recipients:
            </Typography>
            {email.recipients.map((recipient) =>
              renderRecipient(recipient, email.variables || [])
            )}

            <BodyEditor
              editable={false}
              content={email.body}
              label={'Body'}
              onContentChange={() => null}
            />
            {/* <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {email.body}
            </Typography> */}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default SentEmailsList;
