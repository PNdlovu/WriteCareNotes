import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Record Entity for WriteCareNotes
 * @module CareRecordEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Care record entity for tracking resident care activities.
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Resident } from './Resident';

@Entity('wcn_care_records')
export class CareRecord extends BaseEntity {
  @Column({ type: 'var char', length: 255 })
  careType!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'timestamp' })
  careDate!: Date;

  @Column({ type: 'var char', length: 255, nullable: true })
  caregiverName?: string;

  @ManyToOne(() => Resident, resident => resident.careRecords)
  @JoinColumn({ name: 'resident_id' })
  resident!: Resident;
}

export default CareRecord;
