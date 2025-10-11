/**
 * @fileoverview garden-therapy.controller
 * @module Garden-therapy/Garden-therapy.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description garden-therapy.controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { GardenTherapyService, GardenTherapySession, GardenTherapyType, TherapyOutcome } from '../../services/garden-therapy.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/garden-therapy')
@UseGuards(JwtAuthGuard)
export class GardenTherapyController {
  const ructor(
    private readonlygardenTherapyService: GardenTherapyService,
    private readonlyauditService: AuditService,
  ) {}

  /**
   * Schedule a garden therapy session
   */
  @Post('sessions')
  @UseGuards(RbacGuard)
  async scheduleGardenTherapy(
    @Body() sessionData: {
      residentId: string;
      gardenAreaId: string;
      therapyType: GardenTherapyType;
      duration: number;
      activities?: any[];
      therapeuticGoals: string[];
      staffMember: string;
      scheduledTime: string;
    },
    @Request() req: any,
  ) {
    try {
      const session = await this.gardenTherapyService.scheduleGardenTherapy({
        ...sessionData,
        scheduledTime: new Date(sessionData.scheduledTime),
      });

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'TherapySession',
        entityId: session.id,
        action: 'CREATE',
        details: {
          residentId: sessionData.residentId,
          therapyType: sessionData.therapyType,
          duration: sessionData.duration,
          scheduledTime: sessionData.scheduledTime,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: session,
        message: 'Garden therapy session scheduled successfully',
      };
    } catch (error) {
      console.error('Error scheduling garden therapysession:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Start a garden therapy session
   */
  @Put('sessions/:sessionId/start')
  @UseGuards(RbacGuard)
  async startGardenTherapySession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    try {
      const success = await this.gardenTherapyService.startGardenTherapySession(sessionId);

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'TherapySession',
        entityId: sessionId,
        action: 'UPDATE',
        details: {
          status: 'started',
          actualStartTime: new Date().toISOString(),
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Garden therapy session started successfully' : 'Failed to start session',
      };
    } catch (error) {
      console.error('Error starting garden therapysession:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Complete a garden therapy session
   */
  @Put('sessions/:sessionId/complete')
  @UseGuards(RbacGuard)
  async completeGardenTherapySession(
    @Param('sessionId') sessionId: string,
    @Body() outcomes: Partial<TherapyOutcome>[],
    @Request() req: any,
  ) {
    try {
      const session = await this.gardenTherapyService.completeGardenTherapySession(sessionId, outcomes);

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'TherapySession',
        entityId: sessionId,
        action: 'UPDATE',
        details: {
          status: 'completed',
          actualEndTime: new Date().toISOString(),
          outcomesCount: outcomes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: session,
        message: 'Garden therapy session completed successfully',
      };
    } catch (error) {
      console.error('Error completing garden therapysession:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create seasonal garden program
   */
  @Post('seasonal-programs')
  @UseGuards(RbacGuard)
  async createSeasonalProgram(
    @Body() programData: { season: 'spring' | 'summer' | 'autumn' | 'winter' },
    @Request() req: any,
  ) {
    try {
      const program = await this.gardenTherapyService.createSeasonalProgram(programData.season);

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'SeasonalProgram',
        entityId: `program_${programData.season}`,
        action: 'CREATE',
        details: {
          season: programData.season,
          activitiesCount: program.scheduledActivities.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: program,
        message: 'Seasonal garden program created successfully',
      };
    } catch (error) {
      console.error('Error creating seasonalprogram:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Design therapeutic sensory garden
   */
  @Post('sensory-gardens')
  @UseGuards(RbacGuard)
  async designSensoryGarden(
    @Body() designData: {
      gardenAreaId: string;
      sensoryFocus: string[];
    },
    @Request() req: any,
  ) {
    try {
      const design = await this.gardenTherapyService.designSensoryGarden(
        designData.gardenAreaId,
        designData.sensoryFocus,
      );

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'SensoryGarden',
        entityId: designData.gardenAreaId,
        action: 'CREATE',
        details: {
          gardenAreaId: designData.gardenAreaId,
          sensoryFocus: designData.sensoryFocus,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: design,
        message: 'Sensory garden designed successfully',
      };
    } catch (error) {
      console.error('Error designing sensorygarden:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get therapy outcomes monitoring
   */
  @Get('outcomes')
  @UseGuards(RbacGuard)
  async getTherapyOutcomes(
    @Query('timeframe') timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month',
    @Request() req: any,
  ) {
    try {
      const outcomes = await this.gardenTherapyService.monitorTherapyOutcomes(timeframe);

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'Outcomes',
        entityId: 'outcomes_report',
        action: 'READ',
        details: {
          timeframe,
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: outcomes,
        message: 'Therapy outcomes retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting therapyoutcomes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get plant care schedule
   */
  @Get('plant-care')
  @UseGuards(RbacGuard)
  async getPlantCareSchedule(@Request() req: any) {
    try {
      const schedule = await this.gardenTherapyService.managePlantCareSchedule();

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'PlantCare',
        entityId: 'plant_care_schedule',
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: schedule,
        message: 'Plant care schedule retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting plant careschedule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get garden therapy session by ID
   */
  @Get('sessions/:sessionId')
  @UseGuards(RbacGuard)
  async getGardenTherapySession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const session = {
        id: sessionId,
        residentId: 'resident_001',
        gardenAreaId: 'garden_001',
        therapyType: GardenTherapyType.HORTICULTURAL_THERAPY,
        duration: 60,
        activities: [
          {
            name: 'Seed Planting',
            type: 'planting',
            duration: 20,
            physicalDemand: 'moderate',
            cognitiveEngagement: 'moderate',
            sensoryStimulation: ['visual', 'tactile'],
            equipment: ['gloves', 'seeds', 'pots'],
            adaptations: ['seated_option'],
          },
        ],
        therapeuticGoals: ['improve_mobility', 'enhance_mood'],
        staffMember: 'staff_001',
        scheduledTime: new Date(),
        actualStartTime: new Date(),
        actualEndTime: new Date(),
        outcomes: [],
        weatherConditions: {
          temperature: 22,
          humidity: 65,
          windSpeed: 5,
          precipitation: 0,
          uvIndex: 3,
          airQuality: 75,
          suitable: true,
          recommendations: [],
        },
        adaptations: [],
        notes: 'Resident enjoyed the planting activity',
      };

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'TherapySession',
        entityId: sessionId,
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: session,
        message: 'Garden therapy session retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting garden therapysession:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available garden areas
   */
  @Get('garden-areas')
  @UseGuards(RbacGuard)
  async getGardenAreas(
    @Query('therapyType') therapyType?: GardenTherapyType,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const gardenAreas = [
        {
          id: 'garden_001',
          name: 'Sensory Garden',
          description: 'A therapeutic garden designed for sensory stimulation',
          area: '150 sqm',
          capacity: 8,
          features: ['raised_beds', 'water_feature', 'seating_areas'],
          suitableFor: [GardenTherapyType.SENSORY_GARDEN, GardenTherapyType.HORTICULTURAL_THERAPY],
          accessibility: 'wheelchair_accessible',
          weatherProtection: true,
        },
        {
          id: 'garden_002',
          name: 'Herb Garden',
          description: 'Aromatic herbs for culinary and therapeutic use',
          area: '50 sqm',
          capacity: 4,
          features: ['herb_spirals', 'raised_beds', 'labeling'],
          suitableFor: [GardenTherapyType.HORTICULTURAL_THERAPY, GardenTherapyType.COGNITIVE_STIMULATION],
          accessibility: 'wheelchair_accessible',
          weatherProtection: false,
        },
        {
          id: 'garden_003',
          name: 'Meditation Garden',
          description: 'Peaceful space for mindfulness and reflection',
          area: '100 sqm',
          capacity: 6,
          features: ['zen_garden', 'meditation_circles', 'quiet_zones'],
          suitableFor: [GardenTherapyType.MEDITATION_MINDFULNESS, GardenTherapyType.NATURE_OBSERVATION],
          accessibility: 'wheelchair_accessible',
          weatherProtection: true,
        },
      ];

      const filteredAreas = therapyType
        ? gardenAreas.filter(area => area.suitableFor.includes(therapyType))
        : gardenAreas;

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'GardenAreas',
        entityId: 'garden_areas_list',
        action: 'READ',
        details: {
          therapyType,
          count: filteredAreas.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: filteredAreas,
        message: 'Garden areas retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting gardenareas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get therapy types and their descriptions
   */
  @Get('therapy-types')
  @UseGuards(RbacGuard)
  async getTherapyTypes(@Request() req: any) {
    try {
      const therapyTypes = [
        {
          type: GardenTherapyType.HORTICULTURAL_THERAPY,
          name: 'Horticultural Therapy',
          description: 'Therapeutic use of plants and gardening activities',
          benefits: ['physical_exercise', 'cognitive_stimulation', 'stress_relief'],
          duration: '30-90 minutes',
          equipment: ['gloves', 'tools', 'plants', 'pots'],
        },
        {
          type: GardenTherapyType.SENSORY_GARDEN,
          name: 'Sensory Garden',
          description: 'Garden designed to stimulate all five senses',
          benefits: ['sensory_stimulation', 'relaxation', 'engagement'],
          duration: '20-60 minutes',
          equipment: ['textured_plants', 'aromatic_herbs', 'wind_chimes'],
        },
        {
          type: GardenTherapyType.REMINISCENCE_GARDEN,
          name: 'Reminiscence Garden',
          description: 'Garden designed to trigger memories and conversation',
          benefits: ['memory_stimulation', 'social_interaction', 'emotional_wellbeing'],
          duration: '30-75 minutes',
          equipment: ['memory_triggers', 'conversation_starters', 'comfortable_seating'],
        },
        {
          type: GardenTherapyType.PHYSICAL_THERAPY,
          name: 'Physical Therapy',
          description: 'Garden-based physical rehabilitation exercises',
          benefits: ['mobility_improvement', 'strength_building', 'balance_enhancement'],
          duration: '20-45 minutes',
          equipment: ['therapeutic_tools', 'support_structures', 'exercise_equipment'],
        },
        {
          type: GardenTherapyType.COGNITIVE_STIMULATION,
          name: 'Cognitive Stimulation',
          description: 'Garden activities to maintain and improve cognitive function',
          benefits: ['memory_enhancement', 'problem_solving', 'attention_improvement'],
          duration: '25-60 minutes',
          equipment: ['puzzle_elements', 'memory_games', 'educational_materials'],
        },
        {
          type: GardenTherapyType.SOCIAL_INTERACTION,
          name: 'Social Interaction',
          description: 'Group garden activities to promote social engagement',
          benefits: ['social_connection', 'communication_skills', 'teamwork'],
          duration: '45-90 minutes',
          equipment: ['group_seating', 'collaborative_tools', 'sharing_materials'],
        },
        {
          type: GardenTherapyType.MEDITATION_MINDFULNESS,
          name: 'Meditation & Mindfulness',
          description: 'Garden-based meditation and mindfulness practices',
          benefits: ['stress_reduction', 'emotional_balance', 'mindfulness'],
          duration: '15-45 minutes',
          equipment: ['meditation_cushions', 'quiet_spaces', 'nature_sounds'],
        },
        {
          type: GardenTherapyType.NATURE_OBSERVATION,
          name: 'Nature Observation',
          description: 'Guided observation and appreciation of natural elements',
          benefits: ['mindfulness', 'appreciation', 'calmness'],
          duration: '20-60 minutes',
          equipment: ['magnifying_glasses', 'observation_journals', 'identification_guides'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'TherapyTypes',
        entityId: 'therapy_types_list',
        action: 'READ',
        details: {
          count: therapyTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: therapyTypes,
        message: 'Therapy types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting therapytypes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get weather conditions for garden therapy
   */
  @Get('weather')
  @UseGuards(RbacGuard)
  async getWeatherConditions(@Request() req: any) {
    try {
      // This would typically fetch from a weather API
      const weather = {
        temperature: 22,
        humidity: 65,
        windSpeed: 5,
        precipitation: 0,
        uvIndex: 3,
        airQuality: 75,
        suitable: true,
        recommendations: [],
        lastUpdated: new Date(),
      };

      await this.auditService.logEvent({
        resource: 'GardenTherapy',
        entityType: 'Weather',
        entityId: 'weather_conditions',
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: weather,
        message: 'Weather conditions retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting weatherconditions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
