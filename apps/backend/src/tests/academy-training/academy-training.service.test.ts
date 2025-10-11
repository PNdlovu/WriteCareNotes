import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AcademyTrainingService } from '../../services/academy-training.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';
import { TrainingCourse } from '../../entities/training/TrainingCourse';
import { TrainingEnrollment } from '../../entities/training/TrainingEnrollment';
import { TrainingSession } from '../../entities/training/TrainingSession';
import { TrainingCertificate } from '../../entities/training/TrainingCertificate';
import { TrainingProgress } from '../../entities/training/TrainingProgress';
import { TrainingAnalytics } from '../../entities/training/TrainingAnalytics';

describe('AcademyTrainingService', () => {
  let service: AcademyTrainingService;
  let mockCourseRepository: any;
  let mockEnrollmentRepository: any;
  let mockSessionRepository: any;
  let mockCertificateRepository: any;
  let mockProgressRepository: any;
  let mockAnalyticsRepository: any;
  let mockEventEmitter: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockCourseRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockEnrollmentRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockSessionRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockCertificateRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockProgressRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockAnalyticsRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockAuditService = {
      logEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademyTrainingService,
        {
          provide: getRepositoryToken(TrainingCourse),
          useValue: mockCourseRepository,
        },
        {
          provide: getRepositoryToken(TrainingEnrollment),
          useValue: mockEnrollmentRepository,
        },
        {
          provide: getRepositoryToken(TrainingSession),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(TrainingCertificate),
          useValue: mockCertificateRepository,
        },
        {
          provide: getRepositoryToken(TrainingProgress),
          useValue: mockProgressRepository,
        },
        {
          provide: getRepositoryToken(TrainingAnalytics),
          useValue: mockAnalyticsRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AcademyTrainingService>(AcademyTrainingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should create a new training course successfully', async () => {
      const courseData = {
        title: 'Basic Care Skills',
        description: 'Essential care skills for new staff',
        category: 'care_skills' as const,
        level: 'beginner' as const,
        duration: 120,
        credits: 2,
        prerequisites: [],
        learningObjectives: ['Learn basic care techniques', 'Understand safety protocols'],
        content: [
          {
            id: 'content_001',
            type: 'video' as const,
            title: 'Introduction to Care',
            description: 'Basic introduction video',
            content: 'https://example.com/video1.mp4',
            duration: 30,
            order: 1,
            isRequired: true,
          },
        ],
        assessments: [
          {
            id: 'assessment_001',
            title: 'Care Skills Quiz',
            description: 'Test your knowledge',
            type: 'quiz' as const,
            questions: [
              {
                id: 'q1',
                type: 'multiple_choice' as const,
                question: 'What is the first step in providing care?',
                options: ['Wash hands', 'Check vital signs', 'Introduce yourself'],
                correctAnswer: 'Wash hands',
                points: 10,
                order: 1,
              },
            ],
            passingScore: 80,
            timeLimit: 30,
            attemptsAllowed: 3,
            isRequired: true,
            order: 1,
          },
        ],
        isActive: true,
        isMandatory: false,
        targetAudience: ['care_staff'],
        tags: ['care', 'basic', 'safety'],
      };

      const result = await service.createCourse(courseData);

      expect(result).toEqual({
        id: expect.any(String),
        ...courseData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockCourseRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        ...courseData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.course.created', {
        courseId: expect.any(String),
        courseTitle: courseData.title,
        category: courseData.category,
        level: courseData.level,
        timestamp: expect.any(Date),
      });
    });

    it('should handle course creation failure', async () => {
      const courseData = {
        title: 'Basic Care Skills',
        description: 'Essential care skills for new staff',
        category: 'care_skills' as const,
        level: 'beginner' as const,
        duration: 120,
        credits: 2,
        prerequisites: [],
        learningObjectives: [],
        content: [],
        assessments: [],
        isActive: true,
        isMandatory: false,
        targetAudience: [],
        tags: [],
      };

      mockCourseRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createCourse(courseData)).rejects.toThrow('Failed to create course');
    });
  });

  describe('enrollUser', () => {
    it('should enroll a user in a course successfully', async () => {
      const courseId = 'course_001';
      const userId = 'user_001';

      mockEnrollmentRepository.findOne.mockResolvedValue(null);

      const result = await service.enrollUser(courseId, userId);

      expect(result).toEqual({
        id: expect.any(String),
        courseId,
        userId,
        enrolledAt: expect.any(Date),
        status: 'enrolled',
        progress: 0,
        timeSpent: 0,
        attempts: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockEnrollmentRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        courseId,
        userId,
        enrolledAt: expect.any(Date),
        status: 'enrolled',
        progress: 0,
        timeSpent: 0,
        attempts: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.enrollment.created', {
        enrollmentId: expect.any(String),
        courseId,
        userId,
        timestamp: expect.any(Date),
      });
    });

    it('should handle enrollment failure when user already enrolled', async () => {
      const courseId = 'course_001';
      const userId = 'user_001';

      const existingEnrollment = {
        id: 'enrollment_001',
        courseId,
        userId,
        status: 'enrolled',
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(existingEnrollment);

      await expect(service.enrollUser(courseId, userId)).rejects.toThrow('User is already enrolled in this course');
    });

    it('should handle enrollment failure during processing', async () => {
      const courseId = 'course_001';
      const userId = 'user_001';

      mockEnrollmentRepository.findOne.mockResolvedValue(null);
      mockEnrollmentRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.enrollUser(courseId, userId)).rejects.toThrow('Failed to enroll user');
    });
  });

  describe('startTrainingSession', () => {
    it('should start a training session successfully', async () => {
      const sessionData = {
        courseId: 'course_001',
        instructorId: 'instructor_001',
        title: 'Care Skills Workshop',
        description: 'Hands-on care skills training',
        scheduledDate: new Date(),
        duration: 180,
        maxParticipants: 20,
        location: 'Training Room A',
        sessionType: 'in_person' as const,
        materials: ['handout1.pdf', 'handout2.pdf'],
        status: 'scheduled' as const,
        participants: [],
        attendance: [],
        isActive: true,
      };

      const result = await service.startTrainingSession(sessionData);

      expect(result).toEqual({
        id: expect.any(String),
        ...sessionData,
        status: 'scheduled',
        participants: [],
        attendance: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockSessionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        ...sessionData,
        status: 'scheduled',
        participants: [],
        attendance: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.session.created', {
        sessionId: expect.any(String),
        courseId: sessionData.courseId,
        instructorId: sessionData.instructorId,
        scheduledDate: sessionData.scheduledDate,
        timestamp: expect.any(Date),
      });
    });

    it('should handle session creation failure', async () => {
      const sessionData = {
        courseId: 'course_001',
        instructorId: 'instructor_001',
        title: 'Care Skills Workshop',
        description: 'Hands-on care skills training',
        scheduledDate: new Date(),
        duration: 180,
        maxParticipants: 20,
        location: 'Training Room A',
        sessionType: 'in_person' as const,
        materials: [],
        status: 'scheduled' as const,
        participants: [],
        attendance: [],
        isActive: true,
      };

      mockSessionRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.startTrainingSession(sessionData)).rejects.toThrow('Failed to start training session');
    });
  });

  describe('updateProgress', () => {
    it('should update course progress successfully', async () => {
      const enrollmentId = 'enrollment_001';
      const contentId = 'content_001';
      const progress = 50;
      const timeSpent = 30;

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'enrolled',
        progress: 0,
        timeSpent: 0,
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);

      const result = await service.updateProgress(enrollmentId, contentId, progress, timeSpent);

      expect(result).toBe(true);
      expect(mockEnrollmentRepository.update).toHaveBeenCalledWith(enrollmentId, {
        progress,
        timeSpent: timeSpent,
        currentContentId: contentId,
        lastAccessedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        status: 'in_progress',
        startedAt: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.progress.updated', {
        enrollmentId,
        contentId,
        progress,
        timeSpent,
        status: 'in_progress',
        timestamp: expect.any(Date),
      });
    });

    it('should mark course as completed when progress reaches 100%', async () => {
      const enrollmentId = 'enrollment_001';
      const contentId = 'content_001';
      const progress = 100;
      const timeSpent = 30;

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'in_progress',
        progress: 50,
        timeSpent: 60,
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);

      const result = await service.updateProgress(enrollmentId, contentId, progress, timeSpent);

      expect(result).toBe(true);
      expect(mockEnrollmentRepository.update).toHaveBeenCalledWith(enrollmentId, {
        progress,
        timeSpent: 90,
        currentContentId: contentId,
        lastAccessedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        status: 'completed',
        completedAt: expect.any(Date),
      });
    });

    it('should handle progress update failure when enrollment not found', async () => {
      const enrollmentId = 'nonexistent_enrollment';
      const contentId = 'content_001';
      const progress = 50;
      const timeSpent = 30;

      mockEnrollmentRepository.findOne.mockResolvedValue(null);

      const result = await service.updateProgress(enrollmentId, contentId, progress, timeSpent);

      expect(result).toBe(false);
    });

    it('should handle progress update failure during processing', async () => {
      const enrollmentId = 'enrollment_001';
      const contentId = 'content_001';
      const progress = 50;
      const timeSpent = 30;

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'enrolled',
        progress: 0,
        timeSpent: 0,
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);
      mockEnrollmentRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await service.updateProgress(enrollmentId, contentId, progress, timeSpent);

      expect(result).toBe(false);
    });
  });

  describe('submitAssessment', () => {
    it('should submit assessment successfully with passing score', async () => {
      const enrollmentId = 'enrollment_001';
      const assessmentId = 'assessment_001';
      const answers = { q1: 'Wash hands' };
      const timeSpent = 15;

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'in_progress',
        score: 0,
        attempts: 0,
      };

      const course = {
        id: 'course_001',
        title: 'Basic Care Skills',
        assessments: [
          {
            id: 'assessment_001',
            title: 'Care Skills Quiz',
            passingScore: 80,
            questions: [
              {
                id: 'q1',
                type: 'multiple_choice',
                question: 'What is the first step in providing care?',
                options: ['Wash hands', 'Check vital signs', 'Introduce yourself'],
                correctAnswer: 'Wash hands',
                points: 10,
                order: 1,
              },
            ],
          },
        ],
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);
      mockCourseRepository.findOne.mockResolvedValue(course);

      const result = await service.submitAssessment(enrollmentId, assessmentId, answers, timeSpent);

      expect(result).toEqual({
        score: 100,
        passed: true,
        feedback: 'Congratulations! You passed the assessment.',
      });

      expect(mockEnrollmentRepository.update).toHaveBeenCalledWith(enrollmentId, {
        score: 100,
        attempts: 1,
        updatedAt: expect.any(Date),
        status: 'completed',
        completedAt: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.assessment.submitted', {
        enrollmentId,
        assessmentId,
        score: 100,
        passed: true,
        timestamp: expect.any(Date),
      });
    });

    it('should submit assessment with failing score', async () => {
      const enrollmentId = 'enrollment_001';
      const assessmentId = 'assessment_001';
      const answers = { q1: 'Check vital signs' }; // Wrong answer
      const timeSpent = 15;

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'in_progress',
        score: 0,
        attempts: 0,
      };

      const course = {
        id: 'course_001',
        title: 'Basic Care Skills',
        assessments: [
          {
            id: 'assessment_001',
            title: 'Care Skills Quiz',
            passingScore: 80,
            questions: [
              {
                id: 'q1',
                type: 'multiple_choice',
                question: 'What is the first step in providing care?',
                options: ['Wash hands', 'Check vital signs', 'Introduce yourself'],
                correctAnswer: 'Wash hands',
                points: 10,
                order: 1,
              },
            ],
          },
        ],
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);
      mockCourseRepository.findOne.mockResolvedValue(course);

      const result = await service.submitAssessment(enrollmentId, assessmentId, answers, timeSpent);

      expect(result).toEqual({
        score: 0,
        passed: false,
        feedback: 'Please review the material and try again.',
      });

      expect(mockEnrollmentRepository.update).toHaveBeenCalledWith(enrollmentId, {
        score: 0,
        attempts: 1,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle assessment submission failure when enrollment not found', async () => {
      const enrollmentId = 'nonexistent_enrollment';
      const assessmentId = 'assessment_001';
      const answers = { q1: 'Wash hands' };
      const timeSpent = 15;

      mockEnrollmentRepository.findOne.mockResolvedValue(null);

      await expect(service.submitAssessment(enrollmentId, assessmentId, answers, timeSpent)).rejects.toThrow('Enrollment not found');
    });

    it('should handle assessment submission failure when course not found', async () => {
      const enrollmentId = 'enrollment_001';
      const assessmentId = 'assessment_001';
      const answers = { q1: 'Wash hands' };
      const timeSpent = 15;

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'in_progress',
        score: 0,
        attempts: 0,
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.submitAssessment(enrollmentId, assessmentId, answers, timeSpent)).rejects.toThrow('Course not found');
    });

    it('should handle assessment submission failure when assessment not found', async () => {
      const enrollmentId = 'enrollment_001';
      const assessmentId = 'nonexistent_assessment';
      const answers = { q1: 'Wash hands' };
      const timeSpent = 15;

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'in_progress',
        score: 0,
        attempts: 0,
      };

      const course = {
        id: 'course_001',
        title: 'Basic Care Skills',
        assessments: [],
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);
      mockCourseRepository.findOne.mockResolvedValue(course);

      await expect(service.submitAssessment(enrollmentId, assessmentId, answers, timeSpent)).rejects.toThrow('Assessment not found');
    });
  });

  describe('generateCertificate', () => {
    it('should generate certificate successfully', async () => {
      const enrollmentId = 'enrollment_001';

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'completed',
        completedAt: new Date(),
      };

      const course = {
        id: 'course_001',
        title: 'Basic Care Skills',
        credits: 2,
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);
      mockCourseRepository.findOne.mockResolvedValue(course);

      const result = await service.generateCertificate(enrollmentId);

      expect(result).toEqual({
        id: expect.any(String),
        courseId: enrollment.courseId,
        userId: enrollment.userId,
        certificateNumber: expect.stringMatching(/^CERT-\d+-[A-Z0-9]+$/),
        issuedAt: expect.any(Date),
        expiresAt: expect.any(Date),
        isActive: true,
        verificationCode: expect.stringMatching(/^[A-Z0-9]+$/),
        pdfPath: `/certificates/${enrollmentId}.pdf`,
        metadata: {
          courseTitle: course.title,
          completionDate: enrollment.completedAt,
          score: undefined,
          credits: course.credits,
        },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockCertificateRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        courseId: enrollment.courseId,
        userId: enrollment.userId,
        certificateNumber: expect.stringMatching(/^CERT-\d+-[A-Z0-9]+$/),
        issuedAt: expect.any(Date),
        isActive: true,
        verificationCode: expect.stringMatching(/^[A-Z0-9]+$/),
        pdfPath: `/certificates/${enrollmentId}.pdf`,
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.certificate.generated', {
        certificateId: expect.any(String),
        courseId: enrollment.courseId,
        userId: enrollment.userId,
        certificateNumber: expect.stringMatching(/^CERT-\d+-[A-Z0-9]+$/),
        timestamp: expect.any(Date),
      });
    });

    it('should handle certificate generation failure when enrollment not found', async () => {
      const enrollmentId = 'nonexistent_enrollment';

      mockEnrollmentRepository.findOne.mockResolvedValue(null);

      await expect(service.generateCertificate(enrollmentId)).rejects.toThrow('Enrollment not found');
    });

    it('should handle certificate generation failure when course not completed', async () => {
      const enrollmentId = 'enrollment_001';

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'in_progress',
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);

      await expect(service.generateCertificate(enrollmentId)).rejects.toThrow('Course must be completed to generate certificate');
    });

    it('should handle certificate generation failure when course not found', async () => {
      const enrollmentId = 'enrollment_001';

      const enrollment = {
        id: enrollmentId,
        courseId: 'course_001',
        userId: 'user_001',
        status: 'completed',
        completedAt: new Date(),
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(enrollment);
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.generateCertificate(enrollmentId)).rejects.toThrow('Course not found');
    });
  });

  describe('getTrainingProgress', () => {
    it('should get training progress successfully', async () => {
      const userId = 'user_001';
      const courseId = 'course_001';

      const enrollments = [
        {
          id: 'enrollment_001',
          courseId: 'course_001',
          userId: 'user_001',
          progress: 75,
          timeSpent: 90,
          lastAccessedAt: new Date(),
          completedAt: null,
        },
      ];

      const course = {
        id: 'course_001',
        title: 'Basic Care Skills',
        content: [
          {
            id: 'content_001',
            title: 'Introduction to Care',
          },
        ],
        assessments: [
          {
            id: 'assessment_001',
            title: 'Care Skills Quiz',
          },
        ],
      };

      mockEnrollmentRepository.find.mockResolvedValue(enrollments);
      mockCourseRepository.findOne.mockResolvedValue(course);
      mockCertificateRepository.find.mockResolvedValue([]);

      const result = await service.getTrainingProgress(userId, courseId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 'user_001',
        courseId: 'course_001',
        overallProgress: 75,
        contentProgress: expect.any(Array),
        assessmentScores: expect.any(Array),
        timeSpent: 90,
        lastAccessedAt: expect.any(Date),
        completionDate: null,
        certificates: [],
      });

      expect(mockEnrollmentRepository.find).toHaveBeenCalledWith({
        where: { userId, courseId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should get all training progress when no course ID provided', async () => {
      const userId = 'user_001';

      const enrollments = [
        {
          id: 'enrollment_001',
          courseId: 'course_001',
          userId: 'user_001',
          progress: 75,
          timeSpent: 90,
          lastAccessedAt: new Date(),
          completedAt: null,
        },
        {
          id: 'enrollment_002',
          courseId: 'course_002',
          userId: 'user_001',
          progress: 100,
          timeSpent: 120,
          lastAccessedAt: new Date(),
          completedAt: new Date(),
        },
      ];

      const course1 = {
        id: 'course_001',
        title: 'Basic Care Skills',
        content: [],
        assessments: [],
      };

      const course2 = {
        id: 'course_002',
        title: 'Advanced Care Skills',
        content: [],
        assessments: [],
      };

      mockEnrollmentRepository.find.mockResolvedValue(enrollments);
      mockCourseRepository.findOne
        .mockResolvedValueOnce(course1)
        .mockResolvedValueOnce(course2);
      mockCertificateRepository.find.mockResolvedValue([]);

      const result = await service.getTrainingProgress(userId);

      expect(result).toHaveLength(2);
      expect(mockEnrollmentRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle get training progress failure', async () => {
      const userId = 'user_001';

      mockEnrollmentRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getTrainingProgress(userId)).rejects.toThrow('Failed to get training progress');
    });
  });

  describe('getCourseAnalytics', () => {
    it('should get course analytics successfully', async () => {
      const courseId = 'course_001';

      const enrollments = [
        {
          id: 'enrollment_001',
          courseId: 'course_001',
          status: 'completed',
          score: 85,
          timeSpent: 120,
          currentContentId: 'content_001',
        },
        {
          id: 'enrollment_002',
          courseId: 'course_001',
          status: 'completed',
          score: 90,
          timeSpent: 100,
          currentContentId: 'content_002',
        },
        {
          id: 'enrollment_003',
          courseId: 'course_001',
          status: 'in_progress',
          score: 0,
          timeSpent: 50,
          currentContentId: 'content_001',
        },
      ];

      const course = {
        id: 'course_001',
        title: 'Basic Care Skills',
        content: [
          {
            id: 'content_001',
            title: 'Introduction to Care',
          },
          {
            id: 'content_002',
            title: 'Safety Protocols',
          },
        ],
      };

      mockEnrollmentRepository.find.mockResolvedValue(enrollments);
      mockCourseRepository.findOne.mockResolvedValue(course);

      const result = await service.getCourseAnalytics(courseId);

      expect(result).toEqual({
        courseId,
        totalEnrollments: 3,
        completions: 2,
        averageScore: 87.5,
        averageTimeToComplete: 110,
        completionRate: 66.67,
        dropOffPoints: expect.any(Array),
        feedback: [],
        lastUpdated: expect.any(Date),
      });

      expect(mockEnrollmentRepository.find).toHaveBeenCalledWith({ where: { courseId } });
    });

    it('should handle course analytics failure when course not found', async () => {
      const courseId = 'nonexistent_course';

      mockEnrollmentRepository.find.mockResolvedValue([]);
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.getCourseAnalytics(courseId)).rejects.toThrow('Course not found');
    });

    it('should handle course analytics failure during processing', async () => {
      const courseId = 'course_001';

      mockEnrollmentRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getCourseAnalytics(courseId)).rejects.toThrow('Failed to get course analytics');
    });
  });

  describe('getAllCourses', () => {
    it('should get all courses successfully', async () => {
      const mockCourses = [
        {
          id: 'course_001',
          title: 'Basic Care Skills',
          category: 'care_skills',
          level: 'beginner',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'course_002',
          title: 'Advanced Care Skills',
          category: 'care_skills',
          level: 'advanced',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCourseRepository.find.mockResolvedValue(mockCourses);

      const result = await service.getAllCourses();

      expect(result).toEqual(mockCourses);
      expect(mockCourseRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.courses.accessed', {
        count: mockCourses.length,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get all courses failure', async () => {
      mockCourseRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllCourses()).rejects.toThrow('Failed to get courses');
    });
  });

  describe('getCourseById', () => {
    it('should get course by ID successfully', async () => {
      const courseId = 'course_001';
      const mockCourse = {
        id: courseId,
        title: 'Basic Care Skills',
        category: 'care_skills',
        level: 'beginner',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCourseRepository.findOne.mockResolvedValue(mockCourse);

      const result = await service.getCourseById(courseId);

      expect(result).toEqual(mockCourse);
      expect(mockCourseRepository.findOne).toHaveBeenCalledWith({ where: { id: courseId } });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.course.accessed', {
        courseId,
        courseTitle: mockCourse.title,
        category: mockCourse.category,
        level: mockCourse.level,
        timestamp: expect.any(Date),
      });
    });

    it('should return null for non-existent course', async () => {
      const courseId = 'nonexistent_course';

      mockCourseRepository.findOne.mockResolvedValue(null);

      const result = await service.getCourseById(courseId);

      expect(result).toBeNull();
    });

    it('should handle get course by ID failure', async () => {
      const courseId = 'course_001';

      mockCourseRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.getCourseById(courseId)).rejects.toThrow('Failed to get course');
    });
  });

  describe('getAcademyTrainingStatistics', () => {
    it('should get academy training statistics successfully', async () => {
      mockCourseRepository.count
        .mockResolvedValueOnce(10) // totalCourses
        .mockResolvedValueOnce(8);  // activeCourses

      mockEnrollmentRepository.count
        .mockResolvedValueOnce(50)  // totalEnrollments
        .mockResolvedValueOnce(30)  // completedEnrollments
        .mockResolvedValueOnce(15)  // inProgress
        .mockResolvedValueOnce(5);  // failed

      mockSessionRepository.count
        .mockResolvedValueOnce(25)  // totalSessions
        .mockResolvedValueOnce(10)  // scheduled
        .mockResolvedValueOnce(15); // completed

      mockCertificateRepository.count
        .mockResolvedValueOnce(20)  // totalCertificates
        .mockResolvedValueOnce(18)  // active
        .mockResolvedValueOnce(2);  // expired

      const result = await service.getAcademyTrainingStatistics();

      expect(result).toEqual({
        courses: {
          total: 10,
          active: 8,
          inactive: 2,
        },
        enrollments: {
          total: 50,
          completed: 30,
          inProgress: 15,
          failed: 5,
          completionRate: 60,
        },
        sessions: {
          total: 25,
          scheduled: 10,
          completed: 15,
        },
        certificates: {
          total: 20,
          active: 18,
          expired: 2,
        },
        lastUpdated: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('academy.statistics.accessed', {
        totalCourses: 10,
        activeCourses: 8,
        totalEnrollments: 50,
        completedEnrollments: 30,
        totalSessions: 25,
        totalCertificates: 20,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get academy training statistics failure', async () => {
      mockCourseRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getAcademyTrainingStatistics()).rejects.toThrow('Failed to get academy training statistics');
    });
  });
});