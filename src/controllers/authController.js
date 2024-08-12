/***********************************************************************
 * @file authController.js
 * @desc Contains the controller functions for handling Oauth requests.
 *************************************************************************/
import authService from '../services/authService.js';
import passport from 'passport';

/***********************************************************************
 * loginUser (POST /auth/login)
 * @desc Login a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const loginUser = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body.email, req.body.password);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 3600000
    };
    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, {...cookieOptions, maxAge: 604800000 });
    req.session.antiCsrfToken = result.antiCsrfToken;
    res.status(200).json({
      accessTokenExpiry: result.accessTokenExpiry,
      refreshTokenExpiry: result.refreshTokenExpiry,
      antiCsrfToken: result.antiCsrfToken
    });
  } catch (err) {
    next(err);
  } 
}

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
export const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(refreshToken);
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
    console.error('Error verifying user email:', err);
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
    res.status(200).send('Verification email sent to ' + req.body.email);
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
    res.status(200).send('Password reset email sent to ' + req.body.email);
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
    res.status(200).send('Password reset code verified');
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
    res.status(200).send('Password reset complete');
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * enableMfa (POST /auth/:userId/mfa/enable)
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
 * startVerifyMfa (POST /auth/:userId/mfa/start-verify)
 * @desc Initiate an MFA verification session.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const startVerifyMfa = async (req, res, next) => {
  try {
    await authService.startVerifyMfa(req.params.userId);
    res.status(200).send('MFA verification started');
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * verifyMfa (POST /auth/:userId/mfa/verify)
 * @desc Verify a multi-factor authentication code for a user account.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const verifyMfa = async (req, res, next) => {
  try {
    const result = await authService.verifyMfa(req.params.userId, req.body.code);
    res.status(200).send(result);
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
  const antiCsrfToken = req.csrfToken();
  res.status(200).json({ antiCsrfToken });
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
export const githubAuth = passport.authenticate('github', { scope: ['user:email', 'read:user'] });

/***********************************************************************
 * githubCallback (GET /auth/github/callback)
 * @desc Callback function after the user has authenticated with GitHub.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 *************************************************************************/
export const githubCallback = (req, res, next) => {
  passport.authenticate('github', (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication failed', message: err.message});
    }
    if (!user) {
      return res.status(401).json({error: 'Login failed. No user found' });
    }
    req.user = user;
    res.status(200).send(`User logged in successfully: ${req.user.accountInfo.email}`);
  })(req, res, next);
};