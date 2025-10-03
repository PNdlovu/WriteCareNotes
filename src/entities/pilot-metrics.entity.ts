import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pilot } from './pilot.entity';

@Entity('pilot_metrics')
export class PilotMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  // Engagement metrics
  @Column({ default: 0 })
  activeUsers: number;

  @Column({ default: 0 })
  totalLogins: number;

  @Column({ default: 0 })
  avgSessionDuration: number; // minutes

  @Column({ default: 0 })
  weeklyActiveUsers: number;

  @Column({ default: 0 })
  monthlyActiveUsers: number;

  // Compliance metrics
  @Column({ default: 0 })
  auditTrailCompleteness: number; // percentage

  @Column({ default: 0 })
  consentRecords: number;

  @Column({ default: 0 })
  nhsSyncSuccessRate: number; // percentage

  @Column({ default: 0 })
  gdprCompliance: number; // percentage

  @Column({ default: 0 })
  cqcCompliance: number; // percentage

  // Adoption metrics
  @Column({ default: 0 })
  modulesUsed: number;

  @Column({ default: 0 })
  medicationLogs: number;

  @Column({ default: 0 })
  carePlans: number;

  @Column({ default: 0 })
  consentEvents: number;

  @Column({ default: 0 })
  nhsIntegrations: number;

  // Feedback metrics
  @Column({ default: 0 })
  totalFeedback: number;

  @Column({ default: 0 })
  feedbackResolutionRate: number; // percentage

  @Column({ default: 0 })
  avgResolutionTime: number; // hours

  @Column('json', { nullable: true })
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Pilot, pilot => pilot.metrics)
  @JoinColumn({ name: 'tenantId', referencedColumnName: 'tenantId' })
  pilot: Pilot;
}