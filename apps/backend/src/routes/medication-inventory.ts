import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MedicationInventoryController } from '../controllers/medication/MedicationInventoryController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';

const router = Router();
const inventoryController = new MedicationInventoryController();

/**
 * @route POST /api/medication-inventory/items
 * @desc Add new inventory item with stock receipt
 * @access Private (Pharmacy Manager, Senior Nurse, Admin)
 */
router.post(
  '/items',
  rbacMiddleware(['pharmacy_manager', 'senior_nurse', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => inventoryController.addInventoryItem(req, res)
);

/**
 * @route GET /api/medication-inventory/items
 * @desc Get inventory items with filtering and pagination
 * @access Private (Pharmacy Staff, Nurse, Doctor, Admin, Viewer)
 * @query medicationName - Filter by medication name
 * @query batchNumber - Filter by batch number
 * @query supplierName - Filter by supplier name
 * @query storageLocation - Filter by storage location
 * @query lowStock - Filter for low stock items (boolean)
 * @query expiringWithinDays - Filter for items expiring within specified days
 * @query expiredItems - Filter for expired items (boolean)
 * @query minimumStock - Filter by minimum stock level
 * @query maximumStock - Filter by maximum stock level
 * @query isActive - Filter by active status (boolean)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50, max: 100)
 */
router.get(
  '/items',
  rbacMiddleware(['pharmacy_staff', 'nurse', 'doctor', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => inventoryController.getInventoryItems(req, res)
);

/**
 * @route POST /api/medication-inventory/items/:inventoryItemId/movements
 * @desc Record stock movement (issue, adjustment, transfer, etc.)
 * @access Private (Pharmacy Staff, Nurse, Admin)
 */
router.post(
  '/items/:inventoryItemId/movements',
  rbacMiddleware(['pharmacy_staff', 'nurse', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => inventoryController.recordStockMovement(req, res)
);

/**
 * @route POST /api/medication-inventory/purchase-orders
 * @desc Create purchase order for medication restock
 * @access Private (Pharmacy Manager, Admin)
 */
router.post(
  '/purchase-orders',
  rbacMiddleware(['pharmacy_manager', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => inventoryController.createPurchaseOrder(req, res)
);

/**
 * @route POST /api/medication-inventory/purchase-orders/:purchaseOrderId/delivery-receipt
 * @desc Process delivery receipt and update inventory
 * @access Private (Pharmacy Staff, Pharmacy Manager, Admin)
 */
router.post(
  '/purchase-orders/:purchaseOrderId/delivery-receipt',
  rbacMiddleware(['pharmacy_staff', 'pharmacy_manager', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => inventoryController.processDeliveryReceipt(req, res)
);

/**
 * @route GET /api/medication-inventory/stats
 * @desc Get inventory statistics and analytics
 * @access Private (Pharmacy Manager, Admin, Viewer)
 */
router.get(
  '/stats',
  rbacMiddleware(['pharmacy_manager', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => inventoryController.getInventoryStats(req, res)
);

/**
 * @route GET /api/medication-inventory/expiring
 * @desc Get expiring medications within specified days
 * @access Private (Pharmacy Staff, Nurse, Doctor, Admin, Viewer)
 * @query daysAhead - Number of days ahead to check for expiry (default: 30, max: 365)
 */
router.get(
  '/expiring',
  rbacMiddleware(['pharmacy_staff', 'nurse', 'doctor', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => inventoryController.getExpiringMedications(req, res)
);

export default router;