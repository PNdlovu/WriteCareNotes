/**
 * @fileoverview Real staff certification service with comprehensive training management
 * @module Academy-training/StaffCertificationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Real staff certification service with comprehensive training management
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService,  AuditTrailService } from '../audit';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// Training Module Entity
@Entity('training_modules')
@Index(['category', 'level'])
@Index(['isActive', 'createdAt'])
export class TrainingModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  category: 'mandatory' | 'optional' | 'specialized' | 'compliance' | 'safety';

  @Column()
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @Column('int')
  duration: number; // in minutes

  @Column('text', { array: true, default: [] })
  prerequisites: string[];

  @Column('text', { array: true, default: [] })
  learningObjectives: string[];

  @Column('jsonb')
  content: any[];

  @Column('jsonb')
  assessment: any;

  @Column('text', { array: true, default: [] })
  complianceRequirements: string[];

  @Column('int', { default: 365 })
  expiryPeriod: number; // in days

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Staff Certification Entity
@Entity('staff_certifications')
@Index(['staffId', 'careHomeId'])
@Index(['status', 'assignedAt'])
export class StaffCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  staffId: string;

  @Column()
  careHomeId: string;

  @Column()
  trainingModuleId: string;

  @Column()
  assignedBy: string;

  @CreateDateColumn()
  assignedAt: Date;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ default: 'assigned' })
  status: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'expired';

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column('text', { array: true, default: [] })
  completedContent: string[];

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column('int', { default: 0 })
  attempts: number;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Learning Path Entity
@Entity('learning_paths')
@Index(['category', 'isActive'])
export class LearningPath {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  category: 'new_hire' | 'role_specific' | 'compliance' | 'career_development';

  @Column('text', { array: true })
  modules: string[];

  @Column('text', { array: true, default: [] })
  prerequisites: string[];

  @Column('int')
  estimatedDuration: number; // in hours

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Micro Learning Entity
@Entity('micro_learning')
@Index(['category', 'isRequired'])
export class MicroLearning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('int')
  duration: number; // in minutes

  @Column()
  category: 'quick_tip' | 'policy_update' | 'safety_reminder' | 'best_practice';

  @Column('text')
  content: string;

  @Column('jsonb', { nullable: true })
  quiz?: any[];

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Injectable()
export class StaffCertificationService {
  private readonlylogger = new Logger(StaffCertificationService.name);

  const ructor(
    @InjectRepository(TrainingModule)
    private readonlytrainingModuleRepository: Repository<TrainingModule>,
    @InjectRepository(StaffCertification)
    private readonlystaffCertificationRepository: Repository<StaffCertification>,
    @InjectRepository(LearningPath)
    private readonlylearningPathRepository: Repository<LearningPath>,
    @InjectRepository(MicroLearning)
    private readonlymicroLearningRepository: Repository<MicroLearning>,
    private readonlyeventEmitter: EventEmitter2,
    private readonlyauditService: AuditService,
  ) {}

  /**
   * Create a new training module
   */
  async createTrainingModule(moduleData: Omit<TrainingModule, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingModule> {
    try {
      const module = this.trainingModuleRepository.create(moduleData);
      const savedModule = await this.trainingModuleRepository.save(module);

      await this.auditService.logEvent({
        resource: 'StaffCertification',
        entityType: 'TrainingModule',
        entityId: savedModule.id,
        action: 'CREATE',
        details: {
          title: savedModule.title,
          category: savedModule.category,
          level: savedModule.level,
          duration: savedModule.duration,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('training.module.created', {
        moduleId: savedModule.id,
        title: savedModule.title,
        category: savedModule.category,
        timestamp: new Date(),
      });

      this.logger.log(`Training modulecreated: ${savedModule.title} (${savedModule.id})`);
      return savedModule;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create trainingmodule: ${errorMessage}`, errorStack);
      throw new Error(`Failed to create trainingmodule: ${errorMessage}`);
    }
  }

  /**
   * Get training modules
   */
  async getTrainingModules(category?: string): Promise<TrainingModule[]> {
    try {
      const whereCondition = category ? { category, isActive: true } : { isActive: true };
      const modules = await this.trainingModuleRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Retrieved ${modules.length} training modules`);
      return modules;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get trainingmodules: ${errorMessage}`, errorStack);
      throw new Error(`Failed to get trainingmodules: ${errorMessage}`);
    }
  }

  /**
   * Assign training to staff
   */
  async assignTraining(
    staffId: string,
    careHomeId: string,
    trainingModuleId: string,
    assignedBy: string,
  ): Promise<StaffCertification> {
    try {
      // Check if already assigned
      const existingCertification = await this.staffCertificationRepository.findOne({
        where: { staffId, trainingModuleId, status: 'assigned' },
      });

      if (existingCertification) {
        throw new Error('Training already assigned to this staff member');
      }

      const module = await this.trainingModuleRepository.findOne({ where: { id: trainingModuleId } });
      if (!module) {
        throw new Error('Training module not found');
      }

      const certification = this.staffCertificationRepository.create({
        staffId,
        careHomeId,
        trainingModuleId,
        assignedBy,
        status: 'assigned',
        progress: 0,
        completedContent: [],
        attempts: 0,
        expiresAt: new Date(Date.now() + module.expiryPeriod * 24 * 60 * 60 * 1000),
      });

      const savedCertification = await this.staffCertificationRepository.save(certification);

      await this.auditService.logEvent({
        resource: 'StaffCertification',
        entityType: 'Certification',
        entityId: savedCertification.id,
        action: 'CREATE',
        details: {
          staffId,
          careHomeId,
          trainingModuleId,
          assignedBy,
        },
        userId: assignedBy,
      });

      this.eventEmitter.emit('training.assigned', {
        certificationId: savedCertification.id,
        staffId,
        trainingModuleId,
        assignedBy,
        timestamp: new Date(),
      });

      this.logger.log(`Training assigned: ${trainingModuleId} to staff ${staffId}`);
      return savedCertification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to assigntraining: ${errorMessage}`, errorStack);
      throw new Error(`Failed to assigntraining: ${errorMessage}`);
    }
  }

  /**
   * Start training
   */
  async startTraining(certificationId: string, staffId: string): Promise<StaffCertification> {
    try {
      const certification = await this.staffCertificationRepository.findOne({
        where: { id: certificationId, staffId },
      });

      if (!certification) {
        throw new Error('Certification not found');
      }

      if (certification.status !== 'assigned') {
        throw new Error('Training cannot be started in current status');
      }

      certification.status = 'in_progress';
      certification.startedAt = new Date();
      certification.updatedAt = new Date();

      const updatedCertification = await this.staffCertificationRepository.save(certification);

      await this.auditService.logEvent({
        resource: 'StaffCertification',
        entityType: 'Certification',
        entityId: certificationId,
        action: 'UPDATE',
        details: {
          status: 'in_progress',
          startedAt: certification.startedAt,
        },
        userId: staffId,
      });

      this.eventEmitter.emit('training.started', {
        certificationId,
        staffId,
        timestamp: new Date(),
      });

      this.logger.log(`Training started: ${certificationId} by staff ${staffId}`);
      return updatedCertification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to starttraining: ${errorMessage}`, errorStack);
      throw new Error(`Failed to starttraining: ${errorMessage}`);
    }
  }

  /**
   * Update training progress
   */
  async updateProgress(
    certificationId: string,
    staffId: string,
    progress: number,
    completedContent: string[],
  ): Promise<StaffCertification> {
    try {
      const certification = await this.staffCertificationRepository.findOne({
        where: { id: certificationId, staffId },
      });

      if (!certification) {
        throw new Error('Certification not found');
      }

      certification.progress = progress;
      certification.completedContent = completedContent;
      certification.updatedAt = new Date();

      if (progress >= 100) {
        certification.status = 'completed';
        certification.completedAt = new Date();
      }

      const updatedCertification = await this.staffCertificationRepository.save(certification);

      await this.auditService.logEvent({
        resource: 'StaffCertification',
        entityType: 'Certification',
        entityId: certificationId,
        action: 'UPDATE',
        details: {
          progress,
          completedContent: completedContent.length,
          status: certification.status,
        },
        userId: staffId,
      });

      this.eventEmitter.emit('training.progress.updated', {
        certificationId,
        staffId,
        progress,
        status: certification.status,
        timestamp: new Date(),
      });

      this.logger.log(`Training progressupdated: ${certificationId} - ${progress}%`);
      return updatedCertification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to updateprogress: ${errorMessage}`, errorStack);
      throw new Error(`Failed to updateprogress: ${errorMessage}`);
    }
  }

  /**
   * Submit assessment
   */
  async submitAssessment(
    certificationId: string,
    staffId: string,
    answers: Record<string, string>,
    timeSpent: number,
  ): Promise<{ score: number; passed: boolean; feedback: string }> {
    try {
      const certification = await this.staffCertificationRepository.findOne({
        where: { id: certificationId, staffId },
      });

      if (!certification) {
        throw new Error('Certification not found');
      }

      const module = await this.trainingModuleRepository.findOne({
        where: { id: certification.trainingModuleId },
      });

      if (!module) {
        throw new Error('Training module not found');
      }

      // Calculate score based on assessment
      const score = this.calculateAssessmentScore(module.assessment, answers);
      const passed = score >= 70; // 70% passing score

      certification.score = Math.max(certification.score || 0, score);
      certification.attempts += 1;

      if (passed && certification.progress >= 100) {
        certification.status = 'completed';
        certification.completedAt = new Date();
      } else if (!passed) {
        certification.status = 'failed';
      }

      await this.staffCertificationRepository.save(certification);

      await this.auditService.logEvent({
        resource: 'StaffCertification',
        entityType: 'Assessment',
        entityId: certificationId,
        action: 'CREATE',
        details: {
          score,
          passed,
          attempts: certification.attempts,
          timeSpent,
        },
        userId: staffId,
      });

      this.eventEmitter.emit('assessment.submitted', {
        certificationId,
        staffId,
        score,
        passed,
        timestamp: new Date(),
      });

      const feedback = passed 
        ? 'Congratulations! You passed the assessment.' 
        : 'Please review the material and try again. You need 70% to pass.';

      this.logger.log(`Assessment submitted: ${certificationId} - ${score}% (${passed ? 'PASSED' : 'FAILED'})`);
      
      return { score, passed, feedback };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to submitassessment: ${errorMessage}`, errorStack);
      throw new Error(`Failed to submitassessment: ${errorMessage}`);
    }
  }

  /**
   * Get staff certifications
   */
  async getStaffCertifications(staffId: string): Promise<StaffCertification[]> {
    try {
      const certifications = await this.staffCertificationRepository.find({
        where: { staffId },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Retrieved ${certifications.length} certifications for staff ${staffId}`);
      return certifications;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get staffcertifications: ${errorMessage}`, errorStack);
      throw new Error(`Failed to get staffcertifications: ${errorMessage}`);
    }
  }

  /**
   * Create learning path
   */
  async createLearningPath(pathData: Omit<LearningPath, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningPath> {
    try {
      const learningPath = this.learningPathRepository.create(pathData);
      const savedPath = await this.learningPathRepository.save(learningPath);

      await this.auditService.logEvent({
        resource: 'StaffCertification',
        entityType: 'LearningPath',
        entityId: savedPath.id,
        action: 'CREATE',
        details: {
          name: savedPath.name,
          category: savedPath.category,
          moduleCount: savedPath.modules.length,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('learning.path.created', {
        pathId: savedPath.id,
        name: savedPath.name,
        category: savedPath.category,
        timestamp: new Date(),
      });

      this.logger.log(`Learning pathcreated: ${savedPath.name} (${savedPath.id})`);
      return savedPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create learningpath: ${errorMessage}`, errorStack);
      throw new Error(`Failed to create learningpath: ${errorMessage}`);
    }
  }

  /**
   * Create micro-learning content
   */
  async createMicroLearning(contentData: Omit<MicroLearning, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<MicroLearning> {
    try {
      const microLearning = this.microLearningRepository.create({
        ...contentData,
        isActive: true,
      });
      const savedContent = await this.microLearningRepository.save(microLearning);

      await this.auditService.logEvent({
        resource: 'StaffCertification',
        entityType: 'MicroLearning',
        entityId: savedContent.id,
        action: 'CREATE',
        details: {
          title: savedContent.title,
          category: savedContent.category,
          duration: savedContent.duration,
          isRequired: savedContent.isRequired,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('micro.learning.created', {
        contentId: savedContent.id,
        title: savedContent.title,
        category: savedContent.category,
        timestamp: new Date(),
      });

      this.logger.log(`Micro-learning created: ${savedContent.title} (${savedContent.id})`);
      return savedContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create micro-learning: ${errorMessage}`, errorStack);
      throw new Error(`Failed to create micro-learning: ${errorMessage}`);
    }
  }

  /**
   * Helper method to calculate assessment score
   */
  private calculateAssessmentScore(assessment: any, answers: Record<string, string>): number {
    if (!assessment || !assessment.questions) {
      return 0;
    }

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of assessment.questions) {
      totalPoints += question.points || 1;
      
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        earnedPoints += question.points || 1;
      }
    }

    return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  }
}
