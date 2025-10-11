import { Router } from 'express';
import journalEntriesRoutes from './journal-entries.routes';
import cashTransactionsRoutes from './cash-transactions.routes';
import budgetsRoutes from './budgets.routes';
import ledgerAccountsRoutes from './ledger-accounts.routes';

const router = Router();

// Financial module routes
router.use('/journal-entries', journalEntriesRoutes);
router.use('/cash-transactions', cashTransactionsRoutes);
router.use('/budgets', budgetsRoutes);
router.use('/ledger-accounts', ledgerAccountsRoutes);

export default router;
