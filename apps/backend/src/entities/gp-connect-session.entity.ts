import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * GP Connect Session Entity
 * 
 * Stores OAuth2 authentication sessions for GP Connect API access
 * Ensures secure and compliant access to NHS patient data
 */
@Entity('gp_connect_sessions')
export class GPConnectSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string;

  @Column({ name: 'token_type', type: 'var char', length: 50, default: 'Bearer' })
  tokenType: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'scope', type: 'simple-array' })
  scope: string[];

  @Column({ name: 'client_id', type: 'var char', length: 255 })
  clientId: string;

  @Column({ name: 'session_state', type: 'var char', length: 255, nullable: true })
  sessionState: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
