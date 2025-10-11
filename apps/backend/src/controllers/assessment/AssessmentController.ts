/**
 * @fileoverview assessment Controller
 * @module Assessment/AssessmentController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description assessment Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { AssessmentService } from '../../services/assessment/AssessmentService';

export class AssessmentController {
  privateassessmentService: AssessmentService;

  constructor() {
    this.assessmentService = new AssessmentService();
  }

  async createAssessment(req: Request, res: Response): Promise<void> {
    try {
      const assessment = await this.assessmentService.createAssessment(req.body);
      res.status(201).json({ success: true, data: assessment });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.assessmentService.getAssessmentAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}
