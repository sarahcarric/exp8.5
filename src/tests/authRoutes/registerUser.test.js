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
import { generateRandomEmail, generateValidPassword, 
        registerUser, verifyAccountEmail, loginUser, 
        requestResendVerificationEmail, retryRequest} from '../../utils/testUtils.js';
import mongoose from 'mongoose';

//Array of users to test
const newUsers = Array(1).fill(null).map(() => ({
  email: generateRandomEmail(),
  password: generateValidPassword()
}));

//Variables used in tests
let testSession, loggedInUser, mockSendVerificationEmail; 
const invalidEmail = 'invalidEmail';
const invalidPassword = 'invalidpassword';

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

  newUsers.forEach((newUser) => {
    //Test the /auth/register route with a invalid email and password
    it('should not register a new user with invalid email and password', async () => {
      await registerUser(testSession, { email: invalidEmail, password: invalidPassword }, false);
    });

    //Test the /auth/register route with a valid email and password
    it('should register a new user', async () => {
      await registerUser(testSession, newUser);
    });

    //Test the /auth/resend-verification-email route with an invalid email
    it('should not re-send verification email to invalid email', async () => {
      await requestResendVerificationEmail(testSession, invalidEmail, false);
    });

    //Test the /auth/resend-verification-email route with a valid, registered email
    it('should re-send verification email to valid, registered user', async () => {
      await requestResendVerificationEmail(testSession, newUser.email);
    });

    //Test the /auth/verify-email route with invalid token
    it('should verify user email', async () => {
      await verifyAccountEmail(mockSendVerificationEmail, false);
    });

    //Test the /auth/verify-email route with valid token
    it('should verify user email', async () => {
      await verifyAccountEmail(mockSendVerificationEmail);
    });

    // Test the /auth/register route with an existing email
    it('should not register a user with an existing email', async () => {
      const response = await retryRequest(async() => 
        testSession
          .post('/auth/register')
          .send(newUser)
      );
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
    //Delete the user we created, so we leave no trace
    it ('should delete the user we created', async () => {
      const response = await testSession
        .delete(`/users/${loggedInUser.user._id}`)
        .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
        .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`);
      expect(response.statusCode).toBe(200);
    });
  });
})