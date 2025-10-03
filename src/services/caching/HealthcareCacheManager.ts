/**
 * @fileoverview Healthcare-specific cache manager for WriteCareNotes
 * @module HealthcareCacheManager
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Provides healthcare-specific caching patterns, invalidation strategies,
 * and compliance-aware cache management for medical data, resident information,
 * and care-related operations.
 * 
 * @example
 * // Healthcare cache usage
 * const cacheManager = new HealthcareCacheManager();
 * await cacheManager.cacheResident(resident);
 * await cacheManager.cacheMedicationSchedule(residentId, schedule);
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements PII-aware caching with encryption
 * - Follows healthcare data retention policies
 * - Includes audit trail for all cache operations
 */

import { CacheService, CacheOptions } from './CacheService';
import { Logger } from 'winston';
import { createLogger } from '../../utils/logger';
import { AuditService } from '../audit/AuditService';

export interface ResidentCacheData {
  id: string;
  firstName: string;
  lastName: string;
  nhsNumber: string;
  dateOfBirth: string;
  careLevel: string;
  roomNumber?: string;
  admissionDate: string;
  emergencyContacts: any[];
  medicalConditions: string[];
  allergies: string[];
  lastUpdated: string;
}

export interface MedicationCacheData {
  residentId: string;
  prescriptions: any[];
  administrationRecords: any[];
  nextDue: any[];
  alerts: any[];
  lastUpdated: string;
}

export interface CarePlanCacheData {
  residentId: string;
  carePlan: any;
  goals: any[];
  assessments: any[];
  reviews: any[];
  lastUpdated: string;
}

export interface StaffCacheData {
  id: string;
  name: string;
  role: string;
  qualifications: string[];
  schedule: any[];
  trainingRecords: any[];
  lastUpdated: string;
}

export interface HealthcareCachePattern {
  keyPrefix: string;
  defaultTTL: number;
  tags: string[];
  containsPII: boolean;
  healthcareContext: string;
  invalidationTriggers: string[];
}

export class HealthcareCacheManager {
  private cacheService: CacheService;
  private logger: Logger;
  private auditService: AuditService;
  private cachePatterns: Map<string, HealthcareCachePattern>;

  constructor() {
    this.cacheService = new CacheService();
    this.logger = createLogger('HealthcareCacheManager');
    this.auditService = new AuditService();
    this.cachePatterns = new Map();
    
    this.initializeCachePatterns();
  }

  /**
   * Initialize healthcare-specific cache patterns
   */
  private initializeCachePatterns(): void {
    // Resident data caching pattern
    this.cachePatterns.set('resident', {
      keyPrefix: 'resident',
      defaultTTL: 3600, // 1 hour
      tags: ['resident', 'personal-data'],
      containsPII: true,
      healthcareContext: 'resident-management',
      invalidationTriggers: ['resident-update', 'admission', 'discharge', 'transfer']
    });

    // Medication data caching pattern
    this.cachePatterns.set('medication', {
      keyPrefix: 'medication',
      defaultTTL: 1800, // 30 minutes
      tags: ['medication', 'prescription', 'mar'],
      containsPII: true,
      healthcareContext: 'medication-management',
      invalidationTriggers: ['medication-update', 'prescription-change', 'administration']
    });

    // Care plan caching pattern
    this.cachePatterns.set('care-plan', {
      keyPrefix: 'care-plan',
      defaultTTL: 7200, // 2 hours
      tags: ['care-plan', 'assessment', 'goals'],
      containsPII: true,
      healthcareContext: 'care-planning',
      invalidationTriggers: ['care-plan-update', 'assessment-complete', 'goal-update']
    });

    // Staff data caching pattern
    this.cachePatterns.set('staff', {
      keyPrefix: 'staff',
      defaultTTL: 3600, // 1 hour
      tags: ['staff', 'schedule', 'training'],
      containsPII: true,
      healthcareContext: 'hr-management',
      invalidationTriggers: ['staff-update', 'schedule-change', 'training-complete']
    });

    // Assessment data caching pattern
    this.cachePatterns.set('assessment', {
      keyPrefix: 'assessment',
      defaultTTL: 14400, // 4 hours
      tags: ['assessment', 'risk', 'health-record'],
      containsPII: true,
      healthcareContext: 'assessment',
      invalidationTriggers: ['assessment-update', 'risk-change', 'health-record-update']
    });

    // Compliance data caching pattern
    this.cachePatterns.set('compliance', {
      keyPrefix: 'compliance',
      defaultTTL: 1800, // 30 minutes
      tags: ['compliance', 'audit', 'regulatory'],
      containsPII: false,
      healthcareContext: 'compliance',
      invalidationTriggers: ['compliance-update', 'audit-complete', 'violation-detected']
    });

    // Financial data caching pattern
    this.cachePatterns.set('financial', {
      keyPrefix: 'financial',
      defaultTTL: 3600, // 1 hour
      tags: ['financial', 'billing', 'payment'],
      containsPII: true,
      healthcareContext: 'financial-management',
      invalidationTriggers: ['payment-processed', 'invoice-generated', 'billing-update']
    });

    // Report data caching pattern
    this.cachePatterns.set('report', {
      keyPrefix: 'report',
      defaultTTL: 1800, // 30 minutes
      tags: ['report', 'analytics', 'dashboard'],
      containsPII: false,
      healthcareContext: 'reporting',
      invalidationTriggers: ['data-update', 'report-refresh']
    });
  }

  /**
   * Cache resident data with healthcare-specific handling
   */
  async cacheResident(resident: ResidentCacheData, customTTL?: number): Promise<boolean> {
    const pattern = this.cachePatterns.get('resident')!;
    const key = `${pattern.keyPrefix}:${resident.id}`;
    
    const options: CacheOptions = {
      ttl: customTTL || pattern.defaultTTL,
      tags: pattern.tags,
      containsPII: pattern.containsPII,
      healthcareContext: pattern.healthcareContext,
      encrypt: true
    };

    const success = await this.cacheService.set(key, resident, options.ttl!, options);
    
    if (success) {
      // Cache additional lookup keys
      await this.cacheService.set(
        `${pattern.keyPrefix}:nhs:${resident.nhsNumber}`,
        { residentId: resident.id },
        options.ttl!,
        { ...options, containsPII: false }
      );

      this.logger.info(`Cached resident data for ID: ${resident.id}`);
    }

    return success;
  }

  /**
   * Get resident data from cache
   */
  async getResident(residentId: string): Promise<ResidentCacheData | null> {
    const pattern = this.cachePatterns.get('resident')!;
    const key = `${pattern.keyPrefix}:${residentId}`;
    
    return await this.cacheService.get<ResidentCacheData>(key, {
      healthcareContext: pattern.healthcareContext,
      containsPII: pattern.containsPII
    });
  }

  /**
   * Get resident by NHS number
   */
  async getResidentByNHSNumber(nhsNumber: string): Promise<ResidentCacheData | null> {
    const pattern = this.cachePatterns.get('resident')!;
    const lookupKey = `${pattern.keyPrefix}:nhs:${nhsNumber}`;
    
    const lookup = await this.cacheService.get<{ residentId: string }>(lookupKey);
    if (!lookup) {
      return null;
    }

    return await this.getResident(lookup.residentId);
  }

  /**
   * Cache medication schedule and records
   */
  async cacheMedicationSchedule(residentId: string, medicationData: MedicationCacheData, customTTL?: number): Promise<boolean> {
    const pattern = this.cachePatterns.get('medication')!;
    const key = `${pattern.keyPrefix}:schedule:${residentId}`;
    
    const options: CacheOptions = {
      ttl: customTTL || pattern.defaultTTL,
      tags: pattern.tags,
      containsPII: pattern.containsPII,
      healthcareContext: pattern.healthcareContext,
      encrypt: true
    };

    const success = await this.cacheService.set(key, medicationData, options.ttl!, options);
    
    if (success) {
      this.logger.info(`Cached medication schedule for resident: ${residentId}`);
    }

    return success;
  }

  /**
   * Get medication schedule from cache
   */
  async getMedicationSchedule(residentId: string): Promise<MedicationCacheData | null> {
    const pattern = this.cachePatterns.get('medication')!;
    const key = `${pattern.keyPrefix}:schedule:${residentId}`;
    
    return await this.cacheService.get<MedicationCacheData>(key, {
      healthcareContext: pattern.healthcareContext,
      containsPII: pattern.containsPII
    });
  }

  /**
   * Cache care plan data
   */
  async cacheCarePlan(residentId: string, carePlanData: CarePlanCacheData, customTTL?: number): Promise<boolean> {
    const pattern = this.cachePatterns.get('care-plan')!;
    const key = `${pattern.keyPrefix}:${residentId}`;
    
    const options: CacheOptions = {
      ttl: customTTL || pattern.defaultTTL,
      tags: pattern.tags,
      containsPII: pattern.containsPII,
      healthcareContext: pattern.healthcareContext,
      encrypt: true
    };

    const success = await this.cacheService.set(key, carePlanData, options.ttl!, options);
    
    if (success) {
      this.logger.info(`Cached care plan for resident: ${residentId}`);
    }

    return success;
  }

  /**
   * Get care plan from cache
   */
  async getCarePlan(residentId: string): Promise<CarePlanCacheData | null> {
    const pattern = this.cachePatterns.get('care-plan')!;
    const key = `${pattern.keyPrefix}:${residentId}`;
    
    return await this.cacheService.get<CarePlanCacheData>(key, {
      healthcareContext: pattern.healthcareContext,
      containsPII: pattern.containsPII
    });
  }

  /**
   * Cache staff data
   */
  async cacheStaff(staff: StaffCacheData, customTTL?: number): Promise<boolean> {
    const pattern = this.cachePatterns.get('staff')!;
    const key = `${pattern.keyPrefix}:${staff.id}`;
    
    const options: CacheOptions = {
      ttl: customTTL || pattern.defaultTTL,
      tags: pattern.tags,
      containsPII: pattern.containsPII,
      healthcareContext: pattern.healthcareContext,
      encrypt: true
    };

    const success = await this.cacheService.set(key, staff, options.ttl!, options);
    
    if (success) {
      this.logger.info(`Cached staff data for ID: ${staff.id}`);
    }

    return success;
  }

  /**
   * Get staff data from cache
   */
  async getStaff(staffId: string): Promise<StaffCacheData | null> {
    const pattern = this.cachePatterns.get('staff')!;
    const key = `${pattern.keyPrefix}:${staffId}`;
    
    return await this.cacheService.get<StaffCacheData>(key, {
      healthcareContext: pattern.healthcareContext,
      containsPII: pattern.containsPII
    });
  }

  /**
   * Cache report data with automatic expiration
   */
  async cacheReport(reportId: string, reportData: any, customTTL?: number): Promise<boolean> {
    const pattern = this.cachePatterns.get('report')!;
    const key = `${pattern.keyPrefix}:${reportId}`;
    
    const options: CacheOptions = {
      ttl: customTTL || pattern.defaultTTL,
      tags: pattern.tags,
      containsPII: pattern.containsPII,
      healthcareContext: pattern.healthcareContext,
      encrypt: false
    };

    const success = await this.cacheService.set(key, reportData, options.ttl!, options);
    
    if (success) {
      this.logger.info(`Cached report data for ID: ${reportId}`);
    }

    return success;
  }

  /**
   * Get report data from cache
   */
  async getReport(reportId: string): Promise<any | null> {
    const pattern = this.cachePatterns.get('report')!;
    const key = `${pattern.keyPrefix}:${reportId}`;
    
    return await this.cacheService.get(key, {
      healthcareContext: pattern.healthcareContext,
      containsPII: pattern.containsPII
    });
  }

  /**
   * Invalidate healthcare data by context
   */
  async invalidateByHealthcareContext(context: string, reason?: string): Promise<number> {
    let totalInvalidated = 0;

    for (const [patternName, pattern] of this.cachePatterns) {
      if (pattern.healthcareContext === context) {
        const invalidated = await this.cacheService.invalidateByPattern(
          `${pattern.keyPrefix}:*`,
          context
        );
        totalInvalidated += invalidated;
        
        this.logger.info(`Invalidated ${invalidated} keys for pattern ${pattern.keyPrefix} in context ${context}`);
      }
    }

    await this.auditService.log({
      action: 'CACHE_INVALIDATE_CONTEXT',
      resourceType: 'cache',
      resourceId: context,
      details: { 
        context, 
        reason,
        totalInvalidated 
      },
      timestamp: new Date(),
      userId: 'system',
      correlationId: this.generateCorrelationId()
    });

    return totalInvalidated;
  }

  /**
   * Invalidate resident-related cache data
   */
  async invalidateResidentData(residentId: string, reason?: string): Promise<number> {
    const patterns = ['resident', 'medication', 'care-plan', 'assessment'];
    let totalInvalidated = 0;

    for (const patternName of patterns) {
      const pattern = this.cachePatterns.get(patternName);
      if (pattern) {
        const invalidated = await this.cacheService.invalidateByPattern(
          `${pattern.keyPrefix}:*${residentId}*`,
          pattern.healthcareContext
        );
        totalInvalidated += invalidated;
      }
    }

    await this.auditService.log({
      action: 'CACHE_INVALIDATE_RESIDENT',
      resourceType: 'cache',
      resourceId: residentId,
      details: { 
        residentId, 
        reason,
        totalInvalidated 
      },
      timestamp: new Date(),
      userId: 'system',
      correlationId: this.generateCorrelationId()
    });

    this.logger.info(`Invalidated ${totalInvalidated} cache entries for resident ${residentId}`);
    return totalInvalidated;
  }

  /**
   * Warm cache with frequently accessed healthcare data
   */
  async warmHealthcareCache(data: {
    residents?: ResidentCacheData[];
    medications?: Array<{ residentId: string; data: MedicationCacheData }>;
    carePlans?: Array<{ residentId: string; data: CarePlanCacheData }>;
    staff?: StaffCacheData[];
  }): Promise<{ total: number; successful: number }> {
    let total = 0;
    let successful = 0;

    // Warm resident cache
    if (data.residents) {
      total += data.residents.length;
      for (const resident of data.residents) {
        const success = await this.cacheResident(resident);
        if (success) successful++;
      }
    }

    // Warm medication cache
    if (data.medications) {
      total += data.medications.length;
      for (const med of data.medications) {
        const success = await this.cacheMedicationSchedule(med.residentId, med.data);
        if (success) successful++;
      }
    }

    // Warm care plan cache
    if (data.carePlans) {
      total += data.carePlans.length;
      for (const plan of data.carePlans) {
        const success = await this.cacheCarePlan(plan.residentId, plan.data);
        if (success) successful++;
      }
    }

    // Warm staff cache
    if (data.staff) {
      total += data.staff.length;
      for (const staff of data.staff) {
        const success = await this.cacheStaff(staff);
        if (success) successful++;
      }
    }

    this.logger.info(`Healthcare cache warmed: ${successful}/${total} items successful`);
    return { total, successful };
  }

  /**
   * Get healthcare cache statistics
   */
  async getHealthcareStats(): Promise<any> {
    const baseStats = await this.cacheService.getStats();
    
    // Get pattern-specific statistics
    const patternStats: any = {};
    
    for (const [patternName, pattern] of this.cachePatterns) {
      try {
        const keys = await this.cacheService['redis'].keys(`${pattern.keyPrefix}:*`);
        patternStats[patternName] = {
          keyCount: keys.length,
          pattern: pattern.keyPrefix,
          healthcareContext: pattern.healthcareContext,
          containsPII: pattern.containsPII,
          defaultTTL: pattern.defaultTTL
        };
      } catch (error) {
        this.logger.warn(`Error getting stats for pattern ${patternName}:`, error);
        patternStats[patternName] = { keyCount: 0, error: error.message };
      }
    }

    return {
      ...baseStats,
      healthcarePatterns: patternStats,
      totalPatterns: this.cachePatterns.size
    };
  }

  /**
   * Generate correlation ID for audit trails
   */
  private generateCorrelationId(): string {
    return `healthcare-cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.cacheService.shutdown();
    this.logger.info('Healthcare cache manager shutdown completed');
  }
}