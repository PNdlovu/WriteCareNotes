/**
 * @fileoverview Refresh Token Entity
 * @module Entities/Auth/RefreshToken
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Refresh token storage for secure token rotation
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

export enum RefreshTokenStatus {
  ACTIVE = 'active',
  USED = 'used',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('refresh_tokens')
@Index(['userId', 'status'])
@Index(['token'])
@Index(['expiresAt'])
@Index(['parentTokenId'])
export class RefreshToken {
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
    enum: RefreshTokenStatus,
    default: RefreshTokenStatus.ACTIVE,
  })
  status!: RefreshTokenStatus;

  @Column({ name: 'parent_token_id', nullable: true })
  parentTokenId?: string;

  @Column({ name: 'family_id' })
  familyId!: string;

  @Column({ name: 'rotation_count', default: 0 })
  rotationCount!: number;

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

  @ManyToOne(() => RefreshToken, { nullable: true })
  @JoinColumn({ name: 'parent_token_id' })
  parentToken?: RefreshToken;

  // Business logic methods
  isActive(): boolean {
    return (
      this.status === RefreshTokenStatus.ACTIVE &&
      this.expiresAt > new Date() &&
      !this.usedAt &&
      !this.revokedAt
    );
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  isRevoked(): boolean {
    return this.status === RefreshTokenStatus.REVOKED || !!this.revokedAt;
  }

  isUsed(): boolean {
    return this.status === RefreshTokenStatus.USED || !!this.usedAt;
  }

  markAsUsed(): void {
    this.status = RefreshTokenStatus.USED;
    this.usedAt = new Date();
  }

  revoke(reason: string, revokedBy?: string): void {
    this.status = RefreshTokenStatus.REVOKED;
    this.revokedAt = new Date();
    this.revocationReason = reason;
    if (revokedBy) {
      this.revokedBy = revokedBy;
    }
  }

  getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  getRemainingDays(): number {
    return Math.floor(this.getRemainingTime() / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if token rotation is suspicious (too many rotations in short time)
   */
  isSuspiciousRotation(): boolean {
    const MAX_ROTATIONS = 10;
    return this.rotationCount > MAX_ROTATIONS;
  }
}
