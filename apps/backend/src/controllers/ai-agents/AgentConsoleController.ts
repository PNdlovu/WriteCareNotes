/**
 * @fileoverview agent console Controller
 * @module Ai-agents/AgentConsoleController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description agent console Controller
 */

import { Controller, Get, Put, Param, Query, Body, UseGuards, Request, Logger, Res, HttpStatus } from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

// Define interfaces for agent management
interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error' | 'disabled';
  lastActivity: Date;
  processedCount: number;
  errorCount: number;
  averageProcessingTime: number;
  capabilities: string[];
}

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    permissions: string[];
    roles: string[];
    organizationId?: string;
  };
}

// Mock AgentManager service for now - this should be replaced with actual implementation
class AgentManager {
  getAllAgentStatuses(): AgentStatus[] {
    return [
      {
        id: 'voice_to_note',
        name: 'Voice-to-Note Agent',
        status: 'idle',
        lastActivity: new Date(),
        processedCount: 150,
        errorCount: 5,
        averageProcessingTime: 1200,
        capabilities: ['transcription', 'note_generation']
      },
      {
        id: 'smart_roster',
        name: 'Smart Roster Agent',
        status: 'busy',
        lastActivity: new Date(),
        processedCount: 89,
        errorCount: 2,
        averageProcessingTime: 2500,
        capabilities: ['roster_optimization', 'scheduling']
      },
      {
        id: 'risk_flag',
        name: 'Risk Flag Agent',
        status: 'idle',
        lastActivity: new Date(),
        processedCount: 234,
        errorCount: 8,
        averageProcessingTime: 800,
        capabilities: ['risk_assessment', 'anomaly_detection']
      }
    ];
  }

  async setAgentEnabled(agentId: string, enabled: boolean): Promise<void> {
    // In a real implementation, this would update the agent status in database
    console.log(`Setting agent ${agentId} enabled: ${enabled}`);
  }
}

@Controller('api/agent-console')
@UseGuards(AuthGuard)
export class AgentConsoleController {
  private readonlylogger = new Logger(AgentConsoleController.name);

  const ructor(
    private readonlyauditService: AuditService,
  ) {
    // Initialize AgentManager - in a real implementation, this would be injected
    this.agentManager = new AgentManager();
  }

  private readonlyagentManager: AgentManager;

  /**
   * Get agent metrics
   */
  @Get('metrics')
  @UseGuards(RbacGuard)
  async getAgentMetrics(@Request() req: any) {
    try {
      const agentStatuses = this.agentManager.getAllAgentStatuses();
      
      // Convert agent statuses to metrics format
      const metrics = agentStatuses.map(status => ({
        id: status.id,
        name: status.name,
        status: status.status,
        lastActivity: status.lastActivity,
        processedCount: status.processedCount,
        errorCount: status.errorCount,
        averageProcessingTime: status.averageProcessingTime,
        successRate: status.processedCount > 0 
          ? ((status.processedCount - status.errorCount) / status.processedCount) * 100 
          : 100,
        uptime: this.calculateUptime(status.lastActivity),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCpuUsage(),
        capabilities: status.capabilities,
        healthScore: this.calculateHealthScore(status)
      }));

      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Metrics',
        entityId: 'agent_metrics',
        action: 'READ',
        details: { agentCount: metrics.length },
        userId: req.user?.id || 'system',
      });

      return {
        success: true,
        data: metrics,
        message: 'Agent metrics retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching agentmetrics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch agent metrics',
      };
    }
  }

  /**
   * Get agent performance data
   */
  @Get('performance')
  @UseGuards(RbacGuard)
  async getAgentPerformance(
    @Query('agentId') agentId?: string,
    @Query('hours') hoursParam: string = '24',
    @Request() req?: any
  ) {
    try {
      const hours = parseInt(hoursParam);
      // In a real implementation, this would query performance data from database
      const performanceData = await this.getPerformanceData(agentId, hours);
      
      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Performance',
        entityId: agentId || 'all_agents',
        action: 'READ',
        details: { agentId, hours: hoursParam },
        userId: req?.user?.id || 'system',
      });

      return {
        success: true,
        data: performanceData,
        message: 'Agent performance data retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching agentperformance: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch agent performance',
      };
    }
  }

  /**
   * Get agent configurations
   */
  @Get('configurations')
  @UseGuards(RbacGuard)
  async getAgentConfigurations(@Request() req: any) {
    try {
      const configurations = await this.getConfigurationData();
      
      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Configuration',
        entityId: 'agent_configurations',
        action: 'READ',
        details: { configurationCount: configurations.length },
        userId: req.user?.id || 'system',
      });

      return {
        success: true,
        data: configurations,
        message: 'Agent configurations retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching agentconfigurations: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch agent configurations',
      };
    }
  }

  /**
   * Get system health
   */
  @Get('health')
  @UseGuards(RbacGuard)
  async getSystemHealth(@Request() req: any) {
    try {
      const agentStatuses = this.agentManager.getAllAgentStatuses();
      
      const health = {
        totalAgents: agentStatuses.length,
        activeAgents: agentStatuses.filter(s => s.status === 'idle' || s.status === 'busy').length,
        errorAgents: agentStatuses.filter(s => s.status === 'error').length,
        disabledAgents: agentStatuses.filter(s => s.status === 'disabled').length,
        totalRequests: agentStatuses.reduce((sum, s) => sum + s.processedCount, 0),
        successfulRequests: agentStatuses.reduce((sum, s) => sum + (s.processedCount - s.errorCount), 0),
        failedRequests: agentStatuses.reduce((sum, s) => sum + s.errorCount, 0),
        averageResponseTime: this.calculateAverageResponseTime(agentStatuses),
        systemUptime: this.getSystemUptime(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCpuUsage(),
        queueSize: this.getQueueSize(),
        lastHealthCheck: new Date()
      };

      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Health',
        entityId: 'system_health',
        action: 'READ',
        details: health,
        userId: req.user?.id || 'system',
      });

      return {
        success: true,
        data: health,
        message: 'System health retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching systemhealth: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch system health',
      };
    }
  }

  /**
   * Toggle agent enabled/disabled
   */
  @Put(':agentId/toggle')
  @UseGuards(RbacGuard)
  async toggleAgent(
    @Param('agentId') agentId: string,
    @Body() body: { enabled: boolean },
    @Request() req: AuthenticatedRequest,
    @Res() res: ExpressResponse
  ): Promise<void> {
    try {
      const { enabled } = body;

      await this.agentManager.setAgentEnabled(agentId, enabled);

      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Agent',
        entityId: agentId,
        action: enabled ? 'ENABLE' : 'DISABLE',
        details: { agentId, enabled },
        userId: req.user?.id || 'system',
        timestamp: new Date()
      });

      res.status(HttpStatus.OK).json({ 
        success: true, 
        message: `Agent ${enabled ? 'enabled' : 'disabled'} successfully` 
      });
    } catch (error) {
      this.logger.error('Error togglingagent:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: 'Failed to toggle agent' 
      });
    }
  }

  /**
   * Update agent configuration
   */
  @Put(':agentId/configuration')
  @UseGuards(RbacGuard)
  async updateAgentConfiguration(
    @Param('agentId') agentId: string,
    @Body() updates: Record<string, any>,
    @Request() req: AuthenticatedRequest,
    @Res() res: ExpressResponse
  ): Promise<void> {
    try {
      // In a real implementation, this would update the agent configuration
      await this.updateConfiguration(agentId, updates);

      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Configuration',
        entityId: agentId,
        action: 'UPDATE',
        details: { agentId, updates },
        userId: req.user?.id || 'system',
        timestamp: new Date()
      });

      res.status(HttpStatus.OK).json({ 
        success: true, 
        message: 'Configuration updated successfully' 
      });
    } catch (error) {
      this.logger.error('Error updating agentconfiguration:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: 'Failed to update agent configuration' 
      });
    }
  }

  /**
   * Get agent logs
   */
  @Get(':agentId/logs')
  @UseGuards(RbacGuard)
  async getAgentLogs(
    @Param('agentId') agentId: string,
    @Query('limit') limit: string = '100',
    @Query('level') level?: string,
    @Request() req?: AuthenticatedRequest,
    @Res() res?: ExpressResponse
  ): Promise<void> {
    try {
      const logs = await this.getLogs(agentId, parseInt(limit), level);

      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Logs',
        entityId: agentId,
        action: 'READ',
        details: { agentId, limit, level },
        userId: req?.user?.id || 'system',
        timestamp: new Date()
      });

      res?.status(HttpStatus.OK).json({
        success: true,
        data: logs,
        message: 'Agent logs retrieved successfully'
      });
    } catch (error) {
      this.logger.error('Error fetching agentlogs:', error);
      res?.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: 'Failed to fetch agent logs' 
      });
    }
  }

  /**
   * Calculate uptime in hours
   */
  private calculateUptime(lastActivity: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60)); // Convert to hours
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    return Math.round((used.heapUsed / used.heapTotal) * 100);
  }

  /**
   * Get CPU usage percentage (simplified)
   */
  private getCpuUsage(): number {
    // In a real implementation, this would use a proper CPU monitoring library
    return Math.random() * 100; // Mock data for now
  }

  /**
   * Calculate health score for an agent
   */
  private calculateHealthScore(status: any): number {
    let score = 100;
    
    // Reduce score based on error rate
    if (status.processedCount > 0) {
      const errorRate = (status.errorCount / status.processedCount) * 100;
      score -= errorRate * 2; // Each error reduces score by 2 points
    }
    
    // Reduce score based on response time
    if (status.averageProcessingTime > 5000) { // 5 seconds
      score -= 20;
    } else if (status.averageProcessingTime > 2000) { // 2 seconds
      score -= 10;
    }
    
    // Reduce score if agent is in error state
    if (status.status === 'error') {
      score -= 50;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate average response time across all agents
   */
  private calculateAverageResponseTime(statuses: any[]): number {
    if (statuses.length === 0) return 0;
    
    const totalTime = statuses.reduce((sum, status) => sum + status.averageProcessingTime, 0);
    return totalTime / statuses.length;
  }

  /**
   * Get system uptime in hours
   */
  private getSystemUptime(): number {
    return Math.floor(process.uptime() / 3600); // Convert seconds to hours
  }

  /**
   * Get current queue size
   */
  private getQueueSize(): number {
    // In a real implementation, this would get the actual queue size
    return Math.floor(Math.random() * 10); // Mock data
  }

  /**
   * Get performance data for agents
   */
  private async getPerformanceData(agentId?: string, hours: number = 24): Promise<any[]> {
    // In a real implementation, this would query performance data from database
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      data.push({
        agentId: agentId || 'voice_to_note',
        timestamp: new Date(now.getTime() - (i * 60 * 60 * 1000)),
        responseTime: Math.random() * 2000 + 500,
        success: Math.random() > 0.1,
        errorType: Math.random() > 0.9 ? 'timeout' : undefined,
        inputSize: Math.floor(Math.random() * 1000) + 100,
        outputSize: Math.floor(Math.random() * 500) + 50,
        confidence: Math.random() * 0.3 + 0.7
      });
    }
    
    return data;
  }

  /**
   * Get configuration data
   */
  private async getConfigurationData(): Promise<any[]> {
    // In a real implementation, this would query configuration data from database
    return [
      {
        id: 'voice_to_note',
        name: 'Voice-to-Note Agent',
        enabled: true,
        priority: 1,
        timeout: 30000,
        retryAttempts: 3,
        dependencies: ['openai_adapter'],
        capabilities: ['transcription', 'note_generation', 'sentiment_analysis'],
        config: {
          model: 'gpt-4-turbo-preview',
          temperature: 0.3,
          maxTokens: 2000
        },
        lastModified: new Date(),
        modifiedBy: 'admin'
      },
      {
        id: 'smart_roster',
        name: 'Smart Roster Agent',
        enabled: true,
        priority: 2,
        timeout: 60000,
        retryAttempts: 2,
        dependencies: ['openai_adapter'],
        capabilities: ['roster_optimization', 'scheduling', 'compliance_check'],
        config: {
          model: 'gpt-4-turbo-preview',
          temperature: 0.2,
          maxTokens: 3000
        },
        lastModified: new Date(),
        modifiedBy: 'admin'
      },
      {
        id: 'risk_flag',
        name: 'Risk Flag Agent',
        enabled: true,
        priority: 0,
        timeout: 15000,
        retryAttempts: 5,
        dependencies: ['openai_adapter'],
        capabilities: ['risk_assessment', 'anomaly_detection', 'alert_generation'],
        config: {
          model: 'gpt-4-turbo-preview',
          temperature: 0.1,
          maxTokens: 1500
        },
        lastModified: new Date(),
        modifiedBy: 'admin'
      }
    ];
  }

  /**
   * Update agent configuration
   */
  private async updateConfiguration(agentId: string, updates: any): Promise<void> {
    // In a real implementation, this would update the configuration in database
    console.log(`Updating configuration for agent ${agentId}:`, updates);
  }

  /**
   * Get agent logs
   */
  private async getLogs(agentId: string, limit: number, level?: string): Promise<any[]> {
    // In a real implementation, this would query logs from database
    const logs = [];
    const now = new Date();
    
    for (let i = 0; i < limit; i++) {
      logs.push({
        id: `log_${i}`,
        agentId,
        level: level || (Math.random() > 0.8 ? 'error' : 'info'),
        message: `Log message ${i} for agent ${agentId}`,
        timestamp: new Date(now.getTime() - (i * 60000)), // 1 minute intervals
        metadata: {
          requestId: `req_${i}`,
          userId: 'user_123'
        }
      });
    }
    
    return logs;
  }
}

export default AgentConsoleController;
