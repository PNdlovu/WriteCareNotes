import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export enum RequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIALLY_APPROVED = 'partially_approved',
  CONVERTED_TO_PO = 'converted_to_po',
  CANCELLED = 'cancelled'
}

export enum ItemCategory {
  MEDICAL_SUPPLIES = 'medical_supplies',
  PHARMACEUTICALS = 'pharmaceuticals',
  FOOD_CATERING = 'food_catering',
  CLEANING_SUPPLIES = 'cleaning_supplies',
  OFFICE_SUPPLIES = 'office_supplies',
  MAINTENANCE_PARTS = 'maintenance_parts',
  EQUIPMENT = 'equipment',
  SERVICES = 'services',
  UTILITIES = 'utilities',
  PROFESSIONAL_SERVICES = 'professional_services'
}

export interface RequestItem {
  id: string;
  itemCode: string;
  description: string;
  category: ItemCategory;
  subcategory: string;
  specification: string;
  quantity: number;
  unit: string;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  preferredSupplier?: string;
  alternativeSuppliers: string[];
  requiredDate: Date;
  justification: string;
  urgencyReason?: string;
  technicalSpecifications: { [key: string]: any };
  qualityRequirements: string[];
  complianceRequirements: string[];
  sustainabilityRequirements: string[];
}

export interface ApprovalWorkflow {
  approvalLevel: number;
  approverId: string;
  approverRole: string;
  approvalDate?: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalComments?: string;
  budgetImpact: number;
  authorityLimit: number;
  escalationRequired: boolean;
  delegatedTo?: string;
}

export interface BudgetImpact {
  budgetCategory: string;
  budgetYear: number;
  budgetMonth: number;
  allocatedBudget: number;
  spentToDate: number;
  thisRequestCost: number;
  remainingBudget: number;
  budgetUtilization: number; // percentage
  overBudget: boolean;
  budgetApprovalRequired: boolean;
}

export interface SupplierRecommendation {
  supplierId: string;
  supplierName: string;
  recommendationScore: number; // 1-100
  recommendationReasons: string[];
  estimatedCost: number;
  estimatedDeliveryTime: number; // days
  qualityRating: number; // 1-5
  reliabilityRating: number; // 1-5
  sustainabilityRating: number; // 1-5
  previousPerformance: {
    onTimeDeliveryRate: number;
    qualityIssueRate: number;
    costVarianceRate: number;
  };
}

export interface AIOptimizationSuggestions {
  costOptimization: {
    potentialSavings: number;
    alternativeItems: string[];
    bulkOrderOpportunities: string[];
    contractNegotiationPoints: string[];
  };
  deliveryOptimization: {
    consolidationOpportunities: string[];
    preferredDeliveryDates: Date[];
    logisticsEfficiencies: string[];
  };
  sustainabilityImprovements: {
    ecoFriendlyAlternatives: string[];
    carbonFootprintReduction: number;
    sustainabilityScore: number;
  };
  riskMitigation: {
    supplierRisks: string[];
    qualityRisks: string[];
    deliveryRisks: string[];
    mitigationStrategies: string[];
  };
}

@Entity('purchase_requests')
export class PurchaseRequest extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  requestNumber: string;

  @Column()
  requesterId: string;

  @Column()
  department: string;

  @Column('date')
  requestDate: Date;

  @Column('date')
  requiredDate: Date;

  @Column({
    type: 'enum',
    enum: RequestPriority,
    default: RequestPriority.MEDIUM
  })
  priority: RequestPriority;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.DRAFT
  })
  status: RequestStatus;

  @Column('jsonb')
  items: RequestItem[];

  @Column('decimal', { precision: 12, scale: 2 })
  totalEstimatedCost: number;

  @Column('text')
  businessJustification: string;

  @Column('jsonb')
  approvalWorkflow: ApprovalWorkflow[];

  @Column('jsonb')
  budgetImpact: BudgetImpact;

  @Column('jsonb')
  supplierRecommendations: SupplierRecommendation[];

  @Column('jsonb')
  aiOptimizationSuggestions: AIOptimizationSuggestions;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column('text', { nullable: true })
  specialInstructions?: string;

  @Column('jsonb')
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;

  @Column('jsonb')
  complianceChecks: {
    regulatoryCompliance: boolean;
    qualityStandards: boolean;
    sustainabilityRequirements: boolean;
    ethicalSourcing: boolean;
    dataProtectionCompliance: boolean;
  };

  @Column('jsonb')
  riskAssessment: {
    supplierRisk: 'low' | 'medium' | 'high';
    qualityRisk: 'low' | 'medium' | 'high';
    deliveryRisk: 'low' | 'medium' | 'high';
    budgetRisk: 'low' | 'medium' | 'high';
    overallRisk: 'low' | 'medium' | 'high';
    mitigationPlan: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isApproved(): boolean {
    return this.status === RequestStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === RequestStatus.REJECTED;
  }

  isPending(): boolean {
    return [RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW].includes(this.status);
  }

  isUrgent(): boolean {
    return this.priority === RequestPriority.URGENT || this.priority === RequestPriority.EMERGENCY;
  }

  isOverdue(): boolean {
    return new Date() > this.requiredDate && !this.isApproved();
  }

  getTotalCost(): number {
    return this.items.reduce((total, item) => total + item.estimatedTotalCost, 0);
  }

  requiresBudgetApproval(): boolean {
    return this.budgetImpact.budgetApprovalRequired || this.budgetImpact.overBudget;
  }

  getNextApprover(): ApprovalWorkflow | null {
    const pendingApproval = this.approvalWorkflow.find(approval => approval.approvalStatus === 'pending');
    return pendingApproval || null;
  }

  isFullyApproved(): boolean {
    return this.approvalWorkflow.every(approval => approval.approvalStatus === 'approved');
  }

  hasRejectedApproval(): boolean {
    return this.approvalWorkflow.some(approval => approval.approvalStatus === 'rejected');
  }

  getApprovalProgress(): number {
    const approvedCount = this.approvalWorkflow.filter(approval => approval.approvalStatus === 'approved').length;
    return this.approvalWorkflow.length > 0 ? (approvedCount / this.approvalWorkflow.length) * 100 : 0;
  }

  getDaysUntilRequired(): number {
    const now = new Date();
    const diffTime = this.requiredDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  addApprovalStep(approval: ApprovalWorkflow): void {
    this.approvalWorkflow.push(approval);
    this.updateStatus();
  }

  approveStep(approverId: string, comments?: string): void {
    const approval = this.approvalWorkflow.find(a => a.approverId === approverId && a.approvalStatus === 'pending');
    if (approval) {
      approval.approvalStatus = 'approved';
      approval.approvalDate = new Date();
      approval.approvalComments = comments;
      this.updateStatus();
    }
  }

  rejectStep(approverId: string, reason: string): void {
    const approval = this.approvalWorkflow.find(a => a.approverId === approverId && a.approvalStatus === 'pending');
    if (approval) {
      approval.approvalStatus = 'rejected';
      approval.approvalDate = new Date();
      approval.approvalComments = reason;
      this.status = RequestStatus.REJECTED;
      this.rejectionReason = reason;
    }
  }

  private updateStatus(): void {
    if (this.hasRejectedApproval()) {
      this.status = RequestStatus.REJECTED;
    } else if (this.isFullyApproved()) {
      this.status = RequestStatus.APPROVED;
    } else if (this.approvalWorkflow.some(a => a.approvalStatus === 'pending')) {
      this.status = RequestStatus.UNDER_REVIEW;
    }
  }

  calculateSustainabilityScore(): number {
    let score = 0;
    let totalItems = this.items.length;
    
    for (const item of this.items) {
      // Score based on sustainability requirements
      if (item.sustainabilityRequirements.includes('eco_friendly')) score += 20;
      if (item.sustainabilityRequirements.includes('recyclable')) score += 15;
      if (item.sustainabilityRequirements.includes('local_sourcing')) score += 15;
      if (item.sustainabilityRequirements.includes('carbon_neutral')) score += 25;
      if (item.sustainabilityRequirements.includes('ethical_sourcing')) score += 25;
    }
    
    return totalItems > 0 ? Math.min(100, score / totalItems) : 0;
  }

  getHighestRiskCategory(): string {
    const risks = [
      { category: 'supplier', level: this.riskAssessment.supplierRisk },
      { category: 'quality', level: this.riskAssessment.qualityRisk },
      { category: 'delivery', level: this.riskAssessment.deliveryRisk },
      { category: 'budget', level: this.riskAssessment.budgetRisk }
    ];
    
    const riskLevels = { low: 1, medium: 2, high: 3 };
    const highestRisk = risks.reduce((max, risk) => 
      riskLevels[risk.level] > riskLevels[max.level] ? risk : max
    );
    
    return highestRisk.category;
  }

  getBestSupplierRecommendation(): SupplierRecommendation | null {
    if (this.supplierRecommendations.length === 0) return null;
    
    return this.supplierRecommendations.reduce((best, current) => 
      current.recommendationScore > best.recommendationScore ? current : best
    );
  }

  getPotentialCostSavings(): number {
    return this.aiOptimizationSuggestions.costOptimization.potentialSavings;
  }

  requiresUrgentApproval(): boolean {
    return this.isUrgent() && this.getDaysUntilRequired() <= 2;
  }

  canBeConvertedToPO(): boolean {
    return this.isFullyApproved() && this.status === RequestStatus.APPROVED;
  }

  getComplianceStatus(): { compliant: boolean; issues: string[] } {
    const issues = [];
    const checks = this.complianceChecks;
    
    if (!checks.regulatoryCompliance) issues.push('Regulatory compliance not verified');
    if (!checks.qualityStandards) issues.push('Quality standards not met');
    if (!checks.sustainabilityRequirements) issues.push('Sustainability requirements not satisfied');
    if (!checks.ethicalSourcing) issues.push('Ethical sourcing not verified');
    if (!checks.dataProtectionCompliance) issues.push('Data protection compliance not confirmed');
    
    return {
      compliant: issues.length === 0,
      issues
    };
  }
}
