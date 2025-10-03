import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { FinancialReimbursementService } from '../../services/financial-reimbursement/FinancialReimbursementService';

export class FinancialReimbursementController {
  private reimbursementService: FinancialReimbursementService;

  constructor() {
    this.reimbursementService = new FinancialReimbursementService();
  }

  async createClaim(req: Request, res: Response): Promise<void> {
    try {
      const claim = await this.reimbursementService.createReimbursementClaim(req.body);
      res.status(201).json({ success: true, data: claim });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async submitClaim(req: Request, res: Response): Promise<void> {
    try {
      const { claimId } = req.params;
      const result = await this.reimbursementService.submitClaim(claimId);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.reimbursementService.getReimbursementAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}