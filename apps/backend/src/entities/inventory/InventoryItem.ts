import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum ItemCategory {
  MEDICAL_SUPPLIES = 'medical_supplies',
  PHARMACEUTICALS = 'pharmaceuticals',
  FOOD_CATERING = 'food_catering',
  CLEANING_SUPPLIES = 'cleaning_supplies',
  OFFICE_SUPPLIES = 'office_supplies',
  MAINTENANCE_PARTS = 'maintenance_parts',
  EQUIPMENT = 'equipment',
  PPE = 'ppe',
  CONSUMABLES = 'consumables',
  CAPITAL_ASSETS = 'capital_assets'
}

export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  REORDER_REQUIRED = 'reorder_required',
  EXCESS_STOCK = 'excess_stock',
  QUARANTINED = 'quarantined',
  EXPIRED = 'expired',
  RECALLED = 'recalled'
}

export enum TrackingMethod {
  MANUAL = 'manual',
  BARCODE = 'barcode',
  RFID = 'rfid',
  QR_CODE = 'qr_code',
  NFC = 'nfc',
  IOT_SENSOR = 'iot_sensor'
}

export interface ItemSpecification {
  specType: string;
  specValue: string;
  unit?: string;
  tolerance?: string;
  critical: boolean;
}

export interface LocationStock {
  locationId: string;
  locationName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumLevel: number;
  maximumLevel: number;
  reorderPoint: number;
  lastCountDate: Date;
  countAccuracy: number; // percentage
}

export interface ConsumptionPattern {
  dailyAverageUsage: number;
  weeklyPattern: { [day: string]: number };
  monthlyTrend: number; // percentage change
  seasonalFactors: { [month: string]: number };
  peakUsagePeriods: string[];
  consumptionVariability: number; // coefficient of var iation
}

export interface QualityControl {
  incomingInspectionRequired: boolean;
  qualityStandards: string[];
  testingRequirements: string[];
  certificationRequired: boolean;
  batchTestingFrequency: number;
  qualityIssueHistory: Array<{
    issueDate: Date;
    issueType: string;
    description: string;
    batchNumber?: string;
    actionTaken: string;
    resolved: boolean;
  }>;
}

export interface RFIDTracking {
  rfidEnabled: boolean;
  rfidTagId?: string;
  rfidFrequency: '125kHz' | '13.56MHz' | '860-960MHz';
  readRange: number; // meters
  lastRfidRead?: Date;
  readCount: number;
  batteryLevel?: number; // for active tags
  locationAccuracy: number; // meters
  realTimeTracking: boolean;
}

export interface BarcodeTracking {
  barcodeType: 'UPC' | 'EAN' | 'Code128' | 'QR' | 'DataMatrix';
  barcodeValue: string;
  printQuality: 'A' | 'B' | 'C' | 'D' | 'F';
  lastScanDate?: Date;
  scanCount: number;
  mobileAppCompatible: boolean;
  batchBarcodeEnabled: boolean;
}

export interface AIOptimization {
  demandForecastAccuracy: number; // percentage
  reorderOptimization: {
    currentReorderPoint: number;
    optimizedReorderPoint: number;
    potentialSavings: number;
    riskLevel: string;
  };
  supplierOptimization: {
    currentSupplier: string;
    alternativeSuppliers: Array<{
      supplierId: string;
      costSaving: number;
      qualityImpact: string;
      deliveryImpact: string;
    }>;
  };
  wastageReduction: {
    currentWastage: number;
    predictedWastage: number;
    reductionOpportunities: string[];
    potentialSavings: number;
  };
}

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  itemCode: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ItemCategory
  })
  category: ItemCategory;

  @Column()
  subcategory: string;

  @Column()
  manufacturer: string;

  @Column({ nullable: true })
  model?: string;

  @Column('jsonb')
  specifications: ItemSpecification[];

  @Column()
  unit: string;

  @Column('int')
  currentStock: number;

  @Column('int')
  minimumLevel: number;

  @Column('int')
  maximumLevel: number;

  @Column('int')
  reorderPoint: number;

  @Column('int')
  reorderQuantity: number;

  @Column({
    type: 'enum',
    enum: StockStatus,
    default: StockStatus.IN_STOCK
  })
  stockStatus: StockStatus;

  @Column({
    type: 'enum',
    enum: TrackingMethod,
    default: TrackingMethod.BARCODE
  })
  trackingMethod: TrackingMethod;

  @Column('jsonb')
  locationStock: LocationStock[];

  @Column('decimal', { precision: 10, scale: 2 })
  unitCost: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalValue: number;

  @Column('jsonb')
  consumptionPattern: ConsumptionPattern;

  @Column('jsonb')
  qualityControl: QualityControl;

  @Column('jsonb')
  rfidTracking: RFIDTracking;

  @Column('jsonb')
  barcodeTracking: BarcodeTracking;

  @Column('jsonb')
  aiOptimization: AIOptimization;

  @Column('date', { nullable: true })
  expiryDate?: Date;

  @Column({ nullable: true })
  batchNumber?: string;

  @Column({ nullable: true })
  serialNumber?: string;

  @Column()
  supplierId: string;

  @Column('int')
  leadTimeDays: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('timestamp', { nullable: true })
  lastStockTakeDate?: Date;

  @Column('timestamp', { nullable: true })
  lastOrderDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isInStock(): boolean {
    return this.currentStock > 0 && this.stockStatus === StockStatus.IN_STOCK;
  }

  isLowStock(): boolean {
    return this.currentStock <= this.minimumLevel;
  }

  isReorderRequired(): boolean {
    return this.currentStock <= this.reorderPoint;
  }

  isExpired(): boolean {
    return this.expiryDate ? new Date() > this.expiryDate : false;
  }

  isExpiringSoon(days: number = 30): boolean {
    if (!this.expiryDate) return false;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return this.expiryDate <= futureDate;
  }

  getDaysUntilExpiry(): number {
    if (!this.expiryDate) return Infinity;
    const diffTime = this.expiryDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysOfStockRemaining(): number {
    if (this.consumptionPattern.dailyAverageUsage === 0) return Infinity;
    return Math.floor(this.currentStock / this.consumptionPattern.dailyAverageUsage);
  }

  adjustStock(quantity: number, reason: string, userId: string): void {
    const previousStock = this.currentStock;
    this.currentStock = Math.max(0, this.currentStock + quantity);
    
    // Update total value
    this.totalValue = this.currentStock * this.unitCost;
    
    // Update stock status
    this.updateStockStatus();
    
    // Log stock adjustment (would create StockTransaction entity)
    this.logStockAdjustment(previousStock, this.currentStock, reason, userId);
  }

  updateConsumptionPattern(newUsage: number): void {
    const currentAverage = this.consumptionPattern.dailyAverageUsage;
    
    // Update using exponential smoothing
    const alpha = 0.2; // Smoothing factor
    this.consumptionPattern.dailyAverageUsage = (alpha * newUsage) + ((1 - alpha) * currentAverage);
    
    // Update reorder point based on new consumption pattern
    this.optimizeReorderPoint();
  }

  optimizeReorderPoint(): void {
    const safetyStock = this.calculateSafetyStock();
    const leadTimeDemand = this.consumptionPattern.dailyAverageUsage * this.leadTimeDays;
    
    this.reorderPoint = Math.ceil(leadTimeDemand + safetyStock);
    
    // Update AI optimization suggestions
    this.aiOptimization.reorderOptimization = {
      currentReorderPoint: this.reorderPoint,
      optimizedReorderPoint: this.reorderPoint,
      potentialSavings: this.calculateReorderSavings(),
      riskLevel: this.assessReorderRisk()
    };
  }

  calculateSafetyStock(): number {
    // Calculate safety stock based on demand variability and service level
    const serviceLevel = 0.95; // 95% service level
    const demandVariability = this.consumptionPattern.consumptionVariability;
    const leadTimeVariability = 0.2; // 20% lead time variability
    
    // Safety stockformula: Z * sqrt(LT * σ²demand + μdemand² * σ²LT)
    const zScore = 1.65; // For 95% service level
    const avgDemand = this.consumptionPattern.dailyAverageUsage;
    const demandStdDev = avgDemand * demandVariability;
    const leadTimeStdDev = this.leadTimeDays * leadTimeVariability;
    
    const safetyStock = zScore * Math.sqrt(
      (this.leadTimeDays * Math.pow(demandStdDev, 2)) + 
      (Math.pow(avgDemand, 2) * Math.pow(leadTimeStdDev, 2))
    );
    
    return Math.ceil(safetyStock);
  }

  getStockTurnoverRate(): number {
    const annualConsumption = this.consumptionPattern.dailyAverageUsage * 365;
    const averageStock = (this.minimumLevel + this.maximumLevel) / 2;
    
    return averageStock > 0 ? annualConsumption / averageStock : 0;
  }

  isSlowMoving(): boolean {
    return this.getStockTurnoverRate() < 2; // Less than 2 turns per year
  }

  isFastMoving(): boolean {
    return this.getStockTurnoverRate() > 12; // More than 12 turns per year
  }

  getLocationWithMostStock(): LocationStock | null {
    if (this.locationStock.length === 0) return null;
    
    return this.locationStock.reduce((max, location) => 
      location.quantity > max.quantity ? location : max
    );
  }

  getTotalStockAcrossLocations(): number {
    return this.locationStock.reduce((total, location) => total + location.quantity, 0);
  }

  hasRFIDTracking(): boolean {
    return this.rfidTracking.rfidEnabled && !!this.rfidTracking.rfidTagId;
  }

  hasBarcodeTracking(): boolean {
    return !!this.barcodeTracking.barcodeValue;
  }

  scanRFID(readerId: string, location: string): void {
    if (this.hasRFIDTracking()) {
      this.rfidTracking.lastRfidRead = new Date();
      this.rfidTracking.readCount++;
      
      // Update location if RFID provides location data
      this.updateLocationFromRFID(location);
    }
  }

  scanBarcode(scannerId: string, userId: string): void {
    if (this.hasBarcodeTracking()) {
      this.barcodeTracking.lastScanDate = new Date();
      this.barcodeTracking.scanCount++;
    }
  }

  private updateStockStatus(): void {
    if (this.currentStock === 0) {
      this.stockStatus = StockStatus.OUT_OF_STOCK;
    } else if (this.isLowStock()) {
      this.stockStatus = StockStatus.LOW_STOCK;
    } else if (this.currentStock > this.maximumLevel) {
      this.stockStatus = StockStatus.EXCESS_STOCK;
    } else if (this.isExpired()) {
      this.stockStatus = StockStatus.EXPIRED;
    } else {
      this.stockStatus = StockStatus.IN_STOCK;
    }
  }

  private calculateReorderSavings(): number {
    // Calculate potential savings from optimized reordering
    const currentOrderingCost = this.estimateOrderingCost(this.reorderQuantity);
    const optimizedQuantity = this.calculateOptimalOrderQuantity();
    const optimizedOrderingCost = this.estimateOrderingCost(optimizedQuantity);
    
    return Math.max(0, currentOrderingCost - optimizedOrderingCost);
  }

  private calculateOptimalOrderQuantity(): number {
    // Economic Order Quantity (EOQ) calculation
    const annualDemand = this.consumptionPattern.dailyAverageUsage * 365;
    const orderingCost = 50; // Cost per order
    const holdingCostRate = 0.2; // 20% of item value per year
    const holdingCost = this.unitCost * holdingCostRate;
    
    return Math.ceil(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost));
  }

  private estimateOrderingCost(quantity: number): number {
    const fixedOrderCost = 50;
    const unitCost = this.unitCost;
    const holdingCostRate = 0.2;
    const annualDemand = this.consumptionPattern.dailyAverageUsage * 365;
    
    // Totalcost = ordering cost + purchase cost + holding cost
    const orderingCost = (annualDemand / quantity) * fixedOrderCost;
    const purchaseCost = annualDemand * unitCost;
    const holdingCost = (quantity / 2) * unitCost * holdingCostRate;
    
    return orderingCost + purchaseCost + holdingCost;
  }

  private assessReorderRisk(): string {
    const daysOfStock = this.getDaysOfStockRemaining();
    const leadTime = this.leadTimeDays;
    
    if (daysOfStock <= leadTime) return 'high';
    if (daysOfStock <= leadTime * 1.5) return 'medium';
    return 'low';
  }

  private logStockAdjustment(previousStock: number, newStock: number, reason: string, userId: string): void {
    // This would create a StockTransaction record in a real implementation
    console.log(`Stock adjustment: ${this.itemCode} from ${previousStock} to ${newStock}, reason: ${reason}, by: ${userId}`);
  }

  private updateLocationFromRFID(location: string): void {
    // Update item location based on RFID reading
    const locationStock = this.locationStock.find(loc => loc.locationName === location);
    if (locationStock) {
      locationStock.lastCountDate = new Date();
    }
  }
}
