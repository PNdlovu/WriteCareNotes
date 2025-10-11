import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum AssetType {
  HVAC_SYSTEM = 'hvac_system',
  ELECTRICAL_SYSTEM = 'electrical_system',
  PLUMBING_SYSTEM = 'plumbing_system',
  FIRE_SAFETY_SYSTEM = 'fire_safety_system',
  SECURITY_SYSTEM = 'security_system',
  MEDICAL_EQUIPMENT = 'medical_equipment',
  FURNITURE = 'furniture',
  BUILDING_STRUCTURE = 'building_structure',
  GROUNDS_EQUIPMENT = 'grounds_equipment',
  KITCHEN_EQUIPMENT = 'kitchen_equipment'
}

export enum AssetCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
  OUT_OF_SERVICE = 'out_of_service'
}

export interface PredictiveMaintenanceData {
  sensorData: Array<{
    sensorId: string;
    sensorType: string;
    readings: Array<{
      timestamp: Date;
      value: number;
      unit: string;
      status: 'normal' | 'warning' | 'critical';
    }>;
    lastCalibration: Date;
    nextCalibration: Date;
  }>;
  performanceMetrics: {
    efficiency: number; // 0-100
    reliability: number; // 0-100
    availability: number; // 0-100
    energyConsumption: number; // kWh
    operatingCosts: number; // GBP per month
  };
  predictiveAnalysis: {
    failureProbability: number; // 0-100
    remainingUsefulLife: number; // days
    maintenanceRecommendations: string[];
    riskFactors: string[];
    costOfFailure: number; // GBP
  };
}

@Entity('facility_assets')
export class FacilityAsset extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assetId: string;

  @Column()
  assetName: string;

  @Column({
    type: 'enum',
    enum: AssetType
  })
  assetType: AssetType;

  @Column({
    type: 'enum',
    enum: AssetCondition,
    default: AssetCondition.GOOD
  })
  condition: AssetCondition;

  @Column('jsonb')
  predictiveMaintenanceData: PredictiveMaintenanceData;

  @Column('date')
  installationDate: Date;

  @Column('date', { nullable: true })
  warrantyExpiryDate?: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  purchaseValue: number;

  @Column('decimal', { precision: 10, scale: 2 })
  currentValue: number;

  @Column('text')
  location: string;

  @Column('text', { nullable: true })
  manufacturer?: string;

  @Column('text', { nullable: true })
  modelNumber?: string;

  @Column('text', { nullable: true })
  serialNumber?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  needsMaintenance(): boolean {
    return this.predictiveMaintenanceData.predictiveAnalysis.failureProbability > 70 ||
           this.condition === AssetCondition.POOR ||
           this.condition === AssetCondition.CRITICAL;
  }

  isOutOfService(): boolean {
    return this.condition === AssetCondition.OUT_OF_SERVICE;
  }

  calculateMaintenancePriority(): 'low' | 'medium' | 'high' | 'critical' {
    const failureProb = this.predictiveMaintenanceData.predictiveAnalysis.failureProbability;
    const costOfFailure = this.predictiveMaintenanceData.predictiveAnalysis.costOfFailure;
    
    if (failureProb > 80 || costOfFailure > 10000) return 'critical';
    if (failureProb > 60 || costOfFailure > 5000) return 'high';
    if (failureProb > 40 || costOfFailure > 1000) return 'medium';
    return 'low';
  }
}