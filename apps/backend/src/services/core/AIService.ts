/**
 * @fileoverview a i Service
 * @module Core/AIService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description a i Service
 */

import OpenAI from 'openai';
import { configService } from './ConfigurationService';
import { loggerService } from './LoggerService';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface SummarizationRequest {
  text: string;
  maxLength?: number;
  focusAreas?: string[];
}

interface SentimentAnalysisRequest {
  text: string;
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions?: string[];
}

interface ComplianceAnalysisRequest {
  content: string;
  regulations?: string[];
}

interface ComplianceResult {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
  confidence: number;
}

interface MedicalInsightRequest {
  patientNotes: string;
  medicalHistory?: string;
  currentSymptoms?: string;
}

interface MedicalInsight {
  keyFindings: string[];
  recommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  followUpSuggestions: string[];
}

class AIService {
  private staticinstance: AIService;
  privateopenai: OpenAI | null = null;
  privateazureOpenAI: OpenAI | null = null;
  privateisEnabled: boolean = false;

  private const ructor() {
    this.initializeServices();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeServices(): void {
    const aiConfig = configService.getAI();

    try {
      // Initialize OpenAI
      if (aiConfig.openai.apiKey) {
        this.openai = new OpenAI({
          apiKey: aiConfig.openai.apiKey,
          baseURL: aiConfig.openai.baseURL,
          timeout: aiConfig.openai.timeout
        });
        this.isEnabled = true;
        loggerService.info('OpenAI service initialized successfully');
      }

      // Initialize Azure OpenAI
      if (aiConfig.azureOpenAI.apiKey && aiConfig.azureOpenAI.endpoint) {
        this.azureOpenAI = new OpenAI({
          apiKey: aiConfig.azureOpenAI.apiKey,
          baseURL: `${aiConfig.azureOpenAI.endpoint}/openai/deployments/${aiConfig.azureOpenAI.deploymentName}`,
          defaultQuery: { 'api-version': aiConfig.azureOpenAI.apiVersion },
          defaultHeaders: {
            'api-key': aiConfig.azureOpenAI.apiKey,
          }
        });
        this.isEnabled = true;
        loggerService.info('Azure OpenAI service initialized successfully');
      }

      if (!this.isEnabled) {
        loggerService.warn('No AI services configured. AI features will be disabled.');
      }
    } catch (error) {
      loggerService.error('Failed to initialize AI services', error as Error);
      this.isEnabled = false;
    }
  }

  public isAIEnabled(): boolean {
    return this.isEnabled;
  }

  private getActiveClient(): OpenAI {
    if (this.azureOpenAI) {
      return this.azureOpenAI;
    }
    if (this.openai) {
      return this.openai;
    }
    throw new Error('No AI service available');
  }

  private async makeRequest<T>(
    operation: string,
    requestFn: () => Promise<T>,
    context?: any
  ): Promise<T> {
    if (!this.isEnabled) {
      throw new Error('AI service is not enabled');
    }

    const startTime = Date.now();
    
    try {
      loggerService.debug(`AI requeststarted: ${operation}`, { context });
      
      const result = await requestFn();
      const duration = Date.now() - startTime;
      
      loggerService.performance(`AI ${operation}`, duration, { context });
      loggerService.info(`AI requestcompleted: ${operation}`, { duration, context });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      loggerService.error(`AI requestfailed: ${operation}`, error as Error, { duration, context });
      throw error;
    }
  }

  public async summarizeText(request: SummarizationRequest): Promise<string> {
    return this.makeRequest('summarizeText', async () => {
      const client = this.getActiveClient();
      const aiConfig = configService.getAI();

      const systemPrompt = `You are a medical AI assistant specializing in summarizing patient care notes and communications. 
      Create concise, accurate summaries that preserve critical medical information, patient concerns, and care decisions.
      ${request.focusAreas ? `Focus on theseareas: ${request.focusAreas.join(', ')}` : ''}
      ${request.maxLength ? `Keep the summary under ${request.maxLength} words.` : 'Keep the summary concise but comprehensive.'}`;

      const response = await client.chat.completions.create({
        model: aiConfig.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please summarize the followingtext:\n\n${request.text}` }
        ],
        max_tokens: aiConfig.openai.maxTokens,
        temperature: aiConfig.openai.temperature
      });

      return response.choices[0]?.message?.content || '';
    }, request);
  }

  public async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentResult> {
    return this.makeRequest('analyzeSentiment', async () => {
      const client = this.getActiveClient();
      const aiConfig = configService.getAI();

      const systemPrompt = `You are a sentiment analysis AI specialized in healthcare communications. 
      Analyze the sentiment and emotions in patient communications, care notes, and feedback.
      Respond with a JSON objectcontaining:
      - sentiment: "positive", "negative", or "neutral"
      - confidence: a number between 0 and 1
      - emotions: an array of detected emotions (e.g., ["anxious", "hopeful", "frustrated"])`;

      const response = await client.chat.completions.create({
        model: aiConfig.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze the sentiment of thistext:\n\n${request.text}` }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        return JSON.parse(content);
      } catch {
        // Fallback parsing if JSON is not properly formatted
        const sentiment = content.toLowerCase().includes('positive') ? 'positive' :
                         content.toLowerCase().includes('negative') ? 'negative' : 'neutral';
        
        return {
          sentiment: sentiment as 'positive' | 'negative' | 'neutral',
          confidence: 0.7,
          emotions: []
        };
      }
    }, request);
  }

  public async analyzeCompliance(request: ComplianceAnalysisRequest): Promise<ComplianceResult> {
    return this.makeRequest('analyzeCompliance', async () => {
      const client = this.getActiveClient();
      const aiConfig = configService.getAI();

      const regulations = request.regulations || ['GDPR', 'HIPAA', 'Care Quality Commission (CQC)', 'NHS Data Security Standards'];
      
      const systemPrompt = `You are a healthcare compliance AI assistant. Analyze content for compliance withregulations: ${regulations.join(', ')}.
      Respond with a JSON objectcontaining:
      - compliant: boolean indicating overall compliance
      - issues: array of specific compliance issues found
      - recommendations: array of recommendations to address issues
      - confidence: number between 0 and 1 indicating confidence in analysis`;

      const response = await client.chat.completions.create({
        model: aiConfig.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this content forcompliance:\n\n${request.content}` }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          compliant: true,
          issues: [],
          recommendations: [],
          confidence: 0.5
        };
      }
    }, request);
  }

  public async generateMedicalInsights(request: MedicalInsightRequest): Promise<MedicalInsight> {
    return this.makeRequest('generateMedicalInsights', async () => {
      const client = this.getActiveClient();
      const aiConfig = configService.getAI();

      const systemPrompt = `You are a medical AI assistant that helps healthcare professionals analyze patient information.
      Provide insights based on patient notes, but always emphasize that your analysis is for reference only and 
      should not replace professional medical judgment.
      
      Respond with a JSON objectcontaining:
      - keyFindings: array of important findings from the notes
      - recommendations: array of potential care recommendations
      - urgencyLevel: "low", "medium", "high", or "urgent" based on apparent severity
      - followUpSuggestions: array of suggested follow-up actions
      
      IMPORTANT: Always include disclaimers about professional medical oversight.`;

      const contextText = [
        `Patient Notes: ${request.patientNotes}`,
        request.medicalHistory ? `Medical History: ${request.medicalHistory}` : '',
        request.currentSymptoms ? `Current Symptoms: ${request.currentSymptoms}` : ''
      ].filter(Boolean).join('\n\n');

      const response = await client.chat.completions.create({
        model: aiConfig.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this patientinformation:\n\n${contextText}` }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          keyFindings: ['Analysis could not be completed'],
          recommendations: ['Please review manually'],
          urgencyLevel: 'medium',
          followUpSuggestions: ['Manual review recommended']
        };
      }
    }, request);
  }

  public async generateCareNotes(
    patientInfo: string,
    sessionSummary: string,
    previousNotes?: string
  ): Promise<string> {
    return this.makeRequest('generateCareNotes', async () => {
      const client = this.getActiveClient();
      const aiConfig = configService.getAI();

      const systemPrompt = `You are a healthcare documentation AI assistant. Generate professional care notes based on patient interactions and session summaries.
      The notes shouldbe:
      - Clear and concise
      - Medically accurate terminology
      - Include relevant observations
      - Note any concerns or recommendations
      - Follow professional healthcare documentation standards`;

      const contextText = [
        `Patient Information: ${patientInfo}`,
        `Session Summary: ${sessionSummary}`,
        previousNotes ? `Previous Notes: ${previousNotes}` : ''
      ].filter(Boolean).join('\n\n');

      const response = await client.chat.completions.create({
        model: aiConfig.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate care notes basedon:\n\n${contextText}` }
        ],
        max_tokens: aiConfig.openai.maxTokens,
        temperature: 0.4
      });

      return response.choices[0]?.message?.content || '';
    }, { patientInfo, sessionSummary });
  }

  public async customChat(messages: ChatMessage[]): Promise<string> {
    return this.makeRequest('customChat', async () => {
      const client = this.getActiveClient();
      const aiConfig = configService.getAI();

      const response = await client.chat.completions.create({
        model: aiConfig.openai.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: aiConfig.openai.maxTokens,
        temperature: aiConfig.openai.temperature
      });

      return response.choices[0]?.message?.content || '';
    }, { messageCount: messages.length });
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const client = this.getActiveClient();
      const response = await client.chat.completions.create({
        model: configService.getAI().openai.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      loggerService.error('AI service health check failed', error as Error);
      return false;
    }
  }
}

export const aiService = AIService.getInstance();
export {
  AIService,
  ChatMessage,
  SummarizationRequest,
  SentimentAnalysisRequest,
  SentimentResult,
  ComplianceAnalysisRequest,
  ComplianceResult,
  MedicalInsightRequest,
  MedicalInsight
};
export default aiService;
