/**
 * @fileoverview domiciliary Service
 * @module Domiciliary/DomiciliaryService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description domiciliary Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';

import { ResidentStatus } from '../entities/Resident';
import AppDataSource from '../../config/database';
import { ServiceUser, ServiceUserStatus } from '../../entities/domiciliary/ServiceUser';
import { CareVisit, VisitStatus, VisitType, VerificationMethod } from '../../entities/domiciliary/CareVisit';
import { Employee } from '../../entities/hr/Employee';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export interface VisitSchedulingData {
  serviceUserId: string;
  careWorkerId: string;
  type: VisitType;
  scheduledStartTime: Date;
  plannedDuration: number; // minutes
  scheduledTasks: any[];
  specialInstructions?: string;
}

export interface RouteOptimization {
  careWorkerId: string;
  date: Date;
  visits: {
    visitId: string;
    serviceUserId: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
    duration: number;
    timeWindow: { start: Date; end: Date };
    priority: number;
  }[];
  optimizedRoute: {
    visitOrder: string[];
    totalDistance: number;
    totalTravelTime: number;
    estimatedFuelCost: number;
  };
}

export interface CareWorkerLocation {
  careWorkerId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  isOnDuty: boolean;
  currentVisitId?: string;
  batteryLevel?: number;
  signalStrength?: number;
}

export interface EmergencyAlert {
  id: string;
  type: 'medical' | 'safety' | 'security' | 'welfare' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  serviceUserId?: string;
  careWorkerId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  timestamp: Date;
  status: ResidentStatus.ACTIVE | 'acknowledged' | 'resolved';
  responders: string[];
  resolution?: string;
  resolvedAt?: Date;
}

export interface DomiciliaryMetrics {
  totalServiceUsers: number;
  activeServiceUsers: number;
  totalVisitsToday: number;
  completedVisitsToday: number;
  missedVisitsToday: number;
  averageVisitDuration: number;
  onTimePercentage: number;
  serviceUserSatisfaction: number;
  careWorkerUtilization: number;
  emergencyCallsToday: number;
  totalTravelTime: number;
  totalTravelCost: number;
}

export class DomiciliaryService {
  private serviceUserRepository: Repository<ServiceUser>;
  private careVisitRepository: Repository<CareVisit>;
  private employeeRepository: Repository<Employee>;
  private notificationService: NotificationService;
  private auditService: AuditService;

  // In-memory tracking for real-time features
  private careWorkerLocations: Map<string, CareWorkerLocation> = new Map();
  private activeEmergencies: Map<string, EmergencyAlert> = new Map();

  constructor() {
    this.serviceUserRepository = AppDataSource.getRepository(ServiceUser);
    this.careVisitRepository = AppDataSource.getRepository(CareVisit);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  // Service User Management
  async createServiceUser(serviceUserData: Partial<ServiceUser>): Promise<ServiceUser> {
    const serviceUserNumber = await this.generateServiceUserNumber();
    
    const serviceUser = this.serviceUserRepository.create({
      ...serviceUserData,
      serviceUserNumber,
      status: ServiceUserStatus.ACTIVE
    });

    const savedServiceUser = await this.serviceUserRepository.save(serviceUser);

    // Generate QR code for service user location
    await this.generateLocationQRCode(savedServiceUser.id);

    await this.auditService.logEvent({
      resource: 'ServiceUser',
        entityType: 'ServiceUser',
      entityId: savedServiceUser.id,
      action: 'CREATE',
      details: { 
        serviceUserNumber: savedServiceUser.serviceUserNumber,
        name: savedServiceUser.getFullName(),
        address: savedServiceUser.getFullAddress()
      },
      userId: 'system'
    });

    return savedServiceUser;
  }

  async updateServiceUser(serviceUserId: string, updates: Partial<ServiceUser>): Promise<ServiceUser> {
    const serviceUser = await this.serviceUserRepository.findOne({ 
      where: { id: serviceUserId } 
    });
    
    if (!serviceUser) {
      throw new Error('Service user not found');
    }

    Object.assign(serviceUser, updates);
    const updatedServiceUser = await this.serviceUserRepository.save(serviceUser);

    await this.auditService.logEvent({
      resource: 'ServiceUser',
        entityType: 'ServiceUser',
      entityId: serviceUserId,
      action: 'UPDATE',
      details: { updates },
      userId: 'system'
    });

    return updatedServiceUser;
  }

  // Visit Scheduling and Management
  async scheduleVisit(visitData: VisitSchedulingData): Promise<CareVisit> {
    const visitNumber = await this.generateVisitNumber();
    
    const visit = this.careVisitRepository.create({
      ...visitData,
      visitNumber,
      scheduledEndTime: new Date(visitData.scheduledStartTime.getTime() + visitData.plannedDuration * 60 * 1000),
      status: VisitStatus.SCHEDULED
    });

    const savedVisit = await this.careVisitRepository.save(visit);

    // Send notification to care worker
    await this.notificationService.sendNotification({
      message: 'Notification: Visit Scheduled',
        type: 'visit_scheduled',
      recipients: [visitData.careWorkerId],
      data: {
        visitId: savedVisit.id,
        visitNumber: savedVisit.visitNumber,
        serviceUser: savedVisit.serviceUser?.getFullName(),
        scheduledTime: visitData.scheduledStartTime.toISOString()
      }
    });

    return savedVisit;
  }

  async startVisit(
    visitId: string, 
    careWorkerId: string, 
    location: { latitude: number; longitude: number },
    verificationData?: any
  ): Promise<CareVisit> {
    const visit = await this.careVisitRepository.findOne({
      where: { id: visitId },
      relations: ['serviceUser']
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    if (visit.careWorkerId !== careWorkerId) {
      throw new Error('Unauthorized to start this visit');
    }

    // Verify location is within acceptable range of service user's address
    const isLocationValid = await this.verifyVisitLocation(
      location, 
      visit.serviceUser.personalDetails.address.coordinates!
    );

    if (!isLocationValid) {
      throw new Error('Location verification failed. You must be at the service user\'s address to start the visit.');
    }

    visit.status = VisitStatus.ARRIVED;
    visit.actualStartTime = new Date();
    visit.location = {
      address: visit.serviceUser.getFullAddress(),
      coordinates: location,
      timestamp: new Date(),
      method: 'gps'
    };

    if (verificationData) {
      visit.arrivalVerification = {
        method: verificationData.method || VerificationMethod.GPS,
        timestamp: new Date(),
        data: verificationData,
        verified: true
      };
    }

    const updatedVisit = await this.careVisitRepository.save(visit);

    // Update care worker location
    this.updateCareWorkerLocation({
      careWorkerId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: 10,
      timestamp: new Date(),
      isOnDuty: true,
      currentVisitId: visitId
    });

    await this.auditService.logEvent({
      resource: 'CareVisit',
        entityType: 'CareVisit',
      entityId: visitId,
      action: 'START',
      details: { 
        careWorkerId,
        location,
        actualStartTime: visit.actualStartTime
      },
      userId: careWorkerId
    });

    return updatedVisit;
  }

  async completeVisit(
    visitId: string,
    careWorkerId: string,
    completionData: {
      completedTasks: any[];
      medications?: any[];
      observations?: any[];
      visitNotes?: string;
      serviceUserFeedback?: any;
      photos?: string[];
    }
  ): Promise<CareVisit> {
    const visit = await this.careVisitRepository.findOne({
      where: { id: visitId },
      relations: ['serviceUser']
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    const now = new Date();
    visit.status = VisitStatus.COMPLETED;
    visit.actualEndTime = now;
    visit.actualDuration = Math.round((now.getTime() - visit.actualStartTime!.getTime()) / (1000 * 60));
    
    Object.assign(visit, completionData);

    // Check for concerns that need immediate attention
    const requiresFollowUp = this.checkForFollowUpRequirements(visit, completionData);
    if (requiresFollowUp.required) {
      visit.requiresFollowUp = true;
      visit.followUpReason = requiresFollowUp.reason;
      
      // Notify supervisor
      await this.notificationService.sendNotification({
        message: 'Notification: Visit Requires Followup',
        type: 'visit_requires_followup',
        recipients: ['supervisors'],
        data: {
          visitId,
          serviceUser: visit.serviceUser.getFullName(),
          reason: requiresFollowUp.reason,
          careWorker: careWorkerId
        }
      });
    }

    const updatedVisit = await this.careVisitRepository.save(visit);

    // Clear care worker's current visit
    const workerLocation = this.careWorkerLocations.get(careWorkerId);
    if (workerLocation) {
      workerLocation.currentVisitId = undefined;
      this.careWorkerLocations.set(careWorkerId, workerLocation);
    }

    return updatedVisit;
  }

  // Route Optimization
  async optimizeRouteForCareWorker(careWorkerId: string, date: Date): Promise<RouteOptimization> {
    const visits = await this.careVisitRepository.find({
      where: {
        careWorkerId,
        scheduledStartTime: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        } as any
      },
      relations: ['serviceUser']
    });

    if (visits.length === 0) {
      throw new Error('No visits scheduled for this date');
    }

    const routeData: RouteOptimization = {
      careWorkerId,
      date,
      visits: visits.map(visit => ({
        visitId: visit.id,
        serviceUserId: visit.serviceUserId,
        address: visit.serviceUser.getFullAddress(),
        coordinates: visit.serviceUser.personalDetails.address.coordinates!,
        duration: visit.plannedDuration,
        timeWindow: {
          start: visit.scheduledStartTime,
          end: visit.scheduledEndTime
        },
        priority: visit.type === VisitType.MEDICATION ? 3 : 
                 visit.type === VisitType.EMERGENCY ? 5 : 
                 visit.type === VisitType.PERSONAL_CARE ? 2 : 1
      })),
      optimizedRoute: {
        visitOrder: [],
        totalDistance: 0,
        totalTravelTime: 0,
        estimatedFuelCost: 0
      }
    };

    // Simple optimization algorithm (in production, use proper routing service)
    const optimizedOrder = this.calculateOptimalRoute(routeData.visits);
    
    routeData.optimizedRoute = {
      visitOrder: optimizedOrder.map(visit => visit.visitId),
      totalDistance: optimizedOrder.reduce((sum, visit, index) => {
        if (index === 0) return 0;
        return sum + this.calculateDistance(
          optimizedOrder[index - 1].coordinates,
          visit.coordinates
        );
      }, 0),
      totalTravelTime: optimizedOrder.length * 15, // Estimated 15 min between visits
      estimatedFuelCost: optimizedOrder.length * 3.50 // Estimated £3.50 per visit travel
    };

    return routeData;
  }

  // Emergency Management
  async raiseEmergencyAlert(alertData: Omit<EmergencyAlert, 'id' | 'timestamp' | 'status'>): Promise<EmergencyAlert> {
    const alert: EmergencyAlert = {
      ...alertData,
      id: `emergency_${Date.now()}`,
      timestamp: new Date(),
      status: ResidentStatus.ACTIVE,
      responders: []
    };

    this.activeEmergencies.set(alert.id, alert);

    // Immediate notifications based on priority
    const recipients = this.getEmergencyRecipients(alert.priority);
    
    await this.notificationService.sendNotification({
      message: 'Notification: Emergency Alert',
        type: 'emergency_alert',
      recipients,
      data: {
        alertId: alert.id,
        type: alert.type,
        priority: alert.priority,
        location: alert.location,
        description: alert.description,
        serviceUser: alert.serviceUserId,
        careWorker: alert.careWorkerId
      }
    });

    // Log emergency
    await this.auditService.logEvent({
        resource: 'EmergencyAlert',
        entityType: 'EmergencyAlert',
        entityId: alert.id,
        action: 'RAISE',
        resource: 'EmergencyAlert',
        details: alert,
        userId: alert.careWorkerId
    
      });

    return alert;
  }

  async acknowledgeEmergency(alertId: string, responderId: string): Promise<EmergencyAlert> {
    const alert = this.activeEmergencies.get(alertId);
    if (!alert) {
      throw new Error('Emergency alert not found');
    }

    alert.status = 'acknowledged';
    alert.responders.push(responderId);
    
    this.activeEmergencies.set(alertId, alert);

    await this.notificationService.sendNotification({
      message: 'Notification: Emergency Acknowledged',
        type: 'emergency_acknowledged',
      recipients: [alert.careWorkerId],
      data: {
        alertId,
        responder: responderId,
        acknowledgedAt: new Date().toISOString()
      }
    });

    return alert;
  }

  // Real-time Location Tracking
  updateCareWorkerLocation(locationData: CareWorkerLocation): void {
    this.careWorkerLocations.set(locationData.careWorkerId, locationData);

    // Check for geofence violations or safety concerns
    this.checkLocationSafety(locationData);
  }

  getCareWorkerLocation(careWorkerId: string): CareWorkerLocation | null {
    return this.careWorkerLocations.get(careWorkerId) || null;
  }

  getAllActiveCareWorkerLocations(): CareWorkerLocation[] {
    return Array.from(this.careWorkerLocations.values()).filter(loc => loc.isOnDuty);
  }

  // Visit Verification
  async verifyVisitWithQRCode(visitId: string, qrCodeData: string): Promise<boolean> {
    const visit = await this.careVisitRepository.findOne({
      where: { id: visitId },
      relations: ['serviceUser']
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // QR code should contain service user ID and location verification
    const expectedQRData = `${visit.serviceUserId}:${visit.serviceUser.personalDetails.address.postcode}`;
    
    return qrCodeData === expectedQRData;
  }

  async verifyVisitLocation(
    currentLocation: { latitude: number; longitude: number },
    serviceUserLocation: { latitude: number; longitude: number },
    toleranceMeters: number = 100
  ): Promise<boolean> {
    const distance = this.calculateDistance(currentLocation, serviceUserLocation);
    return distance <= toleranceMeters / 1000; // Convert meters to kilometers
  }

  // Analytics and Reporting
  async getDomiciliaryMetrics(date: Date): Promise<DomiciliaryMetrics> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const [
      totalServiceUsers,
      activeServiceUsers,
      todaysVisits,
      completedVisits,
      missedVisits
    ] = await Promise.all([
      this.serviceUserRepository.count(),
      this.serviceUserRepository.count({ where: { status: ServiceUserStatus.ACTIVE } }),
      this.careVisitRepository.find({
        where: {
          scheduledStartTime: {
            $gte: startOfDay,
            $lt: endOfDay
          } as any
        }
      }),
      this.careVisitRepository.count({
        where: {
          scheduledStartTime: {
            $gte: startOfDay,
            $lt: endOfDay
          } as any,
          status: VisitStatus.COMPLETED
        }
      }),
      this.careVisitRepository.count({
        where: {
          scheduledStartTime: {
            $gte: startOfDay,
            $lt: endOfDay
          } as any,
          status: VisitStatus.MISSED
        }
      })
    ]);

    const totalVisitsToday = todaysVisits.length;
    const onTimeVisits = todaysVisits.filter(visit => 
      !visit.actualStartTime || visit.actualStartTime <= visit.scheduledStartTime
    ).length;

    const averageDuration = todaysVisits
      .filter(visit => visit.actualDuration)
      .reduce((sum, visit) => sum + visit.actualDuration!, 0) / 
      Math.max(1, todaysVisits.filter(visit => visit.actualDuration).length);

    const totalTravelTime = todaysVisits
      .reduce((sum, visit) => sum + (visit.travelInfo?.travelTime || 0), 0);

    const totalTravelCost = todaysVisits
      .reduce((sum, visit) => sum + visit.getTravelCost(), 0);

    return {
      totalServiceUsers,
      activeServiceUsers,
      totalVisitsToday,
      completedVisitsToday: completedVisits,
      missedVisitsToday: missedVisits,
      averageVisitDuration: averageDuration,
      onTimePercentage: totalVisitsToday > 0 ? (onTimeVisits / totalVisitsToday) * 100 : 0,
      serviceUserSatisfaction: 4.2, // Would be calculated from feedback
      careWorkerUtilization: 85, // Would be calculated from scheduled vs available hours
      emergencyCallsToday: this.activeEmergencies.size,
      totalTravelTime,
      totalTravelCost
    };
  }

  // Helper Methods
  private async generateServiceUserNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.serviceUserRepository.count();
    return `SU${year}${String(count + 1).padStart(4, '0')}`;
  }

  private async generateVisitNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.careVisitRepository.count();
    return `V${year}${month}${String(count + 1).padStart(4, '0')}`;
  }

  private async generateLocationQRCode(serviceUserId: string): Promise<string> {
    const serviceUser = await this.serviceUserRepository.findOne({ 
      where: { id: serviceUserId } 
    });
    
    if (!serviceUser) {
      throw new Error('Service user not found');
    }

    // Generate QR code data
    const qrData = `${serviceUserId}:${serviceUser.personalDetails.address.postcode}`;
    
    // Store QR code data for service user location verification
    // In production, this would integrate with a QR code generation service
    
    return qrData;
  }

  private checkForFollowUpRequirements(visit: CareVisit, completionData: any): { required: boolean; reason?: string } {
    // Check for missed critical tasks
    const criticalTasks = visit.scheduledTasks.filter(task => task.priority === 'critical');
    const completedCriticalTasks = completionData.completedTasks?.filter(task => 
      task.priority === 'critical' && task.completed
    ) || [];

    if (criticalTasks.length > completedCriticalTasks.length) {
      return { required: true, reason: 'Critical tasks not completed' };
    }

    // Check for urgent observations
    if (completionData.observations?.some((obs: any) => obs.severity === 'urgent')) {
      return { required: true, reason: 'Urgent observations noted' };
    }

    // Check for medication issues
    if (completionData.medications?.some((med: any) => !med.administered)) {
      return { required: true, reason: 'Medication not administered' };
    }

    return { required: false };
  }

  private calculateOptimalRoute(visits: any[]): any[] {
    // Simple nearest neighbor algorithm (in production, use proper TSP solver)
    const sortedVisits = [...visits].sort((a, b) => a.priority - b.priority);
    return sortedVisits;
  }

  private calculateDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getEmergencyRecipients(priority: string): string[] {
    switch (priority) {
      case 'critical':
        return ['emergency_services', 'senior_managers', 'on_call_supervisor'];
      case 'high':
        return ['senior_managers', 'on_call_supervisor', 'area_managers'];
      case 'medium':
        return ['on_call_supervisor', 'area_managers'];
      default:
        return ['on_call_supervisor'];
    }
  }

  private checkLocationSafety(location: CareWorkerLocation): void {
    // Check if care worker hasn't moved for extended period (potential safety issue)
    const lastLocation = this.careWorkerLocations.get(location.careWorkerId);
    
    if (lastLocation && location.currentVisitId) {
      const timeDiff = location.timestamp.getTime() - lastLocation.timestamp.getTime();
      const distanceMoved = this.calculateDistance(
        { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
        { latitude: location.latitude, longitude: location.longitude }
      );

      // If no movement for 4+ hours during a visit, raise concern
      if (timeDiff > 4 * 60 * 60 * 1000 && distanceMoved < 0.1) {
        this.raiseEmergencyAlert({
          type: 'welfare',
          priority: 'medium',
          careWorkerId: location.careWorkerId,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: 'Current location'
          },
          description: 'Care worker has not moved for extended period during visit',
          responders: []
        });
      }
    }
  }
}