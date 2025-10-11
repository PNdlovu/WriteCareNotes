import { Router } from 'express';
import { JournalEntryController } from '../../controllers/financial/JournalEntryController';
import { authenticate } from '../../middleware/auth-middleware';
import { authorizeFinancial } from '../../middleware/enhanced-rbac-audit';

const router = Router();
const journalEntryController = new JournalEntryController();

// Apply authentication to all routes
router.use(authenticate);

// Journal Entry routes
router.post('/', 
  authorizeFinancial(['finance_manager', 'accountant'], 'CREATE_JOURNAL_ENTRY'), 
  journalEntryController.createJournalEntry.bind(journalEntryController)
);

router.get('/search', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'SEARCH_JOURNAL_ENTRIES'), 
  journalEntryController.searchJournalEntries.bind(journalEntryController)
);

router.get('/:entryId', 
  authorizeFinancial(['finance_manager', 'accountant', 'finance_viewer'], 'VIEW_JOURNAL_ENTRY'), 
  journalEntryController.getJournalEntryById.bind(journalEntryController)
);

router.put('/:entryId', 
  authorizeFinancial(['finance_manager', 'accountant'], 'UPDATE_JOURNAL_ENTRY'), 
  journalEntryController.updateJournalEntry.bind(journalEntryController)
);

router.post('/:entryId/reverse', 
  authorizeFinancial(['finance_manager'], 'REVERSE_JOURNAL_ENTRY'), 
  journalEntryController.reverseJournalEntry.bind(journalEntryController)
);

router.delete('/:entryId', 
  authorizeFinancial(['finance_manager'], 'DELETE_JOURNAL_ENTRY'), 
  journalEntryController.deleteJournalEntry.bind(journalEntryController)
);

export default router;
