/**
 * @fileoverview Inventory & Supply Chain Service API Routes for WriteCareNotes
 * @module InventoryServiceRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive API routes for inventory and supply chain management operations
 * providing RESTful endpoints for stock management, automated reordering, supplier management,
 * asset tracking, and compliance monitoring with full healthcare regulations compliance.
 * 
 * @compliance
 * - MHRA (Medicines and Healthcare products Regulatory Agency) regulations
 * - CQC (Care Quality Commission) requirements for medical supplies
 * - NHS Supply Chain standards and procedures
 * - GDPR data protection requirements
 * - Role-based access control for healthcare operations
 * 
 * @security
 * - Implements JWT authentication and role-based authorization
 * - Validates all input data with comprehensive schemas
 * - Includes rate limiting and request throttling
 * - Implements comprehensive audit logging for all operations
 */
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { InventoryController } from '@/controllers/inventory/InventoryController';
import { authMiddleware } from '@/middleware/authMiddleware';
import { roleMiddleware } from '@/middleware/roleMiddleware';
import { auditMiddleware } from '@/middleware/auditMiddleware';
import { correlationIdMiddleware } from '@/middleware/correlationIdMiddleware';
import { validationMiddleware } from '@/middleware/validationMiddleware';
import { errorHandlerMiddleware } from '@/middleware/errorHandlerMiddleware';
import { logger } from '@/utils/logger';

const router = Router();
const inventoryController = new InventoryController();

// Rate limiting configurations
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs for write operations
  message: 'Too many write requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply middleware to all routes
router.use(correlationIdMiddleware);
router.use(authMiddleware);
router.use(auditMiddleware);

// =====================================================================================
// INVENTORY ITEMS ROUTES
// =====================================================================================

/**
 * @route POST /api/v1/inventory/items
 * @desc Create new inventory item
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.post(
  '/items',
  strictRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    body('itemCode')
      .notEmpty()
      .withMessage('Item code is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Item code must be between 1 and 50 characters')
      .matches(/^[A-Z0-9-_]+$/)
      .withMessage('Item code must contain only uppercase let ters, numbers, hyphens, and underscores'),
    
    body('itemName')
      .notEmpty()
      .withMessage('Item name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Item name must be between 1 and 255 characters'),
    
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Category must be between 1 and 100 characters'),
    
    body('unitOfMeasure')
      .notEmpty()
      .withMessage('Unit of measure is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Unit of measure must be between 1 and 50 characters'),
    
    body('unitCost')
      .isFloat({ min: 0 })
      .withMessage('Unit cost must be a non-negative number'),
    
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-character code')
      .isIn(['GBP', 'EUR', 'USD'])
      .withMessage('Currency must be GBP, EUR, or USD'),
    
    body('initialStock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Initial stock must be a non-negative integer'),
    
    body('minStock')
      .isInt({ min: 0 })
      .withMessage('Minimum stock must be a non-negative integer'),
    
    body('maxStock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Maximum stock must be a non-negative integer'),
    
    body('reorderPoint')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reorder point must be a non-negative integer'),
    
    body('averageUsage')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Average usage must be a non-negative number'),
    
    body('leadTimeDays')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('Lead time must be between 0 and 365 days'),
    
    body('isMedicalDevice')
      .optional()
      .isBoolean()
      .withMessage('Is medical device must be a boolean'),
    
    body('isControlledSubstance')
      .optional()
      .isBoolean()
      .withMessage('Is controlled substance must be a boolean'),
    
    body('isHazardous')
      .optional()
      .isBoolean()
      .withMessage('Is hazardous must be a boolean'),
    
    body('mhraLicenseNumber')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('MHRA license number must be between 1 and 100 characters'),
    
    body('controlledSubstanceLicense')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Controlled substance license must be between 1 and 100 characters'),
    
    body('autoReorder')
      .optional()
      .isBoolean()
      .withMessage('Auto reorder must be a boolean'),
    
    body('trackExpiry')
      .optional()
      .isBoolean()
      .withMessage('Track expiry must be a boolean'),
    
    body('trackBatches')
      .optional()
      .isBoolean()
      .withMessage('Track batches must be a boolean'),
    
    body('careHomeId')
      .isUUID()
      .withMessage('Care home ID must be a valid UUID')
  ],
  validationMiddleware,
  inventoryController.createInventoryItem.bind(inventoryController)
);

/**
 * @route GET /api/v1/inventory/items/:id
 * @desc Get inventory item by ID
 * @access Private (inventory_manager, care_home_admin, care_worker, system_admin)
 */
router.get(
  '/items/:id',
  standardRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'care_worker', 'system_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('Inventory item ID must be a valid UUID')
  ],
  validationMiddleware,
  inventoryController.getInventoryItem.bind(inventoryController)
);

/**
 * @route GET /api/v1/inventory/items
 * @desc Search inventory items with filters
 * @access Private (inventory_manager, care_home_admin, care_worker, system_admin)
 */
router.get(
  '/items',
  standardRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'care_worker', 'system_admin']),
  [
    query('careHomeId')
      .optional()
      .isUUID()
      .withMessage('Care home ID must be a valid UUID'),
    
    query('category')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category must be between 1 and 100 characters'),
    
    query('stockStatus')
      .optional()
      .isIn(['in_stock', 'low_stock', 'out_of_stock', 'overstock'])
      .withMessage('Stock status must be oneof: in_stock, low_stock, out_of_stock, overstock'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'discontinued'])
      .withMessage('Status must be oneof: active, inactive, discontinued'),
    
    query('searchTerm')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Search term must be between 1 and 255 characters'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sortBy')
      .optional()
      .isIn(['itemName', 'itemCode', 'category', 'currentStock', 'createdAt', 'updatedAt'])
      .withMessage('Sort by must be oneof: itemName, itemCode, category, currentStock, createdAt, updatedAt'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  inventoryController.searchInventoryItems.bind(inventoryController)
);

/**
 * @route PUT /api/v1/inventory/items/:id
 * @desc Update inventory item
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.put(
  '/items/:id',
  strictRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('Inventory item ID must be a valid UUID'),
    
    body('itemName')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Item name must be between 1 and 255 characters'),
    
    body('unitCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit cost must be a non-negative number'),
    
    body('minStock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum stock must be a non-negative integer'),
    
    body('maxStock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Maximum stock must be a non-negative integer'),
    
    body('reorderPoint')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reorder point must be a non-negative integer'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'discontinued'])
      .withMessage('Status must be oneof: active, inactive, discontinued')
  ],
  validationMiddleware,
  inventoryController.updateInventoryItem.bind(inventoryController)
);

// =====================================================================================
// PURCHASE ORDERS ROUTES
// =====================================================================================

/**
 * @route POST /api/v1/inventory/purchase-orders
 * @desc Create new purchase order
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.post(
  '/purchase-orders',
  strictRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    body('supplierId')
      .isUUID()
      .withMessage('Supplier ID must be a valid UUID'),
    
    body('careHomeId')
      .isUUID()
      .withMessage('Care home ID must be a valid UUID'),
    
    body('orderItems')
      .isArray({ min: 1 })
      .withMessage('Order items must be a non-empty array'),
    
    body('orderItems.*.inventoryItemId')
      .isUUID()
      .withMessage('Inventory item ID must be a valid UUID'),
    
    body('orderItems.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    
    body('orderItems.*.unitCost')
      .isFloat({ min: 0 })
      .withMessage('Unit cost must be a non-negative number'),
    
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Priority must be oneof: low, normal, high, urgent'),
    
    body('expectedDeliveryDate')
      .optional()
      .isISO8601()
      .withMessage('Expected delivery date must be a valid ISO 8601 date'),
    
    body('currency')
      .optional()
      .isIn(['GBP', 'EUR', 'USD'])
      .withMessage('Currency must be GBP, EUR, or USD')
  ],
  validationMiddleware,
  inventoryController.createPurchaseOrder.bind(inventoryController)
);

/**
 * @route GET /api/v1/inventory/purchase-orders/:id
 * @desc Get purchase order by ID
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.get(
  '/purchase-orders/:id',
  standardRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('Purchase order ID must be a valid UUID')
  ],
  validationMiddleware,
  inventoryController.getPurchaseOrder.bind(inventoryController)
);

// =====================================================================================
// STOCK MOVEMENTS ROUTES
// =====================================================================================

/**
 * @route POST /api/v1/inventory/stock-movements
 * @desc Record stock movement
 * @access Private (inventory_manager, care_home_admin, care_worker, system_admin)
 */
router.post(
  '/stock-movements',
  strictRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'care_worker', 'system_admin']),
  [
    body('inventoryItemId')
      .isUUID()
      .withMessage('Inventory item ID must be a valid UUID'),
    
    body('movementType')
      .isIn(['stock_in', 'stock_out', 'purchase', 'usage', 'waste', 'transfer_in', 'transfer_out', 'adjustment_in', 'adjustment_out'])
      .withMessage('Movement type must be one of the valid types'),
    
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    
    body('unitCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit cost must be a non-negative number'),
    
    body('reason')
      .notEmpty()
      .withMessage('Reason is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Reason must be between 1 and 100 characters'),
    
    body('reference')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Reference must be between 1 and 100 characters'),
    
    body('batchNumber')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Batch number must be between 1 and 50 characters'),
    
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be a valid ISO 8601 date'),
    
    body('fromLocation')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('From location must be between 1 and 100 characters'),
    
    body('toLocation')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('To location must be between 1 and 100 characters')
  ],
  validationMiddleware,
  inventoryController.recordStockMovement.bind(inventoryController)
);

/**
 * @route GET /api/v1/inventory/stock-movements
 * @desc Get stock movements with filters
 * @access Private (inventory_manager, care_home_admin, care_worker, system_admin)
 */
router.get(
  '/stock-movements',
  standardRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'care_worker', 'system_admin']),
  [
    query('inventoryItemId')
      .optional()
      .isUUID()
      .withMessage('Inventory item ID must be a valid UUID'),
    
    query('movementType')
      .optional()
      .isIn(['stock_in', 'stock_out', 'purchase', 'usage', 'waste', 'transfer_in', 'transfer_out', 'adjustment_in', 'adjustment_out'])
      .withMessage('Movement type must be one of the valid types'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validationMiddleware,
  inventoryController.getStockMovements.bind(inventoryController)
);

// =====================================================================================
// SUPPLIERS ROUTES
// =====================================================================================

/**
 * @route POST /api/v1/inventory/suppliers
 * @desc Create new supplier
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.post(
  '/suppliers',
  strictRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    body('supplierName')
      .notEmpty()
      .withMessage('Supplier name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Supplier name must be between 1 and 255 characters'),
    
    body('supplierType')
      .isIn(['manufacturer', 'distributor', 'wholesaler', 'service_provider'])
      .withMessage('Supplier type must be oneof: manufacturer, distributor, wholesaler, service_provider'),
    
    body('primaryContact.name')
      .notEmpty()
      .withMessage('Primary contact name is required'),
    
    body('primaryContact.email')
      .isEmail()
      .withMessage('Primary contact email must be valid'),
    
    body('primaryContact.phone')
      .notEmpty()
      .withMessage('Primary contact phone is required')
      .matches(/^[\+]?[0-9\s\-\(\)]+$/)
      .withMessage('Primary contact phone must be valid'),
    
    body('businessAddress.line1')
      .notEmpty()
      .withMessage('Business address line 1 is required'),
    
    body('businessAddress.city')
      .notEmpty()
      .withMessage('Business address city is required'),
    
    body('businessAddress.postcode')
      .notEmpty()
      .withMessage('Business address postcode is required')
      .matches(/^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/i)
      .withMessage('Business address postcode must be valid UK format'),
    
    body('businessAddress.country')
      .notEmpty()
      .withMessage('Business address country is required'),
    
    body('paymentTerms')
      .notEmpty()
      .withMessage('Payment terms are required'),
    
    body('currency')
      .optional()
      .isIn(['GBP', 'EUR', 'USD'])
      .withMessage('Currency must be GBP, EUR, or USD'),
    
    body('categories')
      .isArray({ min: 1 })
      .withMessage('Categories must be a non-empty array'),
    
    body('averageLeadTime')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('Average lead time must be between 0 and 365 days'),
    
    body('gdprCompliant')
      .optional()
      .isBoolean()
      .withMessage('GDPR compliant must be a boolean')
  ],
  validationMiddleware,
  inventoryController.createSupplier.bind(inventoryController)
);

/**
 * @route GET /api/v1/inventory/suppliers/:id
 * @desc Get supplier by ID
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.get(
  '/suppliers/:id',
  standardRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('Supplier ID must be a valid UUID')
  ],
  validationMiddleware,
  inventoryController.getSupplier.bind(inventoryController)
);

// =====================================================================================
// METRICS AND REPORTING ROUTES
// =====================================================================================

/**
 * @route GET /api/v1/inventory/metrics
 * @desc Get inventory metrics and analytics
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.get(
  '/metrics',
  standardRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    query('careHomeId')
      .isUUID()
      .withMessage('Care home ID must be a valid UUID'),
    
    query('period')
      .isIn(['current_month', 'last_month', 'current_quarter', 'last_quarter', 'current_year', 'last_year', 'custom'])
      .withMessage('Period must be one of the valid options'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    
    query('includeStockMetrics')
      .optional()
      .isBoolean()
      .withMessage('Include stock metrics must be a boolean'),
    
    query('includeOrderMetrics')
      .optional()
      .isBoolean()
      .withMessage('Include order metrics must be a boolean'),
    
    query('includeSupplierMetrics')
      .optional()
      .isBoolean()
      .withMessage('Include supplier metrics must be a boolean'),
    
    query('includeComplianceMetrics')
      .optional()
      .isBoolean()
      .withMessage('Include compliance metrics must be a boolean'),
    
    query('includeCostMetrics')
      .optional()
      .isBoolean()
      .withMessage('Include cost metrics must be a boolean')
  ],
  validationMiddleware,
  inventoryController.getInventoryMetrics.bind(inventoryController)
);

/**
 * @route GET /api/v1/inventory/reports/stock-levels
 * @desc Generate stock levels report
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.get(
  '/reports/stock-levels',
  standardRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    query('careHomeId')
      .isUUID()
      .withMessage('Care home ID must be a valid UUID'),
    
    query('format')
      .optional()
      .isIn(['pdf', 'excel', 'csv', 'json'])
      .withMessage('Format must be oneof: pdf, excel, csv, json'),
    
    query('includeDetails')
      .optional()
      .isBoolean()
      .withMessage('Include details must be a boolean')
  ],
  validationMiddleware,
  inventoryController.generateStockLevelsReport.bind(inventoryController)
);

// =====================================================================================
// ALERTS AND NOTIFICATIONS ROUTES
// =====================================================================================

/**
 * @route GET /api/v1/inventory/alerts
 * @desc Get active stock alerts
 * @access Private (inventory_manager, care_home_admin, care_worker, system_admin)
 */
router.get(
  '/alerts',
  standardRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'care_worker', 'system_admin']),
  [
    query('careHomeId')
      .optional()
      .isUUID()
      .withMessage('Care home ID must be a valid UUID'),
    
    query('alertType')
      .optional()
      .isIn(['low_stock', 'critical_stock', 'out_of_stock', 'expiry_warning', 'expired', 'no_supplier', 'reorder_failed'])
      .withMessage('Alert type must be one of the valid types'),
    
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Severity must be oneof: low, medium, high, critical'),
    
    query('isResolved')
      .optional()
      .isBoolean()
      .withMessage('Is resolved must be a boolean')
  ],
  validationMiddleware,
  inventoryController.getStockAlerts.bind(inventoryController)
);

/**
 * @route PUT /api/v1/inventory/alerts/:id/resolve
 * @desc Resolve stock alert
 * @access Private (inventory_manager, care_home_admin, system_admin)
 */
router.put(
  '/alerts/:id/resolve',
  strictRateLimit,
  roleMiddleware(['inventory_manager', 'care_home_admin', 'system_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('Alert ID must be a valid UUID'),
    
    body('resolutionNotes')
      .optional()
      .isLength({ min: 1, max: 500 })
      .withMessage('Resolution notes must be between 1 and 500 characters')
  ],
  validationMiddleware,
  inventoryController.resolveStockAlert.bind(inventoryController)
);

// Error handling middleware
router.use(errorHandlerMiddleware);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'inventory-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
