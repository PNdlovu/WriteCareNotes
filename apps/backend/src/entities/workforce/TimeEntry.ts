import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Employee } from '../hr/Employee';

export enum TimeEntryType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end'
}

export enum TimeEntryStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp: Date;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'web' | 'kiosk';
  platform: string;
  appVersion: string;
  userAgent?: string;
}

@Entity('time_entries')
export class TimeEntry extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: TimeEntryType
  })
  type: TimeEntryType;

  @Column({
    type: 'enum',
    enum: TimeEntryStatus,
    default: TimeEntryStatus.ACTIVE
  })
  status: TimeEntryStatus;

  @Column('timestamp')
  timestamp: Date;

  @Column('jsonb', { nullable: true })
  location?: LocationData;

  @Column('jsonb')
  deviceInfo: DeviceInfo;

  @Column({ nullable: true })
  shiftId?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  hoursWorked?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  overtimeHours?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  breakDuration?: number;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column('timestamp', { nullable: true })
  approvedAt?: Date;

  @Column('text', { nullable: true })
  approvalNotes?: string;

  @Column({ default: false })
  isManualEntry: boolean;

  @Column({ nullable: true })
  manualEntryReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business Methods
  isClockIn(): boolean {
    return this.type === TimeEntryType.CLOCK_IN;
  }

  isClockOut(): boolean {
    return this.type === TimeEntryType.CLOCK_OUT;
  }

  isBreakEntry(): boolean {
    return this.type === TimeEntryType.BREAK_START || this.type === TimeEntryType.BREAK_END;
  }

  requiresApproval(): boolean {
    return this.isManualEntry || this.overtimeHours > 0 || this.status === TimeEntryStatus.DISPUTED;
  }

  calculateHoursFromPrevious(previousEntry?: TimeEntry): number {
    if (!previousEntry) return 0;
    
    const timeDiff = this.timestamp.getTime() - previousEntry.timestamp.getTime();
    return Number((timeDiff / (1000 * 60 * 60)).toFixed(2)); // Convert to hours
  }

  isWithinLocationThreshold(expectedLocation: LocationData, thresholdMeters: number = 100): boolean {
    if (!this.location || !expectedLocation) return true; // Skip validation if no location data
    
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(expectedLocation.latitude - this.location.latitude);
    const dLon = this.toRadians(expectedLocation.longitude - this.location.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(this.location.latitude)) * Math.cos(this.toRadians(expectedLocation.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusKm * c * 1000; // Convert to meters
    
    return distance <= thresholdMeters;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getWorkingHours(): number {
    return this.hoursWorked || 0;
  }

  getOvertimeHours(): number {
    return this.overtimeHours || 0;
  }

  getTotalHours(): number {
    return this.getWorkingHours() + this.getOvertimeHours();
  }
}
