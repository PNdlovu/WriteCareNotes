import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { TrainingCourse } from './TrainingCourse';

@Entity('training_certificates')
export class TrainingCertificate extends BaseEntity {
  @Column({ type: 'uuid' })
  courseId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'var char', length: 100, unique: true })
  certificateNumber!: string;

  @Column({ type: 'timestamp' })
  issuedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'var char', length: 50, unique: true })
  verificationCode!: string;

  @Column({ type: 'var char', length: 500 })
  pdfPath!: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => TrainingCourse, course => course.certificates)
  @JoinColumn({ name: 'courseId' })
  course?: TrainingCourse;
}
