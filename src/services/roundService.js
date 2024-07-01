
/***********************************************************************
 * @file roundService.js
 * @desc This file contains functions to fulfill round route requests by
 *        updating the database. Uses Mongoose models for CRUD operations.
 * @module roundService
 *************************************************************************/
import mongoose from 'mongoose';
import User from '../models/User.js';
import {RoundNotFoundError, RoundObjectInvalidError, UserNotFoundError, ObjectIdInvalidError} from '../utils/errors.js';

export default {

  /***********************************************************************
   * getRounds
   * @desc Gets the rounds of a user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array>} The rounds array of the user.
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  getRounds: async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ObjectIdInvalidError('User ID is invalid; it must be a 24-character hexidecimal string');
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new UserNotFoundError('Cannot get rounds. No user with id ' + userId + ' exists.');
    }
    const roundObjects = userObject.rounds.map(round => {
      delete round.__v;
      return round;
    });
    return roundObjects;
  },

  /***********************************************************************
   * addRound
   * @desc Adds a round to a user document's rounds subdocument. 
   * @param {string} userId - The ID of the user.
   * @param {Object} roundObject - The round object to be added.
   * @returns {Promise<User>} The updated user object.
   * @throws {RoundObjectInvalidError} If the round object is invalid.
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  addRound: async (userId, roundObject) => {
    if (!roundObject) {
      throw new RoundObjectInvalidError('Round to be added must have properties');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ObjectIdInvalidError('User ID is invalid; it must be a 24-character hexadecimal string');
    }
    const user = await User.findById(userId); // Fetch the user document
    if (!user) {
      throw new UserNotFoundError('Cannot add round. No user with id ' + userId + ' exists.');
    }
    if (!user.rounds) { // Initialize rounds if it doesn't exist
      user.rounds = [];
    }
    if (roundObject.hasOwnProperty('seconds')) {
      if (isNaN(roundObject.seconds) || roundObject.seconds < 0) {
        throw new RoundObjectInvalidError('Seconds must be a non-negative number');
      }
      // If both minutes and seconds are provided, ensure seconds are between 0 and 59
      if (roundObject.hasOwnProperty('minutes')) {
        if (isNaN(roundObject.minutes) || roundObject.minutes < 0) {
          throw new RoundObjectInvalidError('Minutes must be a non-negative number');
        }
        if (roundObject.seconds > 59) {
          throw new RoundObjectInvalidError('Seconds must be between 0 and 59 when minutes are provided');
        }
        roundObject.seconds = (Number(roundObject.minutes) * 60) + Number(roundObject.seconds);
      } else {
        // Default minutes to 0 if not provided
        roundObject.seconds = Number(roundObject.seconds);
      }
      delete roundObject.minutes; // Remove minutes; we've converted  to seconds
    } else { //seconds not provided
      throw new RoundObjectInvalidError('Seconds must be provided');
    }
    user.rounds.push(roundObject);
    await user.save(); 
    const userObject = user.toObject();
    delete userObject.accountInfo.securityQuestion;
    delete userObject.accountInfo.securityAnswer;
    delete userObject.accountInfo.password;
    delete userObject.__v;
    return userObject;
  }
}