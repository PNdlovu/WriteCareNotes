import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { ResidentStatus } from '../entities/Resident';
import { BaseEntity } from '../BaseEntity';

export enum ServiceUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DISCHARGED = 'discharged',
  DECEASED = 'deceased'
}

export enum CareLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  COMPLEX = 'complex'
}

export enum MobilityLevel {
  INDEPENDENT = 'independent',
  WALKING_AID = 'walking_aid',
  WHEELCHAIR = 'wheelchair',
  BEDBOUND = 'bedbound'
}

export interface EncryptedPersonalDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  nhsNumber?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accessInstructions?: string;
    keyBoxCode?: string;
    parkingInfo?: string;
  };
}

export interface ContactInformation {
  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  preferredContactMethod: 'phone' | 'email' | 'text' | 'family';
  emergencyContacts: EmergencyContact[];
  familyContacts: FamilyContact[];
  gpDetails?: {
    name: string;
    practice: string;
    phone: string;
    address: string;
  };
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  hasKeyAccess: boolean;
  canMakeDecisions: boolean;
}

export interface FamilyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  receiveUpdates: boolean;
  canViewReports: boolean;
  hasPortalAccess: boolean;
}

export interface MedicalInformation {
  conditions: MedicalCondition[];
  medications: Medication[];
  allergies: Allergy[];
  mobilityLevel: MobilityLevel;
  cognitiveStatus: string;
  riskAssessments: RiskAssessment[];
  lastMedicalReview: Date;
  nextMedicalReview: Date;
}

export interface MedicalCondition {
  id: string;
  condition: string;
  diagnosedDate: Date;
  severity: 'mild' | 'moderate' | 'severe';
  status: ResidentStatus.ACTIVE | 'managed' | 'resolved';
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  purpose: string;
  sideEffects?: string[];
  requiresSupervision: boolean;
  timesCritical: boolean;
}

export interface Allergy {
  id: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reactions: string[];
  treatment: string;
  dateIdentified: Date;
}

export interface RiskAssessment {
  id: string;
  type: 'falls' | 'medication' | 'nutrition' | 'skin_integrity' | 'mental_health' | 'safeguarding';
  level: 'low' | 'medium' | 'high' | 'very_high';
  factors: string[];
  mitigations: string[];
  lastAssessed: Date;
  nextReview: Date;
  assessedBy: string;
}

export interface CareRequirements {
  careLevel: CareLevel;
  hoursPerWeek: number;
  preferredTimes: PreferredTime[];
  careNeeds: CareNeed[];
  equipmentNeeded: Equipment[];
  accessRequirements: string[];
  culturalRequirements?: string[];
  dietaryRequirements?: string[];
  communicationNeeds?: string[];
}

export interface PreferredTime {
  dayOfWeek: number; // 0-6, Sunday to Saturday
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  priority: 'essential' | 'preferred' | 'flexible';
}

export interface CareNeed {
  id: string;
  category: 'personal_care' | 'medication' | 'mobility' | 'nutrition' | 'social' | 'domestic' | 'healthcare';
  task: string;
  frequency: string;
  duration: number; // minutes
  priority: 'critical' | 'important' | 'routine';
  specialInstructions?: string;
  requiresTraining: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Equipment {
  id: string;
  name: string;
  type: 'mobility' | 'medical' | 'safety' | 'communication' | 'domestic';
  location: string;
  instructions?: string;
  lastServiced?: Date;
  nextService?: Date;
  supplier?: string;
}

export interface ServiceUserPreferences {
  wakeUpTime?: string;
  bedTime?: string;
  mealTimes: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snacks?: string[];
  };
  activities: string[];
  dislikes: string[];
  routines: DailyRoutine[];
  communicationStyle: string;
  personalityNotes: string;
}

export interface DailyRoutine {
  time: string;
  activity: string;
  importance: 'critical' | 'important' | 'flexible';
  notes?: string;
}

@Entity('service_users')
export class ServiceUser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  serviceUserNumber: string;

  @Column('jsonb')
  personalDetails: EncryptedPersonalDetails;

  @Column('jsonb')
  contactInformation: ContactInformation;

  @Column('jsonb')
  medicalInformation: MedicalInformation;

  @Column('jsonb')
  careRequirements: CareRequirements;

  @Column('jsonb', { nullable: true })
  preferences?: ServiceUserPreferences;

  @Column({
    type: 'enum',
    enum: ServiceUserStatus,
    default: ServiceUserStatus.ACTIVE
  })
  status: ServiceUserStatus;

  @Column('date')
  careStartDate: Date;

  @Column('date', { nullable: true })
  careEndDate?: Date;

  @Column()
  fundingSource: string; // 'local_authority' | 'nhs' | 'private' | 'direct_payment'

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weeklyBudget?: number;

  @Column({ nullable: true })
  localAuthorityRef?: string;

  @Column({ nullable: true })
  socialWorker?: string;

  @Column({ nullable: true })
  careManager?: string;

  @Column('text', { nullable: true })
  specialNotes?: string;

  @Column({ default: false })
  requiresKeyHolder: boolean;

  @Column({ default: false })
  hasSecuritySystem: boolean;

  @Column({ default: false })
  hasPets: boolean;

  @Column('text', { nullable: true })
  petInformation?: string;

  @Column('jsonb', { nullable: true })
  visitHistory?: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return this.status === ServiceUserStatus.ACTIVE;
  }

  requiresHighLevelCare(): boolean {
    return this.careRequirements.careLevel === CareLevel.HIGH || 
           this.careRequirements.careLevel === CareLevel.COMPLEX;
  }

  hasEmergencyContacts(): boolean {
    return this.contactInformation.emergencyContacts.length > 0;
  }

  getPrimaryEmergencyContact(): EmergencyContact | null {
    return this.contactInformation.emergencyContacts.find(contact => contact.isPrimary) || null;
  }

  hasKeyAccess(): boolean {
    return this.personalDetails.address.keyBoxCode !== undefined ||
           this.contactInformation.emergencyContacts.some(contact => contact.hasKeyAccess);
  }

  getCriticalMedications(): Medication[] {
    return this.medicalInformation.medications.filter(med => med.timesCritical);
  }

  getHighRiskAssessments(): RiskAssessment[] {
    return this.medicalInformation.riskAssessments.filter(risk => 
      risk.level === 'high' || risk.level === 'very_high'
    );
  }

  requiresSpecializedCare(): boolean {
    return this.medicalInformation.conditions.some(condition => 
      condition.severity === 'severe' && condition.status === 'active'
    ) || this.careRequirements.careNeeds.some(need => need.requiresTraining);
  }

  getWeeklyHours(): number {
    return this.careRequirements.hoursPerWeek;
  }

  getEstimatedWeeklyCost(): number {
    if (!this.hourlyRate) return 0;
    return this.careRequirements.hoursPerWeek * this.hourlyRate;
  }

  isWithinBudget(): boolean {
    if (!this.weeklyBudget || !this.hourlyRate) return true;
    return this.getEstimatedWeeklyCost() <= this.weeklyBudget;
  }

  getFullName(): string {
    const { firstName, lastName, middleName } = this.personalDetails;
    return middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
  }

  getFullAddress(): string {
    const addr = this.personalDetails.address;
    return `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}, ${addr.county} ${addr.postcode}`;
  }

  getAge(): number {
    const today = new Date();
    const birthDate = new Date(this.personalDetails.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  hasUpcomingReviews(): boolean {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.medicalInformation.nextMedicalReview <= nextWeek ||
           this.medicalInformation.riskAssessments.some(risk => risk.nextReview <= nextWeek);
  }

  generateCareSummary(): any {
    return {
      serviceUserNumber: this.serviceUserNumber,
      name: this.getFullName(),
      age: this.getAge(),
      careLevel: this.careRequirements.careLevel,
      weeklyHours: this.careRequirements.hoursPerWeek,
      status: this.status,
      address: this.getFullAddress(),
      emergencyContact: this.getPrimaryEmergencyContact()?.name,
      criticalMedications: this.getCriticalMedications().length,
      highRiskAssessments: this.getHighRiskAssessments().length,
      requiresSpecializedCare: this.requiresSpecializedCare()
    };
  }
}
