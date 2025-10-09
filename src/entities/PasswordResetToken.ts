/**
 * @fileoverview Password Reset Token Entity
 * @module Entities/PasswordResetToken
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description
 * Entity for storing password reset tokens.
 * Implements security best practices:
 * - Tokens are hashed before storage
 * - Tokens expire after 1 hour
 * - Tokens can only be used once
 * - Old tokens are invalidated on new request
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

@Entity('password_reset_tokens')
@Index(['userId'])
@Index(['token'])
@Index(['expiresAt'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'token', length: 255 })
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'used', default: false })
  used: boolean;

  @Column({ name: 'used_at', nullable: true })
  usedAt?: Date;

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
