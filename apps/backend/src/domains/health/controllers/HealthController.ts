/**
 * ============================================================================
 * Health Controller
 * ============================================================================
 * 
 * @fileoverview REST API controller for health management operations including
 *               health assessments, medical consent, and healthcare coordination.
 * 
 * @module domains/health/controllers/HealthController
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides HTTP endpoints for managing health assessments (Initial and Review),
 * medical consent including Gillick competence, GP registration tracking,
 * immunization monitoring, and health statistics reporting. All endpoints
 * include comprehensive validation and error handling.
 * 
 * @compliance
 * - OFSTED Regulation 9 (Health and wellbeing)
 * - Statutory Guidance on Promoting the Health of Looked After Children 2015
 * - Children Act 1989
 * - Mental Capacity Act 2005
 * 
 * @endpoints
 * POST   /health/assessments/initial          - Request Initial Health Assessment
 * POST   /health/assessments/review           - Request Review Health Assessment
 * PUT    /health/assessments/:id/complete     - Complete health assessment
 * GET    /health/assessments/overdue          - Get overdue assessments
 * GET    /health/assessments/:id              - Get assessment by ID
 * POST   /health/consent                      - Record medical consent
 * PUT    /health/consent/:id/gillick          - Assess Gillick competence
 * PUT    /health/consent/:id/withdraw         - Withdraw consent
 * GET    /health/consent/child/:childId       - Get active consents for child
 * GET    /health/consent/review               - Get consents requiring review
 * GET    /health/statistics                   - Get health statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Request, Response } from 'express';
import { HealthService } from '../services/HealthService';
import { ConsentType, ConsentGivenBy } from '../entities/MedicalConsent';

export class HealthController {
  privatehealthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  // ========================================
  // HEALTH ASSESSMENT ENDPOINTS
  // ========================================

  /**
   * Request Initial Health Assessment
   * 
   * POST /health/assessments/initial
   * 
   * @param req.body.childId - Child ID
   * @param req.body.organizationId - Organization ID
   * @param req.body.requestedDate - Assessment request date
   * @returns 201 - Created assessment
   * @returns 400 - Validation error
   * @returns 500 - Server error
   */
  requestInitialHealthAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId, organizationId, requestedDate } = req.body;

      // Validation
      if (!childId || !organizationId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: childId, organizationId'
        });
        return;
      }

      const assessment = await this.healthService.requestInitialHealthAssessment({
        childId,
        organizationId,
        requestedDate: requestedDate ? new Date(requestedDate) : new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Initial Health Assessment requested successfully',
        data: assessment
      });
    } catch (error) {
      console.error('Error requesting Initial Health Assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request Initial Health Assessment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Request Review Health Assessment
   * 
   * POST /health/assessments/review
   * 
   * @param req.body.childId - Child ID
   * @param req.body.organizationId - Organization ID
   * @param req.body.childAge - Child's age
   * @param req.body.requestedDate - Assessment request date
   * @returns 201 - Created assessment
   * @returns 400 - Validation error
   * @returns 500 - Server error
   */
  requestReviewHealthAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId, organizationId, childAge, requestedDate } = req.body;

      if (!childId || !organizationId || childAge === undefined) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: childId, organizationId, childAge'
        });
        return;
      }

      const assessment = await this.healthService.requestReviewHealthAssessment({
        childId,
        organizationId,
        childAge: Number(childAge),
        requestedDate: requestedDate ? new Date(requestedDate) : new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Review Health Assessment requested successfully',
        data: assessment
      });
    } catch (error) {
      console.error('Error requesting Review Health Assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request Review Health Assessment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Complete health assessment
   * 
   * PUT /health/assessments/:id/complete
   * 
   * @param req.params.id - Assessment ID
   * @param req.body - Assessment completion data
   * @returns 200 - Updated assessment
   * @returns 400 - Validation error
   * @returns 404 - Assessment not found
   * @returns 500 - Server error
   */
  completeHealthAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        assessmentDate,
        assessedByName,
        assessedByRole,
        gpRegistered,
        heightCm,
        weightKg,
        immunizationsUpToDate,
        mentalHealthConcerns,
        recommendations,
        updatedBy
      } = req.body;

      // Validation
      if (!assessmentDate || !assessedByName || !assessedByRole || !updatedBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: assessmentDate, assessedByName, assessedByRole, updatedBy'
        });
        return;
      }

      const assessment = await this.healthService.completeHealthAssessment(id, {
        assessmentDate: new Date(assessmentDate),
        assessedByName,
        assessedByRole,
        gpRegistered: gpRegistered === true || gpRegistered === 'true',
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        immunizationsUpToDate: immunizationsUpToDate === true || immunizationsUpToDate === 'true',
        mentalHealthConcerns: mentalHealthConcerns === true || mentalHealthConcerns === 'true',
        recommendations,
        updatedBy
      });

      res.status(200).json({
        success: true,
        message: 'Health assessment completed successfully',
        data: assessment
      });
    } catch (error) {
      console.error('Error completing health assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete health assessment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get overdue health assessments
   * 
   * GET /health/assessments/overdue?organizationId=xxx
   * 
   * @param req.query.organizationId - Organization ID
   * @returns 200 - Array of overdue assessments
   * @returns 400 - Validation error
   * @returns 500 - Server error
   */
  getOverdueHealthAssessments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.query;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: organizationId'
        });
        return;
      }

      const assessments = await this.healthService.getOverdueHealthAssessments(
        organizationId as string
      );

      res.status(200).json({
        success: true,
        message: 'Overdue assessments retrieved successfully',
        data: assessments,
        count: assessments.length
      });
    } catch (error) {
      console.error('Error retrieving overdue assessments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve overdue assessments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // MEDICAL CONSENT ENDPOINTS
  // ========================================

  /**
   * Record medical consent
   * 
   * POST /health/consent
   * 
   * @param req.body - Consent details
   * @returns 201 - Created consent
   * @returns 400 - Validation error
   * @returns 500 - Server error
   */
  recordMedicalConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        childId,
        organizationId,
        consentType,
        specificTreatment,
        consentGivenBy,
        consenterName,
        consenterRelationship,
        childAge,
        gillickCompetent,
        validFrom,
        validUntil,
        createdBy
      } = req.body;

      // Validation
      if (!childId || !organizationId || !consentType || !consentGivenBy || 
          !consenterName || !consenterRelationship || childAge === undefined || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate consent type
      if (!Object.values(ConsentType).includes(consentType)) {
        res.status(400).json({
          success: false,
          message: `Invalid consent type. Must be one of: ${Object.values(ConsentType).join(', ')}`
        });
        return;
      }

      // Validate consent given by
      if (!Object.values(ConsentGivenBy).includes(consentGivenBy)) {
        res.status(400).json({
          success: false,
          message: `Invalid consentGivenBy. Must be one of: ${Object.values(ConsentGivenBy).join(', ')}`
        });
        return;
      }

      const consent = await this.healthService.recordMedicalConsent({
        childId,
        organizationId,
        consentType: consentType as ConsentType,
        specificTreatment,
        consentGivenBy: consentGivenBy as ConsentGivenBy,
        consenterName,
        consenterRelationship,
        childAge: Number(childAge),
        gillickCompetent: gillickCompetent === true || gillickCompetent === 'true',
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : undefined,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Medical consent recorded successfully',
        data: consent
      });
    } catch (error) {
      console.error('Error recording medical consent:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record medical consent',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Assess Gillick competence
   * 
   * PUT /health/consent/:id/gillick
   * 
   * @param req.params.id - Consent ID
   * @param req.body - Gillick assessment data
   * @returns 200 - Updated consent
   * @returns 400 - Validation error
   * @returns 404 - Consent not found
   * @returns 500 - Server error
   */
  assessGillickCompetence = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        gillickCompetent,
        assessedBy,
        assessmentNotes,
        criteriaMet
      } = req.body;

      // Validation
      if (gillickCompetent === undefined || !assessedBy || !assessmentNotes || !criteriaMet) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: gillickCompetent, assessedBy, assessmentNotes, criteriaMet'
        });
        return;
      }

      // Validate criteria structure
      const requiredCriteria = [
        'understandsAdvice',
        'cannotBePersuadedToInformParents',
        'likelyToContinueWithoutAdvice',
        'physicalOrMentalHealthAtRisk',
        'bestInterestsRequireTreatment'
      ];

      for (const criterion of requiredCriteria) {
        if (!(criterion in criteriaMet)) {
          res.status(400).json({
            success: false,
            message: `Missing criterion: ${criterion}`
          });
          return;
        }
      }

      const consent = await this.healthService.assessGillickCompetence(id, {
        gillickCompetent: gillickCompetent === true || gillickCompetent === 'true',
        assessedBy,
        assessmentNotes,
        criteriaMet
      });

      res.status(200).json({
        success: true,
        message: 'Gillick competence assessed successfully',
        data: consent
      });
    } catch (error) {
      console.error('Error assessing Gillick competence:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assess Gillick competence',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Withdraw medical consent
   * 
   * PUT /health/consent/:id/withdraw
   * 
   * @param req.params.id - Consent ID
   * @param req.body.withdrawnBy - Person withdrawing consent
   * @param req.body.withdrawalReason - Reason for withdrawal
   * @returns 200 - Updated consent
   * @returns 400 - Validation error
   * @returns 404 - Consent not found
   * @returns 500 - Server error
   */
  withdrawConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { withdrawnBy, withdrawalReason } = req.body;

      if (!withdrawnBy || !withdrawalReason) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: withdrawnBy, withdrawalReason'
        });
        return;
      }

      const consent = await this.healthService.withdrawConsent(id, {
        withdrawnBy,
        withdrawalReason
      });

      res.status(200).json({
        success: true,
        message: 'Consent withdrawn successfully',
        data: consent
      });
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw consent',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get active consents for child
   * 
   * GET /health/consent/child/:childId
   * 
   * @param req.params.childId - Child ID
   * @returns 200 - Array of active consents
   * @returns 500 - Server error
   */
  getActiveConsents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId } = req.params;

      const consents = await this.healthService.getActiveConsents(childId);

      res.status(200).json({
        success: true,
        message: 'Active consents retrieved successfully',
        data: consents,
        count: consents.length
      });
    } catch (error) {
      console.error('Error retrieving active consents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active consents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get consents requiring review
   * 
   * GET /health/consent/review?organizationId=xxx
   * 
   * @param req.query.organizationId - Organization ID
   * @returns 200 - Array of consents requiring review
   * @returns 400 - Validation error
   * @returns 500 - Server error
   */
  getConsentsRequiringReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.query;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: organizationId'
        });
        return;
      }

      const consents = await this.healthService.getConsentsRequiringReview(
        organizationId as string
      );

      res.status(200).json({
        success: true,
        message: 'Consents requiring review retrieved successfully',
        data: consents,
        count: consents.length
      });
    } catch (error) {
      console.error('Error retrieving consents requiring review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve consents requiring review',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // STATISTICS ENDPOINTS
  // ========================================

  /**
   * Get health statistics
   * 
   * GET /health/statistics?organizationId=xxx
   * 
   * @param req.query.organizationId - Organization ID
   * @returns 200 - Health statistics
   * @returns 400 - Validation error
   * @returns 500 - Server error
   */
  getHealthStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.query;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: organizationId'
        });
        return;
      }

      const statistics = await this.healthService.getHealthStatistics(
        organizationId as string
      );

      res.status(200).json({
        success: true,
        message: 'Health statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      console.error('Error retrieving health statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve health statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
