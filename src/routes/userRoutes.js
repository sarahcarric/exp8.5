import express from 'express';
import * as userController from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/users', userController.getUsers);

userRouter.post('/users/login', userController.loginUser);

userRouter.post('/users', userController.addUser);

userRouter.get('/users/:userId', userController.getUser);

userRouter.delete('/users/:userId', userController.deleteUser);

export default userRouter;