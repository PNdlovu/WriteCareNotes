import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Room Occupancy Entity for Enhanced Bed Room Management
 * @module RoomOccupancy
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../BaseEntity';
import { BedRoom } from './BedRoom';
import { Resident } from '../../Resident';

export interface OccupancyDetails {
  reason: 'admission' | 'transfer' | 'temporary' | 'emergency' | 'respite';
  specialRequirements: string[];
  emergencyContacts: string[];
  careLevel: 'low' | 'medium' | 'high' | 'critical';
  mobilityLevel: 'independent' | 'assisted' | 'dependent' | 'bedbound';
  dietaryRequirements: string[];
  medicationSchedule: any[];
  carePlan: any;
}

export interface OccupancyCharges {
  dailyRate: number;
  additionalServices: {
    service: string;
    rate: number;
    frequency: string;
  }[];
  totalDailyCharge: number;
  paymentMethod: 'self_funded' | 'local_authority' | 'nhs' | 'insurance';
  billingContact: string;
}

@Entity('room_occupancy')
export class RoomOccupancy extends BaseEntity {
  @Column({ type: 'uuid' })
  roomId!: string;

  @Column({ type: 'uuid' })
  residentId!: string;

  @Column({ type: 'timestamp' })
  checkInDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOutDate?: Date;

  @Column({ type: 'var char', length: 20 })
  status!: 'active' | 'completed' | 'cancelled' | 'transferred';

  @Column({ type: 'jsonb' })
  occupancyDetails!: OccupancyDetails;

  @Column({ type: 'jsonb' })
  charges!: OccupancyCharges;

  @Column({ type: 'var char', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  roomCondition?: {
    checkInCondition: string;
    checkOutCondition?: string;
    damages?: string[];
    cleaningRequired?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  specialArrangements?: {
    visitors: string[];
    pets: string[];
    personalBelongings: string[];
    medicalEquipment: string[];
  };

  @Column({ type: 'boolean', default: false })
  isEmergencyAdmission!: boolean;

  @Column({ type: 'var char', length: 100, nullable: true })
  admissionSource?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  dischargeDestination?: string;

  @Column({ type: 'jsonb', nullable: true })
  occupancyHistory?: {
    previousRooms: string[];
    transferReasons: string[];
    lengthOfStay: number;
  };

  // Relationships
  @ManyToOne(() => BedRoom, room => room.occupancies)
  @JoinColumn({ name: 'roomId' })
  room!: BedRoom;

  @ManyToOne(() => Resident, resident => resident.roomOccupancies)
  @JoinColumn({ name: 'residentId' })
  resident!: Resident;

  // Business Logic Methods
  getLengthOfStay(): number {
    const endDate = this.checkOutDate || new Date();
    const startDate = new Date(this.checkInDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  calculateTotalCharges(): number {
    const lengthOfStay = this.getLengthOfStay();
    let totalCharges = this.charges.dailyRate * lengthOfStay;

    // Add additional service charges
    for (const service of this.charges.additionalServices) {
      const serviceDays = this.calculateServiceDays(service.frequency, lengthOfStay);
      totalCharges += service.rate * serviceDays;
    }

    return totalCharges;
  }

  private calculateServiceDays(frequency: string, totalDays: number): number {
    switch (frequency) {
      case 'daily': return totalDays;
      case 'weekly': return Math.ceil(totalDays / 7);
      case 'monthly': return Math.ceil(totalDays / 30);
      case 'one_time': return 1;
      default: return totalDays;
    }
  }

  canCheckOut(): boolean {
    return this.status === 'active' && this.checkOutDate === null;
  }

  checkOut(checkOutDate: Date, notes?: string): void {
    if (!this.canCheckOut()) {
      throw new Error('Cannot check out - occupancy is not active');
    }

    this.checkOutDate = checkOutDate;
    this.status = 'completed';
    
    if (notes) {
      this.notes = (this.notes || '') + `\nCheck-out notes: ${notes}`;
    }

    // Update room status
    if (this.room) {
      this.room.status = 'available';
      this.room.currentResidentId = null;
    }
  }

  transferToNewRoom(newRoomId: string, transferDate: Date, reason: string): void {
    if (this.status !== 'active') {
      throw new Error('Cannot transfer - occupancy is not active');
    }

    // Update current occupancy
    this.status = 'transferred';
    this.checkOutDate = transferDate;
    this.notes = (this.notes || '') + `\nTransferred to room ${newRoomId} on ${transferDate.toISOString()}. Reason: ${reason}`;

    // Update room status
    if (this.room) {
      this.room.status = 'available';
      this.room.currentResidentId = null;
    }

    // Add to occupancy history
    if (!this.occupancyHistory) {
      this.occupancyHistory = {
        previousRooms: [],
        transferReasons: [],
        lengthOfStay: 0
      };
    }

    this.occupancyHistory.previousRooms.push(this.roomId);
    this.occupancyHistory.transferReasons.push(reason);
    this.occupancyHistory.lengthOfStay = this.getLengthOfStay();
  }

  updateCareLevel(newCareLevel: 'low' | 'medium' | 'high' | 'critical'): void {
    this.occupancyDetails.careLevel = newCareLevel;
    
    // Update charges based on care level
    switch (newCareLevel) {
      case 'low':
        this.charges.dailyRate = this.charges.dailyRate * 1.0;
        break;
      case 'medium':
        this.charges.dailyRate = this.charges.dailyRate * 1.2;
        break;
      case 'high':
        this.charges.dailyRate = this.charges.dailyRate * 1.5;
        break;
      case 'critical':
        this.charges.dailyRate = this.charges.dailyRate * 2.0;
        break;
    }
  }

  addSpecialRequirement(requirement: string): void {
    if (!this.occupancyDetails.specialRequirements.includes(requirement)) {
      this.occupancyDetails.specialRequirements.push(requirement);
    }
  }

  removeSpecialRequirement(requirement: string): void {
    const index = this.occupancyDetails.specialRequirements.indexOf(requirement);
    if (index > -1) {
      this.occupancyDetails.specialRequirements.splice(index, 1);
    }
  }

  getOccupancySummary(): any {
    return {
      residentId: this.residentId,
      roomId: this.roomId,
      status: this.status,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      lengthOfStay: this.getLengthOfStay(),
      careLevel: this.occupancyDetails.careLevel,
      totalCharges: this.calculateTotalCharges(),
      specialRequirements: this.occupancyDetails.specialRequirements,
      isEmergencyAdmission: this.isEmergencyAdmission
    };
  }
}
