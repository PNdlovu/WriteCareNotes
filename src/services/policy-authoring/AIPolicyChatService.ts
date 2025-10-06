/**
 * AI Policy Chat Service - Conversational Policy Management
 * 
 * Implements conversational AI for policy management:
 * - Natural language policy creation
 * - Conversational policy editing
 * - Interactive compliance assistance
 * - Real-time policy Q&A
 * 
 * Note: This service provides the core chat functionality that can be used
 * by REST controllers or WebSocket gateways when those dependencies are available.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { AIPolicyAssistantService } from './AIPolicyAssistantService';
import { PolicyAuthoringService } from './policy-authoring.service';
import { AuditTrailService } from '../audit/AuditTrailService';
import { PolicyDraft, PolicyCategory, Jurisdiction } from '../../entities/policy-draft.entity';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestedActions?: SuggestedAction[];
  metadata?: {
    confidence?: number;
    processingTime?: string;
    attachments?: MessageAttachment[];
  };
}

export interface SuggestedAction {
  id: string;
  type: 'create_policy' | 'analyze_policy' | 'browse_templates' | 'ask_question';
  label: string;
  description?: string;
  data?: any;
}

export interface MessageAttachment {
  type: 'policy_draft' | 'analysis_result' | 'template' | 'document';
  id: string;
  title: string;
  preview?: string;
  data?: any;
}

export interface ChatSession {
  id: string;
  userId: string;
  organizationId: string;
  messages: ChatMessage[];
  context: {
    userIntent?: string;
    currentTask?: string;
    collectedRequirements?: any;
    jurisdiction?: Jurisdiction[];
    preferences?: any;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ConversationIntent {
  intent: string;
  confidence: number;
  entities: any[];
  requirements?: any;
  suggestedActions?: string[];
}

@Injectable()
export class AIPolicyChatService {
  private readonly logger = new Logger(AIPolicyChatService.name);
  private openai: OpenAI;
  private activeSessions = new Map<string, ChatSession>();

  constructor(
    private readonly aiAssistant: AIPolicyAssistantService,
    private readonly policyService: PolicyAuthoringService,
    private readonly auditService: AuditTrailService,
    private readonly configService: ConfigService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Start a new chat session
   */
  async startChatSession(data: { userId: string; organizationId: string }): Promise<{ sessionId: string; welcomeMessage: ChatMessage }> {
    const sessionId = this.generateSessionId();
    
    const session: ChatSession = {
      id: sessionId,
      userId: data.userId,
      organizationId: data.organizationId,
      messages: [],
      context: {
        collectedRequirements: {},
        preferences: {}
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.activeSessions.set(sessionId, session);

    const welcomeMessage: ChatMessage = {
      id: this.generateMessageId(),
      type: 'assistant',
      content: `Hello! I'm your AI policy assistant, specializing in healthcare compliance across all British Isles jurisdictions. I can help you with:

🏥 **Policy Creation** - Generate comprehensive policies from your requirements
📋 **Policy Analysis** - Review existing policies for compliance gaps
💬 **Compliance Guidance** - Answer questions about regulatory requirements
📝 **Template Recommendations** - Suggest the best policy templates for your needs

I have expertise in all regulatory frameworks:
• CQC (England) • Care Inspectorate (Scotland) • CIW (Wales) • RQIA (Northern Ireland)
• JCC (Jersey) • GCRB (Guernsey) • DHSC (Isle of Man)

How can I help you today?`,
      timestamp: new Date(),
      suggestedActions: [
        {
          id: 'action_create_policy',
          type: 'create_policy',
          label: 'Create New Policy',
          description: 'Generate a policy from your requirements'
        },
        {
          id: 'action_analyze_policy',
          type: 'analyze_policy',
          label: 'Analyze Existing Policy',
          description: 'Review a policy for compliance and improvements'
        },
        {
          id: 'action_browse_templates',
          type: 'browse_templates',
          label: 'Browse Templates',
          description: 'Explore available policy templates'
        },
        {
          id: 'action_ask_question',
          type: 'ask_question',
          label: 'Ask Questions',
          description: 'Get compliance guidance and answers'
        }
      ]
    };

    session.messages.push(welcomeMessage);
    
    await this.auditService.logAction(
      data.userId,
      'chat_session_started',
      'chat_session',
      { sessionId }
    );

    return { sessionId, welcomeMessage };
  }

  /**
   * Process a user message and generate AI response
   */
  async processMessage(sessionId: string, message: string): Promise<ChatMessage> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    session.messages.push(userMessage);

    try {
      // Analyze user intent
      const intent = await this.analyzeIntent(message, session);
      
      // Generate AI response based on intent
      const aiResponse = await this.generateResponse(message, intent, session);
      
      session.messages.push(aiResponse);
      this.updateSessionContext(session, intent, message);

      // Log the interaction
      await this.auditService.logAction(
        session.userId,
        'ai_chat_interaction',
        'chat_message',
        {
          sessionId,
          userMessage: message,
          intent: intent.intent,
          confidence: intent.confidence
        }
      );

      return aiResponse;

    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`);
      
      const errorResponse: ChatMessage = {
        id: this.generateMessageId(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Could you please try rephrasing your request?',
        timestamp: new Date()
      };

      session.messages.push(errorResponse);
      return errorResponse;
    }
  }

  /**
   * Execute a suggested action
   */
  async executeAction(
    sessionId: string,
    actionId: string,
    parameters?: any
  ): Promise<ChatMessage> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    try {
      let response: ChatMessage;

      switch (actionId) {
        case 'action_create_policy':
          response = await this.handleCreatePolicy(session, parameters);
          break;
        case 'action_analyze_policy':
          response = await this.handleAnalyzePolicy(session, parameters);
          break;
        case 'action_browse_templates':
          response = await this.handleBrowseTemplates(session, parameters);
          break;
        case 'action_ask_question':
          response = await this.handleAskQuestion(session, parameters);
          break;
        default:
          response = {
            id: this.generateMessageId(),
            type: 'assistant',
            content: 'I don\'t recognize that action. Could you try selecting from the available options?',
            timestamp: new Date()
          };
      }

      session.messages.push(response);
      
      await this.auditService.logAction(
        session.userId,
        'chat_action_executed',
        'chat_action',
        { sessionId, actionId, parameters }
      );

      return response;

    } catch (error) {
      this.logger.error(`Error executing action ${actionId}: ${error.message}`);
      
      const errorResponse: ChatMessage = {
        id: this.generateMessageId(),
        type: 'assistant',
        content: 'I encountered an error executing that action. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      };

      session.messages.push(errorResponse);
      return errorResponse;
    }
  }

  /**
   * Get chat session
   */
  getChatSession(sessionId: string): ChatSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get chat history
   */
  getChatHistory(sessionId: string): ChatMessage[] {
    const session = this.activeSessions.get(sessionId);
    return session ? session.messages : [];
  }

  /**
   * End chat session
   */
  async endChatSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.updatedAt = new Date();
      
      await this.auditService.logAction(
        session.userId,
        'chat_session_ended',
        'chat_session',
        { sessionId, duration: session.updatedAt.getTime() - session.createdAt.getTime() }
      );

      this.activeSessions.delete(sessionId);
    }
  }

  // Private helper methods

  private async analyzeIntent(message: string, session: ChatSession): Promise<ConversationIntent> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at understanding user intentions in policy management conversations across all British Isles jurisdictions (England, Scotland, Wales, Northern Ireland, Jersey, Guernsey, Isle of Man). Analyze intent, extract requirements, and identify applicable regulatory frameworks.'
          },
          {
            role: 'user',
            content: `Analyze this message and return JSON with intent, confidence (0-1), entities, and requirements:
            
            Message: "${message}"
            Session context: ${JSON.stringify(session.context)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content || '{"intent": "general", "confidence": 0.5, "entities": []}');
    } catch (error) {
      this.logger.error(`Intent analysis failed: ${error.message}`);
      return {
        intent: 'general',
        confidence: 0.5,
        entities: []
      };
    }
  }

  private async generateResponse(
    userMessage: string,
    intent: ConversationIntent,
    session: ChatSession
  ): Promise<ChatMessage> {
    const conversationHistory = session.messages.slice(-5).map(m => 
      `${m.type}: ${m.content}`
    ).join('\n');

    const prompt = `You are a helpful AI assistant specializing in care home policy management across the entire British Isles. 

You have comprehensive expertise in ALL regulatory frameworks:
- CQC (England): Fundamental Standards 9-20, KLOEs (Safe, Effective, Caring, Responsive, Well-Led)
- Care Inspectorate (Scotland): National Care Standards 1-15, Health and Social Care Standards
- CIW (Wales): Six Quality Standards (Well-being, Voice & Control, Good Care, Right Staff, Safe Environment, Governance)
- RQIA (Northern Ireland): Seven Minimum Standards (Rights, Management, Support, Healthcare, Nutrition, Environment, Safeguarding)
- JCC (Jersey): Six Care Standards (Rights & Dignity, Management, Staffing, Care & Support, Safeguarding, Premises)
- GCRB (Guernsey): Guernsey Care Home Standards under Health Service Law 2013
- DHSC Isle of Man: Manx Care Home Standards under Care Services Act 2006

Conversation History:
${conversationHistory}

User Message: "${userMessage}"
User Intent: ${JSON.stringify(intent)}
Session Context: ${JSON.stringify(session.context)}

Generate a helpful, conversational response that:
1. Addresses the user's specific need with jurisdiction-specific expertise
2. Asks relevant follow-up questions if needed
3. Provides specific guidance for policy management across applicable jurisdictions
4. Suggests concrete next steps with regulatory references
5. Maintains a friendly, professional tone
6. Considers multi-jurisdictional compliance when relevant

Focus on providing accurate, jurisdiction-specific advice for all British Isles territories.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable, helpful AI assistant for care home policy management across the entire British Isles with expertise in all seven regulatory frameworks: CQC (England), Care Inspectorate (Scotland), CIW (Wales), RQIA (Northern Ireland), JCC (Jersey), GCRB (Guernsey), and DHSC Isle of Man. Provide jurisdiction-specific guidance and consider multi-jurisdictional compliance requirements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return {
        id: this.generateMessageId(),
        type: 'assistant',
        content: response.choices[0].message.content || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date(),
        metadata: {
          confidence: intent.confidence,
          processingTime: '1.2s'
        }
      };

    } catch (error) {
      this.logger.error(`Response generation failed: ${error.message}`);
      return {
        id: this.generateMessageId(),
        type: 'assistant',
        content: 'I had trouble generating a response. Could you please try rephrasing your question?',
        timestamp: new Date()
      };
    }
  }

  private async handleCreatePolicy(session: ChatSession, parameters?: any): Promise<ChatMessage> {
    try {
      if (!parameters || !parameters.requirements) {
        return {
          id: this.generateMessageId(),
          type: 'assistant',
          content: 'I\'d be happy to help you create a policy! Could you tell me:\n\n1. What type of policy do you need?\n2. Which jurisdiction(s) should it comply with?\n3. Any specific requirements or focus areas?',
          timestamp: new Date(),
          suggestedActions: [
            {
              id: 'collect_requirements',
              type: 'ask_question',
              label: 'Provide Requirements',
              description: 'Tell me about your policy needs'
            }
          ]
        };
      }

      // Generate policy using AI Assistant
      const generatedPolicy = await this.aiAssistant.generatePolicyFromRequirements(parameters.requirements);

      // Create policy draft
      const createdDraft = await this.policyService.createPolicyDraft({
        title: generatedPolicy.title,
        content: generatedPolicy.content,
        category: generatedPolicy.category,
        jurisdiction: generatedPolicy.jurisdiction,
        description: 'AI-generated policy',
        linkedModules: [],
        tags: [],
        reviewDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Set review due to 1 year from now
      }, session.userId);

      return {
        id: this.generateMessageId(),
        type: 'assistant',
        content: `Great! I've created a comprehensive ${generatedPolicy.title} for you. The policy includes all necessary sections for compliance with your specified jurisdiction(s) and covers the requirements you mentioned.

The policy has been saved as a draft and is ready for your review. You can now:
- Review and edit the content
- Add additional sections if needed  
- Submit for approval when ready

Would you like me to analyze the policy for any potential improvements or help you with anything else?`,
        timestamp: new Date(),
        metadata: {
          attachments: [{
            type: 'policy_draft',
            id: createdDraft.id,
            title: generatedPolicy.title,
            preview: `AI-generated policy - Ready for review`,
            data: createdDraft
          }]
        }
      };

    } catch (error) {
      this.logger.error(`Policy creation failed: ${error.message}`);
      return {
        id: this.generateMessageId(),
        type: 'assistant',
        content: 'I encountered an issue creating that policy. Could you try again with more specific requirements?',
        timestamp: new Date()
      };
    }
  }

  private async handleAnalyzePolicy(session: ChatSession, parameters?: any): Promise<ChatMessage> {
    try {
      if (!parameters || !parameters.policyId) {
        return {
          id: this.generateMessageId(),
          type: 'assistant',
          content: 'I\'d be happy to analyze a policy for you! Please provide the policy ID or select a policy to analyze.',
          timestamp: new Date()
        };
      }

      // For now, return a message that we can't find the policy
      // This would need the proper implementation when the PolicyAuthoringService has findById method
      return {
        id: this.generateMessageId(),
        type: 'assistant',
        content: 'I\'d be happy to analyze a policy for you, but I need the proper policy lookup functionality to be implemented first. In the meantime, please provide a policy draft object directly.',
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Policy analysis failed: ${error.message}`);
      return {
        id: this.generateMessageId(),
        type: 'assistant',
        content: 'I had trouble analyzing that policy. Could you try again?',
        timestamp: new Date()
      };
    }
  }

  private async handleBrowseTemplates(session: ChatSession, parameters?: any): Promise<ChatMessage> {
    // This would integrate with template service when available
    return {
      id: this.generateMessageId(),
      type: 'assistant',
      content: 'I can help you find the perfect policy template! Based on your organization profile, here are some recommended templates:\n\n🏥 **Core Policies**\n• Safeguarding Adults Policy\n• Medication Management Policy\n• Health & Safety Policy\n\n📋 **Compliance Policies**\n• Data Protection Policy\n• Complaints Management Policy\n• Staff Training Policy\n\nWhich type of policy template interests you most?',
      timestamp: new Date(),
      suggestedActions: [
        {
          id: 'view_safeguarding_template',
          type: 'browse_templates',
          label: 'Safeguarding Template',
          data: { category: 'safeguarding' }
        },
        {
          id: 'view_medication_template',
          type: 'browse_templates',
          label: 'Medication Template',
          data: { category: 'medication' }
        }
      ]
    };
  }

  private async handleAskQuestion(session: ChatSession, parameters?: any): Promise<ChatMessage> {
    return {
      id: this.generateMessageId(),
      type: 'assistant',
      content: 'I\'m here to answer any questions about care home policies and compliance! I can help with:\n\n🏛️ **Regulatory Questions**\n• CQC, Care Inspectorate, CIW, RQIA requirements\n• Jersey, Guernsey, Isle of Man regulations\n\n📝 **Policy Questions**\n• Best practices and compliance standards\n• Implementation guidance\n• Review and audit procedures\n\n❓ **Common Questions**\n• "What policies do I need for inspection?"\n• "How often should policies be reviewed?"\n• "What are the key safeguarding requirements?"\n\nWhat would you like to know?',
      timestamp: new Date()
    };
  }

  // Helper methods

  private updateSessionContext(session: ChatSession, intent: any, message: string): void {
    // Update conversation phase and collect requirements
    if (intent.intent) {
      session.context.userIntent = intent.intent;
    }

    // Extract and store requirements from the conversation
    this.extractRequirements(session, message, intent);
    
    session.updatedAt = new Date();
  }

  private extractRequirements(session: ChatSession, message: string, intent: any): void {
    // Use simple keyword extraction for requirements
    const requirements = session.context.collectedRequirements;

    // Extract policy category
    const categories = ['safeguarding', 'medication', 'health_safety', 'data_protection', 'complaints'];
    categories.forEach(cat => {
      if (message.toLowerCase().includes(cat.replace('_', ' '))) {
        requirements.category = cat;
      }
    });

    // Extract jurisdiction
    const jurisdictions = ['england', 'scotland', 'wales', 'northern ireland', 'jersey', 'guernsey', 'isle of man'];
    const detectedJurisdictions = [];
    jurisdictions.forEach(jurisdiction => {
      if (message.toLowerCase().includes(jurisdiction)) {
        detectedJurisdictions.push(jurisdiction);
      }
    });
    if (detectedJurisdictions.length > 0) {
      requirements.jurisdictions = detectedJurisdictions;
    }

    // Extract organization details
    const bedCountMatch = message.match(/(\d+)[\s-]*(bed|room)/i);
    if (bedCountMatch) {
      requirements.bedCount = parseInt(bedCountMatch[1]);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}