/*************************************************************************
 * @file: server.js
 * @descr: This file contains the main server code for SpeedScore's API.
 * @module: server
 * @requires: express, mongoose, dotenv, userRouter, roundRouter, errorHandler
  *************************************************************************/
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/userRoutes.js';
import roundRouter from './routes/roundRoutes.js';
import errorHandler from './middleware/errorHandler.js';

//Load environment variables from .env file
dotenv.config();
const connectStr = process.env.MONGODB_URI;

//Connect to MongoDB database using Mongoose library
mongoose.connect(connectStr)
  .then(
    () =>  {console.log(`Connected to ${connectStr}.`)},
    err => {console.error(`Error connecting to ${connectStr}: ${err}`)}
  );

//Initialize Express app
const app = express();

//Install built-in Express body-parser middleware
app.use(express.json());

//Install app routes
app.use(userRouter);
app.use(roundRouter);

//Install error-handling middleware
app.use(errorHandler);

//Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}...`));