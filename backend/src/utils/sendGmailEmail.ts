import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import mime from 'mime-types';
import base64url from 'base64url';

export const sendGmailEmail = async ({
  to,
  subject,
  body,
  refreshToken,
  fromEmail,
  attachments = [],
}: {
  to: string;
  subject: string;
  body: string;
  refreshToken: string;
  fromEmail: string;
  attachments?: { filename: string; path: string; contentType: string }[];
}) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.EXTENSION_REDIRECT
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const boundary = `boundary_${Date.now()}`;
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;

  const mimeParts: string[] = [];

  mimeParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  mimeParts.push(`MIME-Version: 1.0`);
  mimeParts.push(`To: ${to}`);
  mimeParts.push(`From: ${fromEmail}`);
  mimeParts.push(`Subject: ${subject}`);
  mimeParts.push('');

  mimeParts.push(delimiter);
  mimeParts.push(`Content-Type: text/html; charset="UTF-8"`);
  mimeParts.push(`MIME-Version: 1.0`);
  mimeParts.push(`Content-Transfer-Encoding: 7bit`);
  mimeParts.push('');
  mimeParts.push(body);
  mimeParts.push('');

  console.log(
    'Sending attachments:',
    attachments.map((f) => ({
      filename: f.filename,
      path: f.path,
      contentType: f.contentType,
    }))
  );
  for (const file of attachments) {
    const fileContent = fs.readFileSync(file.path).toString('base64');
    const mimeType =
      file.contentType ||
      mime.lookup(file.filename) ||
      'application/octet-stream';

    mimeParts.push(delimiter);
    mimeParts.push(`Content-Type: ${mimeType}; name="${file.filename}"`);
    mimeParts.push(`MIME-Version: 1.0`);
    mimeParts.push(`Content-Transfer-Encoding: base64`);
    mimeParts.push(
      `Content-Disposition: attachment; filename="${file.filename}"`
    );
    mimeParts.push('');
    mimeParts.push(fileContent);
    mimeParts.push('');
  }

  mimeParts.push(closeDelimiter);

  const fullMessage = mimeParts.join('\r\n');

  const encodedMessage = Buffer.from(fullMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
};
