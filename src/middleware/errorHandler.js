import mongoose from 'mongoose';
import { UserNotFoundError, UserPasswordInvalidError } from '../utils/errors.js';

/*************************************************************************
 * @function errorHandler
 * @param {Error} err - Error object
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {NextFunction} next - Next function
 * @returns {void}
 * @description Middleware function that handles errors and sends appropriate
 * error response to client. We use custom error classes and Mongoose error
 * classes to identify and handle errors in the 400 range. If the class of
 * err does not match any of these known classes, we assume the error falls
 * in the 500 range and pass along the associated message.
 ************************************************************************/

export default function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).send({ error: 'Invalid JSON in message body' });
  } else if (err instanceof UserNotFoundError || err instanceof UserPasswordInvalidError || 
             err instanceof mongoose.Error.ValidationError) {
    res.status(400).send({ error: err.message });
  } else if (err.code === 11000 || err.code === 11001) { //MongoDB duplicate key error
    res.status(400).send({ error: 'A user with that email already exists' });
  } else {
    res.status(500).send({ error: err.message });
  }
};