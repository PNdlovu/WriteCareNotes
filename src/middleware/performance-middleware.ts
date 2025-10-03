import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Performance Monitoring Middleware for WriteCareNotes
 * @module PerformanceMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Middleware for monitoring API performance and response times
 * with healthcare-specific performance targets.
 */

import { Request, Response, NextFunction } from 'express';
import { PerformanceLogger } from '@/utils/logger';

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const operationId = req.correlationId || `perf_${Date.now()}`;
  
  // Start performance timer
  PerformanceLogger.startTimer(operationId);
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log performance metrics
    PerformanceLogger.endTimer(operationId, `${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    // Set response time header
    res.setHeader('x-response-time', `${responseTime}ms`);
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

export default performanceMiddleware;