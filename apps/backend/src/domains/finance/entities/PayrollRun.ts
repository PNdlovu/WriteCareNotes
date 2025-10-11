import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { StaffMember } from './StaffMember';
import { Payslip } from './Payslip';
import { HMRCSubmission } from './HMRCSubmission';

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PayrollFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

@Entity('payroll_runs')
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  runName: string;

  @Column({ type: 'varchar', length: 50 })
  payPeriod: string; // e.g., "2024-01" for January 2024

  @Column({ type: 'date' })
  payPeriodStart: Date;

  @Column({ type: 'date' })
  payPeriodEnd: Date;

  @Column({ type: 'date' })
  payDate: Date;

  @Column({ type: 'enum', enum: PayrollFrequency })
  frequency: PayrollFrequency;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalGrossPay: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalNationalInsurance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPension: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalNetPay: number;

  @Column({ type: 'int', default: 0 })
  employeeCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  processedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  // HMRC Submission
  @OneToMany(() => HMRCSubmission, submission => submission.payrollRun)
  hmrcSubmissions: HMRCSubmission[];

  // Payslips
  @OneToMany(() => Payslip, payslip => payslip.payrollRun)
  payslips: Payslip[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateTotals(): void {
    if (this.payslips && this.payslips.length > 0) {
      this.totalGrossPay = this.payslips.reduce((sum, payslip) => sum + payslip.grossPay, 0);
      this.totalTax = this.payslips.reduce((sum, payslip) => sum + payslip.tax, 0);
      this.totalNationalInsurance = this.payslips.reduce((sum, payslip) => sum + payslip.nationalInsurance, 0);
      this.totalPension = this.payslips.reduce((sum, payslip) => sum + payslip.pensionContribution, 0);
      this.totalNetPay = this.payslips.reduce((sum, payslip) => sum + payslip.netPay, 0);
      this.employeeCount = this.payslips.length;
    }
  }

  public isReadyForSubmission(): boolean {
    return this.status === PayrollStatus.COMPLETED && 
           this.payslips && 
           this.payslips.length > 0 &&
           this.totalGrossPay > 0;
  }

  public getHMRCSubmissionStatus(): string {
    if (!this.hmrcSubmissions || this.hmrcSubmissions.length === 0) {
      return 'not_submitted';
    }
    
    const latestSubmission = this.hmrcSubmissions[this.hmrcSubmissions.length - 1];
    return latestSubmission.status;
  }
}