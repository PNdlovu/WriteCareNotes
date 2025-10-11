/**
 * @fileoverview procurement supply chain Controller
 * @module Procurement/ProcurementSupplyChainController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description procurement supply chain Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { ProcurementSupplyChainService } from '../../services/procurement/ProcurementSupplyChainService';

export class ProcurementSupplyChainController {
  privateprocurementService: ProcurementSupplyChainService;

  constructor() {
    this.procurementService = new ProcurementSupplyChainService();
  }

  async createPurchaseRequest(req: Request, res: Response): Promise<void> {
    try {
      const request = await this.procurementService.createIntelligentPurchaseRequest(req.body);
      res.status(201).json({ success: true, data: request });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async registerSupplier(req: Request, res: Response): Promise<void> {
    try {
      const supplier = await this.procurementService.registerAdvancedSupplier(req.body);
      res.status(201).json({ success: true, data: supplier });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async getDemandForecast(req: Request, res: Response): Promise<void> {
    try {
      const { category, months } = req.query;
      const forecast = await this.procurementService.generateDemandForecast(category as any, parseInt(months as string) || 12);
      res.json({ success: true, data: forecast });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async getSupplyChainAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.procurementService.getAdvancedSupplyChainAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async performSupplierEvaluation(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const evaluation = await this.procurementService.performAdvancedSupplierEvaluation(supplierId);
      res.json({ success: true, data: evaluation });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async optimizeContracts(req: Request, res: Response): Promise<void> {
    try {
      const optimization = await this.procurementService.optimizeContractPortfolio();
      res.json({ success: true, data: optimization });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async performRiskAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const riskAnalysis = await this.procurementService.performSupplyChainRiskAnalysis();
      res.json({ success: true, data: riskAnalysis });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}
