/**
 * @fileoverview Authentication Controller Tests
 * @module Tests/Controllers/AuthController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Tests for authentication controller endpoints
 */

import { AuthController } from '../../src/controllers/auth/AuthController';
import { JWTAuthenticationService } from '../../src/services/auth/JWTAuthenticationService';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<JWTAuthenticationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockAuthService = {
      authenticateUser: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      initiatePasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      revokeAllUserTokens: jest.fn(),
    } as any;

    controller = new AuthController(mockAuthService);

    mockRequest = {
      body: {},
      ip: '127.0.0.1',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        roles: ['admin'],
        permissions: ['read', 'write'],
        dataAccessLevel: 1,
        complianceLevel: 1,
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.authenticateUser.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock validationResult to return no errors
      const validationResult = require('express-validator').validationResult;
      validationResult.mockReturnValue({ isEmpty: () => true });

      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        mockRequest
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            tenantId: 'tenant-1',
            organizationId: 'org-1',
            roles: ['admin'],
            permissions: ['read', 'write'],
          },
          tokens: mockTokens,
        },
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.authenticateUser.mockRejectedValue(
        new Error('Invalid credentials')
      );

      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const validationResult = require('express-validator').validationResult;
      validationResult.mockReturnValue({ isEmpty: () => true });

      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid credentials',
        },
      });
    });

    it('should return 429 for rate limit exceeded', async () => {
      mockAuthService.authenticateUser.mockRejectedValue(
        new Error('Too many authentication attempts. Please try again later.')
      );

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const validationResult = require('express-validator').validationResult;
      validationResult.mockReturnValue({ isEmpty: () => true });

      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts. Please try again later.',
        },
      });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        roles: ['admin'],
        permissions: ['read', 'write'],
        dataAccessLevel: 1,
        complianceLevel: 1,
      };

      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      mockRequest.body = {
        refreshToken: 'old-refresh-token',
      };

      await controller.refresh(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            tenantId: 'tenant-1',
            organizationId: 'org-1',
            roles: ['admin'],
          },
          tokens: mockTokens,
        },
      });
    });

    it('should return 400 when refresh token missing', async () => {
      mockRequest.body = {};

      await controller.refresh(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      (mockRequest as any).user = {
        id: '123',
        email: 'test@example.com',
      };

      mockRequest.body = {
        refreshToken: 'refresh-token',
      };

      mockAuthService.logout.mockResolvedValue({ success: true });

      await controller.logout(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.logout).toHaveBeenCalledWith('123', 'refresh-token');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should return 401 when user not authenticated', async () => {
      await controller.logout(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user info', async () => {
      (mockRequest as any).user = {
        id: '123',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        roles: ['admin'],
        permissions: ['read', 'write'],
        dataAccessLevel: 1,
        complianceLevel: 1,
      };

      await controller.getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: '123',
          email: 'test@example.com',
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          roles: ['admin'],
          permissions: ['read', 'write'],
          dataAccessLevel: 1,
          complianceLevel: 1,
        },
      });
    });

    it('should return 401 when user not authenticated', async () => {
      await controller.getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });
});

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn().mockReturnValue({
    isEmail: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
  }),
  validationResult: jest.fn(),
}));
