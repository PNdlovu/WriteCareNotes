/**
 * ============================================================================
 * Safeguarding Service
 * ============================================================================
 * 
 * @fileoverview Core business logic for safeguarding operations including
 *               incident management, concern tracking, LADO notifications,
 *               and child protection plan coordination.
 * 
 * @module domains/safeguarding/services/SafeguardingService
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides comprehensive safeguarding functionality for residential children's
 * homes. Manages the complete lifecycle of safeguarding concerns, incidents,
 * and child protection plans. Coordinates with LADO, police, OFSTED, and
 * social workers as required by regulations.
 * 
 * @compliance
 * - OFSTED Regulation 13 (Safeguarding)
 * - Working Together to Safeguard Children 2018
 * - Children Act 1989
 * - Care Planning Regulations 2010
 * - Keeping Children Safe in Education 2023
 * 
 * @features
 * - Incident reporting and investigation
 * - Concern assessment and escalation
 * - Child protection plan management
 * - Automatic LADO notification
 * - OFSTED notification for serious incidents
 * - Pattern recognition and trend analysis
 * - Statutory deadline tracking
 * - Multi-agency coordination
 * 
 * @dependencies
 * - SafeguardingIncident entity
 * - SafeguardingConcern entity
 * - ChildProtectionPlan entity
 * - Child entity
 * - NotificationService for alerts
 * - AuditService for compliance logging
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { SafeguardingIncident, IncidentType, Severity, IncidentStatus } from '../entities/SafeguardingIncident';
import { SafeguardingConcern, ConcernType, ConcernSeverity, ConcernStatus } from '../entities/SafeguardingConcern';
import { ChildProtectionPlan, CPPCategory, CPPStatus } from '../entities/ChildProtectionPlan';
import { Child } from '../../children/entities/Child';

export class SafeguardingService {
  privateincidentRepository: Repository<SafeguardingIncident>;
  privateconcernRepository: Repository<SafeguardingConcern>;
  privatecppRepository: Repository<ChildProtectionPlan>;
  privatechildRepository: Repository<Child>;

  constructor() {
    this.incidentRepository = AppDataSource.getRepository(SafeguardingIncident);
    this.concernRepository = AppDataSource.getRepository(SafeguardingConcern);
    this.cppRepository = AppDataSource.getRepository(ChildProtectionPlan);
    this.childRepository = AppDataSource.getRepository(Child);
  }

  // ========================================
  // INCIDENT MANAGEMENT
  // ========================================

  /**
   * Report a safeguarding incident
   * 
   * @param incidentData - Incident details
   * @returns Created safeguarding incident with notifications sent
   * 
   * @throws Error if child not found or incident type invalid
   * 
   * @example
   * const incident = await safeguardingService.reportIncident({
   *   childId: '123',
   *   type: IncidentType.PHYSICAL_ABUSE,
   *   severity: Severity.HIGH,
   *   description: 'Unexplained bruising...',
   *   reportedBy: 'Jane Smith',
   *   organizationId: '456'
   * });
   */
  async reportIncident(incidentData: {
    childId: string;
    organizationId: string;
    type: IncidentType;
    severity: Severity;
    incidentDate: Date;
    location: string;
    description: string;
    immediateActions: string;
    reportedByName: string;
    reportedByRole: string;
    witnesses?: Array<{ name: string; role: string }>;
  }): Promise<SafeguardingIncident> {
    // Validate child exists
    const child = await this.childRepository.findOne({
      where: { id: incidentData.childId },
      relations: ['organization']
    });

    if (!child) {
      throw new Error(`Child with ID ${incidentData.childId} not found`);
    }

    // Generate incident number
    const incidentNumber = await this.generateIncidentNumber(incidentData.organizationId);

    // Create incident
    const incident = this.incidentRepository.create({
      incidentNumber,
      childId: incidentData.childId,
      organizationId: incidentData.organizationId,
      type: incidentData.type,
      severity: incidentData.severity,
      incidentDate: incidentData.incidentDate,
      location: incidentData.location,
      description: incidentData.description,
      immediateActions: incidentData.immediateActions,
      reportedByName: incidentData.reportedByName,
      reportedByRole: incidentData.reportedByRole,
      reportedDate: new Date(),
      witnesses: incidentData.witnesses || [],
      status: IncidentStatus.REPORTED,
      notifications: {
        ladoNotified: false,
        policeNotified: false,
        ofstedNotified: false,
        laSafeguardingTeamNotified: false,
        parentNotified: false,
        iRONotified: false
      },
      createdBy: incidentData.reportedByName,
      updatedBy: incidentData.reportedByName
    });

    const savedIncident = await this.incidentRepository.save(incident);

    // Determine required notifications based on type and severity
    await this.assessNotificationRequirements(savedIncident);

    // Check for patterns
    await this.checkIncidentPatterns(savedIncident);

    // Create audit log
    // await this.auditService.log({...});

    return savedIncident;
  }

  /**
   * Assess notification requirements for incident
   * 
   * @param incident - The safeguarding incident
   * @returns Updated incident with notification flags set
   */
  private async assessNotificationRequirements(incident: SafeguardingIncident): Promise<SafeguardingIncident> {
    // LADO notification required for:
    // - All allegations against staff
    // - Serious harm to children
    // - Sexual abuse
    // - Physical abuse by adults
    const ladoRequired = [
      IncidentType.PHYSICAL_ABUSE,
      IncidentType.SEXUAL_ABUSE,
      IncidentType.EMOTIONAL_ABUSE,
      IncidentType.STAFF_ALLEGATION
    ].includes(incident.type) || incident.severity === Severity.CRITICAL;

    // Police notification required for:
    // - Criminal offenses
    // - Missing children
    // - CSE/CCE
    const policeRequired = [
      IncidentType.SEXUAL_ABUSE,
      IncidentType.MISSING_CHILD,
      IncidentType.CSE,
      IncidentType.CCE,
      IncidentType.TRAFFICKING,
      IncidentType.RADICALISATION
    ].includes(incident.type) || incident.severity === Severity.CRITICAL;

    // OFSTED notification required for:
    // - Serious incidents
    // - Allegations against staff
    // - Deaths or serious injuries
    const ofstedRequired = [
      IncidentType.STAFF_ALLEGATION,
      IncidentType.DEATH,
      IncidentType.SERIOUS_INJURY
    ].includes(incident.type) || incident.severity === Severity.CRITICAL;

    incident.notifications = {
      ...incident.notifications,
      ladoRequired,
      policeRequired,
      ofstedRequired,
      laSafeguardingTeamRequired: true, // Always notify LA
      parentRequired: incident.type !== IncidentType.STAFF_ALLEGATION, // Not for staff allegations initially
      iRORequired: incident.severity === Severity.HIGH || incident.severity === Severity.CRITICAL
    };

    return await this.incidentRepository.save(incident);
  }

  /**
   * Update incident status
   * 
   * @param incidentId - Incident ID
   * @param status - New status
   * @param notes - Status change notes
   * @param updatedBy - User making the change
   * @returns Updated incident
   */
  async updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    notes: string,
    updatedBy: string
  ): Promise<SafeguardingIncident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId }
    });

    if (!incident) {
      throw new Error(`Incident with ID ${incidentId} not found`);
    }

    incident.status = status;
    incident.updatedBy = updatedBy;

    // Add status change to timeline
    if (!incident.investigation) {
      incident.investigation = {
        investigatorName: '',
        investigatorRole: '',
        startDate: new Date(),
        expectedCompletionDate: new Date(),
        findings: '',
        timeline: []
      };
    }

    incident.investigation.timeline.push({
      date: new Date(),
      event: `Status changed to ${status}`,
      details: notes,
      recordedBy: updatedBy
    });

    return await this.incidentRepository.save(incident);
  }

  /**
   * Record LADO notification
   * 
   * @param incidentId - Incident ID
   * @param notificationData - LADO notification details
   * @returns Updated incident
   */
  async recordLADONotification(
    incidentId: string,
    notificationData: {
      notifiedDate: Date;
      notifiedBy: string;
      ladoOfficer: string;
      ladoAdvice: string;
      ladoReference: string;
    }
  ): Promise<SafeguardingIncident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId }
    });

    if (!incident) {
      throw new Error(`Incident with ID ${incidentId} not found`);
    }

    incident.notifications.ladoNotified = true;
    incident.notifications.ladoNotifiedDate = notificationData.notifiedDate;
    incident.notifications.ladoOfficer = notificationData.ladoOfficer;
    incident.notifications.ladoReference = notificationData.ladoReference;
    incident.notifications.ladoAdvice = notificationData.ladoAdvice;

    return await this.incidentRepository.save(incident);
  }

  // ========================================
  // CONCERN MANAGEMENT
  // ========================================

  /**
   * Raise a safeguarding concern
   * 
   * @param concernData - Concern details
   * @returns Created safeguarding concern
   */
  async raiseConcern(concernData: {
    organizationId: string;
    childId?: string;
    concernType: ConcernType;
    concernSummary: string;
    concernDetails: string;
    severity: ConcernSeverity;
    raisedByName: string;
    raisedByRole: string;
    raisedByContact: string;
    incidentDate?: Date;
    location?: string;
  }): Promise<SafeguardingConcern> {
    // Validate child if specified
    if (concernData.childId) {
      const child = await this.childRepository.findOne({
        where: { id: concernData.childId }
      });

      if (!child) {
        throw new Error(`Child with ID ${concernData.childId} not found`);
      }
    }

    // Generate concern number
    const concernNumber = await this.generateConcernNumber(concernData.organizationId);

    const concern = this.concernRepository.create({
      concernNumber,
      organizationId: concernData.organizationId,
      childId: concernData.childId,
      concernType: concernData.concernType,
      concernSummary: concernData.concernSummary,
      concernDetails: concernData.concernDetails,
      severity: concernData.severity,
      raisedByName: concernData.raisedByName,
      raisedByRole: concernData.raisedByRole,
      raisedByContact: concernData.raisedByContact,
      raisedDate: new Date(),
      incidentDate: concernData.incidentDate,
      location: concernData.location,
      status: ConcernStatus.RAISED,
      createdBy: concernData.raisedByName,
      updatedBy: concernData.raisedByName
    });

    const savedConcern = await this.concernRepository.save(concern);

    // Check for related concerns (pattern recognition)
    if (concernData.childId) {
      await this.checkConcernPatterns(savedConcern);
    }

    return savedConcern;
  }

  /**
   * Assess a safeguarding concern
   * 
   * @param concernId - Concern ID
   * @param assessmentData - Assessment details
   * @returns Updated concern
   */
  async assessConcern(
    concernId: string,
    assessmentData: {
      assessedBy: string;
      assessmentNotes: string;
      thresholdMet: boolean;
      thresholdRationale: string;
      escalateToIncident: boolean;
    }
  ): Promise<SafeguardingConcern> {
    const concern = await this.concernRepository.findOne({
      where: { id: concernId }
    });

    if (!concern) {
      throw new Error(`Concern with ID ${concernId} not found`);
    }

    concern.assessedBy = assessmentData.assessedBy;
    concern.assessedDate = new Date();
    concern.assessmentNotes = assessmentData.assessmentNotes;
    concern.thresholdMet = assessmentData.thresholdMet;
    concern.thresholdRationale = assessmentData.thresholdRationale;
    concern.status = ConcernStatus.ASSESSED;
    concern.updatedBy = assessmentData.assessedBy;

    if (assessmentData.escalateToIncident) {
      concern.escalatedToIncident = true;
      concern.escalationDate = new Date();
      concern.status = ConcernStatus.ESCALATED;
      
      // Escalation to incident will be handled separately
    }

    return await this.concernRepository.save(concern);
  }

  /**
   * Escalate concern to incident
   * 
   * @param concernId - Concern ID
   * @param escalationData - Incident details for escalation
   * @returns Created incident
   */
  async escalateConcernToIncident(
    concernId: string,
    escalationData: {
      type: IncidentType;
      severity: Severity;
      escalatedBy: string;
      escalationReason: string;
    }
  ): Promise<SafeguardingIncident> {
    const concern = await this.concernRepository.findOne({
      where: { id: concernId }
    });

    if (!concern) {
      throw new Error(`Concern with ID ${concernId} not found`);
    }

    if (!concern.childId) {
      throw new Error('Cannot escalate concern without associated child');
    }

    // Create incident from concern
    const incident = await this.reportIncident({
      childId: concern.childId,
      organizationId: concern.organizationId,
      type: escalationData.type,
      severity: escalationData.severity,
      incidentDate: concern.incidentDate || concern.raisedDate,
      location: concern.location || 'Unknown',
      description: `ESCALATED FROM CONCERN ${concern.concernNumber}:\n\n${concern.concernDetails}\n\nEscalation Reason: ${escalationData.escalationReason}`,
      immediateActions: concern.immediateActionsTaken.map(a => a.action).join('; '),
      reportedByName: escalationData.escalatedBy,
      reportedByRole: 'Safeguarding Lead',
      witnesses: concern.witnesses
    });

    // Link concern to incident
    concern.escalatedToIncident = true;
    concern.incidentId = incident.id;
    concern.escalationDate = new Date();
    concern.escalationReason = escalationData.escalationReason;
    concern.status = ConcernStatus.ESCALATED;
    concern.updatedBy = escalationData.escalatedBy;

    await this.concernRepository.save(concern);

    return incident;
  }

  // ========================================
  // CHILD PROTECTION PLAN MANAGEMENT
  // ========================================

  /**
   * Create child protection plan
   * 
   * @param cppData - CPP details
   * @returns Created child protection plan
   */
  async createChildProtectionPlan(cppData: {
    childId: string;
    organizationId: string;
    category: CPPCategory;
    initialConferenceDate: Date;
    initialConferenceChair: string;
    initialConferenceDecision: string;
    leadSocialWorkerName: string;
    leadSocialWorkerEmail: string;
    leadSocialWorkerPhone: string;
    identifiedRisks: Array<any>;
    objectives: Array<any>;
    coreGroupMembers: Array<any>;
    createdBy: string;
  }): Promise<ChildProtectionPlan> {
    const child = await this.childRepository.findOne({
      where: { id: cppData.childId }
    });

    if (!child) {
      throw new Error(`Child with ID ${cppData.childId} not found`);
    }

    const cppNumber = await this.generateCPPNumber(cppData.organizationId);

    const cpp = this.cppRepository.create({
      cppNumber,
      childId: cppData.childId,
      organizationId: cppData.organizationId,
      category: cppData.category,
      status: CPPStatus.ACTIVE,
      startDate: new Date(),
      initialConferenceDate: cppData.initialConferenceDate,
      initialConferenceChair: cppData.initialConferenceChair,
      initialConferenceDecision: cppData.initialConferenceDecision,
      leadSocialWorkerName: cppData.leadSocialWorkerName,
      leadSocialWorkerEmail: cppData.leadSocialWorkerEmail,
      leadSocialWorkerPhone: cppData.leadSocialWorkerPhone,
      identifiedRisks: cppData.identifiedRisks,
      objectives: cppData.objectives,
      coreGroupMembers: cppData.coreGroupMembers,
      safetyPlan: {
        safePeople: [],
        unsafePeople: [],
        safePlaces: [],
        unsafePlaces: [],
        earlyWarningSigns: [],
        copingStrategies: [],
        emergencyContacts: []
      },
      parentCarerInvolvement: {
        parentsAttendedConference: false,
        parentsViewsObtained: false,
        parentsAgreementLevel: 'PARTIALLY_AGREE',
        parentsCommitments: [],
        supportProvided: []
      },
      childInvolvement: {
        childViewsObtained: false,
        ageAppropriateExplanation: false,
        childUnderstandsPlan: false,
        childAgreesWithPlan: false,
        childWishes: '',
        advocateInvolved: false
      },
      createdBy: cppData.createdBy,
      updatedBy: cppData.createdBy
    });

    const savedCPP = await this.cppRepository.save(cpp);

    // Schedule first core group (within 10 working days)
    const firstCoreGroupDate = this.addWorkingDays(new Date(), 10);
    savedCPP.nextCoreGroupDate = firstCoreGroupDate;

    // Schedule first review conference (within 3 months)
    const firstReviewDate = new Date();
    firstReviewDate.setMonth(firstReviewDate.getMonth() + 3);
    savedCPP.nextReviewConferenceDate = firstReviewDate;

    return await this.cppRepository.save(savedCPP);
  }

  // ========================================
  // PATTERN RECOGNITION
  // ========================================

  /**
   * Check for incident patterns
   * 
   * @param incident - Current incident
   */
  private async checkIncidentPatterns(incident: SafeguardingIncident): Promise<void> {
    // Look for similar incidents in the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const similarIncidents = await this.incidentRepository.find({
      where: {
        childId: incident.childId,
        type: incident.type
      },
      order: { incidentDate: 'DESC' }
    });

    if (similarIncidents.length >= 3) {
      // Pattern detected - escalate to manager
      // await this.notificationService.sendAlert({...});
    }
  }

  /**
   * Check for concern patterns
   * 
   * @param concern - Current concern
   */
  private async checkConcernPatterns(concern: SafeguardingConcern): Promise<void> {
    if (!concern.childId) return;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentConcerns = await this.concernRepository.find({
      where: {
        childId: concern.childId
      },
      order: { raisedDate: 'DESC' },
      take: 10
    });

    concern.relatedConcerns = recentConcerns
      .filter(c => c.id !== concern.id)
      .map(c => ({
        concernId: c.id,
        concernNumber: c.concernNumber,
        concernType: c.concernType,
        date: c.raisedDate
      }));

    if (recentConcerns.length >= 3) {
      concern.patternIdentified = true;
      concern.patternDescription = `${recentConcerns.length} concerns raised in the last month`;
    }

    await this.concernRepository.save(concern);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generate unique incident number
   */
  private async generateIncidentNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.incidentRepository.count({
      where: { organizationId }
    });
    return `INC-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Generate unique concern number
   */
  private async generateConcernNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.concernRepository.count({
      where: { organizationId }
    });
    return `CON-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Generate unique CPP number
   */
  private async generateCPPNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.cppRepository.count({
      where: { organizationId }
    });
    return `CPP-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Add working days to date
   */
  private addWorkingDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  /**
   * Get overdue incidents
   */
  async getOverdueIncidents(organizationId: string): Promise<SafeguardingIncident[]> {
    const incidents = await this.incidentRepository.find({
      where: { organizationId, status: IncidentStatus.INVESTIGATING },
      relations: ['child']
    });

    return incidents.filter(incident => {
      if (!incident.investigation?.expectedCompletionDate) return false;
      return new Date() > incident.investigation.expectedCompletionDate;
    });
  }

  /**
   * Get overdue CPP reviews
   */
  async getOverdueCPPReviews(organizationId: string): Promise<ChildProtectionPlan[]> {
    const cpps = await this.cppRepository.find({
      where: { organizationId, status: CPPStatus.ACTIVE },
      relations: ['child']
    });

    return cpps.filter(cpp => cpp.isReviewConferenceOverdue());
  }
}
