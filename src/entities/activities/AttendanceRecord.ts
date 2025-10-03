import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Activity } from './Activity';
import { TherapySession } from './TherapySession';
import { Resident } from '../resident/Resident';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEFT_EARLY = 'left_early',
  PARTIAL = 'partial',
  EXCUSED = 'excused',
  NO_SHOW = 'no_show'
}

export enum ParticipationLevel {
  FULL = 'full',
  PARTIAL = 'partial',
  OBSERVER = 'observer',
  DECLINED = 'declined',
  ASSISTED = 'assisted'
}

export interface AttendanceNotes {
  arrivalTime?: Date;
  departureTime?: Date;
  participationQuality: number; // 1-5 scale
  engagementLevel: number; // 1-5 scale
  behaviorObservations: string;
  specialAccommodations: string[];
  staffAssistance: string[];
  residentFeedback?: string;
  familyFeedback?: string;
  concernsRaised: string[];
  achievements: string[];
  notes: string;
  recordedBy: string;
  recordedAt: Date;
}

export interface AttendanceMetrics {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  averageParticipationQuality: number;
  averageEngagementLevel: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  preferredActivities: string[];
  challengingActivities: string[];
}

@Entity('attendance_records')
export class AttendanceRecord extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column('uuid', { nullable: true })
  activityId?: string;

  @ManyToOne(() => Activity, { nullable: true })
  @JoinColumn({ name: 'activityId' })
  activity?: Activity;

  @Column('uuid', { nullable: true })
  therapySessionId?: string;

  @ManyToOne(() => TherapySession, { nullable: true })
  @JoinColumn({ name: 'therapySessionId' })
  therapySession?: TherapySession;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT
  })
  status: AttendanceStatus;

  @Column({
    type: 'enum',
    enum: ParticipationLevel,
    default: ParticipationLevel.FULL
  })
  participationLevel: ParticipationLevel;

  @Column('timestamp')
  scheduledStartTime: Date;

  @Column('timestamp')
  scheduledEndTime: Date;

  @Column('timestamp', { nullable: true })
  actualArrivalTime?: Date;

  @Column('timestamp', { nullable: true })
  actualDepartureTime?: Date;

  @Column('integer')
  plannedDuration: number; // minutes

  @Column('integer', { nullable: true })
  actualDuration?: number; // minutes

  @Column('jsonb')
  notes: AttendanceNotes;

  @Column('text', { nullable: true })
  absenceReason?: string;

  @Column('text', { nullable: true })
  lateReason?: string;

  @Column('text', { nullable: true })
  earlyDepartureReason?: string;

  @Column('boolean', { default: false })
  requiresFollowUp: boolean;

  @Column('text', { nullable: true })
  followUpNotes?: string;

  @Column('timestamp', { nullable: true })
  followUpDate?: Date;

  @Column('boolean', { default: false })
  familyNotified: boolean;

  @Column('timestamp', { nullable: true })
  familyNotifiedAt?: Date;

  @Column('text', { nullable: true })
  familyNotificationNotes?: string;

  @Column('jsonb', { nullable: true })
  specialAccommodations?: {
    accommodationType: string;
    description: string;
    provided: boolean;
    effectiveness: number; // 1-5 scale
    notes?: string;
  }[];

  @Column('jsonb', { nullable: true })
  behavioralObservations?: {
    behaviorType: string;
    description: string;
    severity: 'mild' | 'moderate' | 'severe';
    duration: number; // minutes
    intervention: string;
    outcome: string;
    recordedBy: string;
    recordedAt: Date;
  }[];

  @Column('jsonb', { nullable: true })
  healthObservations?: {
    observationType: string;
    description: string;
    severity: 'normal' | 'concerning' | 'urgent';
    actionTaken: string;
    followUpRequired: boolean;
    recordedBy: string;
    recordedAt: Date;
  }[];

  @Column('jsonb', { nullable: true })
  therapeuticOutcomes?: {
    goalId: string;
    goalDescription: string;
    progressMade: number; // 0-100
    observations: string;
    nextSteps: string;
    recordedBy: string;
    recordedAt: Date;
  }[];

  @Column('boolean', { default: false })
  isExcused: boolean;

  @Column('text', { nullable: true })
  excusedBy?: string;

  @Column('timestamp', { nullable: true })
  excusedAt?: Date;

  @Column('text', { nullable: true })
  excusedReason?: string;

  @Column('boolean', { default: false })
  isRescheduled: boolean;

  @Column('timestamp', { nullable: true })
  rescheduledTo?: Date;

  @Column('text', { nullable: true })
  rescheduleReason?: string;

  @Column('jsonb', { nullable: true })
  equipmentUsed?: {
    equipmentName: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    effectiveness: number; // 1-5 scale
    notes?: string;
  }[];

  @Column('jsonb', { nullable: true })
  safetyIncidents?: {
    incidentType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionTaken: string;
    reportedTo: string[];
    reportedAt: Date;
    resolved: boolean;
    resolutionNotes?: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isPresent(): boolean {
    return this.status === AttendanceStatus.PRESENT;
  }

  isAbsent(): boolean {
    return this.status === AttendanceStatus.ABSENT;
  }

  isLate(): boolean {
    return this.status === AttendanceStatus.LATE;
  }

  isExcusedAbsence(): boolean {
    return this.status === AttendanceStatus.EXCUSED;
  }

  isNoShow(): boolean {
    return this.status === AttendanceStatus.NO_SHOW;
  }

  getActualDuration(): number {
    if (this.actualArrivalTime && this.actualDepartureTime) {
      return Math.floor((this.actualDepartureTime.getTime() - this.actualArrivalTime.getTime()) / (1000 * 60));
    }
    return this.actualDuration || this.plannedDuration;
  }

  getLatenessMinutes(): number {
    if (!this.actualArrivalTime || !this.isLate()) return 0;
    return Math.floor((this.actualArrivalTime.getTime() - this.scheduledStartTime.getTime()) / (1000 * 60));
  }

  getEarlyDepartureMinutes(): number {
    if (!this.actualDepartureTime || this.status !== AttendanceStatus.LEFT_EARLY) return 0;
    return Math.floor((this.scheduledEndTime.getTime() - this.actualDepartureTime.getTime()) / (1000 * 60));
  }

  getParticipationScore(): number {
    return this.notes.participationQuality;
  }

  getEngagementScore(): number {
    return this.notes.engagementLevel;
  }

  getOverallScore(): number {
    return (this.getParticipationScore() + this.getEngagementScore()) / 2;
  }

  hasBehavioralConcerns(): boolean {
    return this.behavioralObservations && this.behavioralObservations.length > 0;
  }

  hasHealthConcerns(): boolean {
    return this.healthObservations && this.healthObservations.some(obs => obs.severity !== 'normal');
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

  requiresImmediateFollowUp(): boolean {
    return this.requiresFollowUp || 
           this.hasHighSeverityIncidents() || 
           this.hasHealthConcerns() ||
           this.behavioralObservations?.some(obs => obs.severity === 'severe');
  }

  hasHighSeverityIncidents(): boolean {
    return this.getHighSeverityIncidents().length > 0;
  }

  getTherapeuticProgress(): number {
    if (!this.therapeuticOutcomes || this.therapeuticOutcomes.length === 0) return 0;
    
    const totalProgress = this.therapeuticOutcomes.reduce((sum, outcome) => sum + outcome.progressMade, 0);
    return totalProgress / this.therapeuticOutcomes.length;
  }

  getAccommodationEffectiveness(): number {
    if (!this.specialAccommodations || this.specialAccommodations.length === 0) return 0;
    
    const totalEffectiveness = this.specialAccommodations.reduce((sum, acc) => sum + acc.effectiveness, 0);
    return totalEffectiveness / this.specialAccommodations.length;
  }

  getEquipmentEffectiveness(): number {
    if (!this.equipmentUsed || this.equipmentUsed.length === 0) return 0;
    
    const totalEffectiveness = this.equipmentUsed.reduce((sum, eq) => sum + eq.effectiveness, 0);
    return totalEffectiveness / this.equipmentUsed.length;
  }

  isFullyParticipated(): boolean {
    return this.participationLevel === ParticipationLevel.FULL;
  }

  isPartiallyParticipated(): boolean {
    return this.participationLevel === ParticipationLevel.PARTIAL;
  }

  isAssistedParticipation(): boolean {
    return this.participationLevel === ParticipationLevel.ASSISTED;
  }

  isObserverOnly(): boolean {
    return this.participationLevel === ParticipationLevel.OBSERVER;
  }

  declinedParticipation(): boolean {
    return this.participationLevel === ParticipationLevel.DECLINED;
  }

  getAttendanceSummary(): string {
    const duration = this.getActualDuration();
    const score = this.getOverallScore();
    const status = this.status;
    
    return `${status.toUpperCase()}: ${duration}min, Score: ${score.toFixed(1)}/5`;
  }

  addBehavioralObservation(observation: any): void {
    if (!this.behavioralObservations) {
      this.behavioralObservations = [];
    }
    this.behavioralObservations.push({
      ...observation,
      recordedAt: new Date()
    });
  }

  addHealthObservation(observation: any): void {
    if (!this.healthObservations) {
      this.healthObservations = [];
    }
    this.healthObservations.push({
      ...observation,
      recordedAt: new Date()
    });
  }

  addTherapeuticOutcome(outcome: any): void {
    if (!this.therapeuticOutcomes) {
      this.therapeuticOutcomes = [];
    }
    this.therapeuticOutcomes.push({
      ...outcome,
      recordedAt: new Date()
    });
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

  addSpecialAccommodation(accommodation: any): void {
    if (!this.specialAccommodations) {
      this.specialAccommodations = [];
    }
    this.specialAccommodations.push(accommodation);
  }

  addEquipmentUsed(equipment: any): void {
    if (!this.equipmentUsed) {
      this.equipmentUsed = [];
    }
    this.equipmentUsed.push(equipment);
  }

  markAsExcused(excusedBy: string, reason: string): void {
    this.isExcused = true;
    this.excusedBy = excusedBy;
    this.excusedAt = new Date();
    this.excusedReason = reason;
    this.status = AttendanceStatus.EXCUSED;
  }

  markAsRescheduled(newDate: Date, reason: string): void {
    this.isRescheduled = true;
    this.rescheduledTo = newDate;
    this.rescheduleReason = reason;
  }

  notifyFamily(notes?: string): void {
    this.familyNotified = true;
    this.familyNotifiedAt = new Date();
    this.familyNotificationNotes = notes;
  }

  scheduleFollowUp(followUpDate: Date, notes: string): void {
    this.requiresFollowUp = true;
    this.followUpDate = followUpDate;
    this.followUpNotes = notes;
  }

  isOverdue(): boolean {
    if (this.isPresent() || this.isExcusedAbsence()) return false;
    
    const now = new Date();
    return now > this.scheduledStartTime;
  }

  getDaysUntilRescheduled(): number | null {
    if (!this.rescheduledTo) return null;
    
    const now = new Date();
    const diffTime = this.rescheduledTo.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilFollowUp(): number | null {
    if (!this.followUpDate) return null;
    
    const now = new Date();
    const diffTime = this.followUpDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isFollowUpOverdue(): boolean {
    if (!this.followUpDate) return false;
    
    const now = new Date();
    return now > this.followUpDate;
  }

  getAttendanceQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const score = this.getOverallScore();
    
    if (score >= 4.5) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 2.5) return 'fair';
    return 'poor';
  }

  getParticipationQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const score = this.getParticipationScore();
    
    if (score >= 4.5) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 2.5) return 'fair';
    return 'poor';
  }

  getEngagementQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const score = this.getEngagementScore();
    
    if (score >= 4.5) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 2.5) return 'fair';
    return 'poor';
  }
}