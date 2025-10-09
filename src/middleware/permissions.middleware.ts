/**
 * @fileoverview permissions.middleware
 * @module Permissions.middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Permission-based access control middleware for enterprise RBAC
 * Supports granular permissions like 'admin:tenants:create', 'nurse:residents:read', etc.
 * 
 * @example
 * // Require specific permissions
 * router.post('/tenants', 
 *   authenticateJWT, 
 *   checkPermissions(['admin:tenants:create']),
 *   controller.create
 * );
 * 
 * @see {@link ../services/auth/JWTAuthenticationService.ts} for permission structure
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Checks if the authenticated user has the required permissions
 * 
 * @param requiredPermissions - Array of required permission strings (e.g., ['admin:tenants:create'])
 * @returns Express middleware function
 * 
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks required permissions
 * 
 * @remarks
 * - Permissions are checked against req.user.permissions array
 * - User must have ALL required permissions (AND logic)
 * - Permissions follow format: '{role}:{resource}:{action}'
 * - Admin users with 'admin:*:*' permission bypass all checks
 */
export const checkPermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
      return;
    }

    // Get user permissions from JWT token
    const userPermissions = req.user.permissions || [];
    
    // Check for super admin wildcard permission
    if (userPermissions.includes('admin:*:*') || userPermissions.includes('*:*:*')) {
      next();
      return;
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(requiredPerm => {
      // Direct permission match
      if (userPermissions.includes(requiredPerm)) {
        return true;
      }

      // Check for wildcard permissions
      // e.g., 'admin:tenants:*' matches 'admin:tenants:create'
      const [reqRole, reqResource, reqAction] = requiredPerm.split(':');
      
      return userPermissions.some(userPerm => {
        const [userRole, userResource, userAction] = userPerm.split(':');
        
        // Match role and resource, allow wildcard action
        if (userRole === reqRole && userResource === reqResource && userAction === '*') {
          return true;
        }
        
        // Match role, allow wildcard resource
        if (userRole === reqRole && userResource === '*') {
          return true;
        }
        
        return false;
      });
    });

    if (!hasAllPermissions) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have the required permissions to access this resource',
        required: requiredPermissions,
        hint: 'Contact your administrator to request access'
      });
      return;
    }

    next();
  };
};

/**
 * Checks if user has ANY of the specified permissions (OR logic)
 * 
 * @param permissions - Array of permission strings
 * @returns Express middleware function
 * 
 * @example
 * // Allow if user has either permission
 * router.get('/data', 
 *   authenticateJWT,
 *   checkAnyPermission(['admin:data:read', 'user:data:read']),
 *   controller.getData
 * );
 */
export const checkAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required' 
      });
      return;
    }

    const userPermissions = req.user.permissions || [];
    
    // Super admin bypass
    if (userPermissions.includes('admin:*:*') || userPermissions.includes('*:*:*')) {
      next();
      return;
    }

    const hasAnyPermission = permissions.some(perm => userPermissions.includes(perm));

    if (!hasAnyPermission) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `One of: ${permissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Alias for role-based checks (backward compatibility)
 * Maps role names to permission patterns
 * 
 * @param allowedRoles - Array of role names (e.g., ['admin', 'manager'])
 * @returns Express middleware function
 * 
 * @example
 * router.delete('/users/:id', authenticateJWT, requireRole(['admin']), controller.delete);
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `Role: ${allowedRoles.join(' or ')}`,
        current: userRoles.join(', ') || 'none'
      });
      return;
    }

    next();
  };
};

/**
 * Ensures user can only access their own tenant's data
 * Used in conjunction with other permission checks
 * 
 * @returns Express middleware function
 * 
 * @example
 * router.get('/residents', authenticateJWT, ensureTenantIsolation, controller.list);
 */
export const ensureTenantIsolation = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.tenantId) {
    res.status(403).json({ 
      error: 'Tenant context required',
      message: 'Your account is not associated with a tenant'
    });
    return;
  }

  // Attach tenant filter to request for use in controllers
  req.query.tenantId = req.user.tenantId;
  
  next();
};
