import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pilot } from './pilot.entity';

@Entity('pilot_feedback')
export class PilotFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  module: string;

  @Column('text')
  description: string;

  @Column()
  severity: string; // 'low' | 'medium' | 'high' | 'critical'

  @Column('text', { nullable: true })
  suggestedFix: string;

  @Column()
  submittedBy: string;

  @Column({ default: 'open' })
  status: string; // 'open' | 'in_progress' | 'resolved' | 'closed'

  @Column('text', { nullable: true })
  resolution: string;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Pilot, pilot => pilot.feedback)
  @JoinColumn({ name: 'tenantId', referencedColumnName: 'tenantId' })
  pilot: Pilot;
}