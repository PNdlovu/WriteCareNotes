import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { MultiOrganizationService } from '../../services/multi-org/MultiOrganizationService';

export class MultiOrganizationController {
  private orgService: MultiOrganizationService;

  constructor() {
    this.orgService = new MultiOrganizationService();
  }

  async createOrganization(req: Request, res: Response): Promise<void> {
    try {
      const organization = await this.orgService.createOrganization(req.body);
      res.status(201).json({ success: true, data: organization });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.orgService.getOrganizationAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}