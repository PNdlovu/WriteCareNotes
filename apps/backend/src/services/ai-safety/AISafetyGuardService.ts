/**
 * @fileoverview a i safety guard Service
 * @module Ai-safety/AISafetyGuardService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description a i safety guard Service
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

export interface ValidationResult {
  safe: boolean;
  confidence: number;
  warnings: SafetyWarning[];
  flags: SafetyFlag[];
}

export interface SafetyWarning {
  type: 'hallucination' | 'low_confidence' | 'unverified_claim' | 'bias' | 'inappropriate_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
}

export interface SafetyFlag {
  type: string;
  description: string;
  requiresHumanReview: boolean;
}

export interface ConfidenceScore {
  overallConfidence: number; // 0-1
  factors: ConfidenceFactors;
  reliability: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  recommendedAction: 'reject' | 'human_review' | 'proceed_with_caution' | 'proceed';
}

export interface ConfidenceFactors {
  knowledgeBaseMatch: number;
  regulatoryAlignment: number;
  responseSpecificity: number;
  validationScore: number;
  modelConfidence: number;
}

export interface PolicyContext {
  jurisdiction: string[];
  category: string;
  criticalCompliance?: boolean;
  organizationType?: string;
}

@Injectable()
export class AISafetyGuardService {
  private readonly logger = new Logger(AISafetyGuardService.name);
  private readonly openai: OpenAI;

  // Regulatory knowledge base for validation
  private readonly regulatoryKnowledge = new Map<string, any>([
    ['cqc_england', {
      fundamentalStandards: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      kloes: ['safe', 'effective', 'caring', 'responsive', 'well_led'],
      lastUpdated: '2024-10-01'
    }],
    ['care_inspectorate_scotland', {
      nationalStandards: Array.from({length: 15}, (_, i) => i + 1),
      qualityThemes: ['care_support', 'environment', 'staffing', 'management'],
      lastUpdated: '2024-10-01'
    }],
    ['ciw_wales', {
      qualityStandards: [1, 2, 3, 4, 5, 6],
      wellbeingOutcomes: true,
      lastUpdated: '2024-10-01'
    }],
    ['rqia_northern_ireland', {
      minimumStandards: [1, 2, 3, 4, 5, 6, 7],
      qualityFramework: ['safe', 'effective', 'compassionate', 'well_led'],
      lastUpdated: '2024-10-01'
    }]
  ]);

  // Dangerous patterns that should never appear in healthcare policy advice
  private readonly dangerousPatterns = [
    /diagnose|diagnosis/i,
    /prescribe|prescription/i,
    /medical treatment/i,
    /cure|healing/i,
    /emergency medical/i,
    /life-threatening/i
  ];

  // Bias detection patterns
  private readonly biasPatterns = [
    /all \w+ (people|patients|residents)/i,
    /(always|never) (trust|believe)/i,
    /typical \w+ (behavior|attitude)/i
  ];

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Validate user input for safety and appropriateness
   */
  async validateInput(input: string, context: PolicyContext): Promise<ValidationResult> {
    const checks = await Promise.all([
      this.checkForInjectionAttempts(input),
      this.checkInappropriateContent(input),
      this.validateContextRelevance(input, context),
      this.checkForBiasedLanguage(input)
    ]);

    const warnings = checks.flatMap(check => check.warnings || []);
    const flags = checks.flatMap(check => check.flags || []);
    const safe = checks.every(check => check.safe);
    const confidence = checks.reduce((sum, check) => sum + check.confidence, 0) / checks.length;

    return {
      safe,
      confidence,
      warnings,
      flags
    };
  }

  /**
   * Validate AI response for accuracy and safety
   */
  async validateResponse(
    response: string, 
    context: PolicyContext,
    originalQuery?: string
  ): Promise<ValidationResult> {
    
    const checks = await Promise.all([
      this.detectHallucinations(response, context),
      this.validateRegulatoryReferences(response, context),
      this.checkResponseCoherence(response, originalQuery),
      this.detectBias(response),
      this.checkForDangerousAdvice(response),
      this.validateFactualClaims(response, context)
    ]);

    const warnings = checks.flatMap(check => check.warnings || []);
    const flags = checks.flatMap(check => check.flags || []);
    const safe = checks.every(check => check.safe);
    const confidence = checks.reduce((sum, check) => sum + check.confidence, 0) / checks.length;

    return {
      safe,
      confidence,
      warnings,
      flags
    };
  }

  /**
   * Calculate comprehensive confidence score
   */
  calculateConfidence(
    response: string,
    context: PolicyContext,
    validationResults: ValidationResult[]
  ): ConfidenceScore {
    
    const factors: ConfidenceFactors = {
      knowledgeBaseMatch: this.assessKnowledgeBaseMatch(response, context),
      regulatoryAlignment: this.assessRegulatoryAlignment(response, context),
      responseSpecificity: this.assessResponseSpecificity(response),
      validationScore: this.calculateValidationScore(validationResults),
      modelConfidence: this.extractModelConfidence(response)
    };

    // Weighted confidence calculation
    const overallConfidence = (
      factors.knowledgeBaseMatch * 0.3 +
      factors.regulatoryAlignment * 0.25 +
      factors.responseSpecificity * 0.15 +
      factors.validationScore * 0.2 +
      factors.modelConfidence * 0.1
    );

    return {
      overallConfidence,
      factors,
      reliability: this.categorizeReliability(overallConfidence),
      recommendedAction: this.getRecommendedAction(overallConfidence, context)
    };
  }

  /**
   * Check if human review is required
   */
  async evaluateNeedsHumanReview(
    response: string,
    confidence: ConfidenceScore,
    context: PolicyContext
  ): Promise<{ requiresReview: boolean; priority: string; reasons: string[] }> {
    
    const triggers = [
      { condition: confidence.overallConfidence < 0.7, reason: 'Low confidence score' },
      { condition: context.criticalCompliance === true, reason: 'Critical compliance area' },
      { condition: this.detectComplexLegalQuestions(response), reason: 'Complex legal considerations' },
      { condition: this.detectCrossJurisdictionalComplexity(context), reason: 'Multi-jurisdictional complexity' },
      { condition: this.detectHighRiskPolicyArea(context), reason: 'High-risk policy area' },
      { condition: this.detectUncertainLanguage(response), reason: 'Response contains uncertainty' }
    ];

    const activeTriggers = triggers.filter(trigger => trigger.condition);
    const requiresReview = activeTriggers.length > 0;

    let priority = 'low';
    if (confidence.overallConfidence < 0.5 || context.criticalCompliance) {
      priority = 'high';
    } else if (confidence.overallConfidence < 0.7 || activeTriggers.length > 2) {
      priority = 'medium';
    }

    return {
      requiresReview,
      priority,
      reasons: activeTriggers.map(trigger => trigger.reason)
    };
  }

  // Private helper methods

  private async checkForInjectionAttempts(input: string): Promise<{ safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] }> {
    const injectionPatterns = [
      /ignore\s+previous\s+instructions/i,
      /you\s+are\s+now\s+a/i,
      /forget\s+everything/i,
      /system\s*:\s*/i,
      /\[SYSTEM\]/i,
      /act\s+as\s+if/i,
      /pretend\s+to\s+be/i,
      /roleplay\s+as/i
    ];

    const suspicious = injectionPatterns.some(pattern => pattern.test(input));
    
    return {
      safe: !suspicious,
      confidence: suspicious ? 0.1 : 0.95,
      warnings: suspicious ? [{
        type: 'inappropriate_content',
        severity: 'high',
        message: 'Potential prompt injection attempt detected',
        suggestion: 'Please rephrase your query focusing on policy management needs'
      }] : [],
      flags: suspicious ? [{
        type: 'injection_attempt',
        description: 'Input contains patterns consistent with prompt injection',
        requiresHumanReview: true
      }] : []
    };
  }

  private async checkInappropriateContent(input: string): Promise<{ safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] }> {
    // Check for inappropriate content using OpenAI moderation
    try {
      const moderation = await this.openai.moderations.create({
        input: input
      });

      const flagged = moderation.results[0].flagged;
      const categories = moderation.results[0].categories;

      const warnings: SafetyWarning[] = [];
      const flags: SafetyFlag[] = [];

      if (flagged) {
        const flaggedCategories = Object.entries(categories)
          .filter(([_, flagged]) => flagged)
          .map(([category, _]) => category);

        warnings.push({
          type: 'inappropriate_content',
          severity: 'high',
          message: `Content flagged for: ${flaggedCategories.join(', ')}`,
          suggestion: 'Please provide appropriate policy-related content only'
        });

        flags.push({
          type: 'content_moderation',
          description: `Inappropriate content detected: ${flaggedCategories.join(', ')}`,
          requiresHumanReview: true
        });
      }

      return {
        safe: !flagged,
        confidence: flagged ? 0.1 : 0.95,
        warnings,
        flags
      };

    } catch (error) {
      this.logger.error(`Content moderation failed: ${error.message}`);
      return {
        safe: true,
        confidence: 0.5,
        warnings: [],
        flags: []
      };
    }
  }

  private validateContextRelevance(input: string, context: PolicyContext): { safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] } {
    const policyKeywords = [
      'policy', 'procedure', 'compliance', 'regulation', 'standard',
      'care', 'health', 'safety', 'safeguarding', 'medication',
      'cqc', 'care inspectorate', 'ciw', 'rqia'
    ];

    const relevantKeywords = policyKeywords.filter(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    );

    const relevanceScore = relevantKeywords.length / policyKeywords.length;
    const isRelevant = relevanceScore > 0.1 || input.length < 50; // Allow short queries

    return {
      safe: true, // Context relevance doesn't make content unsafe
      confidence: isRelevant ? 0.8 : 0.4,
      warnings: !isRelevant ? [{
        type: 'unverified_claim',
        severity: 'low',
        message: 'Query may not be related to policy management',
        suggestion: 'Consider focusing on policy, compliance, or regulatory topics'
      }] : [],
      flags: []
    };
  }

  private checkForBiasedLanguage(input: string): { safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] } {
    const biasDetected = this.biasPatterns.some(pattern => pattern.test(input));

    return {
      safe: !biasDetected,
      confidence: biasDetected ? 0.6 : 0.9,
      warnings: biasDetected ? [{
        type: 'bias',
        severity: 'medium',
        message: 'Potential biased language detected',
        suggestion: 'Consider using more inclusive and neutral language'
      }] : [],
      flags: []
    };
  }

  private async detectHallucinations(response: string, context: PolicyContext): Promise<{ safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] }> {
    // Check for specific regulatory claims
    const regulatoryClaimsPattern = /(regulation|standard|requirement)\s+(\d+)/gi;
    const claims = response.match(regulatoryClaimsPattern) || [];

    const warnings: SafetyWarning[] = [];
    const flags: SafetyFlag[] = [];

    for (const claim of claims) {
      if (!this.validateRegulatoryClaim(claim, context)) {
        warnings.push({
          type: 'hallucination',
          severity: 'high',
          message: `Unverified regulatory claim: "${claim}"`,
          suggestion: 'Please verify this regulatory reference with official sources'
        });
      }
    }

    // Check for made-up statistics
    const statisticsPattern = /(\d+)%|\d+\s+out\s+of\s+\d+/gi;
    const statistics = response.match(statisticsPattern) || [];

    if (statistics.length > 0 && !this.containsSourceReferences(response)) {
      warnings.push({
        type: 'unverified_claim',
        severity: 'medium',
        message: 'Statistics mentioned without source references',
        suggestion: 'Verify statistics with official sources before using in policies'
      });
    }

    const hallucinationRisk = warnings.length > 0;

    return {
      safe: !hallucinationRisk,
      confidence: hallucinationRisk ? 0.4 : 0.8,
      warnings,
      flags
    };
  }

  private validateRegulatoryReferences(response: string, context: PolicyContext): { safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] } {
    const warnings: SafetyWarning[] = [];
    
    // Check jurisdiction-specific references
    for (const jurisdiction of context.jurisdiction) {
      const knowledge = this.regulatoryKnowledge.get(jurisdiction);
      if (!knowledge) {
        warnings.push({
          type: 'unverified_claim',
          severity: 'medium',
          message: `Unknown jurisdiction referenced: ${jurisdiction}`,
          suggestion: 'Verify jurisdiction information with official sources'
        });
      }
    }

    return {
      safe: warnings.length === 0,
      confidence: warnings.length === 0 ? 0.9 : 0.6,
      warnings,
      flags: []
    };
  }

  private checkResponseCoherence(response: string, originalQuery?: string): { safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] } {
    // Basic coherence checks
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    // Check for extreme sentence lengths (potential incoherence)
    const hasExtremelyLongSentences = sentences.some(s => s.length > 500);
    const hasExtremelyShortSentences = sentences.some(s => s.trim().length < 10);
    
    const coherenceIssues = hasExtremelyLongSentences || hasExtremelyShortSentences;

    return {
      safe: !coherenceIssues,
      confidence: coherenceIssues ? 0.5 : 0.8,
      warnings: coherenceIssues ? [{
        type: 'low_confidence',
        severity: 'low',
        message: 'Response may have coherence issues',
        suggestion: 'Review response for clarity and coherence'
      }] : [],
      flags: []
    };
  }

  private detectBias(response: string): { safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] } {
    const biasDetected = this.biasPatterns.some(pattern => pattern.test(response));

    return {
      safe: !biasDetected,
      confidence: biasDetected ? 0.6 : 0.9,
      warnings: biasDetected ? [{
        type: 'bias',
        severity: 'medium',
        message: 'Potential bias detected in response',
        suggestion: 'Review response for neutral, inclusive language'
      }] : [],
      flags: []
    };
  }

  private checkForDangerousAdvice(response: string): { safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] } {
    const dangerousContent = this.dangerousPatterns.some(pattern => pattern.test(response));

    return {
      safe: !dangerousContent,
      confidence: dangerousContent ? 0.1 : 0.95,
      warnings: dangerousContent ? [{
        type: 'inappropriate_content',
        severity: 'critical',
        message: 'Response contains potentially dangerous medical advice',
        suggestion: 'Focus on policy guidance only, not medical advice'
      }] : [],
      flags: dangerousContent ? [{
        type: 'dangerous_advice',
        description: 'Response contains medical advice beyond policy scope',
        requiresHumanReview: true
      }] : []
    };
  }

  private async validateFactualClaims(response: string, context: PolicyContext): Promise<{ safe: boolean; confidence: number; warnings: SafetyWarning[]; flags: SafetyFlag[] }> {
    // Basic fact checking - would be enhanced with real fact-checking service
    const warnings: SafetyWarning[] = [];
    
    // Check for absolute statements that may be overgeneralizations
    const absolutePatterns = [
      /always\s+/gi,
      /never\s+/gi,
      /all\s+\w+\s+(must|should|will)/gi,
      /no\s+\w+\s+(can|should|will)/gi
    ];

    const hasAbsoluteStatements = absolutePatterns.some(pattern => pattern.test(response));

    if (hasAbsoluteStatements) {
      warnings.push({
        type: 'unverified_claim',
        severity: 'low',
        message: 'Response contains absolute statements that may need verification',
        suggestion: 'Consider qualifying statements with "typically", "usually", or "in most cases"'
      });
    }

    return {
      safe: true, // Absolute statements don't make content unsafe
      confidence: hasAbsoluteStatements ? 0.7 : 0.9,
      warnings,
      flags: []
    };
  }

  // Helper methods for confidence calculation

  private assessKnowledgeBaseMatch(response: string, context: PolicyContext): number {
    // Assess how well the response matches known regulatory knowledge
    let matchScore = 0.5; // Base score

    for (const jurisdiction of context.jurisdiction) {
      const knowledge = this.regulatoryKnowledge.get(jurisdiction);
      if (knowledge) {
        // Check for specific regulatory terms
        if (jurisdiction === 'cqc_england' && /fundamental standard/i.test(response)) {
          matchScore += 0.1;
        }
        if (jurisdiction === 'care_inspectorate_scotland' && /national care standard/i.test(response)) {
          matchScore += 0.1;
        }
        // Add more specific checks...
      }
    }

    return Math.min(matchScore, 1.0);
  }

  private assessRegulatoryAlignment(response: string, context: PolicyContext): number {
    // Check alignment with regulatory frameworks
    const regulatoryTerms = [
      'compliance', 'regulation', 'standard', 'requirement',
      'audit', 'inspection', 'assessment', 'review'
    ];

    const mentionedTerms = regulatoryTerms.filter(term => 
      response.toLowerCase().includes(term.toLowerCase())
    );

    return Math.min(mentionedTerms.length / regulatoryTerms.length * 2, 1.0);
  }

  private assessResponseSpecificity(response: string): number {
    // Assess how specific and detailed the response is
    const specificityIndicators = [
      /step\s+\d+/gi,
      /section\s+\d+/gi,
      /paragraph\s+\d+/gi,
      /regulation\s+\d+/gi,
      /standard\s+\d+/gi,
      /appendix/gi,
      /schedule/gi
    ];

    const specificityMatches = specificityIndicators.reduce((count, pattern) => {
      return count + (response.match(pattern) || []).length;
    }, 0);

    return Math.min(specificityMatches / 5, 1.0);
  }

  private calculateValidationScore(validationResults: ValidationResult[]): number {
    if (validationResults.length === 0) return 0.5;

    const avgConfidence = validationResults.reduce((sum, result) => 
      sum + result.confidence, 0) / validationResults.length;

    const safetyPenalty = validationResults.some(result => !result.safe) ? 0.3 : 0;

    return Math.max(avgConfidence - safetyPenalty, 0);
  }

  private extractModelConfidence(response: string): number {
    // Extract model confidence indicators from response
    const uncertaintyIndicators = [
      /may\s+/gi,
      /might\s+/gi,
      /could\s+/gi,
      /possibly/gi,
      /potentially/gi,
      /appears\s+to/gi,
      /seems\s+to/gi
    ];

    const uncertaintyCount = uncertaintyIndicators.reduce((count, pattern) => {
      return count + (response.match(pattern) || []).length;
    }, 0);

    // More uncertainty indicators = lower confidence
    return Math.max(0.9 - (uncertaintyCount * 0.1), 0.3);
  }

  private categorizeReliability(confidence: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
    if (confidence >= 0.9) return 'very_high';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.3) return 'low';
    return 'very_low';
  }

  private getRecommendedAction(confidence: number, context: PolicyContext): 'reject' | 'human_review' | 'proceed_with_caution' | 'proceed' {
    if (confidence < 0.3) return 'reject';
    if (confidence < 0.5 || context.criticalCompliance) return 'human_review';
    if (confidence < 0.7) return 'proceed_with_caution';
    return 'proceed';
  }

  // Additional helper methods

  private validateRegulatoryClaim(claim: string, context: PolicyContext): boolean {
    // Simple validation - would be enhanced with comprehensive regulatory database
    const regulationNumber = claim.match(/\d+/)?.[0];
    if (!regulationNumber) return false;

    for (const jurisdiction of context.jurisdiction) {
      const knowledge = this.regulatoryKnowledge.get(jurisdiction);
      if (knowledge) {
        if (jurisdiction === 'cqc_england' && knowledge.fundamentalStandards.includes(parseInt(regulationNumber))) {
          return true;
        }
        // Add more validation logic for other jurisdictions
      }
    }

    return false;
  }

  private containsSourceReferences(response: string): boolean {
    const sourceIndicators = [
      /according\s+to/gi,
      /as\s+stated\s+in/gi,
      /source:/gi,
      /reference:/gi,
      /\(cqc\s+\d{4}\)/gi,
      /official\s+guidance/gi
    ];

    return sourceIndicators.some(pattern => pattern.test(response));
  }

  private detectComplexLegalQuestions(response: string): boolean {
    const legalComplexityIndicators = [
      /legal\s+obligation/gi,
      /statutory\s+requirement/gi,
      /liability/gi,
      /prosecution/gi,
      /criminal\s+offence/gi,
      /civil\s+action/gi
    ];

    return legalComplexityIndicators.some(pattern => pattern.test(response));
  }

  private detectCrossJurisdictionalComplexity(context: PolicyContext): boolean {
    return context.jurisdiction.length > 1;
  }

  private detectHighRiskPolicyArea(context: PolicyContext): boolean {
    const highRiskCategories = [
      'safeguarding',
      'medication',
      'infection_control',
      'mental_capacity',
      'end_of_life'
    ];

    return highRiskCategories.includes(context.category);
  }

  private detectUncertainLanguage(response: string): boolean {
    const uncertaintyIndicators = [
      /uncertain/gi,
      /unclear/gi,
      /may\s+vary/gi,
      /depends\s+on/gi,
      /consult\s+expert/gi,
      /seek\s+advice/gi
    ];

    return uncertaintyIndicators.some(pattern => pattern.test(response));
  }

  // Additional method for PolicyAuthoringAssistantService compatibility
  async validateContent(params: { content: string; context: any }): Promise<ValidationResult> {
    return this.validateInput(params.content, params.context);
  }
}