import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '../BaseEntity';
import { Employee } from './Employee';

export enum TimeOffType {
  ANNUAL_LEAVE = 'annual_leave',
  SICK_LEAVE = 'sick_leave',
  PERSONAL_LEAVE = 'personal_leave',
  MATERNITY_LEAVE = 'maternity_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  PARENTAL_LEAVE = 'parental_leave',
  BEREAVEMENT_LEAVE = 'bereavement_leave',
  STUDY_LEAVE = 'study_leave',
  COMPASSIONATE_LEAVE = 'compassionate_leave',
  UNPAID_LEAVE = 'unpaid_leave',
  FLEXIBLE_WORKING = 'flexible_working',
  WORK_FROM_HOME = 'work_from_home',
  OTHER = 'other'
}

export enum RequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  MODIFIED = 'modified',
  EXPIRED = 'expired'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ApprovalLevel {
  MANAGER = 'manager',
  HR = 'hr',
  DIRECTOR = 'director',
  CEO = 'ceo'
}

export interface TimeOffDetails {
  type: TimeOffType;
  reason: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  isFullDay: boolean;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon';
  totalDays: number;
  totalHours?: number;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
}

export interface CoverageArrangements {
  coverageRequired: boolean;
  coverageProvider?: {
    employeeId: string;
    employeeName: string;
    department: string;
    contactInfo: string;
  };
  handoverNotes?: string;
  criticalTasks?: string[];
  emergencyContact?: string;
  backupCoverage?: {
    employeeId: string;
    employeeName: string;
    contactInfo: string;
  };
}

export interface ApprovalWorkflow {
  currentLevel: ApprovalLevel;
  requiredLevels: ApprovalLevel[];
  approvers: {
    level: ApprovalLevel;
    approverId: string;
    approverName: string;
    approverEmail: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: Date;
    comments?: string;
  }[];
  autoApproval: boolean;
  autoApprovalConditions?: string[];
  escalationRequired: boolean;
  escalationDate?: Date;
  escalationReason?: string;
}

export interface ImpactAssessment {
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  departmentImpact: string[];
  projectImpact: string[];
  clientImpact: string[];
  financialImpact?: number;
  riskMitigation: string[];
  contingencyPlans: string[];
  communicationRequired: boolean;
  stakeholdersToNotify: string[];
}

export interface Documentation {
  medicalCertificate?: {
    required: boolean;
    provided: boolean;
    url?: string;
    expiryDate?: Date;
  };
  supportingDocuments: {
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
  legalRequirements?: {
    type: string;
    description: string;
    status: 'met' | 'pending' | 'not_required';
  }[];
}

@Entity('time_off_requests')
export class TimeOffRequest extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  requestId: string;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.DRAFT
  })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM
  })
  @IsEnum(Priority)
  priority: Priority;

  @Column('jsonb')
  @IsNotEmpty()
  timeOffDetails: TimeOffDetails;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  coverageArrangements?: CoverageArrangements;

  @Column('jsonb')
  @IsNotEmpty()
  approvalWorkflow: ApprovalWorkflow;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  impactAssessment?: ImpactAssessment;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  documentation?: Documentation;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  comments?: string;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  modificationNotes?: string;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  approvedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  @BeforeInsert()
  generateRequestId() {
    if (!this.requestId) {
      this.requestId = `TOR-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateTimeOffRequest() {
    if (!this.timeOffDetails || !this.approvalWorkflow) {
      throw new Error('Required time off request sections must be provided');
    }

    // Validate dates
    if (new Date(this.timeOffDetails.endDate) <= new Date(this.timeOffDetails.startDate)) {
      throw new Error('End date must be after start date');
    }

    // Validate half day
    if (this.timeOffDetails.isHalfDay && !this.timeOffDetails.halfDayType) {
      throw new Error('Half day type must be specified for half day requests');
    }

    // Validate recurring pattern
    if (this.timeOffDetails.isRecurring && !this.timeOffDetails.recurringPattern) {
      throw new Error('Recurring pattern must be specified for recurring requests');
    }
  }

  isDraft(): boolean {
    return this.status === RequestStatus.DRAFT;
  }

  isPending(): boolean {
    return this.status === RequestStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === RequestStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === RequestStatus.REJECTED;
  }

  isCancelled(): boolean {
    return this.status === RequestStatus.CANCELLED;
  }

  isExpired(): boolean {
    return this.status === RequestStatus.EXPIRED;
  }

  isActive(): boolean {
    return this.isApproved() && this.isCurrent();
  }

  isCurrent(): boolean {
    const now = new Date();
    const startDate = new Date(this.timeOffDetails.startDate);
    const endDate = new Date(this.timeOffDetails.endDate);
    return now >= startDate && now <= endDate;
  }

  isFuture(): boolean {
    const now = new Date();
    const startDate = new Date(this.timeOffDetails.startDate);
    return startDate > now;
  }

  isPast(): boolean {
    const now = new Date();
    const endDate = new Date(this.timeOffDetails.endDate);
    return endDate < now;
  }

  getDurationInDays(): number {
    return this.timeOffDetails.totalDays;
  }

  getDurationInHours(): number {
    return this.timeOffDetails.totalHours || (this.timeOffDetails.totalDays * 8);
  }

  getDaysUntilStart(): number {
    const now = new Date();
    const startDate = new Date(this.timeOffDetails.startDate);
    const diffTime = startDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilEnd(): number {
    const now = new Date();
    const endDate = new Date(this.timeOffDetails.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isUrgent(): boolean {
    return this.priority === Priority.URGENT || this.getDaysUntilStart() <= 3;
  }

  isHighPriority(): boolean {
    return this.priority === Priority.HIGH || this.priority === Priority.URGENT;
  }

  needsCoverage(): boolean {
    return this.coverageArrangements?.coverageRequired || false;
  }

  hasCoverage(): boolean {
    return this.coverageArrangements?.coverageProvider !== undefined;
  }

  getCoverageProvider(): string | null {
    return this.coverageArrangements?.coverageProvider?.employeeName || null;
  }

  getCurrentApprover(): string | null {
    const currentApprover = this.approvalWorkflow.approvers.find(
      approver => approver.status === 'pending'
    );
    return currentApprover?.approverName || null;
  }

  getApprovalProgress(): number {
    const totalApprovers = this.approvalWorkflow.approvers.length;
    const approvedCount = this.approvalWorkflow.approvers.filter(
      approver => approver.status === 'approved'
    ).length;
    return Math.round((approvedCount / totalApprovers) * 100);
  }

  isFullyApproved(): boolean {
    return this.approvalWorkflow.approvers.every(
      approver => approver.status === 'approved'
    );
  }

  hasRejection(): boolean {
    return this.approvalWorkflow.approvers.some(
      approver => approver.status === 'rejected'
    );
  }

  getRejectionReason(): string | null {
    const rejectedApprover = this.approvalWorkflow.approvers.find(
      approver => approver.status === 'rejected'
    );
    return rejectedApprover?.comments || null;
  }

  needsEscalation(): boolean {
    return this.approvalWorkflow.escalationRequired && 
           this.approvalWorkflow.escalationDate && 
           new Date() >= new Date(this.approvalWorkflow.escalationDate);
  }

  getEscalationReason(): string | null {
    return this.approvalWorkflow.escalationReason || null;
  }

  getBusinessImpact(): string {
    return this.impactAssessment?.businessImpact || 'low';
  }

  isHighImpact(): boolean {
    return this.impactAssessment?.businessImpact === 'high' || 
           this.impactAssessment?.businessImpact === 'critical';
  }

  requiresMedicalCertificate(): boolean {
    return this.documentation?.medicalCertificate?.required || false;
  }

  hasMedicalCertificate(): boolean {
    return this.documentation?.medicalCertificate?.provided || false;
  }

  isMedicalCertificateValid(): boolean {
    if (!this.documentation?.medicalCertificate?.expiryDate) return true;
    return new Date() <= new Date(this.documentation.medicalCertificate.expiryDate);
  }

  getSupportingDocuments(): any[] {
    return this.documentation?.supportingDocuments || [];
  }

  hasSupportingDocuments(): boolean {
    return this.getSupportingDocuments().length > 0;
  }

  isRecurring(): boolean {
    return this.timeOffDetails.isRecurring;
  }

  getRecurringPattern(): any {
    return this.timeOffDetails.recurringPattern;
  }

  isHalfDay(): boolean {
    return this.timeOffDetails.isHalfDay || false;
  }

  getHalfDayType(): string | null {
    return this.timeOffDetails.halfDayType || null;
  }

  isFullDay(): boolean {
    return this.timeOffDetails.isFullDay;
  }

  getStartDate(): Date {
    return new Date(this.timeOffDetails.startDate);
  }

  getEndDate(): Date {
    return new Date(this.timeOffDetails.endDate);
  }

  getStartTime(): string | null {
    return this.timeOffDetails.startTime || null;
  }

  getEndTime(): string | null {
    return this.timeOffDetails.endTime || null;
  }

  getType(): TimeOffType {
    return this.timeOffDetails.type;
  }

  getReason(): string {
    return this.timeOffDetails.reason;
  }

  getDescription(): string | null {
    return this.timeOffDetails.description || null;
  }

  getTotalDays(): number {
    return this.timeOffDetails.totalDays;
  }

  getTotalHours(): number {
    return this.timeOffDetails.totalHours || (this.timeOffDetails.totalDays * 8);
  }

  canBeModified(): boolean {
    return this.isDraft() || (this.isPending() && this.isFuture());
  }

  canBeCancelled(): boolean {
    return this.isPending() || (this.isApproved() && this.isFuture());
  }

  canBeApproved(): boolean {
    return this.isPending() && !this.hasRejection();
  }

  canBeRejected(): boolean {
    return this.isPending();
  }

  getStatusDisplayName(): string {
    switch (this.status) {
      case RequestStatus.DRAFT: return 'Draft';
      case RequestStatus.PENDING: return 'Pending Approval';
      case RequestStatus.APPROVED: return 'Approved';
      case RequestStatus.REJECTED: return 'Rejected';
      case RequestStatus.CANCELLED: return 'Cancelled';
      case RequestStatus.MODIFIED: return 'Modified';
      case RequestStatus.EXPIRED: return 'Expired';
      default: return 'Unknown';
    }
  }

  getTypeDisplayName(): string {
    switch (this.timeOffDetails.type) {
      case TimeOffType.ANNUAL_LEAVE: return 'Annual Leave';
      case TimeOffType.SICK_LEAVE: return 'Sick Leave';
      case TimeOffType.PERSONAL_LEAVE: return 'Personal Leave';
      case TimeOffType.MATERNITY_LEAVE: return 'Maternity Leave';
      case TimeOffType.PATERNITY_LEAVE: return 'Paternity Leave';
      case TimeOffType.PARENTAL_LEAVE: return 'Parental Leave';
      case TimeOffType.BEREAVEMENT_LEAVE: return 'Bereavement Leave';
      case TimeOffType.STUDY_LEAVE: return 'Study Leave';
      case TimeOffType.COMPASSIONATE_LEAVE: return 'Compassionate Leave';
      case TimeOffType.UNPAID_LEAVE: return 'Unpaid Leave';
      case TimeOffType.FLEXIBLE_WORKING: return 'Flexible Working';
      case TimeOffType.WORK_FROM_HOME: return 'Work From Home';
      case TimeOffType.OTHER: return 'Other';
      default: return 'Unknown';
    }
  }

  getPriorityDisplayName(): string {
    switch (this.priority) {
      case Priority.LOW: return 'Low';
      case Priority.MEDIUM: return 'Medium';
      case Priority.HIGH: return 'High';
      case Priority.URGENT: return 'Urgent';
      default: return 'Unknown';
    }
  }

  toJSON() {
    return {
      ...this,
      isActive: this.isActive(),
      isCurrent: this.isCurrent(),
      isFuture: this.isFuture(),
      isPast: this.isPast(),
      isUrgent: this.isUrgent(),
      isHighPriority: this.isHighPriority(),
      needsCoverage: this.needsCoverage(),
      hasCoverage: this.hasCoverage(),
      getCoverageProvider: this.getCoverageProvider(),
      getCurrentApprover: this.getCurrentApprover(),
      getApprovalProgress: this.getApprovalProgress(),
      isFullyApproved: this.isFullyApproved(),
      hasRejection: this.hasRejection(),
      getRejectionReason: this.getRejectionReason(),
      needsEscalation: this.needsEscalation(),
      getEscalationReason: this.getEscalationReason(),
      getBusinessImpact: this.getBusinessImpact(),
      isHighImpact: this.isHighImpact(),
      requiresMedicalCertificate: this.requiresMedicalCertificate(),
      hasMedicalCertificate: this.hasMedicalCertificate(),
      isMedicalCertificateValid: this.isMedicalCertificateValid(),
      getSupportingDocuments: this.getSupportingDocuments(),
      hasSupportingDocuments: this.hasSupportingDocuments(),
      isRecurring: this.isRecurring(),
      getRecurringPattern: this.getRecurringPattern(),
      isHalfDay: this.isHalfDay(),
      getHalfDayType: this.getHalfDayType(),
      isFullDay: this.isFullDay(),
      getStartDate: this.getStartDate(),
      getEndDate: this.getEndDate(),
      getStartTime: this.getStartTime(),
      getEndTime: this.getEndTime(),
      getType: this.getType(),
      getReason: this.getReason(),
      getDescription: this.getDescription(),
      getTotalDays: this.getTotalDays(),
      getTotalHours: this.getTotalHours(),
      canBeModified: this.canBeModified(),
      canBeCancelled: this.canBeCancelled(),
      canBeApproved: this.canBeApproved(),
      canBeRejected: this.canBeRejected(),
      getStatusDisplayName: this.getStatusDisplayName(),
      getTypeDisplayName: this.getTypeDisplayName(),
      getPriorityDisplayName: this.getPriorityDisplayName(),
      getDurationInDays: this.getDurationInDays(),
      getDurationInHours: this.getDurationInHours(),
      getDaysUntilStart: this.getDaysUntilStart(),
      getDaysUntilEnd: this.getDaysUntilEnd()
    };
  }
}