/*************************************************************************
 * @file authenticate.js
 * @desc Middleware to authenticate requests using JWT.
 * @exports authenticate
 *************************************************************************/

import jwt from 'jsonwebtoken';
import { InvalidAccessTokenError } from '../utils/errors.js';

/*************************************************************************
 * @func authenticate
 * @desc Middleware function to authenticate requests using JWT.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const authenticate = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return next(new InvalidAccessTokenError("Access token is missing"));
  }

  try {
    // Verify the access token; will throw error if invalid
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new InvalidAccessTokenError("Refresh token has expired"));
      }
      return next(new InvalidAccessTokenError("Invalid refresh token"));
    }
}