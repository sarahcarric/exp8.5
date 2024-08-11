/***********************************************************************
 * @file userController.js
 * @desc Validates incoming data for the user and round routes using Joi
 *************************************************************************/
import Joi from 'joi';
import {emailRegex, userJoiSchema, roundJoiSchema} from '../utils/validationSchemas.js';

/*************************************************************************
 * @func validateUserLogin
 * @desc Validates the user login request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const validateUserLogin = (req, res, next) => {
  const loginSchema = Joi.object({
    email: Joi.string().trim().required().pattern(emailRegex)
      .message('is not a valid email address'),
    password: Joi.string().required()
  });
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ errors: error.details.map(detail => detail.message) });
  }
  next();
};

/*************************************************************************
 * @func validateUser
 * @desc Validates the user registration request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const validateUser = (req, res, next) => {
  const { error } = userJoiSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ errors: error.details.map(detail => detail.message) });
  }
  next();
};

/*************************************************************************
 * @func validateRound
 * @desc Validates the round creation request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const validateRound = (req, res, next) => {
  const { error } = roundJoiSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ errors: error.details.map(detail => detail.message) });
  }
  next();
};
