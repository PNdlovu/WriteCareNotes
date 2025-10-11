import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Security Incident Entity for Separate Security Service
 * @module SecurityIncident
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../BaseEntity';
import { SecurityPolicy } from './SecurityPolicy';

export interface IncidentDetails {
  sourceIP?: string;
  userAgent?: string;
  location?: {
    country: string;
    region: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  deviceInfo?: {
    deviceType: string;
    operatingSystem: string;
    browser?: string;
    deviceId?: string;
  };
  sessionInfo?: {
    sessionId: string;
    loginTime: Date;
    lastActivity: Date;
    sessionDuration: number;
  };
  resourceAccessed?: {
    resourceType: string;
    resourceId: string;
    resourceName: string;
    accessMethod: string;
  };
  dataInvolved?: {
    dataType: string;
    dataClassification: string;
    dataVolume: number;
    dataSensitivity: string;
  };
}

export interface InvestigationNotes {
  timestamp: Date;
  investigator: string;
  note: string;
  evidence?: string[];
  attachments?: string[];
  tags?: string[];
}

export interface RemediationActions {
  actionId: string;
  actionType: 'immediate' | 'short_term' | 'long_term';
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  evidence?: string[];
}

export interface IncidentImpact {
  affectedUsers: number;
  affectedSystems: string[];
  dataExposed: boolean;
  dataVolume: number;
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  financialImpact?: number;
  reputationImpact?: 'low' | 'medium' | 'high' | 'critical';
  operationalImpact?: 'low' | 'medium' | 'high' | 'critical';
  estimatedRecoveryTime?: number;
}

export interface ComplianceReporting {
  regulatoryBodies: string[];
  reportingRequired: boolean;
  reportingDeadline?: Date;
  reportedAt?: Date;
  reportedBy?: string;
  reportReference?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

@Entity('security_incidents')
export class SecurityIncident extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  incidentType!: 'unauthorized_access' | 'data_breach' | 'malware' | 'phishing' | 'insider_threat' | 'ddos' | 'sql_injection' | 'xss' | 'privilege_escalation' | 'account_compromise' | 'physical_security' | 'social_engineering';

  @Column({ type: 'varchar', length: 20 })
  severity!: 'low' | 'medium' | 'high' | 'critical';

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb' })
  details!: IncidentDetails;

  @Column({ type: 'varchar', length: 20 })
  status!: 'reported' | 'investigating' | 'contained' | 'resolved' | 'closed' | 'escalated';

  @Column({ type: 'timestamp' })
  detectedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  reportedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  containedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reportedBy?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedTo?: string;

  @Column({ type: 'jsonb', nullable: true })
  investigationNotes?: InvestigationNotes[];

  @Column({ type: 'jsonb', nullable: true })
  remediationActions?: RemediationActions[];

  @Column({ type: 'jsonb', nullable: true })
  impact?: IncidentImpact;

  @Column({ type: 'jsonb', nullable: true })
  complianceReporting?: ComplianceReporting;

  @Column({ type: 'uuid', nullable: true })
  policyId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  detectionMethod?: 'automated' | 'manual' | 'user_report' | 'external' | 'audit';

  @Column({ type: 'jsonb', nullable: true })
  evidence?: {
    evidenceId: string;
    evidenceType: 'log' | 'screenshot' | 'file' | 'network_capture' | 'memory_dump' | 'database_record';
    description: string;
    collectedAt: Date;
    collectedBy: string;
    location: string;
    hash?: string;
    chainOfCustody: {
      timestamp: Date;
      action: string;
      person: string;
      location: string;
    }[];
  }[];

  @Column({ type: 'jsonb', nullable: true })
  threatIntelligence?: {
    threatActor?: string;
    attackVector?: string;
    indicatorsOfCompromise?: string[];
    tacticsTechniquesProcedures?: string[];
    relatedIncidents?: string[];
    threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  };

  @Column({ type: 'jsonb', nullable: true })
  communicationLog?: {
    timestamp: Date;
    type: 'internal' | 'external' | 'regulatory' | 'public';
    recipient: string;
    message: string;
    sentBy: string;
    response?: string;
  }[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  rootCause?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lessonsLearned?: string;

  @Column({ type: 'jsonb', nullable: true })
  metrics?: {
    timeToDetection: number;
    timeToContainment: number;
    timeToResolution: number;
    totalCost: number;
    affectedRecords: number;
    systemsCompromised: number;
    usersAffected: number;
  };

  @Column({ type: 'boolean', default: false })
  requiresExternalNotification!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresLegalReview!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  // Relationships
  @ManyToOne(() => SecurityPolicy, policy => policy.incidents)
  @JoinColumn({ name: 'policyId' })
  policy?: SecurityPolicy;

  // Business Logic Methods
  isOpen(): boolean {
    return ['reported', 'investigating', 'contained'].includes(this.status);
  }

  isClosed(): boolean {
    return this.status === 'closed';
  }

  isResolved(): boolean {
    return this.status === 'resolved';
  }

  isCritical(): boolean {
    return this.severity === 'critical';
  }

  isHighSeverity(): boolean {
    return ['high', 'critical'].includes(this.severity);
  }

  getTimeToDetection(): number {
    if (!this.detectedAt) return 0;
    // In a real implementation, this would calculate from when the incident actually occurred
    return 0; // Placeholder
  }

  getTimeToContainment(): number {
    if (!this.containedAt) return 0;
    return this.containedAt.getTime() - this.detectedAt.getTime();
  }

  getTimeToResolution(): number {
    if (!this.resolvedAt) return 0;
    return this.resolvedAt.getTime() - this.detectedAt.getTime();
  }

  getTotalCost(): number {
    if (!this.metrics) return 0;
    return this.metrics.totalCost || 0;
  }

  addInvestigationNote(note: InvestigationNotes): void {
    if (!this.investigationNotes) {
      this.investigationNotes = [];
    }

    this.investigationNotes.push(note);
  }

  addRemediationAction(action: RemediationActions): void {
    if (!this.remediationActions) {
      this.remediationActions = [];
    }

    this.remediationActions.push(action);
  }

  updateRemediationAction(actionId: string, updates: Partial<RemediationActions>): void {
    if (!this.remediationActions) return;

    const action = this.remediationActions.find(a => a.actionId === actionId);
    if (action) {
      Object.assign(action, updates);
      
      if (updates.status === 'completed') {
        action.completedAt = new Date();
      }
    }
  }

  addEvidence(evidence: any): void {
    if (!this.evidence) {
      this.evidence = [];
    }

    this.evidence.push({
      ...evidence,
      chainOfCustody: [{
        timestamp: new Date(),
        action: 'collected',
        person: evidence.collectedBy,
        location: evidence.location
      }]
    });
  }

  updateChainOfCustody(evidenceId: string, action: string, person: string, location: string): void {
    if (!this.evidence) return;

    const evidence = this.evidence.find(e => e.evidenceId === evidenceId);
    if (evidence) {
      evidence.chainOfCustody.push({
        timestamp: new Date(),
        action: action,
        person: person,
        location: location
      });
    }
  }

  escalateIncident(reason: string, escalatedTo: string): void {
    this.status = 'escalated';
    this.assignedTo = escalatedTo;
    
    this.addInvestigationNote({
      timestamp: new Date(),
      investigator: escalatedTo,
      note: `Incident escalated: ${reason}`,
      tags: ['escalation']
    });
  }

  containIncident(containmentMethod: string, containedBy: string): void {
    this.status = 'contained';
    this.containedAt = new Date();
    
    this.addInvestigationNote({
      timestamp: new Date(),
      investigator: containedBy,
      note: `Incident contained using: ${containmentMethod}`,
      tags: ['containment']
    });
  }

  resolveIncident(resolution: string, resolvedBy: string): void {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.rootCause = resolution;
    
    this.addInvestigationNote({
      timestamp: new Date(),
      investigator: resolvedBy,
      note: `Incident resolved: ${resolution}`,
      tags: ['resolution']
    });
  }

  closeIncident(closureReason: string, closedBy: string): void {
    this.status = 'closed';
    this.closedAt = new Date();
    
    this.addInvestigationNote({
      timestamp: new Date(),
      investigator: closedBy,
      note: `Incident closed: ${closureReason}`,
      tags: ['closure']
    });
  }

  addCommunicationLog(communication: any): void {
    if (!this.communicationLog) {
      this.communicationLog = [];
    }

    this.communicationLog.push({
      timestamp: new Date(),
      ...communication
    });
  }

  updateImpact(impact: IncidentImpact): void {
    this.impact = impact;
  }

  updateComplianceReporting(compliance: ComplianceReporting): void {
    this.complianceReporting = compliance;
  }

  calculateMetrics(): void {
    if (!this.metrics) {
      this.metrics = {
        timeToDetection: 0,
        timeToContainment: 0,
        timeToResolution: 0,
        totalCost: 0,
        affectedRecords: 0,
        systemsCompromised: 0,
        usersAffected: 0
      };
    }

    this.metrics.timeToDetection = this.getTimeToDetection();
    this.metrics.timeToContainment = this.getTimeToContainment();
    this.metrics.timeToResolution = this.getTimeToResolution();
    this.metrics.totalCost = this.getTotalCost();

    if (this.impact) {
      this.metrics.affectedRecords = this.impact.dataVolume;
      this.metrics.systemsCompromised = this.impact.affectedSystems.length;
      this.metrics.usersAffected = this.impact.affectedUsers;
    }
  }

  getIncidentSummary(): any {
    return {
      id: this.id,
      incidentType: this.incidentType,
      severity: this.severity,
      title: this.title,
      status: this.status,
      detectedAt: this.detectedAt,
      containedAt: this.containedAt,
      resolvedAt: this.resolvedAt,
      assignedTo: this.assignedTo,
      timeToContainment: this.getTimeToContainment(),
      timeToResolution: this.getTimeToResolution(),
      totalCost: this.getTotalCost(),
      isCritical: this.isCritical(),
      requiresExternalNotification: this.requiresExternalNotification,
      requiresLegalReview: this.requiresLegalReview
    };
  }

  validateIncident(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Incident title is required');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Incident description is required');
    }

    if (!this.incidentType) {
      errors.push('Incident type is required');
    }

    if (!this.severity) {
      errors.push('Incident severity is required');
    }

    if (!this.detectedAt) {
      errors.push('Detection time is required');
    }

    if (!this.status) {
      errors.push('Incident status is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}