import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { TrainingEnrollment } from './TrainingEnrollment';
import { TrainingSession } from './TrainingSession';
import { TrainingCertificate } from './TrainingCertificate';

@Entity('training_courses')
export class TrainingCourse extends BaseEntity {
  @Column({ type: 'var char', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ 
    type: 'enum', 
    enum: ['care_skills', 'safety', 'compliance', 'technology', 'leadership', 'communication', 'healthcare', 'emergency_response'] 
  })
  category!: string;

  @Column({ 
    type: 'enum', 
    enum: ['beginner', 'intermediate', 'advanced', 'expert'] 
  })
  level!: string;

  @Column({ type: 'int' })
  duration!: number; // minutes

  @Column({ type: 'int' })
  credits!: number;

  @Column({ type: 'json', nullable: true })
  prerequisites?: string[];

  @Column({ type: 'json', nullable: true })
  learningObjectives?: string[];

  @Column({ type: 'json', nullable: true })
  content?: any[];

  @Column({ type: 'json', nullable: true })
  assessments?: any[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isMandatory!: boolean;

  @Column({ type: 'json', nullable: true })
  targetAudience?: string[];

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @OneToMany(() => TrainingEnrollment, enrollment => enrollment.course)
  enrollments?: TrainingEnrollment[];

  @OneToMany(() => TrainingSession, session => session.course)
  sessions?: TrainingSession[];

  @OneToMany(() => TrainingCertificate, certificate => certificate.course)
  certificates?: TrainingCertificate[];
}
