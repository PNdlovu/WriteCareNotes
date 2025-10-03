import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('workflow_orchestrations')
export class WorkflowOrchestration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  workflowId: string;

  @Column()
  workflowName: string;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.PENDING
  })
  status: WorkflowStatus;

  @Column('jsonb')
  steps: Array<{
    stepId: string;
    stepName: string;
    service: string;
    endpoint: string;
    parameters: any;
    dependencies: string[];
    timeout: number;
  }>;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isCompleted(): boolean {
    return this.status === WorkflowStatus.COMPLETED;
  }
}