/**
 * @fileoverview Authentication Routes
 * @module Routes/Auth
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Authentication and authorization routes
 */

import { Router } from 'express';
import {
  AuthController,
  loginValidation,
  passwordResetInitiateValidation,
  passwordResetCompleteValidation,
  passwordChangeValidation,
} from '../controllers/auth/AuthController';
import { JWTAuthenticationService } from '../services/auth/JWTAuthenticationService';

const router = Router();
const authService = new JWTAuthenticationService();
const authController = new AuthController(authService);

/**
 * @route POST /auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route POST /auth/logout
 * @desc Logout user and revoke tokens
 * @access Private
 */
router.post('/logout', authService.authenticate, authController.logout);

/**
 * @route POST /auth/password-reset/initiate
 * @desc Initiate password reset (send email with token)
 * @access Public
 */
router.post(
  '/password-reset/initiate',
  passwordResetInitiateValidation,
  authController.initiatePasswordReset
);

/**
 * @route POST /auth/password-reset/complete
 * @desc Complete password reset with token
 * @access Public
 */
router.post(
  '/password-reset/complete',
  passwordResetCompleteValidation,
  authController.completePasswordReset
);

/**
 * @route POST /auth/password-change
 * @desc Change password for authenticated user
 * @access Private
 */
router.post(
  '/password-change',
  authService.authenticate,
  passwordChangeValidation,
  authController.changePassword
);

/**
 * @route POST /auth/revoke-all
 * @desc Revoke all tokens for current user (logout all devices)
 * @access Private
 */
router.post('/revoke-all', authService.authenticate, authController.revokeAllTokens);

/**
 * @route GET /auth/me
 * @desc Get current authenticated user info
 * @access Private
 */
router.get('/me', authService.authenticate, authController.getCurrentUser);

export default router;
