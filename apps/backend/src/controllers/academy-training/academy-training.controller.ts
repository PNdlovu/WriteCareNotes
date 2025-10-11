/**
 * @fileoverview academy-training.controller
 * @module Academy-training/Academy-training.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description academy-training.controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { AcademyTrainingService, TrainingCourse, TrainingEnrollment, TrainingSession, TrainingCertificate, TrainingProgress, TrainingAnalytics } from '../../services/academy-training.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/academy-training')
@UseGuards(AuthGuard)
export class AcademyTrainingController {
  const ructor(
    private readonlyacademyTrainingService: AcademyTrainingService,
    private readonlyauditService: AuditService,
  ) {}

  /**
   * Create a new training course
   */
  @Post('courses')
  @UseGuards(RbacGuard)
  async createCourse(
    @Body() courseData: {
      title: string;
      description: string;
      category: 'care_skills' | 'safety' | 'compliance' | 'technology' | 'leadership' | 'communication' | 'healthcare' | 'emergency_response';
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      duration: number;
      credits: number;
      prerequisites: string[];
      learningObjectives: string[];
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
      isMandatory: boolean;
      targetAudience: string[];
      tags: string[];
    },
    @Request() req: any,
  ) {
    try {
      const course = await this.academyTrainingService.createCourse({
        ...courseData,
        isActive: true,
      });

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Course',
        entityId: course.id,
        action: 'CREATE',
        details: {
          courseTitle: course.title,
          category: course.category,
          level: course.level,
          duration: course.duration,
          credits: course.credits,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: course,
        message: 'Course created successfully',
      };
    } catch (error) {
      console.error('Error creatingcourse:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all courses
   */
  @Get('courses')
  @UseGuards(RbacGuard)
  async getAllCourses(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    try {
      const courses = await this.academyTrainingService.getAllCourses();

      let filteredCourses = courses;

      if (category) {
        filteredCourses = filteredCourses.filter(course => course.category === category);
      }

      if (level) {
        filteredCourses = filteredCourses.filter(course => course.level === level);
      }

      if (isActive !== undefined) {
        filteredCourses = filteredCourses.filter(course => course.isActive === isActive);
      }

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Courses',
        entityId: 'courses_list',
        action: 'READ',
        details: {
          category,
          level,
          isActive,
          count: filteredCourses.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: filteredCourses,
        message: 'Courses retrieved successfully',
      };
    } catch (error) {
      console.error('Error gettingcourses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get course by ID
   */
  @Get('courses/:courseId')
  @UseGuards(RbacGuard)
  async getCourseById(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    try {
      const course = await this.academyTrainingService.getCourseById(courseId);

      if (!course) {
        return {
          success: false,
          error: 'Course not found',
        };
      }

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Course',
        entityId: courseId,
        action: 'READ',
        details: {
          courseTitle: course.title,
          category: course.category,
          level: course.level,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: course,
        message: 'Course retrieved successfully',
      };
    } catch (error) {
      console.error('Error gettingcourse:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Enroll a user in a course
   */
  @Post('enrollments')
  @UseGuards(RbacGuard)
  async enrollUser(
    @Body() enrollmentData: {
      courseId: string;
      userId: string;
    },
    @Request() req: any,
  ) {
    try {
      const enrollment = await this.academyTrainingService.enrollUser(
        enrollmentData.courseId,
        enrollmentData.userId,
      );

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Enrollment',
        entityId: enrollment.id,
        action: 'CREATE',
        details: {
          courseId: enrollmentData.courseId,
          userId: enrollmentData.userId,
          enrolledAt: enrollment.enrolledAt,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: enrollment,
        message: 'User enrolled successfully',
      };
    } catch (error) {
      console.error('Error enrollinguser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update course progress
   */
  @Put('enrollments/:enrollmentId/progress')
  @UseGuards(RbacGuard)
  async updateProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Body() progressData: {
      contentId: string;
      progress: number;
      timeSpent: number;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.academyTrainingService.updateProgress(
        enrollmentId,
        progressData.contentId,
        progressData.progress,
        progressData.timeSpent,
      );

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Progress',
        entityId: enrollmentId,
        action: 'UPDATE',
        details: {
          contentId: progressData.contentId,
          progress: progressData.progress,
          timeSpent: progressData.timeSpent,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Progress updated successfully' : 'Failed to update progress',
      };
    } catch (error) {
      console.error('Error updatingprogress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Submit assessment
   */
  @Post('assessments/:enrollmentId/submit')
  @UseGuards(RbacGuard)
  async submitAssessment(
    @Param('enrollmentId') enrollmentId: string,
    @Body() assessmentData: {
      assessmentId: string;
      answers: Record<string, any>;
      timeSpent: number;
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.academyTrainingService.submitAssessment(
        enrollmentId,
        assessmentData.assessmentId,
        assessmentData.answers,
        assessmentData.timeSpent,
      );

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Assessment',
        entityId: assessmentData.assessmentId,
        action: 'CREATE',
        details: {
          enrollmentId,
          score: result.score,
          passed: result.passed,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: result,
        message: 'Assessment submitted successfully',
      };
    } catch (error) {
      console.error('Error submittingassessment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate training certificate
   */
  @Post('certificates/:enrollmentId')
  @UseGuards(RbacGuard)
  async generateCertificate(
    @Param('enrollmentId') enrollmentId: string,
    @Request() req: any,
  ) {
    try {
      const certificate = await this.academyTrainingService.generateCertificate(enrollmentId);

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Certificate',
        entityId: certificate.id,
        action: 'CREATE',
        details: {
          courseId: certificate.courseId,
          userId: certificate.userId,
          certificateNumber: certificate.certificateNumber,
          issuedAt: certificate.issuedAt,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: certificate,
        message: 'Certificate generated successfully',
      };
    } catch (error) {
      console.error('Error generatingcertificate:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's training progress
   */
  @Get('progress/:userId')
  @UseGuards(RbacGuard)
  async getTrainingProgress(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query('courseId') courseId?: string,
  ) {
    try {
      const progress = await this.academyTrainingService.getTrainingProgress(userId, courseId);

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Progress',
        entityId: `progress_${userId}`,
        action: 'READ',
        details: {
          userId,
          courseId,
          recordCount: progress.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: progress,
        message: 'Training progress retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting trainingprogress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get course analytics
   */
  @Get('analytics/:courseId')
  @UseGuards(RbacGuard)
  async getCourseAnalytics(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    try {
      const analytics = await this.academyTrainingService.getCourseAnalytics(courseId);

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Analytics',
        entityId: courseId,
        action: 'READ',
        details: {
          totalEnrollments: analytics.totalEnrollments,
          completions: analytics.completions,
          averageScore: analytics.averageScore,
          completionRate: analytics.completionRate,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: analytics,
        message: 'Course analytics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting courseanalytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get academy training statistics
   */
  @Get('statistics')
  @UseGuards(RbacGuard)
  async getAcademyTrainingStatistics(@Request() req: any) {
    try {
      const statistics = await this.academyTrainingService.getAcademyTrainingStatistics();

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Statistics',
        entityId: 'academy_stats',
        action: 'READ',
        details: {
          totalCourses: statistics.courses.total,
          activeCourses: statistics.courses.active,
          totalEnrollments: statistics.enrollments.total,
          completedEnrollments: statistics.enrollments.completed,
          totalSessions: statistics.sessions.total,
          totalCertificates: statistics.certificates.total,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: statistics,
        message: 'Academy training statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting academy trainingstatistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get course categories
   */
  @Get('categories')
  @UseGuards(RbacGuard)
  async getCourseCategories(@Request() req: any) {
    try {
      const categories = [
        {
          id: 'care_skills',
          name: 'Care Skills',
          description: 'Essential care skills and techniques',
          icon: 'heart',
          color: '#E91E63',
        },
        {
          id: 'safety',
          name: 'Safety',
          description: 'Safety protocols and procedures',
          icon: 'shield-check',
          color: '#F44336',
        },
        {
          id: 'compliance',
          name: 'Compliance',
          description: 'Regulatory compliance and standards',
          icon: 'clipboard-check',
          color: '#9C27B0',
        },
        {
          id: 'technology',
          name: 'Technology',
          description: 'Technology tools and systems',
          icon: 'laptop',
          color: '#2196F3',
        },
        {
          id: 'leadership',
          name: 'Leadership',
          description: 'Leadership and management skills',
          icon: 'users',
          color: '#FF9800',
        },
        {
          id: 'communication',
          name: 'Communication',
          description: 'Communication and interpersonal skills',
          icon: 'chat',
          color: '#4CAF50',
        },
        {
          id: 'healthcare',
          name: 'Healthcare',
          description: 'Healthcare knowledge and practices',
          icon: 'medical-bag',
          color: '#00BCD4',
        },
        {
          id: 'emergency_response',
          name: 'Emergency Response',
          description: 'Emergency response and crisis management',
          icon: 'alert-triangle',
          color: '#FF5722',
        },
      ];

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Categories',
        entityId: 'categories_list',
        action: 'READ',
        details: {
          count: categories.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: categories,
        message: 'Course categories retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting coursecategories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get course levels
   */
  @Get('levels')
  @UseGuards(RbacGuard)
  async getCourseLevels(@Request() req: any) {
    try {
      const levels = [
        {
          id: 'beginner',
          name: 'Beginner',
          description: 'Entry-level courses for new staff',
          color: '#4CAF50',
          prerequisites: 'None',
        },
        {
          id: 'intermediate',
          name: 'Intermediate',
          description: 'Mid-level courses for experienced staff',
          color: '#FF9800',
          prerequisites: 'Basic knowledge required',
        },
        {
          id: 'advanced',
          name: 'Advanced',
          description: 'Advanced courses for senior staff',
          color: '#F44336',
          prerequisites: 'Intermediate knowledge required',
        },
        {
          id: 'expert',
          name: 'Expert',
          description: 'Expert-level courses for specialists',
          color: '#9C27B0',
          prerequisites: 'Advanced knowledge required',
        },
      ];

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'Levels',
        entityId: 'levels_list',
        action: 'READ',
        details: {
          count: levels.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: levels,
        message: 'Course levels retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting courselevels:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get content types
   */
  @Get('content-types')
  @UseGuards(RbacGuard)
  async getContentTypes(@Request() req: any) {
    try {
      const contentTypes = [
        {
          type: 'video',
          name: 'Video',
          description: 'Video content and tutorials',
          icon: 'play-circle',
          supportedFormats: ['MP4', 'WebM', 'MOV'],
          maxSize: '500MB',
        },
        {
          type: 'text',
          name: 'Text',
          description: 'Text-based content and articles',
          icon: 'file-text',
          supportedFormats: ['HTML', 'Markdown', 'PDF'],
          maxSize: '10MB',
        },
        {
          type: 'interactive',
          name: 'Interactive',
          description: 'Interactive content and simulations',
          icon: 'mouse-pointer',
          supportedFormats: ['HTML5', 'Flash', 'Unity'],
          maxSize: '100MB',
        },
        {
          type: 'quiz',
          name: 'Quiz',
          description: 'Interactive quizzes and assessments',
          icon: 'help-circle',
          supportedFormats: ['HTML5', 'JSON'],
          maxSize: '1MB',
        },
        {
          type: 'simulation',
          name: 'Simulation',
          description: 'Virtual simulations and scenarios',
          icon: 'cpu',
          supportedFormats: ['Unity', 'WebGL', 'VR'],
          maxSize: '1GB',
        },
        {
          type: 'document',
          name: 'Document',
          description: 'Document downloads and resources',
          icon: 'download',
          supportedFormats: ['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX'],
          maxSize: '50MB',
        },
        {
          type: 'link',
          name: 'Link',
          description: 'External links and resources',
          icon: 'external-link',
          supportedFormats: ['URL'],
          maxSize: 'N/A',
        },
      ];

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'ContentTypes',
        entityId: 'content_types_list',
        action: 'READ',
        details: {
          count: contentTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: contentTypes,
        message: 'Content types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting contenttypes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get assessment types
   */
  @Get('assessment-types')
  @UseGuards(RbacGuard)
  async getAssessmentTypes(@Request() req: any) {
    try {
      const assessmentTypes = [
        {
          type: 'quiz',
          name: 'Quiz',
          description: 'Multiple choice and true/false questions',
          icon: 'help-circle',
          questionTypes: ['multiple_choice', 'true_false'],
          autoGraded: true,
        },
        {
          type: 'practical',
          name: 'Practical',
          description: 'Hands-on practical assessments',
          icon: 'wrench',
          questionTypes: ['practical', 'scenario'],
          autoGraded: false,
        },
        {
          type: 'case_study',
          name: 'Case Study',
          description: 'Real-world case study analysis',
          icon: 'book-open',
          questionTypes: ['essay', 'scenario'],
          autoGraded: false,
        },
        {
          type: 'simulation',
          name: 'Simulation',
          description: 'Virtual simulation assessments',
          icon: 'cpu',
          questionTypes: ['practical', 'scenario'],
          autoGraded: true,
        },
        {
          type: 'peer_review',
          name: 'Peer Review',
          description: 'Peer evaluation and feedback',
          icon: 'users',
          questionTypes: ['essay', 'rating'],
          autoGraded: false,
        },
      ];

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'AssessmentTypes',
        entityId: 'assessment_types_list',
        action: 'READ',
        details: {
          count: assessmentTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: assessmentTypes,
        message: 'Assessment types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting assessmenttypes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get question types
   */
  @Get('question-types')
  @UseGuards(RbacGuard)
  async getQuestionTypes(@Request() req: any) {
    try {
      const questionTypes = [
        {
          type: 'multiple_choice',
          name: 'Multiple Choice',
          description: 'Select one answer from multiple options',
          icon: 'list',
          autoGraded: true,
          options: 'Required',
        },
        {
          type: 'true_false',
          name: 'True/False',
          description: 'Select true or false',
          icon: 'check-circle',
          autoGraded: true,
          options: 'N/A',
        },
        {
          type: 'fill_blank',
          name: 'Fill in the Blank',
          description: 'Fill in missing words or phrases',
          icon: 'edit',
          autoGraded: true,
          options: 'N/A',
        },
        {
          type: 'essay',
          name: 'Essay',
          description: 'Written response questions',
          icon: 'file-text',
          autoGraded: false,
          options: 'N/A',
        },
        {
          type: 'practical',
          name: 'Practical',
          description: 'Hands-on practical tasks',
          icon: 'wrench',
          autoGraded: false,
          options: 'N/A',
        },
        {
          type: 'scenario',
          name: 'Scenario',
          description: 'Real-world scenario questions',
          icon: 'book-open',
          autoGraded: false,
          options: 'N/A',
        },
      ];

      await this.auditService.logEvent({
        resource: 'AcademyTraining',
        entityType: 'QuestionTypes',
        entityId: 'question_types_list',
        action: 'READ',
        details: {
          count: questionTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: questionTypes,
        message: 'Question types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting questiontypes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
