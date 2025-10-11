import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Child } from './Child';
import { Invoice } from '../../finance/entities/Invoice';

/**
 * British Isles jurisdictions for children's residential care billing
 * Each has different regulations and funding arrangements
 */
export enum BritishIslesJurisdiction {
  ENGLAND = 'ENGLAND', // Care Planning Regulations 2010
  SCOTLAND = 'SCOTLAND', // Looked After Children (Scotland) Act 2009
  WALES = 'WALES', // Social Services and Well-being (Wales) Act 2014
  NORTHERN_IRELAND = 'NORTHERN_IRELAND', // Children (NI) Order 1995
  IRELAND = 'IRELAND', // Child Care Act 1991
  JERSEY = 'JERSEY', // Children (Jersey) Law 2002
  GUERNSEY = 'GUERNSEY', // Children (Guernsey and Alderney) Law 2008
  ISLE_OF_MAN = 'ISLE_OF_MAN', // Children and Young Persons Act 2001
}

/**
 * Funding source types for children in residential care
 */
export enum ChildFundingSource {
  LOCAL_AUTHORITY = 'LOCAL_AUTHORITY', // Most common - LA pays full cost
  HEALTH_AUTHORITY = 'HEALTH_AUTHORITY', // NHS for complex health needs
  JOINTLY_FUNDED = 'JOINTLY_FUNDED', // LA + Health split costs
  PARENTAL_CONTRIBUTION = 'PARENTAL_CONTRIBUTION', // Parents contribute (rare)
  CONTINUING_CARE = 'CONTINUING_CARE', // NHS Continuing Care package
  EDUCATION_AUTHORITY = 'EDUCATION_AUTHORITY', // For educational placements
  YOUTH_JUSTICE = 'YOUTH_JUSTICE', // Youth Justice Board funding
  ASYLUM_HOME_OFFICE = 'ASYLUM_HOME_OFFICE', // Home Office for UASC
  OTHER = 'OTHER',
}

/**
 * Billing frequency for children's placements
 */
export enum BillingFrequency {
  WEEKLY = 'WEEKLY', // £1,000-2,000 per week typical
  FORTNIGHTLY = 'FORTNIGHTLY',
  MONTHLY = 'MONTHLY', // Most common for LA invoicing
  QUARTERLY = 'QUARTERLY', // For some grants/allowances
  ANNUAL = 'ANNUAL', // For annual clothing grants
  SESSIONAL = 'SESSIONAL', // For respite care
  DAILY = 'DAILY', // For emergency placements
}

/**
 * Service charge breakdown for children's placements
 */
export interface ChildServiceCharge {
  description: string; // e.g., "Core placement fee", "Therapy sessions", "Education transport"
  amount: number; // Amount in GBP
  frequency: BillingFrequency;
  category: 'PLACEMENT' | 'EDUCATION' | 'THERAPY' | 'ACTIVITIES' | 'TRANSPORT' | 'MEDICAL' | 'OTHER';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  requiresApproval: boolean; // Some charges need LA approval
  approvedBy?: string; // Social worker/commissioning officer
  approvalDate?: Date;
  notes?: string;
}

/**
 * Funding source allocation (when multiple funders)
 */
export interface FundingAllocation {
  source: ChildFundingSource;
  organizationName: string; // e.g., "Manchester City Council", "NHS Greater Manchester"
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  allocationPercentage: number; // 0-100
  weeklyAmount: number; // Calculated weekly contribution
  purchaseOrderNumber?: string;
  contractStartDate: Date;
  contractEndDate?: Date;
  paymentTerms: number; // Days (e.g., 30 days)
  isActive: boolean;
  notes?: string;
}

/**
 * Personal allowances breakdown for the child
 */
export interface PersonalAllowances {
  weeklyPocketMoney: number; // Age-based: £5-15 typical
  clothingAllowanceQuarterly: number; // £200-300 typical
  birthdayGrant: number; // £50-100 typical
  festivalGrants: number; // Christmas, Eid, etc.
  savingsContribution: number; // Monthly into savings account
  educationAllowance: number; // School trips, equipment
  totalMonthly: number; // Auto-calculated
}

/**
 * Payment tracking for a specific invoice period
 */
export interface PaymentRecord {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentDate?: Date;
  paymentReference?: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'DISPUTED' | 'WRITTEN_OFF';
  disputeReason?: string;
  disputeRaisedDate?: Date;
  disputeResolvedDate?: Date;
}

/**
 * ChildBilling entity - manages all financial aspects of a child's placement
 * in residential care across all British Isles jurisdictions
 * 
 * This is SEPARATE from ResidentBilling (which is for elderly/adults)
 * Children's billing has uniquerequirements:
 * - Local authority funding (not self-funded)
 * - Personal allowances tracked separately
 * - Different regulations per jurisdiction
 * - Transition to LeavingCareFinances at 16+
 */
@Entity('child_billing')
export class ChildBilling {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Child reference
  @Column({ type: 'uuid' })
  childId: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'childId' })
  child: Child;

  // Jurisdiction-specific compliance
  @Column({ 
    type: 'enum', 
    enum: BritishIslesJurisdiction,
    default: BritishIslesJurisdiction.ENGLAND 
  })
  jurisdiction: BritishIslesJurisdiction;

  // Primary funding details
  @Column({ 
    type: 'enum', 
    enum: ChildFundingSource,
    default: ChildFundingSource.LOCAL_AUTHORITY 
  })
  primaryFundingSource: ChildFundingSource;

  @Column({ type: 'var char', length: 200 })
  primaryFunderName: string; // e.g., "Birmingham City Council"

  @Column({ type: 'var char', length: 100, nullable: true })
  localAuthorityCode: string; // e.g., "E08000025" for Birmingham

  // Placement costs
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyRate: number; // £150-300 typical for residential care

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weeklyRate: number; // Daily rate × 7

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyRate: number; // Weekly rate × 4.33

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  annualRate: number; // Weekly rate × 52

  // Service charges breakdown
  @Column({ type: 'json' })
  serviceCharges: ChildServiceCharge[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalWeeklyServiceCharges: number; // Auto-calculated

  // Funding allocations (for jointly funded placements)
  @Column({ type: 'json' })
  fundingAllocations: FundingAllocation[];

  // Personal allowances
  @Column({ type: 'json' })
  personalAllowances: PersonalAllowances;

  // Billing configuration
  @Column({ 
    type: 'enum', 
    enum: BillingFrequency,
    default: BillingFrequency.MONTHLY 
  })
  billingFrequency: BillingFrequency;

  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number; // Days until payment due

  @Column({ type: 'boolean', default: true })
  isRecurring: boolean;

  @Column({ type: 'date', nullable: true })
  nextInvoiceDate: Date;

  @Column({ type: 'date', nullable: true })
  lastInvoiceDate: Date;

  // Financial tracking
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalInvoiced: number; // Lifetime total invoiced

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPaid: number; // Lifetime total paid

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentArrears: number; // Outstanding amount

  @Column({ type: 'json', default: '[]' })
  paymentHistory: PaymentRecord[];

  // Contract details
  @Column({ type: 'date' })
  placementStartDate: Date;

  @Column({ type: 'date', nullable: true })
  placementEndDate: Date; // Null = ongoing

  @Column({ type: 'var char', length: 100, nullable: true })
  purchaseOrderNumber: string; // LA purchase order

  @Column({ type: 'var char', length: 100, nullable: true })
  contractReference: string;

  // Contact details
  @Column({ type: 'var char', length: 200 })
  socialWorkerName: string;

  @Column({ type: 'var char', length: 100 })
  socialWorkerEmail: string;

  @Column({ type: 'var char', length: 20 })
  socialWorkerPhone: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  commissioningOfficerName: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  commissioningOfficerEmail: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  commissioningOfficerPhone: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  financeContactName: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  financeContactEmail: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  financeContactPhone: string;

  // Invoicing address
  @Column({ type: 'var char', length: 300 })
  invoiceAddress: string;

  @Column({ type: 'var char', length: 20 })
  invoicePostcode: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  invoiceEmail: string; // For electronic invoicing

  @Column({ type: 'var char', length: 100, nullable: true })
  invoicePortalUrl: string; // Some LAs use supplier portals

  // Status
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  hasDispute: boolean;

  @Column({ type: 'text', nullable: true })
  disputeDetails: string;

  @Column({ type: 'date', nullable: true })
  disputeRaisedDate: Date;

  // Transition tracking (to leaving care finances at 16+)
  @Column({ type: 'boolean', default: false })
  transitionedToLeavingCare: boolean;

  @Column({ type: 'uuid', nullable: true })
  leavingCareFinanceId: string; // Link to LeavingCareFinances when child turns 16+

  @Column({ type: 'date', nullable: true })
  transitionDate: Date;

  // Notes and compliance
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', default: '[]' })
  complianceChecks: {
    checkType: string;
    checkDate: Date;
    performedBy: string;
    status: 'PASSED' | 'FAILED' | 'REVIEW_REQUIRED';
    findings: string;
  }[];

  // Audit fields
  @Column({ type: 'var char', length: 100 })
  createdBy: string;

  @Column({ type: 'var char', length: 100 })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Invoice, invoice => invoice.childBilling)
  invoices: Invoice[];

  // ============================================
  // BUSINESS LOGIC METHODS
  // ============================================

  /**
   * Calculate weekly rate from daily rate
   */
  public calculateWeeklyRate(): void {
    this.weeklyRate = this.dailyRate * 7;
  }

  /**
   * Calculate monthly rate from weekly rate
   */
  public calculateMonthlyRate(): void {
    this.monthlyRate = this.weeklyRate * 4.33; // Average weeks per month
  }

  /**
   * Calculate annual rate from weekly rate
   */
  public calculateAnnualRate(): void {
    this.annualRate = this.weeklyRate * 52;
  }

  /**
   * Calculate all rates from daily rate
   */
  public calculateAllRates(): void {
    this.calculateWeeklyRate();
    this.calculateMonthlyRate();
    this.calculateAnnualRate();
  }

  /**
   * Calculate total weekly service charges
   */
  public calculateTotalWeeklyServiceCharges(): void {
    this.totalWeeklyServiceCharges = this.serviceCharges
      .filter(charge => charge.isActive)
      .reduce((total, charge) => {
        let weeklyAmount = charge.amount;
        
        // Convert to weekly amount based on frequency
        switch (charge.frequency) {
          case BillingFrequency.DAILY:
            weeklyAmount = charge.amount * 7;
            break;
          case BillingFrequency.WEEKLY:
            weeklyAmount = charge.amount;
            break;
          case BillingFrequency.FORTNIGHTLY:
            weeklyAmount = charge.amount / 2;
            break;
          case BillingFrequency.MONTHLY:
            weeklyAmount = charge.amount / 4.33;
            break;
          case BillingFrequency.QUARTERLY:
            weeklyAmount = charge.amount / 13;
            break;
          case BillingFrequency.ANNUAL:
            weeklyAmount = charge.amount / 52;
            break;
          case BillingFrequency.SESSIONAL:
            weeklyAmount = 0; // Ad-hoc, not recurring
            break;
        }
        
        return total + weeklyAmount;
      }, 0);
  }

  /**
   * Calculate total personal allowances per month
   */
  public calculateTotalPersonalAllowances(): void {
    if (this.personalAllowances) {
      this.personalAllowances.totalMonthly = 
        (this.personalAllowances.weeklyPocketMoney * 4.33) +
        (this.personalAllowances.clothingAllowanceQuarterly / 3) +
        (this.personalAllowances.birthdayGrant / 12) +
        (this.personalAllowances.festivalGrants / 12) +
        this.personalAllowances.savingsContribution +
        (this.personalAllowances.educationAllowance);
    }
  }

  /**
   * Get total weekly cost (placement + services)
   */
  public getTotalWeeklyCost(): number {
    return this.weeklyRate + this.totalWeeklyServiceCharges;
  }

  /**
   * Get total monthly cost (placement + services)
   */
  public getTotalMonthlyCost(): number {
    return this.monthlyRate + (this.totalWeeklyServiceCharges * 4.33);
  }

  /**
   * Add a service charge
   */
  public addServiceCharge(charge: ChildServiceCharge): void {
    this.serviceCharges.push(charge);
    this.calculateTotalWeeklyServiceCharges();
  }

  /**
   * Remove a service charge
   */
  public removeServiceCharge(description: string): void {
    this.serviceCharges = this.serviceCharges.filter(
      charge => charge.description !== description
    );
    this.calculateTotalWeeklyServiceCharges();
  }

  /**
   * Update a service charge
   */
  public updateServiceCharge(description: string, updatedCharge: Partial<ChildServiceCharge>): void {
    const index = this.serviceCharges.findIndex(
      charge => charge.description === description
    );
    if (index !== -1) {
      this.serviceCharges[index] = {
        ...this.serviceCharges[index],
        ...updatedCharge
      };
      this.calculateTotalWeeklyServiceCharges();
    }
  }

  /**
   * Get active service charges
   */
  public getActiveServiceCharges(): ChildServiceCharge[] {
    return this.serviceCharges.filter(charge => charge.isActive);
  }

  /**
   * Add funding allocation
   */
  public addFundingAllocation(allocation: FundingAllocation): void {
    // Validate total allocation doesn't exceed 100%
    const totalAllocation = this.fundingAllocations.reduce(
      (sum, a) => sum + a.allocationPercentage, 
      0
    ) + allocation.allocationPercentage;

    if (totalAllocation > 100) {
      throw new Error('Total funding allocation cannot exceed 100%');
    }

    // Calculate weekly amount
    allocation.weeklyAmount = this.weeklyRate * (allocation.allocationPercentage / 100);
    
    this.fundingAllocations.push(allocation);
  }

  /**
   * Calculate current arrears
   */
  public calculateCurrentArrears(): void {
    this.currentArrears = this.totalInvoiced - this.totalPaid;
  }

  /**
   * Record a payment
   */
  public recordPayment(
    invoiceId: string,
    invoiceNumber: string,
    amount: number,
    paymentDate: Date,
    paymentReference: string
  ): void {
    // Find payment record
    const paymentRecord = this.paymentHistory.find(p => p.invoiceId === invoiceId);
    
    if (paymentRecord) {
      paymentRecord.paidAmount += amount;
      paymentRecord.balanceAmount = paymentRecord.amount - paymentRecord.paidAmount;
      paymentRecord.paymentDate = paymentDate;
      paymentRecord.paymentReference = paymentReference;
      
      if (paymentRecord.balanceAmount <= 0) {
        paymentRecord.status = 'PAID';
      }
    }

    // Update totals
    this.totalPaid += amount;
    this.calculateCurrentArrears();
  }

  /**
   * Add invoice to payment history
   */
  public addInvoiceToHistory(
    invoiceId: string,
    invoiceNumber: string,
    invoiceDate: Date,
    amount: number,
    dueDate: Date
  ): void {
    this.paymentHistory.push({
      invoiceId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount,
      paidAmount: 0,
      balanceAmount: amount,
      status: 'SENT',
    });

    this.totalInvoiced += amount;
    this.lastInvoiceDate = invoiceDate;
    this.calculateCurrentArrears();
  }

  /**
   * Check if invoice is due
   */
  public isInvoiceDue(): boolean {
    if (!this.isRecurring || !this.nextInvoiceDate) return false;
    return new Date() >= this.nextInvoiceDate;
  }

  /**
   * Set next invoice date based on frequency
   */
  public setNextInvoiceDate(): void {
    if (!this.isRecurring) return;

    const lastDate = this.lastInvoiceDate || new Date();
    const nextDate = new Date(lastDate);

    switch (this.billingFrequency) {
      case BillingFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case BillingFrequency.FORTNIGHTLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case BillingFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case BillingFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case BillingFrequency.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    this.nextInvoiceDate = nextDate;
  }

  /**
   * Get days until next invoice
   */
  public getDaysUntilNextInvoice(): number {
    if (!this.nextInvoiceDate) return 0;
    
    const today = new Date();
    const diffTime = this.nextInvoiceDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get overdue invoices
   */
  public getOverdueInvoices(): PaymentRecord[] {
    const today = new Date();
    return this.paymentHistory.filter(
      payment => 
        payment.dueDate < today && 
        payment.status !== 'PAID' && 
        payment.balanceAmount > 0
    );
  }

  /**
   * Get payment rate percentage
   */
  public getPaymentRate(): number {
    if (this.totalInvoiced === 0) return 100;
    return (this.totalPaid / this.totalInvoiced) * 100;
  }

  /**
   * Raise dispute
   */
  public raiseDispute(details: string): void {
    this.hasDispute = true;
    this.disputeDetails = details;
    this.disputeRaisedDate = new Date();
  }

  /**
   * Resolve dispute
   */
  public resolveDispute(): void {
    this.hasDispute = false;
    this.disputeDetails = `Resolved on ${new Date().toISOString()}\n\n${this.disputeDetails}`;
  }

  /**
   * Get jurisdiction-specific requirements
   */
  public getJurisdictionRequirements(): {
    jurisdiction: BritishIslesJurisdiction;
    regulation: string;
    reviewFrequency: string;
    reportingRequirements: string[];
  } {
    const requirements = {
      [BritishIslesJurisdiction.ENGLAND]: {
        jurisdiction: BritishIslesJurisdiction.ENGLAND,
        regulation: 'Care Planning, Placement and Case Review (England) Regulations 2010',
        reviewFrequency: '28 days, then 3 months, then 6 monthly',
        reportingRequirements: [
          'LAC review documentation',
          'Personal education plan (PEP)',
          'Health assessment',
          'Pathway plan (16+)',
          'Financial records for IRO',
        ],
      },
      [BritishIslesJurisdiction.SCOTLAND]: {
        jurisdiction: BritishIslesJurisdiction.SCOTLAND,
        regulation: 'Looked After Children (Scotland) Regulations 2009',
        reviewFrequency: '15 working days, then 3 months, then 6 monthly',
        reportingRequirements: [
          'LAC review minutes',
          'Child's plan',
          'Health plan',
          'Continuing care plan (16+)',
          'Financial audit trail',
        ],
      },
      [BritishIslesJurisdiction.WALES]: {
        jurisdiction: BritishIslesJurisdiction.WALES,
        regulation: 'Care Planning, Placement and Case Review (Wales) Regulations 2015',
        reviewFrequency: '28 days, then 3 months, then 6 monthly',
        reportingRequirements: [
          'LAC review records',
          'Personal education plan',
          'Health assessment',
          'Pathway plan (16+)',
          'When I Am Ready plan (18-21)',
        ],
      },
      [BritishIslesJurisdiction.NORTHERN_IRELAND]: {
        jurisdiction: BritishIslesJurisdiction.NORTHERN_IRELAND,
        regulation: 'Children (Northern Ireland) Order 1995',
        reviewFrequency: '28 days, then 3 months, then 6 monthly',
        reportingRequirements: [
          'LAC review documentation',
          'Care plan',
          'Health assessment',
          'Education plan',
          'Financial statements',
        ],
      },
      [BritishIslesJurisdiction.IRELAND]: {
        jurisdiction: BritishIslesJurisdiction.IRELAND,
        regulation: 'Child Care Act 1991 & National Standards',
        reviewFrequency: '28 days, then 3 months, then 6 monthly',
        reportingRequirements: [
          'Care plan reviews',
          'Health assessments',
          'Education reports',
          'Aftercare plan (16+)',
          'Financial accounting',
        ],
      },
      [BritishIslesJurisdiction.JERSEY]: {
        jurisdiction: BritishIslesJurisdiction.JERSEY,
        regulation: 'Children (Jersey) Law 2002',
        reviewFrequency: '28 days, then 3 months, then 6 monthly',
        reportingRequirements: [
          'LAC review records',
          'Care plan',
          'Health plan',
          'Education plan',
          'Financial records',
        ],
      },
      [BritishIslesJurisdiction.GUERNSEY]: {
        jurisdiction: BritishIslesJurisdiction.GUERNSEY,
        regulation: 'Children (Guernsey and Alderney) Law 2008',
        reviewFrequency: '28 days, then 3 months, then 6 monthly',
        reportingRequirements: [
          'LAC review documentation',
          'Placement plan',
          'Health assessment',
          'Education plan',
          'Financial audit',
        ],
      },
      [BritishIslesJurisdiction.ISLE_OF_MAN]: {
        jurisdiction: BritishIslesJurisdiction.ISLE_OF_MAN,
        regulation: 'Children and Young Persons Act 2001',
        reviewFrequency: '28 days, then 3 months, then 6 monthly',
        reportingRequirements: [
          'LAC review records',
          'Care plan',
          'Health plan',
          'Education plan',
          'Leaving care plan (16+)',
        ],
      },
    };

    return requirements[this.jurisdiction];
  }

  /**
   * Get financial summary for IRO/social worker
   */
  public getFinancialSummary(): {
    childId: string;
    childName: string;
    jurisdiction: BritishIslesJurisdiction;
    placementCost: {
      daily: number;
      weekly: number;
      monthly: number;
      annual: number;
    };
    serviceCharges: number;
    totalWeeklyCost: number;
    totalMonthlyCost: number;
    personalAllowances: PersonalAllowances;
    financialStatus: {
      totalInvoiced: number;
      totalPaid: number;
      currentArrears: number;
      paymentRate: number;
      overdueInvoices: number;
      hasDispute: boolean;
    };
    fundingAllocations: FundingAllocation[];
    nextInvoiceDate: Date | null;
  } {
    return {
      childId: this.childId,
      childName: this.child?.firstName + ' ' + this.child?.lastName || 'Unknown',
      jurisdiction: this.jurisdiction,
      placementCost: {
        daily: this.dailyRate,
        weekly: this.weeklyRate,
        monthly: this.monthlyRate,
        annual: this.annualRate,
      },
      serviceCharges: this.totalWeeklyServiceCharges,
      totalWeeklyCost: this.getTotalWeeklyCost(),
      totalMonthlyCost: this.getTotalMonthlyCost(),
      personalAllowances: this.personalAllowances,
      financialStatus: {
        totalInvoiced: this.totalInvoiced,
        totalPaid: this.totalPaid,
        currentArrears: this.currentArrears,
        paymentRate: this.getPaymentRate(),
        overdueInvoices: this.getOverdueInvoices().length,
        hasDispute: this.hasDispute,
      },
      fundingAllocations: this.fundingAllocations,
      nextInvoiceDate: this.nextInvoiceDate,
    };
  }

  /**
   * Check if child is approaching transition age (16)
   */
  public shouldTransitionToLeavingCare(childDateOfBirth: Date): boolean {
    const today = new Date();
    const age = this.calculateAge(childDateOfBirth);
    
    // Trigger transition at 16
    return age >= 16 && !this.transitionedToLeavingCare;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
