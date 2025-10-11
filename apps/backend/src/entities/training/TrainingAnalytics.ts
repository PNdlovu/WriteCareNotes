import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('training_analytics')
export class TrainingAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  courseId!: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'var char', length: 100 })
  metricType!: string;

  @Column({ type: 'var char', length: 255 })
  metricName!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value?: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp' })
  recordedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
