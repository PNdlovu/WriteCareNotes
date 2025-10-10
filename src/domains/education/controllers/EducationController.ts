/**
 * ============================================================================
 * Education Controller
 * ============================================================================
 * 
 * @fileoverview REST API controller for education management including PEPs,
 *               school placements, attendance monitoring, and Virtual School
 *               coordination.
 * 
 * @module domains/education/controllers/EducationController
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides HTTP endpoints for education functionality. Handles Personal
 * Education Plan creation and reviews, school placement management, attendance
 * tracking, Pupil Premium Plus budget management, and educational statistics.
 * All endpoints include proper validation, error handling, and audit logging.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Education)
 * - Children Act 1989, Section 22(3A)
 * - Promoting the Education of Looked After Children 2018
 * - GDPR 2018 (Data protection)
 * 
 * @apiPrefix /api/v1/education
 * 
 * @endpoints
 * POST   /peps                    - Create PEP
 * GET    /peps/:id                - Get PEP details
 * PUT    /peps/:id/status         - Update PEP status
 * PUT    /peps/:id/targets        - Update target progress
 * POST   /peps/:id/pp-plus        - Record PP+ expenditure
 * GET    /peps/overdue            - Get overdue PEPs
 * POST   /placements              - Create school placement
 * GET    /placements/:id          - Get placement details
 * POST   /placements/:id/exclusion - Record exclusion
 * PUT    /placements/:id/attendance - Update attendance
 * GET    /placements/at-risk      - Get at-risk placements
 * GET    /neet                    - Get children not in education
 * GET    /statistics              - Get education statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Request, Response } from 'express';
import { EducationService } from '../services/EducationService';
import { PEPStatus, AcademicYear, Term } from '../entities/PersonalEducationPlan';
import { PlacementType } from '../entities/SchoolPlacement';

export class EducationController {
  private educationService: EducationService;

  constructor() {
    this.educationService = new EducationService();
  }

  // ========================================
  // PEP ENDPOINTS
  // ========================================

  /**
   * Create Personal Education Plan
   * 
   * POST /api/v1/education/peps
   */
  async createPEP(req: Request, res: Response): Promise<Response> {
    try {
      const {
        childId,
        academicYear,
        term,
        reviewDate,
        schoolName,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        designatedTeacherName,
        designatedTeacherEmail,
        designatedTeacherPhone,
        virtualSchoolHeadName,
        virtualSchoolContactEmail,
        virtualSchoolContactPhone,
        meetingParticipants,
        currentAttendancePercentage,
        currentAttainment,
        strengths,
        areasForDevelopment,
        targets,
        homeworkArrangements,
        ppPlusAllocated
      } = req.body;

      // Validation
      if (!childId || !academicYear || !term || !reviewDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const organizationId = (req as any).user?.organizationId;
      const createdBy = (req as any).user?.name || 'System';

      const pep = await this.educationService.createPEP({
        childId,
        organizationId,
        academicYear,
        term,
        reviewDate: new Date(reviewDate),
        schoolName,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        designatedTeacherName,
        designatedTeacherEmail,
        designatedTeacherPhone,
        virtualSchoolHeadName,
        virtualSchoolContactEmail,
        virtualSchoolContactPhone,
        meetingParticipants,
        currentAttendancePercentage,
        currentAttainment,
        strengths,
        areasForDevelopment,
        targets,
        homeworkArrangements,
        ppPlusAllocated,
        createdBy
      });

      return res.status(201).json({
        success: true,
        data: pep,
        message: 'Personal Education Plan created successfully'
      });

    } catch (error: any) {
      console.error('Error creating PEP:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create PEP'
      });
    }
  }

  /**
   * Get PEP details
   * 
   * GET /api/v1/education/peps/:id
   */
  async getPEP(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const pep = await this.educationService['pepRepository'].findOne({
        where: { id },
        relations: ['child']
      });

      if (!pep) {
        return res.status(404).json({
          success: false,
          error: 'PEP not found'
        });
      }

      return res.json({
        success: true,
        data: pep
      });

    } catch (error: any) {
      console.error('Error fetching PEP:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch PEP'
      });
    }
  }

  /**
   * Update PEP status
   * 
   * PUT /api/v1/education/peps/:id/status
   */
  async updatePEPStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = (req as any).user?.name || 'System';

      if (!Object.values(PEPStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      const pep = await this.educationService.updatePEPStatus(id, status, updatedBy);

      return res.json({
        success: true,
        data: pep,
        message: 'PEP status updated successfully'
      });

    } catch (error: any) {
      console.error('Error updating PEP status:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update PEP status'
      });
    }
  }

  /**
   * Update PEP target progress
   * 
   * PUT /api/v1/education/peps/:id/targets
   */
  async updateTargetProgress(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { targetNumber, progress, progressNotes } = req.body;
      const updatedBy = (req as any).user?.name || 'System';

      if (!targetNumber || !progress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const pep = await this.educationService.updateTargetProgress(
        id,
        targetNumber,
        progress,
        progressNotes,
        updatedBy
      );

      return res.json({
        success: true,
        data: pep,
        message: 'Target progress updated successfully'
      });

    } catch (error: any) {
      console.error('Error updating target progress:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update target progress'
      });
    }
  }

  /**
   * Record Pupil Premium Plus expenditure
   * 
   * POST /api/v1/education/peps/:id/pp-plus
   */
  async recordPPPlusExpenditure(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { item, amount, date, purpose, impactAssessment } = req.body;

      if (!item || !amount || !purpose) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const pep = await this.educationService.recordPPPlusExpenditure(id, {
        item,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        purpose,
        impactAssessment
      });

      return res.json({
        success: true,
        data: pep,
        message: 'Pupil Premium Plus expenditure recorded successfully'
      });

    } catch (error: any) {
      console.error('Error recording PP+ expenditure:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to record expenditure'
      });
    }
  }

  /**
   * Get overdue PEP reviews
   * 
   * GET /api/v1/education/peps/overdue
   */
  async getOverduePEPs(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).user?.organizationId;

      const overduePEPs = await this.educationService.getOverduePEPReviews(organizationId);

      return res.json({
        success: true,
        data: overduePEPs,
        count: overduePEPs.length
      });

    } catch (error: any) {
      console.error('Error fetching overdue PEPs:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch overdue PEPs'
      });
    }
  }

  // ========================================
  // SCHOOL PLACEMENT ENDPOINTS
  // ========================================

  /**
   * Create school placement
   * 
   * POST /api/v1/education/placements
   */
  async createSchoolPlacement(req: Request, res: Response): Promise<Response> {
    try {
      const {
        childId,
        placementType,
        startDate,
        institutionName,
        institutionAddress,
        institutionPostcode,
        institutionPhone,
        institutionEmail,
        headteacherName,
        yearGroup,
        travelArrangements
      } = req.body;

      if (!childId || !placementType || !startDate || !institutionName) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const organizationId = (req as any).user?.organizationId;
      const createdBy = (req as any).user?.name || 'System';

      const placement = await this.educationService.createSchoolPlacement({
        childId,
        organizationId,
        placementType,
        startDate: new Date(startDate),
        institutionName,
        institutionAddress,
        institutionPostcode,
        institutionPhone,
        institutionEmail,
        headteacherName,
        yearGroup,
        travelArrangements,
        createdBy
      });

      return res.status(201).json({
        success: true,
        data: placement,
        message: 'School placement created successfully'
      });

    } catch (error: any) {
      console.error('Error creating school placement:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create school placement'
      });
    }
  }

  /**
   * Get school placement details
   * 
   * GET /api/v1/education/placements/:id
   */
  async getSchoolPlacement(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const placement = await this.educationService['placementRepository'].findOne({
        where: { id },
        relations: ['child']
      });

      if (!placement) {
        return res.status(404).json({
          success: false,
          error: 'School placement not found'
        });
      }

      return res.json({
        success: true,
        data: placement
      });

    } catch (error: any) {
      console.error('Error fetching school placement:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch school placement'
      });
    }
  }

  /**
   * Record school exclusion
   * 
   * POST /api/v1/education/placements/:id/exclusion
   */
  async recordExclusion(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { date, duration, reason, circumstances, appealMade, appealOutcome } = req.body;

      if (!date || !duration || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const placement = await this.educationService.recordExclusion(id, {
        date: new Date(date),
        duration: Number(duration),
        reason,
        circumstances,
        appealMade,
        appealOutcome
      });

      return res.json({
        success: true,
        data: placement,
        message: 'Exclusion recorded successfully'
      });

    } catch (error: any) {
      console.error('Error recording exclusion:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to record exclusion'
      });
    }
  }

  /**
   * Update attendance
   * 
   * PUT /api/v1/education/placements/:id/attendance
   */
  async updateAttendance(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { attendancePercentage } = req.body;
      const updatedBy = (req as any).user?.name || 'System';

      if (attendancePercentage === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing attendance percentage'
        });
      }

      const placement = await this.educationService.updateAttendance(
        id,
        Number(attendancePercentage),
        updatedBy
      );

      return res.json({
        success: true,
        data: placement,
        message: 'Attendance updated successfully'
      });

    } catch (error: any) {
      console.error('Error updating attendance:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update attendance'
      });
    }
  }

  /**
   * Get placements at risk
   * 
   * GET /api/v1/education/placements/at-risk
   */
  async getPlacementsAtRisk(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).user?.organizationId;

      const placements = await this.educationService.getPlacementsAtRisk(organizationId);

      return res.json({
        success: true,
        data: placements,
        count: placements.length
      });

    } catch (error: any) {
      console.error('Error fetching at-risk placements:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch at-risk placements'
      });
    }
  }

  /**
   * Get children not in education (NEET)
   * 
   * GET /api/v1/education/neet
   */
  async getChildrenNotInEducation(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).user?.organizationId;

      const children = await this.educationService.getChildrenNotInEducation(organizationId);

      return res.json({
        success: true,
        data: children,
        count: children.length
      });

    } catch (error: any) {
      console.error('Error fetching NEET children:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch NEET children'
      });
    }
  }

  /**
   * Get education statistics
   * 
   * GET /api/v1/education/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).user?.organizationId;

      const statistics = await this.educationService.getEducationStatistics(organizationId);

      return res.json({
        success: true,
        data: statistics
      });

    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch statistics'
      });
    }
  }
}
