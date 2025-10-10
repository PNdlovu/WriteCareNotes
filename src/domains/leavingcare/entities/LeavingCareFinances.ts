/**
 * Leaving Care Finances Entity
 * 
 * TRACKS FINANCIAL SUPPORT FOR 16+ CARE LEAVERS
 * 
 * COMPLIANCE:
 * - Children (Leaving Care) Act 2000
 * - Care Leavers (England) Regulations 2010
 * - Wales: Social Services and Well-being (Wales) Act 2014
 * - Scotland: Children and Young People (Scotland) Act 2014
 * - Northern Ireland: Children (Leaving Care) Act (NI) 2002
 * 
 * GRANTS & ALLOWANCES:
 * - Setting Up Home Grant (£2,000-£3,000)
 * - Education/Training Bursary
 * - Driving Lessons Grant
 * - Birthday/Christmas allowance
 * - Monthly living allowance
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Child } from '../../children/entities/Child';

@Entity('leaving_care_finances')
export class LeavingCareFinances {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  childId!: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child!: Child;

  // ==================== GRANTS ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  settingUpHomeGrant!: number; // £2,000-£3,000

  @Column({ type: 'timestamptz', nullable: true })
  settingUpHomeGrantDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  educationGrant!: number;

  @Column({ type: 'timestamptz', nullable: true })
  educationGrantDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  drivingLessonsGrant!: number;

  @Column({ type: 'timestamptz', nullable: true })
  drivingLessonsGrantDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  birthdayAllowance!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  christmasAllowance!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalGrantsReceived!: number;

  // ==================== MONTHLY ALLOWANCE ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyAllowance!: number;

  @Column({ type: 'varchar', length: 50, default: 'monthly' })
  allowanceFrequency!: string; // monthly, fortnightly, weekly

  @Column({ type: 'timestamptz', nullable: true })
  lastPaymentDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextPaymentDate?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentMethod?: string; // bank_transfer, prepaid_card, cash

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccountNumber?: string; // Encrypted

  @Column({ type: 'varchar', length: 20, nullable: true })
  bankSortCode?: string;

  // ==================== SAVINGS ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  savingsBalance!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  savingsInterestRate!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  savingsAccountProvider?: string;

  // ==================== BUDGETING ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedMonthlyExpenses!: number;

  @Column({ type: 'jsonb', nullable: true })
  budgetBreakdown?: {
    rent: number;
    utilities: number;
    food: number;
    transport: number;
    phone: number;
    clothing: number;
    entertainment: number;
    other: number;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlySurplus!: number; // Income - Expenses

  // ==================== DEBTS & LIABILITIES ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDebts!: number;

  @Column({ type: 'jsonb', nullable: true })
  debts?: Array<{
    creditor: string;
    amount: number;
    type: string; // credit_card, loan, overdraft
    monthlyRepayment: number;
  }>;

  // ==================== EMPLOYMENT INCOME ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  employmentIncome!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employer?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employmentStatus?: string; // employed, unemployed, student, apprentice

  // ==================== BENEFITS ====================

  @Column({ type: 'jsonb', nullable: true })
  benefits?: Array<{
    type: string; // universal_credit, housing_benefit, JSA, etc.
    amount: number;
    frequency: string;
    startDate: Date;
  }>;

  // ==================== FINANCIAL LITERACY ====================

  @Column({ type: 'boolean', default: false })
  hasBankAccount!: boolean;

  @Column({ type: 'boolean', default: false })
  hasBudgetPlan!: boolean;

  @Column({ type: 'boolean', default: false })
  attendedFinancialLiteracyTraining!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  financialLiteracyTrainingDate?: Date;

  // ==================== AUDIT ====================

  @Column({ type: 'varchar', length: 100 })
  currency!: string; // GBP, EUR

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  managedBy?: string; // Personal advisor managing finances

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // ==================== METHODS ====================

  /**
   * Calculate total monthly income
   */
  get totalMonthlyIncome(): number {
    const benefitsTotal = this.benefits?.reduce((sum, b) => sum + b.amount, 0) || 0;
    return this.monthlyAllowance + this.employmentIncome + benefitsTotal;
  }

  /**
   * Calculate financial health score (0-100)
   */
  get financialHealthScore(): number {
    let score = 0;

    // Has bank account (+20)
    if (this.hasBankAccount) score += 20;

    // Has budget plan (+20)
    if (this.hasBudgetPlan) score += 20;

    // Positive surplus (+20)
    if (this.monthlySurplus > 0) score += 20;

    // Has savings (+20)
    if (this.savingsBalance > 0) score += 20;

    // No debts (+20)
    if (this.totalDebts === 0) score += 20;

    return score;
  }

  /**
   * Check if eligible for additional support
   */
  get needsFinancialSupport(): boolean {
    return (
      this.monthlySurplus < 0 || // Deficit
      this.totalDebts > 500 || // High debt
      !this.hasBankAccount || // No bank account
      !this.hasBudgetPlan // No budget
    );
  }
}
