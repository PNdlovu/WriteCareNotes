/**
 * ============================================================================
 * Leaving Care Service
 * ============================================================================
 * 
 * @fileoverview Business logic for leaving care services and pathway planning.
 * 
 * @module domains/leavingcare/services/LeavingCareService
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides core business logic for leaving care services including pathway
 * plan management, personal advisor allocation, independent living skills
 * assessment, and transition to adulthood support.
 * 
 * @compliance
 * - Children (Leaving Care) Act 2000
 * - Care Leavers (England) Regulations 2010
 * - Children and Social Work Act 2017
 * - OFSTED Regulation 6
 * 
 * @features
 * - Pathway plan creation and management
 * - Personal advisor assignment
 * - Independent living skills tracking
 * - Leaving care needs assessment
 * - Progress monitoring
 * - Statutory review scheduling
 * - Multi-domain support planning
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../infrastructure/database/AppDataSource';
import { PathwayPlan, PathwayPlanStatus } from '../entities/PathwayPlan';
import { Child } from '../../children/entities/Child';

export class LeavingCareService {
  privatepathwayPlanRepository: Repository<PathwayPlan>;
  privatechildRepository: Repository<Child>;

  constructor() {
    this.pathwayPlanRepository = AppDataSource.getRepository(PathwayPlan);
    this.childRepository = AppDataSource.getRepository(Child);
  }

  // ========================================
  // PATHWAY PLAN OPERATIONS
  // ========================================

  /**
   * Create pathway plan
   */
  async createPathwayPlan(data: Partial<PathwayPlan>): Promise<PathwayPlan> {
    const pathwayPlanNumber = await this.generatePathwayPlanNumber();
    
    // Calculate next review date (statutory 6 monthly reviews)
    const nextReviewDate = new Date(data.planStartDate!);
    nextReviewDate.setMonth(nextReviewDate.getMonth() + 6);

    const pathwayPlan = this.pathwayPlanRepository.create({
      ...data,
      pathwayPlanNumber,
      nextReviewDate,
      status: PathwayPlanStatus.DRAFT,
      version: 1,
      reviewCount: 0,
      reviewFrequencyMonths: 6
    });

    return await this.pathwayPlanRepository.save(pathwayPlan);
  }

  /**
   * Get active pathway plan for young person
   */
  async getActivePathwayPlan(childId: string): Promise<PathwayPlan | null> {
    return await this.pathwayPlanRepository.findOne({
      where: {
        childId,
        status: PathwayPlanStatus.ACTIVE
      },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get all pathway plans for young person
   */
  async getPathwayPlans(childId: string): Promise<PathwayPlan[]> {
    return await this.pathwayPlanRepository.find({
      where: { childId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Update pathway plan
   */
  async updatePathwayPlan(
    id: string,
    data: Partial<PathwayPlan>
  ): Promise<PathwayPlan> {
    await this.pathwayPlanRepository.update(id, {
      ...data,
      version: () => 'version + 1'
    });
    return (await this.pathwayPlanRepository.findOne({ where: { id } }))!;
  }

  /**
   * Activate pathway plan
   */
  async activatePathwayPlan(id: string): Promise<PathwayPlan> {
    const pathwayPlan = await this.pathwayPlanRepository.findOne({ where: { id } });
    if (!pathwayPlan) throw new Error('Pathway plan not found');

    // Supersede existing active plan if exists
    const existingActive = await this.getActivePathwayPlan(pathwayPlan.childId);
    if (existingActive && existingActive.id !== id) {
      await this.pathwayPlanRepository.update(existingActive.id, {
        status: PathwayPlanStatus.SUPERSEDED
      });
    }

    await this.pathwayPlanRepository.update(id, {
      status: PathwayPlanStatus.ACTIVE
    });

    return (await this.pathwayPlanRepository.findOne({ where: { id } }))!;
  }

  /**
   * Complete pathway plan review
   */
  async completeReview(
    id: string,
    progressSummary: string,
    achievementsHighlighted: string,
    areasForDevelopment: string,
    updatedBy: string
  ): Promise<PathwayPlan> {
    const pathwayPlan = await this.pathwayPlanRepository.findOne({ where: { id } });
    if (!pathwayPlan) throw new Error('Pathway plan not found');

    const lastReviewDate = new Date();
    const nextReviewDate = new Date(lastReviewDate);
    nextReviewDate.setMonth(nextReviewDate.getMonth() + pathwayPlan.reviewFrequencyMonths);

    await this.pathwayPlanRepository.update(id, {
      lastReviewDate,
      nextReviewDate,
      reviewCount: pathwayPlan.reviewCount + 1,
      progressSummary,
      achievementsHighlighted,
      areasForDevelopment,
      updatedBy
    });

    return (await this.pathwayPlanRepository.findOne({ where: { id } }))!;
  }

  /**
   * Get pathway plans requiring review
   */
  async getPathwayPlansRequiringReview(): Promise<PathwayPlan[]> {
    const today = new Date();
    return await this.pathwayPlanRepository
      .createQueryBuilder('pathwayPlan')
      .where('pathwayPlan.status = :status', { status: PathwayPlanStatus.ACTIVE })
      .andWhere('pathwayPlan.nextReviewDate <= :today', { today })
      .orderBy('pathwayPlan.nextReviewDate', 'ASC')
      .getMany();
  }

  /**
   * Get pathway plans requiring urgent attention
   */
  async getPathwayPlansRequiringAttention(): Promise<PathwayPlan[]> {
    const plans = await this.pathwayPlanRepository.find({
      where: { status: PathwayPlanStatus.ACTIVE }
    });
    return plans.filter((plan) => plan.requiresUrgentAttention());
  }

  // ========================================
  // YOUNG PERSON TRACKING
  // ========================================

  /**
   * Get young people in EET (Education, Employment, Training)
   */
  async getYoungPeopleInEET(organizationId: string): Promise<PathwayPlan[]> {
    const plans = await this.pathwayPlanRepository.find({
      where: {
        organizationId,
        status: PathwayPlanStatus.ACTIVE
      }
    });
    return plans.filter((plan) => plan.isInEET());
  }

  /**
   * Get young people NEET (Not in Education, Employment, Training)
   */
  async getYoungPeopleNEET(organizationId: string): Promise<PathwayPlan[]> {
    const plans = await this.pathwayPlanRepository.find({
      where: {
        organizationId,
        status: PathwayPlanStatus.ACTIVE
      }
    });
    return plans.filter((plan) => !plan.isInEET());
  }

  /**
   * Get young people in unsuitable accommodation
   */
  async getYoungPeopleUnsuitableAccommodation(
    organizationId: string
  ): Promise<PathwayPlan[]> {
    const plans = await this.pathwayPlanRepository.find({
      where: {
        organizationId,
        status: PathwayPlanStatus.ACTIVE
      }
    });
    return plans.filter((plan) => !plan.hasSuitableAccommodation());
  }

  // ========================================
  // STATISTICS AND REPORTING
  // ========================================

  /**
   * Get leaving care statistics
   */
  async getLeavingCareStatistics(organizationId: string): Promise<any> {
    const [
      activePlans,
      plansRequiringReview,
      plansRequiringAttention,
      youngPeopleInEET,
      youngPeopleNEET,
      unsuitableAccommodation
    ] = await Promise.all([
      this.pathwayPlanRepository.count({
        where: { organizationId, status: PathwayPlanStatus.ACTIVE }
      }),
      this.getPathwayPlansRequiringReview(),
      this.getPathwayPlansRequiringAttention(),
      this.getYoungPeopleInEET(organizationId),
      this.getYoungPeopleNEET(organizationId),
      this.getYoungPeopleUnsuitableAccommodation(organizationId)
    ]);

    const eetRate =
      activePlans > 0
        ? ((youngPeopleInEET.length / activePlans) * 100).toFixed(1)
        : 0;

    return {
      activePlans,
      plansRequiringReview: plansRequiringReview.length,
      plansRequiringAttention: plansRequiringAttention.length,
      youngPeopleInEET: youngPeopleInEET.length,
      youngPeopleNEET: youngPeopleNEET.length,
      eetRate,
      unsuitableAccommodation: unsuitableAccommodation.length
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generate pathway plan number
   */
  private async generatePathwayPlanNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.pathwayPlanRepository.count();
    return `PP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
