/**
 * 📋 COMPLIANCE STANDARD ENTITY
 * 
 * Represents compliance standards for the knowledge base (GDPR, CQC, ISO 27001, etc.)
 * Used by VerifiedRetrieverService for RAG-based policy suggestions
 * 
 * Key Features:
 * - Multi-jurisdictional support (all 7 British Isles regulatory bodies)
 * - Version tracking for regulatory updates
 * - Structured requirements for machine-readable compliance
 * - Full-text search capability
 * 
 * @entity ComplianceStandard
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
} from 'typeorm';

/**
 * 🏛️ REGULATORY JURISDICTION ENUM
 * All 7 British Isles regulatory bodies
 */
export enum RegulatoryJurisdiction {
  ENGLAND_CQC = 'England',
  SCOTLAND_CARE_INSPECTORATE = 'Scotland',
  WALES_CIW = 'Wales',
  NORTHERN_IRELAND_RQIA = 'Northern Ireland',
  ISLE_OF_MAN = 'Isle of Man',
  JERSEY = 'Jersey',
  GUERNSEY = 'Guernsey',
}

/**
 * 📊 ENFORCEMENT LEVEL ENUM
 * Criticality of compliance standard
 */
export enum EnforcementLevel {
  CRITICAL = 'Critical',     // Legal requirement, severe penalties
  HIGH = 'High',             // Strongly recommended, inspection focus
  MEDIUM = 'Medium',         // Best practice, expected compliance
  LOW = 'Low',               // Optional, nice to have
}

/**
 * 📜 COMPLIANCE STANDARD STATUS ENUM
 */
export enum ComplianceStandardStatus {
  ACTIVE = 'active',         // Current and enforceable
  DEPRECATED = 'deprecated', // Superseded by newer version
  PENDING = 'pending',       // Upcoming, not yet in force
  DRAFT = 'draft',           // Under development
}

/**
 * 📋 COMPLIANCE STANDARD ENTITY
 */
@Entity('compliance_standards')
@Index(['code'], { unique: true })
@Index(['jurisdiction'])
@Index(['status'])
@Index(['category'])
export class ComplianceStandard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 🔑 STANDARD CODE (e.g., "GDPR", "CQC-S1", "ISO27001")
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code: string;

  /**
   * 📝 STANDARD TITLE
   */
  @Column({ type: 'varchar', length: 500 })
  title: string;

  /**
   * 📄 DETAILED DESCRIPTION
   */
  @Column({ type: 'text' })
  description: string;

  /**
   * 🏷️ CATEGORY (e.g., "Data Protection", "Safeguarding", "Quality Care")
   */
  @Column({ type: 'varchar', length: 100 })
  @Index()
  category: string;

  /**
   * 🔢 VERSION (e.g., "2.0", "2018/1")
   */
  @Column({ type: 'varchar', length: 20 })
  version: string;

  /**
   * 🌍 JURISDICTION (Array of regulatory bodies)
   */
  @Column({
    type: 'varchar',
    array: true,
    default: [],
  })
  @Index()
  jurisdiction: RegulatoryJurisdiction[];

  /**
   * 🏛️ REGULATORY BODY (e.g., "Care Quality Commission", "ICO")
   */
  @Column({ type: 'varchar', length: 200 })
  regulatoryBody: string;

  /**
   * ⚠️ MANDATORY COMPLIANCE
   */
  @Column({ type: 'boolean', default: true })
  mandatory: boolean;

  /**
   * 📊 ENFORCEMENT LEVEL
   */
  @Column({
    type: 'enum',
    enum: EnforcementLevel,
    default: EnforcementLevel.MEDIUM,
  })
  enforcementLevel: EnforcementLevel;

  /**
   * 📋 STRUCTURED REQUIREMENTS (JSON)
   * Machine-readable requirements for automated compliance checking
   */
  @Column({ type: 'jsonb', nullable: false })
  requirements: {
    clauses: Array<{
      id: string;
      title: string;
      description: string;
      mandatory: boolean;
      checkpoints: string[];
    }>;
    evidenceRequired: string[];
    reviewFrequency: string; // e.g., "annual", "quarterly"
  };

  /**
   * 📚 EXAMPLE IMPLEMENTATIONS (JSON)
   */
  @Column({ type: 'jsonb', nullable: true })
  examples?: {
    goodPractice: string[];
    commonMistakes: string[];
    templates: string[];
  };

  /**
   * 🔗 RELATED STANDARDS
   * Array of related standard codes
   */
  @Column({ type: 'varchar', array: true, default: [] })
  relatedStandards: string[];

  /**
   * 📊 STATUS
   */
  @Column({
    type: 'enum',
    enum: ComplianceStandardStatus,
    default: ComplianceStandardStatus.ACTIVE,
  })
  @Index()
  status: ComplianceStandardStatus;

  /**
   * 📅 EFFECTIVE DATE
   * When this standard came into force
   */
  @Column({ type: 'date' })
  effectiveDate: Date;

  /**
   * 📅 EXPIRY DATE (Optional)
   * When this standard expires or is superseded
   */
  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  /**
   * 🔄 SUPERSEDED BY (Optional)
   * Reference to newer version that replaces this standard
   */
  @Column({ type: 'uuid', nullable: true })
  supersededById?: string;

  /**
   * 🔍 FULL-TEXT SEARCH VECTOR
   * For PostgreSQL full-text search
   */
  @Column({
    type: 'tsvector',
    nullable: true,
    generatedType: 'STORED',
    asExpression: `to_tsvector('english', title || ' ' || description || ' ' || code)`,
  })
  @Index('idx_compliance_standards_search', { synchronize: false })
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
    officialUrl?: string;          // Link to official documentation
    pdfUrl?: string;                // Link to PDF version
    contactEmail?: string;          // Regulatory body contact
    updateFrequency?: string;       // How often standard is reviewed
    keywords?: string[];            // Search keywords
    relatedPolicies?: string[];     // Policy template IDs
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
   * Check if standard is currently active
   */
  isActive(): boolean {
    return this.status === ComplianceStandardStatus.ACTIVE;
  }

  /**
   * Check if standard is applicable to a jurisdiction
   */
  appliesToJurisdiction(jurisdiction: RegulatoryJurisdiction): boolean {
    return this.jurisdiction.includes(jurisdiction);
  }

  /**
   * Check if standard has expired
   */
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  /**
   * Get human-readable jurisdiction list
   */
  getJurisdictionNames(): string[] {
    const names: { [key in RegulatoryJurisdiction]: string } = {
      [RegulatoryJurisdiction.ENGLAND_CQC]: 'England (CQC)',
      [RegulatoryJurisdiction.SCOTLAND_CARE_INSPECTORATE]: 'Scotland (Care Inspectorate)',
      [RegulatoryJurisdiction.WALES_CIW]: 'Wales (CIW)',
      [RegulatoryJurisdiction.NORTHERN_IRELAND_RQIA]: 'Northern Ireland (RQIA)',
      [RegulatoryJurisdiction.ISLE_OF_MAN]: 'Isle of Man',
      [RegulatoryJurisdiction.JERSEY]: 'Jersey',
      [RegulatoryJurisdiction.GUERNSEY]: 'Guernsey',
    };

    return this.jurisdiction.map(j => names[j]);
  }

  /**
   * Increment usage counter
   */
  recordUsage(): void {
    this.usageCount++;
    this.lastUsedAt = new Date();
  }

  /**
   * Get compliance summary
   */
  getComplianceSummary(): {
    code: string;
    title: string;
    mandatory: boolean;
    jurisdiction: string[];
    status: string;
    effectiveDate: Date;
  } {
    return {
      code: this.code,
      title: this.title,
      mandatory: this.mandatory,
      jurisdiction: this.getJurisdictionNames(),
      status: this.status,
      effectiveDate: this.effectiveDate,
    };
  }
}
