import express from 'express';
import User from '../models/User.js';
import { UserNotFoundError, RoundNotFoundError } from '../utils/errors.js';

const roundRouter = express.Router();

/*************************************************************************
 * @function userRouter.get (Get all rounds of a user)
 * @param {string} '/users:userId/rounds' - route path
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that gets all rounds from the database
 * for a user with id userId and sends them back to the client.
 * ***********************************************************************/
roundRouter.get('/users/:userId/rounds', async (req, res, next) => { 
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + req.params.userId + ' not found');
    }
    res.status(200).json(user.rounds);
  } catch (err) {
    next(err);
  }
});

/*************************************************************************
 * @function userRouter.post (Create new round for a user)
 * @param {string} '/users/:userId/rounds' - route path
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that adds a new round for a user
 * with id userId and sends the round object back to the client.
 * ***********************************************************************/
roundRouter.post('/users/:userId/rounds', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + req.params.userId + ' not found');
    }
    user.rounds.push(req.body);
    await user.save();
    res.status(201).json(user.rounds[user.rounds.length - 1]);
  } catch (err) {
    next(err);
  }
});

/*************************************************************************
 * @function userRouter.put (Update a round)
 * @param {string} '/users/:userId/rounds/:roundId' - path to update a round
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that updates the round with id roundId
 * belonging to the user with id userId and sends the updated round object
 * back to the client.
 * ***********************************************************************/
roundRouter.put('/users/:userId/rounds/:roundId', async (req, res, next) => {
  //TO DO: Implement this function
});

/*************************************************************************
 * @function userRouter.delete (Delete a round)
 * @param {string} '/users/:userId/rounds/:roundId' - path to delete a round
 * @param {function} async - middleware function
 * @returns {void}
 * @description Middleware function that deletes the round with id roundId
 * belonging to the user with id userId and sends the deleted round object
 * back to the client.
 * ***********************************************************************/
roundRouter.delete('/users/:userId/rounds/:roundId', async (req, res, next) => {
  //TO DO: Implement this function
});


export default roundRouter;