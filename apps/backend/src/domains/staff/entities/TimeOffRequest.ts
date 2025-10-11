import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EmployeeProfile } from './EmployeeProfile';

export enum TimeOffType {
  ANNUAL_LEAVE = 'annual_leave',
  SICK_LEAVE = 'sick_leave',
  PERSONAL_LEAVE = 'personal_leave',
  MATERNITY_LEAVE = 'maternity_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  PARENTAL_LEAVE = 'parental_leave',
  BEREAVEMENT_LEAVE = 'bereavement_leave',
  EMERGENCY_LEAVE = 'emergency_leave',
  STUDY_LEAVE = 'study_leave',
  TRAINING_LEAVE = 'training_leave',
  UNPAID_LEAVE = 'unpaid_leave',
  COMPASSIONATE_LEAVE = 'compassionate_leave',
  OTHER = 'other'
}

export enum TimeOffStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  MODIFIED = 'modified'
}

export enum TimeOffPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Entity('time_off_requests')
export class TimeOffRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EmployeeProfile, employeeProfile => employeeProfile.timeOffRequests)
  @JoinColumn({ name: 'employeeProfileId' })
  employeeProfile: EmployeeProfile;

  @Column({ type: 'uuid' })
  employeeProfileId: string;

  @Column({ type: 'var char', length: 100 })
  requestNumber: string;

  @Column({ type: 'enum', enum: TimeOffType })
  type: TimeOffType;

  @Column({ type: 'enum', enum: TimeOffStatus, default: TimeOffStatus.PENDING })
  status: TimeOffStatus;

  @Column({ type: 'enum', enum: TimeOffPriority, default: TimeOffPriority.NORMAL })
  priority: TimeOffPriority;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'int' })
  totalDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalHours: number;

  @Column({ type: 'boolean', default: false })
  isHalfDay: boolean;

  @Column({ type: 'boolean', default: false })
  isFullDay: boolean;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  rejectedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  cancelledBy: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'boolean', default: false })
  requiresCover: boolean;

  @Column({ type: 'var char', length: 100, nullable: true })
  coverEmployeeId: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  coverEmployeeName: string;

  @Column({ type: 'boolean', default: false })
  isEmergency: boolean;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'var char', length: 50, nullable: true })
  recurringPattern: string; // daily, weekly, monthly, yearly

  @Column({ type: 'int', nullable: true })
  recurringInterval: number; // Every X days/weeks/months/years

  @Column({ type: 'date', nullable: true })
  recurringEndDate: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public generateRequestNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `TOR${year}${month}${random}`;
  }

  public calculateTotalDays(): number {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    return diffDays;
  }

  public calculateTotalHours(): number {
    if (this.isHalfDay) {
      return this.totalDays * 4; // Assuming 8-hour work day, halfday = 4 hours
    }
    return this.totalDays * 8; // Assuming 8-hour work day
  }

  public isPending(): boolean {
    return this.status === TimeOffStatus.PENDING;
  }

  public isApproved(): boolean {
    return this.status === TimeOffStatus.APPROVED;
  }

  public isRejected(): boolean {
    return this.status === TimeOffStatus.REJECTED;
  }

  public isCancelled(): boolean {
    return this.status === TimeOffStatus.CANCELLED;
  }

  public canBeApproved(): boolean {
    return this.status === TimeOffStatus.PENDING;
  }

  public canBeRejected(): boolean {
    return this.status === TimeOffStatus.PENDING;
  }

  public canBeCancelled(): boolean {
    return this.status === TimeOffStatus.PENDING || this.status === TimeOffStatus.APPROVED;
  }

  public canBeModified(): boolean {
    return this.status === TimeOffStatus.PENDING;
  }

  public approve(approvedBy: string, notes?: string): void {
    if (!this.canBeApproved()) {
      throw new Error('Time off request cannot be approved in current status');
    }
    
    this.status = TimeOffStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    
    if (notes) {
      this.notes = this.notes ? `${this.notes}\nApproval: ${notes}` : `Approval: ${notes}`;
    }
  }

  public reject(rejectedBy: string, reason: string): void {
    if (!this.canBeRejected()) {
      throw new Error('Time off request cannot be rejected in current status');
    }
    
    this.status = TimeOffStatus.REJECTED;
    this.rejectedBy = rejectedBy;
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
  }

  public cancel(cancelledBy: string, reason?: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Time off request cannot be cancelled in current status');
    }
    
    this.status = TimeOffStatus.CANCELLED;
    this.cancelledBy = cancelledBy;
    this.cancelledAt = new Date();
    
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
    }
  }

  public isOverlapping(otherRequest: TimeOffRequest): boolean {
    if (this.id === otherRequest.id) return false;
    
    const thisStart = new Date(this.startDate);
    const thisEnd = new Date(this.endDate);
    const otherStart = new Date(otherRequest.startDate);
    const otherEnd = new Date(otherRequest.endDate);
    
    return thisStart <= otherEnd && thisEnd >= otherStart;
  }

  public isInPast(): boolean {
    return new Date(this.startDate) < new Date();
  }

  public isInFuture(): boolean {
    return new Date(this.startDate) > new Date();
  }

  public isCurrent(): boolean {
    const today = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    return today >= start && today <= end;
  }

  public getDaysUntilStart(): number {
    const today = new Date();
    const start = new Date(this.startDate);
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getDaysRemaining(): number {
    if (!this.isCurrent()) return 0;
    
    const today = new Date();
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  public getTimeOffSummary(): {
    id: string;
    requestNumber: string;
    employeeName: string;
    type: string;
    status: string;
    priority: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    totalHours: number;
    reason: string;
    isEmergency: boolean;
    isRecurring: boolean;
    requiresCover: boolean;
    coverEmployeeName: string;
    approvedBy: string;
    approvedAt: Date | null;
    rejectedBy: string;
    rejectedAt: Date | null;
    rejectionReason: string;
  } {
    return {
      id: this.id,
      requestNumber: this.requestNumber,
      employeeName: this.employeeProfile?.getFullName() || '',
      type: this.type,
      status: this.status,
      priority: this.priority,
      startDate: this.startDate,
      endDate: this.endDate,
      totalDays: this.totalDays,
      totalHours: this.totalHours,
      reason: this.reason,
      isEmergency: this.isEmergency,
      isRecurring: this.isRecurring,
      requiresCover: this.requiresCover,
      coverEmployeeName: this.coverEmployeeName || '',
      approvedBy: this.approvedBy || '',
      approvedAt: this.approvedAt,
      rejectedBy: this.rejectedBy || '',
      rejectedAt: this.rejectedAt,
      rejectionReason: this.rejectionReason || '',
    };
  }
}
