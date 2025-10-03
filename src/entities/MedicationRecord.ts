import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Record Entity for WriteCareNotes
 * @module MedicationRecordEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Medication record entity with safety protocols and audit trails.
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Resident } from './Resident';

@Entity('wcn_medication_records')
export class MedicationRecord extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  medicationName!: string;

  @Column({ type: 'text', nullable: true })
  dosage?: string;

  @Column({ type: 'text', nullable: true })
  frequency?: string;

  @Column({ type: 'timestamp' })
  prescribedDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  administeredDate?: Date;

  @Column({ type: 'boolean', default: false })
  isAdministered!: boolean;

  @ManyToOne(() => Resident, resident => resident.medications)
  @JoinColumn({ name: 'resident_id' })
  resident!: Resident;
}

export default MedicationRecord;