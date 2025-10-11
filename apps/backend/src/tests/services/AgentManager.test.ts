import { AgentManager } from '../../services/ai-agents/AgentManager';
import { OpenAIAdapter } from '../../services/ai-agents/OpenAIAdapter';
import { LLMIntegrationService } from '../../services/ai-agents/LLMIntegrationService';
import { AIAgentSessionService } from '../../services/ai-agents/AIAgentSessionService';

// Mock dependencies
jest.mock('../../services/ai-agents/OpenAIAdapter');
jest.mock('../../services/ai-agents/LLMIntegrationService');
jest.mock('../../services/ai-agents/AIAgentSessionService');

describe('AgentManager', () => {
  let agentManager: AgentManager;
  let mockOpenAIAdapter: jest.Mocked<OpenAIAdapter>;
  let mockLLMService: jest.Mocked<LLMIntegrationService>;
  let mockSessionService: jest.Mocked<AIAgentSessionService>;

  beforeEach(() => {
    mockOpenAIAdapter = {
      transcribeAudio: jest.fn(),
      generateCareNote: jest.fn(),
      analyzeSentiment: jest.fn(),
      extractEntities: jest.fn(),
      optimizeRoster: jest.fn(),
      assessRisk: jest.fn()
    } as any;

    mockLLMService = {
      generateResponse: jest.fn()
    } as any;

    mockSessionService = {
      createSession: jest.fn(),
      getSession: jest.fn(),
      updateSessionConversation: jest.fn()
    } as any;

    (OpenAIAdapter as jest.Mock).mockImplementation(() => mockOpenAIAdapter);
    (LLMIntegrationService as jest.Mock).mockImplementation(() => mockLLMService);
    (AIAgentSessionService as jest.Mock).mockImplementation(() => mockSessionService);

    agentManager = new AgentManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerAgent', () => {
    it('should register a new agent successfully', async () => {
      const agentConfig = {
        id: 'test_agent',
        name: 'Test Agent',
        type: 'voice_to_note' as const,
        enabled: true,
        priority: 1,
        timeout: 30000,
        retryAttempts: 3,
        dependencies: ['openai_adapter'],
        capabilities: ['transcription', 'note_generation'],
        config: {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 2000
        }
      };

      await agentManager.registerAgent(agentConfig);

      const agentStatus = agentManager.getAgentStatus('test_agent');
      expect(agentStatus).toBeDefined();
      expect(agentStatus?.name).toBe('Test Agent');
    });

    it('should throw error for unknown agent type', async () => {
      const agentConfig = {
        id: 'test_agent',
        name: 'Test Agent',
        type: 'unknown_type' as any,
        enabled: true,
        priority: 1,
        timeout: 30000,
        retryAttempts: 3,
        dependencies: [],
        capabilities: [],
        config: {}
      };

      await expect(agentManager.registerAgent(agentConfig)).rejects.toThrow('Unknown agent type');
    });
  });

  describe('invokeAgent', () => {
    beforeEach(async () => {
      const agentConfig = {
        id: 'voice_to_note',
        name: 'Voice-to-Note Agent',
        type: 'voice_to_note' as const,
        enabled: true,
        priority: 1,
        timeout: 30000,
        retryAttempts: 3,
        dependencies: ['openai_adapter'],
        capabilities: ['transcription', 'note_generation'],
        config: {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 2000
        }
      };

      await agentManager.registerAgent(agentConfig);
    });

    it('should invoke agent successfully', async () => {
      const invocation = {
        agentId: 'voice_to_note',
        input: {
          audioData: 'base64audio',
          residentId: 'resident-1',
          staffMemberId: 'staff-1'
        },
        context: { tenantId: 'tenant-1' },
        priority: 'normal' as const
      };

      mockOpenAIAdapter.transcribeAudio.mockResolvedValue({
        response: 'Transcribed text',
        confidence: 0.95,
        processingTime: 1000,
        tokensUsed: 100,
        metadata: { model: 'gpt-4' }
      });

      mockOpenAIAdapter.generateCareNote.mockResolvedValue({
        response: 'Generated care note',
        confidence: 0.90,
        processingTime: 500,
        tokensUsed: 50,
        metadata: { model: 'gpt-4' }
      });

      mockOpenAIAdapter.analyzeSentiment.mockResolvedValue({
        response: 'Positive sentiment',
        confidence: 0.85,
        processingTime: 200,
        tokensUsed: 25,
        metadata: { model: 'gpt-4' }
      });

      mockOpenAIAdapter.extractEntities.mockResolvedValue({
        response: ['medication', 'pain'],
        confidence: 0.80,
        processingTime: 150,
        tokensUsed: 20,
        metadata: { model: 'gpt-4' }
      });

      const result = await agentManager.invokeAgent(invocation);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.transcription).toBeDefined();
      expect(result.result.careNote).toBeDefined();
      expect(result.result.sentiment).toBeDefined();
      expect(result.result.entities).toBeDefined();
    });

    it('should handle agent invocation failure', async () => {
      const invocation = {
        agentId: 'voice_to_note',
        input: {
          audioData: 'invalid',
          residentId: 'resident-1',
          staffMemberId: 'staff-1'
        },
        context: { tenantId: 'tenant-1' },
        priority: 'normal' as const
      };

      mockOpenAIAdapter.transcribeAudio.mockRejectedValue(new Error('Transcription failed'));

      const result = await agentManager.invokeAgent(invocation);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error for non-existent agent', async () => {
      const invocation = {
        agentId: 'non_existent_agent',
        input: {},
        context: { tenantId: 'tenant-1' },
        priority: 'normal' as const
      };

      await expect(agentManager.invokeAgent(invocation)).rejects.toThrow('Agent not found');
    });

    it('should throw error for disabled agent', async () => {
      const agentConfig = {
        id: 'disabled_agent',
        name: 'Disabled Agent',
        type: 'voice_to_note' as const,
        enabled: false,
        priority: 1,
        timeout: 30000,
        retryAttempts: 3,
        dependencies: [],
        capabilities: [],
        config: {}
      };

      await agentManager.registerAgent(agentConfig);

      const invocation = {
        agentId: 'disabled_agent',
        input: {},
        context: { tenantId: 'tenant-1' },
        priority: 'normal' as const
      };

      await expect(agentManager.invokeAgent(invocation)).rejects.toThrow('Agent not enabled');
    });
  });

  describe('getAgentStatus', () => {
    it('should return agent status', async () => {
      const agentConfig = {
        id: 'test_agent',
        name: 'Test Agent',
        type: 'voice_to_note' as const,
        enabled: true,
        priority: 1,
        timeout: 30000,
        retryAttempts: 3,
        dependencies: [],
        capabilities: ['transcription'],
        config: {}
      };

      await agentManager.registerAgent(agentConfig);

      const status = agentManager.getAgentStatus('test_agent');
      expect(status).toBeDefined();
      expect(status?.name).toBe('Test Agent');
      expect(status?.capabilities).toEqual(['transcription']);
    });

    it('should return null for non-existent agent', () => {
      const status = agentManager.getAgentStatus('non_existent_agent');
      expect(status).toBeNull();
    });
  });

  describe('getAllAgentStatuses', () => {
    it('should return all agent statuses', async () => {
      const agentConfigs = [
        {
          id: 'agent_1',
          name: 'Agent 1',
          type: 'voice_to_note' as const,
          enabled: true,
          priority: 1,
          timeout: 30000,
          retryAttempts: 3,
          dependencies: [],
          capabilities: ['transcription'],
          config: {}
        },
        {
          id: 'agent_2',
          name: 'Agent 2',
          type: 'smart_roster' as const,
          enabled: true,
          priority: 2,
          timeout: 60000,
          retryAttempts: 2,
          dependencies: [],
          capabilities: ['roster_optimization'],
          config: {}
        }
      ];

      for (const config of agentConfigs) {
        await agentManager.registerAgent(config);
      }

      const statuses = agentManager.getAllAgentStatuses();
      expect(statuses).toHaveLength(2);
      expect(statuses[0].name).toBe('Agent 1');
      expect(statuses[1].name).toBe('Agent 2');
    });
  });

  describe('setAgentEnabled', () => {
    it('should enable/disable agent', async () => {
      const agentConfig = {
        id: 'test_agent',
        name: 'Test Agent',
        type: 'voice_to_note' as const,
        enabled: true,
        priority: 1,
        timeout: 30000,
        retryAttempts: 3,
        dependencies: [],
        capabilities: [],
        config: {}
      };

      await agentManager.registerAgent(agentConfig);

      await agentManager.setAgentEnabled('test_agent', false);
      const status = agentManager.getAgentStatus('test_agent');
      expect(status?.status).toBe('disabled');

      await agentManager.setAgentEnabled('test_agent', true);
      const enabledStatus = agentManager.getAgentStatus('test_agent');
      expect(enabledStatus?.status).toBe('idle');
    });
  });

  describe('getAgentCapabilities', () => {
    it('should return agent capabilities', async () => {
      const agentConfig = {
        id: 'test_agent',
        name: 'Test Agent',
        type: 'voice_to_note' as const,
        enabled: true,
        priority: 1,
        timeout: 30000,
        retryAttempts: 3,
        dependencies: [],
        capabilities: ['transcription', 'note_generation'],
        config: {}
      };

      await agentManager.registerAgent(agentConfig);

      const capabilities = agentManager.getAgentCapabilities('test_agent');
      expect(capabilities).toEqual(['transcription', 'note_generation']);
    });

    it('should return empty array for non-existent agent', () => {
      const capabilities = agentManager.getAgentCapabilities('non_existent_agent');
      expect(capabilities).toEqual([]);
    });
  });
});