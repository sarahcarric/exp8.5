/*************************************************************************
 * @file validateRefreshToken.js
 * @desc Middleware to validate the user's refresh token.
 * @exports authenticate
 *************************************************************************/

import jwt from 'jsonwebtoken';
import { InvalidAccessTokenError } from '../utils/errors.js';

/*************************************************************************
 * @func validateRefreshToken
 * @desc Middleware function to validate user's refresh token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const validateRefreshToken = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new InvalidAccessTokenError("Refresh token is missing"));
  }

  try {
    // Verify the access token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new InvalidAccessTokenError("Refresh token has expired"));
      }
      return next(new InvalidAccessTokenError("Invalid refresh token"));
    }
}