import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DataAnalyticsService } from '../../../src/services/analytics/DataAnalyticsService';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('DataAnalyticsService', () => {
  let service: DataAnalyticsService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    service = new DataAnalyticsService(mockEventEmitter);
  });

  describe('getVitalsData', () => {
    it('should return vitals data for a resident', async () => {
      const residentId = 'resident-123';
      const startDate = new Date('2024-01-01');

      const result = await service.getVitalsData(residentId, startDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const firstRecord = result[0];
      expect(firstRecord.residentId).toBe(residentId);
      expect(firstRecord.timestamp).toBeDefined();
      expect(firstRecord.heartRate).toBeDefined();
      expect(firstRecord.bloodPressure).toBeDefined();
      expect(firstRecord.temperature).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const residentId = 'invalid-resident';
      const startDate = new Date('2024-01-01');

      const result = await service.getVitalsData(residentId, startDate);
      expect(result).toEqual([]);
    });
  });

  describe('getActivitiesData', () => {
    it('should return activities data for a resident', async () => {
      const residentId = 'resident-123';
      const startDate = new Date('2024-01-01');

      const result = await service.getActivitiesData(residentId, startDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const firstRecord = result[0];
      expect(firstRecord.residentId).toBe(residentId);
      expect(firstRecord.timestamp).toBeDefined();
      expect(firstRecord.mobility).toBeDefined();
      expect(firstRecord.socialInteraction).toBeDefined();
      expect(firstRecord.cognitiveEngagement).toBeDefined();
    });
  });

  describe('getMedicationData', () => {
    it('should return medication data for a resident', async () => {
      const residentId = 'resident-123';
      const startDate = new Date('2024-01-01');

      const result = await service.getMedicationData(residentId, startDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const firstRecord = result[0];
      expect(firstRecord.residentId).toBe(residentId);
      expect(firstRecord.timestamp).toBeDefined();
      expect(firstRecord.adherenceRate).toBeDefined();
      expect(firstRecord.missedDoses).toBeDefined();
    });
  });

  describe('getBehavioralData', () => {
    it('should return behavioral data for a resident', async () => {
      const residentId = 'resident-123';
      const startDate = new Date('2024-01-01');

      const result = await service.getBehavioralData(residentId, startDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const firstRecord = result[0];
      expect(firstRecord.residentId).toBe(residentId);
      expect(firstRecord.timestamp).toBeDefined();
      expect(firstRecord.moodScore).toBeDefined();
      expect(firstRecord.agitationLevel).toBeDefined();
    });
  });

  describe('getEnvironmentalData', () => {
    it('should return environmental data for a resident', async () => {
      const residentId = 'resident-123';
      const startDate = new Date('2024-01-01');

      const result = await service.getEnvironmentalData(residentId, startDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const firstRecord = result[0];
      expect(firstRecord.residentId).toBe(residentId);
      expect(firstRecord.timestamp).toBeDefined();
      expect(firstRecord.fallEvents).toBeDefined();
      expect(firstRecord.emergencyAlerts).toBeDefined();
    });
  });

  describe('executeQuery', () => {
    it('should execute analytics query successfully', async () => {
      const query = {
        residentId: 'resident-123',
        metric: 'heart_rate',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        aggregation: 'daily' as const,
      };

      const result = await service.executeQuery(query);

      expect(result).toBeDefined();
      expect(result.query).toEqual(query);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalDataPoints).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.queryTime).toBeGreaterThan(0);
      
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('analytics.query.executed', expect.any(Object));
    });

    it('should handle query errors', async () => {
      const query = {
        residentId: 'invalid-resident',
        metric: 'invalid-metric',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      await expect(service.executeQuery(query)).rejects.toThrow();
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data', async () => {
      const residentId = 'resident-123';
      const timeRange = 30;

      const result = await service.getDashboardData(residentId, timeRange);

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.alerts).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.timeRange).toBe(timeRange);
      expect(result.generatedAt).toBeDefined();
    });

    it('should return dashboard data for all residents', async () => {
      const timeRange = 30;

      const result = await service.getDashboardData(undefined, timeRange);

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.overview.totalResidents).toBeGreaterThan(0);
    });
  });

  describe('caching', () => {
    it('should cache data and return cached results', async () => {
      const residentId = 'resident-123';
      const startDate = new Date('2024-01-01');

      // First call
      const result1 = await service.getVitalsData(residentId, startDate);
      
      // Second call should return cached data
      const result2 = await service.getVitalsData(residentId, startDate);

      expect(result1).toEqual(result2);
    });
  });

  describe('data validation', () => {
    it('should validate vitals data ranges', async () => {
      const residentId = 'resident-123';
      const startDate = new Date('2024-01-01');

      const result = await service.getVitalsData(residentId, startDate);
      
      result.forEach(record => {
        expect(record.heartRate).toBeGreaterThanOrEqual(60);
        expect(record.heartRate).toBeLessThanOrEqual(100);
        expect(record.temperature).toBeGreaterThanOrEqual(36.5);
        expect(record.temperature).toBeLessThanOrEqual(37.5);
        expect(record.oxygenSaturation).toBeGreaterThanOrEqual(95);
        expect(record.oxygenSaturation).toBeLessThanOrEqual(100);
      });
    });

    it('should validate activities data ranges', async () => {
      const residentId = 'resident-123';
      const startDate = new Date('2024-01-01');

      const result = await service.getActivitiesData(residentId, startDate);
      
      result.forEach(record => {
        expect(record.mobility).toBeGreaterThanOrEqual(0);
        expect(record.mobility).toBeLessThanOrEqual(10);
        expect(record.socialInteraction).toBeGreaterThanOrEqual(0);
        expect(record.socialInteraction).toBeLessThanOrEqual(10);
        expect(record.cognitiveEngagement).toBeGreaterThanOrEqual(0);
        expect(record.cognitiveEngagement).toBeLessThanOrEqual(10);
      });
    });
  });
});