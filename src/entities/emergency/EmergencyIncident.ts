import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum EmergencyType {
  MEDICAL = 'medical',
  FIRE = 'fire',
  SECURITY = 'security',
  BEHAVIORAL = 'behavioral',
  SAFEGUARDING = 'safeguarding',
  ENVIRONMENTAL = 'environmental',
  TECHNICAL = 'technical',
  EVACUATION = 'evacuation',
  LOCKDOWN = 'lockdown',
  EXTERNAL_THREAT = 'external_threat'
}

export enum EmergencySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  CATASTROPHIC = 'catastrophic'
}

export enum IncidentStatus {
  REPORTED = 'reported',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  CONTAINED = 'contained',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  UNDER_INVESTIGATION = 'under_investigation'
}

export enum DetectionMethod {
  MANUAL_REPORT = 'manual_report',
  SENSOR_AUTOMATIC = 'sensor_automatic',
  AI_DETECTION = 'ai_detection',
  CCTV_ANALYTICS = 'cctv_analytics',
  WEARABLE_DEVICE = 'wearable_device',
  CALL_BUTTON = 'call_button',
  MOBILE_APP = 'mobile_app',
  THIRD_PARTY_ALERT = 'third_party_alert'
}

export interface EmergencyLocation {
  buildingId: string;
  floor: number;
  room?: string;
  zone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number; // meters
  };
  accessRoutes: string[];
  evacuationRoutes: string[];
  nearbyEmergencyEquipment: string[];
}

export interface ResponseTeamMember {
  memberId: string;
  memberType: 'internal_staff' | 'external_emergency' | 'specialist' | 'volunteer';
  role: string;
  qualifications: string[];
  responseTime?: Date;
  arrivalTime?: Date;
  assignedTasks: string[];
  status: 'assigned' | 'responding' | 'on_scene' | 'completed' | 'unavailable';
  equipment: string[];
  communicationChannel: string;
}

export interface AIIncidentAnalysis {
  predictedEscalation: {
    probability: number; // 0-100
    timeframe: string;
    escalationFactors: string[];
    preventionStrategies: string[];
  };
  resourceRequirements: {
    personnelNeeded: number;
    equipmentRequired: string[];
    specialistRequired: string[];
    estimatedDuration: number; // minutes
  };
  similarIncidents: Array<{
    incidentId: string;
    similarity: number; // percentage
    outcome: string;
    lessonsLearned: string[];
  }>;
  riskFactors: {
    immediateRisks: string[];
    secondaryRisks: string[];
    cascadingEffects: string[];
    vulnerablePopulations: string[];
  };
}

export interface CommunicationLog {
  timestamp: Date;
  communicationType: 'internal' | 'external' | 'family' | 'regulatory' | 'emergency_services';
  recipient: string;
  message: string;
  method: 'phone' | 'email' | 'sms' | 'radio' | 'in_person' | 'digital_alert';
  acknowledgmentReceived: boolean;
  responseReceived?: string;
  urgency: 'routine' | 'urgent' | 'immediate';
}

export interface BusinessContinuityImpact {
  operationalImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  affectedServices: string[];
  estimatedDowntime: number; // minutes
  financialImpact: number; // GBP
  reputationalImpact: 'none' | 'low' | 'medium' | 'high';
  regulatoryImplications: string[];
  recoveryTimeObjective: number; // minutes
  recoveryPointObjective: number; // minutes of data loss acceptable
}

export interface LessonsLearned {
  whatWorkedWell: string[];
  areasForImprovement: string[];
  systemFailures: string[];
  processImprovements: string[];
  trainingNeeds: string[];
  equipmentNeeds: string[];
  policyChanges: string[];
  preventionStrategies: string[];
}

@Entity('emergency_incidents')
export class EmergencyIncident extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  incidentNumber: string;

  @Column({
    type: 'enum',
    enum: EmergencyType
  })
  emergencyType: EmergencyType;

  @Column({
    type: 'enum',
    enum: EmergencySeverity
  })
  severity: EmergencySeverity;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED
  })
  status: IncidentStatus;

  @Column('jsonb')
  location: EmergencyLocation;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: DetectionMethod
  })
  detectedBy: DetectionMethod;

  @Column('timestamp')
  detectionTime: Date;

  @Column('timestamp', { nullable: true })
  acknowledgedTime?: Date;

  @Column('timestamp', { nullable: true })
  responseStartTime?: Date;

  @Column('timestamp', { nullable: true })
  containmentTime?: Date;

  @Column('timestamp', { nullable: true })
  resolutionTime?: Date;

  @Column()
  reportedBy: string;

  @Column({ nullable: true })
  acknowledgedBy?: string;

  @Column('jsonb')
  responseTeam: ResponseTeamMember[];

  @Column('jsonb')
  aiAnalysis: AIIncidentAnalysis;

  @Column('jsonb')
  communicationLog: CommunicationLog[];

  @Column('jsonb')
  businessContinuityImpact: BusinessContinuityImpact;

  @Column('jsonb')
  affectedResidents: Array<{
    residentId: string;
    impactLevel: 'none' | 'minimal' | 'moderate' | 'significant';
    evacuated: boolean;
    medicalAttentionRequired: boolean;
    familyNotified: boolean;
  }>;

  @Column('jsonb')
  externalAgenciesInvolved: Array<{
    agencyType: 'ambulance' | 'fire' | 'police' | 'social_services' | 'cqc' | 'environmental_health';
    contactTime: Date;
    arrivalTime?: Date;
    referenceNumber?: string;
    officerName?: string;
    actionsTaken: string[];
  }>;

  @Column('jsonb')
  resourcesDeployed: Array<{
    resourceType: 'personnel' | 'equipment' | 'vehicle' | 'facility';
    resourceId: string;
    deploymentTime: Date;
    returnTime?: Date;
    effectiveness: 'excellent' | 'good' | 'adequate' | 'poor';
  }>;

  @Column('jsonb')
  lessonsLearned: LessonsLearned;

  @Column('text', { nullable: true })
  investigationSummary?: string;

  @Column('decimal', { precision: 10, scale: 2 }, { nullable: true })
  estimatedCost?: number;

  @Column('decimal', { precision: 10, scale: 2 }, { nullable: true })
  actualCost?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return [IncidentStatus.REPORTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.RESPONDING].includes(this.status);
  }

  isCritical(): boolean {
    return this.severity === EmergencySeverity.CRITICAL || this.severity === EmergencySeverity.CATASTROPHIC;
  }

  isResolved(): boolean {
    return this.status === IncidentStatus.RESOLVED || this.status === IncidentStatus.CLOSED;
  }

  getResponseTime(): number | null {
    if (!this.responseStartTime) return null;
    return Math.floor((this.responseStartTime.getTime() - this.detectionTime.getTime()) / (1000 * 60)); // minutes
  }

  getResolutionTime(): number | null {
    if (!this.resolutionTime) return null;
    return Math.floor((this.resolutionTime.getTime() - this.detectionTime.getTime()) / (1000 * 60)); // minutes
  }

  getTotalDuration(): number | null {
    const endTime = this.resolutionTime || new Date();
    return Math.floor((endTime.getTime() - this.detectionTime.getTime()) / (1000 * 60)); // minutes
  }

  addResponseTeamMember(member: ResponseTeamMember): void {
    const existingIndex = this.responseTeam.findIndex(m => m.memberId === member.memberId);
    if (existingIndex >= 0) {
      this.responseTeam[existingIndex] = member;
    } else {
      this.responseTeam.push(member);
    }
  }

  updateMemberStatus(memberId: string, status: string, arrivalTime?: Date): void {
    const member = this.responseTeam.find(m => m.memberId === memberId);
    if (member) {
      member.status = status as any;
      if (arrivalTime) {
        member.arrivalTime = arrivalTime;
      }
    }
  }

  addCommunicationEntry(entry: CommunicationLog): void {
    this.communicationLog.push(entry);
  }

  escalate(newSeverity: EmergencySeverity, reason: string): void {
    this.severity = newSeverity;
    this.addCommunicationEntry({
      timestamp: new Date(),
      communicationType: 'internal',
      recipient: 'incident_commander',
      message: `Incident escalated to ${newSeverity}: ${reason}`,
      method: 'digital_alert',
      acknowledgmentReceived: false,
      urgency: 'immediate'
    });
  }

  acknowledge(acknowledgedBy: string): void {
    this.status = IncidentStatus.ACKNOWLEDGED;
    this.acknowledgedTime = new Date();
    this.acknowledgedBy = acknowledgedBy;
  }

  startResponse(): void {
    this.status = IncidentStatus.RESPONDING;
    this.responseStartTime = new Date();
  }

  contain(): void {
    this.status = IncidentStatus.CONTAINED;
    this.containmentTime = new Date();
  }

  resolve(resolutionSummary: string): void {
    this.status = IncidentStatus.RESOLVED;
    this.resolutionTime = new Date();
    this.investigationSummary = resolutionSummary;
  }

  close(lessonsLearned: LessonsLearned): void {
    this.status = IncidentStatus.CLOSED;
    this.lessonsLearned = lessonsLearned;
  }

  getAffectedResidentCount(): number {
    return this.affectedResidents.length;
  }

  getEvacuatedResidentCount(): number {
    return this.affectedResidents.filter(resident => resident.evacuated).length;
  }

  requiresExternalAgencies(): boolean {
    return this.isCritical() || 
           this.emergencyType === EmergencyType.FIRE ||
           this.emergencyType === EmergencyType.MEDICAL ||
           this.emergencyType === EmergencyType.SECURITY;
  }

  hasExternalAgencyInvolved(agencyType: string): boolean {
    return this.externalAgenciesInvolved.some(agency => agency.agencyType === agencyType);
  }

  isOverdue(): boolean {
    const maxResponseTimes = {
      [EmergencySeverity.CATASTROPHIC]: 2, // 2 minutes
      [EmergencySeverity.CRITICAL]: 5,     // 5 minutes
      [EmergencySeverity.HIGH]: 10,        // 10 minutes
      [EmergencySeverity.MEDIUM]: 30,      // 30 minutes
      [EmergencySeverity.LOW]: 60          // 60 minutes
    };

    const maxTime = maxResponseTimes[this.severity];
    const currentTime = new Date();
    const timeSinceDetection = (currentTime.getTime() - this.detectionTime.getTime()) / (1000 * 60);

    return timeSinceDetection > maxTime && !this.responseStartTime;
  }

  calculateResponseEffectiveness(): number {
    let score = 100;
    
    // Deduct for delays
    const responseTime = this.getResponseTime();
    if (responseTime) {
      const maxResponseTime = this.getMaxResponseTime();
      if (responseTime > maxResponseTime) {
        score -= Math.min(50, (responseTime - maxResponseTime) * 2);
      }
    }
    
    // Deduct for escalations
    if (this.severity === EmergencySeverity.CRITICAL || this.severity === EmergencySeverity.CATASTROPHIC) {
      score -= 10;
    }
    
    // Add for effective containment
    if (this.containmentTime) {
      const containmentTime = Math.floor((this.containmentTime.getTime() - this.detectionTime.getTime()) / (1000 * 60));
      if (containmentTime <= 30) score += 10;
    }
    
    // Add for good communication
    if (this.communicationLog.length >= 3) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private getMaxResponseTime(): number {
    const maxTimes = {
      [EmergencySeverity.CATASTROPHIC]: 2,
      [EmergencySeverity.CRITICAL]: 5,
      [EmergencySeverity.HIGH]: 10,
      [EmergencySeverity.MEDIUM]: 30,
      [EmergencySeverity.LOW]: 60
    };
    
    return maxTimes[this.severity];
  }

  generateIncidentReport(): any {
    return {
      incidentNumber: this.incidentNumber,
      type: this.emergencyType,
      severity: this.severity,
      status: this.status,
      timeline: {
        detected: this.detectionTime,
        acknowledged: this.acknowledgedTime,
        responseStarted: this.responseStartTime,
        contained: this.containmentTime,
        resolved: this.resolutionTime
      },
      metrics: {
        responseTime: this.getResponseTime(),
        resolutionTime: this.getResolutionTime(),
        totalDuration: this.getTotalDuration(),
        effectiveness: this.calculateResponseEffectiveness()
      },
      impact: {
        residentsAffected: this.getAffectedResidentCount(),
        residentsEvacuated: this.getEvacuatedResidentCount(),
        businessImpact: this.businessContinuityImpact,
        estimatedCost: this.estimatedCost,
        actualCost: this.actualCost
      },
      response: {
        teamMembers: this.responseTeam.length,
        externalAgencies: this.externalAgenciesInvolved.length,
        resourcesDeployed: this.resourcesDeployed.length,
        communicationEntries: this.communicationLog.length
      },
      aiAnalysis: this.aiAnalysis,
      lessonsLearned: this.lessonsLearned
    };
  }
}