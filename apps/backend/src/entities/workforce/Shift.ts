import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Employee } from '../hr/Employee';

export enum ShiftType {
  REGULAR = 'regular',
  OVERTIME = 'overtime',
  ON_CALL = 'on_call',
  NIGHT_SHIFT = 'night_shift',
  WEEKEND = 'weekend',
  HOLIDAY = 'holiday',
  SPLIT_SHIFT = 'split_shift'
}

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface ShiftLocation {
  locationId: string;
  locationName: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ShiftRequirements {
  minimumQualifications: string[];
  requiredCertifications: string[];
  skillsRequired: string[];
  experienceLevel: 'entry' | 'intermediate' | 'senior' | 'expert';
}

export interface ShiftBreaks {
  breakId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  type: 'paid' | 'unpaid';
  mandatory: boolean;
}

@Entity('shifts')
export class Shift extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  shiftCode: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: ShiftType
  })
  type: ShiftType;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.SCHEDULED
  })
  status: ShiftStatus;

  @Column('timestamp')
  scheduledStart: Date;

  @Column('timestamp')
  scheduledEnd: Date;

  @Column('timestamp', { nullable: true })
  actualStart?: Date;

  @Column('timestamp', { nullable: true })
  actualEnd?: Date;

  @Column('jsonb')
  location: ShiftLocation;

  @Column('jsonb', { nullable: true })
  requirements?: ShiftRequirements;

  @Column('jsonb', { nullable: true })
  breaks?: ShiftBreaks[];

  @Column('decimal', { precision: 5, scale: 2 })
  scheduledHours: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  actualHours?: number;

  @Column('decimal', { precision: 10, scale: 2 })
  hourlyRate: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  overtimeRate?: number;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  specialInstructions?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  assignedBy?: string;

  @Column('timestamp', { nullable: true })
  assignedAt?: Date;

  @Column({ nullable: true })
  supervisorId?: string;

  @Column({ default: false })
  requiresConfirmation: boolean;

  @Column('timestamp', { nullable: true })
  confirmedAt?: Date;

  @Column({ default: false })
  isRecurring: boolean;

  @Column('text', { nullable: true })
  recurringPattern?: string;

  @Column({ nullable: true })
  parentShiftId?: string;

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
  isActive(): boolean {
    return [ShiftStatus.SCHEDULED, ShiftStatus.CONFIRMED, ShiftStatus.IN_PROGRESS].includes(this.status);
  }

  isCompleted(): boolean {
    return this.status === ShiftStatus.COMPLETED;
  }

  isOvertime(): boolean {
    return this.type === ShiftType.OVERTIME || this.scheduledHours > 8;
  }

  isToday(): boolean {
    const today = new Date();
    const shiftDate = new Date(this.scheduledStart);
    return shiftDate.toDateString() === today.toDateString();
  }

  isUpcoming(): boolean {
    return new Date(this.scheduledStart) > new Date();
  }

  isPast(): boolean {
    return new Date(this.scheduledEnd) < new Date();
  }

  getDuration(): number {
    const start = this.actualStart || this.scheduledStart;
    const end = this.actualEnd || this.scheduledEnd;
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
  }

  getScheduledDuration(): number {
    return (this.scheduledEnd.getTime() - this.scheduledStart.getTime()) / (1000 * 60 * 60);
  }

  getVariance(): number {
    if (!this.actualHours) return 0;
    return this.actualHours - this.scheduledHours;
  }

  isLate(): boolean {
    if (!this.actualStart) return false;
    return this.actualStart > this.scheduledStart;
  }

  isEarlyFinish(): boolean {
    if (!this.actualEnd) return false;
    return this.actualEnd < this.scheduledEnd;
  }

  getLatenessMinutes(): number {
    if (!this.isLate()) return 0;
    return (this.actualStart!.getTime() - this.scheduledStart.getTime()) / (1000 * 60);
  }

  getTotalBreakTime(): number {
    if (!this.breaks) return 0;
    return this.breaks.reduce((total, breakTime) => total + breakTime.duration, 0);
  }

  getPaidBreakTime(): number {
    if (!this.breaks) return 0;
    return this.breaks
      .filter(breakTime => breakTime.type === 'paid')
      .reduce((total, breakTime) => total + breakTime.duration, 0);
  }

  calculateGrossPay(): number {
    const regularHours = Math.min(this.actualHours || this.scheduledHours, 8);
    const overtimeHours = Math.max((this.actualHours || this.scheduledHours) - 8, 0);
    
    const regularPay = regularHours * this.hourlyRate;
    const overtimePay = overtimeHours * (this.overtimeRate || this.hourlyRate * 1.5);
    
    return regularPay + overtimePay;
  }

  canBeCancelled(): boolean {
    const hoursUntilStart = (this.scheduledStart.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return this.isActive() && hoursUntilStart > 2; // Can cancel if more than 2 hours notice
  }

  requiresApproval(): boolean {
    return this.isOvertime() || this.type === ShiftType.ON_CALL || this.getVariance() > 1;
  }

  getShiftSummary() {
    return {
      shiftCode: this.shiftCode,
      date: this.scheduledStart.toDateString(),
      time: `${this.scheduledStart.toLocaleTimeString()} - ${this.scheduledEnd.toLocaleTimeString()}`,
      location: this.location.locationName,
      type: this.type,
      status: this.status,
      hours: this.scheduledHours,
      rate: this.hourlyRate
    };
  }
}