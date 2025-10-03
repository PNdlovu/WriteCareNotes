import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { LaundryHousekeepingService } from '../../services/laundry/LaundryHousekeepingService';

export class LaundryHousekeepingController {
  private laundryService: LaundryHousekeepingService;

  constructor() {
    this.laundryService = new LaundryHousekeepingService();
  }

  async createLaundryItem(req: Request, res: Response): Promise<void> {
    try {
      const item = await this.laundryService.createLaundryItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async processLaundryBatch(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.laundryService.processLaundryBatch(req.body);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async performQualityControl(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const qualityReport = await this.laundryService.performQualityControl(itemId, req.body);
      res.json({ success: true, data: qualityReport });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async scheduleHousekeeping(req: Request, res: Response): Promise<void> {
    try {
      const operations = await this.laundryService.scheduleHousekeepingTasks();
      res.json({ success: true, data: operations });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getLaundryAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.laundryService.getLaundryAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}