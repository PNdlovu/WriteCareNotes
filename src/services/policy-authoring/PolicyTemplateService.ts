/**
 * Policy Template Service - Template Library Management
 * 
 * Implements the PolicyGovernanceEngine template library with:
 * - Pre-built templates for safeguarding, data protection, complaints
 * - Template customization and organization-specific modifications
 * - Template search, filtering, and recommendation engine
 * - Usage analytics and template optimization
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PolicyTemplate, PolicyCategory, Jurisdiction, TemplateStatus, RichTextContent, TemplateSection, TemplateField, ComplianceMapping } from '../../entities/policy-authoring/PolicyTemplate';
import { PolicyDraft } from '../../entities/policy-draft.entity';
import { AuditTrailService } from '../audit/AuditTrailService';

export interface CreateTemplateDto {
  title: string;
  description?: string;
  category: PolicyCategory;
  jurisdiction: Jurisdiction[];
  content: RichTextContent;
  sections?: TemplateSection[];
  customizableFields?: TemplateField[];
  complianceMapping?: ComplianceMapping[];
  linkedModules?: string[];
  tags?: string[];
  metadata?: any;
  requiresApproval?: boolean;
  organizationId?: string;
}

export interface TemplateSearchFilters {
  category?: PolicyCategory[];
  jurisdiction?: Jurisdiction[];
  tags?: string[];
  difficultyLevel?: string[];
  estimatedTimeMin?: number;
  estimatedTimeMax?: number;
  rating?: number;
  organizationId?: string;
  isSystemTemplate?: boolean;
  search?: string;
}

export interface TemplateRecommendation {
  template: PolicyTemplate;
  score: number;
  reasons: string[];
  missingRequirements: string[];
}

@Injectable()
export class PolicyTemplateService {
  private readonly logger = new Logger(PolicyTemplateService.name);

  constructor(
    @InjectRepository(PolicyTemplate)
    private readonly templateRepository: Repository<PolicyTemplate>,
    private readonly auditTrailService: AuditTrailService
  ) {}

  /**
   * Initialize system templates on application startup
   */
  async initializeSystemTemplates(): Promise<void> {
    this.logger.log('Initializing system policy templates');

    const existingTemplates = await this.templateRepository.find({
      where: { isSystemTemplate: true }
    });

    if (existingTemplates.length === 0) {
      await this.createSystemTemplates();
      this.logger.log('System templates created successfully');
    } else {
      this.logger.log(`Found ${existingTemplates.length} existing system templates`);
    }
  }

  /**
   * Create pre-built system templates
   */
  private async createSystemTemplates(): Promise<void> {
    const systemTemplates: CreateTemplateDto[] = [
      // Safeguarding Policy Template
      {
        title: 'Adult Safeguarding Policy',
        description: 'Comprehensive safeguarding policy template compliant with Care Act 2014 and local safeguarding procedures',
        category: PolicyCategory.SAFEGUARDING,
        jurisdiction: [Jurisdiction.ENGLAND_CQC, Jurisdiction.SCOTLAND_CI, Jurisdiction.WALES_CIW, Jurisdiction.NORTHERN_IRELAND_RQIA],
        content: this.getSafeguardingTemplateContent(),
        sections: this.getSafeguardingSections(),
        customizableFields: this.getSafeguardingFields(),
        complianceMapping: [
          {
            standard: 'CQC-KLOE-Safe',
            requirement: 'Safeguarding people from abuse and improper treatment',
            description: 'Systems and processes to protect people from abuse',
            evidenceRequired: ['Safeguarding policy', 'Training records', 'Incident logs']
          },
          {
            standard: 'Care-Act-2014',
            requirement: 'Local Authority safeguarding duties',
            description: 'Compliance with statutory safeguarding requirements',
            evidenceRequired: ['Policy document', 'Referral procedures', 'Multi-agency working']
          }
        ],
        linkedModules: ['safeguarding', 'training', 'incident_management'],
        tags: ['safeguarding', 'adult_protection', 'cqc_compliance', 'care_act'],
        metadata: {
          estimatedTimeToComplete: 120,
          difficultyLevel: 'intermediate',
          requiredRoles: ['Registered Manager', 'Deputy Manager', 'Safeguarding Lead'],
          reviewFrequency: 'annually'
        }
      },

      // Data Protection Policy Template
      {
        title: 'Data Protection and Privacy Policy',
        description: 'GDPR and Data Protection Act 2018 compliant policy template for care settings',
        category: PolicyCategory.DATA_PROTECTION,
        jurisdiction: [Jurisdiction.EU_GDPR, Jurisdiction.UK_DATA_PROTECTION],
        content: this.getDataProtectionTemplateContent(),
        sections: this.getDataProtectionSections(),
        customizableFields: this.getDataProtectionFields(),
        complianceMapping: [
          {
            standard: 'GDPR-Article-6',
            requirement: 'Lawful basis for processing',
            description: 'Legitimate grounds for processing personal data',
            evidenceRequired: ['Privacy policy', 'Consent forms', 'Legal basis assessment']
          },
          {
            standard: 'GDPR-Article-32',
            requirement: 'Security of processing',
            description: 'Technical and organizational security measures',
            evidenceRequired: ['Security policy', 'Technical measures', 'Staff training']
          }
        ],
        linkedModules: ['data_protection', 'training', 'security'],
        tags: ['gdpr', 'data_protection', 'privacy', 'security'],
        metadata: {
          estimatedTimeToComplete: 90,
          difficultyLevel: 'advanced',
          requiredRoles: ['Data Protection Officer', 'Registered Manager'],
          reviewFrequency: 'annually'
        }
      },

      // Complaints Policy Template
      {
        title: 'Complaints Handling Policy',
        description: 'Comprehensive complaints procedure compliant with regulatory requirements',
        category: PolicyCategory.COMPLAINTS,
        jurisdiction: [Jurisdiction.ENGLAND_CQC, Jurisdiction.SCOTLAND_CI, Jurisdiction.WALES_CIW, Jurisdiction.NORTHERN_IRELAND_RQIA],
        content: this.getComplaintsTemplateContent(),
        sections: this.getComplaintsSections(),
        customizableFields: this.getComplaintsFields(),
        complianceMapping: [
          {
            standard: 'CQC-KLOE-Responsive',
            requirement: 'Listening and learning from concerns and complaints',
            description: 'Effective complaints handling system',
            evidenceRequired: ['Complaints policy', 'Complaints log', 'Resolution evidence']
          }
        ],
        linkedModules: ['complaints', 'quality_assurance', 'communication'],
        tags: ['complaints', 'feedback', 'quality_improvement'],
        metadata: {
          estimatedTimeToComplete: 60,
          difficultyLevel: 'beginner',
          requiredRoles: ['Registered Manager', 'Quality Lead'],
          reviewFrequency: 'annually'
        }
      },

      // Medication Management Policy Template
      {
        title: 'Medication Management Policy',
        description: 'Safe medication handling, administration, and storage policy',
        category: PolicyCategory.MEDICATION,
        jurisdiction: [Jurisdiction.ENGLAND_CQC, Jurisdiction.SCOTLAND_CI, Jurisdiction.WALES_CIW, Jurisdiction.NORTHERN_IRELAND_RQIA],
        content: this.getMedicationTemplateContent(),
        sections: this.getMedicationSections(),
        customizableFields: this.getMedicationFields(),
        complianceMapping: [
          {
            standard: 'CQC-KLOE-Safe',
            requirement: 'Safe use of medicines',
            description: 'Medicines are managed safely',
            evidenceRequired: ['Medication policy', 'MAR charts', 'Training records', 'Audit results']
          },
          {
            standard: 'NICE-SC1',
            requirement: 'Managing medicines in care homes',
            description: 'NICE guidelines compliance',
            evidenceRequired: ['Policy alignment', 'Procedure documents', 'Training evidence']
          }
        ],
        linkedModules: ['medication', 'training', 'health_monitoring'],
        tags: ['medication', 'safety', 'mar_charts', 'nice_guidelines'],
        metadata: {
          estimatedTimeToComplete: 150,
          difficultyLevel: 'advanced',
          requiredRoles: ['Registered Nurse', 'Registered Manager', 'Senior Carer'],
          reviewFrequency: 'annually'
        }
      },

      // Health and Safety Policy Template
      {
        title: 'Health and Safety Policy',
        description: 'Comprehensive health and safety policy for care environments',
        category: PolicyCategory.HEALTH_SAFETY,
        jurisdiction: [Jurisdiction.ENGLAND_CQC, Jurisdiction.SCOTLAND_CI, Jurisdiction.WALES_CIW, Jurisdiction.NORTHERN_IRELAND_RQIA],
        content: this.getHealthSafetyTemplateContent(),
        sections: this.getHealthSafetySections(),
        customizableFields: this.getHealthSafetyFields(),
        complianceMapping: [
          {
            standard: 'HSE-Care-Sector',
            requirement: 'Health and safety management',
            description: 'Systematic approach to health and safety',
            evidenceRequired: ['H&S policy', 'Risk assessments', 'Training records', 'Incident reports']
          }
        ],
        linkedModules: ['health_safety', 'risk_management', 'training'],
        tags: ['health_safety', 'risk_assessment', 'hse_compliance'],
        metadata: {
          estimatedTimeToComplete: 180,
          difficultyLevel: 'intermediate',
          requiredRoles: ['Health and Safety Officer', 'Registered Manager'],
          reviewFrequency: 'annually'
        }
      }
    ];

    // Create each system template
    for (const templateData of systemTemplates) {
      const template = this.templateRepository.create({
        ...templateData,
        isSystemTemplate: true,
        status: TemplateStatus.ACTIVE,
        version: '1.0'
      });

      await this.templateRepository.save(template);
      this.logger.debug(`Created system template: ${template.title}`);
    }
  }

  /**
   * Create new policy template
   */
  async createTemplate(createDto: CreateTemplateDto, createdBy: string): Promise<PolicyTemplate> {
    this.logger.log(`Creating new policy template: ${createDto.title}`);

    const template = this.templateRepository.create({
      ...createDto,
      createdBy,
      updatedBy: createdBy,
      status: TemplateStatus.ACTIVE,
      version: '1.0',
      isSystemTemplate: false
    });

    const savedTemplate = await this.templateRepository.save(template);

    // Create audit event
    await this.auditTrailService.logTemplateEvent('template_created', savedTemplate.id, createdBy, {
      templateTitle: savedTemplate.title,
      category: savedTemplate.category,
      jurisdiction: savedTemplate.jurisdiction
    });

    this.logger.log(`Policy template created with ID: ${savedTemplate.id}`);
    return savedTemplate;
  }

  /**
   * Get all templates with filtering
   */
  async getTemplates(
    filters: TemplateSearchFilters = {},
    organizationId?: string
  ): Promise<PolicyTemplate[]> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template');

    // Base filters
    queryBuilder.where('template.status = :status', { status: TemplateStatus.ACTIVE });

    // Category filter
    if (filters.category && filters.category.length > 0) {
      queryBuilder.andWhere('template.category IN (:...categories)', { categories: filters.category });
    }

    // Jurisdiction filter
    if (filters.jurisdiction && filters.jurisdiction.length > 0) {
      queryBuilder.andWhere('template.jurisdiction && :jurisdictions', { 
        jurisdictions: filters.jurisdiction 
      });
    }

    // Organization filter - show system templates + org-specific templates
    if (organizationId) {
      queryBuilder.andWhere(
        '(template.isSystemTemplate = true OR template.organizationId = :orgId)',
        { orgId: organizationId }
      );
    } else if (filters.organizationId) {
      queryBuilder.andWhere('template.organizationId = :orgId', { orgId: filters.organizationId });
    }

    // System template filter
    if (filters.isSystemTemplate !== undefined) {
      queryBuilder.andWhere('template.isSystemTemplate = :isSystem', { 
        isSystem: filters.isSystemTemplate 
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('template.tags && :tags', { tags: filters.tags });
    }

    // Difficulty level filter
    if (filters.difficultyLevel && filters.difficultyLevel.length > 0) {
      queryBuilder.andWhere("template.metadata->>'difficultyLevel' IN (:...levels)", { 
        levels: filters.difficultyLevel 
      });
    }

    // Estimated time filters
    if (filters.estimatedTimeMin) {
      queryBuilder.andWhere("(template.metadata->>'estimatedTimeToComplete')::int >= :minTime", { 
        minTime: filters.estimatedTimeMin 
      });
    }
    if (filters.estimatedTimeMax) {
      queryBuilder.andWhere("(template.metadata->>'estimatedTimeToComplete')::int <= :maxTime", { 
        maxTime: filters.estimatedTimeMax 
      });
    }

    // Rating filter
    if (filters.rating) {
      queryBuilder.andWhere('template.averageRating >= :rating', { rating: filters.rating });
    }

    // Search filter (title, description, tags)
    if (filters.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(template.title) LIKE :search OR LOWER(template.description) LIKE :search OR array_to_string(template.tags, " ") ILIKE :search)',
        { search: searchTerm }
      );
    }

    // Order by usage and rating
    queryBuilder.orderBy('template.usageCount', 'DESC')
                .addOrderBy('template.averageRating', 'DESC')
                .addOrderBy('template.updatedAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string, organizationId?: string): Promise<PolicyTemplate> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template')
      .where('template.id = :id', { id })
      .andWhere('template.status = :status', { status: TemplateStatus.ACTIVE });

    // Access control - system templates or org-specific templates
    if (organizationId) {
      queryBuilder.andWhere(
        '(template.isSystemTemplate = true OR template.organizationId = :orgId)',
        { orgId: organizationId }
      );
    }

    const template = await queryBuilder.getOne();

    if (!template) {
      throw new NotFoundException(`Policy template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Create policy draft from template
   */
  async createPolicyFromTemplate(
    templateId: string,
    title: string,
    customizations: Record<string, any>,
    organizationId: string,
    createdBy: string
  ): Promise<Partial<PolicyDraft>> {
    const template = await this.getTemplateById(templateId, organizationId);

    this.logger.log(`Creating policy from template: ${template.title}`);

    // Apply customizations to template content
    const customizedContent = this.applyCustomizations(template.content, template.customizableFields, customizations);

    // Increment template usage
    template.incrementUsage();
    await this.templateRepository.save(template);

    // Create policy draft structure
    const policyDraft: Partial<PolicyDraft> = {
      title,
      content: customizedContent,
      category: template.category,
      jurisdiction: template.jurisdiction,
      linkedModules: template.linkedModules,
      status: 'draft' as any, // Will be properly typed in PolicyDraft
      version: '1.0',
      organizationId,
      createdBy,
      description: `Policy created from template: ${template.title}`,
      tags: template.tags,
      reviewDue: this.calculateReviewDate(template.metadata?.reviewFrequency || 'annually')
    };

    // Create audit event
    await this.auditTrailService.logTemplateEvent('policy_created_from_template', template.id, createdBy, {
      templateTitle: template.title,
      policyTitle: title,
      customizations: Object.keys(customizations)
    });

    return policyDraft;
  }

  /**
   * Get template recommendations for organization
   */
  async getTemplateRecommendations(
    organizationId: string,
    existingPolicyCategories: PolicyCategory[],
    organizationJurisdictions: Jurisdiction[],
    organizationModules: string[]
  ): Promise<TemplateRecommendation[]> {
    const allTemplates = await this.getTemplates({}, organizationId);
    const recommendations: TemplateRecommendation[] = [];

    for (const template of allTemplates) {
      const score = this.calculateRecommendationScore(
        template,
        existingPolicyCategories,
        organizationJurisdictions,
        organizationModules
      );

      if (score > 0) {
        const reasons = this.getRecommendationReasons(
          template,
          existingPolicyCategories,
          organizationJurisdictions,
          organizationModules
        );

        const missingRequirements = this.getMissingRequirements(template, organizationModules);

        recommendations.push({
          template,
          score,
          reasons,
          missingRequirements
        });
      }
    }

    // Sort by score descending
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Rate a template
   */
  async rateTemplate(templateId: string, rating: number, userId: string): Promise<PolicyTemplate> {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const template = await this.getTemplateById(templateId);
    template.addRating(rating);
    
    const updatedTemplate = await this.templateRepository.save(template);

    // Create audit event
    await this.auditTrailService.logTemplateEvent('template_rated', template.id, userId, {
      rating,
      newAverageRating: template.averageRating,
      totalReviews: template.reviewCount
    });

    return updatedTemplate;
  }

  /**
   * Apply customizations to template content
   */
  private applyCustomizations(
    content: RichTextContent,
    customizableFields: TemplateField[],
    customizations: Record<string, any>
  ): RichTextContent {
    // Deep clone content to avoid mutations
    const customizedContent = JSON.parse(JSON.stringify(content));

    // Replace customizable field placeholders with actual values
    customizableFields.forEach(field => {
      const customValue = customizations[field.id] || field.defaultValue || `[${field.label}]`;
      
      // Recursively replace placeholders in content
      this.replacePlaceholder(customizedContent, `{{${field.id}}}`, customValue);
    });

    return customizedContent;
  }

  /**
   * Replace placeholder in content recursively
   */
  private replacePlaceholder(content: any, placeholder: string, value: any): void {
    if (typeof content === 'string') {
      return content.replace(new RegExp(placeholder, 'g'), value);
    }

    if (Array.isArray(content)) {
      content.forEach(item => this.replacePlaceholder(item, placeholder, value));
    }

    if (typeof content === 'object' && content !== null) {
      Object.keys(content).forEach(key => {
        if (key === 'text' && typeof content[key] === 'string') {
          content[key] = content[key].replace(new RegExp(placeholder, 'g'), value);
        } else {
          this.replacePlaceholder(content[key], placeholder, value);
        }
      });
    }
  }

  /**
   * Calculate recommendation score
   */
  private calculateRecommendationScore(
    template: PolicyTemplate,
    existingCategories: PolicyCategory[],
    jurisdictions: Jurisdiction[],
    modules: string[]
  ): number {
    let score = 0;

    // High priority for missing essential categories
    if (!existingCategories.includes(template.category)) {
      const essentialCategories = [
        PolicyCategory.SAFEGUARDING,
        PolicyCategory.DATA_PROTECTION,
        PolicyCategory.HEALTH_SAFETY,
        PolicyCategory.COMPLAINTS
      ];
      
      if (essentialCategories.includes(template.category)) {
        score += 100; // High priority for essential missing policies
      } else {
        score += 50; // Medium priority for other missing policies
      }
    }

    // Jurisdiction match
    const jurisdictionMatch = template.jurisdiction.some(j => jurisdictions.includes(j));
    if (jurisdictionMatch) {
      score += 30;
    }

    // Module compatibility
    const moduleMatch = template.linkedModules.some(m => modules.includes(m));
    if (moduleMatch) {
      score += 20;
    }

    // Quality indicators
    score += template.averageRating * 5; // 0-25 points based on rating
    score += Math.min(template.usageCount / 10, 10); // 0-10 points based on usage

    // System template bonus (trusted templates)
    if (template.isSystemTemplate) {
      score += 15;
    }

    return Math.round(score);
  }

  /**
   * Get recommendation reasons
   */
  private getRecommendationReasons(
    template: PolicyTemplate,
    existingCategories: PolicyCategory[],
    jurisdictions: Jurisdiction[],
    modules: string[]
  ): string[] {
    const reasons = [];

    if (!existingCategories.includes(template.category)) {
      reasons.push(`Missing ${template.category.replace('_', ' ')} policy`);
    }

    const jurisdictionMatch = template.jurisdiction.some(j => jurisdictions.includes(j));
    if (jurisdictionMatch) {
      reasons.push('Matches your regulatory jurisdiction');
    }

    const moduleMatch = template.linkedModules.some(m => modules.includes(m));
    if (moduleMatch) {
      reasons.push('Compatible with your enabled modules');
    }

    if (template.averageRating >= 4) {
      reasons.push(`Highly rated (${template.averageRating}/5.0)`);
    }

    if (template.usageCount > 50) {
      reasons.push('Popular template used by many organizations');
    }

    if (template.isSystemTemplate) {
      reasons.push('Trusted system template');
    }

    return reasons;
  }

  /**
   * Get missing requirements for template
   */
  private getMissingRequirements(template: PolicyTemplate, modules: string[]): string[] {
    const missing = [];

    // Check if required modules are enabled
    template.linkedModules.forEach(module => {
      if (!modules.includes(module)) {
        missing.push(`Required module: ${module.replace('_', ' ')}`);
      }
    });

    // Check required roles from metadata
    if (template.metadata?.requiredRoles) {
      template.metadata.requiredRoles.forEach((role: string) => {
        missing.push(`Required role: ${role}`);
      });
    }

    return missing;
  }

  /**
   * Calculate review due date based on frequency
   */
  private calculateReviewDate(frequency: string): Date {
    const now = new Date();
    const reviewDate = new Date(now);

    switch (frequency) {
      case 'monthly':
        reviewDate.setMonth(reviewDate.getMonth() + 1);
        break;
      case 'quarterly':
        reviewDate.setMonth(reviewDate.getMonth() + 3);
        break;
      case 'biannually':
        reviewDate.setMonth(reviewDate.getMonth() + 6);
        break;
      case 'annually':
      default:
        reviewDate.setFullYear(reviewDate.getFullYear() + 1);
        break;
    }

    return reviewDate;
  }

  // Template content generators would be implemented here
  // These are placeholder methods that would contain the actual rich text content

  private getSafeguardingTemplateContent(): RichTextContent {
    return {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '{{organizationName}} Adult Safeguarding Policy' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This policy outlines {{organizationName}}\'s commitment to safeguarding adults at risk and promoting their welfare and protection from abuse and neglect.' }]
        }
        // Additional content sections would be defined here
      ]
    };
  }

  private getSafeguardingSections(): TemplateSection[] {
    return [
      {
        id: 'organization_details',
        title: 'Organization Details',
        description: 'Basic organization information',
        order: 1,
        fields: [
          {
            id: 'organizationName',
            name: 'organizationName',
            type: 'text',
            label: 'Organization Name',
            required: true,
            defaultValue: ''
          }
        ]
      }
      // Additional sections would be defined here
    ];
  }

  private getSafeguardingFields(): TemplateField[] {
    return [
      {
        id: 'organizationName',
        name: 'organizationName',
        type: 'text',
        label: 'Organization Name',
        description: 'The legal name of your care organization',
        required: true,
        helpText: 'Enter the full registered name of your organization'
      }
      // Additional fields would be defined here
    ];
  }

  // Similar methods would be implemented for other template types
  private getDataProtectionTemplateContent(): RichTextContent { return { type: 'doc', content: [] }; }
  private getDataProtectionSections(): TemplateSection[] { return []; }
  private getDataProtectionFields(): TemplateField[] { return []; }
  
  private getComplaintsTemplateContent(): RichTextContent { return { type: 'doc', content: [] }; }
  private getComplaintsSections(): TemplateSection[] { return []; }
  private getComplaintsFields(): TemplateField[] { return []; }
  
  private getMedicationTemplateContent(): RichTextContent { return { type: 'doc', content: [] }; }
  private getMedicationSections(): TemplateSection[] { return []; }
  private getMedicationFields(): TemplateField[] { return []; }
  
  private getHealthSafetyTemplateContent(): RichTextContent { return { type: 'doc', content: [] }; }
  private getHealthSafetySections(): TemplateSection[] { return []; }
  private getHealthSafetyFields(): TemplateField[] { return []; }
}