import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { CommunicationEngagementService } from '../../services/communication/CommunicationEngagementService';

export class CommunicationEngagementController {
  private communicationService: CommunicationEngagementService;

  constructor() {
    this.communicationService = new CommunicationEngagementService();
  }

  async createChannel(req: Request, res: Response): Promise<void> {
    try {
      const channel = await this.communicationService.createAdvancedChannel(req.body);
      res.status(201).json({ success: true, data: channel });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const message = await this.communicationService.sendAdvancedMessage(req.body);
      res.json({ success: true, data: message });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async scheduleVideoCall(req: Request, res: Response): Promise<void> {
    try {
      const videoCall = await this.communicationService.scheduleAdvancedVideoCall(req.body);
      res.status(201).json({ success: true, data: videoCall });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getFamilyEngagementAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.communicationService.getFamilyEngagementAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async initiateTelemedicine(req: Request, res: Response): Promise<void> {
    try {
      const session = await this.communicationService.initiateTelemedicineSession(req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async createSocialGroup(req: Request, res: Response): Promise<void> {
    try {
      const group = await this.communicationService.createSocialEngagementGroup(req.body);
      res.status(201).json({ success: true, data: group });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async broadcastEmergencyAlert(req: Request, res: Response): Promise<void> {
    try {
      await this.communicationService.broadcastEmergencyAlert(req.body);
      res.json({ success: true, message: 'Emergency alert broadcasted successfully' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}