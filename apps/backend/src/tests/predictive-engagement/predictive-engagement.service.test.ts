import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PredictiveEngagementService } from '../../services/predictive-engagement.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

describe('PredictiveEngagementService', () => {
  let service: PredictiveEngagementService;
  let mockRepository: jest.Mocked<Repository<any>>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockAuditService: jest.Mocked<AuditTrailService>;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
        getCount: jest.fn(),
      })),
    };

    const mockEventEmitterInstance = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    };

    const mockAuditServiceInstance = {
      logEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictiveEngagementService,
        {
          provide: getRepositoryToken('EngagementPrediction'),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken('EngagementModel'),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken('EngagementEvent'),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken('EngagementInsight'),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken('EngagementCampaign'),
          useValue: mockRepo,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitterInstance,
        },
        {
          provide: AuditService,
          useValue: mockAuditServiceInstance,
        },
      ],
    }).compile();

    service = module.get<PredictiveEngagementService>(PredictiveEngagementService);
    mockRepository = module.get(getRepositoryToken('EngagementPrediction'));
    mockEventEmitter = module.get(EventEmitter2);
    mockAuditService = module.get(AuditTrailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePrediction', () => {
    it('should generate a prediction successfully', async () => {
      const residentId = 'resident-123';
      const predictionType = 'social_engagement';
      const timeframe = 'short_term';

      const mockPrediction = {
        id: 'prediction-123',
        residentId,
        predictionType,
        timeframe,
        predictedValue: 0.85,
        confidence: 0.92,
        features: ['social_interactions', 'activity_participation'],
        modelId: 'model-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockPrediction);
      mockRepository.save.mockResolvedValue(mockPrediction);

      const result = await service.generatePrediction(residentId, predictionType, timeframe);

      expect(result).toEqual(mockPrediction);
      expect(mockRepository.create).toHaveBeenCalledWith({
        residentId,
        predictionType,
        timeframe,
        predictedValue: expect.any(Number),
        confidence: expect.any(Number),
        features: expect.any(Array),
        modelId: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockPrediction);
    });

    it('should handle errors when generating prediction', async () => {
      const residentId = 'resident-123';
      const predictionType = 'social_engagement';
      const timeframe = 'short_term';

      mockRepository.create.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.generatePrediction(residentId, predictionType, timeframe)).rejects.toThrow('Database error');
    });
  });

  describe('getPredictions', () => {
    it('should get predictions for a resident', async () => {
      const residentId = 'resident-123';
      const status = 'active';

      const mockPredictions = [
        {
          id: 'prediction-1',
          residentId,
          predictionType: 'social_engagement',
          predictedValue: 0.85,
          confidence: 0.92,
          status: 'active',
        },
        {
          id: 'prediction-2',
          residentId,
          predictionType: 'activity_participation',
          predictedValue: 0.78,
          confidence: 0.88,
          status: 'active',
        },
      ];

      mockRepository.find.mockResolvedValue(mockPredictions);

      const result = await service.getPredictions(residentId, status);

      expect(result).toEqual(mockPredictions);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { residentId, status },
        orderBy: { createdAt: 'DESC' },
      });
    });

    it('should get all predictions when no status filter', async () => {
      const residentId = 'resident-123';

      const mockPredictions = [
        {
          id: 'prediction-1',
          residentId,
          predictionType: 'social_engagement',
          predictedValue: 0.85,
          confidence: 0.92,
          status: 'active',
        },
      ];

      mockRepository.find.mockResolvedValue(mockPredictions);

      const result = await service.getPredictions(residentId);

      expect(result).toEqual(mockPredictions);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { residentId },
        orderBy: { createdAt: 'DESC' },
      });
    });
  });

  describe('createModel', () => {
    it('should create a model successfully', async () => {
      const modelData = {
        name: 'Social Engagement Model',
        description: 'Predicts social engagement levels',
        predictionType: 'social_engagement',
        algorithm: 'random_forest' as const,
        features: ['social_interactions', 'activity_participation'],
        parameters: { n_estimators: 100, max_depth: 10 },
        accuracy: 0.92,
        version: '1.0.0',
        isActive: true,
        lastTrained: new Date(),
        performance: {
          accuracy: 0.92,
          precision: 0.85,
          recall: 0.80,
          f1Score: 0.82,
          auc: 0.88,
          mse: 0.15,
          mae: 0.12,
          r2Score: 0.75,
          lastEvaluated: new Date(),
        },
      };

      const mockModel = {
        id: 'model-123',
        ...modelData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockModel);
      mockRepository.save.mockResolvedValue(mockModel);

      const result = await service.createModel(modelData);

      expect(result).toEqual(mockModel);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...modelData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('recordEvent', () => {
    it('should record an event successfully', async () => {
      const eventData = {
        residentId: 'resident-123',
        eventType: 'activity_completed' as const,
        eventData: { activityId: 'activity-123', duration: 30 },
        source: 'manual' as const,
        confidence: 0.95,
        timestamp: new Date(),
        processed: false,
      };

      const mockEvent = {
        id: 'event-123',
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.recordEvent(eventData);

      expect(result).toEqual(mockEvent);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...eventData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights for a resident', async () => {
      const residentId = 'resident-123';

      const mockInsights = [
        {
          id: 'insight-1',
          residentId,
          insightType: 'pattern',
          title: 'Daily Activity Pattern',
          description: 'Resident shows consistent daily activity patterns',
          confidence: 0.88,
          impact: 'high',
          actionable: true,
          recommendations: ['Maintain current schedule', 'Consider adding evening activities'],
        },
        {
          id: 'insight-2',
          residentId,
          insightType: 'trend',
          title: 'Improving Social Engagement',
          description: 'Social engagement has been steadily improving over the past month',
          confidence: 0.92,
          impact: 'medium',
          actionable: false,
          recommendations: [],
        },
      ];

      mockRepository.create.mockReturnValue(mockInsights[0]);
      mockRepository.save.mockResolvedValue(mockInsights[0]);

      const result = await service.generateInsights(residentId);

      expect(result).toEqual(mockInsights);
      expect(mockRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getInsights', () => {
    it('should get insights for a resident', async () => {
      const residentId = 'resident-123';
      const insightType = 'pattern';

      const mockInsights = [
        {
          id: 'insight-1',
          residentId,
          insightType: 'pattern',
          title: 'Daily Activity Pattern',
          description: 'Resident shows consistent daily activity patterns',
          confidence: 0.88,
          impact: 'high',
          actionable: true,
        },
      ];

      mockRepository.find.mockResolvedValue(mockInsights);

      const result = await service.getInsights(residentId, insightType);

      expect(result).toEqual(mockInsights);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { residentId, insightType },
        orderBy: { createdAt: 'DESC' },
      });
    });
  });

  describe('createCampaign', () => {
    it('should create a campaign successfully', async () => {
      const campaignData = {
        name: 'Social Engagement Campaign',
        description: 'Increase social interaction among residents',
        targetResidents: ['resident-1', 'resident-2'],
        campaignType: 'social' as const,
        objectives: ['Increase social connections', 'Reduce isolation'],
        strategies: [
          {
            name: 'Group Activities',
            type: 'activity' as const,
            description: 'Organize group activities',
            targetAudience: ['all'],
            implementation: 'Weekly group sessions',
            resources: ['activity room', 'staff'],
            timeline: '4 weeks',
            successCriteria: ['Attendance > 80%', 'Satisfaction > 4.0'],
            expectedOutcome: 'Increased social interaction',
          },
        ],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'planned' as const,
      };

      const mockCampaign = {
        id: 'campaign-123',
        ...campaignData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockCampaign);
      mockRepository.save.mockResolvedValue(mockCampaign);

      const result = await service.createCampaign(campaignData);

      expect(result).toEqual(mockCampaign);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...campaignData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockCampaign);
    });
  });

  describe('getCampaigns', () => {
    it('should get campaigns with status filter', async () => {
      const status = 'active';

      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Social Engagement Campaign',
          status: 'active',
          campaignType: 'social',
        },
      ];

      mockRepository.find.mockResolvedValue(mockCampaigns);

      const result = await service.getCampaigns(status);

      expect(result).toEqual(mockCampaigns);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status },
        orderBy: { createdAt: 'DESC' },
      });
    });

    it('should get all campaigns when no status filter', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Social Engagement Campaign',
          status: 'active',
          campaignType: 'social',
        },
      ];

      mockRepository.find.mockResolvedValue(mockCampaigns);

      const result = await service.getCampaigns();

      expect(result).toEqual(mockCampaigns);
      expect(mockRepository.find).toHaveBeenCalledWith({
        orderBy: { createdAt: 'DESC' },
      });
    });
  });

  describe('getEngagementAnalytics', () => {
    it('should get engagement analytics for a resident', async () => {
      const residentId = 'resident-123';
      const period = 'monthly';

      const mockAnalytics = {
        residentId,
        period,
        engagementScore: 0.85,
        trends: {
          social: { current: 0.80, previous: 0.75, change: 0.05 },
          activity: { current: 0.90, previous: 0.85, change: 0.05 },
          health: { current: 0.88, previous: 0.82, change: 0.06 },
        },
        predictions: {
          nextWeek: 0.87,
          nextMonth: 0.89,
          nextQuarter: 0.91,
        },
        insights: [
          {
            type: 'pattern',
            title: 'Consistent Engagement',
            description: 'Resident shows consistent engagement patterns',
            confidence: 0.92,
          },
        ],
        recommendations: [
          {
            type: 'activity',
            title: 'Increase Social Activities',
            description: 'Add more social activities to the schedule',
            priority: 'high',
            expectedImpact: 0.15,
          },
        ],
        generatedAt: new Date(),
      };

      const result = await service.getEngagementAnalytics(residentId, period);

      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getPredictiveEngagementStatistics', () => {
    it('should get predictive engagement statistics', async () => {
      const mockStatistics = {
        predictions: {
          total: 150,
          active: 120,
          completed: 25,
          expired: 5,
          averageConfidence: 0.87,
          accuracyRate: 0.82,
        },
        models: {
          total: 8,
          active: 6,
          inactive: 2,
          averageAccuracy: 0.85,
          lastTrained: new Date(),
        },
        events: {
          total: 1250,
          processed: 1200,
          pending: 50,
          averageProcessingTime: 2.5,
        },
        insights: {
          total: 340,
          actionable: 280,
          implemented: 200,
          successRate: 0.85,
        },
        campaigns: {
          total: 15,
          active: 8,
          completed: 5,
          planned: 2,
          averageEffectiveness: 0.78,
        },
        generatedAt: new Date(),
      };

      const result = await service.getPredictiveEngagementStatistics();

      expect(result).toEqual(mockStatistics);
    });
  });

  describe('getEngagementModels', () => {
    it('should get engagement models', async () => {
      const mockModels = [
        {
          id: 'model-1',
          name: 'Social Engagement Model',
          algorithm: 'random_forest',
          accuracy: 0.92,
          isActive: true,
        },
        {
          id: 'model-2',
          name: 'Activity Participation Model',
          algorithm: 'neural_network',
          accuracy: 0.88,
          isActive: true,
        },
      ];

      mockRepository.find.mockResolvedValue(mockModels);

      const result = await service.getEngagementModels();

      expect(result).toEqual(mockModels);
      expect(mockRepository.find).toHaveBeenCalledWith({
        orderBy: { createdAt: 'DESC' },
      });
    });
  });

  describe('getEngagementEvents', () => {
    it('should get engagement events with filters', async () => {
      const residentId = 'resident-123';
      const eventType = 'activity_completed';
      const limit = 10;

      const mockEvents = [
        {
          id: 'event-1',
          residentId,
          eventType,
          eventData: { activityId: 'activity-123' },
          source: 'manual',
          confidence: 0.95,
        },
      ];

      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.getEngagementEvents(residentId, eventType, limit);

      expect(result).toEqual(mockEvents);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { residentId, eventType },
        orderBy: { timestamp: 'DESC' },
        take: limit,
      });
    });
  });

  describe('updatePredictionModel', () => {
    it('should update a prediction model', async () => {
      const modelId = 'model-123';
      const updateData = {
        accuracy: 0.95,
        performance: {
          accuracy: 0.95,
          precision: 0.90,
          recall: 0.88,
          f1Score: 0.89,
          auc: 0.92,
          mse: 0.10,
          mae: 0.08,
          r2Score: 0.80,
          lastEvaluated: new Date(),
        },
      };

      const mockModel = {
        id: modelId,
        name: 'Updated Model',
        accuracy: 0.95,
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockModel);
      mockRepository.save.mockResolvedValue(mockModel);

      const result = await service.updatePredictionModel(modelId, updateData);

      expect(result).toEqual(mockModel);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: modelId } });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockModel,
        ...updateData,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle model not found', async () => {
      const modelId = 'nonexistent-model';
      const updateData = { accuracy: 0.95 };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePredictionModel(modelId, updateData)).rejects.toThrow('Model not found');
    });
  });

  describe('deletePrediction', () => {
    it('should delete a prediction', async () => {
      const predictionId = 'prediction-123';

      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deletePrediction(predictionId);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(predictionId);
    });

    it('should handle prediction not found', async () => {
      const predictionId = 'nonexistent-prediction';

      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.deletePrediction(predictionId);

      expect(result).toBe(false);
    });
  });

  describe('deleteInsight', () => {
    it('should delete an insight', async () => {
      const insightId = 'insight-123';

      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteInsight(insightId);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(insightId);
    });

    it('should handle insight not found', async () => {
      const insightId = 'nonexistent-insight';

      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.deleteInsight(insightId);

      expect(result).toBe(false);
    });
  });

  describe('deleteCampaign', () => {
    it('should delete a campaign', async () => {
      const campaignId = 'campaign-123';

      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteCampaign(campaignId);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(campaignId);
    });

    it('should handle campaign not found', async () => {
      const campaignId = 'nonexistent-campaign';

      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.deleteCampaign(campaignId);

      expect(result).toBe(false);
    });
  });
});
