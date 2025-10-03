import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Financial Analytics Service for WriteCareNotes
 * @module FinancialAnalyticsService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Enterprise-grade financial analytics service providing comprehensive
 * financial modeling, forecasting, and analytics capabilities for care home operations
 * across the British Isles with full regulatory compliance.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * - GDPR (General Data Protection Regulation)
 * - PCI DSS (Payment Card Industry Data Security Standard)
 * - SOX (Sarbanes-Oxley Act) compliance preparation
 * - FCA (Financial Conduct Authority) regulations
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Decimal } from 'decimal.js';

import { FinancialTransaction } from '@/entities/financial/FinancialTransaction';
import { ChartOfAccounts } from '@/entities/financial/ChartOfAccounts';
import { FinancialPeriod } from '@/entities/financial/FinancialPeriod';
import { Budget } from '@/entities/financial/Budget';
import { Forecast } from '@/entities/financial/Forecast';
import { FinancialKPI } from '@/entities/financial/FinancialKPI';

import { DataIngestionEngine } from './engines/DataIngestionEngine';
import { ModelingEngine } from './engines/ModelingEngine';
import { ForecastingEngine } from './engines/ForecastingEngine';
import { AnalyticsEngine } from './engines/AnalyticsEngine';
import { ReportingEngine } from './engines/ReportingEngine';
import { DashboardEngine } from './engines/DashboardEngine';
import { IntegrationHub } from './integrations/IntegrationHub';
import { FinancialAPIGateway } from './api/FinancialAPIGateway';

import { AuditTrailService } from '@/services/audit/AuditTrailService';
import { ComplianceCheckService } from '@/services/compliance/ComplianceCheckService';
import { DataSecurityService } from '@/services/security/DataSecurityService';
import { GDPRComplianceService } from '@/services/gdpr/GDPRComplianceService';
import { FieldLevelEncryptionService } from '@/services/encryption/FieldLevelEncryptionService';
import { EventPublishingService } from '@/services/events/EventPublishingService';
import { NotificationService } from '@/services/notifications/NotificationService';

import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQueryParams,
  BudgetCreationRequest,
  ForecastRequest,
  AnalyticsRequest,
  ReportGenerationRequest,
  FinancialAnalyticsServiceInterface,
  FinancialTransactionResult,
  BudgetResult,
  ForecastResult,
  AnalyticsResult,
  ReportResult
} from './interfaces/FinancialAnalyticsInterfaces';

import {
  FinancialAnalyticsError,
  TransactionValidationError,
  BudgetValidationError,
  ComplianceViolationError,
  SecurityViolationError
} from './exceptions/FinancialAnalyticsExceptions';

import { FinancialValidationService } from './validation/FinancialValidationService';
import { FinancialSecurityService } from './security/FinancialSecurityService';
import { FinancialComplianceService } from './compliance/FinancialComplianceService';

/**
 * Main Financial Analytics Service implementing comprehensive financial management
 * capabilities with enterprise-grade security, compliance, and performance.
 */

export class FinancialAnalyticsService implements FinancialAnalyticsServiceInterface {
  // Logger removed

  constructor(
    
    private readonly transactionRepository: Repository<FinancialTransaction>,
    
    
    private readonly accountRepository: Repository<ChartOfAccounts>,
    
    
    private readonly periodRepository: Repository<FinancialPeriod>,
    
    
    private readonly budgetRepository: Repository<Budget>,
    
    
    private readonly forecastRepository: Repository<Forecast>,
    
    
    private readonly kpiRepository: Repository<FinancialKPI>,

    private readonly entityManager: EntityManager,
    private readonly eventEmitter: EventEmitter2,

    // Core Financial Engines
    private readonly dataIngestionEngine: DataIngestionEngine,
    private readonly modelingEngine: ModelingEngine,
    private readonly forecastingEngine: ForecastingEngine,
    private readonly analyticsEngine: AnalyticsEngine,
    private readonly reportingEngine: ReportingEngine,
    private readonly dashboardEngine: DashboardEngine,
    private readonly integrationHub: IntegrationHub,
    private readonly apiGateway: FinancialAPIGateway,

    // Healthcare Compliance Services
    private readonly auditService: AuditTrailService,
    private readonly complianceService: ComplianceCheckService,
    private readonly securityService: DataSecurityService,
    private readonly gdprService: GDPRComplianceService,
    private readonly encryptionService: FieldLevelEncryptionService,
    private readonly eventService: EventPublishingService,
    private readonly notificationService: NotificationService,

    // Financial-Specific Services
    private readonly validationService: FinancialValidationService,
    private readonly financialSecurityService: FinancialSecurityService,
    private readonly financialComplianceService: FinancialComplianceService
  ) {
    console.log('Financial Analytics Service initialized with enterprise compliance');
  }

  /**
   * Create a new financial transaction with comprehensive validation and compliance
   */
  async createTransaction(
    request: CreateTransactionRequest,
    userId: string,
    correlationId: string
  ): Promise<FinancialTransactionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Creating financial transaction', {
        correlationId,
        userId,
        amount: request.amount.toString(),
        accountId: request.accountId
      });

      // 1. Validate request data
      await this.validationService.validateTransactionRequest(request);

      // 2. Check GDPR compliance for financial data processing
      await this.gdprService.validateFinancialDataProcessing(request, userId);

      // 3. Perform security checks
      await this.financialSecurityService.validateTransactionSecurity(request, userId);

      // 4. Check financial compliance (PCI DSS, SOX, etc.)
      await this.financialComplianceService.validateTransactionCompliance(request);

      // 5. Encrypt sensitive financial data
      const encryptedTransaction = await this.encryptTransactionData(request);

      // 6. Create transaction in database with audit trail
      const transaction = await this.entityManager.transaction(async (manager) => {
        const newTransaction = manager.create(FinancialTransaction, {
          ...encryptedTransaction,
          createdBy: userId,
          correlationId,
          status: 'PENDING_APPROVAL'
        });

        const savedTransaction = await manager.save(newTransaction);

        // Log audit trail
        await this.auditService.logFinancialOperation({
          entityType: 'FinancialTransaction',
          entityId: savedTransaction.id,
          action: 'CREATE',
          userId,
          correlationId,
          oldValues: null,
          newValues: savedTransaction,
          gdprLawfulBasis: 'CONTRACT',
          clinicalJustification: 'Financial transaction processing for care services'
        });

        return savedTransaction;
      });

      // 7. Publish financial event for real-time processing
      await this.eventService.publishFinancialEvent({
        eventType: 'TRANSACTION_CREATED',
        entityId: transaction.id,
        payload: {
          transactionId: transaction.id,
          amount: request.amount.toString(),
          accountId: request.accountId,
          category: request.category
        },
        userId,
        correlationId
      });

      // 8. Send notifications for high-value transactions
      if (request.amount.greaterThan(new Decimal(10000))) {
        await this.notificationService.sendHighValueTransactionAlert({
          transactionId: transaction.id,
          amount: request.amount,
          userId,
          correlationId
        });
      }

      // 9. Update real-time financial metrics
      await this.updateFinancialMetrics(transaction);

      const responseTime = Date.now() - startTime;
      
      console.log('Financial transaction created successfully', {
        transactionId: transaction.id,
        correlationId,
        responseTime
      });

      return {
        success: true,
        transaction,
        correlationId,
        responseTime
      };

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      
      console.error('Failed to create financial transaction', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        correlationId,
        userId,
        responseTime
      });

      // Log security incident for financial errors
      await this.securityService.logSecurityIncident({
        incidentType: 'FINANCIAL_TRANSACTION_ERROR',
        severity: 'HIGH',
        userId,
        correlationId,
        details: {
          error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
          requestData: this.sanitizeRequestForLogging(request)
        }
      });

      throw new FinancialAnalyticsError(
        `Failed to create financial transaction: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`,
        'TRANSACTION_CREATION_FAILED',
        correlationId
      );
    }
  }

  /**
   * Retrieve financial transactions with advanced filtering and compliance
   */
  async getTransactions(
    params: TransactionQueryParams,
    userId: string,
    correlationId: string
  ): Promise<FinancialTransactionResult[]> {
    try {
      this.logger.debug('Retrieving financial transactions', {
        correlationId,
        userId,
        filters: params
      });

      // 1. Validate user permissions for financial data access
      await this.financialSecurityService.validateDataAccess(userId, 'TRANSACTION_READ');

      // 2. Apply GDPR data minimization
      const minimizedParams = await this.gdprService.applyDataMinimization(params, 'FINANCIAL_QUERY');

      // 3. Build secure query with encryption handling
      const queryBuilder = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.account', 'account')
        .where('transaction.deletedAt IS NULL');

      // Apply filters
      if (minimizedParams.accountId) {
        queryBuilder.andWhere('transaction.accountId = :accountId', { 
          accountId: minimizedParams.accountId 
        });
      }

      if (minimizedParams.dateFrom) {
        queryBuilder.andWhere('transaction.transactionDate >= :dateFrom', { 
          dateFrom: minimizedParams.dateFrom 
        });
      }

      if (minimizedParams.dateTo) {
        queryBuilder.andWhere('transaction.transactionDate <= :dateTo', { 
          dateTo: minimizedParams.dateTo 
        });
      }

      if (minimizedParams.category) {
        queryBuilder.andWhere('transaction.category = :category', { 
          category: minimizedParams.category 
        });
      }

      // Apply pagination
      const page = minimizedParams.page || 1;
      const limit = Math.min(minimizedParams.limit || 50, 1000); // Max 1000 records
      queryBuilder.skip((page - 1) * limit).take(limit);

      // Execute query
      const [transactions, total] = await queryBuilder.getManyAndCount();

      // 4. Decrypt sensitive data for authorized users
      const decryptedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          const decrypted = await this.decryptTransactionData(transaction);
          return {
            ...decrypted,
            // Apply field-level access control
            sensitiveFields: await this.applySensitiveFieldAccess(decrypted, userId)
          };
        })
      );

      // 5. Log data access for audit compliance
      await this.auditService.logDataAccess({
        entityType: 'FinancialTransaction',
        action: 'READ_MULTIPLE',
        userId,
        correlationId,
        recordCount: transactions.length,
        filters: minimizedParams
      });

      console.log('Financial transactions retrieved successfully', {
        count: transactions.length,
        total,
        correlationId
      });

      return decryptedTransactions.map(transaction => ({
        success: true,
        transaction,
        correlationId
      }));

    } catch (error: unknown) {
      console.error('Failed to retrieve financial transactions', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        correlationId,
        userId
      });

      throw new FinancialAnalyticsError(
        `Failed to retrieve transactions: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`,
        'TRANSACTION_RETRIEVAL_FAILED',
        correlationId
      );
    }
  }

  /**
   * Generate comprehensive financial forecasts with AI/ML models
   */
  async generateForecast(
    request: ForecastRequest,
    userId: string,
    correlationId: string
  ): Promise<ForecastResult> {
    try {
      this.logger.debug('Generating financial forecast', {
        correlationId,
        userId,
        forecastType: request.forecastType,
        periodMonths: request.periodMonths
      });

      // 1. Validate forecast request
      await this.validationService.validateForecastRequest(request);

      // 2. Check user permissions for forecasting
      await this.financialSecurityService.validateForecastAccess(userId);

      // 3. Gather historical data for modeling
      const historicalData = await this.dataIngestionEngine.gatherHistoricalData({
        entityType: request.entityType,
        entityId: request.entityId,
        lookbackMonths: request.lookbackMonths || 24,
        dataTypes: request.dataTypes
      });

      // 4. Apply forecasting algorithms
      const forecastResult = await this.forecastingEngine.generateForecast({
        historicalData,
        forecastType: request.forecastType,
        periodMonths: request.periodMonths,
        confidence: request.confidence || 0.95,
        methodology: request.methodology || 'ENSEMBLE',
        externalFactors: request.externalFactors
      });

      // 5. Validate forecast results
      await this.validationService.validateForecastResults(forecastResult);

      // 6. Store forecast with audit trail
      const forecast = await this.entityManager.transaction(async (manager) => {
        const newForecast = manager.create(Forecast, {
          ...forecastResult,
          createdBy: userId,
          correlationId,
          status: 'ACTIVE'
        });

        const savedForecast = await manager.save(newForecast);

        // Log audit trail
        await this.auditService.logFinancialOperation({
          entityType: 'Forecast',
          entityId: savedForecast.id,
          action: 'CREATE',
          userId,
          correlationId,
          newValues: savedForecast,
          gdprLawfulBasis: 'LEGITIMATE_INTEREST',
          clinicalJustification: 'Financial forecasting for care service planning'
        });

        return savedForecast;
      });

      // 7. Publish forecast event
      await this.eventService.publishFinancialEvent({
        eventType: 'FORECAST_GENERATED',
        entityId: forecast.id,
        payload: {
          forecastId: forecast.id,
          forecastType: request.forecastType,
          confidence: forecastResult.confidence,
          periodMonths: request.periodMonths
        },
        userId,
        correlationId
      });

      console.log('Financial forecast generated successfully', {
        forecastId: forecast.id,
        correlationId,
        confidence: forecastResult.confidence
      });

      return {
        success: true,
        forecast,
        correlationId,
        confidence: forecastResult.confidence,
        methodology: forecastResult.methodology
      };

    } catch (error: unknown) {
      console.error('Failed to generate financial forecast', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        correlationId,
        userId
      });

      throw new FinancialAnalyticsError(
        `Failed to generate forecast: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`,
        'FORECAST_GENERATION_FAILED',
        correlationId
      );
    }
  }

  /**
   * Private helper methods
   */

  private async encryptTransactionData(request: CreateTransactionRequest): Promise<any> {
    return {
      ...request,
      description: await this.encryptionService.encryptField(request.description),
      reference: request.reference ? await this.encryptionService.encryptField(request.reference) : null,
      metadata: request.metadata ? await this.encryptionService.encryptField(JSON.stringify(request.metadata)) : null
    };
  }

  private async decryptTransactionData(transaction: FinancialTransaction): Promise<FinancialTransaction> {
    return {
      ...transaction,
      description: await this.encryptionService.decryptField(transaction.description || ""),
      reference: transaction.reference ? await this.encryptionService.decryptField(transaction.reference || "") : null,
      metadata: transaction.metadata ? JSON.parse(await this.encryptionService.decryptField(transaction.metadata || "")) : null
    };
  }

  private async applySensitiveFieldAccess(transaction: FinancialTransaction, userId: string): Promise<any> {
    const userPermissions = await this.financialSecurityService.getUserPermissions(userId);
    
    // Apply field-level access control based on user permissions
    const sensitiveFields = {};
    
    if (userPermissions.includes('VIEW_FINANCIAL_DETAILS')) {
      sensitiveFields['amount'] = transaction.amount;
      sensitiveFields['reference'] = transaction.reference;
    }
    
    if (userPermissions.includes('VIEW_FINANCIAL_METADATA')) {
      sensitiveFields['metadata'] = transaction.metadata;
    }
    
    return sensitiveFields;
  }

  private sanitizeRequestForLogging(request: CreateTransactionRequest): any {
    return {
      accountId: request.accountId,
      category: request.category,
      amount: '[REDACTED]',
      description: '[REDACTED]',
      reference: '[REDACTED]'
    };
  }

  private async updateFinancialMetrics(transaction: FinancialTransaction): Promise<void> {
    // Update real-time financial KPIs and metrics
    await this.analyticsEngine.updateRealTimeMetrics({
      transactionId: transaction.id,
      amount: transaction.amount,
      category: transaction.category,
      accountId: transaction.accountId,
      timestamp: transaction.transactionDate
    });
  }
}

export default FinancialAnalyticsService;