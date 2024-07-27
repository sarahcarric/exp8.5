/***********************************************************************
 * @file authController.js
 * @desc Contains the controller functions for handling Oauth requests.
 *************************************************************************/
import passport from 'passport';

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