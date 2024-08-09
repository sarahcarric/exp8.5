/***********************************************************************
 * @file authRoutes.js
 * @desc Contains the routes for authenticating auth via GitHub OAuth.
 *************************************************************************/
import express from 'express';
import { githubAuth, githubCallback } from '../controllers/authController.js';
import * as authController from '../controllers/authController.js';
import { validateUserLogin, validateUser } from '../middleware/dataValidator.js';

const authRouter = express.Router();

/***********************************************************************
 * @route POST /auth/login
 * @desc Login a user.
 * @access Public
 * @returns {Object} - The user object.
 * *********************************************************************/
authRouter.post('/auth/login', validateUserLogin, authController.loginUser);

/***********************************************************************
 * @route POST /auth/refresh-token
 * @desc Refresh the user's JWT.
 * @access Public
 * @returns {Object} - An object containing the users's new access
 *                    token and its expiration date.
 * *********************************************************************/
authRouter.post('/auth/refresh-token', authController.refreshToken);

/***********************************************************************
 * @route POST /auth/register
 * @desc Create a new, unverified user account and email the user a 
 *       verification link they must click to activate their account.  
 * @access Public
 * *********************************************************************/
authRouter.post('/auth/register', validateUser, authController.registerUser);

/***********************************************************************
 * @route GET /users/verify-email/:token
 * @desc If the token is valid and unexpired, activate the user's 
 *       account.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/verify-email/:token', authController.verifyUserEmail);


/***********************************************************************
 * @route POST /auth/resend-verification-email
 * @desc Resend a verification email to the user.
* @access Public
 * *********************************************************************/
authRouter.post('/auth/resend-verification-email', authController.resendVerificationEmail);

/***********************************************************************
 * @route POST /auth/reset-password/request
 * @desc Send the user a password reset email with a code.
 * @access Public
 * *********************************************************************/
authRouter.post('/auth/reset-password/request', authController.requestPasswordReset);

/***********************************************************************
 * @route POST /auth/reset-password/verify
 * @desc Verify a password reset code.
 * @access Public
 * *********************************************************************/
authRouter.post('/auth/reset-password/verify', authController.verifyPasswordReset);

/***********************************************************************
 * @route POST /auth/reset-password/complete
 * @desc Complete the password reset process by setting a new password.
 * @access Public
  * *********************************************************************/
authRouter.post('/auth/reset-password/complete', authController.completePasswordReset);

/***********************************************************************
 * @route POST /auth/logout
 * @desc Log out the user.
 * @access Private
 * *********************************************************************/
authRouter.post('/auth/:userId/mfa/enable', authController.enableMfa);

/***********************************************************************
 * @route POST /auth/:userId/mfa/disable
 * @desc Disable multi-factor authentication for a user account.
 * @access Private
 * *********************************************************************/
authRouter.post('/auth/:userId/mfa/start-verify', authController.startVerifyMfa);

/***********************************************************************
 * @route POST /auth/:userId/mfa/verify
 * @desc Verify a multi-factor authentication code.
 * @access Private
 * *********************************************************************/
authRouter.post('/auth/:userId/mfa/verify', authController.verifyMfa);

/***********************************************************************
 * @route GET /auth/anti-csrf-token
 * @desc Get the anti-CSRF token associated with the user's session.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/anti-csrf-token', authController.getAntiCsrfToken);

/***********************************************************************
 * @route GET /auth/github
 * @desc Authenticate the user using the GitHub strategy by redirecting
 *      them to the GitHub login page. Scope is set to 'user:email' and
 *      'read:user' to request access to the user's email and profile.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/github', githubAuth);

/***********************************************************************
 * @route GET /auth/github/callback
 * @desc Callback function after the user has authenticated with GitHub.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/github/callback', githubCallback);

export default authRouter;