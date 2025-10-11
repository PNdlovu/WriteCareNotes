/**
 * ============================================================================
 * Family Contact Service
 * ============================================================================
 * 
 * @fileoverview Core business logic for family contact management including
 *               contact scheduling, session recording, and risk assessment.
 * 
 * @module domains/family/services/FamilyContactService
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides comprehensive family contact functionality for residential children's
 * homes. Manages family member registration, contact schedules, session recording,
 * risk assessments, and statutory compliance monitoring.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Children's views, wishes and feelings)
 * - Children Act 1989, Section 22(4) & Section 34
 * - Adoption and Children Act 2002
 * - Human Rights Act 1998, Article 8
 * - Working Together to Safeguard Children 2018
 * 
 * @features
 * - Family member registration and verification
 * - Contact schedule management
 * - Session recording and monitoring
 * - Risk assessment coordination
 * - Compliance tracking
 * - Statistical reporting
 * 
 * @dependencies
 * - FamilyMember entity
 * - ContactSchedule entity
 * - ContactSession entity
 * - ContactRiskAssessment entity
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { FamilyMember, FamilyMemberStatus, RelationshipType } from '../entities/FamilyMember';
import { ContactSchedule, ContactScheduleStatus, ContactFrequency } from '../entities/ContactSchedule';
import { ContactSession, ContactSessionStatus } from '../entities/ContactSession';
import { ContactRiskAssessment, RiskAssessmentStatus, RiskLevel } from '../entities/ContactRiskAssessment';
import { Child } from '../../children/entities/Child';

export class FamilyContactService {
  privatefamilyMemberRepository: Repository<FamilyMember>;
  privatecontactScheduleRepository: Repository<ContactSchedule>;
  privatecontactSessionRepository: Repository<ContactSession>;
  privatecontactRiskAssessmentRepository: Repository<ContactRiskAssessment>;
  privatechildRepository: Repository<Child>;

  const ructor() {
    this.familyMemberRepository = AppDataSource.getRepository(FamilyMember);
    this.contactScheduleRepository = AppDataSource.getRepository(ContactSchedule);
    this.contactSessionRepository = AppDataSource.getRepository(ContactSession);
    this.contactRiskAssessmentRepository = AppDataSource.getRepository(ContactRiskAssessment);
    this.childRepository = AppDataSource.getRepository(Child);
  }

  // ========================================
  // FAMILY MEMBER MANAGEMENT
  // ========================================

  /**
   * Register new family member
   */
  async registerFamilyMember(memberData: {
    childId: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    relationshipType: RelationshipType;
    hasParentalResponsibility: boolean;
    contactRestrictionLevel: string;
    createdBy: string;
  }): Promise<FamilyMember> {
    const child = await this.childRepository.findOne({
      where: { id: memberData.childId }
    });

    if (!child) {
      throw new Error(`Child with ID ${memberData.childId} not found`);
    }

    const familyMemberNumber = await this.generateFamilyMemberNumber(memberData.organizationId);

    const familyMember = this.familyMemberRepository.create({
      familyMemberNumber,
      ...memberData,
      status: FamilyMemberStatus.ACTIVE
    });

    return await this.familyMemberRepository.save(familyMember);
  }

  /**
   * Get family members for child
   */
  async getFamilyMembers(childId: string): Promise<FamilyMember[]> {
    return await this.familyMemberRepository.find({
      where: { childId },
      order: { relationshipType: 'ASC', lastName: 'ASC' }
    });
  }

  /**
   * Get active family members
   */
  async getActiveFamilyMembers(childId: string): Promise<FamilyMember[]> {
    return await this.familyMemberRepository.find({
      where: { 
        childId,
        status: FamilyMemberStatus.ACTIVE
      }
    });
  }

  /**
   * Update family member
   */
  async updateFamilyMember(
    memberId: string,
    updateData: Partial<FamilyMember>
  ): Promise<FamilyMember> {
    const member = await this.familyMemberRepository.findOne({
      where: { id: memberId }
    });

    if (!member) {
      throw new Error(`Family member with ID ${memberId} not found`);
    }

    Object.assign(member, updateData);
    member.version += 1;

    return await this.familyMemberRepository.save(member);
  }

  /**
   * Get family members with expired DBS checks
   */
  async getFamilyMembersWithExpiredDBS(organizationId: string): Promise<FamilyMember[]> {
    const members = await this.familyMemberRepository.find({
      where: { organizationId, dbsCheckRequired: true }
    });

    return members.filter(member => !member.hasValidDBSCheck());
  }

  // ========================================
  // CONTACT SCHEDULE MANAGEMENT
  // ========================================

  /**
   * Create contact schedule
   */
  async createContactSchedule(scheduleData: {
    childId: string;
    familyMemberId: string;
    organizationId: string;
    contactType: string;
    contactFrequency: ContactFrequency;
    supervisionRequired: boolean;
    durationMinutes: number;
    startDate: Date;
    createdBy: string;
  }): Promise<ContactSchedule> {
    // Verify child exists
    const child = await this.childRepository.findOne({
      where: { id: scheduleData.childId }
    });

    if (!child) {
      throw new Error(`Child with ID ${scheduleData.childId} not found`);
    }

    // Verify family member exists
    const familyMember = await this.familyMemberRepository.findOne({
      where: { id: scheduleData.familyMemberId }
    });

    if (!familyMember) {
      throw new Error(`Family member with ID ${scheduleData.familyMemberId} not found`);
    }

    // Check if contact is allowed
    if (!familyMember.isContactAllowed()) {
      throw new Error(`Contact not allowed for family member ${familyMember.getFullName()}`);
    }

    // Generate schedule number
    const scheduleNumber = await this.generateContactScheduleNumber(scheduleData.organizationId);

    // Calculate next review date (6 months)
    const nextReviewDate = new Date(scheduleData.startDate);
    nextReviewDate.setMonth(nextReviewDate.getMonth() + 6);

    const schedule = this.contactScheduleRepository.create({
      contactScheduleNumber: scheduleNumber,
      ...scheduleData,
      nextReviewDate
    });

    return await this.contactScheduleRepository.save(schedule);
  }

  /**
   * Get active contact schedules for child
   */
  async getActiveContactSchedules(childId: string): Promise<ContactSchedule[]> {
    const schedules = await this.contactScheduleRepository.find({
      where: { childId },
      relations: ['familyMember']
    });

    return schedules.filter(schedule => schedule.isActive());
  }

  /**
   * Get contact schedules requiring review
   */
  async getSchedulesRequiringReview(organizationId: string): Promise<ContactSchedule[]> {
    const schedules = await this.contactScheduleRepository.find({
      where: { organizationId, status: ContactScheduleStatus.ACTIVE },
      relations: ['child', 'familyMember']
    });

    return schedules.filter(schedule => schedule.isReviewDue());
  }

  /**
   * Suspend contact schedule
   */
  async suspendContactSchedule(
    scheduleId: string,
    reason: string,
    updatedBy: string
  ): Promise<ContactSchedule> {
    const schedule = await this.contactScheduleRepository.findOne({
      where: { id: scheduleId }
    });

    if (!schedule) {
      throw new Error(`Contact schedule with ID ${scheduleId} not found`);
    }

    schedule.status = ContactScheduleStatus.SUSPENDED;
    schedule.notes = `${schedule.notes || ''}\n\nSuspended: ${reason} (${new Date().toISOString()})`;
    schedule.updatedBy = updatedBy;
    schedule.version += 1;

    return await this.contactScheduleRepository.save(schedule);
  }

  // ========================================
  // CONTACT SESSION MANAGEMENT
  // ========================================

  /**
   * Schedule contact session
   */
  async scheduleContactSession(sessionData: {
    childId: string;
    familyMemberId: string;
    contactScheduleId?: string;
    organizationId: string;
    sessionDate: Date;
    scheduledStartTime: string;
    scheduledEndTime: string;
    supervised: boolean;
    createdBy: string;
  }): Promise<ContactSession> {
    const sessionNumber = await this.generateSessionNumber(sessionData.organizationId);

    const session = this.contactSessionRepository.create({
      sessionNumber,
      ...sessionData,
      status: ContactSessionStatus.SCHEDULED
    });

    const savedSession = await this.contactSessionRepository.save(session);

    // Update contact schedule counter
    if (sessionData.contactScheduleId) {
      const schedule = await this.contactScheduleRepository.findOne({
        where: { id: sessionData.contactScheduleId }
      });
      if (schedule) {
        schedule.totalContactsScheduled += 1;
        await this.contactScheduleRepository.save(schedule);
      }
    }

    return savedSession;
  }

  /**
   * Record contact session
   */
  async recordContactSession(
    sessionId: string,
    sessionData: {
      actualStartTime: string;
      actualEndTime: string;
      childAttendance: string;
      familyMemberAttendance: string;
      interactionQuality: string;
      overallAssessment: string;
      completedBy: string;
    }
  ): Promise<ContactSession> {
    const session = await this.contactSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['contactSchedule']
    });

    if (!session) {
      throw new Error(`Contact session with ID ${sessionId} not found`);
    }

    // Calculate duration
    const duration = session.calculateDuration();

    session.status = ContactSessionStatus.COMPLETED;
    session.durationMinutes = duration;
    session.completedDate = new Date();
    Object.assign(session, sessionData);
    session.version += 1;

    const savedSession = await this.contactSessionRepository.save(session);

    // Update contact schedule
    if (session.contactSchedule) {
      const schedule = session.contactSchedule;
      schedule.totalContactsCompleted += 1;
      schedule.lastContactDate = session.sessionDate;
      
      // Calculate next contact date based on frequency
      schedule.nextContactDate = this.calculateNextContactDate(
        session.sessionDate,
        schedule.contactFrequency
      );

      await this.contactScheduleRepository.save(schedule);
    }

    return savedSession;
  }

  /**
   * Cancel contact session
   */
  async cancelContactSession(
    sessionId: string,
    cancellationData: {
      cancelledBy: string;
      cancellationReason: string;
      rescheduled: boolean;
      rescheduledDate?: Date;
    }
  ): Promise<ContactSession> {
    const session = await this.contactSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['contactSchedule']
    });

    if (!session) {
      throw new Error(`Contact session with ID ${sessionId} not found`);
    }

    session.status = ContactSessionStatus.CANCELLED;
    session.cancellationDate = new Date();
    Object.assign(session, cancellationData);

    const savedSession = await this.contactSessionRepository.save(session);

    // Update contact schedule counter
    if (session.contactSchedule) {
      const schedule = session.contactSchedule;
      schedule.totalContactsCancelled += 1;
      await this.contactScheduleRepository.save(schedule);
    }

    return savedSession;
  }

  /**
   * Get contact sessions for child
   */
  async getContactSessions(
    childId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      familyMemberId?: string;
    }
  ): Promise<ContactSession[]> {
    const where: any = { childId };

    if (options?.familyMemberId) {
      where.familyMemberId = options.familyMemberId;
    }

    const sessions = await this.contactSessionRepository.find({
      where,
      relations: ['familyMember'],
      order: { sessionDate: 'DESC' }
    });

    if (options?.startDate || options?.endDate) {
      return sessions.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        if (options.startDate && sessionDate < options.startDate) return false;
        if (options.endDate && sessionDate > options.endDate) return false;
        return true;
      });
    }

    return sessions;
  }

  /**
   * Get sessions requiring urgent review
   */
  async getSessionsRequiringUrgentReview(organizationId: string): Promise<ContactSession[]> {
    const sessions = await this.contactSessionRepository.find({
      where: { 
        organizationId,
        status: ContactSessionStatus.COMPLETED
      },
      relations: ['child', 'familyMember']
    });

    return sessions.filter(session => session.requiresUrgentReview());
  }

  // ========================================
  // RISK ASSESSMENT MANAGEMENT
  // ========================================

  /**
   * Create contact risk assessment
   */
  async createRiskAssessment(assessmentData: {
    childId: string;
    familyMemberId: string;
    organizationId: string;
    assessmentDate: Date;
    assessedByName: string;
    assessedByRole: string;
    overallRiskLevel: RiskLevel;
    riskSummary: string;
    keyConcerns: string;
    contactRecommended: boolean;
    recommendationRationale: string;
    createdBy: string;
  }): Promise<ContactRiskAssessment> {
    const assessmentNumber = await this.generateRiskAssessmentNumber(assessmentData.organizationId);

    // Calculate next review date based on risk level
    const nextReviewDate = new Date(assessmentData.assessmentDate);
    const reviewMonths = this.getReviewFrequencyForRiskLevel(assessmentData.overallRiskLevel);
    nextReviewDate.setMonth(nextReviewDate.getMonth() + reviewMonths);

    const assessment = this.contactRiskAssessmentRepository.create({
      assessmentNumber,
      ...assessmentData,
      assessmentType: 'Contact Risk Assessment',
      identifiedRisks: [],
      mitigationStrategies: [],
      nextReviewDate,
      reviewFrequencyMonths: reviewMonths
    });

    return await this.contactRiskAssessmentRepository.save(assessment);
  }

  /**
   * Get current risk assessment for family member
   */
  async getCurrentRiskAssessment(
    childId: string,
    familyMemberId: string
  ): Promise<ContactRiskAssessment | null> {
    const assessments = await this.contactRiskAssessmentRepository.find({
      where: { 
        childId,
        familyMemberId,
        status: RiskAssessmentStatus.APPROVED
      },
      order: { assessmentDate: 'DESC' }
    });

    const currentAssessments = assessments.filter(a => a.isCurrent());
    return currentAssessments.length > 0 ? currentAssessments[0] : null;
  }

  /**
   * Get overdue risk assessments
   */
  async getOverdueRiskAssessments(organizationId: string): Promise<ContactRiskAssessment[]> {
    const assessments = await this.contactRiskAssessmentRepository.find({
      where: { 
        organizationId,
        status: RiskAssessmentStatus.APPROVED
      },
      relations: ['child', 'familyMember']
    });

    return assessments.filter(assessment => assessment.isReviewOverdue());
  }

  /**
   * Approve risk assessment
   */
  async approveRiskAssessment(
    assessmentId: string,
    approvalData: {
      approvedBy: string;
      approvedByName: string;
      approvedByRole: string;
      approvalComments?: string;
    }
  ): Promise<ContactRiskAssessment> {
    const assessment = await this.contactRiskAssessmentRepository.findOne({
      where: { id: assessmentId }
    });

    if (!assessment) {
      throw new Error(`Risk assessment with ID ${assessmentId} not found`);
    }

    assessment.status = RiskAssessmentStatus.APPROVED;
    assessment.approvalDate = new Date();
    Object.assign(assessment, approvalData);

    return await this.contactRiskAssessmentRepository.save(assessment);
  }

  // ========================================
  // STATISTICS & REPORTING
  // ========================================

  /**
   * Get family contact statistics
   */
  async getFamilyContactStatistics(organizationId: string): Promise<any> {
    const [
      totalFamilyMembers,
      activeSchedules,
      upcomingSessions,
      overdueReviews,
      highRiskAssessments
    ] = await Promise.all([
      this.familyMemberRepository.count({ where: { organizationId } }),
      this.contactScheduleRepository.count({ 
        where: { organizationId, status: ContactScheduleStatus.ACTIVE } 
      }),
      this.contactSessionRepository.count({
        where: { organizationId, status: ContactSessionStatus.SCHEDULED }
      }),
      this.getSchedulesRequiringReview(organizationId),
      this.contactRiskAssessmentRepository.count({
        where: { 
          organizationId,
          overallRiskLevel: RiskLevel.HIGH
        }
      })
    ]);

    return {
      familyMembers: {
        total: totalFamilyMembers
      },
      schedules: {
        active: activeSchedules,
        overdueReview: overdueReviews.length
      },
      sessions: {
        upcoming: upcomingSessions
      },
      riskAssessments: {
        highRisk: highRiskAssessments
      }
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generate unique family member number
   */
  private async generateFamilyMemberNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.familyMemberRepository.count({ where: { organizationId } });
    return `FM-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Generate unique contact schedule number
   */
  private async generateContactScheduleNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.contactScheduleRepository.count({ where: { organizationId } });
    return `CS-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Generate unique session number
   */
  private async generateSessionNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.contactSessionRepository.count({ where: { organizationId } });
    return `SESS-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Generate unique risk assessment number
   */
  private async generateRiskAssessmentNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.contactRiskAssessmentRepository.count({ where: { organizationId } });
    return `CRA-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Calculate next contact date based on frequency
   */
  private calculateNextContactDate(lastDate: Date, frequency: ContactFrequency): Date {
    const next = new Date(lastDate);
    
    switch (frequency) {
      case ContactFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case ContactFrequency.TWICE_WEEKLY:
        next.setDate(next.getDate() + 3);
        break;
      case ContactFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case ContactFrequency.FORTNIGHTLY:
        next.setDate(next.getDate() + 14);
        break;
      case ContactFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case ContactFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        break;
      case ContactFrequency.ANNUALLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
    
    return next;
  }

  /**
   * Get review frequency based on risk level
   */
  private getReviewFrequencyForRiskLevel(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case RiskLevel.CRITICAL:
      case RiskLevel.VERY_HIGH:
        return 3; // 3 months
      case RiskLevel.HIGH:
        return 6; // 6 months
      case RiskLevel.MEDIUM:
        return 12; // 12 months
      case RiskLevel.LOW:
      default:
        return 12; // 12 months
    }
  }
}
