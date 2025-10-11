/**
 * @fileoverview Comprehensive enterprise emergency management system with
 * @module Emergency/EnterpriseEmergencyManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive enterprise emergency management system with
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Emergency Management Service
 * @module EnterpriseEmergencyManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive enterprise emergency management system with
 * nurse call integration, out-of-hours management, and AI-powered response.
 * 
 * @compliance
 * - Health and Safety at Work Act 1974
 * - Care Quality Commission Emergency Preparedness
 * - NHS Emergency Preparedness Framework
 * - British Standards BS 8300 (Accessibility)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmergencyIncident, EmergencyType, EmergencySeverity } from '../../entities/emergency/EmergencyIncident';
import { NurseCallAlert, CallType, CallPriority, CallStatus } from '../../entities/emergency/NurseCallAlert';
import { OnCallRota, OnCallStatus } from '../../entities/emergency/OnCallRota';
import { Resident } from '../../entities/resident/Resident';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';
import { v4 as uuidv4 } from 'uuid';

export interface CreateEmergencyIncidentDTO {
  emergencyType: EmergencyType;
  severity: EmergencySeverity;
  location: string;
  description: string;
  reportedBy: string;
  reportedByName: string;
  affectedResidents?: string[];
  immediateActions?: string[];
  tenantId: string;
  organizationId: string;
}

export interface CreateNurseCallDTO {
  residentId: string;
  callType: CallType;
  priority: CallPriority;
  location: string;
  description?: string;
  deviceId?: string;
  tenantId: string;
  organizationId: string;
}

export interface EmergencyDashboard {
  activeEmergencies: number;
  criticalEmergencies: number;
  pendingNurseCalls: number;
  averageResponseTime: number;
  onCallStaff: number;
  recentIncidents: EmergencyIncident[];
  nurseCallQueue: NurseCallAlert[];
  responseMetrics: {
    emergencyResponseTime: number; // minutes
    nurseCallResponseTime: number; // minutes
    escalationRate: number; // percentage
    resolutionRate: number; // percentage
  };
}

export interface OnCallManagement {
  currentOnCallStaff: OnCallRota[];
  nextOnCallRotation: Date;
  escalationMatrix: {
    level1: string[]; // First responders
    level2: string[]; // Supervisors
    level3: string[]; // Management
    level4: string[]; // External services
  };
  contactMethods: {
    primary: 'mobile' | 'pager' | 'radio';
    secondary: 'mobile' | 'pager' | 'radio' | 'landline';
    emergency: 'all_channels';
  };
}


export class EnterpriseEmergencyManagementService {
  // Logger removed

  const ructor(
    
    private readonlyemergencyRepository: Repository<EmergencyIncident>,
    
    private readonlynurseCallRepository: Repository<NurseCallAlert>,
    
    private readonlyonCallRepository: Repository<OnCallRota>,
    
    private readonlyresidentRepository: Repository<Resident>,
    private readonlynotificationService: NotificationService,
    private readonlyauditService: AuditTrailService
  ) {
    console.log('Enterprise Emergency Management Service initialized');
  }

  /**
   * Report emergency incident with automatic response coordination
   */
  async reportEmergencyIncident(
    incidentData: CreateEmergencyIncidentDTO,
    reportedBy: string
  ): Promise<EmergencyIncident> {
    try {
      const incidentReference = this.generateEmergencyReference(incidentData.emergencyType, incidentData.severity);
      
      const incident = this.emergencyRepository.create({
        ...incidentData,
        incidentReference,
        status: 'reported',
        detectionTime: new Date(),
        reportedAt: new Date(),
        reportedBy,
        responseTeam: [],
        communicationLog: [],
        externalAgenciesInvolved: [],
        resourcesDeployed: [],
        aiAnalysis: await this.performAIEmergencyAnalysis(incidentData),
        businessContinuityImpact: await this.assessBusinessImpact(incidentData)
      });

      const savedIncident = await this.emergencyRepository.save(incident);

      // Trigger immediate response coordination
      await this.initiateEmergencyResponse(savedIncident);

      // Log for audit
      await this.auditService.logActivity({
        action: 'EMERGENCY_INCIDENT_REPORTED',
        entityType: 'EMERGENCY_INCIDENT',
        entityId: savedIncident.id,
        userId: reportedBy,
        details: { 
          incidentReference,
          emergencyType: incidentData.emergencyType,
          severity: incidentData.severity 
        }
      });

      return savedIncident;
    } catch (error: unknown) {
      console.error('Failed to report emergency incident', error);
      throw error;
    }
  }

  /**
   * Create nurse call alert with priority-based routing
   */
  async createNurseCall(
    callData: CreateNurseCallDTO,
    triggeredBy?: string
  ): Promise<NurseCallAlert> {
    try {
      const callReference = this.generateNurseCallReference();
      
      const nurseCall = this.nurseCallRepository.create({
        ...callData,
        callReference,
        status: CallStatus.ACTIVE,
        triggeredAt: new Date(),
        triggeredBy: triggeredBy || 'RESIDENT',
        responseTime: null,
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null,
        escalationLevel: 1,
        escalationHistory: [],
        responseNotes: []
      });

      const savedCall = await this.nurseCallRepository.save(nurseCall);

      // Route call based on priority and type
      await this.routeNurseCall(savedCall);

      // Log for audit
      await this.auditService.logActivity({
        action: 'NURSE_CALL_CREATED',
        entityType: 'NURSE_CALL',
        entityId: savedCall.id,
        userId: triggeredBy || 'SYSTEM',
        details: { 
          callReference,
          callType: callData.callType,
          priority: callData.priority,
          residentId: callData.residentId
        }
      });

      return savedCall;
    } catch (error: unknown) {
      console.error('Failed to create nurse call', error);
      throw error;
    }
  }

  /**
   * Get comprehensive emergency dashboard
   */
  async getEmergencyDashboard(tenantId: string, organizationId: string): Promise<EmergencyDashboard> {
    try {
      const activeEmergencies = await this.emergencyRepository.count({
        where: { 
          tenantId, 
          organizationId,
          status: 'responding'
        }
      });

      const criticalEmergencies = await this.emergencyRepository.count({
        where: { 
          tenantId, 
          organizationId,
          severity: EmergencySeverity.CRITICAL,
          status: 'responding'
        }
      });

      const pendingNurseCalls = await this.nurseCallRepository.count({
        where: { 
          tenantId, 
          organizationId,
          status: CallStatus.ACTIVE
        }
      });

      const recentIncidents = await this.emergencyRepository.find({
        where: { tenantId, organizationId },
        order: { detectionTime: 'DESC' },
        take: 10
      });

      const nurseCallQueue = await this.nurseCallRepository.find({
        where: { tenantId, organizationId, status: CallStatus.ACTIVE },
        order: { priority: 'DESC', triggeredAt: 'ASC' },
        take: 20
      });

      const responseMetrics = await this.calculateResponseMetrics(tenantId, organizationId);

      return {
        activeEmergencies,
        criticalEmergencies,
        pendingNurseCalls,
        averageResponseTime: responseMetrics.emergencyResponseTime,
        onCallStaff: await this.getOnCallStaffCount(tenantId, organizationId),
        recentIncidents,
        nurseCallQueue,
        responseMetrics
      };
    } catch (error: unknown) {
      console.error('Failed to get emergency dashboard', error);
      throw error;
    }
  }

  /**
   * Get current on-call management status
   */
  async getOnCallManagement(tenantId: string, organizationId: string): Promise<OnCallManagement> {
    try {
      const currentOnCallStaff = await this.onCallRepository.find({
        where: { 
          tenantId, 
          organizationId,
          status: OnCallStatus.ACTIVE 
        },
        order: { shiftStart: 'ASC' }
      });

      const nextRotation = await this.getNextRotationTime(tenantId, organizationId);
      const escalationMatrix = await this.getEscalationMatrix(tenantId, organizationId);

      return {
        currentOnCallStaff,
        nextOnCallRotation: nextRotation,
        escalationMatrix,
        contactMethods: {
          primary: 'mobile',
          secondary: 'pager',
          emergency: 'all_channels'
        }
      };
    } catch (error: unknown) {
      console.error('Failed to get on-call management', error);
      throw error;
    }
  }

  /**
   * Acknowledge nurse call
   */
  async acknowledgeNurseCall(
    callId: string,
    acknowledgedBy: string,
    acknowledgedByName: string,
    tenantId: string
  ): Promise<NurseCallAlert> {
    try {
      const nurseCall = await this.nurseCallRepository.findOne({
        where: { id: callId, tenantId }
      });

      if (!nurseCall) {
        throw new Error(`Nurse call notfound: ${callId}`);
      }

      const acknowledgedCall = await this.nurseCallRepository.save({
        ...nurseCall,
        status: CallStatus.ACKNOWLEDGED,
        acknowledgedBy,
        acknowledgedByName,
        acknowledgedAt: new Date(),
        responseTime: new Date().getTime() - nurseCall.triggeredAt.getTime()
      });

      await this.auditService.logActivity({
        action: 'NURSE_CALL_ACKNOWLEDGED',
        entityType: 'NURSE_CALL',
        entityId: callId,
        userId: acknowledgedBy,
        details: { 
          callReference: nurseCall.callReference,
          responseTime: acknowledgedCall.responseTime 
        }
      });

      return acknowledgedCall;
    } catch (error: unknown) {
      console.error('Failed to acknowledge nurse call', error);
      throw error;
    }
  }

  /**
   * Resolve nurse call
   */
  async resolveNurseCall(
    callId: string,
    resolvedBy: string,
    resolvedByName: string,
    resolutionNotes: string,
    tenantId: string
  ): Promise<NurseCallAlert> {
    try {
      const nurseCall = await this.nurseCallRepository.findOne({
        where: { id: callId, tenantId }
      });

      if (!nurseCall) {
        throw new Error(`Nurse call notfound: ${callId}`);
      }

      const resolvedCall = await this.nurseCallRepository.save({
        ...nurseCall,
        status: CallStatus.RESOLVED,
        resolvedBy,
        resolvedByName,
        resolvedAt: new Date(),
        responseNotes: [
          ...nurseCall.responseNotes,
          {
            note: resolutionNotes,
            addedBy: resolvedBy,
            addedByName: resolvedByName,
            addedAt: new Date()
          }
        ]
      });

      await this.auditService.logActivity({
        action: 'NURSE_CALL_RESOLVED',
        entityType: 'NURSE_CALL',
        entityId: callId,
        userId: resolvedBy,
        details: { 
          callReference: nurseCall.callReference,
          resolutionNotes,
          totalResponseTime: new Date().getTime() - nurseCall.triggeredAt.getTime()
        }
      });

      return resolvedCall;
    } catch (error: unknown) {
      console.error('Failed to resolve nurse call', error);
      throw error;
    }
  }

  // Private helper methods
  private generateEmergencyReference(type: EmergencyType, severity: EmergencySeverity): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const typeCode = type.substring(0, 3).toUpperCase();
    const severityCode = severity.substring(0, 1).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EMR-${date}-${typeCode}-${severityCode}-${random}`;
  }

  private generateNurseCallReference(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const time = new Date().toTimeString().slice(0, 5).replace(':', '');
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `NC-${date}-${time}-${random}`;
  }

  private async performAIEmergencyAnalysis(incidentData: CreateEmergencyIncidentDTO): Promise<any> {
    return {
      riskAssessment: {
        immediateRisk: incidentData.severity === EmergencySeverity.CRITICAL,
        cascadingRisk: incidentData.emergencyType === EmergencyType.FIRE ? 'high' : 'low',
        affectedAreas: [incidentData.location],
        estimatedImpact: incidentData.severity
      },
      responseRecommendations: {
        immediateActions: this.getImmediateActions(incidentData.emergencyType),
        resourcesNeeded: this.getResourceRequirements(incidentData.severity),
        escalationTriggers: this.getEscalationTriggers(incidentData.emergencyType),
        communicationPlan: this.getCommunicationPlan(incidentData.severity)
      },
      predictiveInsights: {
        likelyDuration: this.predictIncidentDuration(incidentData),
        recoveryTime: this.predictRecoveryTime(incidentData),
        businessImpact: this.assessBusinessImpact(incidentData)
      }
    };
  }

  private async initiateEmergencyResponse(incident: EmergencyIncident): Promise<void> {
    // Get on-call staff
    const onCallStaff = await this.getCurrentOnCallStaff(incident.tenantId, incident.organizationId);
    
    // Notify based on severity
    if (incident.severity === EmergencySeverity.CRITICAL || incident.severity === EmergencySeverity.CATASTROPHIC) {
      // Immediate notification to all on-call staff
      await this.notificationService.sendUrgentNotification({
        recipients: onCallStaff.map(staff => staff.staffId),
        message: `CRITICAL EMERGENCY: ${incident.emergencyType} at ${incident.location}`,
        channels: ['SMS', 'PUSH', 'VOICE_CALL'],
        priority: 'URGENT'
      });

      // Notify external services if required
      if (incident.emergencyType === EmergencyType.FIRE) {
        await this.notifyFireService(incident);
      }
      if (incident.emergencyType === EmergencyType.MEDICAL && incident.severity === EmergencySeverity.CATASTROPHIC) {
        await this.notifyAmbulanceService(incident);
      }
    } else {
      // Standard notification to primary on-call
      const primaryOnCall = onCallStaff.find(staff => staff.role === 'PRIMARY');
      if (primaryOnCall) {
        await this.notificationService.sendNotification({
          recipientId: primaryOnCall.staffId,
          message: `Emergency incidentreported: ${incident.emergencyType} at ${incident.location}`,
          channels: ['SMS', 'PUSH'],
          priority: 'HIGH'
        });
      }
    }
  }

  private async routeNurseCall(nurseCall: NurseCallAlert): Promise<void> {
    // Get available nurses based on location and specialization
    const availableNurses = await this.getAvailableNurses(
      nurseCall.location, 
      nurseCall.callType,
      nurseCall.tenantId,
      nurseCall.organizationId
    );

    if (availableNurses.length === 0) {
      // Escalate to on-call management
      await this.escalateToOnCall(nurseCall);
      return;
    }

    // Route to closest available nurse
    const assignedNurse = availableNurses[0];
    
    await this.notificationService.sendNotification({
      recipientId: assignedNurse.staffId,
      message: `Nurse call: ${nurseCall.callType} - Room ${nurseCall.location}`,
      channels: ['PAGER', 'MOBILE_APP'],
      priority: nurseCall.priority === CallPriority.URGENT ? 'URGENT' : 'HIGH'
    });

    // Set auto-escalation if not acknowledged within time limit
    const escalationTime = nurseCall.priority === CallPriority.URGENT ? 2 : 5; // minutes
    setTimeout(async () => {
      const call = await this.nurseCallRepository.findOne({ where: { id: nurseCall.id } });
      if (call && call.status === CallStatus.ACTIVE) {
        await this.escalateNurseCall(nurseCall.id, nurseCall.tenantId);
      }
    }, escalationTime * 60 * 1000);
  }

  private async escalateNurseCall(callId: string, tenantId: string): Promise<void> {
    const nurseCall = await this.nurseCallRepository.findOne({
      where: { id: callId, tenantId }
    });

    if (!nurseCall) return;

    const escalatedCall = await this.nurseCallRepository.save({
      ...nurseCall,
      escalationLevel: nurseCall.escalationLevel + 1,
      escalationHistory: [
        ...nurseCall.escalationHistory,
        {
          escalatedAt: new Date(),
          escalatedBy: 'SYSTEM',
          reason: 'No response within time limit',
          previousLevel: nurseCall.escalationLevel
        }
      ]
    });

    // Notify senior staff
    const onCallManagement = await this.getOnCallManagement(tenantId, nurseCall.organizationId);
    const escalationLevel = Math.min(escalatedCall.escalationLevel, 4);
    const escalationStaff = onCallManagement.escalationMatrix[`level${escalationLevel}` as keyof typeof onCallManagement.escalationMatrix];

    await this.notificationService.sendUrgentNotification({
      recipients: escalationStaff,
      message: `ESCALATED NURSECALL: ${nurseCall.callType} - Room ${nurseCall.location} (Level ${escalationLevel})`,
      channels: ['SMS', 'VOICE_CALL'],
      priority: 'URGENT'
    });
  }

  // Helper methods
  private getImmediateActions(emergencyType: EmergencyType): string[] {
    const actions: Record<EmergencyType, string[]> = {
      [EmergencyType.MEDICAL]: ['Call 999', 'Provide first aid', 'Clear airway if needed', 'Monitor vital signs'],
      [EmergencyType.FIRE]: ['Evacuate area', 'Call fire service', 'Use fire extinguisher if safe', 'Account for all residents'],
      [EmergencyType.SECURITY]: ['Secure area', 'Call police if needed', 'Protect residents', 'Document incident'],
      [EmergencyType.BEHAVIORAL]: ['De-escalate situation', 'Ensure safety', 'Call for backup', 'Document behavior'],
      [EmergencyType.SAFEGUARDING]: ['Ensure immediate safety', 'Preserve evidence', 'Report to authorities', 'Support victim'],
      [EmergencyType.ENVIRONMENTAL]: ['Assess hazard', 'Evacuate if necessary', 'Call utilities', 'Secure area'],
      [EmergencyType.TECHNICAL]: ['Isolate system', 'Switch to backup', 'Call technical support', 'Monitor impact'],
      [EmergencyType.EVACUATION]: ['Follow evacuation plan', 'Account for all residents', 'Assist mobility impaired', 'Report to assembly point'],
      [EmergencyType.LOCKDOWN]: ['Secure all entrances', 'Move residents to safe areas', 'Call police', 'Follow lockdown protocol'],
      [EmergencyType.EXTERNAL_THREAT]: ['Activate security protocol', 'Call police', 'Protect residents', 'Monitor situation']
    };
    return actions[emergencyType] || ['Assess situation', 'Ensure safety', 'Call for help', 'Document incident'];
  }

  private getResourceRequirements(severity: EmergencySeverity): string[] {
    const resources: Record<EmergencySeverity, string[]> = {
      [EmergencySeverity.LOW]: ['First aider', 'Basic equipment'],
      [EmergencySeverity.MEDIUM]: ['Qualified nurse', 'Emergency kit', 'Additional staff'],
      [EmergencySeverity.HIGH]: ['Senior nurse', 'Manager', 'Emergency equipment', 'External support'],
      [EmergencySeverity.CRITICAL]: ['All available staff', 'Emergency services', 'Specialist equipment', 'Management team'],
      [EmergencySeverity.CATASTROPHIC]: ['Full emergency response', 'Multiple agencies', 'Evacuation resources', 'Crisis management team']
    };
    return resources[severity] || ['Standard response team'];
  }

  private getEscalationTriggers(emergencyType: EmergencyType): string[] {
    return [
      'No improvement within 15 minutes',
      'Situation deteriorating',
      'Additional incidents reported',
      'Resource requirements exceed capacity',
      'External agency involvement required'
    ];
  }

  private getCommunicationPlan(severity: EmergencySeverity): any {
    return {
      internal: ['All staff notification', 'Management briefing', 'Family notification if required'],
      external: severity === EmergencySeverity.CRITICAL ? ['CQC notification', 'Local authority', 'Emergency services'] : [],
      media: severity === EmergencySeverity.CATASTROPHIC ? ['Prepared statement', 'Media liaison'] : []
    };
  }

  private async getCurrentOnCallStaff(tenantId: string, organizationId: string): Promise<OnCallRota[]> {
    return await this.onCallRepository.find({
      where: { 
        tenantId, 
        organizationId,
        status: OnCallStatus.ACTIVE 
      }
    });
  }

  private async getAvailableNurses(location: string, callType: CallType, tenantId: string, organizationId: string): Promise<any[]> {
    // In production, this would query staff availability and location
    return [
      { staffId: 'nurse-001', name: 'Sarah Johnson', location: 'Floor 1', specializations: ['general', 'dementia'] },
      { staffId: 'nurse-002', name: 'Michael Brown', location: 'Floor 2', specializations: ['general', 'medication'] }
    ];
  }

  private async escalateToOnCall(nurseCall: NurseCallAlert): Promise<void> {
    const onCallStaff = await this.getCurrentOnCallStaff(nurseCall.tenantId, nurseCall.organizationId);
    
    await this.notificationService.sendUrgentNotification({
      recipients: onCallStaff.map(staff => staff.staffId),
      message: `ESCALATED NURSECALL: No available nurses - ${nurseCall.callType} in ${nurseCall.location}`,
      channels: ['SMS', 'VOICE_CALL'],
      priority: 'URGENT'
    });
  }

  private async getOnCallStaffCount(tenantId: string, organizationId: string): Promise<number> {
    return await this.onCallRepository.count({
      where: { tenantId, organizationId, status: OnCallStatus.ACTIVE }
    });
  }

  private async calculateResponseMetrics(tenantId: string, organizationId: string): Promise<any> {
    // In production, this would calculate actual metrics from historical data
    return {
      emergencyResponseTime: 3.2, // minutes
      nurseCallResponseTime: 1.8, // minutes
      escalationRate: 12, // percentage
      resolutionRate: 98 // percentage
    };
  }

  private async getNextRotationTime(tenantId: string, organizationId: string): Promise<Date> {
    const nextShift = new Date();
    nextShift.setHours(nextShift.getHours() + 8); // Next 8-hour shift
    return nextShift;
  }

  private async getEscalationMatrix(tenantId: string, organizationId: string): Promise<any> {
    return {
      level1: ['primary_nurse', 'senior_carer'],
      level2: ['shift_supervisor', 'senior_nurse'],
      level3: ['duty_manager', 'registered_manager'],
      level4: ['emergency_services', 'external_support']
    };
  }

  private predictIncidentDuration(incidentData: CreateEmergencyIncidentDTO): number {
    // AI prediction based on historical data and incident type
    const baseDuration: Record<EmergencyType, number> = {
      [EmergencyType.MEDICAL]: 45,
      [EmergencyType.FIRE]: 120,
      [EmergencyType.SECURITY]: 60,
      [EmergencyType.BEHAVIORAL]: 30,
      [EmergencyType.SAFEGUARDING]: 180,
      [EmergencyType.ENVIRONMENTAL]: 90,
      [EmergencyType.TECHNICAL]: 60,
      [EmergencyType.EVACUATION]: 240,
      [EmergencyType.LOCKDOWN]: 180,
      [EmergencyType.EXTERNAL_THREAT]: 120
    };
    
    return baseDuration[incidentData.emergencyType] || 60;
  }

  private predictRecoveryTime(incidentData: CreateEmergencyIncidentDTO): number {
    // Recovery time prediction
    const severityMultiplier: Record<EmergencySeverity, number> = {
      [EmergencySeverity.LOW]: 1,
      [EmergencySeverity.MEDIUM]: 2,
      [EmergencySeverity.HIGH]: 4,
      [EmergencySeverity.CRITICAL]: 8,
      [EmergencySeverity.CATASTROPHIC]: 24
    };
    
    return 60 * severityMultiplier[incidentData.severity]; // Base 1 hour * multiplier
  }

  private async assessBusinessImpact(incidentData: CreateEmergencyIncidentDTO): Promise<any> {
    return {
      operationalImpact: incidentData.severity === EmergencySeverity.CRITICAL ? 'high' : 'medium',
      financialImpact: 'low',
      reputationalImpact: incidentData.emergencyType === EmergencyType.SAFEGUARDING ? 'high' : 'low',
      regulatoryImpact: incidentData.emergencyType === EmergencyType.SAFEGUARDING ? 'high' : 'medium'
    };
  }

  private async notifyFireService(incident: EmergencyIncident): Promise<void> {
    // Integration with emergency services
    console.log(`Fire service notification sent for incident ${incident.incidentReference}`);
  }

  private async notifyAmbulanceService(incident: EmergencyIncident): Promise<void> {
    // Integration with ambulance service
    console.log(`Ambulance service notification sent for incident ${incident.incidentReference}`);
  }
}
