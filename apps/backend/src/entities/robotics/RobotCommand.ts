import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { AssistiveRobot } from './AssistiveRobot';

@Entity('robot_commands')
export class RobotCommand extends BaseEntity {
  @Column({ type: 'uuid' })
  robotId!: string;

  @Column({ 
    type: 'enum', 
    enum: ['move', 'stop', 'start', 'pause', 'resume', 'emergency_stop', 'calibrate', 'diagnostic'] 
  })
  commandType!: string;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'executing', 'completed', 'failed', 'cancelled'] 
  })
  status!: string;

  @Column({ type: 'json', nullable: true })
  parameters?: Record<string, any>;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'timestamp', nullable: true })
  executedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  result?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ManyToOne(() => AssistiveRobot, robot => robot.commands)
  @JoinColumn({ name: 'robotId' })
  robot?: AssistiveRobot;
}