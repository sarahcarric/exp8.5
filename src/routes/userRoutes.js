import express from 'express';
import User from '../models/User.js';
import { UserNotFoundError, UserPasswordInvalidError, UserExistsError, UserObjectInvalidError } from './errors.js';

const userRouter = express.Router();

userRouter.get('/users', async (req, res, next) => { 
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
   next(err);
  }
});

userRouter.post('/users/login', async(req, res, next) => { 
  try {
    const user = await User.findOne({"accountInfo.email": req.body.email})
    if (!user) {
      throw new UserNotFoundError('User with email ' + req.body.email + ' not found');
    }
    if (req.body.password !== user.accountInfo.password) {
      throw new UserPasswordInvalidError("Password for user with email " + req.body.email + " is incorrect");
    } else {
      const userObject = user.toObject();
      delete userObject.accountInfo.password; //Don't send password back to client
      delete userObject.accountInfo.securityQuestion; //Don't send security question back to client
      delete userObject.accountInfo.securityAnswer; //Don't send security answer back to client
      res.status(200).json(userObject);
    }
  } catch (err) {
    next(err);
  }
});

userRouter.post('/users', async (req, res, next) => { 
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

userRouter.delete('/users/:userId', async(req, res, next) => { 
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + req.params.userId + ' not found');
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

export default userRouter;