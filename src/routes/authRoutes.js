/***********************************************************************
 * @file authRoutes.js
 * @desc Contains the routes for authenticating auth via GitHub OAuth.
 *************************************************************************/
import express from 'express';
import { githubAuth, githubCallback } from '../controllers/authController.js';
import * as authController from '../controllers/authController.js';
import { validateUserLogin, validateUser } from '../middleware/dataValidator.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRefreshToken } from '../middleware/validateRefreshToken.js';
import { authorize } from '../middleware/authorize.js';
import { csrfProtection } from '../middleware/csrfProtection.js';
import { configureSession } from '../middleware/configureSession.js';

const authRouter = express.Router();

/***********************************************************************
 * @route POST /auth/login
 * @desc Login a user.
 * @access Public
 * @returns {Object} - The user object.
 * *********************************************************************/
authRouter.post('/auth/login', validateUserLogin, authController.loginUser, configureSession);

/***********************************************************************
 * @route POST /auth/logout
 * @desc Log out a user.
 * @access Private
 * *********************************************************************/
authRouter.delete('/auth/logout/:userId', authenticate, csrfProtection, authorize, authController.logoutUser);

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
 * @route POST /auth/refresh-token
 * @desc Refresh the user's JWT.
 * @access Public
 * @returns {Object} - An object containing the users's new access
 *                    token and its expiration date.
 * *********************************************************************/
authRouter.post('/auth/refresh-token/:userId', validateRefreshToken, authorize, authController.refreshToken);

/***********************************************************************
 * @route POST /auth/:userId/mfa/enable
 * @desc Begin the process of enabling multi-factor authentication.
 * @access Private
 * *********************************************************************/
authRouter.post('/auth/mfa/enable/:userId', authenticate, csrfProtection, authorize, authController.enableMfa);

/***********************************************************************
 * @route POST /auth/:userId/mfa/verify
 * @desc Verify a multi-factor authentication code.
 * @access Private
 * *********************************************************************/
authRouter.post('/auth/mfa/verify/:userId', authenticate, csrfProtection, authorize, authController.verifyMfa);

/***********************************************************************
 * @route GET /auth/anti-csrf-token
 * @desc Get the anti-CSRF token associated with the user's session.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/anti-csrf-token/:userId', authenticate, authorize, authController.getAntiCsrfToken);

/***********************************************************************
 * @route GET /auth/github
 * @desc Authenticate the user using the GitHub strategy by redirecting
 *      them to the GitHub login page. Scope is set to 'user:email' and
 *      'read:user' to request access to the user's email and profile.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/github', authController.githubAuth);

/***********************************************************************
 * @route GET /auth/github/callback
 * @desc Callback function after the user has authenticated with GitHub.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/github/callback', authController.githubCallback, configureSession);

export default authRouter;