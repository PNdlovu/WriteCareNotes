/**
 * @fileoverview d b s verification Service
 * @module Hr/DBSVerificationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description d b s verification Service
 */

import { EventEmitter2 } from "eventemitter2";
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { DBSVerification, DBSStatus, DBSCheckType, DBSPriority } from '../../entities/hr/DBSVerification';
import { DBSDocument } from '../../entities/hr/DBSDocument';
import { DBSNotification } from '../../entities/hr/DBSNotification';
import { Employee } from '../../entities/hr/Employee';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';
import { logger } from '../../utils/logger';

export interface DBSVerificationRequest {
  employeeId: string;
  checkType: DBSCheckType;
  priority: DBSPriority;
  careHomeId?: string;
  department?: string;
  position?: string;
  isVulnerableAdultRole?: boolean;
  isChildRole?: boolean;
  applicationCost?: number;
  currency?: string;
}

export interface DBSVerificationUpdate {
  status?: DBSStatus;
  dbsReferenceNumber?: string;
  applicationReference?: string;
  certificateNumber?: string;
  applicationDate?: Date;
  submissionDate?: Date;
  completionDate?: Date;
  verificationNotes?: string;
  rejectionReason?: string;
  additionalInformation?: string;
  riskLevel?: string;
  riskAssessmentNotes?: string;
}

export interface DBSVerificationSearchCriteria {
  employeeId?: string;
  status?: DBSStatus;
  checkType?: DBSCheckType;
  priority?: DBSPriority;
  careHomeId?: string;
  department?: string;
  isVulnerableAdultRole?: boolean;
  isChildRole?: boolean;
  isCompliant?: boolean;
  requiresRenewal?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

export interface DBSComplianceReport {
  totalVerifications: number;
  compliantVerifications: number;
  nonCompliantVerifications: number;
  expiringVerifications: number;
  expiredVerifications: number;
  complianceRate: number;
  averageProcessingTime: number;
  costAnalysis: {
    totalCost: number;
    averageCost: number;
    costByCheckType: { [key in DBSCheckType]: number };
  };
  riskAnalysis: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
  departmentBreakdown: { [department: string]: number };
  checkTypeBreakdown: { [key in DBSCheckType]: number };
}

export class DBSVerificationService {
  privatedbsVerificationRepository: Repository<DBSVerification>;
  privatedbsDocumentRepository: Repository<DBSDocument>;
  privatedbsNotificationRepository: Repository<DBSNotification>;
  privateemployeeRepository: Repository<Employee>;
  privateauditService: AuditService;
  privatenotificationService: NotificationService;
  privateeventEmitter: EventEmitter2;

  constructor() {
    this.dbsVerificationRepository = AppDataSource.getRepository(DBSVerification);
    this.dbsDocumentRepository = AppDataSource.getRepository(DBSDocument);
    this.dbsNotificationRepository = AppDataSource.getRepository(DBSNotification);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
    this.eventEmitter = new EventEmitter2();
  }

  /**
   * Create a new DBS verification request
   */
  async createDBSVerification(
    request: DBSVerificationRequest,
    createdBy: string
  ): Promise<DBSVerification> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: request.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if employee already has an active DBS verification
    const existingVerification = await this.dbsVerificationRepository.findOne({
      where: {
        employeeId: request.employeeId,
        status: DBSStatus.CLEARED
      }
    });

    if (existingVerification && !existingVerification.isExpired()) {
      throw new Error('Employee already has an active DBS verification');
    }

    // Create DBS verification
    const dbsVerification = this.dbsVerificationRepository.create({
      employeeId: request.employeeId,
      checkType: request.checkType,
      priority: request.priority,
      careHomeId: request.careHomeId,
      department: request.department,
      position: request.position,
      isVulnerableAdultRole: request.isVulnerableAdultRole || false,
      isChildRole: request.isChildRole || false,
      applicationCost: request.applicationCost,
      currency: request.currency || 'GBP',
      createdBy
    });

    const savedVerification = await this.dbsVerificationRepository.save(dbsVerification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DBSVerification',
      entityType: 'DBSVerification',
      entityId: savedVerification.id,
      action: 'CREATE',
      details: {
        employeeId: request.employeeId,
        checkType: request.checkType,
        priority: request.priority
      },
      userId: createdBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'DBS verification request created',
      type: 'dbs_verification_created',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        employeeId: request.employeeId,
        employeeName: employee.getFullName(),
        checkType: request.checkType,
        verificationId: savedVerification.id
      }
    });

    // Emit event
    this.eventEmitter.emit('dbs.verification.created', {
      verificationId: savedVerification.id,
      employeeId: request.employeeId,
      checkType: request.checkType
    });

    logger.info('DBS verification created', {
      verificationId: savedVerification.id,
      employeeId: request.employeeId,
      checkType: request.checkType,
      createdBy
    });

    return savedVerification;
  }

  /**
   * Get DBS verification by ID
   */
  async getDBSVerificationById(verificationId: string): Promise<DBSVerification | null> {
    return await this.dbsVerificationRepository.findOne({
      where: { id: verificationId },
      relations: ['employee', 'documents', 'notifications']
    });
  }

  /**
   * Get DBS verifications by employee ID
   */
  async getDBSVerificationsByEmployee(employeeId: string): Promise<DBSVerification[]> {
    return await this.dbsVerificationRepository.find({
      where: { employeeId },
      relations: ['employee', 'documents', 'notifications'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Search DBS verifications with criteria
   */
  async searchDBSVerifications(criteria: DBSVerificationSearchCriteria): Promise<DBSVerification[]> {
    const queryBuilder = this.dbsVerificationRepository.createQueryBuilder('dbs');

    if (criteria.employeeId) {
      queryBuilder.andWhere('dbs.employeeId = :employeeId', { employeeId: criteria.employeeId });
    }

    if (criteria.status) {
      queryBuilder.andWhere('dbs.status = :status', { status: criteria.status });
    }

    if (criteria.checkType) {
      queryBuilder.andWhere('dbs.checkType = :checkType', { checkType: criteria.checkType });
    }

    if (criteria.priority) {
      queryBuilder.andWhere('dbs.priority = :priority', { priority: criteria.priority });
    }

    if (criteria.careHomeId) {
      queryBuilder.andWhere('dbs.careHomeId = :careHomeId', { careHomeId: criteria.careHomeId });
    }

    if (criteria.department) {
      queryBuilder.andWhere('dbs.department = :department', { department: criteria.department });
    }

    if (criteria.isVulnerableAdultRole !== undefined) {
      queryBuilder.andWhere('dbs.isVulnerableAdultRole = :isVulnerableAdultRole', { 
        isVulnerableAdultRole: criteria.isVulnerableAdultRole 
      });
    }

    if (criteria.isChildRole !== undefined) {
      queryBuilder.andWhere('dbs.isChildRole = :isChildRole', { 
        isChildRole: criteria.isChildRole 
      });
    }

    if (criteria.isCompliant !== undefined) {
      queryBuilder.andWhere('dbs.isCompliant = :isCompliant', { 
        isCompliant: criteria.isCompliant 
      });
    }

    if (criteria.requiresRenewal !== undefined) {
      queryBuilder.andWhere('dbs.requiresRenewal = :requiresRenewal', { 
        requiresRenewal: criteria.requiresRenewal 
      });
    }

    if (criteria.createdAfter) {
      queryBuilder.andWhere('dbs.createdAt >= :createdAfter', { createdAfter: criteria.createdAfter });
    }

    if (criteria.createdBefore) {
      queryBuilder.andWhere('dbs.createdAt <= :createdBefore', { createdBefore: criteria.createdBefore });
    }

    if (criteria.expiresAfter) {
      queryBuilder.andWhere('dbs.expiryDate >= :expiresAfter', { expiresAfter: criteria.expiresAfter });
    }

    if (criteria.expiresBefore) {
      queryBuilder.andWhere('dbs.expiryDate <= :expiresBefore', { expiresBefore: criteria.expiresBefore });
    }

    return await queryBuilder
      .leftJoinAndSelect('dbs.employee', 'employee')
      .leftJoinAndSelect('dbs.documents', 'documents')
      .leftJoinAndSelect('dbs.notifications', 'notifications')
      .orderBy('dbs.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Update DBS verification
   */
  async updateDBSVerification(
    verificationId: string,
    updates: DBSVerificationUpdate,
    updatedBy: string
  ): Promise<DBSVerification> {
    const verification = await this.getDBSVerificationById(verificationId);
    if (!verification) {
      throw new Error('DBS verification not found');
    }

    // Update fields
    Object.assign(verification, updates);
    verification.updatedBy = updatedBy;

    const updatedVerification = await this.dbsVerificationRepository.save(verification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DBSVerification',
      entityType: 'DBSVerification',
      entityId: verificationId,
      action: 'UPDATE',
      details: updates,
      userId: updatedBy
    });

    // Emit event
    this.eventEmitter.emit('dbs.verification.updated', {
      verificationId,
      updates,
      updatedBy
    });

    logger.info('DBS verification updated', {
      verificationId,
      updates,
      updatedBy
    });

    return updatedVerification;
  }

  /**
   * Start DBS application process
   */
  async startDBSApplication(
    verificationId: string,
    applicationReference: string,
    startedBy: string
  ): Promise<DBSVerification> {
    const verification = await this.getDBSVerificationById(verificationId);
    if (!verification) {
      throw new Error('DBS verification not found');
    }

    verification.startApplication(applicationReference, startedBy);
    const updatedVerification = await this.dbsVerificationRepository.save(verification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DBSVerification',
      entityType: 'DBSVerification',
      entityId: verificationId,
      action: 'APPLICATION_STARTED',
      details: { applicationReference },
      userId: startedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'DBS application started',
      type: 'dbs_application_started',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        verificationId,
        applicationReference,
        employeeId: verification.employeeId
      }
    });

    return updatedVerification;
  }

  /**
   * Submit DBS application
   */
  async submitDBSApplication(
    verificationId: string,
    dbsReferenceNumber: string,
    submittedBy: string
  ): Promise<DBSVerification> {
    const verification = await this.getDBSVerificationById(verificationId);
    if (!verification) {
      throw new Error('DBS verification not found');
    }

    verification.submitApplication(dbsReferenceNumber, submittedBy);
    const updatedVerification = await this.dbsVerificationRepository.save(verification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DBSVerification',
      entityType: 'DBSVerification',
      entityId: verificationId,
      action: 'APPLICATION_SUBMITTED',
      details: { dbsReferenceNumber },
      userId: submittedBy
    });

    return updatedVerification;
  }

  /**
   * Complete DBS verification
   */
  async completeDBSVerification(
    verificationId: string,
    certificateNumber: string,
    isCleared: boolean,
    completedBy: string,
    notes?: string
  ): Promise<DBSVerification> {
    const verification = await this.getDBSVerificationById(verificationId);
    if (!verification) {
      throw new Error('DBS verification not found');
    }

    verification.completeVerification(certificateNumber, isCleared, completedBy);
    if (notes) {
      verification.verificationNotes = notes;
    }

    const updatedVerification = await this.dbsVerificationRepository.save(verification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DBSVerification',
      entityType: 'DBSVerification',
      entityId: verificationId,
      action: 'VERIFICATION_COMPLETED',
      details: { certificateNumber, isCleared, notes },
      userId: completedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: `DBS verification ${isCleared ? 'cleared' : 'barred'}`,
      type: isCleared ? 'dbs_verification_cleared' : 'dbs_verification_barred',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        verificationId,
        employeeId: verification.employeeId,
        isCleared,
        certificateNumber
      }
    });

    return updatedVerification;
  }

  /**
   * Reject DBS verification
   */
  async rejectDBSVerification(
    verificationId: string,
    reason: string,
    rejectedBy: string
  ): Promise<DBSVerification> {
    const verification = await this.getDBSVerificationById(verificationId);
    if (!verification) {
      throw new Error('DBS verification not found');
    }

    verification.rejectVerification(reason, rejectedBy);
    const updatedVerification = await this.dbsVerificationRepository.save(verification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DBSVerification',
      entityType: 'DBSVerification',
      entityId: verificationId,
      action: 'VERIFICATION_REJECTED',
      details: { reason },
      userId: rejectedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'DBS verification rejected',
      type: 'dbs_verification_rejected',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        verificationId,
        employeeId: verification.employeeId,
        reason
      }
    });

    return updatedVerification;
  }

  /**
   * Get DBS compliance report
   */
  async getDBSComplianceReport(careHomeId?: string): Promise<DBSComplianceReport> {
    const queryBuilder = this.dbsVerificationRepository.createQueryBuilder('dbs');

    if (careHomeId) {
      queryBuilder.andWhere('dbs.careHomeId = :careHomeId', { careHomeId });
    }

    const verifications = await queryBuilder.getMany();

    const totalVerifications = verifications.length;
    const compliantVerifications = verifications.filter(v => v.isCompliant).length;
    const nonCompliantVerifications = totalVerifications - compliantVerifications;
    const expiringVerifications = verifications.filter(v => v.isDueForRenewal(30)).length;
    const expiredVerifications = verifications.filter(v => v.isExpired()).length;

    const complianceRate = totalVerifications > 0 ? (compliantVerifications / totalVerifications) * 100 : 0;

    // Calculate average processing time
    const completedVerifications = verifications.filter(v => v.completionDate && v.applicationDate);
    const averageProcessingTime = completedVerifications.length > 0
      ? completedVerifications.reduce((sum, v) => {
          const processingTime = v.completionDate!.getTime() - v.applicationDate!.getTime();
          return sum + processingTime;
        }, 0) / completedVerifications.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Cost analysis
    const totalCost = verifications.reduce((sum, v) => sum + (v.applicationCost || 0), 0);
    const averageCost = totalVerifications > 0 ? totalCost / totalVerifications : 0;

    const costByCheckType = Object.values(DBSCheckType).reduce((acc, checkType) => {
      const typeVerifications = verifications.filter(v => v.checkType === checkType);
      acc[checkType] = typeVerifications.reduce((sum, v) => sum + (v.applicationCost || 0), 0);
      return acc;
    }, {} as { [key in DBSCheckType]: number });

    // Risk analysis
    const highRiskCount = verifications.filter(v => v.riskLevel === 'high').length;
    const mediumRiskCount = verifications.filter(v => v.riskLevel === 'medium').length;
    const lowRiskCount = verifications.filter(v => v.riskLevel === 'low').length;

    // Department breakdown
    const departmentBreakdown = verifications.reduce((acc, v) => {
      const dept = v.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as { [department: string]: number });

    // Check type breakdown
    const checkTypeBreakdown = Object.values(DBSCheckType).reduce((acc, checkType) => {
      acc[checkType] = verifications.filter(v => v.checkType === checkType).length;
      return acc;
    }, {} as { [key in DBSCheckType]: number });

    return {
      totalVerifications,
      compliantVerifications,
      nonCompliantVerifications,
      expiringVerifications,
      expiredVerifications,
      complianceRate,
      averageProcessingTime,
      costAnalysis: {
        totalCost,
        averageCost,
        costByCheckType
      },
      riskAnalysis: {
        highRiskCount,
        mediumRiskCount,
        lowRiskCount
      },
      departmentBreakdown,
      checkTypeBreakdown
    };
  }

  /**
   * Get expiring DBS verifications
   */
  async getExpiringDBSVerifications(withinDays: number = 30): Promise<DBSVerification[]> {
    return await this.dbsVerificationRepository.find({
      where: {
        status: DBSStatus.CLEARED,
        isCompliant: true
      },
      relations: ['employee']
    }).then(verifications => 
      verifications.filter(v => v.isDueForRenewal(withinDays))
    );
  }

  /**
   * Get expired DBS verifications
   */
  async getExpiredDBSVerifications(): Promise<DBSVerification[]> {
    return await this.dbsVerificationRepository.find({
      where: {
        status: DBSStatus.CLEARED
      },
      relations: ['employee']
    }).then(verifications => 
      verifications.filter(v => v.isExpired())
    );
  }

  /**
   * Delete DBS verification
   */
  async deleteDBSVerification(verificationId: string, deletedBy: string): Promise<void> {
    const verification = await this.getDBSVerificationById(verificationId);
    if (!verification) {
      throw new Error('DBS verification not found');
    }

    // Soft delete
    await this.dbsVerificationRepository.softDelete(verificationId);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DBSVerification',
      entityType: 'DBSVerification',
      entityId: verificationId,
      action: 'DELETE',
      details: { employeeId: verification.employeeId },
      userId: deletedBy
    });

    logger.info('DBS verification deleted', {
      verificationId,
      employeeId: verification.employeeId,
      deletedBy
    });
  }

  /**
   * Bulk update DBS verification status
   */
  async bulkUpdateDBSVerificationStatus(
    verificationIds: string[],
    status: DBSStatus,
    updatedBy: string,
    notes?: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const verificationId of verificationIds) {
      try {
        await this.updateDBSVerification(verificationId, { status, verificationNotes: notes }, updatedBy);
        updatedCount++;
      } catch (error) {
        logger.error('Failed to update DBS verification', {
          verificationId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return updatedCount;
  }
}

export default DBSVerificationService;
