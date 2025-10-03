import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { BusinessIntelligenceService } from '../../services/business-intelligence/BusinessIntelligenceService';

export class BusinessIntelligenceController {
  private biService: BusinessIntelligenceService;

  constructor() {
    this.biService = new BusinessIntelligenceService();
  }

  async createDataWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const warehouse = await this.biService.createEnterpriseDataWarehouse(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async deployMLModel(req: Request, res: Response): Promise<void> {
    try {
      const deployment = await this.biService.deployAdvancedMLModel(req.body);
      res.status(201).json({ success: true, data: deployment });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getExecutiveDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this.biService.generateExecutiveDashboard();
      res.json({ success: true, data: dashboard });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async deployPredictiveModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await this.biService.deployPredictiveHealthcareModels();
      res.status(201).json({ success: true, data: models });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async processRealTimeBI(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.biService.processRealTimeBusinessIntelligence(req.body);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async executeAdvancedQuery(req: Request, res: Response): Promise<void> {
    try {
      const queryResult = await this.biService.executeAdvancedAnalyticsQuery(req.body);
      res.json({ success: true, data: queryResult });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}