import express from 'express';
import { githubAuth, githubCallback } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.get('/auth/github', githubAuth);

authRouter.get('/auth/github/callback', githubCallback);

export default authRouter;