/**
 * @fileoverview Simple medication review service for care home management.
 * @module Medication/MedicationReviewService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Simple medication review service for care home management.
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Review Service for Care Home Management System
 * @module MedicationReviewService
 * @version 1.0.0
 * @author Care Home Management Team
 * @since 2025-01-01
 * 
 * @description Simple medication review service for care home management.
 */

import { Pool } from 'pg';





import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus, ResidentStatus } from '../entities/workforce/OvertimeRequest';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface MedicationReview {
  id: string;
  residentId: string;
  reviewType: 'ROUTINE' | 'EMERGENCY' | 'ADMISSION' | 'DISCHARGE';
  reviewDate: Date;
  reviewedBy: string;
  currentMedications: ReviewMedication[];
  findings: ReviewFinding[];
  recommendations: ReviewRecommendation[];
  actionPlan: ReviewAction[];
  overallAssessment: {
    effectiveness: number;
    safety: number;
    adherence: number;
    qualityOfLife: number;
    overallScore: number;
  };
  nextReviewDate: Date;
  status: OvertimeStatus.PENDING | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  effectiveness: number;
  adherence: number;
  sideEffects: string[];
  interactions: string[];
}

export interface ReviewFinding {
  id: string;
  type: 'EFFECTIVENESS' | 'SAFETY' | 'ADHERENCE' | 'INTERACTION' | 'SIDE_EFFECT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  medicationId?: string;
  evidence: string[];
}

export interface ReviewRecommendation {
  id: string;
  type: 'CONTINUE' | 'ADJUST' | 'DISCONTINUE' | 'ADD' | 'MONITOR';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  rationale: string;
  medicationId?: string;
  timeframe: string;
}

export interface ReviewAction {
  id: string;
  actionType: 'PRESCRIBE' | 'ADJUST' | 'DISCONTINUE' | 'MONITOR' | 'EDUCATE';
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: OvertimeStatus.PENDING | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  medicationId?: string;
}

export interface CreateMedicationReviewRequest {
  residentId: string;
  reviewType: 'ROUTINE' | 'EMERGENCY' | 'ADMISSION' | 'DISCHARGE';
  reviewedBy: string;
  currentMedications: ReviewMedication[];
  findings: ReviewFinding[];
  recommendations: ReviewRecommendation[];
  organizationId: string;
}

export class MedicationReviewService {
  private logger = logger;
  privatedb: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createMedicationReview(request: CreateMedicationReviewRequest): Promise<MedicationReview> {
    try {
      console.info('Creating medication review', { 
        residentId: request.residentId,
        reviewType: request.reviewType,
        reviewedBy: request.reviewedBy,
        organizationId: request.organizationId
      });

      // Validate required fields
      this.validateCreateRequest(request);

      const reviewId = uuidv4();
      const now = new Date();

      // Calculate overall assessment
      const overallAssessment = this.calculateOverallAssessment(
        request.currentMedications,
        request.findings
      );

      // Create action plan from recommendations
      const actionPlan = this.createActionPlan(request.recommendations, request.reviewedBy);

      // Calculate next review date
      const nextReviewDate = this.calculateNextReviewDate(request.reviewType, overallAssessment.overallScore);

      constreview: MedicationReview = {
        id: reviewId,
        residentId: request.residentId,
        reviewType: request.reviewType,
        reviewDate: now,
        reviewedBy: request.reviewedBy,
        currentMedications: request.currentMedications,
        findings: request.findings,
        recommendations: request.recommendations,
        actionPlan,
        overallAssessment,
        nextReviewDate,
        status: OvertimeStatus.PENDING,
        organizationId: request.organizationId,
        createdAt: now,
        updatedAt: now
      };

      // Store in database
      await this.storeMedicationReview(review, request.organizationId);

      console.info('Medication review created successfully', { 
        reviewId: review.id,
        residentId: request.residentId
      });

      return review;

    } catch (error: unknown) {
      console.error('Failed to create medication review', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        residentId: request.residentId 
      });
      throw new Error(`Failed to create medication review: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getMedicationReviews(
    residentId: string,
    pagination: { page: number; limit: number },
    organizationId: string
  ): Promise<{ reviews: MedicationReview[]; total: number; page: number; totalPages: number }> {
    try {
      this.logger.debug('Getting medication reviews', { residentId, pagination, organizationId });

      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM medication_reviews 
        WHERE resident_id = $1 AND organization_id = $2 AND deleted_at IS NULL
      `;
      const countResult = await this.db.query(countQuery, [residentId, organizationId]);
      const total = parseInt(countResult.rows[0].total);

      // Get reviews
      const reviewsQuery = `
        SELECT * FROM medication_reviews 
        WHERE resident_id = $1 AND organization_id = $2 AND deleted_at IS NULL
        ORDER BY review_date DESC
        LIMIT $3 OFFSET $4
      `;
      const reviewsResult = await this.db.query(reviewsQuery, [residentId, organizationId, limit, offset]);

      constreviews: MedicationReview[] = reviewsResult.rows.map(row => this.mapDbRowToReview(row));

      const totalPages = Math.ceil(total / limit);

      this.logger.debug('Medication reviews retrieved successfully', { 
        total: reviews.length,
        residentId
      });

      return {
        reviews,
        total,
        page,
        totalPages
      };

    } catch (error: unknown) {
      console.error('Failed to get medication reviews', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        residentId 
      });
      throw new Error(`Failed to get medication reviews: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getMedicationReviewById(reviewId: string, organizationId: string): Promise<MedicationReview | null> {
    try {
      this.logger.debug('Getting medication review by ID', { reviewId, organizationId });

      const query = `
        SELECT * FROM medication_reviews 
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.db.query(query, [reviewId, organizationId]);

      if (result.rows.length === 0) {
        return null;
      }

      const review = this.mapDbRowToReview(result.rows[0]);

      this.logger.debug('Medication review retrieved successfully', { reviewId });

      return review;

    } catch (error: unknown) {
      console.error('Failed to get medication review', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        reviewId 
      });
      throw new Error(`Failed to get medication review: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async updateReviewStatus(
    reviewId: string,
    status: string,
    notes: string,
    userId: string,
    organizationId: string
  ): Promise<any> {
    try {
      this.logger.debug('Updating review status', { reviewId, status, userId });

      const query = `
        UPDATE medication_reviews 
        SET status = $1, notes = $2, updated_at = $3, updated_by = $4
        WHERE id = $5 AND organization_id = $6 AND deleted_at IS NULL
      `;
      await this.db.query(query, [status, notes, new Date(), userId, reviewId, organizationId]);

      console.info('Review status updated successfully', { reviewId, status });

      return {
        success: true,
        message: 'Review status updated successfully'
      };

    } catch (error: unknown) {
      console.error('Failed to update review status', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        reviewId 
      });
      throw new Error(`Failed to update review status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private validateCreateRequest(request: CreateMedicationReviewRequest): void {
    consterrors: string[] = [];

    if (!request.residentId?.trim()) errors.push('Resident ID is required');
    if (!request.reviewType) errors.push('Review type is required');
    if (!request.reviewedBy?.trim()) errors.push('Reviewed by is required');
    if (!request.organizationId?.trim()) errors.push('Organization ID is required');

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private calculateOverallAssessment(
    medications: ReviewMedication[],
    findings: ReviewFinding[]
  ): MedicationReview['overallAssessment'] {
    const effectiveness = this.calculateAverageEffectiveness(medications);
    const safety = this.calculateSafetyScore(findings);
    const adherence = this.calculateAverageAdherence(medications);
    const qualityOfLife = this.calculateQualityOfLifeImpact(medications, findings);

    const overallScore = (effectiveness + safety + adherence + qualityOfLife) / 4;

    return {
      effectiveness,
      safety,
      adherence,
      qualityOfLife,
      overallScore
    };
  }

  private calculateAverageEffectiveness(medications: ReviewMedication[]): number {
    if (medications.length === 0) return 0;
    const total = medications.reduce((sum, med) => sum + med.effectiveness, 0);
    return total / medications.length;
  }

  private calculateSafetyScore(findings: ReviewFinding[]): number {
    const safetyFindings = findings.filter(f => f.type === 'SAFETY');
    if (safetyFindings.length === 0) return 100;

    const severityScores = { LOW: 20, MEDIUM: 40, HIGH: 60, CRITICAL: 80 };
    const totalScore = safetyFindings.reduce((sum, finding) => 
      sum + severityScores[finding.severity], 0);
    
    return Math.max(0, 100 - (totalScore / safetyFindings.length));
  }

  private calculateAverageAdherence(medications: ReviewMedication[]): number {
    if (medications.length === 0) return 0;
    const total = medications.reduce((sum, med) => sum + med.adherence, 0);
    return total / medications.length;
  }

  private calculateQualityOfLifeImpact(medications: ReviewMedication[], findings: ReviewFinding[]): number {
    // Simple calculation based on side effects and effectiveness
    const sideEffectCount = medications.reduce((sum, med) => sum + med.sideEffects.length, 0);
    const effectiveness = this.calculateAverageEffectiveness(medications);
    
    return Math.max(0, effectiveness - (sideEffectCount * 5));
  }

  private createActionPlan(recommendations: ReviewRecommendation[], reviewedBy: string): ReviewAction[] {
    return recommendations.map(rec => ({
      id: uuidv4(),
      actionType: this.mapRecommendationToAction(rec.type),
      description: rec.description,
      assignedTo: reviewedBy,
      dueDate: this.calculateActionDueDate(rec.priority, rec.timeframe),
      status: OvertimeStatus.PENDING as const,
      medicationId: rec.medicationId
    }));
  }

  private mapRecommendationToAction(type: ReviewRecommendation['type']): ReviewAction['actionType'] {
    const mapping = {
      'CONTINUE': 'MONITOR' as const,
      'ADJUST': 'ADJUST' as const,
      'DISCONTINUE': 'DISCONTINUE' as const,
      'ADD': 'PRESCRIBE' as const,
      'MONITOR': 'MONITOR' as const
    };
    return mapping[type] || 'MONITOR';
  }

  private calculateActionDueDate(priority: string, timeframe: string): Date {
    const now = new Date();
    const days = {
      'LOW': 30,
      'MEDIUM': 14,
      'HIGH': 7,
      'URGENT': 1
    };
    
    const daysToAdd = days[priority] || 14;
    now.setDate(now.getDate() + daysToAdd);
    return now;
  }

  private calculateNextReviewDate(reviewType: string, overallScore: number): Date {
    const now = new Date();
    let daysToAdd = 90; // Default 3 months

    if (overallScore < 50) {
      daysToAdd = 30; // Monthly for poor scores
    } else if (overallScore < 75) {
      daysToAdd = 60; // Bi-monthly for moderate scores
    }

    if (reviewType === 'EMERGENCY') {
      daysToAdd = 7; // Weekly for emergency reviews
    }

    now.setDate(now.getDate() + daysToAdd);
    return now;
  }

  private async storeMedicationReview(review: MedicationReview, organizationId: string): Promise<string> {
    try {
      const query = `
        INSERT INTO medication_reviews (
          id, resident_id, review_type, review_date, reviewed_by,
          current_medications, findings, recommendations, action_plan,
          overall_assessment, next_review_date, status, organization_id,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING id
      `;

      const values = [
        review.id,
        review.residentId,
        review.reviewType,
        review.reviewDate,
        review.reviewedBy,
        JSON.stringify(review.currentMedications),
        JSON.stringify(review.findings),
        JSON.stringify(review.recommendations),
        JSON.stringify(review.actionPlan),
        JSON.stringify(review.overallAssessment),
        review.nextReviewDate,
        review.status,
        organizationId,
        review.createdAt,
        review.updatedAt
      ];

      const result = await this.db.query(query, values);
      return result.rows[0].id;

    } catch (error: unknown) {
      console.error('Failed to store medication review', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new Error(`Failed to store medication review: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private mapDbRowToReview(row: any): MedicationReview {
    return {
      id: row.id,
      residentId: row.resident_id,
      reviewType: row.review_type,
      reviewDate: row.review_date,
      reviewedBy: row.reviewed_by,
      currentMedications: row.current_medications ? JSON.parse(row.current_medications) : [],
      findings: row.findings ? JSON.parse(row.findings) : [],
      recommendations: row.recommendations ? JSON.parse(row.recommendations) : [],
      actionPlan: row.action_plan ? JSON.parse(row.action_plan) : [],
      overallAssessment: row.overall_assessment ? JSON.parse(row.overall_assessment) : {
        effectiveness: 0,
        safety: 0,
        adherence: 0,
        qualityOfLife: 0,
        overallScore: 0
      },
      nextReviewDate: row.next_review_date,
      status: row.status,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
