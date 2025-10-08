/**
 * @fileoverview Session Entity
 * @module Entities/Auth/Session
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description User session tracking for security and audit
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../User';

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  LOGOUT = 'logout',
}

@Entity('sessions')
@Index(['userId', 'status'])
@Index(['refreshToken'])
@Index(['expiresAt'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'refresh_token', unique: true })
  refreshToken!: string;

  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash!: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status!: SessionStatus;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    platform?: string;
  };

  @Column({ name: 'location', type: 'jsonb', nullable: true })
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };

  @Column({ name: 'last_activity' })
  lastActivity!: Date;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'revoked_by', nullable: true })
  revokedBy?: string;

  @Column({ name: 'revocation_reason', length: 255, nullable: true })
  revocationReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Business logic methods
  isActive(): boolean {
    return (
      this.status === SessionStatus.ACTIVE &&
      this.expiresAt > new Date() &&
      !this.revokedAt
    );
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  isRevoked(): boolean {
    return this.status === SessionStatus.REVOKED || !!this.revokedAt;
  }

  revoke(reason: string, revokedBy?: string): void {
    this.status = SessionStatus.REVOKED;
    this.revokedAt = new Date();
    this.revocationReason = reason;
    if (revokedBy) {
      this.revokedBy = revokedBy;
    }
  }

  updateActivity(): void {
    this.lastActivity = new Date();
  }

  getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  getRemainingTimeInMinutes(): number {
    return Math.floor(this.getRemainingTime() / 60000);
  }
}
