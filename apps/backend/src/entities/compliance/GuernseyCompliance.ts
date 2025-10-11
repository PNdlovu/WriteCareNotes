import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Guernsey Compliance Entity
 * @module GuernseyCompliance
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../organization/Organization';

@Entity('guernsey_compliance')
@Index(['organizationId', 'assessmentDate'])
export class GuernseyCompliance {
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

  @Column('var char', { length: 50 })
  rating: string; // outstanding, good, requires_improvement, inadequate

  @Column('jsonb')
  standardsScores: {
    quality_of_life: number;
    safety_wellbeing: number;
    choice_control: number;
    dignity_respect: number;
    skilled_staff: number;
    suitable_environment: number;
    effective_leadership: number;
    community_links: number;
  };

  @Column('jsonb')
  guernseySpecificCompliance: {
    environmental_protection: number;
    cultural_heritage: number;
    community_integration: number;
    sustainability_practices: number;
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
