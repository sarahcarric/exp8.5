/***********************************************************************
 * @file userService.js
 * @desc This file contains functions to fulfill user route requests by
 *        updating the database. Uses Mongoose models for CRUD operations.
 * @module userService
 *************************************************************************/
import User from '../models/User.js';
import { UserAlreadyVerfiedError, UserNotFoundError, 
         UserPasswordInvalidError, UserPasswordResetCodeInvalidError, MfaSessionError} from '../utils/errors.js';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const MAX_MFA_TIME = 60 * 1000 * 10 //10 minutes
const MAX_MFA_ATTEMPTS = 5;

/***********************************************************************
 * sendVerificationEmail
 * @descr Send a verification email to the user.
 * @param {string} email - The email address to send the verification email to.
 * @param {string} verificationToken - The token to verify the user.
 * @returns {Promise<void>}
 * @throws {Error} If the email fails to send.
 *************************************************************************/
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl =
    `${process.env.API_DEPLOYMENT_URL}/users/verify-email/${verificationToken}`;
  const message = {
    to: email,
    from: process.env.SENDGRID_FROM_ADDRESS, 
    subject: 'SpeedScore: Verify Your Email Address',
    text: `Please use the following link to verify ` +
            `your email address: ${verificationUrl}`,
    html: `<p>Please click on the following link to verify ` +
            `your email address:` +
        `<a href="${verificationUrl}">Verify Email</a></p>`
  };
  await sgMail.send(message);
};

/***********************************************************************
 * sendPasswordResetEmail
 * @descr Send a password reset email to the user.
 * @param {string} email - The email address to send the password reset email to.
 * @param {string} resetCode - The code to reset the user's password.
 * @returns {Promise<void>}
 * @throws {Error} If the email fails to send.
 *************************************************************************/
const sendPasswordResetEmail = async (email, resetCode) => {
  const message = {
    to: email,
    from: process.env.SENDGRID_FROM_ADDRESS,
    subject: 'SpeedScore: Password Reset Code',
    text: `Your password reset code is: ${resetCode}`,
    html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>`
  };
  await sgMail.send(message);
};

/***********************************************************************
 * encryptMfaSecret
 * @descr Encrypt the MFA secret.
 * @param {string} mfaSecret - The MFA secret to encrypt.
 * @returns {string} The encrypted MFA secret.
 *************************************************************************/
const encryptMfaSecret = (mfaSecret) => {
  const iv = crypto.randomBytes(16); // Generate a random initialization vector
  console.log(`Generated IV: ${iv.toString('hex')}`)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.MFA_ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(mfaSecret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const encryptedWithIv = iv.toString('hex') + ':' + encrypted;
  return encryptedWithIv;
}

/***********************************************************************
 * decryptMfaSecret
 * @descr Decrypt the MFA secret.
 * @param {string} encryptedMfaSecret - The encrypted MFA secret to decrypt.
 * @returns {string} The decrypted MFA secret.
 *************************************************************************/
const decryptMfaSecret = (encryptedWithIv) => {
  const [ivHex, encryptedData] = encryptedWithIv.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.MFA_ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/***********************************************************************
 * generateQrCodeDataUrl
 * @descr Generate a data URL for the QR code.
 * @param {imageUrl} secret - The image Url to generate the QR code for.
 * @returns <string> The data URL for the QR code.
 *************************************************************************/
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
   /***********************************************************************
   * loginUser
   * @descr Log in an existing user.
   * @param {string} email, the email address of the user to log in.
   * @param {string} password, the password of the user to log in.
   * @returns {Promise<Object>} An object consisting of the logged in 
   *          user's data object
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  loginUser: async (email, password) => {
    const user = await User.findOne({ 'accountInfo.email': email }).lean();
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    } 
    const validPassword = await bcrypt.compare(password, user.accountInfo.password);
    if (!validPassword) {
      throw new UserPasswordInvalidError('Invalid password');
    }
    const userObject = {...user};
    delete userObject.accountInfo.password;
    delete userObject.accountInfo.securityQuestion;
    delete userObject.accountInfo.securityAnswer;
    delete userObject.__v;
    return userObject;
  },

  /***********************************************************************
   * registerUser
   * @descr Add a new user to the database, but mark them as unverified
   *       and send a verification email. 
   * @param {Object} userObject - The user object to be added.
   * @returns {Promise<Object>} The added user object.
   *************************************************************************/
  registerUser: async (newUser) => {
    const salt = await bcrypt.genSalt(10);
    newUser.accountInfo.password = await bcrypt.hash(newUser.accountInfo.password, salt);
    const verificationToken = jwt.sign({email: newUser.accountInfo.email}, process.env.JWT_SECRET, { expiresIn: '1d' });
    sendVerificationEmail(newUser.accountInfo.email, verificationToken);
    const user = new User(newUser);
    await user.save();
    const userObject = user.toObject();
    delete userObject.accountInfo.password;
    delete userObject.accountInfo.securityQuestion;
    delete userObject.accountInfo.securityAnswer;
    delete userObject.__v;
    return userObject;
  },

  /***********************************************************************
   * verifyUserEmail
   * @descr Verify a user's email address using a token.
   * @param {string} token - The token to verify the user.
   * @returns {Promise<boolean>} True if the user's email is verified.
   *************************************************************************/
  verifyUserEmail: async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({"accountInfo.email": decoded.email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + decoded.email + ' not found');
    }
    user.accountInfo.emailVerified = true;
    user.accountInfo.verificationDueBy = null;
    await user.save();
    console.log('User email verified:', user.accountInfo.email);
    return true;
  },

  /***********************************************************************
   * resendVerificationEmail
   * @descr Resend a verification email to the user.
   * @param {string} email - The email address to send the verification email to.
   * @returns {Promise<void>}
   *************************************************************************/
  resendVerificationEmail: async (email) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    }
    if (user.accountInfo.emailVerified) {
      throw new UserAlreadyVerfiedError("User's email already verified");
    }
    const verificationToken = jwt.sign({email: email}, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.accountInfo.verificationDueBy = new Date(Date.now() + 1000*60*60*24); //24 hours from now
    await user.save();
    sendVerificationEmail(email, verificationToken);
  },

  /***********************************************************************
   * requestPasswordReset
   * @descr Initiate a password reset for the user.
   * @param {string} email - The email address to send the password reset email to.
   * @returns {Promise<void>}
   *************************************************************************/
  requestPasswordReset: async (email) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    }
    const resetCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const resetToken = jwt.sign({resetCode}, process.env.JWT_SECRET, { expiresIn: 15 * 60 });
    user.accountInfo.passResetToken = resetToken;
    await user.save();
    sendPasswordResetEmail(email, resetCode);
  },

  /***********************************************************************
   * verifyPasswordReset
   * @descr Verify a password reset for the user.
   * @param {string} email - The email address to verify the password reset for.
   * @param {string} resetCode - The code to verify the password reset.
   * @returns {Promise<void>}
   *************************************************************************/
  verifyPasswordReset: async (email, resetCode) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    }
    const decoded = jwt.verify(user.accountInfo.passResetToken, process.env.JWT_SECRET);
    if (decoded.resetCode !== resetCode) {
      throw new UserPasswordResetCodeInvalidError('Invalid reset code');
    }
    const verifyToken = jwt.sign({email, resetCode}, process.env.JWT_SECRET, { expiresIn: 15 * 60 });
    user.accountInfo.passResetVerfiedToken = verifyToken;
    await user.save();
  },

  /***********************************************************************
   * completePasswordReset
   * @descr Complete a password reset for the user.
   * @param {string} email - The email address to complete the password reset for.
   * @param {string} password - The new password to set for the user.
   * @returns {Promise<void>}
   *************************************************************************/
  completePasswordReset: async (email, password) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    }
    console.log("in completePasswordReset with email " + email + " and password " + password)
    jwt.verify(user.accountInfo.passResetVerfiedToken, process.env.JWT_SECRET); 
    console.log("verified token");
    const salt = await bcrypt.genSalt(10);
    user.accountInfo.password = await bcrypt.hash(password, salt);
    user.accountInfo.passResetToken = null;
    user.accountInfo.passResetVerifiedToken = null;
    await user.save();
  },

  enableMfa: async (userId) => {
    const user  = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + userId + ' not found');
    }
    if (user.accountInfo.mfaVerified) {
      throw new UserAlreadyVerfiedError('MFA already enabled');
    }
    const secret = authenticator.generateSecret();
    const qrCodeImageUrl = authenticator.keyuri(user.accountInfo.email, 'SpeedScore',secret);
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrCodeImageUrl);
    user.accountInfo.mfaSecret = encryptMfaSecret(secret);
    user.accountInfo.mfaVerified = false;
    await user.save();
    return {secret, qrCodeDataUrl};
  },

  startVerifyMfa: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + userId + ' not found');
    }
    if (!user.accountInfo.mfaSecret) {
      throw new Error('MFA not enabled for this user');
    }
    // Initialize MFA verification process
    user.accountInfo.mfaAttempts = 0;
    user.accountInfo.mfaStartTime = new Date();
    await user.save();
    return 'MFA verification started';
  },

  verifyMfa: async (userId, token) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + userId + ' not found');
    }
    if (!user.accountInfo.mfaSecret) {
      throw new Error('MFA not enabled for this user');
    }
    const currentTime = new Date();
    const timeElapsed = (currentTime - user.accountInfo.mfaStartTime); // Time elapsed in milliseconds
    if (timeElapsed > MAX_MFA_TIME) {
      throw new MfaSessionError('MFA session has expired or you have not started an MFA session');
    }
    if (user.accountInfo.mfaAttempts >= MAX_MFA_ATTEMPTS) {
      throw new MfaSessionError('Maximum number of MFA attempts exceeded');
    }
    const secret = decryptMfaSecret(user.accountInfo.mfaSecret);
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      user.accountInfo.mfaAttempts++; // Increment mfaAttempts on failure
      await user.save();
      return false;
  }

  // On successful verification, reset the counter and start time
  user.accountInfo.mfaVerified = true;
  user.accountInfo.mfaAttempts = 0;
  user.accountInfo.mfaStartTime = null;
  await user.save();
  return true;
  },

  /***********************************************************************
   * getUsers 
   * @descr Get all users.
   * @returns {Promise<Array<Object>>} An array of user objects.
   *************************************************************************/
  getUsers: async () => {
    const users = await User.find().lean();
    return users.map(user => {
                      const userObject = {...user};
                      delete userObject.accountInfo.password;
                      delete userObject.accountInfo.securityQuestion;
                      delete userObject.accountInfo.securityAnswer;
                      delete userObject.__v;
                      return userObject;
                    }
                  );
  }
};
