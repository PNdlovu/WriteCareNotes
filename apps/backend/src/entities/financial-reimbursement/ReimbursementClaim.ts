import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum ClaimType {
  NHS_CHC = 'nhs_chc',
  LOCAL_AUTHORITY = 'local_authority',
  PRIVATE_INSURANCE = 'private_insurance',
  DIRECT_PAYMENT = 'direct_payment',
  PERSONAL_HEALTH_BUDGET = 'personal_health_budget',
  JOINT_FUNDING = 'joint_funding'
}

export enum ClaimStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PARTIALLY_APPROVED = 'partially_approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  DISPUTED = 'disputed'
}

export interface ReimbursementEvidence {
  evidenceType: 'care_plan' | 'assessment' | 'medical_report' | 'invoice' | 'timesheet';
  documentId: string;
  documentName: string;
  uploadDate: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verificationNotes?: string;
}

export interface PayerConfiguration {
  payerId: string;
  payerName: string;
  payerType: ClaimType;
  submissionMethod: 'api' | 'portal' | 'email' | 'post';
  apiEndpoint?: string;
  authenticationMethod: 'oauth2' | 'api_key' | 'certificate';
  claimFormats: string[];
  maxClaimValue: number;
  processingTimeframe: number; // days
  paymentTerms: number; // days
}

@Entity('reimbursement_claims')
export class ReimbursementClaim extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  claimNumber: string;

  @Column('uuid')
  residentId: string;

  @Column({
    type: 'enum',
    enum: ClaimType
  })
  claimType: ClaimType;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.DRAFT
  })
  status: ClaimStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  claimAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  approvedAmount?: number;

  @Column('date')
  serviceStartDate: Date;

  @Column('date')
  serviceEndDate: Date;

  @Column('jsonb')
  payerConfiguration: PayerConfiguration;

  @Column('jsonb')
  evidence: ReimbursementEvidence[];

  @Column('jsonb')
  claimItems: Array<{
    itemId: string;
    serviceCode: string;
    description: string;
    quantity: number;
    unitRate: number;
    totalAmount: number;
    evidenceRequired: boolean;
  }>;

  @Column('timestamp', { nullable: true })
  submissionDate?: Date;

  @Column('timestamp', { nullable: true })
  responseDate?: Date;

  @Column('timestamp', { nullable: true })
  paymentDate?: Date;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column('text', { nullable: true })
  payerReference?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business Methods
  isSubmittable(): boolean {
    return this.status === ClaimStatus.DRAFT && 
           this.hasRequiredEvidence() && 
           this.claimAmount > 0;
  }

  hasRequiredEvidence(): boolean {
    const requiredItems = this.claimItems.filter(item => item.evidenceRequired);
    return requiredItems.every(item => 
      this.evidence.some(evidence => 
        evidence.verificationStatus === 'verified' && 
        evidence.evidenceType === 'invoice'
      )
    );
  }

  isOverdue(): boolean {
    if (!this.submissionDate) return false;
    const expectedResponse = new Date(this.submissionDate);
    expectedResponse.setDate(expectedResponse.getDate() + this.payerConfiguration.processingTimeframe);
    return new Date() > expectedResponse && !this.responseDate;
  }

  calculateTotalAmount(): number {
    return this.claimItems.reduce((sum, item) => sum + item.totalAmount, 0);
  }

  getApprovalRate(): number {
    if (!this.approvedAmount || this.claimAmount === 0) return 0;
    return (this.approvedAmount / this.claimAmount) * 100;
  }
}
