import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { ResidentStatus } from '../entities/Resident';
import { BaseEntity } from '../BaseEntity';

export enum AccessLevel {
  VISITOR = 'visitor',
  BASIC = 'basic',
  STANDARD = 'standard',
  ELEVATED = 'elevated',
  ADMINISTRATIVE = 'administrative',
  EMERGENCY = 'emergency',
  SYSTEM_ADMIN = 'system_admin'
}

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACIAL_RECOGNITION = 'facial_recognition',
  IRIS_SCAN = 'iris_scan',
  PALM_VEIN = 'palm_vein',
  VOICE_RECOGNITION = 'voice_recognition',
  BEHAVIORAL_BIOMETRICS = 'behavioral_biometrics'
}

export enum AuthenticationMethod {
  PASSWORD = 'password',
  BIOMETRIC = 'biometric',
  SMART_CARD = 'smart_card',
  RFID_BADGE = 'rfid_badge',
  MOBILE_APP = 'mobile_app',
  MULTI_FACTOR = 'multi_factor'
}

export interface Permission {
  id: string;
  permissionName: string;
  permissionCategory: 'system' | 'clinical' | 'administrative' | 'facility' | 'emergency';
  resourceType: string;
  resourceId?: string;
  actions: string[]; // read, write, delete, approve, etc.
  conditions: {
    timeRestrictions?: {
      startTime: string;
      endTime: string;
      daysOfWeek: string[];
    };
    locationRestrictions?: string[];
    contextualRequirements?: string[];
  };
  grantedDate: Date;
  expiryDate?: Date;
  grantedBy: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AccessCard {
  cardId: string;
  cardNumber: string;
  cardType: 'rfid' | 'smart_card' | 'proximity' | 'magnetic_stripe';
  issueDate: Date;
  expiryDate: Date;
  status: ResidentStatus.ACTIVE | 'inactive' | 'lost' | 'stolen' | 'expired';
  accessZones: string[];
  lastUsed?: Date;
  usageCount: number;
  securityFeatures: {
    encrypted: boolean;
    tamperEvident: boolean;
    biometricLinked: boolean;
    duressCode: boolean;
  };
}

export interface BiometricData {
  biometricId: string;
  biometricType: BiometricType;
  enrollmentDate: Date;
  templateHash: string; // Hashed biometric template
  qualityScore: number; // 1-100
  verificationAccuracy: number; // percentage
  lastVerification?: Date;
  verificationCount: number;
  status: ResidentStatus.ACTIVE | 'inactive' | 'requires_re_enrollment';
  securityLevel: 'standard' | 'high' | 'maximum';
  antiSpoofingEnabled: boolean;
  livenessDetectionEnabled: boolean;
}

export interface AccessSchedule {
  scheduleId: string;
  scheduleName: string;
  validDays: string[]; // monday, tuesday, etc.
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    accessLevel: AccessLevel;
    locations: string[];
  }>;
  effectiveDate: Date;
  expiryDate?: Date;
  emergencyOverride: boolean;
  holidayExceptions: Date[];
}

export interface SecurityClearance {
  clearanceLevel: 'basic' | 'standard' | 'enhanced' | 'highest';
  clearanceDate: Date;
  expiryDate: Date;
  clearingAuthority: string;
  backgroundCheckCompleted: boolean;
  dbsCheckLevel: 'basic' | 'standard' | 'enhanced';
  dbsCheckDate: Date;
  dbsCheckNumber: string;
  restrictionsApplied: string[];
  monitoringRequired: boolean;
}

export interface AccessAttempt {
  attemptId: string;
  attemptTime: Date;
  accessPoint: string;
  authenticationMethod: AuthenticationMethod;
  biometricType?: BiometricType;
  success: boolean;
  failureReason?: string;
  riskScore: number; // 1-100
  deviceInfo: {
    deviceId: string;
    deviceType: string;
    location: string;
    ipAddress?: string;
  };
  contextualFactors: {
    timeOfDay: string;
    dayOfWeek: string;
    isHoliday: boolean;
    weatherConditions?: string;
    facilityOccupancy: number;
  };
}

export interface ThreatIntelligence {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  threatTypes: string[];
  lastThreatAssessment: Date;
  securityIncidents: number;
  vulnerabilitiesIdentified: number;
  mitigationMeasuresImplemented: string[];
  securityScore: number; // 1-100
  complianceStatus: {
    gdprCompliant: boolean;
    iso27001Compliant: boolean;
    nhsSecurityCompliant: boolean;
    cqcSecurityCompliant: boolean;
  };
}

@Entity('access_control_users')
export class AccessControlUser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('uuid', { nullable: true })
  employeeId?: string;

  @Column('uuid', { nullable: true })
  residentId?: string;

  @Column('uuid', { nullable: true })
  visitorId?: string;

  @Column({
    type: 'enum',
    enum: AccessLevel,
    default: AccessLevel.BASIC
  })
  accessLevel: AccessLevel;

  @Column('jsonb')
  permissions: Permission[];

  @Column('jsonb')
  accessCards: AccessCard[];

  @Column('jsonb')
  biometricData: BiometricData[];

  @Column('jsonb')
  accessSchedule: AccessSchedule[];

  @Column('jsonb')
  securityClearance: SecurityClearance;

  @Column('jsonb')
  accessHistory: AccessAttempt[];

  @Column('jsonb')
  threatIntelligence: ThreatIntelligence;

  @Column('simple-array')
  authorizedZones: string[];

  @Column('simple-array')
  restrictedZones: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column('timestamp', { nullable: true })
  lastAccessTime?: Date;

  @Column('timestamp', { nullable: true })
  passwordLastChanged?: Date;

  @Column('int', { default: 0 })
  failedAccessAttempts: number;

  @Column('timestamp', { nullable: true })
  accountLockedUntil?: Date;

  @Column('jsonb')
  securitySettings: {
    mfaEnabled: boolean;
    biometricRequired: boolean;
    passwordComplexityLevel: 'basic' | 'standard' | 'high' | 'maximum';
    sessionTimeout: number; // minutes
    concurrentSessionsAllowed: number;
    ipRestrictions: string[];
    deviceRestrictions: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  hasPermission(permissionName: string, resourceType?: string, resourceId?: string): boolean {
    return this.permissions.some(permission => {
      const nameMatch = permission.permissionName === permissionName;
      const resourceMatch = !resourceType || permission.resourceType === resourceType;
      const idMatch = !resourceId || !permission.resourceId || permission.resourceId === resourceId;
      const notExpired = !permission.expiryDate || new Date(permission.expiryDate) > new Date();
      
      return nameMatch && resourceMatch && idMatch && notExpired;
    });
  }

  canAccessZone(zone: string): boolean {
    if (this.restrictedZones.includes(zone)) return false;
    return this.authorizedZones.includes(zone) || this.authorizedZones.includes('all_zones');
  }

  canAccessAtTime(time: Date): boolean {
    if (!this.isActive) return false;
    
    const dayOfWeek = time.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const timeString = time.toTimeString().substring(0, 5);
    
    return this.accessSchedule.some(schedule => {
      if (schedule.expiryDate && new Date(schedule.expiryDate) < time) return false;
      if (new Date(schedule.effectiveDate) > time) return false;
      
      const dayAllowed = schedule.validDays.includes(dayOfWeek);
      const timeAllowed = schedule.timeSlots.some(slot => 
        slot.startTime <= timeString && slot.endTime >= timeString
      );
      
      return dayAllowed && timeAllowed;
    });
  }

  isAccountLocked(): boolean {
    return this.accountLockedUntil ? new Date() < new Date(this.accountLockedUntil) : false;
  }

  hasBiometricEnrolled(biometricType: BiometricType): boolean {
    return this.biometricData.some(bio => 
      bio.biometricType === biometricType && bio.status === 'active'
    );
  }

  requiresMFA(): boolean {
    return this.securitySettings.mfaEnabled || 
           this.accessLevel === AccessLevel.ADMINISTRATIVE ||
           this.accessLevel === AccessLevel.SYSTEM_ADMIN;
  }

  isHighRiskUser(): boolean {
    return this.threatIntelligence.threatLevel === 'high' || 
           this.threatIntelligence.threatLevel === 'critical' ||
           this.failedAccessAttempts >= 3;
  }

  addAccessAttempt(attempt: AccessAttempt): void {
    this.accessHistory.push(attempt);
    
    // Keep only last 1000 attempts
    if (this.accessHistory.length > 1000) {
      this.accessHistory = this.accessHistory.slice(-1000);
    }
    
    if (attempt.success) {
      this.lastAccessTime = attempt.attemptTime;
      this.failedAccessAttempts = 0;
    } else {
      this.failedAccessAttempts++;
      
      // Lock account after 5 failed attempts
      if (this.failedAccessAttempts >= 5) {
        this.lockAccount(30); // 30 minutes
      }
    }
    
    // Update threat intelligence
    this.updateThreatIntelligence(attempt);
  }

  lockAccount(durationMinutes: number): void {
    this.accountLockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  }

  unlockAccount(): void {
    this.accountLockedUntil = undefined;
    this.failedAccessAttempts = 0;
  }

  enrollBiometric(biometricData: Omit<BiometricData, 'biometricId' | 'enrollmentDate' | 'verificationCount'>): void {
    constbiometric: BiometricData = {
      biometricId: crypto.randomUUID(),
      enrollmentDate: new Date(),
      verificationCount: 0,
      ...biometricData
    };
    
    // Remove existing biometric of same type
    this.biometricData = this.biometricData.filter(bio => bio.biometricType !== biometric.biometricType);
    
    // Add new biometric
    this.biometricData.push(biometric);
  }

  verifyBiometric(biometricType: BiometricType, templateHash: string): boolean {
    const biometric = this.biometricData.find(bio => 
      bio.biometricType === biometricType && bio.status === 'active'
    );
    
    if (!biometric) return false;
    
    // Simulate biometric verification (in real implementation, would use biometric SDK)
    const verified = biometric.templateHash === templateHash;
    
    if (verified) {
      biometric.lastVerification = new Date();
      biometric.verificationCount++;
    }
    
    return verified;
  }

  addPermission(permission: Permission): void {
    // Remove existing permission with same name and resource
    this.permissions = this.permissions.filter(p => 
      !(p.permissionName === permission.permissionName && 
        p.resourceType === permission.resourceType && 
        p.resourceId === permission.resourceId)
    );
    
    this.permissions.push(permission);
  }

  removePermission(permissionName: string, resourceType?: string, resourceId?: string): void {
    this.permissions = this.permissions.filter(p => 
      !(p.permissionName === permissionName && 
        (!resourceType || p.resourceType === resourceType) &&
        (!resourceId || p.resourceId === resourceId))
    );
  }

  getActivePermissions(): Permission[] {
    const now = new Date();
    return this.permissions.filter(permission => 
      !permission.expiryDate || new Date(permission.expiryDate) > now
    );
  }

  getExpiringPermissions(withinDays: number = 30): Permission[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.permissions.filter(permission => 
      permission.expiryDate && 
      new Date(permission.expiryDate) <= futureDate &&
      new Date(permission.expiryDate) > new Date()
    );
  }

  isSecurityClearanceValid(): boolean {
    return new Date() <= new Date(this.securityClearance.expiryDate) &&
           this.securityClearance.backgroundCheckCompleted;
  }

  needsSecurityReview(): boolean {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return this.isHighRiskUser() ||
           this.lastAccessTime && new Date(this.lastAccessTime) < sixMonthsAgo ||
           !this.isSecurityClearanceValid();
  }

  getAccessPattern(): {
    mostActiveHours: string[];
    mostActiveLocations: string[];
    averageSessionDuration: number;
    accessFrequency: number;
  } {
    const recentAttempts = this.accessHistory.filter(attempt => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(attempt.attemptTime) >= thirtyDaysAgo && attempt.success;
    });

    // Analyze access patterns
    const hourCounts = recentAttempts.reduce((acc, attempt) => {
      const hour = new Date(attempt.attemptTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as { [hour: number]: number });

    const locationCounts = recentAttempts.reduce((acc, attempt) => {
      acc[attempt.accessPoint] = (acc[attempt.accessPoint] || 0) + 1;
      return acc;
    }, {} as { [location: string]: number });

    const mostActiveHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    const mostActiveLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([location]) => location);

    return {
      mostActiveHours,
      mostActiveLocations,
      averageSessionDuration: 120, // minutes (would calculate from session data)
      accessFrequency: recentAttempts.length / 30 // per day
    };
  }

  calculateSecurityScore(): number {
    let score = 100;
    
    // Deduct for security issues
    if (this.failedAccessAttempts > 0) score -= this.failedAccessAttempts * 5;
    if (!this.isSecurityClearanceValid()) score -= 20;
    if (!this.securitySettings.mfaEnabled && this.accessLevel !== AccessLevel.VISITOR) score -= 15;
    if (this.biometricData.length === 0 && this.accessLevel !== AccessLevel.VISITOR) score -= 10;
    if (this.threatIntelligence.threatLevel === 'high') score -= 25;
    if (this.threatIntelligence.threatLevel === 'critical') score -= 50;
    
    // Add for security enhancements
    if (this.securitySettings.biometricRequired) score += 10;
    if (this.biometricData.length >= 2) score += 5; // Multiple biometric types
    if (this.securitySettings.ipRestrictions.length > 0) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private updateThreatIntelligence(attempt: AccessAttempt): void {
    // Update threat intelligence based on access patterns
    const recentFailures = this.accessHistory.filter(h => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return new Date(h.attemptTime) >= oneDayAgo && !h.success;
    }).length;

    // Assess threat level
    letthreatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (recentFailures >= 10) threatLevel = 'critical';
    else if (recentFailures >= 5) threatLevel = 'high';
    else if (recentFailures >= 2) threatLevel = 'medium';
    
    // Unusual access patterns
    if (this.isUnusualAccessPattern(attempt)) {
      threatLevel = threatLevel === 'low' ? 'medium' : 'high';
    }
    
    this.threatIntelligence = {
      ...this.threatIntelligence,
      threatLevel,
      lastThreatAssessment: new Date(),
      securityScore: this.calculateSecurityScore()
    };
  }

  private isUnusualAccessPattern(attempt: AccessAttempt): boolean {
    const pattern = this.getAccessPattern();
    const attemptHour = new Date(attempt.attemptTime).getHours();
    const attemptLocation = attempt.accessPoint;
    
    // Check if access is outside normal patterns
    const unusualTime = !pattern.mostActiveHours.some(hour => 
      Math.abs(parseInt(hour.split(':')[0]) - attemptHour) <= 2
    );
    
    const unusualLocation = !pattern.mostActiveLocations.includes(attemptLocation);
    
    return unusualTime && unusualLocation;
  }

  generateSecurityReport(): any {
    return {
      userId: this.userId,
      accessLevel: this.accessLevel,
      securityScore: this.calculateSecurityScore(),
      threatLevel: this.threatIntelligence.threatLevel,
      lastAccess: this.lastAccessTime,
      accessPattern: this.getAccessPattern(),
      securityClearanceValid: this.isSecurityClearanceValid(),
      mfaEnabled: this.securitySettings.mfaEnabled,
      biometricsEnrolled: this.biometricData.length,
      recentFailedAttempts: this.failedAccessAttempts,
      accountStatus: this.isAccountLocked() ? 'locked' : 'active',
      recommendations: this.generateSecurityRecommendations()
    };
  }

  private generateSecurityRecommendations(): string[] {
    const recommendations = [];
    
    if (!this.securitySettings.mfaEnabled && this.accessLevel !== AccessLevel.VISITOR) {
      recommendations.push('Enable multi-factor authentication');
    }
    
    if (this.biometricData.length === 0 && this.accessLevel !== AccessLevel.VISITOR) {
      recommendations.push('Enroll biometric authentication');
    }
    
    if (!this.isSecurityClearanceValid()) {
      recommendations.push('Renew security clearance');
    }
    
    if (this.threatIntelligence.threatLevel !== 'low') {
      recommendations.push('Review and address security concerns');
    }
    
    if (this.failedAccessAttempts > 0) {
      recommendations.push('Investigate recent failed access attempts');
    }
    
    const expiringPermissions = this.getExpiringPermissions();
    if (expiringPermissions.length > 0) {
      recommendations.push(`Renew ${expiringPermissions.length} expiring permissions`);
    }
    
    return recommendations;
  }
}
