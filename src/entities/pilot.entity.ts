import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PilotFeedback } from './pilot-feedback.entity';
import { PilotMetrics } from './pilot-metrics.entity';

@Entity('pilots')
export class Pilot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tenantId: string;

  @Column()
  careHomeName: string;

  @Column()
  location: string;

  @Column()
  region: string;

  @Column()
  size: number; // number of residents

  @Column()
  type: string; // 'nursing' | 'residential' | 'dementia' | 'mixed'

  @Column()
  contactEmail: string;

  @Column()
  contactPhone: string;

  @Column({ default: 'pending' })
  status: string; // 'pending' | 'active' | 'completed' | 'suspended' | 'cancelled'

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column('json', { nullable: true })
  features: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PilotFeedback, feedback => feedback.pilot)
  feedback: PilotFeedback[];

  @OneToMany(() => PilotMetrics, metrics => metrics.pilot)
  metrics: PilotMetrics[];
}