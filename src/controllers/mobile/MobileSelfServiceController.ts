import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { MobileSelfServiceService } from '../../services/mobile/MobileSelfServiceService';
import { DeviceType } from '../../entities/mobile/MobileSession';

export class MobileSelfServiceController {
  private mobileService: MobileSelfServiceService;

  constructor() {
    this.mobileService = new MobileSelfServiceService();
  }

  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await this.mobileService.createAdvancedMobileSession(req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async performSync(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const syncResult = await this.mobileService.performIntelligentSync(sessionId);
      res.json({ success: true, data: syncResult });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getContextualAssistance(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const assistance = await this.mobileService.provideContextualAssistance(sessionId, req.body);
      res.json({ success: true, data: assistance });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async performBiometricAuth(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const authResult = await this.mobileService.performAdvancedBiometricAuth(sessionId, req.body);
      res.json({ success: true, data: authResult });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getMobileAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.mobileService.getAdvancedMobileAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async deployPWA(req: Request, res: Response): Promise<void> {
    try {
      const deployment = await this.mobileService.deployProgressiveWebApp(req.body);
      res.status(201).json({ success: true, data: deployment });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}