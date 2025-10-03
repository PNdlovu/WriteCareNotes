import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { IntegrationOrchestrationService } from '../../services/integration-orchestration/IntegrationOrchestrationService';

export class IntegrationOrchestrationController {
  private orchestrationService: IntegrationOrchestrationService;

  constructor() {
    this.orchestrationService = new IntegrationOrchestrationService();
  }

  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflow = await this.orchestrationService.createWorkflow(req.body);
      res.status(201).json({ success: true, data: workflow });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.orchestrationService.getOrchestrationAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}