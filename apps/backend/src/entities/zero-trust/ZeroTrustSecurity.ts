import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { ResidentStatus } from '../entities/Resident';
import { BaseEntity } from '../BaseEntity';

export enum TrustLevel {
  UNTRUSTED = 'untrusted',
  LOW_TRUST = 'low_trust',
  MEDIUM_TRUST = 'medium_trust',
  HIGH_TRUST = 'high_trust',
  VERIFIED_TRUST = 'verified_trust'
}

export enum SecurityCertification {
  NHS_DIGITAL = 'nhs_digital',
  CYBER_ESSENTIALS_PLUS = 'cyber_essentials_plus',
  ISO_27001 = 'iso_27001',
  SOC_2_TYPE_II = 'soc_2_type_ii',
  GDPR_COMPLIANT = 'gdpr_compliant',
  DSPT_COMPLIANT = 'dspt_compliant',
  DCB_0129 = 'dcb_0129',
  DCB_0160 = 'dcb_0160',
  GOVERNMENT_SECURITY = 'government_security'
}

export enum TenantTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  GOVERNMENT = 'government'
}

export interface DeviceTrustProfile {
  deviceId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'iot_sensor' | 'medical_device';
  trustScore: number; // 0-100
  securityPosture: {
    osVersion: string;
    securityPatches: boolean;
    antivirusStatus: boolean;
    encryptionEnabled: boolean;
    biometricCapable: boolean;
    jailbroken: boolean;
    rootAccess: boolean;
    unknownSources: boolean;
  };
  behavioralAnalysis: {
    normalUsagePatterns: any;
    anomalousActivities: string[];
    riskScore: number;
    lastBehaviorUpdate: Date;
  };
  networkContext: {
    ipAddress: string;
    networkType: 'trusted' | 'untrusted' | 'public' | 'vpn';
    geolocation: { latitude: number; longitude: number; accuracy: number };
    connectionSecurity: boolean;
    vpnRequired: boolean;
  };
  complianceStatus: {
    gdprCompliant: boolean;
    nhsSecurityStandards: boolean;
    encryptionStandards: boolean;
    auditLoggingEnabled: boolean;
  };
}

export interface ContinuousVerification {
  verificationId: string;
  userId: string;
  deviceId: string;
  verificationTime: Date;
  verificationMethods: Array<{
    method: 'biometric' | 'behavioral' | 'contextual' | 'device_attestation';
    result: 'passed' | 'failed' | 'suspicious';
    confidence: number;
    details: any;
  }>;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigationActions: string[];
    escalationRequired: boolean;
  };
  adaptiveControls: {
    accessLevelAdjustment: 'none' | 'reduced' | 'enhanced' | 'suspended';
    additionalAuthRequired: boolean;
    sessionTimeoutAdjustment: number; // minutes
    monitoringLevel: 'standard' | 'enhanced' | 'continuous';
  };
}

export interface TenantIsolation {
  tenantId: string;
  isolationLevel: 'logical' | 'physical' | 'cryptographic' | 'complete';
  dataSegmentation: {
    databaseIsolation: boolean;
    storageIsolation: boolean;
    networkIsolation: boolean;
    processingIsolation: boolean;
    backupIsolation: boolean;
  };
  performanceIsolation: {
    cpuQuota: number; // percentage
    memoryQuota: number; // GB
    storageQuota: number; // GB
    networkBandwidth: number; // Mbps
    iopsQuota: number;
  };
  securityIsolation: {
    encryptionKeys: string[];
    accessPolicies: string[];
    auditTrails: boolean;
    complianceReporting: boolean;
    incidentIsolation: boolean;
  };
  complianceIsolation: {
    regulatoryFramework: string[];
    auditRequirements: string[];
    dataRetentionPolicies: any;
    privacyControls: any;
    rightToErasure: boolean;
  };
}

export interface SecurityCertificationStatus {
  certification: SecurityCertification;
  status: ResidentStatus.ACTIVE | 'expired' | 'pending' | 'suspended';
  issueDate: Date;
  expiryDate: Date;
  certificationBody: string;
  scope: string[];
  evidence: Array<{
    evidenceType: string;
    evidenceId: string;
    collectionDate: Date;
    validityPeriod: number; // days
    automaticallyCollected: boolean;
  }>;
  gapAnalysis: Array<{
    requirement: string;
    currentStatus: 'compliant' | 'partial' | 'non_compliant';
    gapDescription: string;
    remediationPlan: string;
    targetDate: Date;
    responsible: string;
  }>;
  continuousMonitoring: {
    monitoringEnabled: boolean;
    lastAssessment: Date;
    nextAssessment: Date;
    complianceScore: number; // 0-100
    riskAreas: string[];
  };
}

@Entity('zero_trust_security')
export class ZeroTrustSecurity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  securityProfileId: string;

  @Column()
  entityId: string; // User, device, or service ID

  @Column()
  entityType: 'user' | 'device' | 'service' | 'application';

  @Column({
    type: 'enum',
    enum: TrustLevel,
    default: TrustLevel.UNTRUSTED
  })
  currentTrustLevel: TrustLevel;

  @Column('jsonb')
  deviceTrustProfile: DeviceTrustProfile;

  @Column('jsonb')
  continuousVerification: ContinuousVerification[];

  @Column('jsonb')
  tenantIsolation: TenantIsolation;

  @Column('jsonb')
  securityCertifications: SecurityCertificationStatus[];

  @Column('jsonb')
  accessPolicies: Array<{
    policyId: string;
    policyName: string;
    conditions: string[];
    permissions: string[];
    restrictions: string[];
    validFrom: Date;
    validTo?: Date;
    riskBasedAdjustments: boolean;
  }>;

  @Column('jsonb')
  threatIntelligence: {
    threatLevel: 'green' | 'yellow' | 'orange' | 'red';
    activeThreatIndicators: string[];
    riskScore: number; // 0-100
    lastThreatAssessment: Date;
    mitigationMeasures: string[];
    incidentHistory: Array<{
      incidentId: string;
      incidentType: string;
      severity: string;
      resolution: string;
      lessonsLearned: string[];
    }>;
  };

  @Column('jsonb')
  complianceMetrics: {
    overallComplianceScore: number; // 0-100
    certificationStatuses: { [certification: string]: string };
    auditReadiness: number; // 0-100
    gapCount: number;
    criticalGaps: number;
    lastComplianceReview: Date;
    nextComplianceReview: Date;
  };

  @Column('timestamp')
  lastVerification: Date;

  @Column('timestamp')
  nextVerification: Date;

  @Column('int')
  verificationFailures: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isTrusted(): boolean {
    return [TrustLevel.HIGH_TRUST, TrustLevel.VERIFIED_TRUST].includes(this.currentTrustLevel);
  }

  requiresContinuousVerification(): boolean {
    return this.currentTrustLevel === TrustLevel.UNTRUSTED ||
           this.currentTrustLevel === TrustLevel.LOW_TRUST ||
           this.hasHighRiskIndicators();
  }

  hasHighRiskIndicators(): boolean {
    return this.threatIntelligence.threatLevel === 'red' ||
           this.threatIntelligence.riskScore > 70 ||
           this.deviceTrustProfile.behavioralAnalysis.riskScore > 60;
  }

  isVerificationOverdue(): boolean {
    return new Date() > this.nextVerification;
  }

  needsSecurityReview(): boolean {
    return this.verificationFailures >= 3 ||
           this.hasHighRiskIndicators() ||
           this.isVerificationOverdue();
  }

  addVerificationResult(verification: ContinuousVerification): void {
    this.continuousVerification.push(verification);
    
    // Keep only last 100 verifications
    if (this.continuousVerification.length > 100) {
      this.continuousVerification = this.continuousVerification.slice(-100);
    }
    
    // Update trust level based on verification results
    this.updateTrustLevel(verification);
    
    // Update next verification time
    this.scheduleNextVerification(verification);
  }

  updateTrustLevel(verification: ContinuousVerification): void {
    const passedMethods = verification.verificationMethods.filter(method => method.result === 'passed');
    const failedMethods = verification.verificationMethods.filter(method => method.result === 'failed');
    const suspiciousMethods = verification.verificationMethods.filter(method => method.result === 'suspicious');
    
    if (failedMethods.length > 0 || suspiciousMethods.length > 0) {
      this.verificationFailures++;
      
      if (suspiciousMethods.length > 0 || this.verificationFailures >= 3) {
        this.currentTrustLevel = TrustLevel.UNTRUSTED;
      } else {
        this.currentTrustLevel = TrustLevel.LOW_TRUST;
      }
    } else if (passedMethods.length === verification.verificationMethods.length) {
      this.verificationFailures = 0;
      
      // Increase trust level based on consistent successful verifications
      const recentSuccesses = this.getRecentSuccessfulVerifications();
      if (recentSuccesses >= 10) {
        this.currentTrustLevel = TrustLevel.VERIFIED_TRUST;
      } else if (recentSuccesses >= 5) {
        this.currentTrustLevel = TrustLevel.HIGH_TRUST;
      } else {
        this.currentTrustLevel = TrustLevel.MEDIUM_TRUST;
      }
    }
    
    this.lastVerification = verification.verificationTime;
  }

  scheduleNextVerification(verification: ContinuousVerification): void {
    // Schedule next verification based on trust level and risk
    const intervals = {
      [TrustLevel.UNTRUSTED]: 5, // 5 minutes
      [TrustLevel.LOW_TRUST]: 15, // 15 minutes
      [TrustLevel.MEDIUM_TRUST]: 60, // 1 hour
      [TrustLevel.HIGH_TRUST]: 240, // 4 hours
      [TrustLevel.VERIFIED_TRUST]: 480 // 8 hours
    };
    
    let interval = intervals[this.currentTrustLevel];
    
    // Adjust based on risk level
    if (verification.riskAssessment.overallRisk === 'high') {
      interval = Math.min(interval, 30); // Max 30 minutes for high risk
    } else if (verification.riskAssessment.overallRisk === 'critical') {
      interval = 5; // 5 minutes for critical risk
    }
    
    this.nextVerification = new Date(Date.now() + interval * 60 * 1000);
  }

  getRecentSuccessfulVerifications(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return this.continuousVerification.filter(verification => 
      new Date(verification.verificationTime) >= oneHourAgo &&
      verification.verificationMethods.every(method => method.result === 'passed')
    ).length;
  }

  getActiveCertifications(): SecurityCertificationStatus[] {
    return this.securityCertifications.filter(cert => cert.status === 'active');
  }

  getExpiringCertifications(withinDays: number = 90): SecurityCertificationStatus[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.securityCertifications.filter(cert => 
      cert.status === 'active' && 
      new Date(cert.expiryDate) <= futureDate
    );
  }

  getCriticalGaps(): any[] {
    return this.securityCertifications.flatMap(cert => 
      cert.gapAnalysis.filter(gap => gap.currentStatus === 'non_compliant')
    );
  }

  calculateOverallSecurityScore(): number {
    let score = 100;
    
    // Deduct for trust level
    const trustDeductions = {
      [TrustLevel.UNTRUSTED]: 50,
      [TrustLevel.LOW_TRUST]: 30,
      [TrustLevel.MEDIUM_TRUST]: 10,
      [TrustLevel.HIGH_TRUST]: 0,
      [TrustLevel.VERIFIED_TRUST]: 0
    };
    score -= trustDeductions[this.currentTrustLevel];
    
    // Deduct for verification failures
    score -= Math.min(20, this.verificationFailures * 5);
    
    // Deduct for threat level
    const threatDeductions = {
      'green': 0,
      'yellow': 5,
      'orange': 15,
      'red': 30
    };
    score -= threatDeductions[this.threatIntelligence.threatLevel];
    
    // Deduct for compliance gaps
    score -= Math.min(25, this.getCriticalGaps().length * 5);
    
    // Add for active certifications
    score += Math.min(15, this.getActiveCertifications().length * 2);
    
    return Math.max(0, Math.min(100, score));
  }

  isComplianceReady(): boolean {
    return this.complianceMetrics.overallComplianceScore >= 95 &&
           this.complianceMetrics.criticalGaps === 0 &&
           this.getActiveCertifications().length >= 5;
  }

  requiresImmediateAttention(): boolean {
    return this.currentTrustLevel === TrustLevel.UNTRUSTED ||
           this.threatIntelligence.threatLevel === 'red' ||
           this.complianceMetrics.criticalGaps > 0 ||
           this.isVerificationOverdue();
  }

  updateThreatIntelligence(threatData: {
    threatLevel: string;
    indicators: string[];
    riskScore: number;
    mitigationMeasures: string[];
  }): void {
    this.threatIntelligence = {
      ...this.threatIntelligence,
      threatLevel: threatData.threatLevel as any,
      activeThreatIndicators: threatData.indicators,
      riskScore: threatData.riskScore,
      lastThreatAssessment: new Date(),
      mitigationMeasures: threatData.mitigationMeasures
    };
    
    // Adjust trust level based on threat intelligence
    if (threatData.threatLevel === 'red') {
      this.currentTrustLevel = TrustLevel.UNTRUSTED;
    } else if (threatData.threatLevel === 'orange' && this.currentTrustLevel === TrustLevel.VERIFIED_TRUST) {
      this.currentTrustLevel = TrustLevel.HIGH_TRUST;
    }
  }

  addSecurityIncident(incident: {
    incidentType: string;
    severity: string;
    description: string;
    resolution: string;
    lessonsLearned: string[];
  }): void {
    this.threatIntelligence.incidentHistory.push({
      incidentId: crypto.randomUUID(),
      incidentType: incident.incidentType,
      severity: incident.severity,
      resolution: incident.resolution,
      lessonsLearned: incident.lessonsLearned
    });
    
    // Keep only last 50 incidents
    if (this.threatIntelligence.incidentHistory.length > 50) {
      this.threatIntelligence.incidentHistory = this.threatIntelligence.incidentHistory.slice(-50);
    }
    
    // Adjust trust level based on incident severity
    if (incident.severity === 'critical' || incident.severity === 'high') {
      this.currentTrustLevel = TrustLevel.LOW_TRUST;
    }
  }

  updateCertificationStatus(certification: SecurityCertification, status: string, evidence?: any): void {
    const certIndex = this.securityCertifications.findIndex(cert => cert.certification === certification);
    
    if (certIndex >= 0) {
      this.securityCertifications[certIndex].status = status as any;
      if (evidence) {
        this.securityCertifications[certIndex].evidence.push(evidence);
      }
    }
    
    // Update compliance metrics
    this.updateComplianceMetrics();
  }

  private updateComplianceMetrics(): void {
    const activeCerts = this.getActiveCertifications();
    const totalCerts = this.securityCertifications.length;
    const criticalGaps = this.getCriticalGaps();
    
    this.complianceMetrics = {
      overallComplianceScore: totalCerts > 0 ? (activeCerts.length / totalCerts) * 100 : 0,
      certificationStatuses: this.securityCertifications.reduce((acc, cert) => {
        acc[cert.certification] = cert.status;
        return acc;
      }, {} as { [key: string]: string }),
      auditReadiness: this.calculateAuditReadiness(),
      gapCount: this.securityCertifications.reduce((sum, cert) => sum + cert.gapAnalysis.length, 0),
      criticalGaps: criticalGaps.length,
      lastComplianceReview: new Date(),
      nextComplianceReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  private calculateAuditReadiness(): number {
    let readiness = 100;
    
    // Deduct for missing certifications
    const requiredCertifications = Object.values(SecurityCertification).length;
    const activeCertifications = this.getActiveCertifications().length;
    readiness -= ((requiredCertifications - activeCertifications) / requiredCertifications) * 30;
    
    // Deduct for gaps
    readiness -= Math.min(40, this.getCriticalGaps().length * 10);
    
    // Deduct for overdue assessments
    const overdueCerts = this.securityCertifications.filter(cert => 
      cert.continuousMonitoring.nextAssessment < new Date()
    ).length;
    readiness -= Math.min(20, overdueCerts * 5);
    
    return Math.max(0, readiness);
  }

  generateSecurityReport(): any {
    return {
      securityProfileId: this.securityProfileId,
      entityType: this.entityType,
      currentTrustLevel: this.currentTrustLevel,
      overallSecurityScore: this.calculateOverallSecurityScore(),
      threatIntelligence: this.threatIntelligence,
      complianceStatus: {
        overallScore: this.complianceMetrics.overallComplianceScore,
        activeCertifications: this.getActiveCertifications().length,
        criticalGaps: this.complianceMetrics.criticalGaps,
        auditReadiness: this.complianceMetrics.auditReadiness
      },
      deviceSecurity: {
        trustScore: this.deviceTrustProfile.trustScore,
        securityPosture: this.deviceTrustProfile.securityPosture,
        behavioralRisk: this.deviceTrustProfile.behavioralAnalysis.riskScore
      },
      recommendations: this.generateSecurityRecommendations(),
      nextActions: this.getNextSecurityActions(),
      lastUpdated: this.updatedAt
    };
  }

  private generateSecurityRecommendations(): string[] {
    const recommendations = [];
    
    if (!this.isTrusted()) {
      recommendations.push('Increase verification frequency');
      recommendations.push('Review access permissions');
    }
    
    if (this.hasHighRiskIndicators()) {
      recommendations.push('Implement additional security controls');
      recommendations.push('Conduct security assessment');
    }
    
    if (this.getExpiringCertifications().length > 0) {
      recommendations.push('Renew expiring security certifications');
    }
    
    if (this.getCriticalGaps().length > 0) {
      recommendations.push('Address critical compliance gaps');
    }
    
    return recommendations;
  }

  private getNextSecurityActions(): Array<{ action: string; priority: string; deadline: Date }> {
    const actions = [];
    
    if (this.requiresImmediateAttention()) {
      actions.push({
        action: 'Immediate security review required',
        priority: 'critical',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }
    
    const expiringCerts = this.getExpiringCertifications(30);
    if (expiringCerts.length > 0) {
      actions.push({
        action: `Renew ${expiringCerts.length} expiring certifications`,
        priority: 'high',
        deadline: new Date(Math.min(...expiringCerts.map(cert => new Date(cert.expiryDate).getTime())))
      });
    }
    
    return actions;
  }
}
