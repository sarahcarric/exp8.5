/***********************************************************************
 * @file userController.js
 * @desc Contains the controller functions for handling user requests.
 *************************************************************************/
import userService from '../services/userService.js';

/***********************************************************************
 * getusers (GET /users/:userId)
 * @desc Get all users.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * loginUser (POST /users/login)
 * @desc Login a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const loginUser = async (req, res, next) => {
  try {
    const user = await userService.loginUser(req.body.email, req.body.password);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * registerUser (POST /users)
 * @desc Add a new user to the database, but mark them as unverified.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const registerUser = async (req, res, next) => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err)
  }
}

/***********************************************************************
 * verifyUserEmail (GET /users/verify-token/:token)
 * @desc Verify a user's email address using a token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const verifyUserEmail = async (req, res, next) => {
  let redirectUrl = process.env.CLIENT_DEPLOYMENT_URL;
  try {
    await userService.verifyUserEmail(req.params.token);
    redirectUrl += '/emailverified';
    return res.redirect(redirectUrl);
  } catch (err) {
    redirectUrl += '/emailvalidationerror';
    if (err.name === 'JsonWebTokenError') {
      redirectUrl += '?reason=invalidtoken';
    } else {
      redirectUrl += '?reason=other'; 
    }
    if (req.params.token) {
      const decodedToken = jwt.decode(req.params.token);
      if (decodedToken && decodedToken.email) {
        // Append email as an additional parameter
        redirectUrl += `&email=${encodeURIComponent(decodedToken.email)}`;
      } 
    }
    console.error('Error verifying user email:', err);
    return res.redirect(redirectUrl);
  }
}

/***********************************************************************
 * resendVerificationEmail (POST /users/resend-verification-email)
 * @desc Resend a verification email to the user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const resendVerificationEmail = async (req, res, next) => {
  try {
    await userService.resendVerificationEmail(req.body.email);
    res.status(200).send('Verification email sent to ' + req.body.email);
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * requestPasswordReset (POST /users/reset-password/request)
 * @desc Request a password reset email.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const requestPasswordReset = async (req, res, next) => {
  try {
    await userService.requestPasswordReset(req.body.email);
    res.status(200).send('Password reset email sent to ' + req.body.email);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * verifyPasswordReset (POST /users/reset-password/verify)
 * @desc Verify a password reset code.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/ 
export const verifyPasswordReset = async (req, res, next) => {
  try {
    await userService.verifyPasswordReset(req.body.email, req.body.resetCode);
    res.status(200).send('Password reset code verified');
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * completePasswordReset (POST /users/reset-password/complete)
 * @desc Complete a password reset by setting a new password.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const completePasswordReset = async (req, res, next) => {
  try {
    await userService.completePasswordReset(req.body.email, req.body.resetCode, req.body.newPassword);
    res.status(200).send('Password reset complete');
  } catch (err) {
    next(err);
  } 
}
