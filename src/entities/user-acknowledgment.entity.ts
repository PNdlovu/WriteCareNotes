/**
 * @fileoverview User Acknowledgment Entity
 * @description Entity model for tracking policy acknowledgments by users
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-06
 * @lastModified 2025-10-06
 * 
 * @compliance
 * - GDPR Article 5 (Data minimization)
 * - ISO 27001 (Information Security)
 * - Audit trail requirements
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
import { User } from './user.entity';
import { PolicyDraft } from './policy-draft.entity';

/**
 * UserAcknowledgment Entity
 * 
 * Tracks when users acknowledge policies, supporting compliance
 * requirements and audit trails for regulatory purposes.
 */
@Entity('user_acknowledgments')
@Index(['userId', 'policyId'], { unique: true })
@Index(['policyId'])
@Index(['acknowledgedAt'])
export class UserAcknowledgment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User who acknowledged the policy
   */
  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  /**
   * Policy that was acknowledged
   */
  @Column({ type: 'uuid' })
  @Index()
  policyId: string;

  /**
   * When the policy was acknowledged
   */
  @Column({ type: 'timestamp' })
  @Index()
  acknowledgedAt: Date;

  /**
   * Whether required training was completed
   */
  @Column({ type: 'boolean', default: false })
  trainingCompleted: boolean;

  /**
   * When training was completed (if applicable)
   */
  @Column({ type: 'timestamp', nullable: true })
  trainingCompletedAt?: Date;

  /**
   * Digital signature or hash (if applicable)
   */
  @Column({ type: 'varchar', length: 512, nullable: true })
  digitalSignature?: string;

  /**
   * IP address when acknowledged (for audit purposes)
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  /**
   * User agent when acknowledged (for audit purposes)
   */
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  /**
   * Additional notes or comments
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  /**
   * Record creation timestamp
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Reference to the user
   */
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Reference to the policy
   */
  @ManyToOne(() => PolicyDraft, (policy) => policy.acknowledgments)
  @JoinColumn({ name: 'policyId' })
  policy: PolicyDraft;

  /**
   * Check if acknowledgment is complete
   */
  isComplete(): boolean {
    return this.acknowledgedAt !== null && 
           (!this.policy.trainingRequired || this.trainingCompleted);
  }

  /**
   * Check if acknowledgment is overdue
   */
  isOverdue(daysAfterPublication: number = 30): boolean {
    if (!this.policy.publishedAt) return false;
    
    const deadline = new Date(this.policy.publishedAt);
    deadline.setDate(deadline.getDate() + daysAfterPublication);
    
    return new Date() > deadline && !this.acknowledgedAt;
  }

  /**
   * Get acknowledgment metadata
   */
  getMetadata() {
    return {
      id: this.id,
      userId: this.userId,
      policyId: this.policyId,
      acknowledgedAt: this.acknowledgedAt,
      trainingCompleted: this.trainingCompleted,
      trainingCompletedAt: this.trainingCompletedAt,
      hasDigitalSignature: !!this.digitalSignature,
      isComplete: this.isComplete(),
      isOverdue: this.isOverdue(),
      createdAt: this.createdAt
    };
  }
}