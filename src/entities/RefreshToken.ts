/**
 * @fileoverview Refresh Token Entity
 * @module Entities/RefreshToken
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description
 * Entity for storing JWT refresh tokens.
 * Supports token rotation, revocation, and expiry management.
 * Implements security best practices for token storage.
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
import { User } from './User';

@Entity('refresh_tokens')
@Index(['userId'])
@Index(['token'])
@Index(['expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'token', length: 500 })
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'revoked_by', nullable: true })
  revokedBy?: string;

  @Column({ name: 'revocation_reason', length: 255, nullable: true })
  revocationReason?: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
