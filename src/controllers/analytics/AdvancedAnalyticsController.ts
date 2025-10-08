/**
 * @fileoverview advanced analytics Controller
 * @module Analytics/AdvancedAnalyticsController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description advanced analytics Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { AdvancedAnalyticsService } from '../../services/analytics/AdvancedAnalyticsService';

export class AdvancedAnalyticsController {
  private analyticsService: AdvancedAnalyticsService;

  constructor() {
    this.analyticsService = new AdvancedAnalyticsService();
  }

  async createDataset(req: Request, res: Response): Promise<void> {
    try {
      const dataset = await this.analyticsService.createAdvancedDataset(req.body);
      res.status(201).json({ success: true, data: dataset });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getExecutiveDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this.analyticsService.generateExecutiveDashboard();
      res.json({ success: true, data: dashboard });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async performPredictiveAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { analysisType } = req.params;
      const analysis = await this.analyticsService.performPredictiveAnalysis(analysisType, req.body);
      res.json({ success: true, data: analysis });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}