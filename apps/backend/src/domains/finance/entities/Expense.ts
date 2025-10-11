import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StaffMember } from '../../staff/entities/StaffMember';

export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export enum ExpenseCategory {
  TRAVEL = 'travel',
  MEALS = 'meals',
  ACCOMMODATION = 'accommodation',
  SUPPLIES = 'supplies',
  EQUIPMENT = 'equipment',
  TRAINING = 'training',
  PROFESSIONAL_DEVELOPMENT = 'professional_development',
  COMMUNICATION = 'communication',
  MAINTENANCE = 'maintenance',
  UTILITIES = 'utilities',
  INSURANCE = 'insurance',
  LEGAL = 'legal',
  MARKETING = 'marketing',
  OTHER = 'other'
}

export enum ExpenseType {
  BUSINESS = 'business',
  PERSONAL = 'personal',
  MIXED = 'mixed'
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 50, unique: true })
  expenseNumber: string;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staffMemberId' })
  staffMember: StaffMember;

  @Column({ type: 'uuid' })
  staffMemberId: string;

  @Column({ type: 'var char', length: 200 })
  description: string;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category: ExpenseCategory;

  @Column({ type: 'enum', enum: ExpenseType, default: ExpenseType.BUSINESS })
  type: ExpenseType;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.DRAFT })
  status: ExpenseStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'var char', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ type: 'date' })
  submissionDate: Date;

  @Column({ type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ type: 'date', nullable: true })
  paymentDate: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  paidBy: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  receiptUrl: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  attachmentUrl: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  vendor: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  location: string;

  @Column({ type: 'boolean', default: false })
  isReimbursable: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reimbursedAmount: number;

  @Column({ type: 'var char', length: 50, nullable: true })
  projectCode: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  costCenter: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public generateExpenseNumber(): string {
    const year = this.expenseDate.getFullYear();
    const month = String(this.expenseDate.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `EXP${year}${month}${random}`;
  }

  public canBeSubmitted(): boolean {
    return this.status === ExpenseStatus.DRAFT;
  }

  public canBeApproved(): boolean {
    return this.status === ExpenseStatus.SUBMITTED;
  }

  public canBeRejected(): boolean {
    return this.status === ExpenseStatus.SUBMITTED;
  }

  public canBePaid(): boolean {
    return this.status === ExpenseStatus.APPROVED;
  }

  public canBeCancelled(): boolean {
    return this.status === ExpenseStatus.DRAFT || this.status === ExpenseStatus.SUBMITTED;
  }

  public submit(): void {
    if (!this.canBeSubmitted()) {
      throw new Error('Expense cannot be submitted in current status');
    }
    this.status = ExpenseStatus.SUBMITTED;
    this.submissionDate = new Date();
  }

  public approve(approvedBy: string): void {
    if (!this.canBeApproved()) {
      throw new Error('Expense cannot be approved in current status');
    }
    this.status = ExpenseStatus.APPROVED;
    this.approvalDate = new Date();
    this.approvedBy = approvedBy;
  }

  public reject(reason: string, rejectedBy: string): void {
    if (!this.canBeRejected()) {
      throw new Error('Expense cannot be rejected in current status');
    }
    this.status = ExpenseStatus.REJECTED;
    this.rejectionReason = reason;
    this.approvedBy = rejectedBy;
  }

  public pay(paidBy: string): void {
    if (!this.canBePaid()) {
      throw new Error('Expense cannot be paid in current status');
    }
    this.status = ExpenseStatus.PAID;
    this.paymentDate = new Date();
    this.paidBy = paidBy;
  }

  public cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error('Expense cannot be cancelled in current status');
    }
    this.status = ExpenseStatus.CANCELLED;
  }

  public isOverdue(): boolean {
    if (this.status === ExpenseStatus.PAID || this.status === ExpenseStatus.CANCELLED) {
      return false;
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.submissionDate < thirtyDaysAgo;
  }

  public getDaysPending(): number {
    if (this.status !== ExpenseStatus.SUBMITTED) return 0;
    
    const today = new Date();
    const diffTime = today.getTime() - this.submissionDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getExpenseSummary(): {
    id: string;
    expenseNumber: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    status: string;
    expenseDate: Date;
    submissionDate: Date;
    daysPending: number;
    isOverdue: boolean;
  } {
    return {
      id: this.id,
      expenseNumber: this.expenseNumber,
      description: this.description,
      category: this.category,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      expenseDate: this.expenseDate,
      submissionDate: this.submissionDate,
      daysPending: this.getDaysPending(),
      isOverdue: this.isOverdue(),
    };
  }
}
