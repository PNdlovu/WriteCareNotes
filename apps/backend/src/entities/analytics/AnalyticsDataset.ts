import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum DataSourceType {
  DATABASE = 'database',
  API = 'api',
  FILE_UPLOAD = 'file_upload',
  REAL_TIME_STREAM = 'real_time_stream',
  IOT_SENSORS = 'iot_sensors',
  EXTERNAL_SYSTEM = 'external_system',
  MANUAL_ENTRY = 'manual_entry'
}

export enum RefreshFrequency {
  REAL_TIME = 'real_time',
  EVERY_MINUTE = 'every_minute',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum DataQualityStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical'
}

export interface DataSource {
  sourceId: string;
  sourceName: string;
  sourceType: DataSourceType;
  connectionString: string;
  authentication: {
    authType: 'none' | 'basic' | 'oauth' | 'certificate' | 'api_key';
    credentials?: string; // encrypted
  };
  dataMapping: { [sourceField: string]: string };
  transformationRules: Array<{
    ruleId: string;
    ruleName: string;
    sourceField: string;
    targetField: string;
    transformation: string;
    validation: string;
  }>;
  lastSuccessfulSync: Date;
  errorCount: number;
  isActive: boolean;
}

export interface DataSchema {
  fields: Array<{
    fieldName: string;
    dataType: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'binary';
    required: boolean;
    primaryKey: boolean;
    indexed: boolean;
    validation: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      allowedValues?: string[];
      range?: { min: number; max: number };
    };
    description: string;
    businessMeaning: string;
  }>;
  relationships: Array<{
    relationshipType: 'one_to_one' | 'one_to_many' | 'many_to_many';
    relatedDataset: string;
    foreignKey: string;
    description: string;
  }>;
  businessRules: Array<{
    ruleId: string;
    ruleName: string;
    condition: string;
    action: string;
    priority: number;
  }>;
}

export interface DataQualityMetrics {
  completeness: number; // percentage
  accuracy: number; // percentage
  consistency: number; // percentage
  timeliness: number; // percentage
  validity: number; // percentage
  uniqueness: number; // percentage
  overallQualityScore: number; // 1-100
  qualityStatus: DataQualityStatus;
  issuesIdentified: Array<{
    issueType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedRecords: number;
    suggestedResolution: string;
  }>;
  lastQualityCheck: Date;
  nextQualityCheck: Date;
}

export interface AccessPermission {
  userId: string;
  userRole: string;
  accessType: 'read' | 'write' | 'admin' | 'owner';
  grantedDate: Date;
  expiryDate?: Date;
  grantedBy: string;
  conditions: string[];
  dataClassificationLevel: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface RetentionPolicy {
  retentionPeriod: number; // days
  archiveAfter: number; // days
  deleteAfter: number; // days
  legalHoldExemptions: string[];
  retentionReasons: string[];
  disposalMethod: 'secure_delete' | 'archive' | 'anonymize';
  complianceRequirements: string[];
}

export interface MLModelIntegration {
  modelsEnabled: boolean;
  activeModels: Array<{
    modelId: string;
    modelName: string;
    modelType: 'classification' | 'regression' | 'clustering' | 'anomaly_detection' | 'forecasting';
    accuracy: number; // percentage
    lastTraining: Date;
    nextTraining: Date;
    predictionEndpoint: string;
    inputFeatures: string[];
    outputPredictions: string[];
  }>;
  autoMLEnabled: boolean;
  featureEngineering: {
    automatedFeatureSelection: boolean;
    featureImportance: { [feature: string]: number };
    derivedFeatures: string[];
  };
}

@Entity('analytics_datasets')
export class AnalyticsDataset extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  datasetCode: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('jsonb')
  dataSource: DataSource[];

  @Column('jsonb')
  schema: DataSchema;

  @Column({
    type: 'enum',
    enum: RefreshFrequency,
    default: RefreshFrequency.DAILY
  })
  refreshFrequency: RefreshFrequency;

  @Column('timestamp')
  lastRefresh: Date;

  @Column('timestamp')
  nextRefresh: Date;

  @Column('jsonb')
  dataQuality: DataQualityMetrics;

  @Column('jsonb')
  accessPermissions: AccessPermission[];

  @Column('jsonb')
  retentionPolicy: RetentionPolicy;

  @Column('jsonb')
  mlModelIntegration: MLModelIntegration;

  @Column('bigint')
  recordCount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  dataSizeGB: number;

  @Column('jsonb')
  usageStatistics: {
    queryCount: number;
    uniqueUsers: number;
    averageQueryTime: number; // milliseconds
    popularQueries: string[];
    lastAccessed: Date;
    accessFrequency: number; // per day
  };

  @Column('jsonb')
  businessMetrics: {
    businessValue: 'low' | 'medium' | 'high' | 'critical';
    usageTrend: 'increasing' | 'stable' | 'decreasing';
    stakeholders: string[];
    businessPurpose: string[];
    kpisSupported: string[];
  };

  @Column({ default: true })
  isActive: boolean;

  @Column('text', { nullable: true })
  dataLineage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isHealthy(): boolean {
    return this.dataQuality.overallQualityScore >= 80 &&
           this.dataQuality.qualityStatus !== DataQualityStatus.CRITICAL &&
           this.isRefreshCurrent();
  }

  isRefreshCurrent(): boolean {
    return new Date() <= this.nextRefresh;
  }

  isOverdue(): boolean {
    return new Date() > this.nextRefresh;
  }

  hasDataQualityIssues(): boolean {
    return this.dataQuality.issuesIdentified.some(issue => 
      issue.severity === 'high' || issue.severity === 'critical'
    );
  }

  canUserAccess(userId: string, accessType: string): boolean {
    const permission = this.accessPermissions.find(perm => 
      perm.userId === userId && 
      (perm.accessType === accessType || perm.accessType === 'admin' || perm.accessType === 'owner')
    );
    
    if (!permission) return false;
    
    // Check expiry
    if (permission.expiryDate && new Date() > permission.expiryDate) return false;
    
    return true;
  }

  getDataFreshness(): number {
    const now = new Date();
    const timeSinceRefresh = (now.getTime() - this.lastRefresh.getTime()) / (1000 * 60 * 60); // hours
    
    const freshnessThresholds = {
      [RefreshFrequency.REAL_TIME]: 0.017, // 1 minute
      [RefreshFrequency.EVERY_MINUTE]: 0.017,
      [RefreshFrequency.EVERY_5_MINUTES]: 0.083,
      [RefreshFrequency.EVERY_15_MINUTES]: 0.25,
      [RefreshFrequency.HOURLY]: 1,
      [RefreshFrequency.DAILY]: 24,
      [RefreshFrequency.WEEKLY]: 168,
      [RefreshFrequency.MONTHLY]: 720
    };
    
    const threshold = freshnessThresholds[this.refreshFrequency];
    return Math.max(0, 100 - ((timeSinceRefresh / threshold) * 100));
  }

  getDataQualityScore(): number {
    return this.dataQuality.overallQualityScore;
  }

  getUsageIntensity(): 'low' | 'medium' | 'high' | 'very_high' {
    const dailyQueries = this.usageStatistics.accessFrequency;
    
    if (dailyQueries >= 100) return 'very_high';
    if (dailyQueries >= 50) return 'high';
    if (dailyQueries >= 10) return 'medium';
    return 'low';
  }

  hasMLModelsEnabled(): boolean {
    return this.mlModelIntegration.modelsEnabled && this.mlModelIntegration.activeModels.length > 0;
  }

  getActiveMLModels(): any[] {
    return this.mlModelIntegration.activeModels.filter(model => 
      new Date(model.nextTraining) > new Date()
    );
  }

  requiresRetraining(): boolean {
    return this.mlModelIntegration.activeModels.some(model => 
      new Date() >= new Date(model.nextTraining)
    );
  }

  updateUsageStatistics(queryTime: number, userId: string): void {
    this.usageStatistics.queryCount++;
    this.usageStatistics.averageQueryTime = 
      (this.usageStatistics.averageQueryTime * 0.9) + (queryTime * 0.1); // Moving average
    this.usageStatistics.lastAccessed = new Date();
    
    // Update unique users (simplified)
    this.usageStatistics.uniqueUsers = Math.max(this.usageStatistics.uniqueUsers, 
      this.usageStatistics.queryCount / 10); // Estimate
  }

  scheduleNextRefresh(): void {
    const intervals = {
      [RefreshFrequency.REAL_TIME]: 0,
      [RefreshFrequency.EVERY_MINUTE]: 1,
      [RefreshFrequency.EVERY_5_MINUTES]: 5,
      [RefreshFrequency.EVERY_15_MINUTES]: 15,
      [RefreshFrequency.HOURLY]: 60,
      [RefreshFrequency.DAILY]: 1440,
      [RefreshFrequency.WEEKLY]: 10080,
      [RefreshFrequency.MONTHLY]: 43200
    };
    
    const intervalMinutes = intervals[this.refreshFrequency];
    this.nextRefresh = new Date(Date.now() + intervalMinutes * 60 * 1000);
  }

  performDataQualityCheck(): void {
    // Simulate data quality assessment
    const completeness = 95 + Math.random() * 5; // 95-100%
    const accuracy = 90 + Math.random() * 10; // 90-100%
    const consistency = 88 + Math.random() * 12; // 88-100%
    const timeliness = this.getDataFreshness();
    const validity = 92 + Math.random() * 8; // 92-100%
    const uniqueness = 98 + Math.random() * 2; // 98-100%
    
    const overallScore = (completeness + accuracy + consistency + timeliness + validity + uniqueness) / 6;
    
    let qualityStatus: DataQualityStatus;
    if (overallScore >= 95) qualityStatus = DataQualityStatus.EXCELLENT;
    else if (overallScore >= 85) qualityStatus = DataQualityStatus.GOOD;
    else if (overallScore >= 75) qualityStatus = DataQualityStatus.FAIR;
    else if (overallScore >= 60) qualityStatus = DataQualityStatus.POOR;
    elsequalityStatus = DataQualityStatus.CRITICAL;
    
    this.dataQuality = {
      completeness: Math.round(completeness * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      timeliness: Math.round(timeliness * 100) / 100,
      validity: Math.round(validity * 100) / 100,
      uniqueness: Math.round(uniqueness * 100) / 100,
      overallQualityScore: Math.round(overallScore * 100) / 100,
      qualityStatus,
      issuesIdentified: this.identifyDataQualityIssues(overallScore),
      lastQualityCheck: new Date(),
      nextQualityCheck: new Date(Date.now() + 24 * 60 * 60 * 1000) // Daily checks
    };
  }

  private identifyDataQualityIssues(overallScore: number): any[] {
    const issues = [];
    
    if (this.dataQuality.completeness < 90) {
      issues.push({
        issueType: 'completeness',
        description: 'Missing data detected in key fields',
        severity: this.dataQuality.completeness < 80 ? 'high' : 'medium',
        affectedRecords: Math.floor(this.recordCount * (1 - this.dataQuality.completeness / 100)),
        suggestedResolution: 'Implement data validation rules at source'
      });
    }
    
    if (this.dataQuality.accuracy < 85) {
      issues.push({
        issueType: 'accuracy',
        description: 'Data accuracy below threshold',
        severity: this.dataQuality.accuracy < 75 ? 'critical' : 'high',
        affectedRecords: Math.floor(this.recordCount * (1 - this.dataQuality.accuracy / 100)),
        suggestedResolution: 'Review data entry processes and implement validation'
      });
    }
    
    return issues;
  }

  enableMLModel(modelConfig: any): void {
    this.mlModelIntegration.modelsEnabled = true;
    
    const newModel = {
      modelId: crypto.randomUUID(),
      modelName: modelConfig.name,
      modelType: modelConfig.type,
      accuracy: 0,
      lastTraining: new Date(),
      nextTraining: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Weekly retraining
      predictionEndpoint: `/api/v1/ml/predictions/${modelConfig.name}`,
      inputFeatures: modelConfig.inputFeatures || [],
      outputPredictions: modelConfig.outputPredictions || []
    };
    
    this.mlModelIntegration.activeModels.push(newModel);
  }
}
