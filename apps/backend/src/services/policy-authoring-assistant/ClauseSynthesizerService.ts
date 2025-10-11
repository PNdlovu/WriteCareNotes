/**
 * @fileoverview clause synthesizer Service
 * @module Policy-authoring-assistant/ClauseSynthesizerService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description clause synthesizer Service
 */

import { Injectable, Logger } from '@nestjs/common';
import { RetrievedDocument } from './VerifiedRetrieverService';
import { AISuggestionPrompt } from './PolicyAuthoringAssistantService';

/**
 * 📦 SYNTHESIZED SUGGESTION STRUCTURE
 */
export interface SynthesizedSuggestion {
  content: any; // Structure depends on output format
  confidence: number;
  sourceDocuments: string[]; // IDs of source documents used
  synthesisMethod: 'single_source' | 'multi_source_merge' | 'template_assembly';
  warnings: string[];
}

@Injectable()
export class ClauseSynthesizerService {
  private readonly logger = new Logger(ClauseSynthesizerService.name);

  /**
   * 🧩 MAIN SYNTHESIS METHOD
   * 
   * Assembles suggestion from retrieved documents
   */
  async synthesize(
    documents: RetrievedDocument[],
    prompt: AISuggestionPrompt,
  ): Promise<SynthesizedSuggestion> {
    this.logger.log(`Synthesizing ${prompt.outputFormat} from ${documents.length} documents`);

    switch (prompt.outputFormat) {
      case 'structured_clause':
        return this.synthesizeClause(documents, prompt);
      
      case 'mapping_table':
        return this.synthesizeMappingTable(documents, prompt);
      
      case 'review_report':
        return this.synthesizeReviewReport(documents, prompt);
      
      case 'improvement_list':
        return this.synthesizeImprovementList(documents, prompt);
      
      default:
        throw new Error(`Unknown output format: ${prompt.outputFormat}`);
    }
  }

  /**
   * 📝 SYNTHESIZE POLICY CLAUSE
   */
  private async synthesizeClause(
    documents: RetrievedDocument[],
    prompt: AISuggestionPrompt,
  ): Promise<SynthesizedSuggestion> {
    // Use highest relevance document as primary source
    const primaryDoc = documents[0];
    const supportingDocs = documents.slice(1, 3); // Top 2 supporting documents

    // Extract clause structure from template
    const clause = {
      title: this.extractRelevantSection(primaryDoc.content, prompt.context, 'title'),
      content: this.extractRelevantSection(primaryDoc.content, prompt.context, 'content'),
      rationale: this.extractRelevantSection(primaryDoc.content, prompt.context, 'rationale'),
      jurisdiction: prompt.jurisdiction,
      sourceTemplate: {
        id: primaryDoc.id,
        title: primaryDoc.title,
        version: primaryDoc.version,
      },
      supportingReferences: supportingDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        relevance: doc.relevanceScore,
      })),
    };

    // Calculate confidence based on source quality
    const confidence = this.calculateConfidence(documents, 'clause');

    return {
      content: clause,
      confidence,
      sourceDocuments: documents.map(d => d.id),
      synthesisMethod: documents.length > 1 ? 'multi_source_merge' : 'single_source',
      warnings: this.generateWarnings(documents, confidence),
    };
  }

  /**
   * 🗺️ SYNTHESIZE POLICY MAPPING TABLE
   */
  private async synthesizeMappingTable(
    documents: RetrievedDocument[],
    prompt: AISuggestionPrompt,
  ): Promise<SynthesizedSuggestion> {
    // Filter for compliance standards
    const standards = documents.filter(d => d.type === 'compliance_standard');

    const mappingTable = {
      policyId: prompt.policyId,
      standards: standards.map(std => ({
        code: std.metadata?.code || 'Unknown',
        title: std.title,
        relevance: std.relevanceScore,
        mappedClauses: this.extractMappedClauses(std.content, prompt.context),
        jurisdiction: std.jurisdiction,
        version: std.version,
      })),
      coverage: this.calculateCoverage(standards, prompt.standards || []),
      gaps: this.identifyGaps(standards, prompt.standards || []),
    };

    const confidence = this.calculateConfidence(documents, 'mapping');

    return {
      content: mappingTable,
      confidence,
      sourceDocuments: documents.map(d => d.id),
      synthesisMethod: 'template_assembly',
      warnings: this.generateWarnings(documents, confidence),
    };
  }

  /**
   * 📊 SYNTHESIZE REVIEW REPORT
   */
  private async synthesizeReviewReport(
    documents: RetrievedDocument[],
    prompt: AISuggestionPrompt,
  ): Promise<SynthesizedSuggestion> {
    const report = {
      policyId: prompt.policyId,
      reviewDate: new Date(),
      jurisdiction: prompt.jurisdiction,
      findings: this.generateFindings(documents, prompt.context),
      recommendations: this.generateRecommendations(documents),
      complianceStatus: this.assessCompliance(documents, prompt.standards || []),
      reviewedAgainst: documents.map(d => ({
        type: d.type,
        title: d.title,
        version: d.version,
      })),
    };

    const confidence = this.calculateConfidence(documents, 'review');

    return {
      content: report,
      confidence,
      sourceDocuments: documents.map(d => d.id),
      synthesisMethod: 'multi_source_merge',
      warnings: this.generateWarnings(documents, confidence),
    };
  }

  /**
   * 💡 SYNTHESIZE IMPROVEMENT LIST
   */
  private async synthesizeImprovementList(
    documents: RetrievedDocument[],
    prompt: AISuggestionPrompt,
  ): Promise<SynthesizedSuggestion> {
    const improvements = {
      context: prompt.context,
      jurisdiction: prompt.jurisdiction,
      suggestions: documents.slice(0, 5).map((doc, index) => ({
        priority: index + 1,
        title: `Align with ${doc.title}`,
        description: this.extractRelevantSection(doc.content, prompt.context, 'recommendation'),
        source: {
          id: doc.id,
          title: doc.title,
          type: doc.type,
        },
        estimatedImpact: doc.relevanceScore > 0.8 ? 'High' : doc.relevanceScore > 0.6 ? 'Medium' : 'Low',
      })),
      basedOn: documents.length,
    };

    const confidence = this.calculateConfidence(documents, 'improvement');

    return {
      content: improvements,
      confidence,
      sourceDocuments: documents.map(d => d.id),
      synthesisMethod: 'template_assembly',
      warnings: this.generateWarnings(documents, confidence),
    };
  }

  /**
   * 🔍 EXTRACT RELEVANT SECTION
   * 
   * Extracts relevant text from document (no generation)
   */
  private extractRelevantSection(
    content: string,
    context: string,
    sectionType: 'title' | 'content' | 'rationale' | 'recommendation',
  ): string {
    // Simple keyword-based extraction
    // In production, this would use NLP for better section identification
    
    const contextKeywords = context.toLowerCase().split(/\s+/).slice(0, 5);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Find sentences containing context keywords
    const relevantSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return contextKeywords.some(keyword => lower.includes(keyword));
    });

    if (relevantSentences.length === 0) {
      return content.substring(0, 200) + '...'; // First 200 chars as fallback
    }

    // Return first 2-3 relevant sentences
    return relevantSentences.slice(0, sectionType === 'content' ? 3 : 1).join('. ') + '.';
  }

  /**
   * 🗺️ EXTRACT MAPPED CLAUSES
   */
  private extractMappedClauses(content: string, context: string): string[] {
    // Extract numbered clauses or bullet points
    const clausePatterns = [
      /\d+\.\s+([^\n]+)/g,  // Numbered list
      /•\s+([^\n]+)/g,       // Bullet points
      /-\s+([^\n]+)/g,       // Dash list
    ];

    constclauses: string[] = [];

    for (const pattern of clausePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 10) {
          clauses.push(match[1].trim());
        }
      }
    }

    return clauses.slice(0, 5); // Top 5 clauses
  }

  /**
   * 📊 CALCULATE COVERAGE
   */
  private calculateCoverage(standards: RetrievedDocument[], requestedStandards: string[]): any {
    if (requestedStandards.length === 0) return { percentage: 100, message: 'No specific standards requested' };

    const foundStandards = standards
      .map(s => s.metadata?.code)
      .filter(Boolean);

    const covered = requestedStandards.filter(rs => 
      foundStandards.some(fs => fs.includes(rs) || rs.includes(fs))
    );

    return {
      requested: requestedStandards.length,
      covered: covered.length,
      percentage: Math.round((covered.length / requestedStandards.length) * 100),
      missing: requestedStandards.filter(rs => !covered.includes(rs)),
    };
  }

  /**
   * 🔍 IDENTIFY GAPS
   */
  private identifyGaps(standards: RetrievedDocument[], requestedStandards: string[]): string[] {
    const coverage = this.calculateCoverage(standards, requestedStandards);
    return coverage.missing || [];
  }

  /**
   * 📝 GENERATE FINDINGS
   */
  private generateFindings(documents: RetrievedDocument[], context: string): any[] {
    return documents.slice(0, 5).map((doc, index) => ({
      finding: `Based on ${doc.title}`,
      severity: doc.relevanceScore > 0.8 ? 'High' : doc.relevanceScore > 0.6 ? 'Medium' : 'Low',
      description: this.extractRelevantSection(doc.content, context, 'content'),
      source: {
        id: doc.id,
        title: doc.title,
        type: doc.type,
      },
    }));
  }

  /**
   * 💡 GENERATE RECOMMENDATIONS
   */
  private generateRecommendations(documents: RetrievedDocument[]): any[] {
    return documents.slice(0, 3).map((doc, index) => ({
      priority: index + 1,
      recommendation: `Align with ${doc.title} (v${doc.version})`,
      rationale: `Based on verified ${doc.type}`,
      source: doc.id,
    }));
  }

  /**
   * ✅ ASSESS COMPLIANCE
   */
  private assessCompliance(documents: RetrievedDocument[], standards: string[]): any {
    const complianceStandards = documents.filter(d => d.type === 'compliance_standard');
    
    return {
      status: complianceStandards.length >= standards.length ? 'Compliant' : 'Partial',
      standardsReviewed: complianceStandards.length,
      standardsRequired: standards.length,
      confidence: complianceStandards.length > 0 ? 'Medium' : 'Low',
    };
  }

  /**
   * 📊 CALCULATE CONFIDENCE
   */
  private calculateConfidence(documents: RetrievedDocument[], synthesisType: string): number {
    if (documents.length === 0) return 0;

    // Factors affecting confidence:
    // 1. Average relevance score (0-0.4)
    const avgRelevance = documents.reduce((sum, d) => sum + d.relevanceScore, 0) / documents.length;
    const relevanceScore = avgRelevance * 0.4;

    // 2. Number of sources (0-0.3)
    const sourceScore = Math.min(documents.length / 5, 1) * 0.3;

    // 3. Source verification status (0-0.2)
    const verifiedCount = documents.filter(d => d.verificationStatus === 'verified').length;
    const verificationScore = (verifiedCount / documents.length) * 0.2;

    // 4. Recency bonus (0-0.1)
    const recentDocs = documents.filter(d => {
      const daysSinceUpdate = (Date.now() - d.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate < 365; // Within last year
    }).length;
    const recencyScore = (recentDocs / documents.length) * 0.1;

    return Math.min(relevanceScore + sourceScore + verificationScore + recencyScore, 1.0);
  }

  /**
   * ⚠️ GENERATE WARNINGS
   */
  private generateWarnings(documents: RetrievedDocument[], confidence: number): string[] {
    constwarnings: string[] = [];

    if (confidence < 0.7) {
      warnings.push('Low confidence - human review strongly recommended');
    }

    if (documents.length < 2) {
      warnings.push('Limited source material - consider broadening search criteria');
    }

    const deprecatedDocs = documents.filter(d => d.verificationStatus === 'deprecated');
    if (deprecatedDocs.length > 0) {
      warnings.push(`${deprecatedDocs.length} source(s) are deprecated - verify current requirements`);
    }

    const oldDocs = documents.filter(d => {
      const daysSinceUpdate = (Date.now() - d.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 365;
    });
    if (oldDocs.length > 0) {
      warnings.push(`${oldDocs.length} source(s) are over 1 year old - verify currency`);
    }

    return warnings;
  }
}
