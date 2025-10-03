import { Request, Response } from 'express';
import { AgentManager } from '../../services/ai-agents/AgentManager';
import { AuditTrailService } from '../../services/audit/AuditTrailService';
import { Logger } from '@nestjs/common';

export class AgentConsoleController {
  private agentManager: AgentManager;
  private auditService: AuditTrailService;
  private logger: Logger;

  constructor() {
    this.agentManager = new AgentManager();
    this.auditService = new AuditTrailService();
    this.logger = new Logger(AgentConsoleController.name);
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(req: Request, res: Response): Promise<void> {
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
        timestamp: new Date()
      });

      res.json(metrics);
    } catch (error) {
      this.logger.error('Error fetching agent metrics:', error);
      res.status(500).json({ error: 'Failed to fetch agent metrics' });
    }
  }

  /**
   * Get agent performance data
   */
  async getAgentPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, hours = 24 } = req.query;
      
      // In a real implementation, this would query performance data from database
      const performanceData = await this.getPerformanceData(agentId as string, parseInt(hours as string));
      
      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Performance',
        entityId: agentId || 'all_agents',
        action: 'READ',
        details: { agentId, hours },
        userId: req.user?.id || 'system',
        timestamp: new Date()
      });

      res.json(performanceData);
    } catch (error) {
      this.logger.error('Error fetching agent performance:', error);
      res.status(500).json({ error: 'Failed to fetch agent performance' });
    }
  }

  /**
   * Get agent configurations
   */
  async getAgentConfigurations(req: Request, res: Response): Promise<void> {
    try {
      const configurations = await this.getConfigurationData();
      
      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Configuration',
        entityId: 'agent_configurations',
        action: 'READ',
        details: { configurationCount: configurations.length },
        userId: req.user?.id || 'system',
        timestamp: new Date()
      });

      res.json(configurations);
    } catch (error) {
      this.logger.error('Error fetching agent configurations:', error);
      res.status(500).json({ error: 'Failed to fetch agent configurations' });
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(req: Request, res: Response): Promise<void> {
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
        timestamp: new Date()
      });

      res.json(health);
    } catch (error) {
      this.logger.error('Error fetching system health:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  }

  /**
   * Toggle agent enabled/disabled
   */
  async toggleAgent(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const { enabled } = req.body;

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

      res.json({ success: true, message: `Agent ${enabled ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      this.logger.error('Error toggling agent:', error);
      res.status(500).json({ error: 'Failed to toggle agent' });
    }
  }

  /**
   * Update agent configuration
   */
  async updateAgentConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const updates = req.body;

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

      res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
      this.logger.error('Error updating agent configuration:', error);
      res.status(500).json({ error: 'Failed to update agent configuration' });
    }
  }

  /**
   * Get agent logs
   */
  async getAgentLogs(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const { limit = 100, level } = req.query;

      const logs = await this.getLogs(agentId, parseInt(limit as string), level as string);

      await this.auditService.logEvent({
        resource: 'AgentConsole',
        entityType: 'Logs',
        entityId: agentId,
        action: 'READ',
        details: { agentId, limit, level },
        userId: req.user?.id || 'system',
        timestamp: new Date()
      });

      res.json(logs);
    } catch (error) {
      this.logger.error('Error fetching agent logs:', error);
      res.status(500).json({ error: 'Failed to fetch agent logs' });
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