/**
 * @fileoverview agent-rbac.middleware
 * @module Agent-rbac.middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description agent-rbac.middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AgentRBACService } from '../services/security/agent-rbac.service';
import { logger } from '../utils/logger';

export class AgentRBACMiddleware {
  privaterbacService: AgentRBACService;

  const ructor() {
    this.rbacService = new AgentRBACService();
  }

  /**
   * Middleware to check agent access permissions
   */
  checkAgentAccess = (resource: string, action: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user?.id;
        const tenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;

        if (!userId) {
          res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
          return;
        }

        if (!tenantId) {
          res.status(400).json({
            success: false,
            message: 'Tenant ID required'
          });
          return;
        }

        const hasPermission = await this.rbacService.checkPermission(
          userId,
          tenantId,
          resource,
          action
        );

        if (!hasPermission) {
          logger.warn('Access denied to agent resource', {
            userId,
            tenantId,
            resource,
            action,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          res.status(403).json({
            success: false,
            message: 'Insufficient permissions to access this resource'
          });
          return;
        }

        // Add permission context to request
        req.agentPermissions = {
          userId,
          tenantId,
          resource,
          action,
          hasPermission: true
        };

        next();

      } catch (error) {
        logger.error('RBAC middleware error', {
          error: error.message,
          resource,
          action,
          userId: req.user?.id,
          tenantId: req.params.tenantId || req.query.tenantId
        });

        res.status(500).json({
          success: false,
          message: 'Permission check failed'
        });
      }
    };
  };

  /**
   * Middleware to check agent feature access
   */
  checkAgentFeatures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const tenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Tenant ID required'
        });
        return;
      }

      const canAccess = await this.rbacService.canAccessAgentFeatures(userId, tenantId);

      if (!canAccess) {
        logger.warn('Agent feature access denied', {
          userId,
          tenantId,
          ip: req.ip
        });

        res.status(403).json({
          success: false,
          message: 'Access to agent features not permitted'
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('Agent features access check failed', {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.params.tenantId || req.query.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Access check failed'
      });
    }
  };

  /**
   * Middleware to check recommendation approval permissions
   */
  checkRecommendationApproval = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const tenantId = req.body.tenantId || req.params.tenantId;

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Tenant ID required'
        });
        return;
      }

      const canApprove = await this.rbacService.canApproveRecommendations(userId, tenantId);

      if (!canApprove) {
        logger.warn('Recommendation approval access denied', {
          userId,
          tenantId,
          recommendationId: req.body.recommendationId,
          ip: req.ip
        });

        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to approve recommendations'
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('Recommendation approval access check failed', {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.body.tenantId || req.params.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Access check failed'
      });
    }
  };

  /**
   * Middleware to check agent configuration permissions
   */
  checkAgentConfiguration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const tenantId = req.params.tenantId;

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Tenant ID required'
        });
        return;
      }

      const canConfigure = await this.rbacService.canConfigureAgent(userId, tenantId);

      if (!canConfigure) {
        logger.warn('Agent configuration access denied', {
          userId,
          tenantId,
          ip: req.ip
        });

        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to configure agent'
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('Agent configuration access check failed', {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.params.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Access check failed'
      });
    }
  };

  /**
   * Middleware to check audit log access
   */
  checkAuditAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const tenantId = req.params.tenantId || req.query.tenantId;

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Tenant ID required'
        });
        return;
      }

      const canViewAudit = await this.rbacService.canViewAuditLogs(userId, tenantId);

      if (!canViewAudit) {
        logger.warn('Audit log access denied', {
          userId,
          tenantId,
          ip: req.ip
        });

        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view audit logs'
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('Audit access check failed', {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.params.tenantId || req.query.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Access check failed'
      });
    }
  };

  /**
   * Middleware to validate tenant access
   */
  validateTenantAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const tenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;

      if (!userId || !tenantId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Tenant ID required'
        });
        return;
      }

      // Check if user has any access to this tenant
      const accessControl = await this.rbacService.getUserAccessControl(userId, tenantId);
      
      if (!accessControl) {
        logger.warn('No tenant access found', {
          userId,
          tenantId,
          ip: req.ip
        });

        res.status(403).json({
          success: false,
          message: 'Access to this tenant not permitted'
        });
        return;
      }

      // Add tenant context to request
      req.tenantContext = {
        userId,
        tenantId,
        roles: accessControl.roles,
        permissions: accessControl.permissions
      };

      next();

    } catch (error) {
      logger.error('Tenant access validation failed', {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.params.tenantId || req.query.tenantId || req.body.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Tenant access validation failed'
      });
    }
  };
}

// Extend Express Request interface to include agent permissions
declare global {
  namespace Express {
    interface Request {
      agentPermissions?: {
        userId: string;
        tenantId: string;
        resource: string;
        action: string;
        hasPermission: boolean;
      };
      tenantContext?: {
        userId: string;
        tenantId: string;
        roles: string[];
        permissions: any[];
      };
    }
  }
}
