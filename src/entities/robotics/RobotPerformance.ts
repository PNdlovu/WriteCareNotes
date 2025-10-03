import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { AssistiveRobot } from './AssistiveRobot';

@Entity('robot_performance')
export class RobotPerformance extends BaseEntity {
  @Column({ type: 'uuid' })
  robotId!: string;

  @Column({ type: 'varchar', length: 100 })
  metricName!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string;

  @Column({ type: 'timestamp' })
  recordedAt!: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => AssistiveRobot, robot => robot.performance)
  @JoinColumn({ name: 'robotId' })
  robot?: AssistiveRobot;
}