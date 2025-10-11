import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Salary } from './Salary';

export enum PayGradeLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  INTERMEDIATE = 'intermediate',
  SENIOR = 'senior',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive'
}

@Entity('pay_grades')
export class PayGrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 50, unique: true })
  name: string;

  @Column({ type: 'var char', length: 100 })
  displayName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: PayGradeLevel })
  level: PayGradeLevel;

  @Column({ type: 'int' })
  gradeNumber: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  minSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  midSalary: number;

  @Column({ type: 'var char', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtimeMultiplier: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weekendMultiplier: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  nightShiftMultiplier: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  holidayMultiplier: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  phoneAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  uniformAllowance: number;

  @Column({ type: 'int', default: 0 })
  standardHours: number; // Hours per week

  @Column({ type: 'int', default: 0 })
  annualLeaveDays: number;

  @Column({ type: 'int', default: 0 })
  sickLeaveDays: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => Salary, salary => salary.payGrade)
  salaries: Salary[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateMidSalary(): void {
    this.midSalary = (this.minSalary + this.maxSalary) / 2;
  }

  public isSalaryInRange(salary: number): boolean {
    return salary >= this.minSalary && salary <= this.maxSalary;
  }

  public getSalaryRange(): {
    min: number;
    max: number;
    mid: number;
    currency: string;
  } {
    return {
      min: this.minSalary,
      max: this.maxSalary,
      mid: this.midSalary,
      currency: this.currency,
    };
  }

  public getAllowances(): {
    car: number;
    phone: number;
    uniform: number;
    total: number;
  } {
    const total = this.carAllowance + this.phoneAllowance + this.uniformAllowance;
    return {
      car: this.carAllowance,
      phone: this.phoneAllowance,
      uniform: this.uniformAllowance,
      total,
    };
  }

  public getMultipliers(): {
    overtime: number;
    weekend: number;
    nightShift: number;
    holiday: number;
  } {
    return {
      overtime: this.overtimeMultiplier,
      weekend: this.weekendMultiplier,
      nightShift: this.nightShiftMultiplier,
      holiday: this.holidayMultiplier,
    };
  }

  public getPayGradeSummary(): {
    id: string;
    name: string;
    displayName: string;
    level: string;
    gradeNumber: number;
    salaryRange: any;
    allowances: any;
    multipliers: any;
    standardHours: number;
    annualLeaveDays: number;
    isActive: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      level: this.level,
      gradeNumber: this.gradeNumber,
      salaryRange: this.getSalaryRange(),
      allowances: this.getAllowances(),
      multipliers: this.getMultipliers(),
      standardHours: this.standardHours,
      annualLeaveDays: this.annualLeaveDays,
      isActive: this.isActive,
    };
  }
}
