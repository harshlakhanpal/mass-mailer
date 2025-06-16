import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  profilePic: string;
  googleId: string;
  googleAccessToken: string;
  googleRefreshToken: string;
  tokenExpiry: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: String,
    profilePic: String,
    googleId: String,
    googleAccessToken: String,
    googleRefreshToken: String,
    tokenExpiry: String,
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
