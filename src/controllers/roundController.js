/***********************************************************************
 * @file roundController.js
 * @desc Contains the controller functions for handling round requests.
 *************************************************************************/
import roundService from '../services/roundService.js';

/***********************************************************************
 * getRounds (GET /users/:userId/rounds)
 * @desc Retrieves rounds for a specific user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the rounds 
 *          are retrieved.
 *************************************************************************/
export const getRounds = async (req, res, next) => {
  try {
    const rounds = await roundService.getRounds(req.params.userId);
    res.status(200).json(rounds);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * addRound (POST /users/:userId/rounds)
 * @desc Adds a new round for a specific user.
  * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the round is added.
 *************************************************************************/
export const addRound = async (req, res, next) => {
  try {
    const updatedUser = await roundService.addRound(req.params.userId, req.body);
    res.status(201).json(updatedUser);
  } catch (err) {
    next(err)   
  } 
}

export const updateRound = async (req, res, next) => {
  try {
    const updatedUser = await roundService.updateRound(req.params.userId, req.params.roundId, req.body);
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * deleteRound (DELETE /users/:userId/rounds/:roundId)
 * @desc Deletes a round for a specific user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the round is deleted.
 *************************************************************************/
export const deleteRound = async (req, res, next) => {
  try {
    const updatedUser = await roundService.deleteRound(req.params.userId, req.params.roundId);
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
}