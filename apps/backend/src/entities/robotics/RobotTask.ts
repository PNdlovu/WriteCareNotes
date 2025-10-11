import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { AssistiveRobot } from './AssistiveRobot';

@Entity('robot_tasks')
export class RobotTask extends BaseEntity {
  @Column({ type: 'uuid' })
  robotId!: string;

  @Column({ 
    type: 'enum', 
    enum: ['medication_delivery', 'mobility_assistance', 'monitoring', 'cleaning', 'companion', 'emergency_response'] 
  })
  taskType!: string;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'] 
  })
  status!: string;

  @Column({ 
    type: 'enum', 
    enum: ['low', 'medium', 'high', 'urgent'] 
  })
  priority!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'uuid' })
  assignedTo!: string;

  @Column({ type: 'timestamp' })
  scheduledTime!: Date;

  @Column({ type: 'int' })
  estimatedDuration!: number; // minutes

  @Column({ type: 'json', nullable: true })
  parameters?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  result?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ManyToOne(() => AssistiveRobot, robot => robot.tasks)
  @JoinColumn({ name: 'robotId' })
  robot?: AssistiveRobot;
}