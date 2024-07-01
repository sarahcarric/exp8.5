import express from 'express';
import * as roundController from '../controllers/roundController.js';

const roundRouter = express.Router();

roundRouter.get('/users/:userId/rounds', roundController.getRounds);

roundRouter.post('/users/:userId/rounds', roundController.addRound);

//roundRouter.put('/users/:userId/rounds/:roundId', roundController.updateRound);

//roundRouter.delete('/users/:userId/rounds/:roundId', roundController.deleteRound);

export default roundRouter;