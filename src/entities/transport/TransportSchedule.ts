import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export interface JourneyStop {
  transportRequestId: string;
  startTime: Date;
  endTime: Date;
  pickup: string;
  destination: string;
  passengers: string[];
  purpose: string;
  estimatedDuration: number; // minutes
  estimatedDistance: number; // miles
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  actualDistance?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

@Entity('transport_schedules')
export class TransportSchedule extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('date')
  date: Date;

  @Column('uuid')
  vehicleId: string;

  @Column('uuid')
  driverId: string;

  @Column('jsonb')
  journeys: JourneyStop[];

  @Column('decimal', { precision: 8, scale: 2 })
  totalMileage: number;

  @Column('integer')
  totalDuration: number; // minutes

  @Column('decimal', { precision: 10, scale: 2 })
  estimatedFuelCost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualFuelCost?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualTotalCost?: number;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  })
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  @Column('timestamp', { nullable: true })
  actualStartTime?: Date;

  @Column('timestamp', { nullable: true })
  actualEndTime?: Date;

  @Column('integer', { nullable: true })
  actualTotalDuration?: number; // minutes

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  actualTotalMileage?: number;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('jsonb', { nullable: true })
  incidents?: {
    incidentType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: string;
    time: Date;
    actionTaken: string;
    reportedBy: string;
  }[];

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  efficiency?: number; // requests per hour

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fuelEfficiency?: number; // miles per gallon/liter

  @Column('boolean', { default: false })
  requiresReview: boolean;

  @Column('text', { nullable: true })
  reviewNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isScheduled(): boolean {
    return this.status === 'scheduled';
  }

  isInProgress(): boolean {
    return this.status === 'in_progress';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  getTotalJourneys(): number {
    return this.journeys.length;
  }

  getCompletedJourneys(): number {
    return this.journeys.filter(journey => journey.status === 'completed').length;
  }

  getCompletionRate(): number {
    if (this.journeys.length === 0) return 0;
    return (this.getCompletedJourneys() / this.journeys.length) * 100;
  }

  getTotalPassengers(): number {
    return this.journeys.reduce((total, journey) => total + journey.passengers.length, 0);
  }

  getDuration(): number {
    if (this.actualTotalDuration) return this.actualTotalDuration;
    return this.totalDuration;
  }

  getMileage(): number {
    if (this.actualTotalMileage) return this.actualTotalMileage;
    return this.totalMileage;
  }

  getFuelCost(): number {
    return this.actualFuelCost || this.estimatedFuelCost;
  }

  getTotalCost(): number {
    return this.actualTotalCost || this.getFuelCost();
  }

  getEfficiency(): number {
    if (this.efficiency) return this.efficiency;
    const duration = this.getDuration();
    if (duration === 0) return 0;
    return (this.getTotalJourneys() / duration) * 60; // journeys per hour
  }

  getFuelEfficiency(): number {
    if (this.fuelEfficiency) return this.fuelEfficiency;
    const mileage = this.getMileage();
    const fuelCost = this.getFuelCost();
    if (fuelCost === 0) return 0;
    // Assuming average fuel price of £1.50 per liter
    const fuelUsed = fuelCost / 1.50;
    return mileage / fuelUsed; // miles per liter
  }

  isOverdue(): boolean {
    if (this.isCompleted() || this.isCancelled()) return false;
    const now = new Date();
    const scheduleDate = new Date(this.date);
    scheduleDate.setHours(23, 59, 59, 999); // End of day
    return now > scheduleDate;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const now = new Date();
    const scheduleDate = new Date(this.date);
    const diffTime = now.getTime() - scheduleDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  hasIncidents(): boolean {
    return this.incidents && this.incidents.length > 0;
  }

  getHighSeverityIncidents(): any[] {
    if (!this.incidents) return [];
    return this.incidents.filter(incident => 
      incident.severity === 'high' || incident.severity === 'critical'
    );
  }

  requiresImmediateAttention(): boolean {
    return this.isOverdue() || 
           this.getHighSeverityIncidents().length > 0 ||
           this.requiresReview;
  }

  canBeStarted(): boolean {
    return this.isScheduled() && !this.isInProgress();
  }

  canBeCompleted(): boolean {
    return this.isInProgress() && !this.isCompleted();
  }

  canBeCancelled(): boolean {
    return !this.isCompleted() && !this.isCancelled();
  }

  getNextJourney(): JourneyStop | null {
    const nextJourney = this.journeys.find(journey => 
      journey.status === 'scheduled' || journey.status === 'in_progress'
    );
    return nextJourney || null;
  }

  getCurrentJourney(): JourneyStop | null {
    return this.journeys.find(journey => journey.status === 'in_progress') || null;
  }

  getJourneyProgress(): number {
    if (this.journeys.length === 0) return 0;
    const completed = this.getCompletedJourneys();
    return (completed / this.journeys.length) * 100;
  }

  addIncident(incident: any): void {
    if (!this.incidents) {
      this.incidents = [];
    }
    this.incidents.push({
      ...incident,
      time: new Date()
    });
  }

  updateJourneyStatus(journeyId: string, status: string, actualData?: any): void {
    const journey = this.journeys.find(j => j.transportRequestId === journeyId);
    if (journey) {
      journey.status = status as any;
      if (actualData) {
        if (actualData.actualStartTime) journey.actualStartTime = actualData.actualStartTime;
        if (actualData.actualEndTime) journey.actualEndTime = actualData.actualEndTime;
        if (actualData.actualDuration) journey.actualDuration = actualData.actualDuration;
        if (actualData.actualDistance) journey.actualDistance = actualData.actualDistance;
        if (actualData.notes) journey.notes = actualData.notes;
      }
    }
  }

  getScheduleSummary(): string {
    const journeys = this.getTotalJourneys();
    const duration = this.getDuration();
    const mileage = this.getMileage();
    const status = this.status.toUpperCase();
    
    return `Schedule ${this.date.toDateString()}: ${journeys} journeys, ${duration}min, ${mileage}mi, ${status}`;
  }

  getCostPerJourney(): number {
    const totalCost = this.getTotalCost();
    const journeys = this.getTotalJourneys();
    return journeys > 0 ? totalCost / journeys : 0;
  }

  getCostPerMile(): number {
    const totalCost = this.getTotalCost();
    const mileage = this.getMileage();
    return mileage > 0 ? totalCost / mileage : 0;
  }

  getCostPerPassenger(): number {
    const totalCost = this.getTotalCost();
    const passengers = this.getTotalPassengers();
    return passengers > 0 ? totalCost / passengers : 0;
  }

  isEfficient(): boolean {
    const efficiency = this.getEfficiency();
    return efficiency >= 2.0; // At least 2 journeys per hour
  }

  isCostEffective(): boolean {
    const costPerJourney = this.getCostPerJourney();
    return costPerJourney <= 25; // Under £25 per journey
  }
}