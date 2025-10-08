/**
 * @fileoverview rate limiting
 * @module RateLimiting
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description rate limiting
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';

export class RateLimitingMiddleware {
  // General API rate limiting
  static generalAPILimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Authentication rate limiting
  static authLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
  });

  // Healthcare API rate limiting
  static healthcareLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per minute
    message: {
      success: false,
      error: {
        code: 'HEALTHCARE_RATE_LIMIT_EXCEEDED',
        message: 'Too many healthcare API requests, please try again later.',
        retryAfter: '1 minute'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Medication API rate limiting
  static medicationLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 requests per minute
    message: {
      success: false,
      error: {
        code: 'MEDICATION_RATE_LIMIT_EXCEEDED',
        message: 'Too many medication API requests, please try again later.',
        retryAfter: '1 minute'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // File upload rate limiting
  static uploadLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: {
      success: false,
      error: {
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        message: 'Too many file uploads, please try again later.',
        retryAfter: '1 hour'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Emergency API rate limiting (more lenient)
  static emergencyLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // limit each IP to 50 requests per minute
    message: {
      success: false,
      error: {
        code: 'EMERGENCY_RATE_LIMIT_EXCEEDED',
        message: 'Too many emergency API requests, please try again later.',
        retryAfter: '1 minute'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Dynamic rate limiting based on user role
  static createDynamicLimit(maxRequests: number, windowMs: number = 15 * 60 * 1000) {
    return rateLimit({
      windowMs,
      max: maxRequests,
      message: {
        success: false,
        error: {
          code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded for this operation.`,
          retryAfter: `${Math.ceil(windowMs / 60000)} minutes`
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        // Use user ID if available, otherwise IP
        const userId = (req as any).user?.id;
        return userId ? `user:${userId}` : (req.ip || 'unknown');
      }
    });
  }
}