import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import app from '../../../app';
import { JournalEntryService } from '../../../services/financial/JournalEntryService';
import { JournalEntry, JournalEntryType, JournalEntryStatus } from '../../../entities/financial/JournalEntry';
import { Decimal } from 'decimal.js';

// Mock the JournalEntryService
jest.mock('../../../services/financial/JournalEntryService');
const MockedJournalEntryService = JournalEntryService as jest.MockedClass<typeof JournalEntryService>;

// Mock authentication middleware
jest.mock('../../../middleware/auth-middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-001',
      email: 'test@example.com',
      role: 'finance_manager'
    };
    next();
  }
}));

// Mock RBAC middleware
jest.mock('../../../middleware/enhanced-rbac-audit', () => ({
  authorizeFinancial: () => (req: any, res: any, next: any) => {
    next();
  }
}));

describe('Journal Entry API Integration Tests', () => {
  let mockService: jest.Mocked<JournalEntryService>;

  beforeEach(() => {
    mockService = new MockedJournalEntryService() as jest.Mocked<JournalEntryService>;
    MockedJournalEntryService.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/financial/journal-entries', () => {
    it('should create a new journal entry', async () => {
      const requestData = {
        entryNumber: 'JE-2024-001',
        entryType: JournalEntryType.MANUAL,
        description: 'Test journal entry',
        reference: 'REF-001',
        careHomeId: 'care-home-001',
        department: 'nursing',
        costCenter: 'nursing-001',
        notes: 'Test entry',
        entries: [
          {
            accountId: 'acc-001',
            debitAmount: 1000.00,
            creditAmount: 0.00,
            description: 'Debit entry',
            reference: 'REF-001',
            costCenter: 'nursing-001',
            department: 'nursing'
          },
          {
            accountId: 'acc-002',
            debitAmount: 0.00,
            creditAmount: 1000.00,
            description: 'Credit entry',
            reference: 'REF-001',
            costCenter: 'nursing-001',
            department: 'nursing'
          }
        ]
      };

      const mockJournalEntry = {
        id: 'je-001',
        ...requestData,
        status: JournalEntryStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.createJournalEntry.mockResolvedValue(mockJournalEntry as any);

      const response = await request(app)
        .post('/api/financial/journal-entries')
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Journal entry created successfully');
      expect(response.body.data).toEqual(mockJournalEntry);
      expect(mockService.createJournalEntry).toHaveBeenCalledWith(
        requestData,
        'user-001'
      );
    });

    it('should return 400 for invalid request data', async () => {
      const invalidData = {
        entryNumber: 'JE-2024-001',
        // Missing required fields
      };

      mockService.createJournalEntry.mockRejectedValue(new Error('Invalid entry type'));

      const response = await request(app)
        .post('/api/financial/journal-entries')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid entry type');
    });

    it('should return 400 for unbalanced journal entry', async () => {
      const unbalancedData = {
        entryNumber: 'JE-2024-001',
        entryType: JournalEntryType.MANUAL,
        description: 'Unbalanced journal entry',
        reference: 'REF-001',
        entries: [
          {
            accountId: 'acc-001',
            debitAmount: 1000.00,
            creditAmount: 0.00,
            description: 'Debit entry'
          },
          {
            accountId: 'acc-002',
            debitAmount: 0.00,
            creditAmount: 500.00, // Unbalanced
            description: 'Credit entry'
          }
        ]
      };

      mockService.createJournalEntry.mockRejectedValue(new Error('Journal entry is not balanced'));

      const response = await request(app)
        .post('/api/financial/journal-entries')
        .send(unbalancedData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Journal entry is not balanced');
    });
  });

  describe('GET /api/financial/journal-entries/:entryId', () => {
    it('should get journal entry by ID', async () => {
      const mockJournalEntry = {
        id: 'je-001',
        entryNumber: 'JE-2024-001',
        status: JournalEntryStatus.DRAFT,
        description: 'Test journal entry'
      };

      mockService.getJournalEntryById.mockResolvedValue(mockJournalEntry as any);

      const response = await request(app)
        .get('/api/financial/journal-entries/je-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJournalEntry);
      expect(mockService.getJournalEntryById).toHaveBeenCalledWith('je-001');
    });

    it('should return 404 if journal entry not found', async () => {
      mockService.getJournalEntryById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/financial/journal-entries/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Journal entry not found');
    });
  });

  describe('GET /api/financial/journal-entries/search', () => {
    it('should search journal entries with query parameters', async () => {
      const mockJournalEntries = [
        {
          id: 'je-001',
          entryNumber: 'JE-2024-001',
          status: JournalEntryStatus.DRAFT,
          description: 'Test journal entry 1'
        },
        {
          id: 'je-002',
          entryNumber: 'JE-2024-002',
          status: JournalEntryStatus.DRAFT,
          description: 'Test journal entry 2'
        }
      ];

      mockService.searchJournalEntries.mockResolvedValue(mockJournalEntries as any);

      const response = await request(app)
        .get('/api/financial/journal-entries/search')
        .query({
          entryType: JournalEntryType.MANUAL,
          status: JournalEntryStatus.DRAFT,
          careHomeId: 'care-home-001'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJournalEntries);
      expect(response.body.count).toBe(2);
      expect(mockService.searchJournalEntries).toHaveBeenCalledWith({
        entryType: JournalEntryType.MANUAL,
        status: JournalEntryStatus.DRAFT,
        careHomeId: 'care-home-001'
      });
    });
  });

  describe('PUT /api/financial/journal-entries/:entryId', () => {
    it('should update journal entry', async () => {
      const updateData = {
        description: 'Updated journal entry description',
        notes: 'Updated notes'
      };

      const mockUpdatedJournalEntry = {
        id: 'je-001',
        entryNumber: 'JE-2024-001',
        status: JournalEntryStatus.DRAFT,
        description: 'Updated journal entry description',
        notes: 'Updated notes'
      };

      mockService.updateJournalEntry.mockResolvedValue(mockUpdatedJournalEntry as any);

      const response = await request(app)
        .put('/api/financial/journal-entries/je-001')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Journal entry updated successfully');
      expect(response.body.data).toEqual(mockUpdatedJournalEntry);
      expect(mockService.updateJournalEntry).toHaveBeenCalledWith(
        'je-001',
        updateData,
        'user-001'
      );
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdateData = {
        status: 'invalid-status'
      };

      mockService.updateJournalEntry.mockRejectedValue(new Error('Invalid status'));

      const response = await request(app)
        .put('/api/financial/journal-entries/je-001')
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid status');
    });
  });

  describe('POST /api/financial/journal-entries/:entryId/reverse', () => {
    it('should reverse journal entry', async () => {
      const requestData = {
        reason: 'Error in original entry'
      };

      const mockReversedJournalEntry = {
        id: 'je-002',
        entryNumber: 'JE-2024-001-REV',
        status: JournalEntryStatus.POSTED,
        description: 'REVERSAL: Test journal entry'
      };

      mockService.reverseJournalEntry.mockResolvedValue(mockReversedJournalEntry as any);

      const response = await request(app)
        .post('/api/financial/journal-entries/je-001/reverse')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Journal entry reversed successfully');
      expect(response.body.data).toEqual(mockReversedJournalEntry);
      expect(mockService.reverseJournalEntry).toHaveBeenCalledWith(
        'je-001',
        'Error in original entry',
        'user-001'
      );
    });

    it('should return 400 for missing reversal reason', async () => {
      const response = await request(app)
        .post('/api/financial/journal-entries/je-001/reverse')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Reversal reason is required');
    });

    it('should return 400 if journal entry cannot be reversed', async () => {
      const requestData = {
        reason: 'Error in original entry'
      };

      mockService.reverseJournalEntry.mockRejectedValue(new Error('Only posted journal entries can be reversed'));

      const response = await request(app)
        .post('/api/financial/journal-entries/je-001/reverse')
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only posted journal entries can be reversed');
    });
  });

  describe('DELETE /api/financial/journal-entries/:entryId', () => {
    it('should delete journal entry', async () => {
      mockService.deleteJournalEntry.mockResolvedValue();

      const response = await request(app)
        .delete('/api/financial/journal-entries/je-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Journal entry deleted successfully');
      expect(mockService.deleteJournalEntry).toHaveBeenCalledWith('je-001', 'user-001');
    });

    it('should return 400 if journal entry cannot be deleted', async () => {
      mockService.deleteJournalEntry.mockRejectedValue(new Error('Cannot delete posted journal entry'));

      const response = await request(app)
        .delete('/api/financial/journal-entries/je-001')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete posted journal entry');
    });
  });
});