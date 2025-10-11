/**
 * @fileoverview Controller for public customer support AI agent endpoints
 * @module Ai-agents/PublicAIAgentController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Controller for public customer support AI agent endpoints
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Public AI Agent Controller
 * @module PublicAIAgentController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Controller for public customer support AI agent endpoints
 */

import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { PublicCustomerSupportAIService, CustomerInquiry } from '../../services/ai-agents/PublicCustomerSupportAIService';

export class PublicAIAgentController {
  // Logger removed
  private aiService: PublicCustomerSupportAIService;

  constructor() {
    this.aiService = new PublicCustomerSupportAIService();
  }

  /**
   * Handle customer inquiry
   */
  async handleCustomerInquiry(req: Request, res: Response): Promise<void> {
    try {
      const { message, inquiryType, userContext } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Message is required',
          code: 'MISSING_MESSAGE'
        });
      }

      const inquiry: CustomerInquiry = {
        sessionId: req.aiSecurity?.sessionId || `session_${Date.now()}`,
        inquiryType: inquiryType || 'GENERAL',
        message,
        userContext,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || 'Unknown',
          timestamp: new Date(),
          sessionDuration: 0
        }
      };

      const response = await this.aiService.processCustomerInquiry(inquiry);

      res.json({
        success: true,
        data: response,
        sessionId: inquiry.sessionId,
        timestamp: new Date()
      });

    } catch (error: unknown) {
      console.error('Failed to handle customer inquiry', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        path: req.path,
        ip: req.ip
      });

      res.status(500).json({
        error: 'Failed to process inquiry',
        code: 'AI_PROCESSING_ERROR',
        message: 'I apologize for the technical difficulty. Please try again or contact our support team.'
      });
    }
  }

  /**
   * Get knowledge base summary
   */
  async getKnowledgeBaseSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.aiService.getPublicKnowledgeBaseSummary();
      
      res.json({
        success: true,
        data: summary,
        timestamp: new Date()
      });

    } catch (error: unknown) {
      console.error('Failed to get knowledge base summary', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });

      res.status(500).json({
        error: 'Failed to retrieve knowledge base summary',
        code: 'KNOWLEDGE_BASE_ERROR'
      });
    }
  }

  /**
   * Health check for public AI agent
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        status: 'healthy',
        service: 'PublicAIAgent',
        timestamp: new Date(),
        version: '1.0.0'
      });
    } catch (error: unknown) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }
}

export default PublicAIAgentController;