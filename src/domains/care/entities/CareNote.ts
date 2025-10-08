/**
 * @fileoverview Care Note Entity (Stub)
 * @module Entities/CareNote
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Resident } from './Resident';

@Entity('care_notes')
export class CareNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residentId!: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident!: Resident;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  noteType?: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}

export default CareNote;
