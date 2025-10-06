/**
 * @fileoverview Policy Template Management Service
 * @description Enterprise-grade policy template system for care homes with regulatory compliance
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-01-06
 * @lastModified 2025-01-06
 * 
 * @compliance
 * - CQC (Care Quality Commission) England
 * - Care Inspectorate Scotland  
 * - Care Inspectorate Wales (CIW)
 * - RQIA Northern Ireland
 * - Jersey Care Commission
 * - Guernsey Care Commission
 * - Isle of Man Care Commission
 * 
 * @security
 * - GDPR Compliant
 * - ISO 27001 Standards
 * - Role-based access control
 * - Audit trail logging
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { PolicyTemplate } from '../../entities/policy-template.entity';
import { PolicyInstance } from '../../entities/policy-instance.entity';
import { AuditTrailService } from '../audit/audit-trail.service';
import { ValidationService } from '../validation/validation.service';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';

/**
 * Policy categories aligned with care home operational requirements
 */
export enum PolicyCategory {
  SAFEGUARDING = 'safeguarding',
  MEDICATION = 'medication', 
  INFECTION_CONTROL = 'infection_control',
  HEALTH_SAFETY = 'health_safety',
  DATA_PROTECTION = 'data_protection',
  DIGNITY_RESPECT = 'dignity_respect',
  STAFF_TRAINING = 'staff_training',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  NUTRITION_HYDRATION = 'nutrition_hydration',
  END_OF_LIFE = 'end_of_life',
  MENTAL_CAPACITY = 'mental_capacity',
  COMPLAINTS = 'complaints',
  VISITORS = 'visitors',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation'
}

/**
 * Regulatory jurisdictions for compliance templates
 */
export enum RegulatoryJurisdiction {
  ENGLAND_CQC = 'england_cqc',
  SCOTLAND_CI = 'scotland_ci',
  WALES_CIW = 'wales_ciw',
  NORTHERN_IRELAND_RQIA = 'northern_ireland_rqia',
  JERSEY_JCC = 'jersey_jcc',
  GUERNSEY_GCC = 'guernsey_gcc',
  ISLE_OF_MAN_IMC = 'isle_of_man_imc',
  EU_GDPR = 'eu_gdpr',
  UK_DATA_PROTECTION = 'uk_data_protection'
}

/**
 * Template variable types for dynamic content generation
 */
export interface PolicyTemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string;
  };
}

/**
 * Policy template creation and update DTOs
 */
export interface CreatePolicyTemplateDto {
  title: string;
  category: PolicyCategory;
  jurisdiction: RegulatoryJurisdiction[];
  description: string;
  content: string;
  variables: PolicyTemplateVariable[];
  isActive: boolean;
  version: string;
  effectiveDate: Date;
  reviewFrequency: number; // months
  approvedBy: string;
  tags: string[];
}

export interface UpdatePolicyTemplateDto extends Partial<CreatePolicyTemplateDto> {
  id: string;
}

export interface GeneratePolicyDto {
  templateId: string;
  organizationId: string;
  variableValues: Record<string, any>;
  approvedBy: string;
  effectiveDate?: Date;
  customTitle?: string;
}

/**
 * Policy Template Management Service
 * Provides comprehensive policy template creation, management, and generation
 */
@Injectable()
export class PolicyTemplateService {
  private readonly logger = new Logger(PolicyTemplateService.name);

  constructor(
    @InjectRepository(PolicyTemplate)
    private readonly policyTemplateRepository: Repository<PolicyTemplate>,
    
    @InjectRepository(PolicyInstance)
    private readonly policyInstanceRepository: Repository<PolicyInstance>,
    
    private readonly auditTrailService: AuditTrailService,
    private readonly validationService: ValidationService,
    private readonly organizationService: OrganizationService
  ) {}

  /**
   * Create a new policy template
   */
  async createTemplate(
    createDto: CreatePolicyTemplateDto,
    createdBy: User
  ): Promise<PolicyTemplate> {
    this.logger.log(`Creating policy template: ${createDto.title}`);

    try {
      // Validate template content and variables
      await this.validateTemplateContent(createDto.content, createDto.variables);

      // Check for duplicate template names within category
      const existingTemplate = await this.policyTemplateRepository.findOne({
        where: {
          title: createDto.title,
          category: createDto.category,
          isActive: true
        }
      });

      if (existingTemplate) {
        throw new BadRequestException(
          `Active policy template with title "${createDto.title}" already exists in category "${createDto.category}"`
        );
      }

      // Create template entity
      const template = this.policyTemplateRepository.create({
        ...createDto,
        createdBy: createdBy.id,
        updatedBy: createdBy.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedTemplate = await this.policyTemplateRepository.save(template);

      // Log audit trail
      await this.auditTrailService.logAction({
        action: 'CREATE_POLICY_TEMPLATE',
        entityType: 'PolicyTemplate',
        entityId: savedTemplate.id,
        userId: createdBy.id,
        details: {
          templateTitle: createDto.title,
          category: createDto.category,
          jurisdiction: createDto.jurisdiction
        },
        ipAddress: createdBy.lastLoginIp,
        userAgent: 'Policy Management System'
      });

      this.logger.log(`Policy template created successfully: ${savedTemplate.id}`);
      return savedTemplate;

    } catch (error) {
      this.logger.error(`Failed to create policy template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing policy template
   */
  async updateTemplate(
    updateDto: UpdatePolicyTemplateDto,
    updatedBy: User
  ): Promise<PolicyTemplate> {
    this.logger.log(`Updating policy template: ${updateDto.id}`);

    try {
      const existingTemplate = await this.policyTemplateRepository.findOne({
        where: { id: updateDto.id }
      });

      if (!existingTemplate) {
        throw new NotFoundException(`Policy template with ID ${updateDto.id} not found`);
      }

      // Validate updated content if provided
      if (updateDto.content || updateDto.variables) {
        await this.validateTemplateContent(
          updateDto.content || existingTemplate.content,
          updateDto.variables || existingTemplate.variables
        );
      }

      // Update template
      const updateData = {
        ...updateDto,
        updatedBy: updatedBy.id,
        updatedAt: new Date(),
        version: this.incrementVersion(existingTemplate.version)
      };

      await this.policyTemplateRepository.update(updateDto.id, updateData);
      const updatedTemplate = await this.policyTemplateRepository.findOne({
        where: { id: updateDto.id }
      });

      // Log audit trail
      await this.auditTrailService.logAction({
        action: 'UPDATE_POLICY_TEMPLATE',
        entityType: 'PolicyTemplate',
        entityId: updateDto.id,
        userId: updatedBy.id,
        details: {
          changes: updateData,
          previousVersion: existingTemplate.version,
          newVersion: updateData.version
        },
        ipAddress: updatedBy.lastLoginIp,
        userAgent: 'Policy Management System'
      });

      this.logger.log(`Policy template updated successfully: ${updateDto.id}`);
      return updatedTemplate!;

    } catch (error) {
      this.logger.error(`Failed to update policy template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a policy instance from a template
   */
  async generatePolicy(
    generateDto: GeneratePolicyDto,
    generatedBy: User
  ): Promise<PolicyInstance> {
    this.logger.log(`Generating policy from template: ${generateDto.templateId}`);

    try {
      // Get template
      const template = await this.policyTemplateRepository.findOne({
        where: { 
          id: generateDto.templateId,
          isActive: true 
        }
      });

      if (!template) {
        throw new NotFoundException(`Active policy template with ID ${generateDto.templateId} not found`);
      }

      // Validate organization exists
      const organization = await this.organizationService.findById(generateDto.organizationId);
      if (!organization) {
        throw new NotFoundException(`Organization with ID ${generateDto.organizationId} not found`);
      }

      // Validate variable values
      await this.validateVariableValues(template.variables, generateDto.variableValues);

      // Generate policy content
      const generatedContent = await this.processTemplateContent(
        template.content,
        generateDto.variableValues,
        organization
      );

      // Create policy instance
      const policyInstance = this.policyInstanceRepository.create({
        templateId: generateDto.templateId,
        organizationId: generateDto.organizationId,
        title: generateDto.customTitle || template.title,
        category: template.category,
        jurisdiction: template.jurisdiction,
        content: generatedContent,
        variableValues: generateDto.variableValues,
        version: template.version,
        status: 'DRAFT',
        effectiveDate: generateDto.effectiveDate || new Date(),
        reviewDate: this.calculateReviewDate(template.reviewFrequency),
        approvedBy: generateDto.approvedBy,
        generatedBy: generatedBy.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedPolicy = await this.policyInstanceRepository.save(policyInstance);

      // Log audit trail
      await this.auditTrailService.logAction({
        action: 'GENERATE_POLICY',
        entityType: 'PolicyInstance',
        entityId: savedPolicy.id,
        userId: generatedBy.id,
        details: {
          templateId: generateDto.templateId,
          organizationId: generateDto.organizationId,
          templateTitle: template.title,
          policyTitle: savedPolicy.title
        },
        ipAddress: generatedBy.lastLoginIp,
        userAgent: 'Policy Management System'
      });

      this.logger.log(`Policy generated successfully: ${savedPolicy.id}`);
      return savedPolicy;

    } catch (error) {
      this.logger.error(`Failed to generate policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all policy templates with filtering
   */
  async getTemplates(filters: {
    category?: PolicyCategory;
    jurisdiction?: RegulatoryJurisdiction;
    isActive?: boolean;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    templates: PolicyTemplate[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      category, 
      jurisdiction, 
      isActive = true, 
      searchTerm, 
      page = 1, 
      limit = 20 
    } = filters;

    const queryBuilder = this.policyTemplateRepository.createQueryBuilder('template');

    // Apply filters
    if (category) {
      queryBuilder.andWhere('template.category = :category', { category });
    }

    if (jurisdiction) {
      queryBuilder.andWhere(':jurisdiction = ANY(template.jurisdiction)', { jurisdiction });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('template.isActive = :isActive', { isActive });
    }

    if (searchTerm) {
      queryBuilder.andWhere(
        '(template.title ILIKE :searchTerm OR template.description ILIKE :searchTerm OR :searchTerm = ANY(template.tags))',
        { searchTerm: `%${searchTerm}%` }
      );
    }

    // Add pagination
    const offset = (page - 1) * limit;
    queryBuilder
      .orderBy('template.updatedAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [templates, total] = await queryBuilder.getManyAndCount();

    return {
      templates,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get policy instances for an organization
   */
  async getOrganizationPolicies(
    organizationId: string,
    filters: {
      category?: PolicyCategory;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    policies: PolicyInstance[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { category, status, page = 1, limit = 20 } = filters;

    const queryBuilder = this.policyInstanceRepository.createQueryBuilder('policy');
    queryBuilder.where('policy.organizationId = :organizationId', { organizationId });

    if (category) {
      queryBuilder.andWhere('policy.category = :category', { category });
    }

    if (status) {
      queryBuilder.andWhere('policy.status = :status', { status });
    }

    const offset = (page - 1) * limit;
    queryBuilder
      .orderBy('policy.updatedAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [policies, total] = await queryBuilder.getManyAndCount();

    return {
      policies,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Approve a policy instance
   */
  async approvePolicy(
    policyId: string,
    approvedBy: User,
    approvalComments?: string
  ): Promise<PolicyInstance> {
    this.logger.log(`Approving policy: ${policyId}`);

    try {
      const policy = await this.policyInstanceRepository.findOne({
        where: { id: policyId }
      });

      if (!policy) {
        throw new NotFoundException(`Policy with ID ${policyId} not found`);
      }

      if (policy.status === 'APPROVED') {
        throw new BadRequestException('Policy is already approved');
      }

      // Update policy status
      await this.policyInstanceRepository.update(policyId, {
        status: 'APPROVED',
        approvedBy: approvedBy.id,
        approvedAt: new Date(),
        approvalComments,
        updatedAt: new Date()
      });

      const approvedPolicy = await this.policyInstanceRepository.findOne({
        where: { id: policyId }
      });

      // Log audit trail
      await this.auditTrailService.logAction({
        action: 'APPROVE_POLICY',
        entityType: 'PolicyInstance',
        entityId: policyId,
        userId: approvedBy.id,
        details: {
          policyTitle: policy.title,
          approvalComments,
          previousStatus: policy.status,
          newStatus: 'APPROVED'
        },
        ipAddress: approvedBy.lastLoginIp,
        userAgent: 'Policy Management System'
      });

      this.logger.log(`Policy approved successfully: ${policyId}`);
      return approvedPolicy!;

    } catch (error) {
      this.logger.error(`Failed to approve policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get policies due for review
   */
  async getPoliciesDueForReview(
    organizationId?: string,
    daysAhead: number = 30
  ): Promise<PolicyInstance[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    const queryBuilder = this.policyInstanceRepository.createQueryBuilder('policy');
    queryBuilder.where('policy.reviewDate <= :cutoffDate', { cutoffDate });
    queryBuilder.andWhere('policy.status = :status', { status: 'APPROVED' });

    if (organizationId) {
      queryBuilder.andWhere('policy.organizationId = :organizationId', { organizationId });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Private helper methods
   */

  private async validateTemplateContent(
    content: string,
    variables: PolicyTemplateVariable[]
  ): Promise<void> {
    // Check that all variables referenced in content are defined
    const variableNames = variables.map(v => v.name);
    const contentVariables = this.extractVariablesFromContent(content);
    
    const undefinedVariables = contentVariables.filter(v => !variableNames.includes(v));
    if (undefinedVariables.length > 0) {
      throw new BadRequestException(
        `Template content references undefined variables: ${undefinedVariables.join(', ')}`
      );
    }

    // Validate variable definitions
    for (const variable of variables) {
      if (!variable.name || !variable.type || !variable.label) {
        throw new BadRequestException('All variables must have name, type, and label');
      }

      if (variable.type === 'select' || variable.type === 'multiselect') {
        if (!variable.options || variable.options.length === 0) {
          throw new BadRequestException(
            `Variable "${variable.name}" of type "${variable.type}" must have options`
          );
        }
      }
    }
  }

  private extractVariablesFromContent(content: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)];
  }

  private async validateVariableValues(
    variables: PolicyTemplateVariable[],
    values: Record<string, any>
  ): Promise<void> {
    for (const variable of variables) {
      const value = values[variable.name];

      // Check required variables
      if (variable.required && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`Required variable "${variable.name}" is missing`);
      }

      if (value !== undefined && value !== null) {
        // Type validation
        switch (variable.type) {
          case 'number':
            if (isNaN(Number(value))) {
              throw new BadRequestException(`Variable "${variable.name}" must be a number`);
            }
            break;
          
          case 'date':
            if (!Date.parse(value)) {
              throw new BadRequestException(`Variable "${variable.name}" must be a valid date`);
            }
            break;
          
          case 'boolean':
            if (typeof value !== 'boolean') {
              throw new BadRequestException(`Variable "${variable.name}" must be a boolean`);
            }
            break;
          
          case 'select':
            if (!variable.options?.includes(value)) {
              throw new BadRequestException(
                `Variable "${variable.name}" must be one of: ${variable.options?.join(', ')}`
              );
            }
            break;
          
          case 'multiselect':
            if (!Array.isArray(value) || !value.every(v => variable.options?.includes(v))) {
              throw new BadRequestException(
                `Variable "${variable.name}" must be an array of values from: ${variable.options?.join(', ')}`
              );
            }
            break;
        }

        // Additional validation rules
        if (variable.validation) {
          const validation = variable.validation;
          
          if (validation.min !== undefined && Number(value) < validation.min) {
            throw new BadRequestException(`Variable "${variable.name}" must be at least ${validation.min}`);
          }
          
          if (validation.max !== undefined && Number(value) > validation.max) {
            throw new BadRequestException(`Variable "${variable.name}" must be at most ${validation.max}`);
          }
          
          if (validation.pattern && !new RegExp(validation.pattern).test(String(value))) {
            throw new BadRequestException(`Variable "${variable.name}" does not match required pattern`);
          }
        }
      }
    }
  }

  private async processTemplateContent(
    content: string,
    variableValues: Record<string, any>,
    organization: Organization
  ): Promise<string> {
    let processedContent = content;

    // Replace organization variables
    processedContent = processedContent
      .replace(/\{\{organization\.name\}\}/g, organization.name)
      .replace(/\{\{organization\.address\}\}/g, organization.address || '')
      .replace(/\{\{organization\.registrationNumber\}\}/g, organization.registrationNumber || '')
      .replace(/\{\{organization\.contactEmail\}\}/g, organization.contactEmail || '')
      .replace(/\{\{organization\.contactPhone\}\}/g, organization.contactPhone || '');

    // Replace custom variables
    for (const [name, value] of Object.entries(variableValues)) {
      const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, String(value || ''));
    }

    // Replace system variables
    const now = new Date();
    processedContent = processedContent
      .replace(/\{\{currentDate\}\}/g, now.toLocaleDateString('en-GB'))
      .replace(/\{\{currentDateTime\}\}/g, now.toLocaleString('en-GB'))
      .replace(/\{\{currentYear\}\}/g, now.getFullYear().toString());

    return processedContent;
  }

  private incrementVersion(currentVersion: string): string {
    const versionParts = currentVersion.split('.');
    const patchVersion = parseInt(versionParts[2] || '0') + 1;
    return `${versionParts[0]}.${versionParts[1]}.${patchVersion}`;
  }

  private calculateReviewDate(reviewFrequencyMonths: number): Date {
    const reviewDate = new Date();
    reviewDate.setMonth(reviewDate.getMonth() + reviewFrequencyMonths);
    return reviewDate;
  }
}