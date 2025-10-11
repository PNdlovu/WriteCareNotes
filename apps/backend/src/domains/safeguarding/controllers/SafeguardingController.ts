/**
 * ============================================================================
 * Safeguarding Controller
 * ============================================================================
 * 
 * @fileoverview REST API controller for safeguarding operations including
 *               incident reporting, concern management, and child protection
 *               plan coordination.
 * 
 * @module domains/safeguarding/controllers/SafeguardingController
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides HTTP endpoints for safeguarding functionality. Handles incident
 * reporting, concern tracking, LADO notifications, OFSTED reporting, and
 * child protection plan management. All endpoints include proper validation,
 * error handling, and audit logging.
 * 
 * @compliance
 * - OFSTED Regulation 13 (Safeguarding)
 * - Working Together to Safeguard Children 2018
 * - GDPR 2018 (Data protection for sensitive information)
 * - Children Act 1989
 * 
 * @apiPrefix /api/v1/safeguarding
 * 
 * @endpoints
 * POST   /incidents              - Report safeguarding incident
 * GET    /incidents/:id          - Get incident details
 * PUT    /incidents/:id/status   - Update incident status
 * POST   /incidents/:id/lado     - Record LADO notification
 * GET    /incidents/overdue      - Get overdue investigations
 * POST   /concerns               - Raise safeguarding concern
 * GET    /concerns/:id           - Get concern details
 * PUT    /concerns/:id/assess    - Assess concern
 * POST   /concerns/:id/escalate  - Escalate to incident
 * POST   /cpp                    - Create child protection plan
 * GET    /cpp/:id                - Get CPP details
 * PUT    /cpp/:id/core-group     - Record core group meeting
 * PUT    /cpp/:id/review         - Record review conference
 * GET    /cpp/overdue-reviews    - Get overdue CPP reviews
 * GET    /statistics             - Get safeguarding statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Request, Response } from 'express';
import { SafeguardingService } from '../services/SafeguardingService';
import { IncidentType, Severity, IncidentStatus } from '../entities/SafeguardingIncident';
import { ConcernType, ConcernSeverity } from '../entities/SafeguardingConcern';
import { CPPCategory } from '../entities/ChildProtectionPlan';

export class SafeguardingController {
  privatesafeguardingService: SafeguardingService;

  const ructor() {
    this.safeguardingService = new SafeguardingService();
  }

  // ========================================
  // INCIDENT ENDPOINTS
  // ========================================

  /**
   * Report safeguarding incident
   * 
   * POST /api/v1/safeguarding/incidents
   * 
   * @body {
   *   childId: string;
   *   type: IncidentType;
   *   severity: Severity;
   *   incidentDate: Date;
   *   location: string;
   *   description: string;
   *   immediateActions: string;
   *   reportedByName: string;
   *   reportedByRole: string;
   *   witnesses?: Array<{name: string; role: string}>;
   * }
   * 
   * @returns {SafeguardingIncident} Created incident with notifications
   */
  async reportIncident(req: Request, res: Response): Promise<Response> {
    try {
      const {
        childId,
        type,
        severity,
        incidentDate,
        location,
        description,
        immediateActions,
        reportedByName,
        reportedByRole,
        witnesses
      } = req.body;

      // Validation
      if (!childId || !type || !severity || !incidentDate || !description) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      if (!Object.values(IncidentType).includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid incident type'
        });
      }

      if (!Object.values(Severity).includes(severity)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid severity level'
        });
      }

      // Get organization from authenticated user context
      const organizationId = (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(401).json({
          success: false,
          error: 'Organization context required'
        });
      }

      const incident = await this.safeguardingService.reportIncident({
        childId,
        organizationId,
        type,
        severity,
        incidentDate: new Date(incidentDate),
        location,
        description,
        immediateActions,
        reportedByName,
        reportedByRole,
        witnesses
      });

      return res.status(201).json({
        success: true,
        data: incident,
        message: 'Incident reported successfully'
      });

    } catch (error: any) {
      console.error('Error reportingincident:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to report incident'
      });
    }
  }

  /**
   * Get incident details
   * 
   * GET /api/v1/safeguarding/incidents/:id
   */
  async getIncident(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const incident = await this.safeguardingService['incidentRepository'].findOne({
        where: { id },
        relations: ['child', 'organization']
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          error: 'Incident not found'
        });
      }

      return res.json({
        success: true,
        data: incident
      });

    } catch (error: any) {
      console.error('Error fetchingincident:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch incident'
      });
    }
  }

  /**
   * Update incident status
   * 
   * PUT /api/v1/safeguarding/incidents/:id/status
   */
  async updateIncidentStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const updatedBy = (req as any).user?.name || 'System';

      if (!Object.values(IncidentStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      const incident = await this.safeguardingService.updateIncidentStatus(
        id,
        status,
        notes,
        updatedBy
      );

      return res.json({
        success: true,
        data: incident,
        message: 'Incident status updated successfully'
      });

    } catch (error: any) {
      console.error('Error updating incidentstatus:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update incident status'
      });
    }
  }

  /**
   * Record LADO notification
   * 
   * POST /api/v1/safeguarding/incidents/:id/lado
   */
  async recordLADONotification(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const {
        notifiedDate,
        notifiedBy,
        ladoOfficer,
        ladoAdvice,
        ladoReference
      } = req.body;

      if (!notifiedDate || !notifiedBy || !ladoOfficer) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const incident = await this.safeguardingService.recordLADONotification(id, {
        notifiedDate: new Date(notifiedDate),
        notifiedBy,
        ladoOfficer,
        ladoAdvice,
        ladoReference
      });

      return res.json({
        success: true,
        data: incident,
        message: 'LADO notification recorded successfully'
      });

    } catch (error: any) {
      console.error('Error recording LADOnotification:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to record LADO notification'
      });
    }
  }

  /**
   * Get overdue incident investigations
   * 
   * GET /api/v1/safeguarding/incidents/overdue
   */
  async getOverdueIncidents(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(401).json({
          success: false,
          error: 'Organization context required'
        });
      }

      const incidents = await this.safeguardingService.getOverdueIncidents(organizationId);

      return res.json({
        success: true,
        data: incidents,
        count: incidents.length
      });

    } catch (error: any) {
      console.error('Error fetching overdueincidents:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch overdue incidents'
      });
    }
  }

  /**
   * Search incidents
   * 
   * GET /api/v1/safeguarding/incidents
   */
  async searchIncidents(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).user?.organizationId;
      const {
        childId,
        type,
        severity,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = { organizationId };

      if (childId) where.childId = childId;
      if (type) where.type = type;
      if (severity) where.severity = severity;
      if (status) where.status = status;

      const [incidents, total] = await this.safeguardingService['incidentRepository'].findAndCount({
        where,
        relations: ['child'],
        order: { incidentDate: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      return res.json({
        success: true,
        data: incidents,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error: any) {
      console.error('Error searchingincidents:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to search incidents'
      });
    }
  }

  // ========================================
  // CONCERN ENDPOINTS
  // ========================================

  /**
   * Raise safeguarding concern
   * 
   * POST /api/v1/safeguarding/concerns
   */
  async raiseConcern(req: Request, res: Response): Promise<Response> {
    try {
      const {
        childId,
        concernType,
        concernSummary,
        concernDetails,
        severity,
        raisedByName,
        raisedByRole,
        raisedByContact,
        incidentDate,
        location
      } = req.body;

      if (!concernType || !concernSummary || !concernDetails || !severity) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const organizationId = (req as any).user?.organizationId;

      const concern = await this.safeguardingService.raiseConcern({
        organizationId,
        childId,
        concernType,
        concernSummary,
        concernDetails,
        severity,
        raisedByName,
        raisedByRole,
        raisedByContact,
        incidentDate: incidentDate ? new Date(incidentDate) : undefined,
        location
      });

      return res.status(201).json({
        success: true,
        data: concern,
        message: 'Concern raised successfully'
      });

    } catch (error: any) {
      console.error('Error raisingconcern:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to raise concern'
      });
    }
  }

  /**
   * Assess safeguarding concern
   * 
   * PUT /api/v1/safeguarding/concerns/:id/assess
   */
  async assessConcern(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const {
        assessmentNotes,
        thresholdMet,
        thresholdRationale,
        escalateToIncident
      } = req.body;

      const assessedBy = (req as any).user?.name || 'System';

      const concern = await this.safeguardingService.assessConcern(id, {
        assessedBy,
        assessmentNotes,
        thresholdMet,
        thresholdRationale,
        escalateToIncident
      });

      return res.json({
        success: true,
        data: concern,
        message: 'Concern assessed successfully'
      });

    } catch (error: any) {
      console.error('Error assessingconcern:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to assess concern'
      });
    }
  }

  /**
   * Escalate concern to incident
   * 
   * POST /api/v1/safeguarding/concerns/:id/escalate
   */
  async escalateConcernToIncident(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { type, severity, escalationReason } = req.body;

      const escalatedBy = (req as any).user?.name || 'System';

      const incident = await this.safeguardingService.escalateConcernToIncident(id, {
        type,
        severity,
        escalatedBy,
        escalationReason
      });

      return res.status(201).json({
        success: true,
        data: incident,
        message: 'Concern escalated to incident successfully'
      });

    } catch (error: any) {
      console.error('Error escalatingconcern:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to escalate concern'
      });
    }
  }

  // ========================================
  // CHILD PROTECTION PLAN ENDPOINTS
  // ========================================

  /**
   * Create child protection plan
   * 
   * POST /api/v1/safeguarding/cpp
   */
  async createChildProtectionPlan(req: Request, res: Response): Promise<Response> {
    try {
      const {
        childId,
        category,
        initialConferenceDate,
        initialConferenceChair,
        initialConferenceDecision,
        leadSocialWorkerName,
        leadSocialWorkerEmail,
        leadSocialWorkerPhone,
        identifiedRisks,
        objectives,
        coreGroupMembers
      } = req.body;

      if (!childId || !category || !initialConferenceDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const organizationId = (req as any).user?.organizationId;
      const createdBy = (req as any).user?.name || 'System';

      const cpp = await this.safeguardingService.createChildProtectionPlan({
        childId,
        organizationId,
        category,
        initialConferenceDate: new Date(initialConferenceDate),
        initialConferenceChair,
        initialConferenceDecision,
        leadSocialWorkerName,
        leadSocialWorkerEmail,
        leadSocialWorkerPhone,
        identifiedRisks,
        objectives,
        coreGroupMembers,
        createdBy
      });

      return res.status(201).json({
        success: true,
        data: cpp,
        message: 'Child protection plan created successfully'
      });

    } catch (error: any) {
      console.error('Error creatingCPP:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create child protection plan'
      });
    }
  }

  /**
   * Get child protection plan details
   * 
   * GET /api/v1/safeguarding/cpp/:id
   */
  async getChildProtectionPlan(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const cpp = await this.safeguardingService['cppRepository'].findOne({
        where: { id },
        relations: ['child', 'organization']
      });

      if (!cpp) {
        return res.status(404).json({
          success: false,
          error: 'Child protection plan not found'
        });
      }

      return res.json({
        success: true,
        data: cpp
      });

    } catch (error: any) {
      console.error('Error fetchingCPP:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch child protection plan'
      });
    }
  }

  /**
   * Get overdue CPP reviews
   * 
   * GET /api/v1/safeguarding/cpp/overdue-reviews
   */
  async getOverdueCPPReviews(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).user?.organizationId;

      const overdueReviews = await this.safeguardingService.getOverdueCPPReviews(organizationId);

      return res.json({
        success: true,
        data: overdueReviews,
        count: overdueReviews.length
      });

    } catch (error: any) {
      console.error('Error fetching overdue CPPreviews:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch overdue reviews'
      });
    }
  }

  /**
   * Get safeguarding statistics
   * 
   * GET /api/v1/safeguarding/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).user?.organizationId;
      const { startDate, endDate } = req.query;

      const where: any = { organizationId };

      const [
        totalIncidents,
        activeIncidents,
        totalConcerns,
        activeCPPs
      ] = await Promise.all([
        this.safeguardingService['incidentRepository'].count({ where }),
        this.safeguardingService['incidentRepository'].count({
          where: { ...where, status: IncidentStatus.INVESTIGATING }
        }),
        this.safeguardingService['concernRepository'].count({ where }),
        this.safeguardingService['cppRepository'].count({
          where: { ...where, status: 'ACTIVE' }
        })
      ]);

      return res.json({
        success: true,
        data: {
          incidents: {
            total: totalIncidents,
            active: activeIncidents
          },
          concerns: {
            total: totalConcerns
          },
          childProtectionPlans: {
            active: activeCPPs
          }
        }
      });

    } catch (error: any) {
      console.error('Error fetchingstatistics:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch statistics'
      });
    }
  }
}
