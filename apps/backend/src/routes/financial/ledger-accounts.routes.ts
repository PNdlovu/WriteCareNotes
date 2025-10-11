import { Router } from 'express';
import { LedgerAccountController } from '../../controllers/financial/LedgerAccountController';
import { authenticate } from '../../middleware/auth-middleware';
import { authorizeFinancial } from '../../middleware/enhanced-rbac-audit';

const router = Router();
const ledgerAccountController = new LedgerAccountController();

// Apply authentication to all routes
router.use(authenticate);

// Ledger Account routes
router.post('/', 
  authorizeFinancial(['finance_manager', 'accountant'], 'CREATE_LEDGER_ACCOUNT'), 
  ledgerAccountController.createLedgerAccount.bind(ledgerAccountController)
);

router.get('/search', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'SEARCH_LEDGER_ACCOUNTS'), 
  ledgerAccountController.searchLedgerAccounts.bind(ledgerAccountController)
);

router.get('/:accountId', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_LEDGER_ACCOUNT'), 
  ledgerAccountController.getLedgerAccountById.bind(ledgerAccountController)
);

router.get('/code/:accountCode', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_LEDGER_ACCOUNT_BY_CODE'), 
  ledgerAccountController.getLedgerAccountByCode.bind(ledgerAccountController)
);

router.put('/:accountId', 
  authorizeFinancial(['finance_manager', 'accountant'], 'UPDATE_LEDGER_ACCOUNT'), 
  ledgerAccountController.updateLedgerAccount.bind(ledgerAccountController)
);

router.post('/:accountId/close', 
  authorizeFinancial(['finance_manager'], 'CLOSE_LEDGER_ACCOUNT'), 
  ledgerAccountController.closeLedgerAccount.bind(ledgerAccountController)
);

router.get('/:accountId/balance', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_LEDGER_ACCOUNT_BALANCE'), 
  ledgerAccountController.getLedgerAccountBalance.bind(ledgerAccountController)
);

router.get('/:accountId/summary', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_LEDGER_ACCOUNT_SUMMARY'), 
  ledgerAccountController.getLedgerAccountSummary.bind(ledgerAccountController)
);

router.get('/reports/chart-of-accounts', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_CHART_OF_ACCOUNTS'), 
  ledgerAccountController.getChartOfAccounts.bind(ledgerAccountController)
);

router.get('/reports/trial-balance', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_TRIAL_BALANCE'), 
  ledgerAccountController.getTrialBalance.bind(ledgerAccountController)
);

router.delete('/:accountId', 
  authorizeFinancial(['finance_manager'], 'DELETE_LEDGER_ACCOUNT'), 
  ledgerAccountController.deleteLedgerAccount.bind(ledgerAccountController)
);

router.post('/bulk-update-status', 
  authorizeFinancial(['finance_manager'], 'BULK_UPDATE_LEDGER_ACCOUNT_STATUS'), 
  ledgerAccountController.bulkUpdateLedgerAccountStatus.bind(ledgerAccountController)
);

export default router;
