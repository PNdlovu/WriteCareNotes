import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview NICE Guidelines Service for Care Home Management System
 * @module NICEGuidelinesService
 * @version 1.0.0
 * @author Care Home Management Team
 * @since 2025-01-01
 * 
 * @description Simple NICE guidelines compliance service for care home management.
 */

import { Pool } from 'pg';





import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus } from '../entities/workforce/OvertimeRequest';
import { OvertimeStatus, HolidayStatus, ResidentStatus } from '../entities/workforce/OvertimeRequest';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface NICEGuideline {
  id: string;
  title: string;
  category: 'MEDICATION' | 'CARE_PLANNING' | 'SAFETY' | 'QUALITY' | 'CLINICAL';
  guidelineNumber: string;
  version: string;
  status: 'CURRENT' | 'UPDATED' | 'SUPERSEDED';
  summary: string;
  keyRecommendations: string[];
  implementationDate: Date;
  reviewDate: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceCheck {
  id: string;
  guidelineId: string;
  residentId?: string;
  organizationId: string;
  checkType: 'MEDICATION_REVIEW' | 'CARE_PLANNING' | 'SAFETY_AUDIT' | 'QUALITY_ASSESSMENT';
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NOT_APPLICABLE';
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  checkedBy: string;
  checkDate: Date;
  nextReviewDate: Date;
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
}

export interface ComplianceRecommendation {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  action: string;
  timeframe: string;
  assignedTo: string;
  status: OvertimeStatus.PENDING | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface CreateComplianceCheckRequest {
  guidelineId: string;
  residentId?: string;
  organizationId: string;
  checkType: 'MEDICATION_REVIEW' | 'CARE_PLANNING' | 'SAFETY_AUDIT' | 'QUALITY_ASSESSMENT';
  checkedBy: string;
}

export class NICEGuidelinesService {
  private logger = logger;
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async getNICEGuidelines(organizationId: string): Promise<NICEGuideline[]> {
    try {
      this.logger.debug('Getting NICE guidelines', { organizationId });

      const query = `
        SELECT * FROM nice_guidelines 
        WHERE organization_id = $1 AND deleted_at IS NULL
        ORDER BY category, title
      `;
      const result = await this.db.query(query, [organizationId]);

      const guidelines = result.rows.map(row => this.mapDbRowToGuideline(row));

      this.logger.debug('NICE guidelines retrieved successfully', { 
        count: guidelines.length,
        organizationId
      });

      return guidelines;

    } catch (error: unknown) {
      console.error('Failed to get NICE guidelines', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        organizationId 
      });
      throw new Error(`Failed to get NICE guidelines: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async getNICEGuidelineById(guidelineId: string, organizationId: string): Promise<NICEGuideline | null> {
    try {
      this.logger.debug('Getting NICE guideline by ID', { guidelineId, organizationId });

      const query = `
        SELECT * FROM nice_guidelines 
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.db.query(query, [guidelineId, organizationId]);

      if (result.rows.length === 0) {
        return null;
      }

      const guideline = this.mapDbRowToGuideline(result.rows[0]);

      this.logger.debug('NICE guideline retrieved successfully', { guidelineId });

      return guideline;

    } catch (error: unknown) {
      console.error('Failed to get NICE guideline', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        guidelineId 
      });
      throw new Error(`Failed to get NICE guideline: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async performComplianceCheck(request: CreateComplianceCheckRequest): Promise<ComplianceCheck> {
    try {
      console.info('Performing compliance check', { 
        guidelineId: request.guidelineId,
        checkType: request.checkType,
        checkedBy: request.checkedBy,
        organizationId: request.organizationId
      });

      // Validate required fields
      this.validateComplianceCheckRequest(request);

      // Get the guideline
      const guideline = await this.getNICEGuidelineById(request.guidelineId, request.organizationId);
      if (!guideline) {
        throw new Error('Guideline not found');
      }

      const checkId = uuidv4();
      const now = new Date();

      // Perform the compliance check based on type
      const findings = await this.performComplianceAssessment(request, guideline);
      const recommendations = this.generateRecommendations(findings);
      const status = this.determineComplianceStatus(findings);

      const complianceCheck: ComplianceCheck = {
        id: checkId,
        guidelineId: request.guidelineId,
        residentId: request.residentId,
        organizationId: request.organizationId,
        checkType: request.checkType,
        status,
        findings,
        recommendations,
        checkedBy: request.checkedBy,
        checkDate: now,
        nextReviewDate: this.calculateNextReviewDate(status),
        createdAt: now,
        updatedAt: now
      };

      // Store the compliance check
      await this.storeComplianceCheck(complianceCheck);

      console.info('Compliance check completed successfully', { 
        checkId: complianceCheck.id,
        status: complianceCheck.status,
        findingsCount: findings.length
      });

      return complianceCheck;

    } catch (error: unknown) {
      console.error('Failed to perform compliance check', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        guidelineId: request.guidelineId 
      });
      throw new Error(`Failed to perform compliance check: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async getComplianceChecks(
    organizationId: string,
    pagination: { page: number; limit: number }
  ): Promise<{ checks: ComplianceCheck[]; total: number; page: number; totalPages: number }> {
    try {
      this.logger.debug('Getting compliance checks', { organizationId, pagination });

      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM compliance_checks 
        WHERE organization_id = $1 AND deleted_at IS NULL
      `;
      const countResult = await this.db.query(countQuery, [organizationId]);
      const total = parseInt(countResult.rows[0].total);

      // Get checks
      const checksQuery = `
        SELECT * FROM compliance_checks 
        WHERE organization_id = $1 AND deleted_at IS NULL
        ORDER BY check_date DESC
        LIMIT $2 OFFSET $3
      `;
      const checksResult = await this.db.query(checksQuery, [organizationId, limit, offset]);

      const checks: ComplianceCheck[] = checksResult.rows.map(row => this.mapDbRowToComplianceCheck(row));

      const totalPages = Math.ceil(total / limit);

      this.logger.debug('Compliance checks retrieved successfully', { 
        total: checks.length,
        organizationId
      });

      return {
        checks,
        total,
        page,
        totalPages
      };

    } catch (error: unknown) {
      console.error('Failed to get compliance checks', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        organizationId 
      });
      throw new Error(`Failed to get compliance checks: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async updateComplianceRecommendation(
    recommendationId: string,
    status: OvertimeStatus.PENDING | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    notes: string,
    userId: string
  ): Promise<void> {
    try {
      this.logger.debug('Updating compliance recommendation', { recommendationId, status, userId });

      const query = `
        UPDATE compliance_recommendations 
        SET status = $1, notes = $2, updated_at = $3, updated_by = $4
        WHERE id = $5 AND deleted_at IS NULL
      `;

      await this.db.query(query, [status, notes, new Date(), userId, recommendationId]);

      console.info('Compliance recommendation updated successfully', { 
        recommendationId, 
        status 
      });

    } catch (error: unknown) {
      console.error('Failed to update compliance recommendation', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        recommendationId 
      });
      throw new Error(`Failed to update compliance recommendation: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private validateComplianceCheckRequest(request: CreateComplianceCheckRequest): void {
    const errors: string[] = [];

    if (!request.guidelineId?.trim()) errors.push('Guideline ID is required');
    if (!request.organizationId?.trim()) errors.push('Organization ID is required');
    if (!request.checkType) errors.push('Check type is required');
    if (!request.checkedBy?.trim()) errors.push('Checked by is required');

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private async performComplianceAssessment(
    request: CreateComplianceCheckRequest,
    guideline: NICEGuideline
  ): Promise<ComplianceFinding[]> {
    try {
      const findings: ComplianceFinding[] = [];

      // Simulate compliance assessment based on check type
      switch (request.checkType) {
        case 'MEDICATION_REVIEW':
          findings.push(...this.assessMedicationCompliance(guideline));
          break;
        case 'CARE_PLANNING':
          findings.push(...this.assessCarePlanningCompliance(guideline));
          break;
        case 'SAFETY_AUDIT':
          findings.push(...this.assessSafetyCompliance(guideline));
          break;
        case 'QUALITY_ASSESSMENT':
          findings.push(...this.assessQualityCompliance(guideline));
          break;
      }

      return findings;

    } catch (error: unknown) {
      console.error('Failed to perform compliance assessment', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to perform compliance assessment: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private assessMedicationCompliance(guideline: NICEGuideline): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];

    // Simulate medication compliance checks
    findings.push({
      id: uuidv4(),
      type: 'COMPLIANCE',
      severity: 'LOW',
      description: 'Medication reviews are conducted regularly',
      evidence: ['Review records show monthly assessments'],
      recommendation: 'Continue current practice'
    });

    findings.push({
      id: uuidv4(),
      type: 'NON_COMPLIANCE',
      severity: 'MEDIUM',
      description: 'Some medications lack proper documentation',
      evidence: ['Missing dosage information for 3 medications'],
      recommendation: 'Update medication records with complete information'
    });

    return findings;
  }

  private assessCarePlanningCompliance(guideline: NICEGuideline): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];

    findings.push({
      id: uuidv4(),
      type: 'COMPLIANCE',
      severity: 'LOW',
      description: 'Care plans are updated regularly',
      evidence: ['All care plans reviewed within last 3 months'],
      recommendation: 'Maintain current review schedule'
    });

    return findings;
  }

  private assessSafetyCompliance(guideline: NICEGuideline): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];

    findings.push({
      id: uuidv4(),
      type: 'OPPORTUNITY',
      severity: 'MEDIUM',
      description: 'Safety protocols could be enhanced',
      evidence: ['Incident reports show room for improvement'],
      recommendation: 'Implement additional safety training'
    });

    return findings;
  }

  private assessQualityCompliance(guideline: NICEGuideline): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];

    findings.push({
      id: uuidv4(),
      type: 'COMPLIANCE',
      severity: 'LOW',
      description: 'Quality standards are being met',
      evidence: ['Quality metrics within acceptable ranges'],
      recommendation: 'Continue monitoring quality indicators'
    });

    return findings;
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
        assignedTo: 'Care Manager',
        status: OvertimeStatus.PENDING as const
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

  private determineComplianceStatus(findings: ComplianceFinding[]): 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NOT_APPLICABLE' {
    const nonCompliantFindings = findings.filter(f => f.type === 'NON_COMPLIANCE');
    const compliantFindings = findings.filter(f => f.type === 'COMPLIANCE');

    if (nonCompliantFindings.length === 0 && compliantFindings.length > 0) {
      return 'COMPLIANT';
    } else if (nonCompliantFindings.length > 0 && compliantFindings.length > 0) {
      return 'PARTIALLY_COMPLIANT';
    } else if (nonCompliantFindings.length > 0) {
      return 'NON_COMPLIANT';
    } else {
      return 'NOT_APPLICABLE';
    }
  }

  private calculateNextReviewDate(status: string): Date {
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
    }

    now.setDate(now.getDate() + daysToAdd);
    return now;
  }

  private async storeComplianceCheck(check: ComplianceCheck): Promise<void> {
    try {
      const query = `
        INSERT INTO compliance_checks (
          id, guideline_id, resident_id, organization_id, check_type,
          status, findings, recommendations, checked_by, check_date,
          next_review_date, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
      `;

      const values = [
        check.id,
        check.guidelineId,
        check.residentId,
        check.organizationId,
        check.checkType,
        check.status,
        JSON.stringify(check.findings),
        JSON.stringify(check.recommendations),
        check.checkedBy,
        check.checkDate,
        check.nextReviewDate,
        check.createdAt,
        check.updatedAt
      ];

      await this.db.query(query, values);

    } catch (error: unknown) {
      console.error('Failed to store compliance check', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to store compliance check: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private mapDbRowToGuideline(row: any): NICEGuideline {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      guidelineNumber: row.guideline_number,
      version: row.version,
      status: row.status,
      summary: row.summary,
      keyRecommendations: row.key_recommendations ? JSON.parse(row.key_recommendations) : [],
      implementationDate: row.implementation_date,
      reviewDate: row.review_date,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapDbRowToComplianceCheck(row: any): ComplianceCheck {
    return {
      id: row.id,
      guidelineId: row.guideline_id,
      residentId: row.resident_id,
      organizationId: row.organization_id,
      checkType: row.check_type,
      status: row.status,
      findings: row.findings ? JSON.parse(row.findings) : [],
      recommendations: row.recommendations ? JSON.parse(row.recommendations) : [],
      checkedBy: row.checked_by,
      checkDate: row.check_date,
      nextReviewDate: row.next_review_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}