import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Risk Assessment Entity for WriteCareNotes
 * @module RiskAssessmentEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Risk assessment entity for resident safety management.
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Resident } from './Resident';

@Entity('wcn_risk_assessments')
export class RiskAssessment extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  riskType!: string;

  @Column({ type: 'varchar', length: 50 })
  riskLevel!: string; // LOW, MEDIUM, HIGH, CRITICAL

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  mitigationPlan?: string;

  @Column({ type: 'timestamp' })
  assessmentDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewDate?: Date;

  @ManyToOne(() => Resident, resident => resident.riskAssessments)
  @JoinColumn({ name: 'resident_id' })
  resident!: Resident;
}

export default RiskAssessment;