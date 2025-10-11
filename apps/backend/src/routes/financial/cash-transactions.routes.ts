import { Router } from 'express';
import { CashTransactionController } from '../../controllers/financial/CashTransactionController';
import { authenticate } from '../../middleware/auth-middleware';
import { authorizeFinancial } from '../../middleware/enhanced-rbac-audit';

const router = Router();
const cashTransactionController = new CashTransactionController();

// Apply authentication to all routes
router.use(authenticate);

// Cash Transaction routes
router.post('/', 
  authorizeFinancial(['finance_manager', 'accountant'], 'CREATE_CASH_TRANSACTION'), 
  cashTransactionController.createCashTransaction.bind(cashTransactionController)
);

router.get('/search', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'SEARCH_CASH_TRANSACTIONS'), 
  cashTransactionController.searchCashTransactions.bind(cashTransactionController)
);

router.get('/:transactionId', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_CASH_TRANSACTION'), 
  cashTransactionController.getCashTransactionById.bind(cashTransactionController)
);

router.put('/:transactionId', 
  authorizeFinancial(['finance_manager', 'accountant'], 'UPDATE_CASH_TRANSACTION'), 
  cashTransactionController.updateCashTransaction.bind(cashTransactionController)
);

router.post('/:transactionId/process', 
  authorizeFinancial(['finance_manager', 'accountant'], 'PROCESS_CASH_TRANSACTION'), 
  cashTransactionController.processCashTransaction.bind(cashTransactionController)
);

router.post('/:transactionId/reject', 
  authorizeFinancial(['finance_manager', 'accountant'], 'REJECT_CASH_TRANSACTION'), 
  cashTransactionController.rejectCashTransaction.bind(cashTransactionController)
);

router.post('/:transactionId/reverse', 
  authorizeFinancial(['finance_manager'], 'REVERSE_CASH_TRANSACTION'), 
  cashTransactionController.reverseCashTransaction.bind(cashTransactionController)
);

router.get('/reports/transaction-report', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_CASH_TRANSACTION_REPORT'), 
  cashTransactionController.getCashTransactionReport.bind(cashTransactionController)
);

router.delete('/:transactionId', 
  authorizeFinancial(['finance_manager'], 'DELETE_CASH_TRANSACTION'), 
  cashTransactionController.deleteCashTransaction.bind(cashTransactionController)
);

router.post('/bulk-update-status', 
  authorizeFinancial(['finance_manager'], 'BULK_UPDATE_CASH_TRANSACTION_STATUS'), 
  cashTransactionController.bulkUpdateCashTransactionStatus.bind(cashTransactionController)
);

export default router;
