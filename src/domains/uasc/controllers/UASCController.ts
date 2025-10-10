/**
 * ============================================================================
 * UASC Controller
 * ============================================================================
 * 
 * @fileoverview Controller for UASC (Unaccompanied Asylum Seeking Children)
 * REST API endpoints.
 * 
 * @module domains/uasc/controllers/UASCController
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Handles HTTP requests for UASC management including profile management,
 * age assessments, immigration status tracking, and Home Office correspondence.
 * 
 * @compliance
 * - Immigration Act 2016
 * - Children Act 1989, Section 20
 * - OFSTED Regulation 17 (Records)
 * 
 * @features
 * - UASC profile CRUD operations
 * - Age assessment management
 * - Immigration status tracking
 * - Home Office correspondence management
 * - Statistical reporting
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Request, Response } from 'express';
import { UASCService } from '../services/UASCService';
import { 
  UASCStatus,
  ReferralSource,
  ArrivalRoute,
  TraffickinRiskLevel
} from '../entities/UASCProfile';
import {
  AssessmentStatus,
  AssessmentOutcome,
  AssessmentMethod
} from '../entities/AgeAssessment';
import {
  ImmigrationStatusType,
  AsylumClaimStatus,
  AppealStatus
} from '../entities/ImmigrationStatus';
import {
  CorrespondenceType,
  CorrespondenceDirection,
  CorrespondenceMethod,
  CorrespondenceStatus
} from '../entities/HomeOfficeCorrespondence';

export class UASCController {
  private uascService: UASCService;

  constructor() {
    this.uascService = new UASCService();
  }

  // ========================================
  // UASC PROFILE ENDPOINTS
  // ========================================

  /**
   * Create new UASC profile
   * POST /uasc/profiles
   */
  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const profile = await this.uascService.createUASCProfile(req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create UASC profile',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get UASC profile by ID
   * GET /uasc/profiles/:id
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const profile = await this.uascService.getUASCProfile(req.params.id);
      if (!profile) {
        res.status(404).json({ error: 'UASC profile not found' });
        return;
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get UASC profile',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get UASC profile by child ID
   * GET /uasc/profiles/child/:childId
   */
  async getProfileByChild(req: Request, res: Response): Promise<void> {
    try {
      const profile = await this.uascService.getUASCProfileByChild(
        req.params.childId
      );
      if (!profile) {
        res.status(404).json({ error: 'UASC profile not found for this child' });
        return;
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get UASC profile',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get all UASC profiles for organization
   * GET /uasc/profiles?organizationId=xxx&active=true
   */
  async getProfiles(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, active } = req.query;

      if (!organizationId) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      const profiles = active === 'true'
        ? await this.uascService.getActiveUASCProfiles(organizationId as string)
        : await this.uascService.getUASCProfiles(organizationId as string);

      res.json(profiles);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get UASC profiles',
        message: (error as Error).message
      });
    }
  }

  /**
   * Update UASC profile
   * PUT /uasc/profiles/:id
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const profile = await this.uascService.updateUASCProfile(
        req.params.id,
        req.body
      );
      res.json(profile);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update UASC profile',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get UASC profiles requiring attention
   * GET /uasc/profiles/attention/:organizationId
   */
  async getProfilesRequiringAttention(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const profiles = await this.uascService.getUASCProfilesRequiringAttention(
        req.params.organizationId
      );
      res.json(profiles);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get UASC profiles requiring attention',
        message: (error as Error).message
      });
    }
  }

  // ========================================
  // AGE ASSESSMENT ENDPOINTS
  // ========================================

  /**
   * Create age assessment
   * POST /uasc/age-assessments
   */
  async createAgeAssessment(req: Request, res: Response): Promise<void> {
    try {
      const assessment = await this.uascService.createAgeAssessment(req.body);
      res.status(201).json(assessment);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create age assessment',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get age assessment by ID
   * GET /uasc/age-assessments/:id
   */
  async getAgeAssessment(req: Request, res: Response): Promise<void> {
    try {
      const assessment = await this.uascService.getAgeAssessment(req.params.id);
      if (!assessment) {
        res.status(404).json({ error: 'Age assessment not found' });
        return;
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get age assessment',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get age assessments by UASC profile
   * GET /uasc/age-assessments/profile/:uascProfileId
   */
  async getAgeAssessmentsByProfile(req: Request, res: Response): Promise<void> {
    try {
      const assessments = await this.uascService.getAgeAssessmentsByProfile(
        req.params.uascProfileId
      );
      res.json(assessments);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get age assessments',
        message: (error as Error).message
      });
    }
  }

  /**
   * Update age assessment
   * PUT /uasc/age-assessments/:id
   */
  async updateAgeAssessment(req: Request, res: Response): Promise<void> {
    try {
      const assessment = await this.uascService.updateAgeAssessment(
        req.params.id,
        req.body
      );
      res.json(assessment);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update age assessment',
        message: (error as Error).message
      });
    }
  }

  /**
   * Complete age assessment
   * PUT /uasc/age-assessments/:id/complete
   */
  async completeAgeAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { outcome, assessedDateOfBirth, reasoningForDecision } = req.body;

      if (!outcome || !assessedDateOfBirth || !reasoningForDecision) {
        res.status(400).json({
          error: 'outcome, assessedDateOfBirth, and reasoningForDecision are required'
        });
        return;
      }

      const assessment = await this.uascService.completeAgeAssessment(
        req.params.id,
        outcome,
        new Date(assessedDateOfBirth),
        reasoningForDecision
      );

      res.json(assessment);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to complete age assessment',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get overdue age assessments
   * GET /uasc/age-assessments/overdue/:organizationId
   */
  async getOverdueAgeAssessments(req: Request, res: Response): Promise<void> {
    try {
      const assessments = await this.uascService.getOverdueAgeAssessments(
        req.params.organizationId
      );
      res.json(assessments);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get overdue age assessments',
        message: (error as Error).message
      });
    }
  }

  // ========================================
  // IMMIGRATION STATUS ENDPOINTS
  // ========================================

  /**
   * Create immigration status
   * POST /uasc/immigration-status
   */
  async createImmigrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.uascService.createImmigrationStatus(req.body);
      res.status(201).json(status);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create immigration status',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get immigration status by ID
   * GET /uasc/immigration-status/:id
   */
  async getImmigrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.uascService.getImmigrationStatus(req.params.id);
      if (!status) {
        res.status(404).json({ error: 'Immigration status not found' });
        return;
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get immigration status',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get current immigration status by UASC profile
   * GET /uasc/immigration-status/current/:uascProfileId
   */
  async getCurrentImmigrationStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const status = await this.uascService.getCurrentImmigrationStatus(
        req.params.uascProfileId
      );
      if (!status) {
        res.status(404).json({ error: 'No current immigration status found' });
        return;
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get current immigration status',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get immigration status history by UASC profile
   * GET /uasc/immigration-status/history/:uascProfileId
   */
  async getImmigrationStatusHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const history = await this.uascService.getImmigrationStatusHistory(
        req.params.uascProfileId
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get immigration status history',
        message: (error as Error).message
      });
    }
  }

  /**
   * Update immigration status
   * PUT /uasc/immigration-status/:id
   */
  async updateImmigrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.uascService.updateImmigrationStatus(
        req.params.id,
        req.body
      );
      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update immigration status',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get immigration statuses requiring attention
   * GET /uasc/immigration-status/attention/:organizationId
   */
  async getImmigrationStatusesRequiringAttention(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const statuses = await this.uascService.getImmigrationStatusesRequiringAttention(
        req.params.organizationId
      );
      res.json(statuses);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get immigration statuses requiring attention',
        message: (error as Error).message
      });
    }
  }

  // ========================================
  // HOME OFFICE CORRESPONDENCE ENDPOINTS
  // ========================================

  /**
   * Create correspondence
   * POST /uasc/correspondence
   */
  async createCorrespondence(req: Request, res: Response): Promise<void> {
    try {
      const correspondence = await this.uascService.createCorrespondence(req.body);
      res.status(201).json(correspondence);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create correspondence',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get correspondence by ID
   * GET /uasc/correspondence/:id
   */
  async getCorrespondence(req: Request, res: Response): Promise<void> {
    try {
      const correspondence = await this.uascService.getCorrespondence(
        req.params.id
      );
      if (!correspondence) {
        res.status(404).json({ error: 'Correspondence not found' });
        return;
      }
      res.json(correspondence);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get correspondence',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get correspondence by UASC profile
   * GET /uasc/correspondence/profile/:uascProfileId
   */
  async getCorrespondenceByProfile(req: Request, res: Response): Promise<void> {
    try {
      const correspondence = await this.uascService.getCorrespondenceByProfile(
        req.params.uascProfileId
      );
      res.json(correspondence);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get correspondence',
        message: (error as Error).message
      });
    }
  }

  /**
   * Update correspondence
   * PUT /uasc/correspondence/:id
   */
  async updateCorrespondence(req: Request, res: Response): Promise<void> {
    try {
      const correspondence = await this.uascService.updateCorrespondence(
        req.params.id,
        req.body
      );
      res.json(correspondence);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update correspondence',
        message: (error as Error).message
      });
    }
  }

  /**
   * Mark correspondence as sent
   * PUT /uasc/correspondence/:id/sent
   */
  async markCorrespondenceSent(req: Request, res: Response): Promise<void> {
    try {
      const { sentDate, sentBy } = req.body;

      if (!sentDate || !sentBy) {
        res.status(400).json({ error: 'sentDate and sentBy are required' });
        return;
      }

      const correspondence = await this.uascService.markCorrespondenceSent(
        req.params.id,
        new Date(sentDate),
        sentBy
      );

      res.json(correspondence);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to mark correspondence as sent',
        message: (error as Error).message
      });
    }
  }

  /**
   * Record response to correspondence
   * PUT /uasc/correspondence/:id/response
   */
  async recordResponse(req: Request, res: Response): Promise<void> {
    try {
      const { responseDate, responseSummary, responseOutcome } = req.body;

      if (!responseDate || !responseSummary || !responseOutcome) {
        res.status(400).json({
          error: 'responseDate, responseSummary, and responseOutcome are required'
        });
        return;
      }

      const correspondence = await this.uascService.recordResponse(
        req.params.id,
        new Date(responseDate),
        responseSummary,
        responseOutcome
      );

      res.json(correspondence);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to record response',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get overdue correspondence
   * GET /uasc/correspondence/overdue/:organizationId
   */
  async getOverdueCorrespondence(req: Request, res: Response): Promise<void> {
    try {
      const correspondence = await this.uascService.getOverdueCorrespondence(
        req.params.organizationId
      );
      res.json(correspondence);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get overdue correspondence',
        message: (error as Error).message
      });
    }
  }

  /**
   * Get correspondence requiring attention
   * GET /uasc/correspondence/attention/:organizationId
   */
  async getCorrespondenceRequiringAttention(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const correspondence = await this.uascService.getCorrespondenceRequiringAttention(
        req.params.organizationId
      );
      res.json(correspondence);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get correspondence requiring attention',
        message: (error as Error).message
      });
    }
  }

  // ========================================
  // STATISTICS ENDPOINT
  // ========================================

  /**
   * Get UASC statistics
   * GET /uasc/statistics/:organizationId
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await this.uascService.getUASCStatistics(
        req.params.organizationId
      );
      res.json(statistics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get UASC statistics',
        message: (error as Error).message
      });
    }
  }
}
