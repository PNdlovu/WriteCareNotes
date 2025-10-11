/**
 * @fileoverview external integration Controller
 * @module External-integration/ExternalIntegrationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description external integration Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { ExternalIntegrationService } from '../../services/external-integration/ExternalIntegrationService';

export class ExternalIntegrationController {
  private integrationService: ExternalIntegrationService;

  constructor() {
    this.integrationService = new ExternalIntegrationService();
  }

  async createSystem(req: Request, res: Response): Promise<void> {
    try {
      const system = await this.integrationService.createExternalSystem(req.body);
      res.status(201).json({ success: true, data: system });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.integrationService.getIntegrationAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}