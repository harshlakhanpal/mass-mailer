import mongoose, { Document, ObjectId, Schema } from 'mongoose';

export interface IUserMail extends Document {
  userId: ObjectId;
  from: string;
  subject: string;
  recipients: [object];
  body: string;
  variables: [string];
}

const userMailSchema = new mongoose.Schema<IUserMail>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    from: { type: String, required: true },
    subject: { type: String, required: false },
    recipients: { type: [{}], required: true },
    body: { type: String, required: true },
    variables: { type: [String], required: false },
  },
  { timestamps: true }
);

export const UserMail = mongoose.model<IUserMail>('UserMail', userMailSchema);
