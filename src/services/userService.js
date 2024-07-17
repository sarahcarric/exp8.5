/***********************************************************************
 * @file userService.js
 * @desc This file contains functions to fulfill user route requests by
 *        updating the database. Uses Mongoose models for CRUD operations.
 * @module userService
 *************************************************************************/
import User from '../models/User.js';
import { UserNotFoundError, UserPasswordInvalidError, UserPasswordResetCodeInvalidError} from '../utils/errors.js';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';

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
   * initiatePasswordReset
   * @descr Initiate a password reset for the user.
   * @param {string} email - The email address to send the password reset email to.
   * @returns {Promise<void>}
   *************************************************************************/
  initiatePasswordReset: async (email) => {
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
    jwt.verify(user.accountInfo.passResetVerfiedToken, process.env.JWT_SECRET); 
    const salt = await bcrypt.genSalt(10);
    user.accountInfo.password = await bcrypt.hash(password, salt);
    user.accountInfo.passResetToken = null;
    user.accountInfo.passResetToken = null;
    await user.save();
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
