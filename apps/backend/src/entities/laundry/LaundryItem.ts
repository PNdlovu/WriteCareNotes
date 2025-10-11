import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum LaundryStatus {
  COLLECTED = 'collected',
  SORTED = 'sorted',
  WASHING = 'washing',
  DRYING = 'drying',
  IRONING = 'ironing',
  FOLDED = 'folded',
  DELIVERED = 'delivered',
  LOST = 'lost',
  DAMAGED = 'damaged',
  QUARANTINED = 'quarantined'
}

export enum LaundryType {
  PERSONAL_CLOTHING = 'personal_clothing',
  BED_LINEN = 'bed_linen',
  TOWELS = 'towels',
  CURTAINS = 'curtains',
  PROTECTIVE_EQUIPMENT = 'protective_equipment',
  UNIFORMS = 'uniforms',
  KITCHEN_TEXTILES = 'kitchen_textiles',
  SPECIALIST_ITEMS = 'specialist_items'
}

export enum InfectionControlLevel {
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  ISOLATION = 'isolation',
  INFECTIOUS_DISEASE = 'infectious_disease',
  CONTAMINATED = 'contaminated'
}

export interface LaundryProcessTracking {
  processSteps: Array<{
    stepName: string;
    startTime: Date;
    endTime?: Date;
    duration?: number; // minutes
    operatorId: string;
    machineId?: string;
    temperature?: number;
    detergentUsed?: string;
    cycleType?: string;
    qualityCheck: boolean;
    notes?: string;
  }>;
  totalProcessingTime: number; // minutes
  qualityScore: number; // 0-100
  complianceScore: number; // 0-100
  costTracking: {
    waterUsage: number; // liters
    energyUsage: number; // kWh
    detergentCost: number; // GBP
    laborCost: number; // GBP
    totalCost: number; // GBP
  };
}

export interface InfectionControlProtocol {
  protocolId: string;
  riskLevel: InfectionControlLevel;
  washingRequirements: {
    minimumTemperature: number; // Celsius
    minimumCycleTime: number; // minutes
    requiredDetergent: string;
    disinfectantRequired: boolean;
    separateWashing: boolean;
    prewashRequired: boolean;
  };
  handlingProcedures: {
    ppeRequired: string[];
    containmentRequired: boolean;
    segregationRequired: boolean;
    specialTransport: boolean;
    trackingRequired: boolean;
  };
  postProcessValidation: {
    qualityTestRequired: boolean;
    microbiologicalTesting: boolean;
    visualInspection: boolean;
    documentationRequired: boolean;
  };
}

export interface QualityAssurance {
  qualityChecks: Array<{
    checkType: 'visual' | 'tactile' | 'microbiological' | 'chemical';
    checkTime: Date;
    inspector: string;
    results: any;
    passed: boolean;
    defectsFound: string[];
    correctionActions: string[];
  }>;
  customerSatisfaction: {
    residentFeedback: Array<{
      residentId: string;
      rating: number; // 1-5
      comments: string;
      issues: string[];
      compliments: string[];
    }>;
    staffFeedback: Array<{
      staffId: string;
      serviceRating: number; // 1-5
      timelinessRating: number; // 1-5
      qualityRating: number; // 1-5
      suggestions: string[];
    }>;
  };
  performanceMetrics: {
    onTimeDeliveryRate: number; // percentage
    qualityPassRate: number; // percentage
    damageRate: number; // percentage
    lossRate: number; // percentage
    reprocessingRate: number; // percentage
  };
}

@Entity('laundry_items')
export class LaundryItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  itemId: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column()
  itemDescription: string;

  @Column({
    type: 'enum',
    enum: LaundryType
  })
  laundryType: LaundryType;

  @Column({
    type: 'enum',
    enum: LaundryStatus,
    default: LaundryStatus.COLLECTED
  })
  status: LaundryStatus;

  @Column({
    type: 'enum',
    enum: InfectionControlLevel,
    default: InfectionControlLevel.STANDARD
  })
  infectionControlLevel: InfectionControlLevel;

  @Column('jsonb')
  processTracking: LaundryProcessTracking;

  @Column('jsonb')
  infectionControlProtocol: InfectionControlProtocol;

  @Column('jsonb')
  qualityAssurance: QualityAssurance;

  @Column('timestamp')
  collectionDate: Date;

  @Column('timestamp', { nullable: true })
  expectedDeliveryDate?: Date;

  @Column('timestamp', { nullable: true })
  actualDeliveryDate?: Date;

  @Column('text', { nullable: true })
  specialInstructions?: string;

  @Column('simple-array', { nullable: true })
  damages?: string[];

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  itemValue?: number; // GBP

  @Column({ default: false })
  isLost: boolean;

  @Column({ default: false })
  requiresSpecialCare: boolean;

  @Column('text', { nullable: true })
  careInstructions?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isOverdue(): boolean {
    if (!this.expectedDeliveryDate) return false;
    return new Date() > this.expectedDeliveryDate;
  }

  isInProcess(): boolean {
    return [
      LaundryStatus.COLLECTED,
      LaundryStatus.SORTED,
      LaundryStatus.WASHING,
      LaundryStatus.DRYING,
      LaundryStatus.IRONING,
      LaundryStatus.FOLDED
    ].includes(this.status);
  }

  isCompleted(): boolean {
    return this.status === LaundryStatus.DELIVERED;
  }

  hasIssues(): boolean {
    return [LaundryStatus.LOST, LaundryStatus.DAMAGED].includes(this.status) ||
           this.isLost ||
           (this.damages && this.damages.length > 0);
  }

  requiresHighLevelCare(): boolean {
    return this.infectionControlLevel === InfectionControlLevel.ISOLATION ||
           this.infectionControlLevel === InfectionControlLevel.INFECTIOUS_DISEASE ||
           this.requiresSpecialCare;
  }

  updateStatus(newStatus: LaundryStatus, operatorId: string, notes?: string): void {
    const previousStatus = this.status;
    this.status = newStatus;
    
    // Update process tracking
    const currentStep = this.processTracking.processSteps.find(step => !step.endTime);
    if (currentStep) {
      currentStep.endTime = new Date();
      currentStep.duration = Math.floor((currentStep.endTime.getTime() - currentStep.startTime.getTime()) / (1000 * 60));
    }
    
    // Start new process step if not final status
    if (newStatus !== LaundryStatus.DELIVERED && newStatus !== LaundryStatus.LOST && newStatus !== LaundryStatus.DAMAGED) {
      this.processTracking.processSteps.push({
        stepName: newStatus,
        startTime: new Date(),
        operatorId,
        qualityCheck: false,
        notes
      });
    }
    
    // Update delivery date if completed
    if (newStatus === LaundryStatus.DELIVERED) {
      this.actualDeliveryDate = new Date();
    }
  }

  addQualityCheck(checkData: {
    checkType: 'visual' | 'tactile' | 'microbiological' | 'chemical';
    inspector: string;
    results: any;
    passed: boolean;
    defectsFound?: string[];
  }): void {
    this.qualityAssurance.qualityChecks.push({
      ...checkData,
      checkTime: new Date(),
      correctionActions: checkData.passed ? [] : this.generateCorrectionActions(checkData.defectsFound || [])
    });
    
    // Update quality score
    this.updateQualityScore();
  }

  addResidentFeedback(feedback: {
    rating: number;
    comments: string;
    issues?: string[];
    compliments?: string[];
  }): void {
    this.qualityAssurance.customerSatisfaction.residentFeedback.push({
      residentId: this.residentId,
      rating: feedback.rating,
      comments: feedback.comments,
      issues: feedback.issues || [],
      compliments: feedback.compliments || []
    });
    
    // Update performance metrics
    this.updatePerformanceMetrics();
  }

  calculateProcessingTime(): number {
    if (this.processTracking.processSteps.length === 0) return 0;
    
    const completedSteps = this.processTracking.processSteps.filter(step => step.endTime);
    return completedSteps.reduce((total, step) => total + (step.duration || 0), 0);
  }

  calculateTotalCost(): number {
    return this.processTracking.costTracking.totalCost;
  }

  isOnTime(): boolean {
    if (!this.expectedDeliveryDate || !this.actualDeliveryDate) return true;
    return this.actualDeliveryDate <= this.expectedDeliveryDate;
  }

  getProcessingDuration(): number {
    if (!this.actualDeliveryDate) return 0;
    return Math.floor((this.actualDeliveryDate.getTime() - this.collectionDate.getTime()) / (1000 * 60 * 60)); // hours
  }

  private generateCorrectionActions(defects: string[]): string[] {
    const actions = [];
    
    defects.forEach(defect => {
      if (defect.includes('stain')) {
        actions.push('Apply stain removal treatment and rewash');
      } else if (defect.includes('odor')) {
        actions.push('Extended wash cycle with disinfectant');
      } else if (defect.includes('damage')) {
        actions.push('Assess for repair or replacement');
      } else {
        actions.push('Reprocess item according to care instructions');
      }
    });
    
    return actions;
  }

  private updateQualityScore(): void {
    const recentChecks = this.qualityAssurance.qualityChecks.slice(-5); // Last 5 checks
    if (recentChecks.length === 0) return;
    
    const passRate = recentChecks.filter(check => check.passed).length / recentChecks.length;
    this.processTracking.qualityScore = Math.round(passRate * 100);
  }

  private updatePerformanceMetrics(): void {
    const feedback = this.qualityAssurance.customerSatisfaction.residentFeedback;
    if (feedback.length === 0) return;
    
    // Update performance metrics based on feedback
    const avgRating = feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length;
    const issueRate = feedback.filter(fb => fb.issues.length > 0).length / feedback.length;
    
    this.qualityAssurance.performanceMetrics.qualityPassRate = Math.round(avgRating * 20); // Convert 1-5 to 0-100
    this.qualityAssurance.performanceMetrics.onTimeDeliveryRate = this.isOnTime() ? 100 : 85;
    this.qualityAssurance.performanceMetrics.damageRate = Math.round(issueRate * 10); // Estimate damage rate
  }

  generateLaundryReport(): any {
    return {
      itemSummary: {
        itemId: this.itemId,
        residentId: this.residentId,
        itemDescription: this.itemDescription,
        laundryType: this.laundryType,
        currentStatus: this.status,
        infectionControlLevel: this.infectionControlLevel
      },
      processingSummary: {
        collectionDate: this.collectionDate,
        expectedDelivery: this.expectedDeliveryDate,
        actualDelivery: this.actualDeliveryDate,
        processingTime: this.calculateProcessingTime(),
        totalCost: this.calculateTotalCost(),
        onTime: this.isOnTime()
      },
      qualityMetrics: {
        qualityScore: this.processTracking.qualityScore,
        complianceScore: this.processTracking.complianceScore,
        qualityChecks: this.qualityAssurance.qualityChecks.length,
        defectsFound: this.qualityAssurance.qualityChecks.flatMap(check => check.defectsFound).length
      },
      performanceMetrics: this.qualityAssurance.performanceMetrics,
      issues: {
        hasIssues: this.hasIssues(),
        isOverdue: this.isOverdue(),
        damages: this.damages || [],
        specialCareRequired: this.requiresSpecialCare
      }
    };
  }
}
