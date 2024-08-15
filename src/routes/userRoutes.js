/***********************************************************************
 * @file userRoutes.js
 * @desc Defines the routes for handling user requests.
 *************************************************************************/
import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { csrfProtection } from '../middleware/csrfProtection.js';

const userRouter = express.Router();

/***********************************************************************
 * @route GET /users
 * @desc Get all users.
 * @access Public
 * @returns {Array} - An array of user objects.
 * *********************************************************************/
userRouter.get('/users', authenticate, csrfProtection, userController.getUsers);

//userRouter.put('/users/:userId', userController.updateUser);

//userRouter.delete(/users/:userId, userController.deleteUser);

export default userRouter;