/**
 * @fileoverview mental health Controller
 * @module Mental-health/MentalHealthController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description mental health Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { MentalHealthService } from '../../services/mental-health/MentalHealthService';

export class MentalHealthController {
  private mentalHealthService: MentalHealthService;

  constructor() {
    this.mentalHealthService = new MentalHealthService();
  }

  async createAssessment(req: Request, res: Response): Promise<void> {
    try {
      const assessment = await this.mentalHealthService.conductComprehensiveMentalHealthAssessment(req.body);
      res.status(201).json({ success: true, data: assessment });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async performCrisisDetection(req: Request, res: Response): Promise<void> {
    try {
      const crisisAnalysis = await this.mentalHealthService.performAICrisisDetection(req.body);
      res.json({ success: true, data: crisisAnalysis });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async createTherapeuticProgram(req: Request, res: Response): Promise<void> {
    try {
      const program = await this.mentalHealthService.createPersonalizedTherapeuticProgram(req.body);
      res.status(201).json({ success: true, data: program });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getMentalHealthAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.mentalHealthService.getAdvancedMentalHealthAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async manageCrisisIntervention(req: Request, res: Response): Promise<void> {
    try {
      const intervention = await this.mentalHealthService.manageCrisisIntervention(req.body);
      res.json({ success: true, data: intervention });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}