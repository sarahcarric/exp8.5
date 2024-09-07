/*************************************************************************
 * @file: server.js
 * @desc: Defines the main server code for SpeedScore's API.
  *************************************************************************/
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import express from 'express';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import mongoose, { set } from 'mongoose';
import passport from 'passport';
import './middleware/passport.js';
import userRouter from './routes/userRoutes.js';
import roundRouter from './routes/roundRoutes.js';
import authRouter from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';
import setupSwagger from './swagger.js';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY); 

const connectStr = process.env.MONGODB_URI;

//Connect to MongoDB database using Mongoose library
mongoose.connect(connectStr)
  .then(
    () =>  {console.log(`Connected to ${connectStr}.`)},
    err => {console.error(`Error connecting to ${connectStr}: ${err}`)}
  );

const db = mongoose.connection;

// Create TTL index on the 'expires' field in the 'sessions' collection
db.once('open', () => {
  db.collection('sessions').createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });
});

//Initialize Express app
const app = express();

app.use(rateLimiter);

app.use(cookieParser());
//Install built-in Express body-parser middleware
app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({ mongoUrl: process.env.MONGODB_URI,
                          collectionName: 'sessions'
   }),
  cookie: { secure: isProduction, 
            sameSite: isProduction ? 'None' : false, // SameSite=None in production, disable SameSite in development
            httpOnly: true,}
}));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? 'https://speedscore.org' : 'http://localhost:3000',
  credentials: true // Allow cookies to be sent with requests
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(passport.initialize());
setupSwagger(app);

// Install app routes
app.use(userRouter);
app.use(roundRouter);
app.use(authRouter);

//Install error-handling middleware
app.use(errorHandler);

//Start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`Server running on port ${port}...`));

export { app, server, db};
