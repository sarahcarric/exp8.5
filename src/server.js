import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/userRoutes.js';
import { UserObjectInvalidError, UserExistsError, RoundObjectInvalidError, UserNotFoundError } from './routes/errors.js';
//import roundRouter from './routes/roundRoutes.js';

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
//app.use(roundRouter);

//Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).send({ error: 'Invalid JSON in message body' });
  } else if (err instanceof UserObjectInvalidError || err instanceof UserExistsError || 
             err instanceof UserNotFoundError || err instanceof mongoose.Error.ValidationError) {
    res.status(400).send({ error: err.message });
  } else {
    res.status(500).send({ error: err.message });
  }
});

//Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}...`));