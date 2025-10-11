/**
 * @fileoverview Care Plan Repository for WriteCareNotes
 * @module CarePlanRepository
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Optimized repository for care plan data access with healthcare compliance
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 */

import { DataSource, Repository, SelectQueryBuilder, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, IsNull, Not } from 'typeorm';
import { CarePlan, CarePlanStatus, CarePlanType } from '../../entities/care-planning/CarePlan';
import { logger } from '../../utils/logger';

export interface CarePlanSearchCriteria {
  residentId?: string;
  status?: CarePlanStatus;
  planType?: CarePlanType;
  reviewDueBefore?: Date;
  createdBy?: string;
  approvedBy?: string;
  riskLevel?: string;
}

export interface CarePlanSearchResult {
  carePlans: CarePlan[];
  total: number;
}

export interface CarePlanSummary {
  id: string;
  residentId: string;
  planName: string;
  planType: CarePlanType;
  status: CarePlanStatus;
  effectiveFrom: Date;
  nextReviewDate?: Date;
  isOverdueForReview: boolean;
  riskLevel?: string;
  createdAt: Date;
}

export interface CarePlanStatistics {
  totalPlans: number;
  activePlans: number;
  draftPlans: number;
  pendingApprovalPlans: number;
  overdueReviews: number;
  plansByType: Record<CarePlanType, number>;
  plansByStatus: Record<CarePlanStatus, number>;
  averageReviewCycle: number;
}

export class CarePlanRepository {
  privaterepository: Repository<CarePlan>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(CarePlan);
  }

  /**
   * Create a new care plan with optimized performance
   */
  async create(carePlan: CarePlan): Promise<CarePlan> {
    try {
      logger.debug('Creating care plan in repository', { 
        residentId: carePlan.residentId,
        planName: carePlan.planName 
      });

      const savedCarePlan = await this.repository.save(carePlan);

      logger.debug('Care plan created successfully in repository', { 
        carePlanId: savedCarePlan.id 
      });

      return savedCarePlan;

    } catch (error: unknown) {
      logger.error('Failed to create care plan in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId: carePlan.residentId 
      });
      throw error;
    }
  }

  /**
   * Find care plan by ID with optional relations
   */
  async findById(id: string, includeRelations: boolean = true): Promise<CarePlan | null> {
    try {
      logger.debug('Finding care plan by ID in repository', { carePlanId: id });

      const queryBuilder = this.repository.createQueryBuilder('carePlan')
        .where('carePlan.id = :id', { id })
        .andWhere('carePlan.deletedAt IS NULL');

      if (includeRelations) {
        queryBuilder
          .leftJoinAndSelect('carePlan.resident', 'resident')
          .leftJoinAndSelect('carePlan.careDomains', 'careDomains')
          .leftJoinAndSelect('carePlan.careTeamMembers', 'careTeamMembers');
      }

      const carePlan = await queryBuilder.getOne();

      logger.debug('Care plan found in repository', { 
        carePlanId: id,
        found: !!carePlan 
      });

      return carePlan;

    } catch (error: unknown) {
      logger.error('Failed to find care plan by ID in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        carePlanId: id 
      });
      throw error;
    }
  }

  /**
   * Search care plans with advanced filtering and pagination
   */
  async search(
    criteria: CarePlanSearchCriteria,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<CarePlanSearchResult> {
    try {
      logger.debug('Searching care plans in repository', { 
        criteria,
        page,
        limit,
        sortBy,
        sortDirection 
      });

      const queryBuilder = this.repository.createQueryBuilder('carePlan')
        .leftJoinAndSelect('carePlan.resident', 'resident')
        .where('carePlan.deletedAt IS NULL');

      // Apply search criteria
      this.applySearchCriteria(queryBuilder, criteria);

      // Apply sorting
      const validSortFields = ['createdAt', 'updatedAt', 'planName', 'effectiveFrom', 'nextReviewDate', 'status'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      queryBuilder.orderBy(`carePlan.${sortField}`, sortDirection);

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Execute query
      const [carePlans, total] = await queryBuilder.getManyAndCount();

      logger.debug('Care plans search completed in repository', { 
        found: carePlans.length,
        total,
        page,
        limit 
      });

      return { carePlans, total };

    } catch (error: unknown) {
      logger.error('Failed to search care plans in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        criteria 
      });
      throw error;
    }
  }

  /**
   * Update care plan with optimized performance
   */
  async update(carePlan: CarePlan): Promise<CarePlan> {
    try {
      logger.debug('Updating care plan in repository', { 
        carePlanId: carePlan.id 
      });

      carePlan.updatedAt = new Date();
      const updatedCarePlan = await this.repository.save(carePlan);

      logger.debug('Care plan updated successfully in repository', { 
        carePlanId: updatedCarePlan.id 
      });

      return updatedCarePlan;

    } catch (error: unknown) {
      logger.error('Failed to update care plan in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        carePlanId: carePlan.id 
      });
      throw error;
    }
  }

  /**
   * Find care plans due for review
   */
  async findDueForReview(daysAhead: number = 7): Promise<CarePlan[]> {
    try {
      logger.debug('Finding care plans due for review in repository', { daysAhead });

      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + daysAhead);

      const carePlans = await this.repository.createQueryBuilder('carePlan')
        .leftJoinAndSelect('carePlan.resident', 'resident')
        .where('carePlan.deletedAt IS NULL')
        .andWhere('carePlan.status = :status', { status: CarePlanStatus.ACTIVE })
        .andWhere('carePlan.nextReviewDate <= :reviewDate', { reviewDate })
        .orderBy('carePlan.nextReviewDate', 'ASC')
        .getMany();

      logger.debug('Care plans due for review found in repository', { 
        count: carePlans.length,
        daysAhead 
      });

      return carePlans;

    } catch (error: unknown) {
      logger.error('Failed to find care plans due for review in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        daysAhead 
      });
      throw error;
    }
  }

  /**
   * Find care plan versions for a resident
   */
  async findVersions(residentId: string, planName: string): Promise<CarePlan[]> {
    try {
      logger.debug('Finding care plan versions in repository', { 
        residentId,
        planName 
      });

      const versions = await this.repository.createQueryBuilder('carePlan')
        .where('carePlan.residentId = :residentId', { residentId })
        .andWhere('carePlan.planName = :planName', { planName })
        .andWhere('carePlan.deletedAt IS NULL')
        .orderBy('carePlan.version', 'DESC')
        .getMany();

      logger.debug('Care plan versions found in repository', { 
        count: versions.length,
        residentId,
        planName 
      });

      return versions;

    } catch (error: unknown) {
      logger.error('Failed to find care plan versions in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId,
        planName 
      });
      throw error;
    }
  }

  /**
   * Count active care plans
   */
  async countActive(): Promise<number> {
    try {
      logger.debug('Counting active care plans in repository');

      const count = await this.repository.count({
        where: {
          status: CarePlanStatus.ACTIVE,
          deletedAt: IsNull()
        }
      });

      logger.debug('Active care plans counted in repository', { count });

      return count;

    } catch (error: unknown) {
      logger.error('Failed to count active care plans in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get care plan summaries for dashboard
   */
  async getCarePlanSummaries(
    criteria: CarePlanSearchCriteria,
    limit: number = 50
  ): Promise<CarePlanSummary[]> {
    try {
      logger.debug('Getting care plan summaries in repository', { criteria, limit });

      const queryBuilder = this.repository.createQueryBuilder('carePlan')
        .select([
          'carePlan.id',
          'carePlan.residentId',
          'carePlan.planName',
          'carePlan.planType',
          'carePlan.status',
          'carePlan.effectiveFrom',
          'carePlan.nextReviewDate',
          'carePlan.createdAt'
        ])
        .where('carePlan.deletedAt IS NULL');

      // Apply search criteria
      this.applySearchCriteria(queryBuilder, criteria);

      // Apply limit
      queryBuilder.take(limit);

      // Order by most recent
      queryBuilder.orderBy('carePlan.createdAt', 'DESC');

      const carePlans = await queryBuilder.getMany();

      // Map to summaries
      constsummaries: CarePlanSummary[] = carePlans.map(plan => ({
        id: plan.id,
        residentId: plan.residentId,
        planName: plan.planName,
        planType: plan.planType,
        status: plan.status,
        effectiveFrom: plan.effectiveFrom,
        nextReviewDate: plan.nextReviewDate,
        isOverdueForReview: plan.nextReviewDate ? plan.nextReviewDate < new Date() : false,
        riskLevel: this.calculateOverallRiskLevel(plan),
        createdAt: plan.createdAt
      }));

      logger.debug('Care plan summaries retrieved in repository', { 
        count: summaries.length 
      });

      return summaries;

    } catch (error: unknown) {
      logger.error('Failed to get care plan summaries in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        criteria 
      });
      throw error;
    }
  }

  /**
   * Get care plan statistics
   */
  async getStatistics(residentId?: string): Promise<CarePlanStatistics> {
    try {
      logger.debug('Getting care plan statistics in repository', { residentId });

      const baseQuery = this.repository.createQueryBuilder('carePlan')
        .where('carePlan.deletedAt IS NULL');

      if (residentId) {
        baseQuery.andWhere('carePlan.residentId = :residentId', { residentId });
      }

      // Get total counts
      const totalPlans = await baseQuery.getCount();

      const activePlans = await baseQuery.clone()
        .andWhere('carePlan.status = :status', { status: CarePlanStatus.ACTIVE })
        .getCount();

      const draftPlans = await baseQuery.clone()
        .andWhere('carePlan.status = :status', { status: CarePlanStatus.DRAFT })
        .getCount();

      const pendingApprovalPlans = await baseQuery.clone()
        .andWhere('carePlan.status = :status', { status: CarePlanStatus.PENDING_APPROVAL })
        .getCount();

      // Get overdue reviews
      const overdueReviews = await baseQuery.clone()
        .andWhere('carePlan.status = :status', { status: CarePlanStatus.ACTIVE })
        .andWhere('carePlan.nextReviewDate < :now', { now: new Date() })
        .getCount();

      // Get plans by type
      const plansByType = {} as Record<CarePlanType, number>;
      for (const type of Object.values(CarePlanType)) {
        plansByType[type] = await baseQuery.clone()
          .andWhere('carePlan.planType = :type', { type })
          .getCount();
      }

      // Get plans by status
      const plansByStatus = {} as Record<CarePlanStatus, number>;
      for (const status of Object.values(CarePlanStatus)) {
        plansByStatus[status] = await baseQuery.clone()
          .andWhere('carePlan.status = :status', { status })
          .getCount();
      }

      // Calculate average review cycle (simplified)
      const averageReviewCycle = 30; // Default to 30 days, would need more complex calculation

      conststatistics: CarePlanStatistics = {
        totalPlans,
        activePlans,
        draftPlans,
        pendingApprovalPlans,
        overdueReviews,
        plansByType,
        plansByStatus,
        averageReviewCycle
      };

      logger.debug('Care plan statistics retrieved in repository', { 
        statistics,
        residentId 
      });

      return statistics;

    } catch (error: unknown) {
      logger.error('Failed to get care plan statistics in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId 
      });
      throw error;
    }
  }

  /**
   * Find care plans by resident ID
   */
  async findByResidentId(residentId: string, includeArchived: boolean = false): Promise<CarePlan[]> {
    try {
      logger.debug('Finding care plans by resident ID in repository', { 
        residentId,
        includeArchived 
      });

      const queryBuilder = this.repository.createQueryBuilder('carePlan')
        .leftJoinAndSelect('carePlan.resident', 'resident')
        .where('carePlan.residentId = :residentId', { residentId })
        .andWhere('carePlan.deletedAt IS NULL');

      if (!includeArchived) {
        queryBuilder.andWhere('carePlan.status != :archivedStatus', { 
          archivedStatus: CarePlanStatus.ARCHIVED 
        });
      }

      queryBuilder.orderBy('carePlan.createdAt', 'DESC');

      const carePlans = await queryBuilder.getMany();

      logger.debug('Care plans found by resident ID in repository', { 
        count: carePlans.length,
        residentId 
      });

      return carePlans;

    } catch (error: unknown) {
      logger.error('Failed to find care plans by resident ID in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId 
      });
      throw error;
    }
  }

  /**
   * Find care plans requiring attention
   */
  async findRequiringAttention(): Promise<CarePlan[]> {
    try {
      logger.debug('Finding care plans requiring attention in repository');

      const carePlans = await this.repository.createQueryBuilder('carePlan')
        .leftJoinAndSelect('carePlan.resident', 'resident')
        .where('carePlan.deletedAt IS NULL')
        .andWhere(
          '(carePlan.status = :pendingStatus OR ' +
          '(carePlan.status = :activeStatus AND carePlan.nextReviewDate < :now))',
          {
            pendingStatus: CarePlanStatus.PENDING_APPROVAL,
            activeStatus: CarePlanStatus.ACTIVE,
            now: new Date()
          }
        )
        .orderBy('carePlan.nextReviewDate', 'ASC')
        .getMany();

      logger.debug('Care plans requiring attention found in repository', { 
        count: carePlans.length 
      });

      return carePlans;

    } catch (error: unknown) {
      logger.error('Failed to find care plans requiring attention in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Find conflicting care plans
   */
  async findConflictingPlans(
    residentId: string,
    effectiveFrom: Date,
    effectiveTo?: Date
  ): Promise<CarePlan[]> {
    try {
      logger.debug('Finding conflicting care plans in repository', { 
        residentId,
        effectiveFrom,
        effectiveTo 
      });

      const queryBuilder = this.repository.createQueryBuilder('carePlan')
        .where('carePlan.residentId = :residentId', { residentId })
        .andWhere('carePlan.deletedAt IS NULL')
        .andWhere('carePlan.status IN (:...activeStatuses)', {
          activeStatuses: [CarePlanStatus.ACTIVE, CarePlanStatus.PENDING_APPROVAL]
        });

      if (effectiveTo) {
        // Check for overlap
        queryBuilder.andWhere(
          '(carePlan.effectiveFrom <= :effectiveTo AND ' +
          '(carePlan.effectiveTo IS NULL OR carePlan.effectiveTo >= :effectiveFrom))',
          { effectiveFrom, effectiveTo }
        );
      } else {
        // Check for plans that are still active after the new plan starts
        queryBuilder.andWhere(
          '(carePlan.effectiveTo IS NULL OR carePlan.effectiveTo >= :effectiveFrom)',
          { effectiveFrom }
        );
      }

      const conflictingPlans = await queryBuilder.getMany();

      logger.debug('Conflicting care plans found in repository', { 
        count: conflictingPlans.length,
        residentId 
      });

      return conflictingPlans;

    } catch (error: unknown) {
      logger.error('Failed to find conflicting care plans in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId 
      });
      throw error;
    }
  }

  /**
   * Find active care plans by resident ID
   */
  async findActiveByResidentId(residentId: string): Promise<CarePlan[]> {
    try {
      logger.debug('Finding active care plans by resident ID in repository', { residentId });

      const carePlans = await this.repository.createQueryBuilder('carePlan')
        .leftJoinAndSelect('carePlan.resident', 'resident')
        .where('carePlan.residentId = :residentId', { residentId })
        .andWhere('carePlan.status = :status', { status: CarePlanStatus.ACTIVE })
        .andWhere('carePlan.deletedAt IS NULL')
        .orderBy('carePlan.effectiveFrom', 'DESC')
        .getMany();

      logger.debug('Active care plans found by resident ID in repository', { 
        count: carePlans.length,
        residentId 
      });

      return carePlans;

    } catch (error: unknown) {
      logger.error('Failed to find active care plans by resident ID in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId 
      });
      throw error;
    }
  }

  /**
   * Find care plan history by resident ID
   */
  async findHistoryByResidentId(residentId: string): Promise<CarePlan[]> {
    try {
      logger.debug('Finding care plan history by resident ID in repository', { residentId });

      const carePlans = await this.repository.createQueryBuilder('carePlan')
        .leftJoinAndSelect('carePlan.resident', 'resident')
        .where('carePlan.residentId = :residentId', { residentId })
        .andWhere('carePlan.status IN (:...historicalStatuses)', {
          historicalStatuses: [CarePlanStatus.COMPLETED, CarePlanStatus.ARCHIVED, CarePlanStatus.SUPERSEDED]
        })
        .andWhere('carePlan.deletedAt IS NULL')
        .orderBy('carePlan.effectiveTo', 'DESC')
        .getMany();

      logger.debug('Care plan history found by resident ID in repository', { 
        count: carePlans.length,
        residentId 
      });

      return carePlans;

    } catch (error: unknown) {
      logger.error('Failed to find care plan history by resident ID in repository', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId 
      });
      throw error;
    }
  }

  /**
   * Apply search criteria to query builder
   */
  private applySearchCriteria(
    queryBuilder: SelectQueryBuilder<CarePlan>,
    criteria: CarePlanSearchCriteria
  ): void {
    if (criteria.residentId) {
      queryBuilder.andWhere('carePlan.residentId = :residentId', { 
        residentId: criteria.residentId 
      });
    }

    if (criteria.status) {
      queryBuilder.andWhere('carePlan.status = :status', { 
        status: criteria.status 
      });
    }

    if (criteria.planType) {
      queryBuilder.andWhere('carePlan.planType = :planType', { 
        planType: criteria.planType 
      });
    }

    if (criteria.reviewDueBefore) {
      queryBuilder.andWhere('carePlan.nextReviewDate <= :reviewDueBefore', { 
        reviewDueBefore: criteria.reviewDueBefore 
      });
    }

    if (criteria.createdBy) {
      queryBuilder.andWhere('carePlan.createdBy = :createdBy', { 
        createdBy: criteria.createdBy 
      });
    }

    if (criteria.approvedBy) {
      queryBuilder.andWhere('carePlan.approvedBy = :approvedBy', { 
        approvedBy: criteria.approvedBy 
      });
    }

    if (criteria.riskLevel) {
      // This would require a more complex query to calculate overall risk level
      // For now, we'll add a placeholder condition
      queryBuilder.andWhere('1 = 1'); // Placeholder
    }
  }

  /**
   * Calculate overall risk level for a care plan
   */
  private calculateOverallRiskLevel(carePlan: CarePlan): string {
    // Simplified risk level calculation
    // In a real implementation, this would analyze risk assessments
    if (carePlan.riskAssessments && carePlan.riskAssessments.length > 0) {
      const highRiskCount = carePlan.riskAssessments.filter(
        risk => risk.riskLevel === 'high' || risk.riskLevel === 'severe'
      ).length;
      
      if (highRiskCount > 0) return 'high';
      
      const moderateRiskCount = carePlan.riskAssessments.filter(
        risk => risk.riskLevel === 'moderate'
      ).length;
      
      if (moderateRiskCount > 0) return 'moderate';
      
      return 'low';
    }
    
    return 'unknown';
  }
}
