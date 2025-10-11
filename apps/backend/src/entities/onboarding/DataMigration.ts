import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Data Migration Entity for Onboarding Data Migration
 * @module DataMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../BaseEntity';
import { MigrationMapping } from './MigrationMapping';

export interface MigrationConfig {
  sourceConnection: {
    type: 'database' | 'api' | 'file' | 'csv' | 'excel';
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    connectionString?: string;
    apiEndpoint?: string;
    filePath?: string;
    authentication?: any;
  };
  targetConnection: {
    type: 'postgresql' | 'mysql' | 'mssql';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    schema?: string;
  };
  mappingRules: {
    sourceTable: string;
    targetTable: string;
    fieldMappings: any[];
    transformationRules: any[];
    validationRules: any[];
  }[];
  validationRules: {
    requiredFields: string[];
    dataTypes: any[];
    const raints: any[];
    businessRules: any[];
  };
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
}

export interface MigrationResults {
  successCount: number;
  failureCount: number;
  warnings: string[];
  dataQualityIssues: {
    field: string;
    issue: string;
    count: number;
    examples: any[];
  }[];
  performanceMetrics: {
    recordsPerSecond: number;
    averageProcessingTime: number;
    peakMemoryUsage: number;
    totalExecutionTime: number;
  };
  dataIntegrityChecks: {
    checkName: string;
    passed: boolean;
    details: string;
    affectedRecords: number;
  }[];
}

@Entity('data_migrations')
export class DataMigration extends BaseEntity {
  @Column({ type: 'var char', length: 100, unique: true })
  migrationName!: string;

  @Column({ type: 'var char', length: 255 })
  description!: string;

  @Column({ type: 'var char', length: 50 })
  sourceSystem!: string;

  @Column({ type: 'var char', length: 50 })
  targetSystem!: string;

  @Column({ type: 'var char', length: 50 })
  migrationType!: 'full' | 'incremental' | 'delta' | 'sync';

  @Column({ type: 'jsonb' })
  migrationConfig!: MigrationConfig;

  @Column({ type: 'var char', length: 20 })
  status!: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back' | 'paused';

  @Column({ type: 'integer', default: 0 })
  totalRecords!: number;

  @Column({ type: 'integer', default: 0 })
  processedRecords!: number;

  @Column({ type: 'integer', default: 0 })
  successfulRecords!: number;

  @Column({ type: 'integer', default: 0 })
  failedRecords!: number;

  @Column({ type: 'integer', default: 0 })
  skippedRecords!: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastProcessedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  errorLog!: {
    timestamp: Date;
    level: 'error' | 'warning' | 'info';
    message: string;
    details: any;
    recordId?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  migrationResults?: MigrationResults;

  @Column({ type: 'jsonb', nullable: true })
  rollbackInfo?: {
    rollbackAvailable: boolean;
    rollbackScript?: string;
    rollbackData?: any;
    rollbackTimestamp?: Date;
  };

  @Column({ type: 'var char', length: 100, nullable: true })
  executedBy?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  progressTracking?: {
    currentBatch: number;
    totalBatches: number;
    currentTable: string;
    estimatedCompletion: Date;
    processingSpeed: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  dataQualityReport?: {
    overallScore: number;
    completenessScore: number;
    accuracyScore: number;
    consistencyScore: number;
    validityScore: number;
    issues: {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      count: number;
      description: string;
      recommendations: string[];
    }[];
  };

  @Column({ type: 'boolean', default: false })
  isDryRun!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresApproval!: boolean;

  @Column({ type: 'var char', length: 500, nullable: true })
  notes?: string;

  // Relationships
  @OneToMany(() => MigrationMapping, mapping => mapping.migration)
  mappings!: MigrationMapping[];

  // Business Logic Methods
  getProgressPercentage(): number {
    if (this.totalRecords === 0) return 0;
    return Math.round((this.processedRecords / this.totalRecords) * 100);
  }

  getSuccessRate(): number {
    if (this.processedRecords === 0) return 0;
    return Math.round((this.successfulRecords / this.processedRecords) * 100);
  }

  getFailureRate(): number {
    if (this.processedRecords === 0) return 0;
    return Math.round((this.failedRecords / this.processedRecords) * 100);
  }

  isRunning(): boolean {
    return this.status === 'running';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  canStart(): boolean {
    return this.status === 'pending' && this.approvedBy !== null;
  }

  canPause(): boolean {
    return this.status === 'running';
  }

  canResume(): boolean {
    return this.status === 'paused';
  }

  canRollback(): boolean {
    return this.status === 'completed' && this.rollbackInfo?.rollbackAvailable === true;
  }

  getEstimatedTimeRemaining(): number {
    if (!this.progressTracking || this.progressTracking.processingSpeed === 0) {
      return 0;
    }

    const remainingRecords = this.totalRecords - this.processedRecords;
    return Math.round(remainingRecords / this.progressTracking.processingSpeed);
  }

  addError(level: 'error' | 'warning' | 'info', message: string, details?: any, recordId?: string): void {
    if (!this.errorLog) {
      this.errorLog = [];
    }

    this.errorLog.push({
      timestamp: new Date(),
      level,
      message,
      details,
      recordId
    });
  }

  updateProgress(processed: number, successful: number, failed: number, skipped: number = 0): void {
    this.processedRecords = processed;
    this.successfulRecords = successful;
    this.failedRecords = failed;
    this.skippedRecords = skipped;
    this.lastProcessedAt = new Date();

    // Update progress tracking
    if (!this.progressTracking) {
      this.progressTracking = {
        currentBatch: 1,
        totalBatches: Math.ceil(this.totalRecords / this.migrationConfig.batchSize),
        currentTable: '',
        estimatedCompletion: new Date(),
        processingSpeed: 0
      };
    }

    // Calculate processing speed (records per second)
    if (this.startedAt) {
      const elapsedSeconds = (new Date().getTime() - this.startedAt.getTime()) / 1000;
      this.progressTracking.processingSpeed = Math.round(processed / elapsedSeconds);
    }

    // Estimate completion time
    if (this.progressTracking.processingSpeed > 0) {
      const remainingRecords = this.totalRecords - processed;
      const estimatedSecondsRemaining = remainingRecords / this.progressTracking.processingSpeed;
      this.progressTracking.estimatedCompletion = new Date(Date.now() + estimatedSecondsRemaining * 1000);
    }
  }

  startMigration(executedBy: string): void {
    if (!this.canStart()) {
      throw new Error('Migration cannot be started in current status');
    }

    this.status = 'running';
    this.startedAt = new Date();
    this.executedBy = executedBy;
    this.lastProcessedAt = new Date();
  }

  pauseMigration(): void {
    if (!this.canPause()) {
      throw new Error('Migration cannot be paused in current status');
    }

    this.status = 'paused';
  }

  resumeMigration(): void {
    if (!this.canResume()) {
      throw new Error('Migration cannot be resumed in current status');
    }

    this.status = 'running';
  }

  completeMigration(results: MigrationResults): void {
    this.status = 'completed';
    this.completedAt = new Date();
    this.migrationResults = results;
    this.successfulRecords = results.successCount;
    this.failedRecords = results.failureCount;
  }

  failMigration(error: string): void {
    this.status = 'failed';
    this.completedAt = new Date();
    this.addError('error', error);
  }

  rollbackMigration(rollbackData: any): void {
    if (!this.canRollback()) {
      throw new Error('Migration cannot be rolled back');
    }

    this.status = 'rolled_back';
    this.rollbackInfo = {
      ...this.rollbackInfo,
      rollbackData,
      rollbackTimestamp: new Date()
    };
  }

  approveMigration(approvedBy: string): void {
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
  }

  generateDataQualityReport(): void {
    if (!this.migrationResults) return;

    const issues = this.migrationResults.dataQualityIssues;
    const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);
    const totalRecords = this.totalRecords;

    // Calculate scores
    const completenessScore = Math.max(0, 100 - (totalIssues / totalRecords) * 100);
    const accuracyScore = Math.max(0, 100 - (this.failedRecords / totalRecords) * 100);
    const consistencyScore = Math.max(0, 100 - (issues.filter(i => i.issue.includes('consistency')).length / totalRecords) * 100);
    const validityScore = Math.max(0, 100 - (issues.filter(i => i.issue.includes('valid')).length / totalRecords) * 100);

    const overallScore = (completenessScore + accuracyScore + consistencyScore + validityScore) / 4;

    this.dataQualityReport = {
      overallScore: Math.round(overallScore),
      completenessScore: Math.round(completenessScore),
      accuracyScore: Math.round(accuracyScore),
      consistencyScore: Math.round(consistencyScore),
      validityScore: Math.round(validityScore),
      issues: issues.map(issue => ({
        type: issue.field,
        severity: issue.count > totalRecords * 0.1 ? 'high' : issue.count > totalRecords * 0.05 ? 'medium' : 'low',
        count: issue.count,
        description: issue.issue,
        recommendations: this.generateRecommendations(issue.issue)
      }))
    };
  }

  private generateRecommendations(issue: string): string[] {
    const recommendations: any[] = [];

    if (issue.includes('missing')) {
      recommendations.push('Implement data validation to ensure required fields are populated');
      recommendations.push('Add default values for non-critical missing fields');
    }

    if (issue.includes('format')) {
      recommendations.push('Standardize data format before migration');
      recommendations.push('Implement data transformation rules');
    }

    if (issue.includes('duplicate')) {
      recommendations.push('Implement deduplication logic');
      recommendations.push('Add unique const raints in target system');
    }

    if (issue.includes('invalid')) {
      recommendations.push('Validate data against business rules');
      recommendations.push('Implement data cleansing procedures');
    }

    return recommendations;
  }

  getMigrationSummary(): any {
    return {
      id: this.id,
      migrationName: this.migrationName,
      status: this.status,
      progress: this.getProgressPercentage(),
      successRate: this.getSuccessRate(),
      failureRate: this.getFailureRate(),
      totalRecords: this.totalRecords,
      processedRecords: this.processedRecords,
      successfulRecords: this.successfulRecords,
      failedRecords: this.failedRecords,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
      dataQualityScore: this.dataQualityReport?.overallScore || 0
    };
  }
}
