/**
 * @fileoverview correlation id
 * @module CorrelationId
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description correlation id
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation ID Middleware
 * Adds correlation IDs to requests for tracing and audit purposes
 */
export class CorrelationIdMiddleware {
  /**
   * Generate or extract correlation ID from request
   */
  static addCorrelationId(req: Request, res: Response, next: NextFunction): void {
    // Check if correlation ID exists in headers
    let correlationId = req.headers['x-correlation-id'] as string;
    
    // If not present, generate a new one
    if (!correlationId) {
      correlationId = uuidv4();
    }
    
    // Add to request object for use in other middleware
    (req as any).correlationId = correlationId;
    
    // Add to response headers
    res.setHeader('X-Correlation-ID', correlationId);
    
    // Add to response locals for template rendering
    res.locals['correlationId'] = correlationId;
    
    next();
  }

  /**
   * Extract correlation ID from request
   */
  static getCorrelationId(req: Request): string {
    return (req as any).correlationId || req.headers['x-correlation-id'] as string || 'unknown';
  }
}

export default CorrelationIdMiddleware;
