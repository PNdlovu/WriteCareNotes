/**
 * @fileoverview Tenant Isolation Middleware
 * @module Middleware/TenantIsolation
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Enforces tenant isolation at the database query level.
 * Ensures all queries automatically filter by tenant ID to prevent
 * cross-tenant data access.
 */

import { Request, Response, NextFunction } from 'express';

export interface TenantContext {
  tenantId: string;
  organizationId?: string;
  userId: string;
  roles: string[];
}

/**
 * Middleware to enforce tenant isolation
 * Must be used after authentication middleware
 */
export const tenantIsolationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required for tenant isolation',
      },
    });
    return;
  }

  if (!user.tenantId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_MISSING',
        message: 'User does not have a tenant association',
      },
    });
    return;
  }

  // Set tenant context on request
  (req as any).tenantContext = {
    tenantId: user.tenantId,
    organizationId: user.organizationId,
    userId: user.id,
    roles: user.roles || [],
  } as TenantContext;

  next();
};

/**
 * Middleware to validate organization access
 * Ensures organization belongs to user's tenant
 */
export const organizationAccessMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const tenantContext = (req as any).tenantContext as TenantContext;
  const organizationId = req.params.organizationId || req.body.organizationId;

  if (!tenantContext) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_CONTEXT_MISSING',
        message: 'Tenant context not found. Use tenant isolation middleware first.',
      },
    });
    return;
  }

  if (organizationId && tenantContext.organizationId) {
    if (organizationId !== tenantContext.organizationId) {
      // User trying to access different organization
      // In real implementation, check if user has cross-org permissions
      res.status(403).json({
        success: false,
        error: {
          code: 'ORG_ACCESS_DENIED',
          message: 'Access denied to organization',
        },
      });
      return;
    }
  }

  next();
};

/**
 * Add tenant filter to TypeORM query builder
 */
export function applyTenantFilter(
  queryBuilder: any,
  tenantId: string,
  alias: string = 'entity'
): any {
  return queryBuilder.andWhere(`${alias}.tenantId = :tenantId`, { tenantId });
}

/**
 * Add tenant filter to TypeORM find options
 */
export function getTenantFindOptions(tenantId: string, options: any = {}): any {
  return {
    ...options,
    where: {
      ...(options.where || {}),
      tenantId,
    },
  };
}

/**
 * Validate tenant ownership of entity
 */
export async function validateTenantOwnership(
  entity: any,
  tenantId: string
): Promise<boolean> {
  if (!entity) {
    return false;
  }

  if (entity.tenantId !== tenantId) {
    console.warn('Tenant ownership validation failed', {
      entityTenantId: entity.tenantId,
      expectedTenantId: tenantId,
    });
    return false;
  }

  return true;
}

/**
 * Extract tenant context from request
 */
export function getTenantContext(req: Request): TenantContext | null {
  return (req as any).tenantContext || null;
}

/**
 * Check if user has cross-tenant access (super admin)
 */
export function hasCrossTenantAccess(tenantContext: TenantContext): boolean {
  return (
    tenantContext.roles.includes('super_admin') ||
    tenantContext.roles.includes('platform_admin')
  );
}
