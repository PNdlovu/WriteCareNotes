import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIAgent, AIAgentStatus, AIAgentType } from '../entities/AIAgent';
import { AIAgentSession } from '../entities/AIAgentSession';
import { AIAgentConversation } from '../entities/AIAgentConversation';
import { AIAgentRegistryService } from './AIAgentRegistryService';

export interface AgentLifecycleEvent {
  agentId: string;
  eventType: 'created' | 'activated' | 'deactivated' | 'error' | 'health_check' | 'session_started' | 'session_ended';
  timestamp: Date;
  data: any;
}

export interface AgentDeploymentConfig {
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
  };
  environment: Record<string, string>;
  healthCheck: {
    path: string;
    interval: number;
    timeout: number;
  };
  scaling: {
    minReplicas: number;
    maxReplicas: number;
    targetCPU: number;
    targetMemory: number;
  };
}

@Injectable()
export class AIAgentLifecycleService {
  private eventListeners: Map<string, ((event: AgentLifecycleEvent) => void)[]> = new Map();

  constructor(
    @InjectRepository(AIAgent)
    private agentRepository: Repository<AIAgent>,
    @InjectRepository(AIAgentSession)
    private sessionRepository: Repository<AIAgentSession>,
    @InjectRepository(AIAgentConversation)
    private conversationRepository: Repository<AIAgentConversation>,
    private registryService: AIAgentRegistryService,
  ) {}

  /**
   * Deploy an agent to the microservice environment
   */
  async deployAgent(agentId: string, config: AgentDeploymentConfig): Promise<boolean> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    try {
      // Simulate agent deployment
      console.log(`Deploying agent ${agent.name} with config:`, config);
      
      // In a real implementation, this would:
      // 1. Create Kubernetes deployment
      // 2. Configure service endpoints
      // 3. Set up health checks
      // 4. Configure monitoring
      // 5. Set up load balancing

      // Update agent status
      agent.status = AIAgentStatus.ACTIVE;
      agent.endpoint = this.generateAgentEndpoint(agent.name);
      agent.healthCheckUrl = `${agent.endpoint}/health`;
      agent.maxConcurrentSessions = config.replicas * 10; // Assume 10 sessions per replica
      
      await this.agentRepository.save(agent);

      // Emit deployment event
      this.emitEvent({
        agentId: agent.id,
        eventType: 'activated',
        timestamp: new Date(),
        data: { config, endpoint: agent.endpoint },
      });

      return true;

    } catch (error) {
      console.error(`Failed to deploy agent ${agent.name}:`, error);
      
      agent.setError(`Deployment failed: ${error.message}`);
      await this.agentRepository.save(agent);

      this.emitEvent({
        agentId: agent.id,
        eventType: 'error',
        timestamp: new Date(),
        data: { error: error.message, config },
      });

      return false;
    }
  }

  /**
   * Undeploy an agent from the microservice environment
   */
  async undeployAgent(agentId: string): Promise<boolean> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    try {
      // Simulate agent undeployment
      console.log(`Undeploying agent ${agent.name}`);
      
      // In a real implementation, this would:
      // 1. Scale down Kubernetes deployment to 0
      // 2. Remove service endpoints
      // 3. Clean up monitoring
      // 4. Remove load balancer configuration

      // Update agent status
      agent.status = AIAgentStatus.INACTIVE;
      agent.endpoint = null;
      agent.healthCheckUrl = null;
      agent.currentSessions = 0;
      
      await this.agentRepository.save(agent);

      // Emit undeployment event
      this.emitEvent({
        agentId: agent.id,
        eventType: 'deactivated',
        timestamp: new Date(),
        data: { reason: 'undeployed' },
      });

      return true;

    } catch (error) {
      console.error(`Failed to undeploy agent ${agent.name}:`, error);
      
      agent.setError(`Undeployment failed: ${error.message}`);
      await this.agentRepository.save(agent);

      return false;
    }
  }

  /**
   * Scale an agent up or down
   */
  async scaleAgent(agentId: string, replicas: number): Promise<boolean> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    try {
      console.log(`Scaling agent ${agent.name} to ${replicas} replicas`);
      
      // In a real implementation, this would update the Kubernetes deployment
      agent.maxConcurrentSessions = replicas * 10; // Assume 10 sessions per replica
      
      await this.agentRepository.save(agent);

      this.emitEvent({
        agentId: agent.id,
        eventType: 'activated',
        timestamp: new Date(),
        data: { replicas, maxSessions: agent.maxConcurrentSessions },
      });

      return true;

    } catch (error) {
      console.error(`Failed to scale agent ${agent.name}:`, error);
      return false;
    }
  }

  /**
   * Start a new agent session
   */
  async startSession(agentId: string, userId: string, context: any): Promise<AIAgentSession> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    if (!agent.canAcceptNewSession()) {
      throw new Error(`Agent ${agent.name} cannot accept new sessions`);
    }

    // Create session
    const session = this.sessionRepository.create({
      agentId: agent.id,
      userId,
      context,
      status: 'active',
      startedAt: new Date(),
    });

    const savedSession = await this.sessionRepository.save(session);

    // Update agent session count
    agent.incrementSessions();
    await this.agentRepository.save(agent);

    this.emitEvent({
      agentId: agent.id,
      eventType: 'session_started',
      timestamp: new Date(),
      data: { sessionId: savedSession.id, userId, context },
    });

    return savedSession;
  }

  /**
   * End an agent session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['agent'],
    });

    if (!session) {
      throw new Error(`Session with ID '${sessionId}' not found`);
    }

    // Update session
    session.status = 'ended';
    session.endedAt = new Date();
    await this.sessionRepository.save(session);

    // Update agent session count
    if (session.agent) {
      session.agent.decrementSessions();
      await this.agentRepository.save(session.agent);

      this.emitEvent({
        agentId: session.agent.id,
        eventType: 'session_ended',
        timestamp: new Date(),
        data: { sessionId: session.id, duration: session.endedAt.getTime() - session.startedAt.getTime() },
      });
    }
  }

  /**
   * Perform health check on all agents
   */
  async performHealthChecks(): Promise<{ healthy: number; unhealthy: number; errors: string[] }> {
    const result = await this.registryService.performAllHealthChecks();
    
    // Emit health check event
    this.emitEvent({
      agentId: 'system',
      eventType: 'health_check',
      timestamp: new Date(),
      data: result,
    });

    return result;
  }

  /**
   * Get agent deployment status
   */
  async getAgentDeploymentStatus(agentId: string): Promise<any> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      return { deployed: false, error: 'Agent not found' };
    }

    const isHealthy = await this.registryService.performHealthCheck(agent);

    return {
      deployed: agent.status === AIAgentStatus.ACTIVE,
      healthy: isHealthy,
      endpoint: agent.endpoint,
      healthCheckUrl: agent.healthCheckUrl,
      currentSessions: agent.currentSessions,
      maxConcurrentSessions: agent.maxConcurrentSessions,
      lastHealthCheck: agent.lastHealthCheck,
      errorMessage: agent.errorMessage,
    };
  }

  /**
   * Get all agent deployment statuses
   */
  async getAllDeploymentStatuses(): Promise<any[]> {
    const agents = await this.agentRepository.find();
    const statuses = [];

    for (const agent of agents) {
      const status = await this.getAgentDeploymentStatus(agent.id);
      statuses.push({
        agentId: agent.id,
        agentName: agent.name,
        ...status,
      });
    }

    return statuses;
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: (event: AgentLifecycleEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: (event: AgentLifecycleEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit lifecycle event
   */
  private emitEvent(event: AgentLifecycleEvent): void {
    const listeners = this.eventListeners.get(event.eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.eventType}:`, error);
        }
      });
    }
  }

  /**
   * Generate agent endpoint URL
   */
  private generateAgentEndpoint(agentName: string): string {
    const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:3001';
    return `${baseUrl}/agents/${agentName}`;
  }

  /**
   * Get agent resource usage
   */
  async getAgentResourceUsage(agentId: string): Promise<any> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      return null;
    }

    // In a real implementation, this would query Kubernetes metrics
    return {
      agentId: agent.id,
      agentName: agent.name,
      cpuUsage: Math.random() * 100, // Mock data
      memoryUsage: Math.random() * 100, // Mock data
      networkIn: Math.random() * 1000, // Mock data
      networkOut: Math.random() * 1000, // Mock data
      currentSessions: agent.currentSessions,
      maxConcurrentSessions: agent.maxConcurrentSessions,
      averageResponseTime: agent.averageResponseTime,
      successRate: agent.successRate,
    };
  }

  /**
   * Get system-wide resource usage
   */
  async getSystemResourceUsage(): Promise<any> {
    const agents = await this.agentRepository.find({
      where: { status: AIAgentStatus.ACTIVE },
    });

    const totalSessions = agents.reduce((sum, agent) => sum + agent.currentSessions, 0);
    const totalMaxSessions = agents.reduce((sum, agent) => sum + agent.maxConcurrentSessions, 0);
    const averageResponseTime = agents.length > 0 ? 
      agents.reduce((sum, agent) => sum + agent.averageResponseTime, 0) / agents.length : 0;
    const averageSuccessRate = agents.length > 0 ? 
      agents.reduce((sum, agent) => sum + agent.successRate, 0) / agents.length : 0;

    return {
      totalAgents: agents.length,
      totalSessions,
      totalMaxSessions,
      sessionUtilization: totalMaxSessions > 0 ? (totalSessions / totalMaxSessions) * 100 : 0,
      averageResponseTime,
      averageSuccessRate,
      timestamp: new Date(),
    };
  }
}

export default AIAgentLifecycleService;