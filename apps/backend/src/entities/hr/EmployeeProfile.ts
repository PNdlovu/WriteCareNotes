import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsEmail, IsOptional, IsEnum, IsDateString, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '../BaseEntity';
import { Employee } from './Employee';
import { HealthcareEncryption } from '@/utils/healthcare-encryption';

export enum ProfileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_APPROVAL = 'pending_approval',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived'
}

export enum ProfileType {
  BASIC = 'basic',
  COMPREHENSIVE = 'comprehensive',
  EXECUTIVE = 'executive',
  CONTRACTOR = 'contractor'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
  OTHER = 'other'
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated',
  CIVIL_PARTNERSHIP = 'civil_partnership',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

export enum EmergencyContactRelationship {
  SPOUSE = 'spouse',
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  FRIEND = 'friend',
  OTHER = 'other'
}

export interface PersonalInformation {
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth: Date;
  gender: Gender;
  maritalStatus: MaritalStatus;
  nationality: string;
  ethnicity?: string;
  religion?: string;
  languages: string[];
  disabilities?: string[];
  dietaryRequirements?: string[];
  medicalConditions?: string[];
}

export interface ContactDetails {
  primaryEmail: string;
  secondaryEmail?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  workPhone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: EmergencyContactRelationship;
    phone: string;
    email?: string;
    address?: string;
  };
  nextOfKin?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
  };
}

export interface ProfessionalDetails {
  jobTitle: string;
  department: string;
  location: string;
  managerId?: string;
  managerName?: string;
  teamLeadId?: string;
  teamLeadName?: string;
  workSchedule: {
    type: 'full_time' | 'part_time' | 'flexible' | 'shift_work';
    hoursPerWeek: number;
    daysPerWeek: number;
    startTime?: string;
    endTime?: string;
    shiftPattern?: string;
  };
  employmentType: 'permanent' | 'temporary' | 'contract' | 'casual' | 'apprentice';
  startDate: Date;
  endDate?: Date;
  probationEndDate?: Date;
  noticePeriod: number; // days
}

export interface CompensationDetails {
  baseSalary: number;
  currency: string;
  payFrequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  hourlyRate?: number;
  overtimeRate?: number;
  bonusStructure?: {
    type: 'performance' | 'sales' | 'retention' | 'other';
    amount?: number;
    frequency?: string;
    conditions?: string;
  }[];
  benefits: {
    type: string;
    description: string;
    value?: number;
    taxable: boolean;
  }[];
  pensionContribution: {
    employee: number;
    employer: number;
    scheme: string;
  };
}

export interface SkillsAndCompetencies {
  technicalSkills: {
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    lastUsed?: Date;
    certified: boolean;
  }[];
  softSkills: {
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    assessed: boolean;
    assessmentDate?: Date;
  }[];
  competencies: {
    competency: string;
    framework: string;
    level: string;
    requiredLevel: string;
    lastAssessed: Date;
    assessor: string;
    nextAssessment: Date;
  }[];
  languages: {
    language: string;
    proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';
    certified: boolean;
  }[];
}

export interface DevelopmentPlan {
  id: string;
  title: string;
  description: string;
  type: 'training' | 'mentoring' | 'project' | 'certification' | 'other';
  startDate: Date;
  targetDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  cost?: number;
  provider?: string;
  mentor?: string;
  objectives: string[];
  successCriteria: string[];
  progress: number; // percentage
  notes?: string;
}

export interface PerformanceMetrics {
  overallRating: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
  goals: {
    id: string;
    description: string;
    target: string;
    progress: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
    dueDate: Date;
  }[];
  achievements: {
    id: string;
    description: string;
    date: Date;
    impact: string;
    recognized: boolean;
  }[];
  areasForImprovement: string[];
  strengths: string[];
  developmentNeeds: string[];
}

@Entity('employee_profiles')
export class EmployeeProfile extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  profileId: string;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: ProfileStatus,
    default: ProfileStatus.ACTIVE
  })
  @IsEnum(ProfileStatus)
  status: ProfileStatus;

  @Column({
    type: 'enum',
    enum: ProfileType,
    default: ProfileType.BASIC
  })
  @IsEnum(ProfileType)
  profileType: ProfileType;

  @Column('jsonb')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  personalInformation: PersonalInformation;

  @Column('jsonb')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  contactDetails: ContactDetails;

  @Column('jsonb')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  professionalDetails: ProfessionalDetails;

  @Column('jsonb')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  compensationDetails: CompensationDetails;

  @Column('jsonb', { default: '[]' })
  @IsArray()
  @ValidateNested()
  @Type(() => Object)
  skillsAndCompetencies: SkillsAndCompetencies;

  @Column('jsonb', { default: '[]' })
  @IsArray()
  @ValidateNested()
  @Type(() => Object)
  developmentPlans: DevelopmentPlan[];

  @Column('jsonb', { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  performanceMetrics?: PerformanceMetrics;

  @Column('text', { nullable: true })
  @IsOptional()
  notes?: string;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  @BeforeInsert()
  generateProfileId() {
    if (!this.profileId) {
      this.profileId = `PROF-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateProfile() {
    if (!this.personalInformation || !this.contactDetails || !this.professionalDetails || !this.compensationDetails) {
      throw new Error('Required profile sections must be provided');
    }
  }

  getFullName(): string {
    const { firstName, lastName, middleName, preferredName } = this.personalInformation;
    const displayName = preferredName || firstName;
    return middleName ? `${displayName} ${middleName} ${lastName}` : `${displayName} ${lastName}`;
  }

  getDisplayName(): string {
    return this.personalInformation.preferredName || this.personalInformation.firstName;
  }

  getAge(): number {
    const today = new Date();
    const birthDate = new Date(this.personalInformation.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getYearsOfService(): number {
    const startDate = new Date(this.professionalDetails.startDate);
    const endDate = this.professionalDetails.endDate ? new Date(this.professionalDetails.endDate) : new Date();
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  isActive(): boolean {
    return this.status === ProfileStatus.ACTIVE;
  }

  isOnProbation(): boolean {
    if (!this.professionalDetails.probationEndDate) return false;
    return new Date() <= new Date(this.professionalDetails.probationEndDate);
  }

  getActiveDevelopmentPlans(): DevelopmentPlan[] {
    return this.developmentPlans.filter(plan => 
      plan.status === 'planned' || plan.status === 'in_progress'
    );
  }

  getCompletedDevelopmentPlans(): DevelopmentPlan[] {
    return this.developmentPlans.filter(plan => plan.status === 'completed');
  }

  getOverdueDevelopmentPlans(): DevelopmentPlan[] {
    return this.developmentPlans.filter(plan => 
      plan.status === 'in_progress' && new Date() > new Date(plan.targetDate)
    );
  }

  getSkillsByLevel(level: string): string[] {
    const allSkills = [
      ...this.skillsAndCompetencies.technicalSkills,
      ...this.skillsAndCompetencies.softSkills
    ];
    return allSkills
      .filter(skill => skill.level === level)
      .map(skill => skill.skill);
  }

  getCertifiedSkills(): string[] {
    return this.skillsAndCompetencies.technicalSkills
      .filter(skill => skill.certified)
      .map(skill => skill.skill);
  }

  getLanguageProficiency(language: string): string | null {
    const lang = this.skillsAndCompetencies.languages.find(l => 
      l.language.toLowerCase() === language.toLowerCase()
    );
    return lang ? lang.proficiency : null;
  }

  getCurrentGoals(): any[] {
    if (!this.performanceMetrics) return [];
    return this.performanceMetrics.goals.filter(goal => 
      goal.status === 'in_progress' || goal.status === 'not_started'
    );
  }

  getCompletedGoals(): any[] {
    if (!this.performanceMetrics) return [];
    return this.performanceMetrics.goals.filter(goal => goal.status === 'completed');
  }

  getOverdueGoals(): any[] {
    if (!this.performanceMetrics) return [];
    return this.performanceMetrics.goals.filter(goal => 
      goal.status === 'in_progress' && new Date() > new Date(goal.dueDate)
    );
  }

  getTotalCompensation(): number {
    let total = this.compensationDetails.baseSalary;
    
    if (this.compensationDetails.bonusStructure) {
      total += this.compensationDetails.bonusStructure.reduce((sum, bonus) => 
        sum + (bonus.amount || 0), 0
      );
    }
    
    if (this.compensationDetails.benefits) {
      total += this.compensationDetails.benefits.reduce((sum, benefit) => 
        sum + (benefit.value || 0), 0
      );
    }
    
    return total;
  }

  getAnnualLeaveEntitlement(): number {
    // Basic calculation - could be more complex based on years of service, etc.
    const yearsOfService = this.getYearsOfService();
    let baseDays = 25; // Standard UK annual leave
    
    if (yearsOfService >= 5) baseDays += 1;
    if (yearsOfService >= 10) baseDays += 1;
    if (yearsOfService >= 15) baseDays += 1;
    
    return baseDays;
  }

  getPerformanceRating(): number {
    return this.performanceMetrics?.overallRating || 0;
  }

  isPerformanceReviewDue(): boolean {
    if (!this.performanceMetrics) return true;
    return new Date() >= new Date(this.performanceMetrics.nextReviewDate);
  }

  getDevelopmentProgress(): number {
    const activePlans = this.getActiveDevelopmentPlans();
    if (activePlans.length === 0) return 100;
    
    const totalProgress = activePlans.reduce((sum, plan) => sum + plan.progress, 0);
    return Math.round(totalProgress / activePlans.length);
  }

  getSkillsGap(requiredSkills: string[]): string[] {
    const currentSkills = this.skillsAndCompetencies.technicalSkills.map(s => s.skill.toLowerCase());
    return requiredSkills.filter(skill => 
      !currentSkills.some(current => current.includes(skill.toLowerCase()))
    );
  }

  toJSON() {
    const { personalInformation, contactDetails, ...rest } = this;
    return {
      ...rest,
      personalInformation: HealthcareEncryption.decrypt(personalInformation),
      contactDetails: HealthcareEncryption.decrypt(contactDetails)
    };
  }
}
