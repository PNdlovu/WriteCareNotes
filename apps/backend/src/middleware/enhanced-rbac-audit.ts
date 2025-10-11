/**
 * @fileoverview enhanced-rbac-audit
 * @module Enhanced-rbac-audit
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description enhanced-rbac-audit
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth-middleware';
import { AuditTrailService } from '../services/audit/AuditTrailService';
import { logger } from '../utils/logger';
import { AuditEventType, RiskLevel, ComplianceFramework } from '../entities/audit/AuditEvent';

export interface RBACConfig {
  allowedRoles: string[];
  requiredPermissions?: string[];
  resource?: string;
  action?: string;
  riskLevel?: RiskLevel;
  complianceFrameworks?: ComplianceFramework[];
  auditDetails?: (req: AuthenticatedRequest) => any;
}

// Helper function to get primary role from roles array
const getPrimaryRole = (user: any): string => {
  if (user.roles && user.roles.length > 0) {
    return user.roles[0];
  }
  return user.role || 'user';
};

/**
 * Enhanced RBAC middleware with comprehensive audit logging
 */
export const enhancedAuthorize = (config: RBACConfig) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const auditService = new AuditTrailService();
    const startTime = Date.now();
    
    try {
      // Check authentication
      if (!req.user) {
        await auditService.logEvent({
          userId: 'anonymous',
          action: 'ACCESS_DENIED',
          resource: config.resource || req.path,
          entityType: 'endpoint',
          entityId: req.path,
          details: {
            reason: 'No authentication token provided',
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          },
          eventType: AuditEventType.SECURITY_EVENT,
          riskLevel: RiskLevel.HIGH,
          complianceFrameworks: [ComplianceFramework.GDPR, ComplianceFramework.SOC2]
        });

        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check role authorization
      const userPrimaryRole = getPrimaryRole(req.user);
      const userHasRole = config.allowedRoles.some(role => 
        req.user?.roles?.includes(role) || userPrimaryRole === role
      );
      
      if (!userHasRole) {
        await auditService.logEvent({
          userId: req.user.id,
          action: 'ACCESS_DENIED',
          resource: config.resource || req.path,
          entityType: 'endpoint',
          entityId: req.path,
          details: {
            reason: 'Insufficient role permissions',
            userRole: userPrimaryRole,
            userRoles: req.user.roles,
            requiredRoles: config.allowedRoles,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          },
          riskLevel: RiskLevel.MEDIUM
        });

        logger.warn(`Access denied for user ${req.user.id} with role ${userPrimaryRole}`, {
          requiredRoles: config.allowedRoles,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // Log successful authorization
      const responseTime = Date.now() - startTime;
      await auditService.logEvent({
        userId: req.user.id,
        action: config.action || 'ACCESS_GRANTED',
        resource: config.resource || req.path,
        entityType: 'endpoint',
        entityId: req.path,
        details: {
          userRole: req.user.role,
          method: req.method,
          path: req.path,
          responseTime: `${responseTime}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          ...(config.auditDetails ? config.auditDetails(req) : {})
        },
        eventType: AuditEventType.USER_ACTION,
        riskLevel: config.riskLevel || RiskLevel.LOW,
        complianceFrameworks: config.complianceFrameworks || [ComplianceFramework.GDPR]
      });

      next();
    } catch (error) {
      logger.error('Enhanced authorizationerror:', error);
      
      // Log the error
      await auditService.logEvent({
        userId: req.user?.id || 'unknown',
        action: 'AUTHORIZATION_ERROR',
        resource: config.resource || req.path,
        entityType: 'endpoint',
        entityId: req.path,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        eventType: AuditEventType.SYSTEM_ERROR,
        riskLevel: RiskLevel.HIGH,
        complianceFrameworks: [ComplianceFramework.GDPR, ComplianceFramework.SOC2]
      });

      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

/**
 * Simplified RBAC middleware for backward compatibility
 */
export const authorize = (allowedRoles: string[]) => {
  return enhancedAuthorize({
    allowedRoles,
    action: 'ACCESS_GRANTED',
    riskLevel: RiskLevel.LOW
  });
};

/**
 * High-security RBAC middleware for sensitive operations
 */
export const authorizeHighSecurity = (allowedRoles: string[], resource: string, action: string) => {
  return enhancedAuthorize({
    allowedRoles,
    resource,
    action,
    riskLevel: RiskLevel.HIGH,
    complianceFrameworks: [ComplianceFramework.GDPR, ComplianceFramework.SOC2, ComplianceFramework.HIPAA],
    auditDetails: (req) => ({
      requestBody: req.body ? JSON.stringify(req.body) : null,
      queryParams: req.query ? JSON.stringify(req.query) : null,
      headers: {
        contentType: req.get('Content-Type'),
        accept: req.get('Accept'),
        origin: req.get('Origin')
      }
    })
  });
};

/**
 * Financial operations RBAC middleware
 */
export const authorizeFinancial = (allowedRoles: string[], action: string) => {
  return enhancedAuthorize({
    allowedRoles,
    resource: 'financial',
    action,
    riskLevel: RiskLevel.HIGH,
    complianceFrameworks: [ComplianceFramework.GDPR, ComplianceFramework.SOC2, ComplianceFramework.PCI_DSS],
    auditDetails: (req) => ({
      financialOperation: action,
      amount: req.body?.amount || req.query?.amount,
      accountId: req.body?.accountId || req.params?.accountId,
      transactionType: req.body?.transactionType || req.query?.transactionType
    })
  });
};

/**
 * HR operations RBAC middleware
 */
export const authorizeHR = (allowedRoles: string[], action: string) => {
  return enhancedAuthorize({
    allowedRoles,
    resource: 'hr',
    action,
    riskLevel: RiskLevel.MEDIUM,
    complianceFrameworks: [ComplianceFramework.GDPR, ComplianceFramework.SOC2],
    auditDetails: (req) => ({
      hrOperation: action,
      employeeId: req.body?.employeeId || req.params?.employeeId,
      verificationType: req.body?.verificationType || req.query?.verificationType,
      documentType: req.body?.documentType || req.query?.documentType
    })
  });
};

export default {
  enhancedAuthorize,
  authorize,
  authorizeHighSecurity,
  authorizeFinancial,
  authorizeHR
};
