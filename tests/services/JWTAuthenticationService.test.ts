/**
 * @fileoverview Authentication Service Tests
 * @module Tests/Auth/JWTAuthenticationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive tests for JWT authentication service
 */

import { JWTAuthenticationService } from '../../src/services/auth/JWTAuthenticationService';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock the RateLimitService
jest.mock('../../src/services/auth/RateLimitService', () => {
  return {
    RateLimitService: jest.fn().mockImplementation(() => {
      return {
        checkRateLimit: jest.fn().mockResolvedValue(true),
        resetRateLimit: jest.fn().mockResolvedValue(undefined),
        getRemainingAttempts: jest.fn().mockResolvedValue(5),
      };
    }),
  };
});

describe('JWTAuthenticationService', () => {
  let service: JWTAuthenticationService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    service = new JWTAuthenticationService();
    
    mockRequest = {
      ip: '127.0.0.1',
      headers: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Reset environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    
    // Reset the rate limit mock to default (allow)
    const rateLimitService = (service as any).rateLimitService;
    rateLimitService.checkRateLimit = jest.fn().mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      const result = await service.authenticateUser(
        'test@example.com',
        'password123',
        mockRequest as Request
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        service.authenticateUser('test@example.com', 'wrongpassword', mockRequest as Request)
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error when rate limit exceeded', async () => {
      // Mock rate limit service to return false
      const rateLimitService = (service as any).rateLimitService;
      rateLimitService.checkRateLimit = jest.fn().mockResolvedValue(false);

      await expect(
        service.authenticateUser('test@example.com', 'password123', mockRequest as Request)
      ).rejects.toThrow('Too many authentication attempts');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', async () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };

      const token = jwt.sign(payload, 'test-secret-key', {
        issuer: 'writecarenotes.com',
        audience: 'writecarenotes-app',
      });

      const decoded = await service.verifyToken(token);

      expect(decoded.userId).toBe('123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw error for expired token', async () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };

      const token = jwt.sign(payload, 'test-secret-key', {
        expiresIn: '0s',
        issuer: 'writecarenotes.com',
        audience: 'writecarenotes-app',
      });

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      await expect(service.verifyToken(token)).rejects.toThrow('Token has expired');
    });

    it('should throw error for invalid token signature', async () => {
      const token = jwt.sign(
        { userId: '123' },
        'wrong-secret-key'
      );

      await expect(service.verifyToken(token)).rejects.toThrow('Invalid token');
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'mySecurePassword123!';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'mySecurePassword123!';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'mySecurePassword123!';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'mySecurePassword123!';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword('wrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('authenticate middleware', () => {
    it('should authenticate request with valid token', async () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };

      const token = jwt.sign(payload, 'test-secret-key', {
        issuer: 'writecarenotes.com',
        audience: 'writecarenotes-app',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      await service.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user.id).toBe('123');
    });

    it('should reject request without token', async () => {
      mockRequest.headers = {};

      await service.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authorization token is required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      await service.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should allow access with required role', () => {
      (mockRequest as any).user = {
        id: '123',
        email: 'test@example.com',
        roles: ['admin', 'manager'],
      };

      const middleware = service.requireRole(['admin']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access without required role', () => {
      (mockRequest as any).user = {
        id: '123',
        email: 'test@example.com',
        roles: ['user'],
      };

      const middleware = service.requireRole(['admin']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      const middleware = service.requireRole(['admin']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const result = await service.login(
        { email: 'test@example.com', password: 'password123' },
        mockRequest as Request
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenPayload = {
        userId: '123',
        type: 'refresh',
      };

      const refreshToken = jwt.sign(
        refreshTokenPayload,
        'test-refresh-secret',
        { issuer: 'writecarenotes.com', audience: 'writecarenotes-app' }
      );

      const result = await service.refreshToken(refreshToken);

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const result = await service.logout('123', 'refresh-token');

      expect(result.success).toBe(true);
    });
  });

  describe('initiatePasswordReset', () => {
    it('should initiate password reset', async () => {
      const result = await service.initiatePasswordReset('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const result = await service.resetPassword('reset-token', 'newPassword123!');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const result = await service.changePassword(
        '123',
        'oldPassword',
        'newPassword123!'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for user', async () => {
      const result = await service.revokeAllUserTokens('123');

      expect(result.success).toBe(true);
    });
  });
});
