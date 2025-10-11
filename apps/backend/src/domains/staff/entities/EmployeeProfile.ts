import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { StaffMember } from './StaffMember';
import { Certification } from './Certification';
import { TimeOffRequest } from './TimeOffRequest';
import { ShiftSwap } from './ShiftSwap';
import { Department } from './Department';
import { Position } from './Position';

export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  SUSPENDED = 'suspended',
  PROBATION = 'probation'
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary',
  CASUAL = 'casual',
  VOLUNTEER = 'volunteer'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated',
  CIVIL_PARTNERSHIP = 'civil_partnership'
}

@Entity('employee_profiles')
export class EmployeeProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staffMemberId' })
  staffMember: StaffMember;

  @Column({ type: 'uuid' })
  staffMemberId: string;

  @Column({ type: 'var char', length: 100 })
  firstName: string;

  @Column({ type: 'var char', length: 100 })
  lastName: string;

  @Column({ type: 'var char', length: 200 })
  email: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  mobile: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'enum', enum: MaritalStatus, nullable: true })
  maritalStatus: MaritalStatus;

  @Column({ type: 'var char', length: 20 })
  nationalInsuranceNumber: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  passportNumber: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  drivingLicenseNumber: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'var char', length: 20 })
  postcode: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  city: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  country: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  emergencyContactName: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  emergencyContactPhone: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  emergencyContactRelationship: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'enum', enum: EmploymentStatus, default: EmploymentStatus.ACTIVE })
  employmentStatus: EmploymentStatus;

  @Column({ type: 'enum', enum: EmploymentType })
  employmentType: EmploymentType;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ type: 'uuid', nullable: true })
  departmentId: string;

  @ManyToOne(() => Position)
  @JoinColumn({ name: 'positionId' })
  position: Position;

  @Column({ type: 'uuid', nullable: true })
  positionId: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  managerId: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  hrManagerId: string;

  @Column({ type: 'int', default: 0 })
  contractedHours: number; // Hours per week

  @Column({ type: 'int', default: 0 })
  probationPeriod: number; // Days

  @Column({ type: 'date', nullable: true })
  probationEndDate: Date;

  @Column({ type: 'boolean', default: false })
  isProbationary: boolean;

  @Column({ type: 'var char', length: 200, nullable: true })
  profilePicture: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'json', nullable: true })
  skills: string[];

  @Column({ type: 'json', nullable: true })
  languages: string[];

  @Column({ type: 'json', nullable: true })
  qualifications: string[];

  @Column({ type: 'json', nullable: true })
  previousExperience: any[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => Certification, certification => certification.employeeProfile)
  certifications: Certification[];

  @OneToMany(() => TimeOffRequest, timeOffRequest => timeOffRequest.employeeProfile)
  timeOffRequests: TimeOffRequest[];

  @OneToMany(() => ShiftSwap, shiftSwap => shiftSwap.employeeProfile)
  shiftSwaps: ShiftSwap[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public getAge(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  public isActive(): boolean {
    return this.employmentStatus === EmploymentStatus.ACTIVE;
  }

  public isOnLeave(): boolean {
    return this.employmentStatus === EmploymentStatus.ON_LEAVE;
  }

  public isTerminated(): boolean {
    return this.employmentStatus === EmploymentStatus.TERMINATED;
  }

  public isProbationary(): boolean {
    if (!this.isProbationary) return false;
    if (!this.probationEndDate) return true;
    return new Date() < this.probationEndDate;
  }

  public getProbationDaysRemaining(): number {
    if (!this.isProbationary || !this.probationEndDate) return 0;
    
    const today = new Date();
    const diffTime = this.probationEndDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getYearsOfService(): number {
    const today = new Date();
    const startDate = new Date(this.startDate);
    let years = today.getFullYear() - startDate.getFullYear();
    const monthDiff = today.getMonth() - startDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < startDate.getDate())) {
      years--;
    }
    
    return Math.max(0, years);
  }

  public getEmploymentDuration(): {
    years: number;
    months: number;
    days: number;
  } {
    const today = new Date();
    const startDate = new Date(this.startDate);
    const endDate = this.endDate ? new Date(this.endDate) : today;
    
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();
    
    if (days < 0) {
      months--;
      days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months, days };
  }

  public hasValidCertification(certificationType: string): boolean {
    if (!this.certifications) return false;
    
    const validCert = this.certifications.find(cert => 
      cert.type === certificationType && 
      cert.status === 'valid' && 
      cert.expiryDate && 
      new Date(cert.expiryDate) > new Date()
    );
    
    return !!validCert;
  }

  public getExpiringCertifications(days: number = 30): Certification[] {
    if (!this.certifications) return [];
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.certifications.filter(cert => 
      cert.status === 'valid' && 
      cert.expiryDate && 
      new Date(cert.expiryDate) <= futureDate &&
      new Date(cert.expiryDate) > new Date()
    );
  }

  public getEmployeeSummary(): {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    employmentStatus: string;
    employmentType: string;
    startDate: Date;
    yearsOfService: number;
    isActive: boolean;
    isProbationary: boolean;
  } {
    return {
      id: this.id,
      name: this.getFullName(),
      email: this.email,
      phone: this.phone || '',
      department: this.department?.name || '',
      position: this.position?.title || '',
      employmentStatus: this.employmentStatus,
      employmentType: this.employmentType,
      startDate: this.startDate,
      yearsOfService: this.getYearsOfService(),
      isActive: this.isActive(),
      isProbationary: this.isProbationary(),
    };
  }
}
