import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { Container } from 'typedi';
import { JWTAuthenticationService } from '../../services/auth/JWTAuthenticationService';
// FamilyOnboardingService removed - was importing from mobile directory
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../middleware/ErrorHandler';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';

const router = Router();
const authService = new JWTAuthenticationService();
const validationService = new ValidationService();

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 authentication attempts per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  deviceInfo: Joi.object({
    deviceId: Joi.string().required(),
    platform: Joi.string().valid('ios', 'android', 'web').required(),
    appVersion: Joi.string().required(),
    deviceType: Joi.string().valid('personal', 'organization').required(),
  }).optional(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const passwordResetSchema = Joi.object({
  email: Joi.string().email().required(),
});

const passwordResetConfirmSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase let ter, one lowercase let ter, one number, and one special character'
    }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase let ter, one lowercase let ter, one number, and one special character'
    }),
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post(
  '/login',
  authRateLimit,
  ErrorHandler.validateRequest(loginSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, req);
    
    res.status(200).json({
      success: true,
      data: {
        tokens: result.tokens,
        user: result.user,
      },
      message: 'Login successful',
    });
  })
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post(
  '/refresh',
  generalRateLimit,
  ErrorHandler.validateRequest(refreshTokenSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(req.body['refreshToken']);
    
    res.status(200).json({
      success: true,
      data: {
        tokens: result.tokens,
      },
      message: 'Token refreshed successfully',
    });
  })
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and revoke tokens
 * @access Private
 */
router.post(
  '/logout',
  authService.verifyToken,
  ErrorHandler.asyncHandler(async (req, res) => {
    await authService.logout(req.user.id, req.body['refreshToken']);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Initiate password reset process
 * @access Public
 */
router.post(
  '/forgot-password',
  authRateLimit,
  ErrorHandler.validateRequest(passwordResetSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    const result = await authService.initiatePasswordReset(req.body['email']);
    
    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  })
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using reset token
 * @access Public
 */
router.post(
  '/reset-password',
  authRateLimit,
  ErrorHandler.validateRequest(passwordResetConfirmSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(
      req.body['resetToken'],
      req.body['newPassword']
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Password reset failed',
        message: result.message,
      });
    }
  })
);

/**
 * @route POST /api/auth/change-password
 * @desc Change password for authenticated user
 * @access Private
 */
router.post(
  '/change-password',
  authRateLimit,
  authService.verifyToken,
  ErrorHandler.validateRequest(changePasswordSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    const result = await authService.changePassword(
      req.user.id,
      req.body['currentPassword'],
      req.body['newPassword']
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Password change failed',
        message: result.message,
      });
    }
  })
);

/**
 * @route GET /api/auth/verify
 * @desc Verify current token and get user info
 * @access Private
 */
router.get(
  '/verify',
  authService.verifyToken,
  ErrorHandler.asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          userNumber: req.user.userNumber,
          userType: req.user.userType,
          name: req.user.getFullName(),
          email: req.user.personalDetails.email,
          permissions: req.user.getAccessibleFeatures(),
          lastLoginAt: req.user.lastLoginAt,
        },
        tokenValid: true,
      },
    });
  })
);

/**
 * @route POST /api/auth/revoke-all-tokens
 * @desc Revoke all tokens for current user (security action)
 * @access Private
 */
router.post(
  '/revoke-all-tokens',
  authService.verifyToken,
  ErrorHandler.asyncHandler(async (req, res) => {
    await authService.revokeAllUserTokens(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'All tokens revoked successfully',
    });
  })
);

export default router;
