import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview AI Agent Session Entity
 * @module AIAgentSession
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Entity for tracking AI agent sessions with tenant isolation
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type SessionType = 'PUBLIC' | 'TENANT';
export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'ESCALATED';

@Entity('ai_agent_sessions')
@Index(['tenantId', 'userId'])
@Index(['sessionType', 'createdAt'])
@Index(['expiresAt'])
export class AIAgentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false
  })
  sessionType: SessionType;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'NULL for public sessions'
  })
  tenantId: string | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'NULL for anonymous public sessions'
  })
  userId: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVE'
  })
  status: SessionStatus;

  @Column({
    type: 'jsonb',
    nullable: false,
    default: '{}'
  })
  sessionData: {
    userPreferences?: any;
    conversationHistory?: any[];
    securityContext?: any;
    performanceMetrics?: any;
    escalationHistory?: any[];
  };

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true
  })
  userRole: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'STANDARD'
  })
  confidentialityLevel: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true
  })
  encryptionKeyId: string | null;

  @Column({
    type: 'inet',
    nullable: true
  })
  ipAddress: string | null;

  @Column({
    type: 'text',
    nullable: true
  })
  userAgent: string | null;

  @Column({
    type: 'integer',
    default: 0
  })
  interactionCount: number;

  @Column({
    type: 'integer',
    default: 0
  })
  securityViolationCount: number;

  @Column({
    type: 'boolean',
    default: false
  })
  escalationRequired: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: false
  })
  expiresAt: Date;

  @Column({
    type: 'boolean',
    default: true
  })
  isActive: boolean;

  /**
   * Check if session is valid and not expired
   */
  isValid(): boolean {
    return this.isActive && 
           this.status === 'ACTIVE' && 
           this.expiresAt > new Date();
  }

  /**
   * Check if session requires tenant isolation
   */
  requiresTenantIsolation(): boolean {
    return this.sessionType === 'TENANT' && this.tenantId !== null;
  }

  /**
   * Get session duration in minutes
   */
  getSessionDuration(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
  }

  /**
   * Increment interaction count
   */
  incrementInteractions(): void {
    this.interactionCount += 1;
    this.updatedAt = new Date();
  }

  /**
   * Add security violation
   */
  addSecurityViolation(): void {
    this.securityViolationCount += 1;
    this.updatedAt = new Date();
    
    // Terminate session if too many violations
    if (this.securityViolationCount >= 3) {
      this.status = 'TERMINATED';
      this.isActive = false;
    }
  }

  /**
   * Mark session for escalation
   */
  markForEscalation(): void {
    this.escalationRequired = true;
    this.status = 'ESCALATED';
    this.updatedAt = new Date();
  }

  /**
   * Extend session expiry
   */
  extendSession(minutes: number = 30): void {
    this.expiresAt = new Date(Date.now() + (minutes * 60 * 1000));
    this.updatedAt = new Date();
  }

  /**
   * Terminate session
   */
  terminate(): void {
    this.status = 'TERMINATED';
    this.isActive = false;
    this.updatedAt = new Date();
  }
}

export default AIAgentSession;