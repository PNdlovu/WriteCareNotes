import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Security Policy Entity for Separate Security Service
 * @module SecurityPolicy
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../BaseEntity';
import { SecurityIncident } from './SecurityIncident';

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface PolicyConditions {
  userRoles?: string[];
  userGroups?: string[];
  timeRestrictions?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    timezone: string;
  };
  locationRestrictions?: {
    allowedIPs?: string[];
    allowedCountries?: string[];
    allowedRegions?: string[];
    blockedIPs?: string[];
    blockedCountries?: string[];
  };
  deviceRestrictions?: {
    allowedDeviceTypes?: string[];
    requiredSecurityLevel?: string;
    biometricRequired?: boolean;
    mfaRequired?: boolean;
  };
  resourceRestrictions?: {
    allowedResources?: string[];
    blockedResources?: string[];
    resourceTypes?: string[];
  };
  riskFactors?: {
    maxRiskScore?: number;
    requiredSecurityClearance?: string;
    suspiciousActivityThreshold?: number;
  };
}

export interface PolicyActions {
  allow: boolean;
  deny: boolean;
  requireMFA: boolean;
  requireBiometric: boolean;
  requireApproval: boolean;
  logEvent: boolean;
  sendAlert: boolean;
  blockUser: boolean;
  quarantineDevice: boolean;
  escalateToAdmin: boolean;
  customActions?: {
    action: string;
    parameters: any;
  }[];
}

export interface PolicyMetrics {
  totalEvaluations: number;
  allowedAccess: number;
  deniedAccess: number;
  mfaRequired: number;
  alertsGenerated: number;
  lastEvaluated: Date;
  averageEvaluationTime: number;
  effectivenessScore: number;
}

@Entity('security_policies')
export class SecurityPolicy extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  policyName!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'varchar', length: 50 })
  policyType!: 'access_control' | 'data_protection' | 'incident_response' | 'audit' | 'compliance' | 'network' | 'application';

  @Column({ type: 'varchar', length: 50 })
  category!: 'authentication' | 'authorization' | 'data_access' | 'network_access' | 'device_access' | 'api_access' | 'file_access';

  @Column({ type: 'jsonb' })
  conditions!: PolicyConditions;

  @Column({ type: 'jsonb' })
  actions!: PolicyActions;

  @Column({ type: 'varchar', length: 20 })
  enforcementLevel!: 'advisory' | 'mandatory' | 'critical';

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'integer', default: 0 })
  priority!: number;

  @Column({ type: 'timestamp', nullable: true })
  effectiveDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  rules?: PolicyRule[];

  @Column({ type: 'jsonb', nullable: true })
  metrics?: PolicyMetrics;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastModifiedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastModifiedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  exceptions?: {
    userId?: string;
    userGroup?: string;
    resource?: string;
    timeRange?: {
      start: Date;
      end: Date;
    };
    reason: string;
    approvedBy: string;
    approvedAt: Date;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  complianceMapping?: {
    standard: string;
    control: string;
    requirement: string;
    implementation: string;
  }[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  requiresApproval!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  approvalWorkflow?: {
    approvers: string[];
    timeout: number;
    escalationRules: any[];
  };

  @Column({ type: 'jsonb', nullable: true })
  testingResults?: {
    lastTested: Date;
    testResults: {
      testCase: string;
      passed: boolean;
      details: string;
    }[];
    overallScore: number;
  };

  // Relationships
  @OneToMany(() => SecurityIncident, incident => incident.policy)
  incidents!: SecurityIncident[];

  // Business Logic Methods
  isEffective(): boolean {
    const now = new Date();
    
    if (this.effectiveDate && now < this.effectiveDate) {
      return false;
    }
    
    if (this.expiryDate && now > this.expiryDate) {
      return false;
    }
    
    return this.isActive;
  }

  isExpired(): boolean {
    return this.expiryDate ? new Date() > this.expiryDate : false;
  }

  isPending(): boolean {
    return this.requiresApproval && !this.approvedBy;
  }

  isApproved(): boolean {
    return this.approvedBy !== null && this.approvedBy !== undefined;
  }

  canBeModified(): boolean {
    return this.isActive && !this.isExpired();
  }

  evaluateAccess(context: any): { allowed: boolean; actions: string[]; reason?: string } {
    if (!this.isEffective()) {
      return { allowed: false, actions: ['deny'], reason: 'Policy is not effective' };
    }

    // Check exceptions first
    if (this.hasException(context)) {
      return { allowed: true, actions: ['allow'], reason: 'Exception granted' };
    }

    // Evaluate conditions
    const conditionsMet = this.evaluateConditions(context);
    
    if (!conditionsMet) {
      return { allowed: false, actions: ['deny'], reason: 'Conditions not met' };
    }

    // Determine actions based on policy
    constactions: string[] = [];
    
    if (this.actions.allow) actions.push('allow');
    if (this.actions.deny) actions.push('deny');
    if (this.actions.requireMFA) actions.push('require_mfa');
    if (this.actions.requireBiometric) actions.push('require_biometric');
    if (this.actions.requireApproval) actions.push('require_approval');
    if (this.actions.logEvent) actions.push('log_event');
    if (this.actions.sendAlert) actions.push('send_alert');
    if (this.actions.blockUser) actions.push('block_user');
    if (this.actions.quarantineDevice) actions.push('quarantine_device');
    if (this.actions.escalateToAdmin) actions.push('escalate_admin');

    const allowed = this.actions.allow && !this.actions.deny;

    return {
      allowed: allowed,
      actions: actions,
      reason: allowed ? 'Access granted by policy' : 'Access denied by policy'
    };
  }

  private hasException(context: any): boolean {
    if (!this.exceptions) return false;

    for (const exception of this.exceptions) {
      // Check user exception
      if (exception.userId && context.userId === exception.userId) {
        return true;
      }

      // Check user group exception
      if (exception.userGroup && context.userGroups?.includes(exception.userGroup)) {
        return true;
      }

      // Check resource exception
      if (exception.resource && context.resource === exception.resource) {
        return true;
      }

      // Check time range exception
      if (exception.timeRange) {
        const now = new Date();
        if (now >= exception.timeRange.start && now <= exception.timeRange.end) {
          return true;
        }
      }
    }

    return false;
  }

  private evaluateConditions(context: any): boolean {
    // Evaluate user role conditions
    if (this.conditions.userRoles && this.conditions.userRoles.length > 0) {
      if (!context.userRoles || !this.conditions.userRoles.some(role => context.userRoles.includes(role))) {
        return false;
      }
    }

    // Evaluate user group conditions
    if (this.conditions.userGroups && this.conditions.userGroups.length > 0) {
      if (!context.userGroups || !this.conditions.userGroups.some(group => context.userGroups.includes(group))) {
        return false;
      }
    }

    // Evaluate time restrictions
    if (this.conditions.timeRestrictions) {
      if (!this.evaluateTimeRestrictions(context)) {
        return false;
      }
    }

    // Evaluate location restrictions
    if (this.conditions.locationRestrictions) {
      if (!this.evaluateLocationRestrictions(context)) {
        return false;
      }
    }

    // Evaluate device restrictions
    if (this.conditions.deviceRestrictions) {
      if (!this.evaluateDeviceRestrictions(context)) {
        return false;
      }
    }

    // Evaluate resource restrictions
    if (this.conditions.resourceRestrictions) {
      if (!this.evaluateResourceRestrictions(context)) {
        return false;
      }
    }

    // Evaluate risk factors
    if (this.conditions.riskFactors) {
      if (!this.evaluateRiskFactors(context)) {
        return false;
      }
    }

    return true;
  }

  private evaluateTimeRestrictions(context: any): boolean {
    const timeRestrictions = this.conditions.timeRestrictions!;
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    const currentDay = now.getDay();

    // Check time range
    if (currentTime < timeRestrictions.startTime || currentTime > timeRestrictions.endTime) {
      return false;
    }

    // Check days of week
    if (!timeRestrictions.daysOfWeek.includes(currentDay)) {
      return false;
    }

    return true;
  }

  private evaluateLocationRestrictions(context: any): boolean {
    const locationRestrictions = this.conditions.locationRestrictions!;

    // Check blocked IPs
    if (locationRestrictions.blockedIPs && context.ipAddress) {
      if (locationRestrictions.blockedIPs.includes(context.ipAddress)) {
        return false;
      }
    }

    // Check allowed IPs
    if (locationRestrictions.allowedIPs && context.ipAddress) {
      if (!locationRestrictions.allowedIPs.includes(context.ipAddress)) {
        return false;
      }
    }

    // Check blocked countries
    if (locationRestrictions.blockedCountries && context.country) {
      if (locationRestrictions.blockedCountries.includes(context.country)) {
        return false;
      }
    }

    // Check allowed countries
    if (locationRestrictions.allowedCountries && context.country) {
      if (!locationRestrictions.allowedCountries.includes(context.country)) {
        return false;
      }
    }

    return true;
  }

  private evaluateDeviceRestrictions(context: any): boolean {
    const deviceRestrictions = this.conditions.deviceRestrictions!;

    // Check device type
    if (deviceRestrictions.allowedDeviceTypes && context.deviceType) {
      if (!deviceRestrictions.allowedDeviceTypes.includes(context.deviceType)) {
        return false;
      }
    }

    // Check security level
    if (deviceRestrictions.requiredSecurityLevel && context.deviceSecurityLevel) {
      if (context.deviceSecurityLevel < deviceRestrictions.requiredSecurityLevel) {
        return false;
      }
    }

    // Check biometric requirement
    if (deviceRestrictions.biometricRequired && !context.biometricVerified) {
      return false;
    }

    // Check MFA requirement
    if (deviceRestrictions.mfaRequired && !context.mfaVerified) {
      return false;
    }

    return true;
  }

  private evaluateResourceRestrictions(context: any): boolean {
    const resourceRestrictions = this.conditions.resourceRestrictions!;

    // Check blocked resources
    if (resourceRestrictions.blockedResources && context.resource) {
      if (resourceRestrictions.blockedResources.includes(context.resource)) {
        return false;
      }
    }

    // Check allowed resources
    if (resourceRestrictions.allowedResources && context.resource) {
      if (!resourceRestrictions.allowedResources.includes(context.resource)) {
        return false;
      }
    }

    // Check resource types
    if (resourceRestrictions.resourceTypes && context.resourceType) {
      if (!resourceRestrictions.resourceTypes.includes(context.resourceType)) {
        return false;
      }
    }

    return true;
  }

  private evaluateRiskFactors(context: any): boolean {
    const riskFactors = this.conditions.riskFactors!;

    // Check max risk score
    if (riskFactors.maxRiskScore && context.riskScore) {
      if (context.riskScore > riskFactors.maxRiskScore) {
        return false;
      }
    }

    // Check security clearance
    if (riskFactors.requiredSecurityClearance && context.securityClearance) {
      if (context.securityClearance < riskFactors.requiredSecurityClearance) {
        return false;
      }
    }

    // Check suspicious activity threshold
    if (riskFactors.suspiciousActivityThreshold && context.suspiciousActivityScore) {
      if (context.suspiciousActivityScore > riskFactors.suspiciousActivityThreshold) {
        return false;
      }
    }

    return true;
  }

  addException(exception: any): void {
    if (!this.exceptions) {
      this.exceptions = [];
    }

    this.exceptions.push({
      ...exception,
      approvedAt: new Date()
    });
  }

  removeException(exceptionId: string): void {
    if (!this.exceptions) return;

    const index = this.exceptions.findIndex(e => e.userId === exceptionId || e.userGroup === exceptionId);
    if (index > -1) {
      this.exceptions.splice(index, 1);
    }
  }

  updateMetrics(evaluationResult: any, evaluationTime: number): void {
    if (!this.metrics) {
      this.metrics = {
        totalEvaluations: 0,
        allowedAccess: 0,
        deniedAccess: 0,
        mfaRequired: 0,
        alertsGenerated: 0,
        lastEvaluated: new Date(),
        averageEvaluationTime: 0,
        effectivenessScore: 0
      };
    }

    this.metrics.totalEvaluations++;
    this.metrics.lastEvaluated = new Date();

    if (evaluationResult.allowed) {
      this.metrics.allowedAccess++;
    } else {
      this.metrics.deniedAccess++;
    }

    if (evaluationResult.actions.includes('require_mfa')) {
      this.metrics.mfaRequired++;
    }

    if (evaluationResult.actions.includes('send_alert')) {
      this.metrics.alertsGenerated++;
    }

    // Update average evaluation time
    const currentAvg = this.metrics.averageEvaluationTime;
    this.metrics.averageEvaluationTime = ((currentAvg * (this.metrics.totalEvaluations - 1)) + evaluationTime) / this.metrics.totalEvaluations;

    // Calculate effectiveness score
    if (this.metrics.totalEvaluations > 0) {
      this.metrics.effectivenessScore = (this.metrics.allowedAccess / this.metrics.totalEvaluations) * 100;
    }
  }

  approvePolicy(approvedBy: string): void {
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
  }

  getPolicySummary(): any {
    return {
      id: this.id,
      policyName: this.policyName,
      policyType: this.policyType,
      category: this.category,
      enforcementLevel: this.enforcementLevel,
      isActive: this.isActive,
      isEffective: this.isEffective(),
      isApproved: this.isApproved(),
      priority: this.priority,
      effectiveDate: this.effectiveDate,
      expiryDate: this.expiryDate,
      metrics: this.metrics,
      lastModifiedAt: this.lastModifiedAt
    };
  }
}
