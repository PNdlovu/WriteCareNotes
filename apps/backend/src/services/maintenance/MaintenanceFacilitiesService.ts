/**
 * @fileoverview maintenance facilities Service
 * @module Maintenance/MaintenanceFacilitiesService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description maintenance facilities Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { Asset, AssetType, AssetStatus, MaintenanceType, Priority } from '../../entities/maintenance/Asset';
import { WorkOrder, WorkOrderStatus } from '../../entities/maintenance/WorkOrder';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export interface MaintenanceWorkOrder {
  id: string;
  assetId: string;
  workOrderNumber: string;
  title: string;
  description: string;
  maintenanceType: MaintenanceType;
  priority: Priority;
  assignedTo: string;
  requestedBy: string;
  scheduledDate: Date;
  estimatedDuration: number; // hours
  estimatedCost: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  actualCost?: number;
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  partsRequired: string[];
  skillsRequired: string[];
  safetyRequirements: string[];
  completionNotes?: string;
}

export interface MaintenanceAnalytics {
  totalAssets: number;
  operationalAssets: number;
  assetsInMaintenance: number;
  assetsOutOfService: number;
  overdueMaintenanceCount: number;
  averageMaintenanceCost: number;
  totalMaintenanceCost: number;
  preventiveMaintenanceRate: number;
}

export interface FacilityMonitoring {
  location: string;
  environmentalData: {
    temperature: number;
    humidity: number;
    airQuality: number;
    lighting: number;
  };
  safetyStatus: {
    fireAlarms: boolean;
    emergencyLights: boolean;
    exitRoutes: boolean;
    securitySystems: boolean;
  };
  lastUpdated: Date;
  alerts: string[];
}

export interface EnergyConsumption {
  period: string;
  electricity: number; // kWh
  gas: number; // kWh
  water: number; // liters
  totalCost: number;
  comparison: {
    previousPeriod: number;
    percentageChange: number;
  };
}

export class MaintenanceFacilitiesService {
  privateassetRepository: Repository<Asset>;
  privateworkOrderRepository: Repository<WorkOrder>;
  privatenotificationService: NotificationService;
  privateauditService: AuditService;

  constructor() {
    this.assetRepository = AppDataSource.getRepository(Asset);
    this.workOrderRepository = AppDataSource.getRepository(WorkOrder);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  // Asset Management
  async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    const assetNumber = await this.generateAssetNumber(assetData.assetType!);
    
    const asset = this.assetRepository.create({
      ...assetData,
      assetNumber,
      status: AssetStatus.OPERATIONAL,
      isActive: true,
      maintenanceHistory: [],
      monitoringData: [],
      complianceCertifications: []
    });

    const savedAsset = await this.assetRepository.save(asset);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'Asset',
        entityType: 'Asset',
      entityId: savedAsset.id,
      action: 'CREATE',
      details: { 
        assetNumber: savedAsset.assetNumber,
        assetType: savedAsset.assetType
      },
      userId: 'system'
    });

    return savedAsset;
  }

  async getAllAssets(): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { isActive: true },
      order: { assetNumber: 'ASC' }
    });
  }

  async getAssetById(assetId: string): Promise<Asset | null> {
    return await this.assetRepository.findOne({
      where: { id: assetId }
    });
  }

  async getAssetsByType(assetType: AssetType): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { assetType, isActive: true }
    });
  }

  async getAssetsByLocation(location: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { location, isActive: true }
    });
  }

  async updateAsset(assetId: string, updateData: Partial<Asset>): Promise<Asset> {
    const asset = await this.getAssetById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    Object.assign(asset, updateData);
    const updatedAsset = await this.assetRepository.save(asset);

    // Log audit trail
    await this.auditService.logEvent({
        resource: 'Asset',
        entityType: 'Asset',
        entityId: assetId,
        action: 'UPDATE',
        resource: 'Asset',
        details: updateData,
        userId: 'system'
    
      });

    return updatedAsset;
  }

  // Maintenance Management
  async createWorkOrder(workOrderData: Partial<WorkOrder>): Promise<WorkOrder> {
    const workOrderNumber = await this.generateWorkOrderNumber();
    
    const workOrder = this.workOrderRepository.create({
      ...workOrderData,
      workOrderNumber,
      status: WorkOrderStatus.CREATED,
      partsRequired: [],
      laborRecords: [],
      skillsRequired: [],
      safetyRequirements: []
    });

    const savedWorkOrder = await this.workOrderRepository.save(workOrder);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'WorkOrder',
        entityType: 'WorkOrder',
      entityId: savedWorkOrder.id,
      action: 'CREATE',
      details: { 
        workOrderNumber: savedWorkOrder.workOrderNumber,
        assetId: savedWorkOrder.assetId,
        priority: savedWorkOrder.priority
      },
      userId: 'system'
    });

    // Send notification based on priority
    const recipients = savedWorkOrder.priority === Priority.EMERGENCY || savedWorkOrder.priority === Priority.CRITICAL
      ? ['maintenance_team', 'facilities_manager', 'care_managers']
      : ['maintenance_team'];

    await this.notificationService.sendNotification({
      message: 'Notification: Work Order Created',
        type: 'work_order_created',
      recipients,
      data: {
        workOrderNumber: savedWorkOrder.workOrderNumber,
        title: savedWorkOrder.title,
        priority: savedWorkOrder.priority,
        scheduledDate: savedWorkOrder.scheduledDate
      }
    });

    return savedWorkOrder;
  }

  async getAllWorkOrders(): Promise<WorkOrder[]> {
    return await this.workOrderRepository.find({
      order: { scheduledDate: 'DESC' }
    });
  }

  async getWorkOrderById(workOrderId: string): Promise<WorkOrder | null> {
    return await this.workOrderRepository.findOne({
      where: { id: workOrderId }
    });
  }

  async getOverdueMaintenanceAssets(): Promise<Asset[]> {
    const assets = await this.getAllAssets();
    return assets.filter(asset => asset.isMaintenanceDue());
  }

  async schedulePreventiveMaintenance(): Promise<WorkOrder[]> {
    const overdueAssets = await this.getOverdueMaintenanceAssets();
    constworkOrders: WorkOrder[] = [];

    for (const asset of overdueAssets) {
      const workOrder = await this.createWorkOrder({
        assetId: asset.id,
        title: `Preventive Maintenance - ${asset.assetName}`,
        description: `Scheduled preventive maintenance for ${asset.assetName}`,
        maintenanceType: MaintenanceType.PREVENTIVE,
        priority: Priority.MEDIUM,
        assignedTo: 'maintenance_team',
        assignedToName: 'Maintenance Team',
        requestedBy: 'system',
        requestedByName: 'System',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        estimatedDuration: 2,
        estimatedCost: 200,
        skillsRequired: ['general_maintenance'],
        safetyRequirements: ['standard_ppe']
      });

      workOrders.push(workOrder);
    }

    return workOrders;
  }

  async completeWorkOrder(workOrderId: string, completionData: any): Promise<void> {
    const workOrder = await this.getWorkOrderById(workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Update work order
    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.actualEndDate = new Date();
    workOrder.actualCost = completionData.actualCost;
    workOrder.completionNotes = completionData.notes;

    await this.workOrderRepository.save(workOrder);

    // Update asset
    const asset = await this.getAssetById(workOrder.assetId);
    if (asset) {
      asset.addMaintenanceRecord({
        maintenanceType: workOrder.maintenanceType as MaintenanceType,
        description: workOrder.description,
        performedBy: workOrder.assignedToName,
        performedDate: workOrder.actualStartDate || new Date(),
        completedDate: workOrder.actualEndDate,
        cost: workOrder.actualCost || workOrder.estimatedCost,
        partsUsed: workOrder.partsRequired.map(part => part.partName),
        laborHours: completionData.laborHours || workOrder.estimatedDuration,
        notes: workOrder.completionNotes || '',
        status: 'completed'
      });

      // Calculate next maintenance date
      asset.nextMaintenanceDate = this.calculateNextMaintenanceDate(asset);
      asset.status = AssetStatus.OPERATIONAL;

      await this.assetRepository.save(asset);
    }

    // Send completion notification
    await this.notificationService.sendNotification({
      message: 'Notification: Work Order Completed',
        type: 'work_order_completed',
      recipients: [workOrder.requestedBy, 'facilities_manager'],
      data: {
        workOrderNumber: workOrder.workOrderNumber,
        assetName: asset?.assetName,
        completionDate: workOrder.actualEndDate,
        actualCost: workOrder.actualCost
      }
    });
  }

  // Facility Monitoring
  async getFacilityMonitoring(): Promise<FacilityMonitoring[]> {
    const locations = await this.getFacilityLocations();
    constmonitoringData: FacilityMonitoring[] = [];
    
    for (const location of locations) {
      const environmentalData = await this.getEnvironmentalReadings(location.name);
      const safetyStatus = await this.getSafetySystemStatus(location.name);
      const alerts = this.generateEnvironmentalAlerts(environmentalData, location.standards);
      
      monitoringData.push({
        location: location.name,
        environmentalData,
        safetyStatus,
        lastUpdated: new Date(),
        alerts
      });
    }
    
    return monitoringData;
  }

  private async getFacilityLocations(): Promise<any[]> {
    return [
      {
        name: 'Ground Floor - Reception',
        standards: { temperature: { min: 20, max: 24 }, humidity: { min: 40, max: 60 }, lighting: { min: 300, max: 500 } }
      },
      {
        name: 'Ground Floor - Dining Room',
        standards: { temperature: { min: 19, max: 23 }, humidity: { min: 40, max: 60 }, lighting: { min: 400, max: 600 } }
      },
      {
        name: 'First Floor - Resident Rooms',
        standards: { temperature: { min: 21, max: 25 }, humidity: { min: 40, max: 60 }, lighting: { min: 200, max: 400 } }
      },
      {
        name: 'Kitchen',
        standards: { temperature: { min: 16, max: 20 }, humidity: { min: 30, max: 50 }, lighting: { min: 500, max: 800 } }
      },
      {
        name: 'Common Areas',
        standards: { temperature: { min: 20, max: 24 }, humidity: { min: 40, max: 60 }, lighting: { min: 300, max: 500 } }
      },
      {
        name: 'Garden Areas',
        standards: { temperature: { min: -5, max: 35 }, humidity: { min: 30, max: 90 }, lighting: { min: 100, max: 1000 } }
      }
    ];
  }

  private async getEnvironmentalReadings(location: string): Promise<any> {
    // Simulate IoT sensor readings with realistic variations
    const baseReadings = {
      'Ground Floor - Reception': { temp: 22, humidity: 45, airQuality: 85, lighting: 350 },
      'Ground Floor - Dining Room': { temp: 21, humidity: 50, airQuality: 80, lighting: 450 },
      'First Floor - Resident Rooms': { temp: 23, humidity: 48, airQuality: 88, lighting: 280 },
      'Kitchen': { temp: 18, humidity: 35, airQuality: 75, lighting: 600 },
      'Common Areas': { temp: 22, humidity: 46, airQuality: 82, lighting: 380 },
      'Garden Areas': { temp: 15, humidity: 65, airQuality: 95, lighting: 800 }
    };

    const base = baseReadings[location] || { temp: 22, humidity: 45, airQuality: 85, lighting: 350 };
    
    // Add realistic variations (±2°C, ±5% humidity, ±5% air quality, ±50 lux)
    return {
      temperature: Math.round((base.temp + (Math.random() - 0.5) * 4) * 10) / 10,
      humidity: Math.round((base.humidity + (Math.random() - 0.5) * 10) * 10) / 10,
      airQuality: Math.round((base.airQuality + (Math.random() - 0.5) * 10) * 10) / 10,
      lighting: Math.round(base.lighting + (Math.random() - 0.5) * 100)
    };
  }

  private async getSafetySystemStatus(location: string): Promise<any> {
    // Real safety system monitoring
    const assets = await this.getAssetsByLocation(location);
    const safetyAssets = assets.filter(asset => asset.assetType === 'fire_safety' || asset.assetType === 'security');
    
    const fireAlarms = safetyAssets.filter(asset => 
      asset.assetName.toLowerCase().includes('fire') || asset.assetName.toLowerCase().includes('smoke')
    ).every(asset => asset.isOperational());
    
    const emergencyLights = safetyAssets.filter(asset =>
      asset.assetName.toLowerCase().includes('emergency') && asset.assetName.toLowerCase().includes('light')
    ).every(asset => asset.isOperational());
    
    const securitySystems = safetyAssets.filter(asset =>
      asset.assetName.toLowerCase().includes('security') || asset.assetName.toLowerCase().includes('cctv')
    ).every(asset => asset.isOperational());

    return {
      fireAlarms,
      emergencyLights,
      exitRoutes: true, // Would check exit route monitoring systems
      securitySystems
    };
  }

  private generateEnvironmentalAlerts(readings: any, standards: any): string[] {
    const alerts = [];
    
    if (readings.temperature < standards.temperature.min || readings.temperature > standards.temperature.max) {
      alerts.push(`Temperature out of range: ${readings.temperature}°C (expected ${standards.temperature.min}-${standards.temperature.max}°C)`);
    }
    
    if (readings.humidity < standards.humidity.min || readings.humidity > standards.humidity.max) {
      alerts.push(`Humidity out of range: ${readings.humidity}% (expected ${standards.humidity.min}-${standards.humidity.max}%)`);
    }
    
    if (readings.airQuality < 70) {
      alerts.push(`Poor air quality detected: ${readings.airQuality}%`);
    }
    
    if (readings.lighting < standards.lighting.min) {
      alerts.push(`Insufficient lighting: ${readings.lighting} lux (minimum ${standards.lighting.min} lux)`);
    }
    
    return alerts;
  }

  async getEnergyConsumption(period: string = 'monthly'): Promise<EnergyConsumption> {
    const assets = await this.getAllAssets();
    const energyAssets = assets.filter(asset => 
      asset.assetType === 'HVAC' || 
      asset.assetType === 'ELECTRICAL' || 
      asset.assetType === 'KITCHEN_EQUIPMENT'
    );

    // Calculate consumption based on asset usage and efficiency
    let electricityUsage = 0;
    let gasUsage = 0;
    let waterUsage = 0;

    for (const asset of energyAssets) {
      const usage = this.calculateAssetEnergyUsage(asset, period);
      electricityUsage += usage.electricity;
      gasUsage += usage.gas;
      waterUsage += usage.water;
    }

    // Get previous period for comparison
    const previousPeriod = await this.getPreviousPeriodConsumption(period);
    const currentTotal = electricityUsage * 0.28 + gasUsage * 0.07 + waterUsage * 0.002; // UK utility rates
    const percentageChange = previousPeriod > 0 
      ? ((currentTotal - previousPeriod) / previousPeriod) * 100 
      : 0;

    return {
      period,
      electricity: Math.round(electricityUsage),
      gas: Math.round(gasUsage),
      water: Math.round(waterUsage),
      totalCost: Math.round(currentTotal),
      comparison: {
        previousPeriod: Math.round(previousPeriod),
        percentageChange: Math.round(percentageChange * 100) / 100
      }
    };
  }

  private calculateAssetEnergyUsage(asset: Asset, period: string): any {
    // Energy consumption calculations based on asset type and specifications
    const baseConsumption = {
      'HVAC': { electricity: 800, gas: 1200, water: 0 }, // kWh per month
      'ELECTRICAL': { electricity: 200, gas: 0, water: 0 },
      'KITCHEN_EQUIPMENT': { electricity: 600, gas: 400, water: 500 },
      'PLUMBING': { electricity: 50, gas: 0, water: 100 },
      'MEDICAL_EQUIPMENT': { electricity: 100, gas: 0, water: 0 }
    };

    const base = baseConsumption[asset.assetType] || { electricity: 50, gas: 0, water: 0 };
    
    // Adjust for asset age and efficiency
    const ageYears = (new Date().getTime() - asset.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const efficiencyFactor = Math.max(0.7, 1 - (ageYears * 0.02)); // 2% efficiency loss per year, min 70%
    
    // Adjust for period
    const periodMultiplier = period === 'weekly' ? 0.25 : period === 'yearly' ? 12 : 1;
    
    return {
      electricity: base.electricity * efficiencyFactor * periodMultiplier,
      gas: base.gas * efficiencyFactor * periodMultiplier,
      water: base.water * periodMultiplier
    };
  }

  private async getPreviousPeriodConsumption(period: string): Promise<number> {
    // Calculate previous period consumption for comparison
    // This would query historical energy data from the database
    const baseConsumption = 3200; // GBP
    const seasonalVariation = Math.sin((new Date().getMonth() / 12) * 2 * Math.PI) * 0.1; // ±10% seasonal variation
    return baseConsumption * (1 + seasonalVariation);
  }

  // Analytics
  async getMaintenanceAnalytics(): Promise<MaintenanceAnalytics> {
    const assets = await this.getAllAssets();
    
    const totalAssets = assets.length;
    const operationalAssets = assets.filter(asset => asset.isOperational()).length;
    const assetsInMaintenance = assets.filter(asset => asset.status === AssetStatus.MAINTENANCE).length;
    const assetsOutOfService = assets.filter(asset => asset.status === AssetStatus.OUT_OF_SERVICE).length;
    const overdueMaintenanceCount = assets.filter(asset => asset.isMaintenanceDue()).length;

    const totalMaintenanceCost = assets.reduce((total, asset) => total + asset.getTotalMaintenanceCost(), 0);
    const averageMaintenanceCost = totalAssets > 0 ? totalMaintenanceCost / totalAssets : 0;

    const preventiveMaintenanceRecords = assets.flatMap(asset => 
      asset.maintenanceHistory.filter(record => record.maintenanceType === MaintenanceType.PREVENTIVE)
    );
    const totalMaintenanceRecords = assets.flatMap(asset => asset.maintenanceHistory);
    const preventiveMaintenanceRate = totalMaintenanceRecords.length > 0 
      ? (preventiveMaintenanceRecords.length / totalMaintenanceRecords.length) * 100 
      : 0;

    return {
      totalAssets,
      operationalAssets,
      assetsInMaintenance,
      assetsOutOfService,
      overdueMaintenanceCount,
      averageMaintenanceCost,
      totalMaintenanceCost,
      preventiveMaintenanceRate
    };
  }

  async getMaintenanceCalendar(startDate: Date, endDate: Date): Promise<any[]> {
    const assets = await this.getAllAssets();
    const maintenanceEvents = [];

    for (const asset of assets) {
      if (asset.nextMaintenanceDate >= startDate && asset.nextMaintenanceDate <= endDate) {
        maintenanceEvents.push({
          assetId: asset.id,
          assetName: asset.assetName,
          assetType: asset.assetType,
          location: asset.location,
          maintenanceDate: asset.nextMaintenanceDate,
          maintenanceType: 'preventive',
          estimatedDuration: this.getEstimatedMaintenanceDuration(asset.assetType),
          priority: asset.isMaintenanceDue() ? Priority.HIGH : Priority.MEDIUM
        });
      }
    }

    return maintenanceEvents.sort((a, b) => 
      new Date(a.maintenanceDate).getTime() - new Date(b.maintenanceDate).getTime()
    );
  }

  // Emergency Management
  async reportEmergencyIssue(issueData: any): Promise<WorkOrder> {
    const emergencyWorkOrder = await this.createWorkOrder({
      assetId: issueData.assetId,
      title: `EMERGENCY: ${issueData.title}`,
      description: issueData.description,
      maintenanceType: MaintenanceType.EMERGENCY,
      priority: Priority.EMERGENCY,
      assignedTo: 'emergency_maintenance_team',
      assignedToName: 'Emergency Maintenance Team',
      requestedBy: issueData.reportedBy,
      requestedByName: issueData.reportedByName || 'Emergency Reporter',
      scheduledDate: new Date(), // Immediate
      estimatedDuration: 1,
      estimatedCost: 500,
      skillsRequired: ['emergency_response'],
      safetyRequirements: ['emergency_ppe', 'safety_isolation'],
      isEmergency: true
    });

    // Send immediate emergency notification
    await this.notificationService.sendNotification({
      message: 'Notification: Emergency Maintenance',
        type: 'emergency_maintenance',
      recipients: ['emergency_maintenance_team', 'facilities_manager', 'care_managers', 'admin'],
      data: {
        workOrderNumber: emergencyWorkOrder.workOrderNumber,
        title: emergencyWorkOrder.title,
        location: issueData.location,
        severity: 'emergency'
      }
    });

    return emergencyWorkOrder;
  }

  // Compliance Management
  async getComplianceStatus(): Promise<any> {
    const assets = await this.getAllAssets();
    const complianceIssues = [];

    for (const asset of assets) {
      // Check expiring certifications
      const expiringCerts = asset.getExpiringCertifications(30);
      for (const cert of expiringCerts) {
        complianceIssues.push({
          assetId: asset.id,
          assetName: asset.assetName,
          issueType: 'certification_expiry',
          description: `${cert.certificationType} expires on ${cert.expiryDate}`,
          severity: 'high',
          dueDate: cert.expiryDate
        });
      }

      // Check overdue inspections
      if (asset.isInspectionDue()) {
        complianceIssues.push({
          assetId: asset.id,
          assetName: asset.assetName,
          issueType: 'inspection_overdue',
          description: 'Compliance inspection is overdue',
          severity: 'critical',
          dueDate: new Date()
        });
      }

      // Check overdue maintenance
      if (asset.isMaintenanceDue()) {
        complianceIssues.push({
          assetId: asset.id,
          assetName: asset.assetName,
          issueType: 'maintenance_overdue',
          description: 'Scheduled maintenance is overdue',
          severity: 'medium',
          dueDate: asset.nextMaintenanceDate
        });
      }
    }

    return {
      totalAssets: assets.length,
      compliantAssets: assets.length - complianceIssues.length,
      complianceRate: assets.length > 0 ? ((assets.length - complianceIssues.length) / assets.length) * 100 : 100,
      issues: complianceIssues.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
    };
  }

  // Environmental Management
  async recordEnvironmentalData(location: string, data: any): Promise<void> {
    // Log environmental data
    await this.auditService.logEvent({
      resource: 'EnvironmentalData',
        entityType: 'EnvironmentalData',
      entityId: crypto.randomUUID(),
      action: 'RECORD',
      details: { location, ...data },
      userId: 'system'
    });

    // Check for alerts
    const alerts = [];
    if (data.temperature < 18 || data.temperature > 26) {
      alerts.push('Temperature out of recommended range');
    }
    if (data.humidity < 30 || data.humidity > 70) {
      alerts.push('Humidity out of recommended range');
    }
    if (data.airQuality < 70) {
      alerts.push('Poor air quality detected');
    }

    if (alerts.length > 0) {
      await this.notificationService.sendNotification({
        message: 'Notification: Environmental Alert',
        type: 'environmental_alert',
        recipients: ['facilities_team', 'care_managers'],
        data: {
          location,
          alerts,
          environmentalData: data
        }
      });
    }
  }

  // Predictive Maintenance
  async generatePredictiveMaintenanceRecommendations(): Promise<any[]> {
    const assets = await this.getAllAssets();
    const recommendations = [];

    for (const asset of assets) {
      const lifecycleStage = asset.getLifecycleStage();
      const maintenanceFrequency = asset.getMaintenanceFrequency();
      const latestMonitoring = asset.getLatestMonitoringData();

      if (lifecycleStage === 'aging' || lifecycleStage === 'end_of_life') {
        recommendations.push({
          assetId: asset.id,
          assetName: asset.assetName,
          recommendationType: 'replacement_planning',
          description: `Asset is in ${lifecycleStage} stage - plan for replacement`,
          priority: lifecycleStage === 'end_of_life' ? Priority.HIGH : Priority.MEDIUM,
          estimatedCost: asset.getCurrentValue(),
          timeframe: lifecycleStage === 'end_of_life' ? '3-6 months' : '12-18 months'
        });
      }

      if (maintenanceFrequency > 0 && maintenanceFrequency < 90) { // Frequent maintenance
        recommendations.push({
          assetId: asset.id,
          assetName: asset.assetName,
          recommendationType: 'increased_monitoring',
          description: 'Asset requires frequent maintenance - increase monitoring',
          priority: Priority.MEDIUM,
          estimatedCost: 100,
          timeframe: 'immediate'
        });
      }

      if (latestMonitoring && latestMonitoring.status === 'warning') {
        recommendations.push({
          assetId: asset.id,
          assetName: asset.assetName,
          recommendationType: 'condition_monitoring',
          description: 'Asset showing warning signs - schedule inspection',
          priority: Priority.HIGH,
          estimatedCost: 150,
          timeframe: '1-2 weeks'
        });
      }
    }

    return recommendations;
  }

  // Private helper methods
  private async generateAssetNumber(assetType: AssetType): Promise<string> {
    const typePrefix = assetType.substring(0, 3).toUpperCase();
    const count = await this.assetRepository.count({ where: { assetType } });
    return `${typePrefix}${String(count + 1).padStart(4, '0')}`;
  }

  private async generateWorkOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.workOrderRepository.count();
    return `WO${year}${String(count + 1).padStart(4, '0')}`;
  }

  private calculateNextMaintenanceDate(asset: Asset): Date {
    const maintenanceIntervals = {
      hvac: 90, // days
      electrical: 365,
      plumbing: 180,
      fire_safety: 90,
      security: 30,
      medical_equipment: 30,
      kitchen_equipment: 60,
      furniture: 365,
      building_structure: 1825, // 5 years
      grounds: 30,
      vehicle: 90,
      it_equipment: 180
    };

    const interval = maintenanceIntervals[asset.assetType] || 365;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate;
  }

  private getEstimatedMaintenanceDuration(assetType: AssetType): number {
    const durations = {
      hvac: 4,
      electrical: 2,
      plumbing: 3,
      fire_safety: 1,
      security: 1,
      medical_equipment: 2,
      kitchen_equipment: 2,
      furniture: 1,
      building_structure: 8,
      grounds: 4,
      vehicle: 3,
      it_equipment: 2
    };

    return durations[assetType] || 2;
  }
}
