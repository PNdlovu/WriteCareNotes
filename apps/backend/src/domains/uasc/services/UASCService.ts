/**
 * ============================================================================
 * UASC Service
 * ============================================================================
 * 
 * @fileoverview Service layer for UASC (Unaccompanied Asylum Seeking Children)
 * management.
 * 
 * @module domains/uasc/services/UASCService
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides business logic for managing unaccompanied asylum-seeking children
 * including profile management, age assessments, immigration status tracking,
 * and Home Office correspondence.
 * 
 * @compliance
 * - Immigration Act 2016
 * - Children Act 1989, Section 20
 * - OFSTED Regulation 17 (Records)
 * 
 * @features
 * - UASC profile management
 * - Age assessment coordination
 * - Immigration status tracking
 * - Home Office correspondence management
 * - Deadline monitoring
 * - Risk assessment
 * - Statistical reporting
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { 
  UASCProfile,
  UASCStatus,
  ReferralSource,
  ArrivalRoute,
  TraffickinRiskLevel
} from '../entities/UASCProfile';
import {
  AgeAssessment,
  AssessmentStatus,
  AssessmentOutcome,
  AssessmentMethod
} from '../entities/AgeAssessment';
import {
  ImmigrationStatus,
  ImmigrationStatusType,
  AsylumClaimStatus,
  AppealStatus
} from '../entities/ImmigrationStatus';
import {
  HomeOfficeCorrespondence,
  CorrespondenceType,
  CorrespondenceDirection,
  CorrespondenceStatus
} from '../entities/HomeOfficeCorrespondence';

export class UASCService {
  private uascProfileRepository: Repository<UASCProfile>;
  private ageAssessmentRepository: Repository<AgeAssessment>;
  private immigrationStatusRepository: Repository<ImmigrationStatus>;
  private correspondenceRepository: Repository<HomeOfficeCorrespondence>;

  constructor() {
    this.uascProfileRepository = AppDataSource.getRepository(UASCProfile);
    this.ageAssessmentRepository = AppDataSource.getRepository(AgeAssessment);
    this.immigrationStatusRepository = AppDataSource.getRepository(ImmigrationStatus);
    this.correspondenceRepository = AppDataSource.getRepository(HomeOfficeCorrespondence);
  }

  // ========================================
  // UASC PROFILE METHODS
  // ========================================

  async createUASCProfile(data: Partial<UASCProfile>): Promise<UASCProfile> {
    const profile = this.uascProfileRepository.create({
      ...data,
      uascNumber: await this.generateUASCNumber(),
      status: data.status || UASCStatus.ACTIVE
    });

    return await this.uascProfileRepository.save(profile);
  }

  async getUASCProfile(id: string): Promise<UASCProfile | null> {
    return await this.uascProfileRepository.findOne({
      where: { id },
      relations: ['child', 'organization']
    });
  }

  async getUASCProfileByChild(childId: string): Promise<UASCProfile | null> {
    return await this.uascProfileRepository.findOne({
      where: { childId },
      relations: ['child', 'organization']
    });
  }

  async getUASCProfiles(organizationId: string): Promise<UASCProfile[]> {
    return await this.uascProfileRepository.find({
      where: { organizationId },
      relations: ['child'],
      order: { arrivalDate: 'DESC' }
    });
  }

  async updateUASCProfile(
    id: string,
    data: Partial<UASCProfile>
  ): Promise<UASCProfile> {
    await this.uascProfileRepository.update(id, data);
    const profile = await this.getUASCProfile(id);
    if (!profile) throw new Error('UASC profile not found');
    return profile;
  }

  async getActiveUASCProfiles(organizationId: string): Promise<UASCProfile[]> {
    return await this.uascProfileRepository.find({
      where: {
        organizationId,
        status: UASCStatus.ACTIVE
      },
      relations: ['child'],
      order: { arrivalDate: 'DESC' }
    });
  }

  async getUASCProfilesRequiringAttention(
    organizationId: string
  ): Promise<UASCProfile[]> {
    const profiles = await this.getActiveUASCProfiles(organizationId);
    return profiles.filter(p => p.requiresUrgentAttention());
  }

  async getUASCProfilesByTraffickingRisk(
    organizationId: string,
    riskLevel: TraffickinRiskLevel
  ): Promise<UASCProfile[]> {
    return await this.uascProfileRepository.find({
      where: {
        organizationId,
        status: UASCStatus.ACTIVE,
        traffickingRisk: riskLevel
      },
      relations: ['child']
    });
  }

  // ========================================
  // AGE ASSESSMENT METHODS
  // ========================================

  async createAgeAssessment(
    data: Partial<AgeAssessment>
  ): Promise<AgeAssessment> {
    const assessment = this.ageAssessmentRepository.create({
      ...data,
      assessmentNumber: await this.generateAgeAssessmentNumber(),
      status: data.status || AssessmentStatus.SCHEDULED
    });

    return await this.ageAssessmentRepository.save(assessment);
  }

  async getAgeAssessment(id: string): Promise<AgeAssessment | null> {
    return await this.ageAssessmentRepository.findOne({
      where: { id },
      relations: ['uascProfile']
    });
  }

  async getAgeAssessmentsByProfile(
    uascProfileId: string
  ): Promise<AgeAssessment[]> {
    return await this.ageAssessmentRepository.find({
      where: { uascProfileId },
      order: { scheduledDate: 'DESC' }
    });
  }

  async updateAgeAssessment(
    id: string,
    data: Partial<AgeAssessment>
  ): Promise<AgeAssessment> {
    await this.ageAssessmentRepository.update(id, data);
    const assessment = await this.getAgeAssessment(id);
    if (!assessment) throw new Error('Age assessment not found');
    return assessment;
  }

  async completeAgeAssessment(
    id: string,
    outcome: AssessmentOutcome,
    assessedDateOfBirth: Date,
    reasoningForDecision: string
  ): Promise<AgeAssessment> {
    const assessment = await this.getAgeAssessment(id);
    if (!assessment) throw new Error('Age assessment not found');

    const assessedAge = this.calculateAge(assessedDateOfBirth);

    await this.ageAssessmentRepository.update(id, {
      status: AssessmentStatus.COMPLETED,
      completedDate: new Date(),
      outcome,
      assessedDateOfBirth,
      assessedAge,
      reasoningForDecision
    });

    return await this.getAgeAssessment(id) as AgeAssessment;
  }

  async getOverdueAgeAssessments(
    organizationId: string
  ): Promise<AgeAssessment[]> {
    const assessments = await this.ageAssessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.uascProfile', 'profile')
      .where('profile.organizationId = :organizationId', { organizationId })
      .andWhere('assessment.status IN (:...statuses)', {
        statuses: [AssessmentStatus.SCHEDULED, AssessmentStatus.IN_PROGRESS]
      })
      .getMany();

    return assessments.filter(a => a.isOverdue());
  }

  // ========================================
  // IMMIGRATION STATUS METHODS
  // ========================================

  async createImmigrationStatus(
    data: Partial<ImmigrationStatus>
  ): Promise<ImmigrationStatus> {
    const status = this.immigrationStatusRepository.create({
      ...data,
      statusNumber: await this.generateImmigrationStatusNumber(),
      isCurrent: data.isCurrent ?? true
    });

    // If this is current, mark other statuses for this profile as not current
    if (status.isCurrent) {
      await this.immigrationStatusRepository.update(
        { uascProfileId: status.uascProfileId, isCurrent: true },
        { isCurrent: false }
      );
    }

    return await this.immigrationStatusRepository.save(status);
  }

  async getImmigrationStatus(id: string): Promise<ImmigrationStatus | null> {
    return await this.immigrationStatusRepository.findOne({
      where: { id },
      relations: ['uascProfile']
    });
  }

  async getCurrentImmigrationStatus(
    uascProfileId: string
  ): Promise<ImmigrationStatus | null> {
    return await this.immigrationStatusRepository.findOne({
      where: { uascProfileId, isCurrent: true },
      relations: ['uascProfile']
    });
  }

  async getImmigrationStatusHistory(
    uascProfileId: string
  ): Promise<ImmigrationStatus[]> {
    return await this.immigrationStatusRepository.find({
      where: { uascProfileId },
      order: { statusDate: 'DESC' }
    });
  }

  async updateImmigrationStatus(
    id: string,
    data: Partial<ImmigrationStatus>
  ): Promise<ImmigrationStatus> {
    await this.immigrationStatusRepository.update(id, data);
    const status = await this.getImmigrationStatus(id);
    if (!status) throw new Error('Immigration status not found');
    return status;
  }

  async getImmigrationStatusesRequiringAttention(
    organizationId: string
  ): Promise<ImmigrationStatus[]> {
    const statuses = await this.immigrationStatusRepository
      .createQueryBuilder('status')
      .leftJoinAndSelect('status.uascProfile', 'profile')
      .where('profile.organizationId = :organizationId', { organizationId })
      .andWhere('status.isCurrent = :isCurrent', { isCurrent: true })
      .getMany();

    return statuses.filter(s => s.requiresUrgentAttention());
  }

  // ========================================
  // HOME OFFICE CORRESPONDENCE METHODS
  // ========================================

  async createCorrespondence(
    data: Partial<HomeOfficeCorrespondence>
  ): Promise<HomeOfficeCorrespondence> {
    const correspondence = this.correspondenceRepository.create({
      ...data,
      correspondenceNumber: await this.generateCorrespondenceNumber(),
      status: data.status || CorrespondenceStatus.DRAFT
    });

    return await this.correspondenceRepository.save(correspondence);
  }

  async getCorrespondence(
    id: string
  ): Promise<HomeOfficeCorrespondence | null> {
    return await this.correspondenceRepository.findOne({
      where: { id },
      relations: ['uascProfile']
    });
  }

  async getCorrespondenceByProfile(
    uascProfileId: string
  ): Promise<HomeOfficeCorrespondence[]> {
    return await this.correspondenceRepository.find({
      where: { uascProfileId },
      order: { correspondenceDate: 'DESC' }
    });
  }

  async updateCorrespondence(
    id: string,
    data: Partial<HomeOfficeCorrespondence>
  ): Promise<HomeOfficeCorrespondence> {
    await this.correspondenceRepository.update(id, data);
    const correspondence = await this.getCorrespondence(id);
    if (!correspondence) throw new Error('Correspondence not found');
    return correspondence;
  }

  async markCorrespondenceSent(
    id: string,
    sentDate: Date,
    sentBy: string
  ): Promise<HomeOfficeCorrespondence> {
    await this.correspondenceRepository.update(id, {
      status: CorrespondenceStatus.SENT,
      sentDate,
      sentBy
    });

    return await this.getCorrespondence(id) as HomeOfficeCorrespondence;
  }

  async recordResponse(
    id: string,
    responseDate: Date,
    responseSummary: string,
    responseOutcome: string
  ): Promise<HomeOfficeCorrespondence> {
    await this.correspondenceRepository.update(id, {
      status: CorrespondenceStatus.RESPONDED,
      responseReceived: true,
      responseReceivedDate: responseDate,
      responseSummary,
      responseOutcome
    });

    return await this.getCorrespondence(id) as HomeOfficeCorrespondence;
  }

  async getOverdueCorrespondence(
    organizationId: string
  ): Promise<HomeOfficeCorrespondence[]> {
    const correspondence = await this.correspondenceRepository
      .createQueryBuilder('correspondence')
      .leftJoinAndSelect('correspondence.uascProfile', 'profile')
      .where('profile.organizationId = :organizationId', { organizationId })
      .andWhere('correspondence.status IN (:...statuses)', {
        statuses: [CorrespondenceStatus.SENT, CorrespondenceStatus.PENDING_RESPONSE]
      })
      .getMany();

    return correspondence.filter(c => c.isResponseOverdue());
  }

  async getCorrespondenceRequiringAttention(
    organizationId: string
  ): Promise<HomeOfficeCorrespondence[]> {
    const correspondence = await this.correspondenceRepository
      .createQueryBuilder('correspondence')
      .leftJoinAndSelect('correspondence.uascProfile', 'profile')
      .where('profile.organizationId = :organizationId', { organizationId })
      .getMany();

    return correspondence.filter(c => c.requiresUrgentAttention());
  }

  // ========================================
  // STATISTICS METHODS
  // ========================================

  async getUASCStatistics(organizationId: string) {
    const allProfiles = await this.getUASCProfiles(organizationId);
    const activeProfiles = await this.getActiveUASCProfiles(organizationId);

    const statusBreakdown = await this.uascProfileRepository
      .createQueryBuilder('profile')
      .select('profile.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('profile.organizationId = :organizationId', { organizationId })
      .groupBy('profile.status')
      .getRawMany();

    const arrivalRouteBreakdown = await this.uascProfileRepository
      .createQueryBuilder('profile')
      .select('profile.arrivalRoute', 'route')
      .addSelect('COUNT(*)', 'count')
      .where('profile.organizationId = :organizationId', { organizationId })
      .andWhere('profile.arrivalRoute IS NOT NULL')
      .groupBy('profile.arrivalRoute')
      .getRawMany();

    const countryOfOriginBreakdown = await this.uascProfileRepository
      .createQueryBuilder('profile')
      .select('profile.countryOfOrigin', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('profile.organizationId = :organizationId', { organizationId })
      .groupBy('profile.countryOfOrigin')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const highTraffickingRisk = await this.getUASCProfilesByTraffickingRisk(
      organizationId,
      TraffickinRiskLevel.HIGH
    );

    const veryHighTraffickingRisk = await this.getUASCProfilesByTraffickingRisk(
      organizationId,
      TraffickinRiskLevel.VERY_HIGH
    );

    const overdueAgeAssessments = await this.getOverdueAgeAssessments(organizationId);
    const overdueCorrespondence = await this.getOverdueCorrespondence(organizationId);

    return {
      totalUASC: allProfiles.length,
      activeUASC: activeProfiles.length,
      statusBreakdown,
      arrivalRouteBreakdown,
      countryOfOriginBreakdown,
      trafficking: {
        highRisk: highTraffickingRisk.length,
        veryHighRisk: veryHighTraffickingRisk.length,
        totalHighAndVeryHigh: highTraffickingRisk.length + veryHighTraffickingRisk.length
      },
      overdueItems: {
        ageAssessments: overdueAgeAssessments.length,
        correspondence: overdueCorrespondence.length
      }
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private async generateUASCNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.uascProfileRepository.count({
      where: {
        uascNumber: new RegExp(`UASC-${year}`) as any
      }
    });
    return `UASC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateAgeAssessmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.ageAssessmentRepository.count({
      where: {
        assessmentNumber: new RegExp(`AA-${year}`) as any
      }
    });
    return `AA-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateImmigrationStatusNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.immigrationStatusRepository.count({
      where: {
        statusNumber: new RegExp(`IS-${year}`) as any
      }
    });
    return `IS-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateCorrespondenceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.correspondenceRepository.count({
      where: {
        correspondenceNumber: new RegExp(`HOC-${year}`) as any
      }
    });
    return `HOC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
