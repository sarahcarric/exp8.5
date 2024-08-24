//import request from 'supertest';
import session from 'supertest-session';
import {app, server} from '../../server.js'; // Ensure your server exports the Express app
import * as emailService from '../../services/emailService.js';
import mongoose from 'mongoose';


let testSession = null;
let pwResetCode, antiCsrfToken, user, accessToken, refreshToken; 
const theUser = { email: 'speedscore.live@gmail.com', password: 'Speedgolf1' };
const newPassword = 'Speedgolf2';

describe('Test reset password workflow', () => {

    beforeAll(async () => {
      testSession = session(app);
    });

    afterAll(async() => {
      await mongoose.connection.close();
      server.close();
    });

  it('should send user password reset email', async () => {
    const mockSendPasswordResetEmail = jest.spyOn(emailService,'sendPasswordResetEmail');
    const response = await testSession
        .post('/auth/reset-password/request')
        .send({ email: theUser.email });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Password reset email sent');
    expect(response.body).toHaveProperty('email', theUser.email);
    pwResetCode = mockSendPasswordResetEmail.mock.calls[0][1]; // Get the resetCode from the first call
    expect(pwResetCode).toBeDefined();
  });

  it('should verify the password reset code', async () => {
    const response = await testSession
      .post('/auth/reset-password/verify')
      .send({ email: theUser.email, resetCode: pwResetCode });
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

  it('should login', async () => {
    const response = await testSession
      .post('/auth/login')
      .send({ email: theUser.email, password: newPassword });
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

  it('should logout a user', async () => {
    const response = await testSession
      .delete(`/auth/logout/${user._id}`)
      .set('x-anti-csrf-token', antiCsrfToken)
      .set('Cookie', `accessToken=${accessToken}; refreshToken=${refreshToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'User logged out');
  });
});

