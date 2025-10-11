/**
 * @fileoverview Policy Tracker API Routes - REST endpoints for policy management
 * @module PolicyTrackerRoutes
 * @version 1.0.0
 * @description Comprehensive API routes for policy tracking with color-coded status management
 */

import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PolicyTrackerService, PolicyStatus, PolicyPriority, PolicyCategory } from '../services/policy-tracking/PolicyTrackerService';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { Logger } from '../../shared/utils/Logger';
import { Repository } from 'typeorm';

const router = Router();
const logger = new Logger('PolicyTrackerAPI');

/**
 * Mock services for development
 * In production, these would be injected via DI container
 */
class MockRepository<T> {
  async find(options?: any): Promise<T[]> { return []; }
  async findOne(options?: any): Promise<T | null> { return null; }
  async save(entity: any): Promise<T> { return entity; }
  async create(entityLike: any): Promise<T> { return entityLike; }
  async delete(criteria: any): Promise<any> { return { affected: 1 }; }
}

class MockAuditService {
  async logAction(...args: any[]): Promise<void> {
    logger.debug('Audit action logged', args);
  }
}

class MockNotificationService {
  async sendNotification(notification: any): Promise<void> {
    logger.debug('Notification sent', notification);
  }
}

// Initialize services (in production, these would be injected via DI)
const mockPolicyRepo = new MockRepository();
const mockTransitionRepo = new MockRepository();
const mockAuditService = new MockAuditService();
const mockNotificationService = new MockNotificationService();

const policyTrackerService = new PolicyTrackerService(
  mockPolicyRepo as any,
  mockTransitionRepo as any,
  mockAuditService as any,
  mockNotificationService as any
);

/**
 * Validation middleware for handling validation errors
 */
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route GET /api/policy-tracker/dashboard
 * @description Get comprehensive policy dashboard metrics
 * @access Private (authenticated users)
 */
router.get('/dashboard',
  authMiddleware,
  [
    query('status').optional().isArray().withMessage('Status must be an array'),
    query('category').optional().isArray().withMessage('Category must be an array'),
    query('priority').optional().isArray().withMessage('Priority must be an array'),
    query('searchTerm').optional().isString().withMessage('Search term must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.user as any;
      const filters = {
        status: req.query.status as PolicyStatus[],
        category: req.query.category as PolicyCategory[],
        priority: req.query.priority as PolicyPriority[],
        searchTerm: req.query.searchTerm as string,
        dateRange: req.query.startDate && req.query.endDate ? {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string)
        } : undefined
      };

      const dashboard = await policyTrackerService.getPolicyDashboard(organizationId, filters);

      res.json({
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch policy dashboard', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policy dashboard',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/policy-tracker/policies
 * @description Get all policies with tracking information
 * @access Private (authenticated users)
 */
router.get('/policies',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['title', 'status', 'priority', 'dueDate', 'updatedAt']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('status').optional().isIn(Object.values(PolicyStatus)).withMessage('Invalid status'),
    query('category').optional().isIn(Object.values(PolicyCategory)).withMessage('Invalid category'),
    query('priority').optional().isIn(Object.values(PolicyPriority)).withMessage('Invalid priority')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.user as any;
      const {
        page = 1,
        limit = 20,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        status,
        category,
        priority,
        assignee,
        searchTerm,
        tags
      } = req.query;

      const filters = {
        status: status ? [status as PolicyStatus] : undefined,
        category: category ? [category as PolicyCategory] : undefined,
        priority: priority ? [priority as PolicyPriority] : undefined,
        assignee: assignee ? [assignee as string] : undefined,
        searchTerm: searchTerm as string,
        tags: tags ? (tags as string).split(',') : undefined
      };

      const policies = await policyTrackerService.getAllPolicies(organizationId, filters);

      // Apply pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedPolicies = policies.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          policies: paginatedPolicies,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: policies.length,
            totalPages: Math.ceil(policies.length / Number(limit)),
            hasNext: endIndex < policies.length,
            hasPrev: Number(page) > 1
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch policies', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policies',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/policy-tracker/policies/:id
 * @description Get specific policy details with full tracking information
 * @access Private (authenticated users)
 */
router.get('/policies/:id',
  authMiddleware,
  [
    param('id').isUUID().withMessage('Policy ID must be a valid UUID')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.user as any;
      const { id } = req.params;

      const policy = await policyTrackerService.getPolicyById(id, organizationId);

      if (!policy) {
        return res.status(404).json({
          success: false,
          message: 'Policy not found'
        });
      }

      res.json({
        success: true,
        data: policy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch policy', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policy',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/policy-tracker/policies
 * @description Create a new policy
 * @access Private (staff+ roles)
 */
router.post('/policies',
  authMiddleware,
  rbacMiddleware(['staff', 'manager', 'admin']),
  auditMiddleware,
  [
    body('title').isString().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be between 1-255 characters'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('category').isIn(Object.values(PolicyCategory)).withMessage('Invalid category'),
    body('priority').optional().isIn(Object.values(PolicyPriority)).withMessage('Invalid priority'),
    body('assigneeId').optional().isUUID().withMessage('Assignee ID must be a valid UUID'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be valid ISO date'),
    body('reviewDate').optional().isISO8601().withMessage('Review date must be valid ISO date'),
    body('jurisdiction').optional().isArray().withMessage('Jurisdiction must be an array'),
    body('requiresCQCApproval').optional().isBoolean().withMessage('requiresCQCApproval must be boolean'),
    body('requiresStaffTraining').optional().isBoolean().withMessage('requiresStaffTraining must be boolean'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId, userId, userName } = req.user as any;
      const policyData = {
        ...req.body,
        organizationId,
        authorId: userId,
        authorName: userName,
        status: PolicyStatus.DRAFT
      };

      const policy = await policyTrackerService.createPolicy(policyData);

      res.status(201).json({
        success: true,
        data: policy,
        message: 'Policy created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to create policy', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create policy',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/policy-tracker/policies/:id/status
 * @description Update policy status with transition tracking
 * @access Private (manager+ roles)
 */
router.put('/policies/:id/status',
  authMiddleware,
  rbacMiddleware(['manager', 'admin']),
  auditMiddleware,
  [
    param('id').isUUID().withMessage('Policy ID must be a valid UUID'),
    body('status').isIn(Object.values(PolicyStatus)).withMessage('Invalid status'),
    body('reason').isString().isLength({ min: 1, max: 500 }).withMessage('Reason is required and must be between 1-500 characters'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.user as any;
      const { id } = req.params;
      const { status, reason, notes } = req.body;

      await policyTrackerService.updatePolicyStatus(id, status, userId, reason, notes);

      res.json({
        success: true,
        message: 'Policy status updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update policy status', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update policy status',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/policy-tracker/status-colors
 * @description Get status color mappings for UI
 * @access Private (authenticated users)
 */
router.get('/status-colors',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const statusColors = policyTrackerService.getStatusColorMapping();
      const priorityColors = policyTrackerService.getPriorityColorMapping();

      res.json({
        success: true,
        data: {
          statusColors,
          priorityColors
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch color mappings', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch color mappings',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/policy-tracker/workflow/:id
 * @description Get policy workflow visualization data
 * @access Private (authenticated users)
 */
router.get('/workflow/:id',
  authMiddleware,
  [
    param('id').isUUID().withMessage('Policy ID must be a valid UUID')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.user as any;
      const { id } = req.params;

      const workflow = await policyTrackerService.getPolicyWorkflow(id, organizationId);

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Policy workflow not found'
        });
      }

      res.json({
        success: true,
        data: workflow,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch policy workflow', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policy workflow',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/policy-tracker/analytics/overview
 * @description Get policy analytics overview
 * @access Private (manager+ roles)
 */
router.get('/analytics/overview',
  authMiddleware,
  rbacMiddleware(['manager', 'admin']),
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
    query('category').optional().isIn(Object.values(PolicyCategory)).withMessage('Invalid category')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.user as any;
      const { period = '30d', category } = req.query;

      const analytics = await policyTrackerService.getPolicyAnalytics(organizationId, {
        period: period as string,
        category: category as PolicyCategory
      });

      res.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch policy analytics', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policy analytics',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/policy-tracker/policies/:id/comments
 * @description Add comment to policy
 * @access Private (authenticated users)
 */
router.post('/policies/:id/comments',
  authMiddleware,
  auditMiddleware,
  [
    param('id').isUUID().withMessage('Policy ID must be a valid UUID'),
    body('content').isString().isLength({ min: 1, max: 2000 }).withMessage('Content is required and must be between 1-2000 characters'),
    body('type').optional().isIn(['feedback', 'question', 'approval', 'rejection', 'suggestion']).withMessage('Invalid comment type'),
    body('isInternal').optional().isBoolean().withMessage('isInternal must be boolean')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { userId, userName } = req.user as any;
      const { id } = req.params;
      const { content, type = 'feedback', isInternal = false } = req.body;

      const comment = await policyTrackerService.addPolicyComment(id, {
        userId,
        userName,
        content,
        type,
        isInternal
      });

      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment added successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to add policy comment', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add policy comment',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/policy-tracker/export
 * @description Export policies to various formats
 * @access Private (manager+ roles)
 */
router.get('/export',
  authMiddleware,
  rbacMiddleware(['manager', 'admin']),
  [
    query('format').isIn(['csv', 'xlsx', 'pdf']).withMessage('Format must be csv, xlsx, or pdf'),
    query('status').optional().isArray().withMessage('Status must be an array'),
    query('category').optional().isArray().withMessage('Category must be an array')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.user as any;
      const { format, status, category } = req.query;

      const filters = {
        status: status as PolicyStatus[],
        category: category as PolicyCategory[]
      };

      const exportData = await policyTrackerService.exportPolicies(organizationId, format as string, filters);

      res.setHeader('Content-Type', exportData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      res.send(exportData.buffer);
    } catch (error) {
      logger.error('Failed to export policies', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export policies',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/policy-tracker/health
 * @description Health check endpoint
 * @access Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Policy Tracker API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
