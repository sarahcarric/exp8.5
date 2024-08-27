import session from 'supertest-session';
import {app, server} from '../../server.js';
import * as emailService from '../../services/emailService';
import { generateRandomEmail, generateValidPassword, registerAndVerifyUser, loginUser } from '../../utils/testUtils.js';
import mongoose from 'mongoose';
import { authenticator } from 'otplib';

let testSession = null;
let secret, mfaCode, loggedInUser;
const theUser = { email: generateRandomEmail(), password: generateValidPassword() };
let mockSendVerificationEmail;

describe('Test enable MFA workflow', () => {

    beforeAll(async () => {
      testSession = session(app);
      mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail');
    });

    afterAll(async() => {
      await mongoose.connection.close();
      await new Promise(resolve => server.close(resolve));
    });
    
    it('should register a new user', async () => {
      await registerAndVerifyUser(testSession, theUser, mockSendVerificationEmail);
    });
      
    it('should login', async () => {
      loggedInUser = await loginUser(testSession, theUser);
      console.log('TestSession 1: ', JSON.stringify(testSession));
    });

  it('should start the process of enabling MFA', async () => {
    console.log('Enable MFA; User ID: ', loggedInUser.user._id);
    const response = await testSession
      .post(`/auth/mfa/enable/${loggedInUser.user._id}`)
      .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
      .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('qrCodeDataUrl');
    expect(response.body).toHaveProperty('secret');
    // Extract the secret from the response
    secret = response.body.secret;
    // Generate a TOTP using the secret
    mfaCode = authenticator.generate(secret);
  });

  it('should start an MFA verification session', async () => {
    const response = await testSession
      .post(`/auth/mfa/start-verify/${loggedInUser.user._id}`)
      .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
      .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'MFA verification started');
  });

  it('should verify the MFA code', async () => {
    const response = await testSession
      .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
      .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
      .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
      .send({ code: mfaCode });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'MFA code verified');
    });

  it('should confirm that MFA is enabled for the user', async () => {
    const response = await testSession
      .get(`/users/${loggedInUser.user._id}`)
      .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
      .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accountInfo.mfaVerified', true);
  });

  it('should delete the user', async () => {
    const response = await testSession
      .delete(`/users/${loggedInUser.user._id}`)
      .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
      .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`);
    expect(response.statusCode).toBe(200);
  });

});

