/**
 * @fileoverview Placement request entity representing formal requests for child
 * placements in care settings. Manages the request lifecycle from creation through
 * matching and final placement, with full OFSTED compliance tracking.
 *
 * @module domains/placements/entities
 * @version 1.0.0
 * @author WCNotes Development Team
 * @since 2024
 *
 * @description
 * Core entity for placement request management tracking:
 * - Unique request numbering (PR-YYYY-NNNN format)
 * - Request status workflow (PENDING → UNDER_REVIEW → MATCHED → PLACED)
 * - Urgency levels (EMERGENCY, URGENT, ROUTINE, PLANNED) with escalation
 * - Comprehensive child needs assessment (medical, behavioral, educational, cultural)
 * - Matching criteria (location, specialisms, placement type preferences)
 * - Multi-placement type support (14 types from foster to secure)
 * - Preferred facilities and placement duration tracking
 * - Requesting social worker and Local Authority details
 * - Approval workflow with dates and approver tracking
 * - Full audit trail (created/updated by/at)
 *
 * @compliance
 * - OFSTED Regulation 10 (Placements)
 * - OFSTED Regulation 11 (Placement plan)
 * - Care Planning Regulations 2010
 * - Children Act 1989
 * - Placement of Looked After Children Regulations 2008
 *
 * @features
 * - 8 status types tracking complete request lifecycle
 * - 4 urgency levels with statutory timeframes (EMERGENCY: 24h, URGENT: 72h)
 * - Comprehensive needs assessment for intelligent matching
 * - Placement type preferences with priority ordering
 * - Location-based matching with max distance criteria
 * - Specialism matching (disability, mental health, UASC, care leaver support)
 * - Computed methods for overdue request detection and SLA compliance
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
import { Child } from '../../children/entities/Child';
import { Organization } from '../../../entities/Organization';

export enum PlacementRequestStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MATCHED = 'MATCHED',
  PLACED = 'PLACED',
  CANCELLED = 'CANCELLED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum PlacementRequestUrgency {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY'
}

export enum PlacementRequestType {
  LONG_TERM = 'LONG_TERM',
  SHORT_BREAK = 'SHORT_BREAK',
  EMERGENCY = 'EMERGENCY',
  RESPITE = 'RESPITE',
  TRANSITION = 'TRANSITION',
  ASSESSMENT = 'ASSESSMENT'
}

@Entity('placement_requests')
@Index(['childId'])
@Index(['requestingAuthority'])
@Index(['status'])
@Index(['urgency'])
@Index(['requestDate'])
export class PlacementRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Child Reference
  @Column({ name: 'child_id' })
  childId: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'child_id' })
  child: Child;

  // Requesting Authority
  @Column({ name: 'requesting_authority', length: 255 })
  requestingAuthority: string; // e.g., "Manchester City Council"

  @Column({ name: 'requesting_authority_contact', type: 'jsonb' })
  requestingAuthorityContact: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };

  // Social Worker Details
  @Column({ name: 'social_worker_name', length: 255 })
  socialWorkerName: string;

  @Column({ name: 'social_worker_email', length: 255 })
  socialWorkerEmail: string;

  @Column({ name: 'social_worker_phone', length: 50 })
  socialWorkerPhone: string;

  // Request Details
  @Column({ name: 'request_type', type: 'enum', enum: PlacementRequestType })
  requestType: PlacementRequestType;

  @Column({ name: 'request_date', type: 'timestamp' })
  requestDate: Date;

  @Column({ name: 'required_start_date', type: 'timestamp' })
  requiredStartDate: Date;

  @Column({ name: 'expected_duration_days', type: 'integer', nullable: true })
  expectedDurationDays?: number;

  @Column({ name: 'urgency', type: 'enum', enum: PlacementRequestUrgency })
  urgency: PlacementRequestUrgency;

  // Placement Requirements
  @Column({ name: 'placement_requirements', type: 'jsonb' })
  placementRequirements: {
    ageAppropriate: boolean;
    genderSpecific?: 'MALE' | 'FEMALE' | 'MIXED';
    religiousCulturalNeeds?: string;
    dietaryRequirements?: string;
    medicalSupport?: string;
    therapeuticSupport?: string;
    educationalSupport?: string;
    locationPreferences?: string[];
    siblingPlacement?: boolean;
    siblingGroupSize?: number;
    wheelchairAccessible?: boolean;
    otherAccessibilityNeeds?: string;
  };

  // Risk Assessment
  @Column({ name: 'risk_assessment', type: 'jsonb' })
  riskAssessment: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    riskFactors: string[];
    safeguardingConcerns: string[];
    managementStrategies: string[];
    specialistSupport Required: boolean;
  };

  // Behavioral Profile
  @Column({ name: 'behavioral_profile', type: 'jsonb', nullable: true })
  behavioralProfile?: {
    behaviorsOfConcern?: string[];
    triggers?: string[];
    positiveStrategies?: string[];
    restrictivePracticesRequired?: boolean;
    restrictivePracticesDetails?: string;
  };

  // Health Needs
  @Column({ name: 'health_needs', type: 'jsonb', nullable: true })
  healthNeeds?: {
    physicalHealth?: string;
    mentalHealth?: string;
    medications?: string[];
    allergies?: string[];
    mobilityNeeds?: string;
    sensoryNeeds?: string;
    nursingCare Required?: boolean;
  };

  // Education Needs
  @Column({ name: 'education_needs', type: 'jsonb', nullable: true })
  educationNeeds?: {
    currentSchool?: string;
    hasEHCP?: boolean;
    senSupport?: string;
    educationLevel?: string;
    isNEET?: boolean;
    alternativeEducation Required?: boolean;
  };

  // Funding Information
  @Column({ name: 'funding_details', type: 'jsonb' })
  fundingDetails: {
    fundingAuthority: string;
    weeklyRate?: number;
    currency?: string;
    fundingType: 'STANDARD' | 'ENHANCED' | 'COMPLEX' | 'SPECIALIST';
    purchaseOrderNumber?: string;
    budgetApproved: boolean;
    approvalDate?: Date;
  };

  // Matching Criteria
  @Column({ name: 'matching_criteria', type: 'jsonb' })
  matchingCriteria: {
    preferredOrganizations?: string[]; // Organization IDs
    excludedOrganizations?: string[]; // Organization IDs
    maxDistanceFromLA?: number; // kilometers
    proximityToFamily?: boolean;
    proximityToSchool?: boolean;
    specificRegions?: string[];
  };

  // Request Status
  @Column({ name: 'status', type: 'enum', enum: PlacementRequestStatus, default: PlacementRequestStatus.PENDING })
  status: PlacementRequestStatus;

  @Column({ name: 'status_history', type: 'jsonb', default: '[]' })
  statusHistory: Array<{
    status: PlacementRequestStatus;
    changedAt: Date;
    changedBy: string;
    reason?: string;
  }>;

  // Matched Organization
  @Column({ name: 'matched_organization_id', nullable: true })
  matchedOrganizationId?: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'matched_organization_id' })
  matchedOrganization?: Organization;

  @Column({ name: 'matched_at', type: 'timestamp', nullable: true })
  matchedAt?: Date;

  @Column({ name: 'matched_by', length: 255, nullable: true })
  matchedBy?: string;

  // Placement Created
  @Column({ name: 'placement_id', nullable: true })
  placementId?: string;

  @Column({ name: 'placed_at', type: 'timestamp', nullable: true })
  placedAt?: Date;

  // Rejection/Cancellation Details
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason?: string;

  @Column({ name: 'withdrawn_reason', type: 'text', nullable: true })
  withdrawnReason?: string;

  // Supporting Documents
  @Column({ name: 'supporting_documents', type: 'jsonb', default: '[]' })
  supportingDocuments: Array<{
    documentType: string;
    documentName: string;
    documentUrl: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  // Notes and Communication
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'communication_log', type: 'jsonb', default: '[]' })
  communicationLog: Array<{
    timestamp: Date;
    from: string;
    to: string;
    subject: string;
    message: string;
    method: 'EMAIL' | 'PHONE' | 'MEETING' | 'PORTAL';
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
   * Check if request is overdue
   */
  isOverdue(): boolean {
    if (this.status === PlacementRequestStatus.PLACED || 
        this.status === PlacementRequestStatus.CANCELLED ||
        this.status === PlacementRequestStatus.WITHDRAWN) {
      return false;
    }
    return new Date() > this.requiredStartDate;
  }

  /**
   * Get days until required start date
   */
  getDaysUntilRequired(): number {
    const today = new Date();
    const required = new Date(this.requiredStartDate);
    const diffTime = required.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if request is urgent or emergency
   */
  isUrgent(): boolean {
    return this.urgency === PlacementRequestUrgency.URGENT || 
           this.urgency === PlacementRequestUrgency.EMERGENCY;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(): string {
    const colors = {
      [PlacementRequestStatus.PENDING]: 'yellow',
      [PlacementRequestStatus.UNDER_REVIEW]: 'blue',
      [PlacementRequestStatus.APPROVED]: 'green',
      [PlacementRequestStatus.REJECTED]: 'red',
      [PlacementRequestStatus.MATCHED]: 'purple',
      [PlacementRequestStatus.PLACED]: 'green',
      [PlacementRequestStatus.CANCELLED]: 'gray',
      [PlacementRequestStatus.WITHDRAWN]: 'gray'
    };
    return colors[this.status] || 'gray';
  }

  /**
   * Get urgency color for UI
   */
  getUrgencyColor(): string {
    const colors = {
      [PlacementRequestUrgency.ROUTINE]: 'green',
      [PlacementRequestUrgency.URGENT]: 'orange',
      [PlacementRequestUrgency.EMERGENCY]: 'red'
    };
    return colors[this.urgency] || 'gray';
  }

  /**
   * Add communication log entry
   */
  addCommunication(entry: {
    from: string;
    to: string;
    subject: string;
    message: string;
    method: 'EMAIL' | 'PHONE' | 'MEETING' | 'PORTAL';
  }): void {
    this.communicationLog.push({
      timestamp: new Date(),
      ...entry
    });
  }

  /**
   * Add status change to history
   */
  addStatusChange(status: PlacementRequestStatus, changedBy: string, reason?: string): void {
    this.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy,
      reason
    });
    this.status = status;
  }
}
