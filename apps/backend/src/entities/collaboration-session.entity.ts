/**
 * @fileoverview CollaborationSession Entity - Real-Time Policy Collaboration
 * @module Entities/CollaborationSession
 * @description TypeORM entity for managing real-time collaborative editing sessions on policy documents.
 * Tracks active users, cursor positions, edit locks, and session state for multi-user policy editing.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * KeyFeatures:
 * - Real-time session management with WebSocket integration
 * - User presence tracking with last activity timestamps
 * - Cursor position and selection range tracking
 * - Edit lock management to prevent conflicts
 * - Session lifecycle management (active/idle/ended states)
 * - Automatic cleanup of stale sessions
 * 
 * DatabaseSchema:
 * - Table: collaboration_sessions
 * - PrimaryKey: UUID (id)
 * - ForeignKeys: policy_id → policy_drafts, user_id → users
 * - Indexes: policy_id, user_id, policy_id+user_id (composite), last_activity
 * 
 * RelatedEntities:
 * - PolicyDraft: The policy being collaboratively edited
 * - User: The collaborating user
 * - PolicyComment: Comments created during the session
 * 
 * Compliance:
 * - GDPR: Session data retention policy (30 days after end)
 * - ISO 27001: Audit trail for all collaboration activities
 * - Data Protection Act 2018: User activity tracking with consent
 * 
 * @example
 * ```typescript
 * const session = new CollaborationSession();
 * session.policyId = policyId;
 * session.userId = userId;
 * session.sessionToken = uuidv4();
 * session.isEditing = true;
 * await sessionRepository.save(session);
 * ```
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for cursor position data
 */
export interface CursorPosition {
  /** Line number in the editor (0-indexed) */
  line: number;
  /** Column/character position (0-indexed) */
  column: number;
  /** Optional element selector for rich text editors */
  selector?: string;
}

/**
 * Interface for text selection range
 */
export interface SelectionRange {
  /** Start position of selection */
  start: CursorPosition;
  /** End position of selection */
  end: CursorPosition;
  /** Selected text content (for highlighting) */
  text?: string;
}

/**
 * Session status enumeration
 */
export enum SessionStatus {
  /** User is actively editing */
  ACTIVE = 'active',
  /** User is viewing but not editing */
  IDLE = 'idle',
  /** Session has ended (user left or timeout) */
  ENDED = 'ended',
  /** Session disconnected (temporary network issue) */
  DISCONNECTED = 'disconnected'
}

/**
 * CollaborationSession Entity
 * Represents a real-time collaborative editing session on a policy document
 */
@Entity('collaboration_sessions')
@Index(['policyId'])
@Index(['userId'])
@Index(['policyId', 'userId'])
@Index(['lastActivity'])
@Index(['status'])
export class CollaborationSession {
  /**
   * Unique identifier for the collaboration session (UUID v4)
   * @primary
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign key to the policy being edited
   * @required
   * @indexed
   */
  @Column({ type: 'uuid', name: 'policy_id' })
  @Index()
  policyId: string;

  /**
   * Foreign key to the user in the session
   * @required
   * @indexed
   */
  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  /**
   * Unique session token for WebSocket authentication
   * Used to validate WebSocket connections and prevent session hijacking
   * @unique
   * @required
   */
  @Column({ type: 'var char', length: 255, unique: true, name: 'session_token' })
  sessionToken: string;

  /**
   * Last activity timestamp (updated on every user interaction)
   * Used for idle detection and automatic session cleanup
   * @default NOW()
   */
  @Column({ type: 'timestamp', name: 'last_activity', default: () => 'CURRENT_TIMESTAMP' })
  lastActivity: Date;

  /**
   * Current cursor position in the editor
   * Stored as JSONB for rich position data
   * @nullable
   */
  @Column({ type: 'jsonb', nullable: true, name: 'cursor_position' })
  cursorPosition: CursorPosition | null;

  /**
   * Current text selection range
   * Used for collaborative highlighting and conflict detection
   * @nullable
   */
  @Column({ type: 'jsonb', nullable: true, name: 'selection_range' })
  selectionRange: SelectionRange | null;

  /**
   * Whether the user currently has edit lock
   * Prevents simultaneous editing of the same section
   * @default false
   */
  @Column({ type: 'boolean', default: false, name: 'is_editing' })
  isEditing: boolean;

  /**
   * Current session status
   * @default 'active'
   */
  @Column({
    type: 'var char',
    length: 20,
    default: SessionStatus.ACTIVE,
    name: 'status'
  })
  status: SessionStatus;

  /**
   * Timestamp when the session ended
   * NULL if session is still active
   * @nullable
   */
  @Column({ type: 'timestamp', nullable: true, name: 'ended_at' })
  endedAt: Date | null;

  /**
   * User's device type for the session
   * @nullable
   */
  @Column({ type: 'var char', length: 50, nullable: true, name: 'device_type' })
  deviceType: string | null;

  /**
   * User's browser information
   * @nullable
   */
  @Column({ type: 'var char', length: 100, nullable: true, name: 'browser' })
  browser: string | null;

  /**
   * WebSocket connection ID
   * Used to map sessions to active WebSocket connections
   * @nullable
   */
  @Column({ type: 'var char', length: 255, nullable: true, name: 'socket_id' })
  socketId: string | null;

  /**
   * Number of edits made during this session
   * Used for activity metrics and engagement analytics
   * @default 0
   */
  @Column({ type: 'integer', default: 0, name: 'edit_count' })
  editCount: number;

  /**
   * Number of comments created during this session
   * @default 0
   */
  @Column({ type: 'integer', default: 0, name: 'comment_count' })
  commentCount: number;

  /**
   * Session metadata (connection quality, reconnection count, etc.)
   * @nullable
   */
  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any> | null;

  /**
   * Timestamp when the session was created
   * @auto
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the session was last updated
   * @auto
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ===========================
  // Lifecycle Hooks
  // ===========================

  /**
   * Generate session token before insert if not provided
   */
  @BeforeInsert()
  generateSessionToken(): void {
    if (!this.sessionToken) {
      this.sessionToken = uuidv4();
    }
  }

  /**
   * Update last activity timestamp before update
   */
  @BeforeUpdate()
  updateLastActivity(): void {
    this.lastActivity = new Date();
  }

  // ===========================
  // Helper Methods
  // ===========================

  /**
   * Check if session is active
   * @returns True if session is in active status and not ended
   */
  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE && !this.endedAt;
  }

  /**
   * Check if session is idle
   * @param idleThresholdMinutes - Minutes of inactivity to consider idle (default: 5)
   * @returns True if session has been inactive longer than threshold
   */
  isIdle(idleThresholdMinutes: number = 5): boolean {
    const now = new Date();
    const idleThresholdMs = idleThresholdMinutes * 60 * 1000;
    const timeSinceLastActivity = now.getTime() - this.lastActivity.getTime();
    return timeSinceLastActivity > idleThresholdMs;
  }

  /**
   * Check if session is stale and should be cleaned up
   * @param staleThresholdMinutes - Minutes of inactivity to consider stale (default: 30)
   * @returns True if session should be automatically ended
   */
  isStale(staleThresholdMinutes: number = 30): boolean {
    return this.isIdle(staleThresholdMinutes);
  }

  /**
   * Get session duration in minutes
   * @returns Duration from creation to now (or end time if ended)
   */
  getDurationMinutes(): number {
    const endTime = this.endedAt || new Date();
    const durationMs = endTime.getTime() - this.createdAt.getTime();
    return Math.floor(durationMs / (60 * 1000));
  }

  /**
   * End the session
   * Sets status to ENDED and records end timestamp
   */
  end(): void {
    this.status = SessionStatus.ENDED;
    this.endedAt = new Date();
    this.isEditing = false;
    this.socketId = null;
  }

  /**
   * Mark session as disconnected (temporary state before reconnection or cleanup)
   */
  disconnect(): void {
    this.status = SessionStatus.DISCONNECTED;
    this.socketId = null;
    this.isEditing = false;
  }

  /**
   * Reconnect session with new socket ID
   * @param newSocketId - New WebSocket connection ID
   */
  reconnect(newSocketId: string): void {
    this.status = SessionStatus.ACTIVE;
    this.socketId = newSocketId;
    this.lastActivity = new Date();
  }

  /**
   * Update cursor position
   * @param position - New cursor position
   */
  updateCursor(position: CursorPosition): void {
    this.cursorPosition = position;
    this.lastActivity = new Date();
  }

  /**
   * Update selection range
   * @param range - New selection range
   */
  updateSelection(range: SelectionRange | null): void {
    this.selectionRange = range;
    this.lastActivity = new Date();
  }

  /**
   * Increment edit counter
   */
  incrementEditCount(): void {
    this.editCount++;
    this.lastActivity = new Date();
  }

  /**
   * Increment comment counter
   */
  incrementCommentCount(): void {
    this.commentCount++;
    this.lastActivity = new Date();
  }

  /**
   * Get session summary
   * @returns Human-readable session summary
   */
  getSummary(): string {
    const duration = this.getDurationMinutes();
    return `Session ${this.id.substring(0, 8)} - ${this.status} - ${duration} min - ${this.editCount} edits - ${this.commentCount} comments`;
  }

  /**
   * Convert to plain object (for API responses)
   * @returns Session data as plain object
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      policyId: this.policyId,
      userId: this.userId,
      status: this.status,
      isEditing: this.isEditing,
      cursorPosition: this.cursorPosition,
      selectionRange: this.selectionRange,
      lastActivity: this.lastActivity,
      editCount: this.editCount,
      commentCount: this.commentCount,
      durationMinutes: this.getDurationMinutes(),
      createdAt: this.createdAt,
      endedAt: this.endedAt
    };
  }
}
