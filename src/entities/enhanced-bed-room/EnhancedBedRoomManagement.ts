import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum RoomType {
  SINGLE_ROOM = 'single_room',
  SHARED_ROOM = 'shared_room',
  DEMENTIA_SPECIALIST = 'dementia_specialist',
  PALLIATIVE_CARE = 'palliative_care',
  RESPITE_CARE = 'respite_care',
  ASSESSMENT_ROOM = 'assessment_room',
  ISOLATION_ROOM = 'isolation_room'
}

export enum RoomStatus {
  OCCUPIED = 'occupied',
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning',
  RESERVED = 'reserved',
  OUT_OF_SERVICE = 'out_of_service'
}

export interface SmartRoomFeatures {
  environmentalControls: {
    smartThermostat: boolean;
    automatedLighting: boolean;
    airQualityMonitoring: boolean;
    noiseControl: boolean;
    humidityControl: boolean;
  };
  safetyFeatures: {
    fallDetection: boolean;
    emergencyCallSystem: boolean;
    wanderingPrevention: boolean;
    medicationReminders: boolean;
    vitalSignsMonitoring: boolean;
  };
  comfortFeatures: {
    personalizedLighting: boolean;
    musicSystem: boolean;
    familyPhotos: boolean;
    comfortItems: boolean;
    privacyControls: boolean;
  };
  accessibilityFeatures: {
    wheelchairAccessible: boolean;
    adjustableBed: boolean;
    accessibleBathroom: boolean;
    assistiveTechnology: boolean;
    mobilityAids: boolean;
  };
}

@Entity('enhanced_bed_room_management')
export class EnhancedBedRoomManagement extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  roomId: string;

  @Column()
  roomNumber: string;

  @Column({
    type: 'enum',
    enum: RoomType
  })
  roomType: RoomType;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE
  })
  status: RoomStatus;

  @Column('jsonb')
  smartRoomFeatures: SmartRoomFeatures;

  @Column('jsonb')
  occupancyHistory: Array<{
    residentId: string;
    checkInDate: Date;
    checkOutDate?: Date;
    occupancyDuration?: number; // days
    satisfactionRating?: number; // 1-5
  }>;

  @Column('jsonb')
  environmentalData: Array<{
    timestamp: Date;
    temperature: number;
    humidity: number;
    airQuality: number;
    noiseLevel: number;
    lightLevel: number;
  }>;

  @Column('decimal', { precision: 5, scale: 2 })
  occupancyRate: number; // percentage

  @Column('timestamp', { nullable: true })
  lastMaintenance?: Date;

  @Column('timestamp', { nullable: true })
  nextMaintenance?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isAvailable(): boolean {
    return this.status === RoomStatus.AVAILABLE;
  }

  isOccupied(): boolean {
    return this.status === RoomStatus.OCCUPIED;
  }

  needsMaintenance(): boolean {
    if (!this.nextMaintenance) return false;
    return new Date() >= this.nextMaintenance;
  }

  getCurrentOccupant(): any | null {
    const currentOccupancy = this.occupancyHistory.find(occupancy => !occupancy.checkOutDate);
    return currentOccupancy || null;
  }

  calculateAverageOccupancyDuration(): number {
    const completedOccupancies = this.occupancyHistory.filter(occupancy => occupancy.occupancyDuration);
    if (completedOccupancies.length === 0) return 0;
    
    return completedOccupancies.reduce((sum, occupancy) => sum + occupancy.occupancyDuration!, 0) / completedOccupancies.length;
  }

  getAverageSatisfactionRating(): number {
    const ratedOccupancies = this.occupancyHistory.filter(occupancy => occupancy.satisfactionRating);
    if (ratedOccupancies.length === 0) return 0;
    
    return ratedOccupancies.reduce((sum, occupancy) => sum + occupancy.satisfactionRating!, 0) / ratedOccupancies.length;
  }
}