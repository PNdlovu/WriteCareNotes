import { Repository } from 'typeorm';
import { EventEmitter2 } from 'eventemitter2';
import AppDataSource from '../../config/database';
import { VisitorManagement } from '../../entities/visitor/VisitorManagement';
import { SecurityIntegrationService } from './SecurityIntegrationService';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';

export enum EmergencyType {
  FIRE = 'fire',
  MEDICAL = 'medical',
  SECURITY_BREACH = 'security_breach',
  LOCKDOWN = 'lockdown',
  EVACUATION = 'evacuation',
  SEVERE_WEATHER = 'severe_weather',
  CHEMICAL_SPILL = 'chemical_spill',
  BOMB_THREAT = 'bomb_threat',
  VIOLENT_INCIDENT = 'violent_incident',
  MISSING_PERSON = 'missing_person',
  POWER_OUTAGE = 'power_outage',
  SYSTEM_FAILURE = 'system_failure'
}

export enum EmergencyPriority {
  CRITICAL = 'critical',     // Life-threatening, immediate action required
  HIGH = 'high',            // Serious situation, urgent response needed
  MEDIUM = 'medium',        // Important but not immediately life-threatening
  LOW = 'low'              // Minor incident, standard procedures
}

export enum EmergencyStatus {
  ACTIVE = 'active',
  RESPONDING = 'responding',
  CONTAINED = 'contained',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled'
}

export enum LockdownLevel {
  NONE = 'none',
  PARTIAL = 'partial',       // Specific areas locked down
  FACILITY = 'facility',     // Entire facility locked down
  EXTERNAL = 'external',     // External threats, seal facility
  COMPLETE = 'complete'      // Complete lockdown, no movement
}

export interface EmergencyIncident {
  incidentId: string;
  type: EmergencyType;
  priority: EmergencyPriority;
  status: EmergencyStatus;
  title: string;
  description: string;
  location: {
    building: string;
    floor: string;
    room: string;
    coordinates?: { x: number; y: number };
  };
  reportedBy: {
    userId: string;
    name: string;
    role: string;
    contact: string;
  };
  reportedAt: Date;
  affectedAreas: string[];
  affectedPersons: {
    residents: string[];
    visitors: string[];
    staff: string[];
    estimatedTotal: number;
  };
  responseTeam: {
    incidentCommander: string;
    emergencyServices: string[];
    internalResponders: string[];
    externalAgencies: string[];
  };
  actions: Array<{
    actionId: string;
    timestamp: Date;
    action: string;
    performedBy: string;
    status: 'planned' | 'in_progress' | 'completed' | 'failed';
    notes?: string;
  }>;
  communications: Array<{
    messageId: string;
    timestamp: Date;
    type: 'internal' | 'external' | 'emergency_services' | 'family' | 'media';
    recipients: string[];
    message: string;
    sentBy: string;
    acknowledged: boolean;
  }>;
  resources: {
    emergencyServices: Array<{
      service: string;
      contactNumber: string;
      estimatedArrival?: Date;
      status: 'notified' | 'dispatched' | 'on_scene' | 'departed';
    }>;
    equipment: Array<{
      equipment: string;
      location: string;
      status: 'available' | 'deployed' | 'unavailable';
    }>;
    personnel: Array<{
      personId: string;
      name: string;
      role: string;
      status: 'available' | 'responding' | 'on_scene' | 'unavailable';
    }>;
  };
  evacuationData?: {
    evacuationRequired: boolean;
    evacuationZones: string[];
    evacuationRoutes: string[];
    assemblyPoints: string[];
    evacuationStatus: 'not_started' | 'in_progress' | 'completed';
    evacuatedPersons: number;
    unaccountedPersons: string[];
  };
  lockdownData?: {
    lockdownLevel: LockdownLevel;
    lockedAreas: string[];
    lockdownStartTime: Date;
    lockdownEndTime?: Date;
    accessExceptions: string[];
  };
  resolution: {
    resolvedAt?: Date;
    resolvedBy?: string;
    resolution: string;
    lessonsLearned: string[];
    followUpActions: string[];
    investigationRequired: boolean;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    documentsAttached: string[];
    mediaAttached: string[];
  };
}

export interface EmergencyResponse {
  responseId: string;
  incidentId: string;
  responseType: 'automated' | 'manual' | 'hybrid';
  protocols: Array<{
    protocolId: string;
    protocolName: string;
    triggerConditions: string[];
    actions: string[];
    timeframe: string;
    responsible: string[];
  }>;
  automation: {
    systemsActivated: string[];
    notificationsSent: string[];
    lockdownsInitiated: string[];
    evacuationTriggered: boolean;
    emergencyServicesNotified: string[];
  };
  timeline: Array<{
    timestamp: Date;
    event: string;
    source: 'system' | 'human' | 'sensor' | 'external';
    details: string;
  }>;
}

export class EmergencyResponseSystem {
  privatevisitorRepository: Repository<VisitorManagement>;
  privateeventEmitter: EventEmitter2;
  privatesecurityService: SecurityIntegrationService;
  privateauditTrailService: AuditService;
  privatenotificationService: NotificationService;
  
  privateactiveIncidents: Map<string, EmergencyIncident>;
  privateemergencyContacts: Map<string, any>;
  privateevacuationPlans: Map<string, any>;
  privateemergencyProtocols: Map<EmergencyType, any>;
  privatesystemStatus: 'normal' | 'alert' | 'emergency' | 'lockdown';

  const ructor(
    eventEmitter: EventEmitter2,
    securityService: SecurityIntegrationService,
    auditTrailService: AuditService,
    notificationService: NotificationService
  ) {
    this.visitorRepository = AppDataSource.getRepository(VisitorManagement);
    this.eventEmitter = eventEmitter;
    this.securityService = securityService;
    this.auditTrailService = auditTrailService;
    this.notificationService = notificationService;
    
    this.activeIncidents = new Map();
    this.emergencyContacts = new Map();
    this.evacuationPlans = new Map();
    this.emergencyProtocols = new Map();
    this.systemStatus = 'normal';

    this.initializeEmergencyProtocols();
    this.setupEventListeners();
    this.startSystemMonitoring();
  }

  /**
   * Declare emergency incident and initiate response
   */
  async declareEmergency(emergencyDetails: {
    type: EmergencyType;
    priority: EmergencyPriority;
    title: string;
    description: string;
    location: {
      building: string;
      floor: string;
      room: string;
      coordinates?: { x: number; y: number };
    };
    reportedBy: {
      userId: string;
      name: string;
      role: string;
      contact: string;
    };
    affectedAreas?: string[];
    estimatedAffectedPersons?: number;
  }): Promise<{
    incidentId: string;
    responseId: string;
    autoActionsTriggered: string[];
    estimatedResponseTime: number;
    emergencyServicesNotified: string[];
  }> {
    try {
      const incidentId = `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase();
      const responseId = `RESP-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase();

      // Create emergency incident
      const incident: EmergencyIncident = {
        incidentId,
        type: emergencyDetails.type,
        priority: emergencyDetails.priority,
        status: EmergencyStatus.ACTIVE,
        title: emergencyDetails.title,
        description: emergencyDetails.description,
        location: emergencyDetails.location,
        reportedBy: emergencyDetails.reportedBy,
        reportedAt: new Date(),
        affectedAreas: emergencyDetails.affectedAreas || [],
        affectedPersons: {
          residents: [],
          visitors: [],
          staff: [],
          estimatedTotal: emergencyDetails.estimatedAffectedPersons || 0
        },
        responseTeam: {
          incidentCommander: '',
          emergencyServices: [],
          internalResponders: [],
          externalAgencies: []
        },
        actions: [],
        communications: [],
        resources: {
          emergencyServices: [],
          equipment: [],
          personnel: []
        },
        resolution: {
          resolution: '',
          lessonsLearned: [],
          followUpActions: [],
          investigationRequired: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          documentsAttached: [],
          mediaAttached: []
        }
      };

      // Store active incident
      this.activeIncidents.set(incidentId, incident);

      // Get protocol for emergency type
      const protocol = this.emergencyProtocols.get(emergencyDetails.type);
      
      // Initiate automated response
      const autoActionsTriggered = await this.initiateAutomatedResponse(incident, protocol);
      
      // Determine if lockdown is required
      if (this.requiresLockdown(emergencyDetails.type, emergencyDetails.priority)) {
        const lockdownLevel = this.determineLockdownLevel(emergencyDetails.type, emergencyDetails.priority);
        await this.initiateLockdown(incidentId, lockdownLevel, emergencyDetails.affectedAreas || []);
      }

      // Determine if evacuation is required
      if (this.requiresEvacuation(emergencyDetails.type, emergencyDetails.priority)) {
        await this.initiateEvacuation(incidentId, emergencyDetails.affectedAreas || []);
      }

      // Notify emergency services
      const emergencyServicesNotified = await this.notifyEmergencyServices(incident);

      // Update system status
      this.updateSystemStatus(emergencyDetails.priority);

      // Send notifications
      await this.sendEmergencyNotifications(incident);

      // Log emergency declaration
      await this.auditTrailService.logActivity({
        userId: emergencyDetails.reportedBy.userId,
        action: 'DECLARE_EMERGENCY',
        resourceType: 'emergency_incident',
        resourceId: incidentId,
        details: {
          type: emergencyDetails.type,
          priority: emergencyDetails.priority,
          location: emergencyDetails.location
        },
        ipAddress: '127.0.0.1',
        userAgent: 'EmergencyResponseSystem'
      });

      // Emit emergency event
      this.eventEmitter.emit('emergency.declared', {
        incidentId,
        type: emergencyDetails.type,
        priority: emergencyDetails.priority,
        location: emergencyDetails.location
      });

      return {
        incidentId,
        responseId,
        autoActionsTriggered,
        estimatedResponseTime: this.calculateEstimatedResponseTime(emergencyDetails.type, emergencyDetails.priority),
        emergencyServicesNotified
      };

    } catch (error) {
      console.error('Error declaringemergency:', error);
      throw new Error('Failed to declare emergency incident');
    }
  }

  /**
   * Initiate facility lockdown
   */
  async initiateLockdown(
    incidentId: string,
    lockdownLevel: LockdownLevel,
    affectedAreas: string[] = []
  ): Promise<{
    lockdownId: string;
    lockdownLevel: LockdownLevel;
    areasLocked: string[];
    timeToComplete: number;
    accessExceptions: string[];
  }> {
    try {
      const lockdownId = `LOCK-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase();
      const lockdownStartTime = new Date();

      // Determine areas to lock based on level
      const areasToLock = this.getAreasForLockdown(lockdownLevel, affectedAreas);

      // Update incident with lockdown data
      const incident = this.activeIncidents.get(incidentId);
      if (incident) {
        incident.lockdownData = {
          lockdownLevel,
          lockedAreas: areasToLock,
          lockdownStartTime,
          accessExceptions: this.getAccessExceptions(lockdownLevel)
        };
        incident.status = EmergencyStatus.RESPONDING;
        this.activeIncidents.set(incidentId, incident);
      }

      // Execute lockdown through security service
      await this.securityService.initiateLockdown({
        lockdownId,
        level: lockdownLevel,
        affectedAreas: areasToLock,
        duration: this.getLockdownDuration(lockdownLevel),
        exceptions: this.getAccessExceptions(lockdownLevel),
        reason: `Emergency incident ${incidentId}`
      });

      // Lock all access points
      for (const area of areasToLock) {
        await this.securityService.lockAccessPoint(area, {
          lockType: 'emergency_lockdown',
          lockdownId,
          duration: this.getLockdownDuration(lockdownLevel),
          overrideLevel: this.getLockdownOverrideLevel(lockdownLevel)
        });
      }

      // Stop all visitor access
      await this.suspendVisitorAccess(incidentId, lockdownLevel);

      // Account for all persons on-site
      await this.accountForPersonsOnSite(incidentId);

      // Send lockdown notifications
      await this.sendLockdownNotifications(lockdownId, lockdownLevel, areasToLock);

      // Log lockdown initiation
      await this.auditTrailService.logActivity({
        userId: 'EMERGENCY_SYSTEM',
        action: 'INITIATE_LOCKDOWN',
        resourceType: 'emergency_lockdown',
        resourceId: lockdownId,
        details: {
          incidentId,
          lockdownLevel,
          areasLocked: areasToLock,
          startTime: lockdownStartTime
        },
        ipAddress: '127.0.0.1',
        userAgent: 'EmergencyResponseSystem'
      });

      // Emit lockdown event
      this.eventEmitter.emit('emergency.lockdown_initiated', {
        lockdownId,
        incidentId,
        lockdownLevel,
        areasLocked: areasToLock
      });

      return {
        lockdownId,
        lockdownLevel,
        areasLocked: areasToLock,
        timeToComplete: this.calculateLockdownTime(areasToLock.length),
        accessExceptions: this.getAccessExceptions(lockdownLevel)
      };

    } catch (error) {
      console.error('Error initiatinglockdown:', error);
      throw new Error('Failed to initiate emergency lockdown');
    }
  }

  /**
   * Initiate facility evacuation
   */
  async initiateEvacuation(
    incidentId: string,
    affectedAreas: string[] = []
  ): Promise<{
    evacuationId: string;
    evacuationZones: string[];
    evacuationRoutes: string[];
    assemblyPoints: string[];
    estimatedDuration: number;
    personsToEvacuate: number;
  }> {
    try {
      const evacuationId = `EVAC-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase();

      // Determine evacuation zones
      const evacuationZones = this.getEvacuationZones(affectedAreas);
      const evacuationRoutes = this.getEvacuationRoutes(evacuationZones);
      const assemblyPoints = this.getAssemblyPoints(evacuationZones);

      // Count persons to evacuate
      const personsToEvacuate = await this.countPersonsInAreas(evacuationZones);

      // Update incident with evacuation data
      const incident = this.activeIncidents.get(incidentId);
      if (incident) {
        incident.evacuationData = {
          evacuationRequired: true,
          evacuationZones,
          evacuationRoutes,
          assemblyPoints,
          evacuationStatus: 'in_progress',
          evacuatedPersons: 0,
          unaccountedPersons: []
        };
        this.activeIncidents.set(incidentId, incident);
      }

      // Activate evacuation alarms
      await this.securityService.activateEvacuationAlarms(evacuationZones);

      // Open emergency exits
      await this.securityService.unlockEmergencyExits(evacuationRoutes);

      // Activate emergency lighting
      await this.securityService.activateEmergencyLighting(evacuationZones.concat(evacuationRoutes));

      // Send evacuation announcements
      await this.sendEvacuationAnnouncements(evacuationZones, evacuationRoutes, assemblyPoints);

      // Dispatch evacuation wardens
      await this.dispatchEvacuationWardens(evacuationZones);

      // Track evacuation progress
      this.startEvacuationTracking(evacuationId, evacuationZones, assemblyPoints);

      // Log evacuation initiation
      await this.auditTrailService.logActivity({
        userId: 'EMERGENCY_SYSTEM',
        action: 'INITIATE_EVACUATION',
        resourceType: 'emergency_evacuation',
        resourceId: evacuationId,
        details: {
          incidentId,
          evacuationZones,
          evacuationRoutes,
          assemblyPoints,
          personsToEvacuate
        },
        ipAddress: '127.0.0.1',
        userAgent: 'EmergencyResponseSystem'
      });

      // Emit evacuation event
      this.eventEmitter.emit('emergency.evacuation_initiated', {
        evacuationId,
        incidentId,
        evacuationZones,
        personsToEvacuate
      });

      return {
        evacuationId,
        evacuationZones,
        evacuationRoutes,
        assemblyPoints,
        estimatedDuration: this.calculateEvacuationDuration(personsToEvacuate, evacuationZones.length),
        personsToEvacuate
      };

    } catch (error) {
      console.error('Error initiatingevacuation:', error);
      throw new Error('Failed to initiate emergency evacuation');
    }
  }

  /**
   * Update emergency incident status and actions
   */
  async updateIncidentStatus(
    incidentId: string,
    updates: {
      status?: EmergencyStatus;
      actions?: Array<{
        action: string;
        performedBy: string;
        status: 'planned' | 'in_progress' | 'completed' | 'failed';
        notes?: string;
      }>;
      communications?: Array<{
        type: 'internal' | 'external' | 'emergency_services' | 'family' | 'media';
        recipients: string[];
        message: string;
        sentBy: string;
      }>;
      resolution?: {
        resolution: string;
        lessonsLearned: string[];
        followUpActions: string[];
        investigationRequired: boolean;
      };
    }
  ): Promise<{ success: boolean; incidentStatus: EmergencyStatus; updatedAt: Date }> {
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      // Update status
      if (updates.status) {
        incident.status = updates.status;
      }

      // Add actions
      if (updates.actions) {
        for (const action of updates.actions) {
          incident.actions.push({
            actionId: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date(),
            ...action
          });
        }
      }

      // Add communications
      if (updates.communications) {
        for (const communication of updates.communications) {
          incident.communications.push({
            messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date(),
            acknowledged: false,
            ...communication
          });
        }
      }

      // Update resolution
      if (updates.resolution) {
        incident.resolution = {
          resolvedAt: new Date(),
          resolvedBy: 'SYSTEM',
          ...updates.resolution
        };
      }

      // Update metadata
      incident.metadata.updatedAt = new Date();
      incident.metadata.version++;

      // Store updated incident
      this.activeIncidents.set(incidentId, incident);

      // If incident is resolved, handle cleanup
      if (updates.status === EmergencyStatus.RESOLVED) {
        await this.resolveEmergency(incidentId);
      }

      // Log incident update
      await this.auditTrailService.logActivity({
        userId: 'EMERGENCY_SYSTEM',
        action: 'UPDATE_INCIDENT',
        resourceType: 'emergency_incident',
        resourceId: incidentId,
        details: {
          updates,
          newStatus: incident.status
        },
        ipAddress: '127.0.0.1',
        userAgent: 'EmergencyResponseSystem'
      });

      // Emit update event
      this.eventEmitter.emit('emergency.incident_updated', {
        incidentId,
        status: incident.status,
        updates
      });

      return {
        success: true,
        incidentStatus: incident.status,
        updatedAt: incident.metadata.updatedAt
      };

    } catch (error) {
      console.error('Error updating incidentstatus:', error);
      throw new Error('Failed to update emergency incident status');
    }
  }

  /**
   * Resolve emergency and restore normal operations
   */
  async resolveEmergency(incidentId: string): Promise<{
    success: boolean;
    resolvedAt: Date;
    systemStatus: string;
    restorationActions: string[];
  }> {
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      const resolvedAt = new Date();
      const restorationActions: string[] = [];

      // End lockdown if active
      if (incident.lockdownData && !incident.lockdownData.lockdownEndTime) {
        await this.endLockdown(incidentId);
        restorationActions.push('Emergency lockdown ended');
      }

      // Complete evacuation accounting if needed
      if (incident.evacuationData && incident.evacuationData.evacuationStatus === 'in_progress') {
        await this.completeEvacuationAccounting(incidentId);
        restorationActions.push('Evacuation accounting completed');
      }

      // Restore visitor access
      await this.restoreVisitorAccess(incidentId);
      restorationActions.push('Visitor access restored');

      // Restore security systems to normal
      await this.restoreSecuritySystems(incidentId);
      restorationActions.push('Security systems restored to normal operation');

      // Mark incident as resolved
      incident.status = EmergencyStatus.RESOLVED;
      incident.resolution.resolvedAt = resolvedAt;
      incident.metadata.updatedAt = resolvedAt;

      // Remove from active incidents
      this.activeIncidents.delete(incidentId);

      // Update system status
      this.updateSystemStatusAfterResolution();

      // Send all-clear notifications
      await this.sendAllClearNotifications(incident);
      restorationActions.push('All-clear notifications sent');

      // Generate incident report
      await this.generateIncidentReport(incident);
      restorationActions.push('Incident report generated');

      // Log emergency resolution
      await this.auditTrailService.logActivity({
        userId: 'EMERGENCY_SYSTEM',
        action: 'RESOLVE_EMERGENCY',
        resourceType: 'emergency_incident',
        resourceId: incidentId,
        details: {
          resolvedAt,
          restorationActions,
          finalStatus: incident.status
        },
        ipAddress: '127.0.0.1',
        userAgent: 'EmergencyResponseSystem'
      });

      // Emit resolution event
      this.eventEmitter.emit('emergency.resolved', {
        incidentId,
        resolvedAt,
        systemStatus: this.systemStatus
      });

      return {
        success: true,
        resolvedAt,
        systemStatus: this.systemStatus,
        restorationActions
      };

    } catch (error) {
      console.error('Error resolvingemergency:', error);
      throw new Error('Failed to resolve emergency incident');
    }
  }

  /**
   * Get real-time emergency status and active incidents
   */
  async getEmergencyStatus(): Promise<{
    systemStatus: string;
    activeIncidents: EmergencyIncident[];
    emergencyCapabilities: {
      lockdownReady: boolean;
      evacuationReady: boolean;
      emergencyServicesConnected: boolean;
      communicationSystemsOperational: boolean;
    };
    currentPersonsOnSite: {
      residents: number;
      visitors: number;
      staff: number;
      contractors: number;
    };
    emergencyResources: {
      availablePersonnel: number;
      equipmentStatus: { [equipment: string]: string };
      emergencyServices: { [service: string]: string };
    };
  }> {
    try {
      const activeIncidents = Array.from(this.activeIncidents.values());
      const personsOnSite = await this.getCurrentPersonsOnSite();
      const emergencyCapabilities = await this.checkEmergencyCapabilities();
      const emergencyResources = await this.getEmergencyResourceStatus();

      return {
        systemStatus: this.systemStatus,
        activeIncidents,
        emergencyCapabilities,
        currentPersonsOnSite: personsOnSite,
        emergencyResources
      };

    } catch (error) {
      console.error('Error getting emergencystatus:', error);
      throw new Error('Failed to get emergency status');
    }
  }

  /**
   * Test emergency systems and procedures
   */
  async testEmergencySystem(testType: 'lockdown' | 'evacuation' | 'communication' | 'comprehensive'): Promise<{
    testId: string;
    testType: string;
    testResults: {
      systemsResponded: string[];
      responseTime: number;
      successRate: number;
      issuesIdentified: string[];
    };
    recommendations: string[];
  }> {
    try {
      const testId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase();
      const testStartTime = new Date();

      let testResults: any = {
        systemsResponded: [],
        responseTime: 0,
        successRate: 0,
        issuesIdentified: []
      };

      let recommendations: string[] = [];

      switch (testType) {
        case 'lockdown':
          testResults = await this.testLockdownSystems();
          break;
        case 'evacuation':
          testResults = await this.testEvacuationSystems();
          break;
        case 'communication':
          testResults = await this.testCommunicationSystems();
          break;
        case 'comprehensive':
          testResults = await this.testAllEmergencySystems();
          break;
      }

      testResults.responseTime = Date.now() - testStartTime.getTime();

      // Generate recommendations based on test results
      recommendations = this.generateTestRecommendations(testResults);

      // Log test execution
      await this.auditTrailService.logActivity({
        userId: 'EMERGENCY_SYSTEM',
        action: 'TEST_EMERGENCY_SYSTEM',
        resourceType: 'emergency_test',
        resourceId: testId,
        details: {
          testType,
          testResults,
          recommendations
        },
        ipAddress: '127.0.0.1',
        userAgent: 'EmergencyResponseSystem'
      });

      return {
        testId,
        testType,
        testResults,
        recommendations
      };

    } catch (error) {
      console.error('Error testing emergencysystem:', error);
      throw new Error('Failed to test emergency system');
    }
  }

  // Private helper methods

  private initializeEmergencyProtocols(): void {
    // Initialize protocols for each emergency type
    this.emergencyProtocols.set(EmergencyType.FIRE, {
      autoActions: ['activate_fire_alarms', 'notify_fire_service', 'unlock_fire_exits'],
      evacuationRequired: true,
      lockdownRequired: false,
      emergencyServices: ['fire_service', 'ambulance'],
      estimatedResponseTime: 8
    });

    this.emergencyProtocols.set(EmergencyType.MEDICAL, {
      autoActions: ['notify_ambulance', 'clear_access_routes', 'prepare_medical_area'],
      evacuationRequired: false,
      lockdownRequired: false,
      emergencyServices: ['ambulance'],
      estimatedResponseTime: 12
    });

    this.emergencyProtocols.set(EmergencyType.SECURITY_BREACH, {
      autoActions: ['lockdown_affected_areas', 'notify_police', 'review_cctv'],
      evacuationRequired: false,
      lockdownRequired: true,
      emergencyServices: ['police'],
      estimatedResponseTime: 15
    });

    this.emergencyProtocols.set(EmergencyType.LOCKDOWN, {
      autoActions: ['initiate_lockdown', 'account_for_persons', 'notify_authorities'],
      evacuationRequired: false,
      lockdownRequired: true,
      emergencyServices: ['police'],
      estimatedResponseTime: 20
    });

    // Add more protocols as needed
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('security.alarm_triggered', (data) => {
      this.handleSecurityAlarm(data);
    });

    this.eventEmitter.on('fire.alarm_triggered', (data) => {
      this.handleFireAlarm(data);
    });

    this.eventEmitter.on('medical.emergency', (data) => {
      this.handleMedicalEmergency(data);
    });

    this.eventEmitter.on('visitor.incident', (data) => {
      this.handleVisitorIncident(data);
    });
  }

  private startSystemMonitoring(): void {
    // Monitor system health and emergency readiness
    setInterval(async () => {
      try {
        await this.checkSystemHealth();
        await this.validateEmergencyReadiness();
      } catch (error) {
        console.error('Error in systemmonitoring:', error);
      }
    }, 60000); // Check every minute
  }

  private async initiateAutomatedResponse(incident: EmergencyIncident, protocol: any): Promise<string[]> {
    const actionsTriggered: string[] = [];

    if (protocol?.autoActions) {
      for (const action of protocol.autoActions) {
        try {
          await this.executeAutomatedAction(action, incident);
          actionsTriggered.push(action);
        } catch (error) {
          console.error(`Failed to execute automated action ${action}:`, error);
        }
      }
    }

    return actionsTriggered;
  }

  private async executeAutomatedAction(action: string, incident: EmergencyIncident): Promise<void> {
    switch (action) {
      case 'activate_fire_alarms':
        await this.securityService.activateFireAlarms(incident.affectedAreas);
        break;
      case 'unlock_fire_exits':
        await this.securityService.unlockFireExits();
        break;
      case 'lockdown_affected_areas':
        await this.securityService.lockdownAreas(incident.affectedAreas);
        break;
      case 'notify_fire_service':
        await this.notifyEmergencyService('fire_service', incident);
        break;
      case 'notify_ambulance':
        await this.notifyEmergencyService('ambulance', incident);
        break;
      case 'notify_police':
        await this.notifyEmergencyService('police', incident);
        break;
      // Add more automated actions as needed
    }
  }

  private requiresLockdown(type: EmergencyType, priority: EmergencyPriority): boolean {
    const lockdownTypes = [
      EmergencyType.SECURITY_BREACH,
      EmergencyType.LOCKDOWN,
      EmergencyType.BOMB_THREAT,
      EmergencyType.VIOLENT_INCIDENT
    ];

    return lockdownTypes.includes(type) || priority === EmergencyPriority.CRITICAL;
  }

  private requiresEvacuation(type: EmergencyType, priority: EmergencyPriority): boolean {
    const evacuationTypes = [
      EmergencyType.FIRE,
      EmergencyType.BOMB_THREAT,
      EmergencyType.CHEMICAL_SPILL,
      EmergencyType.SEVERE_WEATHER
    ];

    return evacuationTypes.includes(type);
  }

  private determineLockdownLevel(type: EmergencyType, priority: EmergencyPriority): LockdownLevel {
    if (priority === EmergencyPriority.CRITICAL) {
      return LockdownLevel.COMPLETE;
    }

    switch (type) {
      case EmergencyType.SECURITY_BREACH:
        return LockdownLevel.PARTIAL;
      case EmergencyType.BOMB_THREAT:
        return LockdownLevel.EXTERNAL;
      case EmergencyType.VIOLENT_INCIDENT:
        return LockdownLevel.FACILITY;
      default:
        return LockdownLevel.PARTIAL;
    }
  }

  private getAreasForLockdown(level: LockdownLevel, affectedAreas: string[]): string[] {
    switch (level) {
      case LockdownLevel.PARTIAL:
        return affectedAreas;
      case LockdownLevel.FACILITY:
        return ['reception', 'common_areas', 'resident_areas', 'admin_areas'];
      case LockdownLevel.EXTERNAL:
        return ['main_entrance', 'emergency_exits', 'visitor_areas'];
      case LockdownLevel.COMPLETE:
        return ['all_areas'];
      default:
        return affectedAreas;
    }
  }

  private getAccessExceptions(level: LockdownLevel): string[] {
    switch (level) {
      case LockdownLevel.PARTIAL:
        return ['emergency_services', 'incident_commander'];
      case LockdownLevel.FACILITY:
        return ['emergency_services'];
      case LockdownLevel.EXTERNAL:
        return ['emergency_services', 'authorized_personnel'];
      case LockdownLevel.COMPLETE:
        return ['emergency_services'];
      default:
        return [];
    }
  }

  private getLockdownDuration(level: LockdownLevel): number {
    // Return duration in minutes
    switch (level) {
      case LockdownLevel.PARTIAL:
        return 30;
      case LockdownLevel.FACILITY:
        return 60;
      case LockdownLevel.EXTERNAL:
        return 120;
      case LockdownLevel.COMPLETE:
        return 240;
      default:
        return 30;
    }
  }

  private getLockdownOverrideLevel(level: LockdownLevel): string {
    switch (level) {
      case LockdownLevel.PARTIAL:
        return 'manager';
      case LockdownLevel.FACILITY:
        return 'incident_commander';
      case LockdownLevel.EXTERNAL:
        return 'emergency_services';
      case LockdownLevel.COMPLETE:
        return 'emergency_services';
      default:
        return 'manager';
    }
  }

  private calculateEstimatedResponseTime(type: EmergencyType, priority: EmergencyPriority): number {
    const protocol = this.emergencyProtocols.get(type);
    let baseTime = protocol?.estimatedResponseTime || 15;

    // Adjust based on priority
    switch (priority) {
      case EmergencyPriority.CRITICAL:
        return baseTime * 0.5;
      case EmergencyPriority.HIGH:
        return baseTime * 0.7;
      case EmergencyPriority.MEDIUM:
        return baseTime;
      case EmergencyPriority.LOW:
        return baseTime * 1.5;
      default:
        return baseTime;
    }
  }

  private calculateLockdownTime(areaCount: number): number {
    // Estimate lockdown completion time based on number of areas
    return Math.max(2, Math.min(15, areaCount * 1.5)); // 2-15 minutes
  }

  private async suspendVisitorAccess(incidentId: string, lockdownLevel: LockdownLevel): Promise<void> {
    // Implementation to suspend all visitor access during emergency
    const visitors = await this.visitorRepository.find({
      where: { isActive: true }
    });

    for (const visitor of visitors) {
      // Record current visit status and suspend access
      // Implementation would update visitor access permissions
    }
  }

  private async accountForPersonsOnSite(incidentId: string): Promise<void> {
    // Implementation to account for all persons currently on-site
    const personsOnSite = await this.getCurrentPersonsOnSite();
    
    const incident = this.activeIncidents.get(incidentId);
    if (incident) {
      incident.affectedPersons = {
        residents: [], // Would be populated with actual resident IDs
        visitors: [], // Would be populated with actual visitor IDs
        staff: [], // Would be populated with actual staff IDs
        estimatedTotal: personsOnSite.residents + personsOnSite.visitors + personsOnSite.staff + personsOnSite.contractors
      };
    }
  }

  private async getCurrentPersonsOnSite(): Promise<{
    residents: number;
    visitors: number;
    staff: number;
    contractors: number;
  }> {
    // Mock implementation - would integrate with actual occupancy tracking
    return {
      residents: 45,
      visitors: 8,
      staff: 12,
      contractors: 2
    };
  }

  private async checkEmergencyCapabilities(): Promise<{
    lockdownReady: boolean;
    evacuationReady: boolean;
    emergencyServicesConnected: boolean;
    communicationSystemsOperational: boolean;
  }> {
    // Mock implementation - would check actual system status
    return {
      lockdownReady: true,
      evacuationReady: true,
      emergencyServicesConnected: true,
      communicationSystemsOperational: true
    };
  }

  private async getEmergencyResourceStatus(): Promise<any> {
    // Mock implementation - would check actual resource availability
    return {
      availablePersonnel: 15,
      equipmentStatus: {
        'fire_extinguishers': 'ready',
        'emergency_lighting': 'ready',
        'communication_system': 'ready',
        'evacuation_chairs': 'ready'
      },
      emergencyServices: {
        'fire_service': 'available',
        'ambulance': 'available',
        'police': 'available'
      }
    };
  }

  private updateSystemStatus(priority: EmergencyPriority): void {
    switch (priority) {
      case EmergencyPriority.CRITICAL:
        this.systemStatus = 'emergency';
        break;
      case EmergencyPriority.HIGH:
        this.systemStatus = 'alert';
        break;
      default:
        if (this.systemStatus === 'normal') {
          this.systemStatus = 'alert';
        }
        break;
    }
  }

  private updateSystemStatusAfterResolution(): void {
    if (this.activeIncidents.size === 0) {
      this.systemStatus = 'normal';
    } else {
      // Check remaining incidents to determine appropriate status
      const remainingIncidents = Array.from(this.activeIncidents.values());
      const highestPriority = remainingIncidents.reduce((highest, incident) => {
        return incident.priority === EmergencyPriority.CRITICAL ? EmergencyPriority.CRITICAL :
               incident.priority === EmergencyPriority.HIGH ? EmergencyPriority.HIGH :
               highest;
      }, EmergencyPriority.LOW);

      this.updateSystemStatus(highestPriority);
    }
  }

  private async notifyEmergencyServices(incident: EmergencyIncident): Promise<string[]> {
    const protocol = this.emergencyProtocols.get(incident.type);
    const servicesToNotify = protocol?.emergencyServices || [];

    for (const service of servicesToNotify) {
      await this.notifyEmergencyService(service, incident);
    }

    return servicesToNotify;
  }

  private async notifyEmergencyService(service: string, incident: EmergencyIncident): Promise<void> {
    // Implementation would integrate with actual emergency service notification systems
    console.log(`Notifying ${service} about incident ${incident.incidentId}`);
  }

  private async sendEmergencyNotifications(incident: EmergencyIncident): Promise<void> {
    // Send notifications to staff, management, and relevant parties
    await this.notificationService.sendEmergencyNotification({
      priority: 'critical',
      title: `Emergency: ${incident.title}`,
      message: incident.description,
      recipients: ['all_staff', 'management', 'emergency_contacts'],
      channels: ['push', 'sms', 'email', 'pa_system']
    });
  }

  private async sendLockdownNotifications(lockdownId: string, level: LockdownLevel, areas: string[]): Promise<void> {
    await this.notificationService.sendEmergencyNotification({
      priority: 'critical',
      title: `Lockdown Initiated - Level ${level}`,
      message: `Emergency lockdown has been initiated. Affectedareas: ${areas.join(', ')}. Follow lockdown procedures.`,
      recipients: ['all_persons_on_site'],
      channels: ['pa_system', 'push', 'sms']
    });
  }

  private async sendEvacuationAnnouncements(zones: string[], routes: string[], assemblyPoints: string[]): Promise<void> {
    await this.notificationService.sendEmergencyNotification({
      priority: 'critical',
      title: 'Evacuation Order',
      message: `Immediate evacuation required fromzones: ${zones.join(', ')}. Useroutes: ${routes.join(', ')}. Proceed to assemblypoints: ${assemblyPoints.join(', ')}.`,
      recipients: ['all_persons_in_zones'],
      channels: ['pa_system', 'evacuation_alarms', 'push']
    });
  }

  private async sendAllClearNotifications(incident: EmergencyIncident): Promise<void> {
    await this.notificationService.sendEmergencyNotification({
      priority: 'normal',
      title: 'All Clear - Emergency Resolved',
      message: `Emergency situation has been resolved. Normal operations are resuming. Thank you for your cooperation.`,
      recipients: ['all_persons_on_site'],
      channels: ['pa_system', 'push', 'email']
    });
  }

  // Additional helper methods would be implemented herefor:
  // - getEvacuationZones()
  // - getEvacuationRoutes()
  // - getAssemblyPoints()
  // - countPersonsInAreas()
  // - dispatchEvacuationWardens()
  // - startEvacuationTracking()
  // - endLockdown()
  // - completeEvacuationAccounting()
  // - restoreVisitorAccess()
  // - restoreSecuritySystems()
  // - generateIncidentReport()
  // - handleSecurityAlarm()
  // - handleFireAlarm()
  // - handleMedicalEmergency()
  // - handleVisitorIncident()
  // - checkSystemHealth()
  // - validateEmergencyReadiness()
  // - testLockdownSystems()
  // - testEvacuationSystems()
  // - testCommunicationSystems()
  // - testAllEmergencySystems()
  // - generateTestRecommendations()

  private getEvacuationZones(affectedAreas: string[]): string[] {
    // Mock implementation
    return affectedAreas.length > 0 ? affectedAreas : ['zone_a', 'zone_b'];
  }

  private getEvacuationRoutes(zones: string[]): string[] {
    // Mock implementation
    return ['route_1', 'route_2', 'emergency_exit_a', 'emergency_exit_b'];
  }

  private getAssemblyPoints(zones: string[]): string[] {
    // Mock implementation
    return ['assembly_point_1', 'assembly_point_2'];
  }

  private async countPersonsInAreas(areas: string[]): Promise<number> {
    // Mock implementation
    return 67; // Would calculate actual persons in specified areas
  }

  private async dispatchEvacuationWardens(zones: string[]): Promise<void> {
    // Implementation to dispatch evacuation wardens to zones
    console.log(`Dispatching evacuation wardens tozones: ${zones.join(', ')}`);
  }

  private startEvacuationTracking(evacuationId: string, zones: string[], assemblyPoints: string[]): void {
    // Implementation to start tracking evacuation progress
    console.log(`Starting evacuation tracking for ${evacuationId}`);
  }

  private async endLockdown(incidentId: string): Promise<void> {
    const incident = this.activeIncidents.get(incidentId);
    if (incident?.lockdownData) {
      incident.lockdownData.lockdownEndTime = new Date();
      await this.securityService.endLockdown(incident.lockdownData.lockedAreas);
    }
  }

  private async completeEvacuationAccounting(incidentId: string): Promise<void> {
    const incident = this.activeIncidents.get(incidentId);
    if (incident?.evacuationData) {
      incident.evacuationData.evacuationStatus = 'completed';
      // Implementation would verify all persons accounted for
    }
  }

  private async restoreVisitorAccess(incidentId: string): Promise<void> {
    // Implementation to restore normal visitor access
    console.log(`Restoring visitor access after incident ${incidentId}`);
  }

  private async restoreSecuritySystems(incidentId: string): Promise<void> {
    // Implementation to restore security systems to normal operation
    await this.securityService.restoreNormalOperation();
  }

  private async generateIncidentReport(incident: EmergencyIncident): Promise<void> {
    // Implementation to generate comprehensive incident report
    console.log(`Generating incident report for ${incident.incidentId}`);
  }

  private async handleSecurityAlarm(data: any): Promise<void> {
    // Auto-declare security emergency if alarm is critical
    if (data.severity === 'critical') {
      await this.declareEmergency({
        type: EmergencyType.SECURITY_BREACH,
        priority: EmergencyPriority.HIGH,
        title: `Security Alarm: ${data.location}`,
        description: `Security alarm triggered at ${data.location}`,
        location: data.location,
        reportedBy: {
          userId: 'SECURITY_SYSTEM',
          name: 'Security System',
          role: 'System',
          contact: 'security@facility.com'
        }
      });
    }
  }

  private async handleFireAlarm(data: any): Promise<void> {
    // Auto-declare fire emergency
    await this.declareEmergency({
      type: EmergencyType.FIRE,
      priority: EmergencyPriority.CRITICAL,
      title: `Fire Alarm: ${data.location}`,
      description: `Fire alarm triggered at ${data.location}`,
      location: data.location,
      reportedBy: {
        userId: 'FIRE_SYSTEM',
        name: 'Fire Detection System',
        role: 'System',
        contact: 'fire@facility.com'
      }
    });
  }

  private async handleMedicalEmergency(data: any): Promise<void> {
    // Auto-declare medical emergency
    await this.declareEmergency({
      type: EmergencyType.MEDICAL,
      priority: data.priority || EmergencyPriority.HIGH,
      title: `Medical Emergency: ${data.description}`,
      description: data.description,
      location: data.location,
      reportedBy: data.reportedBy
    });
  }

  private async handleVisitorIncident(data: any): Promise<void> {
    // Assess if visitor incident requires emergency response
    if (data.severity === 'high' || data.type === 'violent') {
      await this.declareEmergency({
        type: EmergencyType.VIOLENT_INCIDENT,
        priority: EmergencyPriority.HIGH,
        title: `Visitor Incident: ${data.description}`,
        description: data.description,
        location: data.location,
        reportedBy: data.reportedBy
      });
    }
  }

  private async checkSystemHealth(): Promise<void> {
    // Implementation to check system health
    // Would verify all emergency systems are operational
  }

  private async validateEmergencyReadiness(): Promise<void> {
    // Implementation to validate emergency readiness
    // Would check personnel availability, equipment status, etc.
  }

  private async testLockdownSystems(): Promise<any> {
    // Implementation to test lockdown systems
    return {
      systemsResponded: ['access_control', 'door_locks', 'notification_system'],
      responseTime: 3000,
      successRate: 100,
      issuesIdentified: []
    };
  }

  private async testEvacuationSystems(): Promise<any> {
    // Implementation to test evacuation systems
    return {
      systemsResponded: ['evacuation_alarms', 'emergency_lighting', 'pa_system'],
      responseTime: 2500,
      successRate: 98,
      issuesIdentified: ['PA system delay in zone B']
    };
  }

  private async testCommunicationSystems(): Promise<any> {
    // Implementation to test communication systems
    return {
      systemsResponded: ['notification_service', 'sms_gateway', 'email_system'],
      responseTime: 1500,
      successRate: 95,
      issuesIdentified: ['SMS gateway timeout']
    };
  }

  private async testAllEmergencySystems(): Promise<any> {
    // Implementation to test all emergency systems
    const lockdownTest = await this.testLockdownSystems();
    const evacuationTest = await this.testEvacuationSystems();
    const communicationTest = await this.testCommunicationSystems();

    return {
      systemsResponded: [
        ...lockdownTest.systemsResponded,
        ...evacuationTest.systemsResponded,
        ...communicationTest.systemsResponded
      ],
      responseTime: Math.max(lockdownTest.responseTime, evacuationTest.responseTime, communicationTest.responseTime),
      successRate: (lockdownTest.successRate + evacuationTest.successRate + communicationTest.successRate) / 3,
      issuesIdentified: [
        ...lockdownTest.issuesIdentified,
        ...evacuationTest.issuesIdentified,
        ...communicationTest.issuesIdentified
      ]
    };
  }

  private generateTestRecommendations(testResults: any): string[] {
    const recommendations: string[] = [];

    if (testResults.successRate < 100) {
      recommendations.push('Address identified system issues to achieve 100% success rate');
    }

    if (testResults.responseTime > 5000) {
      recommendations.push('Optimize system response time to under 5 seconds');
    }

    if (testResults.issuesIdentified.length > 0) {
      recommendations.push(`Resolve specificissues: ${testResults.issuesIdentified.join(', ')}`);
    }

    recommendations.push('Schedule regular emergency system testing');
    recommendations.push('Provide refresher training for emergency procedures');

    return recommendations;
  }
}

export default EmergencyResponseSystem;
