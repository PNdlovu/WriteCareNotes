/**
 * @fileoverview audit Controller
 * @module Audit/AuditController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description audit Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { EnterpriseAuditService } from '../../services/audit/EnterpriseAuditService';

export class AuditController {
  private auditService: EnterpriseAuditService;

  constructor() {
    this.auditService = new EnterpriseAuditService();
  }

  async createAuditEvent(req: Request, res: Response): Promise<void> {
    try {
      const event = await this.auditService.createAdvancedAuditEvent(req.body);
      res.status(201).json({ success: true, data: event });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async conductInvestigation(req: Request, res: Response): Promise<void> {
    try {
      const investigation = await this.auditService.conductAuditInvestigation(req.body);
      res.json({ success: true, data: investigation });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getAuditAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.auditService.getAdvancedAuditAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}