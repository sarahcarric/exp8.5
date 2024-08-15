/*************************************************************************
 * @file authorize.js
 * @desc Middleware to authorize access to API routes
 * @exports authorize
 *************************************************************************/

import { UnauthorizedError } from '../errors';

export const authorize = (req, res, next) => {
    if (req.session.user.role === 'admin') {
      return next(); // Allow access if the user has the required role
    }
    if (req.session.user._id === req.params.userId) {
      return next(); 
    }
    return next(new UnauthorizedError("User is not authorized to perform this action"));
}