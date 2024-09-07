/***********************************************************************
 * @file userService.js
 * @desc This file contains functions to fulfill user route requests by
 *        updating the database. Uses Mongoose models for CRUD operations.
 * @module userService
 *************************************************************************/
import User from '../models/User.js';

export default {

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
                      delete userObject.__v;
                      return userObject;
                    }
                  );
  },

  /***********************************************************************
   * getUser
   * @descr Get a user by ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<Object>} The user object.
  *************************************************************************/
  getUser: async (userId) => {
    const user = await User.findById(userId).lean();
    const userObject = {...user};
    // Remove sensitive information from the user object
    delete userObject.accountInfo.password;
    delete userObject.accountInfo.emailVerified;
    delete userObject.accountInfo.passResetToken;
    delete userObject.accountInfo.passResetVerifiedToken;
    delete userObject.accountInfo.mfaSecret;
    delete userObject.accountInfo.mfaVerified;
    delete userObject.accountInfo.mfaAttempts;
    delete userObject.accountInfo.mfaStartTime;
    delete userObject.__v;
    return userObject;
  },

  /***********************************************************************
   * updateUser
   * @descr Update a user by ID.
   * @param {string} userId - The ID of the user to update.
   * @param {Object} user - The updated user object.
   * @returns {Promise<Object>} The user object.
   * *********************************************************************/
  updateUser: async (userId, user) => {
    const updatedUser = await User.findByIdAndUpdate(userId, user, {new: true}).lean();
    const userObject = {...updatedUser};
    //Remove sensitive information from the user object
    delete userObject.accountInfo.password;
    delete userObject.accountInfo.emailVerified;
    delete userObject.accountInfo.passResetToken;
    delete userObject.accountInfo.passResetVerifiedToken;
    delete userObject.accountInfo.mfaSecret;
    delete userObject.accountInfo.mfaVerified;
    delete userObject.accountInfo.mfaAttempts;
    delete userObject.accountInfo.mfaStartTime;
    delete userObject.__v;
    return userObject;
  },

 /***********************************************************************
   * deleteUser
   * @descr Delete a user by ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<Object>} The user object.
  *************************************************************************/
  deleteUser: async (userId) => {
    const user = await User.findByIdAndDelete(userId).lean();
    const userObject = {...user};
    delete userObject.accountInfo.password;
    delete userObject.__v;
    return userObject;
  }
}
