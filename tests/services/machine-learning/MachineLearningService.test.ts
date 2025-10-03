import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MachineLearningService } from '../../../src/services/machine-learning/MachineLearningService';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('MachineLearningService', () => {
  let service: MachineLearningService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    service = new MachineLearningService(mockEventEmitter);
  });

  describe('loadModel', () => {
    it('should load a model successfully', async () => {
      const modelId = 'health-prediction-v1';
      const result = await service.loadModel(modelId);

      expect(result).toBeDefined();
      expect(result.modelId).toBe(modelId);
      expect(result.status).toBe('loaded');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('ml.model.loaded', expect.any(Object));
    });

    it('should handle model loading errors', async () => {
      const modelId = 'invalid-model';
      
      await expect(service.loadModel(modelId)).rejects.toThrow('Model not found');
    });
  });

  describe('predictHealthOutcome', () => {
    it('should make health predictions', async () => {
      const request = {
        residentId: 'resident-123',
        dataRange: 30,
        predictionType: 'health_decline' as const,
        confidenceThreshold: 0.8,
      };

      const result = await service.predictHealthOutcome(request);

      expect(result).toBeDefined();
      expect(result.residentId).toBe(request.residentId);
      expect(result.predictions).toBeDefined();
      expect(result.modelAccuracy).toBeGreaterThan(0);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('ml.prediction.generated', expect.any(Object));
    });

    it('should handle prediction errors', async () => {
      const request = {
        residentId: 'invalid-resident',
        dataRange: 30,
        predictionType: 'health_decline' as const,
        confidenceThreshold: 0.8,
      };

      await expect(service.predictHealthOutcome(request)).rejects.toThrow('Insufficient data');
    });
  });

  describe('getModelPerformance', () => {
    it('should return model performance metrics', async () => {
      const modelId = 'health-prediction-v1';
      const result = await service.getModelPerformance(modelId);

      expect(result).toBeDefined();
      expect(result.modelId).toBe(modelId);
      expect(result.accuracy).toBeGreaterThan(0);
      expect(result.precision).toBeGreaterThan(0);
      expect(result.recall).toBeGreaterThan(0);
      expect(result.f1Score).toBeGreaterThan(0);
    });
  });

  describe('retrainModel', () => {
    it('should retrain a model', async () => {
      const modelId = 'health-prediction-v1';
      const result = await service.retrainModel(modelId);

      expect(result).toBeDefined();
      expect(result.modelId).toBe(modelId);
      expect(result.status).toBe('training');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('ml.model.retraining', expect.any(Object));
    });
  });

  describe('getModelList', () => {
    it('should return list of available models', async () => {
      const result = await service.getModelList();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getPredictionHistory', () => {
    it('should return prediction history for a resident', async () => {
      const residentId = 'resident-123';
      const result = await service.getPredictionHistory(residentId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateModelAccuracy', () => {
    it('should update model accuracy metrics', async () => {
      const modelId = 'health-prediction-v1';
      const accuracy = 0.95;
      
      const result = await service.updateModelAccuracy(modelId, accuracy);

      expect(result).toBeDefined();
      expect(result.modelId).toBe(modelId);
      expect(result.accuracy).toBe(accuracy);
    });
  });

  describe('getModelStatus', () => {
    it('should return model status', async () => {
      const modelId = 'health-prediction-v1';
      const result = await service.getModelStatus(modelId);

      expect(result).toBeDefined();
      expect(result.modelId).toBe(modelId);
      expect(result.status).toBeDefined();
    });
  });

  describe('validateModel', () => {
    it('should validate model performance', async () => {
      const modelId = 'health-prediction-v1';
      const result = await service.validateModel(modelId);

      expect(result).toBeDefined();
      expect(result.modelId).toBe(modelId);
      expect(result.isValid).toBeDefined();
      expect(result.validationScore).toBeGreaterThan(0);
    });
  });

  describe('getModelMetrics', () => {
    it('should return comprehensive model metrics', async () => {
      const modelId = 'health-prediction-v1';
      const result = await service.getModelMetrics(modelId);

      expect(result).toBeDefined();
      expect(result.modelId).toBe(modelId);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.accuracy).toBeGreaterThan(0);
      expect(result.metrics.precision).toBeGreaterThan(0);
      expect(result.metrics.recall).toBeGreaterThan(0);
      expect(result.metrics.f1Score).toBeGreaterThan(0);
    });
  });
});