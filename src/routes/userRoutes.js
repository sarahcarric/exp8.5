import express from 'express';
import { validateUserLogin, validateUser } from '../middleware/dataValidator.js';
import * as userController from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/users', userController.getUsers);

userRouter.post('/users/login', validateUserLogin, userController.loginUser);

userRouter.post('/users/register', validateUser, userController.registerUser);

userRouter.get('/users/verify-email/:token', userController.verifyUserEmail);

userRouter.post('/users/resend-verification-email', userController.resendVerificationEmail);

userRouter.post('/users/reset-password/request', userController.requestPasswordReset);

userRouter.post('/users/reset-password/verify', userController.verifyPasswordReset);

userRouter.post('/users/reset-password/complete', userController.completePasswordReset);

userRouter.post('/users/:userId/mfa/enable', userController.enableMfa);

userRouter.post('/users/:userId/mfa/start-verify', userController.startVerifyMfa);

userRouter.post('/users/:userId/mfa/verify', userController.verifyMfa);

//userRouter.post('/users/logout', userController.logoutUser);

//userRouter.put('/users/:userId', userController.updateUser);

//userRouter.delete(/users/:userId, userController.deleteUser);

export default userRouter;