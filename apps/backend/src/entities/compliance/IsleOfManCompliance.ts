import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Isle of Man Compliance Entity
 * @module IsleOfManCompliance
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../organization/Organization';

@Entity('isle_of_man_compliance')
@Index(['organizationId', 'assessmentDate'])
export class IsleOfManCompliance {
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
    health_wellbeing: number;
    safety_protection: number;
    independence_choice: number;
    dignity_respect: number;
    skilled_workforce: number;
    leadership_governance: number;
    manx_heritage: number;
  };

  @Column('jsonb')
  manxCulturalCompliance: {
    manx_gaelic_support: number;
    traditional_events: number;
    local_heritage: number;
    community_integration: number;
    traditional_foods: number;
  };

  @Column('decimal', { precision: 5, scale: 2 })
  communityIntegrationScore: number;

  @Column('text', { array: true, default: [] })
  complianceGaps: string[];

  @Column('text', { array: true, default: [] })
  recommendations: string[];

  @Column('text', { array: true, default: [] })
  manxSpecificRecommendations: string[];

  @Column('timestamp', { nullable: true })
  lastInspection: Date;

  @Column('timestamp', { nullable: true })
  nextInspection: Date;

  @Column('text', { nullable: true })
  inspectionNotes: string;

  @Column('text', { nullable: true })
  manxCulturalNotes: string;

  @Column('uuid', { nullable: true })
  assessedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}