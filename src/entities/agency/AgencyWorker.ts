import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum WorkerStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  UNAVAILABLE = 'unavailable',
  ON_BREAK = 'on_break'
}

@Entity('agency_workers')
export class AgencyWorker extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  workerId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  agencyName: string;

  @Column({
    type: 'enum',
    enum: WorkerStatus,
    default: WorkerStatus.AVAILABLE
  })
  status: WorkerStatus;

  @Column('simple-array')
  skills: string[];

  @Column('decimal', { precision: 5, scale: 2 })
  hourlyRate: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isAvailable(): boolean {
    return this.status === WorkerStatus.AVAILABLE && this.isActive;
  }

  hasSkill(skill: string): boolean {
    return this.skills.includes(skill);
  }
}