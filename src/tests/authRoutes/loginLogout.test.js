//import request from 'supertest';
import session from 'supertest-session';
import request from 'supertest';
import {app, server} from '../../server.js'; // Ensure your server exports the Express app
import mongoose from 'mongoose';

let testSession = null;
let antiCsrfToken, user, accessToken, refreshToken; 
const theUser = { email: 'userj@gmail.com', password: 'ValidPassword1' };

describe('Auth Routes', () => {


    /*************************************************************************
     * @route POST /auth/login
     * @desc Test the login route. SHould happen before accessing 
     *      protected routes.
     * *********************************************************************/
    beforeAll(async () => {
      testSession = session(app);
    });

    afterAll(async() => {
      await mongoose.connection.close();
      server.close();
    });
    
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
      //Check server session, saved in res.locals.session for testing
      //const session = response.body.session;
      //expect(session).toBeDefined();
      //expect(session.antiCsrfToken).toBe(response.body.antiCsrfToken);
      // console.log('accessToken:', accessToken);
      // console.log('refreshToken:', refreshToken);
      // console.log('user._id:', user._id);
    });

  /*************************************************************************
   * @route DELETE /auth/logout/:userId
   * @desc Test the logout route.
   * *********************************************************************/
  it('should logout a user', async () => {
    const response = await testSession
      .delete(`/auth/logout/${user._id}`)
      .set('x-anti-csrf-token', antiCsrfToken)
      .set('Cookie', `accessToken=${accessToken}; refreshToken=${refreshToken}`);
    expect(response.statusCode).toBe(200);
  });

});
