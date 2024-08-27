import session from 'supertest-session';
import {app, server} from '../../server.js'; // Ensure your server exports the Express app
import * as emailService from '../../services/emailService.js';
import {generateRandomEmail, generateValidPassword, registerUser, 
         verifyAccountEmail, loginUser, 
        retryRequest} from '../../utils/testUtils.js';
import mongoose from 'mongoose';

const newUsers = Array(4).fill(null).map(() => ({
  email: generateRandomEmail(),
  password: generateValidPassword()
}));

const newPasswordValid = generateValidPassword();
const newPasswordInvalid = '123'; // Invalid password
const pwResetCodeInvalid = '12345';

let testSession, loggedInUser, mockSendVerificationEmail, mockSendPasswordResetEmail, pwResetCode

describe('Auth Routes', () => {

  beforeAll(async () => {
    testSession = session(app);
    mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail');
    mockSendVerificationEmail.mockImplementation((email, verificationToken) => null);
    mockSendPasswordResetEmail = jest.spyOn(emailService,'sendPasswordResetEmail');
    mockSendPasswordResetEmail.mockImplementation((email, resetCode) => null);
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
    //Test the /auth/register route with a valid, random email and password
    it('should register a new user', async () => {
      await registerUser(testSession, newUser);
    });
    //Test the /auth/verify-email route
    it('should verify user email', async () => {
      await verifyAccountEmail(mockSendVerificationEmail);
    });
    //Test the /auth/login route
    it('should log in the user', async () => {
      loggedInUser = await loginUser(testSession, newUser);
    });
   //Test the /auth/logout route
   it('should log out the user', async () => {
      const response = await retryRequest(async() => 
        testSession
          .delete(`/auth/logout/${loggedInUser.user._id}`)
          .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
          .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
      );
      expect(response.statusCode).toBe(200);
    });
    //Test the /auth/reset-password/request route
    it('should send user password reset email', async () => {
      const response = await retryRequest(async() =>
        testSession
          .post('/auth/reset-password/request')
          .send({ email: newUser.email })
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password reset email sent');
      expect(response.body).toHaveProperty('email', newUser.email);
      pwResetCode = mockSendPasswordResetEmail.mock.calls[mockSendPasswordResetEmail.mock.calls.length-1][1]; // Get the resetCode from the latest call
      expect(pwResetCode).toBeDefined();
    });
    //Test the /auth/reset-password/verify route
    it('should verify the password reset code', async () => {
      const response = await testSession
        .post('/auth/reset-password/verify')
        .send({ email: newUser.email, resetCode: pwResetCode });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password reset code verified');
    });
  
    it('should accept a new password and reset it', async () => {
      const response = await testSession
        .post('/auth/reset-password/complete')
        .send({email: theUser.email, newPassword: newPassword});
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password reset complete');
    });
    
    //Re-log in user to delete them
    it('should re-log in the user', async () => {
      loggedInUser = await loginUser(testSession, newUser);
    });
    //Clean up the user just created
    it('should delete the user', async () => {
      const response = await retryRequest(async() => 
        testSession
          .delete(`/users/${loggedInUser.user._id}`)
          .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
          .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
      );
      expect(response.statusCode).toBe(200);  
    });
  });
});