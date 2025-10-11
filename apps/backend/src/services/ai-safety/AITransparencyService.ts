/**
 * @fileoverview a i transparency Service
 * @module Ai-safety/AITransparencyService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description a i transparency Service
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfidenceScore, PolicyContext } from '../ai-safety/AISafetyGuardService';

export interface AIExplanation {
  reasoning: string;
  confidenceExplanation: ConfidenceExplanation;
  sourcesUsed: SourceReference[];
  limitations: string[];
  recommendations: string[];
  alternatives?: string[];
  verificationSteps: string[];
}

export interface ConfidenceExplanation {
  overallConfidence: number;
  factors: string[];
  interpretation: string;
  userGuidance: string;
}

export interface SourceReference {
  name: string;
  type: 'regulatory_framework' | 'official_guidance' | 'knowledge_base' | 'expert_input';
  lastUpdated: string;
  relevance: number;
  url?: string;
}

export interface UserControls {
  adjustConfidenceThreshold: boolean;
  requestHumanReview: boolean;
  viewAlternativeResponses: boolean;
  accessSourceDocuments: boolean;
  flagConcerns: boolean;
  customizeResponse: boolean;
}

export interface SafetyFeatures {
  uncertaintyIndicators: UncertaintyIndicator[];
  riskWarnings: RiskWarning[];
  complianceChecks: ComplianceCheck[];
  verificationPrompts: string[];
}

export interface UncertaintyIndicator {
  location: string;
  type: 'knowledge_gap' | 'low_confidence' | 'conflicting_sources' | 'outdated_information';
  explanation: string;
  suggestion: string;
}

export interface RiskWarning {
  type: 'compliance_risk' | 'implementation_risk' | 'safety_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string[];
}

export interface ComplianceCheck {
  jurisdiction: string;
  requirement: string;
  status: 'compliant' | 'needs_review' | 'non_compliant' | 'unclear';
  notes: string;
}

@Injectable()
export class AITransparencyService {
  private readonlylogger = new Logger(AITransparencyService.name);

  /**
   * Generate comprehensive explanation for AI response
   */
  generateExplanation(
    response: string,
    confidence: ConfidenceScore,
    sources: SourceReference[],
    context: PolicyContext
  ): AIExplanation {
    
    return {
      reasoning: this.explainReasoning(response, context),
      confidenceExplanation: this.explainConfidence(confidence),
      sourcesUsed: sources,
      limitations: this.identifyLimitations(response, confidence, context),
      recommendations: this.generateRecommendations(confidence, context),
      alternatives: this.suggestAlternatives(response, confidence),
      verificationSteps: this.generateVerificationSteps(response, context)
    };
  }

  /**
   * Generate user-friendly explanation text
   */
  generateUserFacingExplanation(explanation: AIExplanation): string {
    const confidencePercentage = (explanation.confidenceExplanation.overallConfidence * 100).toFixed(0);
    
    return `
## 🤖 How I Generated This Response

**My Reasoning:**
${explanation.reasoning}

## 📊 ConfidenceLevel: ${confidencePercentage}%

**${explanation.confidenceExplanation.interpretation}**

${explanation.confidenceExplanation.userGuidance}

**Confidence Factors:**
${explanation.confidenceExplanation.factors.map(factor => `• ${factor}`).join('\n')}

## 📚 Sources I Referenced

${explanation.sourcesUsed.map(source => 
  `• **${source.name}** (${source.type}) - Lastupdated: ${source.lastUpdated}`
).join('\n')}

## ⚠️ Important Limitations

${explanation.limitations.map(limitation => `• ${limitation}`).join('\n')}

## 💡 My Recommendations

${explanation.recommendations.map(rec => `• ${rec}`).join('\n')}

## ✅ Verification Steps

To ensure this information is accurate for your specificsituation:

${explanation.verificationSteps.map(step => `• ${step}`).join('\n')}

---
*Remember: I'm here to assist, but you should always verify critical information with official sources and consult experts when needed.*
    `;
  }

  /**
   * Generate uncertainty communication for users
   */
  communicateUncertainty(confidence: number, context: PolicyContext): string {
    
    if (confidence > 0.9) {
      return "✅ **High Confidence**: This response is based on well-established regulatory guidance and should be reliable for your use.";
    }
    
    if (confidence > 0.7) {
      return "⚠️ **Moderate Confidence**: This response is likely accurate but should be verified with official sources, especially for critical compliance decisions.";
    }
    
    if (confidence > 0.5) {
      return "🔍 **Low Confidence**: This response provides a starting point but requires verification and possibly expert consultation before implementation.";
    }
    
    return "❌ **Very Low Confidence**: This response is uncertain and requires human expert review before any use in policy development.";
  }

  /**
   * Generate user empowerment controls
   */
  generateUserControls(
    response: string,
    confidence: ConfidenceScore,
    context: PolicyContext
  ): UserControls {
    
    return {
      adjustConfidenceThreshold: true,
      requestHumanReview: confidence.overallConfidence < 0.8,
      viewAlternativeResponses: confidence.overallConfidence < 0.9,
      accessSourceDocuments: true,
      flagConcerns: true,
      customizeResponse: confidence.overallConfidence > 0.5
    };
  }

  /**
   * Generate safety features for user protection
   */
  async generateSafetyFeatures(
    response: string,
    confidence: ConfidenceScore,
    context: PolicyContext
  ): Promise<SafetyFeatures> {
    
    return {
      uncertaintyIndicators: this.identifyUncertainties(response, confidence),
      riskWarnings: this.identifyRisks(response, context),
      complianceChecks: await this.runComplianceChecks(response, context),
      verificationPrompts: this.generateVerificationPrompts(response, context)
    };
  }

  /**
   * Format response with progressive disclosure
   */
  formatResponseWithDisclosure(
    response: string,
    confidence: ConfidenceScore,
    explanation: AIExplanation,
    safetyFeatures: SafetyFeatures
  ): any {
    
    return {
      // Always visible primary content
      primaryResponse: response,
      confidenceIndicator: this.getConfidenceIndicator(confidence),
      uncertaintyWarnings: safetyFeatures.uncertaintyIndicators
        .filter(indicator => indicator.type === 'knowledge_gap' || indicator.type === 'low_confidence')
        .map(indicator => indicator.explanation),
      
      // Expandable sections
      expandableSections: {
        "🤖 How I determined this": explanation.reasoning,
        "📊 Confidence breakdown": this.formatConfidenceBreakdown(confidence),
        "📚 Sources and references": this.formatSources(explanation.sourcesUsed),
        "⚠️ Limitations and considerations": explanation.limitations,
        "🔄 Alternative approaches": explanation.alternatives || [],
        "✅ Verification steps": explanation.verificationSteps,
        "🛡️ Safety checks": this.formatSafetyChecks(safetyFeatures)
      },
      
      // Action buttons
      actionButtons: [
        {
          id: 'request_human_review',
          label: 'Request Expert Review',
          enabled: confidence.overallConfidence < 0.8,
          description: 'Get this response reviewed by a human expert'
        },
        {
          id: 'view_sources',
          label: 'View Source Documents',
          enabled: true,
          description: 'Access the official documents I referenced'
        },
        {
          id: 'get_alternatives',
          label: 'Get Alternative Suggestions',
          enabled: confidence.overallConfidence < 0.9,
          description: 'See different approaches to this topic'
        },
        {
          id: 'flag_concern',
          label: 'Flag Concern',
          enabled: true,
          description: 'Report if you notice any issues with this response'
        },
        {
          id: 'customize_response',
          label: 'Customize Response',
          enabled: confidence.overallConfidence > 0.5,
          description: 'Adjust this response for your specific needs'
        }
      ]
    };
  }

  // Private helper methods

  private explainReasoning(response: string, context: PolicyContext): string {
    let reasoning = "I analyzed your query in the context of ";
    
    if (context.jurisdiction.length === 1) {
      reasoning += `${this.getJurisdictionName(context.jurisdiction[0])} regulations`;
    } else {
      reasoning += `multiple British Isles jurisdictions (${context.jurisdiction.map(j => this.getJurisdictionName(j)).join(', ')})`;
    }
    
    reasoning += ` for ${context.category} policies. `;
    
    reasoning += "I cross-referenced the requirements with my knowledge of regulatory frameworks, ";
    reasoning += "considered current best practices, and structured the response to address your specific needs while ";
    reasoning += "ensuring compliance with applicable standards.";
    
    return reasoning;
  }

  private explainConfidence(confidence: ConfidenceScore): ConfidenceExplanation {
    const percentage = (confidence.overallConfidence * 100).toFixed(0);
    
    let interpretation = '';
    let userGuidance = '';
    
    switch (confidence.reliability) {
      case 'very_high':
        interpretation = `Very High Confidence (${percentage}%) - This response is highly reliable and based on well-established regulatory guidance.`;
        userGuidance = 'You can use this response with confidence, though verification with official sources is always good practice.';
        break;
      case 'high':
        interpretation = `High Confidence (${percentage}%) - This response is reliable and well-supported by regulatory knowledge.`;
        userGuidance = 'This response should be accurate, but consider verification for critical compliance decisions.';
        break;
      case 'medium':
        interpretation = `Medium Confidence (${percentage}%) - This response provides good guidance but may need verification.`;
        userGuidance = 'Use this as a strong starting point, but verify key points with official sources before implementation.';
        break;
      case 'low':
        interpretation = `Low Confidence (${percentage}%) - This response should be treated as preliminary guidance only.`;
        userGuidance = 'Consider this response carefully and seek verification from official sources or experts before proceeding.';
        break;
      case 'very_low':
        interpretation = `Very Low Confidence (${percentage}%) - This response is uncertain and requires expert review.`;
        userGuidance = 'Do not use this response without expert review and verification. Consider requesting human assistance.';
        break;
    }
    
    const factors = [
      `Knowledge basematch: ${(confidence.factors.knowledgeBaseMatch * 100).toFixed(0)}%`,
      `Regulatory alignment: ${(confidence.factors.regulatoryAlignment * 100).toFixed(0)}%`,
      `Response specificity: ${(confidence.factors.responseSpecificity * 100).toFixed(0)}%`,
      `Validation score: ${(confidence.factors.validationScore * 100).toFixed(0)}%`,
      `Model confidence: ${(confidence.factors.modelConfidence * 100).toFixed(0)}%`
    ];
    
    return {
      overallConfidence: confidence.overallConfidence,
      factors,
      interpretation,
      userGuidance
    };
  }

  private identifyLimitations(response: string, confidence: ConfidenceScore, context: PolicyContext): string[] {
    const limitations = [
      "AI responses should always be verified with official sources",
      "Regulatory requirements may change - check for latest updates",
      "This guidance may not cover all specific circumstances"
    ];
    
    if (confidence.overallConfidence < 0.7) {
      limitations.push("This response has lower confidence and requires additional verification");
    }
    
    if (context.jurisdiction.length > 1) {
      limitations.push("Multi-jurisdictional requirements may have complex interactions requiring expert review");
    }
    
    if (context.criticalCompliance) {
      limitations.push("Critical compliance areas require expert consultation and official confirmation");
    }
    
    return limitations;
  }

  private generateRecommendations(confidence: ConfidenceScore, context: PolicyContext): string[] {
    const recommendations = [];
    
    if (confidence.overallConfidence < 0.8) {
      recommendations.push("Verify this information with official regulatory sources");
    }
    
    if (context.criticalCompliance) {
      recommendations.push("Consult with a compliance expert before implementation");
    }
    
    recommendations.push("Review this guidance with your organization's leadership team");
    recommendations.push("Document your decision-making process for audit purposes");
    
    if (context.jurisdiction.length > 1) {
      recommendations.push("Consider jurisdiction-specific var iations in implementation");
    }
    
    return recommendations;
  }

  private suggestAlternatives(response: string, confidence: ConfidenceScore): string[] {
    if (confidence.overallConfidence > 0.8) {
      return []; // No alternatives needed for high-confidence responses
    }
    
    return [
      "Consider consulting with regulatory experts for specialized guidance",
      "Review similar policies from peer organizations for alternative approaches",
      "Seek official clarification from the relevant regulatory body",
      "Engage with professional networks or industry associations for insights"
    ];
  }

  private generateVerificationSteps(response: string, context: PolicyContext): string[] {
    const steps = [
      "Cross-check key requirements with official regulatory documents"
    ];
    
    for (const jurisdiction of context.jurisdiction) {
      steps.push(`Verify compliance with ${this.getJurisdictionName(jurisdiction)} specific requirements`);
    }
    
    steps.push(
      "Consult with your organization's compliance team or legal advisors",
      "Review implementation with relevant department heads",
      "Document verification process for audit trails"
    );
    
    return steps;
  }

  private identifyUncertainties(response: string, confidence: ConfidenceScore): UncertaintyIndicator[] {
    const uncertainties: UncertaintyIndicator[] = [];
    
    if (confidence.overallConfidence < 0.7) {
      uncertainties.push({
        location: 'Overall response',
        type: 'low_confidence',
        explanation: 'This response has lower confidence due to limited regulatory knowledge matching',
        suggestion: 'Verify with official sources before implementation'
      });
    }
    
    // Check for uncertainty language in response
    const uncertaintyPatterns = [
      { pattern: /may\s+need|might\s+require/gi, type: 'knowledge_gap' as const },
      { pattern: /depends\s+on|var ies\s+by/gi, type: 'conflicting_sources' as const },
      { pattern: /consult\s+with|seek\s+advice/gi, type: 'low_confidence' as const }
    ];
    
    uncertaintyPatterns.forEach(({ pattern, type }) => {
      const matches = response.match(pattern);
      if (matches) {
        uncertainties.push({
          location: `Text: "${matches[0]}"`,
          type,
          explanation: 'Response contains uncertainty language indicating potential knowledge gaps',
          suggestion: 'Pay special attention to verification of uncertain elements'
        });
      }
    });
    
    return uncertainties;
  }

  private identifyRisks(response: string, context: PolicyContext): RiskWarning[] {
    const risks: RiskWarning[] = [];
    
    // High-risk policy categories
    const highRiskCategories = ['safeguarding', 'medication', 'infection_control', 'mental_capacity'];
    if (highRiskCategories.includes(context.category)) {
      risks.push({
        type: 'compliance_risk',
        severity: 'high',
        description: `${context.category} policies have high compliance requirements`,
        mitigation: [
          'Ensure expert review before implementation',
          'Regular monitoring and updates required',
          'Staff training must be comprehensive and documented'
        ]
      });
    }
    
    // Multi-jurisdictional complexity
    if (context.jurisdiction.length > 1) {
      risks.push({
        type: 'implementation_risk',
        severity: 'medium',
        description: 'Multi-jurisdictional policies may have implementation complexities',
        mitigation: [
          'Review each jurisdiction\'s specific requirements',
          'Consider jurisdiction-specific policy versions',
          'Establish clear coordination processes'
        ]
      });
    }
    
    return risks;
  }

  private async runComplianceChecks(response: string, context: PolicyContext): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    
    for (const jurisdiction of context.jurisdiction) {
      checks.push({
        jurisdiction: this.getJurisdictionName(jurisdiction),
        requirement: 'General policy requirements',
        status: 'needs_review',
        notes: 'Manual verification required for jurisdiction-specific compliance'
      });
    }
    
    return checks;
  }

  private generateVerificationPrompts(response: string, context: PolicyContext): string[] {
    return [
      "Have you checked this against the latest regulatoryguidance?",
      "Does this align with your organization's existingpolicies?",
      "Have you considered the implementation timeline andresources?",
      "Are there any organization-specific factors notaddressed?"
    ];
  }

  // Formatting helper methods

  private getConfidenceIndicator(confidence: ConfidenceScore): { emoji: string; color: string; text: string } {
    const percentage = (confidence.overallConfidence * 100).toFixed(0);
    
    if (confidence.reliability === 'very_high') {
      return { emoji: '✅', color: 'green', text: `Very High (${percentage}%)` };
    }
    if (confidence.reliability === 'high') {
      return { emoji: '🟢', color: 'green', text: `High (${percentage}%)` };
    }
    if (confidence.reliability === 'medium') {
      return { emoji: '🟡', color: 'yellow', text: `Medium (${percentage}%)` };
    }
    if (confidence.reliability === 'low') {
      return { emoji: '🟠', color: 'orange', text: `Low (${percentage}%)` };
    }
    return { emoji: '🔴', color: 'red', text: `Very Low (${percentage}%)` };
  }

  private formatConfidenceBreakdown(confidence: ConfidenceScore): string {
    return `
**Overall Confidence: ${(confidence.overallConfidence * 100).toFixed(0)}%**

**Contributing Factors:**
- Knowledge BaseMatch: ${(confidence.factors.knowledgeBaseMatch * 100).toFixed(0)}%
- RegulatoryAlignment: ${(confidence.factors.regulatoryAlignment * 100).toFixed(0)}%  
- ResponseSpecificity: ${(confidence.factors.responseSpecificity * 100).toFixed(0)}%
- ValidationScore: ${(confidence.factors.validationScore * 100).toFixed(0)}%
- ModelConfidence: ${(confidence.factors.modelConfidence * 100).toFixed(0)}%

**Recommended Action: ${confidence.recommendedAction.replace('_', ' ').toUpperCase()}**
    `;
  }

  private formatSources(sources: SourceReference[]): string {
    if (sources.length === 0) {
      return "No specific sources referenced - response based on general regulatory knowledge.";
    }
    
    return sources.map(source => 
      `**${source.name}**\n- Type: ${source.type.replace('_', ' ')}\n- LastUpdated: ${source.lastUpdated}\n- Relevance: ${(source.relevance * 100).toFixed(0)}%`
    ).join('\n\n');
  }

  private formatSafetyChecks(safetyFeatures: SafetyFeatures): string {
    let formatted = '';
    
    if (safetyFeatures.uncertaintyIndicators.length > 0) {
      formatted += '**Uncertainty Indicators:**\n';
      formatted += safetyFeatures.uncertaintyIndicators.map(indicator => 
        `- ${indicator.explanation}`
      ).join('\n');
      formatted += '\n\n';
    }
    
    if (safetyFeatures.riskWarnings.length > 0) {
      formatted += '**Risk Warnings:**\n';
      formatted += safetyFeatures.riskWarnings.map(warning => 
        `- ${warning.description} (${warning.severity})`
      ).join('\n');
      formatted += '\n\n';
    }
    
    if (safetyFeatures.complianceChecks.length > 0) {
      formatted += '**Compliance Checks:**\n';
      formatted += safetyFeatures.complianceChecks.map(check => 
        `- ${check.jurisdiction}: ${check.requirement} - ${check.status}`
      ).join('\n');
    }
    
    return formatted || 'All basic safety checks passed.';
  }

  private getJurisdictionName(jurisdiction: string): string {
    const names = {
      'cqc_england': 'CQC (England)',
      'care_inspectorate_scotland': 'Care Inspectorate (Scotland)',
      'ciw_wales': 'CIW (Wales)',
      'rqia_northern_ireland': 'RQIA (Northern Ireland)',
      'jcc_jersey': 'JCC (Jersey)',
      'gcrb_guernsey': 'GCRB (Guernsey)',
      'dhsc_isle_of_man': 'DHSC (Isle of Man)'
    };
    
    return names[jurisdiction] || jurisdiction;
  }

  // Additional method for PolicyAuthoringAssistantService compatibility
  async logAIDecision(params: { 
    action: string; 
    context: any; 
    result: any; 
    userId?: string; 
  }): Promise<void> {
    // Log AI decision making for audit trail
    console.log('AI Decisionlogged:', {
      action: params.action,
      timestamp: new Date().toISOString(),
      userId: params.userId || 'system',
      context: params.context,
      result: params.result
    });
  }
}
