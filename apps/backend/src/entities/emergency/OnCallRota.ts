import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview On-Call Rota Entity
 * @module OnCallRota
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Enterprise on-call management entity with automated scheduling,
 * escalation protocols, and 24/7 coverage management.
 * 
 * @compliance
 * - Working Time Regulations 1998
 * - Health and Safety at Work Act 1974
 * - CQC Regulation 18 - Staffing
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum CallType {
  MEDICAL_EMERGENCY = 'medical_emergency',
  MEDICATION_REQUEST = 'medication_request',
  PAIN_MANAGEMENT = 'pain_management',
  FALL_ALERT = 'fall_alert',
  BEHAVIORAL_CONCERN = 'behavioral_concern',
  VITAL_SIGNS_ALERT = 'vital_signs_alert',
  ASSISTANCE_REQUEST = 'assistance_request',
  BATHROOM_ASSISTANCE = 'bathroom_assistance',
  COMFORT_ASSISTANCE = 'comfort_assistance',
  MOBILITY_ASSISTANCE = 'mobility_assistance',
  EMOTIONAL_SUPPORT = 'emotional_support',
  TECHNICAL_ISSUE = 'technical_issue',
  SAFETY_CONCERN = 'safety_concern',
  WANDERING_ALERT = 'wandering_alert',
  MEDICATION_OVERDUE = 'medication_overdue'
}

export enum OnCallRole {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  MANAGER = 'manager',
  SENIOR_NURSE = 'senior_nurse',
  REGISTERED_NURSE = 'registered_nurse',
  SENIOR_CARER = 'senior_carer',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  CLINICAL_LEAD = 'clinical_lead'
}

export enum OnCallStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  RESPONDING = 'responding',
  UNAVAILABLE = 'unavailable',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ContactMethod {
  MOBILE = 'mobile',
  LANDLINE = 'landline',
  PAGER = 'pager',
  RADIO = 'radio',
  EMAIL = 'email',
  SMS = 'sms',
  MOBILE_APP = 'mobile_app'
}

export interface ContactDetails {
  primary: {
    method: ContactMethod;
    value: string;
    priority: number;
  };
  secondary?: {
    method: ContactMethod;
    value: string;
    priority: number;
  };
  emergency: {
    method: ContactMethod;
    value: string;
    priority: number;
  };
}

export interface OnCallCapabilities {
  emergencyTypes: string[]; // Types of emergencies this person can handle
  specializations: string[]; // Clinical or technical specializations
  certifications: string[]; // Relevant certifications
  equipmentAccess: string[]; // Emergency equipment they can access
  responseRadius: number; // Maximum distance for response (km)
  maxResponseTime: number; // Maximum response time (minutes)
}

export interface ShiftMetrics {
  callsReceived: number;
  callsResolved: number;
  averageResponseTime: number; // minutes
  escalationsRequired: number;
  emergenciesHandled: number;
  totalActiveTime: number; // minutes
  satisfactionRating?: number; // 1-5
}

export interface OnCallPreferences {
  preferredShifts: string[]; // day, night, weekend
  unavailableDates: Date[];
  maxConsecutiveShifts: number;
  minRestPeriod: number; // hours between shifts
  swapRequests: boolean; // Allow shift swapping
  overtimeWillingness: boolean;
}

@Entity('on_call_rota')
@Index(['staffId', 'shiftDate'])
@Index(['status', 'shiftStart'])
@Index(['role', 'status'])
@Index(['tenantId', 'organizationId'])
export class OnCallRota extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  rotaReference: string;

  @Column('uuid')
  staffId: string;

  @Column()
  staffName: string;

  @Column({ enum: OnCallRole })
  role: OnCallRole;

  @Column({ enum: OnCallStatus, default: OnCallStatus.SCHEDULED })
  status: OnCallStatus;

  @Column('date')
  shiftDate: Date;

  @Column('timestamp')
  shiftStart: Date;

  @Column('timestamp')
  shiftEnd: Date;

  @Column('integer')
  shiftDuration: number; // hours

  @Column('jsonb')
  contactDetails: ContactDetails;

  @Column('jsonb')
  capabilities: OnCallCapabilities;

  @Column('jsonb')
  shiftMetrics: ShiftMetrics;

  @Column('jsonb')
  preferences: OnCallPreferences;

  @Column('boolean', { default: true })
  available: boolean;

  @Column('text', { nullable: true })
  unavailableReason?: string;

  @Column('timestamp', { nullable: true })
  lastContactAttempt?: Date;

  @Column('timestamp', { nullable: true })
  lastResponseTime?: Date;

  @Column('integer', { default: 0 })
  currentCallLoad: number; // Number of active calls

  @Column('integer', { default: 5 })
  maxConcurrentCalls: number;

  @Column('text', { nullable: true })
  currentLocation?: string;

  @Column('boolean', { default: false })
  onSite: boolean;

  @Column('integer', { nullable: true })
  estimatedResponseTime?: number; // minutes

  @Column('simple-array', { nullable: true })
  currentAssignments?: string[]; // Active call IDs

  @Column('jsonb', { nullable: true })
  emergencyContacts?: {
    supervisor: { name: string; phone: string };
    backup: { name: string; phone: string };
    family: { name: string; phone: string };
  };

  @Column('text', { nullable: true })
  specialInstructions?: string;

  @Column('boolean', { default: false })
  trainingRequired: boolean;

  @Column('simple-array', { nullable: true })
  requiredTraining?: string[];

  @Column('timestamp', { nullable: true })
  lastTrainingUpdate?: Date;

  @Column('jsonb', { nullable: true })
  performanceMetrics?: {
    monthlyResponseTime: number;
    monthlyCallsHandled: number;
    monthlyEscalations: number;
    satisfactionRating: number;
    reliabilityScore: number;
  };

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  organizationId: string;

  @Column('uuid')
  scheduledBy: string;

  @Column()
  scheduledByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if staff member is currently available for calls
   */
  isAvailable(): boolean {
    const now = new Date();
    const shiftActive = now >= this.shiftStart && now <= this.shiftEnd;
    const notOverloaded = this.currentCallLoad < this.maxConcurrentCalls;
    
    return this.available && 
           this.status === OnCallStatus.ACTIVE && 
           shiftActive && 
           notOverloaded;
  }

  /**
   * Check if staff member can handle specific call type
   */
  canHandleCallType(callType: CallType): boolean {
    // Map call types to required capabilities
    const callTypeCapabilities: Record<CallType, string[]> = {
      [CallType.MEDICAL_EMERGENCY]: ['medical_response', 'first_aid'],
      [CallType.MEDICATION_REQUEST]: ['medication_administration'],
      [CallType.PAIN_MANAGEMENT]: ['pain_assessment', 'clinical_skills'],
      [CallType.FALL_ALERT]: ['mobility_assistance', 'first_aid'],
      [CallType.BEHAVIORAL_CONCERN]: ['behavioral_management', 'de_escalation'],
      [CallType.VITAL_SIGNS_ALERT]: ['clinical_monitoring', 'vital_signs'],
      [CallType.ASSISTANCE_REQUEST]: ['general_care'],
      [CallType.BATHROOM_ASSISTANCE]: ['personal_care'],
      [CallType.COMFORT_ASSISTANCE]: ['general_care'],
      [CallType.MOBILITY_ASSISTANCE]: ['mobility_support'],
      [CallType.EMOTIONAL_SUPPORT]: ['communication_skills'],
      [CallType.TECHNICAL_ISSUE]: ['technical_support'],
      [CallType.SAFETY_CONCERN]: ['safety_protocols'],
      [CallType.WANDERING_ALERT]: ['dementia_care', 'behavioral_management'],
      [CallType.MEDICATION_OVERDUE]: ['medication_administration']
    };

    const requiredCapabilities = callTypeCapabilities[callType] || ['general_care'];
    return requiredCapabilities.some(capability => 
      this.capabilities.specializations.includes(capability)
    );
  }

  /**
   * Calculate current workload percentage
   */
  getWorkloadPercentage(): number {
    return (this.currentCallLoad / this.maxConcurrentCalls) * 100;
  }

  /**
   * Check if shift is within working time regulations
   */
  isCompliantWithWorkingTimeRegs(): boolean {
    const shiftHours = this.shiftDuration;
    const maxDailyHours = 12; // Maximum daily working hours
    const maxWeeklyHours = 48; // Maximum weekly working hours (would need weekly calculation)
    
    return shiftHours <= maxDailyHours;
  }

  /**
   * Get estimated response time based on current status
   */
  getEstimatedResponseTime(): number {
    if (!this.isAvailable()) return -1; // Unavailable
    
    const baseResponseTime = this.estimatedResponseTime || 5; // Default 5 minutes
    const workloadMultiplier = 1 + (this.currentCallLoad * 0.2); // 20% increase per active call
    
    return Math.round(baseResponseTime * workloadMultiplier);
  }

  /**
   * Check if staff member needs break (Working Time Regulations)
   */
  needsBreak(): boolean {
    const now = new Date();
    const shiftElapsed = (now.getTime() - this.shiftStart.getTime()) / (1000 * 60 * 60); // hours
    
    // Break required after 6 hours continuous work
    return shiftElapsed >= 6 && this.status === OnCallStatus.ACTIVE;
  }

  /**
   * Generate shift performance summary
   */
  getShiftPerformanceSummary(): {
    efficiency: number;
    responsiveness: number;
    workload: number;
    compliance: boolean;
  } {
    return {
      efficiency: this.shiftMetrics.callsResolved / Math.max(this.shiftMetrics.callsReceived, 1) * 100,
      responsiveness: Math.max(0, 100 - (this.shiftMetrics.averageResponseTime * 10)), // Lower responsetime = higher score
      workload: this.getWorkloadPercentage(),
      compliance: this.isCompliantWithWorkingTimeRegs()
    };
  }

  /**
   * Start on-call shift
   */
  startShift(): void {
    this.status = OnCallStatus.ACTIVE;
    this.shiftStart = new Date();
    this.currentCallLoad = 0;
    this.currentAssignments = [];
  }

  /**
   * End on-call shift
   */
  endShift(): void {
    this.status = OnCallStatus.COMPLETED;
    this.shiftEnd = new Date();
    this.currentCallLoad = 0;
    this.currentAssignments = [];
  }

  /**
   * Assign call to this staff member
   */
  assignCall(callId: string): boolean {
    if (!this.isAvailable()) return false;
    
    this.currentCallLoad++;
    this.currentAssignments = this.currentAssignments || [];
    this.currentAssignments.push(callId);
    this.status = OnCallStatus.RESPONDING;
    
    return true;
  }

  /**
   * Complete call assignment
   */
  completeCall(callId: string): void {
    this.currentCallLoad = Math.max(0, this.currentCallLoad - 1);
    this.currentAssignments = this.currentAssignments?.filter(id => id !== callId) || [];
    
    if (this.currentCallLoad === 0) {
      this.status = OnCallStatus.ACTIVE;
    }
    
    this.shiftMetrics.callsResolved++;
  }

  /**
   * Check if staff member is on break
   */
  isOnBreak(): boolean {
    return this.status === OnCallStatus.UNAVAILABLE && 
           this.unavailableReason?.toLowerCase().includes('break');
  }

  /**
   * Start break
   */
  startBreak(reason: string = 'Scheduled break'): void {
    this.status = OnCallStatus.UNAVAILABLE;
    this.unavailableReason = reason;
  }

  /**
   * End break
   */
  endBreak(): void {
    this.status = OnCallStatus.ACTIVE;
    this.unavailableReason = undefined;
  }

  /**
   * Update location
   */
  updateLocation(location: string, onSite: boolean = true): void {
    this.currentLocation = location;
    this.onSite = onSite;
  }

  /**
   * Check if staff member can be contacted
   */
  canBeContacted(): boolean {
    const now = new Date();
    const lastAttempt = this.lastContactAttempt;
    
    // If no recent attempt or more than 5 minutes since last attempt
    if (!lastAttempt || (now.getTime() - lastAttempt.getTime()) > 5 * 60 * 1000) {
      return true;
    }
    
    return false;
  }

  /**
   * Record contact attempt
   */
  recordContactAttempt(): void {
    this.lastContactAttempt = new Date();
  }

  /**
   * Record response
   */
  recordResponse(): void {
    this.lastResponseTime = new Date();
  }

  /**
   * Get escalation contact details
   */
  getEscalationContact(): { name: string; phone: string; method: ContactMethod } | null {
    if (!this.emergencyContacts) return null;
    
    return {
      name: this.emergencyContacts.supervisor.name,
      phone: this.emergencyContacts.supervisor.phone,
      method: ContactMethod.MOBILE
    };
  }

  /**
   * Check if training is up to date
   */
  isTrainingUpToDate(): boolean {
    if (!this.lastTrainingUpdate) return false;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return this.lastTrainingUpdate >= sixMonthsAgo;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics: Partial<ShiftMetrics>): void {
    this.shiftMetrics = { ...this.shiftMetrics, ...metrics };
  }

  /**
   * Get shift summary for handover
   */
  getShiftHandoverSummary(): {
    shiftDuration: number;
    callsHandled: number;
    escalations: number;
    currentStatus: string;
    pendingCalls: number;
    nextShiftRecommendations: string[];
  } {
    const now = new Date();
    const shiftDuration = (now.getTime() - this.shiftStart.getTime()) / (1000 * 60 * 60); // hours
    
    return {
      shiftDuration: Math.round(shiftDuration * 100) / 100,
      callsHandled: this.shiftMetrics.callsResolved,
      escalations: this.shiftMetrics.escalationsRequired,
      currentStatus: this.status,
      pendingCalls: this.currentCallLoad,
      nextShiftRecommendations: this.generateNextShiftRecommendations()
    };
  }

  private generateNextShiftRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.shiftMetrics.averageResponseTime > 10) {
      recommendations.push('Consider additional staff for faster response times');
    }
    
    if (this.shiftMetrics.escalationsRequired > 3) {
      recommendations.push('Review escalation procedures and staff training');
    }
    
    if (this.getWorkloadPercentage() > 80) {
      recommendations.push('High workload - consider backup support');
    }
    
    if (!this.isTrainingUpToDate()) {
      recommendations.push('Schedule training updates for staff member');
    }
    
    return recommendations;
  }
}
