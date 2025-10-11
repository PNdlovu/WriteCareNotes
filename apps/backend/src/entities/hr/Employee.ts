import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { ResidentStatus } from '../entities/Resident';
import { BaseEntity } from '../BaseEntity';

export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  RETIRED = 'retired'
}

export enum ContractType {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
  CASUAL = 'casual',
  ZERO_HOURS = 'zero_hours',
  APPRENTICE = 'apprentice',
  CONTRACTOR = 'contractor'
}

export enum PayrollFrequency {
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly'
}

export enum RightToWorkStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  EXPIRED = 'expired',
  INVALID = 'invalid'
}

export interface EncryptedPersonalDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  nationalInsuranceNumber: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
  };
}

export interface EncryptedContactInformation {
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
}

export interface EmploymentInformation {
  startDate: Date;
  endDate?: Date;
  probationEndDate?: Date;
  department: string;
  location: string;
  reportsTo: string;
  employmentStatus: EmploymentStatus;
}

export interface JobDetails {
  jobTitle: string;
  jobDescription: string;
  payGrade: string;
  salaryBand: string;
  baseSalary: number;
  currency: string;
  workingHours: number;
  contractType: ContractType;
  payrollFrequency: PayrollFrequency;
}

export interface ContractInformation {
  contractNumber: string;
  contractStartDate: Date;
  contractEndDate?: Date;
  noticePeriod: number; // days
  holidayEntitlement: number; // days per year
  pensionScheme?: string;
  benefits: string[];
  restrictiveCovenants: string[];
}

export interface RightToWorkDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  issuingAuthority: string;
  verificationDate: Date;
  verifiedBy: string;
  status: 'valid' | 'expired' | 'invalid';
}

export interface Qualification {
  id: string;
  qualificationType: string;
  qualificationName: string;
  institution: string;
  dateObtained: Date;
  expiryDate?: Date;
  certificateNumber?: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

export interface Certification {
  id: string;
  certificationName: string;
  certifyingBody: string;
  certificationNumber: string;
  dateObtained: Date;
  expiryDate?: Date;
  renewalRequired: boolean;
  status: ResidentStatus.ACTIVE | 'expired' | 'suspended';
}

export interface ProfessionalRegistration {
  id: string;
  registrationBody: string;
  registrationNumber: string;
  registrationType: string;
  startDate: Date;
  expiryDate?: Date;
  status: ResidentStatus.ACTIVE | 'lapsed' | 'suspended';
  conditions?: string[];
}

export interface Skill {
  id: string;
  skillName: string;
  skillCategory: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  lastAssessed: Date;
  certificationRequired: boolean;
}

export interface Competency {
  id: string;
  competencyName: string;
  competencyFramework: string;
  requiredLevel: string;
  currentLevel: string;
  assessmentDate: Date;
  assessor: string;
  nextAssessmentDate: Date;
  status: 'competent' | 'developing' | 'not_competent';
}

export interface PerformanceRecord {
  id: string;
  reviewPeriod: string;
  reviewDate: Date;
  reviewer: string;
  overallRating: number;
  goals: {
    description: string;
    status: 'achieved' | 'partially_achieved' | 'not_achieved';
    score: number;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  developmentPlan: string;
  nextReviewDate: Date;
}

export interface TrainingRecord {
  id: string;
  trainingName: string;
  trainingProvider: string;
  trainingType: 'mandatory' | 'professional_development' | 'induction' | 'refresher';
  startDate: Date;
  completionDate?: Date;
  expiryDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'expired';
  certificateNumber?: string;
  score?: number;
  trainer: string;
}

export interface DisciplinaryRecord {
  id: string;
  incidentDate: Date;
  reportedDate: Date;
  incidentType: string;
  description: string;
  investigationOutcome: string;
  actionTaken: string;
  disciplinaryMeeting?: Date;
  outcome: 'no_action' | 'verbal_warning' | 'written_warning' | 'final_warning' | 'dismissal';
  appealDeadline?: Date;
  appealSubmitted?: boolean;
  appealOutcome?: string;
}

@Entity('employees')
export class Employee extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  employeeNumber: string;

  @Column('jsonb')
  personalDetails: EncryptedPersonalDetails;

  @Column('jsonb')
  contactInformation: EncryptedContactInformation;

  @Column('jsonb')
  employmentInformation: EmploymentInformation;

  @Column('jsonb')
  jobDetails: JobDetails;

  @Column('jsonb')
  contractInformation: ContractInformation;

  @Column('jsonb')
  rightToWorkDocuments: RightToWorkDocument[];

  @Column({
    type: 'enum',
    enum: RightToWorkStatus,
    default: RightToWorkStatus.PENDING
  })
  rightToWorkStatus: RightToWorkStatus;

  @Column('date', { nullable: true })
  rightToWorkExpiryDate?: Date;

  @Column('jsonb')
  qualifications: Qualification[];

  @Column('jsonb')
  certifications: Certification[];

  @Column('jsonb')
  professionalRegistrations: ProfessionalRegistration[];

  @Column('jsonb')
  skills: Skill[];

  @Column('jsonb')
  competencies: Competency[];

  @Column('jsonb')
  performanceHistory: PerformanceRecord[];

  @Column('jsonb')
  trainingRecords: TrainingRecord[];

  @Column('jsonb')
  disciplinaryRecords: DisciplinaryRecord[];

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return this.employmentInformation.employmentStatus === EmploymentStatus.ACTIVE;
  }

  isRightToWorkValid(): boolean {
    if (this.rightToWorkStatus !== RightToWorkStatus.VERIFIED) {
      return false;
    }
    
    if (this.rightToWorkExpiryDate) {
      return new Date() < this.rightToWorkExpiryDate;
    }
    
    return true;
  }

  hasRequiredQualifications(requiredQualifications: string[]): boolean {
    const employeeQualifications = this.qualifications.map(q => q.qualificationName.toLowerCase());
    return requiredQualifications.every(req => 
      employeeQualifications.some(eq => eq.includes(req.toLowerCase()))
    );
  }

  getExpiringCertifications(withinDays: number = 30): Certification[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.certifications.filter(cert => 
      cert.expiryDate && 
      cert.status === 'active' && 
      new Date(cert.expiryDate) <= futureDate
    );
  }

  getMandatoryTrainingDue(): TrainingRecord[] {
    return this.trainingRecords.filter(training => 
      training.trainingType === 'mandatory' && 
      (training.status === 'scheduled' || 
       (training.expiryDate && new Date(training.expiryDate) <= new Date()))
    );
  }

  getLatestPerformanceReview(): PerformanceRecord | null {
    if (this.performanceHistory.length === 0) return null;
    
    return this.performanceHistory
      .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())[0];
  }

  isPerformanceReviewDue(): boolean {
    const latestReview = this.getLatestPerformanceReview();
    if (!latestReview) return true;
    
    return new Date() >= new Date(latestReview.nextReviewDate);
  }

  getAveragePerformanceRating(): number {
    if (this.performanceHistory.length === 0) return 0;
    
    const totalRating = this.performanceHistory.reduce((sum, review) => sum + review.overallRating, 0);
    return totalRating / this.performanceHistory.length;
  }

  hasActiveDisciplinaryActions(): boolean {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return this.disciplinaryRecords.some(record => 
      new Date(record.incidentDate) > sixMonthsAgo &&
      ['written_warning', 'final_warning'].includes(record.outcome)
    );
  }

  getYearsOfService(): number {
    const startDate = new Date(this.employmentInformation.startDate);
    const now = new Date();
    return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  getFullName(): string {
    const { firstName, lastName, middleName } = this.personalDetails;
    return middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
  }
}
