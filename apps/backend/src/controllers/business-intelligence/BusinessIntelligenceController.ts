/**
 * @fileoverview business intelligence Controller
 * @module Business-intelligence/BusinessIntelligenceController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description business intelligence Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { BusinessIntelligenceService } from '../../services/business-intelligence/BusinessIntelligenceService';

export class BusinessIntelligenceController {
  privatebiService: BusinessIntelligenceService;

  constructor() {
    this.biService = new BusinessIntelligenceService();
  }

  async createDataWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const warehouse = await this.biService.createEnterpriseDataWarehouse(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async deployMLModel(req: Request, res: Response): Promise<void> {
    try {
      const deployment = await this.biService.deployAdvancedMLModel(req.body);
      res.status(201).json({ success: true, data: deployment });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async getExecutiveDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this.biService.generateExecutiveDashboard();
      res.json({ success: true, data: dashboard });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async deployPredictiveModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await this.biService.deployPredictiveHealthcareModels();
      res.status(201).json({ success: true, data: models });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async processRealTimeBI(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.biService.processRealTimeBusinessIntelligence(req.body);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async executeAdvancedQuery(req: Request, res: Response): Promise<void> {
    try {
      const queryResult = await this.biService.executeAdvancedAnalyticsQuery(req.body);
      res.json({ success: true, data: queryResult });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}
