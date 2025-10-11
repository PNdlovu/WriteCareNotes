/**
 * @fileoverview REST API controller for comprehensive medication review workflows with
 * @module Medication/MedicationReviewController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description REST API controller for comprehensive medication review workflows with
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Review Controller for WriteCareNotes Healthcare Management
 * @module MedicationReviewController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for comprehensive medication review workflows with
 * clinical insights, therapy effectiveness tracking, optimization recommendations,
 * and polypharmacy management across all British Isles jurisdictions.
 * 
 * @compliance
 * - England: NICE Medication Review Guidelines, CQC Medication Standards
 * - Scotland: NICE Guidelines, Care Inspectorate Medication Review Standards
 * - Wales: NICE Guidelines, CIW Medication Review Requirements
 * - Northern Ireland: NICE Guidelines, RQIA Medication Review Standards
 * - Republic of Ireland: HIQA Medication Review Framework, HSE Guidelines
 * - Isle of Man: DHSC Medication Review Guidelines
 * - Guernsey: Committee for Health & Social Care Review Standards
 * - Jersey: Care Commission Medication Review Requirements
 * - GMC Good Practice in Prescribing and Managing Medicines
 * - MHRA Pharmacovigilance Guidelines
 * 
 * @security
 * - Clinical data encryption with field-level protection
 * - Role-based access control for review operations
 * - Comprehensive audit trails for all review activities
 * - Evidence-based recommendations with clinical validation
 * - Secure handling of sensitive clinical assessment data
 */

import { Request, Response } from 'express';
import { 
  MedicationReviewService, 
  MedicationReview,
  TherapyEffectiveness,
  PolypharmacyAssessment,
  OptimizationOpportunity
} from '../../services/medication/MedicationReviewService';
import { logger } from '../../utils/logger';

/**
 * Controller class for medication review and optimization operations
 * Handles HTTP requests for comprehensive medication reviews, therapy effectiveness
 * assessment, polypharmacy evaluation, and optimization opportunity identification
 * with evidence-based clinical insights across all British Isles jurisdictions.
 */
export class MedicationReviewController {
  privatereviewService: MedicationReviewService;

  constructor() {
    this.reviewService = new MedicationReviewService();
  }

  /**
   * Create comprehensive medication review
   */
  async createMedicationReview(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { residentId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!residentId) {
        res.status(400).json({ error: 'Resident ID is required' });
        return;
      }

      const {
        reviewType,
        reviewedBy,
        reviewerRole,
        reviewerQualifications,
        clinicalIndications,
        followUpRequired,
        followUpDate
      } = req.body;

      // Validate required fields
      if (!reviewType || !reviewedBy || !reviewerRole || !clinicalIndications) {
        res.status(400).json({ 
          error: 'Missing required fields: reviewType, reviewedBy, reviewerRole, clinicalIndications' 
        });
        return;
      }

      // Validate review type
      const validReviewTypes = ['routine', 'clinical_change', 'adverse_event', 'polypharmacy', 'admission', 'discharge'];
      if (!validReviewTypes.includes(reviewType)) {
        res.status(400).json({ 
          error: 'Invalid review type. Must be one of: ' + validReviewTypes.join(', ')
        });
        return;
      }

      // Validate follow-up date if required
      letfollowUpDateTime: Date | undefined;
      if (followUpRequired && followUpDate) {
        followUpDateTime = new Date(followUpDate);
        if (isNaN(followUpDateTime.getTime())) {
          res.status(400).json({ error: 'Invalid follow-up date format' });
          return;
        }
        if (followUpDateTime <= new Date()) {
          res.status(400).json({ error: 'Follow-up date must be in the future' });
          return;
        }
      }

      const reviewData = {
        reviewType,
        reviewedBy,
        reviewerRole,
        reviewerQualifications: reviewerQualifications || [],
        clinicalIndications,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDateTime
      };

      const review = await this.reviewService.createMedicationReview(
        residentId,
        reviewData,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Medication review created successfully',
        data: review
      });
    } catch (error: unknown) {
      console.error('Error in createMedicationReview controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to create medication review' });
      }
    }
  }

  /**
   * Assess therapy effectiveness for a medication
   */
  async assessTherapyEffectiveness(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const { residentId, medicationId } = req.params;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!residentId || !medicationId) {
        res.status(400).json({ error: 'Resident ID and Medication ID are required' });
        return;
      }

      const timeframeDays = parseInt(req.query['timeframeDays'] as string) || 30;

      if (timeframeDays < 1 || timeframeDays > 365) {
        res.status(400).json({ 
          error: 'Timeframe days must be between 1 and 365' 
        });
        return;
      }

      const effectiveness = await this.reviewService.assessTherapyEffectiveness(
        medicationId,
        residentId,
        organizationId,
        timeframeDays
      );

      res.json({
        message: 'Therapy effectiveness assessed successfully',
        data: effectiveness
      });
    } catch (error: unknown) {
      console.error('Error in assessTherapyEffectiveness controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to assess therapy effectiveness' });
      }
    }
  }

  /**
   * Perform polypharmacy assessment
   */
  async performPolypharmacyAssessment(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const { residentId } = req.params;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!residentId) {
        res.status(400).json({ error: 'Resident ID is required' });
        return;
      }

      const assessment = await this.reviewService.performPolypharmacyAssessment(
        residentId,
        organizationId
      );

      res.json({
        message: 'Polypharmacy assessment completed successfully',
        data: assessment
      });
    } catch (error: unknown) {
      console.error('Error in performPolypharmacyAssessment controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to perform polypharmacy assessment' });
    }
  }

  /**
   * Identify optimization opportunities
   */
  async identifyOptimizationOpportunities(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const { residentId } = req.params;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!residentId) {
        res.status(400).json({ error: 'Resident ID is required' });
        return;
      }

      const opportunities = await this.reviewService.identifyOptimizationOpportunities(
        residentId,
        organizationId
      );

      res.json({
        message: 'Optimization opportunities identified successfully',
        data: {
          opportunities,
          totalOpportunities: opportunities.length,
          criticalOpportunities: opportunities.filter(o => o.priority === 'critical').length,
          highPriorityOpportunities: opportunities.filter(o => o.priority === 'high').length,
          estimatedCostSavings: opportunities.reduce((sum, o) => sum + (o.costImpact || 0), 0)
        }
      });
    } catch (error: unknown) {
      console.error('Error in identifyOptimizationOpportunities controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to identify optimization opportunities' });
    }
  }

  /**
   * Get medication reviews for a resident
   */
  async getMedicationReviews(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const { residentId } = req.params;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!residentId) {
        res.status(400).json({ error: 'Resident ID is required' });
        return;
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 50);

      // Get medication reviews from database
      const reviews = await this.medicationReviewService.getMedicationReviews(
        residentId,
        { page, limit },
        req.user!.organizationId!
      );

      res.json({
        message: 'Medication reviews retrieved successfully',
        data: reviews
      });
    } catch (error: unknown) {
      console.error('Error in getMedicationReviews controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve medication reviews' });
    }
  }

  /**
   * Get a specific medication review
   */
  async getMedicationReviewById(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const { reviewId } = req.params;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!reviewId) {
        res.status(400).json({ error: 'Review ID is required' });
        return;
      }

      // Get medication review by ID from database
      const review = await this.medicationReviewService.getMedicationReviewById(
        reviewId,
        req.user!.organizationId!
      );

      if (!review) {
        res.status(404).json({ error: 'Medication review not found' });
        return;
      }

      res.json({
        message: 'Medication review retrieved successfully',
        data: review
      });
    } catch (error: unknown) {
      console.error('Error in getMedicationReviewById controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve medication review' });
    }
  }

  /**
   * Update medication review status
   */
  async updateReviewStatus(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { reviewId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!reviewId) {
        res.status(400).json({ error: 'Review ID is required' });
        return;
      }

      const { status, notes } = req.body;

      // Validate status
      const validStatuses = ['draft', 'completed', 'approved', 'implemented'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
        return;
      }

      // Update review status in database
      const updatedReview = await this.medicationReviewService.updateReviewStatus(
        reviewId,
        status,
        notes,
        userId,
        req.user!.organizationId!
      );

      res.json({
        message: 'Review status updated successfully',
        data: updatedReview
      });
    } catch (error: unknown) {
      console.error('Error in updateReviewStatus controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to update review status' });
      }
    }
  }
}
