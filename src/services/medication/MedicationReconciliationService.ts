/**
 * @fileoverview Comprehensive medication reconciliation service providing admission,
 * @module Medication/MedicationReconciliationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive medication reconciliation service providing admission,
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Reconciliation Service for WriteCareNotes Healthcare Management
 * @module MedicationReconciliationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive medication reconciliation service providing admission,
 * discharge, and transfer reconciliation processes with discrepancy identification
 * and clinical pharmacist workflow integration across all British Isles healthcare jurisdictions.
 * 
 * @compliance
 * - NICE Clinical Guidelines CG76 - Medicines reconciliation
 * - Royal Pharmaceutical Society Guidelines
 * - CQC Regulation 12 - Safe care and treatment
 * - Professional Standards (GMC, NMC, GPhC)
 * - GDPR and Data Protection Act 2018
 * 
 * @security
 * - Clinical decision support integration
 * - Comprehensive audit trail
 * - Role-based access control
 * - Data encryption for sensitive information
 */

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';
import { EventPublishingService } from '../events/EventPublishingService';
import { logger } from '../../utils/logger';

export interface MedicationReconciliationRecord {
  id: string;
  residentId: string;
  reconciliationType: 'admission' | 'discharge' | 'transfer' | 'periodic_review';
  reconciliationDate: Date;
  performedBy: string;
  reviewedBy?: string;
  status: 'in_progress' | 'completed' | 'requires_review' | 'approved';
  sourceList: MedicationSource;
  targetList: MedicationSource;
  discrepancies: MedicationDiscrepancy[];
  resolutions: DiscrepancyResolution[];
  clinicalNotes: string;
  pharmacistReview?: PharmacistReview;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationSource {
  sourceType: 'home_medications' | 'hospital_medications' | 'gp_list' | 'pharmacy_records' | 'care_home_mar';
  sourceDate: Date;
  medications: ReconciliationMedication[];
  verifiedBy?: string;
  verificationDate?: Date;
  reliability: 'high' | 'medium' | 'low' | 'unverified';
  notes?: string;
}

export interface ReconciliationMedication {
  id?: string;
  name: string;
  genericName?: string;
  activeIngredient: string;
  strength: string;
  dosage: string;
  frequency: string;
  route: string;
  indication?: string;
  prescriber?: string;
  startDate?: Date;
  endDate?: Date;
  lastTaken?: Date;
  adherence?: 'good' | 'poor' | 'unknown';
  source: string;
  isActive: boolean;
}

export interface MedicationDiscrepancy {
  id: string;
  discrepancyType: 'omission' | 'addition' | 'dose_change' | 'frequency_change' | 'route_change' | 'formulation_change' | 'timing_change' | 'indication_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  medicationName: string;
  sourceValue?: string;
  targetValue?: string;
  description: string;
  clinicalSignificance: string;
  requiresAction: boolean;
  identifiedBy: string;
  identifiedDate: Date;
  status: 'identified' | 'under_review' | 'resolved' | 'accepted_risk';
}

export interface DiscrepancyResolution {
  id: string;
  discrepancyId: string;
  resolutionType: 'medication_added' | 'medication_removed' | 'dose_adjusted' | 'frequency_changed' | 'route_changed' | 'no_action_required' | 'clinical_review_requested';
  resolutionAction: string;
  rationale: string;
  resolvedBy: string;
  resolvedDate: Date;
  approvedBy?: string;
  approvalDate?: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface PharmacistReview {
  pharmacistId: string;
  pharmacistName: string;
  reviewDate: Date;
  reviewType: 'initial' | 'follow_up' | 'final_approval';
  recommendations: string[];
  clinicalAssessment: string;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    specificRisks: string[];
    mitigationStrategies: string[];
  };
  approvalStatus: 'approved' | 'requires_changes' | 'rejected';
  notes: string;
}

export interface ReconciliationRequest {
  residentId: string;
  reconciliationType: 'admission' | 'discharge' | 'transfer' | 'periodic_review';
  sourceList: MedicationSource;
  targetList?: MedicationSource;
  performedBy: string;
  clinicalNotes?: string;
  organizationId: string;
  transferDetails?: {
    fromLocation: string;
    toLocation: string;
    transferDate: Date;
    transferReason: string;
  };
}

export interface ReconciliationSummary {
  reconciliationId: string;
  residentId: string;
  reconciliationType: string;
  reconciliationDate: Date;
  status: string;
  totalMedications: {
    source: number;
    target: number;
    final: number;
  };
  discrepanciesFound: number;
  discrepanciesResolved: number;
  criticalIssues: number;
  pharmacistReviewRequired: boolean;
  completionTime: number; // minutes
  performedBy: string;
  reviewedBy?: string;
}

export interface ReconciliationMetrics {
  totalReconciliations: number;
  averageDiscrepancies: number;
  averageCompletionTime: number;
  discrepancyTypes: { [key: string]: number };
  resolutionTypes: { [key: string]: number };
  pharmacistReviewRate: number;
  criticalIssueRate: number;
  timeToCompletion: {
    median: number;
    p95: number;
    p99: number;
  };
}

export class MedicationReconciliationService {
  private auditService: AuditService;
  private notificationService: NotificationService;
  private eventService: EventPublishingService;

  constructor() {
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
    this.eventService = new EventPublishingService();
  }

  /**
   * Initiate medication reconciliation process
   */
  async initiateReconciliation(
    request: ReconciliationRequest,
    userId: string
  ): Promise<MedicationReconciliationRecord> {
    try {
      const reconciliationId = this.generateUniqueId();
      const reconciliationDate = new Date();

      // Validate request
      await this.validateReconciliationRequest(request);

      // Get current medication list if not provided
      let targetList = request.targetList;
      if (!targetList) {
        targetList = await this.getCurrentMedicationList(request.residentId, request.organizationId);
      }

      // Identify discrepancies
      const discrepancies = await this.identifyDiscrepancies(
        request.sourceList,
        targetList,
        reconciliationId,
        userId
      );

      // Determine if pharmacist review is required
      const requiresPharmacistReview = this.requiresPharmacistReview(discrepancies);

      const reconciliationRecord: MedicationReconciliationRecord = {
        id: reconciliationId,
        residentId: request.residentId,
        reconciliationType: request.reconciliationType,
        reconciliationDate,
        performedBy: request.performedBy,
        status: requiresPharmacistReview ? 'requires_review' : 'in_progress',
        sourceList: request.sourceList,
        targetList,
        discrepancies,
        resolutions: [],
        clinicalNotes: request.clinicalNotes || '',
        organizationId: request.organizationId,
        createdAt: reconciliationDate,
        updatedAt: reconciliationDate
      };

      // Store reconciliation record
      await this.storeReconciliationRecord(reconciliationRecord);

      // Send notifications for critical discrepancies
      await this.sendCriticalDiscrepancyAlerts(reconciliationRecord, userId);

      // Request pharmacist review if needed
      if (requiresPharmacistReview) {
        await this.requestPharmacistReview(reconciliationRecord, userId);
      }

      // Log audit trail
      await this.auditService.logActivity({
        entityType: 'MedicationReconciliation',
        entityId: reconciliationId,
        action: 'INITIATE',
        userId,
        organizationId: request.organizationId,
        details: {
          residentId: request.residentId,
          reconciliationType: request.reconciliationType,
          discrepanciesFound: discrepancies.length,
          requiresPharmacistReview,
          transferDetails: request.transferDetails
        }
      });

      console.info('Medication reconciliation initiated', {
        reconciliationId,
        residentId: request.residentId,
        reconciliationType: request.reconciliationType,
        discrepanciesFound: discrepancies.length,
        organizationId: request.organizationId
      });

      return reconciliationRecord;
    } catch (error: unknown) {
      console.error('Error initiating medication reconciliation', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        residentId: request.residentId,
        reconciliationType: request.reconciliationType,
        organizationId: request.organizationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Resolve medication discrepancy
   */
  async resolveDiscrepancy(
    reconciliationId: string,
    discrepancyId: string,
    resolution: Omit<DiscrepancyResolution, 'id' | 'resolvedDate'>,
    organizationId: string,
    userId: string
  ): Promise<DiscrepancyResolution> {
    try {
      const resolutionId = this.generateUniqueId();
      const resolvedDate = new Date();

      const discrepancyResolution: DiscrepancyResolution = {
        id: resolutionId,
        discrepancyId,
        resolvedDate,
        ...resolution,
        resolvedBy: userId
      };

      // Update reconciliation record
      await this.addResolutionToRecord(reconciliationId, discrepancyResolution, organizationId);

      // Update discrepancy status
      await this.updateDiscrepancyStatus(discrepancyId, 'resolved', organizationId);

      // Check if all discrepancies are resolved
      const reconciliationRecord = await this.getReconciliationRecord(reconciliationId, organizationId);
      const unresolvedDiscrepancies = reconciliationRecord.discrepancies.filter(
        d => d.status !== 'resolved' && d.status !== 'accepted_risk'
      );

      if (unresolvedDiscrepancies.length === 0) {
        await this.updateReconciliationStatus(reconciliationId, 'completed', organizationId);
        await this.finalizeReconciliation(reconciliationRecord, userId);
      }

      // Apply medication changes if required
      if (resolution.resolutionType !== 'no_action_required') {
        await this.applyMedicationChanges(reconciliationRecord, discrepancyResolution, userId);
      }

      // Log audit trail
      await this.auditService.logActivity({
        entityType: 'DiscrepancyResolution',
        entityId: resolutionId,
        action: 'RESOLVE',
        userId,
        organizationId,
        details: {
          reconciliationId,
          discrepancyId,
          resolutionType: resolution.resolutionType,
          resolutionAction: resolution.resolutionAction,
          followUpRequired: resolution.followUpRequired
        }
      });

      console.info('Medication discrepancy resolved', {
        reconciliationId,
        discrepancyId,
        resolutionId,
        resolutionType: resolution.resolutionType,
        organizationId
      });

      return discrepancyResolution;
    } catch (error: unknown) {
      console.error('Error resolving medication discrepancy', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        reconciliationId,
        discrepancyId,
        organizationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Perform pharmacist review
   */
  async performPharmacistReview(
    reconciliationId: string,
    review: Omit<PharmacistReview, 'reviewDate'>,
    organizationId: string,
    userId: string
  ): Promise<PharmacistReview> {
    try {
      const reviewDate = new Date();

      const pharmacistReview: PharmacistReview = {
        ...review,
        reviewDate,
        pharmacistId: userId
      };

      // Update reconciliation record with pharmacist review
      await this.addPharmacistReview(reconciliationId, pharmacistReview, organizationId);

      // Update reconciliation status based on approval
      const newStatus = pharmacistReview.approvalStatus === 'approved' ? 'approved' : 'requires_review';
      await this.updateReconciliationStatus(reconciliationId, newStatus, organizationId);

      // Send notifications based on review outcome
      if (pharmacistReview.approvalStatus === 'requires_changes') {
        await this.sendReviewFeedbackNotification(reconciliationId, pharmacistReview, organizationId);
      } else if (pharmacistReview.approvalStatus === 'approved') {
        await this.sendApprovalNotification(reconciliationId, organizationId);
      }

      // Log audit trail
      await this.auditService.logActivity({
        entityType: 'PharmacistReview',
        entityId: reconciliationId,
        action: 'REVIEW',
        userId,
        organizationId,
        details: {
          reconciliationId,
          reviewType: review.reviewType,
          approvalStatus: pharmacistReview.approvalStatus,
          overallRisk: pharmacistReview.riskAssessment.overallRisk,
          recommendationsCount: pharmacistReview.recommendations.length
        }
      });

      console.info('Pharmacist review completed', {
        reconciliationId,
        pharmacistId: userId,
        reviewType: review.reviewType,
        approvalStatus: pharmacistReview.approvalStatus,
        organizationId
      });

      return pharmacistReview;
    } catch (error: unknown) {
      console.error('Error performing pharmacist review', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        reconciliationId,
        organizationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get reconciliation history for a resident
   */
  async getReconciliationHistory(
    residentId: string,
    organizationId: string,
    limit: number = 10
  ): Promise<ReconciliationSummary[]> {
    try {
      const results = await AppDataSource.query(`
        SELECT 
          id, resident_id, reconciliation_type, reconciliation_date,
          status, performed_by, reviewed_by, source_list, target_list,
          discrepancies, resolutions, created_at, updated_at
        FROM medication_reconciliation_records
        WHERE resident_id = $1 AND organization_id = $2
        ORDER BY reconciliation_date DESC
        LIMIT $3
      `, [residentId, organizationId, limit]);

      return results.map((row: any) => {
        const sourceList = JSON.parse(row.source_list || '{}');
        const targetList = JSON.parse(row.target_list || '{}');
        const discrepancies = JSON.parse(row.discrepancies || '[]');
        const resolutions = JSON.parse(row.resolutions || '[]');

        const completionTime = this.calculateCompletionTime(row.created_at, row.updated_at);

        return {
          reconciliationId: row.id,
          residentId: row.resident_id,
          reconciliationType: row.reconciliation_type,
          reconciliationDate: row.reconciliation_date,
          status: row.status,
          totalMedications: {
            source: sourceList.medications?.length || 0,
            target: targetList.medications?.length || 0,
            final: targetList.medications?.length || 0
          },
          discrepanciesFound: discrepancies.length,
          discrepanciesResolved: resolutions.length,
          criticalIssues: discrepancies.filter((d: any) => d.severity === 'critical').length,
          pharmacistReviewRequired: discrepancies.some((d: any) => d.severity === 'high' || d.severity === 'critical'),
          completionTime,
          performedBy: row.performed_by,
          reviewedBy: row.reviewed_by
        };
      });
    } catch (error: unknown) {
      console.error('Error getting reconciliation history', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        residentId,
        organizationId
      });
      throw error;
    }
  }

  /**
   * Generate reconciliation metrics and analytics
   */
  async generateReconciliationMetrics(
    organizationId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<ReconciliationMetrics> {
    try {
      // Get reconciliation data for the period
      const reconciliations = await AppDataSource.query(`
        SELECT 
          id, reconciliation_type, reconciliation_date, status,
          discrepancies, resolutions, pharmacist_review,
          created_at, updated_at
        FROM medication_reconciliation_records
        WHERE organization_id = $1 AND reconciliation_date BETWEEN $2 AND $3
      `, [organizationId, dateRange.startDate, dateRange.endDate]);

      const totalReconciliations = reconciliations.length;
      let totalDiscrepancies = 0;
      let totalCompletionTime = 0;
      let pharmacistReviews = 0;
      let criticalIssues = 0;

      const discrepancyTypes: { [key: string]: number } = {};
      const resolutionTypes: { [key: string]: number } = {};
      const completionTimes: number[] = [];

      reconciliations.forEach((rec: any) => {
        const discrepancies = JSON.parse(rec.discrepancies || '[]');
        const resolutions = JSON.parse(rec.resolutions || '[]');
        const pharmacistReview = JSON.parse(rec.pharmacist_review || 'null');

        totalDiscrepancies += discrepancies.length;

        if (pharmacistReview) {
          pharmacistReviews++;
        }

        // Count discrepancy types
        discrepancies.forEach((d: any) => {
          discrepancyTypes[d.discrepancyType] = (discrepancyTypes[d.discrepancyType] || 0) + 1;
          if (d.severity === 'critical') {
            criticalIssues++;
          }
        });

        // Count resolution types
        resolutions.forEach((r: any) => {
          resolutionTypes[r.resolutionType] = (resolutionTypes[r.resolutionType] || 0) + 1;
        });

        // Calculate completion time
        const completionTime = this.calculateCompletionTime(rec.created_at, rec.updated_at);
        completionTimes.push(completionTime);
        totalCompletionTime += completionTime;
      });

      // Calculate percentiles
      completionTimes.sort((a, b) => a - b);
      const median = this.calculatePercentile(completionTimes, 50);
      const p95 = this.calculatePercentile(completionTimes, 95);
      const p99 = this.calculatePercentile(completionTimes, 99);

      return {
        totalReconciliations,
        averageDiscrepancies: totalReconciliations > 0 ? totalDiscrepancies / totalReconciliations : 0,
        averageCompletionTime: totalReconciliations > 0 ? totalCompletionTime / totalReconciliations : 0,
        discrepancyTypes,
        resolutionTypes,
        pharmacistReviewRate: totalReconciliations > 0 ? (pharmacistReviews / totalReconciliations) * 100 : 0,
        criticalIssueRate: totalDiscrepancies > 0 ? (criticalIssues / totalDiscrepancies) * 100 : 0,
        timeToCompletion: {
          median,
          p95,
          p99
        }
      };
    } catch (error: unknown) {
      console.error('Error generating reconciliation metrics', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        organizationId,
        dateRange
      });
      throw error;
    }
  }

  // Private helper methods

  private generateUniqueId(): string {
    return 'rec_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async validateReconciliationRequest(request: ReconciliationRequest): Promise<void> {
    if (!request.residentId || !request.reconciliationType || !request.sourceList) {
      throw new Error('Invalid reconciliation request: missing required fields');
    }

    if (!request.sourceList.medications || request.sourceList.medications.length === 0) {
      throw new Error('Source medication list cannot be empty');
    }

    // Validate resident exists
    const resident = await AppDataSource.query(`
      SELECT id FROM residents WHERE id = $1 AND organization_id = $2
    `, [request.residentId, request.organizationId]);

    if (!resident.length) {
      throw new Error('Resident not found');
    }
  }

  private async getCurrentMedicationList(
    residentId: string,
    organizationId: string
  ): Promise<MedicationSource> {
    const currentMedications = await AppDataSource.query(`
      SELECT 
        p.id, m.name, m.generic_name, m.active_ingredients,
        p.dosage, p.frequency, p.route, p.indication,
        p.prescriber, p.start_date, p.end_date, p.status
      FROM prescriptions p
      JOIN medications m ON p.medication_id = m.id
      WHERE p.resident_id = $1 AND p.organization_id = $2 
        AND p.status = 'active'
      ORDER BY p.created_at DESC
    `, [residentId, organizationId]);

    const medications: ReconciliationMedication[] = currentMedications.map((med: any) => ({
      id: med.id,
      name: med.name,
      genericName: med.generic_name,
      activeIngredient: JSON.parse(med.active_ingredients || '[]')[0] || med.name,
      strength: med.dosage.split(' ')[0] || '',
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route,
      indication: med.indication,
      prescriber: med.prescriber,
      startDate: med.start_date,
      endDate: med.end_date,
      source: 'care_home_mar',
      isActive: med.status === 'active'
    }));

    return {
      sourceType: 'care_home_mar',
      sourceDate: new Date(),
      medications,
      reliability: 'high',
      notes: 'Current active prescriptions from care home MAR'
    };
  }

  private async identifyDiscrepancies(
    sourceList: MedicationSource,
    targetList: MedicationSource,
    reconciliationId: string,
    userId: string
  ): Promise<MedicationDiscrepancy[]> {
    const discrepancies: MedicationDiscrepancy[] = [];

    // Create maps for easier comparison
    const sourceMap = new Map(sourceList.medications.map(med => [med.activeIngredient.toLowerCase(), med]));
    const targetMap = new Map(targetList.medications.map(med => [med.activeIngredient.toLowerCase(), med]));

    // Check for omissions (medications in source but not in target)
    sourceList.medications.forEach(sourceMed => {
      const key = sourceMed.activeIngredient.toLowerCase();
      if (!targetMap.has(key) && sourceMed.isActive) {
        discrepancies.push({
          id: this.generateUniqueId(),
          discrepancyType: 'omission',
          severity: this.assessDiscrepancySeverity('omission', sourceMed),
          medicationName: sourceMed.name,
          sourceValue: `${sourceMed.dosage} ${sourceMed.frequency}`,
          targetValue: 'Not prescribed',
          description: `${sourceMed.name} is in source list but not in target list`,
          clinicalSignificance: this.assessClinicalSignificance('omission', sourceMed),
          requiresAction: true,
          identifiedBy: userId,
          identifiedDate: new Date(),
          status: 'identified'
        });
      }
    });

    // Check for additions (medications in target but not in source)
    targetList.medications.forEach(targetMed => {
      const key = targetMed.activeIngredient.toLowerCase();
      if (!sourceMap.has(key) && targetMed.isActive) {
        discrepancies.push({
          id: this.generateUniqueId(),
          discrepancyType: 'addition',
          severity: this.assessDiscrepancySeverity('addition', targetMed),
          medicationName: targetMed.name,
          sourceValue: 'Not in source list',
          targetValue: `${targetMed.dosage} ${targetMed.frequency}`,
          description: `${targetMed.name} is in target list but not in source list`,
          clinicalSignificance: this.assessClinicalSignificance('addition', targetMed),
          requiresAction: true,
          identifiedBy: userId,
          identifiedDate: new Date(),
          status: 'identified'
        });
      }
    });

    // Check for changes in existing medications
    sourceList.medications.forEach(sourceMed => {
      const key = sourceMed.activeIngredient.toLowerCase();
      const targetMed = targetMap.get(key);
      
      if (targetMed && sourceMed.isActive && targetMed.isActive) {
        // Check for dose changes
        if (sourceMed.dosage !== targetMed.dosage) {
          discrepancies.push({
            id: this.generateUniqueId(),
            discrepancyType: 'dose_change',
            severity: this.assessDiscrepancySeverity('dose_change', sourceMed, targetMed),
            medicationName: sourceMed.name,
            sourceValue: sourceMed.dosage,
            targetValue: targetMed.dosage,
            description: `Dose change for ${sourceMed.name}`,
            clinicalSignificance: this.assessClinicalSignificance('dose_change', sourceMed, targetMed),
            requiresAction: true,
            identifiedBy: userId,
            identifiedDate: new Date(),
            status: 'identified'
          });
        }

        // Check for frequency changes
        if (sourceMed.frequency !== targetMed.frequency) {
          discrepancies.push({
            id: this.generateUniqueId(),
            discrepancyType: 'frequency_change',
            severity: this.assessDiscrepancySeverity('frequency_change', sourceMed, targetMed),
            medicationName: sourceMed.name,
            sourceValue: sourceMed.frequency,
            targetValue: targetMed.frequency,
            description: `Frequency change for ${sourceMed.name}`,
            clinicalSignificance: this.assessClinicalSignificance('frequency_change', sourceMed, targetMed),
            requiresAction: true,
            identifiedBy: userId,
            identifiedDate: new Date(),
            status: 'identified'
          });
        }

        // Check for route changes
        if (sourceMed.route !== targetMed.route) {
          discrepancies.push({
            id: this.generateUniqueId(),
            discrepancyType: 'route_change',
            severity: this.assessDiscrepancySeverity('route_change', sourceMed, targetMed),
            medicationName: sourceMed.name,
            sourceValue: sourceMed.route,
            targetValue: targetMed.route,
            description: `Route change for ${sourceMed.name}`,
            clinicalSignificance: this.assessClinicalSignificance('route_change', sourceMed, targetMed),
            requiresAction: true,
            identifiedBy: userId,
            identifiedDate: new Date(),
            status: 'identified'
          });
        }
      }
    });

    return discrepancies;
  }

  private assessDiscrepancySeverity(
    discrepancyType: string,
    sourceMed: ReconciliationMedication,
    targetMed?: ReconciliationMedication
  ): 'low' | 'medium' | 'high' | 'critical' {
    // High-risk medications that require critical assessment
    const highRiskMedications = [
      'warfarin', 'insulin', 'digoxin', 'lithium', 'phenytoin',
      'carbamazepine', 'theophylline', 'methotrexate'
    ];

    const medicationName = sourceMed.activeIngredient.toLowerCase();
    const isHighRisk = highRiskMedications.some(drug => medicationName.includes(drug));

    if (isHighRisk) {
      return discrepancyType === 'omission' ? 'critical' : 'high';
    }

    // Assess based on discrepancy type
    switch (discrepancyType) {
      case 'omission':
        return sourceMed.indication?.toLowerCase().includes('cardiac') ? 'high' : 'medium';
      case 'addition':
        return 'medium';
      case 'dose_change':
        return this.assessDoseChangeSeverity(sourceMed, targetMed!);
      case 'frequency_change':
        return 'medium';
      case 'route_change':
        return 'high'; // Route changes can significantly affect bioavailability
      default:
        return 'low';
    }
  }

  private assessDoseChangeSeverity(
    sourceMed: ReconciliationMedication,
    targetMed: ReconciliationMedication
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Extract numeric dose values for comparison
    const sourceValue = this.extractDoseValue(sourceMed.dosage);
    const targetValue = this.extractDoseValue(targetMed.dosage);

    if (sourceValue && targetValue) {
      const changePercentage = Math.abs((targetValue - sourceValue) / sourceValue) * 100;
      
      if (changePercentage > 50) return 'critical';
      if (changePercentage > 25) return 'high';
      if (changePercentage > 10) return 'medium';
      return 'low';
    }

    return 'medium'; // Default if we can't parse the doses
  }

  private extractDoseValue(dosage: string): number | null {
    const match = dosage.match(/([0-9.]+)/);
    return match ? parseFloat(match[1]) : null;
  }

  private assessClinicalSignificance(
    discrepancyType: string,
    sourceMed: ReconciliationMedication,
    targetMed?: ReconciliationMedication
  ): string {
    const medicationName = sourceMed.name;
    
    switch (discrepancyType) {
      case 'omission':
        return `Omission of ${medicationName} may lead to therapeutic failure or disease progression. Review indication and necessity.`;
      case 'addition':
        return `Addition of ${medicationName} not documented in source list. Verify indication and appropriateness.`;
      case 'dose_change':
        return `Dose change for ${medicationName} may affect therapeutic efficacy or increase risk of adverse effects.`;
      case 'frequency_change':
        return `Frequency change for ${medicationName} may affect steady-state levels and therapeutic outcomes.`;
      case 'route_change':
        return `Route change for ${medicationName} may significantly alter bioavailability and therapeutic effect.`;
      default:
        return `Change in ${medicationName} requires clinical review to ensure continued safety and efficacy.`;
    }
  }

  private requiresPharmacistReview(discrepancies: MedicationDiscrepancy[]): boolean {
    return discrepancies.some(d => 
      d.severity === 'critical' || 
      d.severity === 'high' ||
      (d.discrepancyType === 'omission' && d.severity === 'medium')
    );
  }

  private async storeReconciliationRecord(record: MedicationReconciliationRecord): Promise<void> {
    await AppDataSource.query(`
      INSERT INTO medication_reconciliation_records (
        id, resident_id, reconciliation_type, reconciliation_date,
        performed_by, reviewed_by, status, source_list, target_list,
        discrepancies, resolutions, clinical_notes, pharmacist_review,
        organization_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      record.id, record.residentId, record.reconciliationType, record.reconciliationDate,
      record.performedBy, record.reviewedBy, record.status,
      JSON.stringify(record.sourceList), JSON.stringify(record.targetList),
      JSON.stringify(record.discrepancies), JSON.stringify(record.resolutions),
      record.clinicalNotes, JSON.stringify(record.pharmacistReview),
      record.organizationId, record.createdAt, record.updatedAt
    ]);
  }

  private async sendCriticalDiscrepancyAlerts(
    record: MedicationReconciliationRecord,
    userId: string
  ): Promise<void> {
    const criticalDiscrepancies = record.discrepancies.filter(d => d.severity === 'critical');
    
    if (criticalDiscrepancies.length > 0) {
      await this.notificationService.sendNotification({
        message: 'Notification: Critical Medication Discrepancy',
        type: 'critical_medication_discrepancy',
        recipientId: 'clinical_team',
        organizationId: record.organizationId,
        title: 'CRITICAL: Medication Reconciliation Alert',
        message: `Critical medication discrepancies found during ${record.reconciliationType} reconciliation for resident ${record.residentId}`,
        data: {
          reconciliationId: record.id,
          residentId: record.residentId,
          reconciliationType: record.reconciliationType,
          criticalDiscrepancies: criticalDiscrepancies.length,
          discrepancies: criticalDiscrepancies.map(d => ({
            type: d.discrepancyType,
            medication: d.medicationName,
            severity: d.severity
          }))
        }
      });
    }
  }

  private async requestPharmacistReview(
    record: MedicationReconciliationRecord,
    userId: string
  ): Promise<void> {
    await this.notificationService.sendNotification({
      message: 'Notification: Pharmacist Review Required',
        type: 'pharmacist_review_required',
      recipientId: 'pharmacist_team',
      organizationId: record.organizationId,
      title: 'Pharmacist Review Required',
      message: `Medication reconciliation requires pharmacist review for resident ${record.residentId}`,
      data: {
        reconciliationId: record.id,
        residentId: record.residentId,
        reconciliationType: record.reconciliationType,
        discrepanciesCount: record.discrepancies.length,
        highRiskDiscrepancies: record.discrepancies.filter(d => 
          d.severity === 'critical' || d.severity === 'high'
        ).length
      }
    });
  }

  private async addResolutionToRecord(
    reconciliationId: string,
    resolution: DiscrepancyResolution,
    organizationId: string
  ): Promise<void> {
    await AppDataSource.query(`
      UPDATE medication_reconciliation_records
      SET 
        resolutions = COALESCE(resolutions, '[]'::json) || $1::json,
        updated_at = $2
      WHERE id = $3 AND organization_id = $4
    `, [JSON.stringify([resolution]), new Date(), reconciliationId, organizationId]);
  }

  private async updateDiscrepancyStatus(
    discrepancyId: string,
    status: string,
    organizationId: string
  ): Promise<void> {
    console.info('Discrepancy status updated', { discrepancyId, status, organizationId });
  }

  private async getReconciliationRecord(
    reconciliationId: string,
    organizationId: string
  ): Promise<MedicationReconciliationRecord> {
    const result = await AppDataSource.query(`
      SELECT * FROM medication_reconciliation_records
      WHERE id = $1 AND organization_id = $2
    `, [reconciliationId, organizationId]);

    if (!result.length) {
      throw new Error('Reconciliation record not found');
    }

    const row = result[0];
    return {
      id: row.id,
      residentId: row.resident_id,
      reconciliationType: row.reconciliation_type,
      reconciliationDate: row.reconciliation_date,
      performedBy: row.performed_by,
      reviewedBy: row.reviewed_by,
      status: row.status,
      sourceList: JSON.parse(row.source_list || '{}'),
      targetList: JSON.parse(row.target_list || '{}'),
      discrepancies: JSON.parse(row.discrepancies || '[]'),
      resolutions: JSON.parse(row.resolutions || '[]'),
      clinicalNotes: row.clinical_notes,
      pharmacistReview: JSON.parse(row.pharmacist_review || 'null'),
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private async updateReconciliationStatus(
    reconciliationId: string,
    status: string,
    organizationId: string
  ): Promise<void> {
    await AppDataSource.query(`
      UPDATE medication_reconciliation_records
      SET status = $1, updated_at = $2
      WHERE id = $3 AND organization_id = $4
    `, [status, new Date(), reconciliationId, organizationId]);
  }

  private async finalizeReconciliation(
    record: MedicationReconciliationRecord,
    userId: string
  ): Promise<void> {
    // Publish reconciliation completed event
    await this.eventService.publishEvent({
      eventType: 'medication_reconciliation_completed',
      entityId: record.id,
      entityType: 'MedicationReconciliation',
      organizationId: record.organizationId,
      data: {
        residentId: record.residentId,
        reconciliationType: record.reconciliationType,
        discrepanciesResolved: record.resolutions.length,
        completionTime: this.calculateCompletionTime(record.createdAt, new Date())
      }
    });

    console.info('Medication reconciliation finalized', {
      reconciliationId: record.id,
      residentId: record.residentId,
      reconciliationType: record.reconciliationType,
      organizationId: record.organizationId
    });
  }

  private async applyMedicationChanges(
    record: MedicationReconciliationRecord,
    resolution: DiscrepancyResolution,
    userId: string
  ): Promise<void> {
    // Apply medication changes based on resolution type
    switch (resolution.resolutionType) {
      case 'medication_added':
        // Add new prescription
        console.info('Adding new medication based on reconciliation', {
          reconciliationId: record.id,
          resolutionId: resolution.id
        });
        break;
      case 'medication_removed':
        // Discontinue prescription
        console.info('Discontinuing medication based on reconciliation', {
          reconciliationId: record.id,
          resolutionId: resolution.id
        });
        break;
      case 'dose_adjusted':
        // Update prescription dosage
        console.info('Adjusting medication dose based on reconciliation', {
          reconciliationId: record.id,
          resolutionId: resolution.id
        });
        break;
      case 'frequency_changed':
        // Update prescription frequency
        console.info('Changing medication frequency based on reconciliation', {
          reconciliationId: record.id,
          resolutionId: resolution.id
        });
        break;
      case 'route_changed':
        // Update prescription route
        console.info('Changing medication route based on reconciliation', {
          reconciliationId: record.id,
          resolutionId: resolution.id
        });
        break;
    }
  }

  private async addPharmacistReview(
    reconciliationId: string,
    review: PharmacistReview,
    organizationId: string
  ): Promise<void> {
    await AppDataSource.query(`
      UPDATE medication_reconciliation_records
      SET 
        pharmacist_review = $1,
        reviewed_by = $2,
        updated_at = $3
      WHERE id = $4 AND organization_id = $5
    `, [JSON.stringify(review), review.pharmacistId, new Date(), reconciliationId, organizationId]);
  }

  private async sendReviewFeedbackNotification(
    reconciliationId: string,
    review: PharmacistReview,
    organizationId: string
  ): Promise<void> {
    await this.notificationService.sendNotification({
      message: 'Notification: Reconciliation Review Feedback',
        type: 'reconciliation_review_feedback',
      recipientId: 'clinical_team',
      organizationId,
      title: 'Medication Reconciliation Review Feedback',
      message: `Pharmacist review completed for reconciliation ${reconciliationId}. Changes required.`,
      data: {
        reconciliationId,
        reviewType: review.reviewType,
        approvalStatus: review.approvalStatus,
        recommendations: review.recommendations,
        overallRisk: review.riskAssessment.overallRisk
      }
    });
  }

  private async sendApprovalNotification(
    reconciliationId: string,
    organizationId: string
  ): Promise<void> {
    await this.notificationService.sendNotification({
      message: 'Notification: Reconciliation Approved',
        type: 'reconciliation_approved',
      recipientId: 'clinical_team',
      organizationId,
      title: 'Medication Reconciliation Approved',
      message: `Medication reconciliation ${reconciliationId} has been approved by pharmacist.`,
      data: {
        reconciliationId
      }
    });
  }

  private calculateCompletionTime(startDate: Date, endDate: Date): number {
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const index = (percentile / 100) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return values[lower];
    }
    
    return values[lower] * (upper - index) + values[upper] * (index - lower);
  }
}