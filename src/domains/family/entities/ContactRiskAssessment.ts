/**
 * ============================================================================
 * Contact Risk Assessment Entity
 * ============================================================================
 * 
 * @fileoverview Risk assessment entity for evaluating risks associated with
 *               family contact arrangements for looked after children.
 * 
 * @module domains/family/entities/ContactRiskAssessment
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Comprehensive risk assessment for family contact including child protection
 * concerns, family member risks, venue safety, supervision requirements, and
 * mitigation strategies. Essential for maintaining child safety while promoting
 * appropriate family connections.
 * 
 * @compliance
 * - OFSTED Regulation 12 (Protection of children)
 * - Working Together to Safeguard Children 2018
 * - Children Act 1989, Section 22(3)(a) - Child's welfare paramount
 * - Statutory Guidance on Court Orders and Pre-proceedings
 * - GDPR 2018 - Data protection for sensitive information
 * 
 * @features
 * - Multi-dimensional risk assessment
 * - Risk scoring and categorization
 * - Mitigation strategy planning
 * - Review scheduling
 * - Historical risk tracking
 * - Evidence-based decision making
 * - Professional judgment recording
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Child } from '../../children/entities/Child';
import { FamilyMember } from './FamilyMember';
import { Organization } from '../../../entities/Organization';

/**
 * Overall risk level
 */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Risk assessment status
 */
export enum RiskAssessmentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EXPIRED = 'EXPIRED'
}

/**
 * Risk category
 */
export enum RiskCategory {
  PHYSICAL_HARM = 'PHYSICAL_HARM',
  EMOTIONAL_HARM = 'EMOTIONAL_HARM',
  SEXUAL_ABUSE = 'SEXUAL_ABUSE',
  NEGLECT = 'NEGLECT',
  ABDUCTION = 'ABDUCTION',
  EXPOSURE_TO_HARM = 'EXPOSURE_TO_HARM',
  DOMESTIC_VIOLENCE = 'DOMESTIC_VIOLENCE',
  SUBSTANCE_MISUSE = 'SUBSTANCE_MISUSE',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  CRIMINAL_ACTIVITY = 'CRIMINAL_ACTIVITY',
  RADICALIZATION = 'RADICALIZATION',
  CHILD_EXPLOITATION = 'CHILD_EXPLOITATION'
}

@Entity('contact_risk_assessments')
@Index(['childId', 'assessmentDate'])
@Index(['familyMemberId', 'overallRiskLevel'])
@Index(['status', 'nextReviewDate'])
export class ContactRiskAssessment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ========================================
  // CORE IDENTIFICATION
  // ========================================

  @Column({ name: 'assessment_number', length: 50, unique: true })
  assessmentNumber!: string;

  @Column({ name: 'child_id', type: 'uuid' })
  childId!: string;

  @Column({ name: 'family_member_id', type: 'uuid' })
  familyMemberId!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  // ========================================
  // ASSESSMENT DETAILS
  // ========================================

  @Column({ name: 'assessment_date', type: 'date' })
  assessmentDate!: Date;

  @Column({ name: 'assessment_type', type: 'varchar', length: 100 })
  assessmentType!: string;

  @Column({ name: 'status', type: 'enum', enum: RiskAssessmentStatus, default: RiskAssessmentStatus.DRAFT })
  status!: RiskAssessmentStatus;

  @Column({ name: 'assessed_by_name', type: 'varchar', length: 200 })
  assessedByName!: string;

  @Column({ name: 'assessed_by_role', type: 'varchar', length: 100 })
  assessedByRole!: string;

  @Column({ name: 'assessed_by_organization', type: 'varchar', length: 200, nullable: true })
  assessedByOrganization?: string;

  // ========================================
  // OVERALL RISK ASSESSMENT
  // ========================================

  @Column({ name: 'overall_risk_level', type: 'enum', enum: RiskLevel })
  overallRiskLevel!: RiskLevel;

  @Column({ name: 'overall_risk_score', type: 'int', nullable: true })
  overallRiskScore?: number;

  @Column({ name: 'risk_summary', type: 'text' })
  riskSummary!: string;

  @Column({ name: 'key_concerns', type: 'text' })
  keyConcerns!: string;

  @Column({ name: 'protective_factors', type: 'text', nullable: true })
  protectiveFactors?: string;

  // ========================================
  // SPECIFIC RISK CATEGORIES
  // ========================================

  @Column({ name: 'identified_risks', type: 'jsonb' })
  identifiedRisks!: {
    category: RiskCategory;
    riskLevel: RiskLevel;
    description: string;
    evidence: string;
    likelihood: 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'HIGHLY_LIKELY';
    impact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'SEVERE';
    mitigationRequired: boolean;
  }[];

  // ========================================
  // CHILD-SPECIFIC FACTORS
  // ========================================

  @Column({ name: 'child_age_consideration', type: 'text', nullable: true })
  childAgeConsideration?: string;

  @Column({ name: 'child_vulnerabilities', type: 'text', nullable: true })
  childVulnerabilities?: string;

  @Column({ name: 'child_previous_trauma', type: 'text', nullable: true })
  childPreviousTrauma?: string;

  @Column({ name: 'child_emotional_wellbeing', type: 'text', nullable: true })
  childEmotionalWellbeing?: string;

  @Column({ name: 'child_wishes_considered', type: 'boolean', default: false })
  childWishesConsidered!: boolean;

  @Column({ name: 'child_wishes_summary', type: 'text', nullable: true })
  childWishesSummary?: string;

  @Column({ name: 'gillick_competence_assessed', type: 'boolean', default: false })
  gillickCompetenceAssessed!: boolean;

  @Column({ name: 'gillick_competent', type: 'boolean', nullable: true })
  gillickCompetent?: boolean;

  // ========================================
  // FAMILY MEMBER FACTORS
  // ========================================

  @Column({ name: 'family_member_history', type: 'text', nullable: true })
  familyMemberHistory?: string;

  @Column({ name: 'previous_concerns', type: 'text', nullable: true })
  previousConcerns?: string;

  @Column({ name: 'criminal_history_relevant', type: 'boolean', default: false })
  criminalHistoryRelevant!: boolean;

  @Column({ name: 'criminal_history_details', type: 'text', nullable: true })
  criminalHistoryDetails?: string;

  @Column({ name: 'substance_misuse_concerns', type: 'boolean', default: false })
  substanceMisuseConcerns!: boolean;

  @Column({ name: 'substance_misuse_details', type: 'text', nullable: true })
  substanceMisuseDetails?: string;

  @Column({ name: 'mental_health_concerns', type: 'boolean', default: false })
  mentalHealthConcerns!: boolean;

  @Column({ name: 'mental_health_details', type: 'text', nullable: true })
  mentalHealthDetails?: string;

  @Column({ name: 'domestic_violence_history', type: 'boolean', default: false })
  domesticViolenceHistory!: boolean;

  @Column({ name: 'domestic_violence_details', type: 'text', nullable: true })
  domesticViolenceDetails?: string;

  @Column({ name: 'compliance_with_conditions', type: 'varchar', length: 50, nullable: true })
  complianceWithConditions?: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'POOR' | 'NON_COMPLIANT';

  // ========================================
  // ENVIRONMENTAL FACTORS
  // ========================================

  @Column({ name: 'venue_safety_assessed', type: 'boolean', default: false })
  venueSafetyAssessed!: boolean;

  @Column({ name: 'venue_safety_concerns', type: 'text', nullable: true })
  venueSafetyConcerns?: string;

  @Column({ name: 'other_household_members', type: 'jsonb', nullable: true })
  otherHouseholdMembers?: {
    name: string;
    relationship: string;
    age?: number;
    riskLevel: RiskLevel;
    concerns?: string;
  }[];

  @Column({ name: 'neighbourhood_safety', type: 'varchar', length: 50, nullable: true })
  neighbourhoodSafety?: 'SAFE' | 'MODERATE_CONCERN' | 'HIGH_CONCERN';

  // ========================================
  // PREVIOUS CONTACT ANALYSIS
  // ========================================

  @Column({ name: 'previous_contact_reviewed', type: 'boolean', default: false })
  previousContactReviewed!: boolean;

  @Column({ name: 'previous_contact_summary', type: 'text', nullable: true })
  previousContactSummary?: string;

  @Column({ name: 'previous_incidents', type: 'jsonb', nullable: true })
  previousIncidents?: {
    date: Date;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    actionTaken: string;
  }[];

  @Column({ name: 'contact_patterns', type: 'text', nullable: true })
  contactPatterns?: string;

  // ========================================
  // MITIGATION STRATEGIES
  // ========================================

  @Column({ name: 'mitigation_strategies', type: 'jsonb' })
  mitigationStrategies!: {
    strategy: string;
    targetRisk: RiskCategory;
    implementation: string;
    responsiblePerson: string;
    effectivenessRating?: 'VERY_EFFECTIVE' | 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE';
  }[];

  @Column({ name: 'supervision_recommendation', type: 'varchar', length: 100 })
  supervisionRecommendation!: string;

  @Column({ name: 'supervision_rationale', type: 'text' })
  supervisionRationale!: string;

  @Column({ name: 'contact_frequency_recommendation', type: 'varchar', length: 100, nullable: true })
  contactFrequencyRecommendation?: string;

  @Column({ name: 'contact_duration_recommendation', type: 'int', nullable: true })
  contactDurationRecommendation?: number;

  @Column({ name: 'venue_recommendation', type: 'text', nullable: true })
  venueRecommendation?: string;

  @Column({ name: 'conditions_for_contact', type: 'jsonb', nullable: true })
  conditionsForContact?: {
    condition: string;
    mandatory: boolean;
    rationale: string;
  }[];

  // ========================================
  // PROFESSIONAL CONSULTATION
  // ========================================

  @Column({ name: 'professionals_consulted', type: 'jsonb', nullable: true })
  professionalsConsulted?: {
    name: string;
    role: string;
    organization: string;
    dateConsulted: Date;
    advice: string;
  }[];

  @Column({ name: 'multi_agency_input', type: 'boolean', default: false })
  multiAgencyInput!: boolean;

  @Column({ name: 'legal_advice_sought', type: 'boolean', default: false })
  legalAdviceSought!: boolean;

  @Column({ name: 'legal_advice_summary', type: 'text', nullable: true })
  legalAdviceSummary?: string;

  // ========================================
  // COURT ORDERS & LEGAL FRAMEWORK
  // ========================================

  @Column({ name: 'court_orders_considered', type: 'boolean', default: false })
  courtOrdersConsidered!: boolean;

  @Column({ name: 'court_order_details', type: 'text', nullable: true })
  courtOrderDetails?: string;

  @Column({ name: 'legal_restrictions', type: 'text', nullable: true })
  legalRestrictions?: string;

  @Column({ name: 'parental_responsibility_impact', type: 'text', nullable: true })
  parentalResponsibilityImpact?: string;

  // ========================================
  // RECOMMENDATIONS & DECISIONS
  // ========================================

  @Column({ name: 'contact_recommended', type: 'boolean' })
  contactRecommended!: boolean;

  @Column({ name: 'recommendation_rationale', type: 'text' })
  recommendationRationale!: string;

  @Column({ name: 'alternative_arrangements', type: 'text', nullable: true })
  alternativeArrangements?: string;

  @Column({ name: 'contingency_plans', type: 'text', nullable: true })
  contingencyPlans?: string;

  @Column({ name: 'triggers_for_review', type: 'jsonb', nullable: true })
  triggersForReview?: {
    trigger: string;
    action: string;
  }[];

  // ========================================
  // MONITORING & REVIEW
  // ========================================

  @Column({ name: 'monitoring_requirements', type: 'text', nullable: true })
  monitoringRequirements?: string;

  @Column({ name: 'review_frequency_months', type: 'int', default: 6 })
  reviewFrequencyMonths!: number;

  @Column({ name: 'next_review_date', type: 'date' })
  nextReviewDate!: Date;

  @Column({ name: 'early_review_triggers', type: 'text', nullable: true })
  earlyReviewTriggers?: string;

  // ========================================
  // APPROVAL & SIGN-OFF
  // ========================================

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_by_name', type: 'varchar', length: 200, nullable: true })
  approvedByName?: string;

  @Column({ name: 'approved_by_role', type: 'varchar', length: 100, nullable: true })
  approvedByRole?: string;

  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approvalDate?: Date;

  @Column({ name: 'approval_comments', type: 'text', nullable: true })
  approvalComments?: string;

  // ========================================
  // ADDITIONAL NOTES
  // ========================================

  @Column({ name: 'assessor_comments', type: 'text', nullable: true })
  assessorComments?: string;

  @Column({ name: 'confidential_information', type: 'text', nullable: true })
  confidentialInformation?: string;

  @Column({ name: 'information_sources', type: 'text', nullable: true })
  informationSources?: string;

  // ========================================
  // AUDIT TRAIL
  // ========================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  // ========================================
  // RELATIONSHIPS
  // ========================================

  @ManyToOne(() => Child, child => child.id)
  @JoinColumn({ name: 'child_id' })
  child!: Child;

  @ManyToOne(() => FamilyMember, familyMember => familyMember.id)
  @JoinColumn({ name: 'family_member_id' })
  familyMember!: FamilyMember;

  @ManyToOne(() => Organization, organization => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  // ========================================
  // COMPUTED METHODS
  // ========================================

  /**
   * Check if assessment is current
   */
  isCurrent(): boolean {
    if (this.status === RiskAssessmentStatus.EXPIRED) {
      return false;
    }
    return new Date(this.nextReviewDate) > new Date();
  }

  /**
   * Check if review is overdue
   */
  isReviewOverdue(): boolean {
    return new Date(this.nextReviewDate) < new Date();
  }

  /**
   * Get days until review
   */
  getDaysUntilReview(): number {
    return Math.floor(
      (new Date(this.nextReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Check if high risk
   */
  isHighRisk(): boolean {
    return this.overallRiskLevel === RiskLevel.HIGH ||
           this.overallRiskLevel === RiskLevel.VERY_HIGH ||
           this.overallRiskLevel === RiskLevel.CRITICAL;
  }

  /**
   * Get critical risks
   */
  getCriticalRisks(): typeof this.identifiedRisks {
    return this.identifiedRisks.filter(r => 
      r.riskLevel === RiskLevel.CRITICAL || r.riskLevel === RiskLevel.VERY_HIGH
    );
  }

  /**
   * Check if requires immediate action
   */
  requiresImmediateAction(): boolean {
    return this.overallRiskLevel === RiskLevel.CRITICAL ||
           !this.contactRecommended ||
           this.getCriticalRisks().length > 0;
  }

  /**
   * Calculate risk score
   */
  calculateRiskScore(): number {
    const weights = {
      LOW: 1,
      MEDIUM: 3,
      HIGH: 5,
      VERY_HIGH: 8,
      CRITICAL: 10
    };
    
    return this.identifiedRisks.reduce((total, risk) => {
      return total + weights[risk.riskLevel];
    }, 0);
  }

  /**
   * Check if approved
   */
  isApproved(): boolean {
    return this.status === RiskAssessmentStatus.APPROVED && !!this.approvedBy;
  }
}
