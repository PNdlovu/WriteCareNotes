/**
 * @fileoverview rehabilitation Controller
 * @module Rehabilitation/RehabilitationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description rehabilitation Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { RehabilitationService } from '../../services/rehabilitation/RehabilitationService';

export class RehabilitationController {
  privaterehabilitationService: RehabilitationService;

  constructor() {
    this.rehabilitationService = new RehabilitationService();
  }

  async createRehabilitationPlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = await this.rehabilitationService.createRehabilitationPlan(req.body);
      res.status(201).json({ success: true, data: plan });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async getRehabilitationAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.rehabilitationService.getRehabilitationAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}
