import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EmployeeProfile } from './EmployeeProfile';

export enum PositionLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  INTERMEDIATE = 'intermediate',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive'
}

export enum PositionType {
  CLINICAL = 'clinical',
  ADMINISTRATIVE = 'administrative',
  SUPPORT = 'support',
  MANAGEMENT = 'management',
  TECHNICAL = 'technical',
  MAINTENANCE = 'maintenance',
  CATERING = 'catering',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  OTHER = 'other'
}

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 100, unique: true })
  title: string;

  @Column({ type: 'var char', length: 200 })
  displayName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: PositionType })
  type: PositionType;

  @Column({ type: 'enum', enum: PositionLevel })
  level: PositionLevel;

  @Column({ type: 'var char', length: 50, nullable: true })
  code: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  departmentId: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  managerPositionId: string;

  @Column({ type: 'int', default: 0 })
  employeeCount: number;

  @Column({ type: 'int', default: 0 })
  maxEmployees: number;

  @Column({ type: 'int', default: 0 })
  standardHours: number; // Hours per week

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  maxSalary: number;

  @Column({ type: 'var char', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'json', nullable: true })
  requiredSkills: string[];

  @Column({ type: 'json', nullable: true })
  preferredSkills: string[];

  @Column({ type: 'json', nullable: true })
  requiredQualifications: string[];

  @Column({ type: 'json', nullable: true })
  requiredCertifications: string[];

  @Column({ type: 'int', default: 0 })
  minExperienceYears: number;

  @Column({ type: 'text', nullable: true })
  responsibilities: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ type: 'text', nullable: true })
  benefits: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isRemote: boolean;

  @Column({ type: 'boolean', default: false })
  isPartTime: boolean;

  @Column({ type: 'boolean', default: false })
  isContract: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => EmployeeProfile, employeeProfile => employeeProfile.position)
  employees: EmployeeProfile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public getEmployeeCount(): number {
    return this.employees?.length || 0;
  }

  public isFull(): boolean {
    return this.maxEmployees > 0 && this.getEmployeeCount() >= this.maxEmployees;
  }

  public hasCapacity(): boolean {
    return this.maxEmployees === 0 || this.getEmployeeCount() < this.maxEmployees;
  }

  public getCapacityPercentage(): number {
    if (this.maxEmployees === 0) return 0;
    return (this.getEmployeeCount() / this.maxEmployees) * 100;
  }

  public getSalaryRange(): {
    min: number;
    max: number;
    currency: string;
    formatted: string;
  } {
    const formatted = `${new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
    }).format(this.minSalary)} - ${new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
    }).format(this.maxSalary)}`;

    return {
      min: this.minSalary,
      max: this.maxSalary,
      currency: this.currency,
      formatted,
    };
  }

  public isClinical(): boolean {
    return this.type === PositionType.CLINICAL;
  }

  public isManagement(): boolean {
    return this.type === PositionType.MANAGEMENT || this.level === PositionLevel.MANAGER || this.level === PositionLevel.DIRECTOR || this.level === PositionLevel.EXECUTIVE;
  }

  public isEntryLevel(): boolean {
    return this.level === PositionLevel.ENTRY;
  }

  public isSeniorLevel(): boolean {
    return this.level === PositionLevel.SENIOR || this.level === PositionLevel.LEAD || this.level === PositionLevel.MANAGER || this.level === PositionLevel.DIRECTOR || this.level === PositionLevel.EXECUTIVE;
  }

  public getPositionSummary(): {
    id: string;
    title: string;
    displayName: string;
    type: string;
    level: string;
    code: string;
    departmentId: string;
    employeeCount: number;
    maxEmployees: number;
    capacityPercentage: number;
    standardHours: number;
    salaryRange: any;
    requiredSkills: string[];
    preferredSkills: string[];
    requiredQualifications: string[];
    requiredCertifications: string[];
    minExperienceYears: number;
    isActive: boolean;
    isRemote: boolean;
    isPartTime: boolean;
    isContract: boolean;
    isFull: boolean;
    hasCapacity: boolean;
  } {
    return {
      id: this.id,
      title: this.title,
      displayName: this.displayName,
      type: this.type,
      level: this.level,
      code: this.code || '',
      departmentId: this.departmentId || '',
      employeeCount: this.getEmployeeCount(),
      maxEmployees: this.maxEmployees,
      capacityPercentage: this.getCapacityPercentage(),
      standardHours: this.standardHours,
      salaryRange: this.getSalaryRange(),
      requiredSkills: this.requiredSkills || [],
      preferredSkills: this.preferredSkills || [],
      requiredQualifications: this.requiredQualifications || [],
      requiredCertifications: this.requiredCertifications || [],
      minExperienceYears: this.minExperienceYears,
      isActive: this.isActive,
      isRemote: this.isRemote,
      isPartTime: this.isPartTime,
      isContract: this.isContract,
      isFull: this.isFull(),
      hasCapacity: this.hasCapacity(),
    };
  }
}
