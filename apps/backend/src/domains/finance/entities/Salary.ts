import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StaffMember } from '../../staff/entities/StaffMember';
import { PayGrade } from './PayGrade';

export enum SalaryType {
  ANNUAL = 'annual',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum SalaryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated'
}

@Entity('salaries')
export class Salary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staffMemberId' })
  staffMember: StaffMember;

  @Column({ type: 'uuid' })
  staffMemberId: string;

  @ManyToOne(() => PayGrade)
  @JoinColumn({ name: 'payGradeId' })
  payGrade: PayGrade;

  @Column({ type: 'uuid', nullable: true })
  payGradeId: string;

  @Column({ type: 'enum', enum: SalaryType })
  type: SalaryType;

  @Column({ type: 'enum', enum: SalaryStatus, default: SalaryStatus.ACTIVE })
  status: SalaryStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtimeRate: number; // Multiplier for overtime (e.g., 1.5 for time and a half)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weekendRate: number; // Multiplier for weekend work

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  nightShiftRate: number; // Multiplier for night shifts

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  holidayRate: number; // Multiplier for holiday work

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  annualBonus: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionRate: number; // Percentage of sales/revenue

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  phoneAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  uniformAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otherAllowances: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAllowances: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCompensation: number;

  @Column({ type: 'int', default: 0 })
  contractedHours: number; // Hours per week/month

  @Column({ type: 'int', default: 0 })
  probationPeriod: number; // Days

  @Column({ type: 'date', nullable: true })
  probationEndDate: Date;

  @Column({ type: 'boolean', default: false })
  isProbationary: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateTotalCompensation(): void {
    this.totalAllowances = this.carAllowance + this.phoneAllowance + this.uniformAllowance + this.otherAllowances;
    
    if (this.type === SalaryType.ANNUAL) {
      this.totalCompensation = this.baseAmount + this.totalAllowances + this.annualBonus;
    } else {
      // For hourly/daily/weekly/monthly, calculate annual equivalent
      const annualBase = this.getAnnualBaseAmount();
      this.totalCompensation = annualBase + this.totalAllowances + this.annualBonus;
    }
  }

  public getAnnualBaseAmount(): number {
    switch (this.type) {
      case SalaryType.ANNUAL:
        return this.baseAmount;
      case SalaryType.MONTHLY:
        return this.baseAmount * 12;
      case SalaryType.WEEKLY:
        return this.baseAmount * 52;
      case SalaryType.DAILY:
        return this.baseAmount * 260; // Assuming 5 days per week, 52 weeks per year
      case SalaryType.HOURLY:
        return this.baseAmount * this.contractedHours * 52;
      default:
        return this.baseAmount;
    }
  }

  public getHourlyRate(): number {
    if (this.type === SalaryType.HOURLY) {
      return this.baseAmount;
    }
    
    const annualBase = this.getAnnualBaseAmount();
    const annualHours = this.contractedHours * 52;
    return annualHours > 0 ? annualBase / annualHours : 0;
  }

  public getOvertimeRate(): number {
    return this.getHourlyRate() * this.overtimeRate;
  }

  public getWeekendRate(): number {
    return this.getHourlyRate() * this.weekendRate;
  }

  public getNightShiftRate(): number {
    return this.getHourlyRate() * this.nightShiftRate;
  }

  public getHolidayRate(): number {
    return this.getHourlyRate() * this.holidayRate;
  }

  public isActive(): boolean {
    return this.status === SalaryStatus.ACTIVE;
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

  public endSalary(endDate: Date, reason: string): void {
    this.status = SalaryStatus.TERMINATED;
    this.endDate = endDate;
    this.notes = this.notes ? `${this.notes}\nTerminated: ${reason}` : `Terminated: ${reason}`;
  }

  public suspendSalary(reason: string): void {
    this.status = SalaryStatus.SUSPENDED;
    this.notes = this.notes ? `${this.notes}\nSuspended: ${reason}` : `Suspended: ${reason}`;
  }

  public reactivateSalary(): void {
    this.status = SalaryStatus.ACTIVE;
    this.notes = this.notes ? `${this.notes}\nReactivated` : 'Reactivated';
  }

  public getSalarySummary(): {
    id: string;
    type: string;
    baseAmount: number;
    currency: string;
    totalCompensation: number;
    hourlyRate: number;
    status: string;
    effectiveDate: Date;
    endDate: Date | null;
    isActive: boolean;
    isProbationary: boolean;
  } {
    return {
      id: this.id,
      type: this.type,
      baseAmount: this.baseAmount,
      currency: this.currency,
      totalCompensation: this.totalCompensation,
      hourlyRate: this.getHourlyRate(),
      status: this.status,
      effectiveDate: this.effectiveDate,
      endDate: this.endDate,
      isActive: this.isActive(),
      isProbationary: this.isProbationary(),
    };
  }
}