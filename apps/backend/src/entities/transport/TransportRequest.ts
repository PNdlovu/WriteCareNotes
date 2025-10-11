import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum TransportRequestType {
  MEDICAL_APPOINTMENT = 'medical_appointment',
  SOCIAL_OUTING = 'social_outing',
  FAMILY_VISIT = 'family_visit',
  EMERGENCY = 'emergency',
  ROUTINE = 'routine'
}

export enum TransportRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TransportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency'
}

@Entity('transport_requests')
export class TransportRequest extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  requestNumber: string;

  @Column('uuid')
  residentId: string;

  @Column({
    type: 'enum',
    enum: TransportRequestType
  })
  requestType: TransportRequestType;

  @Column()
  destination: string;

  @Column('timestamp', { nullable: true })
  appointmentTime?: Date;

  @Column('uuid')
  requestedBy: string;

  @Column()
  requestedByName: string;

  @Column('simple-array')
  specialRequirements: string[];

  @Column({ default: false })
  wheelchairRequired: boolean;

  @Column({ default: false })
  escortRequired: boolean;

  @Column({
    type: 'enum',
    enum: TransportRequestStatus,
    default: TransportRequestStatus.PENDING
  })
  status: TransportRequestStatus;

  @Column({
    type: 'enum',
    enum: TransportPriority,
    default: TransportPriority.MEDIUM
  })
  priority: TransportPriority;

  @Column('integer')
  estimatedDuration: number; // minutes

  @Column('decimal', { precision: 8, scale: 2 })
  estimatedDistance: number; // miles

  @Column('uuid', { nullable: true })
  assignedVehicleId?: string;

  @Column('uuid', { nullable: true })
  assignedDriverId?: string;

  @Column('timestamp', { nullable: true })
  scheduledPickupTime?: Date;

  @Column('timestamp', { nullable: true })
  actualPickupTime?: Date;

  @Column('timestamp', { nullable: true })
  actualArrivalTime?: Date;

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column('uuid', { nullable: true })
  cancelledBy?: string;

  @Column('timestamp', { nullable: true })
  cancelledAt?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualCost?: number;

  @Column('integer', { nullable: true })
  actualDuration?: number; // minutes

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  actualDistance?: number; // miles

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  customerSatisfactionRating?: number; // 1-5 scale

  @Column('text', { nullable: true })
  customerFeedback?: string;

  @Column('jsonb', { nullable: true })
  incidents?: {
    incidentType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportedBy: string;
    reportedAt: Date;
    actionTaken: string;
  }[];

  @Column('boolean', { default: false })
  requiresFollowUp: boolean;

  @Column('text', { nullable: true })
  followUpNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isPending(): boolean {
    return this.status === TransportRequestStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === TransportRequestStatus.APPROVED;
  }

  isScheduled(): boolean {
    return this.status === TransportRequestStatus.SCHEDULED;
  }

  isInProgress(): boolean {
    return this.status === TransportRequestStatus.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.status === TransportRequestStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === TransportRequestStatus.CANCELLED;
  }

  isEmergency(): boolean {
    return this.priority === TransportPriority.EMERGENCY || 
           this.requestType === TransportRequestType.EMERGENCY;
  }

  isOverdue(): boolean {
    if (this.isCompleted() || this.isCancelled()) return false;
    if (!this.appointmentTime) return false;
    return new Date() > this.appointmentTime;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this.appointmentTime!.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPriorityScore(): number {
    const priorityScores = {
      emergency: 5,
      high: 4,
      medium: 3,
      low: 2
    };
    
    let score = priorityScores[this.priority] || 2;
    
    // Increase score for overdue requests
    if (this.isOverdue()) {
      score += Math.min(2, this.getDaysOverdue() / 7); // Max +2 for being overdue
    }
    
    // Increase score for emergency requests
    if (this.isEmergency()) {
      score += 2;
    }
    
    return Math.min(10, score); // Cap at 10
  }

  canBeApproved(): boolean {
    return this.isPending();
  }

  canBeScheduled(): boolean {
    return this.isApproved() || this.isPending();
  }

  canBeCancelled(): boolean {
    return !this.isCompleted() && !this.isCancelled();
  }

  getEstimatedArrivalTime(): Date | null {
    if (!this.scheduledPickupTime) return null;
    return new Date(this.scheduledPickupTime.getTime() + this.estimatedDuration * 60 * 1000);
  }

  getActualArrivalTime(): Date | null {
    return this.actualArrivalTime || null;
  }

  getDuration(): number {
    if (this.actualDuration) return this.actualDuration;
    return this.estimatedDuration;
  }

  getDistance(): number {
    if (this.actualDistance) return this.actualDistance;
    return this.estimatedDistance;
  }

  getCost(): number {
    return this.actualCost || 0;
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
    return this.isEmergency() || 
           this.isOverdue() || 
           this.getHighSeverityIncidents().length > 0 ||
           this.requiresFollowUp;
  }

  addIncident(incident: any): void {
    if (!this.incidents) {
      this.incidents = [];
    }
    this.incidents.push({
      ...incident,
      reportedAt: new Date()
    });
  }

  getRequestSummary(): string {
    const duration = this.getDuration();
    const distance = this.getDistance();
    const status = this.status.toUpperCase();
    
    return `TR ${this.requestNumber}: ${duration}min, ${distance}mi, ${status}`;
  }

  getTimeUntilAppointment(): number | null {
    if (!this.appointmentTime) return null;
    const now = new Date();
    const diffTime = this.appointmentTime.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
  }

  isUrgent(): boolean {
    const timeUntilAppointment = this.getTimeUntilAppointment();
    return this.isEmergency() || 
           (timeUntilAppointment !== null && timeUntilAppointment <= 1) ||
           this.priority === TransportPriority.HIGH;
  }
}