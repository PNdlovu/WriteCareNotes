import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VirtualRealityTrainingService, VRTrainingCategory } from '../../services/vr-training.service';

describe('VirtualRealityTrainingService', () => {
  let service: VirtualRealityTrainingService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VirtualRealityTrainingService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VirtualRealityTrainingService>(VirtualRealityTrainingService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startVRTrainingSession', () => {
    it('should start a VR training session successfully', async () => {
      const staffMemberId = 'staff_001';
      const scenarioId = 'emergency_fire_response';
      const instructorId = 'instructor_001';

      const session = await service.startVRTrainingSession(staffMemberId, scenarioId, instructorId);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.staffMemberId).toBe(staffMemberId);
      expect(session.scenarioId).toBe(scenarioId);
      expect(session.status).toBe('in_progress');
      expect(session.startTime).toBeDefined();
      expect(session.performanceMetrics).toBeDefined();
      expect(session.assessmentResults).toBeDefined();
      expect(session.feedback).toBeDefined();
      expect(session.technicalIssues).toBeDefined();
    });

    it('should throw error for non-existent scenario', async () => {
      const staffMemberId = 'staff_001';
      const scenarioId = 'non_existent_scenario';

      await expect(
        service.startVRTrainingSession(staffMemberId, scenarioId)
      ).rejects.toThrow('VR scenario non_existent_scenario not found');
    });
  });

  describe('processTrainingData', () => {
    it('should process training data successfully', async () => {
      const sessionId = 'test_session_001';
      const trainingData = {
        reactionTime: 1200,
        accuracyScore: 85,
        error: {
          type: 'incorrect_action',
          description: 'Wrong evacuation route chosen',
          correctAction: 'Use primary evacuation route',
          impact: 'medium',
        },
        triggers: ['evacuation_route_chosen'],
        requiresIntervention: false,
      };

      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        staffMemberId: 'staff_001',
        scenarioId: 'emergency_fire_response',
        startTime: new Date(),
        status: 'in_progress',
        performanceMetrics: {
          reactionTimes: [],
          accuracyScores: [],
          decisionQuality: 0,
          stressLevel: 0,
          confidenceLevel: 0,
          completionTime: 0,
          errorsCommitted: [],
          correctActions: [],
          hesitationPoints: [],
        },
        assessmentResults: [],
        feedback: {
          overallScore: 0,
          passed: false,
          strengths: [],
          improvementAreas: [],
          recommendedActions: [],
          nextSteps: [],
        },
        technicalIssues: [],
      });

      await service.processTrainingData(sessionId, trainingData);

      // Verify session was updated
      const updatedSession = (service as any).activeSessions.get(sessionId);
      expect(updatedSession.performanceMetrics.reactionTimes).toContain(1200);
      expect(updatedSession.performanceMetrics.accuracyScores).toContain(85);
      expect(updatedSession.performanceMetrics.errorsCommitted).toHaveLength(1);
    });

    it('should handle non-existent session gracefully', async () => {
      const sessionId = 'non_existent_session';
      const trainingData = { reactionTime: 1200 };

      // Should not throw error
      await expect(service.processTrainingData(sessionId, trainingData)).resolves.not.toThrow();
    });
  });

  describe('completeVRTrainingSession', () => {
    it('should complete a VR training session successfully', async () => {
      const sessionId = 'test_session_001';
      
      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        staffMemberId: 'staff_001',
        scenarioId: 'emergency_fire_response',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        status: 'in_progress',
        performanceMetrics: {
          reactionTimes: [1200, 1100, 1300],
          accuracyScores: [85, 90, 88],
          decisionQuality: 8.5,
          stressLevel: 6.0,
          confidenceLevel: 7.5,
          completionTime: 0,
          errorsCommitted: [],
          correctActions: ['activated_alarm', 'assisted_residents'],
          hesitationPoints: [],
        },
        assessmentResults: [],
        feedback: {
          overallScore: 0,
          passed: false,
          strengths: [],
          improvementAreas: [],
          recommendedActions: [],
          nextSteps: [],
        },
        technicalIssues: [],
      });

      const completedSession = await service.completeVRTrainingSession(sessionId);

      expect(completedSession).toBeDefined();
      expect(completedSession.endTime).toBeDefined();
      expect(completedSession.status).toBe('completed');
      expect(completedSession.performanceMetrics.completionTime).toBeGreaterThan(0);
      expect(completedSession.assessmentResults).toBeDefined();
      expect(completedSession.feedback).toBeDefined();
    });

    it('should throw error for non-existent session', async () => {
      const sessionId = 'non_existent_session';

      await expect(
        service.completeVRTrainingSession(sessionId)
      ).rejects.toThrow('VR training session non_existent_session not found');
    });
  });

  describe('createCustomScenario', () => {
    it('should create a custom scenario successfully', async () => {
      const scenarioData = {
        title: 'Custom Emergency Response',
        description: 'A custom emergency response scenario',
        category: VRTrainingCategory.EMERGENCY_RESPONSE,
        difficulty: 'intermediate' as const,
        duration: 45,
        learningObjectives: ['Test emergency procedures', 'Practice communication'],
        competenciesAssessed: ['emergency_response', 'communication'],
        immersionLevel: 'high' as const,
        interactivity: 'interactive' as const,
        hardwareRequirements: {
          headsetType: 'advanced_vr' as const,
          controllers: 'haptic_feedback' as const,
          roomScale: true,
          minPlayArea: { width: 3, height: 3 },
          computingPower: 'pc_tethered' as const,
          additionalHardware: ['smoke_simulation'],
        },
        scenarioElements: [],
        assessmentCriteria: [],
        prerequisites: [],
        supportedLanguages: ['en-GB'],
      };

      const scenario = await service.createCustomScenario(scenarioData);

      expect(scenario).toBeDefined();
      expect(scenario.id).toBeDefined();
      expect(scenario.title).toBe(scenarioData.title);
      expect(scenario.description).toBe(scenarioData.description);
      expect(scenario.category).toBe(scenarioData.category);
      expect(scenario.difficulty).toBe(scenarioData.difficulty);
      expect(scenario.duration).toBe(scenarioData.duration);
    });

    it('should use default values for missing fields', async () => {
      const scenarioData = {
        title: 'Minimal Scenario',
      };

      const scenario = await service.createCustomScenario(scenarioData);

      expect(scenario.title).toBe('Minimal Scenario');
      expect(scenario.description).toBe('');
      expect(scenario.category).toBe(VRTrainingCategory.COMMUNICATION_SKILLS);
      expect(scenario.difficulty).toBe('beginner');
      expect(scenario.duration).toBe(30);
      expect(scenario.learningObjectives).toEqual([]);
      expect(scenario.competenciesAssessed).toEqual([]);
    });
  });

  describe('getVRTrainingAnalytics', () => {
    it('should return analytics for week timeframe', async () => {
      const analytics = await service.getVRTrainingAnalytics('week');

      expect(analytics).toBeDefined();
      expect(analytics.totalSessions).toBeDefined();
      expect(analytics.uniqueTrainees).toBeDefined();
      expect(analytics.averageCompletionRate).toBeDefined();
      expect(analytics.averageScore).toBeDefined();
      expect(analytics.scenarioPopularity).toBeDefined();
      expect(analytics.competencyImprovement).toBeDefined();
      expect(analytics.technicalIssues).toBeDefined();
      expect(analytics.trainingEffectiveness).toBeDefined();
      expect(analytics.recommendedImprovements).toBeDefined();
    });

    it('should return analytics for month timeframe', async () => {
      const analytics = await service.getVRTrainingAnalytics('month');

      expect(analytics).toBeDefined();
      expect(analytics.totalSessions).toBeDefined();
    });

    it('should return analytics for quarter timeframe', async () => {
      const analytics = await service.getVRTrainingAnalytics('quarter');

      expect(analytics).toBeDefined();
      expect(analytics.totalSessions).toBeDefined();
    });
  });

  describe('manageVRHardware', () => {
    it('should return hardware status', async () => {
      const hardwareStatus = await service.manageVRHardware();

      expect(hardwareStatus).toBeDefined();
      expect(hardwareStatus.totalHeadsets).toBeDefined();
      expect(hardwareStatus.availableHeadsets).toBeDefined();
      expect(hardwareStatus.inUseHeadsets).toBeDefined();
      expect(hardwareStatus.maintenanceHeadsets).toBeDefined();
      expect(hardwareStatus.hardwareHealth).toBeDefined();
      expect(hardwareStatus.utilizationRate).toBeDefined();
      expect(hardwareStatus.maintenanceSchedule).toBeDefined();
      expect(hardwareStatus.upgrades).toBeDefined();
    });
  });

  describe('event emission', () => {
    it('should emit session started event', async () => {
      const staffMemberId = 'staff_001';
      const scenarioId = 'emergency_fire_response';

      await service.startVRTrainingSession(staffMemberId, scenarioId);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'vr_training.session_started',
        expect.objectContaining({
          session: expect.any(Object),
          scenario: expect.any(Object),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit session completed event', async () => {
      const sessionId = 'test_session_001';
      
      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        staffMemberId: 'staff_001',
        scenarioId: 'emergency_fire_response',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        status: 'in_progress',
        performanceMetrics: {
          reactionTimes: [1200, 1100, 1300],
          accuracyScores: [85, 90, 88],
          decisionQuality: 8.5,
          stressLevel: 6.0,
          confidenceLevel: 7.5,
          completionTime: 0,
          errorsCommitted: [],
          correctActions: ['activated_alarm', 'assisted_residents'],
          hesitationPoints: [],
        },
        assessmentResults: [],
        feedback: {
          overallScore: 0,
          passed: false,
          strengths: [],
          improvementAreas: [],
          recommendedActions: [],
          nextSteps: [],
        },
        technicalIssues: [],
      });

      await service.completeVRTrainingSession(sessionId);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'vr_training.session_completed',
        expect.objectContaining({
          session: expect.any(Object),
          passed: expect.any(Boolean),
          overallScore: expect.any(Number),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit scenario created event', async () => {
      const scenarioData = {
        title: 'Test Scenario',
        description: 'A test scenario',
      };

      await service.createCustomScenario(scenarioData);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'vr_training.scenario_created',
        expect.any(Object)
      );
    });
  });
});