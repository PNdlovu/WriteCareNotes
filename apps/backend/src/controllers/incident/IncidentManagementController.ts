import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { IncidentManagementService } from '../../services/incident/IncidentManagementService';
import { IncidentType, IncidentSeverity, IncidentStatus } from '../../entities/incident/IncidentReport';

/**
 * Controller #10: Incident Management
 * 
 * 16 endpoints for comprehensive incident tracking and investigation
 */
export class IncidentManagementController {
  constructor(private incidentService: IncidentManagementService) {}

  /**
   * POST /incidents
   * Create new incident report
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const incident = await this.incidentService.create({
        ...req.body,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: incident,
        message: 'Incident report created successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create incident report',
      });
    }
  }

  /**
   * GET /incidents/:id
   * Get incident by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const incident = await this.incidentService.findById(req.params.id, organizationId);

      if (!incident) {
        res.status(404).json({
          success: false,
          error: 'Incident not found',
        });
        return;
      }

      res.json({
        success: true,
        data: incident,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve incident',
      });
    }
  }

  /**
   * GET /incidents
   * List incidents with filtering and pagination
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.incidentType) filters.incidentType = req.query.incidentType;
      if (req.query.severity) filters.severity = req.query.severity;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.reportedBy) filters.reportedBy = req.query.reportedBy;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.critical) filters.critical = req.query.critical === 'true';

      const result = await this.incidentService.findAll(organizationId, filters, page, limit);

      res.json({
        success: true,
        data: result.incidents,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve incidents',
      });
    }
  }

  /**
   * PUT /incidents/:id
   * Update incident
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const incident = await this.incidentService.update(req.params.id, organizationId, req.body);

      res.json({
        success: true,
        data: incident,
        message: 'Incident updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update incident',
      });
    }
  }

  /**
   * DELETE /incidents/:id
   * Delete incident (soft delete)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      await this.incidentService.delete(req.params.id, organizationId);

      res.json({
        success: true,
        message: 'Incident deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete incident',
      });
    }
  }

  /**
   * POST /incidents/:id/root-cause
   * Add root cause analysis
   */
  async addRootCauseAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const incident = await this.incidentService.addRootCauseAnalysis(
        req.params.id,
        organizationId,
        req.body
      );

      res.json({
        success: true,
        data: incident,
        message: 'Root cause analysis added successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add root cause analysis',
      });
    }
  }

  /**
   * POST /incidents/:id/corrective-actions
   * Add corrective action
   */
  async addCorrectiveAction(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const incident = await this.incidentService.addCorrectiveAction(
        req.params.id,
        organizationId,
        req.body
      );

      res.json({
        success: true,
        data: incident,
        message: 'Corrective action added successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add corrective action',
      });
    }
  }

  /**
   * PUT /incidents/:id/corrective-actions/:actionId
   * Update corrective action status
   */
  async updateCorrectiveAction(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.body.organizationId;
      const { status, effectiveness } = req.body;

      const incident = await this.incidentService.updateCorrectiveAction(
        req.params.id,
        organizationId,
        req.params.actionId,
        status,
        effectiveness
      );

      res.json({
        success: true,
        data: incident,
        message: 'Corrective action updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update corrective action',
      });
    }
  }

  /**
   * POST /incidents/:id/resolve
   * Mark incident as resolved
   */
  async resolve(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.body.organizationId;
      const incident = await this.incidentService.markAsResolved(req.params.id, organizationId);

      res.json({
        success: true,
        data: incident,
        message: 'Incident marked as resolved',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to resolve incident',
      });
    }
  }

  /**
   * POST /incidents/:id/close
   * Close incident
   */
  async close(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.body.organizationId;
      const incident = await this.incidentService.close(req.params.id, organizationId);

      res.json({
        success: true,
        data: incident,
        message: 'Incident closed successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to close incident',
      });
    }
  }

  /**
   * POST /incidents/:id/quality-review
   * Complete quality assurance review
   */
  async completeQualityReview(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const { reviewedBy, qualityScore, areasForImprovement, bestPractices } = req.body;

      const incident = await this.incidentService.completeQualityReview(
        req.params.id,
        organizationId,
        reviewedBy,
        qualityScore,
        areasForImprovement,
        bestPractices
      );

      res.json({
        success: true,
        data: incident,
        message: 'Quality review completed successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to complete quality review',
      });
    }
  }

  /**
   * POST /incidents/:id/cqc-notify
   * Send CQC notification
   */
  async sendCQCNotification(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.body.organizationId;
      const { notificationReference } = req.body;

      const incident = await this.incidentService.sendCQCNotification(
        req.params.id,
        organizationId,
        notificationReference
      );

      res.json({
        success: true,
        data: incident,
        message: 'CQC notification sent successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send CQC notification',
      });
    }
  }

  /**
   * GET /incidents/critical
   * Get critical incidents
   */
  async getCritical(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const incidents = await this.incidentService.getCriticalIncidents(organizationId);

      res.json({
        success: true,
        data: incidents,
        count: incidents.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve critical incidents',
      });
    }
  }

  /**
   * GET /incidents/cqc-required
   * Get incidents requiring CQC notification
   */
  async getCQCRequired(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const incidents = await this.incidentService.getIncidentsRequiringCQC(organizationId);

      res.json({
        success: true,
        data: incidents,
        count: incidents.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve incidents requiring CQC notification',
      });
    }
  }

  /**
   * GET /incidents/overdue-actions
   * Get overdue corrective actions
   */
  async getOverdueActions(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const actions = await this.incidentService.getOverdueCorrectiveActions(organizationId);

      res.json({
        success: true,
        data: actions,
        count: actions.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve overdue actions',
      });
    }
  }

  /**
   * GET /incidents/trends
   * Get trend analysis
   */
  async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const trends = await this.incidentService.getTrendAnalysis(organizationId, startDate, endDate);

      res.json({
        success: true,
        data: trends,
        period: {
          startDate,
          endDate,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve trend analysis',
      });
    }
  }

  /**
   * GET /incidents/statistics
   * Get statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const statistics = await this.incidentService.getStatistics(organizationId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve statistics',
      });
    }
  }
}

/**
 * Validation rules
 */

export const createIncidentValidation = [
  body('incidentType')
    .isIn(Object.values(IncidentType))
    .withMessage('Invalid incident type'),
  body('severity')
    .isIn(Object.values(IncidentSeverity))
    .withMessage('Invalid severity level'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('incidentDateTime')
    .isISO8601()
    .withMessage('Invalid incident date/time'),
  body('reportedBy')
    .notEmpty()
    .withMessage('Reporter is required'),
];

export const updateIncidentValidation = [
  body('description')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('severity')
    .optional()
    .isIn(Object.values(IncidentSeverity))
    .withMessage('Invalid severity level'),
  body('status')
    .optional()
    .isIn(Object.values(IncidentStatus))
    .withMessage('Invalid status'),
];

export const rootCauseAnalysisValidation = [
  body('primaryCause')
    .notEmpty()
    .withMessage('Primary cause is required'),
  body('analysisMethod')
    .isIn(['5_why', 'fishbone', 'fault_tree', 'barrier_analysis', 'other'])
    .withMessage('Invalid analysis method'),
  body('analysisNotes')
    .notEmpty()
    .withMessage('Analysis notes are required'),
];

export const correctiveActionValidation = [
  body('description')
    .notEmpty()
    .withMessage('Action description is required'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('responsible')
    .notEmpty()
    .withMessage('Responsible person is required'),
  body('deadline')
    .isISO8601()
    .withMessage('Invalid deadline date'),
  body('successCriteria')
    .notEmpty()
    .withMessage('Success criteria is required'),
];

export const qualityReviewValidation = [
  body('reviewedBy')
    .notEmpty()
    .withMessage('Reviewer is required'),
  body('qualityScore')
    .isInt({ min: 1, max: 5 })
    .withMessage('Quality score must be between 1 and 5'),
  body('areasForImprovement')
    .isArray()
    .withMessage('Areas for improvement must be an array'),
  body('bestPractices')
    .isArray()
    .withMessage('Best practices must be an array'),
];
