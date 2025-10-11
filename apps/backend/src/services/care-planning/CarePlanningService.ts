/**
 * @fileoverview Care Planning Service - Complete Care Plan Lifecycle Management
 * @module Services/CarePlanning/CarePlanningService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA
 * 
 * @description
 * Production-ready service for managing care plans with full lifecycle support,
 * goal tracking, risk assessments, and compliance monitoring.
 */

import { DataSource, Repository, IsNull, Not, Between, LessThan } from 'typeorm';
import { CarePlan, CarePlanType, CarePlanStatus, ReviewFrequency, CareGoal, RiskAssessment, EmergencyProcedure, ResidentPreference } from '../../entities/care-planning/CarePlan';

interface CreateCarePlanDTO {
  residentId: string;
  planName: string;
  planType: CarePlanType;
  effectiveFrom: Date;
  reviewFrequency: ReviewFrequency;
  careGoals?: Omit<CareGoal, 'id'>[];
  riskAssessments?: Omit<RiskAssessment, 'id'>[];
  emergencyProcedures?: EmergencyProcedure[];
  residentPreferences?: Omit<ResidentPreference, 'dateRecorded' | 'recordedBy'>[];
}

interface UpdateCarePlanDTO {
  planName?: string;
  reviewFrequency?: ReviewFrequency;
  nextReviewDate?: Date;
  effectiveTo?: Date;
}

interface CarePlanFilters {
  residentId?: string;
  status?: CarePlanStatus;
  planType?: CarePlanType;
  overdueForReview?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  tenantId?: string;
  organizationId?: string;
}

export class CarePlanningService {
  privatecarePlanRepository: Repository<CarePlan>;

  constructor(private dataSource: DataSource) {
    this.carePlanRepository = this.dataSource.getRepository(CarePlan);
  }

  /**
   * Create new care plan
   */
  async create(
    dto: CreateCarePlanDTO,
    userId: string,
    tenantId: string,
    organizationId: string
  ): Promise<CarePlan> {
    const carePlan = this.carePlanRepository.create({
      ...dto,
      createdBy: userId,
      status: CarePlanStatus.DRAFT,
      version: 1,
    });

    // Calculate next review date
    carePlan.nextReviewDate = carePlan.calculateNextReviewDate();

    // Add care goals with IDs
    if (dto.careGoals && dto.careGoals.length > 0) {
      dto.careGoals.forEach(goal => carePlan.addCareGoal(goal));
    }

    // Add risk assessments with IDs
    if (dto.riskAssessments && dto.riskAssessments.length > 0) {
      dto.riskAssessments.forEach(risk => carePlan.addRiskAssessment(risk));
    }

    // Add resident preferences
    if (dto.residentPreferences && dto.residentPreferences.length > 0) {
      dto.residentPreferences.forEach(pref => carePlan.addResidentPreference(pref, userId));
    }

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Find care plan by ID
   */
  async findById(id: string): Promise<CarePlan | null> {
    return await this.carePlanRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ['resident', 'careDomains', 'careReviews'],
    });
  }

  /**
   * Find all care plans with filters
   */
  async findAll(filters: CarePlanFilters): Promise<{
    data: CarePlan[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      residentId,
      status,
      planType,
      overdueForReview,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'nextReviewDate',
      sortOrder = 'ASC',
      organizationId,
    } = filters;

    const query = this.carePlanRepository.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.resident', 'resident')
      .where('plan.deletedAt IS NULL');

    // Apply filters
    if (residentId) {
      query.andWhere('plan.residentId = :residentId', { residentId });
    }

    if (status) {
      query.andWhere('plan.status = :status', { status });
    }

    if (planType) {
      query.andWhere('plan.planType = :planType', { planType });
    }

    if (overdueForReview) {
      query.andWhere('plan.nextReviewDate < :now', { now: new Date() })
        .andWhere('plan.status = :activeStatus', { activeStatus: CarePlanStatus.ACTIVE });
    }

    if (startDate && endDate) {
      query.andWhere('plan.effectiveFrom BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (organizationId) {
      query.andWhere('resident.organizationId = :organizationId', { organizationId });
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination and sorting
    query
      .orderBy(`plan.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const data = await query.getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Update care plan
   */
  async update(
    id: string,
    dto: UpdateCarePlanDTO,
    userId: string
  ): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    if (carePlan.status !== CarePlanStatus.DRAFT && carePlan.status !== CarePlanStatus.ACTIVE) {
      throw new Error('Cannot update archived or superseded care plan');
    }

    Object.assign(carePlan, dto);

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Delete care plan (soft delete)
   */
  async delete(id: string, userId: string): Promise<void> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    carePlan.deletedAt = new Date();

    await this.carePlanRepository.save(carePlan);
  }

  /**
   * Approve care plan
   */
  async approve(id: string, userId: string): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    if (carePlan.status !== CarePlanStatus.DRAFT && carePlan.status !== CarePlanStatus.PENDING_APPROVAL) {
      throw new Error('Only draft or pending plans can be approved');
    }

    carePlan.approve(userId);

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Submit for approval
   */
  async submitForApproval(id: string, userId: string): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    if (carePlan.status !== CarePlanStatus.DRAFT) {
      throw new Error('Only draft plans can be submitted for approval');
    }

    carePlan.status = CarePlanStatus.PENDING_APPROVAL;

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Archive care plan
   */
  async archive(id: string, userId: string): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    carePlan.archive();

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Create new version (supersede current)
   */
  async createNewVersion(
    currentPlanId: string,
    dto: CreateCarePlanDTO,
    userId: string,
    tenantId: string,
    organizationId: string
  ): Promise<CarePlan> {
    const currentPlan = await this.findById(currentPlanId);
    if (!currentPlan) {
      throw new Error('Current care plan not found');
    }

    // Create new version
    const newPlan = await this.create(dto, userId, tenantId, organizationId);
    newPlan.version = currentPlan.version + 1;
    newPlan.previousVersionId = currentPlan.id;

    // Supersede current plan
    currentPlan.supersede(newPlan.id);
    await this.carePlanRepository.save(currentPlan);

    return await this.carePlanRepository.save(newPlan);
  }

  /**
   * Add care goal
   */
  async addCareGoal(
    id: string,
    goal: Omit<CareGoal, 'id'>,
    userId: string
  ): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    carePlan.addCareGoal(goal);

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Update care goal
   */
  async updateCareGoal(
    id: string,
    goalId: string,
    updates: Partial<CareGoal>,
    userId: string
  ): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    const updated = carePlan.updateCareGoal(goalId, updates);
    if (!updated) {
      throw new Error('Care goal not found');
    }

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Add risk assessment
   */
  async addRiskAssessment(
    id: string,
    risk: Omit<RiskAssessment, 'id'>,
    userId: string
  ): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    carePlan.addRiskAssessment(risk);

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Update risk assessment
   */
  async updateRiskAssessment(
    id: string,
    riskId: string,
    updates: Partial<RiskAssessment>,
    userId: string
  ): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    const updated = carePlan.updateRiskAssessment(riskId, updates);
    if (!updated) {
      throw new Error('Risk assessment not found');
    }

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Add resident preference
   */
  async addResidentPreference(
    id: string,
    preference: Omit<ResidentPreference, 'dateRecorded' | 'recordedBy'>,
    userId: string
  ): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    carePlan.addResidentPreference(preference, userId);

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Get care plans due for review
   */
  async getDueForReview(daysAhead: number = 7, organizationId?: string): Promise<CarePlan[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const query = this.carePlanRepository.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.resident', 'resident')
      .where('plan.deletedAt IS NULL')
      .andWhere('plan.status = :status', { status: CarePlanStatus.ACTIVE })
      .andWhere('plan.nextReviewDate <= :targetDate', { targetDate })
      .orderBy('plan.nextReviewDate', 'ASC');

    if (organizationId) {
      query.andWhere('resident.organizationId = :organizationId', { organizationId });
    }

    return await query.getMany();
  }

  /**
   * Get overdue reviews
   */
  async getOverdueReviews(organizationId?: string): Promise<CarePlan[]> {
    const query = this.carePlanRepository.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.resident', 'resident')
      .where('plan.deletedAt IS NULL')
      .andWhere('plan.status = :status', { status: CarePlanStatus.ACTIVE })
      .andWhere('plan.nextReviewDate < :now', { now: new Date() })
      .orderBy('plan.nextReviewDate', 'ASC');

    if (organizationId) {
      query.andWhere('resident.organizationId = :organizationId', { organizationId });
    }

    return await query.getMany();
  }

  /**
   * Get active care plan for resident
   */
  async getActiveForResident(residentId: string): Promise<CarePlan | null> {
    return await this.carePlanRepository.findOne({
      where: {
        residentId,
        status: CarePlanStatus.ACTIVE,
        deletedAt: IsNull(),
      },
      relations: ['careDomains', 'careReviews'],
    });
  }

  /**
   * Get care plan history for resident
   */
  async getHistoryForResident(residentId: string): Promise<CarePlan[]> {
    return await this.carePlanRepository.find({
      where: {
        residentId,
        deletedAt: IsNull(),
      },
      order: {
        version: 'DESC',
      },
    });
  }

  /**
   * Get statistics
   */
  async getStatistics(organizationId?: string): Promise<{
    total: number;
    draft: number;
    pendingApproval: number;
    active: number;
    archived: number;
    overdueReviews: number;
    dueWithin7Days: number;
    highRiskPlans: number;
  }> {
    const query = this.carePlanRepository.createQueryBuilder('plan')
      .leftJoin('plan.resident', 'resident')
      .where('plan.deletedAt IS NULL');

    if (organizationId) {
      query.andWhere('resident.organizationId = :organizationId', { organizationId });
    }

    const allPlans = await query.getMany();

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const stats = {
      total: allPlans.length,
      draft: allPlans.filter(p => p.status === CarePlanStatus.DRAFT).length,
      pendingApproval: allPlans.filter(p => p.status === CarePlanStatus.PENDING_APPROVAL).length,
      active: allPlans.filter(p => p.status === CarePlanStatus.ACTIVE).length,
      archived: allPlans.filter(p => p.status === CarePlanStatus.ARCHIVED).length,
      overdueReviews: allPlans.filter(p => p.isOverdueForReview).length,
      dueWithin7Days: allPlans.filter(p =>
        p.status === CarePlanStatus.ACTIVE &&
        p.nextReviewDate <= sevenDaysFromNow &&
        p.nextReviewDate >= new Date()
      ).length,
      highRiskPlans: allPlans.filter(p => p.highRiskAssessments.length > 0).length,
    };

    return stats;
  }

  /**
   * Update next review date
   */
  async updateReviewDate(
    id: string,
    newDate: Date,
    userId: string
  ): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    carePlan.nextReviewDate = newDate;

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Complete review (reset next review date)
   */
  async completeReview(id: string, userId: string): Promise<CarePlan> {
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    carePlan.nextReviewDate = carePlan.calculateNextReviewDate();

    return await this.carePlanRepository.save(carePlan);
  }
}

export default CarePlanningService;
