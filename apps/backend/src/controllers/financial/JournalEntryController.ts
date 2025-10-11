/**
 * @fileoverview journal entry Controller
 * @module Financial/JournalEntryController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description journal entry Controller
 */

import { Request, Response } from 'express';
import { JournalEntryService, JournalEntryRequest, JournalEntryUpdate, JournalEntrySearchCriteria } from '../../services/financial/JournalEntryService';
import { logger } from '../../utils/logger';

export class JournalEntryController {
  privatejournalEntryService: JournalEntryService;

  const ructor() {
    this.journalEntryService = new JournalEntryService();
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const request: JournalEntryRequest = req.body;
      const createdBy = req.user?.id || 'system';

      const entry = await this.journalEntryService.createJournalEntry(request, createdBy);

      res.status(201).json({
        success: true,
        message: 'Journal entry created successfully',
        data: entry
      });
    } catch (error) {
      logger.error('Error creating journal entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create journal entry'
      });
    }
  }

  /**
   * Get journal entry by ID
   */
  async getJournalEntryById(req: Request, res: Response): Promise<void> {
    try {
      const { entryId } = req.params;

      const entry = await this.journalEntryService.getJournalEntryById(entryId);

      if (!entry) {
        res.status(404).json({
          success: false,
          message: 'Journal entry not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: entry
      });
    } catch (error) {
      logger.error('Error getting journal entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryId: req.params.entryId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get journal entry'
      });
    }
  }

  /**
   * Get journal entry by entry number
   */
  async getJournalEntryByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { entryNumber } = req.params;

      const entry = await this.journalEntryService.getJournalEntryByNumber(entryNumber);

      if (!entry) {
        res.status(404).json({
          success: false,
          message: 'Journal entry not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: entry
      });
    } catch (error) {
      logger.error('Error getting journal entry by number', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryNumber: req.params.entryNumber
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get journal entry'
      });
    }
  }

  /**
   * Search journal entries
   */
  async searchJournalEntries(req: Request, res: Response): Promise<void> {
    try {
      const criteria: JournalEntrySearchCriteria = req.query;

      const entries = await this.journalEntryService.searchJournalEntries(criteria);

      res.status(200).json({
        success: true,
        data: entries,
        count: entries.length
      });
    } catch (error) {
      logger.error('Error searching journal entries', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search journal entries'
      });
    }
  }

  /**
   * Update journal entry
   */
  async updateJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const { entryId } = req.params;
      const updates: JournalEntryUpdate = req.body;
      const updatedBy = req.user?.id || 'system';

      const entry = await this.journalEntryService.updateJournalEntry(
        entryId,
        updates,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Journal entry updated successfully',
        data: entry
      });
    } catch (error) {
      logger.error('Error updating journal entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryId: req.params.entryId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update journal entry'
      });
    }
  }

  /**
   * Post journal entry
   */
  async postJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const { entryId } = req.params;
      const postedBy = req.user?.id || 'system';

      const entry = await this.journalEntryService.postJournalEntry(entryId, postedBy);

      res.status(200).json({
        success: true,
        message: 'Journal entry posted successfully',
        data: entry
      });
    } catch (error) {
      logger.error('Error posting journal entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryId: req.params.entryId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to post journal entry'
      });
    }
  }

  /**
   * Reverse journal entry
   */
  async reverseJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const { entryId } = req.params;
      const { reason } = req.body;
      const reversedBy = req.user?.id || 'system';

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Reversal reason is required'
        });
        return;
      }

      const reversalEntry = await this.journalEntryService.reverseJournalEntry(
        entryId,
        reason,
        reversedBy
      );

      res.status(200).json({
        success: true,
        message: 'Journal entry reversed successfully',
        data: reversalEntry
      });
    } catch (error) {
      logger.error('Error reversing journal entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryId: req.params.entryId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reverse journal entry'
      });
    }
  }

  /**
   * Get journal entry report
   */
  async getJournalEntryReport(req: Request, res: Response): Promise<void> {
    try {
      const { careHomeId } = req.query;

      const report = await this.journalEntryService.getJournalEntryReport(
        careHomeId as string
      );

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error getting journal entry report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get journal entry report'
      });
    }
  }

  /**
   * Delete journal entry
   */
  async deleteJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const { entryId } = req.params;
      const deletedBy = req.user?.id || 'system';

      await this.journalEntryService.deleteJournalEntry(entryId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Journal entry deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting journal entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryId: req.params.entryId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete journal entry'
      });
    }
  }

  /**
   * Bulk update journal entry status
   */
  async bulkUpdateJournalEntryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { entryIds, status, notes } = req.body;
      const updatedBy = req.user?.id || 'system';

      if (!entryIds || !Array.isArray(entryIds) || !status) {
        res.status(400).json({
          success: false,
          message: 'Entry IDs array and status are required'
        });
        return;
      }

      const updatedCount = await this.journalEntryService.bulkUpdateJournalEntryStatus(
        entryIds,
        status,
        updatedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} journal entries updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error bulk updating journal entry status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: 'Failed to bulk update journal entry status'
      });
    }
  }
}

export default JournalEntryController;
