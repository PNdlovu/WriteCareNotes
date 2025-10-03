import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Room } from './Room';
import { Resident } from '../resident/Resident';

export enum BedType {
  STANDARD = 'standard',
  PROFILING = 'profiling',
  BARIATRIC = 'bariatric',
  LOW_LOW = 'low_low',
  PRESSURE_RELIEF = 'pressure_relief',
  ELECTRIC = 'electric',
  MANUAL = 'manual'
}

export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning',
  RESERVED = 'reserved',
  OUT_OF_SERVICE = 'out_of_service'
}

export enum CareLevel {
  RESIDENTIAL = 'residential',
  NURSING = 'nursing',
  DEMENTIA = 'dementia',
  PALLIATIVE = 'palliative',
  RESPITE = 'respite',
  REHABILITATION = 'rehabilitation'
}

export interface BedSpecifications {
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weightCapacity: number; // kg
  adjustable: boolean;
  sideRails: boolean;
  electricControls: boolean;
  pressureReliefMattress: boolean;
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  hoistCompatible: boolean;
  lowHeight: boolean;
  wideDoor: boolean;
  emergencyCallSystem: boolean;
}

export interface MedicalEquipment {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  lastInspectionDate: Date;
  nextInspectionDate: Date;
  status: 'operational' | 'maintenance' | 'out_of_service';
}

export interface MaintenanceSchedule {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
  maintenanceType: string;
  assignedTechnician?: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface RateHistory {
  effectiveDate: Date;
  rate: Money;
  reason: string;
  approvedBy: string;
}

export interface AvailabilitySlot {
  startDate: Date;
  endDate: Date;
  status: 'available' | 'reserved' | 'blocked';
  reason?: string;
}

export interface BedReservation {
  id: string;
  residentId?: string;
  reservationDate: Date;
  expectedOccupancyDate: Date;
  reservedBy: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface OccupancyRecord {
  id: string;
  residentId: string;
  startDate: Date;
  endDate?: Date;
  reasonForChange: string;
  notes?: string;
}

@Entity('beds')
export class Bed extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  bedNumber: string;

  @Column('uuid')
  roomId: string;

  @ManyToOne(() => Room, room => room.beds)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({
    type: 'enum',
    enum: BedType,
    default: BedType.STANDARD
  })
  bedType: BedType;

  @Column({
    type: 'enum',
    enum: BedStatus,
    default: BedStatus.AVAILABLE
  })
  status: BedStatus;

  @Column('simple-array')
  careLevel: CareLevel[];

  @Column('jsonb')
  specifications: BedSpecifications;

  @Column('jsonb')
  equipment: MedicalEquipment[];

  @Column('jsonb')
  accessibility: AccessibilityFeatures;

  @Column('uuid', { nullable: true })
  currentResidentId?: string;

  @ManyToOne(() => Resident, { nullable: true })
  @JoinColumn({ name: 'currentResidentId' })
  currentResident?: Resident;

  @Column('jsonb')
  occupancyHistory: OccupancyRecord[];

  @Column('timestamp')
  lastMaintenanceDate: Date;

  @Column('timestamp')
  nextMaintenanceDate: Date;

  @Column('jsonb')
  maintenanceSchedule: MaintenanceSchedule;

  @Column('jsonb')
  baseRate: Money;

  @Column('jsonb')
  currentRate: Money;

  @Column('jsonb')
  rateHistory: RateHistory[];

  @Column('jsonb')
  availabilityCalendar: AvailabilitySlot[];

  @Column('jsonb')
  reservations: BedReservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isAvailable(): boolean {
    return this.status === BedStatus.AVAILABLE && !this.currentResident;
  }

  isOccupied(): boolean {
    return this.status === BedStatus.OCCUPIED && !!this.currentResident;
  }

  canAccommodateCareLevel(requiredCareLevel: CareLevel): boolean {
    return this.careLevel.includes(requiredCareLevel);
  }

  getDailyRate(): number {
    return this.currentRate.amount;
  }

  isMaintenanceDue(): boolean {
    return new Date() >= this.nextMaintenanceDate;
  }

  hasReservation(): boolean {
    return this.reservations.some(r => r.status === 'confirmed' && new Date() <= new Date(r.expectedOccupancyDate));
  }

  getNextAvailableDate(): Date | null {
    if (this.isAvailable()) {
      return new Date();
    }

    // Check reservations for next available slot
    const sortedReservations = this.reservations
      .filter(r => r.status === 'confirmed')
      .sort((a, b) => new Date(a.expectedOccupancyDate).getTime() - new Date(b.expectedOccupancyDate).getTime());

    if (sortedReservations.length === 0) {
      return null; // No known availability
    }

    // Return the earliest available date after current occupancy
    return new Date(sortedReservations[0].expectedOccupancyDate);
  }
}