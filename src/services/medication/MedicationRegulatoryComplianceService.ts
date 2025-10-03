import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Regulatory Compliance Service for Care Home Management System
 * @module MedicationRegulatoryComplianceService
 * @version 1.0.0
 * @author Care Home Management Team
 * @since 2025-01-01
 * 
 * @description Simple medication regulatory compliance service for care home management.
 */

import { Pool } from 'pg';





import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus, ResidentStatus } from '../entities/workforce/OvertimeRequest';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface RegulatoryCompliance {
  id: string;
  organizationId: string;
  complianceType: 'CQC' | 'MHRA' | 'NICE' | 'NHS' | 'GDPR';
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'PENDING_REVIEW';
  lastAssessmentDate: Date;
  nextAssessmentDate: Date;
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  assessedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceFinding {
  id: string;
  type: 'COMPLIANCE' | 'NON_COMPLIANCE' | 'OPPORTUNITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence: string[];
  recommendation: string;
  category: 'MEDICATION' | 'STAFFING' | 'PROCEDURES' | 'DOCUMENTATION' | 'SAFETY';
}

export interface ComplianceRecommendation {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  action: string;
  timeframe: string;
  assignedTo: string;
  status: OvertimeStatus.PENDING | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate: Date;
}

export interface IncidentReport {
  id: string;
  organizationId: string;
  incidentType: 'MEDICATION_ERROR' | 'ADVERSE_REACTION' | 'MISSING_MEDICATION' | 'WRONG_DOSAGE' | 'CONTROLLED_SUBSTANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  residentId?: string;
  medicationId?: string;
  reportedBy: string;
  reportedDate: Date;
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  regulatoryBodies: string[];
  submissionDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIncidentReportRequest {
  organizationId: string;
  incidentType: 'MEDICATION_ERROR' | 'ADVERSE_REACTION' | 'MISSING_MEDICATION' | 'WRONG_DOSAGE' | 'CONTROLLED_SUBSTANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  residentId?: string;
  medicationId?: string;
  reportedBy: string;
}

export class MedicationRegulatoryComplianceService {
  private logger = logger;
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createIncidentReport(request: CreateIncidentReportRequest): Promise<IncidentReport> {
    try {
      console.info('Creating incident report', { 
        incidentType: request.incidentType,
        severity: request.severity,
        organizationId: request.organizationId,
        reportedBy: request.reportedBy
      });

      // Validate required fields
      this.validateIncidentReportRequest(request);

      const incidentId = uuidv4();
      const now = new Date();

      // Determine regulatory bodies that need to be notified
      const regulatoryBodies = this.determineRegulatoryBodies(
        request.incidentType,
        request.severity,
        request.organizationId
      );

      // Calculate submission deadline
      const submissionDeadline = this.calculateSubmissionDeadline(request.severity);

      const incident: IncidentReport = {
        id: incidentId,
        organizationId: request.organizationId,
        incidentType: request.incidentType,
        severity: request.severity,
        description: request.description,
        residentId: request.residentId,
        medicationId: request.medicationId,
        reportedBy: request.reportedBy,
        reportedDate: now,
        status: 'REPORTED',
        regulatoryBodies,
        submissionDeadline,
        createdAt: now,
        updatedAt: now
      };

      // Store incident report
      await this.storeIncidentReport(incident);

      // Send critical incident alerts if needed
      if (request.severity === 'CRITICAL') {
        await this.sendCriticalIncidentAlert(incidentId, request.incidentType, request.organizationId);
      }

      console.info('Incident report created successfully', { 
        incidentId: incident.id,
        regulatoryBodies: regulatoryBodies.length
      });

      return incident;

    } catch (error: unknown) {
      console.error('Failed to create incident report', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        organizationId: request.organizationId 
      });
      throw new Error(`Failed to create incident report: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async getIncidentReports(
    organizationId: string,
    pagination: { page: number; limit: number }
  ): Promise<{ incidents: IncidentReport[]; total: number; page: number; totalPages: number }> {
    try {
      this.logger.debug('Getting incident reports', { organizationId, pagination });

      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM incident_reports 
        WHERE organization_id = $1 AND deleted_at IS NULL
      `;
      const countResult = await this.db.query(countQuery, [organizationId]);
      const total = parseInt(countResult.rows[0].total);

      // Get incidents
      const incidentsQuery = `
        SELECT * FROM incident_reports 
        WHERE organization_id = $1 AND deleted_at IS NULL
        ORDER BY reported_date DESC
        LIMIT $2 OFFSET $3
      `;
      const incidentsResult = await this.db.query(incidentsQuery, [organizationId, limit, offset]);

      const incidents: IncidentReport[] = incidentsResult.rows.map(row => this.mapDbRowToIncident(row));

      const totalPages = Math.ceil(total / limit);

      this.logger.debug('Incident reports retrieved successfully', { 
        total: incidents.length,
        organizationId
      });

      return {
        incidents,
        total,
        page,
        totalPages
      };

    } catch (error: unknown) {
      console.error('Failed to get incident reports', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        organizationId 
      });
      throw new Error(`Failed to get incident reports: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async updateIncidentStatus(
    incidentId: string,
    status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED',
    notes: string,
    userId: string
  ): Promise<void> {
    try {
      this.logger.debug('Updating incident status', { incidentId, status, userId });

      const query = `
        UPDATE incident_reports 
        SET status = $1, notes = $2, updated_at = $3, updated_by = $4
        WHERE id = $5 AND deleted_at IS NULL
      `;

      await this.db.query(query, [status, notes, new Date(), userId, incidentId]);

      console.info('Incident status updated successfully', { 
        incidentId, 
        status 
      });

    } catch (error: unknown) {
      console.error('Failed to update incident status', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        incidentId 
      });
      throw new Error(`Failed to update incident status: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async performComplianceAssessment(
    organizationId: string,
    complianceType: 'CQC' | 'MHRA' | 'NICE' | 'NHS' | 'GDPR',
    assessedBy: string
  ): Promise<RegulatoryCompliance> {
    try {
      console.info('Performing compliance assessment', { 
        organizationId,
        complianceType,
        assessedBy
      });

      const assessmentId = uuidv4();
      const now = new Date();

      // Perform assessment based on compliance type
      const findings = await this.performComplianceChecks(organizationId, complianceType);
      const recommendations = this.generateRecommendations(findings);
      const status = this.determineComplianceStatus(findings);

      const compliance: RegulatoryCompliance = {
        id: assessmentId,
        organizationId,
        complianceType,
        status,
        lastAssessmentDate: now,
        nextAssessmentDate: this.calculateNextAssessmentDate(status),
        findings,
        recommendations,
        assessedBy,
        createdAt: now,
        updatedAt: now
      };

      // Store compliance assessment
      await this.storeComplianceAssessment(compliance);

      console.info('Compliance assessment completed successfully', { 
        assessmentId: compliance.id,
        status: compliance.status,
        findingsCount: findings.length
      });

      return compliance;

    } catch (error: unknown) {
      console.error('Failed to perform compliance assessment', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        organizationId 
      });
      throw new Error(`Failed to perform compliance assessment: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async exportComplianceData(
    exportType: 'full_audit' | 'medication_records' | 'incident_reports' | 'training_records',
    dateRange: { startDate: Date; endDate: Date },
    organizationId: string,
    userId: string
  ): Promise<{
    exportId: string;
    filePath: string;
    recordCount: number;
    exportDate: Date;
    expiryDate: Date;
  }> {
    try {
      console.info('Exporting compliance data', { 
        exportType,
        organizationId,
        userId
      });

      const exportId = uuidv4();
      const exportDate = new Date();
      const expiryDate = new Date(exportDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

      // Collect data based on export type
      const data = await this.collectExportData(exportType, dateRange, organizationId);

      // Generate export file
      const filePath = await this.generateExportFile(exportId, data, exportType);

      // Store export record
      await this.storeExportRecord(exportId, exportType, filePath, data.length, userId, organizationId);

      console.info('Compliance data exported successfully', { 
        exportId,
        recordCount: data.length,
        filePath
      });

      return {
        exportId,
        filePath,
        recordCount: data.length,
        exportDate,
        expiryDate
      };

    } catch (error: unknown) {
      console.error('Failed to export compliance data', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        organizationId 
      });
      throw new Error(`Failed to export compliance data: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private validateIncidentReportRequest(request: CreateIncidentReportRequest): void {
    const errors: string[] = [];

    if (!request.organizationId?.trim()) errors.push('Organization ID is required');
    if (!request.incidentType) errors.push('Incident type is required');
    if (!request.severity) errors.push('Severity is required');
    if (!request.description?.trim()) errors.push('Description is required');
    if (!request.reportedBy?.trim()) errors.push('Reported by is required');

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private determineRegulatoryBodies(
    incidentType: string,
    severity: string,
    organizationId: string
  ): string[] {
    const bodies: string[] = [];

    // Always include CQC for care homes
    bodies.push('CQC');

    // Add MHRA for medication-related incidents
    if (['MEDICATION_ERROR', 'ADVERSE_REACTION', 'WRONG_DOSAGE'].includes(incidentType)) {
      bodies.push('MHRA');
    }

    // Add NHS for high/critical severity
    if (['HIGH', 'CRITICAL'].includes(severity)) {
      bodies.push('NHS');
    }

    return bodies;
  }

  private calculateSubmissionDeadline(severity: string): Date {
    const now = new Date();
    let daysToAdd = 30; // Default 30 days

    switch (severity) {
      case 'CRITICAL':
        daysToAdd = 1; // 24 hours for critical
        break;
      case 'HIGH':
        daysToAdd = 7; // 1 week for high
        break;
      case 'MEDIUM':
        daysToAdd = 14; // 2 weeks for medium
        break;
      case 'LOW':
        daysToAdd = 30; // 1 month for low
        break;
    }

    now.setDate(now.getDate() + daysToAdd);
    return now;
  }

  private async sendCriticalIncidentAlert(
    incidentId: string,
    incidentType: string,
    organizationId: string
  ): Promise<void> {
    try {
      // Simulate sending critical incident alert
      console.warn('CRITICAL INCIDENT ALERT', {
        incidentId,
        incidentType,
        organizationId,
        message: 'Critical incident requires immediate attention'
      });

      // In a real implementation, this would send notifications to:
      // - Care Quality Commission (CQC)
      // - NHS England
      // - Local authority
      // - Internal management team

    } catch (error: unknown) {
      console.error('Failed to send critical incident alert', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        incidentId 
      });
      throw new Error(`Failed to send critical incident alert: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private async performComplianceChecks(
    organizationId: string,
    complianceType: string
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Simulate compliance checks based on type
    switch (complianceType) {
      case 'CQC':
        findings.push(...this.performCQCChecks(organizationId));
        break;
      case 'MHRA':
        findings.push(...this.performMHRAChecks(organizationId));
        break;
      case 'NICE':
        findings.push(...this.performNICEChecks(organizationId));
        break;
      case 'NHS':
        findings.push(...this.performNHSChecks(organizationId));
        break;
      case 'GDPR':
        findings.push(...this.performGDPRChecks(organizationId));
        break;
    }

    return findings;
  }

  private performCQCChecks(organizationId: string): ComplianceFinding[] {
    return [
      {
        id: uuidv4(),
        type: 'COMPLIANCE',
        severity: 'LOW',
        description: 'Medication management procedures are documented',
        evidence: ['Medication policy available', 'Staff training records'],
        recommendation: 'Continue current practices',
        category: 'PROCEDURES'
      },
      {
        id: uuidv4(),
        type: 'NON_COMPLIANCE',
        severity: 'MEDIUM',
        description: 'Some medication records lack proper documentation',
        evidence: ['Missing signatures on 5 medication charts'],
        recommendation: 'Ensure all medication administration is properly documented',
        category: 'DOCUMENTATION'
      }
    ];
  }

  private performMHRAChecks(organizationId: string): ComplianceFinding[] {
    return [
      {
        id: uuidv4(),
        type: 'COMPLIANCE',
        severity: 'LOW',
        description: 'Adverse drug reactions are properly reported',
        evidence: ['ADR reports submitted within required timeframe'],
        recommendation: 'Maintain current reporting standards',
        category: 'MEDICATION'
      }
    ];
  }

  private performNICEChecks(organizationId: string): ComplianceFinding[] {
    return [
      {
        id: uuidv4(),
        type: 'OPPORTUNITY',
        severity: 'MEDIUM',
        description: 'Medication reviews could be more frequent',
        evidence: ['Some residents overdue for medication review'],
        recommendation: 'Implement more frequent medication reviews',
        category: 'MEDICATION'
      }
    ];
  }

  private performNHSChecks(organizationId: string): ComplianceFinding[] {
    return [
      {
        id: uuidv4(),
        type: 'COMPLIANCE',
        severity: 'LOW',
        description: 'NHS data sharing agreements are in place',
        evidence: ['Data sharing agreements signed', 'Privacy notices displayed'],
        recommendation: 'Continue maintaining data sharing compliance',
        category: 'PROCEDURES'
      }
    ];
  }

  private performGDPRChecks(organizationId: string): ComplianceFinding[] {
    return [
      {
        id: uuidv4(),
        type: 'COMPLIANCE',
        severity: 'LOW',
        description: 'Data protection policies are implemented',
        evidence: ['GDPR policy in place', 'Staff training completed'],
        recommendation: 'Continue maintaining GDPR compliance',
        category: 'PROCEDURES'
      }
    ];
  }

  private generateRecommendations(findings: ComplianceFinding[]): ComplianceRecommendation[] {
    return findings
      .filter(finding => finding.type === 'NON_COMPLIANCE' || finding.type === 'OPPORTUNITY')
      .map(finding => ({
        id: uuidv4(),
        priority: this.mapSeverityToPriority(finding.severity),
        description: finding.recommendation,
        action: `Address ${finding.description}`,
        timeframe: this.getTimeframeForPriority(this.mapSeverityToPriority(finding.severity)),
        assignedTo: 'Compliance Officer',
        status: OvertimeStatus.PENDING as const,
        dueDate: this.calculateDueDate(this.mapSeverityToPriority(finding.severity))
      }));
  }

  private mapSeverityToPriority(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const mapping = {
      'LOW': 'LOW' as const,
      'MEDIUM': 'MEDIUM' as const,
      'HIGH': 'HIGH' as const,
      'CRITICAL': 'URGENT' as const
    };
    return mapping[severity] || 'MEDIUM';
  }

  private getTimeframeForPriority(priority: string): string {
    const timeframes = {
      'LOW': '3 months',
      'MEDIUM': '1 month',
      'HIGH': '2 weeks',
      'URGENT': '1 week'
    };
    return timeframes[priority] || '1 month';
  }

  private calculateDueDate(priority: string): Date {
    const now = new Date();
    let daysToAdd = 30;

    switch (priority) {
      case 'URGENT':
        daysToAdd = 7;
        break;
      case 'HIGH':
        daysToAdd = 14;
        break;
      case 'MEDIUM':
        daysToAdd = 30;
        break;
      case 'LOW':
        daysToAdd = 90;
        break;
    }

    now.setDate(now.getDate() + daysToAdd);
    return now;
  }

  private determineComplianceStatus(findings: ComplianceFinding[]): 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'PENDING_REVIEW' {
    const nonCompliantFindings = findings.filter(f => f.type === 'NON_COMPLIANCE');
    const compliantFindings = findings.filter(f => f.type === 'COMPLIANCE');

    if (nonCompliantFindings.length === 0 && compliantFindings.length > 0) {
      return 'COMPLIANT';
    } else if (nonCompliantFindings.length > 0 && compliantFindings.length > 0) {
      return 'PARTIALLY_COMPLIANT';
    } else if (nonCompliantFindings.length > 0) {
      return 'NON_COMPLIANT';
    } else {
      return 'PENDING_REVIEW';
    }
  }

  private calculateNextAssessmentDate(status: string): Date {
    const now = new Date();
    let daysToAdd = 90; // Default 3 months

    switch (status) {
      case 'NON_COMPLIANT':
        daysToAdd = 30; // Monthly for non-compliant
        break;
      case 'PARTIALLY_COMPLIANT':
        daysToAdd = 60; // Bi-monthly for partially compliant
        break;
      case 'COMPLIANT':
        daysToAdd = 90; // Quarterly for compliant
        break;
      case 'PENDING_REVIEW':
        daysToAdd = 14; // 2 weeks for pending review
        break;
    }

    now.setDate(now.getDate() + daysToAdd);
    return now;
  }

  private async collectExportData(
    exportType: string,
    dateRange: { startDate: Date; endDate: Date },
    organizationId: string
  ): Promise<any[]> {
    // Simulate data collection based on export type
    switch (exportType) {
      case 'full_audit':
        return this.collectFullAuditData(dateRange, organizationId);
      case 'medication_records':
        return this.collectMedicationRecords(dateRange, organizationId);
      case 'incident_reports':
        return this.collectIncidentReports(dateRange, organizationId);
      case 'training_records':
        return this.collectTrainingRecords(dateRange, organizationId);
      default:
        return [];
    }
  }

  private async collectFullAuditData(
    dateRange: { startDate: Date; endDate: Date },
    organizationId: string
  ): Promise<any[]> {
    // Simulate full audit data collection
    return [
      {
        type: 'medication_records',
        count: 150,
        dateRange: dateRange
      },
      {
        type: 'incident_reports',
        count: 5,
        dateRange: dateRange
      },
      {
        type: 'training_records',
        count: 25,
        dateRange: dateRange
      }
    ];
  }

  private async collectMedicationRecords(
    dateRange: { startDate: Date; endDate: Date },
    organizationId: string
  ): Promise<any[]> {
    // Simulate medication records collection
    return [
      {
        residentId: 'resident1',
        medication: 'Paracetamol',
        dosage: '500mg',
        date: dateRange.startDate
      }
    ];
  }

  private async collectIncidentReports(
    dateRange: { startDate: Date; endDate: Date },
    organizationId: string
  ): Promise<any[]> {
    // Simulate incident reports collection
    return [
      {
        incidentId: 'incident1',
        type: 'MEDICATION_ERROR',
        severity: 'MEDIUM',
        date: dateRange.startDate
      }
    ];
  }

  private async collectTrainingRecords(
    dateRange: { startDate: Date; endDate: Date },
    organizationId: string
  ): Promise<any[]> {
    // Simulate training records collection
    return [
      {
        staffId: 'staff1',
        trainingType: 'Medication Management',
        completedDate: dateRange.startDate,
        score: 95
      }
    ];
  }

  private async generateExportFile(
    exportId: string,
    data: any,
    exportType: string
  ): Promise<string> {
    const filePath = `exports/${exportType}_${exportId}.json`;
    
    // In a real implementation, this would write the file to disk
    console.info('Export file generated', { exportId, filePath, exportType });
    
    return filePath;
  }

  private async storeIncidentReport(incident: IncidentReport): Promise<void> {
    try {
      const query = `
        INSERT INTO incident_reports (
          id, organization_id, incident_type, severity, description,
          resident_id, medication_id, reported_by, reported_date, status,
          regulatory_bodies, submission_deadline, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
      `;

      const values = [
        incident.id,
        incident.organizationId,
        incident.incidentType,
        incident.severity,
        incident.description,
        incident.residentId,
        incident.medicationId,
        incident.reportedBy,
        incident.reportedDate,
        incident.status,
        JSON.stringify(incident.regulatoryBodies),
        incident.submissionDeadline,
        incident.createdAt,
        incident.updatedAt
      ];

      await this.db.query(query, values);

    } catch (error: unknown) {
      console.error('Failed to store incident report', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to store incident report: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private async storeComplianceAssessment(compliance: RegulatoryCompliance): Promise<void> {
    try {
      const query = `
        INSERT INTO regulatory_compliance (
          id, organization_id, compliance_type, status, last_assessment_date,
          next_assessment_date, findings, recommendations, assessed_by,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `;

      const values = [
        compliance.id,
        compliance.organizationId,
        compliance.complianceType,
        compliance.status,
        compliance.lastAssessmentDate,
        compliance.nextAssessmentDate,
        JSON.stringify(compliance.findings),
        JSON.stringify(compliance.recommendations),
        compliance.assessedBy,
        compliance.createdAt,
        compliance.updatedAt
      ];

      await this.db.query(query, values);

    } catch (error: unknown) {
      console.error('Failed to store compliance assessment', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to store compliance assessment: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private async storeExportRecord(
    exportId: string,
    exportType: string,
    filePath: string,
    recordCount: number,
    userId: string,
    organizationId: string
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO compliance_exports (
          id, export_type, file_path, record_count, exported_by,
          organization_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )
      `;

      await this.db.query(query, [
        exportId,
        exportType,
        filePath,
        recordCount,
        userId,
        organizationId,
        new Date()
      ]);

    } catch (error: unknown) {
      console.error('Failed to store export record', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to store export record: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private mapDbRowToIncident(row: any): IncidentReport {
    return {
      id: row.id,
      organizationId: row.organization_id,
      incidentType: row.incident_type,
      severity: row.severity,
      description: row.description,
      residentId: row.resident_id,
      medicationId: row.medication_id,
      reportedBy: row.reported_by,
      reportedDate: row.reported_date,
      status: row.status,
      regulatoryBodies: row.regulatory_bodies ? JSON.parse(row.regulatory_bodies) : [],
      submissionDeadline: row.submission_deadline,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}