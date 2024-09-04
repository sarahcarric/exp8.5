/***********************************************************************
 * @file authController.js
 * @desc Contains the controller functions for handling Oauth requests.
 *************************************************************************/
import authService from '../services/authService.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import passport from 'passport';
import { UserNotFoundError, InvalidAccessTokenError, InvalidAntiCsrfTokenError, InvalidOauthTokenError } from '../utils/errors.js';

/***********************************************************************
 * loginUser (POST /auth/login)
 * @desc Login a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const loginUser = async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body.email, req.body.password);
    req.user = user;
    next(); //transfer execution to configureSession middleware
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * logoutUser (POST /auth/logout)
 * @desc Log out a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns a 200 status code if user could be logged out successfully.
 *************************************************************************/
export const logoutUser = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const antiCsrfToken = req.headers['x-anti-csrf-token'];
  if (!accessToken) {
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'User logged out' });
  }
  if (antiCsrfToken !== req.session.antiCsrfToken) {
    return next(new InvalidAntiCsrfTokenError("Invalid anti-CSRF token"));
  }
  try {
    // Verify the access token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // Destroy the session
    req.session.destroy(async (err) => {
      if (err) {
        console.log("Error destroying session:", err);
        return res.status(500).json({ message: 'Failed to destroy session' });
      }

      // Remove the session document from the MongoDB collection
      const sessionId = req.sessionID;
      await mongoose.connection.collection('sessions').deleteOne({ _id: sessionId });
      return res.status(200).json({message: 'User logged out' });
    });
  } catch (err) {
    // Handle token verification errors
    if (err.name === 'TokenExpiredError') {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.json({message: 'User logged out' });
    }
    return next(new InvalidAccessTokenError("Invalid access token"));
  }
};

/***********************************************************************
 * refreshToken (POST /auth/refresh-token)
 * @desc If the user's refresh token is valid and unexpired, refresh
 *       the token and the anti-CSRF token.
 * @param {Object} req - The request object containing the userId and
 *        the user's refresh token.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns An object containing the user's new access token's 
 *          epiration date and new anti-CSRF token.
 *************************************************************************/
export const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.params.userId, req.cookies.refreshToken);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 3600000
    };
    res.cookie('accessToken', result.accessToken, cookieOptions);
    req.session.antiCsrfToken = result.antiCsrfToken;
    res.status(200).json({accessTokenExpiry: result.accessTokenExpiry, 
                          antiCsrfToken: result.antiCsrfToken});
  } catch (err) {
    next(err)
  }
};

/***********************************************************************
 * registerUser (POST /auth)
 * @desc Add a new user to the database, but mark them as unverified.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns The user object of the user that has registered.
 *************************************************************************/
export const registerUser = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err)
  }
}

/***********************************************************************
 * verifyUserEmail (GET /auth/verify-token/:token)
 * @desc Verify a user's email address using a token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const verifyUserEmail = async (req, res, next) => {
  let redirectUrl = process.env.CLIENT_DEPLOYMENT_URL;
  try {
    await authService.verifyUserEmail(req.params.token);
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
    return res.redirect(redirectUrl);
  }
}

/***********************************************************************
 * resendVerificationEmail (POST /auth/resend-verification-email)
 * @desc Resend a verification email to the user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const resendVerificationEmail = async (req, res, next) => {
  try {
    await authService.resendVerificationEmail(req.body.email);
    res.status(200).json({message: 'Verification email re-sent', email: req.body.email});
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * requestPasswordReset (POST /auth/reset-password/request)
 * @desc Request a password reset email.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const requestPasswordReset = async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.status(200).json({message: 'Password reset email sent', email: req.body.email});
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * verifyPasswordReset (POST /auth/reset-password/verify)
 * @desc Verify a password reset code.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/ 
export const verifyPasswordReset = async (req, res, next) => {
  try {
    await authService.verifyPasswordReset(req.body.email, req.body.resetCode);
    res.status(200).json({message: 'Password reset code verified'});
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * completePasswordReset (POST /auth/reset-password/complete)
 * @desc Complete a password reset by setting a new password.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const completePasswordReset = async (req, res, next) => {
  try {
    await authService.completePasswordReset(req.body.email, req.body.newPassword);
    res.status(200).json({message: 'Password reset complete'});
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * enableMfa (POST /auth/mfa/enable/:userId)
 * @desc Enable multi-factor authentication for a user account.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const enableMfa = async (req, res, next) => {
  try {
    const result = await authService.enableMfa(req.params.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * startVerifyMfa (POST /auth/mfa/start-verify/:userId)
 * @desc Initiate an MFA verification session.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const startVerifyMfa = async (req, res, next) => {
  try {
    await authService.startVerifyMfa(req.params.userId);
    res.status(200).json({ message: 'MFA verification started' });
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * verifyMfa (POST /auth/mfa/verify/:userId)
 * @desc Verify a multi-factor authentication code for a user account.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const verifyMfa = async (req, res, next) => {
  try {
    await authService.verifyMfa(req.params.userId, req.body.code);
    res.status(200).json({ message: 'MFA code verified' });
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * getAntiCsrfToken (GET /auth/anti-csrf-token)
 * @desc Get the user's current anti-CSRF token, which must be included
 * in the header of state-changing API requests to prevent CSRF attacks.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 *************************************************************************/
export const getAntiCsrfToken = (req, res) => {
  res.status(200).json({antiCsrfToken: req.session.antiCsrfToken});
};

/***********************************************************************
 * githubAuth (GET /auth/github)
 * @desc Authenticate the user using the GitHub strategy by redirecting
 *      them to the GitHub login page. Scope is set to 'user:email' and
 *     'read:user' to request access to the user's email and profile.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void}
 *************************************************************************/
export const githubAuth = (req, res, next) => {
  const oauthToken = crypto.randomBytes(32).toString('hex');
  res.cookie('oauthToken', oauthToken, { httpOnly: true, secure: true });

  passport.authenticate('github', {
    scope: ['user:email', 'read:user'],
    state: oauthToken
  })(req, res, next);
};

/***********************************************************************
 * githubCallback (GET /auth/github/callback)
 * @desc Callback function after the user has authenticated with GitHub.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 *************************************************************************/
export const githubCallback = (req, res, next) => {
  const oauthToken = req.cookies.oauthToken
  if (req.query.state !== oauthToken) {
    return next(new InvalidOauthTokenError("State token returned by Github does not match session token"));
  }
  passport.authenticate('github', (err, user) => {
    if (err) {
      console.error("Error during passport authentication: ", err);
      return next(err);
    }
    if (!user) {
      console.error("No user found during passport authentication");
      return next(new UserNotFoundError('Login failed. No user found'));
    }
    req.user = user;
    next();
  })(req, res, next);
};