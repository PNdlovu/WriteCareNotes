import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import { ErrorCode, ErrorCodeHelper, HTTPStatusCode } from './errorCodes';

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: HTTPStatusCode;
  details?: any;
  correlationId?: string;
  timestamp: string;
  stack?: string;
}

export class CustomError extends Error implements AppError {
  publiccode: ErrorCode;
  publicstatusCode: HTTPStatusCode;
  publicdetails?: any;
  publiccorrelationId?: string;
  publictimestamp: string;

  const ructor(
    code: ErrorCode,
    message?: string,
    details?: any,
    correlationId?: string
  ) {
    const errorMapping = ErrorCodeHelper.getErrorMapping(code);
    super(message || errorMapping?.message || 'Unknown error');
    
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = errorMapping?.statusCode || 500;
    this.details = details;
    this.correlationId = correlationId;
    this.timestamp = new Date().toISOString();
  }
}

export class ErrorHandler {
  /**
   * Create a standardized error response
   */
  private static createErrorResponse(error: AppError, req: Request): any {
    const errorMapping = ErrorCodeHelper.getErrorMapping(error.code);
    
    return {
      success: false,
      error: {
        code: error.code,
        message: error instanceof Error ? error.message : "Unknown error",
        description: errorMapping?.description || 'No description available',
        category: errorMapping?.category || 'Unknown',
        timestamp: error.timestamp,
        correlationId: error.correlationId || req.headers['x-correlation-id'],
        path: req.path,
        method: req.method,
        ...(error.details && { details: error.details })
      }
    };
  }

  /**
   * Handle known application errors
   */
  private static handleKnownError(error: AppError, req: Request, res: Response): void {
    const response = this.createErrorResponse(error, req);
    
    // Log error with context
    console.error('Application Error:', {
      code: error.code,
      message: error instanceof Error ? error.message : "Unknown error",
      correlationId: error.correlationId,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle unknown errors
   */
  private static handleUnknownError(error: Error, req: Request, res: Response): void {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    // Log error with context
    console.error('Unknown Error:', {
      message: error instanceof Error ? error.message : "Unknown error",
      correlationId,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      stack: error instanceof Error ? error.stack : undefined
    });

    const response = {
      success: false,
      error: {
        code: ErrorCode.GENERIC_INTERNAL_ERROR,
        message: 'Internal server error',
        description: 'An unexpected error occurred on the server',
        category: 'Generic',
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path,
        method: req.method
      }
    };

    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json(response);
  }

  /**
   * Handle validation errors
   */
  private static handleValidationError(error: any, req: Request, res: Response): void {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    const response = {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'Validation error',
        description: 'The request contains invalid data',
        category: 'Validation',
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path,
        method: req.method,
        details: error.details || error instanceof Error ? error.message : "Unknown error"
      }
    };

    res.status(HTTPStatusCode.BAD_REQUEST).json(response);
  }

  /**
   * Global error handler middleware
   */
  staticglobalErrorHandler = (
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // Don't handle errors if response has already been sent
    if (res.headersSent) {
      return next(error);
    }

    // Handle known application errors
    if (error instanceof CustomError) {
      return this.handleKnownError(error, req, res);
    }

    // Handle validation errors (Joi, class-validator, etc.)
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return this.handleValidationError(error, req, res);
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      const customError = new CustomError(
        ErrorCode.AUTH_TOKEN_INVALID,
        'Invalid authentication token',
        undefined,
        req.headers['x-correlation-id'] as string
      );
      return this.handleKnownError(customError, req, res);
    }

    if (error.name === 'TokenExpiredError') {
      const customError = new CustomError(
        ErrorCode.AUTH_TOKEN_EXPIRED,
        'Authentication token has expired',
        undefined,
        req.headers['x-correlation-id'] as string
      );
      return this.handleKnownError(customError, req, res);
    }

    // Handle database errors
    if (error.name === 'SequelizeError' || error.name === 'MongoError') {
      const customError = new CustomError(
        ErrorCode.SYSTEM_DATABASE_ERROR,
        'Database error',
        undefined,
        req.headers['x-correlation-id'] as string
      );
      return this.handleKnownError(customError, req, res);
    }

    // Handle unknown errors
    this.handleUnknownError(error, req, res);
  };

  /**
   * 404 handler for undefined routes
   */
  staticnotFoundHandler = (req: Request, res: Response): void => {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    const response = {
      success: false,
      error: {
        code: ErrorCode.GENERIC_NOT_FOUND,
        message: 'Route not found',
        description: `The requested route ${req.method} ${req.path} was not found`,
        category: 'Generic',
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path,
        method: req.method
      }
    };

    res.status(HTTPStatusCode.NOT_FOUND).json(response);
  };

  /**
   * Async error wrapper for route handlers
   */
  staticasyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}

export default ErrorHandler;
