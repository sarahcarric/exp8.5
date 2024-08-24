import request from 'supertest';
import {app, server} from '../../server.js'; // Ensure your server exports the Express app
import * as emailService from '../../services/emailService';
import mongoose from 'mongoose';

const newUser = { email: 'userfuasdfaslcdasfvc@gmail.com', password: 'ValidPassword1' };

describe('Register User Route', () => {
  let mockSendVerificationEmail;

  beforeAll(() => {
      mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail');
  });
 
  afterEach(() => {
    jest.clearAllTimers(); // Clear all timers after each test
  });

  afterAll(async() => {
    jest.clearAllMocks(); // Clear all mocks after all tests
    await mongoose.connection.close();
    await new Promise(resolve => server.close(resolve));
  });

  /*************************************************************************
   * @test POST /auth/register
   * @desc Test route to register a new user. 
   *(***********************************************************************/
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(newUser)
      .set('Accept', 'application/json');
    expect(response.statusCode).toBe(201);
    //expect(mockSendVerificationEmail).toHaveBeenCalled();

    const expectedResponse = {
      accountInfo: {
        email: newUser.email,
        emailVerified: false,
        verificationDueBy: expect.any(String), // Ensure this is a valid date
        passResetToken: null,
        passResetVerfiedToken: null,
        mfaSecret: null,
        mfaVerified: false,
        mfaAttempts: 0,
        mfaStartTime: null, 
        oauthProvider: 'none',
        role: 'user'
      },
      identityInfo: {
        displayName: '',
        profilePic: 'images/DefaultProfilePic.jpg'
      },
      speedgolfInfo: {
        personalBest: {
          strokes: 100,
          seconds: 5400,
          course: ''
        },
        clubs: {
          '1W': false,
          '3W': false,
          '4W': false,
          '5W': false,
          'Hybrid': false,
          '1I': false,
          '2I': false,
          '3I': false,
          '4I': false,
          '5I': false,
          '6I': false,
          '7I': false,
          '8I': false,
          '9I': false,
          'PW': false,
          'GW': false,
          'SW': false,
          'LW': false,
          'Putter': false
        },
        bio: '',
        homeCourse: '',
        clubComments: '',
        firstRound: expect.any(String) // Ensure this is a valid date
      },
      _id: expect.any(String),
      rounds: []
    };
    expect(response.body).toMatchObject(expectedResponse);
  });

  it('should verify account by simulating click on email link', async () => {
    const vToken = mockSendVerificationEmail.mock.calls[0][1];
    expect(vToken).toBeDefined();
    const verificationUrl = `${process.env.API_DEPLOYMENT_URL}/auth/verify-email/${vToken}`;
    const response = await fetch(verificationUrl, { method: 'GET', redirect: 'manual' });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(process.env.CLIENT_DEPLOYMENT_URL + '/emailverified');
  });
})