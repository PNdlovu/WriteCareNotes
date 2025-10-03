import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Employee } from '../hr/Employee';

export enum PayrollStatus {
  DRAFT = 'draft',
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  PAID = 'paid',
  DISPUTED = 'disputed'
}

export enum PayrollFrequency {
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly'
}

export interface PayrollEarnings {
  basicPay: number;
  overtimePay: number;
  holidayPay: number;
  sickPay: number;
  bonuses: number;
  allowances: number;
  grossPay: number;
}

export interface PayrollDeductions {
  incomeTax: number;
  nationalInsurance: number;
  pensionContribution: number;
  studentLoan: number;
  courtOrders: number;
  other: number;
  totalDeductions: number;
}

export interface PayrollHours {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  holidayHours: number;
  sickHours: number;
  totalHours: number;
}

export interface TaxCodes {
  incomeTaxCode: string;
  nationalInsuranceCategory: string;
  pensionScheme?: string;
  studentLoanPlan?: string;
}

export interface PayrollAdjustments {
  description: string;
  amount: number;
  type: 'addition' | 'deduction';
  reason: string;
  authorizedBy: string;
  authorizedAt: Date;
}

@Entity('payroll_records')
export class PayrollRecord extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ unique: true })
  payrollNumber: string;

  @Column({
    type: 'enum',
    enum: PayrollFrequency
  })
  frequency: PayrollFrequency;

  @Column('date')
  payPeriodStart: Date;

  @Column('date')
  payPeriodEnd: Date;

  @Column('date')
  payDate: Date;

  @Column({
    type: 'enum',
    enum: PayrollStatus,
    default: PayrollStatus.DRAFT
  })
  status: PayrollStatus;

  @Column('jsonb')
  hours: PayrollHours;

  @Column('jsonb')
  earnings: PayrollEarnings;

  @Column('jsonb')
  deductions: PayrollDeductions;

  @Column('decimal', { precision: 10, scale: 2 })
  netPay: number;

  @Column('jsonb')
  taxCodes: TaxCodes;

  @Column('jsonb', { nullable: true })
  adjustments?: PayrollAdjustments[];

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ nullable: true })
  calculatedBy?: string;

  @Column('timestamp', { nullable: true })
  calculatedAt?: Date;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column('timestamp', { nullable: true })
  approvedAt?: Date;

  @Column({ nullable: true })
  paidBy?: string;

  @Column('timestamp', { nullable: true })
  paidAt?: Date;

  @Column('text', { nullable: true })
  paymentMethod?: string;

  @Column('text', { nullable: true })
  paymentReference?: string;

  @Column({ default: false })
  isDisputed: boolean;

  @Column('text', { nullable: true })
  disputeReason?: string;

  @Column('timestamp', { nullable: true })
  disputeDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business Methods
  isPaid(): boolean {
    return this.status === PayrollStatus.PAID;
  }

  isOverdue(): boolean {
    return new Date() > this.payDate && !this.isPaid();
  }

  getTotalEarnings(): number {
    return this.earnings.grossPay;
  }

  getTotalDeductions(): number {
    return this.deductions.totalDeductions;
  }

  getNetPay(): number {
    return this.netPay;
  }

  getOvertimePercentage(): number {
    if (this.hours.totalHours === 0) return 0;
    return (this.hours.overtimeHours / this.hours.totalHours) * 100;
  }

  getEffectiveHourlyRate(): number {
    if (this.hours.totalHours === 0) return 0;
    return this.earnings.grossPay / this.hours.totalHours;
  }

  hasAdjustments(): boolean {
    return this.adjustments && this.adjustments.length > 0;
  }

  getTotalAdjustments(): { additions: number; deductions: number } {
    if (!this.adjustments) return { additions: 0, deductions: 0 };
    
    return this.adjustments.reduce(
      (acc, adj) => {
        if (adj.type === 'addition') {
          acc.additions += adj.amount;
        } else {
          acc.deductions += adj.amount;
        }
        return acc;
      },
      { additions: 0, deductions: 0 }
    );
  }

  getPayPeriodDays(): number {
    const timeDiff = this.payPeriodEnd.getTime() - this.payPeriodStart.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
  }

  calculateTakeHomePercentage(): number {
    if (this.earnings.grossPay === 0) return 0;
    return (this.netPay / this.earnings.grossPay) * 100;
  }

  generatePayslipData() {
    return {
      payrollNumber: this.payrollNumber,
      employee: this.employee?.getFullName(),
      payPeriod: `${this.payPeriodStart.toLocaleDateString()} - ${this.payPeriodEnd.toLocaleDateString()}`,
      payDate: this.payDate.toLocaleDateString(),
      hours: this.hours,
      earnings: this.earnings,
      deductions: this.deductions,
      netPay: this.netPay,
      taxCodes: this.taxCodes,
      adjustments: this.adjustments,
      status: this.status
    };
  }
}