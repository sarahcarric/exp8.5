/***********************************************************************
 * @file roundRoutes.js
 * @desc Contains the routes for handling round requests.
 *************************************************************************/
import express from 'express';
import { validateRound } from '../middleware/dataValidator.js';
import * as roundController from '../controllers/roundController.js';

const roundRouter = express.Router();

/***********************************************************************
 * @route GET /users/:userId/rounds
 * @desc Retrieves rounds for a specific user.
 * @access Public
 * @returns {Array} - An array of round objects.
 * *********************************************************************/
roundRouter.get('/users/:userId/rounds', roundController.getRounds);

/***********************************************************************
 * @route POST /users/:userId/rounds
 * @desc Adds a new round for a specific user.
 * @access Public
 * @returns {Object} - The updated user object.
 * *********************************************************************/
roundRouter.post('/users/:userId/rounds', validateRound, roundController.addRound);

//roundRouter.put('/users/:userId/rounds/:roundId', roundController.updateRound);

//roundRouter.delete('/users/:userId/rounds/:roundId', roundController.deleteRound);

export default roundRouter;