import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum AssetType {
  HVAC = 'hvac',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  FIRE_SAFETY = 'fire_safety',
  SECURITY = 'security',
  MEDICAL_EQUIPMENT = 'medical_equipment',
  KITCHEN_EQUIPMENT = 'kitchen_equipment',
  FURNITURE = 'furniture',
  BUILDING_STRUCTURE = 'building_structure',
  GROUNDS = 'grounds',
  VEHICLE = 'vehicle',
  IT_EQUIPMENT = 'it_equipment'
}

export enum AssetStatus {
  OPERATIONAL = 'operational',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  RETIRED = 'retired',
  PENDING_INSPECTION = 'pending_inspection'
}

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  PREDICTIVE = 'predictive',
  EMERGENCY = 'emergency',
  INSPECTION = 'inspection'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export interface AssetSpecifications {
  manufacturer: string;
  model: string;
  serialNumber: string;
  yearManufactured: number;
  warrantyExpiryDate?: Date;
  technicalSpecs: { [key: string]: any };
  operatingParameters: { [key: string]: any };
}

export interface MaintenanceRecord {
  id: string;
  maintenanceType: MaintenanceType;
  description: string;
  performedBy: string;
  performedDate: Date;
  completedDate?: Date;
  cost: number;
  partsUsed: string[];
  laborHours: number;
  notes: string;
  nextMaintenanceDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface WarrantyInfo {
  warrantyProvider: string;
  warrantyType: 'manufacturer' | 'extended' | 'service_contract';
  startDate: Date;
  endDate: Date;
  coverageDetails: string[];
  claimHistory: WarrantyClaim[];
}

export interface WarrantyClaim {
  claimNumber: string;
  claimDate: Date;
  description: string;
  claimAmount: number;
  status: 'submitted' | 'approved' | 'rejected' | 'paid';
  resolution: string;
}

export interface MonitoringData {
  timestamp: Date;
  parameters: { [parameter: string]: number };
  alerts: string[];
  status: 'normal' | 'warning' | 'critical';
}

export interface ComplianceCertification {
  certificationType: string;
  certificationBody: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'valid' | 'expired' | 'suspended';
  inspectionRequired: boolean;
  nextInspectionDate?: Date;
}

@Entity('assets')
export class Asset extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assetNumber: string;

  @Column()
  assetName: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: AssetType
  })
  assetType: AssetType;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.OPERATIONAL
  })
  status: AssetStatus;

  @Column()
  location: string;

  @Column()
  department: string;

  @Column('jsonb')
  specifications: AssetSpecifications;

  @Column('decimal', { precision: 10, scale: 2 })
  purchasePrice: number;

  @Column('date')
  purchaseDate: Date;

  @Column('date')
  installationDate: Date;

  @Column('date', { nullable: true })
  retirementDate?: Date;

  @Column('decimal', { precision: 5, scale: 2 })
  depreciationRate: number; // percentage per year

  @Column('jsonb')
  maintenanceHistory: MaintenanceRecord[];

  @Column('date')
  lastMaintenanceDate: Date;

  @Column('date')
  nextMaintenanceDate: Date;

  @Column('jsonb', { nullable: true })
  warrantyInfo?: WarrantyInfo;

  @Column('jsonb')
  monitoringData: MonitoringData[];

  @Column('jsonb')
  complianceCertifications: ComplianceCertification[];

  @Column()
  responsiblePerson: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isOperational(): boolean {
    return this.status === AssetStatus.OPERATIONAL;
  }

  isMaintenanceDue(): boolean {
    return new Date() >= this.nextMaintenanceDate;
  }

  isWarrantyValid(): boolean {
    if (!this.warrantyInfo) return false;
    return new Date() <= this.warrantyInfo.endDate;
  }

  getCurrentValue(): number {
    const yearsOwned = (new Date().getTime() - this.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const depreciationAmount = this.purchasePrice * (this.depreciationRate / 100) * yearsOwned;
    return Math.max(0, this.purchasePrice - depreciationAmount);
  }

  getTotalMaintenanceCost(): number {
    return this.maintenanceHistory.reduce((total, record) => total + record.cost, 0);
  }

  getMaintenanceFrequency(): number {
    if (this.maintenanceHistory.length < 2) return 0;
    
    const sortedHistory = this.maintenanceHistory
      .sort((a, b) => new Date(a.performedDate).getTime() - new Date(b.performedDate).getTime());
    
    const totalDays = (new Date().getTime() - new Date(sortedHistory[0].performedDate).getTime()) / (1000 * 60 * 60 * 24);
    return totalDays / this.maintenanceHistory.length;
  }

  getLatestMonitoringData(): MonitoringData | null {
    if (this.monitoringData.length === 0) return null;
    return this.monitoringData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  hasActiveAlerts(): boolean {
    const latestData = this.getLatestMonitoringData();
    return latestData ? latestData.alerts.length > 0 : false;
  }

  getExpiringCertifications(withinDays: number = 30): ComplianceCertification[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.complianceCertifications.filter(cert => 
      cert.status === 'valid' && 
      new Date(cert.expiryDate) <= futureDate
    );
  }

  isInspectionDue(): boolean {
    return this.complianceCertifications.some(cert => 
      cert.inspectionRequired && 
      cert.nextInspectionDate && 
      new Date() >= new Date(cert.nextInspectionDate)
    );
  }

  getLifecycleStage(): 'new' | 'mature' | 'aging' | 'end_of_life' {
    const yearsOwned = (new Date().getTime() - this.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const expectedLifespan = this.getExpectedLifespan();
    const lifecyclePercentage = (yearsOwned / expectedLifespan) * 100;
    
    if (lifecyclePercentage < 25) return 'new';
    if (lifecyclePercentage < 75) return 'mature';
    if (lifecyclePercentage < 90) return 'aging';
    return 'end_of_life';
  }

  private getExpectedLifespan(): number {
    // Expected lifespan by asset type (years)
    const lifespans = {
      hvac: 15,
      electrical: 20,
      plumbing: 25,
      fire_safety: 10,
      security: 7,
      medical_equipment: 10,
      kitchen_equipment: 12,
      furniture: 15,
      building_structure: 50,
      grounds: 30,
      vehicle: 8,
      it_equipment: 5
    };
    
    return lifespans[this.assetType] || 10;
  }

  addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): void {
    const maintenanceRecord = {
      ...record,
      id: crypto.randomUUID()
    };
    
    this.maintenanceHistory.push(maintenanceRecord);
    this.lastMaintenanceDate = record.performedDate;
  }

  addMonitoringData(data: MonitoringData): void {
    this.monitoringData.push(data);
    
    // Keep only last 1000 monitoring records to prevent excessive storage
    if (this.monitoringData.length > 1000) {
      this.monitoringData = this.monitoringData
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 1000);
    }
  }

  needsReplacement(): boolean {
    const lifecycleStage = this.getLifecycleStage();
    const maintenanceCostRatio = this.getTotalMaintenanceCost() / this.purchasePrice;
    
    return lifecycleStage === 'end_of_life' || 
           maintenanceCostRatio > 0.6 || // Maintenance cost exceeds 60% of purchase price
           this.status === AssetStatus.OUT_OF_SERVICE;
  }
}