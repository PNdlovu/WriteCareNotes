import { Router } from 'express';
import { ChildAllowanceController } from '../controllers/childAllowanceController';
import { authMiddleware } from '../../auth/middleware/auth.middleware';
import { roleMiddleware } from '../../auth/middleware/role.middleware';
import { UserRole } from '../../users/enums/user-role.enum';
import multer from 'multer';
import path from 'path';

/**
 * Child Allowance Routes
 * 
 * Express routes for pocket money, allowances, and savings management.
 * 
 * All routes require JWT authentication.
 * Role-based access control (RBAC) enforced per endpoint.
 * 
 * BASE PATH: /api/children/allowances
 * 
 * ROUTE GROUPS:
 * - /pocket-money/* - Pocket money disbursement (6 routes)
 * - /allowances/* - Allowance expenditure (6 routes)
 * - /savings/* - Savings accounts (7 routes)
 * - /reports/* - Analytics & reports (4 routes)
 * - /rates/* - British Isles rates lookup (1 route)
 * 
 * @module childAllowanceRoutes
 */

const router = Router();

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  },
});

// Initialize controller (in production, use dependency injection)
const controller = new ChildAllowanceController(/* inject service */);

// ==================== POCKET MONEY ROUTES ====================

/**
 * POST /api/children/allowances/pocket-money/disburse
 * Disburse weekly pocket money
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
 */
router.post(
  '/pocket-money/disburse',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.disbursePocketMoney(req.body, req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/children/allowances/pocket-money/:id/confirm-receipt
 * Confirm child receipt of pocket money
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
 */
router.patch(
  '/pocket-money/:id/confirm-receipt',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.confirmPocketMoneyReceipt(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/children/allowances/pocket-money/:id/record-refusal
 * Record pocket money refusal
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
 */
router.patch(
  '/pocket-money/:id/record-refusal',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.recordPocketMoneyRefusal(req.params.id, req.body, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/children/allowances/pocket-money/:id/withhold
 * Withhold pocket money (manager only)
 * Roles: MANAGER, ADMIN
 */
router.patch(
  '/pocket-money/:id/withhold',
  authMiddleware,
  roleMiddleware([UserRole.MANAGER, UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const result = await controller.withholdPocketMoney(req.params.id, req.body, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/children/allowances/pocket-money/:id/defer
 * Defer pocket money disbursement
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
 */
router.patch(
  '/pocket-money/:id/defer',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.deferPocketMoney(req.params.id, req.body, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/children/allowances/pocket-money/child/:childId
 * Get pocket money transactions for child
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN
 */
router.get(
  '/pocket-money/child/:childId',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.getPocketMoneyTransactions(
        req.params.childId,
        req.query.year ? parseInt(req.query.year as string) : undefined,
        req.query.status as any,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// ==================== ALLOWANCE EXPENDITURE ROUTES ====================

/**
 * POST /api/children/allowances/allowances/request
 * Request allowance expenditure
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
 */
router.post(
  '/allowances/request',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.requestAllowanceExpenditure(req.body, req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/children/allowances/allowances/:id/approve
 * Approve allowance expenditure
 * Roles: SOCIAL_WORKER, MANAGER, ADMIN
 */
router.patch(
  '/allowances/:id/approve',
  authMiddleware,
  roleMiddleware([UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const result = await controller.approveAllowanceExpenditure(req.params.id, req.body, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/children/allowances/allowances/:id/reject
 * Reject allowance expenditure
 * Roles: SOCIAL_WORKER, MANAGER, ADMIN
 */
router.patch(
  '/allowances/:id/reject',
  authMiddleware,
  roleMiddleware([UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const result = await controller.rejectAllowanceExpenditure(req.params.id, req.body, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/children/allowances/allowances/:id/upload-receipt
 * Upload receipt for expenditure
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
 */
router.post(
  '/allowances/:id/upload-receipt',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ]),
  upload.single('file'),
  async (req, res, next) => {
    try {
      const result = await controller.uploadReceipt(req.params.id, req.file, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/children/allowances/allowances/:id/verify-receipt
 * Verify receipt
 * Roles: SOCIAL_WORKER, MANAGER, ADMIN
 */
router.patch(
  '/allowances/:id/verify-receipt',
  authMiddleware,
  roleMiddleware([UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const result = await controller.verifyReceipt(req.params.id, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/children/allowances/allowances/child/:childId
 * Get allowance expenditures for child
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN
 */
router.get(
  '/allowances/child/:childId',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.getAllowanceExpenditures(
        req.params.childId,
        req.query.allowanceType as any,
        req.query.category as string,
        req.query.approvalStatus as any,
        req.query.year ? parseInt(req.query.year as string) : undefined,
        req.query.quarter ? parseInt(req.query.quarter as string) : undefined,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// ==================== SAVINGS ACCOUNT ROUTES ====================

/**
 * POST /api/children/allowances/savings/open
 * Open savings account
 * Roles: SOCIAL_WORKER, MANAGER, ADMIN
 */
router.post(
  '/savings/open',
  authMiddleware,
  roleMiddleware([UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const result = await controller.openSavingsAccount(req.body, req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/children/allowances/savings/:accountId/deposit
 * Deposit to savings
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
 */
router.post(
  '/savings/:accountId/deposit',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.depositToSavings(req.params.accountId, req.body, req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/children/allowances/savings/:accountId/withdraw
 * Request withdrawal
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
 */
router.post(
  '/savings/:accountId/withdraw',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.requestSavingsWithdrawal(req.params.accountId, req.body, req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/children/allowances/savings/withdrawals/:transactionId/approve
 * Approve withdrawal
 * Roles: SOCIAL_WORKER, MANAGER, ADMIN
 */
router.patch(
  '/savings/withdrawals/:transactionId/approve',
  authMiddleware,
  roleMiddleware([UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const result = await controller.approveSavingsWithdrawal(req.params.transactionId, req.body, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/children/allowances/savings/child/:childId
 * Get savings account
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN
 */
router.get(
  '/savings/child/:childId',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.getSavingsAccount(
        req.params.childId,
        req.query.accountType as any,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/children/allowances/savings/:accountId/transactions
 * Get savings transactions
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN
 */
router.get(
  '/savings/:accountId/transactions',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.getSavingsTransactions(
        req.params.accountId,
        req.query.transactionType as any,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/children/allowances/savings/apply-interest
 * Apply monthly interest (batch)
 * Roles: MANAGER, ADMIN
 */
router.post(
  '/savings/apply-interest',
  authMiddleware,
  roleMiddleware([UserRole.MANAGER, UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const result = await controller.applyMonthlyInterest(req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// ==================== REPORTS & ANALYTICS ROUTES ====================

/**
 * GET /api/children/allowances/reports/quarterly/:childId
 * Get quarterly summary
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN
 */
router.get(
  '/reports/quarterly/:childId',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.getQuarterlySummary(
        req.params.childId,
        parseInt(req.query.year as string),
        parseInt(req.query.quarter as string),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/children/allowances/reports/iro-dashboard
 * Get IRO dashboard
 * Roles: IRO, MANAGER, ADMIN
 */
router.get(
  '/reports/iro-dashboard',
  authMiddleware,
  roleMiddleware([UserRole.IRO, UserRole.MANAGER, UserRole.ADMIN]),
  async (req, res, next) => {
    try {
      const result = await controller.getIRODashboard();
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/children/allowances/reports/budget-vs-actual/:childId
 * Get budget vs actual analysis
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN
 */
router.get(
  '/reports/budget-vs-actual/:childId',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.getBudgetVsActual(
        req.params.childId,
        parseInt(req.query.year as string),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/children/allowances/rates/:jurisdiction
 * Get pocket money rates
 * Roles: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN
 */
router.get(
  '/rates/:jurisdiction',
  authMiddleware,
  roleMiddleware([
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  ]),
  async (req, res, next) => {
    try {
      const result = await controller.getPocketMoneyRates(req.params.jurisdiction as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
