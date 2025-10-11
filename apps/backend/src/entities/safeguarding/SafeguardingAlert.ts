import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Safeguarding Alert Entity
 * @module SafeguardingAlert
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive safeguarding alert management entity with full
 * regulatory compliance for British Isles care home requirements.
 * 
 * @compliance
 * - CQC Regulation 13 - Safeguarding service users from abuse
 * - Care Act 2014 - Safeguarding duties
 * - Mental Capacity Act 2005 - Protection of vulnerable adults
 * - Human Rights Act 1998 - Dignity and respect
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum SafeguardingAlertType {
  PHYSICAL_ABUSE = 'physical_abuse',
  EMOTIONAL_ABUSE = 'emotional_abuse',
  SEXUAL_ABUSE = 'sexual_abuse',
  FINANCIAL_ABUSE = 'financial_abuse',
  NEGLECT = 'neglect',
  DISCRIMINATION = 'discrimination',
  INSTITUTIONAL_ABUSE = 'institutional_abuse',
  DOMESTIC_VIOLENCE = 'domestic_violence',
  MODERN_SLAVERY = 'modern_slavery',
  SELF_NEGLECT = 'self_neglect',
  CYBERBULLYING = 'cyberbullying',
  MATE_CRIME = 'mate_crime'
}

export enum SafeguardingAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export enum SafeguardingAlertStatus {
  REPORTED = 'reported',
  ACKNOWLEDGED = 'acknowledged',
  INVESTIGATING = 'investigating',
  ACTION_TAKEN = 'action_taken',
  RESOLVED = 'resolved',
  UNFOUNDED = 'unfounded',
  REFERRED_EXTERNAL = 'referred_external',
  MONITORING = 'monitoring'
}

export enum SafeguardingAlertSource {
  STAFF_OBSERVATION = 'staff_observation',
  RESIDENT_DISCLOSURE = 'resident_disclosure',
  FAMILY_CONCERN = 'family_concern',
  VISITOR_REPORT = 'visitor_report',
  HEALTHCARE_PROFESSIONAL = 'healthcare_professional',
  EXTERNAL_AGENCY = 'external_agency',
  AUTOMATED_DETECTION = 'automated_detection',
  WHISTLEBLOWER = 'whistleblower',
  ANONYMOUS_REPORT = 'anonymous_report'
}

export interface SafeguardingEvidence {
  evidenceType: 'photograph' | 'document' | 'witness_statement' | 'medical_report' | 'cctv' | 'audio_recording' | 'other';
  description: string;
  fileUrl?: string;
  encryptedContent?: string;
  collectingOfficer: string;
  collectedAt: Date;
  chainOfCustody: string[];
  evidenceHash: string;
  admissible: boolean;
}

export interface ExternalReporting {
  cqc: {
    reported: boolean;
    reportedAt?: Date;
    referenceNumber?: string;
    reportedBy: string;
    followUpRequired: boolean;
  };
  police: {
    reported: boolean;
    reportedAt?: Date;
    crimeNumber?: string;
    reportedBy: string;
    officerAssigned?: string;
  };
  localAuthority: {
    reported: boolean;
    reportedAt?: Date;
    referenceNumber?: string;
    reportedBy: string;
    socialWorkerAssigned?: string;
  };
  professionalBodies: {
    nmc?: { reported: boolean; referenceNumber?: string };
    gmc?: { reported: boolean; referenceNumber?: string };
    hcpc?: { reported: boolean; referenceNumber?: string };
  };
}

export interface SafeguardingRiskAssessment {
  immediateRisk: boolean;
  riskToOthers: boolean;
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'extreme';
  riskFactors: string[];
  protectiveFactors: string[];
  riskMitigationPlan: string[];
  reviewDate: Date;
  assessedBy: string;
  assessmentDate: Date;
}

export interface SafeguardingActionPlan {
  immediateActions: {
    action: string;
    assignedTo: string;
    deadline: Date;
    completed: boolean;
    completedAt?: Date;
    evidence?: string;
  }[];
  shortTermActions: {
    action: string;
    assignedTo: string;
    deadline: Date;
    completed: boolean;
    completedAt?: Date;
    evidence?: string;
  }[];
  longTermActions: {
    action: string;
    assignedTo: string;
    deadline: Date;
    completed: boolean;
    completedAt?: Date;
    evidence?: string;
  }[];
  monitoringPlan: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    monitoringBy: string;
    reviewDate: Date;
    escalationTriggers: string[];
  };
}

export interface AIAnalysis {
  riskPrediction: {
    probabilityScore: number; // 0-100
    riskFactors: string[];
    predictiveIndicators: string[];
    recommendedActions: string[];
  };
  patternAnalysis: {
    similarIncidents: string[];
    behavioralPatterns: string[];
    environmentalFactors: string[];
    staffingPatterns: string[];
  };
  complianceAnalysis: {
    regulatoryRequirements: string[];
    reportingObligations: string[];
    timelineCompliance: boolean;
    documentationGaps: string[];
  };
}

@Entity('safeguarding_alerts')
@Index(['residentId', 'alertType'])
@Index(['severity', 'status'])
@Index(['reportedAt'])
@Index(['tenantId', 'organizationId'])
export class SafeguardingAlert extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  alertReference: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident, { eager: true })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({ enum: SafeguardingAlertType })
  alertType: SafeguardingAlertType;

  @Column({ enum: SafeguardingAlertSeverity })
  severity: SafeguardingAlertSeverity;

  @Column({ enum: SafeguardingAlertStatus, default: SafeguardingAlertStatus.REPORTED })
  status: SafeguardingAlertStatus;

  @Column({ enum: SafeguardingAlertSource })
  source: SafeguardingAlertSource;

  @Column('text', { encrypted: true })
  description: string;

  @Column('text', { encrypted: true, nullable: true })
  circumstances?: string;

  @Column('uuid')
  reportedBy: string;

  @Column()
  reportedByName: string;

  @Column()
  reportedByRole: string;

  @Column('timestamp')
  reportedAt: Date;

  @Column('timestamp')
  incidentDateTime: Date;

  @Column({ nullable: true })
  incidentLocation?: string;

  @Column('uuid', { nullable: true })
  investigatedBy?: string;

  @Column({ nullable: true })
  investigatedByName?: string;

  @Column('text', { encrypted: true, nullable: true })
  investigationNotes?: string;

  @Column('timestamp', { nullable: true })
  investigationStarted?: Date;

  @Column('timestamp', { nullable: true })
  investigationCompleted?: Date;

  @Column('simple-array', { nullable: true })
  witnessIds?: string[];

  @Column('simple-array', { nullable: true })
  witnessNames?: string[];

  @Column('jsonb')
  evidence: SafeguardingEvidence[];

  @Column('jsonb')
  externalReporting: ExternalReporting;

  @Column('jsonb')
  riskAssessment: SafeguardingRiskAssessment;

  @Column('jsonb')
  actionPlan: SafeguardingActionPlan;

  @Column('jsonb')
  aiAnalysis: AIAnalysis;

  @Column('boolean', { default: false })
  policeInvolved: boolean;

  @Column('boolean', { default: false })
  emergencyServices: boolean;

  @Column('boolean', { default: false })
  medicalAttention: boolean;

  @Column('boolean', { default: false })
  familyNotified: boolean;

  @Column('timestamp', { nullable: true })
  familyNotifiedAt?: Date;

  @Column('boolean', { default: false })
  advocateInvolved: boolean;

  @Column({ nullable: true })
  advocateName?: string;

  @Column('boolean', { default: false })
  mentalCapacityAssessment: boolean;

  @Column('text', { encrypted: true, nullable: true })
  outcomeDescription?: string;

  @Column('simple-array', { nullable: true })
  lessonsLearned?: string[];

  @Column('simple-array', { nullable: true })
  preventiveMeasures?: string[];

  @Column('timestamp', { nullable: true })
  reviewDate?: Date;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if alert requires immediate escalation
   */
  requiresImmediateEscalation(): boolean {
    return this.severity === SafeguardingAlertSeverity.CRITICAL || 
           this.severity === SafeguardingAlertSeverity.EMERGENCY ||
           this.alertType === SafeguardingAlertType.SEXUAL_ABUSE ||
           this.alertType === SafeguardingAlertType.MODERN_SLAVERY;
  }

  /**
   * Check if external reporting is required
   */
  requiresExternalReporting(): boolean {
    const criticalTypes = [
      SafeguardingAlertType.SEXUAL_ABUSE,
      SafeguardingAlertType.PHYSICAL_ABUSE,
      SafeguardingAlertType.MODERN_SLAVERY
    ];
    return criticalTypes.includes(this.alertType) || 
           this.severity === SafeguardingAlertSeverity.CRITICAL ||
           this.severity === SafeguardingAlertSeverity.EMERGENCY;
  }

  /**
   * Check if 24-hour reporting timeline is met
   */
  isWithinReportingTimeline(): boolean {
    const reportingDeadline = new Date(this.incidentDateTime);
    reportingDeadline.setHours(reportingDeadline.getHours() + 24);
    return this.reportedAt <= reportingDeadline;
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(): {
    timelineCompliant: boolean;
    externalReportingCompliant: boolean;
    documentationComplete: boolean;
    overallCompliant: boolean;
  } {
    const timelineCompliant = this.isWithinReportingTimeline();
    const externalReportingCompliant = !this.requiresExternalReporting() || 
      (this.externalReporting.cqc.reported && 
       (this.policeInvolved ? this.externalReporting.police.reported : true) &&
       (this.externalReporting.localAuthority.reported));
    const documentationComplete = this.description?.length > 0 && 
      this.riskAssessment && this.actionPlan;

    return {
      timelineCompliant,
      externalReportingCompliant,
      documentationComplete,
      overallCompliant: timelineCompliant && externalReportingCompliant && documentationComplete
    };
  }

  /**
   * Generate alert reference number
   */
  generateAlertReference(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const type = this.alertType.substring(0, 3).toUpperCase();
    const severity = this.severity.substring(0, 1).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SG-${date}-${type}-${severity}-${random}`;
  }
}
