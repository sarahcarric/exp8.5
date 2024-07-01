/***********************************************************************
 * @file userService.js
 * @desc This file contains functions to fulfill user route requests by
 *        updating the database. Uses Mongoose models for CRUD operations.
 * @module userService
 *************************************************************************/
import User from '../models/User.js';
import { UserNotFoundError, UserPasswordInvalidError } from '../utils/errors.js';

export default {
   /***********************************************************************
   * loginUser
   * @descr Log in an existing user.
   * @param {string} email, the email address of the user to log in.
   * @param {string} password, the password of the user to log in.
   * @returns {Promise<Object>} An object consisting of the logged in 
   *          user's data object
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  loginUser: async (email, password) => {
    const user = await User.findOne({ 'accountInfo.email': email }).lean();
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    } 
    if (password !== user.accountInfo.password) {
      throw new UserPasswordInvalidError('Invalid password');
    }
    const userObject = {...user};
    delete userObject.accountInfo.password;
    delete userObject.accountInfo.securityQuestion;
    delete userObject.accountInfo.securityAnswer;
    delete userObject.__v;
    return userObject;
  },

  /***********************************************************************
   * addUser
   * @descr Add a new user to the database.
   * @param {Object} userObject - The user object to be added.
   * @returns {Promise<Object>} The added user object.
   *************************************************************************/
  addUser: async (newUser) => {
    const user = new User(newUser);
    await user.save();
    const userObject = user.toObject();
    delete userObject.accountInfo.password;
    delete userObject.accountInfo.securityQuestion;
    delete userObject.accountInfo.securityAnswer;
    delete userObject.__v;
    return userObject;
  },

  /***********************************************************************
   * getUsers 
   * @descr Get all users.
   * @returns {Promise<Array<Object>>} An array of user objects.
   *************************************************************************/
  getUsers: async () => {
    const users = await User.find().lean();
    return users.map(user => {
                      const userObject = {...user};
                      delete userObject.accountInfo.password;
                      delete userObject.accountInfo.securityQuestion;
                      delete userObject.accountInfo.securityAnswer;
                      delete userObject.__v;
                      return userObject;
                    }
                  );
  }
};
