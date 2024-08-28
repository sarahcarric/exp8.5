import session from 'supertest-session';
import {app, server} from '../../server.js'; // Ensure your server exports the Express app
import * as emailService from '../../services/emailService.js';
import {generateRandomEmail, generateValidPassword, registerUser, 
        requestResendVerificationEmail, verifyAccountEmail, loginUser, 
        retryRequest} from '../../utils/testUtils.js';
import mongoose from 'mongoose';

//Note: If we test with 4 users instead of 4, we get a rate limit error (429), as we should.
const newUsers = Array(4).fill(null).map(() => ({
  email: generateRandomEmail(),
  password: generateValidPassword()
}));

let testSession;
let loggedInUser;   
let mockSendVerificationEmail;

describe('Test Anti-CSRF Token GET Route', () => {

  beforeAll(async () => {
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
    it('should register a new user', async () => {
      await registerUser(testSession, newUser);
    });
    it('should request verification email to be re-sent', async () => {
      await requestResendVerificationEmail(testSession, newUser.email);
    });
    it('should verify user email', async () => {
      await verifyAccountEmail(mockSendVerificationEmail);
    });
    it('should login the user', async () => {
      loggedInUser = await loginUser(testSession, newUser);
    });
    it('should get the user\'s anti-csrf token', async () => {
      const response = await retryRequest(() => 
        testSession
          .get(`/auth/anti-csrf-token/${loggedInUser.user._id}`)
          .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('antiCsrfToken');
      expect(response.body.antiCsrfToken).toEqual(loggedInUser.antiCsrfToken);
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