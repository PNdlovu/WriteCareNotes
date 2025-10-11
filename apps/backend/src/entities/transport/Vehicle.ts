import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum VehicleType {
  MINIBUS = 'minibus',
  WHEELCHAIR_ACCESSIBLE = 'wheelchair_accessible',
  CAR = 'car',
  AMBULANCE = 'ambulance',
  DELIVERY_VAN = 'delivery_van'
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service'
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid'
}

export interface VehicleSpecifications {
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  vin: string;
  fuelType: FuelType;
  engineSize?: number;
  seatingCapacity: number;
  wheelchairSpaces: number;
  accessibility: {
    wheelchairLift: boolean;
    ramp: boolean;
    secureWheelchairPositions: number;
    hearingLoop: boolean;
    emergencyEquipment: string[];
  };
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  startDate: Date;
  expiryDate: Date;
  coverageType: string[];
  excessAmount: number;
  premiumAmount: number;
}

export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: 'service' | 'mot' | 'repair' | 'inspection';
  description: string;
  mileage: number;
  cost: number;
  performedBy: string;
  nextServiceDate?: Date;
  nextMOTDate?: Date;
  status: 'completed' | 'pending';
}

export interface FuelRecord {
  date: Date;
  amount: number; // liters or kWh
  cost: number;
  mileage: number;
  fuelStation?: string;
  recordedBy: string;
}

export interface Journey {
  id: string;
  startTime: Date;
  endTime?: Date;
  startLocation: string;
  endLocation: string;
  purpose: string;
  driverId: string;
  passengers: string[]; // Resident IDs
  mileage: number;
  fuelUsed?: number;
  incidents?: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  vehicleNumber: string;

  @Column({
    type: 'enum',
    enum: VehicleType
  })
  vehicleType: VehicleType;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE
  })
  status: VehicleStatus;

  @Column('jsonb')
  specifications: VehicleSpecifications;

  @Column('jsonb')
  insurance: Insurance;

  @Column('date')
  purchaseDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  purchasePrice: number;

  @Column('int')
  currentMileage: number;

  @Column('jsonb')
  maintenanceHistory: MaintenanceRecord[];

  @Column('date')
  lastServiceDate: Date;

  @Column('date')
  nextServiceDate: Date;

  @Column('date')
  motExpiryDate: Date;

  @Column('jsonb')
  fuelRecords: FuelRecord[];

  @Column('jsonb')
  journeyHistory: Journey[];

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isAvailable(): boolean {
    return this.status === VehicleStatus.AVAILABLE && this.isActive;
  }

  isServiceDue(): boolean {
    return new Date() >= this.nextServiceDate;
  }

  isMOTDue(withinDays: number = 30): boolean {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + withinDays);
    return this.motExpiryDate <= checkDate;
  }

  isInsuranceValid(): boolean {
    return new Date() <= this.insurance.expiryDate;
  }

  canAccommodateWheelchairs(): boolean {
    return this.specifications.wheelchairSpaces > 0;
  }

  getAvailableSeats(): number {
    return this.specifications.seatingCapacity;
  }

  getFuelEfficiency(): number {
    if (this.fuelRecords.length < 2) return 0;
    
    const totalFuel = this.fuelRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalMileage = this.currentMileage - (this.fuelRecords[0]?.mileage || 0);
    
    return totalMileage / totalFuel; // miles per liter/kWh
  }

  getTotalFuelCost(period: 'month' | 'year' = 'month'): number {
    const cutoffDate = new Date();
    if (period === 'month') {
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    } else {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    }

    return this.fuelRecords
      .filter(record => new Date(record.date) >= cutoffDate)
      .reduce((sum, record) => sum + record.cost, 0);
  }

  getTotalMaintenanceCost(period: 'month' | 'year' = 'year'): number {
    const cutoffDate = new Date();
    if (period === 'month') {
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    } else {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    }

    return this.maintenanceHistory
      .filter(record => new Date(record.date) >= cutoffDate)
      .reduce((sum, record) => sum + record.cost, 0);
  }

  getUtilizationRate(period: 'month' | 'year' = 'month'): number {
    const cutoffDate = new Date();
    if (period === 'month') {
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    } else {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    }

    const recentJourneys = this.journeyHistory.filter(journey => 
      new Date(journey.startTime) >= cutoffDate && journey.status === 'completed'
    );

    const totalDays = period === 'month' ? 30 : 365;
    const daysUsed = new Set(recentJourneys.map(journey => 
      new Date(journey.startTime).toDateString()
    )).size;

    return (daysUsed / totalDays) * 100;
  }

  addJourney(journey: Omit<Journey, 'id'>): void {
    const journeyRecord = {
      ...journey,
      id: crypto.randomUUID()
    };
    
    this.journeyHistory.push(journeyRecord);
  }

  completeJourney(journeyId: string, endTime: Date, endMileage: number): void {
    const journey = this.journeyHistory.find(j => j.id === journeyId);
    if (journey) {
      journey.endTime = endTime;
      journey.status = 'completed';
      journey.mileage = endMileage - this.currentMileage;
      this.currentMileage = endMileage;
    }
  }

  addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): void {
    const maintenanceRecord = {
      ...record,
      id: crypto.randomUUID()
    };
    
    this.maintenanceHistory.push(maintenanceRecord);
    this.lastServiceDate = record.date;
    
    if (record.nextServiceDate) {
      this.nextServiceDate = record.nextServiceDate;
    }
  }

  addFuelRecord(record: FuelRecord): void {
    this.fuelRecords.push(record);
    this.currentMileage = record.mileage;
  }

  needsAttention(): boolean {
    return this.isServiceDue() || 
           this.isMOTDue() || 
           !this.isInsuranceValid() ||
           this.status === VehicleStatus.MAINTENANCE ||
           this.status === VehicleStatus.OUT_OF_SERVICE;
  }
}
