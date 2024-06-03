
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
      throw new ObjectIdInvalidError('User ID is invalid; it must be a 24-character hexidecimal string');
    }
    const user = await User.findOne({_id: userId});
    if (!user) {
      throw new UserNotFoundError('Cannot add round. No user with id ' + userId + ' exists.');
    }
    if (!user.rounds || !Array.isArray(user.rounds)) { //Add empty rounds array if it doesn't exist
      user.rounds = [];
    }
    if (roundObject && roundObject.hasOwnProperty('minutes')  && roundObject.hasOwnProperty('seconds')) {
      if (isNaN(roundObject.seconds) || roundObject.seconds < 0 || roundObject.seconds > 59) {
        throw new RoundObjectInvalidError('Seconds must be a number between 0 and 59');
      }
      roundObject.seconds = (Number(roundObject.minutes) * 60) + Number(roundObject.seconds);
      delete roundObject.minutes;
    }
    user.rounds.push(roundObject); //Add the roundObject to the rounds array
    await user.save(); //Updates the user object, validating the new roundObject in the process.
    const userObject = user.toObject();
    delete userObject.accountInfo.password;
    delete userObject.__v;
    return userObject;
  },

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
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError('Cannot get rounds. No user with id ' + userId + ' exists.');
    }
    const userObject = user.toObject();
    const roundObjects = userObject.rounds.map(round => {
      delete round.__v;
      return round;
    });
    return roundObjects;
  },

  /***********************************************************************
   * updateRound
   * @desc Updates a round of a user.
   * @param {string} userId - The ID of the user.
   * @param {string} roundId - The ID of the round to be updated.
   * @param {Object} roundObject - The updated round object.
   * @returns {Promise<User>} The updated user object.
   * @throws {RoundObjectInvalidError} If the round object is invalid.
   * @throws {UserNotFoundError} If the user is not found.
   * @throws {RoundNotFoundError} If the round is not found.
   *************************************************************************/
  updateRound: async (userId, roundId, roundObject) => {
    if (!roundObject) {
      throw new RoundObjectInvalidError('Round to be updated must have properties');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ObjectIdInvalidError('User ID is invalid; it must be a 24-character hexidecimal string');
    }
    const user = await User.findById(userId);
    console.log("User = " + JSON.stringify(user));
    if (!user) {
      throw new UserNotFoundError('Cannot update Round. No user with id ' + userId + ' exists.');
    }
    if (!mongoose.Types.ObjectId.isValid(roundId)) {
      throw new ObjectIdInvalidError('Round ID is invalid; it must be a 24-character hexidecimal string');
    }
    const round = user.rounds.id(roundId);
    if (!round) {
      throw new RoundNotFoundError('Cannot update round. No round with id ' + roundId + ' exists for user with id ' + userId);
    }
    if (roundObject.hasOwnProperty('minutes')  && roundObject.hasOwnProperty('seconds')) {
      if (isNaN(roundObject.seconds) || roundObject.seconds < 0 || roundObject.seconds > 59) {
        throw new RoundObjectInvalidError('Seconds must be a number between 0 and 59');
      }
      roundObject.seconds = (Number(roundObject.minutes) * 60) + Number(roundObject.seconds);
      delete roundObject.minutes;
    }
    Object.assign(round, roundObject);
    await user.save();
    const userObject = user.toObject();
    delete userObject.accountInfo.password;
    delete userObject.__v;
    return userObject;
  },

  /***********************************************************************
   * deleteRound
   * @desc Deletes a round of a user.
   * @param {string} userId - The ID of the user.
   * @param {string} roundId - The ID of the round to be deleted.
   * @returns {Promise<User>} The updated user object.
   * @throws {UserNotFoundError} If the user is not found.
   * @throws {RoundNotFoundError} If the round is not found.
   *************************************************************************/
  deleteRound: async (userId, roundId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ObjectIdInvalidError('User ID is invalid; it must be a 24-character hexidecimal string');
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError('Cannot delete Round. No user with email ' + userId + ' exists.');
    }
    if (!mongoose.Types.ObjectId.isValid(roundId)) {
      throw new ObjectIdInvalidError('Round ID is invalid; it must be a 24-character hexidecimal string');
    }
    const round = user.rounds.id(roundId);
    if (!round) {
      throw new RoundNotFoundError('Cannot delete round. No round with id ' + roundId + ' exists for user with id ' + userId);
    }
    user.rounds.pull(roundId); 
    await user.save();
    const userObject = user.toObject();
    delete userObject.accountInfo.password;
    delete userObject.__v;
    return userObject;
  }
}