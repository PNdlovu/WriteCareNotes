/**
 * ⚖️ JURISDICTIONAL RULE ENTITY
 * 
 * Represents regulatory rules specific to each British Isles jurisdiction
 * Used by VerifiedRetrieverService for RAG-based policy suggestions
 * 
 * Key Features:
 * - Single jurisdiction per rule (jurisdiction-specific requirements)
 * - Links to compliance standards
 * - Version tracking for regulatory updates
 * - Full-text search capability
 * 
 * @entity JurisdictionalRule
 * @version 1.0.0
 * @since 2025-10-06
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RegulatoryJurisdiction } from './compliance-standard.entity';

/**
 * 📋 RULE TYPE ENUM
 * Categories of jurisdictional rules
 */
export enum RuleType {
  SAFEGUARDING = 'Safeguarding',
  DATA_PROTECTION = 'Data Protection',
  QUALITY_CARE = 'Quality Care',
  MEDICATION_MANAGEMENT = 'Medication Management',
  INFECTION_CONTROL = 'Infection Control',
  STAFF_TRAINING = 'Staff Training',
  RECORD_KEEPING = 'Record Keeping',
  COMPLAINTS_PROCEDURE = 'Complaints Procedure',
  HEALTH_AND_SAFETY = 'Health and Safety',
  NUTRITIONAL_CARE = 'Nutritional Care',
  DIGNITY_AND_RESPECT = 'Dignity and Respect',
  MENTAL_CAPACITY = 'Mental Capacity',
  RESTRAINT_POLICY = 'Restraint Policy',
  VISITING_RIGHTS = 'Visiting Rights',
  OTHER = 'Other',
}

/**
 * 📊 JURISDICTIONAL RULE STATUS ENUM
 */
export enum JurisdictionalRuleStatus {
  ACTIVE = 'active',         // Current and enforceable
  DEPRECATED = 'deprecated', // Superseded by newer version
  DRAFT = 'draft',           // Under development
  CONSULTATION = 'consultation', // Open for public consultation
}

/**
 * ⚖️ JURISDICTIONAL RULE ENTITY
 */
@Entity('jurisdictional_rules')
@Index(['jurisdiction', 'ruleType'])
@Index(['status'])
@Index(['regulatoryBody'])
export class JurisdictionalRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 📝 RULE TITLE
   */
  @Column({ type: 'varchar', length: 500 })
  title: string;

  /**
   * 📄 RULE CONTENT (Detailed description)
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * 🏷️ RULE TYPE
   */
  @Column({
    type: 'enum',
    enum: RuleType,
  })
  @Index()
  ruleType: RuleType;

  /**
   * 🔢 VERSION
   */
  @Column({ type: 'varchar', length: 20 })
  version: string;

  /**
   * 🌍 JURISDICTION (Single jurisdiction per rule)
   * Each jurisdiction has its own specific rules
   */
  @Column({
    type: 'enum',
    enum: RegulatoryJurisdiction,
  })
  @Index()
  jurisdiction: RegulatoryJurisdiction;

  /**
   * 🏛️ REGULATORY BODY
   * e.g., "Care Quality Commission", "Care Inspectorate", "CIW", "RQIA"
   */
  @Column({ type: 'varchar', length: 200 })
  @Index()
  regulatoryBody: string;

  /**
   * ⚠️ ENFORCEMENT LEVEL
   */
  @Column({ type: 'varchar', length: 50 })
  enforcementLevel: 'Critical' | 'High' | 'Medium' | 'Low';

  /**
   * 📋 RULE DETAILS (JSON)
   * Structured rule requirements
   */
  @Column({ type: 'jsonb', nullable: false })
  ruleDetails: {
    requirements: string[];           // List of specific requirements
    prohibitions?: string[];          // Things explicitly prohibited
    exceptions?: string[];            // Exceptions to the rule
    complianceEvidence: string[];     // What evidence is needed
    inspectionCriteria: string[];     // What inspectors look for
    penalties?: {                     // Penalties for non-compliance
      description: string;
      severity: string;
    };
  };

  /**
   * 🔗 RELATED COMPLIANCE STANDARDS
   * Array of compliance standard codes this rule relates to
   */
  @Column({ type: 'varchar', array: true, default: [] })
  relatedStandards: string[];

  /**
   * 🔄 SUPERSEDES RULE
   * Reference to previous version of this rule
   */
  @Column({ type: 'uuid', nullable: true })
  supersedesRuleId?: string;

  @ManyToOne(() => JurisdictionalRule, { nullable: true })
  @JoinColumn({ name: 'supersedes_rule_id' })
  supersedesRule?: JurisdictionalRule;

  /**
   * 📊 STATUS
   */
  @Column({
    type: 'enum',
    enum: JurisdictionalRuleStatus,
    default: JurisdictionalRuleStatus.ACTIVE,
  })
  @Index()
  status: JurisdictionalRuleStatus;

  /**
   * 📅 EFFECTIVE DATE
   * When this rule came into force
   */
  @Column({ type: 'date' })
  effectiveDate: Date;

  /**
   * 📅 REVIEW DATE
   * When this rule should be reviewed
   */
  @Column({ type: 'date', nullable: true })
  reviewDate?: Date;

  /**
   * 📅 CONSULTATION PERIOD (Optional)
   * For rules in consultation status
   */
  @Column({ type: 'jsonb', nullable: true })
  consultationPeriod?: {
    startDate: Date;
    endDate: Date;
    feedbackUrl?: string;
  };

  /**
   * 🔍 FULL-TEXT SEARCH VECTOR
   * For PostgreSQL full-text search
   */
  @Column({
    type: 'tsvector',
    nullable: true,
    generatedType: 'STORED',
    asExpression: `to_tsvector('english', title || ' ' || content)`,
  })
  @Index('idx_jurisdictional_rules_search', { synchronize: false })
  searchVector?: any;

  /**
   * 📊 USAGE STATISTICS
   */
  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  /**
   * 📝 METADATA
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    officialUrl?: string;             // Link to official rule document
    guidanceUrl?: string;             // Link to guidance document
    contactEmail?: string;            // Regulatory body contact
    keywords?: string[];              // Search keywords
    relatedPolicies?: string[];       // Policy template IDs
    inspectionHistory?: {             // Historical inspection focus
      year: number;
      focusAreas: string[];
    }[];
    amendmentHistory?: {              // History of amendments
      date: Date;
      description: string;
      amendedBy: string;
    }[];
  };

  /**
   * 👤 CREATED BY
   */
  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  /**
   * 👤 LAST UPDATED BY
   */
  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  /**
   * 📅 TIMESTAMPS
   */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 🔍 HELPER METHODS
   */

  /**
   * Check if rule is currently active
   */
  isActive(): boolean {
    return this.status === JurisdictionalRuleStatus.ACTIVE;
  }

  /**
   * Check if rule is in consultation
   */
  isInConsultation(): boolean {
    if (this.status !== JurisdictionalRuleStatus.CONSULTATION) return false;
    if (!this.consultationPeriod) return false;

    const now = new Date();
    return (
      now >= new Date(this.consultationPeriod.startDate) &&
      now <= new Date(this.consultationPeriod.endDate)
    );
  }

  /**
   * Check if rule needs review
   */
  needsReview(): boolean {
    if (!this.reviewDate) return false;
    return new Date() > this.reviewDate;
  }

  /**
   * Get jurisdiction display name
   */
  getJurisdictionName(): string {
    constnames: { [key in RegulatoryJurisdiction]: string } = {
      [RegulatoryJurisdiction.ENGLAND_CQC]: 'England (CQC)',
      [RegulatoryJurisdiction.SCOTLAND_CARE_INSPECTORATE]: 'Scotland (Care Inspectorate)',
      [RegulatoryJurisdiction.WALES_CIW]: 'Wales (CIW)',
      [RegulatoryJurisdiction.NORTHERN_IRELAND_RQIA]: 'Northern Ireland (RQIA)',
      [RegulatoryJurisdiction.ISLE_OF_MAN]: 'Isle of Man',
      [RegulatoryJurisdiction.JERSEY]: 'Jersey',
      [RegulatoryJurisdiction.GUERNSEY]: 'Guernsey',
    };

    return names[this.jurisdiction];
  }

  /**
   * Get enforcement level color (for UI)
   */
  getEnforcementColor(): string {
    constcolors: { [key: string]: string } = {
      Critical: '#dc2626', // Red
      High: '#ea580c',     // Orange
      Medium: '#ca8a04',   // Yellow
      Low: '#65a30d',      // Green
    };

    return colors[this.enforcementLevel] || '#6b7280'; // Gray default
  }

  /**
   * Increment usage counter
   */
  recordUsage(): void {
    this.usageCount++;
    this.lastUsedAt = new Date();
  }

  /**
   * Get rule summary
   */
  getRuleSummary(): {
    title: string;
    ruleType: string;
    jurisdiction: string;
    regulatoryBody: string;
    enforcementLevel: string;
    status: string;
    effectiveDate: Date;
  } {
    return {
      title: this.title,
      ruleType: this.ruleType,
      jurisdiction: this.getJurisdictionName(),
      regulatoryBody: this.regulatoryBody,
      enforcementLevel: this.enforcementLevel,
      status: this.status,
      effectiveDate: this.effectiveDate,
    };
  }

  /**
   * Check if rule applies to a specific compliance standard
   */
  relatesTo(standardCode: string): boolean {
    return this.relatedStandards.includes(standardCode);
  }

  /**
   * Get compliance checklist
   */
  getComplianceChecklist(): string[] {
    return this.ruleDetails.requirements;
  }

  /**
   * Get inspection criteria
   */
  getInspectionCriteria(): string[] {
    return this.ruleDetails.inspectionCriteria;
  }
}
