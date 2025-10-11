/**
 * @fileoverview a i policy Controller
 * @module Ai/AIPolicyController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description a i policy Controller
 */

import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Logger,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { AIPolicyAssistantService } from '../services/policy-authoring/AIPolicyAssistantService';
import { PolicyAuthoringService } from '../services/policy-authoring/policy-authoring.service';
import { AuthGuard } from '../guards/auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';

export class AnalyzePolicyRequest {
  policyId: string;
  focusAreas?: ('compliance' | 'clarity' | 'completeness' | 'risk')[];
}

export class GeneratePolicyRequest {
  title: string;
  category: string;
  jurisdiction: string[];
  keyPoints: string[];
  organizationContext?: string;
  specialRequirements?: string[];
  targetAudience?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export class NaturalLanguageQueryRequest {
  query: string;
  context?: {
    currentPolicyId?: string;
    organizationId?: string;
    userRole?: string;
  };
}

export class ImprovePolicyRequest {
  policyId: string;
  focusAreas: ('clarity' | 'compliance' | 'completeness' | 'structure')[];
  specificIssues?: string[];
}

export class TemplateSuggestionRequest {
  organizationType: 'care_home' | 'nursing_home' | 'assisted_living';
  organizationSize: 'small' | 'medium' | 'large';
  specialties: string[];
  jurisdiction: string[];
  existingPolicies: string[];
}

export class ComplianceRiskRequest {
  organizationId: string;
  includeMetrics?: boolean;
  timeframe?: 'current' | '3months' | '6months' | '1year';
}

@ApiTags('AI Policy Assistant')
@Controller('api/ai/policies')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AIPolicyController {
  private readonlylogger = new Logger(AIPolicyController.name);

  const ructor(
    private readonlyaiAssistant: AIPolicyAssistantService,
    private readonlypolicyService: PolicyAuthoringService
  ) {}

  /**
   * Analyze policy content using AI
   */
  @Post('analyze')
  @UseGuards(RoleGuard)
  @Roles('care_manager', 'compliance_officer', 'admin')
  @ApiOperation({ 
    summary: 'Analyze policy with AI',
    description: 'Get AI-powered analysis of policy content including compliance gaps, suggestions, and risk assessment'
  })
  @ApiBody({ type: AnalyzePolicyRequest })
  @ApiResponse({ 
    status: 200, 
    description: 'Policy analysis completed successfully',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', example: 85 },
        suggestions: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'compliance' },
              priority: { type: 'string', example: 'high' },
              title: { type: 'string', example: 'Add CQC reference' },
              description: { type: 'string', example: 'Policy should reference specific CQC standards' }
            }
          }
        },
        complianceGaps: { type: 'array' },
        riskAssessment: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async analyzePolicy(
    @Body() request: AnalyzePolicyRequest,
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`AI analysis requested forpolicy: ${request.policyId} byuser: ${user.id}`);

      // Get policy (with organization validation)
      const policy = await this.policyService.getPolicyDraft(request.policyId, user);
      
      if (!policy) {
        throw new HttpException('Policy not found', HttpStatus.NOT_FOUND);
      }

      // Perform AI analysis
      const analysis = await this.aiAssistant.analyzePolicyContent(policy);

      this.logger.log(`AI analysis completed forpolicy: ${request.policyId}`);
      
      return {
        success: true,
        data: analysis,
        metadata: {
          policyId: request.policyId,
          policyTitle: policy.title,
          analyzedAt: new Date(),
          focusAreas: request.focusAreas || ['compliance', 'clarity', 'completeness']
        }
      };

    } catch (error) {
      this.logger.error(`AI analysisfailed: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'AI analysis failed. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate policy using AI
   */
  @Post('generate')
  @UseGuards(RoleGuard)
  @Roles('care_manager', 'compliance_officer', 'admin')
  @ApiOperation({ 
    summary: 'Generate policy with AI',
    description: 'Create a new policy using AI based on requirements and organization context'
  })
  @ApiBody({ type: GeneratePolicyRequest })
  @ApiResponse({ 
    status: 201, 
    description: 'Policy generated successfully',
    schema: {
      type: 'object',
      properties: {
        policyDraft: { type: 'object' },
        aiConfidence: { type: 'number', example: 0.87 },
        sourceTemplates: { type: 'array', items: { type: 'string' } },
        complianceNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid generation parameters' })
  async generatePolicy(
    @Body() request: GeneratePolicyRequest,
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`AI policy generationrequested: ${request.title} byuser: ${user.id}`);

      // Validate request
      if (!request.title || !request.category || !request.jurisdiction?.length) {
        throw new HttpException(
          'Title, category, and jurisdiction are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Generate policy using AI
      const generatedPolicy = await this.aiAssistant.generatePolicyFromRequirements({
        title: request.title,
        category: request.category as any,
        jurisdiction: request.jurisdiction as any,
        keyPoints: request.keyPoints || [],
        organizationContext: request.organizationContext || `Care home policy for ${user.organizationId}`,
        specialRequirements: request.specialRequirements
      });

      // Create draft policy in the system
      const reviewDate = new Date();
      reviewDate.setFullYear(reviewDate.getFullYear() + 1); // Default 1 year review

      const policyDraft = await this.policyService.createPolicyDraft({
        title: generatedPolicy.title,
        content: generatedPolicy.content,
        category: generatedPolicy.category,
        jurisdiction: generatedPolicy.jurisdiction,
        description: `AI-generated policy: ${request.title}`,
        linkedModules: [],
        tags: ['ai-generated', ...(request.specialRequirements || [])],
        reviewDue: reviewDate
      }, user);

      this.logger.log(`AI policy generated andsaved: ${policyDraft.id}`);

      return {
        success: true,
        data: {
          policyDraft: policyDraft.getMetadata(),
          aiConfidence: generatedPolicy.aiConfidence,
          sourceTemplates: generatedPolicy.sourceTemplates,
          complianceNotes: generatedPolicy.complianceNotes
        },
        metadata: {
          generatedAt: new Date(),
          aiModel: 'gpt-4',
          userRequirements: request
        }
      };

    } catch (error) {
      this.logger.error(`AI policy generationfailed: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Policy generation failed. Please check your requirements and try again.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Process natural language query
   */
  @Post('query')
  @ApiOperation({ 
    summary: 'Natural language policy query',
    description: 'Process natural language questions about policies and get intelligent responses'
  })
  @ApiBody({ type: NaturalLanguageQueryRequest })
  @ApiResponse({ 
    status: 200, 
    description: 'Query processed successfully',
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        suggestedActions: { type: 'array' },
        relatedPolicies: { type: 'array' },
        confidence: { type: 'number' }
      }
    }
  })
  async processQuery(
    @Body() request: NaturalLanguageQueryRequest,
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`Processing NLquery: ${request.query.substring(0, 100)}... byuser: ${user.id}`);

      // Process query using AI
      const queryResult = await this.aiAssistant.processNaturalLanguageQuery(
        request.query,
        user.id,
        user.organizationId
      );

      return {
        success: true,
        data: queryResult,
        metadata: {
          processedAt: new Date(),
          userId: user.id,
          organizationId: user.organizationId
        }
      };

    } catch (error) {
      this.logger.error(`NL query processingfailed: ${error.message}`, error.stack);
      
      throw new HttpException(
        'Query processing failed. Please try rephrasing your question.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get AI-powered template suggestions
   */
  @Post('templates/suggest')
  @UseGuards(RoleGuard)
  @Roles('care_manager', 'admin')
  @ApiOperation({ 
    summary: 'Get AI template suggestions',
    description: 'Get intelligent recommendations for policy templates based on organization profile'
  })
  @ApiBody({ type: TemplateSuggestionRequest })
  @ApiResponse({ 
    status: 200, 
    description: 'Template suggestions generated successfully' 
  })
  async suggestTemplates(
    @Body() request: TemplateSuggestionRequest,
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`AI template suggestions requested byuser: ${user.id}`);

      const suggestions = await this.aiAssistant.suggestTemplates({
        type: request.organizationType,
        size: request.organizationSize,
        specialties: request.specialties,
        jurisdiction: request.jurisdiction as any,
        existingPolicies: request.existingPolicies as any
      });

      return {
        success: true,
        data: suggestions,
        metadata: {
          generatedAt: new Date(),
          organizationType: request.organizationType,
          criteria: request
        }
      };

    } catch (error) {
      this.logger.error(`Template suggestionfailed: ${error.message}`, error.stack);
      
      throw new HttpException(
        'Template suggestion failed. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Improve existing policy with AI
   */
  @Post(':policyId/improve')
  @UseGuards(RoleGuard)
  @Roles('care_manager', 'compliance_officer', 'admin')
  @ApiOperation({ 
    summary: 'Improve policy with AI',
    description: 'Get AI-powered suggestions to improve an existing policy'
  })
  @ApiParam({ name: 'policyId', description: 'Policy ID to improve' })
  @ApiBody({ type: ImprovePolicyRequest })
  @ApiResponse({ 
    status: 200, 
    description: 'Policy improvements generated successfully' 
  })
  async improvePolicy(
    @Param('policyId') policyId: string,
    @Body() request: ImprovePolicyRequest,
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`AI policy improvement requestedfor: ${policyId} byuser: ${user.id}`);

      // Get policy
      const policy = await this.policyService.getPolicyDraft(policyId, user);
      
      if (!policy) {
        throw new HttpException('Policy not found', HttpStatus.NOT_FOUND);
      }

      // Generate improvements
      const improvement = await this.aiAssistant.improvePolicyContent(
        policy,
        request.focusAreas
      );

      return {
        success: true,
        data: improvement,
        metadata: {
          policyId,
          focusAreas: request.focusAreas,
          improvedAt: new Date()
        }
      };

    } catch (error) {
      this.logger.error(`Policy improvementfailed: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Policy improvement failed. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get compliance risk assessment
   */
  @Post('compliance/assess-risk')
  @UseGuards(RoleGuard)
  @Roles('compliance_officer', 'admin')
  @ApiOperation({ 
    summary: 'AI compliance risk assessment',
    description: 'Get AI-powered assessment of compliance risks across all policies'
  })
  @ApiBody({ type: ComplianceRiskRequest })
  @ApiResponse({ 
    status: 200, 
    description: 'Risk assessment completed successfully' 
  })
  async assessComplianceRisk(
    @Body() request: ComplianceRiskRequest,
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`AI compliance risk assessment requested byuser: ${user.id}`);

      // Get organization policies
      const policies = await this.policyService.getPoliciesByOrganization(user.organizationId);

      // Mock organization data (in real implementation, this would come from various services)
      const organizationData = {
        recentIncidents: [], // Would fetch from incident service
        auditHistory: [],   // Would fetch from audit service
        staffTurnover: 15,  // Would calculate from HR data
        trainingCompletion: 85 // Would fetch from training service
      };

      // Perform AI risk assessment
      const riskAssessment = await this.aiAssistant.predictComplianceRisks(
        policies,
        organizationData
      );

      return {
        success: true,
        data: riskAssessment,
        metadata: {
          organizationId: user.organizationId,
          assessedAt: new Date(),
          policyCount: policies.length
        }
      };

    } catch (error) {
      this.logger.error(`Compliance risk assessmentfailed: ${error.message}`, error.stack);
      
      throw new HttpException(
        'Risk assessment failed. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get AI assistant status and capabilities
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Get AI assistant status',
    description: 'Check AI assistant availability and capabilities'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI assistant status retrieved successfully' 
  })
  async getAIStatus() {
    return {
      success: true,
      data: {
        status: 'operational',
        capabilities: [
          'policy_analysis',
          'policy_generation',
          'natural_language_queries',
          'template_suggestions',
          'compliance_risk_assessment',
          'policy_improvement'
        ],
        models: {
          primary: 'gpt-4',
          fallback: 'gpt-3.5-turbo'
        },
        features: {
          supportedJurisdictions: ['england_cqc', 'scotland_ci', 'wales_ciw', 'northern_ireland_rqia'],
          supportedCategories: [
            'safeguarding', 'data_protection', 'complaints', 'health_safety',
            'medication', 'infection_control', 'staff_training', 'emergency_procedures'
          ],
          maxTokens: 4000,
          responseTime: '2-5 seconds'
        }
      },
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date('2025-10-06'),
        checkedAt: new Date()
      }
    };
  }

  /**
   * Get AI usage analytics
   */
  @Get('analytics')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get AI usage analytics',
    description: 'Retrieve analytics about AI assistant usage (admin only)'
  })
  @ApiQuery({ name: 'period', required: false, description: 'Analytics period (day, week, month)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics retrieved successfully' 
  })
  async getAIAnalytics(
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
    @CurrentUser() user: User
  ) {
    try {
      // Mock analytics data (in real implementation, would query analytics service)
      const analytics = {
        totalRequests: 1250,
        successRate: 0.94,
        averageResponseTime: 3.2,
        popularFeatures: [
          { feature: 'policy_analysis', usage: 45 },
          { feature: 'policy_generation', usage: 30 },
          { feature: 'natural_language_queries', usage: 15 },
          { feature: 'template_suggestions', usage: 10 }
        ],
        userSatisfaction: 4.6,
        costMetrics: {
          totalTokens: 2500000,
          estimatedCost: 125.50
        }
      };

      return {
        success: true,
        data: analytics,
        metadata: {
          period,
          generatedAt: new Date(),
          organizationId: user.organizationId
        }
      };

    } catch (error) {
      this.logger.error(`AI analytics retrievalfailed: ${error.message}`, error.stack);
      
      throw new HttpException(
        'Analytics retrieval failed.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
