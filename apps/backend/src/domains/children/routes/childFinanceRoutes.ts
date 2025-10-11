import { Router } from 'express';
import { ChildFinanceController } from '../controllers/childFinanceController';
import { ChildFinanceIntegrationService } from '../services/childFinanceIntegrationService';

/**
 * Child Finance Routes
 * 
 * Registers REST API endpoints for children's residential care financial management
 * across all 8 British Isles jurisdictions.
 * 
 * Endpoints:
 * - POST   /api/children/billing                          - Create billing record
 * - GET    /api/children/billing/:childId                 - Get billing
 * - PUT    /api/children/billing/:id                      - Update billing
 * - DELETE /api/children/billing/:id                      - Deactivate billing
 * - GET    /api/children/billing/:childId/invoices        - Get invoices
 * - POST   /api/children/billing/:id/generate-invoice     - Generate invoice manually
 * - POST   /api/children/billing/:id/record-payment/:invoiceId - Record payment
 * - GET    /api/children/billing/reports/overdue          - Overdue invoices report
 * - GET    /api/children/billing/reports/stats            - Financial statistics
 * - GET    /api/children/billing/:childId/report          - Child financial report
 * - GET    /api/children/billing/reports/iro/dashboard    - IRO dashboard
 * - POST   /api/children/billing/:id/raise-dispute        - Raise dispute
 * - POST   /api/children/billing/:id/resolve-dispute      - Resolve dispute
 * - POST   /api/children/billing/:id/transition           - Transition to leaving care
 * 
 * Security:
 * - JWT authentication required (configured in parent router)
 * - Role-based access control (RBAC) via decorators
 * 
 * Integration:
 * - Uses ChildFinanceIntegrationService for all operations
 * - Integrates with Invoice entity/service
 * - Supports transitions to LeavingCareFinances
 */

const router = Router();

// Initialize service (dependency injection handled by NestJS in real implementation)
// For Express-style registration, instantiate service
// NOTE: This is simplified - in production NestJS handles DI
const childFinanceService = new ChildFinanceIntegrationService(
  // Dependencies will be injected by NestJS IoC container
);

const childFinanceController = new ChildFinanceController(childFinanceService);

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create child billing record
 * POST /api/children/billing
 */
router.post(
  '/',
  childFinanceController.createBilling.bind(childFinanceController),
);

/**
 * Get child billing by child ID
 * GET /api/children/billing/:childId
 */
router.get(
  '/:childId',
  childFinanceController.getBilling.bind(childFinanceController),
);

/**
 * Update child billing
 * PUT /api/children/billing/:id
 */
router.put(
  '/:id',
  childFinanceController.updateBilling.bind(childFinanceController),
);

/**
 * Deactivate child billing (soft delete)
 * DELETE /api/children/billing/:id
 */
router.delete(
  '/:id',
  childFinanceController.deactivateBilling.bind(childFinanceController),
);

// ============================================
// INVOICE MANAGEMENT
// ============================================

/**
 * Get invoices for child
 * GET /api/children/billing/:childId/invoices
 */
router.get(
  '/:childId/invoices',
  childFinanceController.getChildInvoices.bind(childFinanceController),
);

/**
 * Generate invoice manually
 * POST /api/children/billing/:id/generate-invoice
 */
router.post(
  '/:id/generate-invoice',
  childFinanceController.generateInvoice.bind(childFinanceController),
);

/**
 * Record payment for invoice
 * POST /api/children/billing/:id/record-payment/:invoiceId
 */
router.post(
  '/:id/record-payment/:invoiceId',
  childFinanceController.recordPayment.bind(childFinanceController),
);

// ============================================
// REPORTING
// ============================================

/**
 * Get overdue invoices report
 * GET /api/children/billing/reports/overdue
 * 
 * IMPORTANT: This MUST be registered BEFORE /:childId route
 * to prevent 'reports' being interpreted as childId
 */
router.get(
  '/reports/overdue',
  childFinanceController.getOverdueInvoices.bind(childFinanceController),
);

/**
 * Get financial statistics
 * GET /api/children/billing/reports/stats
 * 
 * IMPORTANT: This MUST be registered BEFORE /:childId route
 */
router.get(
  '/reports/stats',
  childFinanceController.getFinancialStats.bind(childFinanceController),
);

/**
 * Get IRO financial dashboard
 * GET /api/children/billing/reports/iro/dashboard
 * 
 * IMPORTANT: This MUST be registered BEFORE /:childId route
 */
router.get(
  '/reports/iro/dashboard',
  childFinanceController.getIRODashboard.bind(childFinanceController),
);

/**
 * Get child financial report
 * GET /api/children/billing/:childId/report
 */
router.get(
  '/:childId/report',
  childFinanceController.getChildReport.bind(childFinanceController),
);

// ============================================
// DISPUTE MANAGEMENT
// ============================================

/**
 * Raise dispute
 * POST /api/children/billing/:id/raise-dispute
 */
router.post(
  '/:id/raise-dispute',
  childFinanceController.raiseDispute.bind(childFinanceController),
);

/**
 * Resolve dispute
 * POST /api/children/billing/:id/resolve-dispute
 */
router.post(
  '/:id/resolve-dispute',
  childFinanceController.resolveDispute.bind(childFinanceController),
);

// ============================================
// TRANSITION TO LEAVING CARE
// ============================================

/**
 * Transition to leaving care finances
 * POST /api/children/billing/:id/transition
 */
router.post(
  '/:id/transition',
  childFinanceController.transitionToLeavingCare.bind(childFinanceController),
);

export default router;
