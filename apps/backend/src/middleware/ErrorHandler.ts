/**
 * @fileoverview error handler
 * @module ErrorHandler
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description error handler
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ErrorHandler {
  /**
   * Global error handling middleware
   */
  static handleError = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error occurred', {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    letdetails: any = undefined;

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation error';
      details = (error as any).details;
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      message = 'Unauthorized';
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
      message = 'Forbidden';
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      message = 'Not found';
    }

    // Don't expose internal errors in production
    if (process.env['NODE_ENV'] === 'production' && statusCode === 500) {
      message = 'Internal server error';
      details = undefined;
    } else if (process.env['NODE_ENV'] === 'development') {
      details = error instanceof Error ? error.message : "Unknown error";
    }

    res.status(statusCode).json({
      success: false,
      error: {
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      }
    });
  };

  /**
   * Async error wrapper
   */
  static asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Validation middleware
   */
  static validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Simple validation - in a real app, you'd use Joi or similar
        if (schema && schema.validate) {
          const { error } = schema.validate(req.body);
          if (error) {
            const validationError = new Error('Validation error');
            (validationError as any).name = 'ValidationError';
            (validationError as any).details = error.details.map((detail: any) => ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            }));
            return next(validationError);
          }
        }
        next();
      } catch (error: unknown) {
        next(error);
      }
    };
  };

  /**
   * 404 handler
   */
  static notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    (error as any).name = 'NotFoundError';
    next(error);
  };
}
