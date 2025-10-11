import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { TrainingCourse } from './TrainingCourse';

@Entity('training_sessions')
export class TrainingSession extends BaseEntity {
  @Column({ type: 'uuid' })
  courseId!: string;

  @Column({ type: 'uuid' })
  instructorId!: string;

  @Column({ type: 'var char', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'timestamp' })
  scheduledDate!: Date;

  @Column({ type: 'int' })
  duration!: number; // minutes

  @Column({ type: 'int' })
  maxParticipants!: number;

  @Column({ type: 'var char', length: 255 })
  location!: string;

  @Column({ 
    type: 'enum', 
    enum: ['in_person', 'virtual', 'hybrid'] 
  })
  sessionType!: string;

  @Column({ 
    type: 'enum', 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] 
  })
  status!: string;

  @Column({ type: 'json', nullable: true })
  participants?: string[];

  @Column({ type: 'json', nullable: true })
  attendance?: any[];

  @Column({ type: 'json', nullable: true })
  materials?: string[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => TrainingCourse, course => course.sessions)
  @JoinColumn({ name: 'courseId' })
  course?: TrainingCourse;
}
