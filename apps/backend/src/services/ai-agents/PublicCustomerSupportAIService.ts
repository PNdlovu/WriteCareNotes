/**
 * @fileoverview AI agent service for assisting potential customers with product inquiries,
 * @module Ai-agents/PublicCustomerSupportAIService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description AI agent service for assisting potential customers with product inquiries,
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Public Customer Support AI Agent Service
 * @module PublicCustomerSupportAIService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description AI agent service for assisting potential customers with product inquiries,
 * compliance questions, and pre-sales support. No authentication required, public-facing.
 */

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { KnowledgeArticle } from '../../entities/knowledge-base/KnowledgeArticle';
import { Logger } from '@nestjs/common';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export interface PublicAIAgentCapabilities {
  productInformation: {
    featureExplanations: boolean;
    complianceGuidance: boolean;
    integrationSupport: boolean;
    pricingInformation: boolean;
    demoScheduling: boolean;
    technicalSupport: boolean;
  };
  knowledgeRetrieval: {
    faqAccess: boolean;
    documentationSearch: boolean;
    complianceGuides: boolean;
    caseStudies: boolean;
    bestPractices: boolean;
    regulatoryUpdates: boolean;
  };
  customerEngagement: {
    leadQualification: boolean;
    requirementGathering: boolean;
    proposalGeneration: boolean;
    followUpScheduling: boolean;
    escalationHandling: boolean;
    feedbackCollection: boolean;
  };
}

export interface CustomerInquiry {
  sessionId: string;
  inquiryType: 'PRODUCT_INFO' | 'COMPLIANCE' | 'PRICING' | 'DEMO' | 'TECHNICAL' | 'GENERAL';
  message: string;
  userContext?: {
    organizationType?: string;
    organizationSize?: string;
    currentSoftware?: string;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
    contactPreference?: 'EMAIL' | 'PHONE' | 'VIDEO';
  };
  metadata: {
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    sessionDuration: number;
  };
}

export interface AIResponse {
  responseId: string;
  message: string;
  confidence: number;
  knowledgeSources: string[];
  suggestedActions?: SuggestedAction[];
  followUpQuestions?: string[];
  escalationRequired: boolean;
  responseTime: number;
}

export interface SuggestedAction {
  type: 'SCHEDULE_DEMO' | 'DOWNLOAD_BROCHURE' | 'CONTACT_SALES' | 'VIEW_CASE_STUDY' | 'COMPLIANCE_GUIDE';
  label: string;
  url?: string;
  parameters?: Record<string, any>;
}

export interface PublicKnowledgeBase {
  productFeatures: ProductFeature[];
  complianceGuides: ComplianceGuide[];
  faqEntries: FAQEntry[];
  caseStudies: CaseStudy[];
  integrationGuides: IntegrationGuide[];
  pricingInformation: PricingTier[];
}

interface ProductFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  benefits: string[];
  complianceStandards: string[];
  integrations: string[];
  targetAudience: string[];
}

interface ComplianceGuide {
  id: string;
  standard: string;
  jurisdiction: string;
  description: string;
  requirements: string[];
  implementationSteps: string[];
  auditCriteria: string[];
}

interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popularity: number;
  lastUpdated: Date;
}

interface CaseStudy {
  id: string;
  organizationType: string;
  organizationSize: string;
  challenges: string[];
  solutions: string[];
  outcomes: string[];
  roi: string;
  testimonial?: string;
}

interface IntegrationGuide {
  id: string;
  systemName: string;
  integrationType: string;
  difficulty: 'EASY' | 'MODERATE' | 'COMPLEX';
  timeEstimate: string;
  requirements: string[];
  steps: string[];
  supportLevel: string;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  userLimits: number;
  supportLevel: string;
  complianceInclusions: string[];
}

export class PublicCustomerSupportAIService {
  // Logger removed
  privateknowledgeRepository: Repository<KnowledgeArticle>;
  privatenotificationService: NotificationService;
  privateauditService: AuditService;
  privatepublicKnowledgeBase: PublicKnowledgeBase;

  constructor() {
    this.knowledgeRepository = AppDataSource.getRepository(KnowledgeArticle);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
    this.initializePublicKnowledgeBase();
  }

  /**
   * Process customer inquiry and generate AI response
   */
  async processCustomerInquiry(inquiry: CustomerInquiry): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('Processing customer inquiry', {
        sessionId: inquiry.sessionId,
        inquiryType: inquiry.inquiryType,
        messageLength: inquiry.message.length
      });

      // Analyze inquiry intent and context
      const intentAnalysis = await this.analyzeInquiryIntent(inquiry);
      
      // Retrieve relevant knowledge
      const relevantKnowledge = await this.retrieveRelevantKnowledge(inquiry, intentAnalysis);
      
      // Generate AI response
      const response = await this.generateIntelligentResponse(
        inquiry,
        intentAnalysis,
        relevantKnowledge
      );

      // Log interaction for analytics
      await this.logPublicInteraction(inquiry, response);

      // Check if escalation is needed
      if (response.escalationRequired) {
        await this.handleEscalation(inquiry, response);
      }

      const responseTime = Date.now() - startTime;
      response.responseTime = responseTime;

      console.log('Customer inquiry processed successfully', {
        sessionId: inquiry.sessionId,
        responseTime,
        confidence: response.confidence,
        escalationRequired: response.escalationRequired
      });

      return response;

    } catch (error: unknown) {
      console.error('Failed to process customer inquiry', {
        sessionId: inquiry.sessionId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        responseId: `error_${Date.now()}`,
        message: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact our support team directly for immediate assistance.",
        confidence: 0,
        knowledgeSources: [],
        escalationRequired: true,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze inquiry intent using NLP
   */
  private async analyzeInquiryIntent(inquiry: CustomerInquiry): Promise<{
    primaryIntent: string;
    secondaryIntents: string[];
    entities: Record<string, any>;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  }> {
    try {
      // Simulate advanced NLP analysis
      const message = inquiry.message.toLowerCase();
      
      let primaryIntent = 'GENERAL_INQUIRY';
      constsecondaryIntents: string[] = [];
      constentities: Record<string, any> = {};
      
      // Intent classification
      if (message.includes('price') || message.includes('cost') || message.includes('subscription')) {
        primaryIntent = 'PRICING_INQUIRY';
      } else if (message.includes('demo') || message.includes('trial') || message.includes('see')) {
        primaryIntent = 'DEMO_REQUEST';
      } else if (message.includes('compliance') || message.includes('cqc') || message.includes('gdpr')) {
        primaryIntent = 'COMPLIANCE_INQUIRY';
      } else if (message.includes('integration') || message.includes('api') || message.includes('connect')) {
        primaryIntent = 'INTEGRATION_INQUIRY';
      } else if (message.includes('feature') || message.includes('functionality') || message.includes('capability')) {
        primaryIntent = 'FEATURE_INQUIRY';
      }

      // Entity extraction
      if (message.includes('care home') || message.includes('nursing home')) {
        entities.organizationType = 'CARE_HOME';
      }
      if (message.includes('nhs') || message.includes('health service')) {
        entities.nhsIntegration = true;
      }
      
      // Urgency detection
      leturgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (message.includes('urgent') || message.includes('asap') || message.includes('immediately')) {
        urgency = 'HIGH';
      } else if (message.includes('soon') || message.includes('quickly')) {
        urgency = 'MEDIUM';
      }

      // Complexity assessment
      const complexity = message.length > 200 || 
                        (message.match(/\?/g) || []).length > 2 ||
                        message.includes('multiple') ||
                        message.includes('complex') ? 'COMPLEX' : 
                        message.length > 50 ? 'MODERATE' : 'SIMPLE';

      return {
        primaryIntent,
        secondaryIntents,
        entities,
        urgency,
        complexity
      };

    } catch (error: unknown) {
      console.error('Failed to analyze inquiry intent', {
        sessionId: inquiry.sessionId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      return {
        primaryIntent: 'GENERAL_INQUIRY',
        secondaryIntents: [],
        entities: {},
        urgency: 'LOW',
        complexity: 'SIMPLE'
      };
    }
  }

  /**
   * Retrieve relevant knowledge from public knowledge base
   */
  private async retrieveRelevantKnowledge(
    inquiry: CustomerInquiry,
    intentAnalysis: any
  ): Promise<{
    articles: KnowledgeArticle[];
    faqs: FAQEntry[];
    features: ProductFeature[];
    caseStudies: CaseStudy[];
    relevanceScore: number;
  }> {
    try {
      // Search public knowledge base
      const articles = await this.knowledgeRepository.find({
        where: {
          tenantId: null, // Public articles only
          aiSearchable: true
        },
        take: 10
      });

      // Filter relevant FAQs
      const relevantFaqs = this.publicKnowledgeBase.faqEntries
        .filter(faq => this.isRelevantToInquiry(faq, inquiry, intentAnalysis))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5);

      // Find relevant product features
      const relevantFeatures = this.publicKnowledgeBase.productFeatures
        .filter(feature => this.isRelevantToInquiry(feature, inquiry, intentAnalysis))
        .slice(0, 3);

      // Find relevant case studies
      const relevantCaseStudies = this.publicKnowledgeBase.caseStudies
        .filter(caseStudy => this.isRelevantToInquiry(caseStudy, inquiry, intentAnalysis))
        .slice(0, 2);

      const relevanceScore = this.calculateRelevanceScore(
        articles,
        relevantFaqs,
        relevantFeatures,
        relevantCaseStudies,
        intentAnalysis
      );

      return {
        articles,
        faqs: relevantFaqs,
        features: relevantFeatures,
        caseStudies: relevantCaseStudies,
        relevanceScore
      };

    } catch (error: unknown) {
      console.error('Failed to retrieve relevant knowledge', {
        sessionId: inquiry.sessionId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      return {
        articles: [],
        faqs: [],
        features: [],
        caseStudies: [],
        relevanceScore: 0
      };
    }
  }

  /**
   * Generate intelligent response based on inquiry and knowledge
   */
  private async generateIntelligentResponse(
    inquiry: CustomerInquiry,
    intentAnalysis: any,
    knowledge: any
  ): Promise<AIResponse> {
    try {
      let message = '';
      constknowledgeSources: string[] = [];
      constsuggestedActions: SuggestedAction[] = [];
      constfollowUpQuestions: string[] = [];
      let escalationRequired = false;

      // Generate response based on intent
      switch (intentAnalysis.primaryIntent) {
        case 'PRICING_INQUIRY':
          message = await this.generatePricingResponse(knowledge, inquiry);
          suggestedActions.push({
            type: 'SCHEDULE_DEMO',
            label: 'Schedule a personalized demo to see pricing in action',
            url: '/schedule-demo'
          });
          break;

        case 'DEMO_REQUEST':
          message = await this.generateDemoResponse(knowledge, inquiry);
          suggestedActions.push({
            type: 'SCHEDULE_DEMO',
            label: 'Schedule your demo now',
            url: '/schedule-demo'
          });
          break;

        case 'COMPLIANCE_INQUIRY':
          message = await this.generateComplianceResponse(knowledge, inquiry);
          suggestedActions.push({
            type: 'COMPLIANCE_GUIDE',
            label: 'Download comprehensive compliance guide',
            url: '/downloads/compliance-guide'
          });
          break;

        case 'INTEGRATION_INQUIRY':
          message = await this.generateIntegrationResponse(knowledge, inquiry);
          suggestedActions.push({
            type: 'CONTACT_SALES',
            label: 'Speak with our integration specialists',
            url: '/contact-sales'
          });
          break;

        case 'FEATURE_INQUIRY':
          message = await this.generateFeatureResponse(knowledge, inquiry);
          suggestedActions.push({
            type: 'VIEW_CASE_STUDY',
            label: 'See how others use this feature',
            url: '/case-studies'
          });
          break;

        default:
          message = await this.generateGeneralResponse(knowledge, inquiry);
          suggestedActions.push({
            type: 'CONTACT_SALES',
            label: 'Speak with our team for personalized assistance',
            url: '/contact-sales'
          });
      }

      // Add knowledge sources
      knowledge.articles.forEach(article => knowledgeSources.push(`Article: ${article.title}`));
      knowledge.faqs.forEach(faq => knowledgeSources.push(`FAQ: ${faq.question}`));
      knowledge.features.forEach(feature => knowledgeSources.push(`Feature: ${feature.name}`));

      // Generate follow-up questions
      followUpQuestions.push(...this.generateFollowUpQuestions(intentAnalysis, inquiry));

      // Determine if escalation is needed
      escalationRequired = intentAnalysis.urgency === 'HIGH' || 
                          intentAnalysis.complexity === 'COMPLEX' ||
                          knowledge.relevanceScore < 0.5;

      const confidence = this.calculateConfidence(knowledge, intentAnalysis);

      return {
        responseId: `pub_ai_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        message,
        confidence,
        knowledgeSources,
        suggestedActions,
        followUpQuestions,
        escalationRequired,
        responseTime: 0 // Will be set by caller
      };

    } catch (error: unknown) {
      console.error('Failed to generate intelligent response', {
        sessionId: inquiry.sessionId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      return {
        responseId: `error_${Date.now()}`,
        message: "I apologize for the technical difficulty. Let me connect you with our support team for immediate assistance.",
        confidence: 0,
        knowledgeSources: [],
        escalationRequired: true,
        responseTime: 0
      };
    }
  }

  /**
   * Generate pricing-specific response
   */
  private async generatePricingResponse(knowledge: any, inquiry: CustomerInquiry): Promise<string> {
    const pricingTiers = this.publicKnowledgeBase.pricingInformation;
    
    let response = "I'd be happy to help you understand our pricing structure. WriteCareNotes offers flexible subscription tiers designed for different care home sizes and needs:\n\n";
    
    pricingTiers.forEach(tier => {
      response += `**${tier.name}**: £${tier.monthlyPrice}/month\n`;
      response += `- ${tier.description}\n`;
      response += `- Up to ${tier.userLimits} users\n`;
      response += `- ${tier.supportLevel} support\n\n`;
    });

    response += "All tiers include:\n";
    response += "- Full UK compliance (CQC, Care Inspectorate, CIW, RQIA)\n";
    response += "- NHS Digital integration capabilities\n";
    response += "- 24/7 system availability\n";
    response += "- Regular compliance updates\n\n";

    if (inquiry.userContext?.organizationSize) {
      response += `Based on your ${inquiry.userContext.organizationSize} organization, I'd recommend considering our ${this.recommendPricingTier(inquiry.userContext.organizationSize)} tier for optimal value and features.`;
    }

    return response;
  }

  /**
   * Generate demo-specific response
   */
  private async generateDemoResponse(knowledge: any, inquiry: CustomerInquiry): Promise<string> {
    let response = "I'd be delighted to arrange a personalized demonstration of WriteCareNotes! Our demos are tailored to show you exactly how our system can benefit your specific care environment.\n\n";
    
    response += "**What you'll see in the demo:**\n";
    response += "- Complete care documentation workflow\n";
    response += "- NHS Digital integration in action\n";
    response += "- Compliance reporting and monitoring\n";
    response += "- Mobile access for care staff\n";
    response += "- Family portal functionality\n";
    response += "- Real-time analytics and reporting\n\n";

    if (inquiry.userContext?.organizationType) {
      response += `I'll ensure the demo focuses on features most relevant to ${inquiry.userContext.organizationType} operations, including specific compliance requirements and workflow optimizations.\n\n`;
    }

    response += "**Demo Options:**\n";
    response += "- **Live Demo**: 30-45 minutes with our product specialist\n";
    response += "- **Guided Trial**: 7-day access to our demo environment\n";
    response += "- **On-site Demo**: Visit your facility for hands-on demonstration\n\n";

    response += "Would you prefer a specific type of demo, or shall I schedule a brief call to discuss your needs and recommend the best approach?";

    return response;
  }

  /**
   * Generate compliance-specific response
   */
  private async generateComplianceResponse(knowledge: any, inquiry: CustomerInquiry): Promise<string> {
    let response = "Compliance is at the heart of everything we do at WriteCareNotes. Our system is designed to exceed UK healthcare regulatory requirements across all British Isles jurisdictions.\n\n";
    
    response += "**Full Compliance Coverage:**\n";
    response += "- **CQC (England)**: Complete Key Lines of Enquiry (KLOE) support\n";
    response += "- **Care Inspectorate (Scotland)**: Health and Social Care Standards\n";
    response += "- **CIW (Wales)**: Regulation and Inspection of Social Care\n";
    response += "- **RQIA (Northern Ireland)**: Quality standards compliance\n\n";

    response += "**Technical Compliance:**\n";
    response += "- **GDPR**: Full data protection compliance with audit trails\n";
    response += "- **NHS Digital Standards**: DCB0129, DCB0160, DSPT certified\n";
    response += "- **Cyber Essentials Plus**: Government-backed cybersecurity\n";
    response += "- **ISO 27001**: Information security management\n\n";

    response += "**Automated Compliance Features:**\n";
    response += "- Real-time compliance monitoring and alerts\n";
    response += "- Automated report generation for inspections\n";
    response += "- Continuous regulatory update integration\n";
    response += "- Audit trail with tamper-proof logging\n\n";

    const relevantGuides = knowledge.articles.filter(article => 
      article.tags?.some(tag => tag.toLowerCase().includes('compliance'))
    );

    if (relevantGuides.length > 0) {
      response += "**Relevant Resources:**\n";
      relevantGuides.slice(0, 3).forEach(guide => {
        response += `- ${guide.title}\n`;
      });
    }

    return response;
  }

  /**
   * Generate integration-specific response
   */
  private async generateIntegrationResponse(knowledge: any, inquiry: CustomerInquiry): Promise<string> {
    let response = "WriteCareNotes is built for seamless integration with existing healthcare systems and third-party services. Our enterprise-grade API and pre-built connectors make integration straightforward.\n\n";
    
    response += "**Core Integrations:**\n";
    response += "- **NHS Digital & GP Connect**: Direct patient record access\n";
    response += "- **Pharmacy Systems**: Electronic prescribing and medication management\n";
    response += "- **Finance Systems**: Automated billing and financial reporting\n";
    response += "- **HR Systems**: Staff management and payroll integration\n";
    response += "- **Family Communication**: WhatsApp, email, and portal integration\n\n";

    response += "**Integration Capabilities:**\n";
    response += "- **RESTful APIs**: Comprehensive API with OpenAPI documentation\n";
    response += "- **Webhooks**: Real-time event notifications\n";
    response += "- **FHIR R4**: Healthcare interoperability standard\n";
    response += "- **HL7**: Healthcare data exchange protocols\n";
    response += "- **Custom Connectors**: Bespoke integration development\n\n";

    if (inquiry.userContext?.currentSoftware) {
      response += `I see you're currently using ${inquiry.userContext.currentSoftware}. We have specific migration tools and integration guides for transitioning from this system while maintaining data integrity and minimizing disruption.\n\n`;
    }

    response += "**Integration Support:**\n";
    response += "- Dedicated integration team\n";
    response += "- Technical documentation and SDKs\n";
    response += "- Sandbox environment for testing\n";
    response += "- Migration assistance and data validation\n";
    response += "- Ongoing technical support\n\n";

    response += "Would you like to discuss your specific integration requirements, or shall I arrange a technical consultation with our integration specialists?";

    return response;
  }

  /**
   * Generate feature-specific response
   */
  private async generateFeatureResponse(knowledge: any, inquiry: CustomerInquiry): Promise<string> {
    let response = "WriteCareNotes provides comprehensive care home management functionality designed specifically for British Isles healthcare requirements.\n\n";
    
    response += "**Core Care Management:**\n";
    response += "- **Resident Management**: Complete care profiles with medical history\n";
    response += "- **Care Planning**: Personalized care plans with outcome tracking\n";
    response += "- **Medication Management**: Full MAR with interaction checking\n";
    response += "- **Risk Assessment**: Automated risk scoring and mitigation\n";
    response += "- **Incident Management**: Comprehensive reporting and analysis\n\n";

    response += "**Advanced Features:**\n";
    response += "- **AI Care Assistant**: Intelligent care note assistance and suggestions\n";
    response += "- **Predictive Analytics**: Early warning systems for health changes\n";
    response += "- **Mobile Access**: Full-featured mobile apps for care staff\n";
    response += "- **Family Portal**: Secure family communication and updates\n";
    response += "- **Compliance Automation**: Automated compliance monitoring and reporting\n\n";

    response += "**Enterprise Capabilities:**\n";
    response += "- **Multi-site Management**: Centralized management across locations\n";
    response += "- **Workforce Management**: Staff scheduling, training, and performance\n";
    response += "- **Financial Management**: Budgeting, billing, and financial analytics\n";
    response += "- **Quality Assurance**: Continuous quality monitoring and improvement\n";
    response += "- **Business Intelligence**: Advanced reporting and analytics\n\n";

    // Add specific features based on inquiry context
    if (knowledge.features.length > 0) {
      response += "**Specific Features You Might Find Interesting:**\n";
      knowledge.features.forEach(feature => {
        response += `- **${feature.name}**: ${feature.description}\n`;
        if (feature.benefits.length > 0) {
          response += `  Benefits: ${feature.benefits.join(', ')}\n`;
        }
      });
      response += "\n";
    }

    return response;
  }

  /**
   * Generate general response
   */
  private async generateGeneralResponse(knowledge: any, inquiry: CustomerInquiry): Promise<string> {
    let response = "Thank you for your interest in WriteCareNotes! I'm here to help you understand how our comprehensive care home management system can benefit your organization.\n\n";
    
    response += "**WriteCareNotes Overview:**\n";
    response += "WriteCareNotes is the UK's leading care home management system, designed specifically for British Isles healthcare requirements. We provide a complete digital solution that streamlines care delivery while ensuring full regulatory compliance.\n\n";

    response += "**Key Benefits:**\n";
    response += "- **Comprehensive Care Management**: From admission to discharge\n";
    response += "- **Full UK Compliance**: CQC, Care Inspectorate, CIW, RQIA ready\n";
    response += "- **NHS Integration**: Direct GP Connect and NHS Digital integration\n";
    response += "- **Mobile-First Design**: Access anywhere, anytime\n";
    response += "- **Family Engagement**: Secure family portal and communication\n";
    response += "- **AI-Powered Assistance**: Intelligent care documentation and insights\n\n";

    if (knowledge.relevanceScore > 0.3 && knowledge.faqs.length > 0) {
      response += "**You might also be interested in:**\n";
      knowledge.faqs.slice(0, 2).forEach(faq => {
        response += `- ${faq.question}\n`;
      });
      response += "\n";
    }

    response += "I can provide detailed information about:\n";
    response += "- Product features and capabilities\n";
    response += "- Pricing and subscription options\n";
    response += "- Compliance and regulatory support\n";
    response += "- Integration possibilities\n";
    response += "- Implementation timeline and support\n\n";

    response += "What specific aspect would you like to explore further?";

    return response;
  }

  /**
   * Check if content is relevant to inquiry
   */
  private isRelevantToInquiry(content: any, inquiry: CustomerInquiry, intentAnalysis: any): boolean {
    const message = inquiry.message.toLowerCase();
    const contentText = JSON.stringify(content).toLowerCase();
    
    // Check for keyword matches
    const keywords = message.split(/\s+/).filter(word => word.length > 3);
    const matchCount = keywords.filter(keyword => contentText.includes(keyword)).length;
    
    return matchCount > 0 || 
           (content.category && message.includes(content.category.toLowerCase())) ||
           (content.tags && content.tags.some(tag => message.includes(tag.toLowerCase())));
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(
    articles: any[],
    faqs: any[],
    features: any[],
    caseStudies: any[],
    intentAnalysis: any
  ): number {
    const totalContent = articles.length + faqs.length + features.length + caseStudies.length;
    const maxPossibleContent = 20; // Maximum expected relevant content
    
    let baseScore = Math.min(totalContent / maxPossibleContent, 1);
    
    // Boost score for high-confidence intent analysis
    if (intentAnalysis.primaryIntent !== 'GENERAL_INQUIRY') {
      baseScore *= 1.2;
    }
    
    // Reduce score for high complexity without sufficient content
    if (intentAnalysis.complexity === 'COMPLEX' && totalContent < 5) {
      baseScore *= 0.7;
    }
    
    return Math.min(baseScore, 1);
  }

  /**
   * Calculate response confidence
   */
  private calculateConfidence(knowledge: any, intentAnalysis: any): number {
    let confidence = knowledge.relevanceScore;
    
    // Boost confidence for specific intents with good knowledge match
    if (intentAnalysis.primaryIntent !== 'GENERAL_INQUIRY' && knowledge.relevanceScore > 0.7) {
      confidence = Math.min(confidence * 1.3, 0.95);
    }
    
    // Reduce confidence for complex queries with limited knowledge
    if (intentAnalysis.complexity === 'COMPLEX' && knowledge.relevanceScore < 0.5) {
      confidence *= 0.6;
    }
    
    return Math.max(Math.min(confidence, 0.95), 0.1);
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(intentAnalysis: any, inquiry: CustomerInquiry): string[] {
    constquestions: string[] = [];
    
    switch (intentAnalysis.primaryIntent) {
      case 'PRICING_INQUIRY':
        questions.push("How many residents does your care home accommodate?");
        questions.push("Are you interested in multi-site licensing?");
        questions.push("Do you need NHS Digital integration included?");
        break;
        
      case 'DEMO_REQUEST':
        questions.push("Would you prefer a live demo or guided trial access?");
        questions.push("Are there specific features you'd like to focus on?");
        questions.push("How many team members would join the demo?");
        break;
        
      case 'COMPLIANCE_INQUIRY':
        questions.push("Which regulatory body will be conducting your next inspection?");
        questions.push("Are you looking for help with a specific compliance area?");
        questions.push("Do you need assistance with current compliance gaps?");
        break;
        
      case 'INTEGRATION_INQUIRY':
        questions.push("What systems are you currently using that need integration?");
        questions.push("Do you have specific data migration requirements?");
        questions.push("What's your preferred timeline for implementation?");
        break;
        
      default:
        questions.push("What's your biggest challenge with your current care management system?");
        questions.push("Are you looking to replace an existing system or implementing for the first time?");
        questions.push("What size care home or organization are you working with?");
    }
    
    return questions.slice(0, 2); // Limit to 2 follow-up questions
  }

  /**
   * Recommend pricing tier based on organization size
   */
  private recommendPricingTier(organizationSize: string): string {
    switch (organizationSize.toLowerCase()) {
      case 'small':
      case 'under 20 beds':
        return 'Essential';
      case 'medium':
      case '20-50 beds':
        return 'Professional';
      case 'large':
      case 'over 50 beds':
      case 'multi-site':
        return 'Enterprise';
      default:
        return 'Professional';
    }
  }

  /**
   * Handle escalation to human support
   */
  private async handleEscalation(inquiry: CustomerInquiry, response: AIResponse): Promise<void> {
    try {
      // Notify sales team about escalation
      await this.notificationService.sendNotification({
        message: 'Notification: SALES ESCALATION',
        type: 'SALES_ESCALATION',
        recipients: ['sales@writecarenotes.com'],
        subject: 'Customer Inquiry Escalation Required',
        content: `A customer inquiry requires human assistance.
        
Session ID: ${inquiry.sessionId}
Inquiry Type: ${inquiry.inquiryType}
Customer Message: ${inquiry.message}
AI Confidence: ${response.confidence}
Urgency: ${inquiry.userContext?.urgency || 'UNKNOWN'}

Please follow up within 2 hours for high urgency, 24 hours for others.`,
        metadata: {
          sessionId: inquiry.sessionId,
          escalationType: 'AI_AGENT_ESCALATION'
        }
      });

      console.log('Escalation handled successfully', {
        sessionId: inquiry.sessionId,
        responseId: response.responseId
      });

    } catch (error: unknown) {
      console.error('Failed to handle escalation', {
        sessionId: inquiry.sessionId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Log public interaction for analytics
   */
  private async logPublicInteraction(inquiry: CustomerInquiry, response: AIResponse): Promise<void> {
    try {
      await this.auditService.logActivity({
        userId: null, // Public interaction
        tenantId: null,
        action: 'PUBLIC_AI_INTERACTION',
        entityType: 'AI_AGENT',
        entityId: response.responseId,
        details: {
          sessionId: inquiry.sessionId,
          inquiryType: inquiry.inquiryType,
          responseConfidence: response.confidence,
          knowledgeSourcesCount: response.knowledgeSources.length,
          escalationRequired: response.escalationRequired,
          responseTime: response.responseTime
        },
        ipAddress: inquiry.metadata.ipAddress,
        userAgent: inquiry.metadata.userAgent
      });

    } catch (error: unknown) {
      console.error('Failed to log public interaction', {
        sessionId: inquiry.sessionId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Initialize public knowledge base
   */
  private async initializePublicKnowledgeBase(): Promise<void> {
    try {
      this.publicKnowledgeBase = {
        productFeatures: await this.loadProductFeatures(),
        complianceGuides: await this.loadComplianceGuides(),
        faqEntries: await this.loadFAQEntries(),
        caseStudies: await this.loadCaseStudies(),
        integrationGuides: await this.loadIntegrationGuides(),
        pricingInformation: await this.loadPricingInformation()
      };

      console.log('Public knowledge base initialized successfully', {
        featuresCount: this.publicKnowledgeBase.productFeatures.length,
        faqCount: this.publicKnowledgeBase.faqEntries.length,
        caseStudiesCount: this.publicKnowledgeBase.caseStudies.length
      });

    } catch (error: unknown) {
      console.error('Failed to initialize public knowledge base', {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Load product features
   */
  private async loadProductFeatures(): Promise<ProductFeature[]> {
    return [
      {
        id: 'care_management',
        name: 'Comprehensive Care Management',
        description: 'Complete resident care lifecycle management from admission to discharge',
        category: 'Care Delivery',
        benefits: ['Improved care quality', 'Regulatory compliance', 'Efficient workflows'],
        complianceStandards: ['CQC', 'Care Inspectorate', 'CIW', 'RQIA'],
        integrations: ['NHS Digital', 'GP Connect', 'Pharmacy systems'],
        targetAudience: ['Care homes', 'Nursing homes', 'Domiciliary care']
      },
      {
        id: 'medication_management',
        name: 'Advanced Medication Management',
        description: 'Electronic MAR with interaction checking and regulatory compliance',
        category: 'Clinical Safety',
        benefits: ['Reduced medication errors', 'Automated compliance', 'Clinical decision support'],
        complianceStandards: ['MHRA', 'NICE Guidelines', 'CQC Medication Standards'],
        integrations: ['NHS eRedBag', 'Pharmacy systems', 'Clinical systems'],
        targetAudience: ['Nursing homes', 'Care homes with nursing', 'Clinical teams']
      },
      {
        id: 'nhs_integration',
        name: 'NHS Digital Integration',
        description: 'Direct integration with NHS systems for seamless data exchange',
        category: 'Healthcare Integration',
        benefits: ['Reduced data entry', 'Improved accuracy', 'Better care coordination'],
        complianceStandards: ['NHS Digital Standards', 'DSPT', 'FHIR R4'],
        integrations: ['GP Connect', 'NHS Digital', 'Summary Care Record'],
        targetAudience: ['All care providers', 'NHS partners', 'Clinical teams']
      }
    ];
  }

  /**
   * Load compliance guides
   */
  private async loadComplianceGuides(): Promise<ComplianceGuide[]> {
    return [
      {
        id: 'cqc_compliance',
        standard: 'CQC Key Lines of Enquiry',
        jurisdiction: 'England',
        description: 'Complete CQC compliance framework and evidence requirements',
        requirements: ['Safe care delivery', 'Effective care', 'Caring approach', 'Responsive services', 'Well-led organization'],
        implementationSteps: ['Assessment setup', 'Evidence collection', 'Continuous monitoring', 'Inspection preparation'],
        auditCriteria: ['Documentary evidence', 'Staff competence', 'Resident outcomes', 'Family feedback']
      },
      {
        id: 'gdpr_compliance',
        standard: 'GDPR Data Protection',
        jurisdiction: 'UK/EU',
        description: 'Comprehensive GDPR compliance for healthcare data processing',
        requirements: ['Lawful basis', 'Consent management', 'Data minimization', 'Security measures'],
        implementationSteps: ['Data audit', 'Privacy policies', 'Security implementation', 'Staff training'],
        auditCriteria: ['Data protection impact assessments', 'Breach procedures', 'Individual rights', 'Technical measures']
      }
    ];
  }

  /**
   * Load FAQ entries
   */
  private async loadFAQEntries(): Promise<FAQEntry[]> {
    return [
      {
        id: 'faq_1',
        question: 'How does WriteCareNotes ensure CQC compliance?',
        answer: 'WriteCareNotes is built with CQC compliance at its core, providing automated evidence collection, real-time compliance monitoring, and inspection-ready reports across all Key Lines of Enquiry.',
        category: 'Compliance',
        tags: ['CQC', 'compliance', 'inspection', 'evidence'],
        popularity: 95,
        lastUpdated: new Date()
      },
      {
        id: 'faq_2',
        question: 'Can WriteCareNotes integrate with our existing NHS systems?',
        answer: 'Yes, WriteCareNotes provides comprehensive NHS integration including GP Connect, NHS Digital, and Summary Care Record access, ensuring seamless data exchange and reduced administrative burden.',
        category: 'Integration',
        tags: ['NHS', 'integration', 'GP Connect', 'interoperability'],
        popularity: 88,
        lastUpdated: new Date()
      },
      {
        id: 'faq_3',
        question: 'How secure is resident data in WriteCareNotes?',
        answer: 'WriteCareNotes employs enterprise-grade security including AES-256 encryption, zero-trust architecture, GDPR compliance, and Cyber Essentials Plus certification to protect all resident data.',
        category: 'Security',
        tags: ['security', 'GDPR', 'encryption', 'data protection'],
        popularity: 92,
        lastUpdated: new Date()
      }
    ];
  }

  /**
   * Load case studies
   */
  private async loadCaseStudies(): Promise<CaseStudy[]> {
    return [
      {
        id: 'case_study_1',
        organizationType: 'Nursing Home',
        organizationSize: '60 beds',
        challenges: ['Manual medication records', 'CQC compliance preparation', 'Family communication'],
        solutions: ['Electronic MAR implementation', 'Automated compliance monitoring', 'Family portal deployment'],
        outcomes: ['50% reduction in medication errors', 'Outstanding CQC rating', '95% family satisfaction'],
        roi: '300% ROI within 18 months',
        testimonial: 'WriteCareNotes transformed our care delivery and gave us confidence in our CQC inspection.'
      },
      {
        id: 'case_study_2',
        organizationType: 'Care Home Group',
        organizationSize: '5 sites, 200 beds total',
        challenges: ['Multi-site coordination', 'Inconsistent care standards', 'Regulatory compliance'],
        solutions: ['Centralized management platform', 'Standardized care protocols', 'Automated compliance reporting'],
        outcomes: ['Unified care standards', 'Improved efficiency', 'Consistent compliance across all sites'],
        roi: '250% ROI within 24 months',
        testimonial: 'The multi-site management capabilities gave us unprecedented visibility and control.'
      }
    ];
  }

  /**
   * Load integration guides
   */
  private async loadIntegrationGuides(): Promise<IntegrationGuide[]> {
    return [
      {
        id: 'nhs_integration',
        systemName: 'NHS Digital & GP Connect',
        integrationType: 'Healthcare Interoperability',
        difficulty: 'MODERATE',
        timeEstimate: '2-4 weeks',
        requirements: ['NHS Digital approval', 'DSPT compliance', 'FHIR R4 capability'],
        steps: ['NHS Digital registration', 'Security assessment', 'API configuration', 'Testing and validation'],
        supportLevel: 'Full technical support with dedicated integration team'
      },
      {
        id: 'pharmacy_integration',
        systemName: 'Pharmacy Management Systems',
        integrationType: 'Clinical Integration',
        difficulty: 'EASY',
        timeEstimate: '1-2 weeks',
        requirements: ['Pharmacy system API access', 'HL7 FHIR support'],
        steps: ['API credential setup', 'Medication mapping', 'Testing workflows', 'Go-live support'],
        supportLevel: 'Standard technical support with documentation'
      }
    ];
  }

  /**
   * Load pricing information
   */
  private async loadPricingInformation(): Promise<PricingTier[]> {
    return [
      {
        id: 'essential',
        name: 'Essential',
        description: 'Perfect for smaller care homes getting started with digital care management',
        monthlyPrice: 299,
        features: ['Up to 30 residents', 'Core care management', 'Basic compliance', 'Email support'],
        userLimits: 10,
        supportLevel: 'Email support',
        complianceInclusions: ['CQC basic', 'GDPR', 'Basic reporting']
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Comprehensive solution for established care homes requiring full compliance',
        monthlyPrice: 599,
        features: ['Up to 100 residents', 'Full care management', 'NHS integration', 'Phone support'],
        userLimits: 25,
        supportLevel: 'Phone and email support',
        complianceInclusions: ['Full CQC', 'NHS Digital', 'Advanced reporting', 'Family portal']
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Complete solution for care home groups and large organizations',
        monthlyPrice: 1299,
        features: ['Unlimited residents', 'Multi-site management', 'Advanced analytics', 'Dedicated support'],
        userLimits: 100,
        supportLevel: 'Dedicated account manager',
        complianceInclusions: ['All compliance standards', 'Custom reporting', 'Advanced integrations', 'Training included']
      }
    ];
  }

  /**
   * Get public knowledge base summary
   */
  async getPublicKnowledgeBaseSummary(): Promise<{
    totalArticles: number;
    totalFaqs: number;
    totalFeatures: number;
    totalCaseStudies: number;
    lastUpdated: Date;
  }> {
    try {
      const publicArticles = await this.knowledgeRepository.count({
        where: { tenantId: null, aiSearchable: true }
      });

      return {
        totalArticles: publicArticles,
        totalFaqs: this.publicKnowledgeBase.faqEntries.length,
        totalFeatures: this.publicKnowledgeBase.productFeatures.length,
        totalCaseStudies: this.publicKnowledgeBase.caseStudies.length,
        lastUpdated: new Date()
      };

    } catch (error: unknown) {
      console.error('Failed to get knowledge base summary', {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      return {
        totalArticles: 0,
        totalFaqs: 0,
        totalFeatures: 0,
        totalCaseStudies: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Generate session ID for tracking
   */
  private async generateAssistantSessionId(): Promise<string> {
    return `pub_ai_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}

export default PublicCustomerSupportAIService;
