/**
 * @fileoverview seeded data Controller
 * @module Seeding/SeededDataController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description seeded data Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { SeededDataService } from '../../services/seeding/SeededDataService';

export class SeededDataController {
  privateseededDataService: SeededDataService;

  constructor() {
    this.seededDataService = new SeededDataService();
  }

  async seedAllData(req: Request, res: Response): Promise<void> {
    try {
      await this.seededDataService.seedAllData();
      
      const summary = await this.seededDataService.getSeededDataSummary();
      
      res.json({
        success: true,
        message: 'All seeded data created successfully',
        data: summary
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to seed data',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async clearAllData(req: Request, res: Response): Promise<void> {
    try {
      await this.seededDataService.clearAllData();
      
      res.json({
        success: true,
        message: 'All seeded data cleared successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to clear data',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getSeededDataSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.seededDataService.getSeededDataSummary();
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to get seeded data summary',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
