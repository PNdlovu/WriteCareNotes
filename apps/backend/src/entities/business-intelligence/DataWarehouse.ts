import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum BusinessDomain {
  CARE_DELIVERY = 'care_delivery',
  FINANCIAL_PERFORMANCE = 'financial_performance',
  OPERATIONAL_EFFICIENCY = 'operational_efficiency',
  QUALITY_METRICS = 'quality_metrics',
  REGULATORY_COMPLIANCE = 'regulatory_compliance',
  STAFF_PERFORMANCE = 'staff_performance',
  RESIDENT_OUTCOMES = 'resident_outcomes',
  FAMILY_SATISFACTION = 'family_satisfaction'
}

export enum AnalysisType {
  DESCRIPTIVE = 'descriptive',
  DIAGNOSTIC = 'diagnostic',
  PREDICTIVE = 'predictive',
  PRESCRIPTIVE = 'prescriptive',
  REAL_TIME = 'real_time',
  COMPARATIVE = 'comparative',
  TREND_ANALYSIS = 'trend_analysis',
  CORRELATION_ANALYSIS = 'correlation_analysis'
}

export enum ModelType {
  CLASSIFICATION = 'classification',
  REGRESSION = 'regression',
  CLUSTERING = 'clustering',
  ANOMALY_DETECTION = 'anomaly_detection',
  TIME_SERIES = 'time_series',
  NATURAL_LANGUAGE = 'natural_language',
  COMPUTER_VISION = 'computer_vision',
  REINFORCEMENT_LEARNING = 'reinforcement_learning'
}

export enum MLAlgorithm {
  LINEAR_REGRESSION = 'linear_regression',
  LOGISTIC_REGRESSION = 'logistic_regression',
  RANDOM_FOREST = 'random_forest',
  GRADIENT_BOOSTING = 'gradient_boosting',
  NEURAL_NETWORK = 'neural_network',
  DEEP_LEARNING = 'deep_learning',
  SVM = 'svm',
  NAIVE_BAYES = 'naive_bayes',
  K_MEANS = 'k_means',
  LSTM = 'lstm',
  TRANSFORMER = 'transformer'
}

export interface TimeDimension {
  dateKey: string;
  fullDate: Date;
  year: number;
  quarter: number;
  month: number;
  week: number;
  dayOfYear: number;
  dayOfMonth: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  fiscalYear: number;
  fiscalQuarter: number;
  seasonName: string;
}

export interface ResidentDimension {
  residentKey: string;
  residentId: string;
  ageGroup: string;
  careLevel: string;
  admissionDate: Date;
  lengthOfStay: number;
  fundingSource: string;
  cognitiveStatus: string;
  mobilityLevel: string;
  medicalComplexity: string;
}

export interface StaffDimension {
  staffKey: string;
  employeeId: string;
  role: string;
  department: string;
  experienceLevel: string;
  qualifications: string[];
  shiftPattern: string;
  performanceRating: number;
}

export interface CareEventFact {
  factId: string;
  residentKey: string;
  staffKey: string;
  dateKey: string;
  careType: string;
  duration: number;
  quality: number;
  outcome: string;
  cost: number;
  satisfaction: number;
}

export interface MLModel {
  id: string;
  name: string;
  type: ModelType;
  algorithm: MLAlgorithm;
  version: string;
  trainingData: {
    datasetSize: number;
    features: string[];
    targetVariable: string;
    trainingPeriod: { start: Date; end: Date };
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    rmse?: number;
    mae?: number;
  };
  hyperparameters: { [parameter: string]: any };
  featureImportance: { [feature: string]: number };
  deploymentStatus: 'training' | 'testing' | 'deployed' | 'deprecated';
  lastTrained: Date;
  nextRetraining: Date;
  predictionEndpoint: string;
  businessImpact: {
    costSavings: number;
    qualityImprovement: number;
    efficiencyGain: number;
    riskReduction: number;
  };
}

export interface AdvancedInsight {
  insightId: string;
  insightType: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  domain: BusinessDomain;
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  actionable: boolean;
  recommendedActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedEffort: string;
    expectedBenefit: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  dataSource: string[];
  methodology: string;
  validationStatus: 'pending' | 'validated' | 'rejected';
  businessValue: number; // estimated GBP value
}

export interface PredictiveModel {
  modelId: string;
  modelName: string;
  predictionType: 'health_outcome' | 'operational_metric' | 'financial_forecast' | 'risk_assessment';
  algorithm: MLAlgorithm;
  inputFeatures: string[];
  outputPredictions: string[];
  accuracy: number;
  lastTraining: Date;
  nextRetraining: Date;
  realTimePredictions: boolean;
  batchPredictions: boolean;
  explainableAI: boolean;
  biasDetection: boolean;
  fairnessMetrics: { [metric: string]: number };
}

@Entity('data_warehouse')
export class DataWarehouse extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  warehouseId: string;

  @Column()
  warehouseName: string;

  @Column('jsonb')
  dimensions: {
    time: TimeDimension[];
    resident: ResidentDimension[];
    staff: StaffDimension[];
    facility: any[];
    care: any[];
  };

  @Column('jsonb')
  facts: {
    careEvents: CareEventFact[];
    financialTransactions: any[];
    staffActivities: any[];
    incidentEvents: any[];
    medicationAdministration: any[];
  };

  @Column('jsonb')
  mlModels: MLModel[];

  @Column('jsonb')
  insights: AdvancedInsight[];

  @Column('jsonb')
  predictiveModels: PredictiveModel[];

  @Column('bigint')
  totalRecords: number;

  @Column('decimal', { precision: 10, scale: 2 })
  dataSizeGB: number;

  @Column('timestamp')
  lastETLRun: Date;

  @Column('timestamp')
  nextETLRun: Date;

  @Column('jsonb')
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    overallScore: number;
  };

  @Column('jsonb')
  performanceMetrics: {
    queryResponseTime: number; // ms
    etlProcessingTime: number; // minutes
    modelTrainingTime: number; // minutes
    predictionLatency: number; // ms
    systemUptime: number; // percentage
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isHealthy(): boolean {
    return this.dataQuality.overallScore >= 85 &&
           this.performanceMetrics.systemUptime >= 99.5 &&
           this.isETLCurrent();
  }

  isETLCurrent(): boolean {
    return new Date() <= this.nextETLRun;
  }

  hasHighQualityData(): boolean {
    return this.dataQuality.completeness >= 95 &&
           this.dataQuality.accuracy >= 90 &&
           this.dataQuality.consistency >= 90;
  }

  getActiveMLModels(): MLModel[] {
    return this.mlModels.filter(model => model.deploymentStatus === 'deployed');
  }

  getHighImpactInsights(): AdvancedInsight[] {
    return this.insights.filter(insight => 
      insight.impact === 'high' || insight.impact === 'critical'
    ).sort((a, b) => b.confidence - a.confidence);
  }

  getActionableInsights(): AdvancedInsight[] {
    return this.insights.filter(insight => 
      insight.actionable && insight.validationStatus === 'validated'
    );
  }

  calculateBusinessValue(): number {
    return this.insights
      .filter(insight => insight.validationStatus === 'validated')
      .reduce((sum, insight) => sum + insight.businessValue, 0);
  }

  needsModelRetraining(): boolean {
    return this.mlModels.some(model => new Date() >= model.nextRetraining);
  }

  getModelAccuracy(): number {
    const activeModels = this.getActiveMLModels();
    if (activeModels.length === 0) return 0;
    
    return activeModels.reduce((sum, model) => sum + model.performance.accuracy, 0) / activeModels.length;
  }

  addInsight(insight: AdvancedInsight): void {
    this.insights.push(insight);
    
    // Keep only last 1000 insights
    if (this.insights.length > 1000) {
      this.insights = this.insights
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 1000);
    }
  }

  updateDataQuality(qualityMetrics: any): void {
    this.dataQuality = {
      ...qualityMetrics,
      overallScore: (
        qualityMetrics.completeness +
        qualityMetrics.accuracy +
        qualityMetrics.consistency +
        qualityMetrics.timeliness
      ) / 4
    };
  }

  deployMLModel(model: MLModel): void {
    const existingIndex = this.mlModels.findIndex(m => m.id === model.id);
    if (existingIndex >= 0) {
      this.mlModels[existingIndex] = model;
    } else {
      this.mlModels.push(model);
    }
  }

  retireMLModel(modelId: string): void {
    const model = this.mlModels.find(m => m.id === modelId);
    if (model) {
      model.deploymentStatus = 'deprecated';
    }
  }

  generateExecutiveSummary(): any {
    return {
      warehouseHealth: this.isHealthy(),
      dataQualityScore: this.dataQuality.overallScore,
      totalRecords: this.totalRecords,
      dataSizeGB: this.dataSizeGB,
      activeMLModels: this.getActiveMLModels().length,
      modelAccuracy: this.getModelAccuracy(),
      highImpactInsights: this.getHighImpactInsights().length,
      businessValue: this.calculateBusinessValue(),
      performanceMetrics: this.performanceMetrics,
      lastUpdated: this.lastETLRun
    };
  }
}