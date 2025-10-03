import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum IncidentType {
  CLINICAL = 'clinical',
  MEDICATION_ERROR = 'medication_error',
  FALL = 'fall',
  INJURY = 'injury',
  SAFEGUARDING = 'safeguarding',
  INFECTION_CONTROL = 'infection_control',
  EQUIPMENT_FAILURE = 'equipment_failure',
  SECURITY_BREACH = 'security_breach',
  ENVIRONMENTAL = 'environmental',
  BEHAVIORAL = 'behavioral'
}

export enum IncidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  SEVERE = 'severe',
  CATASTROPHIC = 'catastrophic'
}

export enum IncidentStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  systemicIssues: string[];
  humanFactors: string[];
  environmentalFactors: string[];
  organizationalFactors: string[];
  timeline: Array<{
    timestamp: Date;
    event: string;
    actor: string;
    outcome: string;
  }>;
  evidence: Array<{
    type: 'witness_statement' | 'document' | 'photo' | 'video' | 'system_log' | 'medical_record';
    description: string;
    source: string;
    collectedBy: string;
    collectedAt: Date;
    reference: string;
  }>;
  analysisMethod: '5_why' | 'fishbone' | 'fault_tree' | 'barrier_analysis' | 'other';
  analysisNotes: string;
  recommendedActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    responsible: string;
    deadline: Date;
    resourcesRequired: string[];
    successCriteria: string;
    monitoringMethod: string;
    reviewDate: Date;
  }>;
  preventionMeasures: Array<{
    measure: string;
    implementationDate: Date;
    responsible: string;
    effectiveness: number; // 1-5 scale
    reviewDate: Date;
  }>;
  lessonsLearned: string[];
  cqcCompliance: {
    notificationRequired: boolean;
    notificationDeadline: Date;
    notificationSent: boolean;
    notificationReference: string;
    followUpRequired: boolean;
    followUpActions: string[];
  };
}

@Entity('incident_reports')
export class IncidentReport extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  incidentNumber: string;

  @Column({ enum: IncidentType })
  incidentType: IncidentType;

  @Column({ enum: IncidentSeverity })
  severity: IncidentSeverity;

  @Column({ enum: IncidentStatus, default: IncidentStatus.REPORTED })
  status: IncidentStatus;

  @Column('text')
  description: string;

  @Column('timestamp')
  incidentDateTime: Date;

  @Column()
  reportedBy: string;

  @Column('jsonb')
  rootCauseAnalysis: RootCauseAnalysis;

  @Column('jsonb')
  aiAnalysis: {
    riskScore: number;
    predictedOutcome: string;
    similarIncidents: string[];
    recommendedActions: string[];
  };

  @Column('jsonb')
  cqcReporting: {
    notificationRequired: boolean;
    notificationDeadline: Date;
    notificationSent: boolean;
    notificationReference: string;
    cqcReference: string;
    followUpRequired: boolean;
    followUpActions: string[];
    complianceStatus: 'compliant' | 'non_compliant' | 'under_review';
  };

  @Column('jsonb')
  correctiveActions: Array<{
    actionId: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    responsible: string;
    assignedDate: Date;
    deadline: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    completionDate?: Date;
    effectiveness: number; // 1-5 scale
    reviewDate: Date;
    resourcesRequired: string[];
    successCriteria: string;
    monitoringMethod: string;
  }>;

  @Column('jsonb')
  qualityAssurance: {
    reviewCompleted: boolean;
    reviewDate?: Date;
    reviewedBy: string;
    qualityScore: number; // 1-5 scale
    areasForImprovement: string[];
    bestPractices: string[];
    trainingNeeds: string[];
    processImprovements: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isCritical(): boolean {
    return this.severity === IncidentSeverity.SEVERE || this.severity === IncidentSeverity.CATASTROPHIC;
  }

  requiresImmediateAction(): boolean {
    return this.isCritical() || this.aiAnalysis.riskScore > 80;
  }

  requiresCQCNotification(): boolean {
    return this.isCritical() || 
           this.incidentType === IncidentType.SAFEGUARDING ||
           this.incidentType === IncidentType.CLINICAL ||
           this.affectedPersons > 0;
  }

  isCQCCompliant(): boolean {
    if (!this.requiresCQCNotification()) return true;
    
    return this.cqcReporting.notificationRequired === false ||
           (this.cqcReporting.notificationRequired === true && 
            this.cqcReporting.notificationSent === true);
  }

  getCQCNotificationDeadline(): Date {
    if (!this.requiresCQCNotification()) return new Date();
    
    // CQC requires notification within 24 hours for serious incidents
    return new Date(this.incidentDateTime.getTime() + 24 * 60 * 60 * 1000);
  }

  isOverdueForCQCNotification(): boolean {
    if (!this.requiresCQCNotification()) return false;
    
    const deadline = this.getCQCNotificationDeadline();
    return new Date() > deadline && !this.cqcReporting.notificationSent;
  }

  getCorrectiveActionStatus(): { completed: number; pending: number; overdue: number; total: number } {
    const total = this.correctiveActions.length;
    const completed = this.correctiveActions.filter(a => a.status === 'completed').length;
    const pending = this.correctiveActions.filter(a => a.status === 'pending' || a.status === 'in_progress').length;
    const overdue = this.correctiveActions.filter(a => a.status === 'overdue').length;
    
    return { completed, pending, overdue, total };
  }

  getQualityScore(): number {
    return this.qualityAssurance.qualityScore || 0;
  }

  needsQualityReview(): boolean {
    return !this.qualityAssurance.reviewCompleted && 
           this.status === IncidentStatus.RESOLVED;
  }

  isFullyResolved(): boolean {
    const actionStatus = this.getCorrectiveActionStatus();
    return this.status === IncidentStatus.RESOLVED && 
           actionStatus.completed === actionStatus.total &&
           this.qualityAssurance.reviewCompleted;
  }
}