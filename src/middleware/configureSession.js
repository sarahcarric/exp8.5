import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const configureSession = (req, res, next) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite:  process.env.NODE_ENV === 'production' ? 'None' : false,
    domain: process.env.COOKIE_DOMAIN,
    maxAge: 3600000
  };
  const accessToken = jwt.sign({userId: req.user._id}, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_DURATION });
  const refreshToken = jwt.sign({userId: req.user._id}, process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_DURATION });
  const antiCsrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, {...cookieOptions, maxAge: 604800000 });
  req.session.user = req.user;
  req.session.antiCsrfToken = antiCsrfToken;
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to save session' });
    }
    res.status(200).json(req.user);
  });
}