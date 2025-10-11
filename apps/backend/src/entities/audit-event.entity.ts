/**
 * @fileoverview Audit Event Entity
 * @description Entity model for immutable audit trail of policy events
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-06
 * @lastModified 2025-10-06
 * 
 * @compliance
 * - GDPR Article 5 (Data minimization)
 * - ISO 27001 (Information Security)
 * - Immutable audit trail requirements
 * - Regulatory compliance logging
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from 'typeorm';

/**
 * Event types for audit logging
 */
export enum AuditEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  SUBMITTED_FOR_REVIEW = 'submitted_for_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ACKNOWLEDGED = 'acknowledged',
  ENFORCED = 'enforced',
  POLICY_ENFORCED = 'policy_enforced',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
  CREATED_FROM_TEMPLATE = 'created_from_template',
  IMPORT_STARTED = 'import_started',
  IMPORT_COMPLETED = 'import_completed',
  IMPORT_FAILED = 'import_failed',
  TRAINING_COMPLETED = 'training_completed',
  VIOLATION_DETECTED = 'violation_detected'
}

/**
 * AuditEvent Entity
 * 
 * Provides immutable audit trail for all policy-related events
 * supporting regulatory compliance and forensic analysis.
 */
@Entity('audit_events')
@Index(['policyId', 'timestamp'])
@Index(['actorId', 'timestamp'])
@Index(['eventType', 'timestamp'])
@Index(['timestamp'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Policy ID (nullable for system-wide events)
   */
  @Column({ type: 'uuid', nullable: true })
  @Index()
  policyId?: string;

  /**
   * Type of event that occurred
   */
  @Column({
    type: 'enum',
    enum: AuditEventType
  })
  @Index()
  eventType: AuditEventType;

  /**
   * User ID who performed the action
   */
  @Column({ type: 'uuid' })
  @Index()
  actorId: string;

  /**
   * Organization ID for multi-tenant isolation
   */
  @Column({ type: 'uuid', nullable: true })
  @Index()
  organizationId?: string;

  /**
   * Timestamp when event occurred
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  timestamp: Date;

  /**
   * Additional metadata about the event
   */
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  /**
   * IP address of the actor (for security auditing)
   */
  @Column({ type: 'var char', length: 45, nullable: true })
  ipAddress?: string;

  /**
   * User agent of the actor (for security auditing)
   */
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  /**
   * Session ID (for tracking user sessions)
   */
  @Column({ type: 'var char', length: 255, nullable: true })
  sessionId?: string;

  /**
   * Request ID for tracing distributed operations
   */
  @Column({ type: 'var char', length: 255, nullable: true })
  requestId?: string;

  /**
   * Correlation ID for tracking related events
   */
  @Column({ type: 'var char', length: 255, nullable: true })
  correlationId?: string;

  /**
   * Severity level of the event
   */
  @Column({ 
    type: 'enum', 
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  })
  severity: 'info' | 'warning' | 'error' | 'critical';

  /**
   * Human-readable description of the event
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * System or module that generated the event
   */
  @Column({ type: 'var char', length: 100, default: 'policy_authoring' })
  source: string;

  /**
   * Whether this event requires follow-up action
   */
  @Column({ type: 'boolean', default: false })
  requiresAction: boolean;

  /**
   * When the event was created (immutable)
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Get event summary for dashboards
   */
  getSummary(): string {
    const actor = this.metadata.actorName || this.actorId;
    const policy = this.metadata.policyTitle || this.policyId;
    
    switch (this.eventType) {
      case AuditEventType.CREATED:
        return `${actor} created policy "${policy}"`;
      case AuditEventType.SUBMITTED_FOR_REVIEW:
        return `${actor} submitted "${policy}" for review`;
      case AuditEventType.APPROVED:
        return `${actor} approved policy "${policy}"`;
      case AuditEventType.PUBLISHED:
        return `${actor} published policy "${policy}"`;
      case AuditEventType.ACKNOWLEDGED:
        return `${actor} acknowledged policy "${policy}"`;
      default:
        return `${actor} performed ${this.eventType} on "${policy}"`;
    }
  }

  /**
   * Check if event is security-related
   */
  isSecurityEvent(): boolean {
    const securityEvents = [
      AuditEventType.VIOLATION_DETECTED,
      AuditEventType.ENFORCED
    ];
    return securityEvents.includes(this.eventType) || this.severity === 'critical';
  }

  /**
   * Check if event requires regulatory reporting
   */
  requiresRegulatoryReporting(): boolean {
    const reportableEvents = [
      AuditEventType.PUBLISHED,
      AuditEventType.EXPIRED,
      AuditEventType.VIOLATION_DETECTED
    ];
    return reportableEvents.includes(this.eventType);
  }

  /**
   * Get time since event occurred
   */
  getTimeAgo(): string {
    const now = new Date();
    const diff = now.getTime() - this.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Get event metadata for API responses
   */
  getMetadata() {
    return {
      id: this.id,
      policyId: this.policyId,
      eventType: this.eventType,
      actorId: this.actorId,
      organizationId: this.organizationId,
      timestamp: this.timestamp,
      severity: this.severity,
      description: this.description,
      source: this.source,
      requiresAction: this.requiresAction,
      summary: this.getSummary(),
      timeAgo: this.getTimeAgo(),
      isSecurityEvent: this.isSecurityEvent(),
      requiresRegulatoryReporting: this.requiresRegulatoryReporting(),
      metadata: this.metadata,
      createdAt: this.createdAt
    };
  }

  /**
   * Validate event data integrity
   */
  validateIntegrity(): boolean {
    // Check required fields
    if (!this.eventType || !this.actorId || !this.timestamp) {
      return false;
    }

    // Check timestamp is not in future
    if (this.timestamp > new Date()) {
      return false;
    }

    // Check metadata is valid JSON
    try {
      JSON.stringify(this.metadata);
      return true;
    } catch {
      return false;
    }
  }
}
