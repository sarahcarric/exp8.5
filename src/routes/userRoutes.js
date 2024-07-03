import express from 'express';
import { validateUserLogin, validateUser } from '../middleware/dataValidator.js';
import * as userController from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/users', userController.getUsers);

userRouter.post('/users/login', validateUserLogin, userController.loginUser);

userRouter.post('/users', validateUser, userController.addUser);

//userRouter.post('/users/logout', userController.logoutUser);

//userRouter.put('/users/:userId', userController.updateUser);

//userRouter.delete(/users/:userId, userController.deleteUser);

export default userRouter;