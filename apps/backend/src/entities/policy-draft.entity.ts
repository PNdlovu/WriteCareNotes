/**
 * @fileoverview Policy Draft Entity
 * @description Entity model for policy drafts in the authoring system
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-06
 * @lastModified 2025-10-06
 * 
 * @compliance
 * - GDPR Article 5 (Data minimization)
 * - ISO 27001 (Information Security)
 * - Care Quality Commission standards
 * - Audit trail requirements
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { UserAcknowledgment } from './user-acknowledgment.entity';

/**
 * Policy status enumeration
 */
export enum PolicyStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
  ARCHIVED = 'archived'
}

/**
 * Policy categories for care home operations
 */
export enum PolicyCategory {
  SAFEGUARDING = 'safeguarding',
  DATA_PROTECTION = 'data_protection',
  COMPLAINTS = 'complaints',
  HEALTH_SAFETY = 'health_safety',
  MEDICATION = 'medication',
  INFECTION_CONTROL = 'infection_control',
  STAFF_TRAINING = 'staff_training',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  DIGNITY_RESPECT = 'dignity_respect',
  NUTRITION_HYDRATION = 'nutrition_hydration',
  END_OF_LIFE = 'end_of_life',
  MENTAL_CAPACITY = 'mental_capacity',
  VISITORS = 'visitors',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation'
}

/**
 * Regulatory jurisdictions
 */
export enum Jurisdiction {
  ENGLAND_CQC = 'england_cqc',
  SCOTLAND_CI = 'scotland_ci',
  WALES_CIW = 'wales_ciw',
  NORTHERN_IRELAND_RQIA = 'northern_ireland_rqia',
  JERSEY_JCC = 'jersey_jcc',
  GUERNSEY_GCC = 'guernsey_gcc',
  ISLE_OF_MAN_IMC = 'isle_of_man_imc',
  EU_GDPR = 'eu_gdpr',
  UK_DATA_PROTECTION = 'uk_data_protection'
}

/**
 * Rich text content structure
 */
export interface RichTextContent {
  type: 'doc';
  content: Array<{
    type: string;
    attrs?: Record<string, any>;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{
        type: string;
        attrs?: Record<string, any>;
      }>;
    }>;
  }>;
}

/**
 * PolicyDraft Entity
 * 
 * Stores policy drafts created by care home staff using the authoring toolkit.
 * Supports rich text editing, workflow management, and compliance tracking.
 */
@Entity('policy_drafts')
@Index(['organizationId', 'status'])
@Index(['category', 'jurisdiction'])
@Index(['reviewDue'])
export class PolicyDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Policy title
   * @example "Safeguarding Adults Policy"
   */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  /**
   * Rich text content of the policy
   */
  @Column({ type: 'jsonb' })
  content: RichTextContent;

  /**
   * Policy category
   */
  @Column({
    type: 'enum',
    enum: PolicyCategory
  })
  category: PolicyCategory;

  /**
   * Applicable regulatory jurisdictions
   */
  @Column({
    type: 'enum',
    enum: Jurisdiction,
    array: true
  })
  jurisdiction: Jurisdiction[];

  /**
   * Current status in the workflow
   */
  @Column({
    type: 'enum',
    enum: PolicyStatus,
    default: PolicyStatus.DRAFT
  })
  @Index()
  status: PolicyStatus;

  /**
   * Policy version
   * @example "1.2.3"
   */
  @Column({ type: 'varchar', length: 20 })
  version: string;

  /**
   * Modules linked to this policy
   */
  @Column({ type: 'varchar', array: true, default: [] })
  linkedModules: string[];

  /**
   * When policy is due for review
   */
  @Column({ type: 'timestamp' })
  @Index()
  reviewDue: Date;

  /**
   * Policy description
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Tags for categorization and search
   */
  @Column({ type: 'varchar', array: true, default: [] })
  tags: string[];

  /**
   * Organization this policy belongs to
   */
  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  /**
   * Who created this policy
   */
  @Column({ type: 'uuid' })
  createdBy: string;

  /**
   * Who last updated this policy
   */
  @Column({ type: 'uuid' })
  updatedBy: string;

  /**
   * Template used to create this policy (if any)
   */
  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  /**
   * When submitted for review
   */
  @Column({ type: 'timestamp', nullable: true })
  submittedForReviewAt?: Date;

  /**
   * Who submitted for review
   */
  @Column({ type: 'uuid', nullable: true })
  submittedBy?: string;

  /**
   * Review notes when submitted
   */
  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

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
   * Who published this policy
   */
  @Column({ type: 'uuid', nullable: true })
  publishedBy?: string;

  /**
   * When policy was published
   */
  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  /**
   * When policy becomes effective
   */
  @Column({ type: 'timestamp', nullable: true })
  effectiveDate?: Date;

  /**
   * When policy expires
   */
  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  /**
   * Whether acknowledgment is required
   */
  @Column({ type: 'boolean', default: false })
  acknowledgmentRequired: boolean;

  /**
   * Whether training is required
   */
  @Column({ type: 'boolean', default: false })
  trainingRequired: boolean;

  /**
   * Publishing notes
   */
  @Column({ type: 'text', nullable: true })
  publishingNotes?: string;

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
   * Reference to organization
   */
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  /**
   * Reference to creator
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  /**
   * User acknowledgments for this policy
   */
  @OneToMany(() => UserAcknowledgment, (ack) => ack.policy)
  acknowledgments: UserAcknowledgment[];

  /**
   * Check if policy is editable
   */
  isEditable(): boolean {
    return this.status === PolicyStatus.DRAFT;
  }

  /**
   * Check if policy can be submitted for review
   */
  canSubmitForReview(): boolean {
    return this.status === PolicyStatus.DRAFT && 
           this.title && 
           this.content && 
           this.jurisdiction.length > 0;
  }

  /**
   * Check if policy can be approved
   */
  canApprove(): boolean {
    return this.status === PolicyStatus.UNDER_REVIEW;
  }

  /**
   * Check if policy can be published
   */
  canPublish(): boolean {
    return this.status === PolicyStatus.APPROVED;
  }

  /**
   * Check if policy is active
   */
  isActive(): boolean {
    return this.status === PolicyStatus.PUBLISHED && 
           this.effectiveDate && 
           this.effectiveDate <= new Date();
  }

  /**
   * Check if policy is due for review
   */
  isDueForReview(daysAhead: number = 30): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    return this.reviewDue <= cutoffDate;
  }

  /**
   * Get word count from rich text content
   */
  getWordCount(): number {
    let wordCount = 0;
    
    const countWordsInContent = (content: any[]): void => {
      content.forEach(node => {
        if (node.type === 'text' && node.text) {
          wordCount += node.text.split(/\s+/).filter(word => word.length > 0).length;
        }
        if (node.content) {
          countWordsInContent(node.content);
        }
      });
    };
    
    if (this.content && this.content.content) {
      countWordsInContent(this.content.content);
    }
    
    return wordCount;
  }

  /**
   * Get compliance requirements based on jurisdiction
   */
  getComplianceRequirements(): string[] {
    constrequirements: string[] = [];
    
    this.jurisdiction.forEach(j => {
      switch (j) {
        case Jurisdiction.ENGLAND_CQC:
          requirements.push('Health and Social Care Act 2008', 'Care Quality Commission Regulations');
          break;
        case Jurisdiction.SCOTLAND_CI:
          requirements.push('Public Services Reform Act 2010', 'Care Inspectorate Standards');
          break;
        case Jurisdiction.WALES_CIW:
          requirements.push('Social Services and Well-being Act 2014', 'CIW Standards');
          break;
        case Jurisdiction.NORTHERN_IRELAND_RQIA:
          requirements.push('Health and Personal Social Services Act 2001', 'RQIA Standards');
          break;
        case Jurisdiction.EU_GDPR:
        case Jurisdiction.UK_DATA_PROTECTION:
          requirements.push('UK GDPR', 'Data Protection Act 2018');
          break;
      }
    });
    
    return [...new Set(requirements)];
  }

  /**
   * Get policy metadata for API responses
   */
  getMetadata() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      jurisdiction: this.jurisdiction,
      status: this.status,
      version: this.version,
      reviewDue: this.reviewDue,
      effectiveDate: this.effectiveDate,
      wordCount: this.getWordCount(),
      isEditable: this.isEditable(),
      canSubmitForReview: this.canSubmitForReview(),
      canApprove: this.canApprove(),
      canPublish: this.canPublish(),
      isActive: this.isActive(),
      isDueForReview: this.isDueForReview(),
      complianceRequirements: this.getComplianceRequirements(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
