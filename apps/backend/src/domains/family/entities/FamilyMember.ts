/**
 * ============================================================================
 * Family Member Entity
 * ============================================================================
 * 
 * @fileoverview Family member entity for tracking child's family relationships,
 *               parental responsibility, and contact restrictions.
 * 
 * @module domains/family/entities/FamilyMember
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Manages comprehensive family relationship data for looked after children
 * including biological relatives, adoptive/foster families, significant persons,
 * parental responsibility holders, and contact restrictions. Essential for
 * maintaining family connections while ensuring child safety and regulatory
 * compliance.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Children's views, wishes and feelings)
 * - Children Act 1989, Section 22(4) - Promotion of contact
 * - Adoption and Children Act 2002 - Parental responsibility
 * - Human Rights Act 1998, Article 8 - Right to family life
 * - GDPR 2018 - Data protection for family member information
 * 
 * @features
 * - Family relationship tracking (biological, adoptive, foster, significant persons)
 * - Parental responsibility management with legal evidence
 * - Contact restrictions with safeguarding reasons
 * - Court order integration
 * - Emergency contact details
 * - Relationship verification and documentation
 * - Audit trail for all changes
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
import { Organization } from '../../../entities/Organization';

/**
 * Relationship types between family member and child
 */
export enum RelationshipType {
  BIOLOGICAL_PARENT = 'BIOLOGICAL_PARENT',
  BIOLOGICAL_MOTHER = 'BIOLOGICAL_MOTHER',
  BIOLOGICAL_FATHER = 'BIOLOGICAL_FATHER',
  STEP_PARENT = 'STEP_PARENT',
  ADOPTIVE_PARENT = 'ADOPTIVE_PARENT',
  FOSTER_PARENT = 'FOSTER_PARENT',
  GUARDIAN = 'GUARDIAN',
  SIBLING = 'SIBLING',
  HALF_SIBLING = 'HALF_SIBLING',
  STEP_SIBLING = 'STEP_SIBLING',
  GRANDPARENT = 'GRANDPARENT',
  AUNT_UNCLE = 'AUNT_UNCLE',
  COUSIN = 'COUSIN',
  SIGNIFICANT_OTHER = 'SIGNIFICANT_OTHER',
  FAMILY_FRIEND = 'FAMILY_FRIEND',
  OTHER = 'OTHER'
}

/**
 * Family member status
 */
export enum FamilyMemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DECEASED = 'DECEASED',
  CONTACT_PROHIBITED = 'CONTACT_PROHIBITED',
  WHEREABOUTS_UNKNOWN = 'WHEREABOUTS_UNKNOWN'
}

/**
 * Parental responsibility status
 */
export enum ParentalResponsibilityStatus {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  NONE = 'NONE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

/**
 * Contact restriction levels
 */
export enum ContactRestrictionLevel {
  NONE = 'NONE',
  SUPERVISED_ONLY = 'SUPERVISED_ONLY',
  WRITTEN_ONLY = 'WRITTEN_ONLY',
  NO_CONTACT = 'NO_CONTACT',
  COURT_ORDER_REQUIRED = 'COURT_ORDER_REQUIRED'
}

@Entity('family_members')
@Index(['childId', 'status'])
@Index(['childId', 'relationshipType'])
@Index(['childId', 'hasParentalResponsibility'])
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ========================================
  // CORE IDENTIFICATION
  // ========================================

  @Column({ name: 'family_member_number', length: 50, unique: true })
  familyMemberNumber!: string;

  @Column({ name: 'child_id', type: 'uuid' })
  childId!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  // ========================================
  // PERSONAL INFORMATION
  // ========================================

  @Column({ name: 'first_name', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', length: 100 })
  lastName!: string;

  @Column({ name: 'middle_name', length: 100, nullable: true })
  middleName?: string;

  @Column({ name: 'preferred_name', length: 100, nullable: true })
  preferredName?: string;

  @Column({ name: 'maiden_name', length: 100, nullable: true })
  maidenName?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ name: 'gender', length: 20, nullable: true })
  gender?: string;

  @Column({ name: 'national_insurance_number', length: 20, nullable: true })
  nationalInsuranceNumber?: string;

  // ========================================
  // RELATIONSHIP INFORMATION
  // ========================================

  @Column({ name: 'relationship_type', type: 'enum', enum: RelationshipType })
  relationshipType!: RelationshipType;

  @Column({ name: 'relationship_details', type: 'text', nullable: true })
  relationshipDetails?: string;

  @Column({ name: 'status', type: 'enum', enum: FamilyMemberStatus, default: FamilyMemberStatus.ACTIVE })
  status!: FamilyMemberStatus;

  @Column({ name: 'is_significant_person', type: 'boolean', default: false })
  isSignificantPerson!: boolean;

  @Column({ name: 'significance_reason', type: 'text', nullable: true })
  significanceReason?: string;

  // ========================================
  // PARENTAL RESPONSIBILITY
  // ========================================

  @Column({ name: 'has_parental_responsibility', type: 'boolean', default: false })
  hasParentalResponsibility!: boolean;

  @Column({ name: 'parental_responsibility_status', type: 'enum', enum: ParentalResponsibilityStatus, nullable: true })
  parentalResponsibilityStatus?: ParentalResponsibilityStatus;

  @Column({ name: 'parental_responsibility_details', type: 'text', nullable: true })
  parentalResponsibilityDetails?: string;

  @Column({ name: 'parental_responsibility_evidence', type: 'text', nullable: true })
  parentalResponsibilityEvidence?: string;

  @Column({ name: 'parental_responsibility_granted_date', type: 'date', nullable: true })
  parentalResponsibilityGrantedDate?: Date;

  @Column({ name: 'parental_responsibility_expires', type: 'date', nullable: true })
  parentalResponsibilityExpires?: Date;

  // ========================================
  // CONTACT INFORMATION
  // ========================================

  @Column({ name: 'contact_restriction_level', type: 'enum', enum: ContactRestrictionLevel, default: ContactRestrictionLevel.NONE })
  contactRestrictionLevel!: ContactRestrictionLevel;

  @Column({ name: 'contact_restriction_reason', type: 'text', nullable: true })
  contactRestrictionReason?: string;

  @Column({ name: 'contact_restriction_start_date', type: 'date', nullable: true })
  contactRestrictionStartDate?: Date;

  @Column({ name: 'contact_restriction_review_date', type: 'date', nullable: true })
  contactRestrictionReviewDate?: Date;

  @Column({ name: 'court_order_reference', type: 'var char', length: 100, nullable: true })
  courtOrderReference?: string;

  @Column({ name: 'court_order_type', type: 'var char', length: 100, nullable: true })
  courtOrderType?: string;

  @Column({ name: 'court_order_date', type: 'date', nullable: true })
  courtOrderDate?: Date;

  @Column({ name: 'court_order_expires', type: 'date', nullable: true })
  courtOrderExpires?: Date;

  // ========================================
  // ADDRESS & CONTACT DETAILS
  // ========================================

  @Column({ name: 'address_line_1', type: 'var char', length: 200, nullable: true })
  addressLine1?: string;

  @Column({ name: 'address_line_2', type: 'var char', length: 200, nullable: true })
  addressLine2?: string;

  @Column({ name: 'city', type: 'var char', length: 100, nullable: true })
  city?: string;

  @Column({ name: 'county', type: 'var char', length: 100, nullable: true })
  county?: string;

  @Column({ name: 'postcode', type: 'var char', length: 20, nullable: true })
  postcode?: string;

  @Column({ name: 'country', type: 'var char', length: 100, default: 'United Kingdom' })
  country!: string;

  @Column({ name: 'phone_home', type: 'var char', length: 20, nullable: true })
  phoneHome?: string;

  @Column({ name: 'phone_mobile', type: 'var char', length: 20, nullable: true })
  phoneMobile?: string;

  @Column({ name: 'phone_work', type: 'var char', length: 20, nullable: true })
  phoneWork?: string;

  @Column({ name: 'email', type: 'var char', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'preferred_contact_method', type: 'var char', length: 50, nullable: true })
  preferredContactMethod?: string;

  @Column({ name: 'interpreter_required', type: 'boolean', default: false })
  interpreterRequired!: boolean;

  @Column({ name: 'interpreter_language', type: 'var char', length: 100, nullable: true })
  interpreterLanguage?: string;

  // ========================================
  // EMERGENCY CONTACT
  // ========================================

  @Column({ name: 'is_emergency_contact', type: 'boolean', default: false })
  isEmergencyContact!: boolean;

  @Column({ name: 'emergency_contact_priority', type: 'int', nullable: true })
  emergencyContactPriority?: number;

  @Column({ name: 'emergency_contact_notes', type: 'text', nullable: true })
  emergencyContactNotes?: string;

  // ========================================
  // RELATIONSHIP VERIFICATION
  // ========================================

  @Column({ name: 'relationship_verified', type: 'boolean', default: false })
  relationshipVerified!: boolean;

  @Column({ name: 'verification_date', type: 'date', nullable: true })
  verificationDate?: Date;

  @Column({ name: 'verification_method', type: 'var char', length: 100, nullable: true })
  verificationMethod?: string;

  @Column({ name: 'verification_documents', type: 'jsonb', nullable: true })
  verificationDocuments?: {
    documentType: string;
    documentNumber: string;
    issuedBy: string;
    issuedDate: Date;
    expiryDate?: Date;
    verifiedBy: string;
    verifiedDate: Date;
  }[];

  // ========================================
  // SAFEGUARDING
  // ========================================

  @Column({ name: 'safeguarding_concerns', type: 'boolean', default: false })
  safeguardingConcerns!: boolean;

  @Column({ name: 'safeguarding_details', type: 'text', nullable: true })
  safeguardingDetails?: string;

  @Column({ name: 'risk_to_child', type: 'var char', length: 50, nullable: true })
  riskToChild?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

  @Column({ name: 'criminal_record', type: 'boolean', default: false })
  criminalRecord!: boolean;

  @Column({ name: 'criminal_record_details', type: 'text', nullable: true })
  criminalRecordDetails?: string;

  @Column({ name: 'dbs_check_required', type: 'boolean', default: false })
  dbsCheckRequired!: boolean;

  @Column({ name: 'dbs_check_status', type: 'var char', length: 50, nullable: true })
  dbsCheckStatus?: 'PENDING' | 'CLEAR' | 'WITH_CONCERNS' | 'EXPIRED' | 'NOT_REQUIRED';

  @Column({ name: 'dbs_check_date', type: 'date', nullable: true })
  dbsCheckDate?: Date;

  @Column({ name: 'dbs_certificate_number', type: 'var char', length: 50, nullable: true })
  dbsCertificateNumber?: string;

  // ========================================
  // ADDITIONAL INFORMATION
  // ========================================

  @Column({ name: 'occupation', type: 'var char', length: 200, nullable: true })
  occupation?: string;

  @Column({ name: 'employer', type: 'var char', length: 200, nullable: true })
  employer?: string;

  @Column({ name: 'health_conditions', type: 'text', nullable: true })
  healthConditions?: string;

  @Column({ name: 'disabilities', type: 'text', nullable: true })
  disabilities?: string;

  @Column({ name: 'additional_needs', type: 'text', nullable: true })
  additionalNeeds?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

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

  @ManyToOne(() => Organization, organization => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  // ========================================
  // COMPUTED METHODS
  // ========================================

  /**
   * Get full name
   */
  getFullName(): string {
    const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
    return parts.join(' ');
  }

  /**
   * Check if contact is allowed
   */
  isContactAllowed(): boolean {
    return this.contactRestrictionLevel !== ContactRestrictionLevel.NO_CONTACT &&
           this.status === FamilyMemberStatus.ACTIVE;
  }

  /**
   * Check if supervised contact required
   */
  requiresSupervisedContact(): boolean {
    return this.contactRestrictionLevel === ContactRestrictionLevel.SUPERVISED_ONLY;
  }

  /**
   * Check if court order is active
   */
  hasActiveCourtOrder(): boolean {
    if (!this.courtOrderExpires) {
      return !!this.courtOrderReference;
    }
    return !!this.courtOrderReference && new Date(this.courtOrderExpires) > new Date();
  }

  /**
   * Check if parental responsibility is current
   */
  hasCurrentParentalResponsibility(): boolean {
    if (!this.hasParentalResponsibility) {
      return false;
    }
    if (!this.parentalResponsibilityExpires) {
      return true;
    }
    return new Date(this.parentalResponsibilityExpires) > new Date();
  }

  /**
   * Check if contact restriction review is due
   */
  isContactRestrictionReviewDue(): boolean {
    if (!this.contactRestrictionReviewDate) {
      return false;
    }
    const daysDiff = Math.floor(
      (new Date(this.contactRestrictionReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 30;
  }

  /**
   * Check if DBS check is valid
   */
  hasValidDBSCheck(): boolean {
    if (!this.dbsCheckRequired) {
      return true;
    }
    if (!this.dbsCheckDate) {
      return false;
    }
    // DBS checks valid for 3 years
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    return new Date(this.dbsCheckDate) > threeYearsAgo &&
           this.dbsCheckStatus === 'CLEAR';
  }

  /**
   * Get relationship display text
   */
  getRelationshipDisplay(): string {
    return this.relationshipType.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
