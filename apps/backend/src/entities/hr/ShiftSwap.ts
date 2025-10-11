import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '../BaseEntity';
import { Employee } from './Employee';

export enum ShiftSwapStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

export enum SwapType {
  DIRECT_SWAP = 'direct_swap',
  COVERAGE_REQUEST = 'coverage_request',
  PICKUP_SHIFT = 'pickup_shift',
  DROP_SHIFT = 'drop_shift'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface ShiftDetails {
  shiftId: string;
  shiftName: string;
  department: string;
  location: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  duration: number; // hours
  breakDuration?: number; // minutes
  shiftType: 'day' | 'night' | 'evening' | 'weekend' | 'holiday' | 'overtime';
  isOvertime: boolean;
  overtimeRate?: number;
  isWeekend: boolean;
  isHoliday: boolean;
  isOnCall: boolean;
  requiredSkills: string[];
  requiredCertifications: string[];
  specialRequirements?: string[];
  notes?: string;
}

export interface SwapDetails {
  type: SwapType;
  reason: string;
  description?: string;
  isPermanent: boolean;
  isTemporary: boolean;
  temporaryEndDate?: Date;
  compensationOffered?: {
    type: 'monetary' | 'time_off' | 'other';
    amount?: number;
    currency?: string;
    description?: string;
  };
  conditions?: string[];
  restrictions?: string[];
}

export interface ApprovalWorkflow {
  requiresApproval: boolean;
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  approvalLevel: 'manager' | 'supervisor' | 'hr' | 'director';
  autoApproval: boolean;
  autoApprovalConditions?: string[];
  approvalDeadline?: Date;
  approvalComments?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  rejectedAt?: Date;
}

export interface CoverageArrangements {
  coverageRequired: boolean;
  coverageProvider?: {
    employeeId: string;
    employeeName: string;
    department: string;
    contactInfo: string;
    skills: string[];
    certifications: string[];
  };
  handoverRequired: boolean;
  handoverNotes?: string;
  criticalTasks?: string[];
  emergencyContact?: string;
  backupCoverage?: {
    employeeId: string;
    employeeName: string;
    contactInfo: string;
  };
  trainingRequired?: string[];
  orientationRequired?: boolean;
}

export interface ImpactAssessment {
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  departmentImpact: string[];
  teamImpact: string[];
  clientImpact: string[];
  operationalImpact: string[];
  financialImpact?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskMitigation: string[];
  contingencyPlans: string[];
  communicationRequired: boolean;
  stakeholdersToNotify: string[];
}

export interface SwapHistory {
  action: string;
  performedBy: string;
  performedAt: Date;
  comments?: string;
  previousStatus?: ShiftSwapStatus;
  newStatus: ShiftSwapStatus;
  metadata?: Record<string, any>;
}

@Entity('shift_swaps')
export class ShiftSwap extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  swapId: string;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  requestorId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestorId' })
  requestor: Employee;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  acceptorId?: string;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'acceptorId' })
  acceptor?: Employee;

  @Column({
    type: 'enum',
    enum: ShiftSwapStatus,
    default: ShiftSwapStatus.PENDING
  })
  @IsEnum(ShiftSwapStatus)
  status: ShiftSwapStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM
  })
  @IsEnum(Priority)
  priority: Priority;

  @Column('jsonb')
  @IsNotEmpty()
  shiftDetails: ShiftDetails;

  @Column('jsonb')
  @IsNotEmpty()
  swapDetails: SwapDetails;

  @Column('jsonb')
  @IsNotEmpty()
  approvalWorkflow: ApprovalWorkflow;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  coverageArrangements?: CoverageArrangements;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  impactAssessment?: ImpactAssessment;

  @Column('jsonb', { default: '[]' })
  @IsOptional()
  swapHistory?: SwapHistory[];

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
  cancellationReason?: string;

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

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  @BeforeInsert()
  generateSwapId() {
    if (!this.swapId) {
      this.swapId = `SWAP-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateShiftSwap() {
    if (!this.shiftDetails || !this.swapDetails || !this.approvalWorkflow) {
      throw new Error('Required shift swap sections must be provided');
    }

    // Validate dates
    if (new Date(this.shiftDetails.endDate) <= new Date(this.shiftDetails.startDate)) {
      throw new Error('End date must be after start date');
    }

    // Validate times
    if (this.shiftDetails.startTime >= this.shiftDetails.endTime) {
      throw new Error('End time must be after start time');
    }

    // Validate temporary swap
    if (this.swapDetails.isTemporary && !this.swapDetails.temporaryEndDate) {
      throw new Error('Temporary end date must be specified for temporary swaps');
    }
  }

  isPending(): boolean {
    return this.status === ShiftSwapStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === ShiftSwapStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === ShiftSwapStatus.REJECTED;
  }

  isCancelled(): boolean {
    return this.status === ShiftSwapStatus.CANCELLED;
  }

  isCompleted(): boolean {
    return this.status === ShiftSwapStatus.COMPLETED;
  }

  isExpired(): boolean {
    return this.status === ShiftSwapStatus.EXPIRED;
  }

  isActive(): boolean {
    return this.isApproved() && this.isCurrent();
  }

  isCurrent(): boolean {
    const now = new Date();
    const startDate = new Date(this.shiftDetails.startDate);
    const endDate = new Date(this.shiftDetails.endDate);
    return now >= startDate && now <= endDate;
  }

  isFuture(): boolean {
    const now = new Date();
    const startDate = new Date(this.shiftDetails.startDate);
    return startDate > now;
  }

  isPast(): boolean {
    const now = new Date();
    const endDate = new Date(this.shiftDetails.endDate);
    return endDate < now;
  }

  getDurationInHours(): number {
    return this.shiftDetails.duration;
  }

  getDurationInDays(): number {
    return Math.ceil(this.shiftDetails.duration / 24);
  }

  getDaysUntilStart(): number {
    const now = new Date();
    const startDate = new Date(this.shiftDetails.startDate);
    const diffTime = startDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilEnd(): number {
    const now = new Date();
    const endDate = new Date(this.shiftDetails.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isUrgent(): boolean {
    return this.priority === Priority.URGENT || this.getDaysUntilStart() <= 1;
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

  requiresApproval(): boolean {
    return this.approvalWorkflow.requiresApproval;
  }

  getApprover(): string | null {
    return this.approvalWorkflow.approverName || null;
  }

  isAutoApproved(): boolean {
    return this.approvalWorkflow.autoApproval;
  }

  hasApprovalDeadline(): boolean {
    return this.approvalWorkflow.approvalDeadline !== undefined;
  }

  isApprovalOverdue(): boolean {
    if (!this.approvalWorkflow.approvalDeadline) return false;
    return new Date() > new Date(this.approvalWorkflow.approvalDeadline);
  }

  getApprovalDeadline(): Date | null {
    return this.approvalWorkflow.approvalDeadline ? 
      new Date(this.approvalWorkflow.approvalDeadline) : null;
  }

  getBusinessImpact(): string {
    return this.impactAssessment?.businessImpact || 'low';
  }

  isHighImpact(): boolean {
    return this.impactAssessment?.businessImpact === 'high' || 
           this.impactAssessment?.businessImpact === 'critical';
  }

  getRiskLevel(): string {
    return this.impactAssessment?.riskLevel || 'low';
  }

  isHighRisk(): boolean {
    return this.impactAssessment?.riskLevel === 'high' || 
           this.impactAssessment?.riskLevel === 'critical';
  }

  isDirectSwap(): boolean {
    return this.swapDetails.type === SwapType.DIRECT_SWAP;
  }

  isCoverageRequest(): boolean {
    return this.swapDetails.type === SwapType.COVERAGE_REQUEST;
  }

  isPickupShift(): boolean {
    return this.swapDetails.type === SwapType.PICKUP_SHIFT;
  }

  isDropShift(): boolean {
    return this.swapDetails.type === SwapType.DROP_SHIFT;
  }

  isPermanent(): boolean {
    return this.swapDetails.isPermanent;
  }

  isTemporary(): boolean {
    return this.swapDetails.isTemporary;
  }

  getTemporaryEndDate(): Date | null {
    return this.swapDetails.temporaryEndDate ? 
      new Date(this.swapDetails.temporaryEndDate) : null;
  }

  hasCompensation(): boolean {
    return this.swapDetails.compensationOffered !== undefined;
  }

  getCompensationType(): string | null {
    return this.swapDetails.compensationOffered?.type || null;
  }

  getCompensationAmount(): number | null {
    return this.swapDetails.compensationOffered?.amount || null;
  }

  getCompensationDescription(): string | null {
    return this.swapDetails.compensationOffered?.description || null;
  }

  hasConditions(): boolean {
    return this.swapDetails.conditions !== undefined && 
           this.swapDetails.conditions.length > 0;
  }

  getConditions(): string[] {
    return this.swapDetails.conditions || [];
  }

  hasRestrictions(): boolean {
    return this.swapDetails.restrictions !== undefined && 
           this.swapDetails.restrictions.length > 0;
  }

  getRestrictions(): string[] {
    return this.swapDetails.restrictions || [];
  }

  isOvertime(): boolean {
    return this.shiftDetails.isOvertime;
  }

  isWeekend(): boolean {
    return this.shiftDetails.isWeekend;
  }

  isHoliday(): boolean {
    return this.shiftDetails.isHoliday;
  }

  isOnCall(): boolean {
    return this.shiftDetails.isOnCall;
  }

  getShiftType(): string {
    return this.shiftDetails.shiftType;
  }

  getRequiredSkills(): string[] {
    return this.shiftDetails.requiredSkills;
  }

  getRequiredCertifications(): string[] {
    return this.shiftDetails.requiredCertifications;
  }

  getSpecialRequirements(): string[] {
    return this.shiftDetails.specialRequirements || [];
  }

  hasSpecialRequirements(): boolean {
    return this.getSpecialRequirements().length > 0;
  }

  getOvertimeRate(): number | null {
    return this.shiftDetails.overtimeRate || null;
  }

  getBreakDuration(): number | null {
    return this.shiftDetails.breakDuration || null;
  }

  getStartDate(): Date {
    return new Date(this.shiftDetails.startDate);
  }

  getEndDate(): Date {
    return new Date(this.shiftDetails.endDate);
  }

  getStartTime(): string {
    return this.shiftDetails.startTime;
  }

  getEndTime(): string {
    return this.shiftDetails.endTime;
  }

  getDepartment(): string {
    return this.shiftDetails.department;
  }

  getLocation(): string {
    return this.shiftDetails.location;
  }

  getShiftName(): string {
    return this.shiftDetails.shiftName;
  }

  getReason(): string {
    return this.swapDetails.reason;
  }

  getDescription(): string | null {
    return this.swapDetails.description || null;
  }

  getRequestorName(): string {
    return this.requestor.getFullName();
  }

  getAcceptorName(): string | null {
    return this.acceptor?.getFullName() || null;
  }

  hasAcceptor(): boolean {
    return this.acceptor !== undefined;
  }

  canBeAccepted(): boolean {
    return this.isPending() && !this.isExpired();
  }

  canBeRejected(): boolean {
    return this.isPending();
  }

  canBeCancelled(): boolean {
    return this.isPending() || (this.isApproved() && this.isFuture());
  }

  canBeCompleted(): boolean {
    return this.isApproved() && this.isPast();
  }

  getStatusDisplayName(): string {
    switch (this.status) {
      case ShiftSwapStatus.PENDING: return 'Pending';
      case ShiftSwapStatus.APPROVED: return 'Approved';
      case ShiftSwapStatus.REJECTED: return 'Rejected';
      case ShiftSwapStatus.CANCELLED: return 'Cancelled';
      case ShiftSwapStatus.COMPLETED: return 'Completed';
      case ShiftSwapStatus.EXPIRED: return 'Expired';
      default: return 'Unknown';
    }
  }

  getTypeDisplayName(): string {
    switch (this.swapDetails.type) {
      case SwapType.DIRECT_SWAP: return 'Direct Swap';
      case SwapType.COVERAGE_REQUEST: return 'Coverage Request';
      case SwapType.PICKUP_SHIFT: return 'Pickup Shift';
      case SwapType.DROP_SHIFT: return 'Drop Shift';
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

  getShiftTypeDisplayName(): string {
    switch (this.shiftDetails.shiftType) {
      case 'day': return 'Day Shift';
      case 'night': return 'Night Shift';
      case 'evening': return 'Evening Shift';
      case 'weekend': return 'Weekend Shift';
      case 'holiday': return 'Holiday Shift';
      case 'overtime': return 'Overtime Shift';
      default: return 'Unknown';
    }
  }

  addToHistory(action: string, performedBy: string, comments?: string, metadata?: Record<string, any>): void {
    if (!this.swapHistory) {
      this.swapHistory = [];
    }
    
    this.swapHistory.push({
      action,
      performedBy,
      performedAt: new Date(),
      comments,
      previousStatus: this.status,
      newStatus: this.status,
      metadata
    });
  }

  getHistory(): SwapHistory[] {
    return this.swapHistory || [];
  }

  getLastAction(): SwapHistory | null {
    const history = this.getHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  }

  toJSON() {
    return {
      ...this,
      isPending: this.isPending(),
      isApproved: this.isApproved(),
      isRejected: this.isRejected(),
      isCancelled: this.isCancelled(),
      isCompleted: this.isCompleted(),
      isExpired: this.isExpired(),
      isActive: this.isActive(),
      isCurrent: this.isCurrent(),
      isFuture: this.isFuture(),
      isPast: this.isPast(),
      isUrgent: this.isUrgent(),
      isHighPriority: this.isHighPriority(),
      needsCoverage: this.needsCoverage(),
      hasCoverage: this.hasCoverage(),
      getCoverageProvider: this.getCoverageProvider(),
      requiresApproval: this.requiresApproval(),
      getApprover: this.getApprover(),
      isAutoApproved: this.isAutoApproved(),
      hasApprovalDeadline: this.hasApprovalDeadline(),
      isApprovalOverdue: this.isApprovalOverdue(),
      getApprovalDeadline: this.getApprovalDeadline(),
      getBusinessImpact: this.getBusinessImpact(),
      isHighImpact: this.isHighImpact(),
      getRiskLevel: this.getRiskLevel(),
      isHighRisk: this.isHighRisk(),
      isDirectSwap: this.isDirectSwap(),
      isCoverageRequest: this.isCoverageRequest(),
      isPickupShift: this.isPickupShift(),
      isDropShift: this.isDropShift(),
      isPermanent: this.isPermanent(),
      isTemporary: this.isTemporary(),
      getTemporaryEndDate: this.getTemporaryEndDate(),
      hasCompensation: this.hasCompensation(),
      getCompensationType: this.getCompensationType(),
      getCompensationAmount: this.getCompensationAmount(),
      getCompensationDescription: this.getCompensationDescription(),
      hasConditions: this.hasConditions(),
      getConditions: this.getConditions(),
      hasRestrictions: this.hasRestrictions(),
      getRestrictions: this.getRestrictions(),
      isOvertime: this.isOvertime(),
      isWeekend: this.isWeekend(),
      isHoliday: this.isHoliday(),
      isOnCall: this.isOnCall(),
      getShiftType: this.getShiftType(),
      getRequiredSkills: this.getRequiredSkills(),
      getRequiredCertifications: this.getRequiredCertifications(),
      getSpecialRequirements: this.getSpecialRequirements(),
      hasSpecialRequirements: this.hasSpecialRequirements(),
      getOvertimeRate: this.getOvertimeRate(),
      getBreakDuration: this.getBreakDuration(),
      getStartDate: this.getStartDate(),
      getEndDate: this.getEndDate(),
      getStartTime: this.getStartTime(),
      getEndTime: this.getEndTime(),
      getDepartment: this.getDepartment(),
      getLocation: this.getLocation(),
      getShiftName: this.getShiftName(),
      getReason: this.getReason(),
      getDescription: this.getDescription(),
      getRequestorName: this.getRequestorName(),
      getAcceptorName: this.getAcceptorName(),
      hasAcceptor: this.hasAcceptor(),
      canBeAccepted: this.canBeAccepted(),
      canBeRejected: this.canBeRejected(),
      canBeCancelled: this.canBeCancelled(),
      canBeCompleted: this.canBeCompleted(),
      getStatusDisplayName: this.getStatusDisplayName(),
      getTypeDisplayName: this.getTypeDisplayName(),
      getPriorityDisplayName: this.getPriorityDisplayName(),
      getShiftTypeDisplayName: this.getShiftTypeDisplayName(),
      getHistory: this.getHistory(),
      getLastAction: this.getLastAction(),
      getDurationInHours: this.getDurationInHours(),
      getDurationInDays: this.getDurationInDays(),
      getDaysUntilStart: this.getDaysUntilStart(),
      getDaysUntilEnd: this.getDaysUntilEnd()
    };
  }
}
