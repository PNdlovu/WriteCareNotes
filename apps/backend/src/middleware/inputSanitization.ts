/**
 * @fileoverview input sanitization
 * @module InputSanitization
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description input sanitization
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Input Sanitization Middleware
 * Sanitizes user inputs to prevent XSS and injection attacks
 */
export class InputSanitizationMiddleware {
  /**
   * Sanitize string input
   */
  private static sanitizeString(input: any): string {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Remove potentially dangerous characters and sanitize HTML
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // Remove all HTML tags
      ALLOWED_ATTR: [], // Remove all attributes
      KEEP_CONTENT: true // Keep text content
    }).trim();
  }

  /**
   * Sanitize object recursively
   */
  private static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize both key and value
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Middleware to sanitize request body
   */
  static sanitizeBody(req: Request, res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }
    next();
  }

  /**
   * Middleware to sanitize query parameters
   */
  static sanitizeQuery(req: Request, res: Response, next: NextFunction): void {
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }
    next();
  }

  /**
   * Middleware to sanitize URL parameters
   */
  static sanitizeParams(req: Request, res: Response, next: NextFunction): void {
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizeObject(req.params);
    }
    next();
  }

  /**
   * Comprehensive sanitization middleware
   */
  static sanitizeAll(req: Request, res: Response, next: NextFunction): void {
    this.sanitizeBody(req, res, () => {
      this.sanitizeQuery(req, res, () => {
        this.sanitizeParams(req, res, next);
      });
    });
  }

  /**
   * Sanitize specific fields for healthcare data
   */
  static sanitizeHealthcareData(req: Request, res: Response, next: NextFunction): void {
    if (req.body) {
      // Sanitize common healthcare fields
      const healthcareFields = [
        'notes', 'description', 'comments', 'observations',
        'medicationNotes', 'careNotes', 'familyNotes'
      ];

      healthcareFields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          // Allow some basic formatting for healthcare notes
          req.body[field] = DOMPurify.sanitize(req.body[field], {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true
          });
        }
      });
    }
    next();
  }
}

export default InputSanitizationMiddleware;
