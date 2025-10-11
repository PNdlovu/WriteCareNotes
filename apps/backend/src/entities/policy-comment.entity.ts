/**
 * @fileoverview PolicyComment Entity - Policy Collaboration Comments & Annotations
 * @module Entities/PolicyComment
 * @description TypeORM entity for managing comments, annotations, and threaded discussions on policy documents.
 * Supports @mentions, comment threading, position-based annotations, and real-time collaboration features.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * KeyFeatures:
 * - Threaded comment discussions with parent-child relationships
 * - Position-based annotations using CSS selectors
 * - @mention support with user notifications
 * - Comment status tracking (active, resolved, deleted)
 * - Rich text content support
 * - Real-time comment broadcasting via WebSocket
 * - Comment editing and deletion with audit trail
 * 
 * DatabaseSchema:
 * - Table: policy_comments
 * - PrimaryKey: UUID (id)
 * - ForeignKeys: policy_id → policy_drafts, user_id → users, parent_comment_id → policy_comments (self-reference)
 * - Indexes: policy_id, user_id, parent_comment_id, status, created_at
 * 
 * RelatedEntities:
 * - PolicyDraft: The policy being commented on
 * - User: Comment author
 * - Self-reference: Parent comment for threading
 * 
 * Compliance:
 * - GDPR: Comment data retention and user data deletion
 * - ISO 27001: Audit trail for all comment operations
 * - Data Protection Act 2018: User consent for @mentions
 * 
 * @example
 * ```typescript
 * const comment = new PolicyComment();
 * comment.policyId = policyId;
 * comment.userId = userId;
 * comment.content = "This section needs clarification";
 * comment.mentionedUsers = [reviewerId];
 * await commentRepository.save(comment);
 * ```
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Comment status enumeration
 */
export enum CommentStatus {
  /** Comment is active and visible */
  ACTIVE = 'active',
  /** Comment thread has been resolved */
  RESOLVED = 'resolved',
  /** Comment has been soft-deleted */
  DELETED = 'deleted',
  /** Comment is hidden (spam or inappropriate) */
  HIDDEN = 'hidden'
}

/**
 * Comment type enumeration
 */
export enum CommentType {
  /** General comment on the policy */
  GENERAL = 'general',
  /** Suggestion for improvement */
  SUGGESTION = 'suggestion',
  /** Question requiring clarification */
  QUESTION = 'question',
  /** Approval or agreement */
  APPROVAL = 'approval',
  /** Rejection or disagreement */
  REJECTION = 'rejection',
  /** Annotation on specific text */
  ANNOTATION = 'annotation'
}

/**
 * Interface for position selector data
 */
export interface PositionSelector {
  /** CSS selector for the annotated element */
  selector: string;
  /** Text content at the annotation point (for verification) */
  textContent?: string;
  /** Start offset within the element */
  startOffset?: number;
  /** End offset within the element */
  endOffset?: number;
  /** XPath for precise positioning (alternative to CSS selector) */
  xpath?: string;
}

/**
 * PolicyComment Entity
 * Represents a comment or annotation on a policy document
 */
@Entity('policy_comments')
@Index(['policyId'])
@Index(['userId'])
@Index(['parentCommentId'])
@Index(['status'])
@Index(['createdAt'])
@Index(['policyId', 'status'])
export class PolicyComment {
  /**
   * Unique identifier for the comment (UUID v4)
   * @primary
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign key to the policy being commented on
   * @required
   * @indexed
   */
  @Column({ type: 'uuid', name: 'policy_id' })
  @Index()
  policyId: string;

  /**
   * Foreign key to the user who created the comment
   * @required
   * @indexed
   */
  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  /**
   * Foreign key to parent comment (for threaded discussions)
   * NULL for top-level comments
   * @nullable
   * @indexed
   */
  @Column({ type: 'uuid', nullable: true, name: 'parent_comment_id' })
  @Index()
  parentCommentId: string | null;

  /**
   * Comment content (supports Markdown and @mentions)
   * @required
   */
  @Column({ type: 'text', name: 'content' })
  content: string;

  /**
   * Position selector for annotations
   * Stores CSS selector or XPath to anchor comment to specific content
   * @nullable
   */
  @Column({ type: 'jsonb', nullable: true, name: 'position_selector' })
  positionSelector: PositionSelector | null;

  /**
   * Comment status
   * @default 'active'
   */
  @Column({
    type: 'var char',
    length: 20,
    default: CommentStatus.ACTIVE,
    name: 'status'
  })
  status: CommentStatus;

  /**
   * Comment type/category
   * @default 'general'
   */
  @Column({
    type: 'var char',
    length: 20,
    default: CommentType.GENERAL,
    name: 'comment_type'
  })
  commentType: CommentType;

  /**
   * Array of user IDs mentioned in the comment (@mentions)
   * Used for notification triggering
   * @nullable
   */
  @Column({ type: 'uuid', array: true, nullable: true, name: 'mentioned_users' })
  mentionedUsers: string[] | null;

  /**
   * User ID who resolved the comment
   * NULL if not resolved
   * @nullable
   */
  @Column({ type: 'uuid', nullable: true, name: 'resolved_by' })
  resolvedBy: string | null;

  /**
   * Timestamp when the comment was resolved
   * @nullable
   */
  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date | null;

  /**
   * User ID who last edited the comment
   * NULL if never edited
   * @nullable
   */
  @Column({ type: 'uuid', nullable: true, name: 'edited_by' })
  editedBy: string | null;

  /**
   * Timestamp when the comment was last edited
   * @nullable
   */
  @Column({ type: 'timestamp', nullable: true, name: 'edited_at' })
  editedAt: Date | null;

  /**
   * Number of likes/upvotes on the comment
   * @default 0
   */
  @Column({ type: 'integer', default: 0, name: 'like_count' })
  likeCount: number;

  /**
   * Array of user IDs who liked the comment
   * @nullable
   */
  @Column({ type: 'uuid', array: true, nullable: true, name: 'liked_by' })
  likedBy: string[] | null;

  /**
   * Comment metadata (attachments, formatting, etc.)
   * @nullable
   */
  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any> | null;

  /**
   * Whether this comment is pinned to the top of the thread
   * @default false
   */
  @Column({ type: 'boolean', default: false, name: 'is_pinned' })
  isPinned: boolean;

  /**
   * Timestamp when the comment was created
   * @auto
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the comment was last updated
   * @auto
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Self-referencing relationship for parent comment
   */
  @ManyToOne(() => PolicyComment, comment => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: PolicyComment | null;

  /**
   * Self-referencing relationship for child comments (replies)
   */
  @OneToMany(() => PolicyComment, comment => comment.parentComment)
  replies: PolicyComment[];

  // ===========================
  // Helper Methods
  // ===========================

  /**
   * Check if comment is active
   * @returns True if status is ACTIVE
   */
  isActive(): boolean {
    return this.status === CommentStatus.ACTIVE;
  }

  /**
   * Check if comment is resolved
   * @returns True if status is RESOLVED
   */
  isResolved(): boolean {
    return this.status === CommentStatus.RESOLVED;
  }

  /**
   * Check if comment is deleted
   * @returns True if status is DELETED
   */
  isDeleted(): boolean {
    return this.status === CommentStatus.DELETED;
  }

  /**
   * Check if comment is a top-level comment
   * @returns True if parentCommentId is null
   */
  isTopLevel(): boolean {
    return !this.parentCommentId;
  }

  /**
   * Check if comment is a reply
   * @returns True if parentCommentId exists
   */
  isReply(): boolean {
    return !!this.parentCommentId;
  }

  /**
   * Check if comment has been edited
   * @returns True if editedAt is not null
   */
  isEdited(): boolean {
    return !!this.editedAt;
  }

  /**
   * Check if comment is an annotation (has position selector)
   * @returns True if positionSelector exists
   */
  isAnnotation(): boolean {
    return !!this.positionSelector;
  }

  /**
   * Check if comment mentions specific user
   * @param userId - User ID to check
   * @returns True if user is mentioned
   */
  mentionsUser(userId: string): boolean {
    return this.mentionedUsers?.includes(userId) || false;
  }

  /**
   * Check if user has liked the comment
   * @param userId - User ID to check
   * @returns True if user has liked
   */
  hasLikedBy(userId: string): boolean {
    return this.likedBy?.includes(userId) || false;
  }

  /**
   * Resolve the comment
   * @param resolvedBy - User ID who resolved the comment
   */
  resolve(resolvedBy: string): void {
    this.status = CommentStatus.RESOLVED;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
  }

  /**
   * Reopen a resolved comment
   */
  reopen(): void {
    this.status = CommentStatus.ACTIVE;
    this.resolvedBy = null;
    this.resolvedAt = null;
  }

  /**
   * Soft delete the comment
   */
  softDelete(): void {
    this.status = CommentStatus.DELETED;
  }

  /**
   * Edit the comment content
   * @param newContent - New comment content
   * @param editedBy - User ID who edited the comment
   */
  edit(newContent: string, editedBy: string): void {
    this.content = newContent;
    this.editedBy = editedBy;
    this.editedAt = new Date();
  }

  /**
   * Add a like to the comment
   * @param userId - User ID who liked the comment
   */
  addLike(userId: string): void {
    if (!this.likedBy) {
      this.likedBy = [];
    }
    if (!this.hasLikedBy(userId)) {
      this.likedBy.push(userId);
      this.likeCount++;
    }
  }

  /**
   * Remove a like from the comment
   * @param userId - User ID who unliked the comment
   */
  removeLike(userId: string): void {
    if (this.likedBy) {
      this.likedBy = this.likedBy.filter(id => id !== userId);
      this.likeCount = Math.max(0, this.likeCount - 1);
    }
  }

  /**
   * Pin the comment
   */
  pin(): void {
    this.isPinned = true;
  }

  /**
   * Unpin the comment
   */
  unpin(): void {
    this.isPinned = false;
  }

  /**
   * Extract mentioned user IDs from content
   * Parses @mentions in the format @[userId] or @username
   * @returns Array of mentioned user IDs
   */
  extractMentions(): string[] {
    const mentionPattern = /@\[([a-f0-9-]{36})\]/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionPattern.exec(this.content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  /**
   * Update mentioned users from content
   * Should be called before saving to ensure mentionedUsers is up-to-date
   */
  @BeforeInsert()
  @BeforeUpdate()
  updateMentionedUsers(): void {
    this.mentionedUsers = this.extractMentions();
  }

  /**
   * Get comment age in hours
   * @returns Age in hours
   */
  getAgeHours(): number {
    const now = new Date();
    const ageMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(ageMs / (60 * 60 * 1000));
  }

  /**
   * Get number of replies (requires replies to be loaded)
   * @returns Number of replies
   */
  getReplyCount(): number {
    return this.replies?.length || 0;
  }

  /**
   * Get comment summary
   * @returns Human-readable comment summary
   */
  getSummary(): string {
    const preview = this.content.substring(0, 50) + (this.content.length > 50 ? '...' : '');
    const type = this.isReply() ? 'Reply' : 'Comment';
    return `${type} ${this.id.substring(0, 8)} - ${this.status} - "${preview}"`;
  }

  /**
   * Convert to plain object (for API responses)
   * @param includeReplies - Whether to include nested replies
   * @returns Comment data as plain object
   */
  toJSON(includeReplies: boolean = false): Record<string, any> {
    return {
      id: this.id,
      policyId: this.policyId,
      userId: this.userId,
      parentCommentId: this.parentCommentId,
      content: this.content,
      commentType: this.commentType,
      status: this.status,
      positionSelector: this.positionSelector,
      mentionedUsers: this.mentionedUsers,
      likeCount: this.likeCount,
      isPinned: this.isPinned,
      isEdited: this.isEdited(),
      isResolved: this.isResolved(),
      isAnnotation: this.isAnnotation(),
      resolvedBy: this.resolvedBy,
      resolvedAt: this.resolvedAt,
      editedBy: this.editedBy,
      editedAt: this.editedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      replyCount: this.getReplyCount(),
      ageHours: this.getAgeHours(),
      ...(includeReplies && this.replies ? { replies: this.replies.map(r => r.toJSON(false)) } : {})
    };
  }
}
