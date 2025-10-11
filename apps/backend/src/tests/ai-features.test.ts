import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AgentConsoleController } from '../controllers/ai-agents/AgentConsoleController';
import { EnhancedVoiceAssistantController } from '../controllers/voice-assistant/EnhancedVoiceAssistantController';
import { AdvancedPredictiveHealthController } from '../controllers/analytics/AdvancedPredictiveHealthController';
import { EmotionWellnessTrackingController } from '../controllers/wellness/EmotionWellnessTrackingController';

describe('AI Features Integration Tests', () => {
  let agentConsoleController: AgentConsoleController;
  let voiceAssistantController: EnhancedVoiceAssistantController;
  let predictiveHealthController: AdvancedPredictiveHealthController;
  let wellnessController: EmotionWellnessTrackingController;

  beforeEach(() => {
    agentConsoleController = new AgentConsoleController();
    voiceAssistantController = new EnhancedVoiceAssistantController();
    predictiveHealthController = new AdvancedPredictiveHealthController();
    wellnessController = new EmotionWellnessTrackingController();
  });

  describe('Agent Console Dashboard', () => {
    it('should get agent metrics', async () => {
      const mockReq = {
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await agentConsoleController.getAgentMetrics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should get system health', async () => {
      const mockReq = {
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await agentConsoleController.getSystemHealth(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should toggle agent status', async () => {
      const mockReq = {
        params: { agentId: 'agent1' },
        body: { enabled: true },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await agentConsoleController.toggleAgent(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Enhanced Voice Assistant', () => {
    it('should process hands-free command', async () => {
      const mockReq = {
        body: {
          command: 'Log medication for John',
          device: 'mobile',
          location: 'Room 101'
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await voiceAssistantController.processHandsFreeCommand(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should log medication by voice', async () => {
      const mockReq = {
        body: {
          voiceTranscript: 'Administered paracetamol 500mg at 2pm',
          residentId: 'resident1'
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await voiceAssistantController.logMedicationByVoice(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should activate emergency protocol', async () => {
      const mockReq = {
        body: {
          voiceTranscript: 'Emergency in Room 101, resident has fallen',
          residentId: 'resident1',
          location: 'Room 101'
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await voiceAssistantController.activateEmergencyProtocol(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Advanced Predictive Health Analytics', () => {
    it('should generate health prediction', async () => {
      const mockReq = {
        body: {
          residentId: 'resident1',
          predictionType: 'health_deterioration',
          timeframe: 'short_term'
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await predictiveHealthController.generateHealthPrediction(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should analyze health trends', async () => {
      const mockReq = {
        params: { residentId: 'resident1' },
        query: { period: '30d' },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await predictiveHealthController.analyzeHealthTrends(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should get health dashboard', async () => {
      const mockReq = {
        params: { residentId: 'resident1' },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await predictiveHealthController.getHealthDashboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Emotion & Wellness Tracking', () => {
    it('should record emotion reading', async () => {
      const mockReq = {
        body: {
          residentId: 'resident1',
          emotionType: 'happy',
          intensity: 0.8,
          source: 'staff_observation',
          context: 'Participated in group activity'
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await wellnessController.recordEmotionReading(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should analyze sentiment', async () => {
      const mockReq = {
        body: {
          residentId: 'resident1',
          text: 'I had a wonderful day today, the staff were very kind',
          source: 'voice_transcript'
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await wellnessController.analyzeSentiment(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should track wellness metric', async () => {
      const mockReq = {
        body: {
          residentId: 'resident1',
          metricType: 'mood',
          value: 85,
          source: 'ai_analysis'
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await wellnessController.trackWellnessMetric(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should get wellness dashboard', async () => {
      const mockReq = {
        params: { residentId: 'resident1' },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await wellnessController.getWellnessDashboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should generate activity recommendations', async () => {
      const mockReq = {
        body: {
          residentId: 'resident1',
          currentMood: 'sad',
          preferences: ['music', 'art', 'social']
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      await wellnessController.generateActivityRecommendations(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete AI workflow', async () => {
      // Test completeworkflow: Voice command -> Emotion analysis -> Health prediction -> Recommendations
      const mockReq = {
        body: {
          command: 'I feel anxious about my medication',
          residentId: 'resident1',
          device: 'mobile'
        },
        user: { id: 'user1', tenantId: 'tenant1' }
      } as any;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;

      // Process voice command
      await voiceAssistantController.processHandsFreeCommand(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalled();

      // Analyze sentiment
      await wellnessController.analyzeSentiment({
        ...mockReq,
        body: {
          residentId: 'resident1',
          text: 'I feel anxious about my medication',
          source: 'voice_transcript'
        }
      }, mockRes);
      expect(mockRes.json).toHaveBeenCalled();

      // Generate health prediction
      await predictiveHealthController.generateHealthPrediction({
        ...mockReq,
        body: {
          residentId: 'resident1',
          predictionType: 'mood_deterioration',
          timeframe: 'immediate'
        }
      }, mockRes);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
