import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn } from 'typeorm';
import { AIAgent } from './AIAgent';
import { AIAgentCapability } from './AIAgentCapability';

export enum RegistryStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

@Entity('ai_agent_registries')
export class AIAgentRegistry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 100, unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: RegistryStatus, default: RegistryStatus.ACTIVE })
  status: RegistryStatus;

  @Column({ type: 'var char', length: 50 })
  version: string;

  @Column({ type: 'json' })
  configuration: any; // Registry configuration

  @Column({ type: 'var char', length: 100, nullable: true })
  endpoint: string; // Registry service endpoint

  @Column({ type: 'var char', length: 100, nullable: true })
  healthCheckUrl: string;

  @Column({ type: 'int', default: 0 })
  totalAgents: number;

  @Column({ type: 'int', default: 0 })
  activeAgents: number;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  activeSessions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageResponseTime: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overallSuccessRate: number;

  @Column({ type: 'timestamp', nullable: true })
  lastHealthCheck: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public isHealthy(): boolean {
    if (this.status === RegistryStatus.ERROR) return false;
    if (!this.lastHealthCheck) return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastHealthCheck > fiveMinutesAgo;
  }

  public updateMetrics(): void {
    // This would typically be called by the registry service
    // to update aggregated metrics from all registered agents
  }

  public getRegistryStatus(): {
    healthy: boolean;
    status: RegistryStatus;
    totalAgents: number;
    activeAgents: number;
    totalSessions: number;
    activeSessions: number;
    averageResponseTime: number;
    overallSuccessRate: number;
    lastHealthCheck: Date | null;
    errorMessage: string | null;
  } {
    return {
      healthy: this.isHealthy(),
      status: this.status,
      totalAgents: this.totalAgents,
      activeAgents: this.activeAgents,
      totalSessions: this.totalSessions,
      activeSessions: this.activeSessions,
      averageResponseTime: this.averageResponseTime,
      overallSuccessRate: this.overallSuccessRate,
      lastHealthCheck: this.lastHealthCheck,
      errorMessage: this.errorMessage,
    };
  }
}
