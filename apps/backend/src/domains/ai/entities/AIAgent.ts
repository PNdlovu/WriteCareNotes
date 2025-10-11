import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AIAgentCapability } from './AIAgentCapability';
import { AIAgentSession } from './AIAgentSession';
import { AIAgentConversation } from './AIAgentConversation';

export enum AIAgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  DEPRECATED = 'deprecated'
}

export enum AIAgentType {
  CARE_ASSISTANT = 'care_assistant',
  MEDICATION_MANAGER = 'medication_manager',
  SCHEDULING_AGENT = 'scheduling_agent',
  RISK_MONITOR = 'risk_monitor',
  COMPLIANCE_CHECKER = 'compliance_checker',
  FAMILY_COMMUNICATOR = 'family_communicator',
  STAFF_TRAINER = 'staff_trainer',
  ANALYTICS_AGENT = 'analytics_agent',
  DOCUMENT_PROCESSOR = 'document_processor',
  EMERGENCY_RESPONDER = 'emergency_responder'
}

export enum AIAgentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('ai_agents')
export class AIAgent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 100, unique: true })
  name: string;

  @Column({ type: 'var char', length: 200 })
  displayName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: AIAgentType })
  type: AIAgentType;

  @Column({ type: 'enum', enum: AIAgentStatus, default: AIAgentStatus.INACTIVE })
  status: AIAgentStatus;

  @Column({ type: 'enum', enum: AIAgentPriority, default: AIAgentPriority.NORMAL })
  priority: AIAgentPriority;

  @Column({ type: 'var char', length: 50 })
  version: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  model: string; // e.g., 'gpt-4', 'claude-3', 'custom-model'

  @Column({ type: 'json' })
  configuration: any; // Agent-specific configuration

  @Column({ type: 'json' })
  capabilities: string[]; // List of capability IDs

  @Column({ type: 'json', nullable: true })
  metadata: any; // Additional metadata

  @Column({ type: 'var char', length: 100, nullable: true })
  endpoint: string; // Microservice endpoint

  @Column({ type: 'var char', length: 100, nullable: true })
  healthCheckUrl: string;

  @Column({ type: 'int', default: 0 })
  maxConcurrentSessions: number;

  @Column({ type: 'int', default: 0 })
  currentSessions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageResponseTime: number; // in seconds

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number; // percentage

  @Column({ type: 'int', default: 0 })
  totalRequests: number;

  @Column({ type: 'int', default: 0 })
  successfulRequests: number;

  @Column({ type: 'int', default: 0 })
  failedRequests: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastHealthCheck: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => AIAgentCapability, capability => capability.agent)
  agentCapabilities: AIAgentCapability[];

  @OneToMany(() => AIAgentSession, session => session.agent)
  sessions: AIAgentSession[];

  @OneToMany(() => AIAgentConversation, conversation => conversation.agent)
  conversations: AIAgentConversation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public isHealthy(): boolean {
    if (this.status === AIAgentStatus.ERROR) return false;
    if (!this.lastHealthCheck) return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastHealthCheck > fiveMinutesAgo;
  }

  public canAcceptNewSession(): boolean {
    return this.status === AIAgentStatus.ACTIVE && 
           this.currentSessions < this.maxConcurrentSessions;
  }

  public updateMetrics(success: boolean, responseTime: number): void {
    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    // Update average response time
    this.averageResponseTime = (this.averageResponseTime * (this.totalRequests - 1) + responseTime) / this.totalRequests;

    // Update success rate
    this.successRate = (this.successfulRequests / this.totalRequests) * 100;

    this.lastActiveAt = new Date();
  }

  public incrementSessions(): void {
    this.currentSessions++;
  }

  public decrementSessions(): void {
    this.currentSessions = Math.max(0, this.currentSessions - 1);
  }

  public setError(error: string): void {
    this.status = AIAgentStatus.ERROR;
    this.errorMessage = error;
  }

  public clearError(): void {
    this.status = AIAgentStatus.ACTIVE;
    this.errorMessage = null;
  }

  public getHealthStatus(): {
    healthy: boolean;
    status: AIAgentStatus;
    lastHealthCheck: Date | null;
    errorMessage: string | null;
  } {
    return {
      healthy: this.isHealthy(),
      status: this.status,
      lastHealthCheck: this.lastHealthCheck,
      errorMessage: this.errorMessage,
    };
  }

  public getPerformanceMetrics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    averageResponseTime: number;
    currentSessions: number;
    maxConcurrentSessions: number;
  } {
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: this.successRate,
      averageResponseTime: this.averageResponseTime,
      currentSessions: this.currentSessions,
      maxConcurrentSessions: this.maxConcurrentSessions,
    };
  }
}
