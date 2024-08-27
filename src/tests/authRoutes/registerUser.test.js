/***************************************************************************************
 * @file: registerUser.test.js
 * @desc: Test the /auth/register and /auth/login and /auth/verify-email routes. 
 *        We use /auth/login to verify that a user's account is activated.
 *        We use /users/:userId to delete the user we created.
 **************************************************************************************/

// Import the necessary modules and services
import session from 'supertest-session';
import {app, server} from '../../server.js'; // Ensure your server exports the Express app
import * as emailService from '../../services/emailService';
import { generateRandomEmail, generateValidPassword, registerAndVerifyUser, loginUser } from '../../utils/testUtils.js';
import mongoose from 'mongoose';

// Declare the variables we'll use in the tests
const newUser = { email: generateRandomEmail(), password: generateValidPassword() };
let testSession;
let loggedInUser;   
let mockSendVerificationEmail;

// Describe the test suite
describe('Test routes to register new users and verify their email addresses', () => {

  // Before all tests, create a test session and spy on the sendVerificationEmail function
  beforeAll(() => {
    testSession = session(app);
    mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail');
    mockSendVerificationEmail.mockImplementation((email, verificationToken) => null);
  });
 
  // After each test, clear all timers
  afterEach(() => {
    jest.clearAllTimers(); // Clear all timers after each test
  });

  // After all tests, clear all mocks and close the server and database connection
  afterAll(async() => {
    jest.clearAllMocks(); // Clear all mocks after all tests
    await mongoose.connection.close();
    await new Promise(resolve => server.close(resolve));
  });

  // Test the /auth/register route with a valid, random email and password
   it('should register and verify a new user', async () => {
    await registerAndVerifyUser(testSession, newUser, mockSendVerificationEmail);
  });

  // Test the /auth/register route with an existing email
  it('should not register a user with an existing email', async () => {
    const response = await testSession
      .post('/auth/register')
      .send(newUser)
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'A user with that email already exists');
  });

  // Test the /auth/register route with an invalid email
  it('should not register a user with an invalid email', async () => {
    const response = await testSession
      .post('/auth/register')
      .send({ email: 'invalidEmail', password: generateValidPassword() })
    expect(response.statusCode).toBe(400);
    expect(response.body.errors[0]).toBe('is not a valid email address');
  });

  it('should not register a user with an invalid password', async () => {
    const response = await testSession
      .post('/auth/register')
      .send({ email: generateRandomEmail(), password: 'invalidPassword' })
      .set('Accept', 'application/json');
    expect(response.statusCode).toBe(400);
    expect(response.body.errors[0]).toBe('must be at least 8 characters long and contain at least one number and one uppercase letter');
  });
     
  //Verify that the user's account has been activated by logging in
  it('should ensure that the account has been verified by logging in', async () => {
    loggedInUser = await loginUser(testSession, newUser);
  });

  it ('should delete the user we created', async () => {
    const response = await testSession
      .delete(`/users/${loggedInUser.user._id}`)
      .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
      .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`);
    expect(response.statusCode).toBe(200);
  });
})