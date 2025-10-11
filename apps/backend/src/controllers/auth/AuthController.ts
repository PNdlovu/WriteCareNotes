/**
 * @fileoverview Authentication Controller
 * @module Controllers/Auth/AuthController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Handles authentication endpoints (login, logout, refresh, password management)
 */

import { Request, Response } from 'express';
import { JWTAuthenticationService } from '../../services/auth/JWTAuthenticationService';
import { body, validationResult } from 'express-validator';

export class AuthController {
  privateauthService: JWTAuthenticationService;

  const ructor(authService?: JWTAuthenticationService) {
    this.authService = authService || new JWTAuthenticationService();
  }

  /**
   * POST /auth/login
   * Authenticate user with email and password
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
          },
        });
        return;
      }

      const { email, password } = req.body;

      const result = await this.authService.authenticateUser(email, password, req);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            tenantId: result.user.tenantId,
            organizationId: result.user.organizationId,
            roles: result.user.roles,
            permissions: result.user.permissions,
          },
          tokens: result.tokens,
        },
      });
    } catch (error: unknown) {
      const errorMessage = (error as Error).message;
      const statusCode = errorMessage.includes('Too many') ? 429 : 401;

      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : 'AUTH_FAILED',
          message: errorMessage,
        },
      });
    }
  };

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
          },
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            tenantId: result.user.tenantId,
            organizationId: result.user.organizationId,
            roles: result.user.roles,
          },
          tokens: result.tokens,
        },
      });
    } catch (error: unknown) {
      res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * POST /auth/logout
   * Logout user and revoke tokens
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { refreshToken } = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      await this.authService.logout(user.id, refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * POST /auth/password-reset/initiate
   * Initiate password reset process
   */
  initiatePasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
          },
        });
        return;
      }

      const { email } = req.body;

      const result = await this.authService.initiatePasswordReset(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * POST /auth/password-reset/complete
   * Complete password reset with token
   */
  completePasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
          },
        });
        return;
      }

      const { token, newPassword } = req.body;

      const result = await this.authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * POST /auth/password-change
   * Change password for authenticated user
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
          },
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      const result = await this.authService.changePassword(
        user.id,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * POST /auth/revoke-all
   * Revoke all tokens for current user (security measure)
   */
  revokeAllTokens = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      await this.authService.revokeAllUserTokens(user.id);

      res.status(200).json({
        success: true,
        message: 'All tokens revoked successfully',
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_REVOCATION_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * GET /auth/me
   * Get current authenticated user info
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          organizationId: user.organizationId,
          roles: user.roles,
          permissions: user.permissions,
          dataAccessLevel: user.dataAccessLevel,
          complianceLevel: user.complianceLevel,
        },
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'USER_FETCH_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };
}

// Validation middleware for routes
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const passwordResetInitiateValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
];

export const passwordResetCompleteValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
];

export const passwordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
];
