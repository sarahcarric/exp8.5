// registration-service.test.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import authService from '@src/services/authService.js';
import User from '@src/models/User.js';
import { sendVerificationEmail } from '@src/services/emailService.js';
import { UserNotFoundError, UserAlreadyVerifiedError } from '@src/utils/errors.js';

// Mock dependencies
jest.mock('@src/models/User.js');
jest.mock('@src/services/emailService.js');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
let mockUser;

// Test the user registration service functions
describe('Registration Service', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      _id: 'mockUserId',
      accountInfo: {
        email: 'test@example.com',
        password: 'hashedPassword123',
        emailVerified: false,
        verificationDueBy: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      save: jest.fn(),
      toObject: jest.fn().mockReturnThis()  
    };
    User.mockImplementation(() => mockUser);

    // Mock bcrypt methods
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedPassword123');
  });

  //Test the registerUser() service function
  describe('registerUser', () => {
    const newUserData = {
      email: 'new@example.com',
      password: 'Password123!'
    };

    const newUserDataCopy = { ...newUserData };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const verificationToken = 'mockToken';
      
      // Mock bcrypt and jwt methods
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue(hashedPassword);
      jwt.sign.mockReturnValue(verificationToken);
      User.prototype.save.mockResolvedValue(mockUser);
      const result = await authService.registerUser(newUserData);

      //Verify bcrypt and jwt calls
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(newUserDataCopy.password, 'salt');
      expect(jwt.sign).toHaveBeenCalledWith(
        { email: newUserData.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      expect(sendVerificationEmail).toHaveBeenCalledWith(newUserDataCopy.email, verificationToken);
      expect(result).toBeDefined();
      expect(result.accountInfo.password).toBeUndefined();
    });

    it('should not expose sensitive fields in response', async () => {
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save.mockResolvedValue(mockUser);

      const result = await authService.registerUser(newUserData);

      expect(result.accountInfo.password).toBeUndefined();
      expect(result.accountInfo.emailVerified).toBeUndefined();
      expect(result.accountInfo.verificationDueBy).toBeUndefined();
    });

    it('should handle database errors during registration', async () => {
      const error = new Error('Database error');
      User.mockImplementation(() => {
        return {
          ...mockUser,
          save: jest.fn().mockRejectedValue(error)
        };
      });

      await expect(authService.registerUser(newUserData))
        .rejects
        .toThrow('Database error');
    });
  });
});

//Test the verifyUserEmail() service function
describe('verifyUserEmail', () => {
    const validToken = 'valid-token';
    const userEmail = 'test@example.com';

    it('should successfully verify user email', async () => {
      jwt.verify.mockReturnValue({ email: userEmail });
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.verifyUserEmail(validToken);

      expect(jwt.verify).toHaveBeenCalledWith(validToken, process.env.JWT_SECRET);
      expect(User.findOne).toHaveBeenCalledWith({ "accountInfo.email": userEmail });
      expect(mockUser.accountInfo.emailVerified).toBe(true);
      expect(mockUser.accountInfo.verificationDueBy).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle expired verification tokens', async () => {
      const expiredAt = new Date();
      const tokenError = new jwt.TokenExpiredError('Token expired', expiredAt);
      
      jwt.verify.mockImplementation(() => {
        throw tokenError;
      });
    
      await expect(authService.verifyUserEmail(validToken))
        .rejects
        .toThrow(jwt.TokenExpiredError);
    });

    it('should handle user not found during verification', async () => {
      jwt.verify.mockReturnValue({ email: userEmail });
      User.findOne.mockResolvedValue(null);

      await expect(authService.verifyUserEmail(validToken))
        .rejects
        .toThrow(UserNotFoundError);
    });
  });

  //Test the resendVerificationEmail() service function
  describe('resendVerificationEmail', () => {
    const userEmail = 'test@example.com';

    it('should successfully resend verification email', async () => {
      const verificationToken = 'new-token';
      mockUser.accountInfo.emailVerified = false;
     
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue(verificationToken);

      try {
        const result = await authService.resendVerificationEmail(mockUser.accountInfo.email);
        expect(jwt.sign).toHaveBeenCalledWith(
          { email: mockUser.accountInfo.email },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
        expect(sendVerificationEmail).toHaveBeenCalledWith(mockUser.accountInfo.email, verificationToken);
        expect(mockUser.save).toHaveBeenCalled();
      } catch (error) {
        throw error;
      }
    });

    it('should handle non-existent user', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.resendVerificationEmail(userEmail))
        .rejects
        .toThrow(UserNotFoundError); 
    });

    it('should handle already verified email', async () => {
      mockUser.accountInfo.emailVerified = true;
      User.findOne.mockResolvedValue(mockUser);
      await expect(authService.resendVerificationEmail(userEmail))
        .rejects
        .toThrow(UserAlreadyVerifiedError); // Add specific error message check
    });

    it('should handle database errors during save', async () => {
      mockUser.accountInfo.emailVerified = false; //Depends on emailVerified being false.
      User.findOne.mockResolvedValue({
        ...mockUser,
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      });
      jwt.sign.mockReturnValue('new-token');

      await expect(authService.resendVerificationEmail(userEmail))
        .rejects
        .toThrow('Database error');
    });

    it('should update verification due date to 24 hours from now', async () => {
      const nowTime = new Date('2025-01-29T10:00:00Z').getTime();
      jest.spyOn(Date, 'now').mockImplementation(() => nowTime);
      
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('new-token');

      await authService.resendVerificationEmail(userEmail);

      const expectedDueBy = new Date(nowTime + 24 * 60 * 60 * 1000);
      expect(mockUser.accountInfo.verificationDueBy).toEqual(expectedDueBy);
    });
});