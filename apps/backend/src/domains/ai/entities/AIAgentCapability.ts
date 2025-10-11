import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AIAgent } from './AIAgent';

export enum CapabilityType {
  FUNCTION = 'function',
  SKILL = 'skill',
  INTEGRATION = 'integration',
  ANALYSIS = 'analysis',
  COMMUNICATION = 'communication',
  AUTOMATION = 'automation'
}

export enum CapabilityStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  DEPRECATED = 'deprecated',
  BETA = 'beta'
}

@Entity('ai_agent_capabilities')
export class AIAgentCapability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AIAgent, agent => agent.agentCapabilities)
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;

  @Column({ type: 'uuid' })
  agentId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  displayName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: CapabilityType })
  type: CapabilityType;

  @Column({ type: 'enum', enum: CapabilityStatus, default: CapabilityStatus.AVAILABLE })
  status: CapabilityStatus;

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({ type: 'json' })
  parameters: any; // Capability parameters schema

  @Column({ type: 'json' })
  configuration: any; // Capability-specific configuration

  @Column({ type: 'varchar', length: 200, nullable: true })
  endpoint: string; // Capability endpoint

  @Column({ type: 'varchar', length: 200, nullable: true })
  documentation: string; // Documentation URL

  @Column({ type: 'json', nullable: true })
  examples: any[]; // Usage examples

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageResponseTime: number;

  @Column({ type: 'boolean', default: true })
  requiresAuthentication: boolean;

  @Column({ type: 'json', nullable: true })
  permissions: string[]; // Required permissions

  @Column({ type: 'json', nullable: true })
  dependencies: string[]; // Dependent capabilities

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public isAvailable(): boolean {
    return this.status === CapabilityStatus.AVAILABLE;
  }

  public canBeUsed(): boolean {
    return this.isAvailable() && this.agent?.status === 'active';
  }

  public updateUsage(success: boolean, responseTime: number): void {
    this.usageCount++;
    
    // Update success rate
    const currentSuccessRate = this.successRate * (this.usageCount - 1) / this.usageCount;
    this.successRate = success ? 
      currentSuccessRate + (100 / this.usageCount) : 
      currentSuccessRate;

    // Update average response time
    this.averageResponseTime = (this.averageResponseTime * (this.usageCount - 1) + responseTime) / this.usageCount;
  }

  public getCapabilityInfo(): {
    id: string;
    name: string;
    displayName: string;
    description: string;
    type: CapabilityType;
    status: CapabilityStatus;
    version: string;
    available: boolean;
    usageCount: number;
    successRate: number;
    averageResponseTime: number;
    requiresAuthentication: boolean;
    permissions: string[];
    dependencies: string[];
  } {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      type: this.type,
      status: this.status,
      version: this.version,
      available: this.isAvailable(),
      usageCount: this.usageCount,
      successRate: this.successRate,
      averageResponseTime: this.averageResponseTime,
      requiresAuthentication: this.requiresAuthentication,
      permissions: this.permissions || [],
      dependencies: this.dependencies || [],
    };
  }

  public validateParameters(parameters: any): { valid: boolean; errors: string[] } {
    consterrors: string[] = [];
    
    if (!this.parameters) {
      return { valid: true, errors: [] };
    }

    // Basic parameter validation
    for (const [key, param] of Object.entries(this.parameters)) {
      if (param.required && !(key in parameters)) {
        errors.push(`Required parameter '${key}' is missing`);
      }
      
      if (key in parameters) {
        const value = parameters[key];
        const paramDef = param as any;
        
        if (paramDef.type === 'string' && typeof value !== 'string') {
          errors.push(`Parameter '${key}' must be a string`);
        } else if (paramDef.type === 'number' && typeof value !== 'number') {
          errors.push(`Parameter '${key}' must be a number`);
        } else if (paramDef.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Parameter '${key}' must be a boolean`);
        } else if (paramDef.type === 'array' && !Array.isArray(value)) {
          errors.push(`Parameter '${key}' must be an array`);
        } else if (paramDef.type === 'object' && typeof value !== 'object') {
          errors.push(`Parameter '${key}' must be an object`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
