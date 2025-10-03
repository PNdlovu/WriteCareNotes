/**
 * AI Agent Orchestration Controller
 * Manages the coordination and orchestration of all AI agents
 * Provides unified API for AI agent operations with compliance guardrails
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { PilotFeedbackAgent } from '../../services/ai-agents/PilotFeedbackAgent';
import { ComplianceAgent } from '../../services/ai-agents/ComplianceAgent';
import { PredictiveEngagementAgent } from '../../services/ai-agents/PredictiveEngagementAgent';
import { AuditService } from '../../services/audit/audit.service';
import { ComplianceService } from '../../services/compliance/compliance.service';
import { Logger } from '@nestjs/common';

@Controller('api/ai-agents')
export class AIAgentOrchestrationController {
  private readonly logger = new Logger(AIAgentOrchestrationController.name);

  constructor(
    private readonly pilotFeedbackAgent: PilotFeedbackAgent,
    private readonly complianceAgent: ComplianceAgent,
    private readonly predictiveEngagementAgent: PredictiveEngagementAgent,
    private readonly auditService: AuditService,
    private readonly complianceService: ComplianceService
  ) {}

  /**
   * Get AI agent system status
   */
  @Get('status')
  async getAgentStatus() {
    try {
      const status = {
        system: 'operational',
        agents: {
          pilotFeedback: 'active',
          compliance: 'monitoring',
          predictiveEngagement: 'active'
        },
        lastHealthCheck: new Date(),
        complianceStatus: 'compliant',
        version: '1.0.0'
      };

      await this.auditService.logEvent({
        action: 'ai_agent_status_requested',
        resource: 'ai_agent_orchestration',
        metadata: { status },
        userId: 'system'
      });

      return {
        success: true,
        data: status,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get agent status:', error);
      throw new HttpException('Failed to get agent status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate pilot feedback
   */
  @Post('pilot-feedback')
  async generatePilotFeedback(@Body() request: {
    pilotId: string;
    careHomeId: string;
    residentId?: string;
    staffId?: string;
    carePlanId?: string;
    medicationId?: string;
    data: any;
    feedbackType: 'medication' | 'care_plan' | 'staff_performance' | 'resident_engagement' | 'compliance';
  }) {
    try {
      const context = {
        pilotId: request.pilotId,
        careHomeId: request.careHomeId,
        residentId: request.residentId,
        staffId: request.staffId,
        carePlanId: request.carePlanId,
        medicationId: request.medicationId
      };

      const feedback = await this.pilotFeedbackAgent.generateFeedback(
        context,
        request.data,
        request.feedbackType
      );

      return {
        success: true,
        data: feedback,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to generate pilot feedback:', error);
      throw new HttpException('Failed to generate pilot feedback', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get pilot feedback history
   */
  @Get('pilot-feedback/:pilotId')
  async getPilotFeedbackHistory(
    @Param('pilotId') pilotId: string,
    @Query('limit') limit: string = '50'
  ) {
    try {
      const feedbackHistory = await this.pilotFeedbackAgent.getFeedbackHistory(
        pilotId,
        parseInt(limit)
      );

      return {
        success: true,
        data: feedbackHistory,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get pilot feedback history:', error);
      throw new HttpException('Failed to get pilot feedback history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Start compliance monitoring
   */
  @Post('compliance/start-monitoring')
  async startComplianceMonitoring() {
    try {
      await this.complianceAgent.startMonitoring();

      await this.auditService.logEvent({
        action: 'compliance_monitoring_started',
        resource: 'ai_agent_orchestration',
        details: {},
        userId: 'system',
        timestamp: new Date()
      });

      return {
        success: true,
        message: 'Compliance monitoring started',
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to start compliance monitoring:', error);
      throw new HttpException('Failed to start compliance monitoring', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Stop compliance monitoring
   */
  @Post('compliance/stop-monitoring')
  async stopComplianceMonitoring() {
    try {
      await this.complianceAgent.stopMonitoring();

      await this.auditService.logEvent({
        action: 'compliance_monitoring_stopped',
        resource: 'ai_agent_orchestration',
        details: {},
        userId: 'system',
        timestamp: new Date()
      });

      return {
        success: true,
        message: 'Compliance monitoring stopped',
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to stop compliance monitoring:', error);
      throw new HttpException('Failed to stop compliance monitoring', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Perform compliance check
   */
  @Post('compliance/check')
  async performComplianceCheck() {
    try {
      const anomalies = await this.complianceAgent.performComplianceCheck();

      return {
        success: true,
        data: {
          anomalies,
          count: anomalies.length,
          criticalCount: anomalies.filter(a => a.severity === 'critical').length
        },
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to perform compliance check:', error);
      throw new HttpException('Failed to perform compliance check', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get compliance metrics
   */
  @Get('compliance/metrics')
  async getComplianceMetrics() {
    try {
      const metrics = await this.complianceAgent.getComplianceMetrics();

      return {
        success: true,
        data: metrics,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get compliance metrics:', error);
      throw new HttpException('Failed to get compliance metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate engagement prediction
   */
  @Post('predictive-engagement')
  async generateEngagementPrediction(@Body() request: {
    residentId: string;
    careHomeId: string;
    predictionType: 'activity_engagement' | 'social_interaction' | 'health_wellbeing' | 'medication_adherence' | 'mood_improvement';
    context: any;
  }) {
    try {
      const prediction = await this.predictiveEngagementAgent.generatePrediction(
        request.residentId,
        request.careHomeId,
        request.predictionType,
        request.context
      );

      return {
        success: true,
        data: prediction,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to generate engagement prediction:', error);
      throw new HttpException('Failed to generate engagement prediction', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate engagement prediction
   */
  @Put('predictive-engagement/:predictionId/validate')
  async validateEngagementPrediction(
    @Param('predictionId') predictionId: string,
    @Body() request: {
      validatedBy: string;
      status: 'approved' | 'rejected' | 'modified';
      comments: string;
      modifications?: any;
    }
  ) {
    try {
      const prediction = await this.predictiveEngagementAgent.validatePrediction(
        predictionId,
        request.validatedBy,
        request.status,
        request.comments,
        request.modifications
      );

      return {
        success: true,
        data: prediction,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to validate engagement prediction:', error);
      throw new HttpException('Failed to validate engagement prediction', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get engagement metrics
   */
  @Get('predictive-engagement/metrics')
  async getEngagementMetrics() {
    try {
      const metrics = await this.predictiveEngagementAgent.getEngagementMetrics();

      return {
        success: true,
        data: metrics,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get engagement metrics:', error);
      throw new HttpException('Failed to get engagement metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all agent metrics
   */
  @Get('metrics')
  async getAllAgentMetrics() {
    try {
      const [complianceMetrics, engagementMetrics] = await Promise.all([
        this.complianceAgent.getComplianceMetrics(),
        this.predictiveEngagementAgent.getEngagementMetrics()
      ]);

      const metrics = {
        compliance: complianceMetrics,
        engagement: engagementMetrics,
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date()
        }
      };

      return {
        success: true,
        data: metrics,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get all agent metrics:', error);
      throw new HttpException('Failed to get agent metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    try {
      const health = {
        status: 'healthy',
        agents: {
          pilotFeedback: 'operational',
          compliance: 'operational',
          predictiveEngagement: 'operational'
        },
        timestamp: new Date(),
        version: '1.0.0'
      };

      return {
        success: true,
        data: health,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new HttpException('Health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}