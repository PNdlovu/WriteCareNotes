/**
 * @fileoverview GP connectivity service focused on care home resident health coordination
 * @module Gp-connect/GPConnectService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description GP connectivity service focused on care home resident health coordination
 */

import { EventEmitter2 } from "eventemitter2";
import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';

/**
 * @fileoverview GP Connect Service for Care Home Operations
 * @module GPConnectService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description GP connectivity service focused on care home resident health coordination
 * and communication with local GP practices for resident care management.
 * 
 * @compliance
 * - CQC Regulation 12 - Safe care and treatment
 * - Care Quality Commission guidance on GP collaboration
 * - GDPR Article 6 & 9 (Health data processing)
 * - Data Protection Act 2018
 * 
 * @scope Care Home Operations Only
 * - Resident health summary sharing with GPs
 * - GP consultation coordination for residents
 * - Health status updates to resident's registered GP
 * - Care home to GP communication workflows
 */

export interface ResidentGPRecord {
  id: string;
  residentId: string;
  residentName: string;
  nhsNumber?: string;
  gpPracticeId: string;
  gpPracticeName: string;
  gpDoctorName: string;
  gpContactDetails: {
    phone: string;
    email?: string;
    address: string;
    postcode: string;
  };
  registrationStatus: 'active' | 'transferred' | 'inactive';
  lastContactDate?: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthSummary {
  id: string;
  residentId: string;
  summaryType: 'routine_update' | 'incident_report' | 'care_plan_change' | 'consultation_request';
  summary: string;
  healthConcerns: string[];
  currentMedications: ResidentMedication[];
  careNeeds: string[];
  emergencyContacts: EmergencyContact[];
  createdBy: string;
  createdAt: Date;
  sentToGP: boolean;
  gpAcknowledged: boolean;
  gpResponse?: string;
  organizationId: string;
}

export interface ResidentMedication {
  medicationName: string;
  dosage: string;
  frequency: string;
  administrationRoute: string;
  prescribedBy: string;
  startDate: Date;
  reviewDate?: Date;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface GPConsultationRequest {
  id: string;
  residentId: string;
  residentName: string;
  requestType: 'routine_visit' | 'urgent_assessment' | 'medication_review' | 'health_concern';
  priority: 'routine' | 'urgent' | 'emergency';
  reasonForConsultation: string;
  symptoms?: string[];
  requestedBy: string;
  requestedDate: Date;
  preferredVisitDate?: Date;
  gpPracticeId: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  consultationNotes?: string;
  followUpRequired?: boolean;
  organizationId: string;
}

export interface GPCommunication {
  id: string;
  residentId: string;
  gpPracticeId: string;
  communicationType: 'health_update' | 'incident_notification' | 'consultation_request' | 'care_plan_sharing';
  subject: string;
  message: string;
  attachments?: string[];
  sentBy: string;
  sentAt: Date;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  gpResponse?: string;
  responseAt?: Date;
  organizationId: string;
}

export class GPConnectService extends EventEmitter2 {
  private gpRecordRepository: Repository<any>;
  private healthSummaryRepository: Repository<any>;
  private consultationRepository: Repository<any>;
  private communicationRepository: Repository<any>;
  private auditTrailService: AuditService;
  private notificationService: NotificationService;

  constructor() {
    super();
    this.gpRecordRepository = AppDataSource.getRepository('ResidentGPRecord');
    this.healthSummaryRepository = AppDataSource.getRepository('HealthSummary');
    this.consultationRepository = AppDataSource.getRepository('GPConsultationRequest');
    this.communicationRepository = AppDataSource.getRepository('GPCommunication');
    this.auditTrailService = new AuditTrailService();
    this.notificationService = new NotificationService();
  }

  async registerResidentWithGP(
    residentData: Omit<ResidentGPRecord, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<ResidentGPRecord> {
    const gpRecord: ResidentGPRecord = {
      id: this.generateId(),
      ...residentData,
      registrationStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.gpRecordRepository.save(gpRecord);

    await this.auditTrailService.log({
      action: 'resident_gp_registered',
      entityType: 'gp_record',
      entityId: gpRecord.id,
      userId,
      organizationId: gpRecord.organizationId,
      details: {
        residentId: gpRecord.residentId,
        gpPracticeName: gpRecord.gpPracticeName,
        gpDoctorName: gpRecord.gpDoctorName
      }
    });

    this.emit('resident_gp_registered', gpRecord);
    return gpRecord;
  }

  async sendHealthSummaryToGP(
    healthSummaryData: Omit<HealthSummary, 'id' | 'createdAt' | 'sentToGP' | 'gpAcknowledged'>,
    userId: string
  ): Promise<HealthSummary> {
    const healthSummary: HealthSummary = {
      id: this.generateId(),
      ...healthSummaryData,
      createdAt: new Date(),
      sentToGP: true,
      gpAcknowledged: false,
      createdBy: userId
    };

    await this.healthSummaryRepository.save(healthSummary);

    // Get GP details for this resident
    const gpRecord = await this.gpRecordRepository.findOne({
      where: { residentId: healthSummary.residentId, organizationId: healthSummary.organizationId }
    });

    if (gpRecord) {
      // Create communication record
      await this.createGPCommunication({
        residentId: healthSummary.residentId,
        gpPracticeId: gpRecord.gpPracticeId,
        communicationType: 'health_update',
        subject: `Health Summary Update - ${gpRecord.residentName}`,
        message: healthSummary.summary,
        sentBy: userId,
        organizationId: healthSummary.organizationId
      });

      // Send notification to care home staff
      await this.notificationService.send({
        type: 'health_summary_sent',
        recipients: [userId],
        organizationId: healthSummary.organizationId,
        title: 'Health Summary Sent to GP',
        message: `Health summary for ${gpRecord.residentName} has been sent to ${gpRecord.gpPracticeName}`,
        data: {
          residentId: healthSummary.residentId,
          gpPracticeName: gpRecord.gpPracticeName,
          summaryType: healthSummary.summaryType
        }
      });
    }

    await this.auditTrailService.log({
      action: 'health_summary_sent_to_gp',
      entityType: 'health_summary',
      entityId: healthSummary.id,
      userId,
      organizationId: healthSummary.organizationId,
      details: {
        residentId: healthSummary.residentId,
        summaryType: healthSummary.summaryType,
        gpPracticeId: gpRecord?.gpPracticeId
      }
    });

    this.emit('health_summary_sent', healthSummary);
    return healthSummary;
  }

  async requestGPConsultation(
    consultationData: Omit<GPConsultationRequest, 'id' | 'requestedDate' | 'status'>,
    userId: string
  ): Promise<GPConsultationRequest> {
    const consultation: GPConsultationRequest = {
      id: this.generateId(),
      ...consultationData,
      requestedDate: new Date(),
      status: 'pending',
      requestedBy: userId
    };

    await this.consultationRepository.save(consultation);

    // Create communication to GP practice
    await this.createGPCommunication({
      residentId: consultation.residentId,
      gpPracticeId: consultation.gpPracticeId,
      communicationType: 'consultation_request',
      subject: `Consultation Request - ${consultation.residentName} (${consultation.priority.toUpperCase()})`,
      message: `Consultation requested for resident: ${consultation.residentName}\n\nReason: ${consultation.reasonForConsultation}\n\nPriority: ${consultation.priority}\n\nSymptoms: ${consultation.symptoms?.join(', ') || 'None specified'}\n\nPreferred visit date: ${consultation.preferredVisitDate?.toDateString() || 'Flexible'}`,
      sentBy: userId,
      organizationId: consultation.organizationId
    });

    // Send priority notification for urgent/emergency requests
    if (consultation.priority === 'urgent' || consultation.priority === 'emergency') {
      await this.notificationService.send({
        type: 'urgent_gp_consultation_requested',
        recipients: ['care_manager'],
        organizationId: consultation.organizationId,
        title: `${consultation.priority.toUpperCase()} GP Consultation Requested`,
        message: `${consultation.priority} consultation requested for ${consultation.residentName}`,
        data: {
          consultationId: consultation.id,
          residentId: consultation.residentId,
          priority: consultation.priority,
          reason: consultation.reasonForConsultation
        }
      });
    }

    await this.auditTrailService.log({
      action: 'gp_consultation_requested',
      entityType: 'gp_consultation',
      entityId: consultation.id,
      userId,
      organizationId: consultation.organizationId,
      details: {
        residentId: consultation.residentId,
        priority: consultation.priority,
        requestType: consultation.requestType,
        gpPracticeId: consultation.gpPracticeId
      }
    });

    this.emit('gp_consultation_requested', consultation);
    return consultation;
  }

  private async createGPCommunication(
    communicationData: Omit<GPCommunication, 'id' | 'sentAt' | 'deliveryStatus'>
  ): Promise<GPCommunication> {
    const communication: GPCommunication = {
      id: this.generateId(),
      ...communicationData,
      sentAt: new Date(),
      deliveryStatus: 'sent'
    };

    await this.communicationRepository.save(communication);

    // In a real implementation, this would integrate with GP practice systems
    // For now, we simulate delivery
    setTimeout(async () => {
      communication.deliveryStatus = 'delivered';
      await this.communicationRepository.save(communication);
      this.emit('gp_communication_delivered', communication);
    }, 1000);

    return communication;
  }

  async getResidentGPRecord(
    residentId: string,
    organizationId: string
  ): Promise<ResidentGPRecord | null> {
    return await this.gpRecordRepository.findOne({
      where: { residentId, organizationId }
    });
  }

  async getConsultationHistory(
    residentId: string,
    organizationId: string
  ): Promise<GPConsultationRequest[]> {
    return await this.consultationRepository.find({
      where: { residentId, organizationId },
      order: { requestedDate: 'DESC' }
    });
  }

  async getGPCommunications(
    residentId: string,
    organizationId: string
  ): Promise<GPCommunication[]> {
    return await this.communicationRepository.find({
      where: { residentId, organizationId },
      order: { sentAt: 'DESC' }
    });
  }

  async updateConsultationStatus(
    consultationId: string,
    status: GPConsultationRequest['status'],
    notes?: string,
    userId?: string,
    organizationId?: string
  ): Promise<void> {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId, organizationId }
    });

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    consultation.status = status;
    if (notes) {
      consultation.consultationNotes = notes;
    }

    await this.consultationRepository.save(consultation);

    if (userId && organizationId) {
      await this.auditTrailService.log({
        action: 'gp_consultation_status_updated',
        entityType: 'gp_consultation',
        entityId: consultationId,
        userId,
        organizationId,
        details: { status, notes }
      });
    }

    this.emit('consultation_status_updated', consultation);
  }

  private generateId(): string {
    return `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}