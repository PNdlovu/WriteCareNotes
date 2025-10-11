import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GardenTherapyService, GardenTherapyType } from '../../services/garden-therapy.service';
import { GardenAreaEntity } from '../../entities/garden-area.entity';

describe('GardenTherapyService', () => {
  let service: GardenTherapyService;
  let gardenRepository: any;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GardenTherapyService,
        {
          provide: getRepositoryToken(GardenAreaEntity),
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GardenTherapyService>(GardenTherapyService);
    gardenRepository = module.get(getRepositoryToken(GardenAreaEntity));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scheduleGardenTherapy', () => {
    it('should schedule a garden therapy session successfully', async () => {
      const sessionData = {
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        activities: [],
        therapeuticGoals: ['improve_mobility', 'enhance_mood'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
      };

      const session = await service.scheduleGardenTherapy(sessionData);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.residentId).toBe(sessionData.residentId);
      expect(session.gardenAreaId).toBe(sessionData.gardenAreaId);
      expect(session.therapyType).toBe(sessionData.therapyType);
      expect(session.duration).toBe(sessionData.duration);
      expect(session.therapeuticGoals).toEqual(sessionData.therapeuticGoals);
      expect(session.staffMember).toBe(sessionData.staffMember);
      expect(session.scheduledTime).toBe(sessionData.scheduledTime);
      expect(session.outcomes).toEqual([]);
    });

    it('should generate activities if not provided', async () => {
      const sessionData = {
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        therapeuticGoals: ['improve_mobility'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
      };

      const session = await service.scheduleGardenTherapy(sessionData);

      expect(session.activities).toBeDefined();
      expect(session.activities.length).toBeGreaterThan(0);
      expect(session.activities[0]).toHaveProperty('name');
      expect(session.activities[0]).toHaveProperty('type');
      expect(session.activities[0]).toHaveProperty('duration');
      expect(session.activities[0]).toHaveProperty('physicalDemand');
      expect(session.activities[0]).toHaveProperty('cognitiveEngagement');
    });

    it('should handle weather conditions', async () => {
      const sessionData = {
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        therapeuticGoals: ['improve_mobility'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
      };

      // Mock weather check to return unsuitable conditions
      jest.spyOn(service as any, 'checkWeatherConditions').mockResolvedValue({
        temperature: 5,
        humidity: 40,
        windSpeed: 20,
        precipitation: 5,
        uvIndex: 1,
        airQuality: 50,
        suitable: false,
        recommendations: ['Too cold for outdoor activities'],
      });

      const session = await service.scheduleGardenTherapy(sessionData);

      expect(session.adaptations).toBeDefined();
      expect(session.adaptations).toContain('Indoor alternative recommended due to weather');
    });
  });

  describe('startGardenTherapySession', () => {
    it('should start a garden therapy session successfully', async () => {
      const sessionId = 'test_session_001';
      
      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        activities: [],
        therapeuticGoals: ['improve_mobility'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
        outcomes: [],
      });

      const result = await service.startGardenTherapySession(sessionId);

      expect(result).toBe(true);
      
      const updatedSession = (service as any).activeSessions.get(sessionId);
      expect(updatedSession.actualStartTime).toBeDefined();
      expect(updatedSession.weatherConditions).toBeDefined();
      expect(updatedSession.outcomes).toBeDefined();
    });

    it('should return false for non-existent session', async () => {
      const sessionId = 'non_existent_session';

      const result = await service.startGardenTherapySession(sessionId);

      expect(result).toBe(false);
    });

    it('should perform pre-session assessment', async () => {
      const sessionId = 'test_session_001';
      
      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        activities: [],
        therapeuticGoals: ['improve_mobility', 'enhance_mood'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
        outcomes: [],
      });

      // Mock pre-session assessment
      jest.spyOn(service as any, 'performPreSessionAssessment').mockResolvedValue({
        'improve_mobility': 5,
        'enhance_mood': 6,
      });

      const result = await service.startGardenTherapySession(sessionId);

      expect(result).toBe(true);
      expect(service as any).performPreSessionAssessment).toHaveBeenCalledWith('resident_001');
    });
  });

  describe('completeGardenTherapySession', () => {
    it('should complete a garden therapy session successfully', async () => {
      const sessionId = 'test_session_001';
      const outcomes = [
        {
          metric: 'improve_mobility',
          postSessionScore: 7,
          notes: 'Resident showed improved movement during planting activity',
        },
        {
          metric: 'enhance_mood',
          postSessionScore: 8,
          notes: 'Resident appeared more cheerful and engaged',
        },
      ];
      
      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        activities: [],
        therapeuticGoals: ['improve_mobility', 'enhance_mood'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
        actualStartTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        outcomes: [
          {
            domain: 'physical',
            metric: 'improve_mobility',
            preSessionScore: 5,
            postSessionScore: 0,
            improvement: 0,
            notes: '',
          },
          {
            domain: 'emotional',
            metric: 'enhance_mood',
            preSessionScore: 6,
            postSessionScore: 0,
            improvement: 0,
            notes: '',
          },
        ],
      });

      const session = await service.completeGardenTherapySession(sessionId, outcomes);

      expect(session).toBeDefined();
      expect(session.actualEndTime).toBeDefined();
      expect(session.outcomes).toBeDefined();
      expect(session.outcomes[0].postSessionScore).toBe(7);
      expect(session.outcomes[0].improvement).toBe(2);
      expect(session.outcomes[1].postSessionScore).toBe(8);
      expect(session.outcomes[1].improvement).toBe(2);
    });

    it('should throw error for non-existent session', async () => {
      const sessionId = 'non_existent_session';
      const outcomes = [];

      await expect(
        service.completeGardenTherapySession(sessionId, outcomes)
      ).rejects.toThrow('Garden therapy session non_existent_session not found');
    });

    it('should calculate average improvement', async () => {
      const sessionId = 'test_session_001';
      const outcomes = [
        {
          metric: 'improve_mobility',
          postSessionScore: 7,
          notes: 'Good improvement',
        },
      ];
      
      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        activities: [],
        therapeuticGoals: ['improve_mobility'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
        actualStartTime: new Date(Date.now() - 60 * 60 * 1000),
        outcomes: [
          {
            domain: 'physical',
            metric: 'improve_mobility',
            preSessionScore: 5,
            postSessionScore: 0,
            improvement: 0,
            notes: '',
          },
        ],
      });

      const session = await service.completeGardenTherapySession(sessionId, outcomes);

      expect(session.outcomes[0].improvement).toBe(2);
    });
  });

  describe('createSeasonalProgram', () => {
    it('should create spring seasonal program', async () => {
      const program = await service.createSeasonalProgram('spring');

      expect(program).toBeDefined();
      expect(program.season).toBe('spring');
      expect(program.program).toBeDefined();
      expect(program.program.theme).toBe('New Beginnings');
      expect(program.program.activities).toBeDefined();
      expect(program.program.activities.length).toBeGreaterThan(0);
      expect(program.program.plants).toBeDefined();
      expect(program.program.therapeuticFocus).toBeDefined();
      expect(program.scheduledActivities).toBeDefined();
      expect(program.plantCareSchedules).toBeDefined();
    });

    it('should create summer seasonal program', async () => {
      const program = await service.createSeasonalProgram('summer');

      expect(program).toBeDefined();
      expect(program.season).toBe('summer');
      expect(program.program.theme).toBe('Growth and Abundance');
    });

    it('should create autumn seasonal program', async () => {
      const program = await service.createSeasonalProgram('autumn');

      expect(program).toBeDefined();
      expect(program.season).toBe('autumn');
      expect(program.program.theme).toBe('Harvest and Reflection');
    });

    it('should create winter seasonal program', async () => {
      const program = await service.createSeasonalProgram('winter');

      expect(program).toBeDefined();
      expect(program.season).toBe('winter');
      expect(program.program.theme).toBe('Rest and Planning');
    });
  });

  describe('designSensoryGarden', () => {
    it('should design sensory garden with visual focus', async () => {
      const gardenAreaId = 'garden_001';
      const sensoryFocus = ['visual'];

      const design = await service.designSensoryGarden(gardenAreaId, sensoryFocus);

      expect(design).toBeDefined();
      expect(design.gardenAreaId).toBe(gardenAreaId);
      expect(design.sensoryFocus).toEqual(sensoryFocus);
      expect(design.layout).toBeDefined();
      expect(design.plantSelection).toBeDefined();
      expect(design.features).toBeDefined();
      expect(design.pathways).toBeDefined();
      expect(design.seatingAreas).toBeDefined();
      expect(design.maintenanceRequirements).toBeDefined();
      expect(design.implementationPlan).toBeDefined();
    });

    it('should design sensory garden with multiple focuses', async () => {
      const gardenAreaId = 'garden_002';
      const sensoryFocus = ['visual', 'tactile', 'olfactory'];

      const design = await service.designSensoryGarden(gardenAreaId, sensoryFocus);

      expect(design).toBeDefined();
      expect(design.sensoryFocus).toEqual(sensoryFocus);
      expect(design.plantSelection).toBeDefined();
      expect(design.features).toBeDefined();
    });
  });

  describe('monitorTherapyOutcomes', () => {
    it('should return outcomes for week timeframe', async () => {
      const outcomes = await service.monitorTherapyOutcomes('week');

      expect(outcomes).toBeDefined();
      expect(outcomes.totalSessions).toBeDefined();
      expect(outcomes.uniqueResidents).toBeDefined();
      expect(outcomes.averageSessionDuration).toBeDefined();
      expect(outcomes.therapyTypes).toBeDefined();
      expect(outcomes.outcomeMetrics).toBeDefined();
      expect(outcomes.plantCareParticipation).toBeDefined();
      expect(outcomes.weatherImpact).toBeDefined();
      expect(outcomes.recommendations).toBeDefined();
    });

    it('should return outcomes for month timeframe', async () => {
      const outcomes = await service.monitorTherapyOutcomes('month');

      expect(outcomes).toBeDefined();
      expect(outcomes.totalSessions).toBeDefined();
    });

    it('should return outcomes for quarter timeframe', async () => {
      const outcomes = await service.monitorTherapyOutcomes('quarter');

      expect(outcomes).toBeDefined();
      expect(outcomes.totalSessions).toBeDefined();
    });

    it('should return outcomes for year timeframe', async () => {
      const outcomes = await service.monitorTherapyOutcomes('year');

      expect(outcomes).toBeDefined();
      expect(outcomes.totalSessions).toBeDefined();
    });
  });

  describe('managePlantCareSchedule', () => {
    it('should return plant care schedule', async () => {
      const schedule = await service.managePlantCareSchedule();

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);
    });

    it('should assign tasks to residents', async () => {
      // Mock plant care schedules with due tasks
      (service as any).plantCareSchedules.set('plant_001', {
        plantId: 'plant_001',
        plantName: 'Herb Garden',
        gardenAreaId: 'garden_001',
        careActivities: [
          {
            type: 'watering',
            frequency: 'daily',
            nextDue: new Date(), // Due today
            instructions: 'Water gently in the morning',
            season: 'year_round',
          },
        ],
        therapeuticValue: ['sensory_stimulation'],
        sensoryAttributes: {
          visual: ['green_foliage'],
          tactile: ['soft_leaves'],
          olfactory: ['fresh_herbs'],
          auditory: ['rustling_leaves'],
        },
      });

      const schedule = await service.managePlantCareSchedule();

      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
    });
  });

  describe('event emission', () => {
    it('should emit session scheduled event', async () => {
      const sessionData = {
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        therapeuticGoals: ['improve_mobility'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
      };

      await service.scheduleGardenTherapy(sessionData);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garden_therapy.session_scheduled',
        expect.any(Object)
      );
    });

    it('should emit session started event', async () => {
      const sessionId = 'test_session_001';
      
      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        activities: [],
        therapeuticGoals: ['improve_mobility'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
        outcomes: [],
      });

      await service.startGardenTherapySession(sessionId);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garden_therapy.session_started',
        expect.any(Object)
      );
    });

    it('should emit session completed event', async () => {
      const sessionId = 'test_session_001';
      const outcomes = [];
      
      // Mock active session
      (service as any).activeSessions.set(sessionId, {
        id: sessionId,
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        activities: [],
        therapeuticGoals: ['improve_mobility'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
        actualStartTime: new Date(Date.now() - 60 * 60 * 1000),
        outcomes: [
          {
            domain: 'physical',
            metric: 'improve_mobility',
            preSessionScore: 5,
            postSessionScore: 0,
            improvement: 0,
            notes: '',
          },
        ],
      });

      await service.completeGardenTherapySession(sessionId, outcomes);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garden_therapy.session_completed',
        expect.objectContaining({
          session: expect.any(Object),
          averageImprovement: expect.any(Number),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit seasonal program created event', async () => {
      await service.createSeasonalProgram('spring');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garden_therapy.seasonal_program_created',
        expect.objectContaining({
          season: 'spring',
          program: expect.any(Object),
          scheduledActivities: expect.any(Array),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit sensory garden designed event', async () => {
      const gardenAreaId = 'garden_001';
      const sensoryFocus = ['visual'];

      await service.designSensoryGarden(gardenAreaId, sensoryFocus);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garden_therapy.sensory_garden_designed',
        expect.objectContaining({
          design: expect.any(Object),
          implementationPlan: expect.any(Object),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit plant care scheduled event', async () => {
      await service.managePlantCareSchedule();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garden_therapy.plant_care_scheduled',
        expect.objectContaining({
          upcomingTasks: expect.any(Array),
          taskAssignments: expect.any(Array),
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('private helper methods', () => {
    it('should check weather conditions', async () => {
      const weather = await (service as any).checkWeatherConditions();

      expect(weather).toBeDefined();
      expect(weather.temperature).toBeDefined();
      expect(weather.humidity).toBeDefined();
      expect(weather.windSpeed).toBeDefined();
      expect(weather.precipitation).toBeDefined();
      expect(weather.uvIndex).toBeDefined();
      expect(weather.airQuality).toBeDefined();
      expect(weather.suitable).toBeDefined();
      expect(weather.recommendations).toBeDefined();
    });

    it('should generate therapy activities', async () => {
      const activities = await (service as any).generateTherapyActivities(
        GardenTherapyType.HORTICULTURAL_THERAPY,
        60,
        'resident_001'
      );

      expect(activities).toBeDefined();
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0]).toHaveProperty('name');
      expect(activities[0]).toHaveProperty('type');
      expect(activities[0]).toHaveProperty('duration');
      expect(activities[0]).toHaveProperty('physicalDemand');
      expect(activities[0]).toHaveProperty('cognitiveEngagement');
      expect(activities[0]).toHaveProperty('sensoryStimulation');
      expect(activities[0]).toHaveProperty('equipment');
      expect(activities[0]).toHaveProperty('adaptations');
    });

    it('should perform pre-session assessment', async () => {
      const assessment = await (service as any).performPreSessionAssessment('resident_001');

      expect(assessment).toBeDefined();
      expect(typeof assessment).toBe('object');
      expect(Object.keys(assessment).length).toBeGreaterThan(0);
    });

    it('should map goal to domain', () => {
      expect((service as any).mapGoalToDomain('improve_mobility')).toBe('physical');
      expect((service as any).mapGoalToDomain('cognitive_enhancement')).toBe('cognitive');
      expect((service as any).mapGoalToDomain('mood_improvement')).toBe('emotional');
      expect((service as any).mapGoalToDomain('social_interaction')).toBe('social');
      expect((service as any).mapGoalToDomain('spiritual_wellbeing')).toBe('spiritual');
    });
  });
});
