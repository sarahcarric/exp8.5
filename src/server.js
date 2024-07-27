/*************************************************************************
 * @file: server.js
 * @desc: Defines the main server code for SpeedScore's API.
  *************************************************************************/
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import './middleware/passport.js';
import userRouter from './routes/userRoutes.js';
import roundRouter from './routes/roundRoutes.js';
import authRouter from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY); 

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

app.use(passport.initialize());

//Install app routes
app.use(userRouter);
app.use(roundRouter);
app.use(authRouter);

//Install error-handling middleware
app.use(errorHandler);

//Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}...`));