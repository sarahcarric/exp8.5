/***********************************************************************
 * @file userRoutes.js
 * @desc Defines the routes for handling user requests.
 *************************************************************************/
import express from 'express';
import { validateUserLogin, validateUser } from '../middleware/dataValidator.js';
import * as userController from '../controllers/userController.js';

const userRouter = express.Router();

/***********************************************************************
 * @route GET /users
 * @desc Get all users.
 * @access Public
 * @returns {Array} - An array of user objects.
 * *********************************************************************/
userRouter.get('/users', userController.getUsers);

/***********************************************************************
 * @route POST /users/login
 * @desc Login a user.
 * @access Public
 * @returns {Object} - The user object.
 * *********************************************************************/
userRouter.post('/users/login', validateUserLogin, userController.loginUser);

/***********************************************************************
 * @route POST /users/register
 * @desc Create a new, unverified user account and email the user a 
 *       verification link they must click to activate their account.  
 * @access Public
 * *********************************************************************/
userRouter.post('/users/register', validateUser, userController.registerUser);

/***********************************************************************
 * @route GET /users/verify-email/:token
 * @desc If the token is valid and unexpired, activate the user's 
 *       account.
 * @access Public
 * *********************************************************************/
userRouter.get('/users/verify-email/:token', userController.verifyUserEmail);

/***********************************************************************
 * @route POST /users/resend-verification-email
 * @desc Resend a verification email to the user.
* @access Public
 * *********************************************************************/
userRouter.post('/users/resend-verification-email', userController.resendVerificationEmail);

/***********************************************************************
 * @route POST /users/reset-password/request
 * @desc Send the user a password reset email with a code.
 * @access Public
 * *********************************************************************/
userRouter.post('/users/reset-password/request', userController.requestPasswordReset);

/***********************************************************************
 * @route POST /users/reset-password/verify
 * @desc Verify a password reset code.
 * @access Public
 * *********************************************************************/
userRouter.post('/users/reset-password/verify', userController.verifyPasswordReset);

/***********************************************************************
 * @route POST /users/reset-password/complete
 * @desc Complete the password reset process by setting a new password.
 * @access Public
  * *********************************************************************/
userRouter.post('/users/reset-password/complete', userController.completePasswordReset);

/***********************************************************************
 * @route POST /users/logout
 * @desc Log out the user.
 * @access Private
 * *********************************************************************/
userRouter.post('/users/:userId/mfa/enable', userController.enableMfa);

/***********************************************************************
 * @route POST /users/:userId/mfa/disable
 * @desc Disable multi-factor authentication for a user account.
 * @access Private
 * *********************************************************************/
userRouter.post('/users/:userId/mfa/start-verify', userController.startVerifyMfa);

/***********************************************************************
 * @route POST /users/:userId/mfa/verify
 * @desc Verify a multi-factor authentication code.
 * @access Private
 * *********************************************************************/
userRouter.post('/users/:userId/mfa/verify', userController.verifyMfa);

//userRouter.post('/users/logout', userController.logoutUser);

//userRouter.put('/users/:userId', userController.updateUser);

//userRouter.delete(/users/:userId, userController.deleteUser);

export default userRouter;