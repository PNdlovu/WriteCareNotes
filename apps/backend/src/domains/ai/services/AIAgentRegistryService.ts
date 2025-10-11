import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIAgent, AIAgentStatus, AIAgentType } from '../entities/AIAgent';
import { AIAgentRegistry, RegistryStatus } from '../entities/AIAgentRegistry';
import { AIAgentCapability, CapabilityType, CapabilityStatus } from '../entities/AIAgentCapability';

export interface AgentRegistrationData {
  name: string;
  displayName: string;
  description: string;
  type: AIAgentType;
  version: string;
  model: string;
  configuration: any;
  capabilities: string[];
  endpoint: string;
  healthCheckUrl: string;
  maxConcurrentSessions: number;
  metadata?: any;
}

export interface CapabilityRegistrationData {
  name: string;
  displayName: string;
  description: string;
  type: CapabilityType;
  version: string;
  parameters: any;
  configuration: any;
  endpoint: string;
  documentation?: string;
  examples?: any[];
  requiresAuthentication?: boolean;
  permissions?: string[];
  dependencies?: string[];
}

@Injectable()
export class AIAgentRegistryService {
  const ructor(
    @InjectRepository(AIAgent)
    privateagentRepository: Repository<AIAgent>,
    @InjectRepository(AIAgentRegistry)
    privateregistryRepository: Repository<AIAgentRegistry>,
    @InjectRepository(AIAgentCapability)
    privatecapabilityRepository: Repository<AIAgentCapability>,
  ) {}

  /**
   * Register a new AI agent
   */
  async registerAgent(data: AgentRegistrationData, createdBy: string): Promise<AIAgent> {
    // Check if agent with same name already exists
    const existingAgent = await this.agentRepository.findOne({
      where: { name: data.name },
    });

    if (existingAgent) {
      throw new Error(`Agent with name '${data.name}' already exists`);
    }

    // Create agent
    const agent = this.agentRepository.create({
      ...data,
      status: AIAgentStatus.INACTIVE,
      createdBy,
      updatedBy: createdBy,
    });

    const savedAgent = await this.agentRepository.save(agent);

    // Update registry metrics
    await this.updateRegistryMetrics();

    return savedAgent;
  }

  /**
   * Register a capability for an agent
   */
  async registerCapability(
    agentId: string, 
    data: CapabilityRegistrationData, 
    createdBy: string
  ): Promise<AIAgentCapability> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    // Check if capability with same name already exists for this agent
    const existingCapability = await this.capabilityRepository.findOne({
      where: { 
        agentId,
        name: data.name,
      },
    });

    if (existingCapability) {
      throw new Error(`Capability '${data.name}' already exists for agent '${agent.name}'`);
    }

    // Create capability
    const capability = this.capabilityRepository.create({
      ...data,
      agentId,
      status: CapabilityStatus.AVAILABLE,
      createdBy,
      updatedBy: createdBy,
    });

    return await this.capabilityRepository.save(capability);
  }

  /**
   * Activate an agent
   */
  async activateAgent(agentId: string, updatedBy: string): Promise<AIAgent> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    // Perform health check before activation
    const isHealthy = await this.performHealthCheck(agent);
    if (!isHealthy) {
      throw new Error('Agent failed health check and cannot be activated');
    }

    agent.status = AIAgentStatus.ACTIVE;
    agent.updatedBy = updatedBy;
    agent.lastHealthCheck = new Date();

    const savedAgent = await this.agentRepository.save(agent);
    await this.updateRegistryMetrics();

    return savedAgent;
  }

  /**
   * Deactivate an agent
   */
  async deactivateAgent(agentId: string, updatedBy: string): Promise<AIAgent> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    agent.status = AIAgentStatus.INACTIVE;
    agent.updatedBy = updatedBy;

    const savedAgent = await this.agentRepository.save(agent);
    await this.updateRegistryMetrics();

    return savedAgent;
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<AIAgent | null> {
    return await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['agentCapabilities', 'sessions'],
    });
  }

  /**
   * Get agent by name
   */
  async getAgentByName(name: string): Promise<AIAgent | null> {
    return await this.agentRepository.findOne({
      where: { name },
      relations: ['agentCapabilities', 'sessions'],
    });
  }

  /**
   * Get all agents
   */
  async getAllAgents(filters?: {
    status?: AIAgentStatus;
    type?: AIAgentType;
    limit?: number;
    offset?: number;
  }): Promise<AIAgent[]> {
    const query = this.agentRepository.createQueryBuilder('agent')
      .leftJoinAndSelect('agent.agentCapabilities', 'capabilities')
      .leftJoinAndSelect('agent.sessions', 'sessions');

    if (filters?.status) {
      query.andWhere('agent.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('agent.type = :type', { type: filters.type });
    }

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    return await query.getMany();
  }

  /**
   * Get agents by capability
   */
  async getAgentsByCapability(capabilityName: string): Promise<AIAgent[]> {
    return await this.agentRepository
      .createQueryBuilder('agent')
      .leftJoinAndSelect('agent.agentCapabilities', 'capabilities')
      .where('capabilities.name = :capabilityName', { capabilityName })
      .andWhere('agent.status = :status', { status: AIAgentStatus.ACTIVE })
      .andWhere('capabilities.status = :capStatus', { capStatus: CapabilityStatus.AVAILABLE })
      .getMany();
  }

  /**
   * Get available agents for a specific task
   */
  async getAvailableAgents(taskType: string, requiredCapabilities: string[]): Promise<AIAgent[]> {
    const query = this.agentRepository
      .createQueryBuilder('agent')
      .leftJoinAndSelect('agent.agentCapabilities', 'capabilities')
      .where('agent.status = :status', { status: AIAgentStatus.ACTIVE })
      .andWhere('agent.canAcceptNewSession = true');

    if (requiredCapabilities.length > 0) {
      query.andWhere('capabilities.name IN (:...capabilities)', { capabilities: requiredCapabilities });
    }

    return await query.getMany();
  }

  /**
   * Update agent metrics
   */
  async updateAgentMetrics(agentId: string, success: boolean, responseTime: number): Promise<void> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (agent) {
      agent.updateMetrics(success, responseTime);
      await this.agentRepository.save(agent);
      await this.updateRegistryMetrics();
    }
  }

  /**
   * Update capability metrics
   */
  async updateCapabilityMetrics(capabilityId: string, success: boolean, responseTime: number): Promise<void> {
    const capability = await this.capabilityRepository.findOne({
      where: { id: capabilityId },
    });

    if (capability) {
      capability.updateUsage(success, responseTime);
      await this.capabilityRepository.save(capability);
    }
  }

  /**
   * Perform health check on an agent
   */
  async performHealthCheck(agent: AIAgent): Promise<boolean> {
    if (!agent.healthCheckUrl) {
      return true; // No health check URL, assume healthy
    }

    try {
      const response = await fetch(agent.healthCheckUrl, {
        method: 'GET',
        timeout: 5000, // 5 second timeout
      });

      const isHealthy = response.ok;
      
      if (isHealthy) {
        agent.lastHealthCheck = new Date();
        agent.clearError();
      } else {
        agent.setError(`Health check failed with status ${response.status}`);
      }

      await this.agentRepository.save(agent);
      return isHealthy;

    } catch (error) {
      agent.setError(`Health checkfailed: ${error.message}`);
      await this.agentRepository.save(agent);
      return false;
    }
  }

  /**
   * Perform health checks on all agents
   */
  async performAllHealthChecks(): Promise<{ healthy: number; unhealthy: number; errors: string[] }> {
    const agents = await this.agentRepository.find({
      where: { status: AIAgentStatus.ACTIVE },
    });

    let healthy = 0;
    let unhealthy = 0;
    const errors: string[] = [];

    for (const agent of agents) {
      const isHealthy = await this.performHealthCheck(agent);
      if (isHealthy) {
        healthy++;
      } else {
        unhealthy++;
        if (agent.errorMessage) {
          errors.push(`${agent.name}: ${agent.errorMessage}`);
        }
      }
    }

    await this.updateRegistryMetrics();

    return { healthy, unhealthy, errors };
  }

  /**
   * Update registry metrics
   */
  private async updateRegistryMetrics(): Promise<void> {
    const agents = await this.agentRepository.find();
    const activeAgents = agents.filter(agent => agent.status === AIAgentStatus.ACTIVE);

    const totalSessions = agents.reduce((sum, agent) => sum + agent.currentSessions, 0);
    const totalRequests = agents.reduce((sum, agent) => sum + agent.totalRequests, 0);
    const successfulRequests = agents.reduce((sum, agent) => sum + agent.successfulRequests, 0);

    const averageResponseTime = agents.length > 0 ? 
      agents.reduce((sum, agent) => sum + agent.averageResponseTime, 0) / agents.length : 0;

    const overallSuccessRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    // Update or create registry record
    let registry = await this.registryRepository.findOne({
      where: { name: 'default' },
    });

    if (!registry) {
      registry = this.registryRepository.create({
        name: 'default',
        description: 'Default AI Agent Registry',
        version: '1.0.0',
        status: RegistryStatus.ACTIVE,
        configuration: {},
      });
    }

    registry.totalAgents = agents.length;
    registry.activeAgents = activeAgents.length;
    registry.totalSessions = totalSessions;
    registry.activeSessions = totalSessions; // Assuming all sessions are active
    registry.averageResponseTime = averageResponseTime;
    registry.overallSuccessRate = overallSuccessRate;
    registry.lastHealthCheck = new Date();

    await this.registryRepository.save(registry);
  }

  /**
   * Get registry status
   */
  async getRegistryStatus(): Promise<any> {
    const registry = await this.registryRepository.findOne({
      where: { name: 'default' },
    });

    if (!registry) {
      return {
        healthy: false,
        status: 'not_initialized',
        message: 'Registry not initialized',
      };
    }

    return registry.getRegistryStatus();
  }

  /**
   * Get agent statistics
   */
  async getAgentStatistics(): Promise<any> {
    const agents = await this.agentRepository.find();
    const capabilities = await this.capabilityRepository.find();

    const stats = {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === AIAgentStatus.ACTIVE).length,
      totalCapabilities: capabilities.length,
      availableCapabilities: capabilities.filter(c => c.status === CapabilityStatus.AVAILABLE).length,
      totalSessions: agents.reduce((sum, agent) => sum + agent.currentSessions, 0),
      totalRequests: agents.reduce((sum, agent) => sum + agent.totalRequests, 0),
      averageResponseTime: agents.length > 0 ? 
        agents.reduce((sum, agent) => sum + agent.averageResponseTime, 0) / agents.length : 0,
      overallSuccessRate: agents.length > 0 ? 
        agents.reduce((sum, agent) => sum + agent.successRate, 0) / agents.length : 0,
    };

    return stats;
  }
}

export default AIAgentRegistryService;
