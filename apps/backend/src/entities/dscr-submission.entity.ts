import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * DSCR Submission Entity
 * 
 * Tracks Digital Social Care Records submissions to NHS Digital
 * Essential for compliance monitoring and audit trails
 */
@Entity('dscr_submissions')
export class DSCRSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'submission_id', type: 'var char', length: 255, unique: true })
  submissionId: string;

  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId: string;

  @Column({ name: 'submission_date', type: 'timestamp' })
  submissionDate: Date;

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: ['pending', 'submitted', 'accepted', 'rejected', 'failed'],
    default: 'pending'
  })
  status: string;

  @Column({ name: 'data_hash', type: 'var char', length: 64 })
  dataHash: string;

  @Column({ name: 'record_count', type: 'integer', default: 0 })
  recordCount: number;

  @Column({ name: 'submission_type', type: 'var char', length: 50 })
  submissionType: string;

  @Column({ name: 'nhs_response', type: 'jsonb', nullable: true })
  nhsResponse: any;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
