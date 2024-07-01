/***********************************************************************
 * @file userController.js
 * @desc Contains the controller functions for handling user requests.
 *************************************************************************/
import userService from '../services/userService.js';

/***********************************************************************
 * getusers (GET /users/:userId)
 * @desc Get all users.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves with the users data.
 *************************************************************************/
export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * loginUser (POST /users/login)
 * @desc Login a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves with the an object
 * consisting of user and token props.
 *************************************************************************/
export const loginUser = async (req, res, next) => {
  try {
    const user = await userService.loginUser(req.body.email, req.body.password);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  } 
}

/***********************************************************************
 * addUser (POST /users)
 * @desc Add a new user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves with the added user data.
 *************************************************************************/
export const addUser = async (req, res, next) => {
  try {
    const user = await userService.addUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err)
  }
}