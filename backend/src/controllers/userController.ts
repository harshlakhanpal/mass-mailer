import { Request, Response } from 'express';
import { User } from '../models/User';

export const getProfile = async (req: any, res: Response) => {
  const user = await User.findById(req.user.id).select(
    '-googleAccessToken-googleRefreshToken-tokenExpiry'
  );

  if (!user) {
    return res.status(404).json({ message: 'user not found' });
  }

  res.status(200).json(user);
};
