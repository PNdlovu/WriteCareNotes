import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StaffMember } from '../../staff/entities/StaffMember';
import { Payslip } from './Payslip';

export enum TaxRecordType {
  INCOME_TAX = 'income_tax',
  NATIONAL_INSURANCE = 'national_insurance',
  PENSION_CONTRIBUTION = 'pension_contribution',
  STUDENT_LOAN = 'student_loan',
  APPRENTICESHIP_LEVY = 'apprenticeship_levy',
  VAT = 'vat',
  CORPORATION_TAX = 'corporation_tax',
  PAYE = 'paye'
}

export enum TaxRecordStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

@Entity('tax_records')
export class TaxRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staffMemberId' })
  staffMember: StaffMember;

  @Column({ type: 'uuid' })
  staffMemberId: string;

  @ManyToOne(() => Payslip, payslip => payslip.taxCalculations)
  @JoinColumn({ name: 'payslipId' })
  payslip: Payslip;

  @Column({ type: 'uuid', nullable: true })
  payslipId: string;

  @Column({ type: 'enum', enum: TaxRecordType })
  type: TaxRecordType;

  @Column({ type: 'enum', enum: TaxRecordStatus, default: TaxRecordStatus.PENDING })
  status: TaxRecordStatus;

  @Column({ type: 'varchar', length: 20 })
  taxYear: string; // e.g., "2024-25"

  @Column({ type: 'varchar', length: 10 })
  payPeriod: string; // e.g., "01" for January

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  grossEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxableEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxFreeAllowance: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number; // Percentage

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  employerContribution: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  employeeContribution: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalContribution: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdGrossEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdTaxableEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdTaxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ytdTotalContribution: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  taxCode: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nationalInsuranceNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hmrcReference: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  submissionReference: string;

  @Column({ type: 'date', nullable: true })
  submissionDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  paymentDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateTax(): void {
    switch (this.type) {
      case TaxRecordType.INCOME_TAX:
        this.calculateIncomeTax();
        break;
      case TaxRecordType.NATIONAL_INSURANCE:
        this.calculateNationalInsurance();
        break;
      case TaxRecordType.PENSION_CONTRIBUTION:
        this.calculatePensionContribution();
        break;
      case TaxRecordType.STUDENT_LOAN:
        this.calculateStudentLoan();
        break;
      case TaxRecordType.APPRENTICESHIP_LEVY:
        this.calculateApprenticeshipLevy();
        break;
    }
  }

  private calculateIncomeTax(): void {
    // Calculate taxable earnings after personal allowance
    this.taxableEarnings = Math.max(0, this.grossEarnings - this.taxFreeAllowance);
    
    // Apply tax rate
    this.taxAmount = this.taxableEarnings * (this.taxRate / 100);
  }

  private calculateNationalInsurance(): void {
    // National Insurance calculation (simplified)
    const weeklyEarnings = this.grossEarnings / 52;
    const lowerEarningsLimit = 123; // 2024-25 weekly limit
    const upperEarningsLimit = 967; // 2024-25 weekly limit
    
    if (weeklyEarnings > lowerEarningsLimit) {
      const taxableAmount = Math.min(weeklyEarnings - lowerEarningsLimit, upperEarningsLimit - lowerEarningsLimit);
      this.employeeContribution = taxableAmount * 0.12 * 52; // 12% employee rate
      this.employerContribution = taxableAmount * 0.138 * 52; // 13.8% employer rate
    }
    
    this.totalContribution = this.employeeContribution + this.employerContribution;
  }

  private calculatePensionContribution(): void {
    // Auto-enrollment pension calculation
    const employeeRate = 0.05; // 5% employee contribution
    const employerRate = 0.03; // 3% employer contribution
    
    this.employeeContribution = this.grossEarnings * employeeRate;
    this.employerContribution = this.grossEarnings * employerRate;
    this.totalContribution = this.employeeContribution + this.employerContribution;
  }

  private calculateStudentLoan(): void {
    // Student loan repayment calculation
    const threshold = 27295; // 2024-25 annual threshold
    if (this.grossEarnings > threshold) {
      this.employeeContribution = (this.grossEarnings - threshold) * 0.09; // 9% repayment rate
    }
    this.totalContribution = this.employeeContribution;
  }

  private calculateApprenticeshipLevy(): void {
    // Apprenticeship levy calculation
    const levyThreshold = 3000000; // £3M annual threshold
    if (this.grossEarnings > levyThreshold) {
      this.employerContribution = (this.grossEarnings - levyThreshold) * 0.005; // 0.5% levy rate
    }
    this.totalContribution = this.employerContribution;
  }

  public isOverdue(): boolean {
    if (this.status === TaxRecordStatus.PAID || !this.dueDate) return false;
    return new Date() > this.dueDate;
  }

  public canBeSubmitted(): boolean {
    return this.status === TaxRecordStatus.CALCULATED || this.status === TaxRecordStatus.REJECTED;
  }

  public canBePaid(): boolean {
    return this.status === TaxRecordStatus.ACCEPTED;
  }

  public markAsCalculated(): void {
    this.status = TaxRecordStatus.CALCULATED;
  }

  public markAsSubmitted(submissionReference: string): void {
    if (!this.canBeSubmitted()) {
      throw new Error('Tax record cannot be submitted in current status');
    }
    this.status = TaxRecordStatus.SUBMITTED;
    this.submissionReference = submissionReference;
    this.submissionDate = new Date();
  }

  public markAsAccepted(hmrcReference: string): void {
    this.status = TaxRecordStatus.ACCEPTED;
    this.hmrcReference = hmrcReference;
  }

  public markAsRejected(errorMessage: string): void {
    this.status = TaxRecordStatus.REJECTED;
    this.errorMessage = errorMessage;
  }

  public markAsPaid(): void {
    if (!this.canBePaid()) {
      throw new Error('Tax record cannot be paid in current status');
    }
    this.status = TaxRecordStatus.PAID;
    this.paymentDate = new Date();
  }

  public getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate!.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getTaxRecordSummary(): {
    id: string;
    type: string;
    taxYear: string;
    payPeriod: string;
    grossEarnings: number;
    taxAmount: number;
    totalContribution: number;
    status: string;
    periodStart: Date;
    periodEnd: Date;
    isOverdue: boolean;
    daysOverdue: number;
  } {
    return {
      id: this.id,
      type: this.type,
      taxYear: this.taxYear,
      payPeriod: this.payPeriod,
      grossEarnings: this.grossEarnings,
      taxAmount: this.taxAmount,
      totalContribution: this.totalContribution,
      status: this.status,
      periodStart: this.periodStart,
      periodEnd: this.periodEnd,
      isOverdue: this.isOverdue(),
      daysOverdue: this.getDaysOverdue(),
    };
  }
}