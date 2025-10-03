import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { AIAutomationService } from '../../services/ai-automation/AIAutomationService';
import { AICopilotService } from '../../services/ai-automation/AICopilotService';

export class AIAutomationController {
  private aiService: AIAutomationService;
  private copilotService: AICopilotService;

  constructor() {
    this.aiService = new AIAutomationService();
    this.copilotService = new AICopilotService();
  }

  async generateSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.aiService.generateIntelligentCareSummary(req.body);
      res.status(201).json({ success: true, data: summary });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async provideCopilotAssistance(req: Request, res: Response): Promise<void> {
    try {
      const assistance = await this.copilotService.provideRealTimeCareNoteAssistance(req.body);
      res.json({ success: true, data: assistance });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async processVoiceToText(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.copilotService.processAdvancedVoiceToText(req.body);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async provideClinicalDecisionSupport(req: Request, res: Response): Promise<void> {
    try {
      const support = await this.aiService.provideClinicalDecisionSupport(req.body);
      res.json({ success: true, data: support });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async executeAutomation(req: Request, res: Response): Promise<void> {
    try {
      const automation = await this.aiService.executeIntelligentAutomation(req.body);
      res.json({ success: true, data: automation });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getAIInsights(req: Request, res: Response): Promise<void> {
    try {
      const insights = await this.copilotService.generateAIInsightsDashboard();
      res.json({ success: true, data: insights });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}