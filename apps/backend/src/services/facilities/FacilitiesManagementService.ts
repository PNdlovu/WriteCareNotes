/**
 * @fileoverview facilities management Service
 * @module Facilities/FacilitiesManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description facilities management Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { FacilityAsset, AssetType, AssetCondition } from '../../entities/facilities/FacilityAsset';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export class FacilitiesManagementService {
  privateassetRepository: Repository<FacilityAsset>;
  privatenotificationService: NotificationService;
  privateauditService: AuditService;

  constructor() {
    this.assetRepository = AppDataSource.getRepository(FacilityAsset);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  async createFacilityAsset(assetData: Partial<FacilityAsset>): Promise<FacilityAsset> {
    try {
      const assetId = await this.generateAssetId();
      
      const asset = this.assetRepository.create({
        ...assetData,
        assetId,
        condition: AssetCondition.GOOD,
        predictiveMaintenanceData: {
          sensorData: [],
          performanceMetrics: {
            efficiency: 95,
            reliability: 98,
            availability: 99,
            energyConsumption: 100,
            operatingCosts: 500
          },
          predictiveAnalysis: {
            failureProbability: 15,
            remainingUsefulLife: 1825, // 5 years
            maintenanceRecommendations: ['Regular inspection'],
            riskFactors: [],
            costOfFailure: 5000
          }
        },
        installationDate: new Date(),
        currentValue: assetData.purchaseValue || 0
      });

      const savedAsset = await this.assetRepository.save(asset);
      
      await this.auditService.logEvent({
        resource: 'FacilityAsset',
        entityType: 'FacilityAsset',
        entityId: savedAsset.id,
        action: 'CREATE_ASSET',
        details: { assetId: savedAsset.assetId, assetType: savedAsset.assetType },
        userId: 'facilities_system'
      });

      return savedAsset;
    } catch (error: unknown) {
      console.error('Error creating facility asset:', error);
      throw error;
    }
  }

  async getFacilitiesAnalytics(): Promise<any> {
    try {
      const allAssets = await this.assetRepository.find();
      
      return {
        totalAssets: allAssets.length,
        assetsByType: this.calculateAssetDistribution(allAssets),
        maintenanceRequired: allAssets.filter(asset => asset.needsMaintenance()).length,
        averageCondition: this.calculateAverageCondition(allAssets),
        totalValue: allAssets.reduce((sum, asset) => sum + asset.currentValue, 0),
        predictiveInsights: this.generatePredictiveInsights(allAssets)
      };
    } catch (error: unknown) {
      console.error('Error getting facilities analytics:', error);
      throw error;
    }
  }

  private async generateAssetId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.assetRepository.count();
    return `FA${year}${String(count + 1).padStart(4, '0')}`;
  }

  private calculateAssetDistribution(assets: FacilityAsset[]): any {
    return assets.reduce((acc, asset) => {
      acc[asset.assetType] = (acc[asset.assetType] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageCondition(assets: FacilityAsset[]): number {
    const conditionScores = {
      [AssetCondition.EXCELLENT]: 100,
      [AssetCondition.GOOD]: 80,
      [AssetCondition.FAIR]: 60,
      [AssetCondition.POOR]: 40,
      [AssetCondition.CRITICAL]: 20,
      [AssetCondition.OUT_OF_SERVICE]: 0
    };
    
    const totalScore = assets.reduce((sum, asset) => sum + conditionScores[asset.condition], 0);
    return assets.length > 0 ? totalScore / assets.length : 0;
  }

  private generatePredictiveInsights(assets: FacilityAsset[]): any {
    return {
      assetsNeedingMaintenance: assets.filter(asset => asset.needsMaintenance()).length,
      criticalAssets: assets.filter(asset => asset.condition === AssetCondition.CRITICAL).length,
      maintenanceCostForecast: assets.reduce((sum, asset) => 
        sum + asset.predictiveMaintenanceData.predictiveAnalysis.costOfFailure * 
        (asset.predictiveMaintenanceData.predictiveAnalysis.failureProbability / 100), 0
      )
    };
  }
}
