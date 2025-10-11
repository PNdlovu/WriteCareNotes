/**
 * ============================================================================
 * UASC Profile Entity
 * ============================================================================
 * 
 * @fileoverview UASC (Unaccompanied Asylum Seeking Children) profile entity.
 * 
 * @module domains/uasc/entities/UASCProfile
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Represents the profile of an unaccompanied asylum-seeking child including
 * arrival details, country of origin, languages, immigration status, and
 * specific needs. UASC are children under 18 who arrive in the UK without
 * a responsible adult.
 * 
 * @compliance
 * - Immigration Act 2016
 * - Children Act 1989, Section 20
 * - Care of Unaccompanied Migrant Children and Child Victims of Modern Slavery
 * - OFSTED Regulation 17 (Records)
 * - Working Together to Safeguard Children 2018
 * 
 * @features
 * - Arrival and referral tracking
 * - Country of origin and journey documentation
 * - Language and interpreter needs
 * - Age assessment tracking
 * - Immigration status monitoring
 * - Home Office correspondence
 * - Cultural and religious needs
 * - Trafficking and exploitation screening
 * - National Referral Mechanism (NRM) tracking
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Child } from '../../children/entities/Child';
import { Organization } from '../../organization/entities/Organization';

// ========================================
// ENUMERATIONS
// ========================================

export enum UASCStatus {
  ACTIVE = 'ACTIVE',
  GRANTED_LEAVE = 'GRANTED_LEAVE',
  APPEAL_PENDING = 'APPEAL_PENDING',
  REFUSED = 'REFUSED',
  ABSCONDED = 'ABSCONDED',
  RETURNED = 'RETURNED',
  AGED_OUT = 'AGED_OUT'
}

export enum ReferralSource {
  BORDER_FORCE = 'BORDER_FORCE',
  POLICE = 'POLICE',
  PORT_OF_ENTRY = 'PORT_OF_ENTRY',
  SOCIAL_SERVICES = 'SOCIAL_SERVICES',
  HOSPITAL = 'HOSPITAL',
  FOUND_IN_COMMUNITY = 'FOUND_IN_COMMUNITY',
  TRANSFER_FROM_OTHER_LA = 'TRANSFER_FROM_OTHER_LA',
  OTHER = 'OTHER'
}

export enum ArrivalRoute {
  AIR = 'AIR',
  SEA = 'SEA',
  LAND = 'LAND',
  LORRY = 'LORRY',
  SMALL_BOAT = 'SMALL_BOAT',
  UNKNOWN = 'UNKNOWN'
}

export enum TraffickinRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

// ========================================
// UASC PROFILE ENTITY
// ========================================

@Entity('uasc_profiles')
export class UASCProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @Column({ type: 'var char', unique: true })
  uascNumber: string; // Format: UASC-YYYY-NNNN

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'childId' })
  child: Child;

  @Column()
  childId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: string;

  @Column({
    type: 'enum',
    enum: UASCStatus,
    default: UASCStatus.ACTIVE
  })
  status: UASCStatus;

  // ========================================
  // ARRIVAL INFORMATION
  // ========================================

  @Column({ type: 'date' })
  arrivalDate: Date;

  @Column({ type: 'var char', nullable: true })
  arrivalLocation: string;

  @Column({
    type: 'enum',
    enum: ArrivalRoute,
    nullable: true
  })
  arrivalRoute: ArrivalRoute;

  @Column({ type: 'text', nullable: true })
  arrivalCircumstances: string;

  @Column({
    type: 'enum',
    enum: ReferralSource
  })
  referralSource: ReferralSource;

  @Column({ type: 'date' })
  referralDate: Date;

  @Column({ type: 'var char', nullable: true })
  referringOrganization: string;

  @Column({ type: 'var char', nullable: true })
  referringOfficer: string;

  @Column({ type: 'var char', nullable: true })
  referenceNumber: string;

  // ========================================
  // COUNTRY OF ORIGIN
  // ========================================

  @Column({ type: 'var char' })
  countryOfOrigin: string;

  @Column({ type: 'var char', nullable: true })
  countryOfOriginCode: string; // ISO country code

  @Column({ type: 'var char', nullable: true })
  nationality: string;

  @Column({ type: 'var char', nullable: true })
  ethnicOrigin: string;

  @Column({ type: 'var char', nullable: true })
  religion: string;

  @Column({ type: 'var char', nullable: true })
  placeOfBirth: string;

  @Column({ type: 'simple-json', nullable: true })
  countriesTransitedThrough: string[];

  // ========================================
  // LANGUAGES
  // ========================================

  @Column({ type: 'var char' })
  firstLanguage: string;

  @Column({ type: 'simple-json', nullable: true })
  otherLanguagesSpoken: string[];

  @Column({ type: 'var char', nullable: true })
  englishProficiency: string; // None, Basic, Intermediate, Fluent

  @Column({ type: 'boolean', default: true })
  interpreterRequired: boolean;

  @Column({ type: 'var char', nullable: true })
  preferredInterpreterLanguage: string;

  @Column({ type: 'var char', nullable: true })
  interpreterGenderPreference: string;

  @Column({ type: 'text', nullable: true })
  communicationNeeds: string;

  // ========================================
  // FAMILY BACKGROUND
  // ========================================

  @Column({ type: 'text', nullable: true })
  familyBackgroundInCountryOfOrigin: string;

  @Column({ type: 'simple-json', nullable: true })
  parentsDetails: Array<{
    relationship: string;
    name?: string;
    alive: boolean;
    location?: string;
    contactPossible: boolean;
    lastContact?: Date;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  siblingsDetails: Array<{
    name?: string;
    age?: number;
    location?: string;
    inUK: boolean;
  }>;

  @Column({ type: 'boolean', default: false })
  familyMembersInUK: boolean;

  @Column({ type: 'text', nullable: true })
  familyMembersInUKDetails: string;

  @Column({ type: 'boolean', default: false })
  familyTracingRequired: boolean;

  @Column({ type: 'text', nullable: true })
  familyTracingProgress: string;

  @Column({ type: 'var char', nullable: true })
  redCrossReferenceNumber: string;

  // ========================================
  // JOURNEY AND REASONS FOR LEAVING
  // ========================================

  @Column({ type: 'date', nullable: true })
  departureDate: Date;

  @Column({ type: 'text', nullable: true })
  reasonsForLeaving: string;

  @Column({ type: 'text', nullable: true })
  journeyDescription: string;

  @Column({ type: 'int', nullable: true })
  journeyDurationDays: number;

  @Column({ type: 'text', nullable: true })
  traumaticExperiencesDuringJourney: string;

  @Column({ type: 'boolean', default: false })
  traveledWithAdults: boolean;

  @Column({ type: 'text', nullable: true })
  adultsAccompanyingDetails: string;

  @Column({ type: 'boolean', default: false })
  paidForJourney: boolean;

  @Column({ type: 'number', nullable: true })
  journeyCost: number;

  @Column({ type: 'var char', nullable: true })
  journeyCostCurrency: string;

  // ========================================
  // AGE ASSESSMENT
  // ========================================

  @Column({ type: 'date', nullable: true })
  claimedDateOfBirth: Date;

  @Column({ type: 'int', nullable: true })
  claimedAge: number;

  @Column({ type: 'boolean', default: false })
  ageDisputed: boolean;

  @Column({ type: 'text', nullable: true })
  ageDisputeReason: string;

  @Column({ type: 'boolean', default: false })
  ageAssessmentRequired: boolean;

  @Column({ type: 'date', nullable: true })
  ageAssessmentDate: Date;

  @Column({ type: 'var char', nullable: true })
  ageAssessmentOutcome: string;

  @Column({ type: 'date', nullable: true })
  assessedDateOfBirth: Date;

  @Column({ type: 'text', nullable: true })
  ageAssessmentNotes: string;

  // ========================================
  // IMMIGRATION STATUS
  // ========================================

  @Column({ type: 'var char', nullable: true })
  homeOfficeReference: string;

  @Column({ type: 'var char', nullable: true })
  portReferenceNumber: string;

  @Column({ type: 'date', nullable: true })
  asylumClaimDate: Date;

  @Column({ type: 'var char', nullable: true })
  asylumClaimStatus: string;

  @Column({ type: 'var char', nullable: true })
  immigrationStatus: string;

  @Column({ type: 'var char', nullable: true })
  leaveToRemainType: string;

  @Column({ type: 'date', nullable: true })
  leaveToRemainGrantedDate: Date;

  @Column({ type: 'date', nullable: true })
  leaveToRemainExpiryDate: Date;

  @Column({ type: 'boolean', default: false })
  biometricResidencePermit: boolean;

  @Column({ type: 'var char', nullable: true })
  brpNumber: string;

  @Column({ type: 'date', nullable: true })
  brpExpiryDate: Date;

  // ========================================
  // LEGAL REPRESENTATION
  // ========================================

  @Column({ type: 'boolean', default: false })
  hasLegalRepresentation: boolean;

  @Column({ type: 'var char', nullable: true })
  solicitorName: string;

  @Column({ type: 'var char', nullable: true })
  solicitorFirm: string;

  @Column({ type: 'var char', nullable: true })
  solicitorContact: string;

  @Column({ type: 'var char', nullable: true })
  legalAidReference: string;

  // ========================================
  // TRAFFICKING AND EXPLOITATION
  // ========================================

  @Column({
    type: 'enum',
    enum: TraffickinRiskLevel,
    default: TraffickinRiskLevel.LOW
  })
  traffickingRisk: TraffickinRiskLevel;

  @Column({ type: 'text', nullable: true })
  traffickingIndicators: string;

  @Column({ type: 'boolean', default: false })
  nrmReferralMade: boolean;

  @Column({ type: 'date', nullable: true })
  nrmReferralDate: Date;

  @Column({ type: 'var char', nullable: true })
  nrmReferenceNumber: string;

  @Column({ type: 'var char', nullable: true })
  nrmDecision: string;

  @Column({ type: 'date', nullable: true })
  nrmDecisionDate: Date;

  @Column({ type: 'boolean', default: false })
  modernSlaveryIndicators: boolean;

  @Column({ type: 'text', nullable: true })
  modernSlaveryDetails: string;

  // ========================================
  // CULTURAL AND RELIGIOUS NEEDS
  // ========================================

  @Column({ type: 'text', nullable: true })
  culturalNeedsAssessment: string;

  @Column({ type: 'text', nullable: true })
  religiousNeedsAssessment: string;

  @Column({ type: 'text', nullable: true })
  dietaryRequirements: string;

  @Column({ type: 'text', nullable: true })
  culturalActivitiesAccess: string;

  @Column({ type: 'text', nullable: true })
  communityLinks: string;

  // ========================================
  // EDUCATION AND SKILLS
  // ========================================

  @Column({ type: 'text', nullable: true })
  educationInCountryOfOrigin: string;

  @Column({ type: 'var char', nullable: true })
  highestEducationLevel: string;

  @Column({ type: 'simple-json', nullable: true })
  qualificationsFromAbroad: string[];

  @Column({ type: 'text', nullable: true })
  skillsAndExperience: string;

  @Column({ type: 'text', nullable: true })
  careerAspirations: string;

  // ========================================
  // SAFEGUARDING
  // ========================================

  @Column({ type: 'text', nullable: true })
  safeguardingConcerns: string;

  @Column({ type: 'text', nullable: true })
  vulnerabilities: string;

  @Column({ type: 'boolean', default: false })
  goingMissingRisk: boolean;

  @Column({ type: 'text', nullable: true })
  goingMissingRiskFactors: string;

  @Column({ type: 'text', nullable: true })
  protectiveMeasures: string;

  // ========================================
  // AUDIT TRAIL
  // ========================================

  @Column({ type: 'var char' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'var char', nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ========================================
  // COMPUTED METHODS
  // ========================================

  /**
   * Calculate time since arrival in days
   */
  getDaysSinceArrival(): number {
    const today = new Date();
    const arrival = new Date(this.arrivalDate);
    const diffTime = today.getTime() - arrival.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if age assessment is overdue
   */
  isAgeAssessmentOverdue(): boolean {
    if (!this.ageAssessmentRequired) return false;
    if (this.ageAssessmentDate) return false;
    
    // Age assessment should be completed within 5 working days
    const daysSinceReferral = Math.ceil(
      (new Date().getTime() - new Date(this.referralDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysSinceReferral > 7;
  }

  /**
   * Check if BRP is expiring soon (within 3 months)
   */
  isBRPExpiringSoon(): boolean {
    if (!this.brpExpiryDate) return false;
    const today = new Date();
    const expiry = new Date(this.brpExpiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= today;
  }

  /**
   * Check if leave to remain is expiring soon (within 3 months)
   */
  isLeaveToRemainExpiringSoon(): boolean {
    if (!this.leaveToRemainExpiryDate) return false;
    const today = new Date();
    const expiry = new Date(this.leaveToRemainExpiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= today;
  }

  /**
   * Check if high trafficking risk
   */
  isHighTraffickingRisk(): boolean {
    return (
      this.traffickingRisk === TraffickinRiskLevel.HIGH ||
      this.traffickingRisk === TraffickinRiskLevel.VERY_HIGH
    );
  }

  /**
   * Check if requires urgent attention
   */
  requiresUrgentAttention(): boolean {
    return (
      this.isAgeAssessmentOverdue() ||
      this.isHighTraffickingRisk() ||
      this.goingMissingRisk ||
      this.isBRPExpiringSoon() ||
      this.isLeaveToRemainExpiringSoon()
    );
  }
}
