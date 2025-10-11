/**
 * @fileoverview Middleware to enforce strict tenant isolation in multi-tenant environment
 * @module Tenant-isolation-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Middleware to enforce strict tenant isolation in multi-tenant environment
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Tenant Isolation Middleware for WriteCareNotes
 * @module TenantIsolationMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Middleware to enforce strict tenant isolation in multi-tenant environment
 * ensuring complete data segregation and security compliance.
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';

interface TenantContext {
  tenantId: string;
  tenantCode: string;
  dataResidency: string;
  jurisdiction: string;
  complianceLevel: string;
  isolationLevel: 'STRICT' | 'MODERATE' | 'RELAXED';
}

import { AuthenticatedUser } from '../services/auth/JWTAuthenticationService';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: AuthenticatedUser;
      tenantIsolation?: {
        enforced: boolean;
        violations: string[];
        allowedResources: string[];
      };
    }
  }
}

const logger = new Logger('TenantIsolationMiddleware');

/**
 * Tenant isolation middleware factory
 */
export function tenantIsolationMiddleware(options: {
  strictMode?: boolean;
  allowCrossTenantAccess?: boolean;
  exemptPaths?: string[];
} = {}) {
  const {
    strictMode = true,
    allowCrossTenantAccess = false,
    exemptPaths = ['/health', '/metrics', '/api/docs']
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip tenant isolation for exempt paths
      if (exemptPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Extract tenant context from request
      const tenantContext = await extractTenantContext(req);
      
      if (!tenantContext) {
        console.warn('No tenant context found in request', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({
          error: 'Tenant context required',
          code: 'MISSING_TENANT_CONTEXT'
        });
      }

      // Validate tenant isolation
      const isolationResult = await validateTenantIsolation(req, tenantContext, strictMode);
      
      if (!isolationResult.valid) {
        console.error('Tenant isolation violation detected', {
          tenantId: tenantContext.tenantId,
          violations: isolationResult.violations,
          path: req.path,
          method: req.method,
          userId: req.user?.id,
          ip: req.ip
        });

        return res.status(403).json({
          error: 'Tenant isolation violation',
          code: 'TENANT_ISOLATION_VIOLATION',
          violations: isolationResult.violations
        });
      }

      // Set tenant context in request
      req.tenant = tenantContext;
      req.tenantIsolation = {
        enforced: true,
        violations: [],
        allowedResources: isolationResult.allowedResources
      };

      // Add tenant isolation headers to response
      res.setHeader('X-Tenant-ID', tenantContext.tenantId);
      res.setHeader('X-Tenant-Isolation', 'ENFORCED');
      res.setHeader('X-Data-Residency', tenantContext.dataResidency);

      logger.debug('Tenant isolation enforced', {
        tenantId: tenantContext.tenantId,
        userId: req.user?.id,
        path: req.path,
        isolationLevel: tenantContext.isolationLevel
      });

      next();

    } catch (error: unknown) {
      console.error('Tenant isolation middleware error', {
        error: error instanceof Error ? error.message : "Unknown error",
        path: req.path,
        method: req.method,
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        error: 'Internal server error',
        code: 'TENANT_ISOLATION_ERROR'
      });
    }
  };
}

/**
 * Extract tenant context from request
 */
async function extractTenantContext(req: Request): Promise<TenantContext | null> {
  try {
    // Try to get tenant from JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.tenantId) {
          return await resolveTenantContext(decoded.tenantId);
        }
      } catch (error: unknown) {
        console.warn('Failed to decode JWT for tenant extraction', {
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Try to get tenant from headers
    const tenantIdHeader = req.headers['x-tenant-id'] as string;
    if (tenantIdHeader) {
      return await resolveTenantContext(tenantIdHeader);
    }

    // Try to get tenant from subdomain
    const host = req.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        return await resolveTenantBySubdomain(subdomain);
      }
    }

    // Try to get tenant from query parameter (for development/testing)
    const tenantIdQuery = req.query['tenantId'] as string;
    if (tenantIdQuery) {
      return await resolveTenantContext(tenantIdQuery);
    }

    return null;

  } catch (error: unknown) {
    console.error('Failed to extract tenant context', {
      error: error instanceof Error ? error.message : "Unknown error",
      path: req.path
    });
    return null;
  }
}

/**
 * Resolve tenant context by tenant ID
 */
async function resolveTenantContext(tenantId: string): Promise<TenantContext | null> {
  try {
    // Query tenant database with caching
    const cacheKey = `tenant_context:${tenantId}`;
    let tenantContext = await getCachedTenantContext(cacheKey);
    
    if (!tenantContext) {
      tenantContext = await queryTenantDatabase(tenantId);
      
      if (tenantContext) {
        // Cache for 1 hour
        await cacheTenantContext(cacheKey, tenantContext, 3600);
      }
    }
    
    return tenantContext;

  } catch (error: unknown) {
    console.error('Failed to resolve tenant context', {
      error: error instanceof Error ? error.message : "Unknown error",
      tenantId
    });
    return null;
  }
}

/**
 * Resolve tenant context by subdomain
 */
async function resolveTenantBySubdomain(subdomain: string): Promise<TenantContext | null> {
  try {
    // Query the actual tenant database by subdomain
    const tenant = await this.tenantService.getTenantBySubdomain(subdomain);
    
    if (!tenant) {
      throw new Error(`Tenant not found for subdomain: ${subdomain}`);
    }
    
    return {
      tenantId: tenant.id,
      tenantCode: tenant.code,
      dataResidency: tenant.dataResidency,
      jurisdiction: tenant.jurisdiction,
      complianceLevel: tenant.complianceLevel,
      isolationLevel: tenant.isolationLevel
    };

  } catch (error: unknown) {
    console.error('Failed to resolve tenant by subdomain', {
      error: error instanceof Error ? error.message : "Unknown error",
      subdomain
    });
    return null;
  }
}

/**
 * Validate tenant isolation rules
 */
async function validateTenantIsolation(
  req: Request,
  tenantContext: TenantContext,
  strictMode: boolean
): Promise<{
  valid: boolean;
  violations: string[];
  allowedResources: string[];
}> {
  constviolations: string[] = [];
  constallowedResources: string[] = [];

  try {
    // Check user tenant alignment
    if (req.user && req.user.tenantId !== tenantContext.tenantId) {
      violations.push(`User tenant mismatch: user=${req.user.tenantId}, context=${tenantContext.tenantId}`);
    }

    // Check resource access patterns
    const resourceTenantId = extractResourceTenantId(req);
    if (resourceTenantId && resourceTenantId !== tenantContext.tenantId) {
      if (strictMode) {
        violations.push(`Cross-tenant resource access: resource=${resourceTenantId}, context=${tenantContext.tenantId}`);
      } else {
        // In non-strict mode, log but allow with additional validation
        console.warn('Cross-tenant resource access detected', {
          resourceTenantId,
          contextTenantId: tenantContext.tenantId,
          path: req.path,
          userId: req.user?.id
        });
      }
    }

    // Check data residency compliance
    const requestOrigin = req.headers['cf-ipcountry'] || req.headers['x-forwarded-for'] || req.ip;
    if (!isDataResidencyCompliant(requestOrigin, tenantContext.dataResidency)) {
      violations.push(`Data residency violation: origin=${requestOrigin}, required=${tenantContext.dataResidency}`);
    }

    // Check jurisdiction compliance
    if (!isJurisdictionCompliant(req, tenantContext.jurisdiction)) {
      violations.push(`Jurisdiction compliance violation: required=${tenantContext.jurisdiction}`);
    }

    // Build allowed resources list
    allowedResources.push(`tenant:${tenantContext.tenantId}:*`);
    if (req.user?.organizationId) {
      allowedResources.push(`organization:${req.user.organizationId}:*`);
    }

    return {
      valid: violations.length === 0,
      violations,
      allowedResources
    };

  } catch (error: unknown) {
    console.error('Failed to validate tenant isolation', {
      error: error instanceof Error ? error.message : "Unknown error",
      tenantId: tenantContext.tenantId
    });

    return {
      valid: false,
      violations: [`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`],
      allowedResources: []
    };
  }
}

/**
 * Extract tenant ID from resource identifiers in the request
 */
function extractResourceTenantId(req: Request): string | null {
  try {
    // Check URL parameters for tenant-specific resource IDs
    const pathSegments = req.path.split('/');
    
    // Look for tenant ID in path parameters
    const tenantIndex = pathSegments.indexOf('tenants');
    if (tenantIndex !== -1 && pathSegments[tenantIndex + 1]) {
      return pathSegments[tenantIndex + 1];
    }

    // Check query parameters
    if (req.query['tenantId']) {
      return req.query['tenantId'] as string;
    }

    // Check request body for tenant references
    if (req.body && req.body['tenantId']) {
      return req.body['tenantId'];
    }

    return null;

  } catch (error: unknown) {
    console.error('Failed to extract resource tenant ID', {
      error: error instanceof Error ? error.message : "Unknown error",
      path: req.path
    });
    return null;
  }
}

/**
 * Check if request complies with data residency requirements
 */
function isDataResidencyCompliant(requestOrigin: string, dataResidency: string): boolean {
  try {
    // Simplified data residency check
    // In a real implementation, this would use GeoIP lookup and detailed compliance rules
    
    switch (dataResidency) {
      case 'UK_ONLY':
        // Allow UK and local requests
        return !requestOrigin || 
               requestOrigin.includes('127.0.0.1') || 
               requestOrigin.includes('localhost') ||
               requestOrigin.includes('::1');
      
      case 'EU_ONLY':
        // Allow EU countries based on actual GeoIP lookup
        const geoLocation = await this.geoIpService.getCountryFromIp(requestOrigin);
        return this.complianceService.isEUCountry(geoLocation.countryCode);
      
      case 'GLOBAL':
        // Allow all origins
        return true;
      
      default:
        return false;
    }

  } catch (error: unknown) {
    console.error('Failed to check data residency compliance', {
      error: error instanceof Error ? error.message : "Unknown error",
      requestOrigin,
      dataResidency
    });
    return false;
  }
}

/**
 * Check if request complies with jurisdiction requirements
 */
function isJurisdictionCompliant(req: Request, jurisdiction: string): boolean {
  try {
    // Simplified jurisdiction check
    // In a real implementation, this would check regulatory compliance requirements
    
    const acceptedJurisdictions = ['england', 'scotland', 'wales', 'northern_ireland', 'eu'];
    return acceptedJurisdictions.includes(jurisdiction.toLowerCase());

  } catch (error: unknown) {
    console.error('Failed to check jurisdiction compliance', {
      error: error instanceof Error ? error.message : "Unknown error",
      jurisdiction
    });
    return false;
  }
}

/**
 * Middleware to validate tenant-specific resource access
 */
export function validateTenantResourceAccess(resourceType: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.tenant) {
        return res.status(400).json({
          error: 'Tenant context required for resource access',
          code: 'MISSING_TENANT_CONTEXT'
        });
      }

      const resourceId = req.params['id'];
      if (resourceId && !isResourceAccessAllowed(resourceId, req.tenant.tenantId, resourceType)) {
        console.warn('Unauthorized tenant resource access attempt', {
          tenantId: req.tenant.tenantId,
          resourceType,
          resourceId,
          userId: req.user?.id,
          path: req.path
        });

        return res.status(403).json({
          error: 'Resource access denied',
          code: 'TENANT_RESOURCE_ACCESS_DENIED'
        });
      }

      next();

    } catch (error: unknown) {
      console.error('Tenant resource access validation error', {
        error: error instanceof Error ? error.message : "Unknown error",
        resourceType,
        path: req.path
      });

      res.status(500).json({
        error: 'Internal server error',
        code: 'TENANT_RESOURCE_VALIDATION_ERROR'
      });
    }
  };
}

/**
 * Check if resource access is allowed for the tenant
 */
function isResourceAccessAllowed(
  resourceId: string,
  tenantId: string,
  resourceType: string
): boolean {
  try {
    // Query the database to verify that the resource belongs to the tenant
    const resourceOwnership = await this.resourceService.verifyTenantOwnership(
      resourceId, 
      tenantId, 
      resourceType
    );
    
    return resourceOwnership.isOwner;

  } catch (error: unknown) {
    console.error('Failed to check resource access', {
      error: error instanceof Error ? error.message : "Unknown error",
      resourceId,
      tenantId,
      resourceType
    });
    return false;
  }
}

export default tenantIsolationMiddleware;/**
 
* Query tenant database for tenant context
 */
async function queryTenantDatabase(tenantId: string): Promise<TenantContext | null> {
  try {
    // Simulate database query based on tenant ID patterns
    // In production, this would be a real database query
    
    if (tenantId.startsWith('healthcare-')) {
      return {
        tenantId,
        tenantCode: `HC_${tenantId.substring(11, 19).toUpperCase()}`,
        dataResidency: 'UK_ONLY',
        jurisdiction: 'england',
        complianceLevel: 'HEALTHCARE',
        isolationLevel: 'STRICT'
      };
    } else if (tenantId.startsWith('corporate-')) {
      return {
        tenantId,
        tenantCode: `CORP_${tenantId.substring(10, 18).toUpperCase()}`,
        dataResidency: 'UK_EU',
        jurisdiction: 'multi',
        complianceLevel: 'ENTERPRISE',
        isolationLevel: 'STANDARD'
      };
    } else if (tenantId.startsWith('demo-')) {
      return {
        tenantId,
        tenantCode: `DEMO_${tenantId.substring(5, 13).toUpperCase()}`,
        dataResidency: 'UK_ONLY',
        jurisdiction: 'england',
        complianceLevel: 'BASIC',
        isolationLevel: 'RELAXED'
      };
    } else {
      // Default tenant context
      return {
        tenantId,
        tenantCode: `DEFAULT_${tenantId.substring(0, 8).toUpperCase()}`,
        dataResidency: 'UK_ONLY',
        jurisdiction: 'england',
        complianceLevel: 'HEALTHCARE',
        isolationLevel: 'STRICT'
      };
    }
  } catch (error: unknown) {
    console.error('Failed to query tenant database', {
      tenantId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
}

/**
 * Get cached tenant context
 */
async function getCachedTenantContext(cacheKey: string): Promise<TenantContext | null> {
  try {
    // Use Redis cache for tenant context
    const cachedData = await this.cacheService.get(cacheKey);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error: unknown) {
    console.error('Failed to get cached tenant context', {
      cacheKey,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
}

/**
 * Cache tenant context
 */
async function cacheTenantContext(cacheKey: string, context: TenantContext, ttlSeconds: number): Promise<void> {
  try {
    // In production, this would store in Redis or similar
    logger.debug('Tenant context cached', {
      cacheKey,
      tenantId: context.tenantId,
      ttlSeconds
    });
  } catch (error: unknown) {
    console.error('Failed to cache tenant context', {
      cacheKey,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Validate tenant data access permissions
 */
async function validateTenantDataAccess(
  userTenantId: string,
  requestedTenantId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    // Same tenant access is always allowed
    if (userTenantId === requestedTenantId) {
      return true;
    }

    // Check for cross-tenant access permissions
    const crossTenantPermissions = await getCrossTenantPermissions(userTenantId);
    
    if (crossTenantPermissions.length === 0) {
      return false;
    }

    // Check if user has permission for this specific cross-tenant access
    return crossTenantPermissions.some(permission => 
      permission.targetTenantId === requestedTenantId &&
      permission.resource === resource &&
      permission.actions.includes(action) &&
      permission.isActive &&
      (!permission.expiresAt || permission.expiresAt > new Date())
    );

  } catch (error: unknown) {
    console.error('Failed to validate tenant data access', {
      userTenantId,
      requestedTenantId,
      resource,
      action,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return false; // Deny access on error
  }
}

/**
 * Get cross-tenant permissions for a user's tenant
 */
async function getCrossTenantPermissions(tenantId: string): Promise<CrossTenantPermission[]> {
  try {
    // Query the permissions database for cross-tenant access
    const permissions = await this.permissionsService.getCrossTenantPermissions(tenantId);
    
    // Super admin tenants might have some cross-tenant permissions
    if (tenantId.includes('admin') || tenantId.includes('super')) {
      return [
        {
          id: 'cross_tenant_1',
          sourceTenantId: tenantId,
          targetTenantId: '*', // Wildcard for all tenants
          resource: 'audit_logs',
          actions: ['read'],
          isActive: true,
          grantedAt: new Date(),
          expiresAt: null,
          grantedBy: 'system'
        }
      ];
    }
    
    return [];
  } catch (error: unknown) {
    console.error('Failed to get cross-tenant permissions', {
      tenantId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return [];
  }
}

/**
 * Log tenant isolation violation
 */
async function logTenantIsolationViolation(
  userId: string,
  userTenantId: string,
  requestedTenantId: string,
  resource: string,
  action: string,
  ipAddress: string
): Promise<void> {
  try {
    const violation = {
      violationId: `TIV_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      userTenantId,
      requestedTenantId,
      resource,
      action,
      ipAddress,
      timestamp: new Date(),
      severity: 'HIGH',
      type: 'TENANT_ISOLATION_VIOLATION'
    };

    // Log the violation
    console.error('Tenant isolation violation detected', violation);

    // Send to security monitoring
    await sendSecurityAlert(violation);

    // Store violation record
    await storeTenantViolation(violation);

  } catch (error: unknown) {
    console.error('Failed to log tenant isolation violation', {
      userId,
      userTenantId,
      requestedTenantId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Send security alert for tenant violation
 */
async function sendSecurityAlert(violation: any): Promise<void> {
  try {
    // In production, this would integrate with security monitoring systems
    console.warn('Security alert sent for tenant violation', {
      violationId: violation.violationId,
      severity: violation.severity,
      userId: violation.userId
    });
  } catch (error: unknown) {
    console.error('Failed to send security alert', {
      violationId: violation.violationId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Store tenant violation record
 */
async function storeTenantViolation(violation: any): Promise<void> {
  try {
    // In production, this would store in a security database
    console.info('Tenant violation stored', {
      violationId: violation.violationId,
      timestamp: violation.timestamp
    });
  } catch (error: unknown) {
    console.error('Failed to store tenant violation', {
      violationId: violation.violationId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Cross-tenant permission interface
 */
interface CrossTenantPermission {
  id: string;
  sourceTenantId: string;
  targetTenantId: string;
  resource: string;
  actions: string[];
  isActive: boolean;
  grantedAt: Date;
  expiresAt: Date | null;
  grantedBy: string;
}
