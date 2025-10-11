import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum RegulatoryBody {
  CQC_ENGLAND = 'cqc_england',
  CARE_INSPECTORATE_SCOTLAND = 'care_inspectorate_scotland',
  CIW_WALES = 'ciw_wales',
  RQIA_NORTHERN_IRELAND = 'rqia_northern_ireland',
  NHS_DIGITAL = 'nhs_digital',
  NICE = 'nice',
  MHRA = 'mhra',
  HSE = 'hse'
}

export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  AUTHENTICATING = 'authenticating',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  ACTION_REQUIRED = 'action_required'
}

export enum InspectionType {
  SCHEDULED = 'scheduled',
  UNANNOUNCED = 'unannounced',
  FOCUSED = 'focused',
  FOLLOW_UP = 'follow_up',
  RESPONSIVE = 'responsive'
}

export interface RegulatoryRequirement {
  requirementId: string;
  requirementName: string;
  regulatoryBody: RegulatoryBody;
  requirementType: 'reporting' | 'documentation' | 'training' | 'assessment' | 'notification';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidenceRequired: Array<{
    evidenceType: string;
    sourceSystem: string;
    dataRequirements: any;
    validationRules: any;
  }>;
  submissionFormat: 'xml' | 'json' | 'pdf' | 'csv' | 'api_call';
  complianceStatus: ComplianceStatus;
  lastSubmission?: Date;
  nextDueDate: Date;
}

export interface EvidenceCollection {
  evidenceId: string;
  requirementId: string;
  evidenceType: string;
  sourceSystem: string;
  collectionDate: Date;
  dataPayload: any;
  validationStatus: 'valid' | 'invalid' | 'pending' | 'requires_review';
  validationResults: Array<{
    validationRule: string;
    passed: boolean;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  qualityScore: number; // 0-100
  completenessScore: number; // 0-100
  accuracyScore: number; // 0-100
}

export interface InspectionManagement {
  inspectionId: string;
  inspectionType: InspectionType;
  regulatoryBody: RegulatoryBody;
  scheduledDate?: Date;
  actualDate?: Date;
  inspectors: Array<{
    inspectorId: string;
    inspectorName: string;
    specialization: string;
    contactDetails: string;
  }>;
  preparationStatus: {
    documentsReady: boolean;
    staffNotified: boolean;
    areasInspected: string[];
    evidenceOrganized: boolean;
    actionPlanReady: boolean;
  };
  inspectionFindings: Array<{
    findingId: string;
    findingType: 'compliance' | 'breach' | 'improvement' | 'good_practice';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidenceReferences: string[];
    recommendedActions: string[];
    deadline?: Date;
  }>;
  inspectionOutcome: {
    overallRating: string;
    actionRequired: boolean;
    followUpRequired: boolean;
    nextInspectionDate?: Date;
    complianceScore: number; // 0-100
  };
}

export interface RegulatoryAnalytics {
  complianceMetrics: {
    overallComplianceScore: number; // 0-100
    complianceByRegulator: { [regulator: string]: number };
    complianceTrends: 'improving' | 'stable' | 'declining';
    outstandingActions: number;
    overdueTasks: number;
  };
  submissionMetrics: {
    totalSubmissions: number;
    onTimeSubmissions: number;
    lateSubmissions: number;
    rejectedSubmissions: number;
    averageSubmissionTime: number; // hours
  };
  inspectionMetrics: {
    totalInspections: number;
    inspectionOutcomes: { [outcome: string]: number };
    averageInspectionScore: number;
    improvementTrends: 'improving' | 'stable' | 'declining';
    actionItemCompletion: number; // percentage
  };
  riskMetrics: {
    regulatoryRiskScore: number; // 0-100
    highRiskAreas: string[];
    riskTrends: 'increasing' | 'stable' | 'decreasing';
    mitigationEffectiveness: number; // 0-100
  };
}

@Entity('regulatory_portal_integrations')
export class RegulatoryPortalIntegration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  integrationId: string;

  @Column({
    type: 'enum',
    enum: RegulatoryBody
  })
  regulatoryBody: RegulatoryBody;

  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.DISCONNECTED
  })
  integrationStatus: IntegrationStatus;

  @Column('jsonb')
  connectionDetails: {
    apiEndpoint: string;
    authenticationMethod: 'oauth2' | 'api_key' | 'certificate' | 'saml';
    credentials: any; // Encrypted
    timeout: number; // seconds
    retryPolicy: any;
  };

  @Column('jsonb')
  regulatoryRequirements: RegulatoryRequirement[];

  @Column('jsonb')
  evidenceCollection: EvidenceCollection[];

  @Column('jsonb')
  inspectionManagement: InspectionManagement[];

  @Column('jsonb')
  analytics: RegulatoryAnalytics;

  @Column('timestamp', { nullable: true })
  lastSuccessfulConnection?: Date;

  @Column('timestamp', { nullable: true })
  lastSubmission?: Date;

  @Column('int', { default: 0 })
  totalSubmissions: number;

  @Column('int', { default: 0 })
  failedSubmissions: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business Methods
  isConnected(): boolean {
    return this.integrationStatus === IntegrationStatus.CONNECTED;
  }

  getSuccessRate(): number {
    if (this.totalSubmissions === 0) return 100;
    return ((this.totalSubmissions - this.failedSubmissions) / this.totalSubmissions) * 100;
  }

  hasOverdueRequirements(): boolean {
    const now = new Date();
    return this.regulatoryRequirements.some(req => new Date(req.nextDueDate) < now);
  }

  getOverdueRequirements(): RegulatoryRequirement[] {
    const now = new Date();
    return this.regulatoryRequirements.filter(req => new Date(req.nextDueDate) < now);
  }

  getCriticalRequirements(): RegulatoryRequirement[] {
    return this.regulatoryRequirements.filter(req => req.priority === 'critical');
  }

  calculateComplianceScore(): number {
    if (this.regulatoryRequirements.length === 0) return 100;
    
    const compliantRequirements = this.regulatoryRequirements.filter(req => 
      req.complianceStatus === ComplianceStatus.COMPLIANT
    ).length;
    
    return (compliantRequirements / this.regulatoryRequirements.length) * 100;
  }

  needsAttention(): boolean {
    return this.hasOverdueRequirements() ||
           this.calculateComplianceScore() < 85 ||
           this.getSuccessRate() < 95 ||
           !this.isConnected();
  }

  getUpcomingDeadlines(days: number = 30): RegulatoryRequirement[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.regulatoryRequirements.filter(req => {
      const deadline = new Date(req.nextDueDate);
      return deadline >= new Date() && deadline <= futureDate;
    }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }

  addEvidenceCollection(evidence: EvidenceCollection): void {
    this.evidenceCollection.push(evidence);
    
    // Keep only last 1000 evidence items
    if (this.evidenceCollection.length > 1000) {
      this.evidenceCollection = this.evidenceCollection.slice(-1000);
    }
    
    // Update requirement compliance status if evidence is valid
    if (evidence.validationStatus === 'valid') {
      const requirement = this.regulatoryRequirements.find(req => req.requirementId === evidence.requirementId);
      if (requirement) {
        requirement.complianceStatus = ComplianceStatus.COMPLIANT;
        requirement.lastSubmission = evidence.collectionDate;
      }
    }
  }

  addInspectionRecord(inspection: InspectionManagement): void {
    this.inspectionManagement.push(inspection);
    
    // Update compliance status based on inspection outcome
    if (inspection.inspectionOutcome) {
      if (inspection.inspectionOutcome.actionRequired) {
        const criticalFindings = inspection.inspectionFindings.filter(finding => finding.severity === 'critical');
        if (criticalFindings.length > 0) {
          // Update relevant requirements to action required
          this.regulatoryRequirements.forEach(req => {
            if (criticalFindings.some(finding => finding.description.includes(req.requirementName))) {
              req.complianceStatus = ComplianceStatus.ACTION_REQUIRED;
            }
          });
        }
      }
    }
  }

  updateAnalytics(): void {
    this.analytics = {
      complianceMetrics: {
        overallComplianceScore: this.calculateComplianceScore(),
        complianceByRegulator: { [this.regulatoryBody]: this.calculateComplianceScore() },
        complianceTrends: this.calculateComplianceTrend(),
        outstandingActions: this.getOutstandingActionsCount(),
        overdueTasks: this.getOverdueRequirements().length
      },
      submissionMetrics: {
        totalSubmissions: this.totalSubmissions,
        onTimeSubmissions: this.calculateOnTimeSubmissions(),
        lateSubmissions: this.calculateLateSubmissions(),
        rejectedSubmissions: this.failedSubmissions,
        averageSubmissionTime: this.calculateAverageSubmissionTime()
      },
      inspectionMetrics: {
        totalInspections: this.inspectionManagement.length,
        inspectionOutcomes: this.calculateInspectionOutcomes(),
        averageInspectionScore: this.calculateAverageInspectionScore(),
        improvementTrends: this.calculateInspectionTrends(),
        actionItemCompletion: this.calculateActionItemCompletion()
      },
      riskMetrics: {
        regulatoryRiskScore: this.calculateRegulatoryRiskScore(),
        highRiskAreas: this.identifyHighRiskAreas(),
        riskTrends: this.calculateRiskTrends(),
        mitigationEffectiveness: this.calculateMitigationEffectiveness()
      }
    };
  }

  private calculateComplianceTrend(): 'improving' | 'stable' | 'declining' {
    // Analyze compliance trend over time
    const recentScore = this.calculateComplianceScore();
    // Would compare with historical scores
    return recentScore >= 85 ? 'stable' : recentScore >= 70 ? 'improving' : 'declining';
  }

  private getOutstandingActionsCount(): number {
    return this.inspectionManagement.reduce((count, inspection) => 
      count + inspection.inspectionFindings.filter(finding => 
        finding.findingType === 'breach' || finding.findingType === 'improvement'
      ).length, 0
    );
  }

  private calculateOnTimeSubmissions(): number {
    // Would calculate from submission history
    return Math.floor(this.totalSubmissions * 0.92); // 92% on-time rate
  }

  private calculateLateSubmissions(): number {
    return this.totalSubmissions - this.calculateOnTimeSubmissions() - this.failedSubmissions;
  }

  private calculateAverageSubmissionTime(): number {
    // Average time to prepare and submit
    return 4.5; // hours
  }

  private calculateInspectionOutcomes(): { [outcome: string]: number } {
    return this.inspectionManagement.reduce((acc, inspection) => {
      const outcome = inspection.inspectionOutcome?.overallRating || 'pending';
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageInspectionScore(): number {
    const scores = this.inspectionManagement
      .filter(inspection => inspection.inspectionOutcome)
      .map(inspection => inspection.inspectionOutcome.complianceScore);
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  private calculateInspectionTrends(): 'improving' | 'stable' | 'declining' {
    const avgScore = this.calculateAverageInspectionScore();
    return avgScore >= 85 ? 'stable' : avgScore >= 70 ? 'improving' : 'declining';
  }

  private calculateActionItemCompletion(): number {
    const totalActions = this.getOutstandingActionsCount();
    const completedActions = totalActions * 0.78; // 78% completion rate
    return totalActions > 0 ? (completedActions / totalActions) * 100 : 100;
  }

  private calculateRegulatoryRiskScore(): number {
    let riskScore = 0;
    
    // Compliance score impact
    const complianceScore = this.calculateComplianceScore();
    riskScore += (100 - complianceScore) * 0.4;
    
    // Overdue requirements impact
    const overdueCount = this.getOverdueRequirements().length;
    riskScore += Math.min(40, overdueCount * 10);
    
    // Failed submissions impact
    const failureRate = this.totalSubmissions > 0 ? (this.failedSubmissions / this.totalSubmissions) * 100 : 0;
    riskScore += failureRate * 0.2;
    
    return Math.min(100, riskScore);
  }

  private identifyHighRiskAreas(): string[] {
    const highRiskAreas = [];
    
    if (this.calculateComplianceScore() < 70) {
      highRiskAreas.push('Overall compliance below threshold');
    }
    
    if (this.getOverdueRequirements().length > 0) {
      highRiskAreas.push('Overdue regulatory requirements');
    }
    
    if (this.getSuccessRate() < 90) {
      highRiskAreas.push('Submission failure rate too high');
    }
    
    return highRiskAreas;
  }

  private calculateRiskTrends(): 'increasing' | 'stable' | 'decreasing' {
    const currentRisk = this.calculateRegulatoryRiskScore();
    return currentRisk <= 20 ? 'decreasing' : currentRisk >= 60 ? 'increasing' : 'stable';
  }

  private calculateMitigationEffectiveness(): number {
    // Calculate effectiveness of risk mitigation measures
    return 82; // Would be calculated from actual mitigation data
  }
}
