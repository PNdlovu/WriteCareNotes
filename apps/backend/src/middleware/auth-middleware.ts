/**
 * @fileoverview auth-middleware
 * @module Auth-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description auth-middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

// Use the global Express Request type which already has user defined
export interface AuthenticatedRequest extends Request {
  // Inherit user from global Express.Request - no need to redeclare
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tenantId: decoded.tenantId || 'default',
      permissions: decoded.permissions || [],
      roles: decoded.roles || [decoded.role || 'user'], // Support both roles array and legacy role
      organizationId: decoded.organizationId
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
