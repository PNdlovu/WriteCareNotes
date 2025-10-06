import { Request, Response, NextFunction } from 'express';
import { loggerService } from './LoggerService';
import { configService } from './ConfigurationService';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId?: string;
  details?: any;
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  lastChecked: string;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    loadAverage: number[];
  };
}

enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR'
}

class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, ErrorCode.AUTHENTICATION_REQUIRED);
  }
}

class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, ErrorCode.NOT_FOUND);
  }
}

class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, ErrorCode.CONFLICT, true, details);
  }
}

class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, ErrorCode.DATABASE_ERROR, true, details);
  }
}

class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`External service error: ${service} - ${message}`, 502, ErrorCode.EXTERNAL_SERVICE_ERROR, true, details);
  }
}

class AIServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(`AI service error: ${message}`, 503, ErrorCode.AI_SERVICE_ERROR, true, details);
  }
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private healthChecks: Map<string, () => Promise<HealthCheckResult>> = new Map();
  private lastHealthCheck: SystemHealth | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupProcessHandlers();
    this.startHealthCheckScheduler();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private setupProcessHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      loggerService.error('Uncaught Exception', error, {
        type: 'UNCAUGHT_EXCEPTION',
        stack: error.stack
      });

      // Gracefully shutdown in production
      if (configService.isProduction()) {
        this.gracefulShutdown('UNCAUGHT_EXCEPTION');
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      loggerService.error('Unhandled Rejection', reason, {
        type: 'UNHANDLED_REJECTION',
        promise: promise.toString()
      });

      // Gracefully shutdown in production
      if (configService.isProduction()) {
        this.gracefulShutdown('UNHANDLED_REJECTION');
      }
    });

    // Handle graceful shutdown signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    loggerService.info(`Received ${signal}, starting graceful shutdown...`);

    // Stop health check scheduler
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Give ongoing requests time to complete
    setTimeout(() => {
      loggerService.info('Graceful shutdown completed');
      process.exit(0);
    }, 10000); // 10 seconds timeout
  }

  // Error handling middleware
  public globalErrorHandler() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const requestId = Math.random().toString(36).substring(7);
      
      // Log the error
      loggerService.error('Request error', error, {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.id
      });

      // Determine error response
      let statusCode = 500;
      let code = ErrorCode.INTERNAL_ERROR;
      let message = 'Internal server error';
      let details: any = undefined;

      if (error instanceof AppError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        details = error.details;
      } else if (error.name === 'ValidationError') {
        statusCode = 400;
        code = ErrorCode.VALIDATION_ERROR;
        message = error.message;
      } else if (error.name === 'CastError') {
        statusCode = 400;
        code = ErrorCode.VALIDATION_ERROR;
        message = 'Invalid data format';
      } else if (error.name === 'MongoError' || error.name === 'DatabaseError') {
        statusCode = 500;
        code = ErrorCode.DATABASE_ERROR;
        message = configService.isProduction() ? 'Database error occurred' : error.message;
      }

      const errorResponse: ErrorResponse = {
        error: code,
        message,
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId
      };

      // Include details in development
      if (!configService.isProduction() && details) {
        errorResponse.details = details;
      }

      // Include stack trace in development
      if (!configService.isProduction()) {
        (errorResponse as any).stack = error.stack;
      }

      res.status(statusCode).json(errorResponse);
    };
  }

  // 404 handler middleware
  public notFoundHandler() {
    return (req: Request, res: Response, next: NextFunction) => {
      const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
      next(error);
    };
  }

  // Async error wrapper
  public asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Health check registration
  public registerHealthCheck(
    name: string, 
    checkFn: () => Promise<HealthCheckResult>
  ): void {
    this.healthChecks.set(name, checkFn);
    loggerService.info(`Health check registered: ${name}`);
  }

  // Built-in health checks
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { databaseService } = await import('./DatabaseService');
      const isHealthy = await databaseService.healthCheck();
      const responseTime = Date.now() - startTime;
      
      const stats = databaseService.getConnectionStats();
      
      return {
        service: 'database',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          connections: stats,
          connected: databaseService.isHealthy()
        },
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { error: (error as Error).message },
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkAIService(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { aiService } = await import('./AIService');
      
      if (!aiService.isAIEnabled()) {
        return {
          service: 'ai',
          status: 'degraded',
          responseTime: 0,
          details: { message: 'AI service not configured' },
          lastChecked: new Date().toISOString()
        };
      }
      
      const isHealthy = await aiService.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'ai',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        details: { enabled: aiService.isAIEnabled() },
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'ai',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { error: (error as Error).message },
        lastChecked: new Date().toISOString()
      };
    }
  }

  private getSystemMetrics(): Pick<SystemHealth, 'memory' | 'cpu'> {
    const memUsage = process.memoryUsage();
    const memTotal = require('os').totalmem();
    const memFree = require('os').freemem();
    const memUsed = memTotal - memFree;
    
    return {
      memory: {
        used: memUsage.heapUsed,
        free: memFree,
        total: memTotal,
        percentage: (memUsed / memTotal) * 100
      },
      cpu: {
        loadAverage: require('os').loadavg()
      }
    };
  }

  // Comprehensive health check
  public async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const services: HealthCheckResult[] = [];

    // Run built-in health checks
    services.push(await this.checkDatabase());
    services.push(await this.checkAIService());

    // Run registered health checks
    for (const [name, checkFn] of this.healthChecks) {
      try {
        const result = await checkFn();
        services.push(result);
      } catch (error) {
        services.push({
          service: name,
          status: 'unhealthy',
          details: { error: (error as Error).message },
          lastChecked: new Date().toISOString()
        });
      }
    }

    // Determine overall status
    const hasUnhealthy = services.some(s => s.status === 'unhealthy');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const health: SystemHealth = {
      status: overallStatus,
      services,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      ...this.getSystemMetrics()
    };

    this.lastHealthCheck = health;
    
    const duration = Date.now() - startTime;
    loggerService.performance('Health check', duration, { 
      status: overallStatus,
      serviceCount: services.length 
    });

    return health;
  }

  // Health check scheduler
  private startHealthCheckScheduler(): void {
    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        loggerService.error('Scheduled health check failed', error as Error);
      }
    }, 30000);
  }

  // Get cached health status
  public getLastHealthCheck(): SystemHealth | null {
    return this.lastHealthCheck;
  }

  // Health check endpoint handler
  public createHealthEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const health = await this.performHealthCheck();
        
        const statusCode = health.status === 'healthy' ? 200 :
                          health.status === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json(health);
      } catch (error) {
        loggerService.error('Health check endpoint error', error as Error);
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Readiness probe (for Kubernetes)
  public createReadinessEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const health = await this.performHealthCheck();
        
        if (health.status === 'unhealthy') {
          return res.status(503).json({ ready: false, reason: 'Service unhealthy' });
        }
        
        res.status(200).json({ ready: true });
      } catch (error) {
        res.status(503).json({ ready: false, reason: 'Health check failed' });
      }
    };
  }

  // Liveness probe (for Kubernetes)
  public createLivenessEndpoint() {
    return (req: Request, res: Response) => {
      // Simple check - if we can respond, we're alive
      res.status(200).json({ alive: true, uptime: process.uptime() });
    };
  }

  // Metrics endpoint
  public createMetricsEndpoint() {
    return (req: Request, res: Response) => {
      const metrics = {
        uptime: process.uptime(),
        ...this.getSystemMetrics(),
        nodeVersion: process.version,
        pid: process.pid,
        environment: configService.get().nodeEnv
      };
      
      res.status(200).json(metrics);
    };
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();
export {
  ErrorHandlingService,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  AIServiceError,
  ErrorCode,
  ErrorResponse,
  HealthCheckResult,
  SystemHealth
};
export default errorHandlingService;