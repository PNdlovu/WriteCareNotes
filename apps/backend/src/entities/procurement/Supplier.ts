import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  UNDER_REVIEW = 'under_review',
  BLACKLISTED = 'blacklisted'
}

export enum SupplierTier {
  STRATEGIC = 'strategic',
  PREFERRED = 'preferred',
  APPROVED = 'approved',
  CONDITIONAL = 'conditional',
  TRIAL = 'trial'
}

export enum CertificationType {
  ISO_9001 = 'iso_9001',
  ISO_14001 = 'iso_14001',
  ISO_45001 = 'iso_45001',
  FDA_APPROVED = 'fda_approved',
  CE_MARKING = 'ce_marking',
  MHRA_APPROVED = 'mhra_approved',
  ORGANIC_CERTIFIED = 'organic_certified',
  FAIR_TRADE = 'fair_trade',
  CARBON_NEUTRAL = 'carbon_neutral'
}

export interface SupplierContact {
  contactType: 'primary' | 'billing' | 'technical' | 'emergency' | 'quality';
  name: string;
  title: string;
  email: string;
  phone: string;
  mobile?: string;
  department: string;
  availability: string;
  languages: string[];
}

export interface FinancialInformation {
  creditRating: string;
  annualRevenue: number;
  paymentTerms: string;
  preferredPaymentMethod: string;
  currencyPreference: string;
  taxIdentificationNumber: string;
  bankingDetails: {
    bankName: string;
    accountNumber: string;
    sortCode: string;
    iban?: string;
    swiftCode?: string;
  };
  insuranceDetails: {
    publicLiabilityInsurance: number;
    productLiabilityInsurance: number;
    professionalIndemnityInsurance: number;
    expiryDate: Date;
  };
}

export interface QualityMetrics {
  overallRating: number; // 1-5
  qualityScore: number; // 1-100
  defectRate: number; // percentage
  returnRate: number; // percentage
  customerSatisfactionRating: number; // 1-5
  qualityIssuesReported: number;
  correctiveActionsImplemented: number;
  qualityAuditsCompleted: number;
  lastQualityAuditDate: Date;
  nextQualityAuditDate: Date;
}

export interface PerformanceMetrics {
  onTimeDeliveryRate: number; // percentage
  orderAccuracyRate: number; // percentage
  responseTime: number; // hours
  issueResolutionTime: number; // hours
  contractComplianceRate: number; // percentage
  costVarianceRate: number; // percentage
  innovationScore: number; // 1-100
  digitalCapabilityScore: number; // 1-100
  lastPerformanceReview: Date;
  nextPerformanceReview: Date;
}

export interface RiskProfile {
  overallRiskRating: 'low' | 'medium' | 'high' | 'critical';
  financialRisk: 'low' | 'medium' | 'high';
  operationalRisk: 'low' | 'medium' | 'high';
  reputationalRisk: 'low' | 'medium' | 'high';
  geopoliticalRisk: 'low' | 'medium' | 'high';
  cybersecurityRisk: 'low' | 'medium' | 'high';
  environmentalRisk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigationStrategies: string[];
  lastRiskAssessment: Date;
  nextRiskAssessment: Date;
}

export interface SustainabilityProfile {
  sustainabilityRating: number; // 1-100
  carbonFootprint: number; // tonnes CO2 equivalent
  renewableEnergyUsage: number; // percentage
  wasteReductionInitiatives: string[];
  socialResponsibilityPrograms: string[];
  ethicalSourcingPractices: string[];
  environmentalCertifications: CertificationType[];
  sustainabilityGoals: {
    target: string;
    deadline: Date;
    progress: number; // percentage
  }[];
}

export interface ContractInformation {
  contractId: string;
  contractType: 'framework' | 'spot' | 'long_term' | 'preferred_supplier';
  startDate: Date;
  endDate: Date;
  autoRenewal: boolean;
  renewalTerms: string;
  contractValue: number;
  paymentTerms: string;
  deliveryTerms: string;
  qualityTerms: string;
  penaltyClauses: string[];
  performanceKPIs: { [kpi: string]: number };
  reviewSchedule: Date[];
}

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  supplierCode: string;

  @Column()
  supplierName: string;

  @Column()
  tradingName: string;

  @Column()
  registrationNumber: string;

  @Column()
  vatNumber: string;

  @Column({
    type: 'enum',
    enum: SupplierStatus,
    default: SupplierStatus.TRIAL
  })
  status: SupplierStatus;

  @Column({
    type: 'enum',
    enum: SupplierTier,
    default: SupplierTier.TRIAL
  })
  tier: SupplierTier;

  @Column('jsonb')
  businessAddress: {
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
  };

  @Column('jsonb')
  contacts: SupplierContact[];

  @Column('simple-array')
  categories: ItemCategory[];

  @Column('simple-array')
  specializations: string[];

  @Column('jsonb')
  certifications: Array<{
    type: CertificationType;
    certificateNumber: string;
    issuingBody: string;
    issueDate: Date;
    expiryDate: Date;
    status: 'valid' | 'expired' | 'suspended';
  }>;

  @Column('jsonb')
  financialInformation: FinancialInformation;

  @Column('jsonb')
  qualityMetrics: QualityMetrics;

  @Column('jsonb')
  performanceMetrics: PerformanceMetrics;

  @Column('jsonb')
  riskProfile: RiskProfile;

  @Column('jsonb')
  sustainabilityProfile: SustainabilityProfile;

  @Column('jsonb')
  contractInformation: ContractInformation[];

  @Column('date')
  onboardingDate: Date;

  @Column('date', { nullable: true })
  lastOrderDate?: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  totalOrderValue: number;

  @Column('int')
  totalOrderCount: number;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return this.status === SupplierStatus.ACTIVE;
  }

  isStrategicSupplier(): boolean {
    return this.tier === SupplierTier.STRATEGIC;
  }

  isPreferredSupplier(): boolean {
    return this.tier === SupplierTier.PREFERRED || this.tier === SupplierTier.STRATEGIC;
  }

  hasValidCertification(certificationType: CertificationType): boolean {
    return this.certifications.some(cert => 
      cert.type === certificationType && 
      cert.status === 'valid' && 
      new Date(cert.expiryDate) > new Date()
    );
  }

  getExpiringCertifications(withinDays: number = 90): any[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.certifications.filter(cert => 
      cert.status === 'valid' && 
      new Date(cert.expiryDate) <= futureDate
    );
  }

  isHighPerformer(): boolean {
    const metrics = this.performanceMetrics;
    return metrics.onTimeDeliveryRate >= 95 && 
           metrics.orderAccuracyRate >= 98 && 
           metrics.contractComplianceRate >= 95 &&
           this.qualityMetrics.overallRating >= 4.0;
  }

  isLowRisk(): boolean {
    return this.riskProfile.overallRiskRating === 'low';
  }

  isSustainable(): boolean {
    return this.sustainabilityProfile.sustainabilityRating >= 70;
  }

  canSupplyCategory(category: ItemCategory): boolean {
    return this.categories.includes(category);
  }

  hasSpecialization(specialization: string): boolean {
    return this.specializations.some(spec => 
      spec.toLowerCase().includes(specialization.toLowerCase())
    );
  }

  getAverageOrderValue(): number {
    return this.totalOrderCount > 0 ? this.totalOrderValue / this.totalOrderCount : 0;
  }

  getDaysSinceLastOrder(): number {
    if (!this.lastOrderDate) return Infinity;
    
    const now = new Date();
    const diffTime = now.getTime() - new Date(this.lastOrderDate).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isContractExpiringSoon(withinDays: number = 90): boolean {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.contractInformation.some(contract => 
      new Date(contract.endDate) <= futureDate && !contract.autoRenewal
    );
  }

  getActiveContracts(): ContractInformation[] {
    const now = new Date();
    return this.contractInformation.filter(contract => 
      new Date(contract.startDate) <= now && new Date(contract.endDate) >= now
    );
  }

  calculateSupplierScore(): number {
    const weights = {
      quality: 0.3,
      performance: 0.25,
      risk: 0.2,
      sustainability: 0.15,
      cost: 0.1
    };
    
    const qualityScore = (this.qualityMetrics.overallRating / 5) * 100;
    const performanceScore = (
      this.performanceMetrics.onTimeDeliveryRate * 0.4 +
      this.performanceMetrics.orderAccuracyRate * 0.3 +
      this.performanceMetrics.contractComplianceRate * 0.3
    );
    const riskScore = this.riskProfile.overallRiskRating === 'low' ? 100 : 
                     this.riskProfile.overallRiskRating === 'medium' ? 70 : 
                     this.riskProfile.overallRiskRating === 'high' ? 40 : 20;
    const sustainabilityScore = this.sustainabilityProfile.sustainabilityRating;
    const costScore = 100 - Math.abs(this.performanceMetrics.costVarianceRate); // Lowervariance = higher score
    
    const totalScore = 
      qualityScore * weights.quality +
      performanceScore * weights.performance +
      riskScore * weights.risk +
      sustainabilityScore * weights.sustainability +
      costScore * weights.cost;
    
    return Math.round(totalScore);
  }

  needsPerformanceReview(): boolean {
    return new Date() >= new Date(this.performanceMetrics.nextPerformanceReview);
  }

  needsRiskAssessment(): boolean {
    return new Date() >= new Date(this.riskProfile.nextRiskAssessment);
  }

  updatePerformanceMetrics(orderData: {
    onTime: boolean;
    accurate: boolean;
    responseTime: number;
    issueResolutionTime?: number;
    costVariance: number;
  }): void {
    const metrics = this.performanceMetrics;
    
    // Update delivery performance
    const totalOrders = this.totalOrderCount;
    const currentOnTimeRate = metrics.onTimeDeliveryRate;
    metrics.onTimeDeliveryRate = ((currentOnTimeRate * totalOrders) + (orderData.onTime ? 100 : 0)) / (totalOrders + 1);
    
    // Update accuracy
    metrics.orderAccuracyRate = ((metrics.orderAccuracyRate * totalOrders) + (orderData.accurate ? 100 : 0)) / (totalOrders + 1);
    
    // Update response time (moving average)
    metrics.responseTime = (metrics.responseTime * 0.8) + (orderData.responseTime * 0.2);
    
    // Update cost variance
    metrics.costVarianceRate = (metrics.costVarianceRate * 0.8) + (Math.abs(orderData.costVariance) * 0.2);
    
    if (orderData.issueResolutionTime) {
      metrics.issueResolutionTime = (metrics.issueResolutionTime * 0.8) + (orderData.issueResolutionTime * 0.2);
    }
  }

  addQualityIssue(issueDescription: string, severity: 'low' | 'medium' | 'high'): void {
    this.qualityMetrics.qualityIssuesReported++;
    
    // Adjust quality score based on severity
    const impact = { low: 1, medium: 3, high: 5 }[severity];
    this.qualityMetrics.qualityScore = Math.max(0, this.qualityMetrics.qualityScore - impact);
    
    // Recalculate overall rating
    this.qualityMetrics.overallRating = this.qualityMetrics.qualityScore / 20; // Convert to 1-5 scale
  }

  resolveQualityIssue(resolutionDescription: string): void {
    this.qualityMetrics.correctiveActionsImplemented++;
    
    // Slight improvement in quality score for issue resolution
    this.qualityMetrics.qualityScore = Math.min(100, this.qualityMetrics.qualityScore + 1);
    this.qualityMetrics.overallRating = this.qualityMetrics.qualityScore / 20;
  }
}
