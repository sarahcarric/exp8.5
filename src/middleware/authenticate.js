/*************************************************************************
 * @file authenticate.js
 * @desc Middleware to authenticate requests using JWT.
 * @exports authenticate
 *************************************************************************/

import jwt from 'jsonwebtoken';
import { InvalidAccessTokenError } from '../errors';

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
    // Verify the access token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    // Ensure the user in the token matches the user attached to the route
    if (req.params.userId && req.params.userId !== decoded.id) {
      return next(new InvalidAccessTokenError("User ID does not match the token"));
    }
    req.user = decoded;
    next();
  } catch (err) {
    next(new InvalidAccessTokenError("Invalid access token"));
  }
};