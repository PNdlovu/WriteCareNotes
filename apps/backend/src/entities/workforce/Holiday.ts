import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Employee } from '../hr/Employee';

export enum HolidayType {
  ANNUAL_LEAVE = 'annual_leave',
  SICK_LEAVE = 'sick_leave',
  MATERNITY_LEAVE = 'maternity_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  COMPASSIONATE_LEAVE = 'compassionate_leave',
  STUDY_LEAVE = 'study_leave',
  UNPAID_LEAVE = 'unpaid_leave',
  EMERGENCY_LEAVE = 'emergency_leave',
  JURY_DUTY = 'jury_duty',
  MEDICAL_APPOINTMENT = 'medical_appointment'
}

export enum HolidayStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  TAKEN = 'taken'
}

export enum HolidayDuration {
  FULL_DAY = 'full_day',
  HALF_DAY_AM = 'half_day_am',
  HALF_DAY_PM = 'half_day_pm',
  HOURS = 'hours'
}

export interface HolidayApproval {
  approvedBy: string;
  approvedAt: Date;
  approvalNotes?: string;
  delegatedApprover?: string;
}

export interface HolidayRejection {
  rejectedBy: string;
  rejectedAt: Date;
  rejectionReason: string;
}

export interface AttachmentDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  url: string;
}

@Entity('holidays')
export class Holiday extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  requestNumber: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: HolidayType
  })
  type: HolidayType;

  @Column({
    type: 'enum',
    enum: HolidayStatus,
    default: HolidayStatus.PENDING
  })
  status: HolidayStatus;

  @Column({
    type: 'enum',
    enum: HolidayDuration,
    default: HolidayDuration.FULL_DAY
  })
  duration: HolidayDuration;

  @Column('date')
  startDate: Date;

  @Column('date')
  endDate: Date;

  @Column('decimal', { precision: 5, scale: 2 })
  daysRequested: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  hoursRequested?: number;

  @Column('text', { nullable: true })
  reason?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('date')
  requestedAt: Date;

  @Column({ nullable: true })
  requestedBy?: string; // For requests made on behalf of someone else

  @Column('jsonb', { nullable: true })
  approval?: HolidayApproval;

  @Column('jsonb', { nullable: true })
  rejection?: HolidayRejection;

  @Column('jsonb', { nullable: true })
  attachments?: AttachmentDocument[];

  @Column({ default: false })
  requiresDocumentation: boolean;

  @Column({ default: false })
  isEmergencyRequest: boolean;

  @Column({ default: false })
  affectsPayroll: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  payImpact?: number;

  @Column({ nullable: true })
  coveringEmployeeId?: string;

  @Column({ nullable: true })
  handoverNotes?: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column('text', { nullable: true })
  recurringPattern?: string;

  @Column({ nullable: true })
  parentRequestId?: string;

  @Column('date', { nullable: true })
  returnDate?: Date;

  @Column({ default: false })
  returnConfirmed: boolean;

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column({ nullable: true })
  cancelledBy?: string;

  @Column('timestamp', { nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business Methods
  isPending(): boolean {
    return this.status === HolidayStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === HolidayStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === HolidayStatus.REJECTED;
  }

  isTaken(): boolean {
    return this.status === HolidayStatus.TAKEN;
  }

  isActive(): boolean {
    return this.isApproved() && !this.isPast();
  }

  isUpcoming(): boolean {
    return this.isApproved() && this.startDate > new Date();
  }

  isCurrent(): boolean {
    const now = new Date();
    return this.isApproved() && this.startDate <= now && this.endDate >= now;
  }

  isPast(): boolean {
    return this.endDate < new Date();
  }

  canBeCancelled(): boolean {
    const daysUntilStart = this.getDaysUntilStart();
    return this.isApproved() && daysUntilStart > 0;
  }

  requiresAdvanceNotice(): boolean {
    return [HolidayType.ANNUAL_LEAVE, HolidayType.STUDY_LEAVE].includes(this.type);
  }

  getDaysUntilStart(): number {
    const timeDiff = this.startDate.getTime() - new Date().getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  getTotalDays(): number {
    return this.daysRequested;
  }

  getWorkingDaysCount(): number {
    // Calculate working days excluding weekends
    let count = 0;
    const currentDate = new Date(this.startDate);
    
    while (currentDate <= this.endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }

  isWithinNoticeRequirement(minimumDays: number = 14): boolean {
    return this.getDaysUntilStart() >= minimumDays;
  }

  overlaps(otherHoliday: Holiday): boolean {
    return !(this.endDate < otherHoliday.startDate || this.startDate > otherHoliday.endDate);
  }

  getApprovalDaysElapsed(): number {
    if (!this.approval) return 0;
    const timeDiff = this.approval.approvedAt.getTime() - this.createdAt.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  isLongTermLeave(): boolean {
    return this.daysRequested > 14 || [
      HolidayType.MATERNITY_LEAVE,
      HolidayType.PATERNITY_LEAVE,
      HolidayType.SICK_LEAVE
    ].includes(this.type);
  }

  requiresReturnToWorkInterview(): boolean {
    return this.type === HolidayType.SICK_LEAVE && this.daysRequested > 7;
  }

  getHolidayAllowanceImpact(): number {
    if (this.type !== HolidayType.ANNUAL_LEAVE) return 0;
    return this.daysRequested;
  }

  generateSummary() {
    return {
      requestNumber: this.requestNumber,
      employee: this.employee?.getFullName(),
      type: this.type,
      status: this.status,
      period: `${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`,
      days: this.daysRequested,
      reason: this.reason,
      requestedAt: this.requestedAt.toLocaleDateString()
    };
  }
}
