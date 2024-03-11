import express from 'express';
import User from '../models/User.js';
import { UserNotFoundError, UserPasswordInvalidError} from '../utils/errors.js';

const userRouter = express.Router();

/*************************************************************************
 * @function userRouter.get (Get all users)
 * @param {string} '/users' - path to get all users
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that gets all users from the database
 * and sends them back to the client.
 * ***********************************************************************/
userRouter.get('/users', async (req, res, next) => { 
  try {
    const users = await User.find();
    const userObjects = users.map(user => user.toObject());
    userObjects.forEach(user => {
      delete user.accountInfo.password; //Don't send password back to client
      delete user.accountInfo.securityQuestion; //Don't send security question back to client
      delete user.accountInfo.securityAnswer; //Don't send security answer back to client
    });
    res.status(200).json(userObjects);
  } catch (err) {
   next(err);
  }
});

/*************************************************************************
 * @function userRouter.post (Log in user)
 * @param {string} '/users/login' - path to login user
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that logs in a user using the request
 * body and sends the user object back to the client if successful.
 * ***********************************************************************/
userRouter.post('/users/login', async(req, res, next) => { 
  try {
    const user = await User.findOne({"accountInfo.email": req.body.email})
    if (!user) {
      throw new UserNotFoundError('User with email ' + req.body.email + ' not found');
    }
    if (req.body.password !== user.accountInfo.password) {
      throw new UserPasswordInvalidError("Password for user with email " + req.body.email + " is incorrect");
    } else {
      const userObject = user.toObject();
      delete userObject.accountInfo.password; //Don't send password back to client
      delete userObject.accountInfo.securityQuestion; //Don't send security question back to client
      delete userObject.accountInfo.securityAnswer; //Don't send security answer back to client
      res.status(200).json(userObject);
    }
  } catch (err) {
    next(err);
  }
});

/*************************************************************************
 * @function userRouter.post (Create new user)
 * @param {string} '/users' - path to create user
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that creates a user in the database
 * using the request body.
 * ***********************************************************************/
userRouter.post('/users', async (req, res, next) => { 
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

/*************************************************************************
 * @function userRouter.put
 * @param {string} '/users/:userId' - path to update user
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that updates a user in the database
 * using the user id in the request parameters and the request body.
 ************************************************************************/
userRouter.put('/users/:userId', async (req, res, next) => { 
  //TO DO: Implement this function
});

/*************************************************************************
 * @function userRouter.delete
 * @param {string} '/users/:userId' - path to delete user
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that deletes a user from the database
 * using the user id in the request parameters.
 ************************************************************************/
userRouter.delete('/users/:userId', async(req, res, next) => { 
  //TO DO: Implement this function
});

export default userRouter;