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
                      delete userObject.accountInfo.securityQuestion;
                      delete userObject.accountInfo.securityAnswer;
                      delete userObject.__v;
                      return userObject;
                    }
                  );
  }
};
