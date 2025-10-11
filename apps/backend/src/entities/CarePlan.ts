import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Plan Entity for WriteCareNotes
 * @module CarePlanEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Care plan entity for structured resident care planning.
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Resident } from './Resident';

@Entity('wcn_care_plans')
export class CarePlan extends BaseEntity {
  @Column({ type: 'var char', length: 255 })
  planName!: string;

  @Column({ type: 'text' })
  objectives!: string;

  @Column({ type: 'text' })
  interventions!: string;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ type: 'var char', length: 50, default: 'ACTIVE' })
  status!: string; // ACTIVE, COMPLETED, CANCELLED

  @ManyToOne(() => Resident, resident => resident.carePlans)
  @JoinColumn({ name: 'resident_id' })
  resident!: Resident;
}

export default CarePlan;
