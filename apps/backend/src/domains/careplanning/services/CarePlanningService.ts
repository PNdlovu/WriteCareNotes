/**
 * ============================================================================
 * Care Planning Service
 * ============================================================================
 * 
 * @fileoverview Business logic for care planning and LAC review management.
 * 
 * @module domains/careplanning/services/CarePlanningService
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides core business logic for care plan management, statutory reviews,
 * goal tracking, and IRO oversight. Implements statutory requirements for
 * looked after children care planning and review processes.
 * 
 * @compliance
 * - Care Planning, Placement and Case Review Regulations 2010
 * - IRO Handbook 2010
 * - Children Act 1989, Section 22(3) & Section 26
 * - OFSTED Regulation 5
 * 
 * @features
 * - Care plan creation and versioning
 * - Statutory review scheduling
 * - SMART goal management
 * - IRO recommendation tracking
 * - Multi-agency coordination
 * - Progress monitoring
 * - Child participation tracking
 * - Compliance monitoring
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../infrastructure/database/AppDataSource';
import { CarePlan, CarePlanType, CarePlanStatus } from '../entities/CarePlan';
import { CarePlanReview, ReviewType, ReviewStatus } from '../entities/CarePlanReview';
import { CarePlanGoal, GoalStatus } from '../entities/CarePlanGoal';
import { Child } from '../../children/entities/Child';

export class CarePlanningService {
  privatecarePlanRepository: Repository<CarePlan>;
  privatecarePlanReviewRepository: Repository<CarePlanReview>;
  privatecarePlanGoalRepository: Repository<CarePlanGoal>;
  privatechildRepository: Repository<Child>;

  constructor() {
    this.carePlanRepository = AppDataSource.getRepository(CarePlan);
    this.carePlanReviewRepository = AppDataSource.getRepository(CarePlanReview);
    this.carePlanGoalRepository = AppDataSource.getRepository(CarePlanGoal);
    this.childRepository = AppDataSource.getRepository(Child);
  }

  // ========================================
  // CARE PLAN OPERATIONS
  // ========================================

  /**
   * Create new care plan
   */
  async createCarePlan(data: Partial<CarePlan>): Promise<CarePlan> {
    const carePlanNumber = await this.generateCarePlanNumber();
    
    // Calculate next review date based on plan type
    const nextReviewDate = this.calculateNextReviewDate(
      data.planStartDate!,
      data.planType || CarePlanType.INITIAL
    );

    const carePlan = this.carePlanRepository.create({
      ...data,
      carePlanNumber,
      nextReviewDate,
      status: CarePlanStatus.DRAFT,
      version: 1,
      reviewCount: 0
    });

    return await this.carePlanRepository.save(carePlan);
  }

  /**
   * Get active care plan for child
   */
  async getActiveCarePlan(childId: string): Promise<CarePlan | null> {
    return await this.carePlanRepository.findOne({
      where: {
        childId,
        status: CarePlanStatus.ACTIVE
      },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get all care plans for child
   */
  async getCarePlans(childId: string): Promise<CarePlan[]> {
    return await this.carePlanRepository.find({
      where: { childId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Update care plan
   */
  async updateCarePlan(
    id: string,
    data: Partial<CarePlan>
  ): Promise<CarePlan> {
    await this.carePlanRepository.update(id, {
      ...data,
      version: () => 'version + 1'
    });
    return (await this.carePlanRepository.findOne({ where: { id } }))!;
  }

  /**
   * Approve care plan
   */
  async approveCarePlan(
    id: string,
    approvedBy: string,
    approverRole: string,
    comments?: string
  ): Promise<CarePlan> {
    const carePlan = await this.carePlanRepository.findOne({ where: { id } });
    if (!carePlan) throw new Error('Care plan not found');

    // Supersede existing active plan if exists
    const existingActive = await this.getActiveCarePlan(carePlan.childId);
    if (existingActive && existingActive.id !== id) {
      await this.carePlanRepository.update(existingActive.id, {
        status: CarePlanStatus.SUPERSEDED
      });
    }

    await this.carePlanRepository.update(id, {
      planApproved: true,
      approvedBy,
      approverRole,
      approvalDate: new Date(),
      approvalComments: comments,
      status: CarePlanStatus.ACTIVE
    });

    return (await this.carePlanRepository.findOne({ where: { id } }))!;
  }

  /**
   * Get care plans requiring review
   */
  async getCarePlansRequiringReview(): Promise<CarePlan[]> {
    const today = new Date();
    return await this.carePlanRepository
      .createQueryBuilder('carePlan')
      .where('carePlan.status = :status', { status: CarePlanStatus.ACTIVE })
      .andWhere('carePlan.nextReviewDate <= :today', { today })
      .orderBy('carePlan.nextReviewDate', 'ASC')
      .getMany();
  }

  // ========================================
  // CARE PLAN REVIEW OPERATIONS
  // ========================================

  /**
   * Schedule care plan review
   */
  async scheduleReview(data: Partial<CarePlanReview>): Promise<CarePlanReview> {
    const reviewNumber = await this.generateReviewNumber();

    const review = this.carePlanReviewRepository.create({
      ...data,
      reviewNumber,
      status: ReviewStatus.SCHEDULED
    });

    const savedReview = await this.carePlanReviewRepository.save(review);

    // Update care plan with review count
    const carePlan = await this.carePlanRepository.findOne({
      where: { id: data.carePlanId }
    });
    if (carePlan) {
      await this.carePlanRepository.update(data.carePlanId!, {
        reviewCount: carePlan.reviewCount + 1,
        lastReviewDate: data.scheduledDate
      });
    }

    return savedReview;
  }

  /**
   * Complete review
   */
  async completeReview(
    id: string,
    data: Partial<CarePlanReview>
  ): Promise<CarePlanReview> {
    await this.carePlanReviewRepository.update(id, {
      ...data,
      status: ReviewStatus.COMPLETED,
      actualDate: data.actualDate || new Date()
    });

    const review = await this.carePlanReviewRepository.findOne({
      where: { id }
    });
    if (!review) throw new Error('Review not found');

    // Update care plan's next review date
    if (data.nextReviewDate) {
      await this.carePlanRepository.update(review.carePlanId, {
        nextReviewDate: data.nextReviewDate,
        lastReviewDate: review.actualDate
      });
    }

    return review;
  }

  /**
   * Get reviews for child
   */
  async getReviews(childId: string): Promise<CarePlanReview[]> {
    return await this.carePlanReviewRepository.find({
      where: { childId },
      order: { scheduledDate: 'DESC' }
    });
  }

  /**
   * Get overdue reviews
   */
  async getOverdueReviews(): Promise<CarePlanReview[]> {
    const today = new Date();
    return await this.carePlanReviewRepository
      .createQueryBuilder('review')
      .where('review.status = :status', { status: ReviewStatus.SCHEDULED })
      .andWhere('review.scheduledDate < :today', { today })
      .orderBy('review.scheduledDate', 'ASC')
      .getMany();
  }

  // ========================================
  // GOAL OPERATIONS
  // ========================================

  /**
   * Create care plan goal
   */
  async createGoal(data: Partial<CarePlanGoal>): Promise<CarePlanGoal> {
    const goalNumber = await this.generateGoalNumber();

    const goal = this.carePlanGoalRepository.create({
      ...data,
      goalNumber,
      progressPercentage: 0,
      version: 1
    });

    return await this.carePlanGoalRepository.save(goal);
  }

  /**
   * Get goals for care plan
   */
  async getGoals(carePlanId: string): Promise<CarePlanGoal[]> {
    return await this.carePlanGoalRepository.find({
      where: { carePlanId },
      order: { priority: 'DESC', createdAt: 'ASC' }
    });
  }

  /**
   * Get active goals
   */
  async getActiveGoals(carePlanId: string): Promise<CarePlanGoal[]> {
    const goals = await this.getGoals(carePlanId);
    return goals.filter((goal) => goal.isActive());
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(
    id: string,
    progressPercentage: number,
    progressNotes: string,
    updatedBy: string
  ): Promise<CarePlanGoal> {
    const goal = await this.carePlanGoalRepository.findOne({ where: { id } });
    if (!goal) throw new Error('Goal not found');

    const progressUpdate = {
      updateDate: new Date(),
      updatedBy,
      progressNotes,
      progressPercentage
    };

    const progressUpdates = goal.progressUpdates || [];
    progressUpdates.push(progressUpdate);

    // Determine status based on progress
    let status = goal.status;
    if (progressPercentage >= 100) {
      status = GoalStatus.ACHIEVED;
    } else if (progressPercentage >= 75) {
      status = GoalStatus.ON_TRACK;
    } else if (goal.isOverdue()) {
      status = GoalStatus.AT_RISK;
    } else {
      status = GoalStatus.IN_PROGRESS;
    }

    await this.carePlanGoalRepository.update(id, {
      progressPercentage,
      progressUpdates,
      lastProgressUpdate: new Date(),
      progressReviewCount: goal.progressReviewCount + 1,
      status,
      updatedBy
    });

    return (await this.carePlanGoalRepository.findOne({ where: { id } }))!;
  }

  /**
   * Achieve goal
   */
  async achieveGoal(
    id: string,
    achievedDate: Date,
    outcomeEvaluation: string,
    updatedBy: string
  ): Promise<CarePlanGoal> {
    await this.carePlanGoalRepository.update(id, {
      status: GoalStatus.ACHIEVED,
      achievedDate,
      outcomeEvaluation,
      goalFullyAchieved: true,
      achievementPercentage: 100,
      progressPercentage: 100,
      updatedBy
    });

    return (await this.carePlanGoalRepository.findOne({ where: { id } }))!;
  }

  /**
   * Get goals requiring attention
   */
  async getGoalsRequiringAttention(): Promise<CarePlanGoal[]> {
    const goals = await this.carePlanGoalRepository.find();
    return goals.filter((goal) => goal.requiresUrgentAttention());
  }

  // ========================================
  // STATISTICS AND REPORTING
  // ========================================

  /**
   * Get care planning statistics
   */
  async getCarePlanningStatistics(organizationId: string): Promise<any> {
    const [
      activePlans,
      plansRequiringReview,
      overdueReviews,
      goalsRequiringAttention
    ] = await Promise.all([
      this.carePlanRepository.count({
        where: { organizationId, status: CarePlanStatus.ACTIVE }
      }),
      this.getCarePlansRequiringReview(),
      this.getOverdueReviews(),
      this.getGoalsRequiringAttention()
    ]);

    return {
      activePlans,
      plansRequiringReview: plansRequiringReview.length,
      overdueReviews: overdueReviews.length,
      goalsRequiringAttention: goalsRequiringAttention.length
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generate care plan number
   */
  private async generateCarePlanNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.carePlanRepository.count();
    return `CP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Generate review number
   */
  private async generateReviewNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.carePlanReviewRepository.count();
    return `CPR-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Generate goal number
   */
  private async generateGoalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.carePlanGoalRepository.count();
    return `CPG-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Calculate next review date based on statutory timescales
   */
  private calculateNextReviewDate(
    planStartDate: Date,
    planType: CarePlanType
  ): Date {
    const date = new Date(planStartDate);
    
    if (planType === CarePlanType.INITIAL) {
      // Initial review within 20 working days (approximately 4 weeks)
      date.setDate(date.getDate() + 28);
    } else {
      // Subsequent reviews within 3 months for first review, then 6 monthly
      date.setMonth(date.getMonth() + 3);
    }
    
    return date;
  }
}
