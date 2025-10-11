/**
 * @fileoverview g p connect Service
 * @module External-integration/GPConnectService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description g p connect Service
 */

import { EventEmitter2 } from 'eventemitter2';
import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { ExternalSystem, SystemType, IntegrationStatus } from '../../entities/external-integration/ExternalSystem';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';
import { FieldLevelEncryptionService } from '../encryption/FieldLevelEncryptionService';

export interface GPConnectConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  environment: 'sandbox' | 'production';
  timeout: number;
  retryAttempts: number;
}

export interface GPConnectSession {
  id: string;
  patientId: string;
  nhsNumber: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
  status: 'active' | 'expired' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentBookingRequest {
  patientId: string;
  nhsNumber: string;
  appointmentType: 'routine' | 'urgent' | 'follow_up';
  preferredDate: string;
  preferredTime?: string;
  reason: string;
  notes?: string;
  contactNumber: string;
  email?: string;
}

export interface AppointmentBookingResponse {
  appointmentId: string;
  status: 'booked' | 'pending' | 'failed';
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  location: {
    name: string;
    address: string;
    postcode: string;
  };
  practitioner: {
    name: string;
    role: string;
    contactNumber?: string;
  };
  confirmationCode: string;
  cancellationPolicy: string;
  nextSteps: string[];
}

export interface PatientRecordRequest {
  patientId: string;
  nhsNumber: string;
  recordTypes: ('demographics' | 'medications' | 'allergies' | 'conditions' | 'procedures' | 'observations')[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PatientRecordResponse {
  patientId: string;
  nhsNumber: string;
  demographics: {
    name: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    postcode: string;
    contactNumber: string;
    email?: string;
  };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescriber: string;
    status: 'active' | 'discontinued' | 'suspended';
  }>;
  allergies: Array<{
    allergen: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
    onsetDate: string;
    status: 'active' | 'inactive';
  }>;
  conditions: Array<{
    condition: string;
    code: string;
    status: 'active' | 'inactive' | 'resolved';
    onsetDate: string;
    diagnosisDate: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  procedures: Array<{
    procedure: string;
    code: string;
    date: string;
    practitioner: string;
    location: string;
    status: 'completed' | 'scheduled' | 'cancelled';
  }>;
  observations: Array<{
    type: string;
    value: string;
    unit: string;
    date: string;
    practitioner: string;
    status: 'final' | 'preliminary' | 'amended';
  }>;
  lastUpdated: string;
}

export interface AsyncCallbackRequest {
  callbackUrl: string;
  eventTypes: string[];
  authentication: {
    type: 'bearer' | 'basic';
    credentials: string;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface AsyncCallbackResponse {
  callbackId: string;
  status: 'registered' | 'failed';
  webhookUrl: string;
  secret: string;
  expiresAt: Date;
}

export class GPConnectService {
  privatesystemRepository: Repository<ExternalSystem>;
  privateauditService: AuditService;
  privatenotificationService: NotificationService;
  privateencryptionService: FieldLevelEncryptionService;
  privateeventEmitter: EventEmitter2;
  privateconfig: GPConnectConfig;

  constructor() {
    this.systemRepository = AppDataSource.getRepository(ExternalSystem);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService();
    this.encryptionService = new FieldLevelEncryptionService();
    this.eventEmitter = new EventEmitter2();
    
    // Initialize GP Connect configuration
    this.config = {
      baseUrl: process.env.GP_CONNECT_BASE_URL || 'https://sandbox.api.service.nhs.uk',
      clientId: process.env.GP_CONNECT_CLIENT_ID || '',
      clientSecret: process.env.GP_CONNECT_CLIENT_SECRET || '',
      redirectUri: process.env.GP_CONNECT_REDIRECT_URI || '',
      scope: ['patient/*.read', 'appointment/*.write', 'organization/*.read'],
      environment: (process.env.GP_CONNECT_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      timeout: 30000,
      retryAttempts: 3
    };
  }

  /**
   * Initialize GP Connect system
   */
  async initializeGPConnect(): Promise<ExternalSystem> {
    try {
      // Check if GP Connect system already exists
      let system = await this.systemRepository.findOne({
        where: { systemType: SystemType.GP_SYSTEM }
      });

      if (!system) {
        // Create new GP Connect system
        system = this.systemRepository.create({
          systemId: 'GP_CONNECT_001',
          systemName: 'GP Connect Integration',
          systemType: SystemType.GP_SYSTEM,
          status: IntegrationStatus.TESTING,
          connectionConfig: {
            endpoint: this.config.baseUrl,
            authentication: {
              type: 'oauth2',
              clientId: this.config.clientId,
              clientSecret: 'encrypted',
              scope: this.config.scope
            },
            timeout: this.config.timeout,
            retryPolicy: {
              maxRetries: this.config.retryAttempts,
              backoffMs: 1000
            }
          },
          dataMapping: {
            inboundMappings: [
              { source: 'patient.demographics', target: 'resident.personalDetails' },
              { source: 'patient.medications', target: 'resident.medications' },
              { source: 'patient.allergies', target: 'resident.allergies' },
              { source: 'patient.conditions', target: 'resident.medicalConditions' }
            ],
            outboundMappings: [
              { source: 'resident.medications', target: 'patient.medications' },
              { source: 'resident.observations', target: 'patient.observations' }
            ],
            transformationRules: [
              { rule: 'mapNHSNumber', source: 'nhsNumber', target: 'residentId' },
              { rule: 'mapMedicationDosage', source: 'dosage', target: 'strength' }
            ]
          },
          totalTransactions: 0,
          failedTransactions: 0
        });

        system = await this.systemRepository.save(system);
      }

      // Test connection
      await this.testConnection();

      // Update status to active
      system.status = IntegrationStatus.ACTIVE;
      await this.systemRepository.save(system);

      await this.auditService.logEvent({
        resource: 'GPConnect',
        entityType: 'ExternalSystem',
        entityId: system.id,
        action: 'INITIALIZE_GP_CONNECT',
        details: { systemId: system.systemId, environment: this.config.environment },
        userId: 'system'
      });

      return system;
    } catch (error) {
      console.error('Failed to initialize GP Connect:', error);
      throw new Error(`GP Connect initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test GP Connect connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Mock connection test - in real implementation, this would make an actual API call
      const response = await this.makeAPICall('GET', '/metadata');
      return response.status === 200;
    } catch (error) {
      console.error('GP Connect connection test failed:', error);
      return false;
    }
  }

  /**
   * Book appointment
   */
  async bookAppointment(
    request: AppointmentBookingRequest,
    context: { tenantId: string; userId: string }
  ): Promise<AppointmentBookingResponse> {
    try {
      // Validate request
      this.validateAppointmentRequest(request);

      // Create appointment booking payload
      const payload = {
        patient: {
          nhsNumber: request.nhsNumber,
          patientId: request.patientId
        },
        appointment: {
          type: request.appointmentType,
          preferredDate: request.preferredDate,
          preferredTime: request.preferredTime,
          reason: request.reason,
          notes: request.notes,
          contactNumber: request.contactNumber,
          email: request.email
        }
      };

      // Make API call to GP Connect
      const response = await this.makeAPICall('POST', '/appointments', payload);

      // Process response
      constappointmentResponse: AppointmentBookingResponse = {
        appointmentId: response.data.appointmentId,
        status: response.data.status,
        appointmentDate: response.data.appointmentDate,
        appointmentTime: response.data.appointmentTime,
        duration: response.data.duration || 30,
        location: {
          name: response.data.location.name,
          address: response.data.location.address,
          postcode: response.data.location.postcode
        },
        practitioner: {
          name: response.data.practitioner.name,
          role: response.data.practitioner.role,
          contactNumber: response.data.practitioner.contactNumber
        },
        confirmationCode: response.data.confirmationCode,
        cancellationPolicy: response.data.cancellationPolicy || '24 hours notice required',
        nextSteps: response.data.nextSteps || [
          'Arrive 15 minutes early',
          'Bring photo ID',
          'Bring current medication list'
        ]
      };

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'Appointment',
        entityType: 'Appointment',
        entityId: appointmentResponse.appointmentId,
        action: 'BOOK_APPOINTMENT',
        details: {
          patientId: request.patientId,
          nhsNumber: request.nhsNumber,
          appointmentType: request.appointmentType,
          appointmentDate: appointmentResponse.appointmentDate
        },
        userId: context.userId
      });

      // Send notification
      await this.notificationService.sendNotification({
        type: 'appointment_booked',
        recipient: context.userId,
        title: 'Appointment Booked',
        message: `Appointment booked for ${appointmentResponse.appointmentDate} at ${appointmentResponse.appointmentTime}`,
        data: {
          appointmentId: appointmentResponse.appointmentId,
          appointmentDate: appointmentResponse.appointmentDate,
          location: appointmentResponse.location.name
        }
      });

      return appointmentResponse;
    } catch (error) {
      console.error('Appointment booking failed:', error);
      throw new Error(`Appointment booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch patient record
   */
  async fetchPatientRecord(
    request: PatientRecordRequest,
    context: { tenantId: string; userId: string }
  ): Promise<PatientRecordResponse> {
    try {
      // Validate request
      this.validatePatientRecordRequest(request);

      // Create patient record request payload
      const payload = {
        patient: {
          nhsNumber: request.nhsNumber,
          patientId: request.patientId
        },
        recordTypes: request.recordTypes,
        dateRange: request.dateRange
      };

      // Make API call to GP Connect
      const response = await this.makeAPICall('GET', '/patient-record', payload);

      // Process response
      constpatientRecord: PatientRecordResponse = {
        patientId: request.patientId,
        nhsNumber: request.nhsNumber,
        demographics: response.data.demographics,
        medications: response.data.medications || [],
        allergies: response.data.allergies || [],
        conditions: response.data.conditions || [],
        procedures: response.data.procedures || [],
        observations: response.data.observations || [],
        lastUpdated: response.data.lastUpdated
      };

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'PatientRecord',
        entityType: 'PatientRecord',
        entityId: request.patientId,
        action: 'FETCH_PATIENT_RECORD',
        details: {
          patientId: request.patientId,
          nhsNumber: request.nhsNumber,
          recordTypes: request.recordTypes
        },
        userId: context.userId
      });

      return patientRecord;
    } catch (error) {
      console.error('Patient record fetch failed:', error);
      throw new Error(`Patient record fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register async callback
   */
  async registerAsyncCallback(
    request: AsyncCallbackRequest,
    context: { tenantId: string; userId: string }
  ): Promise<AsyncCallbackResponse> {
    try {
      // Create callback registration payload
      const payload = {
        callbackUrl: request.callbackUrl,
        eventTypes: request.eventTypes,
        authentication: request.authentication,
        retryPolicy: request.retryPolicy
      };

      // Make API call to GP Connect
      const response = await this.makeAPICall('POST', '/callbacks', payload);

      // Process response
      constcallbackResponse: AsyncCallbackResponse = {
        callbackId: response.data.callbackId,
        status: response.data.status,
        webhookUrl: response.data.webhookUrl,
        secret: response.data.secret,
        expiresAt: new Date(response.data.expiresAt)
      };

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'AsyncCallback',
        entityType: 'AsyncCallback',
        entityId: callbackResponse.callbackId,
        action: 'REGISTER_ASYNC_CALLBACK',
        details: {
          callbackId: callbackResponse.callbackId,
          eventTypes: request.eventTypes,
          callbackUrl: request.callbackUrl
        },
        userId: context.userId
      });

      return callbackResponse;
    } catch (error) {
      console.error('Async callback registration failed:', error);
      throw new Error(`Async callback registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle async callback
   */
  async handleAsyncCallback(
    callbackId: string,
    eventData: any,
    context: { tenantId: string }
  ): Promise<void> {
    try {
      // Validate callback
      const isValid = await this.validateCallback(callbackId, eventData);
      if (!isValid) {
        throw new Error('Invalid callback');
      }

      // Process event based on type
      switch (eventData.eventType) {
        case 'appointment.updated':
          await this.handleAppointmentUpdate(eventData);
          break;
        case 'patient.record.updated':
          await this.handlePatientRecordUpdate(eventData);
          break;
        case 'medication.changed':
          await this.handleMedicationChange(eventData);
          break;
        default:
          console.log(`Unhandled event type: ${eventData.eventType}`);
      }

      // Emit event
      this.eventEmitter.emit('gp_connect.callback', {
        callbackId,
        eventType: eventData.eventType,
        data: eventData,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Async callback handling failed:', error);
      throw error;
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<{
    status: IntegrationStatus;
    lastSync: Date | null;
    successRate: number;
    totalTransactions: number;
    failedTransactions: number;
  }> {
    try {
      const system = await this.systemRepository.findOne({
        where: { systemType: SystemType.GP_SYSTEM }
      });

      if (!system) {
        throw new Error('GP Connect system not found');
      }

      return {
        status: system.status,
        lastSync: system.lastSuccessfulSync,
        successRate: system.calculateSuccessRate(),
        totalTransactions: system.totalTransactions,
        failedTransactions: system.failedTransactions
      };
    } catch (error) {
      console.error('Failed to get integration status:', error);
      throw error;
    }
  }

  /**
   * Make API call to GP Connect
   */
  private async makeAPICall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<{ status: number; data: any }> {
    try {
      // In a real implementation, this would make an actual HTTP request
      // For now, we'll return mock data
      const mockResponse = {
        status: 200,
        data: {
          appointmentId: `APT_${Date.now()}`,
          status: 'booked',
          appointmentDate: '2024-01-15',
          appointmentTime: '10:30',
          location: {
            name: 'GP Surgery',
            address: '123 Main Street',
            postcode: 'SW1A 1AA'
          },
          practitioner: {
            name: 'Dr. Smith',
            role: 'GP',
            contactNumber: '020 1234 5678'
          },
          confirmationCode: 'ABC123',
          nextSteps: [
            'Arrive 15 minutes early',
            'Bring photo ID',
            'Bring current medication list'
          ]
        }
      };

      return mockResponse;
    } catch (error) {
      console.error('GP Connect API call failed:', error);
      throw error;
    }
  }

  /**
   * Validate appointment request
   */
  private validateAppointmentRequest(request: AppointmentBookingRequest): void {
    if (!request.patientId) {
      throw new Error('Patient ID is required');
    }
    if (!request.nhsNumber) {
      throw new Error('NHS Number is required');
    }
    if (!request.appointmentType) {
      throw new Error('Appointment type is required');
    }
    if (!request.preferredDate) {
      throw new Error('Preferred date is required');
    }
    if (!request.reason) {
      throw new Error('Reason is required');
    }
    if (!request.contactNumber) {
      throw new Error('Contact number is required');
    }
  }

  /**
   * Validate patient record request
   */
  private validatePatientRecordRequest(request: PatientRecordRequest): void {
    if (!request.patientId) {
      throw new Error('Patient ID is required');
    }
    if (!request.nhsNumber) {
      throw new Error('NHS Number is required');
    }
    if (!request.recordTypes || request.recordTypes.length === 0) {
      throw new Error('At least one record type is required');
    }
  }

  /**
   * Validate callback
   */
  private async validateCallback(callbackId: string, eventData: any): Promise<boolean> {
    // In a real implementation, this would validate the callback signature
    return true;
  }

  /**
   * Handle appointment update
   */
  private async handleAppointmentUpdate(eventData: any): Promise<void> {
    console.log('Handling appointment update:', eventData);
    // Implement appointment update logic
  }

  /**
   * Handle patient record update
   */
  private async handlePatientRecordUpdate(eventData: any): Promise<void> {
    console.log('Handling patient record update:', eventData);
    // Implement patient record update logic
  }

  /**
   * Handle medication change
   */
  private async handleMedicationChange(eventData: any): Promise<void> {
    console.log('Handling medication change:', eventData);
    // Implement medication change logic
  }
}

export default GPConnectService;
