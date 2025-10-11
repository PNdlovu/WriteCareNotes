import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum UniversalUserType {
  // Staff Users
  CARE_WORKER = 'care_worker',
  MANAGER = 'manager',
  DEPUTY_MANAGER = 'deputy_manager',
  EXECUTIVE = 'executive',
  OPERATIONS = 'operations',
  HR_ADMIN = 'hr_admin',
  SYSTEM_ADMIN = 'system_admin',
  
  // Family/External Users
  FAMILY_MEMBER = 'family_member',
  SERVICE_USER = 'service_user',
  GUARDIAN = 'guardian',
  ADVOCATE = 'advocate',
  GP_LIAISON = 'gp_liaison',
  SOCIAL_WORKER = 'social_worker',
  
  // Regulatory/External
  CQC_INSPECTOR = 'cqc_inspector',
  LOCAL_AUTHORITY = 'local_authority',
  NHS_LIAISON = 'nhs_liaison'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_VERIFICATION = 'pending_verification',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived'
}

export enum RelationshipType {
  // Family Relationships
  SPOUSE = 'spouse',
  PARTNER = 'partner',
  CHILD = 'child',
  PARENT = 'parent',
  SIBLING = 'sibling',
  GRANDCHILD = 'grandchild',
  GRANDPARENT = 'grandparent',
  NIECE_NEPHEW = 'niece_nephew',
  AUNT_UNCLE = 'aunt_uncle',
  COUSIN = 'cousin',
  
  // Professional Relationships
  GUARDIAN = 'guardian',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  ADVOCATE = 'advocate',
  SOCIAL_WORKER = 'social_worker',
  GP = 'gp',
  CONSULTANT = 'consultant',
  
  // Other
  FRIEND = 'friend',
  NEIGHBOR = 'neighbor',
  OTHER = 'other'
}

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth?: Date;
  phone: string;
  email: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
  };
}

export interface FamilyMemberDetails {
  relationshipType: RelationshipType;
  serviceUserIds: string[]; // Can be linked to multiple service users
  emergencyContact: boolean;
  hasDecisionMakingAuthority: boolean;
  canViewMedicalInfo: boolean;
  canViewFinancialInfo: boolean;
  receiveEmergencyAlerts: boolean;
  receiveVisitUpdates: boolean;
  receiveCareReports: boolean;
  preferredContactMethod: 'phone' | 'email' | 'sms' | 'app';
  contactTimePreferences: {
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    timezone: string;
  };
}

export interface StaffDetails {
  employeeId: string;
  department: string;
  jobTitle: string;
  startDate: Date;
  endDate?: Date;
  qualifications: string[];
  certifications: string[];
  specializations: string[];
  workingPattern: {
    hoursPerWeek: number;
    shiftPattern: string;
    availableDays: number[]; // 0-6, Sunday to Saturday
  };
}

export interface AccessPermissions {
  canViewServiceUsers: string[]; // Specific service user IDs
  canViewAllServiceUsers: boolean;
  canEditServiceUsers: string[];
  canViewVisits: string[];
  canEditVisits: string[];
  canViewReports: boolean;
  canViewFinancials: boolean;
  canReceiveEmergencyAlerts: boolean;
  canInitiateEmergencyAlerts: boolean;
  maxDataRetentionDays: number;
  requiresBiometricAuth: boolean;
  allowedDeviceTypes: ('personal' | 'organization')[];
}

export interface NotificationPreferences {
  enabled: boolean;
  visitReminders: boolean;
  visitUpdates: boolean;
  emergencyAlerts: boolean;
  careReports: boolean;
  medicationAlerts: boolean;
  appointmentReminders: boolean;
  systemUpdates: boolean;
  marketingCommunications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  deliveryMethods: {
    push: boolean;
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
}

export interface AppPreferences {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  highContrast: boolean;
  voiceOver: boolean;
  reducedMotion: boolean;
  defaultDashboard: string;
  showTutorials: boolean;
}

@Entity('universal_users')
export class UniversalUser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userNumber: string;

  @Column({
    type: 'enum',
    enum: UniversalUserType
  })
  userType: UniversalUserType;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION
  })
  status: UserStatus;

  @Column('jsonb')
  personalDetails: PersonalDetails;

  @Column('jsonb', { nullable: true })
  familyMemberDetails?: FamilyMemberDetails;

  @Column('jsonb', { nullable: true })
  staffDetails?: StaffDetails;

  @Column('jsonb')
  accessPermissions: AccessPermissions;

  @Column('jsonb')
  notificationPreferences: NotificationPreferences;

  @Column('jsonb')
  appPreferences: AppPreferences;

  @Column('text', { nullable: true })
  profilePhotoUrl?: string;

  @Column('timestamp', { nullable: true })
  lastLoginAt?: Date;

  @Column('text', { nullable: true })
  lastLoginDevice?: string;

  @Column('timestamp', { nullable: true })
  emailVerifiedAt?: Date;

  @Column('timestamp', { nullable: true })
  phoneVerifiedAt?: Date;

  @Column('text', { nullable: true })
  registrationToken?: string;

  @Column('timestamp', { nullable: true })
  registrationTokenExpiry?: Date;

  @Column('text', { nullable: true })
  invitedBy?: string;

  @Column('timestamp', { nullable: true })
  invitedAt?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: false })
  termsAccepted: boolean;

  @Column('timestamp', { nullable: true })
  termsAcceptedAt?: Date;

  @Column({ default: false })
  privacyPolicyAccepted: boolean;

  @Column('timestamp', { nullable: true })
  privacyPolicyAcceptedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isStaffMember(): boolean {
    return [
      UniversalUserType.CARE_WORKER,
      UniversalUserType.MANAGER,
      UniversalUserType.DEPUTY_MANAGER,
      UniversalUserType.EXECUTIVE,
      UniversalUserType.OPERATIONS,
      UniversalUserType.HR_ADMIN,
      UniversalUserType.SYSTEM_ADMIN
    ].includes(this.userType);
  }

  isFamilyMember(): boolean {
    return [
      UniversalUserType.FAMILY_MEMBER,
      UniversalUserType.SERVICE_USER,
      UniversalUserType.GUARDIAN,
      UniversalUserType.ADVOCATE
    ].includes(this.userType);
  }

  isExternalUser(): boolean {
    return [
      UniversalUserType.GP_LIAISON,
      UniversalUserType.SOCIAL_WORKER,
      UniversalUserType.CQC_INSPECTOR,
      UniversalUserType.LOCAL_AUTHORITY,
      UniversalUserType.NHS_LIAISON
    ].includes(this.userType);
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isVerified(): boolean {
    return !!this.emailVerifiedAt || !!this.phoneVerifiedAt;
  }

  canViewServiceUser(serviceUserId: string): boolean {
    return this.accessPermissions.canViewAllServiceUsers ||
           this.accessPermissions.canViewServiceUsers.includes(serviceUserId);
  }

  canEditServiceUser(serviceUserId: string): boolean {
    return this.accessPermissions.canEditServiceUsers.includes(serviceUserId);
  }

  hasEmergencyContact(): boolean {
    return this.isFamilyMember() && 
           this.familyMemberDetails?.emergencyContact === true;
  }

  canMakeDecisions(): boolean {
    return this.familyMemberDetails?.hasDecisionMakingAuthority === true;
  }

  getLinkedServiceUsers(): string[] {
    return this.familyMemberDetails?.serviceUserIds || [];
  }

  getFullName(): string {
    const { firstName, lastName, middleName, preferredName } = this.personalDetails;
    const displayName = preferredName || firstName;
    return middleName ? `${displayName} ${middleName} ${lastName}` : `${displayName} ${lastName}`;
  }

  getDisplayName(): string {
    return this.personalDetails.preferredName || this.personalDetails.firstName;
  }

  getContactInfo(): { phone: string; email: string } {
    return {
      phone: this.personalDetails.phone,
      email: this.personalDetails.email
    };
  }

  shouldReceiveNotification(type: string): boolean {
    if (!this.notificationPreferences.enabled) return false;

    switch (type) {
      case 'visit_reminder':
        return this.notificationPreferences.visitReminders;
      case 'visit_update':
        return this.notificationPreferences.visitUpdates;
      case 'emergency_alert':
        return this.notificationPreferences.emergencyAlerts;
      case 'care_report':
        return this.notificationPreferences.careReports;
      case 'medication_alert':
        return this.notificationPreferences.medicationAlerts;
      case 'appointment_reminder':
        return this.notificationPreferences.appointmentReminders;
      case 'system_update':
        return this.notificationPreferences.systemUpdates;
      default:
        return true;
    }
  }

  isInQuietHours(): boolean {
    if (!this.notificationPreferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = this.notificationPreferences.quietHours;
    
    // Handle overnight quiet hours
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  getAccessibleFeatures(): string[] {
    const features: string[] = [];

    if (this.isStaffMember()) {
      features.push('workforce_management', 'time_tracking', 'payroll');
      
      if (this.userType === UniversalUserType.EXECUTIVE) {
        features.push('executive_dashboard', 'financial_reports', 'strategic_analytics');
      }
      
      if ([UniversalUserType.MANAGER, UniversalUserType.DEPUTY_MANAGER].includes(this.userType)) {
        features.push('team_management', 'approvals', 'staff_reports');
      }
    }

    if (this.isFamilyMember()) {
      features.push('service_user_updates', 'visit_tracking', 'care_reports');
      
      if (this.familyMemberDetails?.canViewMedicalInfo) {
        features.push('medical_information');
      }
      
      if (this.familyMemberDetails?.hasDecisionMakingAuthority) {
        features.push('care_decisions', 'appointment_scheduling');
      }
    }

    if (this.accessPermissions.canReceiveEmergencyAlerts) {
      features.push('emergency_alerts');
    }

    if (this.accessPermissions.canViewReports) {
      features.push('reports_dashboard');
    }

    return features;
  }

  generateUserSummary(): any {
    return {
      userNumber: this.userNumber,
      name: this.getFullName(),
      displayName: this.getDisplayName(),
      userType: this.userType,
      status: this.status,
      isStaff: this.isStaffMember(),
      isFamily: this.isFamilyMember(),
      isVerified: this.isVerified(),
      linkedServiceUsers: this.getLinkedServiceUsers().length,
      lastLogin: this.lastLoginAt?.toISOString(),
      accessibleFeatures: this.getAccessibleFeatures(),
      contactInfo: this.getContactInfo()
    };
  }
}