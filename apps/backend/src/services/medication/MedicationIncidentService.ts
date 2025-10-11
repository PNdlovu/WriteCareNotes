/**
 * @fileoverview Simple medication incident service for care home management.
 * @module Medication/MedicationIncidentService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Simple medication incident service for care home management.
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Incident Service for Care Home Management System
 * @module MedicationIncidentService
 * @version 1.0.0
 * @author Care Home Management Team
 * @since 2025-01-01
 * 
 * @description Simple medication incident service for care home management.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface MedicationIncident {
  id: string;
  residentId: string;
  medicationId: string;
  incidentType: 'WRONG_MEDICATION' | 'WRONG_DOSAGE' | 'WRONG_TIME' | 'MISSED_DOSE' | 'ADVERSE_REACTION' | 'CONTAMINATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  symptoms?: string[];
  actionTaken: string;
  reportedBy: string;
  reportedDate: Date;
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  followUpRequired: boolean;
  followUpDate?: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMedicationIncidentRequest {
  residentId: string;
  medicationId: string;
  incidentType: 'WRONG_MEDICATION' | 'WRONG_DOSAGE' | 'WRONG_TIME' | 'MISSED_DOSE' | 'ADVERSE_REACTION' | 'CONTAMINATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  symptoms?: string[];
  actionTaken: string;
  reportedBy: string;
  organizationId: string;
}

export interface IncidentInvestigation {
  id: string;
  incidentId: string;
  investigatorId: string;
  investigationDate: Date;
  findings: string[];
  rootCause: string;
  recommendations: string[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentFollowUp {
  id: string;
  incidentId: string;
  followUpDate: Date;
  followUpType: 'MEDICAL_REVIEW' | 'MEDICATION_REVIEW' | 'PROCEDURE_REVIEW' | 'TRAINING_REVIEW';
  performedBy: string;
  notes: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export class MedicationIncidentService {
  privatelogger = logger;
  privatedb: Pool;

  const ructor(db: Pool) {
    this.db = db;
  }

  async createMedicationIncident(request: CreateMedicationIncidentRequest): Promise<MedicationIncident> {
    try {
      console.info('Creating medication incident', { 
        residentId: request.residentId,
        medicationId: request.medicationId,
        incidentType: request.incidentType,
        severity: request.severity,
        organizationId: request.organizationId
      });

      // Validate required fields
      this.validateIncidentRequest(request);

      const incidentId = uuidv4();
      const now = new Date();

      const incident: MedicationIncident = {
        id: incidentId,
        residentId: request.residentId,
        medicationId: request.medicationId,
        incidentType: request.incidentType,
        severity: request.severity,
        description: request.description,
        symptoms: request.symptoms,
        actionTaken: request.actionTaken,
        reportedBy: request.reportedBy,
        reportedDate: now,
        status: 'REPORTED',
        followUpRequired: this.determineFollowUpRequired(request.severity, request.incidentType),
        followUpDate: this.calculateFollowUpDate(request.severity),
        organizationId: request.organizationId,
        createdAt: now,
        updatedAt: now
      };

      // Store incident
      await this.storeMedicationIncident(incident);

      // Create investigation if required
      if (this.requiresInvestigation(request.severity)) {
        await this.createIncidentInvestigation(incidentId, request.reportedBy);
      }

      // Create follow-up if required
      if (incident.followUpRequired) {
        await this.createIncidentFollowUp(incidentId, incident.followUpDate!, request.reportedBy);
      }

      console.info('Medication incident created successfully', { 
        incidentId: incident.id,
        requiresInvestigation: this.requiresInvestigation(request.severity),
        followUpRequired: incident.followUpRequired
      });

      return incident;

    } catch (error: unknown) {
      console.error('Failed to create medication incident', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        residentId: request.residentId 
      });
      throw new Error(`Failed to create medicationincident: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getMedicationIncidents(
    organizationId: string,
    pagination: { page: number; limit: number },
    filters?: {
      residentId?: string;
      severity?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ incidents: MedicationIncident[]; total: number; page: number; totalPages: number }> {
    try {
      this.logger.debug('Getting medication incidents', { organizationId, pagination, filters });

      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Build query with filters
      let whereClause = 'WHERE organization_id = $1 AND deleted_at IS NULL';
      const queryParams: any[] = [organizationId];
      let paramCount = 1;

      if (filters?.residentId) {
        paramCount++;
        whereClause += ` AND resident_id = $${paramCount}`;
        queryParams.push(filters.residentId);
      }

      if (filters?.severity) {
        paramCount++;
        whereClause += ` ANDseverity = $${paramCount}`;
        queryParams.push(filters.severity);
      }

      if (filters?.status) {
        paramCount++;
        whereClause += ` ANDstatus = $${paramCount}`;
        queryParams.push(filters.status);
      }

      if (filters?.dateFrom) {
        paramCount++;
        whereClause += ` AND reported_date >= $${paramCount}`;
        queryParams.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        paramCount++;
        whereClause += ` AND reported_date <= $${paramCount}`;
        queryParams.push(filters.dateTo);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM medication_incidents ${whereClause}`;
      const countResult = await this.db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get incidents
      paramCount++;
      queryParams.push(limit);
      paramCount++;
      queryParams.push(offset);

      const incidentsQuery = `
        SELECT * FROM medication_incidents 
        ${whereClause}
        ORDER BY reported_date DESC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;
      const incidentsResult = await this.db.query(incidentsQuery, queryParams);

      const incidents: MedicationIncident[] = incidentsResult.rows.map(row => this.mapDbRowToIncident(row));

      const totalPages = Math.ceil(total / limit);

      this.logger.debug('Medication incidents retrieved successfully', { 
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
      console.error('Failed to get medication incidents', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        organizationId 
      });
      throw new Error(`Failed to get medicationincidents: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getMedicationIncidentById(incidentId: string, organizationId: string): Promise<MedicationIncident | null> {
    try {
      this.logger.debug('Getting medication incident by ID', { incidentId, organizationId });

      const query = `
        SELECT * FROM medication_incidents 
        WHEREid = $1 AND organization_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.db.query(query, [incidentId, organizationId]);

      if (result.rows.length === 0) {
        return null;
      }

      const incident = this.mapDbRowToIncident(result.rows[0]);

      this.logger.debug('Medication incident retrieved successfully', { incidentId });

      return incident;

    } catch (error: unknown) {
      console.error('Failed to get medication incident', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        incidentId 
      });
      throw new Error(`Failed to get medicationincident: ${error instanceof Error ? error.message : "Unknown error"}`);
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
        UPDATE medication_incidents 
        SETstatus = $1, notes = $2, updated_at = $3, updated_by = $4
        WHEREid = $5 AND deleted_at IS NULL
      `;

      await this.db.query(query, [status, notes, new Date(), userId, incidentId]);

      console.info('Incident status updated successfully', { 
        incidentId, 
        status 
      });

    } catch (error: unknown) {
      console.error('Failed to update incident status', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        incidentId 
      });
      throw new Error(`Failed to update incidentstatus: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getIncidentStatistics(organizationId: string): Promise<any> {
    try {
      this.logger.debug('Getting incident statistics', { organizationId });

      const query = `
        SELECT 
          COUNT(*) as total_incidents,
          COUNT(CASE WHENseverity = 'LOW' THEN 1 END) as low_severity,
          COUNT(CASE WHENseverity = 'MEDIUM' THEN 1 END) as medium_severity,
          COUNT(CASE WHENseverity = 'HIGH' THEN 1 END) as high_severity,
          COUNT(CASE WHENseverity = 'CRITICAL' THEN 1 END) as critical_severity,
          COUNT(CASE WHENstatus = 'REPORTED' THEN 1 END) as reported,
          COUNT(CASE WHENstatus = 'INVESTIGATING' THEN 1 END) as investigating,
          COUNT(CASE WHENstatus = 'RESOLVED' THEN 1 END) as resolved,
          COUNT(CASE WHENstatus = 'CLOSED' THEN 1 END) as closed
        FROM medication_incidents 
        WHERE organization_id = $1 AND deleted_at IS NULL
      `;

      const result = await this.db.query(query, [organizationId]);
      const stats = result.rows[0];

      this.logger.debug('Incident statistics generated', { organizationId });

      return {
        totalIncidents: parseInt(stats.total_incidents),
        severityBreakdown: {
          low: parseInt(stats.low_severity),
          medium: parseInt(stats.medium_severity),
          high: parseInt(stats.high_severity),
          critical: parseInt(stats.critical_severity)
        },
        statusBreakdown: {
          reported: parseInt(stats.reported),
          investigating: parseInt(stats.investigating),
          resolved: parseInt(stats.resolved),
          closed: parseInt(stats.closed)
        }
      };

    } catch (error: unknown) {
      console.error('Failed to get incident statistics', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        organizationId 
      });
      throw new Error(`Failed to get incidentstatistics: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private validateIncidentRequest(request: CreateMedicationIncidentRequest): void {
    const errors: string[] = [];

    if (!request.residentId?.trim()) errors.push('Resident ID is required');
    if (!request.medicationId?.trim()) errors.push('Medication ID is required');
    if (!request.incidentType) errors.push('Incident type is required');
    if (!request.severity) errors.push('Severity is required');
    if (!request.description?.trim()) errors.push('Description is required');
    if (!request.actionTaken?.trim()) errors.push('Action taken is required');
    if (!request.reportedBy?.trim()) errors.push('Reported by is required');
    if (!request.organizationId?.trim()) errors.push('Organization ID is required');

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private determineFollowUpRequired(severity: string, incidentType: string): boolean {
    // Always require follow-up for high/critical severity
    if (['HIGH', 'CRITICAL'].includes(severity)) {
      return true;
    }

    // Require follow-up for certain incident types
    if (['ADVERSE_REACTION', 'WRONG_MEDICATION', 'CONTAMINATION'].includes(incidentType)) {
      return true;
    }

    return false;
  }

  private calculateFollowUpDate(severity: string): Date {
    const now = new Date();
    let daysToAdd = 7; // Default 1 week

    switch (severity) {
      case 'CRITICAL':
        daysToAdd = 1; // Next day for critical
        break;
      case 'HIGH':
        daysToAdd = 3; // 3 days for high
        break;
      case 'MEDIUM':
        daysToAdd = 7; // 1 week for medium
        break;
      case 'LOW':
        daysToAdd = 14; // 2 weeks for low
        break;
    }

    now.setDate(now.getDate() + daysToAdd);
    return now;
  }

  private requiresInvestigation(severity: string): boolean {
    return ['HIGH', 'CRITICAL'].includes(severity);
  }

  private async createIncidentInvestigation(incidentId: string, investigatorId: string): Promise<void> {
    try {
      const investigationId = uuidv4();
      const now = new Date();

      const investigation: IncidentInvestigation = {
        id: investigationId,
        incidentId,
        investigatorId,
        investigationDate: now,
        findings: [],
        rootCause: '',
        recommendations: [],
        status: 'IN_PROGRESS',
        createdAt: now,
        updatedAt: now
      };

      const query = `
        INSERT INTO incident_investigations (
          id, incident_id, investigator_id, investigation_date,
          findings, root_cause, recommendations, status,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
      `;

      await this.db.query(query, [
        investigation.id,
        investigation.incidentId,
        investigation.investigatorId,
        investigation.investigationDate,
        JSON.stringify(investigation.findings),
        investigation.rootCause,
        JSON.stringify(investigation.recommendations),
        investigation.status,
        investigation.createdAt,
        investigation.updatedAt
      ]);

      console.info('Incident investigation created', { 
        investigationId,
        incidentId
      });

    } catch (error: unknown) {
      console.error('Failed to create incident investigation', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        incidentId 
      });
      throw new Error(`Failed to create incidentinvestigation: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async createIncidentFollowUp(incidentId: string, followUpDate: Date, performedBy: string): Promise<void> {
    try {
      const followUpId = uuidv4();
      const now = new Date();

      const followUp: IncidentFollowUp = {
        id: followUpId,
        incidentId,
        followUpDate,
        followUpType: 'MEDICAL_REVIEW',
        performedBy,
        notes: '',
        status: 'SCHEDULED',
        createdAt: now,
        updatedAt: now
      };

      const query = `
        INSERT INTO incident_follow_ups (
          id, incident_id, follow_up_date, follow_up_type,
          performed_by, notes, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `;

      await this.db.query(query, [
        followUp.id,
        followUp.incidentId,
        followUp.followUpDate,
        followUp.followUpType,
        followUp.performedBy,
        followUp.notes,
        followUp.status,
        followUp.createdAt,
        followUp.updatedAt
      ]);

      console.info('Incident follow-up created', { 
        followUpId,
        incidentId,
        followUpDate
      });

    } catch (error: unknown) {
      console.error('Failed to create incident follow-up', { 
        error: error instanceof Error ? error.message : "Unknown error", 
        incidentId 
      });
      throw new Error(`Failed to create incident follow-up: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async storeMedicationIncident(incident: MedicationIncident): Promise<void> {
    try {
      const query = `
        INSERT INTO medication_incidents (
          id, resident_id, medication_id, incident_type, severity,
          description, symptoms, action_taken, reported_by, reported_date,
          status, follow_up_required, follow_up_date, organization_id,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
      `;

      const values = [
        incident.id,
        incident.residentId,
        incident.medicationId,
        incident.incidentType,
        incident.severity,
        incident.description,
        JSON.stringify(incident.symptoms || []),
        incident.actionTaken,
        incident.reportedBy,
        incident.reportedDate,
        incident.status,
        incident.followUpRequired,
        incident.followUpDate,
        incident.organizationId,
        incident.createdAt,
        incident.updatedAt
      ];

      await this.db.query(query, values);

    } catch (error: unknown) {
      console.error('Failed to store medication incident', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new Error(`Failed to store medicationincident: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private mapDbRowToIncident(row: any): MedicationIncident {
    return {
      id: row.id,
      residentId: row.resident_id,
      medicationId: row.medication_id,
      incidentType: row.incident_type,
      severity: row.severity,
      description: row.description,
      symptoms: row.symptoms ? JSON.parse(row.symptoms) : undefined,
      actionTaken: row.action_taken,
      reportedBy: row.reported_by,
      reportedDate: row.reported_date,
      status: row.status,
      followUpRequired: row.follow_up_required,
      followUpDate: row.follow_up_date,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
