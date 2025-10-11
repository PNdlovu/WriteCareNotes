/**
 * @fileoverview rbac-middleware
 * @module Rbac-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description rbac-middleware
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../core/Logger';

// Note: AuthenticatedUser is now defined globally via Express augmentation
// in src/types/express.d.ts, so we can use Request directly
import { logger } from '../utils/logger';

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has any of the allowed roles
      const userRoles = req.user.roles || [];
      const hasPermission = allowedRoles.some(role => userRoles.includes(role));
      
      if (!hasPermission) {
        logger.warn(`Access denied for user ${req.user.id} with roles ${userRoles.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// Alias for backward compatibility
export const rbacMiddleware = authorize;
