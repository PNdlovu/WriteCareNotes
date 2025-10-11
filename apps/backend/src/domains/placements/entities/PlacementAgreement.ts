/**
 * Placement Agreement Entity
 * Represents the formal placement agreement between LA and care provider
 * Compliantwith: OFSTED Regulation 11, Children Act 1989 Section 23
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Placement } from './Placement';
import { Organization } from '../../../entities/Organization';

export enum AgreementStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  ACTIVE = 'ACTIVE',
  AMENDED = 'AMENDED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED'
}

@Entity('placement_agreements')
@Index(['placementId'])
@Index(['status'])
@Index(['agreementDate'])
export class PlacementAgreement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Placement Reference
  @Column({ name: 'placement_id' })
  placementId: string;

  @ManyToOne(() => Placement)
  @JoinColumn({ name: 'placement_id' })
  placement: Placement;

  // Agreement Details
  @Column({ name: 'agreement_number', length: 100, unique: true })
  agreementNumber: string;

  @Column({ name: 'agreement_date', type: 'timestamp' })
  agreementDate: Date;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ name: 'status', type: 'enum', enum: AgreementStatus })
  status: AgreementStatus;

  // Parties to Agreement
  @Column({ name: 'local_authority', length: 255 })
  localAuthority: string;

  @Column({ name: 'local_authority_representative', type: 'jsonb' })
  localAuthorityRepresentative: {
    name: string;
    role: string;
    email: string;
    phone: string;
    address: string;
  };

  @Column({ name: 'care_provider_organization_id' })
  careProviderOrganizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'care_provider_organization_id' })
  careProviderOrganization: Organization;

  @Column({ name: 'care_provider_representative', type: 'jsonb' })
  careProviderRepresentative: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };

  // Financial Terms
  @Column({ name: 'weekly_placement_fee', type: 'decimal', precision: 10, scale: 2 })
  weeklyPlacementFee: number;

  @Column({ name: 'currency', length: 3, default: 'GBP' })
  currency: string;

  @Column({ name: 'additional_fees', type: 'jsonb', nullable: true })
  additionalFees?: Array<{
    description: string;
    amount: number;
    frequency: 'WEEKLY' | 'MONTHLY' | 'ONE_TIME' | 'AS_REQUIRED';
    invoicedSeparately?: boolean;
  }>;

  @Column({ name: 'pocket_money_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pocketMoneyAmount?: number;

  @Column({ name: 'clothing_allowance', type: 'decimal', precision: 10, scale: 2, nullable: true })
  clothingAllowance?: number;

  @Column({ name: 'payment_terms', type: 'jsonb' })
  paymentTerms: {
    invoiceFrequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
    paymentDueDays: number;
    paymentMethod: string;
    purchaseOrderNumber?: string;
  };

  // Services Included
  @Column({ name: 'services_included', type: 'jsonb' })
  servicesIncluded: {
    accommodation: boolean;
    meals: boolean;
    laundry: boolean;
    personalCare: boolean;
    educationalSupport: boolean;
    therapeuticSupport?: string[];
    leisureActivities: boolean;
    transport: boolean;
    healthcareCoordination: boolean;
    lifeSkillsTraining: boolean;
    otherServices?: string[];
  };

  // Responsibilities
  @Column({ name: 'local_authority_responsibilities', type: 'jsonb' })
  localAuthorityResponsibilities: {
    carePlanReviews: boolean;
    healthAssessments: boolean;
    educationSupport: boolean;
    familyContactArrangements: boolean;
    fundingApproval: boolean;
    statutoryVisits: boolean;
    pathwayPlanning?: boolean;
    other?: string[];
  };

  @Column({ name: 'care_provider_responsibilities', type: 'jsonb' })
  careProviderResponsibilities: {
    dailyCare: boolean;
    safeguarding: boolean;
    educationFacilitation: boolean;
    healthcareCoordination: boolean;
    behaviorManagement: boolean;
    recordKeeping: boolean;
    incidentReporting: boolean;
    regulationCompliance: boolean;
    keyWorkerAllocation: boolean;
    other?: string[];
  };

  // Standards and Requirements
  @Column({ name: 'care_standards', type: 'jsonb' })
  careStandards: {
    ofstedRegistered: boolean;
    registrationNumber?: string;
    maximumOccupancy: number;
    staffRatios: string;
    qualificationRequirements: string[];
    safeguardingPolicies: boolean;
    complaintsProcedure: boolean;
  };

  // Review and Monitoring
  @Column({ name: 'review_frequency_days', type: 'integer', default: 28 })
  reviewFrequencyDays: number;

  @Column({ name: 'next_review_date', type: 'timestamp', nullable: true })
  nextReviewDate?: Date;

  @Column({ name: 'monitoring_arrangements', type: 'jsonb' })
  monitoringArrangements: {
    socialWorkerVisits: string; // e.g., "Every 6 weeks"
    iroReviews: string;
    regulationVisits: string;
    qualityAssurance: string;
  };

  // Termination Terms
  @Column({ name: 'notice_period_days', type: 'integer', default: 28 })
  noticePeriodDays: number;

  @Column({ name: 'termination_conditions', type: 'jsonb' })
  terminationConditions: {
    plannedEndDate?: boolean;
    placementBreakdown?: boolean;
    childRequest?: boolean;
    safeguardingConcerns?: boolean;
    fundingWithdrawn?: boolean;
    breachOfContract?: boolean;
    other?: string[];
  };

  // Emergency Contacts
  @Column({ name: 'emergency_contacts', type: 'jsonb' })
  emergencyContacts: {
    localAuthority: {
      name: string;
      phone: string;
      outOfHours: string;
    };
    careProvider: {
      name: string;
      phone: string;
      outOfHours: string;
    };
  };

  // Complaints and Escalation
  @Column({ name: 'complaints_procedure', type: 'text' })
  complaintsProcedure: string;

  @Column({ name: 'escalation_process', type: 'text' })
  escalationProcess: string;

  // Insurance
  @Column({ name: 'insurance_details', type: 'jsonb', nullable: true })
  insuranceDetails?: {
    publicLiability: boolean;
    professionalIndemnity: boolean;
    employersLiability: boolean;
    policyNumbers?: string[];
    expiryDate?: Date;
  };

  // Data Protection
  @Column({ name: 'data_sharing_agreement', type: 'boolean', default: false })
  dataSharingAgreement: boolean;

  @Column({ name: 'gdpr_compliance', type: 'boolean', default: true })
  gdprCompliance: boolean;

  // Signatures
  @Column({ name: 'local_authority_signed_by', length: 255, nullable: true })
  localAuthoritySignedBy?: string;

  @Column({ name: 'local_authority_signed_date', type: 'timestamp', nullable: true })
  localAuthoritySignedDate?: Date;

  @Column({ name: 'local_authority_signature_url', type: 'text', nullable: true })
  localAuthoritySignatureUrl?: string;

  @Column({ name: 'care_provider_signed_by', length: 255, nullable: true })
  careProviderSignedBy?: string;

  @Column({ name: 'care_provider_signed_date', type: 'timestamp', nullable: true })
  careProviderSignedDate?: Date;

  @Column({ name: 'care_provider_signature_url', type: 'text', nullable: true })
  careProviderSignatureUrl?: string;

  // Amendments
  @Column({ name: 'amendments', type: 'jsonb', default: '[]' })
  amendments: Array<{
    amendmentNumber: number;
    amendmentDate: Date;
    amendedBy: string;
    changes: string;
    reason: string;
    approvedBy: string;
  }>;

  // Supporting Documents
  @Column({ name: 'supporting_documents', type: 'jsonb', default: '[]' })
  supportingDocuments: Array<{
    documentType: string;
    documentName: string;
    documentUrl: string;
    uploadedAt: Date;
  }>;

  // Audit Trail
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 255 })
  createdBy: string;

  @Column({ name: 'updated_by', length: 255 })
  updatedBy: string;

  // Methods
  
  /**
   * Check if agreement is fully signed
   */
  isFullySigned(): boolean {
    return !!(this.localAuthoritySignedDate && this.careProviderSignedDate);
  }

  /**
   * Check if agreement is active
   */
  isActive(): boolean {
    if (this.status !== AgreementStatus.ACTIVE) return false;
    
    const now = new Date();
    if (now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;
    
    return true;
  }

  /**
   * Check if agreement is expiring soon (within 30 days)
   */
  isExpiringSoon(): boolean {
    if (!this.endDate) return false;
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return this.endDate <= thirtyDaysFromNow;
  }

  /**
   * Add amendment to agreement
   */
  addAmendment(amendment: {
    changes: string;
    reason: string;
    amendedBy: string;
    approvedBy: string;
  }): void {
    this.amendments.push({
      amendmentNumber: this.amendments.length + 1,
      amendmentDate: new Date(),
      ...amendment
    });
    this.status = AgreementStatus.AMENDED;
  }

  /**
   * Calculate total weekly cost including additional fees
   */
  calculateTotalWeeklyCost(): number {
    let total = this.weeklyPlacementFee;
    
    if (this.additionalFees) {
      this.additionalFees.forEach(fee => {
        if (fee.frequency === 'WEEKLY') {
          total += fee.amount;
        }
      });
    }
    
    return total;
  }
}
