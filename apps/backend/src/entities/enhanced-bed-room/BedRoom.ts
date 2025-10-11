import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Bed Room Entity for Enhanced Bed Room Management
 * @module BedRoom
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../BaseEntity';
import { RoomOccupancy } from './RoomOccupancy';
import { CareHome } from '../../organization/CareHome';

export interface RoomAmenities {
  ensuite: boolean;
  tv: boolean;
  wifi: boolean;
  airConditioning: boolean;
  accessibility: boolean;
  emergencyCall: boolean;
  privateBathroom: boolean;
  kitchenette: boolean;
  balcony: boolean;
  gardenAccess: boolean;
}

export interface RoomEquipment {
  bedType: 'single' | 'double' | 'hospital' | 'electric' | 'specialized';
  mobilityAids: string[];
  medicalEquipment: string[];
  safetyFeatures: string[];
  furniture: string[];
  technology: string[];
}

export interface MaintenanceSchedule {
  weekly: boolean;
  monthly: boolean;
  quarterly: boolean;
  lastService: Date;
  nextService: Date;
  serviceProvider: string;
  maintenanceNotes: string[];
}

@Entity('bed_rooms')
export class BedRoom extends BaseEntity {
  @Column({ type: 'var char', length: 100, unique: true })
  roomNumber!: string;

  @Column({ type: 'var char', length: 50 })
  roomType!: 'single' | 'double' | 'suite' | 'specialized' | 'deluxe' | 'family';

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  roomSize!: number;

  @Column({ type: 'var char', length: 20 })
  floor!: string;

  @Column({ type: 'var char', length: 20 })
  wing!: string;

  @Column({ type: 'jsonb' })
  amenities!: RoomAmenities;

  @Column({ type: 'jsonb' })
  equipment!: RoomEquipment;

  @Column({ type: 'var char', length: 20 })
  status!: 'available' | 'occupied' | 'maintenance' | 'quarantine' | 'reserved' | 'out_of_order';

  @Column({ type: 'uuid' })
  careHomeId!: string;

  @Column({ type: 'uuid', nullable: true })
  currentResidentId?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastCleanedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastMaintenanceAt?: Date;

  @Column({ type: 'jsonb' })
  maintenanceSchedule!: MaintenanceSchedule;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dailyRate?: number;

  @Column({ type: 'var char', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  roomPhotos?: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  accessibilityFeatures?: {
    wheelchairAccessible: boolean;
    hoistCompatible: boolean;
    wideDoorways: boolean;
    accessibleBathroom: boolean;
    emergencyEvacuation: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  environmentalControls?: {
    temperatureControl: boolean;
    lightingControl: boolean;
    windowBlinds: boolean;
    airQuality: boolean;
    noiseLevel: 'low' | 'medium' | 'high';
  };

  // Relationships
  @OneToMany(() => RoomOccupancy, occupancy => occupancy.room)
  occupancies!: RoomOccupancy[];

  @ManyToOne(() => CareHome, careHome => careHome.rooms)
  @JoinColumn({ name: 'careHomeId' })
  careHome!: CareHome;

  // Business Logic Methods
  isAvailable(): boolean {
    return this.status === 'available' && this.isActive;
  }

  isOccupied(): boolean {
    return this.status === 'occupied';
  }

  needsMaintenance(): boolean {
    if (!this.maintenanceSchedule.nextService) return false;
    return new Date() >= new Date(this.maintenanceSchedule.nextService);
  }

  getOccupancyHistory(): RoomOccupancy[] {
    return this.occupancies || [];
  }

  getCurrentOccupancy(): RoomOccupancy | undefined {
    return this.occupancies?.find(occupancy => occupancy.status === 'active');
  }

  calculateRoomValue(): number {
    let baseValue = this.dailyRate || 0;
    
    // Add value based on amenities
    if (this.amenities.ensuite) baseValue += 10;
    if (this.amenities.tv) baseValue += 5;
    if (this.amenities.wifi) baseValue += 3;
    if (this.amenities.airConditioning) baseValue += 8;
    if (this.amenities.accessibility) baseValue += 15;
    if (this.amenities.privateBathroom) baseValue += 12;
    if (this.amenities.kitchenette) baseValue += 20;
    if (this.amenities.balcony) baseValue += 15;
    if (this.amenities.gardenAccess) baseValue += 10;

    // Add value based on room type
    switch (this.roomType) {
      case 'suite': baseValue += 30; break;
      case 'deluxe': baseValue += 25; break;
      case 'family': baseValue += 20; break;
      case 'specialized': baseValue += 35; break;
    }

    return baseValue;
  }

  getMaintenanceStatus(): 'up_to_date' | 'due_soon' | 'overdue' {
    if (!this.maintenanceSchedule.nextService) return 'up_to_date';
    
    const nextService = new Date(this.maintenanceSchedule.nextService);
    const now = new Date();
    const daysUntilService = Math.ceil((nextService.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilService < 0) return 'overdue';
    if (daysUntilService <= 7) return 'due_soon';
    return 'up_to_date';
  }

  updateMaintenanceSchedule(completed: boolean, notes?: string): void {
    if (completed) {
      this.lastMaintenanceAt = new Date();
      this.maintenanceSchedule.lastService = new Date();
      
      // Calculate next service date
      const nextService = new Date();
      if (this.maintenanceSchedule.weekly) {
        nextService.setDate(nextService.getDate() + 7);
      } else if (this.maintenanceSchedule.monthly) {
        nextService.setMonth(nextService.getMonth() + 1);
      } else if (this.maintenanceSchedule.quarterly) {
        nextService.setMonth(nextService.getMonth() + 3);
      }
      
      this.maintenanceSchedule.nextService = nextService;
      
      if (notes) {
        this.maintenanceSchedule.maintenanceNotes.push(notes);
      }
    }
  }

  canAccommodateResident(residentRequirements: any): boolean {
    // Check accessibility requirements
    if (residentRequirements.wheelchairAccess && !this.accessibilityFeatures?.wheelchairAccessible) {
      return false;
    }

    if (residentRequirements.hoistRequired && !this.accessibilityFeatures?.hoistCompatible) {
      return false;
    }

    // Check room type compatibility
    if (residentRequirements.roomType && residentRequirements.roomType !== this.roomType) {
      return false;
    }

    // Check equipment requirements
    if (residentRequirements.requiredEquipment) {
      for (const equipment of residentRequirements.requiredEquipment) {
        if (!this.equipment.medicalEquipment.includes(equipment)) {
          return false;
        }
      }
    }

    return true;
  }
}
