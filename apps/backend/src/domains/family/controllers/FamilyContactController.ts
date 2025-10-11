/**
 * ============================================================================
 * Family Contact Controller
 * ============================================================================
 * 
 * @fileoverview REST API controller for family contact management operations.
 * 
 * @module domains/family/controllers/FamilyContactController
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides HTTP endpoints for managing family members, contact schedules,
 * contact sessions, and risk assessments. All endpoints include comprehensive
 * validation and error handling.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Children's views, wishes and feelings)
 * - Children Act 1989, Section 22(4) & Section 34
 * - Human Rights Act 1998, Article 8
 * 
 * @endpoints
 * POST   /family/members                      - Register family member
 * GET    /family/members/child/:childId       - Get family members for child
 * PUT    /family/members/:id                  - Update family member
 * POST   /family/schedules                    - Create contact schedule
 * GET    /family/schedules/child/:childId     - Get contact schedules
 * PUT    /family/schedules/:id/suspend        - Suspend schedule
 * POST   /family/sessions                     - Schedule contact session
 * PUT    /family/sessions/:id/record          - Record session
 * PUT    /family/sessions/:id/cancel          - Cancel session
 * GET    /family/sessions/child/:childId      - Get sessions
 * POST   /family/risk-assessments             - Create risk assessment
 * PUT    /family/risk-assessments/:id/approve - Approve assessment
 * 
 * GET    /family/statistics                   - Get statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Request, Response } from 'express';
import { FamilyContactService } from '../services/FamilyContactService';
import { RelationshipType } from '../entities/FamilyMember';
import { ContactFrequency } from '../entities/ContactSchedule';
import { RiskLevel } from '../entities/ContactRiskAssessment';
import {
  validateRegisterFamilyMember,
  validateUpdateFamilyMember,
  validateCreateContactSchedule,
  validateSuspendContactSchedule,
  validateScheduleContactSession,
  validateRecordContactSession,
  validateCancelContactSession,
  validateCreateRiskAssessment,
  validateApproveRiskAssessment,
  ValidationError
} from '../validators/FamilyContactValidators';

export class FamilyContactController {
  privatefamilyContactService: FamilyContactService;

  const ructor() {
    this.familyContactService = new FamilyContactService();
  }

  // ========================================
  // FAMILY MEMBER ENDPOINTS
  // ========================================

  /**
   * Register family member
   * POST /family/members
   */
  registerFamilyMember = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      validateRegisterFamilyMember(req.body);

      const familyMember = await this.familyContactService.registerFamilyMember(req.body);

      res.status(201).json({
        success: true,
        message: 'Family member registered successfully',
        data: familyMember
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message,
          field: error.field
        });
        return;
      }
      console.error('Error registering familymember:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register family member',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get family members for child
   * GET /family/members/child/:childId
   */
  getFamilyMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId } = req.params;
      const { activeOnly } = req.query;

      let members;
      if (activeOnly === 'true') {
        members = await this.familyContactService.getActiveFamilyMembers(childId);
      } else {
        members = await this.familyContactService.getFamilyMembers(childId);
      }

      res.status(200).json({
        success: true,
        message: 'Family members retrieved successfully',
        data: members,
        count: members.length
      });
    } catch (error) {
      console.error('Error retrieving familymembers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve family members',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update family member
   * PUT /family/members/:id
   */
  updateFamilyMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const member = await this.familyContactService.updateFamilyMember(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Family member updated successfully',
        data: member
      });
    } catch (error) {
      console.error('Error updating familymember:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update family member',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // CONTACT SCHEDULE ENDPOINTS
  // ========================================

  /**
   * Create contact schedule
   * POST /family/schedules
   */
  createContactSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        childId,
        familyMemberId,
        organizationId,
        contactType,
        contactFrequency,
        supervisionRequired,
        durationMinutes,
        startDate,
        createdBy
      } = req.body;

      // Validation
      if (!childId || !familyMemberId || !organizationId || !contactType || 
          !contactFrequency || !durationMinutes || !startDate || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate contact frequency
      if (!Object.values(ContactFrequency).includes(contactFrequency)) {
        res.status(400).json({
          success: false,
          message: `Invalid contact frequency. Must be oneof: ${Object.values(ContactFrequency).join(', ')}`
        });
        return;
      }

      const schedule = await this.familyContactService.createContactSchedule({
        childId,
        familyMemberId,
        organizationId,
        contactType,
        contactFrequency: contactFrequency as ContactFrequency,
        supervisionRequired: supervisionRequired === true || supervisionRequired === 'true',
        durationMinutes: Number(durationMinutes),
        startDate: new Date(startDate),
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Contact schedule created successfully',
        data: schedule
      });
    } catch (error) {
      console.error('Error creating contactschedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create contact schedule',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get contact schedules for child
   * GET /family/schedules/child/:childId
   */
  getContactSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId } = req.params;
      const { activeOnly } = req.query;

      let schedules;
      if (activeOnly === 'true') {
        schedules = await this.familyContactService.getActiveContactSchedules(childId);
      } else {
        schedules = await this.familyContactService.getActiveContactSchedules(childId);
      }

      res.status(200).json({
        success: true,
        message: 'Contact schedules retrieved successfully',
        data: schedules,
        count: schedules.length
      });
    } catch (error) {
      console.error('Error retrieving contactschedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contact schedules',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Suspend contact schedule
   * PUT /family/schedules/:id/suspend
   */
  suspendContactSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason, updatedBy } = req.body;

      if (!reason || !updatedBy) {
        res.status(400).json({
          success: false,
          message: 'Missing requiredfields: reason, updatedBy'
        });
        return;
      }

      const schedule = await this.familyContactService.suspendContactSchedule(id, reason, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Contact schedule suspended successfully',
        data: schedule
      });
    } catch (error) {
      console.error('Error suspending contactschedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend contact schedule',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // CONTACT SESSION ENDPOINTS
  // ========================================

  /**
   * Schedule contact session
   * POST /family/sessions
   */
  scheduleContactSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        childId,
        familyMemberId,
        contactScheduleId,
        organizationId,
        sessionDate,
        scheduledStartTime,
        scheduledEndTime,
        supervised,
        createdBy
      } = req.body;

      // Validation
      if (!childId || !familyMemberId || !organizationId || !sessionDate || 
          !scheduledStartTime || !scheduledEndTime || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      const session = await this.familyContactService.scheduleContactSession({
        childId,
        familyMemberId,
        contactScheduleId,
        organizationId,
        sessionDate: new Date(sessionDate),
        scheduledStartTime,
        scheduledEndTime,
        supervised: supervised === true || supervised === 'true',
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Contact session scheduled successfully',
        data: session
      });
    } catch (error) {
      console.error('Error scheduling contactsession:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule contact session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Record contact session
   * PUT /family/sessions/:id/record
   */
  recordContactSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        actualStartTime,
        actualEndTime,
        childAttendance,
        familyMemberAttendance,
        interactionQuality,
        overallAssessment,
        completedBy
      } = req.body;

      // Validation
      if (!actualStartTime || !actualEndTime || !childAttendance || 
          !familyMemberAttendance || !interactionQuality || !completedBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      const session = await this.familyContactService.recordContactSession(id, {
        actualStartTime,
        actualEndTime,
        childAttendance,
        familyMemberAttendance,
        interactionQuality,
        overallAssessment,
        completedBy
      });

      res.status(200).json({
        success: true,
        message: 'Contact session recorded successfully',
        data: session
      });
    } catch (error) {
      console.error('Error recording contactsession:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record contact session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Cancel contact session
   * PUT /family/sessions/:id/cancel
   */
  cancelContactSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { cancelledBy, cancellationReason, rescheduled, rescheduledDate } = req.body;

      if (!cancelledBy || !cancellationReason) {
        res.status(400).json({
          success: false,
          message: 'Missing requiredfields: cancelledBy, cancellationReason'
        });
        return;
      }

      const session = await this.familyContactService.cancelContactSession(id, {
        cancelledBy,
        cancellationReason,
        rescheduled: rescheduled === true || rescheduled === 'true',
        rescheduledDate: rescheduledDate ? new Date(rescheduledDate) : undefined
      });

      res.status(200).json({
        success: true,
        message: 'Contact session cancelled successfully',
        data: session
      });
    } catch (error) {
      console.error('Error cancelling contactsession:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel contact session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get contact sessions for child
   * GET /family/sessions/child/:childId
   */
  getContactSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId } = req.params;
      const { familyMemberId, startDate, endDate } = req.query;

      const sessions = await this.familyContactService.getContactSessions(childId, {
        familyMemberId: familyMemberId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.status(200).json({
        success: true,
        message: 'Contact sessions retrieved successfully',
        data: sessions,
        count: sessions.length
      });
    } catch (error) {
      console.error('Error retrieving contactsessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contact sessions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // RISK ASSESSMENT ENDPOINTS
  // ========================================

  /**
   * Create contact risk assessment
   * POST /family/risk-assessments
   */
  createRiskAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        childId,
        familyMemberId,
        organizationId,
        assessmentDate,
        assessedByName,
        assessedByRole,
        overallRiskLevel,
        riskSummary,
        keyConcerns,
        contactRecommended,
        recommendationRationale,
        createdBy
      } = req.body;

      // Validation
      if (!childId || !familyMemberId || !organizationId || !assessmentDate || 
          !assessedByName || !assessedByRole || !overallRiskLevel || 
          !riskSummary || !keyConcerns || !recommendationRationale || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate risk level
      if (!Object.values(RiskLevel).includes(overallRiskLevel)) {
        res.status(400).json({
          success: false,
          message: `Invalid risk level. Must be oneof: ${Object.values(RiskLevel).join(', ')}`
        });
        return;
      }

      const assessment = await this.familyContactService.createRiskAssessment({
        childId,
        familyMemberId,
        organizationId,
        assessmentDate: new Date(assessmentDate),
        assessedByName,
        assessedByRole,
        overallRiskLevel: overallRiskLevel as RiskLevel,
        riskSummary,
        keyConcerns,
        contactRecommended: contactRecommended === true || contactRecommended === 'true',
        recommendationRationale,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Risk assessment created successfully',
        data: assessment
      });
    } catch (error) {
      console.error('Error creating riskassessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create risk assessment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Approve risk assessment
   * PUT /family/risk-assessments/:id/approve
   */
  approveRiskAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, approvedByName, approvedByRole, approvalComments } = req.body;

      if (!approvedBy || !approvedByName || !approvedByRole) {
        res.status(400).json({
          success: false,
          message: 'Missing requiredfields: approvedBy, approvedByName, approvedByRole'
        });
        return;
      }

      const assessment = await this.familyContactService.approveRiskAssessment(id, {
        approvedBy,
        approvedByName,
        approvedByRole,
        approvalComments
      });

      res.status(200).json({
        success: true,
        message: 'Risk assessment approved successfully',
        data: assessment
      });
    } catch (error) {
      console.error('Error approving riskassessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve risk assessment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // STATISTICS ENDPOINTS
  // ========================================

  /**
   * Get family contact statistics
   * GET /family/statistics
   */
  getFamilyContactStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.query;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Missing requiredparameter: organizationId'
        });
        return;
      }

      const statistics = await this.familyContactService.getFamilyContactStatistics(
        organizationId as string
      );

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      console.error('Error retrievingstatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
