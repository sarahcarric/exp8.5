import express from 'express';
import User from '../models/User.js';
import { UserNotFoundError, RoundNotFoundError } from './errors.js';

const roundRouter = express.Router();

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

roundRouter.delete('/users/:userId/rounds/:roundId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + req.params.userId + ' not found');
    }
    const round = user.rounds.id(req.params.roundId);
    if (!round) {
      throw new RoundNotFoundError('Round with id ' + req.params.roundId + ' not found');
    }
    round.remove();
    await user.save();
    res.status(200).json(round);
  } catch (err) {
    next(err);
  }
});

export default roundRouter;