/**
 * @fileoverview certification Service
 * @module Hr/CertificationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description certification Service
 */

import { Repository } from 'typeorm';
import { EventEmitter2 } from 'eventemitter2';
import AppDataSource from '../../config/database';
import { Certification, CertificationStatus } from '../../entities/hr/Certification';
import { Employee } from '../../entities/hr/Employee';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export interface CertificationSearchCriteria {
  status?: CertificationStatus;
  certifyingBody?: string;
  employeeId?: string;
  department?: string;
  expiringSoon?: boolean; // within 30 days
  expired?: boolean;
  renewalRequired?: boolean;
  skills?: string[];
}

export interface CertificationSummary {
  totalCertifications: number;
  activeCertifications: number;
  expiredCertifications: number;
  expiringSoon: number; // within 30 days
  renewalRequired: number;
  byCertifyingBody: {
    body: string;
    count: number;
    active: number;
    expired: number;
  }[];
  byDepartment: {
    department: string;
    count: number;
    active: number;
    expired: number;
  }[];
  complianceRate: number;
  averageDaysToExpiry: number;
}

export interface CertificationUpdateData {
  certificationName?: string;
  certifyingBody?: string;
  certificationNumber?: string;
  dateObtained?: Date;
  expiryDate?: Date;
  renewalRequired?: boolean;
  status?: CertificationStatus;
  documentUrl?: string;
  notes?: string;
}

export interface CertificationRenewalData {
  newCertificationNumber?: string;
  newExpiryDate: Date;
  documentUrl?: string;
  notes?: string;
}

export class CertificationService {
  privatecertificationRepository: Repository<Certification>;
  privateemployeeRepository: Repository<Employee>;
  privatenotificationService: NotificationService;
  privateauditService: AuditService;

  const ructor() {
    this.certificationRepository = AppDataSource.getRepository(Certification);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  // Certification Management
  async createCertification(certificationData: Partial<Certification>): Promise<Certification> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: certificationData.employeeId }
    });
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check for duplicate certification
    const existingCertification = await this.certificationRepository.findOne({
      where: {
        employeeId: certificationData.employeeId,
        certificationName: certificationData.certificationName,
        certifyingBody: certificationData.certifyingBody
      }
    });
    if (existingCertification) {
      throw new Error('Certification already exists for this employee');
    }

    const certification = this.certificationRepository.create(certificationData);
    const savedCertification = await this.certificationRepository.save(certification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Certification',
      entityType: 'Certification',
      entityId: savedCertification.id,
      action: 'CREATE',
      details: {
        employeeId: savedCertification.employeeId,
        certificationName: savedCertification.certificationName,
        certifyingBody: savedCertification.certifyingBody
      },
      userId: 'system'
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'New Certification Added',
      type: 'certification_added',
      recipients: ['hr_team', 'line_managers', certificationData.employeeId],
      data: {
        employeeName: employee.getFullName(),
        certificationName: savedCertification.certificationName,
        certifyingBody: savedCertification.certifyingBody
      }
    });

    return savedCertification;
  }

  async getCertificationById(certificationId: string): Promise<Certification | null> {
    return await this.certificationRepository.findOne({
      where: { id: certificationId },
      relations: ['employee']
    });
  }

  async getAllCertifications(): Promise<Certification[]> {
    return await this.certificationRepository.find({
      relations: ['employee'],
      order: { createdAt: 'DESC' }
    });
  }

  async getCertificationsByEmployee(employeeId: string): Promise<Certification[]> {
    return await this.certificationRepository.find({
      where: { employeeId },
      relations: ['employee'],
      order: { dateObtained: 'DESC' }
    });
  }

  async searchCertifications(criteria: CertificationSearchCriteria): Promise<Certification[]> {
    let queryBuilder = this.certificationRepository.createQueryBuilder('certification')
      .leftJoinAndSelect('certification.employee', 'employee');

    if (criteria.status) {
      queryBuilder = queryBuilder.andWhere('certification.status = :status', { status: criteria.status });
    }

    if (criteria.certifyingBody) {
      queryBuilder = queryBuilder.andWhere('certification.certifyingBody = :certifyingBody', { certifyingBody: criteria.certifyingBody });
    }

    if (criteria.employeeId) {
      queryBuilder = queryBuilder.andWhere('certification.employeeId = :employeeId', { employeeId: criteria.employeeId });
    }

    if (criteria.department) {
      queryBuilder = queryBuilder.andWhere('employee.department = :department', { department: criteria.department });
    }

    if (criteria.renewalRequired !== undefined) {
      queryBuilder = queryBuilder.andWhere('certification.renewalRequired = :renewalRequired', { renewalRequired: criteria.renewalRequired });
    }

    if (criteria.expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      queryBuilder = queryBuilder.andWhere('certification.expiryDate <= :expiryDate', { expiryDate: thirtyDaysFromNow });
      queryBuilder = queryBuilder.andWhere('certification.status = :status', { status: CertificationStatus.ACTIVE });
    }

    if (criteria.expired) {
      const now = new Date();
      queryBuilder = queryBuilder.andWhere('certification.expiryDate < :now', { now });
      queryBuilder = queryBuilder.andWhere('certification.status = :status', { status: CertificationStatus.ACTIVE });
    }

    return await queryBuilder.getMany();
  }

  async updateCertification(certificationId: string, updateData: CertificationUpdateData): Promise<Certification> {
    const certification = await this.getCertificationById(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    Object.assign(certification, updateData);
    const updatedCertification = await this.certificationRepository.save(certification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Certification',
      entityType: 'Certification',
      entityId: certificationId,
      action: 'UPDATE',
      details: updateData,
      userId: 'system'
    });

    return updatedCertification;
  }

  async deleteCertification(certificationId: string): Promise<void> {
    const certification = await this.getCertificationById(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    await this.certificationRepository.remove(certification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Certification',
      entityType: 'Certification',
      entityId: certificationId,
      action: 'DELETE',
      details: {
        employeeId: certification.employeeId,
        certificationName: certification.certificationName
      },
      userId: 'system'
    });
  }

  // Certification Status Management
  async activateCertification(certificationId: string): Promise<Certification> {
    const certification = await this.getCertificationById(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    certification.status = CertificationStatus.ACTIVE;
    const updatedCertification = await this.certificationRepository.save(certification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Certification',
      entityType: 'Certification',
      entityId: certificationId,
      action: 'CERTIFICATION_ACTIVATED',
      details: { previousStatus: certification.status },
      userId: 'system'
    });

    return updatedCertification;
  }

  async suspendCertification(certificationId: string, reason: string): Promise<Certification> {
    const certification = await this.getCertificationById(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    certification.status = CertificationStatus.SUSPENDED;
    certification.notes = reason;
    const updatedCertification = await this.certificationRepository.save(certification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Certification',
      entityType: 'Certification',
      entityId: certificationId,
      action: 'CERTIFICATION_SUSPENDED',
      details: { reason },
      userId: 'system'
    });

    return updatedCertification;
  }

  async expireCertification(certificationId: string): Promise<Certification> {
    const certification = await this.getCertificationById(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    certification.status = CertificationStatus.EXPIRED;
    const updatedCertification = await this.certificationRepository.save(certification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Certification',
      entityType: 'Certification',
      entityId: certificationId,
      action: 'CERTIFICATION_EXPIRED',
      details: { expiryDate: certification.expiryDate },
      userId: 'system'
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Certification Expired',
      type: 'certification_expired',
      recipients: ['hr_team', 'line_managers', certification.employeeId],
      data: {
        employeeName: certification.employee.getFullName(),
        certificationName: certification.certificationName,
        certifyingBody: certification.certifyingBody
      }
    });

    return updatedCertification;
  }

  // Certification Renewal
  async renewCertification(certificationId: string, renewalData: CertificationRenewalData): Promise<Certification> {
    const certification = await this.getCertificationById(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    // Update certification with renewal data
    if (renewalData.newCertificationNumber) {
      certification.certificationNumber = renewalData.newCertificationNumber;
    }
    certification.expiryDate = renewalData.newExpiryDate;
    certification.status = CertificationStatus.ACTIVE;
    if (renewalData.documentUrl) {
      certification.documentUrl = renewalData.documentUrl;
    }
    if (renewalData.notes) {
      certification.notes = renewalData.notes;
    }

    const updatedCertification = await this.certificationRepository.save(certification);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Certification',
      entityType: 'Certification',
      entityId: certificationId,
      action: 'CERTIFICATION_RENEWED',
      details: renewalData,
      userId: 'system'
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Certification Renewed',
      type: 'certification_renewed',
      recipients: ['hr_team', 'line_managers', certification.employeeId],
      data: {
        employeeName: certification.employee.getFullName(),
        certificationName: certification.certificationName,
        certifyingBody: certification.certifyingBody,
        newExpiryDate: renewalData.newExpiryDate
      }
    });

    return updatedCertification;
  }

  // Bulk Certification Operations
  async updateCertifications(certificationIds: string[], updateData: CertificationUpdateData): Promise<number> {
    let updatedCount = 0;

    for (const certificationId of certificationIds) {
      try {
        await this.updateCertification(certificationId, updateData);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update certification ${certificationId}:`, error);
      }
    }

    return updatedCount;
  }

  async bulkRenewCertifications(certificationIds: string[], renewalData: CertificationRenewalData): Promise<number> {
    let renewedCount = 0;

    for (const certificationId of certificationIds) {
      try {
        await this.renewCertification(certificationId, renewalData);
        renewedCount++;
      } catch (error) {
        console.error(`Failed to renew certification ${certificationId}:`, error);
      }
    }

    return renewedCount;
  }

  // Certification Analytics
  async getCertificationSummary(): Promise<CertificationSummary> {
    const certifications = await this.getAllCertifications();
    const activeCertifications = certifications.filter(c => c.status === CertificationStatus.ACTIVE);
    const expiredCertifications = certifications.filter(c => c.status === CertificationStatus.EXPIRED);
    
    // Calculate expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = activeCertifications.filter(c => c.expiryDate <= thirtyDaysFromNow);

    // Calculate renewal required
    const renewalRequired = certifications.filter(c => c.renewalRequired);

    // Group by certifying body
    const byCertifyingBody = this.groupByCertifyingBody(certifications);

    // Group by department
    const byDepartment = this.groupByDepartment(certifications);

    // Calculate compliance rate
    const totalRequiredCertifications = certifications.length;
    const compliantCertifications = activeCertifications.length;
    const complianceRate = totalRequiredCertifications > 0 
      ? (compliantCertifications / totalRequiredCertifications) * 100 
      : 0;

    // Calculate average days to expiry
    const now = new Date();
    const activeWithExpiry = activeCertifications.filter(c => c.expiryDate > now);
    const averageDaysToExpiry = activeWithExpiry.length > 0
      ? activeWithExpiry.reduce((sum, c) => {
          const daysToExpiry = Math.ceil((c.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return sum + daysToExpiry;
        }, 0) / activeWithExpiry.length
      : 0;

    return {
      totalCertifications: certifications.length,
      activeCertifications: activeCertifications.length,
      expiredCertifications: expiredCertifications.length,
      expiringSoon: expiringSoon.length,
      renewalRequired: renewalRequired.length,
      byCertifyingBody,
      byDepartment,
      complianceRate,
      averageDaysToExpiry
    };
  }

  private groupByCertifyingBody(certifications: Certification[]): any[] {
    const grouped = new Map<string, { count: number; active: number; expired: number }>();

    certifications.forEach(cert => {
      const body = cert.certifyingBody;
      if (!grouped.has(body)) {
        grouped.set(body, { count: 0, active: 0, expired: 0 });
      }
      
      const stats = grouped.get(body)!;
      stats.count++;
      if (cert.status === CertificationStatus.ACTIVE) {
        stats.active++;
      } else if (cert.status === CertificationStatus.EXPIRED) {
        stats.expired++;
      }
    });

    return Array.from(grouped.entries()).map(([body, stats]) => ({
      body,
      ...stats
    }));
  }

  private groupByDepartment(certifications: Certification[]): any[] {
    const grouped = new Map<string, { count: number; active: number; expired: number }>();

    certifications.forEach(cert => {
      const department = cert.employee.department;
      if (!grouped.has(department)) {
        grouped.set(department, { count: 0, active: 0, expired: 0 });
      }
      
      const stats = grouped.get(department)!;
      stats.count++;
      if (cert.status === CertificationStatus.ACTIVE) {
        stats.active++;
      } else if (cert.status === CertificationStatus.EXPIRED) {
        stats.expired++;
      }
    });

    return Array.from(grouped.entries()).map(([department, stats]) => ({
      department,
      ...stats
    }));
  }

  // Expiry Management
  async getExpiringCertifications(days: number = 30): Promise<Certification[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await this.certificationRepository
      .createQueryBuilder('certification')
      .leftJoinAndSelect('certification.employee', 'employee')
      .where('certification.expiryDate <= :futureDate', { futureDate })
      .andWhere('certification.status = :status', { status: CertificationStatus.ACTIVE })
      .orderBy('certification.expiryDate', 'ASC')
      .getMany();
  }

  async getExpiredCertifications(): Promise<Certification[]> {
    const now = new Date();
    
    return await this.certificationRepository
      .createQueryBuilder('certification')
      .leftJoinAndSelect('certification.employee', 'employee')
      .where('certification.expiryDate < :now', { now })
      .andWhere('certification.status = :status', { status: CertificationStatus.ACTIVE })
      .orderBy('certification.expiryDate', 'ASC')
      .getMany();
  }

  async processExpiredCertifications(): Promise<number> {
    const expiredCertifications = await this.getExpiredCertifications();
    let processedCount = 0;

    for (const certification of expiredCertifications) {
      try {
        await this.expireCertification(certification.id);
        processedCount++;
      } catch (error) {
        console.error(`Failed to process expired certification ${certification.id}:`, error);
      }
    }

    return processedCount;
  }

  // Reporting
  async getCertificationsByDepartment(department: string): Promise<Certification[]> {
    return await this.searchCertifications({ department });
  }

  async getCertificationsByCertifyingBody(certifyingBody: string): Promise<Certification[]> {
    return await this.searchCertifications({ certifyingBody });
  }

  async getCertificationsNeedingRenewal(): Promise<Certification[]> {
    return await this.searchCertifications({ renewalRequired: true });
  }

  async exportCertifications(criteria: CertificationSearchCriteria): Promise<Certification[]> {
    return await this.searchCertifications(criteria);
  }

  // Compliance Checks
  async checkEmployeeCompliance(employeeId: string): Promise<{
    compliant: boolean;
    missingCertifications: string[];
    expiringCertifications: Certification[];
    expiredCertifications: Certification[];
  }> {
    const certifications = await this.getCertificationsByEmployee(employeeId);
    const activeCertifications = certifications.filter(c => c.status === CertificationStatus.ACTIVE);
    const expiringCertifications = activeCertifications.filter(c => c.isExpiringSoon());
    const expiredCertifications = certifications.filter(c => c.status === CertificationStatus.EXPIRED);

    // Define required certifications for the employee's role
    // This would typically come from a configuration or role-based requirements
    const requiredCertifications = [
      'First Aid',
      'Health and Safety',
      'Safeguarding',
      'Fire Safety'
    ];

    const missingCertifications = requiredCertifications.filter(required => 
      !activeCertifications.some(cert => 
        cert.certificationName.toLowerCase().includes(required.toLowerCase())
      )
    );

    return {
      compliant: missingCertifications.length === 0 && expiredCertifications.length === 0,
      missingCertifications,
      expiringCertifications,
      expiredCertifications
    };
  }

  async getComplianceReport(): Promise<{
    totalEmployees: number;
    compliantEmployees: number;
    nonCompliantEmployees: number;
    complianceRate: number;
    employeesByCompliance: {
      employeeId: string;
      employeeName: string;
      compliant: boolean;
      missingCertifications: string[];
      expiringCertifications: number;
      expiredCertifications: number;
    }[];
  }> {
    const employees = await this.employeeRepository.find();
    const employeesByCompliance = [];

    for (const employee of employees) {
      const compliance = await this.checkEmployeeCompliance(employee.id);
      employeesByCompliance.push({
        employeeId: employee.id,
        employeeName: employee.getFullName(),
        compliant: compliance.compliant,
        missingCertifications: compliance.missingCertifications,
        expiringCertifications: compliance.expiringCertifications.length,
        expiredCertifications: compliance.expiredCertifications.length
      });
    }

    const compliantEmployees = employeesByCompliance.filter(emp => emp.compliant).length;
    const complianceRate = employees.length > 0 ? (compliantEmployees / employees.length) * 100 : 0;

    return {
      totalEmployees: employees.length,
      compliantEmployees,
      nonCompliantEmployees: employees.length - compliantEmployees,
      complianceRate,
      employeesByCompliance
    };
  }
}
