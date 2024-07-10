import Joi from 'joi';
import {emailRegex, userJoiSchema, roundJoiSchema} from '../utils/validationSchemas.js';

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

export const validateUser = (req, res, next) => {
  const { error } = userJoiSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ errors: error.details.map(detail => detail.message) });
  }
  next();
};

export const validateRound = (req, res, next) => {
  const { error } = roundJoiSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ errors: error.details.map(detail => detail.message) });
  }
  next();
};
