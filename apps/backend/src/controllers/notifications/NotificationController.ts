/**
 * @fileoverview notification Controller
 * @module Notifications/NotificationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description notification Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { EnterpriseNotificationService } from '../../services/notifications/EnterpriseNotificationService';

export class NotificationController {
  privatenotificationService: EnterpriseNotificationService;

  constructor() {
    this.notificationService = new EnterpriseNotificationService();
  }

  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.notificationService.sendEnterpriseNotification(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const campaign = await this.notificationService.createNotificationCampaign(req.body);
      res.status(201).json({ success: true, data: campaign });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.notificationService.getNotificationAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}
