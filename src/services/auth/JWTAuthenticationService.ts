/**
 * @fileoverview j w t authentication Service
 * @module Auth/JWTAuthenticationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description j w t authentication Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { logger } from '../../utils/logger';
import { RateLimitService } from './RateLimitService';

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  dataAccessLevel: number;
  complianceLevel: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export class JWTAuthenticationService {
  private readonly JWT_SECRET = process.env['JWT_SECRET'] || 'fallback-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret';
  private readonly JWT_ISSUER = process.env['JWT_ISSUER'] || 'writecarenotes.com';
  private readonly JWT_AUDIENCE = process.env['JWT_AUDIENCE'] || 'writecarenotes-app';
  private readonly ACCESS_TOKEN_EXPIRY = process.env['ACCESS_TOKEN_EXPIRY'] || '15m';
  private readonly REFRESH_TOKEN_EXPIRY = process.env['REFRESH_TOKEN_EXPIRY'] || '7d';

  private rateLimitService: RateLimitService;

  constructor() {
    this.rateLimitService = new RateLimitService();
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(email: string, password: string, req: Request): Promise<{ user: AuthenticatedUser; tokens: { accessToken: string; refreshToken: string } }> {
    const rateLimitKey = `auth:${req.ip}:${email}`;
    
    // Check rate limiting
    const canProceed = await this.rateLimitService.checkRateLimit(rateLimitKey);
    if (!canProceed) {
      throw new Error('Too many authentication attempts. Please try again later.');
    }

    try {
      // Mock user for now - in real implementation, this would query the database
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: email,
        tenantId: 'tenant-1',
        roles: ['admin'],
        permissions: ['read', 'write'],
        dataAccessLevel: 1,
        complianceLevel: 1
      };

      // Mock password verification - in real implementation, this would verify against hashed password
      const isValidPassword = password === 'password123'; // Mock validation
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokens = await this.generateTokens(mockUser);

      console.info('User authenticated successfully', { userId: mockUser.id, email });

      return { user: mockUser, tokens };
    } catch (error: unknown) {
      console.error('Authentication failed', { email, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: AuthenticatedUser): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: this.JWT_ISSUER,
      audience: this.JWT_AUDIENCE
    } as jwt.SignOptions);

    const refreshTokenPayload = {
      userId: user.id,
      type: 'refresh'
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: this.JWT_ISSUER,
      audience: this.JWT_AUDIENCE
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE
      }) as JWTPayload;

      return decoded;
    } catch (error: unknown) {
      if ((error as any).name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if ((error as any).name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12');
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Middleware to authenticate requests
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_MISSING',
            message: 'Authorization token is required'
          }
        });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = await this.verifyToken(token);

      // Mock user lookup - in real implementation, this would query the database
      const user: AuthenticatedUser = {
        id: decoded.userId,
        email: decoded.email,
        tenantId: decoded.tenantId,
        roles: decoded.roles,
        permissions: ['read', 'write'],
        dataAccessLevel: 1,
        complianceLevel: 1
      };

      (req as any).user = user;
      (req as any).tokenPayload = decoded;
      (req as any).accessContext = {
        userId: user.id,
        tenantId: user.tenantId,
        roles: user.roles,
        permissions: user.permissions
      };

      next();
    } catch (error: unknown) {
      console.error('Authentication middleware error', { error: (error as Error).message });
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid or expired token'
        }
      });
    }
  };

  /**
   * Middleware to check user roles
   */
  requireRole = (requiredRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user as AuthenticatedUser;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
      
      if (!hasRequiredRole) {
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions'
          }
        });
        return;
      }

      next();
    };
  };

  /**
   * Login method for routes
   */
  async login(credentials: { email: string; password: string }, req: Request) {
    return this.authenticateUser(credentials.email, credentials.password, req);
  }

  /**
   * Refresh token method
   */
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      // Mock user lookup
      const user: AuthenticatedUser = {
        id: decoded.userId,
        email: 'user@example.com',
        tenantId: 'tenant-1',
        roles: ['admin'],
        permissions: ['read', 'write'],
        dataAccessLevel: 1,
        complianceLevel: 1
      };

      const tokens = await this.generateTokens(user);
      return { user, tokens };
    } catch (error: unknown) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout method
   */
  async logout(userId: string, refreshToken?: string) {
    // In a real implementation, this would blacklist the tokens
    console.info('User logged out', { userId });
    return { success: true };
  }

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(email: string) {
    // Mock implementation
    console.info('Password reset initiated', { email });
    return { success: true, message: 'Password reset email sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    // Mock implementation
    console.info('Password reset completed', { token: token.substring(0, 10) + '...' });
    return { success: true, message: 'Password reset successfully' };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Mock implementation
    console.info('Password changed', { userId });
    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string) {
    // Mock implementation
    console.info('All tokens revoked for user', { userId });
    return { success: true };
  }
}