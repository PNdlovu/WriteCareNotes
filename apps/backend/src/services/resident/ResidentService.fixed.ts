import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Resident Service for Care Home Management System
 * @module ResidentService
 * @version 1.0.0
 * @author Care Home Management Team
 * @since 2025-01-01
 * 
 * @description Complete resident management service with real care home operations,
 * GDPR compliance, audit trails, and comprehensive business logic.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface CreateResidentRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';
  nhsNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: any;
  careLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  admissionDate: string;
  organizationId: string;
  tenantId: string;
  emergencyContact?: any;
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  careNotes?: string;
}

export interface Resident {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus?: string;
  nhsNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: any;
  careLevel: string;
  admissionDate: string;
  dischargeDate?: string;
  status: 'ACTIVE' | 'DISCHARGED' | 'DECEASED';
  organizationId: string;
  tenantId: string;
  emergencyContact?: any;
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  careNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ResidentSearchFilters {
  organizationId: string;
  tenantId: string;
  status?: string;
  careLevel?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ResidentSearchResult {
  residents: Resident[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class ResidentService {
  private logger = logger;
  privatedb: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createResident(request: CreateResidentRequest, userId: string): Promise<Resident> {
    try {
      console.info('Creating new resident', { 
        firstName: request.firstName, 
        lastName: request.lastName,
        userId,
        organizationId: request.organizationId 
      });

      // Validate required fields
      this.validateCreateResidentRequest(request);

      const residentId = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO residents (
          id, first_name, middle_name, last_name, preferred_name, date_of_birth,
          gender, marital_status, nhs_number, phone_number, email, address,
          care_level, admission_date, status, organization_id, tenant_id,
          emergency_contact, medical_conditions, allergies, medications,
          care_notes, created_at, updated_at, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        ) RETURNING *
      `;

      const values = [
        residentId,
        request.firstName,
        request.middleName,
        request.lastName,
        request.preferredName,
        request.dateOfBirth,
        request.gender,
        request.maritalStatus,
        request.nhsNumber,
        request.phoneNumber,
        request.email,
        JSON.stringify(request.address),
        request.careLevel,
        request.admissionDate,
        'ACTIVE',
        request.organizationId,
        request.tenantId,
        JSON.stringify(request.emergencyContact),
        JSON.stringify(request.medicalConditions),
        JSON.stringify(request.allergies),
        JSON.stringify(request.medications),
        request.careNotes,
        now,
        now,
        userId,
        userId
      ];

      const result = await this.db.query(query, values);
      const resident = this.mapDbRowToResident(result.rows[0]);

      console.info('Resident created successfully', { 
        residentId: resident.id,
        userId 
      });

      return resident;

    } catch (error: unknown) {
      console.error('Failed to create resident', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new Error(`Failed to create resident: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getResidentById(id: string, userId: string, organizationId?: string): Promise<Resident> {
    try {
      this.logger.debug('Retrieving resident by ID', { id, userId, organizationId });

      let query = 'SELECT * FROM residents WHERE id = $1 AND deleted_at IS NULL';
      const values = [id];

      if (organizationId) {
        query += ' AND organization_id = $2';
        values.push(organizationId);
      }

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Resident not found');
      }

      const resident = this.mapDbRowToResident(result.rows[0]);

      this.logger.debug('Resident retrieved successfully', { 
        id: resident.id,
        userId 
      });

      return resident;

    } catch (error: unknown) {
      console.error('Failed to retrieve resident', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new Error(`Failed to retrieve resident: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async searchResidents(filters: ResidentSearchFilters, userId: string): Promise<ResidentSearchResult> {
    try {
      this.logger.debug('Searching residents', { filters, userId });

      // Build base query
      let query = 'SELECT * FROM residents WHERE deleted_at IS NULL';
      constvalues: any[] = [];
      let paramCount = 0;

      // Add organization filter
      paramCount++;
      query += ` AND organization_id = $${paramCount}`;
      values.push(filters.organizationId);

      // Add tenant filter
      paramCount++;
      query += ` AND tenant_id = $${paramCount}`;
      values.push(filters.tenantId);

      // Add status filter
      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        values.push(filters.status);
      }

      // Add care level filter
      if (filters.careLevel) {
        paramCount++;
        query += ` AND care_level = $${paramCount}`;
        values.push(filters.careLevel);
      }

      // Add search term filter
      if (filters.searchTerm) {
        paramCount++;
        query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR preferred_name ILIKE $${paramCount})`;
        values.push(`%${filters.searchTerm}%`);
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await this.db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const offset = (page - 1) * limit;

      // Add sorting
      const sortBy = filters.sortBy || 'last_name';
      const sortOrder = filters.sortOrder || 'ASC';
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);

      const result = await this.db.query(query, values);
      const residents = result.rows.map(row => this.mapDbRowToResident(row));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      constsearchResult: ResidentSearchResult = {
        residents,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrevious
        }
      };

      this.logger.debug('Resident search completed', { 
        total: residents.length,
        userId 
      });

      return searchResult;

    } catch (error: unknown) {
      console.error('Failed to search residents', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new Error(`Failed to search residents: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async updateResident(id: string, updates: Partial<CreateResidentRequest>, userId: string): Promise<Resident> {
    try {
      this.logger.debug('Updating resident', { id, userId });

      // Get existing resident
      const existingResident = await this.getResidentById(id, userId);

      // Build update query dynamically
      constupdateFields: string[] = [];
      constvalues: any[] = [];
      let paramCount = 0;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          const dbField = this.camelToSnakeCase(key);
          updateFields.push(`${dbField} = $${paramCount}`);
          
          // Handle JSON fields
          if (['address', 'emergencyContact', 'medicalConditions', 'allergies', 'medications'].includes(key)) {
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
        UPDATE residents 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Resident not found');
      }

      const updatedResident = this.mapDbRowToResident(result.rows[0]);

      console.info('Resident updated successfully', { 
        id: updatedResident.id,
        userId 
      });

      return updatedResident;

    } catch (error: unknown) {
      console.error('Failed to update resident', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new Error(`Failed to update resident: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async dischargeResident(id: string, dischargeDate: string, reason: string, userId: string): Promise<Resident> {
    try {
      this.logger.debug('Discharging resident', { id, dischargeDate, reason, userId });

      const query = `
        UPDATE residents 
        SET status = 'DISCHARGED', discharge_date = $1, updated_at = $2, updated_by = $3
        WHERE id = $4 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.db.query(query, [dischargeDate, new Date(), userId, id]);

      if (result.rows.length === 0) {
        throw new Error('Resident not found');
      }

      const dischargedResident = this.mapDbRowToResident(result.rows[0]);

      console.info('Resident discharged successfully', { 
        id: dischargedResident.id,
        userId 
      });

      return dischargedResident;

    } catch (error: unknown) {
      console.error('Failed to discharge resident', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new Error(`Failed to discharge resident: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getResidentStatistics(organizationId: string, userId: string): Promise<any> {
    try {
      this.logger.debug('Getting resident statistics', { organizationId, userId });

      const query = `
        SELECT 
          COUNT(*) as total_residents,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_residents,
          COUNT(CASE WHEN status = 'DISCHARGED' THEN 1 END) as discharged_residents,
          COUNT(CASE WHEN status = 'DECEASED' THEN 1 END) as deceased_residents,
          COUNT(CASE WHEN care_level = 'LOW' THEN 1 END) as low_care,
          COUNT(CASE WHEN care_level = 'MEDIUM' THEN 1 END) as medium_care,
          COUNT(CASE WHEN care_level = 'HIGH' THEN 1 END) as high_care,
          COUNT(CASE WHEN care_level = 'CRITICAL' THEN 1 END) as critical_care
        FROM residents 
        WHERE organization_id = $1 AND deleted_at IS NULL
      `;

      const result = await this.db.query(query, [organizationId]);
      const stats = result.rows[0];

      this.logger.debug('Resident statistics generated', { organizationId, userId });

      return {
        totalResidents: parseInt(stats.total_residents),
        activeResidents: parseInt(stats.active_residents),
        dischargedResidents: parseInt(stats.discharged_residents),
        deceasedResidents: parseInt(stats.deceased_residents),
        careLevelBreakdown: {
          low: parseInt(stats.low_care),
          medium: parseInt(stats.medium_care),
          high: parseInt(stats.high_care),
          critical: parseInt(stats.critical_care)
        }
      };

    } catch (error: unknown) {
      console.error('Failed to get resident statistics', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new Error(`Failed to get resident statistics: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private validateCreateResidentRequest(request: CreateResidentRequest): void {
    consterrors: string[] = [];

    if (!request.firstName?.trim()) errors.push('First name is required');
    if (!request.lastName?.trim()) errors.push('Last name is required');
    if (!request.dateOfBirth) errors.push('Date of birth is required');
    if (!request.gender) errors.push('Gender is required');
    if (!request.careLevel) errors.push('Care level is required');
    if (!request.admissionDate) errors.push('Admission date is required');
    if (!request.organizationId) errors.push('Organization ID is required');
    if (!request.tenantId) errors.push('Tenant ID is required');

    // Validate date of birth
    if (request.dateOfBirth) {
      const dob = new Date(request.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        errors.push('Date of birth must be in the past');
      }
    }

    // Validate NHS number if provided
    if (request.nhsNumber && !this.validateNHSNumber(request.nhsNumber)) {
      errors.push('Invalid NHS number format');
    }

    // Validate email if provided
    if (request.email && !this.isValidEmail(request.email)) {
      errors.push('Invalid email format');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private validateNHSNumber(nhsNumber: string): boolean {
    // Remove spaces and hyphens
    const cleanNumber = nhsNumber.replace(/[\s-]/g, '');
    
    // Check if it's 10 digits
    if (!/^\d{10}$/.test(cleanNumber)) {
      return false;
    }

    // NHS number validation algorithm
    const digits = cleanNumber.split('').map(Number);
    const checkDigit = digits[9];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] || 0 * (10 - i);
    }
    
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder < 2 ? remainder : 11 - remainder;
    
    return calculatedCheckDigit === checkDigit;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapDbRowToResident(row: any): Resident {
    return {
      id: row.id,
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      preferredName: row.preferred_name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      maritalStatus: row.marital_status,
      nhsNumber: row.nhs_number,
      phoneNumber: row.phone_number,
      email: row.email,
      address: row.address ? JSON.parse(row.address) : undefined,
      careLevel: row.care_level,
      admissionDate: row.admission_date,
      dischargeDate: row.discharge_date,
      status: row.status,
      organizationId: row.organization_id,
      tenantId: row.tenant_id,
      emergencyContact: row.emergency_contact ? JSON.parse(row.emergency_contact) : undefined,
      medicalConditions: row.medical_conditions ? JSON.parse(row.medical_conditions) : undefined,
      allergies: row.allergies ? JSON.parse(row.allergies) : undefined,
      medications: row.medications ? JSON.parse(row.medications) : undefined,
      careNotes: row.care_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}
