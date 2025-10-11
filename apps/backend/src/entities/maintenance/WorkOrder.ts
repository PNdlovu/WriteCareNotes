import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Asset } from './Asset';

export enum WorkOrderStatus {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export interface WorkOrderPart {
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  orderDate?: Date;
  receivedDate?: Date;
}

export interface WorkOrderLabor {
  technicianId: string;
  technicianName: string;
  skillLevel: 'junior' | 'senior' | 'specialist' | 'supervisor';
  hoursWorked: number;
  hourlyRate: number;
  totalCost: number;
  startTime?: Date;
  endTime?: Date;
}

export interface WorkOrderDocument {
  documentType: 'photo' | 'report' | 'certificate' | 'invoice' | 'manual';
  fileName: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

@Entity('work_orders')
export class WorkOrder extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  workOrderNumber: string;

  @Column('uuid')
  assetId: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ['preventive', 'corrective', 'predictive', 'emergency', 'inspection']
  })
  maintenanceType: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical', 'emergency']
  })
  priority: string;

  @Column('uuid')
  assignedTo: string;

  @Column()
  assignedToName: string;

  @Column('uuid')
  requestedBy: string;

  @Column()
  requestedByName: string;

  @Column('timestamp')
  scheduledDate: Date;

  @Column('integer')
  estimatedDuration: number; // hours

  @Column('decimal', { precision: 10, scale: 2 })
  estimatedCost: number;

  @Column('timestamp', { nullable: true })
  actualStartDate?: Date;

  @Column('timestamp', { nullable: true })
  actualEndDate?: Date;

  @Column('integer', { nullable: true })
  actualDuration?: number; // hours

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualCost?: number;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.CREATED
  })
  status: WorkOrderStatus;

  @Column('jsonb')
  partsRequired: WorkOrderPart[];

  @Column('jsonb')
  laborRecords: WorkOrderLabor[];

  @Column('simple-array')
  skillsRequired: string[];

  @Column('simple-array')
  safetyRequirements: string[];

  @Column('text', { nullable: true })
  completionNotes?: string;

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column('jsonb', { nullable: true })
  documents: WorkOrderDocument[];

  @Column('boolean', { default: false })
  requiresApproval: boolean;

  @Column('uuid', { nullable: true })
  approvedBy?: string;

  @Column('timestamp', { nullable: true })
  approvedAt?: Date;

  @Column('text', { nullable: true })
  approvalNotes?: string;

  @Column('boolean', { default: false })
  isEmergency: boolean;

  @Column('text', { nullable: true })
  emergencyContact?: string;

  @Column('jsonb', { nullable: true })
  qualityChecks: {
    checkType: string;
    performedBy: string;
    performedAt: Date;
    result: 'pass' | 'fail' | 'conditional';
    notes?: string;
  }[];

  @Column('jsonb', { nullable: true })
  safetyIncidents: {
    incidentType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportedBy: string;
    reportedAt: Date;
    actionTaken: string;
    followUpRequired: boolean;
  }[];

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  customerSatisfactionRating?: number; // 1-5 scale

  @Column('text', { nullable: true })
  customerFeedback?: string;

  @Column('boolean', { default: false })
  requiresFollowUp: boolean;

  @Column('timestamp', { nullable: true })
  followUpDate?: Date;

  @Column('text', { nullable: true })
  followUpNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isCreated(): boolean {
    return this.status === WorkOrderStatus.CREATED;
  }

  isAssigned(): boolean {
    return this.status === WorkOrderStatus.ASSIGNED;
  }

  isInProgress(): boolean {
    return this.status === WorkOrderStatus.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.status === WorkOrderStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === WorkOrderStatus.CANCELLED;
  }

  isOnHold(): boolean {
    return this.status === WorkOrderStatus.ON_HOLD;
  }

  isOverdue(): boolean {
    if (this.isCompleted() || this.isCancelled()) return false;
    return new Date() > this.scheduledDate;
  }

  getDuration(): number {
    if (this.actualStartDate && this.actualEndDate) {
      return Math.floor((this.actualEndDate.getTime() - this.actualStartDate.getTime()) / (1000 * 60 * 60));
    }
    return this.estimatedDuration;
  }

  getTotalPartsCost(): number {
    return this.partsRequired.reduce((total, part) => total + part.totalCost, 0);
  }

  getTotalLaborCost(): number {
    return this.laborRecords.reduce((total, labor) => total + labor.totalCost, 0);
  }

  getTotalCost(): number {
    return this.getTotalPartsCost() + this.getTotalLaborCost();
  }

  getCostVariance(): number {
    if (!this.actualCost) return 0;
    return this.actualCost - this.estimatedCost;
  }

  getCostVariancePercentage(): number {
    if (this.estimatedCost === 0) return 0;
    return (this.getCostVariance() / this.estimatedCost) * 100;
  }

  getEfficiency(): number {
    if (this.estimatedDuration === 0) return 0;
    return (this.estimatedDuration / this.getDuration()) * 100;
  }

  hasSafetyIncidents(): boolean {
    return this.safetyIncidents && this.safetyIncidents.length > 0;
  }

  getHighSeverityIncidents(): any[] {
    if (!this.safetyIncidents) return [];
    return this.safetyIncidents.filter(incident => 
      incident.severity === 'high' || incident.severity === 'critical'
    );
  }

  requiresImmediateAttention(): boolean {
    return this.isEmergency || 
           this.isOverdue() || 
           this.getHighSeverityIncidents().length > 0 ||
           this.requiresFollowUp;
  }

  canBeStarted(): boolean {
    return this.isAssigned() && !this.isInProgress() && !this.isCompleted() && !this.isCancelled();
  }

  canBeCompleted(): boolean {
    return this.isInProgress() && !this.isCompleted();
  }

  canBeCancelled(): boolean {
    return !this.isCompleted() && !this.isCancelled();
  }

  getProgressPercentage(): number {
    if (this.isCompleted()) return 100;
    if (this.isCancelled()) return 0;
    if (!this.actualStartDate) return 0;
    
    const totalDuration = this.getDuration();
    if (totalDuration === 0) return 0;
    
    const elapsed = this.actualStartDate ? 
      Math.floor((new Date().getTime() - this.actualStartDate.getTime()) / (1000 * 60 * 60)) : 0;
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }

  addLaborRecord(labor: WorkOrderLabor): void {
    this.laborRecords.push(labor);
  }

  addPart(part: WorkOrderPart): void {
    this.partsRequired.push(part);
  }

  addDocument(document: WorkOrderDocument): void {
    if (!this.documents) {
      this.documents = [];
    }
    this.documents.push(document);
  }

  recordSafetyIncident(incident: any): void {
    if (!this.safetyIncidents) {
      this.safetyIncidents = [];
    }
    this.safetyIncidents.push({
      ...incident,
      reportedAt: new Date()
    });
  }

  addQualityCheck(check: any): void {
    if (!this.qualityChecks) {
      this.qualityChecks = [];
    }
    this.qualityChecks.push({
      ...check,
      performedAt: new Date()
    });
  }

  getWorkOrderSummary(): string {
    const duration = this.getDuration();
    const cost = this.getTotalCost();
    const status = this.status.toUpperCase();
    
    return `WO ${this.workOrderNumber}: ${duration}h, £${cost.toFixed(2)}, ${status}`;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this.scheduledDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPriorityScore(): number {
    const priorityScores = {
      emergency: 5,
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };
    
    let score = priorityScores[this.priority] || 1;
    
    // Increase score for overdue work orders
    if (this.isOverdue()) {
      score += Math.min(2, this.getDaysOverdue() / 7); // Max +2 for being overdue
    }
    
    // Increase score for emergency work orders
    if (this.isEmergency) {
      score += 2;
    }
    
    return Math.min(10, score); // Cap at 10
  }
}
