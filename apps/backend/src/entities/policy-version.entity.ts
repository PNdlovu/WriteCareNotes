/**
 * @fileoverview Policy Version Entity
 * @description Entity model for policy version history
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-06
 * @lastModified 2025-10-06
 * 
 * @compliance
 * - GDPR Article 5 (Data accuracy and audit trails)
 * - ISO 27001 (Version control)
 * - British Isles regulatory requirements (version history)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { PolicyDraft, PolicyCategory, PolicyStatus, Jurisdiction, RichTextContent } from './policy-draft.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';

/**
 * PolicyVersion Entity
 * 
 * Stores historical snapshots of policy versionsfor:
 * - Version comparison
 * - Audit trails
 * - Rollback functionality
 * - Compliance documentation
 */
@Entity('policy_versions')
@Index(['policyId', 'createdAt'])
@Index(['organizationId', 'version'])
export class PolicyVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the policy this version belongs to
   */
  @Column({ type: 'uuid' })
  @Index()
  policyId: string;

  /**
   * Version number at the time of snapshot
   * @example "1.2.3"
   */
  @Column({ type: 'var char', length: 20 })
  version: string;

  /**
   * Policy title at the time of snapshot
   */
  @Column({ type: 'var char', length: 255 })
  title: string;

  /**
   * Rich text content of the policy at this version
   */
  @Column({ type: 'jsonb' })
  content: RichTextContent;

  /**
   * Policy category at this version
   */
  @Column({
    type: 'enum',
    enum: PolicyCategory
  })
  category: PolicyCategory;

  /**
   * Applicable jurisdictions at this version
   */
  @Column({
    type: 'enum',
    enum: Jurisdiction,
    array: true
  })
  jurisdiction: Jurisdiction[];

  /**
   * Status at the time of snapshot
   */
  @Column({
    type: 'enum',
    enum: PolicyStatus
  })
  status: PolicyStatus;

  /**
   * Policy description at this version
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Tags at this version
   */
  @Column({ type: 'var char', array: true, default: [] })
  tags: string[];

  /**
   * Linked modules at this version
   */
  @Column({ type: 'var char', array: true, default: [] })
  linkedModules: string[];

  /**
   * Description of changes in this version
   */
  @Column({ type: 'text', nullable: true })
  changeDescription?: string;

  /**
   * Who created this version snapshot
   */
  @Column({ type: 'uuid' })
  createdBy: string;

  /**
   * Organization this version belongs to
   */
  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  /**
   * Additional metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    wordCount?: number;
    approvedBy?: string;
    publishedBy?: string;
    effectiveDate?: Date;
    reviewDue?: Date;
    [key: string]: any;
  };

  /**
   * When this version was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Reference to policy draft
   */
  @ManyToOne(() => PolicyDraft)
  @JoinColumn({ name: 'policyId' })
  policy: PolicyDraft;

  /**
   * Reference to creator
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  /**
   * Reference to organization
   */
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  /**
   * Get version summary for API responses
   */
  getSummary() {
    return {
      id: this.id,
      policyId: this.policyId,
      version: this.version,
      title: this.title,
      category: this.category,
      jurisdiction: this.jurisdiction,
      status: this.status,
      changeDescription: this.changeDescription,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      wordCount: this.metadata?.wordCount || 0
    };
  }

  /**
   * Check if this is a published version
   */
  isPublished(): boolean {
    return this.status === PolicyStatus.PUBLISHED;
  }

  /**
   * Check if this is an approved version
   */
  isApproved(): boolean {
    return this.status === PolicyStatus.APPROVED || this.status === PolicyStatus.PUBLISHED;
  }

  /**
   * Get age of this version in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Compare this version with another
   */
  getDifferencesWith(otherVersion: PolicyVersion): string[] {
    const differences: string[] = [];

    if (this.title !== otherVersion.title) {
      differences.push('title');
    }
    if (this.category !== otherVersion.category) {
      differences.push('category');
    }
    if (JSON.stringify(this.content) !== JSON.stringify(otherVersion.content)) {
      differences.push('content');
    }
    if (JSON.stringify(this.jurisdiction) !== JSON.stringify(otherVersion.jurisdiction)) {
      differences.push('jurisdiction');
    }
    if (JSON.stringify(this.tags) !== JSON.stringify(otherVersion.tags)) {
      differences.push('tags');
    }

    return differences;
  }
}
