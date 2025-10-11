/**
 * @fileoverview verified retriever Service
 * @module Policy-authoring-assistant/VerifiedRetrieverService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description verified retriever Service
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PolicyTemplate } from '../../entities/policy-template.entity';
import { ComplianceStandard, ComplianceStandardStatus } from '../../entities/compliance-standard.entity';
import { JurisdictionalRule, JurisdictionalRuleStatus } from '../../entities/jurisdictional-rule.entity';
import { RegulatoryJurisdiction, KnowledgeBaseQuery } from './PolicyAuthoringAssistantService';

/**
 * 📚 RETRIEVED DOCUMENT STRUCTURE
 */
export interface RetrievedDocument {
  type: 'policy_template' | 'compliance_standard' | 'jurisdictional_rule' | 'best_practice';
  id: string;
  title: string;
  content: string;
  version: string;
  section?: string;
  relevanceScore: number;
  jurisdiction?: RegulatoryJurisdiction[];
  standards?: string[];
  verificationStatus: 'verified' | 'pending' | 'deprecated';
  lastUpdated: Date;
  metadata: any;
}

@Injectable()
export class VerifiedRetrieverService {
  private readonly logger = new Logger(VerifiedRetrieverService.name);

  constructor(
    @InjectRepository(PolicyTemplate)
    private policyTemplateRepository: Repository<PolicyTemplate>,
    
    @InjectRepository(ComplianceStandard)
    private complianceStandardRepository: Repository<ComplianceStandard>,
    
    @InjectRepository(JurisdictionalRule)
    private jurisdictionalRuleRepository: Repository<JurisdictionalRule>,
  ) {}

  /**
   * 🔍 MAIN RETRIEVAL METHOD
   * 
   * Retrieves verified content from structured knowledge base
   */
  async retrieve(query: KnowledgeBaseQuery): Promise<RetrievedDocument[]> {
    const startTime = Date.now();
    const results: RetrievedDocument[] = [];

    try {
      this.logger.log(`Retrieving documents for keywords: ${query.keywords.join(', ')}`);
      this.logger.log(`Jurisdictions: ${query.jurisdiction.join(', ')}`);
      this.logger.log(`Standards: ${query.standards.join(', ')}`);

      // Retrieve from all verified sources in parallel
      const [templates, standards, rules] = await Promise.all([
        this.retrievePolicyTemplates(query),
        this.retrieveComplianceStandards(query),
        this.retrieveJurisdictionalRules(query),
      ]);

      results.push(...templates, ...standards, ...rules);

      // Filter by relevance score
      const filteredResults = results.filter(
        doc => doc.relevanceScore >= query.minRelevanceScore
      );

      // Sort by relevance (descending)
      filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Limit results
      const finalResults = filteredResults.slice(0, query.maxResults);

      this.logger.log(
        `Retrieved ${finalResults.length} documents (${results.length} total, ${filteredResults.length} after filtering) in ${Date.now() - startTime}ms`
      );

      return finalResults;

    } catch (error) {
      this.logger.error('Document retrieval failed:', error);
      throw error;
    }
  }

  /**
   * 📋 RETRIEVE POLICY TEMPLATES
   */
  private async retrievePolicyTemplates(
    query: KnowledgeBaseQuery
  ): Promise<RetrievedDocument[]> {
    const queryBuilder = this.policyTemplateRepository
      .createQueryBuilder('template')
      .where('template.status = :status', { status: 'published' });

    // Jurisdiction filter
    if (query.jurisdiction.length > 0) {
      queryBuilder.andWhere(
        'template.jurisdiction && :jurisdiction',
        { jurisdiction: query.jurisdiction }
      );
    }

    // Standards filter
    if (query.standards.length > 0) {
      queryBuilder.andWhere(
        'template.standards && :standards',
        { standards: query.standards }
      );
    }

    // Keyword filter (using full-text search)
    if (query.keywords.length > 0) {
      const searchQuery = query.keywords.join(' | ');
      queryBuilder.andWhere(
        `to_tsvector('english', template.content || ' ' || template.title) @@ to_tsquery('english', :searchQuery)`,
        { searchQuery }
      );
    }

    // Deprecation filter
    if (!query.includeDeprecated) {
      queryBuilder.andWhere('template.deprecated = :deprecated', { deprecated: false });
    }

    const templates = await queryBuilder.getMany();

    return templates.map(template => ({
      type: 'policy_template' as const,
      id: template.id,
      title: template.title,
      content: template.content,
      version: template.version,
      section: template.category,
      relevanceScore: this.calculateRelevanceScore(template, query.keywords),
      jurisdiction: template.jurisdiction as unknown as RegulatoryJurisdiction[],
      standards: [], // PolicyTemplate entity doesn't have standards property - use empty array
      verificationStatus: template.isActive ? 'verified' : 'deprecated', // Use isActive instead of deprecated
      lastUpdated: template.updatedAt,
      metadata: {
        category: template.category,
        author: template.createdBy,
        usageCount: 0, // PolicyTemplate entity doesn't track usageCount - default to 0
      },
    }));
  }

  /**
   * 📜 RETRIEVE COMPLIANCE STANDARDS
   */
  private async retrieveComplianceStandards(
    query: KnowledgeBaseQuery
  ): Promise<RetrievedDocument[]> {
    const queryBuilder = this.complianceStandardRepository
      .createQueryBuilder('standard')
      .where('standard.status = :status', { status: 'active' });

    // Standards filter
    if (query.standards.length > 0) {
      queryBuilder.andWhere('standard.code IN (:...standards)', { standards: query.standards });
    }

    // Jurisdiction filter
    if (query.jurisdiction.length > 0) {
      queryBuilder.andWhere(
        'standard.jurisdiction && :jurisdiction',
        { jurisdiction: query.jurisdiction }
      );
    }

    // Keyword filter
    if (query.keywords.length > 0) {
      const searchQuery = query.keywords.join(' | ');
      queryBuilder.andWhere(
        `to_tsvector('english', standard.description || ' ' || standard.title) @@ to_tsquery('english', :searchQuery)`,
        { searchQuery }
      );
    }

    const standards = await queryBuilder.getMany();

    return standards.map(standard => ({
      type: 'compliance_standard' as const,
      id: standard.id,
      title: `${standard.code} - ${standard.title}`,
      content: standard.description,
      version: standard.version,
      section: standard.category,
      relevanceScore: this.calculateRelevanceScore(standard, query.keywords),
      jurisdiction: standard.jurisdiction as RegulatoryJurisdiction[],
      standards: [standard.code],
      verificationStatus: 'verified' as const,
      lastUpdated: standard.updatedAt,
      metadata: {
        code: standard.code,
        category: standard.category,
        mandatoryCompliance: standard.mandatory,
      },
    }));
  }

  /**
   * ⚖️ RETRIEVE JURISDICTIONAL RULES
   */
  private async retrieveJurisdictionalRules(
    query: KnowledgeBaseQuery
  ): Promise<RetrievedDocument[]> {
    const queryBuilder = this.jurisdictionalRuleRepository
      .createQueryBuilder('rule')
      .where('rule.status = :status', { status: 'active' });

    // Jurisdiction filter (exact match for rules)
    if (query.jurisdiction.length > 0) {
      queryBuilder.andWhere('rule.jurisdiction IN (:...jurisdiction)', {
        jurisdiction: query.jurisdiction,
      });
    }

    // Keyword filter
    if (query.keywords.length > 0) {
      const searchQuery = query.keywords.join(' | ');
      queryBuilder.andWhere(
        `to_tsvector('english', rule.content || ' ' || rule.title) @@ to_tsquery('english', :searchQuery)`,
        { searchQuery }
      );
    }

    const rules = await queryBuilder.getMany();

    return rules.map(rule => ({
      type: 'jurisdictional_rule' as const,
      id: rule.id,
      title: rule.title,
      content: rule.content,
      version: rule.version,
      section: rule.ruleType,
      relevanceScore: this.calculateRelevanceScore(rule, query.keywords),
      jurisdiction: [rule.jurisdiction] as RegulatoryJurisdiction[],
      standards: rule.relatedStandards || [],
      verificationStatus: 'verified' as const,
      lastUpdated: rule.updatedAt,
      metadata: {
        ruleType: rule.ruleType,
        regulatoryBody: rule.regulatoryBody,
        enforcementLevel: rule.enforcementLevel,
      },
    }));
  }

  /**
   * 📊 CALCULATE RELEVANCE SCORE
   * 
   * Simple TF-IDF-like scoring (can be enhanced with embeddings)
   */
  private calculateRelevanceScore(document: any, keywords: string[]): number {
    if (keywords.length === 0) return 0.8; // Default score when no keywords

    const text = `${document.title || ''} ${document.content || ''} ${document.description || ''}`.toLowerCase();
    
    let matchCount = 0;
    let totalOccurrences = 0;

    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      const matches = text.match(regex);
      if (matches) {
        matchCount++;
        totalOccurrences += matches.length;
      }
    });

    // Score based on:
    // - Percentage of keywords matched (0-0.6)
    // - Frequency of matches (0-0.4)
    const keywordCoverage = matchCount / keywords.length;
    const frequencyBonus = Math.min(totalOccurrences / (keywords.length * 3), 1) * 0.4;

    return Math.min(keywordCoverage * 0.6 + frequencyBonus, 1.0);
  }

  /**
   * 🔄 REFRESH KNOWLEDGE BASE INDEX
   * 
   * Re-indexes all verified content (run periodically)
   */
  async refreshIndex(): Promise<void> {
    this.logger.log('Starting knowledge base index refresh...');
    
    // In production, this would update vector embeddings for semantic search
    // For now, we rely on PostgreSQL full-text search
    
    const templateCount = await this.policyTemplateRepository.count({ where: { isActive: true } });
    const standardCount = await this.complianceStandardRepository.count({ where: { status: ComplianceStandardStatus.ACTIVE } });
    const ruleCount = await this.jurisdictionalRuleRepository.count({ where: { status: JurisdictionalRuleStatus.ACTIVE } });
    
    this.logger.log(`Index refreshed: ${templateCount} templates, ${standardCount} standards, ${ruleCount} rules`);
  }

  /**
   * 📈 GET KNOWLEDGE BASE STATS
   */
  async getStats(): Promise<any> {
    const [templates, standards, rules] = await Promise.all([
      this.policyTemplateRepository.count({ where: { isActive: true } }),
      this.complianceStandardRepository.count({ where: { status: ComplianceStandardStatus.ACTIVE } }),
      this.jurisdictionalRuleRepository.count({ where: { status: JurisdictionalRuleStatus.ACTIVE } }),
    ]);

    const jurisdictionCoverage = await this.getJurisdictionCoverage();

    return {
      totalDocuments: templates + standards + rules,
      policyTemplates: templates,
      complianceStandards: standards,
      jurisdictionalRules: rules,
      jurisdictionCoverage,
    };
  }

  /**
   * 🌍 GET JURISDICTION COVERAGE
   */
  private async getJurisdictionCoverage(): Promise<any> {
    const coverage = {};

    for (const jurisdiction of Object.values(RegulatoryJurisdiction)) {
      const [templates, standards, rules] = await Promise.all([
        this.policyTemplateRepository.count({
          where: { jurisdiction: In([jurisdiction]), isActive: true },
        }),
        this.complianceStandardRepository.count({
          where: { jurisdiction: In([jurisdiction]), status: ComplianceStandardStatus.ACTIVE },
        }),
        this.jurisdictionalRuleRepository.count({
          where: { jurisdiction, status: JurisdictionalRuleStatus.ACTIVE },
        }),
      ]);

      coverage[jurisdiction] = {
        templates,
        standards,
        rules,
        total: templates + standards + rules,
      };
    }

    return coverage;
  }
}
