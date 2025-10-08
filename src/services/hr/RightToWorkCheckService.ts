/**
 * @fileoverview right to work check Service
 * @module Hr/RightToWorkCheckService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description right to work check Service
 */

import { EventEmitter2 } from "eventemitter2";
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { RightToWorkCheck, RightToWorkStatus, RightToWorkDocumentType, RightToWorkVerificationType, RightToWorkPriority } from '../../entities/hr/RightToWorkCheck';
import { RightToWorkDocument } from '../../entities/hr/RightToWorkDocument';
import { RightToWorkNotification } from '../../entities/hr/RightToWorkNotification';
import { Employee } from '../../entities/hr/Employee';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';
import { logger } from '../../utils/logger';

export interface RightToWorkCheckRequest {
  employeeId: string;
  documentType: RightToWorkDocumentType;
  verificationType: RightToWorkVerificationType;
  priority: RightToWorkPriority;
  documentNumber?: string;
  passportNumber?: string;
  visaNumber?: string;
  workPermitNumber?: string;
  referenceNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingCountry?: string;
  issuingAuthority?: string;
  careHomeId?: string;
  department?: string;
  position?: string;
  isVulnerableAdultRole?: boolean;
  isChildRole?: boolean;
  verificationCost?: number;
  currency?: string;
}

export interface RightToWorkCheckUpdate {
  status?: RightToWorkStatus;
  documentNumber?: string;
  passportNumber?: string;
  visaNumber?: string;
  workPermitNumber?: string;
  referenceNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  verificationDate?: Date;
  issuingCountry?: string;
  issuingAuthority?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  additionalInformation?: string;
  riskLevel?: string;
  riskAssessmentNotes?: string;
  isHighRisk?: boolean;
}

export interface RightToWorkCheckSearchCriteria {
  employeeId?: string;
  status?: RightToWorkStatus;
  documentType?: RightToWorkDocumentType;
  verificationType?: RightToWorkVerificationType;
  priority?: RightToWorkPriority;
  careHomeId?: string;
  department?: string;
  isVulnerableAdultRole?: boolean;
  isChildRole?: boolean;
  isCompliant?: boolean;
  requiresRenewal?: boolean;
  isHighRisk?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
  issuingCountry?: string;
}

export interface RightToWorkComplianceReport {
  totalChecks: number;
  compliantChecks: number;
  nonCompliantChecks: number;
  expiringChecks: number;
  expiredChecks: number;
  complianceRate: number;
  averageProcessingTime: number;
  costAnalysis: {
    totalCost: number;
    averageCost: number;
    costByDocumentType: { [key in RightToWorkDocumentType]: number };
  };
  riskAnalysis: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
  documentTypeBreakdown: { [key in RightToWorkDocumentType]: number };
  countryBreakdown: { [country: string]: number };
  departmentBreakdown: { [department: string]: number };
}

export class RightToWorkCheckService {
  private rightToWorkCheckRepository: Repository<RightToWorkCheck>;
  private rightToWorkDocumentRepository: Repository<RightToWorkDocument>;
  private rightToWorkNotificationRepository: Repository<RightToWorkNotification>;
  private employeeRepository: Repository<Employee>;
  private auditService: AuditService;
  private notificationService: NotificationService;
  private eventEmitter: EventEmitter2;

  constructor() {
    this.rightToWorkCheckRepository = AppDataSource.getRepository(RightToWorkCheck);
    this.rightToWorkDocumentRepository = AppDataSource.getRepository(RightToWorkDocument);
    this.rightToWorkNotificationRepository = AppDataSource.getRepository(RightToWorkNotification);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
    this.eventEmitter = new EventEmitter2();
  }

  /**
   * Create a new Right to Work check
   */
  async createRightToWorkCheck(
    request: RightToWorkCheckRequest,
    createdBy: string
  ): Promise<RightToWorkCheck> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: request.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if employee already has an active Right to Work check
    const existingCheck = await this.rightToWorkCheckRepository.findOne({
      where: {
        employeeId: request.employeeId,
        status: RightToWorkStatus.VERIFIED
      }
    });

    if (existingCheck && !existingCheck.isExpired()) {
      throw new Error('Employee already has an active Right to Work check');
    }

    // Create Right to Work check
    const rightToWorkCheck = this.rightToWorkCheckRepository.create({
      employeeId: request.employeeId,
      documentType: request.documentType,
      verificationType: request.verificationType,
      priority: request.priority,
      documentNumber: request.documentNumber,
      passportNumber: request.passportNumber,
      visaNumber: request.visaNumber,
      workPermitNumber: request.workPermitNumber,
      referenceNumber: request.referenceNumber,
      issueDate: request.issueDate,
      expiryDate: request.expiryDate,
      issuingCountry: request.issuingCountry,
      issuingAuthority: request.issuingAuthority,
      careHomeId: request.careHomeId,
      department: request.department,
      position: request.position,
      isVulnerableAdultRole: request.isVulnerableAdultRole || false,
      isChildRole: request.isChildRole || false,
      verificationCost: request.verificationCost,
      currency: request.currency || 'GBP',
      createdBy
    });

    const savedCheck = await this.rightToWorkCheckRepository.save(rightToWorkCheck);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'RightToWorkCheck',
      entityType: 'RightToWorkCheck',
      entityId: savedCheck.id,
      action: 'CREATE',
      details: {
        employeeId: request.employeeId,
        documentType: request.documentType,
        verificationType: request.verificationType
      },
      userId: createdBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Right to Work check request created',
      type: 'right_to_work_check_created',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        employeeId: request.employeeId,
        employeeName: employee.getFullName(),
        documentType: request.documentType,
        checkId: savedCheck.id
      }
    });

    // Emit event
    this.eventEmitter.emit('right_to_work.check.created', {
      checkId: savedCheck.id,
      employeeId: request.employeeId,
      documentType: request.documentType
    });

    logger.info('Right to Work check created', {
      checkId: savedCheck.id,
      employeeId: request.employeeId,
      documentType: request.documentType,
      createdBy
    });

    return savedCheck;
  }

  /**
   * Get Right to Work check by ID
   */
  async getRightToWorkCheckById(checkId: string): Promise<RightToWorkCheck | null> {
    return await this.rightToWorkCheckRepository.findOne({
      where: { id: checkId },
      relations: ['employee', 'documents', 'notifications']
    });
  }

  /**
   * Get Right to Work checks by employee ID
   */
  async getRightToWorkChecksByEmployee(employeeId: string): Promise<RightToWorkCheck[]> {
    return await this.rightToWorkCheckRepository.find({
      where: { employeeId },
      relations: ['employee', 'documents', 'notifications'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Search Right to Work checks with criteria
   */
  async searchRightToWorkChecks(criteria: RightToWorkCheckSearchCriteria): Promise<RightToWorkCheck[]> {
    const queryBuilder = this.rightToWorkCheckRepository.createQueryBuilder('rtw');

    if (criteria.employeeId) {
      queryBuilder.andWhere('rtw.employeeId = :employeeId', { employeeId: criteria.employeeId });
    }

    if (criteria.status) {
      queryBuilder.andWhere('rtw.status = :status', { status: criteria.status });
    }

    if (criteria.documentType) {
      queryBuilder.andWhere('rtw.documentType = :documentType', { documentType: criteria.documentType });
    }

    if (criteria.verificationType) {
      queryBuilder.andWhere('rtw.verificationType = :verificationType', { verificationType: criteria.verificationType });
    }

    if (criteria.priority) {
      queryBuilder.andWhere('rtw.priority = :priority', { priority: criteria.priority });
    }

    if (criteria.careHomeId) {
      queryBuilder.andWhere('rtw.careHomeId = :careHomeId', { careHomeId: criteria.careHomeId });
    }

    if (criteria.department) {
      queryBuilder.andWhere('rtw.department = :department', { department: criteria.department });
    }

    if (criteria.isVulnerableAdultRole !== undefined) {
      queryBuilder.andWhere('rtw.isVulnerableAdultRole = :isVulnerableAdultRole', { 
        isVulnerableAdultRole: criteria.isVulnerableAdultRole 
      });
    }

    if (criteria.isChildRole !== undefined) {
      queryBuilder.andWhere('rtw.isChildRole = :isChildRole', { 
        isChildRole: criteria.isChildRole 
      });
    }

    if (criteria.isCompliant !== undefined) {
      queryBuilder.andWhere('rtw.isCompliant = :isCompliant', { 
        isCompliant: criteria.isCompliant 
      });
    }

    if (criteria.requiresRenewal !== undefined) {
      queryBuilder.andWhere('rtw.requiresRenewal = :requiresRenewal', { 
        requiresRenewal: criteria.requiresRenewal 
      });
    }

    if (criteria.isHighRisk !== undefined) {
      queryBuilder.andWhere('rtw.isHighRisk = :isHighRisk', { 
        isHighRisk: criteria.isHighRisk 
      });
    }

    if (criteria.createdAfter) {
      queryBuilder.andWhere('rtw.createdAt >= :createdAfter', { createdAfter: criteria.createdAfter });
    }

    if (criteria.createdBefore) {
      queryBuilder.andWhere('rtw.createdAt <= :createdBefore', { createdBefore: criteria.createdBefore });
    }

    if (criteria.expiresAfter) {
      queryBuilder.andWhere('rtw.expiryDate >= :expiresAfter', { expiresAfter: criteria.expiresAfter });
    }

    if (criteria.expiresBefore) {
      queryBuilder.andWhere('rtw.expiryDate <= :expiresBefore', { expiresBefore: criteria.expiresBefore });
    }

    if (criteria.issuingCountry) {
      queryBuilder.andWhere('rtw.issuingCountry = :issuingCountry', { issuingCountry: criteria.issuingCountry });
    }

    return await queryBuilder
      .leftJoinAndSelect('rtw.employee', 'employee')
      .leftJoinAndSelect('rtw.documents', 'documents')
      .leftJoinAndSelect('rtw.notifications', 'notifications')
      .orderBy('rtw.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Update Right to Work check
   */
  async updateRightToWorkCheck(
    checkId: string,
    updates: RightToWorkCheckUpdate,
    updatedBy: string
  ): Promise<RightToWorkCheck> {
    const check = await this.getRightToWorkCheckById(checkId);
    if (!check) {
      throw new Error('Right to Work check not found');
    }

    // Update fields
    Object.assign(check, updates);
    check.updatedBy = updatedBy;

    const updatedCheck = await this.rightToWorkCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'RightToWorkCheck',
      entityType: 'RightToWorkCheck',
      entityId: checkId,
      action: 'UPDATE',
      details: updates,
      userId: updatedBy
    });

    // Emit event
    this.eventEmitter.emit('right_to_work.check.updated', {
      checkId,
      updates,
      updatedBy
    });

    logger.info('Right to Work check updated', {
      checkId,
      updates,
      updatedBy
    });

    return updatedCheck;
  }

  /**
   * Start Right to Work verification
   */
  async startRightToWorkVerification(
    checkId: string,
    startedBy: string
  ): Promise<RightToWorkCheck> {
    const check = await this.getRightToWorkCheckById(checkId);
    if (!check) {
      throw new Error('Right to Work check not found');
    }

    check.startVerification(startedBy);
    const updatedCheck = await this.rightToWorkCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'RightToWorkCheck',
      entityType: 'RightToWorkCheck',
      entityId: checkId,
      action: 'VERIFICATION_STARTED',
      details: {},
      userId: startedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Right to Work verification started',
      type: 'right_to_work_verification_started',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        checkId,
        employeeId: check.employeeId
      }
    });

    return updatedCheck;
  }

  /**
   * Submit for verification
   */
  async submitForVerification(
    checkId: string,
    submittedBy: string
  ): Promise<RightToWorkCheck> {
    const check = await this.getRightToWorkCheckById(checkId);
    if (!check) {
      throw new Error('Right to Work check not found');
    }

    check.submitForVerification(submittedBy);
    const updatedCheck = await this.rightToWorkCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'RightToWorkCheck',
      entityType: 'RightToWorkCheck',
      entityId: checkId,
      action: 'SUBMITTED_FOR_VERIFICATION',
      details: {},
      userId: submittedBy
    });

    return updatedCheck;
  }

  /**
   * Complete verification
   */
  async completeVerification(
    checkId: string,
    isValid: boolean,
    verifiedBy: string,
    notes?: string
  ): Promise<RightToWorkCheck> {
    const check = await this.getRightToWorkCheckById(checkId);
    if (!check) {
      throw new Error('Right to Work check not found');
    }

    check.completeVerification(isValid, verifiedBy, notes);
    const updatedCheck = await this.rightToWorkCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'RightToWorkCheck',
      entityType: 'RightToWorkCheck',
      entityId: checkId,
      action: 'VERIFICATION_COMPLETED',
      details: { isValid, notes },
      userId: verifiedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: `Right to Work verification ${isValid ? 'verified' : 'invalid'}`,
      type: isValid ? 'right_to_work_verified' : 'right_to_work_invalid',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        checkId,
        employeeId: check.employeeId,
        isValid
      }
    });

    return updatedCheck;
  }

  /**
   * Reject verification
   */
  async rejectVerification(
    checkId: string,
    reason: string,
    rejectedBy: string
  ): Promise<RightToWorkCheck> {
    const check = await this.getRightToWorkCheckById(checkId);
    if (!check) {
      throw new Error('Right to Work check not found');
    }

    check.rejectVerification(reason, rejectedBy);
    const updatedCheck = await this.rightToWorkCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'RightToWorkCheck',
      entityType: 'RightToWorkCheck',
      entityId: checkId,
      action: 'VERIFICATION_REJECTED',
      details: { reason },
      userId: rejectedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Right to Work verification rejected',
      type: 'right_to_work_rejected',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        checkId,
        employeeId: check.employeeId,
        reason
      }
    });

    return updatedCheck;
  }

  /**
   * Get Right to Work compliance report
   */
  async getRightToWorkComplianceReport(careHomeId?: string): Promise<RightToWorkComplianceReport> {
    const queryBuilder = this.rightToWorkCheckRepository.createQueryBuilder('rtw');

    if (careHomeId) {
      queryBuilder.andWhere('rtw.careHomeId = :careHomeId', { careHomeId });
    }

    const checks = await queryBuilder.getMany();

    const totalChecks = checks.length;
    const compliantChecks = checks.filter(c => c.isCompliant).length;
    const nonCompliantChecks = totalChecks - compliantChecks;
    const expiringChecks = checks.filter(c => c.isDueForRenewal(30)).length;
    const expiredChecks = checks.filter(c => c.isExpired()).length;

    const complianceRate = totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 0;

    // Calculate average processing time
    const completedChecks = checks.filter(c => c.verificationDate && c.createdAt);
    const averageProcessingTime = completedChecks.length > 0
      ? completedChecks.reduce((sum, c) => {
          const processingTime = c.verificationDate!.getTime() - c.createdAt.getTime();
          return sum + processingTime;
        }, 0) / completedChecks.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Cost analysis
    const totalCost = checks.reduce((sum, c) => sum + (c.verificationCost || 0), 0);
    const averageCost = totalChecks > 0 ? totalCost / totalChecks : 0;

    const costByDocumentType = Object.values(RightToWorkDocumentType).reduce((acc, docType) => {
      const typeChecks = checks.filter(c => c.documentType === docType);
      acc[docType] = typeChecks.reduce((sum, c) => sum + (c.verificationCost || 0), 0);
      return acc;
    }, {} as { [key in RightToWorkDocumentType]: number });

    // Risk analysis
    const highRiskCount = checks.filter(c => c.riskLevel === 'high').length;
    const mediumRiskCount = checks.filter(c => c.riskLevel === 'medium').length;
    const lowRiskCount = checks.filter(c => c.riskLevel === 'low').length;

    // Document type breakdown
    const documentTypeBreakdown = Object.values(RightToWorkDocumentType).reduce((acc, docType) => {
      acc[docType] = checks.filter(c => c.documentType === docType).length;
      return acc;
    }, {} as { [key in RightToWorkDocumentType]: number });

    // Country breakdown
    const countryBreakdown = checks.reduce((acc, c) => {
      const country = c.issuingCountry || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as { [country: string]: number });

    // Department breakdown
    const departmentBreakdown = checks.reduce((acc, c) => {
      const dept = c.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as { [department: string]: number });

    return {
      totalChecks,
      compliantChecks,
      nonCompliantChecks,
      expiringChecks,
      expiredChecks,
      complianceRate,
      averageProcessingTime,
      costAnalysis: {
        totalCost,
        averageCost,
        costByDocumentType
      },
      riskAnalysis: {
        highRiskCount,
        mediumRiskCount,
        lowRiskCount
      },
      documentTypeBreakdown,
      countryBreakdown,
      departmentBreakdown
    };
  }

  /**
   * Get expiring Right to Work checks
   */
  async getExpiringRightToWorkChecks(withinDays: number = 30): Promise<RightToWorkCheck[]> {
    return await this.rightToWorkCheckRepository.find({
      where: {
        status: RightToWorkStatus.VERIFIED,
        isCompliant: true
      },
      relations: ['employee']
    }).then(checks => 
      checks.filter(c => c.isDueForRenewal(withinDays))
    );
  }

  /**
   * Get expired Right to Work checks
   */
  async getExpiredRightToWorkChecks(): Promise<RightToWorkCheck[]> {
    return await this.rightToWorkCheckRepository.find({
      where: {
        status: RightToWorkStatus.VERIFIED
      },
      relations: ['employee']
    }).then(checks => 
      checks.filter(c => c.isExpired())
    );
  }

  /**
   * Delete Right to Work check
   */
  async deleteRightToWorkCheck(checkId: string, deletedBy: string): Promise<void> {
    const check = await this.getRightToWorkCheckById(checkId);
    if (!check) {
      throw new Error('Right to Work check not found');
    }

    // Soft delete
    await this.rightToWorkCheckRepository.softDelete(checkId);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'RightToWorkCheck',
      entityType: 'RightToWorkCheck',
      entityId: checkId,
      action: 'DELETE',
      details: { employeeId: check.employeeId },
      userId: deletedBy
    });

    logger.info('Right to Work check deleted', {
      checkId,
      employeeId: check.employeeId,
      deletedBy
    });
  }

  /**
   * Bulk update Right to Work check status
   */
  async bulkUpdateRightToWorkCheckStatus(
    checkIds: string[],
    status: RightToWorkStatus,
    updatedBy: string,
    notes?: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const checkId of checkIds) {
      try {
        await this.updateRightToWorkCheck(checkId, { status, verificationNotes: notes }, updatedBy);
        updatedCount++;
      } catch (error) {
        logger.error('Failed to update Right to Work check', {
          checkId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return updatedCount;
  }
}

export default RightToWorkCheckService;