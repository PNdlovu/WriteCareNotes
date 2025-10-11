/**
 * @fileoverview Comprehensive Unit Tests for Inventory & Supply Chain Service
 * @module InventoryService.test
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for inventory and supply chain management operations
 * including stock management, automated reordering, supplier management, asset tracking,
 * and compliance monitoring with full healthcare regulations compliance testing.
 * 
 * @compliance
 * - MHRA (Medicines and Healthcare products Regulatory Agency) regulations testing
 * - CQC (Care Quality Commission) requirements validation
 * - NHS Supply Chain standards verification
 * - GDPR data protection compliance testing
 * - Healthcare audit trail validation
 */
import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { InventoryService } from '../InventoryService';
import { InventoryRepository } from '@/repositories/inventory/InventoryRepository';
import { AuditService } from '@/services/audit/AuditService';
import { EncryptionService } from '@/services/security/EncryptionService';
import { NotificationService } from '@/services/notification/NotificationService';
import { CacheService } from '@/services/caching/CacheService';
import {
  CreateInventoryItemRequest,
  CreatePurchaseOrderRequest,
  CreateSupplierRequest,
  StockMovementRequest,
  InventoryMetricsRequest
} from '../interfaces/InventoryInterfaces';
import {
  InventoryItem,
  PurchaseOrder,
  Supplier,
  StockMovement,
  InventoryMetrics
} from '@/entities/inventory/InventoryEntities';
import {
  InventoryValidationError,
  InventoryNotFoundError,
  SupplierNotFoundError,
  StockInsufficientError,
  PurchaseOrderError,
  ComplianceViolationError
} from '@/errors/InventoryErrors';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: jest.Mocked<InventoryRepository>;
  let auditService: jest.Mocked<AuditService>;
  let encryptionService: jest.Mocked<EncryptionService>;
  let notificationService: jest.Mocked<NotificationService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockCareHomeId = uuidv4();
  const mockUserId = uuidv4();
  const mockCorrelationId = uuidv4();

  beforeEach(async () => {
    const mockRepository = {
      createInventoryItem: jest.fn(),
      getInventoryItem: jest.fn(),
      findInventoryItemByCode: jest.fn(),
      updateInventoryItem: jest.fn(),
      createPurchaseOrder: jest.fn(),
      createStockMovement: jest.fn(),
      createSupplier: jest.fn(),
      getSupplier: jest.fn(),
      createStockAlert: jest.fn(),
      getStockLevels: jest.fn(),
      getStockValue: jest.fn(),
      getTurnoverRates: jest.fn(),
      getSupplierPerformance: jest.fn(),
      getOrderMetrics: jest.fn(),
      getExpiryAlerts: jest.fn(),
      getStockAlerts: jest.fn(),
      getStockAccuracy: jest.fn(),
      getComplianceViolations: jest.fn(),
      getCostSavings: jest.fn(),
      getBudgetVariance: jest.fn(),
      getPreferredSupplier: jest.fn(),
      getNextPurchaseOrderSequence: jest.fn()
    };

    const mockAuditService = {
      log: jest.fn()
    };

    const mockEncryptionService = {
      encrypt: jest.fn(),
      decrypt: jest.fn()
    };

    const mockNotificationService = {
      sendStockAlert: jest.fn(),
      sendPurchaseOrderNotification: jest.fn()
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: InventoryRepository, useValue: mockRepository },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: CacheService, useValue: mockCacheService }
      ]
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repository = module.get(InventoryRepository);
    auditService = module.get(AuditService);
    encryptionService = module.get(EncryptionService);
    notificationService = module.get(NotificationService);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInventoryItem', () => {
    const validInventoryItemRequest: CreateInventoryItemRequest = {
      itemCode: 'MED-001',
      itemName: 'Paracetamol 500mg',
      description: 'Pain relief medication',
      category: 'Medications',
      subcategory: 'Analgesics',
      unitOfMeasure: 'tablets',
      unitCost: 0.05,
      currency: 'GBP',
      initialStock: 1000,
      minStock: 100,
      maxStock: 2000,
      reorderPoint: 200,
      averageUsage: 50,
      leadTimeDays: 7,
      storageLocation: 'Pharmacy-A1',
      storageRequirements: 'Store in cool, dry place',
      isMedicalDevice: false,
      isControlledSubstance: false,
      isHazardous: false,
      autoReorder: true,
      trackExpiry: true,
      trackBatches: true,
      careHomeId: mockCareHomeId,
      createdBy: mockUserId
    };

    const mockInventoryItem: InventoryItem = {
      id: uuidv4(),
      itemCode: 'MED-001',
      itemName: 'Paracetamol 500mg',
      description: 'Pain relief medication',
      category: 'Medications',
      subcategory: 'Analgesics',
      unitOfMeasure: 'tablets',
      unitCost: 0.05,
      currency: 'GBP',
      currentStock: 1000,
      reservedStock: 0,
      availableStock: 1000,
      minStock: 100,
      maxStock: 2000,
      reorderPoint: 200,
      averageUsage: 50,
      leadTimeDays: 7,
      totalValue: 50.00,
      averageCost: 0.05,
      lastCostUpdate: new Date(),
      storageLocation: 'Pharmacy-A1',
      storageRequirements: 'Store in cool, dry place',
      isMedicalDevice: false,
      isControlledSubstance: false,
      isHazardous: false,
      alternativeSupplierIds: [],
      autoReorder: true,
      trackExpiry: true,
      trackBatches: true,
      trackSerialNumbers: false,
      status: 'active',
      lastStockCheck: new Date(),
      careHomeId: mockCareHomeId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
      updatedBy: mockUserId,
      version: 1
    };

    it('should create inventory item successfully with valid data', async () => {
      repository.findInventoryItemByCode.mockResolvedValue(null);
      repository.createInventoryItem.mockResolvedValue(mockInventoryItem);
      repository.createStockMovement.mockResolvedValue({} as StockMovement);

      const result = await service.createInventoryItem(validInventoryItemRequest, mockCorrelationId);

      expect(result).toEqual(mockInventoryItem);
      expect(repository.findInventoryItemByCode).toHaveBeenCalledWith('MED-001');
      expect(repository.createInventoryItem).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INVENTORY_ITEM_CREATED',
          resourceType: 'InventoryItem',
          resourceId: mockInventoryItem.id,
          userId: mockUserId
        })
      );
    });

    it('should throw validation error for missing item code', async () => {
      const invalidRequest = { ...validInventoryItemRequest, itemCode: '' };

      await expect(
        service.createInventoryItem(invalidRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryValidationError);
    });

    it('should throw validation error for missing item name', async () => {
      const invalidRequest = { ...validInventoryItemRequest, itemName: '' };

      await expect(
        service.createInventoryItem(invalidRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryValidationError);
    });

    it('should throw validation error for negative unit cost', async () => {
      const invalidRequest = { ...validInventoryItemRequest, unitCost: -1 };

      await expect(
        service.createInventoryItem(invalidRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryValidationError);
    });

    it('should throw validation error for duplicate item code', async () => {
      repository.findInventoryItemByCode.mockResolvedValue(mockInventoryItem);

      await expect(
        service.createInventoryItem(validInventoryItemRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryValidationError);
    });

    it('should throw compliance error for medical device without MHRA license', async () => {
      const medicalDeviceRequest = {
        ...validInventoryItemRequest,
        isMedicalDevice: true,
        mhraLicenseNumber: undefined
      };

      repository.findInventoryItemByCode.mockResolvedValue(null);

      await expect(
        service.createInventoryItem(medicalDeviceRequest, mockCorrelationId)
      ).rejects.toThrow(ComplianceViolationError);
    });

    it('should throw compliance error for controlled substance without license', async () => {
      const controlledSubstanceRequest = {
        ...validInventoryItemRequest,
        isControlledSubstance: true,
        controlledSubstanceLicense: undefined
      };

      repository.findInventoryItemByCode.mockResolvedValue(null);

      await expect(
        service.createInventoryItem(controlledSubstanceRequest, mockCorrelationId)
      ).rejects.toThrow(ComplianceViolationError);
    });

    it('should calculate reorder point when not provided', async () => {
      const requestWithoutReorderPoint = {
        ...validInventoryItemRequest,
        reorderPoint: undefined
      };

      repository.findInventoryItemByCode.mockResolvedValue(null);
      repository.createInventoryItem.mockResolvedValue(mockInventoryItem);
      repository.createStockMovement.mockResolvedValue({} as StockMovement);

      await service.createInventoryItem(requestWithoutReorderPoint, mockCorrelationId);

      expect(repository.createInventoryItem).toHaveBeenCalledWith(
        expect.objectContaining({
          reorderPoint: expect.any(Number)
        })
      );
    });

    it('should create initial stock movement when initial stock provided', async () => {
      repository.findInventoryItemByCode.mockResolvedValue(null);
      repository.createInventoryItem.mockResolvedValue(mockInventoryItem);
      repository.createStockMovement.mockResolvedValue({} as StockMovement);

      await service.createInventoryItem(validInventoryItemRequest, mockCorrelationId);

      expect(repository.createStockMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          inventoryItemId: mockInventoryItem.id,
          movementType: 'stock_in',
          quantity: 1000,
          reason: 'initial_stock'
        }),
        mockCorrelationId
      );
    });
  });

  describe('createPurchaseOrder', () => {
    const mockSupplierId = uuidv4();
    const mockInventoryItemId = uuidv4();

    const validPurchaseOrderRequest: CreatePurchaseOrderRequest = {
      supplierId: mockSupplierId,
      careHomeId: mockCareHomeId,
      orderItems: [
        {
          inventoryItemId: mockInventoryItemId,
          quantity: 100,
          unitCost: 0.05,
          notes: 'Regular reorder'
        }
      ],
      priority: 'normal',
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      currency: 'GBP',
      createdBy: mockUserId
    };

    const mockSupplier: Supplier = {
      id: mockSupplierId,
      supplierName: 'MedSupply Ltd',
      supplierType: 'distributor',
      primaryContact: {
        name: 'John Smith',
        email: 'john@medsupply.com',
        phone: '01234567890',
        isPrimary: true
      },
      alternativeContacts: [],
      businessAddress: {
        line1: '123 Medical Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'UK'
      },
      deliveryAddresses: [],
      paymentTerms: '30 days',
      currency: 'GBP',
      categories: ['Medications'],
      capabilities: [],
      certifications: [],
      averageLeadTime: 7,
      deliveryZones: ['UK'],
      rating: 4.5,
      totalOrders: 50,
      totalSpend: 25000,
      averageDeliveryTime: 6.5,
      onTimeDeliveryRate: 95,
      qualityRating: 4.2,
      gdprCompliant: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
      updatedBy: mockUserId
    };

    const mockPurchaseOrder: PurchaseOrder = {
      id: uuidv4(),
      orderNumber: 'PO-2025-000001',
      supplierId: mockSupplierId,
      careHomeId: mockCareHomeId,
      orderItems: [
        {
          id: uuidv4(),
          purchaseOrderId: '',
          inventoryItemId: mockInventoryItemId,
          itemName: 'Paracetamol 500mg',
          itemCode: 'MED-001',
          quantityOrdered: 100,
          quantityDelivered: 0,
          quantityRemaining: 100,
          unitCost: 0.05,
          totalCost: 5.00,
          deliveryStatus: 'pending',
          qualityCheckRequired: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      subtotal: 5.00,
      vatAmount: 1.00,
      totalAmount: 6.00,
      currency: 'GBP',
      priority: 'normal',
      status: 'approved',
      requiresApproval: false,
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId
    };

    it('should create purchase order successfully with valid data', async () => {
      repository.getSupplier.mockResolvedValue(mockSupplier);
      repository.getInventoryItem.mockResolvedValue(mockInventoryItem);
      repository.getNextPurchaseOrderSequence.mockResolvedValue(1);
      repository.createPurchaseOrder.mockResolvedValue(mockPurchaseOrder);

      const result = await service.createPurchaseOrder(validPurchaseOrderRequest, mockCorrelationId);

      expect(result).toEqual(mockPurchaseOrder);
      expect(repository.getSupplier).toHaveBeenCalledWith(mockSupplierId);
      expect(repository.createPurchaseOrder).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PURCHASE_ORDER_CREATED',
          resourceType: 'PurchaseOrder'
        })
      );
    });

    it('should throw error for inactive supplier', async () => {
      const inactiveSupplier = { ...mockSupplier, status: 'inactive' as const };
      repository.getSupplier.mockResolvedValue(inactiveSupplier);

      await expect(
        service.createPurchaseOrder(validPurchaseOrderRequest, mockCorrelationId)
      ).rejects.toThrow(SupplierNotFoundError);
    });

    it('should throw error for non-existent supplier', async () => {
      repository.getSupplier.mockResolvedValue(null);

      await expect(
        service.createPurchaseOrder(validPurchaseOrderRequest, mockCorrelationId)
      ).rejects.toThrow(SupplierNotFoundError);
    });

    it('should throw error for non-existent inventory item', async () => {
      repository.getSupplier.mockResolvedValue(mockSupplier);
      repository.getInventoryItem.mockResolvedValue(null);

      await expect(
        service.createPurchaseOrder(validPurchaseOrderRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryNotFoundError);
    });

    it('should calculate VAT and totals correctly', async () => {
      repository.getSupplier.mockResolvedValue(mockSupplier);
      repository.getInventoryItem.mockResolvedValue(mockInventoryItem);
      repository.getNextPurchaseOrderSequence.mockResolvedValue(1);
      repository.createPurchaseOrder.mockResolvedValue(mockPurchaseOrder);

      await service.createPurchaseOrder(validPurchaseOrderRequest, mockCorrelationId);

      expect(repository.createPurchaseOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 5.00,
          vatAmount: 1.00,
          totalAmount: 6.00
        })
      );
    });

    it('should require approval for high-value orders', async () => {
      const highValueRequest = {
        ...validPurchaseOrderRequest,
        orderItems: [
          {
            inventoryItemId: mockInventoryItemId,
            quantity: 100000,
            unitCost: 1.00,
            notes: 'Large order'
          }
        ]
      };

      repository.getSupplier.mockResolvedValue(mockSupplier);
      repository.getInventoryItem.mockResolvedValue(mockInventoryItem);
      repository.getNextPurchaseOrderSequence.mockResolvedValue(1);
      repository.createPurchaseOrder.mockResolvedValue({
        ...mockPurchaseOrder,
        requiresApproval: true,
        status: 'pending_approval'
      });

      await service.createPurchaseOrder(highValueRequest, mockCorrelationId);

      expect(repository.createPurchaseOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          requiresApproval: true,
          status: 'pending_approval'
        })
      );
    });
  });

  describe('recordStockMovement', () => {
    const mockInventoryItemId = uuidv4();

    const validStockMovementRequest: StockMovementRequest = {
      inventoryItemId: mockInventoryItemId,
      movementType: 'usage',
      quantity: 10,
      unitCost: 0.05,
      reason: 'Patient medication',
      reference: 'DISP-001',
      notes: 'Dispensed to patient',
      performedBy: mockUserId
    };

    const mockStockMovement: StockMovement = {
      id: uuidv4(),
      inventoryItemId: mockInventoryItemId,
      movementType: 'usage',
      quantity: 10,
      unitCost: 0.05,
      totalValue: 0.50,
      previousStock: 100,
      newStock: 90,
      reason: 'Patient medication',
      reference: 'DISP-001',
      notes: 'Dispensed to patient',
      movementDate: new Date(),
      createdAt: new Date(),
      performedBy: mockUserId,
      correlationId: mockCorrelationId
    };

    it('should record stock movement successfully', async () => {
      repository.getInventoryItem.mockResolvedValue(mockInventoryItem);
      repository.createStockMovement.mockResolvedValue(mockStockMovement);
      repository.updateInventoryItem.mockResolvedValue(mockInventoryItem);

      const result = await service.recordStockMovement(validStockMovementRequest, mockCorrelationId);

      expect(result).toEqual(mockStockMovement);
      expect(repository.createStockMovement).toHaveBeenCalled();
      expect(repository.updateInventoryItem).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_MOVEMENT_RECORDED',
          resourceType: 'StockMovement'
        })
      );
    });

    it('should throw error for non-existent inventory item', async () => {
      repository.getInventoryItem.mockResolvedValue(null);

      await expect(
        service.recordStockMovement(validStockMovementRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryNotFoundError);
    });

    it('should throw error for insufficient stock on outbound movement', async () => {
      const lowStockItem = { ...mockInventoryItem, availableStock: 5 };
      repository.getInventoryItem.mockResolvedValue(lowStockItem);

      await expect(
        service.recordStockMovement(validStockMovementRequest, mockCorrelationId)
      ).rejects.toThrow(StockInsufficientError);
    });

    it('should throw validation error for zero or negative quantity', async () => {
      const invalidRequest = { ...validStockMovementRequest, quantity: 0 };

      repository.getInventoryItem.mockResolvedValue(mockInventoryItem);

      await expect(
        service.recordStockMovement(invalidRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryValidationError);
    });

    it('should update stock levels correctly for inbound movement', async () => {
      const inboundRequest = {
        ...validStockMovementRequest,
        movementType: 'stock_in' as const,
        quantity: 50
      };

      repository.getInventoryItem.mockResolvedValue(mockInventoryItem);
      repository.createStockMovement.mockResolvedValue(mockStockMovement);
      repository.updateInventoryItem.mockResolvedValue(mockInventoryItem);

      await service.recordStockMovement(inboundRequest, mockCorrelationId);

      expect(repository.updateInventoryItem).toHaveBeenCalledWith(
        mockInventoryItemId,
        expect.objectContaining({
          currentStock: expect.any(Number),
          availableStock: expect.any(Number)
        })
      );
    });
  });

  describe('createSupplier', () => {
    const validSupplierRequest: CreateSupplierRequest = {
      supplierName: 'MedSupply Ltd',
      supplierType: 'distributor',
      registrationNumber: 'REG123456',
      vatNumber: 'GB123456789',
      primaryContact: {
        name: 'John Smith',
        title: 'Sales Manager',
        email: 'john@medsupply.com',
        phone: '01234567890',
        isPrimary: true
      },
      businessAddress: {
        line1: '123 Medical Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'UK'
      },
      paymentTerms: '30 days',
      currency: 'GBP',
      categories: ['Medications', 'Medical Supplies'],
      averageLeadTime: 7,
      deliveryZones: ['UK'],
      gdprCompliant: true,
      createdBy: mockUserId
    };

    const mockSupplier: Supplier = {
      id: uuidv4(),
      ...validSupplierRequest,
      alternativeContacts: [],
      deliveryAddresses: [],
      capabilities: [],
      certifications: [],
      rating: 0,
      totalOrders: 0,
      totalSpend: 0,
      averageDeliveryTime: 0,
      onTimeDeliveryRate: 0,
      qualityRating: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: mockUserId
    };

    it('should create supplier successfully with valid data', async () => {
      repository.createSupplier.mockResolvedValue(mockSupplier);
      encryptionService.encrypt.mockResolvedValue('encrypted_data');

      const result = await service.createSupplier(validSupplierRequest, mockCorrelationId);

      expect(result).toEqual(mockSupplier);
      expect(repository.createSupplier).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUPPLIER_CREATED',
          resourceType: 'Supplier'
        })
      );
    });

    it('should throw validation error for missing supplier name', async () => {
      const invalidRequest = { ...validSupplierRequest, supplierName: '' };

      await expect(
        service.createSupplier(invalidRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryValidationError);
    });

    it('should encrypt sensitive supplier data', async () => {
      repository.createSupplier.mockResolvedValue(mockSupplier);
      encryptionService.encrypt.mockResolvedValue('encrypted_data');

      await service.createSupplier(validSupplierRequest, mockCorrelationId);

      expect(encryptionService.encrypt).toHaveBeenCalled();
    });
  });

  describe('getInventoryMetrics', () => {
    const validMetricsRequest: InventoryMetricsRequest = {
      careHomeId: mockCareHomeId,
      period: 'current_month',
      includeStockMetrics: true,
      includeOrderMetrics: true,
      includeSupplierMetrics: true,
      includeComplianceMetrics: true,
      includeCostMetrics: true
    };

    const mockMetrics: InventoryMetrics = {
      careHomeId: mockCareHomeId,
      period: 'current_month',
      generatedAt: new Date(),
      stockMetrics: {
        totalItems: 150,
        totalValue: 25000,
        averageValue: 166.67,
        lowStockItems: 5,
        outOfStockItems: 2,
        overstockItems: 3,
        stockTurnoverRate: 2.5,
        stockAccuracy: 98.5
      },
      orderMetrics: {
        totalOrders: 25,
        totalOrderValue: 15000,
        averageOrderValue: 600,
        pendingOrders: 3,
        overdueOrders: 1,
        orderFulfillmentRate: 95,
        averageLeadTime: 6.5
      },
      supplierMetrics: {
        totalSuppliers: 10,
        activeSuppliers: 8,
        averageDeliveryTime: 6.2,
        onTimeDeliveryRate: 94,
        qualityRating: 4.3,
        topSuppliers: []
      },
      complianceMetrics: {
        expiryAlerts: 3,
        stockAlerts: 7,
        complianceViolations: 0,
        auditReadiness: 96
      },
      costMetrics: {
        totalSpend: 15000,
        averageCostPerItem: 100,
        costSavings: 1200,
        budgetVariance: -500
      }
    };

    it('should return cached metrics when available', async () => {
      cacheService.get.mockResolvedValue(mockMetrics);

      const result = await service.getInventoryMetrics(validMetricsRequest, mockCorrelationId);

      expect(result).toEqual(mockMetrics);
      expect(cacheService.get).toHaveBeenCalled();
      expect(repository.getStockLevels).not.toHaveBeenCalled();
    });

    it('should generate and cache metrics when not cached', async () => {
      cacheService.get.mockResolvedValue(null);
      repository.getStockLevels.mockResolvedValue({ totalItems: 150, lowStockItems: 5, outOfStockItems: 2, overstockItems: 3 });
      repository.getStockValue.mockResolvedValue({ totalValue: 25000, averageValue: 166.67, averageCostPerItem: 100 });
      repository.getTurnoverRates.mockResolvedValue({ averageTurnover: 2.5 });
      repository.getSupplierPerformance.mockResolvedValue({
        totalSuppliers: 10,
        activeSuppliers: 8,
        averageDeliveryTime: 6.2,
        onTimeDeliveryRate: 94,
        averageQualityRating: 4.3,
        topSuppliers: []
      });
      repository.getOrderMetrics.mockResolvedValue({
        totalOrders: 25,
        totalOrderValue: 15000,
        averageOrderValue: 600,
        pendingOrders: 3,
        overdueOrders: 1,
        fulfillmentRate: 95,
        averageLeadTime: 6.5
      });
      repository.getExpiryAlerts.mockResolvedValue([]);
      repository.getStockAlerts.mockResolvedValue([]);
      repository.getStockAccuracy.mockResolvedValue(98.5);
      repository.getComplianceViolations.mockResolvedValue(0);
      repository.getCostSavings.mockResolvedValue(1200);
      repository.getBudgetVariance.mockResolvedValue(-500);

      const result = await service.getInventoryMetrics(validMetricsRequest, mockCorrelationId);

      expect(result.careHomeId).toBe(mockCareHomeId);
      expect(result.stockMetrics.totalItems).toBe(150);
      expect(cacheService.set).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INVENTORY_METRICS_GENERATED'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      repository.createInventoryItem.mockRejectedValue(dbError);

      const validRequest: CreateInventoryItemRequest = {
        itemCode: 'TEST-001',
        itemName: 'Test Item',
        category: 'Test',
        unitOfMeasure: 'each',
        unitCost: 1.00,
        minStock: 10,
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      await expect(
        service.createInventoryItem(validRequest, mockCorrelationId)
      ).rejects.toThrow(InventoryValidationError);
    });

    it('should handle encryption service failures', async () => {
      const encryptionError = new Error('Encryption failed');
      encryptionService.encrypt.mockRejectedValue(encryptionError);

      const validSupplierRequest: CreateSupplierRequest = {
        supplierName: 'Test Supplier',
        supplierType: 'distributor',
        primaryContact: {
          name: 'Test Contact',
          email: 'test@supplier.com',
          phone: '1234567890',
          isPrimary: true
        },
        businessAddress: {
          line1: '123 Test Street',
          city: 'Test City',
          postcode: 'T1 1TT',
          country: 'UK'
        },
        paymentTerms: '30 days',
        currency: 'GBP',
        categories: ['Test'],
        averageLeadTime: 7,
        deliveryZones: ['UK'],
        gdprCompliant: true,
        createdBy: mockUserId
      };

      await expect(
        service.createSupplier(validSupplierRequest, mockCorrelationId)
      ).rejects.toThrow();
    });
  });

  describe('Compliance Validation', () => {
    it('should enforce MHRA license requirement for medical devices', async () => {
      const medicalDeviceRequest: CreateInventoryItemRequest = {
        itemCode: 'MD-001',
        itemName: 'Blood Pressure Monitor',
        category: 'Medical Devices',
        unitOfMeasure: 'each',
        unitCost: 150.00,
        minStock: 5,
        isMedicalDevice: true,
        // Missing mhraLicenseNumber
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      repository.findInventoryItemByCode.mockResolvedValue(null);

      await expect(
        service.createInventoryItem(medicalDeviceRequest, mockCorrelationId)
      ).rejects.toThrow(ComplianceViolationError);
    });

    it('should enforce controlled substance license requirement', async () => {
      const controlledSubstanceRequest: CreateInventoryItemRequest = {
        itemCode: 'CS-001',
        itemName: 'Morphine 10mg',
        category: 'Controlled Substances',
        unitOfMeasure: 'tablets',
        unitCost: 5.00,
        minStock: 10,
        isControlledSubstance: true,
        // Missing controlledSubstanceLicense
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      repository.findInventoryItemByCode.mockResolvedValue(null);

      await expect(
        service.createInventoryItem(controlledSubstanceRequest, mockCorrelationId)
      ).rejects.toThrow(ComplianceViolationError);
    });

    it('should enforce hazardous handling instructions requirement', async () => {
      const hazardousRequest: CreateInventoryItemRequest = {
        itemCode: 'HAZ-001',
        itemName: 'Cleaning Chemical',
        category: 'Cleaning Supplies',
        unitOfMeasure: 'bottles',
        unitCost: 10.00,
        minStock: 5,
        isHazardous: true,
        // Missing hazardousHandlingInstructions
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      repository.findInventoryItemByCode.mockResolvedValue(null);

      await expect(
        service.createInventoryItem(hazardousRequest, mockCorrelationId)
      ).rejects.toThrow(ComplianceViolationError);
    });
  });

  describe('Automated Reordering', () => {
    it('should trigger automatic reorder when stock falls below reorder point', async () => {
      const lowStockItem = {
        ...mockInventoryItem,
        currentStock: 50,
        reorderPoint: 100,
        autoReorder: true
      };

      const stockMovementRequest: StockMovementRequest = {
        inventoryItemId: lowStockItem.id,
        movementType: 'usage',
        quantity: 60,
        reason: 'Patient usage',
        performedBy: mockUserId
      };

      repository.getInventoryItem.mockResolvedValue(lowStockItem);
      repository.createStockMovement.mockResolvedValue(mockStockMovement);
      repository.updateInventoryItem.mockResolvedValue(lowStockItem);
      repository.getPreferredSupplier.mockResolvedValue(mockSupplier);
      repository.getNextPurchaseOrderSequence.mockResolvedValue(1);
      repository.createPurchaseOrder.mockResolvedValue(mockPurchaseOrder);

      await service.recordStockMovement(stockMovementRequest, mockCorrelationId);

      // Verify that automatic reorder was triggered
      expect(repository.createPurchaseOrder).toHaveBeenCalled();
    });

    it('should create stock alert when no preferred supplier available', async () => {
      const lowStockItem = {
        ...mockInventoryItem,
        currentStock: 50,
        reorderPoint: 100,
        autoReorder: true
      };

      const stockMovementRequest: StockMovementRequest = {
        inventoryItemId: lowStockItem.id,
        movementType: 'usage',
        quantity: 60,
        reason: 'Patient usage',
        performedBy: mockUserId
      };

      repository.getInventoryItem.mockResolvedValue(lowStockItem);
      repository.createStockMovement.mockResolvedValue(mockStockMovement);
      repository.updateInventoryItem.mockResolvedValue(lowStockItem);
      repository.getPreferredSupplier.mockResolvedValue(null);
      repository.createStockAlert.mockResolvedValue({} as any);

      await service.recordStockMovement(stockMovementRequest, mockCorrelationId);

      expect(repository.createStockAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          alertType: 'no_supplier'
        })
      );
    });
  });
});
