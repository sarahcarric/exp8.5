/*************************************************************************
 * @file: testUtils.js
 * @desc: Contains utility functions to support API route testing.
 * **********************************************************************/

/*************************************************************************
 * retryRequest
 * @descr Retry a request with a delay if the response status code is 429
 * (rate limited).
 * @param {Function} fn - The function to retry.
 * @param {number} retries - The number of retries.
 * @param {number} delay - The delay in milliseconds between retries.
 * @returns {Promise} - The response from the function.
 * ***********************************************************************/
export async function retryRequest(fn, retries = 6, delay = 15000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fn();
      if (response.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return response;
      }
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

/*************************************************************************
 * generateRandomEmail
 * @descr Generate a random email address.
 * @returns {string} A random email address.
 * ***********************************************************************/
export function generateRandomEmail() {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  let email = '';
  for (let i = 0; i < 10; i++) {
    email += chars[Math.floor(Math.random() * chars.length)];
  }
  email += '@';
  for (let i = 0; i < 5; i++) {
    email += chars[Math.floor(Math.random() * chars.length)];
  }
  email += '.com';
  return email;
}

/*************************************************************************
 * generateValidPassword
 * @descr Generate a random valid password. A valid password is at least
 * 8 characters long and contains at least one uppercase letter, one
 * lowercase letter, one number, and one number
 * @returns {string} A random valid password of 8 chars with one of each
 * required character type.
 *************************************************************************/
export function generateValidPassword() {
  const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const allChars = upperCaseChars + lowerCaseChars + numberChars;

  let password = '';
  password += upperCaseChars[Math.floor(Math.random() * upperCaseChars.length)];
  password += lowerCaseChars[Math.floor(Math.random() * lowerCaseChars.length)];
  password += numberChars[Math.floor(Math.random() * numberChars.length)];
  password += numberChars[Math.floor(Math.random() * numberChars.length)];

  for (let i = 4; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/*************************************************************************
 * generateCustomPassword
 * @descr Generate a custom password with the specified length and number
 * of uppercase letters, numbers, and special characters.
 * @param {number} len - The length of the password.
 * @param {number} numUpper - The number of uppercase letters.
 * @param {number} numNumber - The number of numbers.
 * @param {number} numSpecial - The number of special characters.
 * @returns {string} A custom password.
 *************************************************************************/
export function generateCustomPassword(len = 5, numUpper = 0, numNumber = 0, numSpecial = 0) {
  const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';
  const allChars = upperCaseChars + lowerCaseChars + numberChars + specialChars;

  let password = '';

  for (let i = 0; i < numUpper; i++) {
    password += upperCaseChars[Math.floor(Math.random() * upperCaseChars.length)];
  }
  for (let i = 0; i < numNumber; i++) {
    password += numberChars[Math.floor(Math.random() * numberChars.length)];
  }
  for (let i = 0; i < numSpecial; i++) {
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
  }
  const remainingLength = len - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/*************************************************************************
 * registerUser
 * @descr Use the /auth/register route to register a new user with an 
 *        email and password. It is assumed that the test that calls
 *        this function implements a mock function to send the 
 *        verification email, so that no email is actually sent. We
 *        wrap the call to the /auth/register route in a retryRequest
 *       function to test rate limiting.
 * @param {Object} testSession - The supertest session object.
 * @param {Object} newUser - The new user object consisting of email and
 *                 password props.
 * @param validUser - A flag indicating whether the user is valid. If
 *                   false, we will expect the registration to fail
 * @returns {Object} - The user object if status = 201, or the response
 * object if status is another value.
 * ***********************************************************************/
export async function registerUser(testSession, newUser, validUser = true) {
  // Register the new user
  const registerResponse = await retryRequest(() => 
    testSession
      .post('/auth/register')
      .send(newUser)
      .set('Accept', 'application/json')
  );
  if (validUser) {
    expect(registerResponse.statusCode).toBe(201);
  } else {
    expect(registerResponse.statusCode).toBe(400);
    expect(registerResponse.body).toEqual({
      errors: [
        "is not a valid email address",
        "must be at least 8 characters long and contain at least one number and one uppercase letter"
      ]
    });
    return registerResponse;
  }
  // Check response body
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
  expect(registerResponse.body).toMatchObject(expectedResponse);
}

/*************************************************************************
 * requestResendVerificationEmail
 * @descr Request that the verification email be resent. Calls the
 *         /auth/resend-verification-email route. 
 * @param {Object} testSession - The supertest session object.
 * @param {Object} email - The email address where the 
 *        verification email should be re-sent.
 * @returns Nothing
 * ***********************************************************************/
export async function requestResendVerificationEmail(testSession, email, validEmail = true) {
  // Request that the verification email be resent
  const resendResponse = await retryRequest(() =>
    testSession
      .post('/auth/resend-verification-email')
      .send({ email })
      .set('Accept', 'application/json')
  );
  if (validEmail) {
    expect(resendResponse.statusCode).toBe(200);
  } else {
    expect(resendResponse.statusCode).toBe(404); //Not found
    expect(resendResponse.body).toHaveProperty('error', 'User with email ' + email + ' not found');
  }
}

/*************************************************************************
 * verifyAccountEmail
 * @descr Verify a new user account by simulating a click on the email link.
 * @param {Function} mockSendVerificationEmail - The function that mocked 
 *        the sending of the verification email. We extract from this
 *        mock function the token that was sent in its most recent 
 *        invocation, so that we can call the /auth/verify-email route
 *        with the correct token to verify the email address. 
 * @param {boolean} validToken - A flag indicating whether the token is
 *        valid. If false, we will call the /auth/verify-email route with
 *        an invalid token to test the error handling.
 * @returns Nothing
 * ***********************************************************************/
export async function verifyAccountEmail(mockSendVerificationEmail, validToken = true) {
  // Verify the account by simulating click on email link
  const vToken = mockSendVerificationEmail.mock.calls[mockSendVerificationEmail.mock.calls.length - 1][1];
  expect(vToken).toBeDefined();
  let verificationUrl;
  if (validToken) {
    verificationUrl = `${process.env.API_DEPLOYMENT_URL}/auth/verify-email/${vToken}`;
  } else {
    verificationUrl = `${process.env.API_DEPLOYMENT_URL}/auth/verify-email/invalidToken`;
  }
  const verifyResponse = await fetch(verificationUrl, { method: 'GET', redirect: 'manual' });
  expect(verifyResponse.status).toBe(302);
  if (validToken) {
    expect(verifyResponse.headers.get('location')).toBe(
      process.env.CLIENT_DEPLOYMENT_URL + '/emailverified');
  } else {
    expect(verifyResponse.headers.get('location')).toBe(
      process.env.CLIENT_DEPLOYMENT_URL + '/emailvalidationerror?reason=invalidtoken');
  }
}

/*************************************************************************
 * loginUser
 * @descr Test a user logging in, using Jest expect statements to check
 * the response status code and body.
 * @param {Object} testSession - The supertest session object.
 * @param {string} theUser - objecte consisting of user and password props.
 * @returns {Object} - An object containing the user object, access token,
 * refresh token, and anti-CSRF token.
 * ***********************************************************************/
export async function loginUser(testSession, theUser) {
  const response = await retryRequest(() =>
    testSession
      .post('/auth/login')
      .send(theUser)
      .set('Accept', 'application/json')
  );
  expect(response.statusCode).toBe(200);
  const cookies = response.headers['set-cookie'];
  expect(cookies).toBeDefined();
  const accessTokenCookie = cookies.find(cookie => cookie.includes('accessToken'));
  const refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken'));
  expect(accessTokenCookie).toBeDefined();
  expect(refreshTokenCookie).toBeDefined();
  expect(accessTokenCookie).toContain('HttpOnly');
  expect(refreshTokenCookie).toContain('HttpOnly');
  const accessToken = accessTokenCookie.split(';')[0].split('=')[1];
  const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
  // Check response body
  expect(response.body).toHaveProperty('accessTokenExpiry');
  expect(response.body).toHaveProperty('refreshTokenExpiry');
  expect(response.body).toHaveProperty('antiCsrfToken');
  expect(response.body).toHaveProperty('user');
  const antiCsrfToken = response.body.antiCsrfToken;
  const user = response.body.user;
  return { user, accessToken, refreshToken, antiCsrfToken };
}