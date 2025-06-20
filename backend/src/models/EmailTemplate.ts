import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  subject: string;
  body: string;
  variables: string[];
  userId: mongoose.Types.ObjectId;
}

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    variables: [String],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

emailTemplateSchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.model<IEmailTemplate>(
  'EmailTemplate',
  emailTemplateSchema
);
