/**
 * @fileoverview Express middleware for multi-tenant data isolation and
 * @module Tenant-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Express middleware for multi-tenant data isolation and
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Tenant Isolation Middleware
 * @module TenantMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express middleware for multi-tenant data isolation and
 * organization-level access control.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './role-check-middleware';

/**
 * Tenant isolation middleware
 */
export const tenantMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for tenant access',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Tenant ID not found in user context',
        code: 'TENANT_ID_MISSING'
      });
    }

    if (!req.user.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Organization ID not found in user context',
        code: 'ORGANIZATION_ID_MISSING'
      });
    }

    // Add tenant context to request for use in services
    req.tenantContext = {
      tenantId: req.user.tenantId,
      organizationId: req.user.organizationId,
      userId: req.user.userId
    };

    // Log tenant access for audit
    console.log(`Tenant access granted for user ${req.user.userId} in tenant ${req.user.tenantId}, org ${req.user.organizationId}`);

    next();
  } catch (error: unknown) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during tenant validation',
      code: 'TENANT_MIDDLEWARE_ERROR'
    });
  }
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      tenantContext?: {
        tenantId: string;
        organizationId: string;
        userId: string;
      };
    }
  }
}