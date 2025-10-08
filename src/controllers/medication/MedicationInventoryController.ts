/**
 * @fileoverview REST API controller for medication inventory and stock management with
 * @module Medication/MedicationInventoryController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description REST API controller for medication inventory and stock management with
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Inventory Controller for WriteCareNotes Healthcare Management
 * @module MedicationInventoryController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for medication inventory and stock management with
 * real-time tracking, automated reordering, supplier management, and delivery coordination
 * across all British Isles jurisdictions.
 * 
 * @compliance
 * - England: MHRA Good Distribution Practice Guidelines, CQC Storage Standards
 * - Scotland: MHRA Good Distribution Practice Guidelines, Care Inspectorate Standards
 * - Wales: MHRA Good Distribution Practice Guidelines, CIW Storage Requirements
 * - Northern Ireland: MHRA Good Distribution Practice Guidelines, RQIA Standards
 * - Republic of Ireland: IMB Good Distribution Practice, HIQA Standards
 * - Isle of Man: DHSC Medication Storage Guidelines
 * - Guernsey: Committee for Health & Social Care Storage Standards
 * - Jersey: Care Commission Storage Requirements
 * - Human Medicines Regulations 2012
 * - GDP Guidelines for Medicinal Products
 * 
 * @security
 * - Encrypted inventory data with field-level protection
 * - Role-based access control for inventory operations
 * - Comprehensive audit trails for all stock movements
 * - Supplier verification and validation
 * - Real-time stock level monitoring and alerts
 */

import { Request, Response } from 'express';
import { 
  MedicationInventoryService, 
  InventoryItem, 
  InventoryFilters,
  StockMovement,
  PurchaseOrder
} from '../../services/medication/MedicationInventoryService';
import { logger } from '../../utils/logger';

/**
 * Controller class for medication inventory and stock management operations
 * Handles HTTP requests for inventory tracking, stock movements, purchase orders,
 * delivery receipts, and supplier management with comprehensive validation and
 * automated reordering capabilities across all British Isles jurisdictions.
 */
export class MedicationInventoryController {
  private inventoryService: MedicationInventoryService;

  constructor() {
    this.inventoryService = new MedicationInventoryService();
  }

  /**
   * Add new inventory item
   */
  async addInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        medicationId,
        medicationName,
        batchNumber,
        expiryDate,
        manufacturerName,
        supplierName,
        supplierReference,
        currentStock,
        reservedStock = 0,
        minimumStockLevel,
        maximumStockLevel,
        reorderLevel,
        reorderQuantity,
        unitCost,
        storageLocation,
        storageConditions,
        temperatureRange
      } = req.body;

      // Validate required fields
      if (!medicationId || !medicationName || !batchNumber || !expiryDate || 
          !manufacturerName || !supplierName || currentStock === undefined || 
          !minimumStockLevel || !maximumStockLevel || !reorderLevel || 
          !reorderQuantity || !unitCost || !storageLocation || !storageConditions) {
        res.status(400).json({ 
          error: 'Missing required fields for inventory item' 
        });
        return;
      }

      // Validate numeric fields
      if (currentStock < 0 || reservedStock < 0 || minimumStockLevel < 0 || 
          maximumStockLevel < 0 || reorderLevel < 0 || reorderQuantity <= 0 || unitCost <= 0) {
        res.status(400).json({ 
          error: 'Numeric fields must be non-negative (quantities and costs must be positive)' 
        });
        return;
      }

      // Validate expiry date
      const expiryDateTime = new Date(expiryDate);
      if (isNaN(expiryDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid expiry date format' });
        return;
      }

      // Validate temperature range if provided
      if (temperatureRange) {
        if (typeof temperatureRange.min !== 'number' || typeof temperatureRange.max !== 'number') {
          res.status(400).json({ error: 'Temperature range min and max must be numbers' });
          return;
        }
        if (temperatureRange.min >= temperatureRange.max) {
          res.status(400).json({ error: 'Temperature range min must be less than max' });
          return;
        }
        if (!['celsius', 'fahrenheit'].includes(temperatureRange.unit)) {
          res.status(400).json({ error: 'Temperature unit must be celsius or fahrenheit' });
          return;
        }
      }

      const itemData = {
        medicationId,
        medicationName,
        batchNumber,
        expiryDate: expiryDateTime,
        manufacturerName,
        supplierName,
        supplierReference,
        currentStock,
        reservedStock,
        minimumStockLevel,
        maximumStockLevel,
        reorderLevel,
        reorderQuantity,
        unitCost,
        storageLocation,
        storageConditions,
        temperatureRange,
        organizationId
      };

      const inventoryItem = await this.inventoryService.addInventoryItem(
        itemData,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Inventory item added successfully',
        data: inventoryItem
      });
    } catch (error: unknown) {
      console.error('Error in addInventoryItem controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('expired medication')) {
        res.status(400).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('cannot be negative') || 
                 error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('must be less than') ||
                 error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('should be at or above')) {
        res.status(400).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to add inventory item' });
      }
    }
  }

  /**
   * Record stock movement
   */
  async recordStockMovement(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { inventoryItemId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!inventoryItemId) {
        res.status(400).json({ error: 'Inventory item ID is required' });
        return;
      }

      const {
        movementType,
        quantity,
        reason,
        reference,
        residentId,
        prescriptionId,
        administrationId,
        notes,
        authorizedBy
      } = req.body;

      // Validate required fields
      if (!movementType || !quantity || !reason) {
        res.status(400).json({ 
          error: 'Missing required fields: movementType, quantity, reason' 
        });
        return;
      }

      // Validate movement type
      const validMovementTypes = ['receipt', 'issue', 'adjustment', 'transfer', 'waste', 'return', 'expired'];
      if (!validMovementTypes.includes(movementType)) {
        res.status(400).json({ 
          error: 'Invalid movement type. Must be one of: ' + validMovementTypes.join(', ')
        });
        return;
      }

      // Validate quantity
      if (typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({ error: 'Quantity must be a positive number' });
        return;
      }

      const movementData = {
        movementType,
        quantity,
        reason,
        reference,
        residentId,
        prescriptionId,
        administrationId,
        notes
      };

      const stockMovement = await this.inventoryService.recordStockMovement(
        inventoryItemId,
        movementData,
        organizationId,
        userId,
        authorizedBy
      );

      res.status(201).json({
        message: 'Stock movement recorded successfully',
        data: stockMovement
      });
    } catch (error: unknown) {
      console.error('Error in recordStockMovement controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Insufficient stock') || 
                 error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('negative stock')) {
        res.status(409).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Invalid movement type')) {
        res.status(400).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to record stock movement' });
      }
    }
  }

  /**
   * Create purchase order
   */
  async createPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        supplierId,
        expectedDeliveryDate,
        items,
        deliveryAddress,
        specialInstructions
      } = req.body;

      // Validate required fields
      if (!supplierId || !expectedDeliveryDate || !items || !deliveryAddress) {
        res.status(400).json({ 
          error: 'Missing required fields: supplierId, expectedDeliveryDate, items, deliveryAddress' 
        });
        return;
      }

      // Validate expected delivery date
      const deliveryDateTime = new Date(expectedDeliveryDate);
      if (isNaN(deliveryDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid expected delivery date format' });
        return;
      }

      if (deliveryDateTime <= new Date()) {
        res.status(400).json({ error: 'Expected delivery date must be in the future' });
        return;
      }

      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Items must be a non-empty array' });
        return;
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.medicationId || !item.quantityOrdered || !item.unitPrice) {
          res.status(400).json({ 
            error: `Item ${i + 1}: Missing required fields (medicationId, quantityOrdered, unitPrice)` 
          });
          return;
        }
        if (item.quantityOrdered <= 0 || item.unitPrice <= 0) {
          res.status(400).json({ 
            error: `Item ${i + 1}: Quantity and unit price must be positive` 
          });
          return;
        }
        if (item.expectedExpiryDate) {
          const expiryDate = new Date(item.expectedExpiryDate);
          if (isNaN(expiryDate.getTime())) {
            res.status(400).json({ 
              error: `Item ${i + 1}: Invalid expected expiry date format` 
            });
            return;
          }
        }
      }

      // Validate delivery address
      if (!deliveryAddress.street || !deliveryAddress.city || 
          !deliveryAddress.postcode || !deliveryAddress.country) {
        res.status(400).json({ 
          error: 'Delivery address must include street, city, postcode, and country' 
        });
        return;
      }

      const orderData = {
        supplierId,
        expectedDeliveryDate: deliveryDateTime,
        items,
        deliveryAddress,
        specialInstructions
      };

      const purchaseOrder = await this.inventoryService.createPurchaseOrder(
        orderData,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Purchase order created successfully',
        data: purchaseOrder
      });
    } catch (error: unknown) {
      console.error('Error in createPurchaseOrder controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Supplier not found') || 
          error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not active')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Medication') && error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('minimum order value')) {
        res.status(400).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to create purchase order' });
      }
    }
  }

  /**
   * Get inventory items with filtering and pagination
   */
  async getInventoryItems(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 100);

      const filters: InventoryFilters = {};

      // Apply filters from query parameters
      if (req.query['medicationName']) {
        filters.medicationName = req.query['medicationName'] as string;
      }
      if (req.query['batchNumber']) {
        filters.batchNumber = req.query['batchNumber'] as string;
      }
      if (req.query['supplierName']) {
        filters.supplierName = req.query['supplierName'] as string;
      }
      if (req.query['storageLocation']) {
        filters.storageLocation = req.query['storageLocation'] as string;
      }
      if (req.query['lowStock'] !== undefined) {
        filters.lowStock = req.query['lowStock'] === 'true';
      }
      if (req.query['expiringWithinDays']) {
        const days = parseInt(req.query['expiringWithinDays'] as string);
        if (isNaN(days) || days < 0) {
          res.status(400).json({ error: 'expiringWithinDays must be a non-negative number' });
          return;
        }
        filters.expiringWithinDays = days;
      }
      if (req.query['expiredItems'] !== undefined) {
        filters.expiredItems = req.query['expiredItems'] === 'true';
      }
      if (req.query['minimumStock']) {
        const minStock = parseInt(req.query['minimumStock'] as string);
        if (isNaN(minStock) || minStock < 0) {
          res.status(400).json({ error: 'minimumStock must be a non-negative number' });
          return;
        }
        filters.minimumStock = minStock;
      }
      if (req.query['maximumStock']) {
        const maxStock = parseInt(req.query['maximumStock'] as string);
        if (isNaN(maxStock) || maxStock < 0) {
          res.status(400).json({ error: 'maximumStock must be a non-negative number' });
          return;
        }
        filters.maximumStock = maxStock;
      }
      if (req.query['isActive'] !== undefined) {
        filters.isActive = req.query['isActive'] === 'true';
      }

      const result = await this.inventoryService.getInventoryItems(
        filters,
        organizationId,
        page,
        limit
      );

      res.json({
        message: 'Inventory items retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      console.error('Error in getInventoryItems controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve inventory items' });
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await this.inventoryService.getInventoryStats(organizationId);

      res.json({
        message: 'Inventory statistics retrieved successfully',
        data: stats
      });
    } catch (error: unknown) {
      console.error('Error in getInventoryStats controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve inventory statistics' });
    }
  }

  /**
   * Get expiring medications
   */
  async getExpiringMedications(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const daysAhead = parseInt(req.query['daysAhead'] as string) || 30;

      if (daysAhead < 1 || daysAhead > 365) {
        res.status(400).json({ 
          error: 'Days ahead must be between 1 and 365' 
        });
        return;
      }

      const expiringMedications = await this.inventoryService.getExpiringMedications(
        organizationId,
        daysAhead
      );

      res.json({
        message: 'Expiring medications retrieved successfully',
        data: {
          medications: expiringMedications,
          count: expiringMedications.length,
          daysAhead
        }
      });
    } catch (error: unknown) {
      console.error('Error in getExpiringMedications controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve expiring medications' });
    }
  }

  /**
   * Process delivery receipt
   */
  async processDeliveryReceipt(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { purchaseOrderId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!purchaseOrderId) {
        res.status(400).json({ error: 'Purchase order ID is required' });
        return;
      }

      const {
        deliveryDate,
        deliveryReference,
        items
      } = req.body;

      // Validate required fields
      if (!deliveryDate || !deliveryReference || !items) {
        res.status(400).json({ 
          error: 'Missing required fields: deliveryDate, deliveryReference, items' 
        });
        return;
      }

      // Validate delivery date
      const deliveryDateTime = new Date(deliveryDate);
      if (isNaN(deliveryDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid delivery date format' });
        return;
      }

      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Items must be a non-empty array' });
        return;
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.medicationId || !item.quantityReceived || !item.batchNumber || 
            !item.actualExpiryDate || !item.condition) {
          res.status(400).json({ 
            error: `Item ${i + 1}: Missing required fields` 
          });
          return;
        }
        if (item.quantityReceived <= 0) {
          res.status(400).json({ 
            error: `Item ${i + 1}: Quantity received must be positive` 
          });
          return;
        }
        if (!['good', 'damaged', 'expired'].includes(item.condition)) {
          res.status(400).json({ 
            error: `Item ${i + 1}: Condition must be good, damaged, or expired` 
          });
          return;
        }
        const expiryDate = new Date(item.actualExpiryDate);
        if (isNaN(expiryDate.getTime())) {
          res.status(400).json({ 
            error: `Item ${i + 1}: Invalid expiry date format` 
          });
          return;
        }
      }

      const deliveryData = {
        deliveryDate: deliveryDateTime,
        deliveryReference,
        items
      };

      const updatedPurchaseOrder = await this.inventoryService.processDeliveryReceipt(
        purchaseOrderId,
        deliveryData,
        organizationId,
        userId
      );

      res.json({
        message: 'Delivery receipt processed successfully',
        data: updatedPurchaseOrder
      });
    } catch (error: unknown) {
      console.error('Error in processDeliveryReceipt controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('already completed') || 
                 error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('cancelled')) {
        res.status(409).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('exceeds ordered quantity')) {
        res.status(400).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to process delivery receipt' });
      }
    }
  }
}