import session from 'supertest-session';
import {app, server} from '../../server.js';
import mongoose from 'mongoose';
import { authenticator } from 'otplib';

let testSession = null;
let secret, mfaCode, antiCsrfToken, user, accessToken, refreshToken; 
const theUser = { email: 'speedscore.live@gmail.com', password: 'Speedgolf1' };

describe('Test enable MFA workflow', () => {


    beforeAll(async () => {
      testSession = session(app);
    });

    afterAll(async() => {
      await mongoose.connection.close();
      server.close();
    });
    
    /*************************************************************************
     * @route POST /auth/login
     * @desc Test the login route. SHould happen before accessing 
     *      protected routes.
     * *********************************************************************/
    it('should login', async () => {
      const response = await testSession
        .post('/auth/login')
        .send({ email: theUser.email, password: theUser.password });
      expect(response.statusCode).toBe(200);
      //Check cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const accessTokenCookie = cookies.find(cookie => cookie.includes('accessToken'));
      const refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken'));
      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('HttpOnly');
      accessToken = accessTokenCookie.split(';')[0].split('=')[1];
      refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
      //Check response body
      expect(response.body).toHaveProperty('accessTokenExpiry');
      expect(response.body).toHaveProperty('refreshTokenExpiry');
      expect(response.body).toHaveProperty('antiCsrfToken');
      expect(response.body).toHaveProperty('user');
      antiCsrfToken = response.body.antiCsrfToken;
      user = response.body.user;
    });

  it('should start the process of enabling MFA', async () => {
    console.log('Enable MFA; User ID: ', user._id);
    const response = await testSession
      .post(`/auth/mfa/enable/${user._id}`)
      .set('x-anti-csrf-token', antiCsrfToken)
      .set('Cookie', `accessToken=${accessToken}; refreshToken=${refreshToken}`);
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
        .post(`/auth/mfa/start-verify/${user._id}`)
        .set('x-anti-csrf-token', antiCsrfToken)
        .set('Cookie', `accessToken=${accessToken}; refreshToken=${refreshToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'MFA verification started');
    });

    it('should verify the MFA code', async () => {
      const response = await testSession
        .post(`/auth/mfa/verify/${user._id}`)
        .set('x-anti-csrf-token', antiCsrfToken)
        .set('Cookie', `accessToken=${accessToken}; refreshToken=${refreshToken}`)
        .send({ code: mfaCode });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'MFA code verified');
    });

    it('should confirm that MFA is enabled for the user', async () => {
      const response = await testSession
        .get(`/users/${user._id}`)
        .set('x-anti-csrf-token', antiCsrfToken)
        .set('Cookie', `accessToken=${accessToken}; refreshToken=${refreshToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accountInfo.mfaVerified', true);
    });

  it('should logout a user', async () => {
    const response = await testSession
      .delete(`/auth/logout/${user._id}`)
      .set('x-anti-csrf-token', antiCsrfToken)
      .set('Cookie', `accessToken=${accessToken}; refreshToken=${refreshToken}`);
    expect(response.statusCode).toBe(200);
  });
});

