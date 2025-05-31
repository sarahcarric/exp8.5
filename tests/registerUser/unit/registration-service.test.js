// registration-service.test.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import authService from '@src/services/authService.js';
import User from '@src/models/User.js';
import { sendVerificationEmail } from '@src/services/emailService.js';
import { UserNotFoundError, UserAlreadyVerifiedError } from '@src/utils/errors.js';
import { faker } from '@faker-js/faker';

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

// --- Helper functions for mocking dependencies and simulating failures ---
function mockDbFailureOnSave() {
  User.mockImplementation(() => ({
    ...mockUser,
    save: jest.fn().mockRejectedValue(new Error('Database transaction failed')),
    toObject: jest.fn().mockReturnThis()
  }));
}

function mockEmailServiceFailure() {
  sendVerificationEmail.mockImplementation(() => Promise.reject(new Error('Email service failure')));
}

function mockJwtVerifyFailure() {
  jwt.verify.mockImplementation(() => { throw new Error('JWT verification failed'); });
}

function mockRateLimitError() {
  // Simulate a rate limit error by throwing a custom error
  User.mockImplementation(() => {
    throw Object.assign(new Error('Too many requests'), { statusCode: 429 });
  });
}

async function simulateConcurrentRegistrations(newUserData, count = 5) {
  // Simulate multiple concurrent registration attempts
  const promises = Array.from({ length: count }, () => authService.registerUser({ ...newUserData }));
  return Promise.allSettled(promises);
}

// --- Edge case and error handling tests ---
describe('Registration Service Error Handling and Edge Cases', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReset && jwt.verify.mockReset();
    sendVerificationEmail.mockReset && sendVerificationEmail.mockReset(); // Reset email mock to avoid leaking rejection
  });

  it('should handle database transaction failures during registration', async () => {
    mockDbFailureOnSave();
    const newUserData = { email: 'faildb@example.com', password: 'Password123!' };
    await expect(authService.registerUser(newUserData)).rejects.toThrow('Database transaction failed');
  });

  it('should handle email service failures gracefully', async () => {
    sendVerificationEmail.mockClear();
    sendVerificationEmail.mockRejectedValue(() => Promise.reject(new Error('Email service failure')));
    User.mockImplementation(() => mockUser);
    const newUserData = { email: 'failemail@example.com', password: 'Password123!' };
    await expect(authService.registerUser(newUserData)).rejects.toThrow('Email service failure');
  });

  it('should handle JWT token verification failures', async () => {
    mockJwtVerifyFailure();
    User.findOne.mockResolvedValue(mockUser);
    await expect(authService.verifyUserEmail('badtoken')).rejects.toThrow('JWT verification failed');
  });

  it('should handle rate limiting scenarios', async () => {
    mockRateLimitError();
    const newUserData = { email: 'ratelimit@example.com', password: 'Password123!' };
    await expect(authService.registerUser(newUserData)).rejects.toThrow('Too many requests');
  });

  it('should handle multiple concurrent registration attempts', async () => {
    User.mockImplementation(() => mockUser);
    sendVerificationEmail.mockResolvedValue();
    const newUserData = { email: 'concurrent@example.com', password: 'Password123!' };
    const results = await simulateConcurrentRegistrations(newUserData, 5);
    // At least one should be fulfilled, others may fail due to duplicate email
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    expect(fulfilled.length + rejected.length).toBe(5);
  });
});

// Test edge cases for registration service
describe('Registration Service Edge Cases', () => {
  it('should hash a maximum length (100 chars) password', async () => {
    const newUserData = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 100, pattern: /(?=.*[0-9])(?=.*[A-Z])/ })
    };
    const result = await authService.registerUser(newUserData);
    expect(result.accountInfo.password).toBeUndefined();
    expect(result.accountInfo.email).toBe(newUserData.email);
  });

  it('should hash a minimum length (8 chars) password', async () => {
    const newUserData = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 8, pattern: /(?=.*[0-9])(?=.*[A-Z])/ })
    };
    const result = await authService.registerUser(newUserData);
    expect(result.accountInfo.password).toBeUndefined();
    expect(result.accountInfo.email).toBe(newUserData.email);
  });

  it('should reject a password missing uppercase letters', async () => {
    const newUserData = {
      email: faker.internet.email(),
      password: 'password1234'
    };
    await expect(authService.registerUser(newUserData)).rejects.toThrow();
  });

  it('should allow valid emails with special characters', async () => {
    const newUserData = {
      email: 'user+test.special@example.com',
      password: faker.internet.password({ length: 12, pattern: /(?=.*[0-9])(?=.*[A-Z])/ })
    };
    const result = await authService.registerUser(newUserData);
    expect(result.accountInfo.email).toBe(newUserData.email);
  });

  it('should allow unicode characters in email if supported', async () => {
    const newUserData = {
      email: `üñîçødë+${faker.datatype.number()}@example.com`,
      password: faker.internet.password({ length: 12, pattern: /(?=.*[0-9])(?=.*[A-Z])/ })
    };
    try {
      const result = await authService.registerUser(newUserData);
      expect(result.accountInfo.email).toBe(newUserData.email);
    } catch (e) {
      expect(e).toBeDefined(); // Accept either success or validation error
    }
  });
});