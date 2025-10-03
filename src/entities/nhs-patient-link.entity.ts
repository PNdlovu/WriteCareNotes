import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Resident } from './resident.entity';

/**
 * NHS Patient Link Entity
 * 
 * Links care home residents to their NHS records for seamless data exchange
 * Critical for GP Connect integration and DSCR compliance
 */
@Entity('nhs_patient_links')
export class NHSPatientLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resident_id', type: 'uuid', nullable: true })
  residentId: string;

  @ManyToOne(() => Resident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resident_id' })
  resident: Resident;

  @Column({ name: 'nhs_number', type: 'varchar', length: 10, unique: true })
  nhsNumber: string;

  @Column({ name: 'gp_practice_code', type: 'varchar', length: 6, nullable: true })
  gpPracticeCode: string;

  @Column({ name: 'gp_practice_name', type: 'varchar', length: 255, nullable: true })
  gpPracticeName: string;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ 
    name: 'sync_status', 
    type: 'enum', 
    enum: ['pending', 'success', 'failed', 'expired'],
    default: 'pending'
  })
  syncStatus: string;

  @Column({ name: 'sync_error_message', type: 'text', nullable: true })
  syncErrorMessage: string;

  @Column({ name: 'consent_status', type: 'varchar', length: 20, default: 'pending' })
  consentStatus: string;

  @Column({ name: 'consent_date', type: 'timestamp', nullable: true })
  consentDate: Date;

  @Column({ name: 'data_sharing_agreement', type: 'boolean', default: false })
  dataSharingAgreement: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}