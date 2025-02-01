// registration-controller.test.js
import * as authController from '@src/controllers/authController.js';
import authService from '@src/services/authService.js';
import { UserNotFoundError } from '@src/utils/errors.js';

// Mock the authService module
jest.mock('@src/services/authService.js');

//Test the controller functions for registering a new user, 
// verifying a user's email, and resending a verification email
describe('Registration Controller', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      params: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn()
    };

    nextFunction = jest.fn();
  });

  //Test registerUser() controller function
  describe('registerUser', () => {
    const newUserData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should successfully register a new user', async () => {
      mockRequest.body = newUserData;
      const mockUser = { 
        _id: 'userId123',
        accountInfo: { email: newUserData.email }
      };
      authService.registerUser.mockResolvedValue(mockUser);

      await authController.registerUser(mockRequest, mockResponse, nextFunction);

      expect(authService.registerUser).toHaveBeenCalledWith(newUserData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should pass error to next middleware if registration fails', async () => {
      mockRequest.body = newUserData;
      const error = new Error('Registration failed');
      authService.registerUser.mockRejectedValue(error);

      await authController.registerUser(mockRequest, mockResponse, nextFunction);

      expect(authService.registerUser).toHaveBeenCalledWith(newUserData);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  //Test verifyUserEmail() controller function
  describe('verifyUserEmail', () => {
    const token = 'valid-verification-token';

    it('should redirect with success when verification succeeds', async () => {
      mockRequest.params.token = token;
      authService.verifyUserEmail.mockResolvedValue(true);

      await authController.verifyUserEmail(mockRequest, mockResponse, nextFunction);

      expect(authService.verifyUserEmail).toHaveBeenCalledWith(token);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('emailverified=true')
      );
    });

    it('should redirect with error for invalid token', async () => {
      mockRequest.params.token = token;
      const error = new Error('Verification failed');
      error.name = 'JsonWebTokenError';
      authService.verifyUserEmail.mockRejectedValue(error);

      await authController.verifyUserEmail(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('emailverified=false')
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('reason=invalidtoken')
      );
    });
  });

  //Test resendVerificationEmail() controller function
  describe('resendVerificationEmail', () => {
    const email = 'test@example.com';

    it('should successfully resend verification email', async () => {
      mockRequest.body.email = email;
      authService.resendVerificationEmail.mockResolvedValue();

      await authController.resendVerificationEmail(mockRequest, mockResponse, nextFunction);

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(email);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Verification email re-sent',
        email: email
      });
    });

    it('should handle user not found error', async () => {
      mockRequest.body.email = email;
      const error = new UserNotFoundError('User not found');
      authService.resendVerificationEmail.mockRejectedValue(error);

      await authController.resendVerificationEmail(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });
});