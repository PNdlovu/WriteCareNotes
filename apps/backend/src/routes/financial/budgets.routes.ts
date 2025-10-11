import { Router } from 'express';
import { BudgetController } from '../../controllers/financial/BudgetController';
import { authenticate } from '../../middleware/auth-middleware';
import { authorizeFinancial } from '../../middleware/enhanced-rbac-audit';

const router = Router();
const budgetController = new BudgetController();

// Apply authentication to all routes
router.use(authenticate);

// Budget routes
router.post('/', 
  authorizeFinancial(['finance_manager', 'accountant'], 'CREATE_BUDGET'), 
  budgetController.createBudget.bind(budgetController)
);

router.get('/search', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'SEARCH_BUDGETS'), 
  budgetController.searchBudgets.bind(budgetController)
);

router.get('/:budgetId', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_BUDGET'), 
  budgetController.getBudgetById.bind(budgetController)
);

router.put('/:budgetId', 
  authorizeFinancial(['finance_manager', 'accountant'], 'UPDATE_BUDGET'), 
  budgetController.updateBudget.bind(budgetController)
);

router.post('/:budgetId/submit-for-approval', 
  authorizeFinancial(['finance_manager', 'accountant'], 'SUBMIT_BUDGET_FOR_APPROVAL'), 
  budgetController.submitBudgetForApproval.bind(budgetController)
);

router.post('/:budgetId/approve', 
  authorizeFinancial(['finance_manager', 'management'], 'APPROVE_BUDGET'), 
  budgetController.approveBudget.bind(budgetController)
);

router.post('/:budgetId/reject', 
  authorizeFinancial(['finance_manager', 'management'], 'REJECT_BUDGET'), 
  budgetController.rejectBudget.bind(budgetController)
);

router.get('/:budgetId/performance-report', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_BUDGET_PERFORMANCE_REPORT'), 
  budgetController.getBudgetPerformanceReport.bind(budgetController)
);

router.get('/:budgetId/variance-report', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_BUDGET_VARIANCE_REPORT'), 
  budgetController.getBudgetVarianceReport.bind(budgetController)
);

router.delete('/:budgetId', 
  authorizeFinancial(['finance_manager'], 'DELETE_BUDGET'), 
  budgetController.deleteBudget.bind(budgetController)
);

router.post('/bulk-update-status', 
  authorizeFinancial(['finance_manager'], 'BULK_UPDATE_BUDGET_STATUS'), 
  budgetController.bulkUpdateBudgetStatus.bind(budgetController)
);

export default router;
