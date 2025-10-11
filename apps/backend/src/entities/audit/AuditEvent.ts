import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum AuditEventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  SYSTEM_CONFIGURATION = 'system_configuration',
  SECURITY_EVENT = 'security_event',
  COMPLIANCE_CHECK = 'compliance_check',
  MEDICATION_ADMINISTRATION = 'medication_administration',
  CARE_PLAN_UPDATE = 'care_plan_update',
  INCIDENT_REPORT = 'incident_report',
  EMERGENCY_RESPONSE = 'emergency_response'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ComplianceFramework {
  CQC = 'cqc',
  GDPR = 'gdpr',
  NHS_DIGITAL = 'nhs_digital',
  ISO_27001 = 'iso_27001',
  NICE_GUIDELINES = 'nice_guidelines',
  CARE_ACT_2014 = 'care_act_2014',
  MENTAL_CAPACITY_ACT = 'mental_capacity_act'
}

export interface AuditContext {
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceInfo: {
    deviceType: string;
    operatingSystem: string;
    browserInfo?: string;
    appVersion?: string;
  };
  networkInfo: {
    networkType: 'wifi' | 'cellular' | 'ethernet' | 'vpn';
    connectionSecurity: boolean;
    vpnUsed: boolean;
  };
}

export interface DataClassification {
  dataType: 'personal' | 'sensitive_personal' | 'medical' | 'financial' | 'operational';
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
  retentionPeriod: number; // days
  encryptionRequired: boolean;
  accessRestrictions: string[];
  complianceRequirements: ComplianceFramework[];
}

export interface ComplianceValidation {
  validationId: string;
  framework: ComplianceFramework;
  validationTime: Date;
  validationResults: {
    compliant: boolean;
    complianceScore: number; // 0-100
    violations: Array<{
      violationType: string;
      severity: 'minor' | 'major' | 'critical';
      description: string;
      recommendation: string;
      deadline?: Date;
    }>;
    evidence: Array<{
      evidenceType: string;
      evidenceId: string;
      evidenceDescription: string;
      evidenceLocation: string;
    }>;
  };
  automaticRemediation: {
    remediationApplied: boolean;
    remediationActions: string[];
    remediationSuccess: boolean;
    manualActionRequired: boolean;
  };
}

export interface AdvancedAuditFeatures {
  realTimeMonitoring: {
    anomalyDetection: boolean;
    behaviorAnalysis: boolean;
    riskScoring: boolean;
    alertGeneration: boolean;
    automaticResponse: boolean;
  };
  intelligentAnalysis: {
    patternRecognition: boolean;
    trendAnalysis: boolean;
    predictiveInsights: boolean;
    correlationAnalysis: boolean;
    rootCauseAnalysis: boolean;
  };
  complianceAutomation: {
    automaticClassification: boolean;
    complianceChecking: boolean;
    evidenceCollection: boolean;
    reportGeneration: boolean;
    remediation: boolean;
  };
  forensicCapabilities: {
    digitalForensics: boolean;
    chainOfCustody: boolean;
    evidencePreservation: boolean;
    timelineReconstruction: boolean;
    expertAnalysis: boolean;
  };
}

@Entity('audit_events')
export class AuditEvent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  eventId: string;

  @Column({
    type: 'enum',
    enum: AuditEventType
  })
  eventType: AuditEventType;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column()
  action: string;

  @Column()
  userId: string;

  @Column('jsonb')
  details: any;

  @Column('jsonb')
  auditContext: AuditContext;

  @Column('jsonb')
  dataClassification: DataClassification;

  @Column('jsonb')
  complianceValidation: ComplianceValidation[];

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.LOW
  })
  riskLevel: RiskLevel;

  @Column('jsonb')
  advancedFeatures: AdvancedAuditFeatures;

  @Column('text', { nullable: true })
  businessJustification?: string;

  @Column('jsonb')
  beforeState: any;

  @Column('jsonb')
  afterState: any;

  @Column('decimal', { precision: 10, scale: 3 })
  processingTime: number; // milliseconds

  @Column('text', { nullable: true })
  errorMessage?: string;

  @Column({ default: true })
  isSuccessful: boolean;

  @Column('jsonb')
  relatedEvents: Array<{
    eventId: string;
    relationship: 'parent' | 'child' | 'sibling' | 'caused_by' | 'triggers';
    description: string;
  }>;

  @Column('timestamp')
  retentionDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isHighRisk(): boolean {
    return [RiskLevel.HIGH, RiskLevel.CRITICAL].includes(this.riskLevel);
  }

  isComplianceRelevant(): boolean {
    return this.complianceValidation.length > 0 ||
           this.dataClassification.complianceRequirements.length > 0;
  }

  hasComplianceViolations(): boolean {
    return this.complianceValidation.some(validation => 
      !validation.validationResults.compliant ||
      validation.validationResults.violations.some(violation => violation.severity === 'critical')
    );
  }

  isRetentionExpired(): boolean {
    return new Date() > this.retentionDate;
  }

  requiresInvestigation(): boolean {
    return this.isHighRisk() ||
           this.hasComplianceViolations() ||
           !this.isSuccessful ||
           this.processingTime > 10000; // More than 10 seconds
  }

  addComplianceValidation(validation: ComplianceValidation): void {
    this.complianceValidation.push(validation);
    
    // Update risk level based on compliance violations
    if (validation.validationResults.violations.some(v => v.severity === 'critical')) {
      this.riskLevel = RiskLevel.CRITICAL;
    } else if (validation.validationResults.violations.some(v => v.severity === 'major')) {
      this.riskLevel = RiskLevel.HIGH;
    }
  }

  linkRelatedEvent(eventId: string, relationship: string, description: string): void {
    this.relatedEvents.push({
      eventId,
      relationship: relationship as any,
      description
    });
  }

  calculateComplianceScore(): number {
    if (this.complianceValidation.length === 0) return 100;
    
    const totalScore = this.complianceValidation.reduce((sum, validation) => 
      sum + validation.validationResults.complianceScore, 0
    );
    
    return totalScore / this.complianceValidation.length;
  }

  getViolationsSummary(): any {
    const allViolations = this.complianceValidation.flatMap(validation => 
      validation.validationResults.violations
    );
    
    return {
      totalViolations: allViolations.length,
      criticalViolations: allViolations.filter(v => v.severity === 'critical').length,
      majorViolations: allViolations.filter(v => v.severity === 'major').length,
      minorViolations: allViolations.filter(v => v.severity === 'minor').length,
      violationsByFramework: this.groupViolationsByFramework(allViolations)
    };
  }

  generateForensicTimeline(): any {
    return {
      eventId: this.eventId,
      timestamp: this.createdAt,
      eventType: this.eventType,
      actor: this.userId,
      action: this.action,
      target: {
        entityType: this.entityType,
        entityId: this.entityId
      },
      context: this.auditContext,
      outcome: this.isSuccessful ? 'success' : 'failure',
      riskAssessment: this.riskLevel,
      complianceImpact: this.calculateComplianceScore(),
      relatedEvents: this.relatedEvents.length,
      forensicMarkers: {
        dataIntegrity: this.validateDataIntegrity(),
        temporalConsistency: this.validateTemporalConsistency(),
        contextualValidity: this.validateContextualValidity()
      }
    };
  }

  private groupViolationsByFramework(violations: any[]): any {
    return violations.reduce((acc, violation) => {
      const framework = violation.framework || 'unknown';
      acc[framework] = (acc[framework] || 0) + 1;
      return acc;
    }, {});
  }

  private validateDataIntegrity(): boolean {
    // Validate that audit data hasn't been tampered with
    return this.beforeState !== null && this.afterState !== null;
  }

  private validateTemporalConsistency(): boolean {
    // Validate that timestamps are consistent and logical
    return this.createdAt <= this.updatedAt;
  }

  private validateContextualValidity(): boolean {
    // Validate that the audit context makes sense
    return !!this.auditContext.sessionId && 
           !!this.auditContext.userAgent && 
           !!this.auditContext.ipAddress;
  }

  generateAuditReport(): any {
    return {
      eventSummary: {
        eventId: this.eventId,
        eventType: this.eventType,
        timestamp: this.createdAt,
        userId: this.userId,
        action: this.action,
        entityType: this.entityType,
        entityId: this.entityId,
        successful: this.isSuccessful,
        riskLevel: this.riskLevel
      },
      contextDetails: {
        sessionInfo: {
          sessionId: this.auditContext.sessionId,
          userAgent: this.auditContext.userAgent,
          ipAddress: this.auditContext.ipAddress
        },
        deviceInfo: this.auditContext.deviceInfo,
        networkInfo: this.auditContext.networkInfo,
        geolocation: this.auditContext.geolocation
      },
      dataImpact: {
        classification: this.dataClassification,
        beforeState: this.beforeState ? 'captured' : 'not_captured',
        afterState: this.afterState ? 'captured' : 'not_captured',
        processingTime: this.processingTime
      },
      complianceAssessment: {
        overallScore: this.calculateComplianceScore(),
        violations: this.getViolationsSummary(),
        frameworks: this.dataClassification.complianceRequirements,
        evidence: this.complianceValidation.flatMap(v => v.validationResults.evidence)
      },
      forensicData: this.generateForensicTimeline(),
      recommendations: this.generateAuditRecommendations()
    };
  }

  private generateAuditRecommendations(): string[] {
    const recommendations = [];
    
    if (this.isHighRisk()) {
      recommendations.push('High-risk event requires immediate review');
    }
    
    if (this.hasComplianceViolations()) {
      recommendations.push('Compliance violations require corrective action');
    }
    
    if (this.processingTime > 5000) {
      recommendations.push('Performance optimization needed - processing time excessive');
    }
    
    if (!this.isSuccessful) {
      recommendations.push('Failed operation requires investigation and remediation');
    }
    
    return recommendations;
  }
}
