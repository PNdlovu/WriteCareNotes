/**
 * @fileoverview Visit Request Entity
 * @module VisitRequest
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity representing visit requests from family members
 * 
 * @compliance
 * - CQC Regulation 10 - Dignity and respect
 * - GDPR and Data Protection Act 2018
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FamilyMember } from './FamilyMember';
import { Resident } from '../resident/Resident';

export enum VisitType {
  IN_PERSON = 'in_person',
  VIDEO_CALL = 'video_call',
  PHONE_CALL = 'phone_call',
  WINDOW_VISIT = 'window_visit',
  OUTDOOR_VISIT = 'outdoor_visit',
}

export enum VisitStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

export enum VisitPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface VisitParticipant {
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  age?: number;
  isVaccinated?: boolean;
  healthStatus?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface VisitRequirements {
  specialNeeds?: string[];
  accessibility?: string[];
  equipment?: string[];
  duration?: number; // minutes
  maxParticipants?: number;
  ageRestrictions?: {
    minAge?: number;
    maxAge?: number;
  };
  healthRequirements?: string[];
  documentation?: string[];
}

export interface VisitLocation {
  type: 'room' | 'common_area' | 'garden' | 'outdoor' | 'virtual';
  name: string;
  address?: string;
  roomNumber?: string;
  capacity?: number;
  accessibility?: string[];
  equipment?: string[];
  notes?: string;
}

@Entity('visit_requests')
@Index(['familyId', 'residentId', 'requestedAt'])
@Index(['status', 'scheduledTime'])
@Index(['type', 'scheduledTime'])
export class VisitRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => FamilyMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  familyMember!: FamilyMember;

  @Column({ type: 'uuid' })
  residentId!: string;

  @ManyToOne(() => Resident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident!: Resident;

  @Column({ type: 'enum', enum: VisitType })
  type!: VisitType;

  @Column({ type: 'enum', enum: VisitStatus, default: VisitStatus.PENDING })
  status!: VisitStatus;

  @Column({ type: 'enum', enum: VisitPriority, default: VisitPriority.NORMAL })
  priority!: VisitPriority;

  @Column({ type: 'var char', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  requestedAt!: Date;

  @Column({ type: 'timestamp' })
  scheduledTime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ type: 'integer', default: 60 })
  duration!: number; // minutes

  @Column({ type: 'jsonb' })
  participants!: VisitParticipant[];

  @Column({ type: 'jsonb', nullable: true })
  requirements?: VisitRequirements;

  @Column({ type: 'jsonb' })
  location!: VisitLocation;

  @Column({ type: 'var char', length: 500, nullable: true })
  reason?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  specialRequirements?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  requestedBy?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  deniedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  deniedAt?: Date;

  @Column({ type: 'var char', length: 500, nullable: true })
  denialReason?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  confirmedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  cancelledBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'var char', length: 500, nullable: true })
  cancellationReason?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  rescheduledBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  rescheduledAt?: Date;

  @Column({ type: 'var char', length: 500, nullable: true })
  rescheduleReason?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  completedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  noShowBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  noShowAt?: Date;

  @Column({ type: 'var char', length: 500, nullable: true })
  noShowReason?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  staffMember?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  staffRole?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  department?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  shift?: string;

  @Column({ type: 'text', nullable: true })
  staffNotes?: string;

  @Column({ type: 'text', nullable: true })
  familyNotes?: string;

  @Column({ type: 'text', nullable: true })
  residentNotes?: string;

  @Column({ type: 'jsonb', nullable: true })
  checkIn?: {
    time: Date;
    staffMember: string;
    participants: string[];
    healthCheck: boolean;
    temperature?: number;
    symptoms?: string[];
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  checkOut?: {
    time: Date;
    staffMember: string;
    participants: string[];
    duration: number;
    notes?: string;
    followUpRequired?: boolean;
    followUpNotes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  feedback?: {
    familyRating?: number; // 1-5
    familyComments?: string;
    staffRating?: number; // 1-5
    staffComments?: string;
    residentRating?: number; // 1-5
    residentComments?: string;
    overallExperience?: string;
    suggestions?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
    description?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    weather?: string;
    specialEvents?: string[];
    healthAlerts?: string[];
    restrictions?: string[];
    guidelines?: string[];
    reminders?: string[];
    equipment?: string[];
    supplies?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  auditTrail?: Array<{
    action: string;
    timestamp: Date;
    performedBy: string;
    details?: string;
    oldValue?: any;
    newValue?: any;
  }>;

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ type: 'var char', length: 50, nullable: true })
  recurrencePattern?: string; // daily, weekly, monthly, custom

  @Column({ type: 'jsonb', nullable: true })
  recurrenceDetails?: {
    frequency: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
    maxOccurrences?: number;
  };

  @Column({ type: 'uuid', nullable: true })
  parentRequestId?: string;

  @Column({ type: 'boolean', default: false })
  isEmergency!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresApproval!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresHealthCheck!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresDocumentation!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  archivedBy?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  archiveReason?: string;

  @Column({ type: 'var char', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  userAgent?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  deviceId?: string;

  @Column({ type: 'var char', length: 10, nullable: true })
  language?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  timezone?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Methods
  isUpcoming(): boolean {
    return this.scheduledTime > new Date() && 
           (this.status === VisitStatus.APPROVED || this.status === VisitStatus.CONFIRMED);
  }

  isPast(): boolean {
    return this.scheduledTime < new Date() || 
           this.status === VisitStatus.COMPLETED;
  }

  isToday(): boolean {
    const today = new Date();
    const scheduledDate = new Date(this.scheduledTime);
    return scheduledDate.toDateString() === today.toDateString();
  }

  isTomorrow(): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledDate = new Date(this.scheduledTime);
    return scheduledDate.toDateString() === tomorrow.toDateString();
  }

  isThisWeek(): boolean {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return this.scheduledTime >= weekStart && this.scheduledTime <= weekEnd;
  }

  isHighPriority(): boolean {
    return this.priority === VisitPriority.HIGH || this.priority === VisitPriority.URGENT;
  }

  isUrgent(): boolean {
    return this.priority === VisitPriority.URGENT || this.isEmergency;
  }

  isVirtual(): boolean {
    return this.type === VisitType.VIDEO_CALL || this.type === VisitType.PHONE_CALL;
  }

  isInPerson(): boolean {
    return this.type === VisitType.IN_PERSON || 
           this.type === VisitType.WINDOW_VISIT || 
           this.type === VisitType.OUTDOOR_VISIT;
  }

  canBeCancelled(): boolean {
    return this.status === VisitStatus.PENDING || 
           this.status === VisitStatus.APPROVED || 
           this.status === VisitStatus.CONFIRMED;
  }

  canBeRescheduled(): boolean {
    return this.status === VisitStatus.PENDING || 
           this.status === VisitStatus.APPROVED || 
           this.status === VisitStatus.CONFIRMED;
  }

  canBeApproved(): boolean {
    return this.status === VisitStatus.PENDING;
  }

  canBeDenied(): boolean {
    return this.status === VisitStatus.PENDING;
  }

  canBeConfirmed(): boolean {
    return this.status === VisitStatus.APPROVED;
  }

  canBeCompleted(): boolean {
    return this.status === VisitStatus.IN_PROGRESS;
  }

  getDurationInMinutes(): number {
    if (this.endTime) {
      const start = new Date(this.scheduledTime);
      const end = new Date(this.endTime);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }
    return this.duration;
  }

  getParticipantCount(): number {
    return this.participants ? this.participants.length : 0;
  }

  getMaxParticipants(): number {
    return this.requirements?.maxParticipants || this.location.capacity || 10;
  }

  isWithinCapacity(): boolean {
    return this.getParticipantCount() <= this.getMaxParticipants();
  }

  getTimeUntilVisit(): number {
    const now = new Date();
    const scheduled = new Date(this.scheduledTime);
    return Math.round((scheduled.getTime() - now.getTime()) / (1000 * 60)); // minutes
  }

  getTimeUntilVisitHours(): number {
    return Math.round(this.getTimeUntilVisit() / 60);
  }

  isOverdue(): boolean {
    return this.scheduledTime < new Date() && 
           (this.status === VisitStatus.PENDING || this.status === VisitStatus.APPROVED);
  }

  approve(approvedBy: string, notes?: string): void {
    this.status = VisitStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.staffNotes = notes;
    
    this.addAuditTrail('APPROVED', approvedBy, notes);
  }

  deny(deniedBy: string, reason: string): void {
    this.status = VisitStatus.DENIED;
    this.deniedBy = deniedBy;
    this.deniedAt = new Date();
    this.denialReason = reason;
    
    this.addAuditTrail('DENIED', deniedBy, reason);
  }

  confirm(confirmedBy: string, notes?: string): void {
    this.status = VisitStatus.CONFIRMED;
    this.confirmedBy = confirmedBy;
    this.confirmedAt = new Date();
    this.staffNotes = notes;
    
    this.addAuditTrail('CONFIRMED', confirmedBy, notes);
  }

  cancel(cancelledBy: string, reason: string): void {
    this.status = VisitStatus.CANCELLED;
    this.cancelledBy = cancelledBy;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    
    this.addAuditTrail('CANCELLED', cancelledBy, reason);
  }

  reschedule(newTime: Date, rescheduledBy: string, reason: string): void {
    const oldTime = this.scheduledTime;
    this.scheduledTime = newTime;
    this.rescheduledBy = rescheduledBy;
    this.rescheduledAt = new Date();
    this.rescheduleReason = reason;
    
    this.addAuditTrail('RESCHEDULED', rescheduledBy, `From ${oldTime} to ${newTime}: ${reason}`);
  }

  start(staffMember: string): void {
    this.status = VisitStatus.IN_PROGRESS;
    this.staffMember = staffMember;
    
    this.addAuditTrail('STARTED', staffMember);
  }

  complete(completedBy: string, notes?: string): void {
    this.status = VisitStatus.COMPLETED;
    this.completedBy = completedBy;
    this.completedAt = new Date();
    this.staffNotes = notes;
    
    this.addAuditTrail('COMPLETED', completedBy, notes);
  }

  markNoShow(noShowBy: string, reason?: string): void {
    this.status = VisitStatus.NO_SHOW;
    this.noShowBy = noShowBy;
    this.noShowAt = new Date();
    this.noShowReason = reason;
    
    this.addAuditTrail('NO_SHOW', noShowBy, reason);
  }

  archive(archivedBy: string, reason?: string): void {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;
    this.archiveReason = reason;
    
    this.addAuditTrail('ARCHIVED', archivedBy, reason);
  }

  private addAuditTrail(action: string, performedBy: string, details?: string): void {
    this.auditTrail = this.auditTrail || [];
    this.auditTrail.push({
      action,
      timestamp: new Date(),
      performedBy,
      details,
    });
  }

  getDisplayStatus(): string {
    if (this.isArchived) return 'Archived';
    return this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }

  getDisplayType(): string {
    return this.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getDisplayPriority(): string {
    return this.priority.charAt(0).toUpperCase() + this.priority.slice(1).toLowerCase();
  }

  getSummary(): any {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      priority: this.priority,
      scheduledTime: this.scheduledTime,
      duration: this.duration,
      participantCount: this.getParticipantCount(),
      isUpcoming: this.isUpcoming(),
      isPast: this.isPast(),
      isToday: this.isToday(),
      isTomorrow: this.isTomorrow(),
      isThisWeek: this.isThisWeek(),
      isHighPriority: this.isHighPriority(),
      isUrgent: this.isUrgent(),
      isVirtual: this.isVirtual(),
      isInPerson: this.isInPerson(),
      canBeCancelled: this.canBeCancelled(),
      canBeRescheduled: this.canBeRescheduled(),
      timeUntilVisit: this.getTimeUntilVisit(),
      timeUntilVisitHours: this.getTimeUntilVisitHours(),
      isOverdue: this.isOverdue(),
      isRecurring: this.isRecurring,
      isEmergency: this.isEmergency,
      requiresApproval: this.requiresApproval,
      requiresHealthCheck: this.requiresHealthCheck,
      requiresDocumentation: this.requiresDocumentation,
    };
  }

  toJSON(): any {
    return this;
  }
}
