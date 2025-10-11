/**
 * Error Boundary Middleware
 * Catches and handles all errors in the application
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Application Error Class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper - catches async errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Handler (404)
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    true,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Global Error Handler
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;
  let code = 'INTERNAL_ERROR';

  // If it's our custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
    code = error.code || 'APP_ERROR';
  }

  // Database errors
  if (error.name === 'QueryFailedError') {
    statusCode = 500;
    message = 'Database query failed';
    code = 'DATABASE_ERROR';
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // TypeORM errors
  if (error.name === 'EntityNotFound') {
    statusCode = 404;
    message = 'Resource not found';
    code = 'RESOURCE_NOT_FOUND';
  }

  // Log the error
  logger.error('Error occurred:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code,
      statusCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: (req as any).user?.id
    }
  });

  // Send error response
  consterrorResponse: any = {
    success: false,
    error: {
      code,
      message,
      statusCode
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error;
  }

  res.status(statusCode).json(errorResponse);

  // If it's a non-operational error, we might want to restart the process
  if (!isOperational) {
    logger.error('Non-operational error detected, process might need restart');
    // In production, you might want to trigger a graceful restart here
    // process.exit(1);
  }
};

/**
 * Request Timeout Middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        next(new AppError('Request timeout', 408, true, 'REQUEST_TIMEOUT'));
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

/**
 * Rate Limit Error Handler
 */
export const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later',
      statusCode: 429,
      retryAfter: res.getHeader('Retry-After')
    }
  });
};

/**
 * Circuit Breaker Error Handler
 */
export const circuitBreakerHandler = (error: Error): AppError => {
  return new AppError(
    'Service temporarily unavailable',
    503,
    true,
    'SERVICE_UNAVAILABLE'
  );
};

/**
 * Database Connection Error Handler
 */
export const databaseErrorHandler = (error: Error): AppError => {
  logger.error('Database connection error:', error);
  return new AppError(
    'Database connection failed',
    503,
    true,
    'DATABASE_CONNECTION_ERROR'
  );
};

/**
 * Redis Connection Error Handler
 */
export const redisErrorHandler = (error: Error): AppError => {
  logger.error('Redis connection error:', error);
  return new AppError(
    'Cache service unavailable',
    503,
    true,
    'CACHE_SERVICE_ERROR'
  );
};
