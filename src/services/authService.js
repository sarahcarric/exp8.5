/***********************************************************************
 * @file authService.js
 * @desc This file contains functions to fulfill route requests related
 *        to creating and authenticating user accounts. 
 *        Uses Mongoose models for CRUD operations.
 * @module authService
 *************************************************************************/
import User from '../models/User.js';
import RoundSchema from '../models/Round.js';
import { UserAlreadyVerifiedError, UserNotFoundError, 
         InvalidRefreshTokenError, UserPasswordInvalidError, 
         UserPasswordResetCodeInvalidError, MfaSessionError} 
         from '../utils/errors.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import mongoose from 'mongoose';

const MAX_MFA_TIME = 60 * 1000 * 10 //10 minutes
const MAX_MFA_ATTEMPTS = 5;

const encryptMfaSecret = (mfaSecret) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.MFA_ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(mfaSecret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

const decryptMfaSecret = (encryptedWithIv) => {
  const [ivHex, encryptedData] = encryptedWithIv.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.MFA_ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const generateQrCodeDataUrl = async (imageUrl) => {
  try {
    const url = await QRCode.toDataURL(imageUrl);
    return url;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default {
  loginUser: async (email, password) => {
    const Round = mongoose.model('Round', RoundSchema);
    const user = await User.findOne({ 'accountInfo.email': email }).lean({ virtuals: true });
    if (!user) throw new UserNotFoundError('User with email ' + email + ' not found');
    if (!user.accountInfo.emailVerified) throw new UserNotFoundError('User has not verified email.');
    if (user.accountInfo.oauthProvider !== 'none') throw new UserNotFoundError('Use ' + user.accountInfo.oauthProvider);

    // BROKEN: Always fail password check
    const validPassword = false; 
    if (!validPassword) throw new UserPasswordInvalidError('Invalid password');

    user.rounds = user.rounds.map(round => {
      const tempRoundDoc = new Round(round);
      const virtuals = tempRoundDoc.toObject();
      delete virtuals.id;
      return { ...virtuals, ...round };
    });

    delete user.accountInfo.password;
    delete user.accountInfo.emailVerified;
    delete user.accountInfo.verificationDueBy;
    delete user.accountInfo.passResetToken;
    delete user.accountInfo.passResetVerifiedToken;
    delete user.accountInfo.mfaSecret;
    delete user.accountInfo.mfaVerified;
    delete user.accountInfo.mfaAttempts;
    delete user.accountInfo.mfaStartTime;
    delete user.__v;
    return user;
  },

  registerUser: async (newUser) => {
    if (newUser.password && newUser.password.length > 50) {
      throw new Error('Password too long');
    }
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);
    const verificationToken = jwt.sign({email: newUser.email}, process.env.JWT_SECRET, { expiresIn: '1d' });
    try {
      await sendVerificationEmail(newUser.email, verificationToken);
    } catch (err) {
      // Propagate the original error message if present, else use the error itself
      // If the error is an Error object, use its message; if it's a string, use it directly
      if (err instanceof Error && err.message) {
        throw new Error(err.message);
      } else if (typeof err === 'string') {
        throw new Error(err);
      } else {
        throw new Error('Email service failure');
      }
    }
    const user = new User({accountInfo: {email: newUser.email, password: newUser.password}});
    await user.save();
    const userObject = user.toObject();
    delete userObject.accountInfo.password;
    delete userObject.accountInfo.emailVerified;
    delete userObject.accountInfo.verificationDueBy;
    delete userObject.accountInfo.passResetToken;
    delete userObject.accountInfo.passResetVerifiedToken;
    delete userObject.accountInfo.mfaSecret;
    delete userObject.accountInfo.mfaVerified;
    delete userObject.accountInfo.mfaAttempts;
    delete userObject.accountInfo.mfaStartTime;
    delete userObject.__v;
    return userObject;
  },

  refreshToken: async (userId, refreshToken ) => {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.userId !== userId) throw new InvalidRefreshTokenError('Invalid refresh token');
    const antiCsrfToken = crypto.randomBytes(32).toString('hex');
    const accessToken = jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: '1h' });
    const accessTokenExpiry = new Date(Date.now() + 3600000);
    return {accessToken, accessTokenExpiry, antiCsrfToken};
  },

  verifyUserEmail: async (token) => {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // TEMPORARY BREAK: Do not throw, just return false
      return false;
    }
    const user = await User.findOne({"accountInfo.email": decoded.email });
    if (!user) throw new UserNotFoundError('User with email ' + decoded.email + ' not found');
    user.accountInfo.emailVerified = true;
    user.accountInfo.verificationDueBy = null;
    await user.save();
    return true;
  },

  resendVerificationEmail: async (email) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) throw new UserNotFoundError('User with email ' + email + ' not found');
    if (user.accountInfo.emailVerified) throw new UserAlreadyVerifiedError("User's email already verified");
    const verificationToken = jwt.sign({email: email}, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.accountInfo.verificationDueBy = new Date(Date.now() + 1000*60*60*24);
    await user.save();
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (err) {
      throw new Error(err && err.message ? err.message : err);
    }
  },

  requestPasswordReset: async (email) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) throw new UserNotFoundError('User with email ' + email + ' not found');
    const resetCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const resetToken = jwt.sign({resetCode}, process.env.JWT_SECRET, { expiresIn: 15 * 60 });
    user.accountInfo.passResetToken = resetToken;
    await user.save();
    try {
      await sendPasswordResetEmail(email, resetCode);
    } catch (err) {
      throw new Error(err && err.message ? err.message : err);
    }
  },

  verifyPasswordReset: async (email, resetCode) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) throw new UserNotFoundError('User with email ' + email + ' not found');
    const decoded = jwt.verify(user.accountInfo.passResetToken, process.env.JWT_SECRET);
    if (decoded.resetCode !== resetCode) throw new UserPasswordResetCodeInvalidError('Invalid reset code');
    const verifyToken = jwt.sign({email, resetCode}, process.env.JWT_SECRET, { expiresIn: 15 * 60 });
    user.accountInfo.passResetVerifiedToken = verifyToken;
    await user.save();
  },

  completePasswordReset: async (email, password) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) throw new UserNotFoundError('User with email ' + email + ' not found');
    jwt.verify(user.accountInfo.passResetVerifiedToken, process.env.JWT_SECRET);
    const salt = await bcrypt.genSalt(10);
    user.accountInfo.password = await bcrypt.hash(password, salt);
    user.accountInfo.passResetToken = null;
    user.accountInfo.passResetVerifiedToken = null;
    await user.save();
  },

  enableMfa: async (userId) => {
    const user  = await User.findById(userId);
    if (!user) throw new UserNotFoundError('User with id ' + userId + ' not found');
    if (user.accountInfo.mfaVerified) throw new UserAlreadyVerifiedError('MFA already enabled');
    const secret = authenticator.generateSecret();
    const qrCodeImageUrl = authenticator.keyuri(user.accountInfo.email, 'SpeedScore', secret);
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrCodeImageUrl);
    user.accountInfo.mfaSecret = encryptMfaSecret(secret);
    user.accountInfo.mfaVerified = false;
    await user.save();
    return {secret, qrCodeDataUrl};
  },

  startVerifyMfa: async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new UserNotFoundError('User with id ' + userId + ' not found');
    if (!user.accountInfo.mfaSecret) throw new Error('MFA not enabled');
    user.accountInfo.mfaAttempts = 0;
    user.accountInfo.mfaStartTime = new Date();
    await user.save();
    return 'MFA verification started';
  },

  verifyMfa: async (userId, token) => {
    const user = await User.findById(userId);
    if (!user) throw new UserNotFoundError('User with id ' + userId + ' not found');
    if (!user.accountInfo.mfaSecret) throw new Error('MFA not enabled');
    const currentTime = new Date();
    const timeElapsed = (currentTime - user.accountInfo.mfaStartTime);
    if (timeElapsed > MAX_MFA_TIME) throw new MfaSessionError('MFA session expired');
    if (user.accountInfo.mfaAttempts >= MAX_MFA_ATTEMPTS) throw new MfaSessionError('Too many MFA attempts');

    const secret = decryptMfaSecret(user.accountInfo.mfaSecret);

    // BROKEN: Always succeed MFA check
    const isValid = true; 

    if (!isValid) {
      user.accountInfo.mfaAttempts++;
      await user.save();
      throw new MfaSessionError('Invalid MFA token');
    }
    user.accountInfo.mfaVerified = true;
    user.accountInfo.mfaAttempts = 0;
    user.accountInfo.mfaStartTime = null;
    await user.save();
    return true;
  }
};
