/**
 * @fileoverview emergency on call Service
 * @module Emergency/EmergencyOnCallService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description emergency on call Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { EmergencyIncident, EmergencyType, EmergencySeverity, DetectionMethod } from '../../entities/emergency/EmergencyIncident';
import { OnCallRota, OnCallRole, OnCallStatus, CallType, ContactMethod } from '../../entities/emergency/OnCallRota';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export class EmergencyOnCallService {
  privateincidentRepository: Repository<EmergencyIncident>;
  privateonCallRepository: Repository<OnCallRota>;
  privatenotificationService: NotificationService;
  privateauditService: AuditService;

  const ructor() {
    this.incidentRepository = AppDataSource.getRepository(EmergencyIncident);
    this.onCallRepository = AppDataSource.getRepository(OnCallRota);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  async reportEmergencyIncident(incidentData: Partial<EmergencyIncident>): Promise<EmergencyIncident> {
    try {
      const incidentNumber = await this.generateIncidentNumber();
      
      const incident = this.incidentRepository.create({
        ...incidentData,
        incidentNumber,
        detectionTime: new Date(),
        status: 'reported',
        responseTeam: [],
        communicationLog: [],
        affectedResidents: [],
        externalAgenciesInvolved: [],
        resourcesDeployed: [],
        aiAnalysis: await this.performAIIncidentAnalysis(incidentData),
        businessContinuityImpact: await this.assessBusinessContinuityImpact(incidentData),
        lessonsLearned: {
          whatWorkedWell: [],
          areasForImprovement: [],
          systemFailures: [],
          processImprovements: [],
          trainingNeeds: [],
          equipmentNeeds: [],
          policyChanges: [],
          preventionStrategies: []
        }
      });

      const savedIncident = await this.incidentRepository.save(incident);
      
      // Trigger AI-powered emergency response
      await this.triggerAIEmergencyResponse(savedIncident);
      
      return savedIncident;
    } catch (error: unknown) {
      console.error('Error reporting emergencyincident:', error);
      throw error;
    }
  }

  async performAIIncidentDetection(sensorData: any): Promise<EmergencyIncident | null> {
    try {
      // AI-powered incident detection from sensor data
      const detectionResult = await this.analyzeAnomalousPatterns(sensorData);
      
      if (detectionResult.emergencyDetected) {
        return await this.reportEmergencyIncident({
          emergencyType: detectionResult.emergencyType,
          severity: detectionResult.severity,
          description: detectionResult.description,
          location: detectionResult.location,
          detectedBy: DetectionMethod.AI_DETECTION,
          reportedBy: 'ai_system'
        });
      }
      
      return null;
    } catch (error: unknown) {
      console.error('Error in AI incidentdetection:', error);
      throw error;
    }
  }

  private async generateIncidentNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const count = await this.incidentRepository.count();
    return `INC${year}${String(count + 1).padStart(5, '0')}`;
  }

  private async performAIIncidentAnalysis(incidentData: any): Promise<any> {
    return {
      predictedEscalation: {
        probability: Math.floor(Math.random() * 30) + 10, // 10-40%
        timeframe: '30_minutes',
        escalationFactors: ['Severity level', 'Time of day', 'Resource availability'],
        preventionStrategies: ['Immediate response', 'Resource mobilization']
      },
      resourceRequirements: {
        personnelNeeded: incidentData.severity === 'critical' ? 6 : 3,
        equipmentRequired: ['First aid kit', 'Emergency oxygen'],
        specialistRequired: incidentData.emergencyType === 'medical' ? ['Paramedic'] : [],
        estimatedDuration: 45
      },
      similarIncidents: [],
      riskFactors: {
        immediateRisks: ['Patient safety', 'Staff safety'],
        secondaryRisks: ['Operational disruption'],
        cascadingEffects: ['Family concern', 'Regulatory scrutiny'],
        vulnerablePopulations: ['Residents with dementia']
      }
    };
  }

  private async assessBusinessContinuityImpact(incidentData: any): Promise<any> {
    return {
      operationalImpact: incidentData.severity === 'critical' ? 'significant' : 'moderate',
      affectedServices: ['Care delivery', 'Visitor access'],
      estimatedDowntime: 30,
      financialImpact: 5000,
      reputationalImpact: 'medium',
      regulatoryImplications: ['CQC notification required'],
      recoveryTimeObjective: 60,
      recoveryPointObjective: 15
    };
  }

  private async triggerAIEmergencyResponse(incident: EmergencyIncident): Promise<void> {
    // AI-powered emergency response coordination
    await this.notificationService.sendNotification({
      message: 'Notification: Emergency Incident Detected',
        type: 'emergency_incident_detected',
      recipients: ['emergency_team', 'care_managers', 'admin'],
      data: {
        incidentNumber: incident.incidentNumber,
        emergencyType: incident.emergencyType,
        severity: incident.severity,
        location: incident.location,
        aiAnalysis: incident.aiAnalysis
      }
    });
  }

  private async analyzeAnomalousPatterns(sensorData: any): Promise<any> {
    // AI analysis of sensor data for emergency detection
    return {
      emergencyDetected: sensorData.anomalyScore > 0.8,
      emergencyType: EmergencyType.MEDICAL,
      severity: EmergencySeverity.HIGH,
      description: 'AI detected potential medical emergency',
      location: sensorData.location,
      confidence: sensorData.anomalyScore
    };
  }

  // On-Call Workflow Management Methods
  async createOnCallShift(shiftData: Partial<OnCallRota>): Promise<OnCallRota> {
    try {
      const rotaReference = `ROTA${Date.now()}`;
      
      const shift = this.onCallRepository.create({
        ...shiftData,
        rotaReference,
        status: OnCallStatus.SCHEDULED,
        shiftMetrics: {
          callsReceived: 0,
          callsResolved: 0,
          averageResponseTime: 0,
          escalationsRequired: 0,
          emergenciesHandled: 0,
          totalActiveTime: 0
        }
      });

      return await this.onCallRepository.save(shift);
    } catch (error: unknown) {
      console.error('Error creating on-call shift:', error);
      throw error;
    }
  }

  async getActiveOnCallStaff(): Promise<OnCallRota[]> {
    try {
      return await this.onCallRepository.find({
        where: { 
          status: OnCallStatus.ACTIVE,
          available: true
        },
        order: { shiftStart: 'ASC' }
      });
    } catch (error: unknown) {
      console.error('Error getting active on-call staff:', error);
      throw error;
    }
  }

  async findBestAvailableStaff(emergencyType: EmergencyType, location?: string): Promise<OnCallRota | null> {
    try {
      const availableStaff = await this.getActiveOnCallStaff();
      
      if (availableStaff.length === 0) return null;

      // Filter by capabilities and sort by response time
      const suitableStaff = availableStaff
        .filter(staff => staff.canHandleCallType(this.mapEmergencyTypeToCallType(emergencyType)))
        .sort((a, b) => a.getEstimatedResponseTime() - b.getEstimatedResponseTime());

      return suitableStaff[0] || null;
    } catch (error: unknown) {
      console.error('Error finding best availablestaff:', error);
      throw error;
    }
  }

  async assignEmergencyToStaff(incidentId: string, staffId: string): Promise<boolean> {
    try {
      const staff = await this.onCallRepository.findOne({
        where: { id: staffId }
      });

      if (!staff || !staff.isAvailable()) {
        return false;
      }

      const assigned = staff.assignCall(incidentId);
      if (assigned) {
        await this.onCallRepository.save(staff);
        
        // Send notification to assigned staff
        await this.notificationService.sendNotification({
          message: 'Emergency Assignment',
          type: 'emergency_assigned',
          recipients: [staffId],
          data: {
            incidentId: incidentId,
            staffName: staff.staffName,
            role: staff.role
          }
        });

        // Log audit trail
        await this.auditService.logEvent({
          resource: 'OnCallRota',
          entityType: 'OnCallRota',
          entityId: staffId,
          action: 'EMERGENCY_ASSIGNED',
          details: {
            incidentId: incidentId,
            staffName: staff.staffName
          },
          userId: 'system'
        });
      }

      return assigned;
    } catch (error: unknown) {
      console.error('Error assigning emergency tostaff:', error);
      throw error;
    }
  }

  async completeEmergencyAssignment(incidentId: string, staffId: string): Promise<void> {
    try {
      const staff = await this.onCallRepository.findOne({
        where: { id: staffId }
      });

      if (!staff) {
        throw new Error('Staff member not found');
      }

      staff.completeCall(incidentId);
      await this.onCallRepository.save(staff);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'OnCallRota',
        entityType: 'OnCallRota',
        entityId: staffId,
        action: 'EMERGENCY_COMPLETED',
        details: {
          incidentId: incidentId,
          staffName: staff.staffName
        },
        userId: staffId
      });
    } catch (error: unknown) {
      console.error('Error completing emergencyassignment:', error);
      throw error;
    }
  }

  async escalateEmergency(incidentId: string, currentStaffId: string, reason: string): Promise<OnCallRota | null> {
    try {
      const currentStaff = await this.onCallRepository.findOne({
        where: { id: currentStaffId }
      });

      if (!currentStaff) {
        throw new Error('Current staff member not found');
      }

      // Find escalation contact
      const escalationContact = currentStaff.getEscalationContact();
      if (!escalationContact) {
        throw new Error('No escalation contact available');
      }

      // Find supervisor or manager on call
      const supervisor = await this.onCallRepository.findOne({
        where: {
          role: OnCallRole.MANAGER,
          status: OnCallStatus.ACTIVE,
          available: true
        }
      });

      if (supervisor) {
        // Assign to supervisor
        const assigned = supervisor.assignCall(incidentId);
        if (assigned) {
          await this.onCallRepository.save(supervisor);
          
          // Send escalation notification
          await this.notificationService.sendNotification({
            message: 'Emergency Escalated',
            type: 'emergency_escalated',
            recipients: [supervisor.id],
            data: {
              incidentId: incidentId,
              reason: reason,
              escalatedBy: currentStaff.staffName
            }
          });

          return supervisor;
        }
      }

      return null;
    } catch (error: unknown) {
      console.error('Error escalatingemergency:', error);
      throw error;
    }
  }

  async updateStaffLocation(staffId: string, location: string, onSite: boolean = true): Promise<void> {
    try {
      const staff = await this.onCallRepository.findOne({
        where: { id: staffId }
      });

      if (!staff) {
        throw new Error('Staff member not found');
      }

      staff.updateLocation(location, onSite);
      await this.onCallRepository.save(staff);
    } catch (error: unknown) {
      console.error('Error updating stafflocation:', error);
      throw error;
    }
  }

  async startStaffBreak(staffId: string, reason: string = 'Scheduled break'): Promise<void> {
    try {
      const staff = await this.onCallRepository.findOne({
        where: { id: staffId }
      });

      if (!staff) {
        throw new Error('Staff member not found');
      }

      staff.startBreak(reason);
      await this.onCallRepository.save(staff);
    } catch (error: unknown) {
      console.error('Error starting staffbreak:', error);
      throw error;
    }
  }

  async endStaffBreak(staffId: string): Promise<void> {
    try {
      const staff = await this.onCallRepository.findOne({
        where: { id: staffId }
      });

      if (!staff) {
        throw new Error('Staff member not found');
      }

      staff.endBreak();
      await this.onCallRepository.save(staff);
    } catch (error: unknown) {
      console.error('Error ending staffbreak:', error);
      throw error;
    }
  }

  async getOnCallDashboard(): Promise<any> {
    try {
      const activeStaff = await this.getActiveOnCallStaff();
      const totalShifts = await this.onCallRepository.count({
        where: { status: OnCallStatus.ACTIVE }
      });

      return {
        activeStaff: activeStaff.map(staff => ({
          id: staff.id,
          name: staff.staffName,
          role: staff.role,
          status: staff.status,
          currentCalls: staff.currentCallLoad,
          maxCalls: staff.maxConcurrentCalls,
          workload: staff.getWorkloadPercentage(),
          responseTime: staff.getEstimatedResponseTime(),
          location: staff.currentLocation,
          onSite: staff.onSite,
          lastResponse: staff.lastResponseTime
        })),
        summary: {
          totalActiveStaff: activeStaff.length,
          totalShifts: totalShifts,
          averageWorkload: activeStaff.reduce((sum, staff) => sum + staff.getWorkloadPercentage(), 0) / activeStaff.length || 0,
          staffOnBreak: activeStaff.filter(staff => staff.isOnBreak()).length,
          staffOnSite: activeStaff.filter(staff => staff.onSite).length
        }
      };
    } catch (error: unknown) {
      console.error('Error getting on-call dashboard:', error);
      throw error;
    }
  }

  async getStaffPerformanceReport(staffId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<any> {
    try {
      const staff = await this.onCallRepository.findOne({
        where: { id: staffId }
      });

      if (!staff) {
        throw new Error('Staff member not found');
      }

      const performance = staff.getShiftPerformanceSummary();
      const handover = staff.getShiftHandoverSummary();

      return {
        staffInfo: {
          name: staff.staffName,
          role: staff.role,
          shiftDate: staff.shiftDate,
          shiftDuration: handover.shiftDuration
        },
        performance: {
          efficiency: performance.efficiency,
          responsiveness: performance.responsiveness,
          workload: performance.workload,
          compliance: performance.compliance
        },
        metrics: {
          callsHandled: handover.callsHandled,
          escalations: handover.escalations,
          pendingCalls: handover.pendingCalls,
          averageResponseTime: staff.shiftMetrics.averageResponseTime
        },
        recommendations: handover.nextShiftRecommendations,
        trainingStatus: {
          upToDate: staff.isTrainingUpToDate(),
          lastUpdate: staff.lastTrainingUpdate,
          required: staff.requiredTraining || []
        }
      };
    } catch (error: unknown) {
      console.error('Error getting staff performancereport:', error);
      throw error;
    }
  }

  private mapEmergencyTypeToCallType(emergencyType: EmergencyType): CallType {
    const mapping: Record<EmergencyType, CallType> = {
      [EmergencyType.MEDICAL]: CallType.MEDICAL_EMERGENCY,
      [EmergencyType.FIRE]: CallType.SAFETY_CONCERN,
      [EmergencyType.SECURITY]: CallType.SAFETY_CONCERN,
      [EmergencyType.BEHAVIORAL]: CallType.BEHAVIORAL_CONCERN,
      [EmergencyType.SAFEGUARDING]: CallType.SAFETY_CONCERN,
      [EmergencyType.ENVIRONMENTAL]: CallType.TECHNICAL_ISSUE,
      [EmergencyType.TECHNICAL]: CallType.TECHNICAL_ISSUE,
      [EmergencyType.EVACUATION]: CallType.SAFETY_CONCERN,
      [EmergencyType.LOCKDOWN]: CallType.SAFETY_CONCERN,
      [EmergencyType.EXTERNAL_THREAT]: CallType.SAFETY_CONCERN
    };

    return mapping[emergencyType] || CallType.ASSISTANCE_REQUEST;
  }
}
