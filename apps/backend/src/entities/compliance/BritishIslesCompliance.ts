import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview British Isles Compliance Entity
 * @module BritishIslesCompliance
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity for tracking compliance across all British Isles jurisdictions
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../organization/Organization';

@Entity('british_isles_compliance')
@Index(['organizationId', 'assessmentDate'])
export class BritishIslesCompliance {
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

  @Column('jsonb')
  jurisdictionData: {
    england?: {
      regulatoryBody: string;
      overallScore: number;
      rating: string;
      domainScores: Record<string, number>;
      complianceGaps: string[];
      recommendations: string[];
      nextInspection?: Date;
      lastInspection?: Date;
    };
    scotland?: {
      regulatoryBody: string;
      overallScore: number;
      rating: string;
      domainScores: Record<string, number>;
      complianceGaps: string[];
      recommendations: string[];
      nextInspection?: Date;
      lastInspection?: Date;
    };
    wales?: {
      regulatoryBody: string;
      overallScore: number;
      rating: string;
      domainScores: Record<string, number>;
      complianceGaps: string[];
      recommendations: string[];
      nextInspection?: Date;
      lastInspection?: Date;
    };
    northern_ireland?: {
      regulatoryBody: string;
      overallScore: number;
      rating: string;
      domainScores: Record<string, number>;
      complianceGaps: string[];
      recommendations: string[];
      nextInspection?: Date;
      lastInspection?: Date;
    };
    jersey?: {
      regulatoryBody: string;
      overallScore: number;
      rating: string;
      domainScores: Record<string, number>;
      complianceGaps: string[];
      recommendations: string[];
      nextInspection?: Date;
      lastInspection?: Date;
    };
    guernsey?: {
      regulatoryBody: string;
      overallScore: number;
      rating: string;
      domainScores: Record<string, number>;
      complianceGaps: string[];
      recommendations: string[];
      nextInspection?: Date;
      lastInspection?: Date;
    };
    isle_of_man?: {
      regulatoryBody: string;
      overallScore: number;
      rating: string;
      domainScores: Record<string, number>;
      complianceGaps: string[];
      recommendations: string[];
      nextInspection?: Date;
      lastInspection?: Date;
    };
  };

  @Column('text', { array: true, default: [] })
  crossJurisdictionalRisks: string[];

  @Column('text', { array: true, default: [] })
  recommendations: string[];

  @Column('jsonb')
  harmonizedMetrics: {
    safeguardingScore: number;
    medicationSafetyScore: number;
    infectionControlScore: number;
    personCentredCareScore: number;
    staffCompetencyScore: number;
    qualityAssuranceScore: number;
  };

  @Column('jsonb')
  jurisdictionSpecificMetrics: {
    england?: { cqcDomains: Record<string, number> };
    scotland?: { qualityIndicators: Record<string, number> };
    wales?: { qualityAreas: Record<string, number> };
    northern_ireland?: { standards: Record<string, number> };
    jersey?: { careStandards: Record<string, number> };
    guernsey?: { standardsFramework: Record<string, number> };
    isle_of_man?: { 
      careStandards: Record<string, number>;
      manxCultural: Record<string, number>;
      communityIntegration: number;
    };
  };

  @Column('text', { nullable: true })
  assessmentNotes: string;

  @Column('uuid', { nullable: true })
  assessedBy: string;

  @Column('timestamp', { nullable: true })
  nextReviewDate: Date;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}