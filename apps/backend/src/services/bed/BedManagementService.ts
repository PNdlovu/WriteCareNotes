/**
 * @fileoverview bed management Service
 * @module Bed/BedManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description bed management Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { Bed, BedStatus, CareLevel } from '../../entities/bed/Bed';
import { Room } from '../../entities/bed/Room';
import { WaitingListEntry, WaitingListStatus } from '../../entities/bed/WaitingListEntry';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export interface BedSearchCriteria {
  careLevel?: CareLevel[];
  roomType?: string;
  floor?: number;
  wing?: string;
  accessibility?: string[];
  maxRate?: number;
  availableFrom?: Date;
  availableTo?: Date;
}

export interface OccupancyAnalytics {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  averageDailyRate: number;
  projectedRevenue: number;
}

export interface BedAllocationResult {
  success: boolean;
  bedId?: string;
  waitingListEntryId?: string;
  message: string;
  allocationDate?: Date;
}

export interface RevenueOptimizationSuggestion {
  bedId: string;
  currentRate: number;
  suggestedRate: number;
  reasoning: string;
  potentialAdditionalRevenue: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class BedManagementService {
  private bedRepository: Repository<Bed>;
  private roomRepository: Repository<Room>;
  private waitingListRepository: Repository<WaitingListEntry>;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.bedRepository = AppDataSource.getRepository(Bed);
    this.roomRepository = AppDataSource.getRepository(Room);
    this.waitingListRepository = AppDataSource.getRepository(WaitingListEntry);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  // Core Bed Management
  async getAllBeds(): Promise<Bed[]> {
    return await this.bedRepository.find({
      relations: ['room', 'currentResident']
    });
  }

  async getBedById(bedId: string): Promise<Bed | null> {
    return await this.bedRepository.findOne({
      where: { id: bedId },
      relations: ['room', 'currentResident']
    });
  }

  async getAvailableBeds(criteria?: BedSearchCriteria): Promise<Bed[]> {
    let queryBuilder = this.bedRepository.createQueryBuilder('bed')
      .leftJoinAndSelect('bed.room', 'room')
      .where('bed.status = :status', { status: BedStatus.AVAILABLE })
      .andWhere('bed.currentResidentId IS NULL');

    if (criteria) {
      if (criteria.careLevel && criteria.careLevel.length > 0) {
        queryBuilder = queryBuilder.andWhere('bed.careLevel && :careLevel', { 
          careLevel: criteria.careLevel 
        });
      }

      if (criteria.roomType) {
        queryBuilder = queryBuilder.andWhere('room.roomType = :roomType', { 
          roomType: criteria.roomType 
        });
      }

      if (criteria.floor !== undefined) {
        queryBuilder = queryBuilder.andWhere('room.floor = :floor', { 
          floor: criteria.floor 
        });
      }

      if (criteria.wing) {
        queryBuilder = queryBuilder.andWhere('room.wing = :wing', { 
          wing: criteria.wing 
        });
      }

      if (criteria.maxRate) {
        queryBuilder = queryBuilder.andWhere('(bed.currentRate->>\'amount\')::numeric <= :maxRate', { 
          maxRate: criteria.maxRate 
        });
      }
    }

    return await queryBuilder.getMany();
  }

  async allocateBed(bedId: string, residentId: string): Promise<BedAllocationResult> {
    const bed = await this.getBedById(bedId);
    if (!bed) {
      return {
        success: false,
        message: 'Bed not found'
      };
    }

    if (!bed.isAvailable()) {
      return {
        success: false,
        message: 'Bed is not available'
      };
    }

    // Update bed status
    bed.status = BedStatus.OCCUPIED;
    bed.currentResidentId = residentId;
    
    // Add occupancy record
    const occupancyRecord = {
      id: crypto.randomUUID(),
      residentId,
      startDate: new Date(),
      reasonForChange: 'New admission',
      notes: 'Bed allocated through bed management service'
    };
    
    bed.occupancyHistory.push(occupancyRecord);
    
    await this.bedRepository.save(bed);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Bed',
        entityType: 'Bed',
      entityId: bedId,
      action: 'ALLOCATE',
      details: { residentId, allocationDate: new Date() },
      userId: 'system' // Should be actual user ID
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Notification: Bed Allocated',
        type: 'bed_allocated',
      recipients: ['care_managers', 'housekeeping'],
      data: { bedNumber: bed.bedNumber, residentId }
    });

    return {
      success: true,
      bedId,
      message: 'Bed allocated successfully',
      allocationDate: new Date()
    };
  }

  async deallocateBed(bedId: string, reason: string): Promise<BedAllocationResult> {
    const bed = await this.getBedById(bedId);
    if (!bed) {
      return {
        success: false,
        message: 'Bed not found'
      };
    }

    if (!bed.isOccupied()) {
      return {
        success: false,
        message: 'Bed is not currently occupied'
      };
    }

    const previousResidentId = bed.currentResidentId;

    // Update occupancy history
    const currentOccupancy = bed.occupancyHistory.find(record => 
      record.residentId === previousResidentId && !record.endDate
    );
    
    if (currentOccupancy) {
      currentOccupancy.endDate = new Date();
      currentOccupancy.reasonForChange = reason;
    }

    // Clear bed assignment
    bed.status = BedStatus.CLEANING; // Set to cleaning first
    bed.currentResidentId = undefined;
    
    await this.bedRepository.save(bed);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Bed',
        entityType: 'Bed',
      entityId: bedId,
      action: 'DEALLOCATE',
      details: { previousResidentId, reason, deallocationDate: new Date() },
      userId: 'system'
    });

    return {
      success: true,
      bedId,
      message: 'Bed deallocated successfully'
    };
  }

  // Waiting List Management
  async addToWaitingList(entry: Partial<WaitingListEntry>): Promise<WaitingListEntry> {
    const waitingListEntry = this.waitingListRepository.create({
      ...entry,
      applicationNumber: await this.generateApplicationNumber(),
      status: WaitingListStatus.ACTIVE,
      applicationDate: new Date()
    });

    const savedEntry = await this.waitingListRepository.save(waitingListEntry);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'WaitingListEntry',
        entityType: 'WaitingListEntry',
      entityId: savedEntry.id,
      action: 'CREATE',
      details: { applicationNumber: savedEntry.applicationNumber },
      userId: 'system'
    });

    return savedEntry;
  }

  async getWaitingList(): Promise<WaitingListEntry[]> {
    return await this.waitingListRepository.find({
      where: { status: WaitingListStatus.ACTIVE },
      order: { applicationDate: 'ASC' }
    });
  }

  async getPrioritizedWaitingList(): Promise<WaitingListEntry[]> {
    const waitingList = await this.getWaitingList();
    
    return waitingList.sort((a, b) => {
      const scoreA = a.calculatePriorityScore();
      const scoreB = b.calculatePriorityScore();
      return scoreB - scoreA; // Highest score first
    });
  }

  async matchBedToWaitingList(): Promise<BedAllocationResult[]> {
    const availableBeds = await this.getAvailableBeds();
    const waitingList = await this.getPrioritizedWaitingList();
    const results: BedAllocationResult[] = [];

    for (const entry of waitingList) {
      const suitableBed = availableBeds.find(bed => entry.canBeAccommodatedBy(bed));
      
      if (suitableBed) {
        // Remove bed from available list to prevent double allocation
        const bedIndex = availableBeds.indexOf(suitableBed);
        availableBeds.splice(bedIndex, 1);

        results.push({
          success: true,
          bedId: suitableBed.id,
          waitingListEntryId: entry.id,
          message: `Matched ${entry.prospectiveResidentName} to bed ${suitableBed.bedNumber}`,
          allocationDate: new Date()
        });
      }
    }

    return results;
  }

  // Analytics and Reporting
  async getOccupancyAnalytics(): Promise<OccupancyAnalytics> {
    const allBeds = await this.getAllBeds();
    
    const totalBeds = allBeds.length;
    const occupiedBeds = allBeds.filter(bed => bed.isOccupied()).length;
    const availableBeds = allBeds.filter(bed => bed.isAvailable()).length;
    const maintenanceBeds = allBeds.filter(bed => bed.status === BedStatus.MAINTENANCE).length;
    
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    
    const averageDailyRate = totalBeds > 0 
      ? allBeds.reduce((sum, bed) => sum + bed.getDailyRate(), 0) / totalBeds 
      : 0;
    
    const projectedRevenue = occupiedBeds * averageDailyRate * 30; // Monthly projection

    return {
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      occupancyRate,
      averageDailyRate,
      projectedRevenue
    };
  }

  async getRevenueOptimizationSuggestions(): Promise<RevenueOptimizationSuggestion[]> {
    const beds = await this.getAllBeds();
    const suggestions: RevenueOptimizationSuggestion[] = [];

    for (const bed of beds) {
      // Simple revenue optimization logic
      const currentRate = bed.getDailyRate();
      const marketRate = await this.getMarketRate(bed.bedType, bed.careLevel);
      
      if (marketRate > currentRate * 1.05) { // 5% threshold
        suggestions.push({
          bedId: bed.id,
          currentRate,
          suggestedRate: marketRate,
          reasoning: 'Market rate analysis suggests rate increase opportunity',
          potentialAdditionalRevenue: (marketRate - currentRate) * 30,
          riskLevel: 'low'
        });
      }
    }

    return suggestions;
  }

  // Maintenance Management
  async scheduleMaintenance(bedId: string, maintenanceType: string, scheduledDate: Date): Promise<void> {
    const bed = await this.getBedById(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    if (bed.isOccupied()) {
      throw new Error('Cannot schedule maintenance for occupied bed');
    }

    bed.status = BedStatus.MAINTENANCE;
    bed.nextMaintenanceDate = scheduledDate;
    
    await this.bedRepository.save(bed);

    // Send notification to maintenance team
    await this.notificationService.sendNotification({
      message: 'Notification: Maintenance Scheduled',
        type: 'maintenance_scheduled',
      recipients: ['maintenance_team'],
      data: { 
        bedNumber: bed.bedNumber, 
        maintenanceType, 
        scheduledDate 
      }
    });
  }

  async completeMaintenance(bedId: string, maintenanceNotes: string): Promise<void> {
    const bed = await this.getBedById(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    bed.status = BedStatus.CLEANING; // Move to cleaning after maintenance
    bed.lastMaintenanceDate = new Date();
    
    // Update maintenance schedule
    const maintenanceRecord = {
      id: crypto.randomUUID(),
      date: new Date(),
      type: 'routine' as const,
      description: maintenanceNotes,
      performedBy: 'maintenance_team',
      status: 'completed' as const
    };
    
    bed.room.maintenanceHistory.push(maintenanceRecord);
    
    await this.bedRepository.save(bed);
    await this.roomRepository.save(bed.room);

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Notification: Maintenance Completed',
        type: 'maintenance_completed',
      recipients: ['housekeeping', 'care_managers'],
      data: { 
        bedNumber: bed.bedNumber, 
        maintenanceNotes 
      }
    });
  }

  async markBedAsClean(bedId: string): Promise<void> {
    const bed = await this.getBedById(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    bed.status = BedStatus.AVAILABLE;
    bed.room.lastCleaningDate = new Date();
    
    await this.bedRepository.save(bed);
    await this.roomRepository.save(bed.room);

    // Check waiting list for potential matches
    const waitingList = await this.getPrioritizedWaitingList();
    const suitableEntry = waitingList.find(entry => entry.canBeAccommodatedBy(bed));
    
    if (suitableEntry) {
      await this.notificationService.sendNotification({
        message: 'Notification: Bed Available For Waiting List',
        type: 'bed_available_for_waiting_list',
        recipients: ['admissions_team'],
        data: { 
          bedNumber: bed.bedNumber,
          waitingListEntry: suitableEntry.applicationNumber,
          prospectiveResident: suitableEntry.prospectiveResidentName
        }
      });
    }
  }

  // Private helper methods
  private async generateApplicationNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const count = await this.waitingListRepository.count({
      where: {
        applicationDate: new Date(year, date.getMonth(), date.getDate())
      }
    });
    
    return `WL${year}${month}${day}${String(count + 1).padStart(3, '0')}`;
  }

  private async getMarketRate(bedType: any, careLevel: CareLevel[]): Promise<number> {
    // Market rate calculation based on UK care home rates (2024)
    const baseRates = {
      standard: 850,      // £850/week standard care
      profiling: 950,     // £950/week profiling bed
      bariatric: 1200,    // £1200/week bariatric care
      low_low: 900,       // £900/week low-low bed
      pressure_relief: 1000, // £1000/week pressure relief
      electric: 980,      // £980/week electric bed
      manual: 820         // £820/week manual bed
    };

    const careLevelMultipliers = {
      residential: 1.0,   // Base rate for residential care
      nursing: 1.35,      // 35% premium for nursing care
      dementia: 1.55,     // 55% premium for dementia care
      palliative: 1.45,   // 45% premium for palliative care
      respite: 0.85,      // 15% discount for respite care
      rehabilitation: 1.25 // 25% premium for rehabilitation
    };

    // Regional adjustment factors for UK
    const regionalMultipliers = {
      london: 1.4,
      southeast: 1.2,
      southwest: 1.1,
      midlands: 1.0,
      north: 0.9,
      scotland: 0.95,
      wales: 0.9,
      northern_ireland: 0.85
    };

    const baseRate = baseRates[bedType] || 850;
    const maxCareMultiplier = Math.max(...careLevel.map(level => careLevelMultipliers[level] || 1.0));
    
    // Apply regional adjustment (defaulting to midlands)
    const regionalMultiplier = regionalMultipliers.midlands;
    
    // Apply seasonal adjustment
    const seasonalMultiplier = this.getSeasonalPricingMultiplier();
    
    // Apply demand-based pricing
    const demandMultiplier = await this.getDemandMultiplier();
    
    const finalRate = baseRate * maxCareMultiplier * regionalMultiplier * seasonalMultiplier * demandMultiplier;
    
    return Math.round(finalRate);
  }

  private getSeasonalPricingMultiplier(): number {
    const month = new Date().getMonth();
    // Higher rates in winter months due to increased demand
    const seasonalFactors = [
      1.05, // January
      1.03, // February  
      1.00, // March
      0.98, // April
      0.95, // May
      0.93, // June
      0.90, // July
      0.92, // August
      0.97, // September
      1.02, // October
      1.04, // November
      1.06  // December
    ];
    
    return seasonalFactors[month];
  }

  private async getDemandMultiplier(): Promise<number> {
    const analytics = await this.getOccupancyAnalytics();
    const occupancyRate = analytics.occupancyRate;
    
    // Dynamic pricing based on occupancy
    if (occupancyRate >= 95) return 1.1;  // 10% premium for high demand
    if (occupancyRate >= 90) return 1.05; // 5% premium
    if (occupancyRate >= 80) return 1.0;  // Standard rate
    if (occupancyRate >= 70) return 0.95; // 5% discount
    return 0.9; // 10% discount for low occupancy
  }

  // Capacity Planning
  async getCapacityForecast(months: number = 12): Promise<any> {
    const currentAnalytics = await this.getOccupancyAnalytics();
    const historicalData = await this.getHistoricalOccupancy(months);
    
    // Advanced forecast based on multiple factors
    const forecast = [];
    const currentOccupancyRate = currentAnalytics.occupancyRate;
    const waitingListSize = (await this.getWaitingList()).length;
    const averageStayDuration = await this.getAverageStayDuration();
    
    for (let i = 1; i <= months; i++) {
      // Simple linear trend with seasonal adjustments
      const seasonalFactor = this.getSeasonalFactor(new Date().getMonth() + i);
      const projectedOccupancy = Math.min(95, currentOccupancyRate * seasonalFactor);
      
      forecast.push({
        month: i,
        projectedOccupancyRate: projectedOccupancy,
        projectedRevenue: (currentAnalytics.totalBeds * projectedOccupancy / 100) * currentAnalytics.averageDailyRate * 30,
        recommendedActions: this.getRecommendations(projectedOccupancy)
      });
    }
    
    return forecast;
  }

  private async getHistoricalOccupancy(months: number): Promise<any[]> {
    const allBeds = await this.getAllBeds();
    const historicalData = [];
    
    for (let i = 0; i < months; i++) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      
      // Calculate occupancy for each month based on occupancy history
      let totalOccupiedDays = 0;
      let totalAvailableDays = 0;
      
      for (const bed of allBeds) {
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        // Count occupied days in this month
        for (const occupancy of bed.occupancyHistory) {
          const startDate = new Date(occupancy.startDate);
          const endDate = occupancy.endDate ? new Date(occupancy.endDate) : new Date();
          
          // Calculate overlap with target month
          const overlapStart = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
          const overlapEnd = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
          
          if (overlapStart <= overlapEnd) {
            const occupiedDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
            totalOccupiedDays += occupiedDays;
          }
        }
        
        // Total available days for this bed in this month
        totalAvailableDays += monthEnd.getDate();
      }
      
      const occupancyRate = totalAvailableDays > 0 ? (totalOccupiedDays / totalAvailableDays) * 100 : 0;
      
      historicalData.push({
        month: targetDate.toISOString().substring(0, 7), // YYYY-MM format
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        totalBeds: allBeds.length,
        occupiedBedDays: totalOccupiedDays,
        availableBedDays: totalAvailableDays
      });
    }
    
    return historicalData.reverse(); // Return chronologically
  }

  private async getAverageStayDuration(): Promise<number> {
    const allBeds = await this.getAllBeds();
    const completedStays = [];
    
    for (const bed of allBeds) {
      for (const occupancy of bed.occupancyHistory) {
        if (occupancy.endDate) {
          const startDate = new Date(occupancy.startDate);
          const endDate = new Date(occupancy.endDate);
          const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          completedStays.push(duration);
        }
      }
    }
    
    if (completedStays.length === 0) return 365; // Default 1 year
    
    return completedStays.reduce((sum, duration) => sum + duration, 0) / completedStays.length;
  }

  private getSeasonalFactor(month: number): number {
    // Seasonal adjustment factors for care home occupancy
    const seasonalFactors = [
      1.05, // January - higher due to winter health issues
      1.03, // February
      1.00, // March
      0.98, // April
      0.95, // May - lower due to better weather
      0.93, // June
      0.90, // July - lowest due to summer
      0.92, // August
      0.97, // September
      1.02, // October - increasing
      1.04, // November
      1.06  // December - highest due to holidays/winter
    ];
    
    return seasonalFactors[month % 12];
  }

  private getRecommendations(occupancyRate: number): string[] {
    const recommendations = [];
    
    if (occupancyRate < 80) {
      recommendations.push('Consider marketing initiatives');
      recommendations.push('Review pricing strategy');
      recommendations.push('Enhance referral partnerships');
    }
    
    if (occupancyRate > 95) {
      recommendations.push('Consider capacity expansion');
      recommendations.push('Optimize bed turnover processes');
      recommendations.push('Review waiting list management');
    }
    
    return recommendations;
  }

  // Revenue Optimization
  async optimizeRevenue(): Promise<RevenueOptimizationSuggestion[]> {
    return await this.getRevenueOptimizationSuggestions();
  }

  async updateBedRate(bedId: string, newRate: number, reason: string): Promise<void> {
    const bed = await this.getBedById(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    // Add to rate history
    bed.rateHistory.push({
      effectiveDate: new Date(),
      rate: { amount: newRate, currency: 'GBP' },
      reason,
      approvedBy: 'system' // Should be actual user
    });

    // Update current rate
    bed.currentRate = { amount: newRate, currency: 'GBP' };
    
    await this.bedRepository.save(bed);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Bed',
        entityType: 'Bed',
      entityId: bedId,
      action: 'RATE_UPDATE',
      details: { newRate, reason },
      userId: 'system'
    });
  }
}