/***********************************************************************
 * @file userService.js
 * @desc This file contains functions to fulfill user route requests by
 *        updating the database. Uses Mongoose models for CRUD operations.
 * @module userService
 *************************************************************************/
import User from '../models/User.js';
import { UserNotFoundError } from '../utils/errors.js';

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
    const user = await User.findOne({ 'accountInfo.email': email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    } 
    if (password !== user.accountInfo.password) {
      throw new UserNotFoundError('Invalid password');
    }
    const userObject = user.toObject();
    delete userObject.__v;
    delete userObject.accountInfo.password;
    return userObject;
  },

  /***********************************************************************
   * addUser
   * @descr Add a new user to the database.
   * @param {Object} userObject - The user object to be added.
   * @returns {Promise<Object>} The added user object.
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  addUser: async (userObject) => {
    const user = new User(userObject);
    await user.save();
    delete userObject.accountInfo.password;
    return userObject;
  },

  /***********************************************************************
   * getUsers 
   * @desc Get all users.
   * @returns {Promise<Array<Object>>} An array of user objects.
   *************************************************************************/
  getUsers: async () => {
    const users = await User.find();
    return users.map(user => {
                      const userObject = user.toObject();
                      delete userObject.accountInfo.password;
                      delete userObject.__v;
                      return userObject;
                    }
                  );
  },

  /***********************************************************************
   * getUser
   * @desc Get a user by ID.
   * @async
   * @param {string} id - The ID of the user to retrieve.
   * @returns {Promise<Object>} The user object.
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
   getUser: async (id) => {
      const user = await User.findById(id);
      if (!user) {
        throw new UserNotFoundError('User with id ' + id + ' not found');
      }
      const userObject = user.toObject();
      delete userObject.accountInfo.password;
      delete userObject.__v;
      return userObject;
  },

  /***********************************************************************
   * deleteUser
   * @desc Delete a user by ID.
   * @param {string} id - The ID of the user to delete.
   * @returns {Promise<Object>} The deleted user object.
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  deleteUser: async (id) => {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new UserNotFoundError('User with id ' + id + ' not found');
    }
    const userObject = user.toObject();
    delete userObject.accountInfo.password;
    delete userObject.__v;
    return userObject;
  },
};
