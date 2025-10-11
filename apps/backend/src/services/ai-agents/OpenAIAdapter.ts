import { LLMIntegrationService, LLMRequest, LLMResponse } from './LLMIntegrationService';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'transcription' | 'note_generation' | 'roster_optimization' | 'risk_assessment' | 'general';
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptContext {
  [key: string]: any;
}

export interface PromptResult {
  response: string;
  confidence: number;
  tokensUsed: number;
  processingTime: number;
  metadata: {
    templateId: string;
    variables: PromptContext;
    model: string;
    temperature: number;
  };
}

export interface AgentCapabilities {
  transcription: boolean;
  noteGeneration: boolean;
  rosterOptimization: boolean;
  riskAssessment: boolean;
  sentimentAnalysis: boolean;
  entityExtraction: boolean;
  summarization: boolean;
  classification: boolean;
}

export class OpenAIAdapter {
  private llmService: LLMIntegrationService;
  private promptTemplates: Map<string, PromptTemplate>;
  private capabilities: AgentCapabilities;

  constructor() {
    this.llmService = new LLMIntegrationService();
    this.promptTemplates = new Map();
    this.capabilities = {
      transcription: true,
      noteGeneration: true,
      rosterOptimization: true,
      riskAssessment: true,
      sentimentAnalysis: true,
      entityExtraction: true,
      summarization: true,
      classification: true
    };
    
    this.initializePromptTemplates();
  }

  /**
   * Initialize prompt templates for different AI agent tasks
   */
  private initializePromptTemplates(): void {
    // Voice-to-Note Templates
    this.addPromptTemplate({
      id: 'voice_transcription',
      name: 'Voice Transcription',
      description: 'Transcribe audio to text with medical context awareness',
      template: `You are a medical transcription specialist. Transcribe the following audio content accurately, paying special attention to medical terminology, medication names, and care-related information.

Audio Content: {audio_content}

Instructions:
- Maintain medical terminology accuracy
- Preserve important details about resident condition
- Include timestamps for key events
- Flag any unclear or uncertain words with [UNCLEAR]
- Format as clear, readable text

Transcription:`,
      variables: ['audio_content'],
      category: 'transcription',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addPromptTemplate({
      id: 'care_note_generation',
      name: 'Care Note Generation',
      description: 'Generate structured care notes from transcription',
      template: `You are a care documentation specialist. Generate a professional care note from the following transcription.

Transcription: {transcription}
Resident ID: {resident_id}
Staff Member: {staff_member}
Context: {context}

Instructions:
- Create a structured SOAP note format
- Include subjective observations, objective findings, assessment, and plan
- Use professional medical terminology
- Highlight any concerns or action items
- Maintain confidentiality and accuracy
- Include relevant timestamps

Care Note:`,
      variables: ['transcription', 'resident_id', 'staff_member', 'context'],
      category: 'note_generation',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Smart Roster Templates
    this.addPromptTemplate({
      id: 'roster_optimization',
      name: 'Roster Optimization',
      description: 'Optimize staff scheduling based on requirements and constraints',
      template: `You are a workforce optimization specialist. Analyze the following roster requirements and constraints to suggest an optimal schedule.

Requirements:
- Staff needed: {staff_requirements}
- Shift times: {shift_times}
- Skills required: {required_skills}
- Budget constraints: {budget_constraints}

Constraints:
- Staff availability: {staff_availability}
- Maximum hours per staff: {max_hours}
- Minimum rest between shifts: {min_rest_hours}
- Compliance requirements: {compliance_requirements}

Current roster: {current_roster}

Instructions:
- Optimize for coverage and cost efficiency
- Ensure compliance with labor laws
- Balance workload fairly
- Consider staff preferences where possible
- Identify potential issues or conflicts
- Suggest alternative arrangements if needed

Optimized Roster:`,
      variables: ['staff_requirements', 'shift_times', 'required_skills', 'budget_constraints', 'staff_availability', 'max_hours', 'min_rest_hours', 'compliance_requirements', 'current_roster'],
      category: 'roster_optimization',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Risk Assessment Templates
    this.addPromptTemplate({
      id: 'risk_assessment',
      name: 'Risk Assessment',
      description: 'Assess risk factors from IoT data and care observations',
      template: `You are a healthcare risk assessment specialist. Analyze the following data to assess potential risks and provide recommendations.

IoT Data:
- Vital signs: {vital_signs}
- Movement patterns: {movement_data}
- Environmental data: {environmental_data}
- Alert history: {alert_history}

Care Observations:
- Recent notes: {recent_notes}
- Medication changes: {medication_changes}
- Behavioral observations: {behavioral_observations}
- Family concerns: {family_concerns}

Resident Profile:
- Age: {age}
- Medical conditions: {medical_conditions}
- Mobility status: {mobility_status}
- Cognitive status: {cognitive_status}

Instructions:
- Assess risk level (low, medium, high, critical)
- Identify specific risk factors
- Provide evidence-based recommendations
- Suggest monitoring frequency
- Flag any immediate concerns
- Consider fall risk, medication interactions, and health deterioration

Risk Assessment:`,
      variables: ['vital_signs', 'movement_data', 'environmental_data', 'alert_history', 'recent_notes', 'medication_changes', 'behavioral_observations', 'family_concerns', 'age', 'medical_conditions', 'mobility_status', 'cognitive_status'],
      category: 'risk_assessment',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // General Analysis Templates
    this.addPromptTemplate({
      id: 'sentiment_analysis',
      name: 'Sentiment Analysis',
      description: 'Analyze sentiment and emotional tone in text',
      template: `Analyze the sentiment and emotional tone of the following text:

Text: {text}
Context: {context}

Instructions:
- Determine overall sentiment (positive, negative, neutral)
- Identify emotional indicators
- Assess confidence level
- Note any concerning language
- Consider context and implications

Sentiment Analysis:`,
      variables: ['text', 'context'],
      category: 'general',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addPromptTemplate({
      id: 'entity_extraction',
      name: 'Entity Extraction',
      description: 'Extract key entities and information from text',
      template: `Extract key entities and information from the following text:

Text: {text}
Entity types to extract: {entity_types}

Instructions:
- Extract people, places, medications, conditions, times, actions
- Provide confidence scores for each entity
- Identify relationships between entities
- Flag any uncertain extractions
- Format as structured data

Entity Extraction:`,
      variables: ['text', 'entity_types'],
      category: 'general',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Add a new prompt template
   */
  addPromptTemplate(template: PromptTemplate): void {
    this.promptTemplates.set(template.id, template);
  }

  /**
   * Get a prompt template by ID
   */
  getPromptTemplate(templateId: string): PromptTemplate | null {
    return this.promptTemplates.get(templateId) || null;
  }

  /**
   * Execute a prompt template with context
   */
  async executePrompt(
    templateId: string,
    context: PromptContext,
    options: {
      temperature?: number;
      maxTokens?: number;
      securityLevel?: 'PUBLIC' | 'TENANT' | 'SENSITIVE';
      tenantId?: string;
    } = {}
  ): Promise<PromptResult> {
    const template = this.getPromptTemplate(templateId);
    if (!template) {
      throw new Error(`Prompt template not found: ${templateId}`);
    }

    // Validate required variables
    this.validateTemplateVariables(template, context);

    // Render the prompt
    const renderedPrompt = this.renderTemplate(template, context);

    // Get system prompt based on category
    const systemPrompt = this.getSystemPrompt(template.category);

    // Create LLM request
    const llmRequest: LLMRequest = {
      provider: this.llmService.getDefaultProvider(options.securityLevel === 'TENANT' ? 'TENANT' : 'PUBLIC'),
      systemPrompt,
      userMessage: renderedPrompt,
      context,
      tenantId: options.tenantId,
      securityLevel: options.securityLevel || 'TENANT',
      maxTokens: options.maxTokens,
      temperature: options.temperature
    };

    // Execute the request
    const startTime = Date.now();
    const response: LLMResponse = await this.llmService.generateResponse(llmRequest);
    const processingTime = Date.now() - startTime;

    return {
      response: response.message,
      confidence: response.confidence,
      tokensUsed: response.tokensUsed,
      processingTime,
      metadata: {
        templateId,
        variables: context,
        model: response.model,
        temperature: options.temperature || 0.7
      }
    };
  }

  /**
   * Transcribe audio using AI
   */
  async transcribeAudio(
    audioContent: string,
    context: PromptContext = {},
    options: {
      tenantId?: string;
      securityLevel?: 'PUBLIC' | 'TENANT' | 'SENSITIVE';
    } = {}
  ): Promise<PromptResult> {
    return await this.executePrompt('voice_transcription', {
      audio_content: audioContent,
      ...context
    }, {
      ...options,
      temperature: 0.1, // Low temperature for accuracy
      maxTokens: 2000
    });
  }

  /**
   * Generate care note from transcription
   */
  async generateCareNote(
    transcription: string,
    context: PromptContext,
    options: {
      tenantId?: string;
      securityLevel?: 'PUBLIC' | 'TENANT' | 'SENSITIVE';
    } = {}
  ): Promise<PromptResult> {
    return await this.executePrompt('care_note_generation', {
      transcription,
      ...context
    }, {
      ...options,
      temperature: 0.3, // Moderate temperature for creativity
      maxTokens: 1500
    });
  }

  /**
   * Optimize roster using AI
   */
  async optimizeRoster(
    rosterData: PromptContext,
    options: {
      tenantId?: string;
      securityLevel?: 'PUBLIC' | 'TENANT' | 'SENSITIVE';
    } = {}
  ): Promise<PromptResult> {
    return await this.executePrompt('roster_optimization', rosterData, {
      ...options,
      temperature: 0.2, // Low temperature for consistency
      maxTokens: 3000
    });
  }

  /**
   * Assess risk using AI
   */
  async assessRisk(
    riskData: PromptContext,
    options: {
      tenantId?: string;
      securityLevel?: 'PUBLIC' | 'TENANT' | 'SENSITIVE';
    } = {}
  ): Promise<PromptResult> {
    return await this.executePrompt('risk_assessment', riskData, {
      ...options,
      temperature: 0.1, // Low temperature for accuracy
      maxTokens: 2000
    });
  }

  /**
   * Analyze sentiment
   */
  async analyzeSentiment(
    text: string,
    context: PromptContext = {},
    options: {
      tenantId?: string;
      securityLevel?: 'PUBLIC' | 'TENANT' | 'SENSITIVE';
    } = {}
  ): Promise<PromptResult> {
    return await this.executePrompt('sentiment_analysis', {
      text,
      ...context
    }, {
      ...options,
      temperature: 0.1,
      maxTokens: 500
    });
  }

  /**
   * Extract entities from text
   */
  async extractEntities(
    text: string,
    entityTypes: string[] = ['person', 'medication', 'condition', 'time', 'action'],
    context: PromptContext = {},
    options: {
      tenantId?: string;
      securityLevel?: 'PUBLIC' | 'TENANT' | 'SENSITIVE';
    } = {}
  ): Promise<PromptResult> {
    return await this.executePrompt('entity_extraction', {
      text,
      entity_types: entityTypes.join(', '),
      ...context
    }, {
      ...options,
      temperature: 0.1,
      maxTokens: 1000
    });
  }

  /**
   * Get system prompt for category
   */
  private getSystemPrompt(category: string): string {
    const systemPrompts = {
      transcription: `You are a medical transcription specialist with expertise in healthcare documentation. Your role is to accurately transcribe audio content while maintaining medical terminology precision and care context awareness.`,
      
      note_generation: `You are a care documentation specialist with expertise in healthcare record keeping. Your role is to generate professional, structured care notes that meet clinical standards and regulatory requirements.`,
      
      roster_optimization: `You are a workforce optimization specialist with expertise in healthcare staffing and scheduling. Your role is to create efficient, compliant, and cost-effective staff schedules that meet care requirements.`,
      
      risk_assessment: `You are a healthcare risk assessment specialist with expertise in patient safety and risk management. Your role is to identify potential risks and provide evidence-based recommendations for risk mitigation.`,
      
      general: `You are an AI assistant specialized in healthcare and care home management. Your role is to provide accurate, helpful, and contextually appropriate responses while maintaining professional standards and confidentiality.`
    };

    return systemPrompts[category] || systemPrompts.general;
  }

  /**
   * Render template with context variables
   */
  private renderTemplate(template: PromptTemplate, context: PromptContext): string {
    let rendered = template.template;
    
    for (const variable of template.variables) {
      const value = context[variable] || `{${variable}}`;
      const regex = new RegExp(`{${variable}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    
    return rendered;
  }

  /**
   * Validate template variables
   */
  private validateTemplateVariables(template: PromptTemplate, context: PromptContext): void {
    const missingVariables = template.variables.filter(variable => !(variable in context));
    
    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
    }
  }

  /**
   * Get all prompt templates
   */
  getAllPromptTemplates(): PromptTemplate[] {
    return Array.from(this.promptTemplates.values());
  }

  /**
   * Get prompt templates by category
   */
  getPromptTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.promptTemplates.values()).filter(template => template.category === category);
  }

  /**
   * Update prompt template
   */
  updatePromptTemplate(templateId: string, updates: Partial<PromptTemplate>): void {
    const template = this.promptTemplates.get(templateId);
    if (template) {
      const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
      this.promptTemplates.set(templateId, updatedTemplate);
    }
  }

  /**
   * Delete prompt template
   */
  deletePromptTemplate(templateId: string): boolean {
    return this.promptTemplates.delete(templateId);
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapabilities {
    return this.capabilities;
  }

  /**
   * Check if a capability is available
   */
  hasCapability(capability: keyof AgentCapabilities): boolean {
    return this.capabilities[capability];
  }

  /**
   * Get adapter health status
   */
  getHealthStatus(): {
    llmServiceAvailable: boolean;
    promptTemplatesCount: number;
    capabilities: AgentCapabilities;
  } {
    return {
      llmServiceAvailable: this.llmService.hasAvailableProviders(),
      promptTemplatesCount: this.promptTemplates.size,
      capabilities: this.capabilities
    };
  }
}

export default OpenAIAdapter;