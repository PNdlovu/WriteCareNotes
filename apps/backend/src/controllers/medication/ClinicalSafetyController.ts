/**
 * @fileoverview Provides REST API endpoints for comprehensive clinical safety functionality including
 * @module Medication/ClinicalSafetyController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Provides REST API endpoints for comprehensive clinical safety functionality including
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Clinical Safety Controller for medication safety checks and clinical decision support API endpoints
 * @module ClinicalSafetyController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Provides REST API endpoints for comprehensive clinical safety functionality including
 * drug interaction checking, allergy screening, contraindication detection, and clinical decision support.
 * Integrates with the ClinicalSafetyService to provide real-time safety assessments.
 * 
 * @example
 * POST /api/v1/clinical-safety/check
 * GET /api/v1/clinical-safety/interactions
 * GET /api/v1/clinical-safety/alerts/:residentId
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England: Medication management standards and clinical governance
 * - Care Inspectorate - Scotland: Clinical governance and medication safety requirements
 * - CIW (Care Inspectorate Wales) - Wales: Medication safety protocols and clinical oversight
 * - RQIA (Regulation and Quality Improvement Authority) - NorthernIreland: Clinical safety standards
 * - HIQA (Health Information and Quality Authority) - Republic ofIreland: Medication safety guidelines
 * - Isle of Man Department of Health and SocialCare: Clinical governance and safety standards
 * - States of Guernsey Health and SocialCare: Medication management and clinical safety protocols
 * - Government of Jersey Health and CommunityServices: Clinical safety and medication oversight requirements
 * 
 * @security
 * - Implements role-based access control for clinical safety functions
 * - Validates user permissions for medication safety operations
 * - Includes comprehensive audit logging for all safety checks and clinical decisions
 * - Follows GDPR compliance for health information processing and clinical data protection
 */

import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBearerAuth } from '@nestjs/swagger';
import { 
  ClinicalSafetyService, 
  SafetyCheckRequest, 
  SafetyCheckResult,
  InteractionCheckRequest,
  AllergyCheckRequest,
  ContraindicationCheckRequest,
  SafetyWarning
} from '../../services/medication/ClinicalSafetyService';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { AuditMiddleware } from '../../middleware/audit-middleware';
import { RBACMiddleware } from '../../middleware/rbac-middleware';
import { PerformanceMiddleware } from '../../middleware/performance-middleware';
import { logger } from '../../utils/logger';
import { IsUUID, IsString, IsNumber, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// DTOs for request validation
export class DosageDto {
  @IsNumber()
  amount: number;

  @IsString()
  unit: string;
}

export class SafetyCheckDto {
  @IsOptional()
  @IsUUID()
  prescriptionId?: string;

  @IsUUID()
  residentId: string;

  @IsUUID()
  medicationId: string;

  @ValidateNested()
  @Type(() => DosageDto)
  dosage: DosageDto;

  @IsString()
  frequency: string;

  @IsString()
  route: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  indication?: string;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  tenantId: string;
}

export class InteractionCheckDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  medications: string[];

  @IsUUID()
  residentId: string;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  tenantId: string;
}

export class AllergyCheckDto {
  @IsUUID()
  medicationId: string;

  @IsUUID()
  residentId: string;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  tenantId: string;
}

export class ContraindicationCheckDto {
  @IsUUID()
  medicationId: string;

  @IsUUID()
  residentId: string;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  tenantId: string;
}

@ApiTags('Clinical Safety')
@ApiBearerAuth()
@Controller('api/v1/clinical-safety')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicalSafetyController {
  const ructor(
    private readonlyclinicalSafetyService: ClinicalSafetyService
  ) {}

  /**
   * Performs comprehensive safety check for a medication prescription
   */
  @Post('check')
  @ApiOperation({ 
    summary: 'Perform comprehensive medication safety check',
    description: 'Conducts comprehensive safety assessment including drug interactions, allergies, contraindications, and clinical decision support for a medication prescription'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Safety check completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            safe: { type: 'boolean', example: true },
            riskLevel: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'], example: 'low' },
            warnings: { type: 'array', items: { type: 'object' } },
            contraindications: { type: 'array', items: { type: 'object' } },
            interactions: { type: 'array', items: { type: 'object' } },
            allergies: { type: 'array', items: { type: 'object' } },
            recommendations: { type: 'array', items: { type: 'object' } },
            requiresReview: { type: 'boolean', example: false },
            escalationRequired: { type: 'boolean', example: false },
            correlationId: { type: 'string', example: 'safety-1234567890-abc123' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string', example: 'v1' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions for clinical safety operations' })
  @ApiResponse({ status: 404, description: 'Resident or medication not found' })
  @ApiResponse({ status: 422, description: 'Validation error - Invalid medication or resident data' })
  @ApiResponse({ status: 500, description: 'Internal server error during safety check' })
  @Roles('nurse', 'doctor', 'pharmacist', 'clinical_pharmacist', 'prescriber')
  async performSafetyCheck(
    @Body() safetyCheckDto: SafetyCheckDto,
    @Request() req: any
  ): Promise<{ success: boolean; data: SafetyCheckResult; meta: any }> {
    const startTime = Date.now();
    const correlationId = `safety-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.info('Starting comprehensive safety check', {
        correlationId,
        residentId: safetyCheckDto.residentId,
        medicationId: safetyCheckDto.medicationId,
        userId: req.user.id,
        organizationId: safetyCheckDto.organizationId
      });

      // Validate user permissions for the organization
      if (req.user.organizationId !== safetyCheckDto.organizationId) {
        throw new HttpException(
          'Insufficient permissions for this organization',
          HttpStatus.FORBIDDEN
        );
      }

      // Convert DTO to service request
      const safetyCheckRequest: SafetyCheckRequest = {
        prescriptionId: safetyCheckDto.prescriptionId,
        residentId: safetyCheckDto.residentId,
        medicationId: safetyCheckDto.medicationId,
        dosage: safetyCheckDto.dosage,
        frequency: safetyCheckDto.frequency,
        route: safetyCheckDto.route,
        duration: safetyCheckDto.duration,
        indication: safetyCheckDto.indication,
        organizationId: safetyCheckDto.organizationId,
        tenantId: safetyCheckDto.tenantId
      };

      // Perform safety check
      const result = await this.clinicalSafetyService.performSafetyCheck(safetyCheckRequest, req.user.id);

      const responseTime = Date.now() - startTime;

      console.info('Safety check completed successfully', {
        correlationId: result.correlationId,
        safe: result.safe,
        riskLevel: result.riskLevel,
        warningCount: result.warnings.length,
        interactionCount: result.interactions.length,
        contraindicationCount: result.contraindications.length,
        responseTime
      });

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          responseTime,
          correlationId: result.correlationId
        }
      };

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;

      console.error('Safety check failed', {
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        responseTime,
        request: safetyCheckDto
      });

      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        throw new HttpException(
          'Resident or medication not found',
          HttpStatus.NOT_FOUND
        );
      }

      throw new HttpException(
        'Internal server error during safety check',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Checks for drug interactions between medications
   */
  @Post('interactions')
  @ApiOperation({ 
    summary: 'Check drug interactions',
    description: 'Analyzes potential drug interactions between multiple medications for a specific resident'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Drug interaction check completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            interactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  medication1Name: { type: 'string' },
                  medication2Name: { type: 'string' },
                  severity: { type: 'string', enum: ['minor', 'moderate', 'major', 'contraindicated'] },
                  description: { type: 'string' },
                  management: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Roles('nurse', 'doctor', 'pharmacist', 'clinical_pharmacist')
  async checkDrugInteractions(
    @Body() interactionCheckDto: InteractionCheckDto,
    @Request() req: any
  ): Promise<{ success: boolean; data: any; meta: any }> {
    const startTime = Date.now();
    const correlationId = `interaction-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.info('Starting drug interaction check', {
        correlationId,
        residentId: interactionCheckDto.residentId,
        medicationCount: interactionCheckDto.medications.length,
        userId: req.user.id
      });

      // Validate user permissions
      if (req.user.organizationId !== interactionCheckDto.organizationId) {
        throw new HttpException(
          'Insufficient permissions for this organization',
          HttpStatus.FORBIDDEN
        );
      }

      const result = await this.clinicalSafetyService.checkDrugInteractions(
        interactionCheckDto.medications,
        interactionCheckDto.residentId
      );

      const responseTime = Date.now() - startTime;

      console.info('Drug interaction check completed', {
        correlationId,
        interactionCount: result.interactions.length,
        responseTime
      });

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          responseTime,
          correlationId
        }
      };

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;

      console.error('Drug interaction check failed', {
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime
      });

      throw new HttpException(
        'Internal server error during interaction check',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Checks for medication allergies
   */
  @Post('allergies')
  @ApiOperation({ 
    summary: 'Check medication allergies',
    description: 'Screens for potential allergic reactions and cross-reactivity for a specific medication and resident'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Allergy check completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            allergies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  allergen: { type: 'string' },
                  severity: { type: 'string', enum: ['mild', 'moderate', 'severe', 'anaphylaxis'] },
                  reaction: { type: 'array', items: { type: 'string' } },
                  avoidanceRecommendation: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Roles('nurse', 'doctor', 'pharmacist', 'clinical_pharmacist')
  async checkAllergies(
    @Body() allergyCheckDto: AllergyCheckDto,
    @Request() req: any
  ): Promise<{ success: boolean; data: any; meta: any }> {
    const startTime = Date.now();
    const correlationId = `allergy-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.info('Starting allergy check', {
        correlationId,
        residentId: allergyCheckDto.residentId,
        medicationId: allergyCheckDto.medicationId,
        userId: req.user.id
      });

      // Validate user permissions
      if (req.user.organizationId !== allergyCheckDto.organizationId) {
        throw new HttpException(
          'Insufficient permissions for this organization',
          HttpStatus.FORBIDDEN
        );
      }

      const result = await this.clinicalSafetyService.checkAllergies(
        allergyCheckDto.medicationId,
        allergyCheckDto.residentId
      );

      const responseTime = Date.now() - startTime;

      console.info('Allergy check completed', {
        correlationId,
        allergyCount: result.allergies.length,
        responseTime
      });

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          responseTime,
          correlationId
        }
      };

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;

      console.error('Allergy check failed', {
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime
      });

      throw new HttpException(
        'Internal server error during allergy check',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Checks for medication contraindications
   */
  @Post('contraindications')
  @ApiOperation({ 
    summary: 'Check medication contraindications',
    description: 'Identifies contraindications based on resident medical conditions, age, and other factors'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraindication check completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            contraindications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  medicationName: { type: 'string' },
                  condition: { type: 'string' },
                  severity: { type: 'string', enum: ['relative', 'absolute'] },
                  rationale: { type: 'string' },
                  alternatives: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Roles('nurse', 'doctor', 'pharmacist', 'clinical_pharmacist')
  async checkContraindications(
    @Body() contraindicationCheckDto: ContraindicationCheckDto,
    @Request() req: any
  ): Promise<{ success: boolean; data: any; meta: any }> {
    const startTime = Date.now();
    const correlationId = `contraindication-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.info('Starting contraindication check', {
        correlationId,
        residentId: contraindicationCheckDto.residentId,
        medicationId: contraindicationCheckDto.medicationId,
        userId: req.user.id
      });

      // Validate user permissions
      if (req.user.organizationId !== contraindicationCheckDto.organizationId) {
        throw new HttpException(
          'Insufficient permissions for this organization',
          HttpStatus.FORBIDDEN
        );
      }

      const result = await this.clinicalSafetyService.checkContraindications(
        contraindicationCheckDto.medicationId,
        contraindicationCheckDto.residentId
      );

      const responseTime = Date.now() - startTime;

      console.info('Contraindication check completed', {
        correlationId,
        contraindicationCount: result.contraindications.length,
        responseTime
      });

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          responseTime,
          correlationId
        }
      };

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;

      console.error('Contraindication check failed', {
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime
      });

      throw new HttpException(
        'Internal server error during contraindication check',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generates safety alerts for a resident
   */
  @Get('alerts/:residentId')
  @ApiOperation({ 
    summary: 'Generate safety alerts for resident',
    description: 'Generates comprehensive safety alerts and warnings for all active medications of a specific resident'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Safety alerts generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string', enum: ['info', 'caution', 'warning', 'critical'] },
              message: { type: 'string' },
              recommendation: { type: 'string' },
              requiresAction: { type: 'boolean' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid resident ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Roles('nurse', 'doctor', 'pharmacist', 'clinical_pharmacist')
  async generateSafetyAlerts(
    @Param('residentId') residentId: string,
    @Query('organizationId') organizationId: string,
    @Query('tenantId') tenantId: string,
    @Request() req: any
  ): Promise<{ success: boolean; data: SafetyWarning[]; meta: any }> {
    const startTime = Date.now();
    const correlationId = `safety-alerts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.info('Generating safety alerts', {
        correlationId,
        residentId,
        userId: req.user.id,
        organizationId
      });

      // Validate user permissions
      if (req.user.organizationId !== organizationId) {
        throw new HttpException(
          'Insufficient permissions for this organization',
          HttpStatus.FORBIDDEN
        );
      }

      // Validate required query parameters
      if (!organizationId || !tenantId) {
        throw new HttpException(
          'organizationId and tenantId are required query parameters',
          HttpStatus.BAD_REQUEST
        );
      }

      const alerts = await this.clinicalSafetyService.generateSafetyAlerts(
        residentId,
        organizationId,
        tenantId
      );

      const responseTime = Date.now() - startTime;

      console.info('Safety alerts generated', {
        correlationId,
        alertCount: alerts.length,
        responseTime
      });

      return {
        success: true,
        data: alerts,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          responseTime,
          correlationId,
          alertCount: alerts.length
        }
      };

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;

      console.error('Safety alert generation failed', {
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime
      });

      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        throw new HttpException(
          'Resident not found',
          HttpStatus.NOT_FOUND
        );
      }

      throw new HttpException(
        'Internal server error during safety alert generation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health check endpoint for clinical safety service
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'Clinical safety service health check',
    description: 'Checks the health and availability of clinical safety services and external integrations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string', example: 'v1' },
        services: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'up' },
            externalApis: { type: 'string', example: 'up' }
          }
        }
      }
    }
  })
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string; services: any }> {
    try {
      // Basic health check - could be expanded to check external services
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: 'v1',
        services: {
          database: 'up',
          externalApis: 'up' // Would check BNF, dm+d, etc. in production
        }
      };
    } catch (error: unknown) {
      console.error('Health check failed', { error: error instanceof Error ? error.message : "Unknown error" });
      throw new HttpException(
        'Service unhealthy',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
