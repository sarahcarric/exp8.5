/*************************************************************************
 * @file authorize.js
 * @desc Middleware to authorize access to API routes
 * @exports authorize
 *************************************************************************/

import { UnauthorizedError } from '../utils/errors.js';

/*************************************************************************
 * @const accessRules
 * @desc Defines access rules for different roles and resources
 *************************************************************************/
const accessRules = {
  'admin': {
    'users': {
      'POST': () => true, 
      'PUT': () => true, 
      'DELETE': () => true, 
      'GET': () => true 
    },
    'courses': {
      'POST': () => true, 
      'PUT': () => true, 
      'DELETE': () => true, 
      'GET': () => true 
    },
    'auth': {
      'POST': () => true,
      'PUT': () => true, 
      'DELETE': () => true, 
      'GET': () => true 
    },
  },
  'user': {
    'users': {
      'POST': (resourceId, userId) => {
        return (resourceId === userId); 
      },
      'PUT': (resourceId, userId) => {
        return (resourceId === userId);
      },
      'DELETE': (resourceId, userId) => {
        return (resourceId === userId);
      },
      'GET': () => true
    },
    'auth': {
      'POST': (resourceId, userId) => {
        return (resourceId === userId);
      },
      'PUT': (resourceId, userId) => {
        return (resourceId === userId);
      },
      'DELETE': (resourceId, userId) => {
        return (resourceId === userId);
      },
      'GET':  (resourceId, userId) => {
        return (resourceId === userId);
      },
    }
  }
};

/*************************************************************************
 * @function authorize
 * @desc Authorizes access to a route based on the user's role
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 *************************************************************************/
export const authorize = (req, res, next) => {
  const userId = req.session.user._id;
  const role = req.session.user.accountInfo.role;
  const resource = req.path.split('/')[1];
  const resourceId = req.params.userId;
  const action = req.method; 
  if (accessRules[role] && accessRules[role][resource] && accessRules[role][resource][action]) {
    const rule = accessRules[role][resource][action];
    const hasPermission = rule(resourceId, userId);
    if (hasPermission) {
      return next();
    }
  }
  return next(new UnauthorizedError("User is not authorized to perform this action"));
}