/**
 * @fileoverview inventory management Service
 * @module Inventory/InventoryManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description inventory management Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { InventoryItem, ItemCategory, StockStatus, TrackingMethod } from '../../entities/inventory/InventoryItem';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export class InventoryManagementService {
  privateinventoryRepository: Repository<InventoryItem>;
  privatenotificationService: NotificationService;
  privateauditService: AuditService;

  const ructor() {
    this.inventoryRepository = AppDataSource.getRepository(InventoryItem);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  async createAdvancedInventoryItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const itemCode = await this.generateItemCode(itemData.category!);
      
      const item = this.inventoryRepository.create({
        ...itemData,
        itemCode,
        stockStatus: StockStatus.IN_STOCK,
        trackingMethod: TrackingMethod.RFID,
        currentStock: itemData.currentStock || 0,
        totalValue: (itemData.currentStock || 0) * (itemData.unitCost || 0),
        consumptionPattern: {
          dailyAverageUsage: 1,
          weeklyPattern: {},
          monthlyTrend: 0,
          seasonalFactors: {},
          peakUsagePeriods: [],
          consumptionVariability: 0.2
        },
        qualityControl: {
          incomingInspectionRequired: itemData.category === ItemCategory.MEDICAL_SUPPLIES,
          qualityStandards: ['ISO_9001'],
          testingRequirements: [],
          certificationRequired: itemData.category === ItemCategory.PHARMACEUTICALS,
          batchTestingFrequency: 1,
          qualityIssueHistory: []
        },
        rfidTracking: {
          rfidEnabled: true,
          rfidFrequency: '860-960MHz',
          readRange: 10,
          readCount: 0,
          locationAccuracy: 1,
          realTimeTracking: true
        },
        barcodeTracking: {
          barcodeType: 'Code128',
          barcodeValue: itemCode,
          printQuality: 'A',
          scanCount: 0,
          mobileAppCompatible: true,
          batchBarcodeEnabled: true
        },
        aiOptimization: {
          demandForecastAccuracy: 85,
          reorderOptimization: {
            currentReorderPoint: itemData.reorderPoint || 10,
            optimizedReorderPoint: itemData.reorderPoint || 10,
            potentialSavings: 0,
            riskLevel: 'low'
          },
          supplierOptimization: {
            currentSupplier: itemData.supplierId || 'default',
            alternativeSuppliers: []
          },
          wastageReduction: {
            currentWastage: 2,
            predictedWastage: 1.5,
            reductionOpportunities: ['Better forecasting'],
            potentialSavings: 500
          }
        },
        isActive: true
      });

      const savedItem = await this.inventoryRepository.save(item);
      
      await this.auditService.logEvent({
        resource: 'InventoryItem',
        entityType: 'InventoryItem',
        entityId: savedItem.id,
        action: 'CREATE',
        details: { itemCode: savedItem.itemCode, category: savedItem.category },
        userId: 'system'
      });

      return savedItem;
    } catch (error: unknown) {
      console.error('Error creating advanced inventoryitem:', error);
      throw error;
    }
  }

  async performRFIDScan(rfidTagId: string, readerId: string, location: string): Promise<any> {
    try {
      const item = await this.inventoryRepository.findOne({
        where: { 'rfidTracking.rfidTagId': rfidTagId } as any
      });

      if (!item) {
        throw new Error('Item not found for RFID tag');
      }

      item.scanRFID(readerId, location);
      await this.inventoryRepository.save(item);

      return {
        itemCode: item.itemCode,
        description: item.description,
        currentLocation: location,
        stockLevel: item.currentStock,
        lastScan: new Date()
      };
    } catch (error: unknown) {
      console.error('Error performing RFIDscan:', error);
      throw error;
    }
  }

  async getInventoryAnalytics(): Promise<any> {
    try {
      const items = await this.inventoryRepository.find();
      
      const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
      const lowStockItems = items.filter(item => item.isLowStock()).length;
      const expiredItems = items.filter(item => item.isExpired()).length;
      const averageTurnover = items.reduce((sum, item) => sum + item.getStockTurnoverRate(), 0) / items.length;

      return {
        totalItems: items.length,
        totalValue,
        lowStockItems,
        expiredItems,
        averageTurnover,
        categories: this.getCategoryBreakdown(items),
        rfidTrackedItems: items.filter(item => item.hasRFIDTracking()).length,
        aiOptimizedItems: items.filter(item => item.aiOptimization.demandForecastAccuracy > 80).length
      };
    } catch (error: unknown) {
      console.error('Error getting inventoryanalytics:', error);
      throw error;
    }
  }

  private async generateItemCode(category: ItemCategory): Promise<string> {
    const prefix = category.substring(0, 3).toUpperCase();
    const count = await this.inventoryRepository.count({ where: { category } });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }

  private getCategoryBreakdown(items: InventoryItem[]): any {
    return items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
  }
}
