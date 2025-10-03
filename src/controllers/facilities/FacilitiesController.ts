import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { FacilitiesManagementService } from '../../services/facilities/FacilitiesManagementService';

export class FacilitiesController {
  private facilitiesService: FacilitiesManagementService;

  constructor() {
    this.facilitiesService = new FacilitiesManagementService();
  }

  async createAsset(req: Request, res: Response): Promise<void> {
    try {
      const asset = await this.facilitiesService.createFacilityAsset(req.body);
      res.status(201).json({ success: true, data: asset });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.facilitiesService.getFacilitiesAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}