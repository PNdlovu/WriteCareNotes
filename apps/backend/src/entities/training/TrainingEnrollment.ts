import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { TrainingCourse } from './TrainingCourse';

@Entity('training_enrollments')
export class TrainingEnrollment extends BaseEntity {
  @Column({ type: 'uuid' })
  courseId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ 
    type: 'enum', 
    enum: ['enrolled', 'in_progress', 'completed', 'cancelled', 'failed'] 
  })
  status!: string;

  @Column({ type: 'timestamp', nullable: true })
  enrolledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', default: 0 })
  progress!: number; // percentage

  @Column({ type: 'int', default: 0 })
  timeSpent!: number; // minutes

  @Column({ type: 'json', nullable: true })
  contentProgress?: any[];

  @Column({ type: 'json', nullable: true })
  assessmentScores?: any[];

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  currentContentId?: string;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @ManyToOne(() => TrainingCourse, course => course.enrollments)
  @JoinColumn({ name: 'courseId' })
  course?: TrainingCourse;
}
