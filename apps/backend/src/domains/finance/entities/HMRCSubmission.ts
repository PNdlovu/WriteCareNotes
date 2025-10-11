import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PayrollRun } from './PayrollRun';

export enum HMRCSubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PROCESSING = 'processing'
}

export enum HMRCSubmissionType {
  FPS = 'fps', // Full Payment Submission
  EPS = 'eps', // Employer Payment Summary
  EYU = 'eyu'  // Earlier Year Update
}

@Entity('hmrc_submissions')
export class HMRCSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PayrollRun, payrollRun => payrollRun.hmrcSubmissions)
  @JoinColumn({ name: 'payrollRunId' })
  payrollRun: PayrollRun;

  @Column({ type: 'uuid' })
  payrollRunId: string;

  @Column({ type: 'varchar', length: 50 })
  submissionId: string; // HMRC submission reference

  @Column({ type: 'enum', enum: HMRCSubmissionType })
  submissionType: HMRCSubmissionType;

  @Column({ type: 'enum', enum: HMRCSubmissionStatus, default: HMRCSubmissionStatus.DRAFT })
  status: HMRCSubmissionStatus;

  @Column({ type: 'varchar', length: 20 })
  taxYear: string; // e.g., "2024-25"

  @Column({ type: 'varchar', length: 10 })
  payPeriod: string; // e.g., "01" for January

  @Column({ type: 'date' })
  submissionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  submittedBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  processedBy: string;

  // Submission Data
  @Column({ type: 'int' })
  employeeCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalGrossPay: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalTax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalNationalInsurance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPension: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalStudentLoan: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalApprenticeshipLevy: number;

  // HMRC Response
  @Column({ type: 'varchar', length: 100, nullable: true })
  hmrcReference: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  correlationId: string;

  @Column({ type: 'text', nullable: true })
  hmrcResponse: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public generateSubmissionId(): string {
    const year = this.taxYear.split('-')[0];
    const month = this.payPeriod.padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `HMRC${year}${month}${random}`;
  }

  public isReadyForSubmission(): boolean {
    return this.status === HMRCSubmissionStatus.DRAFT &&
           this.employeeCount > 0 &&
           this.totalGrossPay > 0 &&
           this.submissionDate <= new Date();
  }

  public canRetry(): boolean {
    return this.status === HMRCSubmissionStatus.REJECTED &&
           this.retryCount < 3 &&
           (!this.nextRetryAt || this.nextRetryAt <= new Date());
  }

  public markAsSubmitted(submittedBy: string): void {
    this.status = HMRCSubmissionStatus.SUBMITTED;
    this.submittedBy = submittedBy;
    this.submittedAt = new Date();
  }

  public markAsAccepted(hmrcReference: string, correlationId: string): void {
    this.status = HMRCSubmissionStatus.ACCEPTED;
    this.hmrcReference = hmrcReference;
    this.correlationId = correlationId;
    this.processedAt = new Date();
  }

  public markAsRejected(errorMessage: string): void {
    this.status = HMRCSubmissionStatus.REJECTED;
    this.errorMessage = errorMessage;
    this.retryCount += 1;
    this.nextRetryAt = new Date(Date.now() + (this.retryCount * 60 * 60 * 1000)); // Exponential backoff
  }

  public getSubmissionData(): any {
    return {
      submissionId: this.submissionId,
      submissionType: this.submissionType,
      taxYear: this.taxYear,
      payPeriod: this.payPeriod,
      submissionDate: this.submissionDate,
      employeeCount: this.employeeCount,
      totalGrossPay: this.totalGrossPay,
      totalTax: this.totalTax,
      totalNationalInsurance: this.totalNationalInsurance,
      totalPension: this.totalPension,
      totalStudentLoan: this.totalStudentLoan,
      totalApprenticeshipLevy: this.totalApprenticeshipLevy,
    };
  }
}