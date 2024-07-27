/***********************************************************************
 * @file authRoutes.js
 * @desc Contains the routes for authenticating users via GitHub OAuth.
 *************************************************************************/
import express from 'express';
import { githubAuth, githubCallback } from '../controllers/authController.js';

const authRouter = express.Router();

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