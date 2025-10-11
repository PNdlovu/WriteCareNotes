import { Router } from 'express';
import ledgerRoutes from './ledger.routes';
import cashRoutes from './cash.routes';
import budgetRoutes from './budget.routes';

/**
 * @fileoverview Finance Routes Index
 * @module FinanceRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Main finance routes index file that combines all financial
 * management routes including ledger, cash transactions, and budget modules.
 */

const router = Router();

// Mount finance routes
router.use('/ledger', ledgerRoutes);
router.use('/cash', cashRoutes);
router.use('/budgets', budgetRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Finance services are running',
    timestamp: new Date().toISOString(),
    services: {
      ledger: 'active',
      cash: 'active',
      budgets: 'active'
    }
  });
});

export default router;