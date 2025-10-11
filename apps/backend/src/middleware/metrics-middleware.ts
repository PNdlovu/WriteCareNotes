/**
 * @fileoverview metrics-middleware
 * @module Metrics-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description metrics-middleware
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Basic metrics middleware
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    console.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });
  });
  
  next();
};

export default metricsMiddleware;
