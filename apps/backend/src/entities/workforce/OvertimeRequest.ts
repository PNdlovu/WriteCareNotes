import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';





// Enums are defined in this file, no need to import
import { BaseEntity } from '../BaseEntity';
import { Employee } from '../hr/Employee';
import { Shift } from './Shift';

export enum OvertimeType {
  PLANNED = 'planned',
  UNPLANNED = 'unplanned',
  EMERGENCY = 'emergency',
  VOLUNTARY = 'voluntary',
  MANDATORY = 'mandatory'
}

export enum OvertimeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OvertimeRateType {
  TIME_AND_HALF = 'time_and_half',
  DOUBLE_TIME = 'double_time',
  FLAT_RATE = 'flat_rate',
  CUSTOM = 'custom'
}

export enum HolidayStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  TAKEN = 'taken'
}

export enum ResidentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCHARGED = 'discharged',
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred'
}

export interface OvertimeApproval {
  approvedBy: string;
  approvedAt: Date;
  approvalNotes?: string;
  conditions?: string[];
}

export interface OvertimeRejection {
  rejectedBy: string;
  rejectedAt: Date;
  rejectionReason: string;
}

export interface OvertimeRates {
  regularRate: number;
  overtimeRate: number;
  rateType: OvertimeRateType;
  multiplier: number;
}

@Entity('overtime_requests')
export class OvertimeRequest extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  requestNumber: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ nullable: true })
  shiftId?: string;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'shiftId' })
  shift?: Shift;

  @Column({
    type: 'enum',
    enum: OvertimeType
  })
  type: OvertimeType;

  @Column({
    type: 'enum',
    enum: OvertimeStatus,
    default: OvertimeStatus.PENDING
  })
  status: OvertimeStatus;

  @Column('timestamp')
  startTime: Date;

  @Column('timestamp')
  endTime: Date;

  @Column('decimal', { precision: 5, scale: 2 })
  hoursRequested: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  hoursWorked?: number;

  @Column('text')
  reason: string;

  @Column('text', { nullable: true })
  businessJustification?: string;

  @Column('jsonb')
  rates: OvertimeRates;

  @Column('decimal', { precision: 10, scale: 2 })
  estimatedCost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualCost?: number;

  @Column({ default: false })
  requiresManagerApproval: boolean;

  @Column({ default: false })
  requiresHRApproval: boolean;

  @Column({ default: false })
  requiresBudgetApproval: boolean;

  @Column('jsonb', { nullable: true })
  approval?: OvertimeApproval;

  @Column('jsonb', { nullable: true })
  rejection?: OvertimeRejection;

  @Column({ nullable: true })
  requestedBy?: string; // For requests made on behalf of someone else

  @Column('date')
  requestedAt: Date;

  @Column({ nullable: true })
  supervisorId?: string;

  @Column({ default: false })
  isEmergency: boolean;

  @Column({ default: false })
  isRecurring: boolean;

  @Column('text', { nullable: true })
  recurringPattern?: string;

  @Column({ nullable: true })
  parentRequestId?: string;

  @Column('text', { nullable: true })
  workDescription?: string;

  @Column('text', { nullable: true })
  deliverables?: string;

  @Column({ default: false })
  requiresSkillVerification: boolean;

  @Column('jsonb', { nullable: true })
  requiredSkills?: string[];

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column({ nullable: true })
  cancelledBy?: string;

  @Column('timestamp', { nullable: true })
  cancelledAt?: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('text', { nullable: true })
  completionNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business Methods
  isPending(): boolean {
    return this.status === OvertimeStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === OvertimeStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === OvertimeStatus.REJECTED;
  }

  isCompleted(): boolean {
    return this.status === OvertimeStatus.COMPLETED;
  }

  isActive(): boolean {
    return this.isApproved() && !this.isPast();
  }

  isUpcoming(): boolean {
    return this.isApproved() && this.startTime > new Date();
  }

  isCurrent(): boolean {
    const now = new Date();
    return this.isApproved() && this.startTime <= now && this.endTime >= now;
  }

  isPast(): boolean {
    return this.endTime < new Date();
  }

  canBeCancelled(): boolean {
    const hoursUntilStart = (this.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return this.isApproved() && hoursUntilStart > 2; // Can cancel if more than 2 hours notice
  }

  requiresApproval(): boolean {
    return this.requiresManagerApproval || this.requiresHRApproval || this.requiresBudgetApproval;
  }

  getDuration(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
  }

  getActualDuration(): number {
    return this.hoursWorked || this.hoursRequested;
  }

  calculateEstimatedCost(): number {
    return this.hoursRequested * this.rates.overtimeRate;
  }

  calculateActualCost(): number {
    if (!this.hoursWorked) return this.estimatedCost;
    return this.hoursWorked * this.rates.overtimeRate;
  }

  getVariance(): { hours: number; cost: number } {
    const hoursVariance = (this.hoursWorked || 0) - this.hoursRequested;
    const costVariance = this.calculateActualCost() - this.estimatedCost;
    
    return { hours: hoursVariance, cost: costVariance };
  }

  isWithinBudget(budgetLimit: number): boolean {
    return this.estimatedCost <= budgetLimit;
  }

  requiresEmergencyProcessing(): boolean {
    return this.isEmergency || this.type === OvertimeType.EMERGENCY;
  }

  getHoursUntilStart(): number {
    return (this.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  }

  isLateRequest(): boolean {
    const hoursNotice = this.getHoursUntilStart();
    return hoursNotice < 24 && !this.isEmergency;
  }

  getApprovalDaysElapsed(): number {
    if (!this.approval) return 0;
    const timeDiff = this.approval.approvedAt.getTime() - this.createdAt.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  exceedsWeeklyLimit(weeklyLimit: number = 48): boolean {
    // This would need to be calculated with other overtime hours in the same week
    return this.hoursRequested > weeklyLimit;
  }

  getEffectiveRate(): number {
    return this.rates.overtimeRate;
  }

  getRateMultiplier(): number {
    return this.rates.multiplier;
  }

  isDoubleTime(): boolean {
    return this.rates.rateType === OvertimeRateType.DOUBLE_TIME || this.rates.multiplier >= 2.0;
  }

  generateSummary() {
    return {
      requestNumber: this.requestNumber,
      employee: this.employee?.getFullName(),
      type: this.type,
      status: this.status,
      date: this.startTime.toDateString(),
      time: `${this.startTime.toLocaleTimeString()} - ${this.endTime.toLocaleTimeString()}`,
      hours: this.hoursRequested,
      rate: this.rates.overtimeRate,
      estimatedCost: this.estimatedCost,
      reason: this.reason,
      requestedAt: this.requestedAt.toLocaleDateString()
    };
  }

  getApprovalWorkflow(): string[] {
    const workflow: string[] = [];
    
    if (this.requiresManagerApproval) workflow.push('Manager Approval');
    if (this.requiresHRApproval) workflow.push('HR Approval');
    if (this.requiresBudgetApproval) workflow.push('Budget Approval');
    
    return workflow.length > 0 ? workflow : ['Auto-Approved'];
  }
}