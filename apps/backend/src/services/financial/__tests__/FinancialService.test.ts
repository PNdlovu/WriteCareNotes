/**
 * @fileoverview Financial Service Unit Tests for WriteCareNotes
 * @module FinancialServiceTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive unit tests for Financial Service with healthcare
 * compliance validation, security testing, and edge case coverage.
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

import { FinancialService } from '../FinancialService';
import { FinancialRepository } from '@/repositories/financial/FinancialRepository';
import { AuditService } from '@/services/audit/AuditService';
import { EncryptionService } from '@/services/security/EncryptionService';
import { NotificationService } from '@/services/notification/NotificationService';
import { CacheService } from '@/services/caching/CacheService';

import {
  CreateResidentBillRequest,
  ProcessPaymentRequest,
  CreateInsuranceClaimRequest,
  FinancialReportRequest,
  Currency,
  PaymentMethod,
  BillingStatus,
  PaymentStatus,
  ClaimStatus,
  ReportType
} from '../interfaces/FinancialInterfaces';

import {
  ResidentBill,
  Payment,
  InsuranceClaim,
  FinancialReport
} from '@/entities/financial/FinancialEntities';

import {
  FinancialValidationError,
  PaymentProcessingError,
  InsufficientFundsError
} from '@/errors/FinancialErrors';

// Mock dependencies
jest.mock('@/repositories/financial/FinancialRepository');
jest.mock('@/services/audit/AuditService');
jest.mock('@/services/security/EncryptionService');
jest.mock('@/services/notification/NotificationService');
jest.mock('@/services/caching/CacheService');

describe('FinancialService', () => {
  let financialService: FinancialService;
  let mockRepository: jest.Mocked<FinancialRepository>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockCacheService: jest.Mocked<CacheService>;

  const mockUserId = uuidv4();
  const mockCorrelationId = uuidv4();
  const mockResidentId = uuidv4();
  const mockCareHomeId = uuidv4();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockRepository = new FinancialRepository(null as any) as jest.Mocked<FinancialRepository>;
    mockAuditService = new AuditService() as jest.Mocked<AuditService>;
    mockEncryptionService = new EncryptionService() as jest.Mocked<EncryptionService>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;
    mockCacheService = new CacheService() as jest.Mocked<CacheService>;

    // Create service instance
    financialService = new FinancialService(
      mockRepository,
      mockAuditService,
      mockEncryptionService,
      mockNotificationService,
      mockCacheService
    );

    // Setup default mock implementations
    mockRepository.getResident.mockResolvedValue({
      id: mockResidentId,
      firstName: 'John',
      lastName: 'Doe',
      isActive: true
    });

    mockRepository.getNextBillSequence.mockResolvedValue(1);
    mockEncryptionService.encrypt.mockResolvedValue('encrypted_data');
    mockAuditService.log.mockResolvedValue(undefined);
    mockCacheService.set.mockResolvedValue(undefined);
  });

  describe('createResidentBill', () => {
    const validBillRequest: CreateResidentBillRequest = {
      residentId: mockResidentId,
      careHomeId: mockCareHomeId,
      billingPeriodStart: new Date('2025-01-01'),
      billingPeriodEnd: new Date('2025-01-31'),
      dueDate: new Date('2025-02-15'),
      amount: 2500.00,
      currency: Currency.GBP,
      description: 'Monthly care fees',
      lineItems: [
        {
          description: 'Residential care',
          quantity: 1,
          unitPrice: 2000.00,
          amount: 2000.00,
          category: 'care_fees'
        },
        {
          description: 'Medication management',
          quantity: 1,
          unitPrice: 500.00,
          amount: 500.00,
          category: 'medication'
        }
      ],
      includeVat: true,
      paymentTerms: 30
    };

    it('should create a resident bill successfully', async () => {
      // Arrange
      const expectedBill: ResidentBill = {
        id: uuidv4(),
        billNumber: 'BILL-TEST-2025-000001',
        residentId: mockResidentId,
        careHomeId: mockCareHomeId,
        billingPeriodStart: validBillRequest.billingPeriodStart,
        billingPeriodEnd: validBillRequest.billingPeriodEnd,
        issueDate: expect.any(Date),
        dueDate: validBillRequest.dueDate,
        subtotal: 2500.00,
        vatAmount: 500.00,
        totalAmount: 3000.00,
        currency: Currency.GBP,
        status: BillingStatus.PENDING,
        description: validBillRequest.description,
        lineItems: validBillRequest.lineItems,
        paymentTerms: 30,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: mockUserId,
        correlationId: mockCorrelationId
      };

      mockRepository.createBill.mockResolvedValue(expectedBill);

      // Act
      const result = await financialService.createResidentBill(
        validBillRequest,
        mockUserId,
        mockCorrelationId
      );

      // Assert
      expect(result).toEqual(expectedBill);
      expect(mockRepository.getResident).toHaveBeenCalledWith(mockResidentId);
      expect(mockRepository.createBill).toHaveBeenCalledWith(
        expect.objectContaining({
          residentId: mockResidentId,
          careHomeId: mockCareHomeId,
          subtotal: 2500.00,
          vatAmount: 500.00,
          totalAmount: 3000.00,
          status: BillingStatus.PENDING
        })
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RESIDENT_BILL_CREATED',
          entityType: 'ResidentBill',
          userId: mockUserId,
          correlationId: mockCorrelationId
        })
      );
    });

    it('should calculate VAT correctly when includeVat is true', async () => {
      // Arrange
      const billWithVat = { ...validBillRequest, includeVat: true };
      mockRepository.createBill.mockResolvedValue({} as ResidentBill);

      // Act
      await financialService.createResidentBill(billWithVat, mockUserId, mockCorrelationId);

      // Assert
      expect(mockRepository.createBill).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 2500.00,
          vatAmount: 500.00, // 20% VAT
          totalAmount: 3000.00
        })
      );
    });

    it('should not include VAT when includeVat is false', async () => {
      // Arrange
      const billWithoutVat = { ...validBillRequest, includeVat: false };
      mockRepository.createBill.mockResolvedValue({} as ResidentBill);

      // Act
      await financialService.createResidentBill(billWithoutVat, mockUserId, mockCorrelationId);

      // Assert
      expect(mockRepository.createBill).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 2500.00,
          vatAmount: 0,
          totalAmount: 2500.00
        })
      );
    });

    it('should throw validation error for invalid resident', async () => {
      // Arrange
      mockRepository.getResident.mockResolvedValue(null);

      // Act & Assert
      await expect(
        financialService.createResidentBill(validBillRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);

      expect(mockRepository.createBill).not.toHaveBeenCalled();
    });

    it('should throw validation error for inactive resident', async () => {
      // Arrange
      mockRepository.getResident.mockResolvedValue({
        id: mockResidentId,
        firstName: 'John',
        lastName: 'Doe',
        isActive: false
      });

      // Act & Assert
      await expect(
        financialService.createResidentBill(validBillRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockRepository.createBill.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        financialService.createResidentBill(validBillRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(dbError);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RESIDENT_BILL_CREATION_FAILED',
          details: { error: dbError.message }
        })
      );
    });

    it('should validate billing period dates', async () => {
      // Arrange
      const invalidBillRequest = {
        ...validBillRequest,
        billingPeriodStart: new Date('2025-01-31'),
        billingPeriodEnd: new Date('2025-01-01') // End before start
      };

      // Act & Assert
      await expect(
        financialService.createResidentBill(invalidBillRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });

    it('should validate amount is positive', async () => {
      // Arrange
      const invalidBillRequest = {
        ...validBillRequest,
        amount: -100 // Negative amount
      };

      // Act & Assert
      await expect(
        financialService.createResidentBill(invalidBillRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });
  });

  describe('processPayment', () => {
    const validPaymentRequest: ProcessPaymentRequest = {
      residentId: mockResidentId,
      careHomeId: mockCareHomeId,
      amount: 1000.00,
      currency: Currency.GBP,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      description: 'Payment for care fees',
      billId: uuidv4()
    };

    it('should process payment successfully', async () => {
      // Arrange
      const mockBill: ResidentBill = {
        id: validPaymentRequest.billId!,
        totalAmount: 1000.00,
        status: BillingStatus.PENDING
      } as ResidentBill;

      const expectedPayment: Payment = {
        id: uuidv4(),
        paymentReference: 'PAY-TEST-123456',
        residentId: mockResidentId,
        careHomeId: mockCareHomeId,
        amount: 1000.00,
        processingFee: 29.00, // 2.9% for credit card
        netAmount: 971.00,
        currency: Currency.GBP,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.COMPLETED,
        paymentDate: expect.any(Date),
        description: validPaymentRequest.description,
        gatewayTransactionId: 'TXN-123456',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: mockUserId,
        correlationId: mockCorrelationId
      };

      mockRepository.getBill.mockResolvedValue(mockBill);
      mockRepository.createPayment.mockResolvedValue(expectedPayment);

      // Mock payment gateway success
      jest.spyOn(financialService as any, 'processPaymentGateway').mockResolvedValue({
        success: true,
        transactionId: 'TXN-123456',
        response: { status: 'approved' }
      });

      // Act
      const result = await financialService.processPayment(
        validPaymentRequest,
        mockUserId,
        mockCorrelationId
      );

      // Assert
      expect(result).toEqual(expectedPayment);
      expect(mockRepository.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000.00,
          processingFee: 29.00,
          netAmount: 971.00,
          status: PaymentStatus.COMPLETED
        })
      );
    });

    it('should calculate processing fees correctly for different payment methods', async () => {
      // Test credit card (2.9%)
      const creditCardRequest = { ...validPaymentRequest, paymentMethod: PaymentMethod.CREDIT_CARD };
      mockRepository.createPayment.mockResolvedValue({} as Payment);
      jest.spyOn(financialService as any, 'processPaymentGateway').mockResolvedValue({
        success: true,
        transactionId: 'TXN-123456'
      });

      await financialService.processPayment(creditCardRequest, mockUserId, mockCorrelationId);

      expect(mockRepository.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          processingFee: 29.00 // 2.9% of 1000
        })
      );

      // Test bank transfer (fixed £0.50)
      const bankTransferRequest = { ...validPaymentRequest, paymentMethod: PaymentMethod.BANK_TRANSFER };
      
      await financialService.processPayment(bankTransferRequest, mockUserId, mockCorrelationId);

      expect(mockRepository.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          processingFee: 0.50 // Fixed fee
        })
      );
    });

    it('should handle payment gateway failures', async () => {
      // Arrange
      jest.spyOn(financialService as any, 'processPaymentGateway').mockResolvedValue({
        success: false,
        error: 'Card declined'
      });

      // Act & Assert
      await expect(
        financialService.processPayment(validPaymentRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(PaymentProcessingError);
    });

    it('should perform fraud detection for high-risk payments', async () => {
      // Arrange
      const highAmountRequest = { ...validPaymentRequest, amount: 100000 }; // High amount
      jest.spyOn(financialService as any, 'calculateRiskScore').mockResolvedValue(0.9); // High risk

      // Act & Assert
      await expect(
        financialService.processPayment(highAmountRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(PaymentProcessingError);
    });

    it('should validate payment amount is positive', async () => {
      // Arrange
      const invalidPaymentRequest = { ...validPaymentRequest, amount: -100 };

      // Act & Assert
      await expect(
        financialService.processPayment(invalidPaymentRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });

    it('should validate payment method', async () => {
      // Arrange
      const invalidPaymentRequest = { ...validPaymentRequest, paymentMethod: 'invalid' as PaymentMethod };

      // Act & Assert
      await expect(
        financialService.processPayment(invalidPaymentRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });
  });

  describe('createInsuranceClaim', () => {
    const validClaimRequest: CreateInsuranceClaimRequest = {
      residentId: mockResidentId,
      careHomeId: mockCareHomeId,
      insuranceProvider: 'NHS',
      policyNumber: 'NHS-12345',
      claimType: 'medical_expenses',
      claimAmount: 5000.00,
      deductible: 500.00,
      currency: Currency.GBP,
      incidentDate: new Date('2025-01-15'),
      description: 'Medical treatment costs',
      supportingDocuments: ['receipt1.pdf', 'medical_report.pdf']
    };

    it('should create insurance claim successfully', async () => {
      // Arrange
      const expectedClaim: InsuranceClaim = {
        id: uuidv4(),
        claimNumber: 'CLM-2025-00000001',
        residentId: mockResidentId,
        careHomeId: mockCareHomeId,
        insuranceProvider: 'NHS',
        policyNumber: 'NHS-12345',
        claimType: 'medical_expenses',
        claimAmount: 5000.00,
        deductible: 500.00,
        netClaimAmount: 4500.00,
        currency: Currency.GBP,
        status: ClaimStatus.SUBMITTED,
        incidentDate: validClaimRequest.incidentDate,
        submissionDate: expect.any(Date),
        description: validClaimRequest.description,
        supportingDocuments: validClaimRequest.supportingDocuments,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: mockUserId,
        correlationId: mockCorrelationId
      };

      mockRepository.getNextClaimSequence.mockResolvedValue(1);
      mockRepository.createInsuranceClaim.mockResolvedValue(expectedClaim);

      // Mock insurance eligibility check
      jest.spyOn(financialService as any, 'checkInsuranceEligibility').mockResolvedValue({
        eligible: true
      });

      // Act
      const result = await financialService.createInsuranceClaim(
        validClaimRequest,
        mockUserId,
        mockCorrelationId
      );

      // Assert
      expect(result).toEqual(expectedClaim);
      expect(mockRepository.createInsuranceClaim).toHaveBeenCalledWith(
        expect.objectContaining({
          claimAmount: 5000.00,
          deductible: 500.00,
          netClaimAmount: 4500.00,
          status: ClaimStatus.SUBMITTED
        })
      );
    });

    it('should validate insurance eligibility', async () => {
      // Arrange
      jest.spyOn(financialService as any, 'checkInsuranceEligibility').mockResolvedValue({
        eligible: false,
        reason: 'Policy expired'
      });

      // Act & Assert
      await expect(
        financialService.createInsuranceClaim(validClaimRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });

    it('should validate claim amount is positive', async () => {
      // Arrange
      const invalidClaimRequest = { ...validClaimRequest, claimAmount: -1000 };

      // Act & Assert
      await expect(
        financialService.createInsuranceClaim(invalidClaimRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidClaimRequest = { ...validClaimRequest, insuranceProvider: '' };

      // Act & Assert
      await expect(
        financialService.createInsuranceClaim(invalidClaimRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });
  });

  describe('generateFinancialReport', () => {
    const validReportRequest: FinancialReportRequest = {
      reportType: ReportType.PROFIT_AND_LOSS,
      careHomeId: mockCareHomeId,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      format: 'json'
    };

    it('should generate financial report successfully', async () => {
      // Arrange
      const expectedReport: FinancialReport = {
        id: uuidv4(),
        reportType: ReportType.PROFIT_AND_LOSS,
        careHomeId: mockCareHomeId,
        startDate: validReportRequest.startDate,
        endDate: validReportRequest.endDate,
        generatedDate: expect.any(Date),
        data: {
          revenue: 50000,
          expenses: 30000,
          profit: 20000
        },
        format: 'json',
        parameters: {},
        createdBy: mockUserId,
        correlationId: mockCorrelationId
      };

      mockRepository.createFinancialReport.mockResolvedValue(expectedReport);

      // Mock report data generation
      jest.spyOn(financialService as any, 'generateReportData').mockResolvedValue({
        revenue: 50000,
        expenses: 30000,
        profit: 20000
      });

      // Mock permission validation
      jest.spyOn(financialService as any, 'validateReportPermissions').mockResolvedValue(undefined);

      // Act
      const result = await financialService.generateFinancialReport(
        validReportRequest,
        mockUserId,
        mockCorrelationId
      );

      // Assert
      expect(result).toEqual(expectedReport);
      expect(mockRepository.createFinancialReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: ReportType.PROFIT_AND_LOSS,
          careHomeId: mockCareHomeId,
          data: { revenue: 50000, expenses: 30000, profit: 20000 }
        })
      );
    });

    it('should validate report date range', async () => {
      // Arrange
      const invalidReportRequest = {
        ...validReportRequest,
        startDate: new Date('2025-01-31'),
        endDate: new Date('2025-01-01') // End before start
      };

      // Act & Assert
      await expect(
        financialService.generateFinancialReport(invalidReportRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow(FinancialValidationError);
    });
  });

  describe('getFinancialMetrics', () => {
    it('should return cached metrics when available', async () => {
      // Arrange
      const cachedMetrics = {
        period: 'month' as const,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        totalRevenue: 50000,
        totalExpenses: 30000,
        netProfit: 20000,
        profitMargin: 40,
        outstandingBills: { count: 5, totalAmount: 10000 },
        paidBills: { count: 20, totalAmount: 40000 },
        insuranceClaims: {
          pending: { count: 2, totalAmount: 5000 },
          approved: { count: 8, totalAmount: 15000 }
        },
        generatedAt: new Date(),
        correlationId: mockCorrelationId
      };

      mockCacheService.get.mockResolvedValue(cachedMetrics);

      // Act
      const result = await financialService.getFinancialMetrics(
        mockCareHomeId,
        'month',
        mockUserId,
        mockCorrelationId
      );

      // Assert
      expect(result).toEqual(cachedMetrics);
      expect(mockCacheService.get).toHaveBeenCalledWith('metrics:' + mockCareHomeId + ':month');
    });

    it('should calculate metrics when not cached', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.getTotalRevenue.mockResolvedValue(50000);
      mockRepository.getTotalExpenses.mockResolvedValue(30000);
      mockRepository.getOutstandingBills.mockResolvedValue([
        { totalAmount: 5000 }, { totalAmount: 5000 }
      ] as any[]);
      mockRepository.getPaidBills.mockResolvedValue([
        { totalAmount: 20000 }, { totalAmount: 20000 }
      ] as any[]);
      mockRepository.getPendingClaims.mockResolvedValue([
        { claimAmount: 2500 }, { claimAmount: 2500 }
      ] as any[]);
      mockRepository.getApprovedClaims.mockResolvedValue([
        { claimAmount: 7500 }, { claimAmount: 7500 }
      ] as any[]);

      // Act
      const result = await financialService.getFinancialMetrics(
        mockCareHomeId,
        'month',
        mockUserId,
        mockCorrelationId
      );

      // Assert
      expect(result.totalRevenue).toBe(50000);
      expect(result.totalExpenses).toBe(30000);
      expect(result.netProfit).toBe(20000);
      expect(result.profitMargin).toBe(40); // 20000/50000 * 100
      expect(result.outstandingBills.count).toBe(2);
      expect(result.outstandingBills.totalAmount).toBe(10000);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'metrics:' + mockCareHomeId + ':month',
        result,
        900 // 15 minutes TTL
      );
    });

    it('should handle zero revenue gracefully', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.getTotalRevenue.mockResolvedValue(0);
      mockRepository.getTotalExpenses.mockResolvedValue(30000);
      mockRepository.getOutstandingBills.mockResolvedValue([]);
      mockRepository.getPaidBills.mockResolvedValue([]);
      mockRepository.getPendingClaims.mockResolvedValue([]);
      mockRepository.getApprovedClaims.mockResolvedValue([]);

      // Act
      const result = await financialService.getFinancialMetrics(
        mockCareHomeId,
        'month',
        mockUserId,
        mockCorrelationId
      );

      // Assert
      expect(result.totalRevenue).toBe(0);
      expect(result.netProfit).toBe(-30000);
      expect(result.profitMargin).toBe(0); // Should be 0 when revenue is 0
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle decimal precision correctly', async () => {
      // Arrange
      const precisionTestRequest: CreateResidentBillRequest = {
        residentId: mockResidentId,
        careHomeId: mockCareHomeId,
        billingPeriodStart: new Date('2025-01-01'),
        billingPeriodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-15'),
        amount: 1234.5678, // High precision amount
        currency: Currency.GBP,
        description: 'Precision test',
        lineItems: [{
          description: 'Test item',
          quantity: 1,
          unitPrice: 1234.5678,
          amount: 1234.5678,
          category: 'test'
        }],
        includeVat: true
      };

      mockRepository.createBill.mockResolvedValue({} as ResidentBill);

      // Act
      await financialService.createResidentBill(precisionTestRequest, mockUserId, mockCorrelationId);

      // Assert - Should round to 2 decimal places for currency
      expect(mockRepository.createBill).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1234.57, // Rounded to 2 decimal places
          vatAmount: 246.91, // 20% VAT rounded
          totalAmount: 1481.48 // Total rounded
        })
      );
    });

    it('should handle concurrent payment processing', async () => {
      // This test would verify that concurrent payments don't cause race conditions
      // In a real implementation, you might use database locks or other concurrency controls
      
      const paymentRequest: ProcessPaymentRequest = {
        residentId: mockResidentId,
        careHomeId: mockCareHomeId,
        amount: 1000.00,
        currency: Currency.GBP,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        description: 'Concurrent payment test'
      };

      mockRepository.createPayment.mockResolvedValue({} as Payment);
      jest.spyOn(financialService as any, 'processPaymentGateway').mockResolvedValue({
        success: true,
        transactionId: 'TXN-123456'
      });

      // Act - Process multiple payments concurrently
      const promises = Array(5).fill(null).map(() =>
        financialService.processPayment(paymentRequest, mockUserId, uuidv4())
      );

      // Assert - All should complete without errors
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockRepository.createBill.mockRejectedValue(timeoutError);

      const billRequest: CreateResidentBillRequest = {
        residentId: mockResidentId,
        careHomeId: mockCareHomeId,
        billingPeriodStart: new Date('2025-01-01'),
        billingPeriodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-15'),
        amount: 1000.00,
        currency: Currency.GBP,
        description: 'Timeout test',
        lineItems: [{
          description: 'Test item',
          quantity: 1,
          unitPrice: 1000.00,
          amount: 1000.00,
          category: 'test'
        }]
      };

      // Act & Assert
      await expect(
        financialService.createResidentBill(billRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow('Network timeout');

      // Verify error was logged
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RESIDENT_BILL_CREATION_FAILED',
          details: { error: 'Network timeout' }
        })
      );
    });
  });

  describe('Security and Compliance', () => {
    it('should encrypt sensitive financial data', async () => {
      // Arrange
      const billWithBankDetails: CreateResidentBillRequest = {
        residentId: mockResidentId,
        careHomeId: mockCareHomeId,
        billingPeriodStart: new Date('2025-01-01'),
        billingPeriodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-15'),
        amount: 1000.00,
        currency: Currency.GBP,
        description: 'Security test',
        lineItems: [{
          description: 'Test item',
          quantity: 1,
          unitPrice: 1000.00,
          amount: 1000.00,
          category: 'test'
        }],
        bankDetails: {
          accountName: 'Test Account',
          accountNumber: '12345678',
          sortCode: '12-34-56',
          bankName: 'Test Bank'
        }
      };

      mockRepository.createBill.mockResolvedValue({} as ResidentBill);

      // Act
      await financialService.createResidentBill(billWithBankDetails, mockUserId, mockCorrelationId);

      // Assert
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        JSON.stringify(billWithBankDetails.bankDetails)
      );
      expect(mockRepository.createBill).toHaveBeenCalledWith(
        expect.objectContaining({
          encryptedBankDetails: 'encrypted_data'
        })
      );
    });

    it('should log all financial operations for audit compliance', async () => {
      // Arrange
      const billRequest: CreateResidentBillRequest = {
        residentId: mockResidentId,
        careHomeId: mockCareHomeId,
        billingPeriodStart: new Date('2025-01-01'),
        billingPeriodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-15'),
        amount: 1000.00,
        currency: Currency.GBP,
        description: 'Audit test',
        lineItems: [{
          description: 'Test item',
          quantity: 1,
          unitPrice: 1000.00,
          amount: 1000.00,
          category: 'test'
        }]
      };

      mockRepository.createBill.mockResolvedValue({
        id: uuidv4(),
        totalAmount: 1000.00
      } as ResidentBill);

      // Act
      await financialService.createResidentBill(billRequest, mockUserId, mockCorrelationId);

      // Assert
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RESIDENT_BILL_CREATED',
          entityType: 'ResidentBill',
          userId: mockUserId,
          correlationId: mockCorrelationId,
          complianceFlags: ['FINANCIAL_TRANSACTION', 'GDPR_PROCESSING']
        })
      );
    });

    it('should validate user permissions for financial operations', async () => {
      // This test would verify that proper RBAC is enforced
      // In the actual implementation, this would be handled by middleware
      // but the service should also validate permissions

      const reportRequest: FinancialReportRequest = {
        reportType: ReportType.PROFIT_AND_LOSS,
        careHomeId: mockCareHomeId,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31')
      };

      // Mock permission validation failure
      jest.spyOn(financialService as any, 'validateReportPermissions')
        .mockRejectedValue(new Error('Insufficient permissions'));

      // Act & Assert
      await expect(
        financialService.generateFinancialReport(reportRequest, mockUserId, mockCorrelationId)
      ).rejects.toThrow('Insufficient permissions');
    });
  });
});