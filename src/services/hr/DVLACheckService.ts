/**
 * @fileoverview d v l a check Service
 * @module Hr/DVLACheckService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description d v l a check Service
 */

import { EventEmitter2 } from "eventemitter2";
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { DVLACheck, DVLACheckStatus, DVLALicenseType, DVLACheckPriority, DVLALicenseCategory } from '../../entities/hr/DVLACheck';
import { DVLAService } from '../../entities/hr/DVLAService';
import { Employee } from '../../entities/hr/Employee';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';
import { logger } from '../../utils/logger';

export interface DVLACheckRequest {
  employeeId: string;
  licenseType: DVLALicenseType;
  priority: DVLACheckPriority;
  licenseNumber: string;
  referenceNumber?: string;
  dvlaReference?: string;
  licenseCategories: DVLALicenseCategory[];
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  issuingCountry?: string;
  careHomeId?: string;
  department?: string;
  position?: string;
  requiresDriving?: boolean;
  isVulnerableAdultRole?: boolean;
  isChildRole?: boolean;
  verificationCost?: number;
  currency?: string;
}

export interface DVLACheckUpdate {
  status?: DVLACheckStatus;
  licenseNumber?: string;
  referenceNumber?: string;
  dvlaReference?: string;
  licenseCategories?: DVLALicenseCategory[];
  issueDate?: Date;
  expiryDate?: Date;
  verificationDate?: Date;
  issuingAuthority?: string;
  issuingCountry?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  additionalInformation?: string;
  riskLevel?: string;
  riskAssessmentNotes?: string;
  isHighRisk?: boolean;
}

export interface DVLACheckSearchCriteria {
  employeeId?: string;
  status?: DVLACheckStatus;
  licenseType?: DVLALicenseType;
  priority?: DVLACheckPriority;
  careHomeId?: string;
  department?: string;
  requiresDriving?: boolean;
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
  licenseCategory?: DVLALicenseCategory;
}

export interface DVLACheckComplianceReport {
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
    costByLicenseType: { [key in DVLALicenseType]: number };
  };
  riskAnalysis: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
  licenseTypeBreakdown: { [key in DVLALicenseType]: number };
  categoryBreakdown: { [key in DVLALicenseCategory]: number };
  countryBreakdown: { [country: string]: number };
  departmentBreakdown: { [department: string]: number };
}

export class DVLACheckService {
  private dvlaCheckRepository: Repository<DVLACheck>;
  private dvlaServiceRepository: Repository<DVLAService>;
  private employeeRepository: Repository<Employee>;
  private auditService: AuditService;
  private notificationService: NotificationService;
  private eventEmitter: EventEmitter2;

  constructor() {
    this.dvlaCheckRepository = AppDataSource.getRepository(DVLACheck);
    this.dvlaServiceRepository = AppDataSource.getRepository(DVLAService);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
    this.eventEmitter = new EventEmitter2();
  }

  /**
   * Create a new DVLA check
   */
  async createDVLACheck(
    request: DVLACheckRequest,
    createdBy: string
  ): Promise<DVLACheck> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: request.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if employee already has an active DVLA check
    const existingCheck = await this.dvlaCheckRepository.findOne({
      where: {
        employeeId: request.employeeId,
        status: DVLACheckStatus.VERIFIED
      }
    });

    if (existingCheck && !existingCheck.isExpired()) {
      throw new Error('Employee already has an active DVLA check');
    }

    // Create DVLA check
    const dvlaCheck = this.dvlaCheckRepository.create({
      employeeId: request.employeeId,
      licenseType: request.licenseType,
      priority: request.priority,
      licenseNumber: request.licenseNumber,
      referenceNumber: request.referenceNumber,
      dvlaReference: request.dvlaReference,
      licenseCategories: request.licenseCategories,
      issueDate: request.issueDate,
      expiryDate: request.expiryDate,
      issuingAuthority: request.issuingAuthority,
      issuingCountry: request.issuingCountry,
      careHomeId: request.careHomeId,
      department: request.department,
      position: request.position,
      requiresDriving: request.requiresDriving || false,
      isVulnerableAdultRole: request.isVulnerableAdultRole || false,
      isChildRole: request.isChildRole || false,
      verificationCost: request.verificationCost,
      currency: request.currency || 'GBP',
      createdBy
    });

    const savedCheck = await this.dvlaCheckRepository.save(dvlaCheck);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DVLACheck',
      entityType: 'DVLACheck',
      entityId: savedCheck.id,
      action: 'CREATE',
      details: {
        employeeId: request.employeeId,
        licenseType: request.licenseType,
        licenseNumber: request.licenseNumber
      },
      userId: createdBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'DVLA check request created',
      type: 'dvla_check_created',
      recipients: ['hr_team', 'compliance_team'],
      data: {
        employeeId: request.employeeId,
        employeeName: employee.getFullName(),
        licenseType: request.licenseType,
        checkId: savedCheck.id
      }
    });

    // Emit event
    this.eventEmitter.emit('dvla.check.created', {
      checkId: savedCheck.id,
      employeeId: request.employeeId,
      licenseType: request.licenseType
    });

    logger.info('DVLA check created', {
      checkId: savedCheck.id,
      employeeId: request.employeeId,
      licenseType: request.licenseType,
      createdBy
    });

    return savedCheck;
  }

  /**
   * Get DVLA check by ID
   */
  async getDVLACheckById(checkId: string): Promise<DVLACheck | null> {
    return await this.dvlaCheckRepository.findOne({
      where: { id: checkId },
      relations: ['employee', 'services']
    });
  }

  /**
   * Get DVLA checks by employee ID
   */
  async getDVLAChecksByEmployee(employeeId: string): Promise<DVLACheck[]> {
    return await this.dvlaCheckRepository.find({
      where: { employeeId },
      relations: ['employee', 'services'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Search DVLA checks with criteria
   */
  async searchDVLAChecks(criteria: DVLACheckSearchCriteria): Promise<DVLACheck[]> {
    const queryBuilder = this.dvlaCheckRepository.createQueryBuilder('dvla');

    if (criteria.employeeId) {
      queryBuilder.andWhere('dvla.employeeId = :employeeId', { employeeId: criteria.employeeId });
    }

    if (criteria.status) {
      queryBuilder.andWhere('dvla.status = :status', { status: criteria.status });
    }

    if (criteria.licenseType) {
      queryBuilder.andWhere('dvla.licenseType = :licenseType', { licenseType: criteria.licenseType });
    }

    if (criteria.priority) {
      queryBuilder.andWhere('dvla.priority = :priority', { priority: criteria.priority });
    }

    if (criteria.careHomeId) {
      queryBuilder.andWhere('dvla.careHomeId = :careHomeId', { careHomeId: criteria.careHomeId });
    }

    if (criteria.department) {
      queryBuilder.andWhere('dvla.department = :department', { department: criteria.department });
    }

    if (criteria.requiresDriving !== undefined) {
      queryBuilder.andWhere('dvla.requiresDriving = :requiresDriving', { 
        requiresDriving: criteria.requiresDriving 
      });
    }

    if (criteria.isVulnerableAdultRole !== undefined) {
      queryBuilder.andWhere('dvla.isVulnerableAdultRole = :isVulnerableAdultRole', { 
        isVulnerableAdultRole: criteria.isVulnerableAdultRole 
      });
    }

    if (criteria.isChildRole !== undefined) {
      queryBuilder.andWhere('dvla.isChildRole = :isChildRole', { 
        isChildRole: criteria.isChildRole 
      });
    }

    if (criteria.isCompliant !== undefined) {
      queryBuilder.andWhere('dvla.isCompliant = :isCompliant', { 
        isCompliant: criteria.isCompliant 
      });
    }

    if (criteria.requiresRenewal !== undefined) {
      queryBuilder.andWhere('dvla.requiresRenewal = :requiresRenewal', { 
        requiresRenewal: criteria.requiresRenewal 
      });
    }

    if (criteria.isHighRisk !== undefined) {
      queryBuilder.andWhere('dvla.isHighRisk = :isHighRisk', { 
        isHighRisk: criteria.isHighRisk 
      });
    }

    if (criteria.createdAfter) {
      queryBuilder.andWhere('dvla.createdAt >= :createdAfter', { createdAfter: criteria.createdAfter });
    }

    if (criteria.createdBefore) {
      queryBuilder.andWhere('dvla.createdAt <= :createdBefore', { createdBefore: criteria.createdBefore });
    }

    if (criteria.expiresAfter) {
      queryBuilder.andWhere('dvla.expiryDate >= :expiresAfter', { expiresAfter: criteria.expiresAfter });
    }

    if (criteria.expiresBefore) {
      queryBuilder.andWhere('dvla.expiryDate <= :expiresBefore', { expiresBefore: criteria.expiresBefore });
    }

    if (criteria.issuingCountry) {
      queryBuilder.andWhere('dvla.issuingCountry = :issuingCountry', { issuingCountry: criteria.issuingCountry });
    }

    if (criteria.licenseCategory) {
      queryBuilder.andWhere('dvla.licenseCategories @> :category', { 
        category: JSON.stringify([criteria.licenseCategory]) 
      });
    }

    return await queryBuilder
      .leftJoinAndSelect('dvla.employee', 'employee')
      .leftJoinAndSelect('dvla.services', 'services')
      .orderBy('dvla.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Update DVLA check
   */
  async updateDVLACheck(
    checkId: string,
    updates: DVLACheckUpdate,
    updatedBy: string
  ): Promise<DVLACheck> {
    const check = await this.getDVLACheckById(checkId);
    if (!check) {
      throw new Error('DVLA check not found');
    }

    // Update fields
    Object.assign(check, updates);
    check.updatedBy = updatedBy;

    const updatedCheck = await this.dvlaCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DVLACheck',
      entityType: 'DVLACheck',
      entityId: checkId,
      action: 'UPDATE',
      details: updates,
      userId: updatedBy
    });

    // Emit event
    this.eventEmitter.emit('dvla.check.updated', {
      checkId,
      updates,
      updatedBy
    });

    logger.info('DVLA check updated', {
      checkId,
      updates,
      updatedBy
    });

    return updatedCheck;
  }

  /**
   * Start DVLA verification
   */
  async startDVLACheckVerification(
    checkId: string,
    startedBy: string
  ): Promise<DVLACheck> {
    const check = await this.getDVLACheckById(checkId);
    if (!check) {
      throw new Error('DVLA check not found');
    }

    check.startVerification(startedBy);
    const updatedCheck = await this.dvlaCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DVLACheck',
      entityType: 'DVLACheck',
      entityId: checkId,
      action: 'VERIFICATION_STARTED',
      details: {},
      userId: startedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'DVLA verification started',
      type: 'dvla_verification_started',
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
  ): Promise<DVLACheck> {
    const check = await this.getDVLACheckById(checkId);
    if (!check) {
      throw new Error('DVLA check not found');
    }

    check.submitForVerification(submittedBy);
    const updatedCheck = await this.dvlaCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DVLACheck',
      entityType: 'DVLACheck',
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
  ): Promise<DVLACheck> {
    const check = await this.getDVLACheckById(checkId);
    if (!check) {
      throw new Error('DVLA check not found');
    }

    check.completeVerification(isValid, verifiedBy, notes);
    const updatedCheck = await this.dvlaCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DVLACheck',
      entityType: 'DVLACheck',
      entityId: checkId,
      action: 'VERIFICATION_COMPLETED',
      details: { isValid, notes },
      userId: verifiedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: `DVLA verification ${isValid ? 'verified' : 'invalid'}`,
      type: isValid ? 'dvla_verified' : 'dvla_invalid',
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
  ): Promise<DVLACheck> {
    const check = await this.getDVLACheckById(checkId);
    if (!check) {
      throw new Error('DVLA check not found');
    }

    check.rejectVerification(reason, rejectedBy);
    const updatedCheck = await this.dvlaCheckRepository.save(check);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DVLACheck',
      entityType: 'DVLACheck',
      entityId: checkId,
      action: 'VERIFICATION_REJECTED',
      details: { reason },
      userId: rejectedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'DVLA verification rejected',
      type: 'dvla_rejected',
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
   * Check if license has required category
   */
  async checkLicenseCategory(
    checkId: string,
    requiredCategory: DVLALicenseCategory
  ): Promise<boolean> {
    const check = await this.getDVLACheckById(checkId);
    if (!check) {
      throw new Error('DVLA check not found');
    }

    return check.hasRequiredCategory(requiredCategory);
  }

  /**
   * Check if license has any of the required categories
   */
  async checkLicenseCategories(
    checkId: string,
    requiredCategories: DVLALicenseCategory[]
  ): Promise<boolean> {
    const check = await this.getDVLACheckById(checkId);
    if (!check) {
      throw new Error('DVLA check not found');
    }

    return check.hasAnyRequiredCategory(requiredCategories);
  }

  /**
   * Get DVLA compliance report
   */
  async getDVLACheckComplianceReport(careHomeId?: string): Promise<DVLACheckComplianceReport> {
    const queryBuilder = this.dvlaCheckRepository.createQueryBuilder('dvla');

    if (careHomeId) {
      queryBuilder.andWhere('dvla.careHomeId = :careHomeId', { careHomeId });
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

    const costByLicenseType = Object.values(DVLALicenseType).reduce((acc, licenseType) => {
      const typeChecks = checks.filter(c => c.licenseType === licenseType);
      acc[licenseType] = typeChecks.reduce((sum, c) => sum + (c.verificationCost || 0), 0);
      return acc;
    }, {} as { [key in DVLALicenseType]: number });

    // Risk analysis
    const highRiskCount = checks.filter(c => c.riskLevel === 'high').length;
    const mediumRiskCount = checks.filter(c => c.riskLevel === 'medium').length;
    const lowRiskCount = checks.filter(c => c.riskLevel === 'low').length;

    // License type breakdown
    const licenseTypeBreakdown = Object.values(DVLALicenseType).reduce((acc, licenseType) => {
      acc[licenseType] = checks.filter(c => c.licenseType === licenseType).length;
      return acc;
    }, {} as { [key in DVLALicenseType]: number });

    // Category breakdown
    const categoryBreakdown = Object.values(DVLALicenseCategory).reduce((acc, category) => {
      acc[category] = checks.filter(c => c.licenseCategories.includes(category)).length;
      return acc;
    }, {} as { [key in DVLALicenseCategory]: number });

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
        costByLicenseType
      },
      riskAnalysis: {
        highRiskCount,
        mediumRiskCount,
        lowRiskCount
      },
      licenseTypeBreakdown,
      categoryBreakdown,
      countryBreakdown,
      departmentBreakdown
    };
  }

  /**
   * Get expiring DVLA checks
   */
  async getExpiringDVLAChecks(withinDays: number = 30): Promise<DVLACheck[]> {
    return await this.dvlaCheckRepository.find({
      where: {
        status: DVLACheckStatus.VERIFIED,
        isCompliant: true
      },
      relations: ['employee']
    }).then(checks => 
      checks.filter(c => c.isDueForRenewal(withinDays))
    );
  }

  /**
   * Get expired DVLA checks
   */
  async getExpiredDVLAChecks(): Promise<DVLACheck[]> {
    return await this.dvlaCheckRepository.find({
      where: {
        status: DVLACheckStatus.VERIFIED
      },
      relations: ['employee']
    }).then(checks => 
      checks.filter(c => c.isExpired())
    );
  }

  /**
   * Delete DVLA check
   */
  async deleteDVLACheck(checkId: string, deletedBy: string): Promise<void> {
    const check = await this.getDVLACheckById(checkId);
    if (!check) {
      throw new Error('DVLA check not found');
    }

    // Soft delete
    await this.dvlaCheckRepository.softDelete(checkId);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'DVLACheck',
      entityType: 'DVLACheck',
      entityId: checkId,
      action: 'DELETE',
      details: { employeeId: check.employeeId },
      userId: deletedBy
    });

    logger.info('DVLA check deleted', {
      checkId,
      employeeId: check.employeeId,
      deletedBy
    });
  }

  /**
   * Bulk update DVLA check status
   */
  async bulkUpdateDVLACheckStatus(
    checkIds: string[],
    status: DVLACheckStatus,
    updatedBy: string,
    notes?: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const checkId of checkIds) {
      try {
        await this.updateDVLACheck(checkId, { status, verificationNotes: notes }, updatedBy);
        updatedCount++;
      } catch (error) {
        logger.error('Failed to update DVLA check', {
          checkId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return updatedCount;
  }
}

export default DVLACheckService;