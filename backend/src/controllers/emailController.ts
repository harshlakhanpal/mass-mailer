import { Request, Response } from 'express';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { UserMail } from '../models/UserMail';
import { IUser, User } from '../models/User';
import { parseTemplate, mapVariables } from '../utils';
import { sendGmailEmail } from '../utils/sendGmailEmail';
import fs from 'fs/promises';

export const getProfile = async (req: any, res: Response) => {
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'user not found' });
  }

  res.status(200).json(user);
};

const parseCSVFile = async (
  buffer: Buffer
): Promise<{
  recipients: {
    email: string;
    variableValues: string[];
    mailSuccessful: boolean;
    errorMessage: string;
  }[];
  variables: string[];
}> => {
  return new Promise((resolve, reject) => {
    const recipients: {
      email: string;
      variableValues: string[];
      mailSuccessful: boolean;
      errorMessage: string;
    }[] = [];
    let variables: string[] = [];

    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('headers', (headers: string[]) => {
        if (headers.length < 1)
          return reject(new Error('CSV must have at least one column'));
        variables = headers.slice(1);
      })
      .on('data', (row) => {
        const keys = Object.keys(row);
        const email = row[keys[0]];
        const variableValues = keys.slice(1).map((k) => row[k]);
        recipients.push({
          email,
          variableValues,
          mailSuccessful: false,
          errorMessage: '',
        });
      })
      .on('end', () => {
        console.log({ recipients, variables }, ' csv parser');
        resolve({ recipients, variables });
      })
      .on('error', (err) => {
        console.error('CSV Parsing Error:', err);
        reject(err);
      });
  });
};

export const sendMails = async (req: any, res: Response) => {
  try {
    const user = (await User.findById(req.user.id)) as IUser & Document;
    const { googleRefreshToken } = user;
    console.log({ user });
    console.log({ reqBody: req.body });

    const {
      subject,
      body,
    }: {
      subject: string;
      body: string;
    } = req.body;

    let variables: string[] = [];
    let recipients: {
      email: string;
      variableValues: string[];
      mailSuccessful: boolean;
      errorMessage: string;
    }[] = [];
    if (!!JSON.parse(req.body.isManual)) {
      variables = JSON.parse(req.body.variables || '[]');
      recipients = JSON.parse(req.body.recipients || '[]');
    } else {
      const csvFile = req.files?.csvFile;

      if (!csvFile || !csvFile.path) {
        return res.status(400).json({ message: 'CSV file is required' });
      }

      const buffer = await fs.readFile(csvFile.path);
      const parsed = await parseCSVFile(buffer);
      variables = parsed.variables;
      recipients = parsed.recipients;
    }

    console.log({ reqFiles: req.files });
    console.log({ reqFilesAttachments: req.files.attachments });

    let rawAttachments: any[] = [];
    if (req.files?.attachments) {
      if (Array.isArray(req.files.attachments)) {
        rawAttachments = req.files.attachments;
      } else {
        rawAttachments = [req.files.attachments];
      }
    }

    const attachments = rawAttachments
      .map((file: any) => {
        if (!file || !file.originalFilename || !file.path) return null;

        return {
          filename: file.name,
          path: file.path,
          contentType: file.type,
        };
      })
      .filter(
        (
          attachment
        ): attachment is {
          filename: string;
          path: string;
          contentType: string;
        } => attachment !== null
      );

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const personalVariables = mapVariables(
          variables,
          recipient.variableValues
        );

        const parsedSubject = parseTemplate(subject, personalVariables);
        const parsedBody = parseTemplate(body, personalVariables);

        try {
          await sendGmailEmail({
            to: recipient.email,
            subject: parsedSubject,
            body: parsedBody,
            refreshToken: googleRefreshToken,
            fromEmail: user?.email,
            attachments,
          });
          return { ...recipient, mailSuccessful: true };
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          return { ...recipient, mailSuccessful: false, errorMessage: 'Error' };
        }
      })
    );

    const userMail = new UserMail({
      userId: req.user.id,
      from: user?.email,
      variables,
      body,
      subject,
      recipients: results,
    });
    await userMail.save();

    return res.status(200).json({ message: 'Emails sent!' });
  } catch (err) {
    console.error('sendMails error:', err);
    return res.status(500).json({ message: 'Failed to send emails' });
  }
};
