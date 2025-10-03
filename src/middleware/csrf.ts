import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing operations
 */
export class CSRFMiddleware {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'x-csrf-token';
  private static readonly TOKEN_COOKIE = 'csrf-token';

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Middleware to generate and set CSRF token
   */
  static generateTokenMiddleware(req: CSRFRequest, res: Response, next: NextFunction): void {
    const token = this.generateToken();
    req.csrfToken = token;
    
    // Set token in cookie for client-side access
    res.cookie(this.TOKEN_COOKIE, token, {
      httpOnly: false, // Allow client-side access
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Add token to response headers for API clients
    res.setHeader('X-CSRF-Token', token);
    
    next();
  }

  /**
   * Middleware to validate CSRF token
   */
  static validateTokenMiddleware(req: CSRFRequest, res: Response, next: NextFunction): void {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const tokenFromHeader = req.headers[this.TOKEN_HEADER] as string;
    const tokenFromCookie = req.cookies[this.TOKEN_COOKIE];
    const tokenFromBody = req.body?._csrf;

    const providedToken = tokenFromHeader || tokenFromBody;
    const expectedToken = tokenFromCookie;

    if (!providedToken || !expectedToken) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required for this operation',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    if (providedToken !== expectedToken) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'Invalid CSRF token',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    next();
  }

  /**
   * Middleware to add CSRF token to response for forms
   */
  static addTokenToResponse(req: CSRFRequest, res: Response, next: NextFunction): void {
    if (req.csrfToken) {
      res.locals['csrfToken'] = req.csrfToken;
    }
    next();
  }
}

export default CSRFMiddleware;