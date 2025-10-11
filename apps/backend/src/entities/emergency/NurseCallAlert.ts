import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Nurse Call Alert Entity
 * @module NurseCallAlert
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Enterprise nurse call system entity with priority routing,
 * escalation management, and comprehensive response tracking.
 * 
 * @compliance
 * - Health and Safety at Work Act 1974
 * - CQC Regulation 12 - Safe care and treatment
 * - BS 8300 - Design of accessible buildings
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum CallType {
  ASSISTANCE_REQUEST = 'assistance_request',
  MEDICAL_EMERGENCY = 'medical_emergency',
  BATHROOM_ASSISTANCE = 'bathroom_assistance',
  MEDICATION_REQUEST = 'medication_request',
  PAIN_MANAGEMENT = 'pain_management',
  COMFORT_ASSISTANCE = 'comfort_assistance',
  MOBILITY_ASSISTANCE = 'mobility_assistance',
  EMOTIONAL_SUPPORT = 'emotional_support',
  TECHNICAL_ISSUE = 'technical_issue',
  SAFETY_CONCERN = 'safety_concern',
  FALL_ALERT = 'fall_alert',
  WANDERING_ALERT = 'wandering_alert',
  MEDICATION_OVERDUE = 'medication_overdue',
  VITAL_SIGNS_ALERT = 'vital_signs_alert',
  BEHAVIORAL_CONCERN = 'behavioral_concern'
}

export enum CallPriority {
  ROUTINE = 'routine',
  STANDARD = 'standard',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export enum CallStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled'
}

export enum CallSource {
  CALL_BUTTON = 'call_button',
  MOBILE_APP = 'mobile_app',
  VOICE_COMMAND = 'voice_command',
  WEARABLE_DEVICE = 'wearable_device',
  SENSOR_AUTOMATIC = 'sensor_automatic',
  FAMILY_REQUEST = 'family_request',
  STAFF_INITIATED = 'staff_initiated',
  AI_DETECTION = 'ai_detection'
}

export interface EscalationHistory {
  escalatedAt: Date;
  escalatedBy: string;
  reason: string;
  previousLevel: number;
  notificationsSent: string[];
}

export interface ResponseNote {
  note: string;
  addedBy: string;
  addedByName: string;
  addedAt: Date;
  noteType: 'response' | 'resolution' | 'escalation' | 'follow_up';
}

export interface CallMetrics {
  responseTime?: number; // milliseconds
  resolutionTime?: number; // milliseconds
  escalationCount: number;
  staffInvolved: string[];
  resourcesUsed: string[];
  residentSatisfaction?: number; // 1-5 rating
}

@Entity('nurse_call_alerts')
@Index(['residentId', 'callType'])
@Index(['priority', 'status'])
@Index(['triggeredAt'])
@Index(['tenantId', 'organizationId'])
@Index(['location'])
export class NurseCallAlert extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  callReference: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident, { eager: true })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({ enum: CallType })
  callType: CallType;

  @Column({ enum: CallPriority })
  priority: CallPriority;

  @Column({ enum: CallStatus, default: CallStatus.ACTIVE })
  status: CallStatus;

  @Column({ enum: CallSource })
  source: CallSource;

  @Column()
  location: string; // Room number, area, or coordinates

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true })
  deviceId?: string; // Call button, sensor, or device identifier

  @Column('timestamp')
  triggeredAt: Date;

  @Column()
  triggeredBy: string; // Staff ID, resident, or system

  @Column('bigint', { nullable: true })
  responseTime?: number; // Time to acknowledge in milliseconds

  @Column('uuid', { nullable: true })
  acknowledgedBy?: string;

  @Column({ nullable: true })
  acknowledgedByName?: string;

  @Column('timestamp', { nullable: true })
  acknowledgedAt?: Date;

  @Column('uuid', { nullable: true })
  respondingStaff?: string;

  @Column({ nullable: true })
  respondingStaffName?: string;

  @Column('timestamp', { nullable: true })
  responseStarted?: Date;

  @Column('uuid', { nullable: true })
  resolvedBy?: string;

  @Column({ nullable: true })
  resolvedByName?: string;

  @Column('timestamp', { nullable: true })
  resolvedAt?: Date;

  @Column('integer', { default: 1 })
  escalationLevel: number;

  @Column('jsonb')
  escalationHistory: EscalationHistory[];

  @Column('jsonb')
  responseNotes: ResponseNote[];

  @Column('jsonb')
  callMetrics: CallMetrics;

  @Column('boolean', { default: false })
  familyNotified: boolean;

  @Column('timestamp', { nullable: true })
  familyNotifiedAt?: Date;

  @Column('boolean', { default: false })
  externalServicesInvolved: boolean;

  @Column('simple-array', { nullable: true })
  externalServices?: string[]; // ambulance, police, fire, etc.

  @Column('integer', { nullable: true, min: 1, max: 5 })
  residentSatisfaction?: number;

  @Column('text', { nullable: true })
  residentFeedback?: string;

  @Column('text', { nullable: true })
  followUpRequired?: string;

  @Column('timestamp', { nullable: true })
  followUpDate?: Date;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if call requires immediate attention
   */
  requiresImmediateAttention(): boolean {
    return this.priority === CallPriority.EMERGENCY || 
           this.priority === CallPriority.URGENT ||
           this.callType === CallType.MEDICAL_EMERGENCY ||
           this.callType === CallType.FALL_ALERT;
  }

  /**
   * Check if call is overdue for response
   */
  isOverdue(): boolean {
    if (this.status !== CallStatus.ACTIVE) return false;
    
    const now = new Date().getTime();
    const timeLimit = this.getResponseTimeLimit();
    return (now - this.triggeredAt.getTime()) > timeLimit;
  }

  /**
   * Get response time limit based on priority
   */
  getResponseTimeLimit(): number {
    constlimits: Record<CallPriority, number> = {
      [CallPriority.EMERGENCY]: 60 * 1000, // 1 minute
      [CallPriority.URGENT]: 2 * 60 * 1000, // 2 minutes
      [CallPriority.HIGH]: 5 * 60 * 1000, // 5 minutes
      [CallPriority.STANDARD]: 10 * 60 * 1000, // 10 minutes
      [CallPriority.ROUTINE]: 30 * 60 * 1000 // 30 minutes
    };
    return limits[this.priority];
  }

  /**
   * Calculate total response time
   */
  getTotalResponseTime(): number | null {
    if (!this.resolvedAt) return null;
    return this.resolvedAt.getTime() - this.triggeredAt.getTime();
  }

  /**
   * Check if escalation is required
   */
  shouldEscalate(): boolean {
    if (this.status !== CallStatus.ACTIVE) return false;
    
    const timeElapsed = new Date().getTime() - this.triggeredAt.getTime();
    const escalationTime = this.priority === CallPriority.URGENT ? 3 * 60 * 1000 : 8 * 60 * 1000;
    
    return timeElapsed > escalationTime;
  }

  /**
   * Get call urgency level
   */
  getUrgencyLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (this.priority === CallPriority.EMERGENCY) return 'CRITICAL';
    if (this.priority === CallPriority.URGENT) return 'HIGH';
    if (this.priority === CallPriority.HIGH) return 'MEDIUM';
    return 'LOW';
  }
}
