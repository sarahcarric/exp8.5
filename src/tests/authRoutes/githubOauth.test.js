//process.env.DEBUG = 'nock.*'; // Enable nock debugging
import session from 'supertest-session';
import { app, server } from '../../server.js'; 
import mongoose from 'mongoose';
import User from '../../models/User';
import nock from 'nock';

let testSession;

describe('GitHub Authentication Routes', () => {
  beforeAll(async () => {
    testSession = session(app); // Create a new session
  });

  afterEach(async () => {
    nock.cleanAll(); // Clean all nock interceptors after each test
  });

  afterAll(async () => {
    await User.deleteMany({}); // Clear the users collection after all tests
    await mongoose.connection.close(); // Close MongoDB connection
    await new Promise(resolve => server.close(resolve)); // Close the server
  });

  test('GET /auth/github/callback should handle GitHub callback', async () => {
    // Step 1: Mock GitHub OAuth server
    nock('https://github.com')
      .post('/login/oauth/access_token')
      .reply(200, {
        access_token: 'mocked_access_token',
        token_type: 'bearer',
      });

    nock('https://api.github.com')
      .get('/user')
      .reply(200, {
        id: '123',
        login: 'testuser',
        emails: [{ value: 'testuser@example.com' }],
        displayName: 'Test User',
        photos: [{ value: 'http://example.com/profile.jpg' }]
      });

    // Step 2: Initiate the OAuth flow
    const authRes = await testSession.get('/auth/github');
    const cookies = authRes.headers['set-cookie'];

   // Manually parse the cookies. Can we do this better?
   const parsedCookies = cookies.reduce((acc, cookie) => {
    const [name, ...rest] = cookie.split('=');
    acc[name.trim()] = rest.join('=').split(';')[0].trim();
    return acc;
    }, {});
    
    const oauthToken = parsedCookies.oauthToken; // Extract the OAuth token

    // Step 3: Simulate the callback from GitHub with both code and state query params,
    // and the OAuth token from the cookies
      const response = await testSession
        .get(`/auth/github/callback?code=mocked_code&state=${oauthToken}`)
        .set('Cookie', cookies.map(cookie => cookie.split(';')[0]).join('; ')); // Only send the actual cookie values
        
      expect(response.status).toBe(200); // Expect a successful response
      expect(response.body).toHaveProperty('user');
      //Add additional expect statements as needed.
      //Can also query the database to verify the user was created.
  });
});