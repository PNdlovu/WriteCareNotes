/**
 * @fileoverview Password Reset Token Entity
 * @module Entities/Auth/PasswordReset
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Password reset token tracking for secure password recovery
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../User';

export enum PasswordResetStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('password_resets')
@Index(['userId', 'status'])
@Index(['token'])
@Index(['expiresAt'])
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ name: 'token_hash' })
  tokenHash!: string;

  @Column({
    type: 'enum',
    enum: PasswordResetStatus,
    default: PasswordResetStatus.PENDING,
  })
  status!: PasswordResetStatus;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ name: 'used_at', nullable: true })
  usedAt?: Date;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Business logic methods
  isValid(): boolean {
    return (
      this.status === PasswordResetStatus.PENDING &&
      this.expiresAt > new Date() &&
      !this.usedAt &&
      !this.revokedAt
    );
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  isRevoked(): boolean {
    return this.status === PasswordResetStatus.REVOKED || !!this.revokedAt;
  }

  isUsed(): boolean {
    return this.status === PasswordResetStatus.USED || !!this.usedAt;
  }

  markAsUsed(): void {
    this.status = PasswordResetStatus.USED;
    this.usedAt = new Date();
  }

  revoke(): void {
    this.status = PasswordResetStatus.REVOKED;
    this.revokedAt = new Date();
  }

  getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  getRemainingMinutes(): number {
    return Math.floor(this.getRemainingTime() / 60000);
  }
}
