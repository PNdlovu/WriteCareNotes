import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Jersey Compliance Entity
 * @module JerseyCompliance
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../organization/Organization';

@Entity('jersey_compliance')
@Index(['organizationId', 'assessmentDate'])
export class JerseyCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column('timestamp')
  assessmentDate: Date;

  @Column('decimal', { precision: 5, scale: 2 })
  overallScore: number;

  @Column('varchar', { length: 50 })
  rating: string; // excellent, good, satisfactory, requires_improvement, inadequate

  @Column('jsonb')
  careStandardsScores: {
    person_centred_care: number;
    safeguarding: number;
    medication_management: number;
    infection_control: number;
    health_safety: number;
    staff_training: number;
    complaints_procedures: number;
    quality_assurance: number;
  };

  @Column('text', { array: true, default: [] })
  complianceGaps: string[];

  @Column('text', { array: true, default: [] })
  recommendations: string[];

  @Column('timestamp', { nullable: true })
  lastInspection: Date;

  @Column('timestamp', { nullable: true })
  nextInspection: Date;

  @Column('text', { nullable: true })
  inspectionNotes: string;

  @Column('uuid', { nullable: true })
  assessedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}