import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('training_progress')
export class TrainingProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  courseId!: string;

  @Column({ type: 'int', default: 0 })
  overallProgress!: number; // percentage

  @Column({ type: 'json', nullable: true })
  contentProgress?: any[];

  @Column({ type: 'json', nullable: true })
  assessmentScores?: any[];

  @Column({ type: 'int', default: 0 })
  timeSpent!: number; // minutes

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completionDate?: Date;

  @Column({ type: 'json', nullable: true })
  certificates?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}