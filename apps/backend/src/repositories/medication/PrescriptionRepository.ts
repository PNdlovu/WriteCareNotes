import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Prescription Repository for WriteCareNotes Healthcare Management
 * @module PrescriptionRepository
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Data access layer for prescription management with optimized queries
 * and healthcare-specific database operations.
 * 
 * @compliance
 * - GDPR Data Protection Regulation
 * - Healthcare data retention policies
 * - Audit trail requirements
 */

import { Repository, DataSource, SelectQueryBuilder, Between, In, IsNull } from 'typeorm';
import { Prescription, PrescriptionStatus, PrescriptionType } from '@/entities/medication/Prescription';
import { logger } from '@/utils/logger';

/**
 * Advanced prescription search criteria
 */
export interface PrescriptionSearchCriteria {
  residentIds?: string[];
  medicationIds?: string[];
  statuses?: PrescriptionStatus[];
  prescriptionTypes?: PrescriptionType[];
  prescriberIds?: string[];
  startDateRange?: { from: Date; to: Date };
  endDateRange?: { from: Date; to: Date };
  reviewDateRange?: { from: Date; to: Date };
  requiresMonitoring?: boolean;
  isExpired?: boolean;
  isDueForReview?: boolean;
  organizationId: string;
  tenantId: string;
}

/**
 * Prescription statistics interface
 */
export interface PrescriptionStatistics {
  totalActive: number;
  totalExpired: number;
  totalDiscontinued: number;
  dueForReview: number;
  requiresMonitoring: number;
  byTherapeuticClass: Record<string, number>;
  byPrescriptionType: Record<string, number>;
  averageDuration: number;
}

/**
 * Prescription Repository with healthcare-optimized queries
 */
export class PrescriptionRepository {
  privaterepository: Repository<Prescription>;

  const ructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Prescription);
  }

  /**
   * Find prescription by ID with relations
   */
  async findById(
    id: string,
    organizationId: string,
    tenantId: string,
    includeRelations: boolean = true
  ): Promise<Prescription | null> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('prescription')
        .where('prescription.id = :id', { id })
        .andWhere('prescription.organizationId = :organizationId', { organizationId })
        .andWhere('prescription.tenantId = :tenantId', { tenantId })
        .andWhere('prescription.deletedAt IS NULL');

      if (includeRelations) {
        queryBuilder
          .leftJoinAndSelect('prescription.medication', 'medication')
          .leftJoinAndSelect('prescription.resident', 'resident');
      }

      return await queryBuilder.getOne();

    } catch (error: unknown) {
      console.error('Failed to find prescription by ID', { error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    }
  }

  /**
   * Advanced prescription search with multiple criteria
   */
  async searchPrescriptions(
    criteria: PrescriptionSearchCriteria,
    page: number = 1,
    limit: number = 50,
    orderBy: string = 'createdAt',
    orderDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    try {
      const queryBuilder = this.createSearchQueryBuilder(criteria);

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination and ordering
      const prescriptions = await queryBuilder
        .orderBy(`prescription.${orderBy}`, orderDirection)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return { prescriptions, total };

    } catch (error: unknown) {
      console.error('Failed to search prescriptions', { error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    }
  }

  /**
   * Get active prescriptions for multiple residents
   */
  async getActivePrescriptionsByResidents(
    residentIds: string[],
    organizationId: string,
    tenantId: string
  ): Promise<Prescription[]> {
    try {
      return await this.repository.find({
        where: {
          residentId: In(residentIds),
          status: PrescriptionStatus.ACTIVE,
          organizationId,
          tenantId,
          deletedAt: IsNull()
        },
        relations: ['medication', 'resident'],
        order: { createdAt: 'DESC' }
      });

    } catch (error: unknown) {
      console.error('Failed to get active prescriptions by residents', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        residentIds 
      });
      throw error;
    }
  }

  /**
   * Get prescriptions by medication with usage statistics
   */
  async getPrescriptionsByMedication(
    medicationId: string,
    organizationId: string,
    tenantId: string,
    includeInactive: boolean = false
  ): Promise<{
    prescriptions: Prescription[];
    statistics: {
      totalPrescriptions: number;
      activePrescriptions: number;
      averageDuration: number;
      mostCommonDosage: string;
    };
  }> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('prescription')
        .leftJoinAndSelect('prescription.resident', 'resident')
        .where('prescription.medicationId = :medicationId', { medicationId })
        .andWhere('prescription.organizationId = :organizationId', { organizationId })
        .andWhere('prescription.tenantId = :tenantId', { tenantId })
        .andWhere('prescription.deletedAt IS NULL');

      if (!includeInactive) {
        queryBuilder.andWhere('prescription.status = :status', { status: PrescriptionStatus.ACTIVE });
      }

      const prescriptions = await queryBuilder
        .orderBy('prescription.createdAt', 'DESC')
        .getMany();

      // Calculate statistics
      const totalPrescriptions = prescriptions.length;
      const activePrescriptions = prescriptions.filter(p => p.status === PrescriptionStatus.ACTIVE).length;
      
      const durations = prescriptions
        .filter(p => p.durationDays)
        .map(p => p.durationDays!);
      const averageDuration = durations.length > 0 
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
        : 0;

      // Find most common dosage
      const dosageMap = new Map<string, number>();
      prescriptions.forEach(p => {
        const dosageKey = `${p.dosage.amount}${p.dosage.unit} ${p.dosage.frequency}`;
        dosageMap.set(dosageKey, (dosageMap.get(dosageKey) || 0) + 1);
      });
      
      const mostCommonDosage = Array.from(dosageMap.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        prescriptions,
        statistics: {
          totalPrescriptions,
          activePrescriptions,
          averageDuration,
          mostCommonDosage
        }
      };

    } catch (error: unknown) {
      console.error('Failed to get prescriptions by medication', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        medicationId 
      });
      throw error;
    }
  }

  /**
   * Get prescriptions due for review
   */
  async getPrescriptionsDueForReview(
    organizationId: string,
    tenantId: string,
    daysAhead: number = 7
  ): Promise<Prescription[]> {
    try {
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + daysAhead);

      return await this.repository.find({
        where: {
          status: PrescriptionStatus.ACTIVE,
          reviewDate: Between(new Date(), reviewDate),
          organizationId,
          tenantId,
          deletedAt: IsNull()
        },
        relations: ['medication', 'resident'],
        order: { reviewDate: 'ASC' }
      });

    } catch (error: unknown) {
      console.error('Failed to get prescriptions due for review', { 
        error: error instanceof Error ? error.message : "Unknown error",
        organizationId,
        tenantId,
        daysAhead
      });
      throw error;
    }
  }

  /**
   * Get expired prescriptions
   */
  async getExpiredPrescriptions(
    organizationId: string,
    tenantId: string
  ): Promise<Prescription[]> {
    try {
      const today = new Date();
      
      return await this.repository.createQueryBuilder('prescription')
        .leftJoinAndSelect('prescription.medication', 'medication')
        .leftJoinAndSelect('prescription.resident', 'resident')
        .where('prescription.status = :status', { status: PrescriptionStatus.ACTIVE })
        .andWhere('prescription.endDate < :today', { today })
        .andWhere('prescription.organizationId = :organizationId', { organizationId })
        .andWhere('prescription.tenantId = :tenantId', { tenantId })
        .andWhere('prescription.deletedAt IS NULL')
        .orderBy('prescription.endDate', 'ASC')
        .getMany();

    } catch (error: unknown) {
      console.error('Failed to get expired prescriptions', { 
        error: error instanceof Error ? error.message : "Unknown error",
        organizationId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Get prescription statistics for dashboard
   */
  async getPrescriptionStatistics(
    organizationId: string,
    tenantId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<PrescriptionStatistics> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('prescription')
        .leftJoin('prescription.medication', 'medication')
        .where('prescription.organizationId = :organizationId', { organizationId })
        .andWhere('prescription.tenantId = :tenantId', { tenantId })
        .andWhere('prescription.deletedAt IS NULL');

      if (dateRange) {
        queryBuilder.andWhere('prescription.createdAt BETWEEN :from AND :to', {
          from: dateRange.from,
          to: dateRange.to
        });
      }

      const prescriptions = await queryBuilder
        .select([
          'prescription.status',
          'prescription.prescriptionType',
          'prescription.durationDays',
          'prescription.requiresMonitoring',
          'prescription.reviewDate',
          'medication.therapeuticClass'
        ])
        .getMany();

      // Calculate statistics
      const totalActive = prescriptions.filter(p => p.status === PrescriptionStatus.ACTIVE).length;
      const totalExpired = prescriptions.filter(p => p.status === PrescriptionStatus.EXPIRED).length;
      const totalDiscontinued = prescriptions.filter(p => p.status === PrescriptionStatus.DISCONTINUED).length;
      
      const today = new Date();
      const dueForReview = prescriptions.filter(p => 
        p.reviewDate && p.reviewDate <= today && p.status === PrescriptionStatus.ACTIVE
      ).length;
      
      const requiresMonitoring = prescriptions.filter(p => p.requiresMonitoring).length;

      // Group by therapeutic class
      const byTherapeuticClass: Record<string, number> = {};
      prescriptions.forEach(p => {
        if (p.medication?.therapeuticClass) {
          const className = p.medication.therapeuticClass;
          byTherapeuticClass[className] = (byTherapeuticClass[className] || 0) + 1;
        }
      });

      // Group by prescription type
      const byPrescriptionType: Record<string, number> = {};
      prescriptions.forEach(p => {
        const type = p.prescriptionType;
        byPrescriptionType[type] = (byPrescriptionType[type] || 0) + 1;
      });

      // Calculate average duration
      const durationsWithValues = prescriptions
        .filter(p => p.durationDays)
        .map(p => p.durationDays!);
      const averageDuration = durationsWithValues.length > 0
        ? durationsWithValues.reduce((sum, duration) => sum + duration, 0) / durationsWithValues.length
        : 0;

      return {
        totalActive,
        totalExpired,
        totalDiscontinued,
        dueForReview,
        requiresMonitoring,
        byTherapeuticClass,
        byPrescriptionType,
        averageDuration
      };

    } catch (error: unknown) {
      console.error('Failed to get prescription statistics', { 
        error: error instanceof Error ? error.message : "Unknown error",
        organizationId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Bulk update prescription statuses
   */
  async bulkUpdateStatus(
    prescriptionIds: string[],
    newStatus: PrescriptionStatus,
    userId: string,
    organizationId: string,
    tenantId: string
  ): Promise<number> {
    try {
      const result = await this.repository.update(
        {
          id: In(prescriptionIds),
          organizationId,
          tenantId
        },
        {
          status: newStatus,
          updatedBy: userId,
          updatedAt: new Date()
        }
      );

      return result.affected || 0;

    } catch (error: unknown) {
      console.error('Failed to bulk update prescription statuses', { 
        error: error instanceof Error ? error.message : "Unknown error",
        prescriptionIds,
        newStatus
      });
      throw error;
    }
  }

  /**
   * Create search query builder with criteria
   */
  private createSearchQueryBuilder(criteria: PrescriptionSearchCriteria): SelectQueryBuilder<Prescription> {
    const queryBuilder = this.repository.createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.medication', 'medication')
      .leftJoinAndSelect('prescription.resident', 'resident')
      .where('prescription.organizationId = :organizationId', { organizationId: criteria.organizationId })
      .andWhere('prescription.tenantId = :tenantId', { tenantId: criteria.tenantId })
      .andWhere('prescription.deletedAt IS NULL');

    // Apply filters
    if (criteria.residentIds?.length) {
      queryBuilder.andWhere('prescription.residentId IN (:...residentIds)', { 
        residentIds: criteria.residentIds 
      });
    }

    if (criteria.medicationIds?.length) {
      queryBuilder.andWhere('prescription.medicationId IN (:...medicationIds)', { 
        medicationIds: criteria.medicationIds 
      });
    }

    if (criteria.statuses?.length) {
      queryBuilder.andWhere('prescription.status IN (:...statuses)', { 
        statuses: criteria.statuses 
      });
    }

    if (criteria.prescriptionTypes?.length) {
      queryBuilder.andWhere('prescription.prescriptionType IN (:...types)', { 
        types: criteria.prescriptionTypes 
      });
    }

    if (criteria.prescriberIds?.length) {
      queryBuilder.andWhere('prescription.prescriberInfo->>\'id\' IN (:...prescriberIds)', { 
        prescriberIds: criteria.prescriberIds 
      });
    }

    if (criteria.startDateRange) {
      queryBuilder.andWhere('prescription.startDate BETWEEN :startFrom AND :startTo', {
        startFrom: criteria.startDateRange.from,
        startTo: criteria.startDateRange.to
      });
    }

    if (criteria.endDateRange) {
      queryBuilder.andWhere('prescription.endDate BETWEEN :endFrom AND :endTo', {
        endFrom: criteria.endDateRange.from,
        endTo: criteria.endDateRange.to
      });
    }

    if (criteria.reviewDateRange) {
      queryBuilder.andWhere('prescription.reviewDate BETWEEN :reviewFrom AND :reviewTo', {
        reviewFrom: criteria.reviewDateRange.from,
        reviewTo: criteria.reviewDateRange.to
      });
    }

    if (criteria.requiresMonitoring !== undefined) {
      queryBuilder.andWhere('prescription.requiresMonitoring = :requiresMonitoring', { 
        requiresMonitoring: criteria.requiresMonitoring 
      });
    }

    if (criteria.isExpired) {
      const today = new Date();
      queryBuilder.andWhere('prescription.endDate < :today', { today });
    }

    if (criteria.isDueForReview) {
      const today = new Date();
      queryBuilder.andWhere('prescription.reviewDate <= :today', { today });
    }

    return queryBuilder;
  }

  /**
   * Save prescription entity
   */
  async save(prescription: Prescription): Promise<Prescription> {
    try {
      return await this.repository.save(prescription);
    } catch (error: unknown) {
      console.error('Failed to save prescription', { error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    }
  }

  /**
   * Soft delete prescription
   */
  async softDelete(
    prescriptionId: string,
    organizationId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      const result = await this.repository.softDelete({
        id: prescriptionId,
        organizationId,
        tenantId
      });

      return (result.affected || 0) > 0;

    } catch (error: unknown) {
      console.error('Failed to soft delete prescription', { 
        error: error instanceof Error ? error.message : "Unknown error",
        prescriptionId
      });
      throw error;
    }
  }
}

export default PrescriptionRepository;
