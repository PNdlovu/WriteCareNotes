/**
 * @fileoverview Express middleware for role-based access control with
 * @module Role-check-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Express middleware for role-based access control with
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Role-Based Access Control Middleware
 * @module RoleCheckMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express middleware for role-based access control with
 * comprehensive permission validation and audit trail.
 */

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    name: string;
    email: string;
    role: string;
    roles: string[];
    tenantId: string;
    organizationId: string;
    permissions: string[];
  };
}

/**
 * Role check middleware factory
 */
export const roleCheckMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userRoles = req.user.roles || [req.user.role];
      const hasRequiredRole = allowedRoles.some(role => 
        userRoles.includes(role) || userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')
      );

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRoles: userRoles
        });
      }

      // Log role check for audit
      console.log(`Role check passed for user ${req.user.userId} with roles ${userRoles.join(', ')} accessing endpoint requiring ${allowedRoles.join(', ')}`);

      next();
    } catch (error: unknown) {
      console.error('Role check middlewareerror:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during role validation',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};
