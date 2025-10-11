import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { RobotTask } from './RobotTask';
import { RobotCommand } from './RobotCommand';
import { RobotPerformance } from './RobotPerformance';
import { RobotMaintenance } from './RobotMaintenance';

@Entity('assistive_robots')
export class AssistiveRobot extends BaseEntity {
  @Column({ type: 'var char', length: 100, unique: true })
  robotId!: string;

  @Column({ type: 'var char', length: 255 })
  name!: string;

  @Column({ type: 'var char', length: 100 })
  model!: string;

  @Column({ type: 'var char', length: 100 })
  manufacturer!: string;

  @Column({ 
    type: 'enum', 
    enum: ['medication_delivery', 'mobility_assistance', 'monitoring', 'cleaning', 'companion'] 
  })
  type!: string;

  @Column({ 
    type: 'enum', 
    enum: ['active', 'inactive', 'maintenance', 'error', 'offline'] 
  })
  status!: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'json', nullable: true })
  capabilities?: string[];

  @Column({ type: 'json', nullable: true })
  configuration?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastMaintenance?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActivity?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => RobotTask, task => task.robot)
  tasks?: RobotTask[];

  @OneToMany(() => RobotCommand, command => command.robot)
  commands?: RobotCommand[];

  @OneToMany(() => RobotPerformance, performance => performance.robot)
  performance?: RobotPerformance[];

  @OneToMany(() => RobotMaintenance, maintenance => maintenance.robot)
  maintenance?: RobotMaintenance[];
}
