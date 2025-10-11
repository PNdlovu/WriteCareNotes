/**
 * @fileoverview Training Management System - Internal learning & external training tracking
 * @module Academy-training.service
 * @version 2.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance 
 *   - CQC (England)
 *   - Care Inspectorate (Scotland)
 *   - CIW (Wales)
 *   - RQIA (Northern Ireland)
 *   - Jersey Care Commission (Jersey)
 *   - Guernsey Health Improvement Commission (Guernsey)
 *   - Isle of Man DHSC (Isle of Man)
 *   - GDPR & Data Protection Act 2018
 * @stability stable
 * 
 * @description Complete training management hub for care homes across the British Isles:
 * - Internal app training (role-based modules, updates, onboarding)
 * - External accredited training tracking (Skills for Care, awarding bodies)
 * - Compliance monitoring and regulatory audit reports
 * 
 * @important COMPLIANCE NOTICE
 * This system provides internal training (company induction, app usage, procedures)
 * and tracks external accredited training. It does NOT replace nationally recognized
 * qualifications from Skills for Care, awarding bodies, or registered training organizations.
 * 
 * For regulatory compliance across England, Scotland, Wales, Northern Ireland, Jersey,
 * Guernsey, and Isle of Man, staff must complete appropriate accredited training from
 * recognized providers. This system helps you manage and prove that compliance.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditTrailService } from './audit/AuditTrailService';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// Training Course Entity
@Entity('training_courses')
@Index(['category', 'level'])
@Index(['isActive', 'createdAt'])
export class TrainingCourse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ['internal_app', 'internal_induction', 'internal_competency', 'internal_refresher', 'external_accredited'],
    default: 'internal_app'
  })
  trainingType: 'internal_app' | 'internal_induction' | 'internal_competency' | 'internal_refresher' | 'external_accredited';

  @Column({ nullable: true })
  accreditedProvider?: string; // e.g., "Skills for Care", "City & Guilds", "NCFE"

  @Column({ nullable: true })
  awardingBody?: string; // e.g., "Pearson", "Edexcel", "OCR"

  @Column({ nullable: true })
  qualificationLevel?: string; // e.g., "Level 2", "Level 3", "Care Certificate"

  @Column()
  category: 'app_usage' | 'role_training' | 'care_skills' | 'safety' | 'compliance' | 'technology' | 'leadership' | 'communication' | 'emergency_response' | 'external_qualification';

  @Column()
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @Column('int')
  duration: number; // in minutes

  @Column('int')
  credits: number;

  @Column('text', { array: true, default: [] })
  prerequisites: string[];

  @Column('text', { array: true, default: [] })
  learningObjectives: string[];

  @Column('jsonb')
  content: Array<{
    id: string;
    type: 'video' | 'text' | 'interactive' | 'quiz' | 'simulation' | 'document' | 'link';
    title: string;
    description: string;
    content: any;
    duration: number;
    order: number;
    isRequired: boolean;
    metadata?: Record<string, any>;
  }>;

  @Column('jsonb')
  assessments: Array<{
    id: string;
    title: string;
    description: string;
    type: 'quiz' | 'practical' | 'case_study' | 'simulation' | 'peer_review';
    questions: Array<{
      id: string;
      type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay' | 'practical' | 'scenario';
      question: string;
      options?: string[];
      correctAnswer?: any;
      explanation?: string;
      points: number;
      order: number;
    }>;
    passingScore: number;
    timeLimit: number;
    attemptsAllowed: number;
    isRequired: boolean;
    order: number;
  }>;

  @Column({ default: false })
  isMandatory: boolean;

  @Column('text', { array: true, default: [] })
  targetAudience: string[];

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Training Enrollment Entity
@Entity('training_enrollments')
@Index(['userId', 'courseId'])
@Index(['status', 'enrolledAt'])
export class TrainingEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  enrolledAt: Date;

  @Column({ default: 'enrolled' })
  status: 'enrolled' | 'in_progress' | 'completed' | 'failed' | 'withdrawn';

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column('int', { default: 0 })
  timeSpent: number; // in minutes

  @Column('int', { default: 0 })
  attempts: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({ nullable: true })
  currentContentId?: string;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ nullable: true })
  lastAccessedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Training Session Entity
@Entity('training_sessions')
@Index(['courseId', 'scheduledDate'])
@Index(['instructorId', 'status'])
export class TrainingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseId: string;

  @Column()
  instructorId: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column()
  sessionType: 'virtual' | 'in_person' | 'hybrid';

  @Column()
  scheduledDate: Date;

  @Column('int')
  duration: number; // in minutes

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  meetingLink?: string;

  @Column('text', { array: true, default: [] })
  participants: string[];

  @Column('jsonb', { default: [] })
  attendance: Array<{
    userId: string;
    status: 'present' | 'absent' | 'late';
    joinedAt?: Date;
    leftAt?: Date;
  }>;

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Training Completion Record Entity (replaces "Certificate")
@Entity('training_completion_records')
@Index(['userId', 'courseId'])
@Index(['recordNumber'])
export class TrainingCompletionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseId: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  recordNumber: string; // e.g., "INTERNAL-2025-ABC123" or "EXTERNAL-CERT-XYZ789"

  @Column({
    type: 'enum',
    enum: ['internal_completion', 'external_certificate'],
    default: 'internal_completion'
  })
  recordType: 'internal_completion' | 'external_certificate';

  @CreateDateColumn()
  issuedAt: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  verificationCode: string;

  @Column({ nullable: true })
  pdfPath?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Training Progress Interface
export interface TrainingProgress {
  userId: string;
  courseId: string;
  overallProgress: number;
  contentProgress: Array<{
    contentId: string;
    isCompleted: boolean;
    progress: number;
    timeSpent: number;
    lastAccessedAt: Date;
    completedAt?: Date;
  }>;
  assessmentScores: Array<{
    assessmentId: string;
    score: number;
    attempts: number;
    bestScore: number;
    lastAttemptAt: Date;
    passed: boolean;
  }>;
  timeSpent: number;
  lastAccessedAt: Date;
  completionDate?: Date;
  certificates: string[];
}

// Training Analytics Interface
export interface TrainingAnalytics {
  courseId: string;
  totalEnrollments: number;
  completions: number;
  averageScore: number;
  averageTimeToComplete: number;
  completionRate: number;
  dropOffPoints: Array<{
    contentId: string;
    contentTitle: string;
    dropOffRate: number;
    commonReasons: string[];
  }>;
  feedback: Array<{
    userId: string;
    rating: number;
    comment: string;
    submittedAt: Date;
  }>;
  lastUpdated: Date;
}

@Injectable()
export class AcademyTrainingService {
  private readonly logger = new Logger(AcademyTrainingService.name);

  constructor(
    @InjectRepository(TrainingCourse)
    private readonly courseRepository: Repository<TrainingCourse>,
    @InjectRepository(TrainingEnrollment)
    private readonly enrollmentRepository: Repository<TrainingEnrollment>,
    @InjectRepository(TrainingSession)
    private readonly sessionRepository: Repository<TrainingSession>,
    @InjectRepository(TrainingCompletionRecord)
    private readonly completionRecordRepository: Repository<TrainingCompletionRecord>,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new training course
   */
  async createCourse(courseData: Omit<TrainingCourse, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingCourse> {
    try {
      const course = this.courseRepository.create(courseData);
      const savedCourse = await this.courseRepository.save(course);

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Course',
        entityId: savedCourse.id,
        action: 'CREATE',
        details: {
          courseTitle: savedCourse.title,
          category: savedCourse.category,
          level: savedCourse.level,
          duration: savedCourse.duration,
          credits: savedCourse.credits,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('academy.course.created', {
        courseId: savedCourse.id,
        courseTitle: savedCourse.title,
        category: savedCourse.category,
        level: savedCourse.level,
        timestamp: new Date(),
      });

      this.logger.log(`Training course created: ${savedCourse.title} (${savedCourse.id})`);
      return savedCourse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create course: ${errorMessage}`, errorStack);
      throw new Error(`Failed to create course: ${errorMessage}`);
    }
  }

  /**
   * Get all courses
   */
  async getAllCourses(): Promise<TrainingCourse[]> {
    try {
      const courses = await this.courseRepository.find({
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Retrieved ${courses.length} training courses`);
      return courses;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get courses: ${errorMessage}`, errorStack);
      throw new Error(`Failed to get courses: ${errorMessage}`);
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string): Promise<TrainingCourse | null> {
    try {
      const course = await this.courseRepository.findOne({ where: { id: courseId } });
      
      if (course) {
        this.logger.log(`Retrieved course: ${course.title} (${courseId})`);
      }
      
      return course;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get course ${courseId}: ${errorMessage}`, errorStack);
      throw new Error(`Failed to get course: ${errorMessage}`);
    }
  }

  /**
   * Enroll a user in a course
   */
  async enrollUser(courseId: string, userId: string): Promise<TrainingEnrollment> {
    try {
      // Check if user is already enrolled
      const existingEnrollment = await this.enrollmentRepository.findOne({
        where: { courseId, userId },
      });

      if (existingEnrollment) {
        throw new Error('User is already enrolled in this course');
      }

      const enrollment = this.enrollmentRepository.create({
        courseId,
        userId,
        status: 'enrolled',
        progress: 0,
        timeSpent: 0,
        attempts: 0,
      });

      const savedEnrollment = await this.enrollmentRepository.save(enrollment);

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Enrollment',
        entityId: savedEnrollment.id,
        action: 'CREATE',
        details: {
          courseId,
          userId,
          enrolledAt: savedEnrollment.enrolledAt,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('academy.enrollment.created', {
        enrollmentId: savedEnrollment.id,
        courseId,
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`User ${userId} enrolled in course ${courseId}`);
      return savedEnrollment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to enroll user: ${errorMessage}`, errorStack);
      throw new Error(`Failed to enroll user: ${errorMessage}`);
    }
  }

  /**
   * Update course progress
   */
  async updateProgress(
    enrollmentId: string,
    contentId: string,
    progress: number,
    timeSpent: number,
  ): Promise<boolean> {
    try {
      const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } });
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      constupdateData: Partial<TrainingEnrollment> = {
        progress,
        timeSpent: enrollment.timeSpent + timeSpent,
        currentContentId: contentId,
        lastAccessedAt: new Date(),
      };

      if (progress >= 100) {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      } else if (enrollment.status === 'enrolled') {
        updateData.status = 'in_progress';
        updateData.startedAt = new Date();
      }

      await this.enrollmentRepository.update(enrollmentId, updateData);

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Progress',
        entityId: enrollmentId,
        action: 'UPDATE',
        details: {
          contentId,
          progress,
          timeSpent,
          status: updateData.status,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('academy.progress.updated', {
        enrollmentId,
        contentId,
        progress,
        timeSpent,
        status: updateData.status,
        timestamp: new Date(),
      });

      this.logger.log(`Progress updated for enrollment ${enrollmentId}: ${progress}%`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update progress: ${errorMessage}`, errorStack);
      return false;
    }
  }

  /**
   * Submit assessment
   */
  async submitAssessment(
    enrollmentId: string,
    assessmentId: string,
    answers: Record<string, any>,
    _timeSpent: number,
  ): Promise<{ score: number; passed: boolean; feedback: string }> {
    try {
      const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } });
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      const course = await this.courseRepository.findOne({ where: { id: enrollment.courseId } });
      if (!course) {
        throw new Error('Course not found');
      }

      const assessment = course.assessments.find(a => a.id === assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Calculate score
      const score = this.calculateAssessmentScore(assessment, answers);
      const passed = score >= assessment.passingScore;

      // Update enrollment
      constupdateData: Partial<TrainingEnrollment> = {
        score: Math.max(enrollment.score || 0, score),
        attempts: enrollment.attempts + 1,
      };

      if (passed && enrollment.progress >= 100) {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      }

      await this.enrollmentRepository.update(enrollmentId, updateData);

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Assessment',
        entityId: assessmentId,
        action: 'CREATE',
        details: {
          enrollmentId,
          score,
          passed,
          attempts: updateData.attempts,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('academy.assessment.submitted', {
        enrollmentId,
        assessmentId,
        score,
        passed,
        timestamp: new Date(),
      });

      const feedback = passed 
        ? 'Congratulations! You passed the assessment.' 
        : `Please review the material and try again. You need ${assessment.passingScore}% to pass.`;

      this.logger.log(`Assessment submitted for enrollment ${enrollmentId}: ${score}% (${passed ? 'PASSED' : 'FAILED'})`);
      
      return { score, passed, feedback };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to submit assessment: ${errorMessage}`, errorStack);
      throw new Error(`Failed to submit assessment: ${errorMessage}`);
    }
  }

  /**
   * Generate training completion record
   * For internal training, generates completion record
   * For external training, stores uploaded certificate
   */
  async generateCompletionRecord(enrollmentId: string): Promise<TrainingCompletionRecord> {
    try {
      const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } });
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      if (enrollment.status !== 'completed') {
        throw new Error('Course must be completed to generate record');
      }

      const course = await this.courseRepository.findOne({ where: { id: enrollment.courseId } });
      if (!course) {
        throw new Error('Course not found');
      }

      // Determine record type and number based on training type
      const isExternal = course.trainingType === 'external_accredited';
      constrecordType: 'internal_completion' | 'external_certificate' = isExternal ? 'external_certificate' : 'internal_completion';
      const recordPrefix = isExternal ? 'EXTERNAL-CERT' : 'INTERNAL';
      
      const completionRecord = this.completionRecordRepository.create({
        courseId: enrollment.courseId,
        userId: enrollment.userId,
        recordNumber: `${recordPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        recordType,
        expiresAt: course.credits > 0 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined, // 1 year for credit courses
        isActive: true,
        verificationCode: Math.random().toString(36).substring(2, 14).toUpperCase(),
        pdfPath: `/completion-records/${enrollmentId}.pdf`,
        metadata: {
          courseTitle: course.title,
          trainingType: course.trainingType,
          accreditedProvider: course.accreditedProvider,
          awardingBody: course.awardingBody,
          qualificationLevel: course.qualificationLevel,
          completionDate: enrollment.completedAt,
          score: enrollment.score,
          credits: course.credits,
        },
      });

      const savedRecord = await this.completionRecordRepository.save(completionRecord);

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'CompletionRecord',
        entityId: savedRecord.id,
        action: 'CREATE',
        details: {
          courseId: enrollment.courseId,
          userId: enrollment.userId,
          recordNumber: savedRecord.recordNumber,
          recordType: savedRecord.recordType,
          issuedAt: savedRecord.issuedAt,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('academy.completion_record.generated', {
        recordId: savedRecord.id,
        courseId: enrollment.courseId,
        userId: enrollment.userId,
        recordNumber: savedRecord.recordNumber,
        recordType: savedRecord.recordType,
        timestamp: new Date(),
      });

      this.logger.log(`Completion record generated: ${savedRecord.recordNumber} (${savedRecord.recordType}) for user ${enrollment.userId}`);
      return savedRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to generate completion record: ${errorMessage}`, errorStack);
      throw new Error(`Failed to generate completion record: ${errorMessage}`);
    }
  }

  /**
   * Get user's training progress
   */
  async getTrainingProgress(userId: string, courseId?: string): Promise<TrainingProgress[]> {
    try {
      const whereCondition = courseId ? { userId, courseId } : { userId };
      const enrollments = await this.enrollmentRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' },
      });

      constprogressRecords: TrainingProgress[] = [];

      for (const enrollment of enrollments) {
        const course = await this.courseRepository.findOne({ where: { id: enrollment.courseId } });
        if (!course) continue;

        const contentProgress = course.content.map(content => ({
          contentId: content.id,
          isCompleted: enrollment.progress >= 100,
          progress: enrollment.progress,
          timeSpent: enrollment.timeSpent,
          lastAccessedAt: enrollment.lastAccessedAt || enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
        }));

        const assessmentScores = course.assessments.map(assessment => ({
          assessmentId: assessment.id,
          score: enrollment.score || 0,
          attempts: enrollment.attempts,
          bestScore: enrollment.score || 0,
          lastAttemptAt: enrollment.updatedAt,
          passed: enrollment.status === 'completed',
        }));

        const completionRecords = await this.completionRecordRepository.find({
          where: { userId: enrollment.userId, courseId: enrollment.courseId },
        });

        progressRecords.push({
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          overallProgress: enrollment.progress,
          contentProgress,
          assessmentScores,
          timeSpent: enrollment.timeSpent,
          lastAccessedAt: enrollment.lastAccessedAt || enrollment.enrolledAt,
          completionDate: enrollment.completedAt,
          certificates: completionRecords.map(c => c.id), // Renamed from certificates
        });
      }

      this.logger.log(`Retrieved training progress for user ${userId}: ${progressRecords.length} records`);
      return progressRecords;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get training progress: ${errorMessage}`, errorStack);
      throw new Error(`Failed to get training progress: ${errorMessage}`);
    }
  }

  /**
   * Get course analytics
   */
  async getCourseAnalytics(courseId: string): Promise<TrainingAnalytics> {
    try {
      const enrollments = await this.enrollmentRepository.find({ where: { courseId } });
      const course = await this.courseRepository.findOne({ where: { id: courseId } });
      if (!course) {
        throw new Error('Course not found');
      }

      const totalEnrollments = enrollments.length;
      const completions = enrollments.filter(e => e.status === 'completed').length;
      const scoresWithValues = enrollments.filter(e => e.score !== undefined && e.score !== null);
      const averageScore = scoresWithValues.length > 0 
        ? scoresWithValues.reduce((sum, e) => sum + (e.score || 0), 0) / scoresWithValues.length 
        : 0;
      
      const completedEnrollments = enrollments.filter(e => e.status === 'completed');
      const averageTimeToComplete = completedEnrollments.length > 0
        ? completedEnrollments.reduce((sum, e) => sum + e.timeSpent, 0) / completedEnrollments.length
        : 0;
      
      const completionRate = totalEnrollments > 0 ? (completions / totalEnrollments) * 100 : 0;

      // Calculate drop-off points
      const dropOffPoints = course.content.map(content => {
        const contentEnrollments = enrollments.filter(e => e.currentContentId === content.id);
        const dropOffRate = contentEnrollments.length > 0 ? 
          (contentEnrollments.filter(e => e.status !== 'completed').length / contentEnrollments.length) * 100 : 0;
        
        return {
          contentId: content.id,
          contentTitle: content.title,
          dropOffRate,
          commonReasons: ['Content too difficult', 'Time constraints', 'Technical issues'],
        };
      });

      constanalytics: TrainingAnalytics = {
        courseId,
        totalEnrollments,
        completions,
        averageScore,
        averageTimeToComplete,
        completionRate,
        dropOffPoints,
        feedback: [], // This would be populated from feedback data
        lastUpdated: new Date(),
      };

      this.logger.log(`Generated analytics for course ${courseId}: ${totalEnrollments} enrollments, ${completionRate.toFixed(1)}% completion rate`);
      return analytics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get course analytics: ${errorMessage}`, errorStack);
      throw new Error(`Failed to get course analytics: ${errorMessage}`);
    }
  }

  /**
   * Get academy training statistics
   */
  async getAcademyTrainingStatistics(): Promise<any> {
    try {
      const totalCourses = await this.courseRepository.count();
      const activeCourses = await this.courseRepository.count({ where: { isActive: true } });
      const totalEnrollments = await this.enrollmentRepository.count();
      const completedEnrollments = await this.enrollmentRepository.count({ where: { status: 'completed' } });
      const inProgressEnrollments = await this.enrollmentRepository.count({ where: { status: 'in_progress' } });
      const failedEnrollments = await this.enrollmentRepository.count({ where: { status: 'failed' } });
      const totalSessions = await this.sessionRepository.count();
      const scheduledSessions = await this.sessionRepository.count({ where: { status: 'scheduled' } });
      const completedSessions = await this.sessionRepository.count({ where: { status: 'completed' } });
      const totalCompletionRecords = await this.completionRecordRepository.count();
      const activeCompletionRecords = await this.completionRecordRepository.count({ where: { isActive: true } });

      const statistics = {
        courses: {
          total: totalCourses,
          active: activeCourses,
          inactive: totalCourses - activeCourses,
        },
        enrollments: {
          total: totalEnrollments,
          completed: completedEnrollments,
          inProgress: inProgressEnrollments,
          failed: failedEnrollments,
          completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
        },
        sessions: {
          total: totalSessions,
          scheduled: scheduledSessions,
          completed: completedSessions,
        },
        completionRecords: {
          total: totalCompletionRecords,
          active: activeCompletionRecords,
          expired: totalCompletionRecords - activeCompletionRecords,
        },
        lastUpdated: new Date(),
      };

      this.logger.log(`Generated academy training statistics: ${totalCourses} courses, ${totalEnrollments} enrollments`);
      return statistics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get academy training statistics: ${errorMessage}`, errorStack);
      throw new Error(`Failed to get academy training statistics: ${errorMessage}`);
    }
  }

  /**
   * Helper method to calculate assessment score
   */
  private calculateAssessmentScore(assessment: any, answers: Record<string, any>): number {
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of assessment.questions) {
      totalPoints += question.points;
      
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        earnedPoints += question.points;
      }
    }

    return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  }
}

// Types are already exported above as classes and interfaces
