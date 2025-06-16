import { Request, Response, NextFunction } from 'express';

import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export const googleTokenExchange = async (req: Request, res: Response) => {
  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Missing code or redirect URI' });
  }

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      null,
      {
        params: {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // ⬇️ You'll get access_token, refresh_token, expires_in etc.
    const { access_token, refresh_token, expires_in, id_token } = tokenRes.data;

    // Save refresh_token in DB against the user (do NOT send it to frontend)
    // Validate user info using id_token or fetch from Google
    res.status(200).json({ access_token, expires_in });
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
};

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accessToken: code, redirectUri } = req.body;

  console.log({ code });
  if (!code) return res.status(400).json({ message: 'no id token' });

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      null,
      {
        params: {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in, id_token } = tokenRes.data;

    console.log({ access_token, refresh_token, expires_in, id_token });
    const userInfoRes = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { id, email, name, picture } = userInfoRes.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name,
        googleId: id,
        profilePic: picture,
        googleAccessToken: access_token,
        googleRefreshToken: refresh_token,
        tokenExpiry: expires_in,
      });
    } else {
      user.googleAccessToken = access_token;
      user.googleRefreshToken = refresh_token ?? user.googleRefreshToken;
      user.tokenExpiry = expires_in;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.status(200).json({
      token,
      user: {
        email: user.email,
        name: user.name,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ message: 'Authentication failed' });
  }
};
