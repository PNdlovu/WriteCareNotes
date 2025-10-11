import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Child } from './Child';
import { User } from '../../users/entities/User';

/**
 * Allowance Type (Statutory + Discretionary)
 */
export enum AllowanceType {
  // Clothing
  CLOTHING_SEASONAL = 'CLOTHING_SEASONAL', // Quarterly/seasonal clothing
  CLOTHING_SCHOOL_UNIFORM = 'CLOTHING_SCHOOL_UNIFORM', // School uniform
  CLOTHING_SPORTS = 'CLOTHING_SPORTS', // Sports/PE kit
  CLOTHING_SPECIAL_OCCASION = 'CLOTHING_SPECIAL_OCCASION', // Formal wear
  FOOTWEAR = 'FOOTWEAR', // Shoes, trainers

  // Birthday & Festivals
  BIRTHDAY_GRANT = 'BIRTHDAY_GRANT', // Annual birthday money
  CHRISTMAS_GRANT = 'CHRISTMAS_GRANT', // Christmas money
  EID_GRANT = 'EID_GRANT', // Eid al-Fitr, Eid al-Adha
  DIWALI_GRANT = 'DIWALI_GRANT', // Diwali
  HANUKKAH_GRANT = 'HANUKKAH_GRANT', // Hanukkah
  FESTIVAL_OTHER = 'FESTIVAL_OTHER', // Other religious/cultural festivals

  // Education
  EDUCATION_SCHOOL_TRIP = 'EDUCATION_SCHOOL_TRIP', // School trips
  EDUCATION_EQUIPMENT = 'EDUCATION_EQUIPMENT', // Books, calculator, laptop
  EDUCATION_EXAM_FEES = 'EDUCATION_EXAM_FEES', // GCSE, A-Level exam fees
  EDUCATION_MUSIC_LESSONS = 'EDUCATION_MUSIC_LESSONS', // Music lessons/instruments
  EDUCATION_TUTORING = 'EDUCATION_TUTORING', // Private tutoring

  // Cultural & Religious
  CULTURAL_ACTIVITIES = 'CULTURAL_ACTIVITIES', // Cultural events, heritage activities
  RELIGIOUS_ACTIVITIES = 'RELIGIOUS_ACTIVITIES', // Religious education, events
  LANGUAGE_CLASSES = 'LANGUAGE_CLASSES', // Heritage language classes

  // Hobbies & Leisure
  HOBBIES_SPORTS = 'HOBBIES_SPORTS', // Sports clubs, equipment
  HOBBIES_ARTS = 'HOBBIES_ARTS', // Art supplies, classes
  HOBBIES_MUSIC = 'HOBBIES_MUSIC', // Music equipment, lessons
  HOBBIES_OTHER = 'HOBBIES_OTHER', // Other hobby expenses

  // Personal Care
  PERSONAL_CARE_TOILETRIES = 'PERSONAL_CARE_TOILETRIES', // Toiletries, hygiene products
  PERSONAL_CARE_HAIR = 'PERSONAL_CARE_HAIR', // Haircuts, hair care (cultural needs)
  PERSONAL_CARE_OPTICAL = 'PERSONAL_CARE_OPTICAL', // Glasses, contact lenses
  PERSONAL_CARE_DENTAL = 'PERSONAL_CARE_DENTAL', // Orthodontics (beyond NHS)

  // Other
  TRAVEL_HOME_VISIT = 'TRAVEL_HOME_VISIT', // Travel to family visits
  TECHNOLOGY = 'TECHNOLOGY', // Phone top-up, internet
  OTHER = 'OTHER', // Miscellaneous
}

/**
 * Approval Status
 */
export enum ApprovalStatus {
  PENDING = 'PENDING', // Awaiting approval
  APPROVED = 'APPROVED', // Approved by social worker/manager
  REJECTED = 'REJECTED', // Rejected
  ESCALATED = 'ESCALATED', // Escalated to manager (high value)
}

/**
 * Receipt Status
 */
export enum ReceiptStatus {
  PENDING = 'PENDING', // Receipt not yet uploaded
  UPLOADED = 'UPLOADED', // Receipt uploaded, awaiting verification
  VERIFIED = 'VERIFIED', // Receipt verified by staff
  REJECTED = 'REJECTED', // Receipt rejected (invalid, unclear)
  MISSING = 'MISSING', // Receipt lost/not available
}

/**
 * Allowance Expenditure Entity
 * 
 * Tracks allowance spending (clothing, birthday, festival, education, etc.)
 * with receipt management and approval workflows.
 * 
 * FEATURES:
 * - 25+ allowance types (clothing, birthday, festival, education, cultural)
 * - Receipt image upload (S3/blob storage)
 * - Approval workflows (social worker → manager)
 * - Spending category tracking
 * - Budget vs. actual comparison
 * - High-value escalation (>£100)
 * - Quarterly clothing allowance tracking
 * - Annual birthday/festival grants
 * - Education allowance tracking
 * - Cultural/religious needs support
 * - Hobby/leisure activity funding
 * 
 * COMPLIANCE:
 * - Care Planning Regulations 2010 (England)
 * - Looked After Children Regulations 2009 (Scotland)
 * - Care Planning Regulations 2015 (Wales)
 * - Children Order 1995 (Northern Ireland)
 * - Tusla guidance (Ireland)
 * - Equality Act 2010 (cultural/religious needs)
 * 
 * INTEGRATION:
 * - ChildBilling.personalAllowances (budget)
 * - PocketMoneyTransaction (pocket money spending)
 * - ChildSavingsAccount (savings for large purchases)
 * 
 * USAGE:
 * ```typescript
 * const expenditure = new AllowanceExpenditure();
 * expenditure.childId = 'uuid';
 * expenditure.allowanceType = AllowanceType.CLOTHING_SEASONAL;
 * expenditure.amount = 75.50;
 * expenditure.requestPurchase('Winter coat', 'Next', staffUser);
 * expenditure.uploadReceipt('https://s3.../receipt.jpg', staffUser);
 * expenditure.approve(socialWorker);
 * ```
 */
@Entity('allowance_expenditures')
@Index('idx_ae_child_id', ['childId'])
@Index('idx_ae_allowance_type', ['allowanceType'])
@Index('idx_ae_approval_status', ['approvalStatus'])
@Index('idx_ae_receipt_status', ['receiptStatus'])
@Index('idx_ae_purchase_date', ['purchaseDate'])
@Index('idx_ae_quarter_year', ['quarter', 'year'])
export class AllowanceExpenditure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ==================== CHILD ====================

  @Column({ type: 'uuid' })
  @Index()
  childId!: string;

  @ManyToOne(() => Child, { nullable: false })
  @JoinColumn({ name: 'childId' })
  child!: Child;

  // ==================== ALLOWANCE TYPE ====================

  @Column({
    type: 'enum',
    enum: AllowanceType,
  })
  allowanceType!: AllowanceType;

  @Column({ type: 'varchar', length: 100 })
  category!: string; // 'CLOTHING', 'BIRTHDAY', 'FESTIVAL', 'EDUCATION', etc.

  // ==================== AMOUNT ====================

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency!: string; // GBP or EUR (for Ireland)

  // ==================== BUDGET TRACKING ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetAmount?: number; // From ChildBilling.personalAllowances

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  budgetRemaining!: number; // Budget left after this purchase

  @Column({ type: 'boolean', default: false })
  exceedsBudget!: boolean; // true if amount > budgetRemaining

  // ==================== PURCHASE DETAILS ====================

  @Column({ type: 'varchar', length: 500 })
  itemDescription!: string; // What was purchased

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendor?: string; // Where purchased (e.g., "Next", "Primark", "Amazon")

  @Column({ type: 'date' })
  purchaseDate!: Date;

  @Column({ type: 'int', nullable: true })
  quarter?: number; // 1-4 (for quarterly allowances like clothing)

  @Column({ type: 'int', nullable: true })
  year?: number; // e.g., 2025

  // ==================== APPROVAL WORKFLOW ====================

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approvalStatus!: ApprovalStatus;

  @Column({ type: 'uuid', nullable: true })
  requestedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requestedByStaffId' })
  requestedByStaff?: User;

  @Column({ type: 'timestamp', nullable: true })
  requestedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedByStaffId' })
  approvedByStaff?: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  approvalNotes?: string;

  // High-value escalation
  @Column({ type: 'boolean', default: false })
  requiresManagerApproval!: boolean; // true if amount > £100

  @Column({ type: 'uuid', nullable: true })
  escalatedToManagerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'escalatedToManagerId' })
  escalatedToManager?: User;

  // ==================== RECEIPT MANAGEMENT ====================

  @Column({
    type: 'enum',
    enum: ReceiptStatus,
    default: ReceiptStatus.PENDING,
  })
  receiptStatus!: ReceiptStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptImageUrl?: string; // S3/blob storage URL

  @Column({ type: 'jsonb', nullable: true })
  receiptImages?: string[]; // Multiple images (front/back)

  @Column({ type: 'timestamp', nullable: true })
  receiptUploadedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  receiptUploadedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiptUploadedByStaffId' })
  receiptUploadedByStaff?: User;

  @Column({ type: 'timestamp', nullable: true })
  receiptVerifiedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  receiptVerifiedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiptVerifiedByStaffId' })
  receiptVerifiedByStaff?: User;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  receiptRejectionReason?: string;

  // ==================== CHILD INVOLVEMENT ====================

  @Column({ type: 'boolean', default: false })
  childWasPresent!: boolean; // Child present during purchase

  @Column({ type: 'boolean', default: false })
  childChose!: boolean; // Child chose the item

  @Column({ type: 'varchar', length: 1000, nullable: true })
  childFeedback?: string; // Child's comment about purchase

  // ==================== CULTURAL/RELIGIOUS ====================

  @Column({ type: 'boolean', default: false })
  isCulturalNeed!: boolean; // Cultural/heritage need (Equality Act 2010)

  @Column({ type: 'boolean', default: false })
  isReligiousNeed!: boolean; // Religious need (Equality Act 2010)

  @Column({ type: 'varchar', length: 500, nullable: true })
  culturalReligiousContext?: string; // Explanation (e.g., "Eid celebration", "Diwali clothes")

  // ==================== LINKED TRANSACTIONS ====================

  @Column({ type: 'uuid', nullable: true })
  linkedPocketMoneyTransactionId?: string; // If paid from pocket money

  @Column({ type: 'uuid', nullable: true })
  linkedSavingsWithdrawalId?: string; // If paid from savings

  // ==================== NOTES & METADATA ====================

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    paymentMethod?: string; // Cash, card, online
    deliveryMethod?: string; // In-store, delivery
    returnPolicy?: string; // Return deadline
    warranty?: string; // Warranty info
    size?: string; // Clothing size
    color?: string; // Color
  };

  // ==================== AUDIT TRAIL ====================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  // ==================== BUSINESS METHODS ====================

  /**
   * Request purchase (staff initiates)
   */
  public requestPurchase(
    itemDescription: string,
    vendor: string,
    staff: User,
  ): void {
    this.itemDescription = itemDescription;
    this.vendor = vendor;
    this.requestedByStaffId = staff.id;
    this.requestedAt = new Date();
    this.approvalStatus = ApprovalStatus.PENDING;

    // Check if requires manager approval (high value)
    if (this.amount > 100) {
      this.requiresManagerApproval = true;
      this.approvalStatus = ApprovalStatus.ESCALATED;
    }

    // Set category based on allowance type
    this.category = this.getCategoryFromType();

    // Set quarter/year for quarterly allowances
    if (this.isQuarterlyAllowance()) {
      const date = new Date();
      this.quarter = Math.ceil((date.getMonth() + 1) / 3);
      this.year = date.getFullYear();
    }
  }

  /**
   * Get category from allowance type
   */
  private getCategoryFromType(): string {
    if (this.allowanceType.startsWith('CLOTHING')) return 'CLOTHING';
    if (this.allowanceType.startsWith('EDUCATION')) return 'EDUCATION';
    if (this.allowanceType.endsWith('GRANT')) return 'FESTIVAL';
    if (this.allowanceType.startsWith('HOBBIES')) return 'HOBBIES';
    if (this.allowanceType.startsWith('PERSONAL_CARE')) return 'PERSONAL_CARE';
    if (this.allowanceType.startsWith('CULTURAL')) return 'CULTURAL';
    if (this.allowanceType.startsWith('RELIGIOUS')) return 'RELIGIOUS';
    return 'OTHER';
  }

  /**
   * Check if quarterly allowance
   */
  private isQuarterlyAllowance(): boolean {
    return this.allowanceType === AllowanceType.CLOTHING_SEASONAL;
  }

  /**
   * Approve expenditure (social worker)
   */
  public approve(approver: User, notes?: string): void {
    this.approvalStatus = ApprovalStatus.APPROVED;
    this.approvedByStaffId = approver.id;
    this.approvedAt = new Date();
    if (notes) this.approvalNotes = notes;
  }

  /**
   * Reject expenditure
   */
  public reject(approver: User, reason: string): void {
    this.approvalStatus = ApprovalStatus.REJECTED;
    this.approvedByStaffId = approver.id;
    this.approvedAt = new Date();
    this.approvalNotes = reason;
  }

  /**
   * Escalate to manager (high value)
   */
  public escalateToManager(manager: User): void {
    this.approvalStatus = ApprovalStatus.ESCALATED;
    this.escalatedToManagerId = manager.id;
    this.requiresManagerApproval = true;
  }

  /**
   * Upload receipt
   */
  public uploadReceipt(imageUrl: string, staff: User): void {
    if (!this.receiptImages) {
      this.receiptImages = [];
    }
    this.receiptImages.push(imageUrl);
    this.receiptImageUrl = imageUrl; // Primary image
    this.receiptStatus = ReceiptStatus.UPLOADED;
    this.receiptUploadedAt = new Date();
    this.receiptUploadedByStaffId = staff.id;
  }

  /**
   * Verify receipt
   */
  public verifyReceipt(staff: User): void {
    this.receiptStatus = ReceiptStatus.VERIFIED;
    this.receiptVerifiedAt = new Date();
    this.receiptVerifiedByStaffId = staff.id;
  }

  /**
   * Reject receipt
   */
  public rejectReceipt(staff: User, reason: string): void {
    this.receiptStatus = ReceiptStatus.REJECTED;
    this.receiptVerifiedByStaffId = staff.id;
    this.receiptVerifiedAt = new Date();
    this.receiptRejectionReason = reason;
  }

  /**
   * Mark receipt as missing
   */
  public markReceiptMissing(reason: string): void {
    this.receiptStatus = ReceiptStatus.MISSING;
    this.receiptRejectionReason = reason;
  }

  /**
   * Record child involvement
   */
  public recordChildInvolvement(
    wasPresent: boolean,
    childChose: boolean,
    feedback?: string,
  ): void {
    this.childWasPresent = wasPresent;
    this.childChose = childChose;
    if (feedback) this.childFeedback = feedback;
  }

  /**
   * Mark as cultural/religious need
   */
  public markCulturalReligiousNeed(
    isCultural: boolean,
    isReligious: boolean,
    context: string,
  ): void {
    this.isCulturalNeed = isCultural;
    this.isReligiousNeed = isReligious;
    this.culturalReligiousContext = context;
  }

  /**
   * Update budget tracking
   */
  public updateBudgetTracking(budget: number, spentToDate: number): void {
    this.budgetAmount = budget;
    this.budgetRemaining = budget - spentToDate - this.amount;
    this.exceedsBudget = this.budgetRemaining < 0;
  }

  /**
   * Check if complete (approved + receipt verified)
   */
  public isComplete(): boolean {
    return (
      this.approvalStatus === ApprovalStatus.APPROVED &&
      this.receiptStatus === ReceiptStatus.VERIFIED
    );
  }

  /**
   * Check if requires attention
   */
  public requiresAttention(): boolean {
    return (
      this.approvalStatus === ApprovalStatus.PENDING ||
      this.approvalStatus === ApprovalStatus.ESCALATED ||
      this.receiptStatus === ReceiptStatus.PENDING ||
      this.receiptStatus === ReceiptStatus.REJECTED ||
      this.exceedsBudget
    );
  }
}
