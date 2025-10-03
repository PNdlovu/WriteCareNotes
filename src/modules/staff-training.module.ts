import { EventEmitter2 } from "eventemitter2";

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffTrainingController } from '../controllers/staff-training.controller';
import { StaffTrainingService } from '../services/staff-training.service';
import { LearningManagementService } from '../services/learning-management.service';
import { CompetencyAssessmentService } from '../services/competency-assessment.service';
import { TrainingEntity } from '../entities/training.entity';
import { CompetencyEntity } from '../entities/competency.entity';
import { CertificationEntity } from '../entities/certification.entity';
import { TrainingModuleEntity } from '../entities/training-module.entity';
import { VirtualRealityTrainingService } from '../services/vr-training.service';
import { MentorshipService } from '../services/mentorship.service';
import { ContinuousEducationService } from '../services/continuous-education.service';
import { PerformanceTrackingService } from '../services/performance-tracking.service';

/**
 * Staff Training & Support Module
 * 
 * Provides comprehensive staff training and professional development:
 * - Learning Management System (LMS) with interactive courses
 * - Competency-based training and assessment
 * - Virtual Reality training simulations
 * - Mentorship and buddy system programs
 * - Continuous professional development tracking
 * - Certification and compliance management
 * - Performance tracking and feedback
 * - Specialized care training (dementia, end-of-life, etc.)
 * - Emergency response training
 * - Technology training for new systems
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingEntity,
      CompetencyEntity,
      CertificationEntity,
      TrainingModuleEntity,
    ]),
  ],
  controllers: [StaffTrainingController],
  providers: [
    StaffTrainingService,
    LearningManagementService,
    CompetencyAssessmentService,
    VirtualRealityTrainingService,
    MentorshipService,
    ContinuousEducationService,
    PerformanceTrackingService,
  ],
  exports: [
    StaffTrainingService,
    LearningManagementService,
    CompetencyAssessmentService,
    VirtualRealityTrainingService,
    MentorshipService,
    ContinuousEducationService,
    PerformanceTrackingService,
  ],
})
export class StaffTrainingModule {}