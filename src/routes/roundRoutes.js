import express from 'express';
import { validateRound } from '../middleware/dataValidator.js';
import * as roundController from '../controllers/roundController.js';

const roundRouter = express.Router();

roundRouter.get('/users/:userId/rounds', roundController.getRounds);

roundRouter.post('/users/:userId/rounds', validateRound, roundController.addRound);

//roundRouter.put('/users/:userId/rounds/:roundId', roundController.updateRound);

//roundRouter.delete('/users/:userId/rounds/:roundId', roundController.deleteRound);

export default roundRouter;