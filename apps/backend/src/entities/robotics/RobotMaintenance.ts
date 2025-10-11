import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { AssistiveRobot } from './AssistiveRobot';

@Entity('robot_maintenance')
export class RobotMaintenance extends BaseEntity {
  @Column({ type: 'uuid' })
  robotId!: string;

  @Column({ 
    type: 'enum', 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] 
  })
  status!: string;

  @Column({ 
    type: 'enum', 
    enum: ['routine', 'repair', 'upgrade', 'inspection', 'calibration'] 
  })
  type!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'timestamp' })
  scheduledDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  technicianId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  partsUsed?: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @ManyToOne(() => AssistiveRobot, robot => robot.maintenance)
  @JoinColumn({ name: 'robotId' })
  robot?: AssistiveRobot;
}