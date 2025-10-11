/**
 * @fileoverview Policy Instance Entity
 * @description Entity model for generated policy instances specific to organizations
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-01-06
 * @lastModified 2025-01-06
 * 
 * @compliance
 * - GDPR Article 5 (Data minimization)
 * - ISO 27001 (Information Security)
 * - Care Quality Commission standards
 * - Regulatory audit trail requirements
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { PolicyTemplate, PolicyCategory, RegulatoryJurisdiction } from './policy-template.entity';

/**
 * Policy status enumeration
 */
export enum PolicyStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
  SUPERSEDED = 'SUPERSEDED'
}

/**
 * PolicyInstance Entity
 * 
 * Represents a specific policy generated from a template for an organization.
 * Contains the processed content with variable substitutions and approval workflow.
 */
@Entity('policy_instances')
@Index(['organizationId', 'category'])
@Index(['status', 'reviewDate'])
@Index(['templateId', 'organizationId'])
export class PolicyInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the policy template used
   */
  @Column({ type: 'uuid' })
  @Index()
  templateId: string;

  /**
   * Organization this policy belongs to
   */
  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  /**
   * Policy title (can be customized from template)
   */
  @Column({ type: 'var char', length: 255 })
  title: string;

  /**
   * Policy category (inherited from template)
   */
  @Column({
    type: 'enum',
    enum: PolicyCategory
  })
  category: PolicyCategory;

  /**
   * Applicable regulatory jurisdictions (inherited from template)
   */
  @Column({
    type: 'enum',
    enum: RegulatoryJurisdiction,
    array: true
  })
  jurisdiction: RegulatoryJurisdiction[];

  /**
   * Generated policy content with variables substituted
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * variable values used to generate this policy
   */
  @Column({ type: 'jsonb' })
  variableValues: Record<string, any>;

  /**
   * Template version used for generation
   */
  @Column({ type: 'var char', length: 20 })
  version: string;

  /**
   * Current status of the policy
   */
  @Column({
    type: 'enum',
    enum: PolicyStatus,
    default: PolicyStatus.DRAFT
  })
  @Index()
  status: PolicyStatus;

  /**
   * When policy becomes effective
   */
  @Column({ type: 'timestamp' })
  effectiveDate: Date;

  /**
   * When policy should be reviewed
   */
  @Column({ type: 'timestamp' })
  @Index()
  reviewDate: Date;

  /**
   * When policy expires (optional)
   */
  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  /**
   * Who approved this policy
   */
  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  /**
   * When policy was approved
   */
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  /**
   * Approval comments
   */
  @Column({ type: 'text', nullable: true })
  approvalComments?: string;

  /**
   * Who generated this policy from template
   */
  @Column({ type: 'uuid' })
  generatedBy: string;

  /**
   * Digital signature or approval hash
   */
  @Column({ type: 'var char', length: 512, nullable: true })
  digitalSignature?: string;

  /**
   * Policy document attachments (file paths)
   */
  @Column({ type: 'var char', array: true, default: [] })
  attachments: string[];

  /**
   * Revision history
   */
  @Column({ type: 'jsonb', default: [] })
  revisionHistory: Array<{
    version: string;
    changes: string;
    modifiedBy: string;
    modifiedAt: Date;
    reason: string;
  }>;

  /**
   * Compliance checklist completion
   */
  @Column({ type: 'jsonb', default: {} })
  complianceChecklist: Record<string, {
    completed: boolean;
    completedBy?: string;
    completedAt?: Date;
    notes?: string;
  }>;

  /**
   * Staff acknowledgment tracking
   */
  @Column({ type: 'jsonb', default: [] })
  staffAcknowledgments: Array<{
    staffId: string;
    acknowledgedAt: Date;
    digitalSignature?: string;
    notes?: string;
  }>;

  /**
   * When policy was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * When policy was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Reference to the policy template
   */
  @ManyToOne(() => PolicyTemplate, (template) => template.instances)
  @JoinColumn({ name: 'templateId' })
  template: PolicyTemplate;

  /**
   * Check if policy is currently active
   */
  isActive(): boolean {
    const now = new Date();
    return this.status === PolicyStatus.ACTIVE &&
           this.effectiveDate <= now &&
           (!this.expiryDate || this.expiryDate > now);
  }

  /**
   * Check if policy is due for review
   */
  isDueForReview(daysAhead: number = 30): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    return this.reviewDate <= cutoffDate;
  }

  /**
   * Check if policy is expired
   */
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  /**
   * Get policy approval status
   */
  getApprovalStatus(): {
    isApproved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    canApprove: boolean;
  } {
    return {
      isApproved: this.status === PolicyStatus.APPROVED || this.status === PolicyStatus.ACTIVE,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      canApprove: this.status === PolicyStatus.DRAFT || this.status === PolicyStatus.UNDER_REVIEW
    };
  }

  /**
   * Add staff acknowledgment
   */
  addStaffAcknowledgment(staffId: string, digitalSignature?: string, notes?: string): void {
    const acknowledgment = {
      staffId,
      acknowledgedAt: new Date(),
      digitalSignature,
      notes
    };

    // Remove existing acknowledgment from same staff member
    this.staffAcknowledgments = this.staffAcknowledgments.filter(
      ack => ack.staffId !== staffId
    );

    this.staffAcknowledgments.push(acknowledgment);
  }

  /**
   * Update compliance checklist item
   */
  updateComplianceItem(
    itemKey: string,
    completed: boolean,
    completedBy?: string,
    notes?: string
  ): void {
    this.complianceChecklist[itemKey] = {
      completed,
      completedBy,
      completedAt: completed ? new Date() : undefined,
      notes
    };
  }

  /**
   * Add revision to history
   */
  addRevision(
    version: string,
    changes: string,
    modifiedBy: string,
    reason: string
  ): void {
    this.revisionHistory.push({
      version,
      changes,
      modifiedBy,
      modifiedAt: new Date(),
      reason
    });
  }

  /**
   * Get compliance completion percentage
   */
  getComplianceCompletion(): number {
    const items = Object.values(this.complianceChecklist);
    if (items.length === 0) return 100;
    
    const completedItems = items.filter(item => item.completed);
    return Math.round((completedItems.length / items.length) * 100);
  }

  /**
   * Get staff acknowledgment percentage
   */
  getAcknowledgmentCompletion(totalStaff: number): number {
    if (totalStaff === 0) return 100;
    return Math.round((this.staffAcknowledgments.length / totalStaff) * 100);
  }

  /**
   * Check if specific staff member has acknowledged
   */
  hasStaffAcknowledged(staffId: string): boolean {
    return this.staffAcknowledgments.some(ack => ack.staffId === staffId);
  }

  /**
   * Get policy metadata for API responses
   */
  getMetadata() {
    return {
      id: this.id,
      templateId: this.templateId,
      organizationId: this.organizationId,
      title: this.title,
      category: this.category,
      jurisdiction: this.jurisdiction,
      version: this.version,
      status: this.status,
      effectiveDate: this.effectiveDate,
      reviewDate: this.reviewDate,
      expiryDate: this.expiryDate,
      isActive: this.isActive(),
      isDueForReview: this.isDueForReview(),
      isExpired: this.isExpired(),
      approvalStatus: this.getApprovalStatus(),
      complianceCompletion: this.getComplianceCompletion(),
      acknowledgmentCount: this.staffAcknowledgments.length,
      attachmentCount: this.attachments.length,
      revisionCount: this.revisionHistory.length,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Generate policy summary for reports
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      status: this.status,
      effectiveDate: this.effectiveDate,
      reviewDate: this.reviewDate,
      isActive: this.isActive(),
      isDueForReview: this.isDueForReview(),
      complianceCompletion: this.getComplianceCompletion()
    };
  }
}
