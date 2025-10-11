/**
 * @fileoverview NHS dm+d Medication Controller
 * @module NHSDmdMedicationController
 * @version 1.0.0
 * @since 2025-10-10
 * 
 * @description
 * REST API controller for NHS dm+d medication search and selection.
 * Provides autocomplete, SNOMED CT lookups, drug interaction checking, and pediatric dosing guidance.
 * 
 * @routes
 * - GET    /api/dmd/search                    - Search medications with autocomplete
 * - GET    /api/dmd/snomed/:code              - Get medication by SNOMED CT code
 * - GET    /api/dmd/vtm/:vtmCode              - Get medications by VTM (all products with same ingredient)
 * - POST   /api/dmd/interactions              - Check drug interactions
 * - GET    /api/dmd/pediatric/:snomedCode     - Get pediatric dosing guidance
 * - GET    /api/dmd/pediatric/:snomedCode/:age - Get dosing for specific age
 * - POST   /api/dmd/sync                      - Sync dm+d database (admin only)
 * - GET    /api/dmd/fhir/:snomedCode          - Export medication as FHIR resource
 * 
 * @swagger
 * - Full OpenAPI 3.0 documentation
 * - Request/response examples
 * - Error codes
 */

import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Param, 
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiParam,
  ApiBody 
} from '@nestjs/swagger';
import { NHSDmdIntegrationService } from '../services/nhsDmdIntegrationService';

/**
 * DTO for drug interaction check request
 */
class CheckInteractionsDto {
  currentMedicationSnomedCodes: string[];
  newMedicationSnomedCode: string;
}

@ApiTags('NHS dm+d Medications')
@Controller('api/dmd')
export class NHSDmdMedicationController {
  const ructor(
    private readonlydmdService: NHSDmdIntegrationService
  ) {}

  // ==========================================
  // MEDICATION SEARCH
  // ==========================================

  /**
   * Search medications with autocomplete
   * 
   * @route GET /api/dmd/search?q=paracetamol&limit=20&pediatricOnly=true
   * @returns Array of matching medications
   */
  @Get('search')
  @ApiOperation({ 
    summary: 'Search medications with autocomplete',
    description: 'Search NHS dm+d database for medications by name. Supports autocomplete for medication selection UI.'
  })
  @ApiQuery({ 
    name: 'q', 
    required: true, 
    description: 'Search query (medication name)',
    example: 'paracetamol'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Maximum results to return (default: 20)',
    example: 20
  })
  @ApiQuery({ 
    name: 'pediatricOnly', 
    required: false, 
    description: 'Only show pediatric-approved medications (default: false)',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results returned successfully',
    schema: {
      example: [
        {
          snomedCode: '322236009',
          preferredTerm: 'Paracetamol 500mg tablets',
          productType: 'VMP',
          form: 'TABLET',
          strength: '500mg',
          manufacturer: null,
          isControlledDrug: false,
          isPediatricApproved: true
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid search query' 
  })
  async searchMedications(
    @Query('q') query: string,
    @Query('limit') limit?: number,
    @Query('pediatricOnly') pediatricOnly?: boolean
  ) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    return await this.dmdService.searchMedications(
      query.trim(),
      limit || 20,
      pediatricOnly === true || pediatricOnly === 'true'
    );
  }

  // ==========================================
  // MEDICATION LOOKUP
  // ==========================================

  /**
   * Get medication by SNOMED CT code
   * 
   * @route GET /api/dmd/snomed/322236009
   * @returns Full medication details
   */
  @Get('snomed/:code')
  @ApiOperation({ 
    summary: 'Get medication by SNOMED CT code',
    description: 'Retrieve full medication details using SNOMED CT concept ID'
  })
  @ApiParam({ 
    name: 'code', 
    description: 'SNOMED CT concept ID',
    example: '322236009'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Medication found',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        snomedCode: '322236009',
        vtmSnomedCode: '387517004',
        vmpSnomedCode: '322236009',
        preferredTerm: 'Paracetamol 500mg tablets',
        form: 'TABLET',
        strength: '500mg',
        isPediatricApproved: true,
        minimumAgeMonths: 3,
        indications: ['Pain relief', 'Fever reduction'],
        contraindications: ['Severe hepatic impairment'],
        pediatricDosing: [
          {
            ageGroup: '3-6 months',
            minAgeMonths: 3,
            maxAgeMonths: 6,
            dosing: '60mg every 4-6 hours',
            maxDailyDose: '240mg'
          }
        ]
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Medication not found' 
  })
  async getMedicationBySnomedCode(@Param('code') snomedCode: string) {
    return await this.dmdService.getMedicationBySnomedCode(snomedCode);
  }

  /**
   * Get medications by VTM (Virtual Therapeutic Moiety)
   * Returns all products containing the same active ingredient
   * 
   * @route GET /api/dmd/vtm/387517004
   * @returns Array of medications with same active ingredient
   */
  @Get('vtm/:vtmCode')
  @ApiOperation({ 
    summary: 'Get medications by VTM code',
    description: 'Get all medications containing the same active ingredient (e.g., all Paracetamol products)'
  })
  @ApiParam({ 
    name: 'vtmCode', 
    description: 'VTM SNOMED CT code',
    example: '387517004'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Medications found',
    schema: {
      example: [
        {
          snomedCode: '322236009',
          preferredTerm: 'Paracetamol 500mg tablets',
          form: 'TABLET',
          strength: '500mg'
        },
        {
          snomedCode: '322280009',
          preferredTerm: 'Paracetamol 120mg/5ml oral suspension',
          form: 'ORAL_SUSPENSION',
          strength: '120mg/5ml'
        }
      ]
    }
  })
  async getMedicationsByVTM(@Param('vtmCode') vtmCode: string) {
    return await this.dmdService.getMedicationsByVTM(vtmCode);
  }

  // ==========================================
  // DRUG INTERACTION CHECKING
  // ==========================================

  /**
   * Check for drug interactions
   * 
   * @route POST /api/dmd/interactions
   * @body { currentMedicationSnomedCodes: ['322236009'], newMedicationSnomedCode: '322257002' }
   * @returns Array of drug interactions found
   */
  @Post('interactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Check drug interactions',
    description: 'Check if a new medication has interactions with current medications'
  })
  @ApiBody({
    description: 'Current medications and new medication to check',
    schema: {
      example: {
        currentMedicationSnomedCodes: ['322236009', '319740004'],
        newMedicationSnomedCode: '322257002'
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Interaction check completed',
    schema: {
      example: [
        {
          medication1: 'Aspirin 300mg tablets',
          medication2: 'Ibuprofen 200mg tablets',
          severity: 'moderate',
          description: 'Increased risk of gastrointestinal bleeding',
          clinicalAdvice: 'CAUTION REQUIRED - Monitor patient closely. Dose adjustment may be needed.'
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  async checkDrugInteractions(@Body() dto: CheckInteractionsDto) {
    if (!dto.currentMedicationSnomedCodes || !Array.isArray(dto.currentMedicationSnomedCodes)) {
      throw new BadRequestException('currentMedicationSnomedCodes must be an array');
    }

    if (!dto.newMedicationSnomedCode) {
      throw new BadRequestException('newMedicationSnomedCode is required');
    }

    return await this.dmdService.checkDrugInteractions(
      dto.currentMedicationSnomedCodes,
      dto.newMedicationSnomedCode
    );
  }

  // ==========================================
  // PEDIATRIC DOSING
  // ==========================================

  /**
   * Get pediatric dosing guidance
   * 
   * @route GET /api/dmd/pediatric/322236009
   * @returns Pediatric dosing guidance for all age groups
   */
  @Get('pediatric/:snomedCode')
  @ApiOperation({ 
    summary: 'Get pediatric dosing guidance',
    description: 'Get age-based dosing guidance for children from BNFc'
  })
  @ApiParam({ 
    name: 'snomedCode', 
    description: 'Medication SNOMED CT code',
    example: '322236009'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Pediatric dosing guidance',
    schema: {
      example: {
        medicationName: 'Paracetamol 500mg tablets',
        snomedCode: '322236009',
        ageGroups: [
          {
            ageGroup: '3-6 months',
            minAgeMonths: 3,
            maxAgeMonths: 6,
            dosing: '60mg every 4-6 hours',
            maxDailyDose: '240mg',
            calculation: '15mg/kg'
          }
        ],
        contraindications: ['Severe hepatic impairment'],
        cautions: ['Hepatic impairment', 'Renal impairment']
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Medication not approved for pediatric use or no dosing guidance available' 
  })
  async getPediatricDosing(@Param('snomedCode') snomedCode: string) {
    return await this.dmdService.getPediatricDosing(snomedCode);
  }

  /**
   * Get dosing for specific age
   * 
   * @route GET /api/dmd/pediatric/322236009/48
   * @returns Dosing guidance for specific age group
   */
  @Get('pediatric/:snomedCode/:ageMonths')
  @ApiOperation({ 
    summary: 'Get dosing for specific age',
    description: 'Get dosing guidance for a specific child age in months'
  })
  @ApiParam({ 
    name: 'snomedCode', 
    description: 'Medication SNOMED CT code',
    example: '322236009'
  })
  @ApiParam({ 
    name: 'ageMonths', 
    description: 'Child age in months',
    example: 48
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Age-specific dosing guidance',
    schema: {
      example: {
        medicationName: 'Paracetamol 500mg tablets',
        ageGroup: '2-4 years',
        dosing: '180mg every 4-6 hours',
        maxDailyDose: '720mg',
        calculation: '15mg/kg',
        contraindications: ['Severe hepatic impairment'],
        cautions: ['Hepatic impairment', 'Renal impairment']
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No dosing guidance for this age' 
  })
  async getDosingForAge(
    @Param('snomedCode') snomedCode: string,
    @Param('ageMonths') ageMonths: string
  ) {
    const age = parseInt(ageMonths, 10);
    
    if (isNaN(age) || age < 0) {
      throw new BadRequestException('Age must be a positive number');
    }

    return await this.dmdService.getDosingForAge(snomedCode, age);
  }

  // ==========================================
  // DATABASE SYNCHRONIZATION
  // ==========================================

  /**
   * Sync dm+d database (admin only)
   * 
   * @route POST /api/dmd/sync
   * @returns Number of medications synced
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(AdminGuard) // TODO: Add admin authentication guard
  @ApiOperation({ 
    summary: 'Sync NHS dm+d database',
    description: 'Synchronize local database with latest NHS dm+d XML files (admin only)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sync completed successfully',
    schema: {
      example: {
        message: 'NHS dm+d sync completed',
        medicationsSynced: 150,
        timestamp: '2025-10-10T20:00:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  async syncDmdDatabase() {
    const syncedCount = await this.dmdService.syncDmdDatabase();

    return {
      message: 'NHS dm+d sync completed',
      medicationsSynced: syncedCount,
      timestamp: new Date()
    };
  }

  // ==========================================
  // FHIR EXPORT
  // ==========================================

  /**
   * Export medication as FHIR Medication resource
   * 
   * @route GET /api/dmd/fhir/322236009
   * @returns FHIR R4 Medication resource
   */
  @Get('fhir/:snomedCode')
  @ApiOperation({ 
    summary: 'Export medication as FHIR resource',
    description: 'Export medication in FHIR R4 format for interoperability with NHS systems'
  })
  @ApiParam({ 
    name: 'snomedCode', 
    description: 'Medication SNOMED CT code',
    example: '322236009'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'FHIR Medication resource',
    schema: {
      example: {
        resourceType: 'Medication',
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '322236009',
              display: 'Paracetamol 500mg tablets'
            }
          ]
        },
        form: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '385055001',
              display: 'TABLET'
            }
          ]
        },
        ingredient: [
          {
            itemCodeableConcept: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '387517004',
                  display: 'Paracetamol'
                }
              ]
            },
            strength: {
              numerator: {
                value: 500,
                unit: 'mg'
              },
              denominator: {
                value: 1,
                unit: '1'
              }
            }
          }
        ]
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Medication not found' 
  })
  async exportToFHIR(@Param('snomedCode') snomedCode: string) {
    return await this.dmdService.exportToFHIR(snomedCode);
  }
}

export default NHSDmdMedicationController;
