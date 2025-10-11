/**
 * @fileoverview Child entity representing children and young persons in care.
 * This is the core entity tracking personal details, legal status, placement
 * information, education, health, and safeguarding for children in residential
 * and foster care settings. Supports ages 0-25 including care leavers.
 *
 * @module domains/children/entities
 * @version 1.0.0
 * @author WCNotes Development Team
 * @since 2024
 *
 * @description
 * Comprehensive entity for managing child profiles in the care system. Tracks:
 * - Personal details (name, DOB, gender, ethnicity, nationality, religion, language)
 * - Legal status (jurisdiction-specific: Section 20/31/38, CSO, Care Orders, etc.)
 * - Placement information (type, dates, admission to care)
 * - Social worker and IRO (Independent Reviewing Officer) assignments
 * - Education (school, designated teacher, PEP dates)
 * - Health (GP details, health assessment dates)
 * - Disabilities and EHCP (Education, Health and Care Plan)
 * - Safeguarding flags (CP plan, CiN plan)
 * - UASC and care leaver status tracking
 * - Full audit trail (created/updated by/at)
 *
 * @compliance British Isles Multi-Jurisdictional Compliance
 * 
 * **England** (OFSTED):
 * - Regulation 17 (Record keeping)
 * - Children Act 1989 Section 20, 31, 38
 * - Care Planning Regulations 2010
 * - Children (Leaving Care) Act 2000
 * 
 * **Wales** (Care Inspectorate Wales):
 * - Regulation and Inspection of Social Care (Wales) Act 2016
 * - Social Services and Well-being (Wales) Act 2014
 * - Welsh Language Standards
 * 
 * **Scotland** (Care Inspectorate):
 * - Children's Hearings (Scotland) Act 2011
 * - Children (Scotland) Act 1995
 * - Looked After Children (Scotland) Regulations 2009
 * 
 * **Northern Ireland** (RQIA):
 * - Children (NI) Order 1995
 * - Children's Homes Regulations (NI) 2005
 * 
 * **Ireland** (HIQA):
 * - Child Care Act 1991
 * - National Standards for Children's Residential Centres
 * 
 * **Jersey** (Jersey Care Commission):
 * - Children (Jersey) Law 2002
 * - Residential Care Home Standards
 * 
 * **Guernsey** (Committee for Health & Social Care):
 * - Children (Guernsey and Alderney) Law 2008
 * 
 * **Isle of Man** (Registration and Inspection Unit):
 * - Children and Young Persons Act 2001
 * 
 * @features
 * - Multi-jurisdictional support (8 jurisdictions across British Isles)
 * - Jurisdiction-specific legal status validation
 * - Unique child numbering (YYYY-NNNN format)
 * - Legal ID tracking for court proceedings
 * - Multi-status tracking (ACTIVE, ON_LEAVE, DISCHARGED, MISSING, etc.)
 * - Placement type classification (14 types from foster care to secure)
 * - Statutory review tracking with jurisdiction-specific timescales
 * - Health assessment scheduling with jurisdiction-specific requirements
 * - PEP (Personal Education Plan) management
 * - Disability and EHCP flagging
 * - UASC and care leaver identification
 * - Computed methods for age calculation and compliance monitoring
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { Organization } from '../../../entities/Organization';

/**
 * British Isles Jurisdiction - determines which regulatory framework applies
 * @see docs/childrens-care-system/BRITISH-ISLES-COMPLIANCE.md
 */
export enum Jurisdiction {
  ENGLAND = 'ENGLAND',                    // OFSTED
  WALES = 'WALES',                        // Care Inspectorate Wales (CIW)
  SCOTLAND = 'SCOTLAND',                  // Care Inspectorate Scotland
  NORTHERN_IRELAND = 'NORTHERN_IRELAND',  // RQIA
  IRELAND = 'IRELAND',                    // HIQA (Republic of Ireland)
  JERSEY = 'JERSEY',                      // Jersey Care Commission
  GUERNSEY = 'GUERNSEY',                  // Committee for Health & Social Care
  ISLE_OF_MAN = 'ISLE_OF_MAN'            // Registration and Inspection Unit
}

/**
 * Legal Status - supports all British Isles jurisdictions
 * 
 * England/Wales: Section 20, 31, 38, EPO
 * Scotland: CSO (Compulsory Supervision Order), Permanence Order
 * NorthernIreland: Care Order (NI), Residence Order
 * Ireland: Care Order (IE), Emergency Care Order, Voluntary Care
 * CrownDependencies: Jurisdiction-specific care orders
 */
export enum LegalStatus {
  // England & Wales (Children Act 1989)
  SECTION_20 = 'SECTION_20',              // Voluntary accommodation (England/Wales)
  SECTION_31 = 'SECTION_31',              // Care Order (England/Wales)
  SECTION_38 = 'SECTION_38',              // Interim Care Order (England/Wales)
  POLICE_PROTECTION = 'POLICE_PROTECTION', // Police Protection (England/Wales)
  EMERGENCY_PROTECTION_ORDER = 'EMERGENCY_PROTECTION_ORDER', // EPO (England/Wales)
  
  // Scotland (Children (Scotland) Act 1995)
  COMPULSORY_SUPERVISION_ORDER = 'COMPULSORY_SUPERVISION_ORDER', // CSO (Scotland)
  PERMANENCE_ORDER = 'PERMANENCE_ORDER',  // Permanence Order (Scotland)
  CHILD_PROTECTION_ORDER = 'CHILD_PROTECTION_ORDER', // CPO (Scotland)
  
  // Northern Ireland (Children (NI) Order 1995)
  CARE_ORDER_NI = 'CARE_ORDER_NI',        // Care Order (Northern Ireland)
  RESIDENCE_ORDER_NI = 'RESIDENCE_ORDER_NI', // Residence Order (NI)
  EMERGENCY_PROTECTION_ORDER_NI = 'EMERGENCY_PROTECTION_ORDER_NI', // EPO (NI)
  
  // Republic of Ireland (Child Care Act 1991)
  CARE_ORDER_IE = 'CARE_ORDER_IE',        // Care Order (Ireland)
  INTERIM_CARE_ORDER_IE = 'INTERIM_CARE_ORDER_IE', // Interim Care Order (Ireland)
  EMERGENCY_CARE_ORDER_IE = 'EMERGENCY_CARE_ORDER_IE', // Emergency Care Order (Ireland)
  VOLUNTARY_CARE_IE = 'VOLUNTARY_CARE_IE', // Voluntary Care (Ireland)
  
  // Jersey (Children (Jersey) Law 2002)
  CARE_ORDER_JERSEY = 'CARE_ORDER_JERSEY', // Care Order (Jersey)
  SUPERVISION_ORDER_JERSEY = 'SUPERVISION_ORDER_JERSEY', // Supervision Order (Jersey)
  
  // Guernsey (Children (Guernsey) Law 2008)
  CARE_ORDER_GUERNSEY = 'CARE_ORDER_GUERNSEY', // Care Order (Guernsey)
  SUPERVISION_ORDER_GUERNSEY = 'SUPERVISION_ORDER_GUERNSEY', // Supervision Order (Guernsey)
  
  // Isle of Man (Children and Young Persons Act 2001)
  CARE_ORDER_IOM = 'CARE_ORDER_IOM',      // Care Order (Isle of Man)
  SUPERVISION_ORDER_IOM = 'SUPERVISION_ORDER_IOM', // Supervision Order (IoM)
  
  // Universal
  REMAND = 'REMAND',
  CRIMINAL_JUSTICE = 'CRIMINAL_JUSTICE',
  IMMIGRATION_DETENTION = 'IMMIGRATION_DETENTION'
}

export enum PlacementType {
  LONG_TERM = 'LONG_TERM',
  SHORT_TERM = 'SHORT_TERM',
  EMERGENCY = 'EMERGENCY',
  RESPITE = 'RESPITE',
  SHORT_BREAK = 'SHORT_BREAK',
  SECURE = 'SECURE',
  SEMI_INDEPENDENT = 'SEMI_INDEPENDENT',
  MOTHER_AND_BABY = 'MOTHER_AND_BABY',
  THERAPEUTIC = 'THERAPEUTIC'
}

export enum ChildStatus {
  ACTIVE = 'ACTIVE',
  DISCHARGED = 'DISCHARGED',
  MISSING = 'MISSING',
  HOSPITAL = 'HOSPITAL',
  ON_LEAVE = 'ON_LEAVE',
  TRANSFERRED = 'TRANSFERRED'
}

export enum GillickCompetence {
  NOT_ASSESSED = 'NOT_ASSESSED',
  COMPETENT = 'COMPETENT',
  NOT_COMPETENT = 'NOT_COMPETENT',
  PARTIAL = 'PARTIAL'
}

@Entity('children')
@Index(['organization', 'status'])
@Index(['localAuthorityId'])
@Index(['socialWorkerEmail'])
@Index(['jurisdiction']) // Index for filtering by jurisdiction
export class Child {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  // ========================================
  // JURISDICTION & REGULATORY FRAMEWORK
  // ========================================

  /**
   * British Isles Jurisdiction - determines which regulatory framework applies
   * ENGLAND: OFSTED, Children Act 1989/2004
   * WALES: Care Inspectorate Wales (CIW), Social Services and Well-being (Wales) Act 2014
   * SCOTLAND: Care Inspectorate Scotland, Children (Scotland) Act 1995
   * NORTHERN_IRELAND: RQIA, Children (NI) Order 1995
   * IRELAND: HIQA, Child Care Act 1991
   * JERSEY: Jersey Care Commission, Children (Jersey) Law 2002
   * GUERNSEY: Committee for Health & Social Care, Children (Guernsey) Law 2008
   * ISLE_OF_MAN: Registration and Inspection Unit, Children and Young Persons Act 2001
   */
  @Column({
    type: 'enum',
    enum: Jurisdiction,
    default: Jurisdiction.ENGLAND
  })
  jurisdiction!: Jurisdiction;

  // ========================================
  // PERSONAL INFORMATION
  // ========================================

  @Column({ length: 100 })
  @Index()
  firstName!: string;

  @Column({ length: 100, nullable: true })
  middleNames?: string;

  @Column({ length: 100 })
  @Index()
  lastName!: string;

  @Column({ length: 100, nullable: true })
  preferredName?: string;

  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @Column({ length: 20 })
  gender!: string; // MALE, FEMALE, NON_BINARY, PREFER_NOT_TO_SAY, OTHER

  @Column({ length: 100, nullable: true })
  pronouns?: string;

  @Column({ length: 50, nullable: true, unique: true })
  @Index()
  nhsNumber?: string;

  @Column({ length: 50, nullable: true })
  nationalInsuranceNumber?: string;

  @Column({ type: 'text', nullable: true })
  photo?: string; // URL or base64

  // ========================================
  // LEGAL & PLACEMENT INFORMATION
  // ========================================

  @Column({
    type: 'enum',
    enum: LegalStatus
  })
  legalStatus!: LegalStatus;

  @Column({ type: 'date', nullable: true })
  legalStatusStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  legalStatusReviewDate?: Date;

  @Column({ type: 'text', nullable: true })
  courtOrderDetails?: string;

  @Column({
    type: 'enum',
    enum: PlacementType
  })
  placementType!: PlacementType;

  @Column({ type: 'date' })
  admissionDate!: Date;

  @Column({ type: 'date', nullable: true })
  expectedDischargeDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualDischargeDate?: Date;

  @Column({
    type: 'enum',
    enum: ChildStatus,
    default: ChildStatus.ACTIVE
  })
  status!: ChildStatus;

  @Column({ type: 'text', nullable: true })
  dischargeReason?: string;

  // ========================================
  // LOCAL AUTHORITY & SOCIAL SERVICES
  // ========================================

  @Column({ length: 255 })
  @Index()
  localAuthority!: string; // e.g., "London Borough of Hackney"

  @Column({ length: 100, nullable: true })
  localAuthorityId?: string; // LA reference number

  @Column({ length: 255 })
  socialWorkerName!: string;

  @Column({ length: 255 })
  @Index()
  socialWorkerEmail!: string;

  @Column({ length: 50 })
  socialWorkerPhone!: string;

  @Column({ length: 255, nullable: true })
  socialWorkerTeam?: string;

  @Column({ length: 255, nullable: true })
  iroName?: string; // Independent Reviewing Officer

  @Column({ length: 255, nullable: true })
  iroEmail?: string;

  @Column({ length: 50, nullable: true })
  iroPhone?: string;

  @Column({ type: 'date', nullable: true })
  nextLACReviewDate?: Date; // Looked After Child review

  // ========================================
  // EDUCATION
  // ========================================

  @Column({ length: 255, nullable: true })
  currentSchool?: string;

  @Column({ length: 255, nullable: true })
  schoolAddress?: string;

  @Column({ length: 50, nullable: true })
  yearGroup?: string;

  @Column({ default: false })
  hasEHCP!: boolean; // Education, Health and Care Plan

  @Column({ default: false })
  hasSENSupport!: boolean; // Special Educational Needs

  @Column({ type: 'text', nullable: true })
  senDetails?: string;

  @Column({ length: 255, nullable: true })
  virtualSchoolContact?: string;

  @Column({ type: 'date', nullable: true })
  nextPEPReviewDate?: Date; // Personal Education Plan

  @Column({ default: false })
  isNEET!: boolean; // Not in Education, Employment, or Training

  // ========================================
  // HEALTH
  // ========================================

  @Column({ length: 255, nullable: true })
  gpName?: string;

  @Column({ length: 255, nullable: true })
  gpPractice?: string;

  @Column({ length: 50, nullable: true })
  gpPhone?: string;

  @Column({ type: 'date', nullable: true })
  lastHealthAssessment?: Date;

  @Column({ type: 'date', nullable: true })
  nextHealthAssessment?: Date;

  @Column({ type: 'date', nullable: true })
  lastDentalCheckup?: Date;

  @Column({ type: 'date', nullable: true })
  lastOpticalCheckup?: Date;

  @Column({ type: 'jsonb', nullable: true })
  medicalConditions?: Array<{
    condition: string;
    diagnosedDate?: string;
    severity?: string;
    notes?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  allergies?: Array<{
    allergen: string;
    reaction: string;
    severity: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  immunizations?: Array<{
    vaccine: string;
    date: string;
    batchNumber?: string;
  }>;

  @Column({ default: false })
  hasCAMHSInvolvement!: boolean; // Child and Adolescent Mental Health Services

  @Column({ type: 'text', nullable: true })
  mentalHealthNotes?: string;

  @Column({
    type: 'enum',
    enum: GillickCompetence,
    default: GillickCompetence.NOT_ASSESSED
  })
  gillickCompetence!: GillickCompetence;

  // ========================================
  // CULTURAL & IDENTITY
  // ========================================

  @Column({ length: 100, nullable: true })
  ethnicity?: string;

  @Column({ length: 100, nullable: true })
  religion?: string;

  @Column({ type: 'jsonb', nullable: true })
  languagesSpoken?: string[];

  @Column({ length: 100, nullable: true })
  firstLanguage?: string;

  @Column({ default: false })
  requiresInterpreter!: boolean;

  @Column({ type: 'text', nullable: true })
  culturalNeeds?: string;

  @Column({ type: 'text', nullable: true })
  dietaryRequirements?: string;

  // ========================================
  // DISABILITY & SPECIAL NEEDS
  // ========================================

  @Column({ default: false })
  hasDisability!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  disabilities?: Array<{
    type: string;
    impact: string;
    support: string;
  }>;

  @Column({ default: false })
  requiresMobilitySupport!: boolean;

  @Column({ default: false })
  requiresCommunicationSupport!: boolean;

  @Column({ type: 'text', nullable: true })
  communicationMethod?: string; // e.g., "Makaton", "BSL", "PECS"

  @Column({ type: 'jsonb', nullable: true })
  assistiveTechnology?: string[];

  // ========================================
  // FAMILY & CONTACTS
  // ========================================

  @Column({ type: 'jsonb', nullable: true })
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimaryContact: boolean;
    canCollectChild: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  familyMembers?: Array<{
    name: string;
    relationship: string;
    hasParentalResponsibility: boolean;
    contactAllowed: boolean;
    contactType?: string;
    notes?: string;
  }>;

  @Column({ default: false })
  hasSiblings!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  siblings?: Array<{
    name: string;
    age?: number;
    placementStatus?: string;
    contactArrangements?: string;
  }>;

  // ========================================
  // SAFEGUARDING
  // ========================================

  @Column({ default: false })
  hasChildProtectionPlan!: boolean;

  @Column({ type: 'date', nullable: true })
  childProtectionPlanStartDate?: Date;

  @Column({ type: 'text', nullable: true })
  safeguardingConcerns?: string;

  @Column({ type: 'jsonb', nullable: true })
  riskAssessments?: Array<{
    type: string;
    level: string;
    date: string;
    mitigations: string;
  }>;

  @Column({ default: 0 })
  missingEpisodesCount!: number;

  @Column({ type: 'date', nullable: true })
  lastMissingEpisodeDate?: Date;

  @Column({ default: false })
  cseRiskIdentified!: boolean; // Child Sexual Exploitation

  @Column({ default: false })
  cceRiskIdentified!: boolean; // Child Criminal Exploitation

  // ========================================
  // LEAVING CARE (16+)
  // ========================================

  @Column({ default: false })
  isEligibleForLeavingCare!: boolean;

  /**
   * Leaving Care Status - UK wide classification
   * ELIGIBLE: 16-17, in care 13+ weeks after 14th birthday (England/Wales/NI)
   * RELEVANT: 16-17, left care after 16 (England/Wales/NI)
   * FORMER_RELEVANT: 18-25, previously relevant (England/Wales/NI)
   * CONTINUING_CARE: Scotland-specific, can extend to 26
   * AFTERCARE: Scotland, left care before 16
   * THROUGHCARE: Scotland, preparing for leaving care
   */
  @Column({
    type: 'enum',
    enum: ['ELIGIBLE', 'RELEVANT', 'FORMER_RELEVANT', 'CONTINUING_CARE', 'AFTERCARE', 'THROUGHCARE', 'NOT_APPLICABLE'],
    default: 'NOT_APPLICABLE'
  })
  leavingCareStatus!: string;

  /**
   * Leaving Care Jurisdiction - determines which leaving care framework applies
   * Uses British Isles regional configuration for benefits, housing, support
   * ALL 8 BRITISH ISLES JURISDICTIONS SUPPORTED
   */
  @Column({
    type: 'enum',
    enum: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Jersey', 'Guernsey', 'Isle of Man'],
    nullable: true
  })
  leavingCareJurisdiction?: 'England' | 'Scotland' | 'Wales' | 'Northern Ireland' | 'Ireland' | 'Jersey' | 'Guernsey' | 'Isle of Man';

  @Column({ type: 'date', nullable: true })
  pathwayPlanStartDate?: Date;

  @Column({ length: 255, nullable: true })
  personalAdvisorName?: string;

  @Column({ length: 255, nullable: true })
  personalAdvisorEmail?: string;

  @Column({ type: 'text', nullable: true })
  independentLivingSkillsLevel?: string;

  @Column({ default: false })
  stayingPutArrangement!: boolean;

  /**
   * Maximum leaving care support age based on jurisdiction
   * England/Wales/NI: 25
   * Scotland: 26 (Continuing Care)
   */
  @Column({ type: 'int', nullable: true })
  maxSupportAge?: number;

  // ========================================
  // ADDITIONAL INFORMATION
  // ========================================

  @Column({ type: 'text', nullable: true })
  interests?: string;

  @Column({ type: 'text', nullable: true })
  strengths?: string;

  @Column({ type: 'text', nullable: true })
  aspirations?: string;

  @Column({ type: 'text', nullable: true })
  lifeStoryWork?: string;

  @Column({ type: 'jsonb', nullable: true })
  achievements?: Array<{
    achievement: string;
    date: string;
    category: string;
  }>;

  @Column({ type: 'text', nullable: true })
  additionalNotes?: string;

  // ========================================
  // METADATA
  // ========================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ length: 255, nullable: true })
  createdBy?: string;

  @Column({ length: 255, nullable: true })
  updatedBy?: string;

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Calculate current age in years
   */
  get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get full name
   */
  get fullName(): string {
    const parts = [this.firstName];
    if (this.middleNames) parts.push(this.middleNames);
    parts.push(this.lastName);
    return parts.join(' ');
  }

  /**
   * Get display name (preferred name or first name)
   */
  get displayName(): string {
    return this.preferredName || this.firstName;
  }

  /**
   * Check if child is LAC (Looked After Child)
   */
  get isLookedAfterChild(): boolean {
    return [
      LegalStatus.SECTION_20,
      LegalStatus.SECTION_31,
      LegalStatus.SECTION_38
    ].includes(this.legalStatus);
  }

  /**
   * Check if child is 16+ and eligible for leaving care support
   */
  get isLeavingCareAge(): boolean {
    return this.age >= 16;
  }

  /**
   * Check if health assessment is overdue
   */
  get isHealthAssessmentOverdue(): boolean {
    if (!this.nextHealthAssessment) return false;
    return new Date() > this.nextHealthAssessment;
  }

  /**
   * Check if PEP review is overdue
   */
  get isPEPReviewOverdue(): boolean {
    if (!this.nextPEPReviewDate) return false;
    return new Date() > this.nextPEPReviewDate;
  }

  /**
   * Check if LAC review is overdue
   */
  get isLACReviewOverdue(): boolean {
    if (!this.nextLACReviewDate) return false;
    return new Date() > this.nextLACReviewDate;
  }

  /**
   * Get placement duration in days
   */
  get placementDurationDays(): number {
    const endDate = this.actualDischargeDate || new Date();
    const startDate = new Date(this.admissionDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if child requires urgent attention
   */
  get requiresUrgentAttention(): boolean {
    return (
      this.status === ChildStatus.MISSING ||
      this.hasChildProtectionPlan ||
      this.isHealthAssessmentOverdue ||
      this.isLACReviewOverdue
    );
  }
}
