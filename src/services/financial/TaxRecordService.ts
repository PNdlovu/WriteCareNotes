import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Tax Record Service for WriteCareNotes
 * @module TaxRecordService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive tax record management service with HMRC compliance,
 * tax calculations, and reporting for healthcare operations.
 * 
 * @compliance
 * - HMRC (Her Majesty's Revenue and Customs) regulations
 * - PAYE (Pay As You Earn) compliance
 * - VAT (Value Added Tax) regulations
 * - Corporation Tax compliance
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like, IsNull, Not } from 'typeorm';
import { Decimal } from 'decimal.js';
import * as dayjs from 'dayjs';

import { TaxRecord, TaxType, TaxStatus, TaxPeriod } from '@/entities/financial/TaxRecord';
import { ChartOfAccounts } from '@/entities/financial/ChartOfAccounts';
import { FinancialTransaction } from '@/entities/financial/FinancialTransaction';
import { HealthcareEncryption } from '@/utils/encryption';
import { logger as appLogger } from '@/utils/logger';

export interface CreateTaxRecordRequest {
  taxYear: string;
  taxType: TaxType;
  taxPeriod: TaxPeriod;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  taxableAmount: number;
  taxRate?: number;
  employeeId?: string;
  employeeName?: string;
  nationalInsuranceNumber?: string;
  utr?: string;
  hmrcReference?: string;
  regulatoryCode?: string;
  isHMRCReturnable?: boolean;
  isPensionReturnable?: boolean;
  accountId: string;
  createdBy: string;
}

export interface UpdateTaxRecordRequest {
  taxableAmount?: number;
  taxRate?: number;
  hmrcReference?: string;
  regulatoryCode?: string;
  isHMRCReturnable?: boolean;
  isPensionReturnable?: boolean;
  updatedBy: string;
}

export interface SubmitTaxRecordRequest {
  taxRecordId: string;
  submittedBy: string;
  hmrcSubmissionId?: string;
  hmrcResponse?: string;
}

export interface ProcessPaymentRequest {
  taxRecordId: string;
  amount: number;
  paymentDate: Date;
  paymentReference?: string;
  processedBy: string;
}

export interface TaxRecordFilters {
  taxYear?: string;
  taxType?: TaxType[];
  taxPeriod?: TaxPeriod[];
  status?: TaxStatus[];
  employeeId?: string;
  utr?: string;
  hmrcReference?: string;
  isHMRCReturnable?: boolean;
  isPensionReturnable?: boolean;
  isLate?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TaxRecordListResponse {
  taxRecords: TaxRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    overdueAmount: string;
    overdueCount: number;
    hmrcReturnableCount: number;
    pensionReturnableCount: number;
  };
}

export interface TaxCalculationResult {
  taxAmount: number;
  personalAllowance: number;
  basicRateAmount: number;
  higherRateAmount: number;
  additionalRateAmount: number;
  basicRate: number;
  higherRate: number;
  additionalRate: number;
  taxablePay: number;
}

@Injectable()
export class TaxRecordService {
  private readonly logger = new Logger(TaxRecordService.name);

  constructor(
    @InjectRepository(TaxRecord)
    private taxRecordRepository: Repository<TaxRecord>,
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
    @InjectRepository(FinancialTransaction)
    private financialTransactionRepository: Repository<FinancialTransaction>,
  ) {}

  /**
   * Create a new tax record
   */
  async createTaxRecord(request: CreateTaxRecordRequest): Promise<TaxRecord> {
    this.logger.log(`Creating tax record for ${request.taxType}`);
    
    try {
      // Validate request
      this.validateCreateTaxRecordRequest(request);

      // Get account
      const account = await this.chartOfAccountsRepository.findOne({
        where: { id: request.accountId },
      });
      if (!account) {
        throw new Error('Account not found');
      }

      // Create tax record
      const taxRecord = this.taxRecordRepository.create({
        taxYear: request.taxYear,
        taxType: request.taxType,
        taxPeriod: request.taxPeriod,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        dueDate: request.dueDate,
        taxableAmount: new Decimal(request.taxableAmount),
        taxRate: new Decimal(request.taxRate || 0),
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        nationalInsuranceNumber: request.nationalInsuranceNumber,
        utr: request.utr,
        hmrcReference: request.hmrcReference,
        regulatoryCode: request.regulatoryCode,
        isHMRCReturnable: request.isHMRCReturnable || false,
        isPensionReturnable: request.isPensionReturnable || false,
        accountId: request.accountId,
        createdBy: request.createdBy,
        status: TaxStatus.DRAFT,
        currency: 'GBP',
      });

      const savedTaxRecord = await this.taxRecordRepository.save(taxRecord);

      // Create financial transaction
      await this.createFinancialTransaction(savedTaxRecord);

      this.logger.log(`Tax record created successfully: ${savedTaxRecord.id}`);
      return savedTaxRecord;

    } catch (error) {
      this.logger.error(`Failed to create tax record: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing tax record
   */
  async updateTaxRecord(taxRecordId: string, request: UpdateTaxRecordRequest): Promise<TaxRecord> {
    this.logger.log(`Updating tax record: ${taxRecordId}`);
    
    try {
      const taxRecord = await this.getTaxRecordById(taxRecordId);
      if (!taxRecord) {
        throw new Error('Tax record not found');
      }

      if (taxRecord.status !== TaxStatus.DRAFT) {
        throw new Error('Only draft tax records can be updated');
      }

      // Update fields
      if (request.taxableAmount !== undefined) taxRecord.taxableAmount = new Decimal(request.taxableAmount);
      if (request.taxRate !== undefined) taxRecord.taxRate = new Decimal(request.taxRate);
      if (request.hmrcReference !== undefined) taxRecord.hmrcReference = request.hmrcReference;
      if (request.regulatoryCode !== undefined) taxRecord.regulatoryCode = request.regulatoryCode;
      if (request.isHMRCReturnable !== undefined) taxRecord.isHMRCReturnable = request.isHMRCReturnable;
      if (request.isPensionReturnable !== undefined) taxRecord.isPensionReturnable = request.isPensionReturnable;

      taxRecord.updatedBy = request.updatedBy;

      const updatedTaxRecord = await this.taxRecordRepository.save(taxRecord);

      this.logger.log(`Tax record updated successfully: ${taxRecordId}`);
      return updatedTaxRecord;

    } catch (error) {
      this.logger.error(`Failed to update tax record: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate tax for a tax record
   */
  async calculateTax(taxRecordId: string, calculatedBy: string): Promise<TaxRecord> {
    this.logger.log(`Calculating tax for record: ${taxRecordId}`);
    
    try {
      const taxRecord = await this.getTaxRecordById(taxRecordId);
      if (!taxRecord) {
        throw new Error('Tax record not found');
      }

      if (taxRecord.status !== TaxStatus.DRAFT) {
        throw new Error('Only draft tax records can be calculated');
      }

      // Calculate tax based on type
      const calculation = await this.performTaxCalculation(taxRecord);

      // Update tax record with calculation
      taxRecord.taxAmount = new Decimal(calculation.taxAmount);
      taxRecord.personalAllowance = new Decimal(calculation.personalAllowance);
      taxRecord.basicRateAmount = new Decimal(calculation.basicRateAmount);
      taxRecord.higherRateAmount = new Decimal(calculation.higherRateAmount);
      taxRecord.additionalRateAmount = new Decimal(calculation.additionalRateAmount);
      taxRecord.basicRate = new Decimal(calculation.basicRate);
      taxRecord.higherRate = new Decimal(calculation.higherRate);
      taxRecord.additionalRate = new Decimal(calculation.additionalRate);
      taxRecord.taxablePay = new Decimal(calculation.taxablePay);
      taxRecord.totalAmount = taxRecord.taxAmount.plus(taxRecord.interestAmount).plus(taxRecord.penaltyAmount);
      taxRecord.balanceAmount = taxRecord.totalAmount.minus(taxRecord.paidAmount);
      taxRecord.status = TaxStatus.CALCULATED;
      taxRecord.calculatedBy = calculatedBy;
      taxRecord.calculatedDate = new Date();

      const updatedTaxRecord = await this.taxRecordRepository.save(taxRecord);

      this.logger.log(`Tax calculated successfully: ${taxRecordId}`);
      return updatedTaxRecord;

    } catch (error) {
      this.logger.error(`Failed to calculate tax: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Submit tax record to HMRC
   */
  async submitTaxRecord(request: SubmitTaxRecordRequest): Promise<TaxRecord> {
    this.logger.log(`Submitting tax record: ${request.taxRecordId}`);
    
    try {
      const taxRecord = await this.getTaxRecordById(request.taxRecordId);
      if (!taxRecord) {
        throw new Error('Tax record not found');
      }

      if (taxRecord.status !== TaxStatus.CALCULATED) {
        throw new Error('Only calculated tax records can be submitted');
      }

      taxRecord.status = TaxStatus.SUBMITTED;
      taxRecord.submittedBy = request.submittedBy;
      taxRecord.submittedDate = new Date();
      taxRecord.hmrcSubmissionId = request.hmrcSubmissionId;
      taxRecord.hmrcResponse = request.hmrcResponse;

      const updatedTaxRecord = await this.taxRecordRepository.save(taxRecord);

      this.logger.log(`Tax record submitted successfully: ${request.taxRecordId}`);
      return updatedTaxRecord;

    } catch (error) {
      this.logger.error(`Failed to submit tax record: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process payment for tax record
   */
  async processPayment(request: ProcessPaymentRequest): Promise<TaxRecord> {
    this.logger.log(`Processing payment for tax record: ${request.taxRecordId}`);
    
    try {
      const taxRecord = await this.getTaxRecordById(request.taxRecordId);
      if (!taxRecord) {
        throw new Error('Tax record not found');
      }

      const paymentAmount = new Decimal(request.amount);
      if (paymentAmount.lessThanOrEqualTo(0)) {
        throw new Error('Payment amount must be positive');
      }

      if (paymentAmount.greaterThan(taxRecord.balanceAmount)) {
        throw new Error('Payment amount cannot exceed balance');
      }

      taxRecord.recordPayment(paymentAmount);
      taxRecord.updatedBy = request.processedBy;

      const updatedTaxRecord = await this.taxRecordRepository.save(taxRecord);

      // Create payment transaction
      await this.createPaymentTransaction(updatedTaxRecord, paymentAmount, request.paymentReference);

      this.logger.log(`Payment processed successfully: ${request.taxRecordId}`);
      return updatedTaxRecord;

    } catch (error) {
      this.logger.error(`Failed to process payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get tax record by ID
   */
  async getTaxRecordById(taxRecordId: string): Promise<TaxRecord | null> {
    return await this.taxRecordRepository.findOne({
      where: { id: taxRecordId },
      relations: ['account'],
    });
  }

  /**
   * List tax records with filters and pagination
   */
  async listTaxRecords(filters: TaxRecordFilters = {}): Promise<TaxRecordListResponse> {
    this.logger.log('Listing tax records with filters');
    
    try {
      const query = this.taxRecordRepository.createQueryBuilder('taxRecord')
        .leftJoinAndSelect('taxRecord.account', 'account');

      // Apply filters
      if (filters.taxYear) {
        query.andWhere('taxRecord.taxYear = :taxYear', { taxYear: filters.taxYear });
      }

      if (filters.taxType && filters.taxType.length > 0) {
        query.andWhere('taxRecord.taxType IN (:...taxType)', { taxType: filters.taxType });
      }

      if (filters.taxPeriod && filters.taxPeriod.length > 0) {
        query.andWhere('taxRecord.taxPeriod IN (:...taxPeriod)', { taxPeriod: filters.taxPeriod });
      }

      if (filters.status && filters.status.length > 0) {
        query.andWhere('taxRecord.status IN (:...status)', { status: filters.status });
      }

      if (filters.employeeId) {
        query.andWhere('taxRecord.employeeId = :employeeId', { employeeId: filters.employeeId });
      }

      if (filters.utr) {
        query.andWhere('taxRecord.utr = :utr', { utr: filters.utr });
      }

      if (filters.hmrcReference) {
        query.andWhere('taxRecord.hmrcReference = :hmrcReference', { hmrcReference: filters.hmrcReference });
      }

      if (filters.isHMRCReturnable !== undefined) {
        query.andWhere('taxRecord.isHMRCReturnable = :isHMRCReturnable', { isHMRCReturnable: filters.isHMRCReturnable });
      }

      if (filters.isPensionReturnable !== undefined) {
        query.andWhere('taxRecord.isPensionReturnable = :isPensionReturnable', { isPensionReturnable: filters.isPensionReturnable });
      }

      if (filters.isLate) {
        query.andWhere('taxRecord.isLate = :isLate', { isLate: true });
      }

      if (filters.dateFrom) {
        query.andWhere('taxRecord.periodStart >= :dateFrom', { dateFrom: filters.dateFrom });
      }

      if (filters.dateTo) {
        query.andWhere('taxRecord.periodEnd <= :dateTo', { dateTo: filters.dateTo });
      }

      if (filters.amountFrom) {
        query.andWhere('taxRecord.taxAmount >= :amountFrom', { amountFrom: filters.amountFrom });
      }

      if (filters.amountTo) {
        query.andWhere('taxRecord.taxAmount <= :amountTo', { amountTo: filters.amountTo });
      }

      if (filters.search) {
        query.andWhere(
          '(taxRecord.hmrcReference ILIKE :search OR taxRecord.employeeName ILIKE :search OR taxRecord.utr ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'periodStart';
      const sortOrder = filters.sortOrder || 'DESC';
      query.orderBy(`taxRecord.${sortBy}`, sortOrder);

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      query.skip(offset).take(limit);

      const [taxRecords, total] = await query.getManyAndCount();

      // Calculate summary
      const summary = await this.calculateTaxRecordSummary(filters);

      return {
        taxRecords,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary,
      };

    } catch (error) {
      this.logger.error(`Failed to list tax records: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get tax record statistics
   */
  async getTaxRecordStatistics(period: 'month' | 'quarter' | 'year' = 'month'): Promise<{
    totalRecords: number;
    totalAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    overdueAmount: string;
    overdueCount: number;
    hmrcReturnableCount: number;
    pensionReturnableCount: number;
    typeBreakdown: Record<string, string>;
  }> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const taxRecords = await this.taxRecordRepository.find({
      where: {
        periodStart: Between(startDate, now),
      },
    });

    const stats = {
      totalRecords: taxRecords.length,
      totalAmount: '0.00',
      paidAmount: '0.00',
      outstandingAmount: '0.00',
      overdueAmount: '0.00',
      overdueCount: 0,
      hmrcReturnableCount: 0,
      pensionReturnableCount: 0,
      typeBreakdown: {} as Record<string, string>,
    };

    let totalAmount = new Decimal(0);
    let paidAmount = new Decimal(0);
    let overdueAmount = new Decimal(0);
    const typeTotals: Record<string, Decimal> = {};

    taxRecords.forEach(taxRecord => {
      totalAmount = totalAmount.plus(taxRecord.totalAmount);
      paidAmount = paidAmount.plus(taxRecord.paidAmount);

      if (taxRecord.isOverdue()) {
        overdueAmount = overdueAmount.plus(taxRecord.balanceAmount);
        stats.overdueCount++;
      }

      if (taxRecord.isHMRCReturnable) {
        stats.hmrcReturnableCount++;
      }

      if (taxRecord.isPensionReturnable) {
        stats.pensionReturnableCount++;
      }

      // Type breakdown
      if (!typeTotals[taxRecord.taxType]) {
        typeTotals[taxRecord.taxType] = new Decimal(0);
      }
      typeTotals[taxRecord.taxType] = typeTotals[taxRecord.taxType].plus(taxRecord.totalAmount);
    });

    const outstandingAmount = totalAmount.minus(paidAmount);

    stats.totalAmount = totalAmount.toFixed(2);
    stats.paidAmount = paidAmount.toFixed(2);
    stats.outstandingAmount = outstandingAmount.toFixed(2);
    stats.overdueAmount = overdueAmount.toFixed(2);

    // Convert type totals to strings
    Object.keys(typeTotals).forEach(type => {
      stats.typeBreakdown[type] = typeTotals[type].toFixed(2);
    });

    return stats;
  }

  /**
   * Perform tax calculation based on tax type
   */
  private async performTaxCalculation(taxRecord: TaxRecord): Promise<TaxCalculationResult> {
    switch (taxRecord.taxType) {
      case TaxType.INCOME_TAX:
        return this.calculateIncomeTax(taxRecord);
      case TaxType.NATIONAL_INSURANCE:
        return this.calculateNationalInsurance(taxRecord);
      case TaxType.VAT:
        return this.calculateVAT(taxRecord);
      case TaxType.CORPORATION_TAX:
        return this.calculateCorporationTax(taxRecord);
      default:
        return this.calculateGenericTax(taxRecord);
    }
  }

  /**
   * Calculate income tax
   */
  private calculateIncomeTax(taxRecord: TaxRecord): TaxCalculationResult {
    const personalAllowance = new Decimal(12570); // 2023/24 tax year
    const basicRateThreshold = new Decimal(50270);
    const higherRateThreshold = new Decimal(125140);
    
    const taxableAmount = taxRecord.taxableAmount;
    const taxablePay = taxableAmount.minus(personalAllowance);
    
    let taxAmount = new Decimal(0);
    let basicRateAmount = new Decimal(0);
    let higherRateAmount = new Decimal(0);
    let additionalRateAmount = new Decimal(0);
    
    if (taxablePay.greaterThan(0)) {
      if (taxablePay.lessThanOrEqualTo(basicRateThreshold.minus(personalAllowance))) {
        // Basic rate: 20%
        basicRateAmount = taxablePay;
        taxAmount = taxablePay.times(0.20);
      } else if (taxablePay.lessThanOrEqualTo(higherRateThreshold.minus(personalAllowance))) {
        // Basic rate + Higher rate: 20% + 40%
        basicRateAmount = basicRateThreshold.minus(personalAllowance);
        higherRateAmount = taxablePay.minus(basicRateAmount);
        taxAmount = basicRateAmount.times(0.20).plus(higherRateAmount.times(0.40));
      } else {
        // All rates: 20% + 40% + 45%
        basicRateAmount = basicRateThreshold.minus(personalAllowance);
        higherRateAmount = higherRateThreshold.minus(basicRateThreshold);
        additionalRateAmount = taxablePay.minus(higherRateThreshold.minus(personalAllowance));
        taxAmount = basicRateAmount.times(0.20)
          .plus(higherRateAmount.times(0.40))
          .plus(additionalRateAmount.times(0.45));
      }
    }
    
    return {
      taxAmount: taxAmount.toNumber(),
      personalAllowance: personalAllowance.toNumber(),
      basicRateAmount: basicRateAmount.toNumber(),
      higherRateAmount: higherRateAmount.toNumber(),
      additionalRateAmount: additionalRateAmount.toNumber(),
      basicRate: 0.20,
      higherRate: 0.40,
      additionalRate: 0.45,
      taxablePay: taxablePay.toNumber(),
    };
  }

  /**
   * Calculate National Insurance
   */
  private calculateNationalInsurance(taxRecord: TaxRecord): TaxCalculationResult {
    // Class 1 NIC rates for 2023/24
    const primaryThreshold = new Decimal(242); // Weekly
    const upperEarningsLimit = new Decimal(967); // Weekly
    
    const weeklyTaxable = taxRecord.taxableAmount.dividedBy(52);
    
    let taxAmount = new Decimal(0);
    
    if (weeklyTaxable.greaterThan(primaryThreshold)) {
      const earningsAboveThreshold = weeklyTaxable.minus(primaryThreshold);
      
      if (weeklyTaxable.lessThanOrEqualTo(upperEarningsLimit)) {
        // 12% on earnings between primary threshold and upper earnings limit
        taxAmount = earningsAboveThreshold.times(0.12);
      } else {
        // 12% on earnings up to upper limit, 2% on earnings above
        const earningsUpToLimit = upperEarningsLimit.minus(primaryThreshold);
        const earningsAboveLimit = weeklyTaxable.minus(upperEarningsLimit);
        
        taxAmount = earningsUpToLimit.times(0.12).plus(earningsAboveLimit.times(0.02));
      }
    }
    
    const annualTaxAmount = taxAmount.times(52);
    
    return {
      taxAmount: annualTaxAmount.toNumber(),
      personalAllowance: 0,
      basicRateAmount: 0,
      higherRateAmount: 0,
      additionalRateAmount: 0,
      basicRate: 0.12,
      higherRate: 0.02,
      additionalRate: 0,
      taxablePay: taxRecord.taxableAmount.toNumber(),
    };
  }

  /**
   * Calculate VAT
   */
  private calculateVAT(taxRecord: TaxRecord): TaxCalculationResult {
    const vatNet = taxRecord.vatOutput.minus(taxRecord.vatInput);
    
    return {
      taxAmount: vatNet.toNumber(),
      personalAllowance: 0,
      basicRateAmount: 0,
      higherRateAmount: 0,
      additionalRateAmount: 0,
      basicRate: 0.20, // Standard VAT rate
      higherRate: 0,
      additionalRate: 0,
      taxablePay: taxRecord.taxableAmount.toNumber(),
    };
  }

  /**
   * Calculate Corporation Tax
   */
  private calculateCorporationTax(taxRecord: TaxRecord): TaxCalculationResult {
    const smallProfitsThreshold = new Decimal(50000);
    const largeProfitsThreshold = new Decimal(250000);
    
    const taxableAmount = taxRecord.taxableAmount;
    let taxAmount = new Decimal(0);
    
    if (taxableAmount.lessThanOrEqualTo(smallProfitsThreshold)) {
      // Small profits rate: 19%
      taxAmount = taxableAmount.times(0.19);
    } else if (taxableAmount.lessThanOrEqualTo(largeProfitsThreshold)) {
      // Marginal relief calculation (simplified)
      taxAmount = taxableAmount.times(0.25);
    } else {
      // Large profits rate: 25%
      taxAmount = taxableAmount.times(0.25);
    }
    
    return {
      taxAmount: taxAmount.toNumber(),
      personalAllowance: 0,
      basicRateAmount: 0,
      higherRateAmount: 0,
      additionalRateAmount: 0,
      basicRate: 0.19,
      higherRate: 0.25,
      additionalRate: 0,
      taxablePay: taxableAmount.toNumber(),
    };
  }

  /**
   * Calculate generic tax
   */
  private calculateGenericTax(taxRecord: TaxRecord): TaxCalculationResult {
    const taxAmount = taxRecord.taxableAmount.times(taxRecord.taxRate);
    
    return {
      taxAmount: taxAmount.toNumber(),
      personalAllowance: 0,
      basicRateAmount: 0,
      higherRateAmount: 0,
      additionalRateAmount: 0,
      basicRate: taxRecord.taxRate.toNumber(),
      higherRate: 0,
      additionalRate: 0,
      taxablePay: taxRecord.taxableAmount.toNumber(),
    };
  }

  /**
   * Validate create tax record request
   */
  private validateCreateTaxRecordRequest(request: CreateTaxRecordRequest): void {
    if (!request.taxYear) {
      throw new Error('Tax year is required');
    }

    if (!request.taxType) {
      throw new Error('Tax type is required');
    }

    if (!request.taxPeriod) {
      throw new Error('Tax period is required');
    }

    if (!request.periodStart || !request.periodEnd) {
      throw new Error('Period start and end dates are required');
    }

    if (request.periodStart >= request.periodEnd) {
      throw new Error('Period start must be before period end');
    }

    if (!request.dueDate) {
      throw new Error('Due date is required');
    }

    if (request.dueDate < request.periodEnd) {
      throw new Error('Due date cannot be before period end');
    }

    if (!request.taxableAmount || request.taxableAmount <= 0) {
      throw new Error('Taxable amount must be positive');
    }

    if (!request.accountId) {
      throw new Error('Account ID is required');
    }
  }

  /**
   * Create financial transaction for tax record
   */
  private async createFinancialTransaction(taxRecord: TaxRecord): Promise<void> {
    const transaction = this.financialTransactionRepository.create({
      transactionDate: taxRecord.periodStart,
      amount: taxRecord.taxAmount.negated(), // Negative amount for tax
      currency: taxRecord.currency,
      description: `Tax ${taxRecord.taxType} for ${taxRecord.taxYear}: ${taxRecord.taxPeriod}`,
      category: 'TAX',
      status: 'APPROVED',
      reference: taxRecord.hmrcReference,
      accountId: taxRecord.accountId,
      correlationId: taxRecord.correlationId,
      regulatoryCode: taxRecord.regulatoryCode,
      createdBy: taxRecord.createdBy,
    });

    await this.financialTransactionRepository.save(transaction);
  }

  /**
   * Create payment transaction
   */
  private async createPaymentTransaction(taxRecord: TaxRecord, paymentAmount: Decimal, paymentReference?: string): Promise<void> {
    const transaction = this.financialTransactionRepository.create({
      transactionDate: new Date(),
      amount: paymentAmount,
      currency: taxRecord.currency,
      description: `Tax payment for ${taxRecord.taxType} ${taxRecord.taxYear}`,
      category: 'TAX',
      status: 'PROCESSED',
      reference: paymentReference,
      accountId: taxRecord.accountId,
      correlationId: taxRecord.correlationId,
      createdBy: taxRecord.updatedBy,
    });

    await this.financialTransactionRepository.save(transaction);
  }

  /**
   * Calculate tax record summary
   */
  private async calculateTaxRecordSummary(filters: TaxRecordFilters): Promise<{
    totalAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    overdueAmount: string;
    overdueCount: number;
    hmrcReturnableCount: number;
    pensionReturnableCount: number;
  }> {
    const query = this.taxRecordRepository.createQueryBuilder('taxRecord');

    // Apply same filters as main query
    if (filters.taxYear) {
      query.andWhere('taxRecord.taxYear = :taxYear', { taxYear: filters.taxYear });
    }

    if (filters.taxType && filters.taxType.length > 0) {
      query.andWhere('taxRecord.taxType IN (:...taxType)', { taxType: filters.taxType });
    }

    if (filters.taxPeriod && filters.taxPeriod.length > 0) {
      query.andWhere('taxRecord.taxPeriod IN (:...taxPeriod)', { taxPeriod: filters.taxPeriod });
    }

    if (filters.status && filters.status.length > 0) {
      query.andWhere('taxRecord.status IN (:...status)', { status: filters.status });
    }

    if (filters.employeeId) {
      query.andWhere('taxRecord.employeeId = :employeeId', { employeeId: filters.employeeId });
    }

    if (filters.utr) {
      query.andWhere('taxRecord.utr = :utr', { utr: filters.utr });
    }

    if (filters.hmrcReference) {
      query.andWhere('taxRecord.hmrcReference = :hmrcReference', { hmrcReference: filters.hmrcReference });
    }

    if (filters.isHMRCReturnable !== undefined) {
      query.andWhere('taxRecord.isHMRCReturnable = :isHMRCReturnable', { isHMRCReturnable: filters.isHMRCReturnable });
    }

    if (filters.isPensionReturnable !== undefined) {
      query.andWhere('taxRecord.isPensionReturnable = :isPensionReturnable', { isPensionReturnable: filters.isPensionReturnable });
    }

    if (filters.isLate) {
      query.andWhere('taxRecord.isLate = :isLate', { isLate: true });
    }

    if (filters.dateFrom) {
      query.andWhere('taxRecord.periodStart >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('taxRecord.periodEnd <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.amountFrom) {
      query.andWhere('taxRecord.taxAmount >= :amountFrom', { amountFrom: filters.amountFrom });
    }

    if (filters.amountTo) {
      query.andWhere('taxRecord.taxAmount <= :amountTo', { amountTo: filters.amountTo });
    }

    if (filters.search) {
      query.andWhere(
        '(taxRecord.hmrcReference ILIKE :search OR taxRecord.employeeName ILIKE :search OR taxRecord.utr ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const taxRecords = await query.getMany();

    let totalAmount = new Decimal(0);
    let paidAmount = new Decimal(0);
    let overdueAmount = new Decimal(0);
    let overdueCount = 0;
    let hmrcReturnableCount = 0;
    let pensionReturnableCount = 0;

    taxRecords.forEach(taxRecord => {
      totalAmount = totalAmount.plus(taxRecord.totalAmount);
      paidAmount = paidAmount.plus(taxRecord.paidAmount);

      if (taxRecord.isOverdue()) {
        overdueAmount = overdueAmount.plus(taxRecord.balanceAmount);
        overdueCount++;
      }

      if (taxRecord.isHMRCReturnable) {
        hmrcReturnableCount++;
      }

      if (taxRecord.isPensionReturnable) {
        pensionReturnableCount++;
      }
    });

    const outstandingAmount = totalAmount.minus(paidAmount);

    return {
      totalAmount: totalAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      outstandingAmount: outstandingAmount.toFixed(2),
      overdueAmount: overdueAmount.toFixed(2),
      overdueCount,
      hmrcReturnableCount,
      pensionReturnableCount,
    };
  }
}

export default TaxRecordService;