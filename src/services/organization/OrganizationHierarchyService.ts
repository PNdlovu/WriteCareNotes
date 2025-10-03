import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Organization Hierarchy Service for Care Home Management System
 * @module OrganizationHierarchyService
 * @version 1.0.0
 * @author Care Home Management Team
 * @since 2025-01-01
 * 
 * @description Simple organization management service with basic hierarchy support.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface Organization {
  id: string;
  name: string;
  type: 'CARE_HOME' | 'NURSING_HOME' | 'ASSISTED_LIVING';
  address?: any;
  contactInfo?: any;
  settings?: any;
  parentOrganizationId?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateOrganizationRequest {
  name: string;
  type: 'CARE_HOME' | 'NURSING_HOME' | 'ASSISTED_LIVING';
  address?: any;
  contactInfo?: any;
  settings?: any;
  parentOrganizationId?: string;
  tenantId: string;
}

export interface OrganizationHierarchy {
  organization: Organization;
  children: OrganizationHierarchy[];
  metrics: {
    staffCount: number;
    occupancyRate: number;
    incidentCount: number;
    medicationErrorRate: number;
    staffTurnoverRate: number;
    residentSatisfactionScore: number;
  };
}

export class OrganizationHierarchyService {
  private logger = logger;
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createOrganization(request: CreateOrganizationRequest, userId: string): Promise<Organization> {
    try {
      console.info('Creating new organization', { 
        name: request.name, 
        type: request.type,
        userId,
        tenantId: request.tenantId 
      });

      // Validate required fields
      if (!request.name?.trim()) {
        throw new Error('Organization name is required');
      }
      if (!request.type) {
        throw new Error('Organization type is required');
      }
      if (!request.tenantId) {
        throw new Error('Tenant ID is required');
      }

      const organizationId = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO organizations (
          id, name, type, address, contact_info, settings,
          parent_organization_id, tenant_id, created_at, updated_at, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *
      `;

      const values = [
        organizationId,
        request.name,
        request.type,
        JSON.stringify(request.address),
        JSON.stringify(request.contactInfo),
        JSON.stringify(request.settings),
        request.parentOrganizationId,
        request.tenantId,
        now,
        now,
        userId,
        userId
      ];

      const result = await this.db.query(query, values);
      const organization = this.mapDbRowToOrganization(result.rows[0]);

      console.info('Organization created successfully', { 
        organizationId: organization.id,
        userId 
      });

      return organization;

    } catch (error: unknown) {
      console.error('Failed to create organization', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to create organization: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async getOrganizationById(id: string, userId: string, tenantId?: string): Promise<Organization> {
    try {
      this.logger.debug('Retrieving organization by ID', { id, userId, tenantId });

      let query = 'SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL';
      const values = [id];

      if (tenantId) {
        query += ' AND tenant_id = $2';
        values.push(tenantId);
      }

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Organization not found');
      }

      const organization = this.mapDbRowToOrganization(result.rows[0]);

      this.logger.debug('Organization retrieved successfully', { 
        id: organization.id,
        userId 
      });

      return organization;

    } catch (error: unknown) {
      console.error('Failed to retrieve organization', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to retrieve organization: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async getOrganizationHierarchy(organizationId: string, userId: string, tenantId: string): Promise<OrganizationHierarchy> {
    try {
      this.logger.debug('Retrieving organization hierarchy', { organizationId, userId, tenantId });

      // Get the root organization
      const organization = await this.getOrganizationById(organizationId, userId, tenantId);

      // Get all child organizations
      const children = await this.getChildOrganizations(organizationId, tenantId);

      // Build hierarchy recursively
      const hierarchy: OrganizationHierarchy = {
        organization,
        children: await Promise.all(
          children.map(child => this.getOrganizationHierarchy(child.id, userId, tenantId))
        ),
        metrics: await this.getOrganizationMetrics(organizationId)
      };

      this.logger.debug('Organization hierarchy retrieved successfully', { 
        organizationId,
        childrenCount: children.length,
        userId 
      });

      return hierarchy;

    } catch (error: unknown) {
      console.error('Failed to retrieve organization hierarchy', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error", 
        organizationId, 
        userId 
      });
      throw new Error(`Failed to retrieve organization hierarchy: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async getChildOrganizations(parentId: string, tenantId: string): Promise<Organization[]> {
    try {
      const query = `
        SELECT * FROM organizations 
        WHERE parent_organization_id = $1 
        AND tenant_id = $2 
        AND deleted_at IS NULL
        ORDER BY name
      `;

      const result = await this.db.query(query, [parentId, tenantId]);
      return result.rows.map(row => this.mapDbRowToOrganization(row));

    } catch (error: unknown) {
      console.error('Failed to get child organizations', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to get child organizations: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async getOrganizationMetrics(organizationId: string): Promise<any> {
    try {
      // Calculate real metrics from actual data
      const [
        staffMetrics,
        occupancyMetrics,
        incidentMetrics,
        medicationMetrics,
        satisfactionMetrics
      ] = await Promise.all([
        this.calculateStaffMetrics(organizationId),
        this.calculateOccupancyMetrics(organizationId),
        this.calculateIncidentMetrics(organizationId),
        this.calculateMedicationMetrics(organizationId),
        this.calculateSatisfactionMetrics(organizationId)
      ]);

      const metrics = {
        staffCount: staffMetrics.totalStaff,
        activeStaffCount: staffMetrics.activeStaff,
        occupancyRate: occupancyMetrics.occupancyRate,
        totalBeds: occupancyMetrics.totalBeds,
        occupiedBeds: occupancyMetrics.occupiedBeds,
        incidentCount: incidentMetrics.totalIncidents,
        seriousIncidentCount: incidentMetrics.seriousIncidents,
        medicationErrorRate: medicationMetrics.errorRate,
        medicationAdministrations: medicationMetrics.totalAdministrations,
        staffTurnoverRate: staffMetrics.turnoverRate,
        residentSatisfactionScore: satisfactionMetrics.averageScore,
        familySatisfactionScore: satisfactionMetrics.familyScore,
        lastUpdated: new Date()
      };

      // Cache metrics for 1 hour
      await this.cacheManager.set(`org-metrics:${organizationId}`, metrics, 3600);

      logger.info('Organization metrics calculated', {
        organizationId,
        staffCount: metrics.staffCount,
        occupancyRate: metrics.occupancyRate,
        incidentCount: metrics.incidentCount
      });

      return metrics;

    } catch (error: unknown) {
      console.error('Failed to get organization metrics', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to get organization metrics: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async updateOrganization(id: string, updates: Partial<CreateOrganizationRequest>, userId: string): Promise<Organization> {
    try {
      this.logger.debug('Updating organization', { id, userId });

      // Get existing organization
      const existingOrganization = await this.getOrganizationById(id, userId);

      // Build update query dynamically
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          const dbField = this.camelToSnakeCase(key);
          updateFields.push(`${dbField} = $${paramCount}`);
          
          // Handle JSON fields
          if (['address', 'contactInfo', 'settings'].includes(key)) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at and updated_by
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      updateFields.push(`updated_by = $${paramCount}`);
      values.push(userId);

      // Add WHERE clause
      paramCount++;
      values.push(id);

      const query = `
        UPDATE organizations 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Organization not found');
      }

      const updatedOrganization = this.mapDbRowToOrganization(result.rows[0]);

      console.info('Organization updated successfully', { 
        id: updatedOrganization.id,
        userId 
      });

      return updatedOrganization;

    } catch (error: unknown) {
      console.error('Failed to update organization', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to update organization: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  async deleteOrganization(id: string, userId: string): Promise<void> {
    try {
      this.logger.debug('Deleting organization', { id, userId });

      const query = `
        UPDATE organizations 
        SET deleted_at = $1, updated_at = $2, updated_by = $3
        WHERE id = $4 AND deleted_at IS NULL
      `;

      const result = await this.db.query(query, [new Date(), new Date(), userId, id]);

      if (result.rowCount === 0) {
        throw new Error('Organization not found');
      }

      console.info('Organization deleted successfully', { 
        id,
        userId 
      });

    } catch (error: unknown) {
      console.error('Failed to delete organization', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw new Error(`Failed to delete organization: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapDbRowToOrganization(row: any): Organization {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      address: row.address ? JSON.parse(row.address) : undefined,
      contactInfo: row.contact_info ? JSON.parse(row.contact_info) : undefined,
      settings: row.settings ? JSON.parse(row.settings) : undefined,
      parentOrganizationId: row.parent_organization_id,
      tenantId: row.tenant_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  // Real metrics calculation methods
  private async calculateStaffMetrics(organizationId: string): Promise<{
    totalStaff: number;
    activeStaff: number;
    turnoverRate: number;
  }> {
    try {
      const staffQuery = `
        SELECT 
          COUNT(*) as total_staff,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_staff,
          COUNT(CASE WHEN terminated_at > NOW() - INTERVAL '12 months' THEN 1 END) as terminated_last_year
        FROM staff 
        WHERE organization_id = $1
      `;
      
      const result = await this.db.query(staffQuery, [organizationId]);
      const row = result.rows[0];
      
      const totalStaff = parseInt(row.total_staff) || 0;
      const activeStaff = parseInt(row.active_staff) || 0;
      const terminatedLastYear = parseInt(row.terminated_last_year) || 0;
      
      // Calculate turnover rate as percentage
      const turnoverRate = totalStaff > 0 ? (terminatedLastYear / totalStaff) * 100 : 0;
      
      return {
        totalStaff,
        activeStaff,
        turnoverRate: Math.round(turnoverRate * 100) / 100
      };
      
    } catch (error) {
      logger.error('Failed to calculate staff metrics', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { totalStaff: 0, activeStaff: 0, turnoverRate: 0 };
    }
  }

  private async calculateOccupancyMetrics(organizationId: string): Promise<{
    occupancyRate: number;
    totalBeds: number;
    occupiedBeds: number;
  }> {
    try {
      const occupancyQuery = `
        SELECT 
          COUNT(r.id) as total_beds,
          COUNT(CASE WHEN res.status = 'admitted' THEN 1 END) as occupied_beds
        FROM rooms r
        LEFT JOIN residents res ON r.room_number = res.room_number 
          AND res.organization_id = r.organization_id 
          AND res.status = 'admitted'
        WHERE r.organization_id = $1
      `;
      
      const result = await this.db.query(occupancyQuery, [organizationId]);
      const row = result.rows[0];
      
      const totalBeds = parseInt(row.total_beds) || 0;
      const occupiedBeds = parseInt(row.occupied_beds) || 0;
      
      const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
      
      return {
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        totalBeds,
        occupiedBeds
      };
      
    } catch (error) {
      logger.error('Failed to calculate occupancy metrics', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { occupancyRate: 0, totalBeds: 0, occupiedBeds: 0 };
    }
  }

  private async calculateIncidentMetrics(organizationId: string): Promise<{
    totalIncidents: number;
    seriousIncidents: number;
  }> {
    try {
      const incidentQuery = `
        SELECT 
          COUNT(*) as total_incidents,
          COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as serious_incidents
        FROM incidents 
        WHERE organization_id = $1 
          AND created_at > NOW() - INTERVAL '30 days'
      `;
      
      const result = await this.db.query(incidentQuery, [organizationId]);
      const row = result.rows[0];
      
      return {
        totalIncidents: parseInt(row.total_incidents) || 0,
        seriousIncidents: parseInt(row.serious_incidents) || 0
      };
      
    } catch (error) {
      logger.error('Failed to calculate incident metrics', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { totalIncidents: 0, seriousIncidents: 0 };
    }
  }

  private async calculateMedicationMetrics(organizationId: string): Promise<{
    errorRate: number;
    totalAdministrations: number;
  }> {
    try {
      const medicationQuery = `
        SELECT 
          COUNT(*) as total_administrations,
          COUNT(CASE WHEN status = 'error' OR status = 'missed' THEN 1 END) as errors
        FROM medication_administrations ma
        JOIN residents r ON ma.resident_id = r.id
        WHERE r.organization_id = $1 
          AND ma.created_at > NOW() - INTERVAL '30 days'
      `;
      
      const result = await this.db.query(medicationQuery, [organizationId]);
      const row = result.rows[0];
      
      const totalAdministrations = parseInt(row.total_administrations) || 0;
      const errors = parseInt(row.errors) || 0;
      
      const errorRate = totalAdministrations > 0 ? (errors / totalAdministrations) * 100 : 0;
      
      return {
        errorRate: Math.round(errorRate * 100) / 100,
        totalAdministrations
      };
      
    } catch (error) {
      logger.error('Failed to calculate medication metrics', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { errorRate: 0, totalAdministrations: 0 };
    }
  }

  private async calculateSatisfactionMetrics(organizationId: string): Promise<{
    averageScore: number;
    familyScore: number;
  }> {
    try {
      const satisfactionQuery = `
        SELECT 
          AVG(CASE WHEN survey_type = 'resident' THEN score END) as resident_score,
          AVG(CASE WHEN survey_type = 'family' THEN score END) as family_score
        FROM satisfaction_surveys ss
        JOIN residents r ON ss.resident_id = r.id
        WHERE r.organization_id = $1 
          AND ss.created_at > NOW() - INTERVAL '90 days'
      `;
      
      const result = await this.db.query(satisfactionQuery, [organizationId]);
      const row = result.rows[0];
      
      return {
        averageScore: Math.round((parseFloat(row.resident_score) || 0) * 100) / 100,
        familyScore: Math.round((parseFloat(row.family_score) || 0) * 100) / 100
      };
      
    } catch (error) {
      logger.error('Failed to calculate satisfaction metrics', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { averageScore: 0, familyScore: 0 };
    }
  }
}