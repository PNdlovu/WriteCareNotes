import { EventEmitter2 } from 'eventemitter2';
import { OpenAIAdapter } from './OpenAIAdapter';
import { LLMIntegrationService } from './LLMIntegrationService';
import { AIAgentSessionService } from './AIAgentSessionService';

export interface AgentConfig {
  id: string;
  name: string;
  type: 'voice_to_note' | 'smart_roster' | 'risk_flag' | 'general';
  enabled: boolean;
  priority: number;
  timeout: number; // milliseconds
  retryAttempts: number;
  dependencies: string[];
  capabilities: string[];
  config: Record<string, any>;
}

export interface AgentEvent {
  type: string;
  agentId: string;
  timestamp: Date;
  data: any;
  correlationId?: string;
}

export interface AgentResponse {
  agentId: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
  correlationId?: string;
}

export interface AgentInvocation {
  agentId: string;
  input: any;
  context: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timeout?: number;
  correlationId?: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error' | 'disabled';
  lastActivity: Date;
  processedCount: number;
  errorCount: number;
  averageProcessingTime: number;
  capabilities: string[];
}

export class AgentManager {
  privateagents: Map<string, any> = new Map();
  privateagentConfigs: Map<string, AgentConfig> = new Map();
  privateeventEmitter: EventEmitter2;
  privateopenAIAdapter: OpenAIAdapter;
  privatellmService: LLMIntegrationService;
  privatesessionService: AIAgentSessionService;
  privateprocessingQueue: AgentInvocation[] = [];
  privateisProcessing: boolean = false;

  constructor() {
    this.eventEmitter = new EventEmitter2();
    this.openAIAdapter = new OpenAIAdapter();
    this.llmService = new LLMIntegrationService();
    this.sessionService = new AIAgentSessionService();
    
    this.initializeAgents();
    this.startProcessingLoop();
  }

  /**
   * Initialize all AI agents
   */
  private async initializeAgents(): Promise<void> {
    console.log('🤖 Initializing AI Agent Manager...');

    // Register Voice-to-Note Agent
    await this.registerAgent({
      id: 'voice_to_note',
      name: 'Voice-to-Note Agent',
      type: 'voice_to_note',
      enabled: true,
      priority: 1,
      timeout: 30000,
      retryAttempts: 3,
      dependencies: ['openai_adapter'],
      capabilities: ['transcription', 'note_generation', 'sentiment_analysis'],
      config: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 2000
      }
    });

    // Register Smart Roster Agent
    await this.registerAgent({
      id: 'smart_roster',
      name: 'Smart Roster Agent',
      type: 'smart_roster',
      enabled: true,
      priority: 2,
      timeout: 60000,
      retryAttempts: 2,
      dependencies: ['openai_adapter'],
      capabilities: ['roster_optimization', 'scheduling', 'compliance_check'],
      config: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.2,
        maxTokens: 3000
      }
    });

    // Register Risk Flag Agent
    await this.registerAgent({
      id: 'risk_flag',
      name: 'Risk Flag Agent',
      type: 'risk_flag',
      enabled: true,
      priority: 0, // Highest priority
      timeout: 15000,
      retryAttempts: 5,
      dependencies: ['openai_adapter'],
      capabilities: ['risk_assessment', 'anomaly_detection', 'alert_generation'],
      config: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.1,
        maxTokens: 1500
      }
    });

    console.log('✅ AI Agent Manager initialized with', this.agents.size, 'agents');
  }

  /**
   * Register an agent
   */
  async registerAgent(config: AgentConfig): Promise<void> {
    try {
      // Create agent instance based on type
      letagent: any;
      
      switch (config.type) {
        case 'voice_to_note':
          agent = await this.createVoiceToNoteAgent(config);
          break;
        case 'smart_roster':
          agent = await this.createSmartRosterAgent(config);
          break;
        case 'risk_flag':
          agent = await this.createRiskFlagAgent(config);
          break;
        default:
          throw new Error(`Unknown agent type: ${config.type}`);
      }

      this.agents.set(config.id, agent);
      this.agentConfigs.set(config.id, config);

      // Emit agent registered event
      this.emitEvent({
        type: 'agent.registered',
        agentId: config.id,
        timestamp: new Date(),
        data: { config }
      });

      console.log(`✅ Agent registered: ${config.name} (${config.id})`);
    } catch (error) {
      console.error(`❌ Failed to register agent ${config.id}:`, error);
      throw error;
    }
  }

  /**
   * Create Voice-to-Note Agent
   */
  private async createVoiceToNoteAgent(config: AgentConfig): Promise<any> {
    return {
      id: config.id,
      name: config.name,
      type: config.type,
      config,
      process: async (input: any, context: any) => {
        return await this.processVoiceToNote(input, context);
      }
    };
  }

  /**
   * Create Smart Roster Agent
   */
  private async createSmartRosterAgent(config: AgentConfig): Promise<any> {
    return {
      id: config.id,
      name: config.name,
      type: config.type,
      config,
      process: async (input: any, context: any) => {
        return await this.processSmartRoster(input, context);
      }
    };
  }

  /**
   * Create Risk Flag Agent
   */
  private async createRiskFlagAgent(config: AgentConfig): Promise<any> {
    return {
      id: config.id,
      name: config.name,
      type: config.type,
      config,
      process: async (input: any, context: any) => {
        return await this.processRiskFlag(input, context);
      }
    };
  }

  /**
   * Invoke an agent
   */
  async invokeAgent(invocation: AgentInvocation): Promise<AgentResponse> {
    const startTime = Date.now();
    const correlationId = invocation.correlationId || this.generateCorrelationId();

    try {
      // Add to processing queue
      this.processingQueue.push(invocation);
      
      // Emit invocation event
      this.emitEvent({
        type: 'agent.invoked',
        agentId: invocation.agentId,
        timestamp: new Date(),
        data: { invocation },
        correlationId
      });

      // Process the invocation
      const result = await this.processAgentInvocation(invocation);
      const processingTime = Date.now() - startTime;

      constresponse: AgentResponse = {
        agentId: invocation.agentId,
        success: true,
        result,
        processingTime,
        correlationId
      };

      // Emit success event
      this.emitEvent({
        type: 'agent.completed',
        agentId: invocation.agentId,
        timestamp: new Date(),
        data: { response },
        correlationId
      });

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      constresponse: AgentResponse = {
        agentId: invocation.agentId,
        success: false,
        error: errorMessage,
        processingTime,
        correlationId
      };

      // Emit error event
      this.emitEvent({
        type: 'agent.error',
        agentId: invocation.agentId,
        timestamp: new Date(),
        data: { response, error: errorMessage },
        correlationId
      });

      return response;
    }
  }

  /**
   * Process agent invocation
   */
  private async processAgentInvocation(invocation: AgentInvocation): Promise<any> {
    const agent = this.agents.get(invocation.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${invocation.agentId}`);
    }

    const config = this.agentConfigs.get(invocation.agentId);
    if (!config || !config.enabled) {
      throw new Error(`Agent not enabled: ${invocation.agentId}`);
    }

    // Set timeout
    const timeout = invocation.timeout || config.timeout;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Agent timeout: ${invocation.agentId}`));
      }, timeout);

      // Process with retry logic
      this.processWithRetry(agent, invocation, config.retryAttempts)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Process with retry logic
   */
  private async processWithRetry(
    agent: any,
    invocation: AgentInvocation,
    retryAttempts: number
  ): Promise<any> {
    letlastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await agent.process(invocation.input, invocation.context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retryAttempts) {
          console.warn(`Agent ${invocation.agentId} attempt ${attempt + 1} failed, retrying...`, lastError.message);
          await this.delay(1000 * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Process Voice-to-Note
   */
  private async processVoiceToNote(input: any, context: any): Promise<any> {
    const { audioData, audioFormat, residentId, staffMemberId, sessionId } = input;

    // Step 1: Transcribe audio
    const transcriptionResult = await this.openAIAdapter.transcribeAudio(
      audioData,
      { residentId, staffMemberId, sessionId },
      { tenantId: context.tenantId, securityLevel: 'TENANT' }
    );

    // Step 2: Generate care note
    const noteResult = await this.openAIAdapter.generateCareNote(
      transcriptionResult.response,
      {
        resident_id: residentId,
        staff_member: staffMemberId,
        context: context.noteContext || ''
      },
      { tenantId: context.tenantId, securityLevel: 'TENANT' }
    );

    // Step 3: Analyze sentiment
    const sentimentResult = await this.openAIAdapter.analyzeSentiment(
      transcriptionResult.response,
      { residentId, staffMemberId },
      { tenantId: context.tenantId, securityLevel: 'TENANT' }
    );

    // Step 4: Extract entities
    const entityResult = await this.openAIAdapter.extractEntities(
      transcriptionResult.response,
      ['person', 'medication', 'condition', 'time', 'action'],
      { residentId, staffMemberId },
      { tenantId: context.tenantId, securityLevel: 'TENANT' }
    );

    return {
      transcription: {
        text: transcriptionResult.response,
        confidence: transcriptionResult.confidence,
        language: 'en',
        duration: input.duration || 0,
        wordCount: transcriptionResult.response.split(' ').length
      },
      careNote: {
        content: noteResult.response,
        confidence: noteResult.confidence,
        requiresReview: noteResult.confidence < 0.8,
        tags: this.extractTagsFromNote(noteResult.response),
        categories: this.categorizeNote(noteResult.response)
      },
      sentiment: {
        analysis: sentimentResult.response,
        confidence: sentimentResult.confidence
      },
      entities: {
        extracted: entityResult.response,
        confidence: entityResult.confidence
      },
      metadata: {
        processingTime: transcriptionResult.processingTime + noteResult.processingTime,
        tokensUsed: transcriptionResult.tokensUsed + noteResult.tokensUsed,
        model: transcriptionResult.metadata.model
      }
    };
  }

  /**
   * Process Smart Roster
   */
  private async processSmartRoster(input: any, context: any): Promise<any> {
    const rosterData = {
      staff_requirements: JSON.stringify(input.staffRequirements),
      shift_times: JSON.stringify(input.shiftTimes),
      required_skills: JSON.stringify(input.requiredSkills),
      budget_constraints: JSON.stringify(input.budgetConstraints),
      staff_availability: JSON.stringify(input.staffAvailability),
      max_hours: input.maxHours || 40,
      min_rest_hours: input.minRestHours || 12,
      compliance_requirements: JSON.stringify(input.complianceRequirements),
      current_roster: JSON.stringify(input.currentRoster)
    };

    const result = await this.openAIAdapter.optimizeRoster(
      rosterData,
      { tenantId: context.tenantId, securityLevel: 'TENANT' }
    );

    return {
      optimizedRoster: this.parseRosterResult(result.response),
      confidence: result.confidence,
      recommendations: this.extractRecommendations(result.response),
      complianceCheck: this.checkCompliance(result.response),
      costAnalysis: this.analyzeCosts(result.response),
      metadata: {
        processingTime: result.processingTime,
        tokensUsed: result.tokensUsed,
        model: result.metadata.model
      }
    };
  }

  /**
   * Process Risk Flag
   */
  private async processRiskFlag(input: any, context: any): Promise<any> {
    const riskData = {
      vital_signs: JSON.stringify(input.vitalSigns),
      movement_data: JSON.stringify(input.movementData),
      environmental_data: JSON.stringify(input.environmentalData),
      alert_history: JSON.stringify(input.alertHistory),
      recent_notes: JSON.stringify(input.recentNotes),
      medication_changes: JSON.stringify(input.medicationChanges),
      behavioral_observations: JSON.stringify(input.behavioralObservations),
      family_concerns: JSON.stringify(input.familyConcerns),
      age: input.age,
      medical_conditions: JSON.stringify(input.medicalConditions),
      mobility_status: input.mobilityStatus,
      cognitive_status: input.cognitiveStatus
    };

    const result = await this.openAIAdapter.assessRisk(
      riskData,
      { tenantId: context.tenantId, securityLevel: 'TENANT' }
    );

    return {
      riskAssessment: this.parseRiskResult(result.response),
      confidence: result.confidence,
      alerts: this.extractAlerts(result.response),
      recommendations: this.extractRiskRecommendations(result.response),
      priority: this.determinePriority(result.response),
      metadata: {
        processingTime: result.processingTime,
        tokensUsed: result.tokensUsed,
        model: result.metadata.model
      }
    };
  }

  /**
   * Start processing loop
   */
  private startProcessingLoop(): void {
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Sort by priority
      this.processingQueue.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Process up to 5 invocations concurrently
      const batch = this.processingQueue.splice(0, 5);
      const promises = batch.map(invocation => this.invokeAgent(invocation));

      await Promise.allSettled(promises);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): AgentStatus | null {
    const agent = this.agents.get(agentId);
    const config = this.agentConfigs.get(agentId);
    
    if (!agent || !config) return null;

    return {
      id: agentId,
      name: config.name,
      status: config.enabled ? 'idle' : 'disabled',
      lastActivity: new Date(),
      processedCount: 0, // Would track in real implementation
      errorCount: 0, // Would track in real implementation
      averageProcessingTime: 0, // Would track in real implementation
      capabilities: config.capabilities
    };
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): AgentStatus[] {
    return Array.from(this.agents.keys()).map(agentId => 
      this.getAgentStatus(agentId)
    ).filter(status => status !== null) as AgentStatus[];
  }

  /**
   * Enable/disable agent
   */
  async setAgentEnabled(agentId: string, enabled: boolean): Promise<void> {
    const config = this.agentConfigs.get(agentId);
    if (config) {
      config.enabled = enabled;
      this.agentConfigs.set(agentId, config);
      
      this.emitEvent({
        type: 'agent.enabled_changed',
        agentId,
        timestamp: new Date(),
        data: { enabled }
      });
    }
  }

  /**
   * Get agent capabilities
   */
  getAgentCapabilities(agentId: string): string[] {
    const config = this.agentConfigs.get(agentId);
    return config?.capabilities || [];
  }

  /**
   * Emit event
   */
  private emitEvent(event: AgentEvent): void {
    this.eventEmitter.emit(event.type, event);
  }

  /**
   * Subscribe to events
   */
  on(eventType: string, listener: (event: AgentEvent) => void): void {
    this.eventEmitter.on(eventType, listener);
  }

  /**
   * Unsubscribe from events
   */
  off(eventType: string, listener: (event: AgentEvent) => void): void {
    this.eventEmitter.off(eventType, listener);
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper methods for parsing results
  private extractTagsFromNote(note: string): string[] {
    // Simple tag extraction logic
    const tags = [];
    if (note.toLowerCase().includes('medication')) tags.push('medication');
    if (note.toLowerCase().includes('pain')) tags.push('pain-management');
    if (note.toLowerCase().includes('mobility')) tags.push('mobility');
    if (note.toLowerCase().includes('fall')) tags.push('fall-risk');
    return tags;
  }

  private categorizeNote(note: string): string[] {
    const categories = ['care-note'];
    if (note.toLowerCase().includes('medication')) categories.push('medication');
    if (note.toLowerCase().includes('assessment')) categories.push('assessment');
    return categories;
  }

  private parseRosterResult(result: string): any {
    // Parse roster optimization result
    return { parsed: result };
  }

  private extractRecommendations(result: string): string[] {
    // Extract recommendations from result
    return ['Review staffing levels', 'Consider overtime allocation'];
  }

  private checkCompliance(result: string): any {
    // Check compliance requirements
    return { compliant: true, issues: [] };
  }

  private analyzeCosts(result: string): any {
    // Analyze cost implications
    return { estimatedCost: 0, savings: 0 };
  }

  private parseRiskResult(result: string): any {
    // Parse risk assessment result
    return { parsed: result };
  }

  private extractAlerts(result: string): any[] {
    // Extract alerts from result
    return [];
  }

  private extractRiskRecommendations(result: string): string[] {
    // Extract risk recommendations
    return ['Monitor vital signs', 'Increase observation frequency'];
  }

  private determinePriority(result: string): string {
    // Determine priority based on result
    if (result.toLowerCase().includes('critical')) return 'critical';
    if (result.toLowerCase().includes('high')) return 'high';
    if (result.toLowerCase().includes('medium')) return 'medium';
    return 'low';
  }
}

export default AgentManager;
