/***************************************************************************************
 * @file: register-user.test.js
 * @desc: Test the /auth/register route and related email verification functionality
 **************************************************************************************/

import session from 'supertest-session';
import {app, server, mongoClient} from '@src/server.js';
import * as emailService from '@src/services/emailService';
import mongoose from 'mongoose';
import User from '../../../src/models/User';

// Test data with predictable values
const testUsers = {
  valid: {
    email: "test.user@example.com",
    password: "TestPass123!"
  },
  invalidEmail: {
    email: "not-an-email",
    password: "TestPass123!"
  },
  invalidPassword: {
    email: "test.user2@example.com",
    password: "short"
  },
  invalidBoth: {
    email: "not-an-email",
    password: "short"
  }
};

// Expected error messages
const errorMessages = {
  invalidEmail: "is not a valid email address",
  shortPassword: '"password" length must be at least 8 characters long',
  weakPassword: "must be at least 8 characters long and contain at least one number and one uppercase letter",
  duplicateEmail: "A user with that email already exists",
  userNotFound: (email) => `User with email ${email} not found`
};

const expectedUserResponse = {
  accountInfo: {
    email: testUsers.valid.email,
    oauthProvider: 'none',
    role: 'user'
  },
  identityInfo: {
    displayName: expect.any(String),
    profilePic: 'images/DefaultProfilePic.jpg'
  },
  speedgolfInfo: {
    personalBest: {
      strokes: null,
      seconds: null,
      course: ''
    },
    clubs: {
      '1W': false, '3W': false, '4W': false, '5W': false,
      'Hybrid': false,
      '1I': false, '2I': false, '3I': false, '4I': false,
      '5I': false, '6I': false, '7I': false, '8I': false,
      '9I': false, 'PW': false, 'GW': false, 'SW': false,
      'LW': false, 'Putter': false
    },
    bio: '',
    homeCourse: '',
    clubComments: '',
    firstRound: ''
  },
  _id: expect.any(String),
  rounds: []
};

describe('User Registration and Email Verification', () => {
  let testSession;
  let mockSendVerificationEmail;

  beforeAll(() => {
    testSession = session(app);
    mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail')
      .mockImplementation((email, verificationToken) => Promise.resolve());
    
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await User.deleteMany({}); // Clean up all test users at the very end
    await mongoose.connection.close();
    await mongoClient.close();
    await new Promise(resolve => server.close(resolve));
    testSession.destroy();
  });

  async function registerUserAndExpect(userData, expectedStatus, expectedErrorMessage = null) {
    const response = await testSession
      .post('/auth/register')
      .send(userData)
      .set('Accept', 'application/json');

    // Debug response
    console.log(`Registration response for ${userData.email}:`, {
      status: response.statusCode,
      body: response.body
    });

    expect(response.statusCode).toBe(expectedStatus);
    
    if (expectedStatus === 400 && expectedErrorMessage) {
      if (response.body.errors) {
        expect(response.body.errors).toContain(expectedErrorMessage);
      } else if (response.body.message) {
        expect(response.body.message).toContain(expectedErrorMessage);
      }
    }

    return response;
  }

  describe('Input Validation', () => {
    it('should not register a user with invalid email and invalid password', async () => {
      const response = await registerUserAndExpect(testUsers.invalidBoth, 400, errorMessages.invalidEmail);
      expect(response.body.errors).toContain(errorMessages.shortPassword);
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should not register a user with valid email and invalid password', async () => {
      const response = await registerUserAndExpect(testUsers.invalidPassword, 400, errorMessages.shortPassword);
      expect(response.body.errors).not.toContain(errorMessages.invalidEmail);
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should not register a user with invalid email and valid password', async () => {
      const response = await registerUserAndExpect(testUsers.invalidEmail, 400, errorMessages.invalidEmail);
      expect(response.body.errors).not.toContain(errorMessages.shortPassword);
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('Registration Success Path', () => {
    let registrationResponse;
    let verificationToken;

    it('should successfully register a user with valid credentials', async () => {
      registrationResponse = await registerUserAndExpect(testUsers.valid, 201);
      expect(registrationResponse.body).toMatchObject(expectedUserResponse);
      expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
      verificationToken = mockSendVerificationEmail.mock.calls[0][1];
      expect(verificationToken).toBeDefined();
    });

    it('should resend verification email to registered user', async () => {
      const response = await testSession
        .post('/auth/resend-verification-email')
        .send({ email: testUsers.valid.email })
        .set('Accept', 'application/json');

      console.log('Resend verification response:', {
        status: response.statusCode,
        body: response.body
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Verification email re-sent');
      expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
      verificationToken = mockSendVerificationEmail.mock.calls[0][1];
      expect(verificationToken).toBeDefined();
    });

    it('should verify email with valid token', async () => {
      const verificationUrl = `${process.env.API_DEPLOYMENT_URL}/auth/verify-email/${verificationToken}`;
      const response = await fetch(verificationUrl, { method: 'GET', redirect: 'manual' });
      
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        process.env.CLIENT_DEPLOYMENT_URL + '?emailverified=true'
      );
    });
  });

  describe('Error Cases', () => {

    it('should not verify email with invalid token', async () => {
      const verificationUrl = `${process.env.API_DEPLOYMENT_URL}/auth/verify-email/invalidToken`;
      const response = await fetch(verificationUrl, { method: 'GET', redirect: 'manual' });
      
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        process.env.CLIENT_DEPLOYMENT_URL + '?emailverified=false&reason=invalidtoken'
      );
    });

    it('should not resend verification email to unregistered email', async () => {
      const response = await testSession
        .post('/auth/resend-verification-email')
        .send({ email: testUsers.invalidEmail.email })
        .set('Accept', 'application/json');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', errorMessages.userNotFound(testUsers.invalidEmail.email));
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should not register a duplicate user', async () => {
      await registerUserAndExpect(testUsers.valid, 400, errorMessages.duplicateEmail);
    });
  });
});