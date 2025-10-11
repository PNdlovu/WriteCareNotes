/**
 * 📝 AI SUGGESTION LOG ENTITY
 * 
 * Immutable audit trail for all AI-generated policy suggestions
 * Used by PolicyAuthoringAssistantService for complete traceability
 * 
 * KeyFeatures:
 * - Immutable event sourcing (write-once, never update)
 * - Complete request/response logging
 * - Source attribution for every suggestion
 * - User decision tracking (accept/modify/reject)
 * - Regulatory compliance audit support
 * - 7-year retention for CQC/Care Inspectorate requirements
 * 
 * @entity AISuggestionLog
 * @version 1.0.0
 * @since 2025-10-06
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { RegulatoryJurisdiction } from './compliance-standard.entity';

/**
 * 🎯 AI INTENT ENUM
 * Types of AI assistance requests
 */
export enum AIIntent {
  SUGGEST_CLAUSE = 'suggest_clause',
  MAP_POLICY = 'map_policy',
  REVIEW_POLICY = 'review_policy',
  SUGGEST_IMPROVEMENT = 'suggest_improvement',
  VALIDATE_COMPLIANCE = 'validate_compliance',
}

/**
 * 📊 SUGGESTION STATUS ENUM
 */
export enum SuggestionStatus {
  SUCCESS = 'success',           // AI generated valid suggestion
  FALLBACK = 'fallback',         // AI used fallback response
  ERROR = 'error',               // System error occurred
}

/**
 * ✅ USER DECISION ENUM
 */
export enum UserDecision {
  ACCEPTED = 'accepted',         // User accepted suggestion as-is
  MODIFIED = 'modified',         // User accepted with modifications
  REJECTED = 'rejected',         // User rejected suggestion
  PENDING = 'pending',           // User hasn't decided yet
}

/**
 * 🔍 VERIFICATION STATUS ENUM
 */
export enum VerificationStatus {
  VERIFIED = 'verified',         // Suggestion from verified sources
  PENDING = 'pending',           // Awaiting verification
  REJECTED = 'rejected',         // Failed verification
}

/**
 * 📝 AI SUGGESTION LOG ENTITY
 * 
 * IMMUTABLE: Once created, records should never be updated (except user decision)
 */
@Entity('ai_suggestion_logs')
@Index(['userId', 'createdAt'])
@Index(['organizationId', 'createdAt'])
@Index(['intent', 'status'])
@Index(['overrideDecision'])
export class AISuggestionLog {
  /**
   * 🔑 PRIMARY KEY
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 👤 USER RELATIONSHIP
   */
  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  /**
   * 🏢 ORGANIZATION RELATIONSHIP
   */
  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  /**
   * 📥 REQUEST DATA
   */

  /**
   * Full AI prompt structure (JSON)
   */
  @Column({ type: 'jsonb', nullable: false })
  prompt: {
    intent: AIIntent;
    templateId?: string;
    policyId?: string;
    jurisdiction: RegulatoryJurisdiction[];
    context: string;
    standards?: string[];
    outputFormat: string;
    userRole: string;
  };

  /**
   * AI intent type
   */
  @Column({
    type: 'enum',
    enum: AIIntent,
  })
  @Index()
  intent: AIIntent;

  /**
   * Regulatory jurisdictions (array)
   */
  @Column({
    type: 'var char',
    array: true,
  })
  @Index()
  jurisdiction: RegulatoryJurisdiction[];

  /**
   * 📤 RESPONSE DATA
   */

  /**
   * Full AI response structure (JSON)
   * Null if error occurred
   */
  @Column({ type: 'jsonb', nullable: true })
  response?: {
    id: string;
    suggestion: any;
    sourceReferences: Array<{
      type: string;
      id: string;
      title: string;
      version: string;
      relevanceScore: number;
    }>;
    confidence: number;
    requiresHumanReview: boolean;
    fallbackUsed: boolean;
    fallbackMessage?: string;
    metadata: {
      generatedAt: Date;
      processingTimeMs: number;
      retrievedDocuments: number;
      jurisdictionContext: RegulatoryJurisdiction[];
    };
  };

  /**
   * Source references (array of JSON)
   * Documents used to generate the suggestion
   */
  @Column({ type: 'jsonb', array: true, default: [] })
  sourceReferences: Array<{
    type: 'policy_template' | 'compliance_standard' | 'jurisdictional_rule' | 'best_practice';
    id: string;
    title: string;
    version: string;
    section?: string;
    relevanceScore: number;
    verificationStatus: 'verified' | 'pending' | 'deprecated';
  }>;

  /**
   * AI confidence score (0.00 - 1.00)
   */
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  @Index()
  confidenceScore?: number;

  /**
   * 📊 STATUS TRACKING
   */

  /**
   * Overall status of the suggestion
   */
  @Column({
    type: 'enum',
    enum: SuggestionStatus,
  })
  @Index()
  status: SuggestionStatus;

  /**
   * Reason for fallback (if applicable)
   */
  @Column({ type: 'var char', length: 50, nullable: true })
  fallbackReason?: 'insufficient_sources' | 'low_confidence' | 'safety_validation_failed' | 'system_error';

  /**
   * Error message (if error occurred)
   */
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  /**
   * ✅ USER DECISION TRACKING
   */

  /**
   * User's decision on the suggestion
   */
  @Column({
    type: 'enum',
    enum: UserDecision,
    default: UserDecision.PENDING,
  })
  @Index()
  overrideDecision: UserDecision;

  /**
   * User's modifications (if modified)
   */
  @Column({ type: 'jsonb', nullable: true })
  modifiedContent?: any;

  /**
   * Reason for rejection (if rejected)
   */
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  /**
   * When user made their decision
   */
  @Column({ type: 'timestamp', nullable: true })
  decisionTimestamp?: Date;

  /**
   * 🏛️ REGULATORY CONTEXT
   */

  /**
   * Regulatory context (JSON)
   */
  @Column({ type: 'jsonb', nullable: false })
  regulatoryContext: {
    jurisdiction: RegulatoryJurisdiction[];
    standards?: string[];
    complianceRequirements?: string[];
    regulatoryBodies?: string[];
  };

  /**
   * Verification status
   */
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  @Index()
  verificationStatus: VerificationStatus;

  /**
   * ⚡ PERFORMANCE METRICS
   */

  /**
   * Processing time in milliseconds
   */
  @Column({ type: 'integer', nullable: true })
  processingTimeMs?: number;

  /**
   * Number of documents retrieved from knowledge base
   */
  @Column({ type: 'integer', default: 0 })
  retrievedDocuments: number;

  /**
   * Whether cache was used
   */
  @Column({ type: 'boolean', default: false })
  cacheHit: boolean;

  /**
   * 🔒 SECURITY & AUDIT
   */

  /**
   * IP address of the request
   */
  @Column({ type: 'var char', length: 45, nullable: true })
  ipAddress?: string;

  /**
   * User agent string
   */
  @Column({ type: 'var char', length: 500, nullable: true })
  userAgent?: string;

  /**
   * Session ID
   */
  @Column({ type: 'var char', length: 100, nullable: true })
  sessionId?: string;

  /**
   * 📝 METADATA
   */

  /**
   * Additional metadata (JSON)
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    browserInfo?: any;
    deviceInfo?: any;
    featureFlags?: string[];
    experimentGroup?: string;
    notes?: string;
  };

  /**
   * 📅 TIMESTAMP (Immutable - creation only)
   */
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  /**
   * Note: NO UpdateDateColumn - logs are immutable except for user decision
   */

  /**
   * 🔍 HELPER METHODS
   */

  /**
   * Check if suggestion was successful
   */
  isSuccessful(): boolean {
    return this.status === SuggestionStatus.SUCCESS;
  }

  /**
   * Check if user has made a decision
   */
  hasUserDecided(): boolean {
    return this.overrideDecision !== UserDecision.PENDING;
  }

  /**
   * Check if suggestion was accepted
   */
  wasAccepted(): boolean {
    return this.overrideDecision === UserDecision.ACCEPTED;
  }

  /**
   * Check if fallback was used
   */
  usedFallback(): boolean {
    return this.status === SuggestionStatus.FALLBACK;
  }

  /**
   * Get confidence level description
   */
  getConfidenceLevel(): 'High' | 'Medium' | 'Low' | 'Unknown' {
    if (!this.confidenceScore) return 'Unknown';
    if (this.confidenceScore >= 0.9) return 'High';
    if (this.confidenceScore >= 0.75) return 'Medium';
    return 'Low';
  }

  /**
   * Get jurisdiction names
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
   * Get audit summary (for regulatory inspection)
   */
  getAuditSummary(): {
    id: string;
    timestamp: Date;
    user: string;
    intent: string;
    jurisdiction: string[];
    status: string;
    confidence: string;
    decision: string;
    sources: number;
  } {
    return {
      id: this.id,
      timestamp: this.createdAt,
      user: this.userId,
      intent: this.intent,
      jurisdiction: this.getJurisdictionNames(),
      status: this.status,
      confidence: this.getConfidenceLevel(),
      decision: this.overrideDecision,
      sources: this.sourceReferences.length,
    };
  }

  /**
   * Check if requires human review
   */
  requiresHumanReview(): boolean {
    return (
      this.confidenceScore < 0.75 ||
      this.status === SuggestionStatus.FALLBACK ||
      this.response?.requiresHumanReview === true
    );
  }

  /**
   * Get processing performance rating
   */
  getPerformanceRating(): 'Excellent' | 'Good' | 'Slow' | 'Unknown' {
    if (!this.processingTimeMs) return 'Unknown';
    if (this.processingTimeMs < 1000) return 'Excellent';
    if (this.processingTimeMs < 2000) return 'Good';
    return 'Slow';
  }
}
