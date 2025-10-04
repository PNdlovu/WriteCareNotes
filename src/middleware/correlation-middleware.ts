import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Correlation ID Middleware for WriteCareNotes
 * @module CorrelationMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Middleware to generate and manage correlation IDs
 * for request tracing and audit trails in healthcare systems.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation ID middleware for request tracing
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get correlation ID from header or generate new one
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  
  // Set correlation ID in request
  req.correlationId = correlationId;
  
  // Set correlation ID in response header
  res.setHeader('x-correlation-id', correlationId);
  
  // Add to request context for logging
  req.context = {
    ...req.context,
    correlationId
  };
  
  next();
};

export default correlationMiddleware;