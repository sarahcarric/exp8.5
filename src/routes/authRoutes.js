import express from 'express';
import { githubAuth, githubCallback, handleAuthFailure, handleAuthSuccess } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.get('/auth/github', githubAuth);

authRouter.get('/auth/github/callback', 
  githubCallback,
  handleAuthFailure,
  handleAuthSuccess
);

export default authRouter;