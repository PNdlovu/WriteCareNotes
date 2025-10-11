import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PayrollRun } from './PayrollRun';
import { StaffMember } from './StaffMember';
import { TaxCalculation } from './TaxCalculation';
import { NationalInsurance } from './NationalInsurance';
import { PensionContribution } from './PensionContribution';

export enum PayslipStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  SENT = 'sent',
  VIEWED = 'viewed',
  DISPUTED = 'disputed'
}

@Entity('payslips')
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 50 })
  payslipNumber: string;

  @ManyToOne(() => PayrollRun, payrollRun => payrollRun.payslips)
  @JoinColumn({ name: 'payrollRunId' })
  payrollRun: PayrollRun;

  @Column({ type: 'uuid' })
  payrollRunId: string;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staffMemberId' })
  staffMember: StaffMember;

  @Column({ type: 'uuid' })
  staffMemberId: string;

  @Column({ type: 'var char', length: 100 })
  employeeName: string;

  @Column({ type: 'var char', length: 20 })
  employeeNumber: string;

  @Column({ type: 'var char', length: 20 })
  nationalInsuranceNumber: string;

  @Column({ type: 'var char', length: 20 })
  taxCode: string;

  @Column({ type: 'date' })
  payPeriodStart: Date;

  @Column({ type: 'date' })
  payPeriodEnd: Date;

  @Column({ type: 'date' })
  payDate: Date;

  // Basic Pay
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basicPay: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtimePay: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bonus: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commission: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  grossPay: number;

  // Deductions
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  nationalInsurance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pensionContribution: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  studentLoan: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otherDeductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netPay: number;

  // YTD Totals
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdGrossPay: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdNationalInsurance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdPension: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdNetPay: number;

  @Column({ type: 'enum', enum: PayslipStatus, default: PayslipStatus.DRAFT })
  status: PayslipStatus;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Tax Calculations
  @OneToMany(() => TaxCalculation, taxCalc => taxCalc.payslip)
  taxCalculations: TaxCalculation[];

  // National Insurance
  @OneToMany(() => NationalInsurance, ni => ni.payslip)
  nationalInsuranceCalculations: NationalInsurance[];

  // Pension Contributions
  @OneToMany(() => PensionContribution, pension => pension.payslip)
  pensionContributions: PensionContribution[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateGrossPay(): void {
    this.grossPay = this.basicPay + this.overtimePay + this.bonus + this.commission + this.allowances;
  }

  public calculateTotalDeductions(): void {
    this.totalDeductions = this.tax + this.nationalInsurance + this.pensionContribution + 
                          this.studentLoan + this.otherDeductions;
  }

  public calculateNetPay(): void {
    this.netPay = this.grossPay - this.totalDeductions;
  }

  public calculateAll(): void {
    this.calculateGrossPay();
    this.calculateTotalDeductions();
    this.calculateNetPay();
  }

  public isReadyForSubmission(): boolean {
    return this.grossPay > 0 && this.tax >= 0 && this.nationalInsurance >= 0;
  }

  public generatePayslipNumber(): string {
    const year = this.payDate.getFullYear();
    const month = String(this.payDate.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `PS${year}${month}${random}`;
  }
}
