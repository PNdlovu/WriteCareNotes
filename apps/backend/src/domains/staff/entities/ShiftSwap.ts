import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EmployeeProfile } from './EmployeeProfile';
import { Shift } from './Shift';

export enum ShiftSwapStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum ShiftSwapType {
  DIRECT_SWAP = 'direct_swap',
  COVER_REQUEST = 'cover_request',
  VOLUNTEER_OFFER = 'volunteer_offer',
  EMERGENCY_COVER = 'emergency_cover'
}

@Entity('shift_swaps')
export class ShiftSwap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EmployeeProfile, employeeProfile => employeeProfile.shiftSwaps)
  @JoinColumn({ name: 'requestingEmployeeId' })
  requestingEmployee: EmployeeProfile;

  @Column({ type: 'uuid' })
  requestingEmployeeId: string;

  @ManyToOne(() => EmployeeProfile)
  @JoinColumn({ name: 'respondingEmployeeId' })
  respondingEmployee: EmployeeProfile;

  @Column({ type: 'uuid', nullable: true })
  respondingEmployeeId: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'originalShiftId' })
  originalShift: Shift;

  @Column({ type: 'uuid' })
  originalShiftId: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'proposedShiftId' })
  proposedShift: Shift;

  @Column({ type: 'uuid', nullable: true })
  proposedShiftId: string;

  @Column({ type: 'varchar', length: 100 })
  swapNumber: string;

  @Column({ type: 'enum', enum: ShiftSwapType })
  type: ShiftSwapType;

  @Column({ type: 'enum', enum: ShiftSwapStatus, default: ShiftSwapStatus.PENDING })
  status: ShiftSwapStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rejectedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cancelledBy: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'boolean', default: false })
  isEmergency: boolean;

  @Column({ type: 'boolean', default: false })
  requiresManagerApproval: boolean;

  @Column({ type: 'boolean', default: false })
  isPaidSwap: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  compensationAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'int', default: 24 })
  expiryHours: number; // Hours until the swap request expires

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public generateSwapNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `SWP${year}${month}${random}`;
  }

  public setExpiryTime(): void {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + this.expiryHours);
    this.expiresAt = expiryTime;
  }

  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  public isPending(): boolean {
    return this.status === ShiftSwapStatus.PENDING;
  }

  public isApproved(): boolean {
    return this.status === ShiftSwapStatus.APPROVED;
  }

  public isRejected(): boolean {
    return this.status === ShiftSwapStatus.REJECTED;
  }

  public isCancelled(): boolean {
    return this.status === ShiftSwapStatus.CANCELLED;
  }

  public isCompleted(): boolean {
    return this.status === ShiftSwapStatus.COMPLETED;
  }

  public canBeApproved(): boolean {
    return this.status === ShiftSwapStatus.PENDING && !this.isExpired();
  }

  public canBeRejected(): boolean {
    return this.status === ShiftSwapStatus.PENDING;
  }

  public canBeCancelled(): boolean {
    return this.status === ShiftSwapStatus.PENDING || this.status === ShiftSwapStatus.APPROVED;
  }

  public canBeCompleted(): boolean {
    return this.status === ShiftSwapStatus.APPROVED;
  }

  public approve(approvedBy: string, notes?: string): void {
    if (!this.canBeApproved()) {
      throw new Error('Shift swap cannot be approved in current status');
    }
    
    this.status = ShiftSwapStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    
    if (notes) {
      this.notes = this.notes ? `${this.notes}\nApproval: ${notes}` : `Approval: ${notes}`;
    }
  }

  public reject(rejectedBy: string, reason: string): void {
    if (!this.canBeRejected()) {
      throw new Error('Shift swap cannot be rejected in current status');
    }
    
    this.status = ShiftSwapStatus.REJECTED;
    this.rejectedBy = rejectedBy;
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
  }

  public cancel(cancelledBy: string, reason?: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Shift swap cannot be cancelled in current status');
    }
    
    this.status = ShiftSwapStatus.CANCELLED;
    this.cancelledBy = cancelledBy;
    this.cancelledAt = new Date();
    
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
    }
  }

  public complete(): void {
    if (!this.canBeCompleted()) {
      throw new Error('Shift swap cannot be completed in current status');
    }
    
    this.status = ShiftSwapStatus.COMPLETED;
    this.completedAt = new Date();
  }

  public getHoursUntilExpiry(): number {
    if (!this.expiresAt) return 0;
    
    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  public getDaysUntilExpiry(): number {
    const hours = this.getHoursUntilExpiry();
    return Math.ceil(hours / 24);
  }

  public isUrgent(): boolean {
    return this.isEmergency || this.getHoursUntilExpiry() < 4;
  }

  public isDirectSwap(): boolean {
    return this.type === ShiftSwapType.DIRECT_SWAP;
  }

  public isCoverRequest(): boolean {
    return this.type === ShiftSwapType.COVER_REQUEST;
  }

  public isVolunteerOffer(): boolean {
    return this.type === ShiftSwapType.VOLUNTEER_OFFER;
  }

  public isEmergencyCover(): boolean {
    return this.type === ShiftSwapType.EMERGENCY_COVER;
  }

  public getSwapSummary(): {
    id: string;
    swapNumber: string;
    requestingEmployeeName: string;
    respondingEmployeeName: string;
    type: string;
    status: string;
    reason: string;
    isEmergency: boolean;
    isPaidSwap: boolean;
    compensationAmount: number;
    currency: string;
    expiresAt: Date | null;
    isExpired: boolean;
    hoursUntilExpiry: number;
    isUrgent: boolean;
    requiresManagerApproval: boolean;
    createdAt: Date;
  } {
    return {
      id: this.id,
      swapNumber: this.swapNumber,
      requestingEmployeeName: this.requestingEmployee?.getFullName() || '',
      respondingEmployeeName: this.respondingEmployee?.getFullName() || '',
      type: this.type,
      status: this.status,
      reason: this.reason,
      isEmergency: this.isEmergency,
      isPaidSwap: this.isPaidSwap,
      compensationAmount: this.compensationAmount,
      currency: this.currency,
      expiresAt: this.expiresAt,
      isExpired: this.isExpired(),
      hoursUntilExpiry: this.getHoursUntilExpiry(),
      isUrgent: this.isUrgent(),
      requiresManagerApproval: this.requiresManagerApproval,
      createdAt: this.createdAt,
    };
  }

  public getCompensationSummary(): {
    isPaidSwap: boolean;
    compensationAmount: number;
    currency: string;
    formattedAmount: string;
  } {
    const formattedAmount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
    }).format(this.compensationAmount);

    return {
      isPaidSwap: this.isPaidSwap,
      compensationAmount: this.compensationAmount,
      currency: this.currency,
      formattedAmount,
    };
  }
}