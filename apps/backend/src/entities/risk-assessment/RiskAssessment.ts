import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum RiskLevel {
  VERY_LOW = 'very_low',    // Score 1-2
  LOW = 'low',              // Score 3-4
  MEDIUM = 'medium',        // Score 5-9
  HIGH = 'high',            // Score 10-15
  VERY_HIGH = 'very_high',  // Score 16-20
  CRITICAL = 'critical'     // Score 21-25
}

export enum RiskCategory {
  CLINICAL = 'clinical',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  REGULATORY = 'regulatory',
  REPUTATIONAL = 'reputational',
  SAFETY = 'safety',
  DATA_PROTECTION = 'data_protection',
  CYBERSECURITY = 'cybersecurity',
  ENVIRONMENTAL = 'environmental',
  STAFF_WELFARE = 'staff_welfare'
}

export enum LikelihoodLevel {
  VERY_UNLIKELY = 1,  // 0-20% chance
  UNLIKELY = 2,       // 21-40% chance
  POSSIBLE = 3,       // 41-60% chance
  LIKELY = 4,         // 61-80% chance
  VERY_LIKELY = 5     // 81-100% chance
}

export enum ConsequenceLevel {
  NEGLIGIBLE = 1,     // Minimal impact
  MINOR = 2,          // Minor impact
  MODERATE = 3,       // Moderate impact
  MAJOR = 4,          // Major impact
  CATASTROPHIC = 5    // Catastrophic impact
}

@Entity('risk_assessments')
export class RiskAssessment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  riskId: string;

  @Column()
  riskName: string;

  @Column({
    type: 'enum',
    enum: RiskCategory
  })
  category: RiskCategory;

  @Column({
    type: 'enum',
    enum: RiskLevel
  })
  riskLevel: RiskLevel;

  @Column('text')
  description: string;

  @Column('jsonb')
  mitigationStrategies: Array<{
    strategy: string;
    effectiveness: number;
    implementationCost: number;
    timeframe: string;
  }>;

  @Column({
    type: 'enum',
    enum: LikelihoodLevel
  })
  likelihood: LikelihoodLevel;

  @Column({
    type: 'enum',
    enum: ConsequenceLevel
  })
  consequence: ConsequenceLevel;

  @Column('int')
  probability: number; // 1-5 (legacy field for backward compatibility)

  @Column('int')
  impact: number; // 1-5 (legacy field for backward compatibility)

  @Column('date')
  assessmentDate: Date;

  @Column('date')
  nextReviewDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  calculateRiskScore(): number {
    // NHS/ICO standard 5x5 matrix calculation
    return this.likelihood * this.consequence;
  }

  calculateLegacyRiskScore(): number {
    // Backward compatibility
    return this.probability * this.impact;
  }

  getRiskLevelFromScore(score: number): RiskLevel {
    // NHS/ICO standard risk level assignment
    if (score >= 21) return RiskLevel.CRITICAL;
    if (score >= 16) return RiskLevel.VERY_HIGH;
    if (score >= 10) return RiskLevel.HIGH;
    if (score >= 5) return RiskLevel.MEDIUM;
    if (score >= 3) return RiskLevel.LOW;
    return RiskLevel.VERY_LOW;
  }

  updateRiskLevel(): void {
    const score = this.calculateRiskScore();
    this.riskLevel = this.getRiskLevelFromScore(score);
  }

  isHighRisk(): boolean {
    return this.riskLevel === RiskLevel.HIGH || 
           this.riskLevel === RiskLevel.VERY_HIGH || 
           this.riskLevel === RiskLevel.CRITICAL;
  }

  isCriticalRisk(): boolean {
    return this.riskLevel === RiskLevel.CRITICAL;
  }

  needsReview(): boolean {
    return new Date() >= this.nextReviewDate;
  }

  getRiskMatrixPosition(): { likelihood: number; consequence: number; score: number } {
    return {
      likelihood: this.likelihood,
      consequence: this.consequence,
      score: this.calculateRiskScore()
    };
  }

  getRiskDescription(): string {
    const descriptions = {
      [RiskLevel.VERY_LOW]: 'Very Low Risk - Minimal impact, acceptable with routine monitoring',
      [RiskLevel.LOW]: 'Low Risk - Minor impact, manageable with standard procedures',
      [RiskLevel.MEDIUM]: 'Medium Risk - Moderate impact, requires specific controls and monitoring',
      [RiskLevel.HIGH]: 'High Risk - Major impact, requires immediate attention and controls',
      [RiskLevel.VERY_HIGH]: 'Very High Risk - Significant impact, requires urgent action and senior management attention',
      [RiskLevel.CRITICAL]: 'Critical Risk - Catastrophic impact, requires immediate action and board-level attention'
    };
    return descriptions[this.riskLevel] || 'Unknown risk level';
  }

  getLikelihoodDescription(): string {
    const descriptions = {
      [LikelihoodLevel.VERY_UNLIKELY]: 'Very Unlikely (0-20%)',
      [LikelihoodLevel.UNLIKELY]: 'Unlikely (21-40%)',
      [LikelihoodLevel.POSSIBLE]: 'Possible (41-60%)',
      [LikelihoodLevel.LIKELY]: 'Likely (61-80%)',
      [LikelihoodLevel.VERY_LIKELY]: 'Very Likely (81-100%)'
    };
    return descriptions[this.likelihood] || 'Unknown likelihood';
  }

  getConsequenceDescription(): string {
    const descriptions = {
      [ConsequenceLevel.NEGLIGIBLE]: 'Negligible - Minimal impact on operations or residents',
      [ConsequenceLevel.MINOR]: 'Minor - Limited impact, easily managed',
      [ConsequenceLevel.MODERATE]: 'Moderate - Noticeable impact, requires management attention',
      [ConsequenceLevel.MAJOR]: 'Major - Significant impact, requires immediate action',
      [ConsequenceLevel.CATASTROPHIC]: 'Catastrophic - Severe impact, threatens operations or resident safety'
    };
    return descriptions[this.consequence] || 'Unknown consequence';
  }
}
