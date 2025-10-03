import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { PainManagementService } from '../../services/pain/PainManagementService';

export class PainManagementController {
  private painService: PainManagementService;

  constructor() {
    this.painService = new PainManagementService();
  }

  async createAssessment(req: Request, res: Response): Promise<void> {
    try {
      const assessment = await this.painService.createAdvancedPainAssessment(req.body);
      res.status(201).json({ success: true, data: assessment });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async generate3DVisualization(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const visualization = await this.painService.generate3DPainVisualization(assessmentId);
      res.json({ success: true, data: visualization });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getPainAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.query;
      const analytics = await this.painService.getPainAnalytics(residentId as string);
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}