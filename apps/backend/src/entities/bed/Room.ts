import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Bed } from './Bed';

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  SHARED = 'shared',
  SUITE = 'suite',
  STUDIO = 'studio',
  RESPITE = 'respite'
}

export enum RoomLayout {
  STANDARD = 'standard',
  ACCESSIBLE = 'accessible',
  ENSUITE = 'ensuite',
  KITCHENETTE = 'kitchenette',
  BALCONY = 'balcony',
  GARDEN_VIEW = 'garden_view'
}

export enum RoomAmenity {
  PRIVATE_BATHROOM = 'private_bathroom',
  SHARED_BATHROOM = 'shared_bathroom',
  KITCHENETTE = 'kitchenette',
  BALCONY = 'balcony',
  GARDEN_ACCESS = 'garden_access',
  CALL_SYSTEM = 'call_system',
  WIFI = 'wifi',
  TELEVISION = 'television',
  TELEPHONE = 'telephone',
  AIR_CONDITIONING = 'air_conditioning',
  HEATING = 'heating',
  CEILING_HOIST = 'ceiling_hoist',
  EMERGENCY_LIGHTING = 'emergency_lighting'
}

export interface RoomEnvironmentalControls {
  temperature: {
    current: number;
    target: number;
    range: { min: number; max: number };
  };
  humidity: {
    current: number;
    target: number;
    range: { min: number; max: number };
  };
  lighting: {
    natural: boolean;
    artificial: string[];
    dimmable: boolean;
  };
  airQuality: {
    ventilation: string;
    filtration: string;
    airChangesPerHour: number;
  };
}

export interface RoomSafetyFeatures {
  fireDetection: boolean;
  smokeDetectors: number;
  sprinklerSystem: boolean;
  emergencyExits: number;
  emergencyCallPoints: number;
  securityCameras: boolean;
  windowRestrictions: boolean;
  nonSlipFlooring: boolean;
}

export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: 'routine' | 'repair' | 'upgrade' | 'inspection';
  description: string;
  performedBy: string;
  cost?: number;
  nextMaintenanceDate?: Date;
  status: 'completed' | 'pending' | 'scheduled';
}

@Entity('rooms')
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  roomNumber: string;

  @Column()
  floor: number;

  @Column()
  wing: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.SINGLE
  })
  roomType: RoomType;

  @Column('decimal', { precision: 6, scale: 2 })
  size: number; // square meters

  @Column({
    type: 'enum',
    enum: RoomLayout,
    default: RoomLayout.STANDARD
  })
  layout: RoomLayout;

  @Column('simple-array')
  amenities: RoomAmenity[];

  @Column('jsonb')
  environmentalControls: RoomEnvironmentalControls;

  @Column('jsonb')
  safetyFeatures: RoomSafetyFeatures;

  @Column()
  maxOccupancy: number;

  @Column()
  currentOccupancy: number;

  @Column('jsonb')
  maintenanceHistory: MaintenanceRecord[];

  @Column('timestamp', { nullable: true })
  lastCleaningDate?: Date;

  @Column('timestamp', { nullable: true })
  nextInspectionDate?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @OneToMany(() => Bed, bed => bed.room)
  beds: Bed[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isAvailable(): boolean {
    return this.beds.some(bed => bed.isAvailable());
  }

  getAvailableBeds(): Bed[] {
    return this.beds.filter(bed => bed.isAvailable());
  }

  getOccupiedBeds(): Bed[] {
    return this.beds.filter(bed => bed.isOccupied());
  }

  getOccupancyRate(): number {
    if (this.beds.length === 0) return 0;
    return (this.getOccupiedBeds().length / this.beds.length) * 100;
  }

  canAccommodateNewResident(): boolean {
    return this.currentOccupancy < this.maxOccupancy && this.isAvailable();
  }

  hasAmenity(amenity: RoomAmenity): boolean {
    return this.amenities.includes(amenity);
  }

  isMaintenanceDue(): boolean {
    return this.nextInspectionDate ? new Date() >= this.nextInspectionDate : false;
  }

  getLastMaintenanceDate(): Date | null {
    if (this.maintenanceHistory.length === 0) return null;
    return this.maintenanceHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date;
  }
}
