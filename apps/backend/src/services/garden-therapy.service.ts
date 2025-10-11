/**
 * @fileoverview garden-therapy.service
 * @module Garden-therapy.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description garden-therapy.service
 */

import { EventEmitter2 } from "eventemitter2";

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GardenAreaEntity } from '../entities/garden-area.entity';

export interface GardenTherapySession {
  id: string;
  residentId: string;
  gardenAreaId: string;
  therapyType: GardenTherapyType;
  duration: number; // minutes
  activities: GardenActivity[];
  therapeuticGoals: string[];
  staffMember: string;
  scheduledTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  outcomes: TherapyOutcome[];
  weatherConditions?: WeatherCondition;
  adaptations?: string[];
  notes?: string;
}

export enum GardenTherapyType {
  HORTICULTURAL_THERAPY = 'horticultural_therapy',
  SENSORY_GARDEN = 'sensory_garden',
  REMINISCENCE_GARDEN = 'reminiscence_garden',
  PHYSICAL_THERAPY = 'physical_therapy',
  COGNITIVE_STIMULATION = 'cognitive_stimulation',
  SOCIAL_INTERACTION = 'social_interaction',
  MEDITATION_MINDFULNESS = 'meditation_mindfulness',
  NATURE_OBSERVATION = 'nature_observation',
}

export interface GardenActivity {
  name: string;
  type: 'planting' | 'watering' | 'harvesting' | 'weeding' | 'observing' | 'touching' | 'smelling' | 'listening';
  duration: number; // minutes
  physicalDemand: 'low' | 'moderate' | 'high';
  cognitiveEngagement: 'low' | 'moderate' | 'high';
  sensoryStimulation: string[];
  equipment: string[];
  adaptations: string[];
}

export interface TherapyOutcome {
  domain: 'physical' | 'cognitive' | 'emotional' | 'social' | 'spiritual';
  metric: string;
  preSessionScore: number;
  postSessionScore: number;
  improvement: number;
  notes: string;
}

export interface WeatherCondition {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  uvIndex: number;
  airQuality: number;
  suitable: boolean;
  recommendations: string[];
}

export interface PlantCareSchedule {
  plantId: string;
  plantName: string;
  gardenAreaId: string;
  careActivities: Array<{
    type: 'watering' | 'pruning' | 'fertilizing' | 'repotting' | 'harvesting';
    frequency: string; // e.g., 'daily', 'weekly', 'monthly'
    lastPerformed?: Date;
    nextDue: Date;
    assignedResident?: string;
    instructions: string;
    season: 'spring' | 'summer' | 'autumn' | 'winter' | 'year_round';
  }>;
  therapeuticValue: string[];
  sensoryAttributes: {
    visual: string[];
    tactile: string[];
    olfactory: string[];
    auditory: string[];
  };
}


export class GardenTherapyService {
  // Logger removed
  privateactiveSessions: Map<string, GardenTherapySession> = new Map();
  privateplantCareSchedules: Map<string, PlantCareSchedule> = new Map();
  privateweatherMonitoring = true;

  const ructor(
    
    private readonlygardenRepository: Repository<GardenAreaEntity>,
    private readonlyeventEmitter: EventEmitter2,
  ) {
    this.initializeGardenTherapy();
  }

  /**
   * Schedule a garden therapy session
   */
  async scheduleGardenTherapy(sessionData: Partial<GardenTherapySession>): Promise<GardenTherapySession> {
    try {
      const session: GardenTherapySession = {
        id: `garden_session_${Date.now()}`,
        residentId: sessionData.residentId,
        gardenAreaId: sessionData.gardenAreaId,
        therapyType: sessionData.therapyType,
        duration: sessionData.duration || 60,
        activities: sessionData.activities || [],
        therapeuticGoals: sessionData.therapeuticGoals || [],
        staffMember: sessionData.staffMember,
        scheduledTime: sessionData.scheduledTime,
        outcomes: [],
        ...sessionData,
      };

      // Check weather conditions
      const weather = await this.checkWeatherConditions();
      if (!weather.suitable && session.therapyType !== GardenTherapyType.MEDITATION_MINDFULNESS) {
        session.adaptations = ['Indoor alternative recommended due to weather'];
        console.warn(`Weather not suitable for garden therapy session ${session.id}`);
      }

      // Prepare garden area
      await this.prepareGardenArea(session.gardenAreaId, session.therapyType);

      // Generate appropriate activities if not provided
      if (session.activities.length === 0) {
        session.activities = await this.generateTherapyActivities(
          session.therapyType,
          session.duration,
          session.residentId
        );
      }

      this.activeSessions.set(session.id, session);

      this.eventEmitter.emit('garden_therapy.session_scheduled', session);
      console.log(`Garden therapy sessionscheduled: ${session.id} for resident ${session.residentId}`);

      return session;
    } catch (error: unknown) {
      console.error(`Failed to schedule garden therapysession: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Start a garden therapy session
   */
  async startGardenTherapySession(sessionId: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        console.error(`Garden therapy session ${sessionId} not found`);
        return false;
      }

      session.actualStartTime = new Date();
      session.weatherConditions = await this.checkWeatherConditions();

      // Perform pre-session assessment
      const preAssessment = await this.performPreSessionAssessment(session.residentId);
      
      // Set baseline scores for outcomes
      session.outcomes = session.therapeuticGoals.map(goal => ({
        domain: this.mapGoalToDomain(goal),
        metric: goal,
        preSessionScore: preAssessment[goal] || 0,
        postSessionScore: 0,
        improvement: 0,
        notes: '',
      }));

      this.activeSessions.set(sessionId, session);

      this.eventEmitter.emit('garden_therapy.session_started', session);
      console.log(`Garden therapy sessionstarted: ${sessionId}`);

      return true;
    } catch (error: unknown) {
      console.error(`Failed to start garden therapysession: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      return false;
    }
  }

  /**
   * Complete a garden therapy session
   */
  async completeGardenTherapySession(sessionId: string, outcomes: Partial<TherapyOutcome>[]): Promise<GardenTherapySession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Garden therapy session ${sessionId} not found`);
      }

      session.actualEndTime = new Date();

      // Update outcomes with post-session scores
      session.outcomes = session.outcomes.map(outcome => {
        const providedOutcome = outcomes.find(o => o.metric === outcome.metric);
        if (providedOutcome) {
          outcome.postSessionScore = providedOutcome.postSessionScore || outcome.postSessionScore;
          outcome.improvement = outcome.postSessionScore - outcome.preSessionScore;
          outcome.notes = providedOutcome.notes || outcome.notes;
        }
        return outcome;
      });

      // Calculate overall session effectiveness
      const averageImprovement = session.outcomes.reduce((sum, o) => sum + o.improvement, 0) / session.outcomes.length;

      // Record session completion
      await this.recordTherapySession(session);

      // Update plant care records if applicable
      await this.updatePlantCareRecords(session);

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      this.eventEmitter.emit('garden_therapy.session_completed', {
        session,
        averageImprovement,
        timestamp: new Date(),
      });

      console.log(`Garden therapy sessioncompleted: ${sessionId} with averageimprovement: ${averageImprovement}`);

      return session;
    } catch (error: unknown) {
      console.error(`Failed to complete garden therapysession: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Create and manage seasonal garden programs
   */
  async createSeasonalProgram(season: 'spring' | 'summer' | 'autumn' | 'winter'): Promise<any> {
    try {
      const seasonalPrograms = {
        spring: {
          theme: 'New Beginnings',
          activities: [
            'Seed planting ceremony',
            'Spring bulb identification',
            'Garden bed preparation',
            'Bird watching and identification',
            'Nature photography walks',
          ],
          plants: ['tulips', 'daffodils', 'crocuses', 'cherry_blossoms', 'fresh_herbs'],
          therapeuticFocus: ['hope', 'renewal', 'planning', 'anticipation'],
        },
        summer: {
          theme: 'Growth and Abundance',
          activities: [
            'Vegetable harvesting',
            'Flower arranging',
            'Herb garden maintenance',
            'Butterfly garden observations',
            'Outdoor tea parties',
          ],
          plants: ['tomatoes', 'roses', 'lavender', 'sunflowers', 'basil'],
          therapeuticFocus: ['accomplishment', 'sensory_stimulation', 'social_interaction'],
        },
        autumn: {
          theme: 'Harvest and Reflection',
          activities: [
            'Apple picking and tasting',
            'Leaf collection and pressing',
            'Seed saving activities',
            'Autumn decoration making',
            'Storytelling in the garden',
          ],
          plants: ['chrysanthemums', 'ornamental_kale', 'pumpkins', 'maple_trees'],
          therapeuticFocus: ['reminiscence', 'gratitude', 'preparation', 'wisdom_sharing'],
        },
        winter: {
          theme: 'Rest and Planning',
          activities: [
            'Indoor herb gardening',
            'Garden planning for next year',
            'Bird feeding and watching',
            'Greenhouse activities',
            'Garden craft projects',
          ],
          plants: ['evergreens', 'holly', 'winter_jasmine', 'indoor_herbs'],
          therapeuticFocus: ['reflection', 'planning', 'indoor_nature_connection'],
        },
      };

      const program = seasonalPrograms[season];
      
      // Create scheduled activities for the season
      const scheduledActivities = await this.scheduleSeasonalActivities(program, season);
      
      // Update plant care schedules
      await this.updateSeasonalPlantCare(program.plants, season);

      this.eventEmitter.emit('garden_therapy.seasonal_program_created', {
        season,
        program,
        scheduledActivities,
        timestamp: new Date(),
      });

      console.log(`Created ${season} seasonal garden program with ${scheduledActivities.length} activities`);

      return {
        season,
        program,
        scheduledActivities,
        plantCareSchedules: this.plantCareSchedules,
      };
    } catch (error: unknown) {
      console.error(`Failed to create seasonalprogram: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Design therapeutic sensory gardens
   */
  async designSensoryGarden(gardenAreaId: string, sensoryFocus: string[]): Promise<any> {
    try {
      const sensoryElements = {
        visual: {
          plants: ['colorful_flowers', 'ornamental_grasses', 'seasonal_displays'],
          features: ['water_features', 'wind_chimes', 'sculptures', 'mirrors'],
          colors: ['vibrant_reds', 'calming_blues', 'energizing_yellows', 'soothing_greens'],
        },
        tactile: {
          plants: ['lamb_ear', 'moss', 'ornamental_grasses', 'textured_bark'],
          features: ['raised_beds', 'different_surfaces', 'tactile_paths', 'texture_boards'],
          materials: ['smooth_stones', 'rough_bark', 'soft_moss', 'cool_metal'],
        },
        olfactory: {
          plants: ['lavender', 'rosemary', 'mint', 'roses', 'jasmine'],
          features: ['herb_spirals', 'scent_gardens', 'aromatic_pathways'],
          seasonality: 'year_round_fragrance',
        },
        auditory: {
          plants: ['bamboo', 'ornamental_grasses', 'rustling_leaves'],
          features: ['water_fountains', 'wind_chimes', 'bird_attracting_plants'],
          sounds: ['flowing_water', 'bird_songs', 'rustling_leaves', 'gentle_chimes'],
        },
        gustatory: {
          plants: ['herbs', 'edible_flowers', 'fruit_trees', 'berry_bushes'],
          features: ['herb_garden', 'edible_landscape', 'tasting_areas'],
          safety: 'clearly_marked_edible_plants',
        },
      };

      const design = {
        gardenAreaId,
        sensoryFocus,
        layout: await this.createSensoryLayout(sensoryFocus),
        plantSelection: this.selectSensoryPlants(sensoryFocus, sensoryElements),
        features: this.designSensoryFeatures(sensoryFocus, sensoryElements),
        pathways: this.designAccessiblePathways(),
        seatingAreas: this.designTherapeuticSeating(),
        maintenanceRequirements: this.calculateMaintenanceNeeds(),
      };

      // Create implementation plan
      const implementationPlan = await this.createImplementationPlan(design);

      this.eventEmitter.emit('garden_therapy.sensory_garden_designed', {
        design,
        implementationPlan,
        timestamp: new Date(),
      });

      console.log(`Designed sensory garden for area ${gardenAreaId} with focuson: ${sensoryFocus.join(', ')}`);

      return { design, implementationPlan };
    } catch (error: unknown) {
      console.error(`Failed to design sensorygarden: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Monitor garden therapy outcomes
   */
  async monitorTherapyOutcomes(timeframe: 'week' | 'month' | 'quarter' | 'year'): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // This would typically query a database of completed sessions
      // For now, we'll simulate the data
      const outcomes = {
        totalSessions: 45,
        uniqueResidents: 23,
        averageSessionDuration: 52, // minutes
        therapyTypes: {
          [GardenTherapyType.HORTICULTURAL_THERAPY]: 18,
          [GardenTherapyType.SENSORY_GARDEN]: 12,
          [GardenTherapyType.REMINISCENCE_GARDEN]: 8,
          [GardenTherapyType.PHYSICAL_THERAPY]: 7,
        },
        outcomeMetrics: {
          physical: {
            averageImprovement: 1.2,
            participantsImproved: 19,
            significantImprovement: 12,
          },
          cognitive: {
            averageImprovement: 0.8,
            participantsImproved: 15,
            significantImprovement: 8,
          },
          emotional: {
            averageImprovement: 1.5,
            participantsImproved: 21,
            significantImprovement: 16,
          },
          social: {
            averageImprovement: 1.1,
            participantsImproved: 18,
            significantImprovement: 11,
          },
        },
        plantCareParticipation: {
          regularParticipants: 15,
          occasionalParticipants: 8,
          totalCareActivities: 127,
        },
        weatherImpact: {
          sessionsAffectedByWeather: 6,
          indoorAdaptations: 4,
          weatherSuitabilityRate: 86.7, // percentage
        },
        recommendations: [
          'Increase sensory garden activities for residents with dementia',
          'Expand herb garden for culinary therapy integration',
          'Add weather protection for year-round activities',
          'Introduce more social group sessions',
        ],
      };

      console.log(`Generated therapy outcomes report for ${timeframe}: ${outcomes.totalSessions} sessions analyzed`);

      return outcomes;
    } catch (error: unknown) {
      console.error(`Failed to monitor therapyoutcomes: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Manage plant care schedules and resident involvement
   */
  async managePlantCareSchedule(): Promise<PlantCareSchedule[]> {
    try {
      const today = new Date();
      const upcomingTasks: PlantCareSchedule[] = [];

      for (const [plantId, schedule] of this.plantCareSchedules) {
        const dueTasks = schedule.careActivities.filter(activity => 
          activity.nextDue <= today
        );

        if (dueTasks.length > 0) {
          upcomingTasks.push({
            ...schedule,
            careActivities: dueTasks,
          });
        }
      }

      // Assign tasks to interested residents
      const taskAssignments = await this.assignPlantCareTasks(upcomingTasks);

      this.eventEmitter.emit('garden_therapy.plant_care_scheduled', {
        upcomingTasks,
        taskAssignments,
        timestamp: today,
      });

      console.log(`Managed plant careschedule: ${upcomingTasks.length} plants need attention`);

      return upcomingTasks;
    } catch (error: unknown) {
      console.error(`Failed to manage plant careschedule: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // Private helper methods

  private async initializeGardenTherapy(): Promise<void> {
    try {
      // Initialize plant care schedules
      await this.initializePlantCareSchedules();
      
      // Set up weather monitoring
      if (this.weatherMonitoring) {
        setInterval(() => {
          this.checkWeatherConditions();
        }, 300000); // Check every 5 minutes
      }

      console.log('Garden therapy service initialized');
    } catch (error: unknown) {
      console.error(`Failed to initialize gardentherapy: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private async checkWeatherConditions(): Promise<WeatherCondition> {
    // In a real implementation, this would call a weather API
    const weather: WeatherCondition = {
      temperature: 18 + Math.random() * 12, // 18-30°C
      humidity: 40 + Math.random() * 40, // 40-80%
      windSpeed: Math.random() * 20, // 0-20 km/h
      precipitation: Math.random() * 5, // 0-5mm
      uvIndex: Math.random() * 10, // 0-10
      airQuality: 50 + Math.random() * 100, // 50-150 AQI
      suitable: true,
      recommendations: [],
    };

    // Determine suitability
    weather.suitable = weather.temperature > 10 && 
                      weather.temperature < 35 && 
                      weather.precipitation < 2 &&
                      weather.windSpeed < 15;

    if (!weather.suitable) {
      if (weather.temperature <= 10) weather.recommendations.push('Too cold for outdoor activities');
      if (weather.temperature >= 35) weather.recommendations.push('Too hot for outdoor activities');
      if (weather.precipitation >= 2) weather.recommendations.push('Rain expected - consider indoor alternatives');
      if (weather.windSpeed >= 15) weather.recommendations.push('High winds - use sheltered areas');
    }

    return weather;
  }

  private async prepareGardenArea(gardenAreaId: string, therapyType: GardenTherapyType): Promise<void> {
    console.log(`Preparing garden area ${gardenAreaId} for ${therapyType}`);
    // Implementation would prepare the physical space
  }

  private async generateTherapyActivities(
    therapyType: GardenTherapyType,
    duration: number,
    residentId: string
  ): Promise<GardenActivity[]> {
    const baseActivities = {
      [GardenTherapyType.HORTICULTURAL_THERAPY]: [
        { name: 'Seed Planting', type: 'planting' as const, duration: 20 },
        { name: 'Watering Plants', type: 'watering' as const, duration: 15 },
        { name: 'Harvesting Vegetables', type: 'harvesting' as const, duration: 25 },
      ],
      [GardenTherapyType.SENSORY_GARDEN]: [
        { name: 'Texture Exploration', type: 'touching' as const, duration: 15 },
        { name: 'Scent Identification', type: 'smelling' as const, duration: 20 },
        { name: 'Sound Garden Tour', type: 'listening' as const, duration: 25 },
      ],
      // Add more therapy types...
    };

    const activities = baseActivities[therapyType] || [];
    
    return activities.map(activity => ({
      ...activity,
      physicalDemand: 'moderate' as const,
      cognitiveEngagement: 'moderate' as const,
      sensoryStimulation: ['visual', 'tactile'],
      equipment: ['gloves', 'tools'],
      adaptations: ['seated_option', 'assistance_available'],
    }));
  }

  private async performPreSessionAssessment(residentId: string): Promise<Record<string, number>> {
    // Simulate pre-session assessment scores
    return {
      'mood': Math.random() * 5 + 3, // 3-8 scale
      'mobility': Math.random() * 5 + 2, // 2-7 scale
      'cognitive_engagement': Math.random() * 5 + 2,
      'social_interaction': Math.random() * 5 + 1,
    };
  }

  private mapGoalToDomain(goal: string): 'physical' | 'cognitive' | 'emotional' | 'social' | 'spiritual' {
    if (goal.includes('mobility') || goal.includes('physical')) return 'physical';
    if (goal.includes('cognitive') || goal.includes('memory')) return 'cognitive';
    if (goal.includes('mood') || goal.includes('emotional')) return 'emotional';
    if (goal.includes('social') || goal.includes('interaction')) return 'social';
    return 'spiritual';
  }

  private async recordTherapySession(session: GardenTherapySession): Promise<void> {
    console.log(`Recording therapysession: ${session.id}`);
    // Implementation would save to database
  }

  private async updatePlantCareRecords(session: GardenTherapySession): Promise<void> {
    // Update plant care records based on activities performed
    for (const activity of session.activities) {
      if (activity.type === 'watering' || activity.type === 'planting') {
        console.log(`Updating plant care record for ${activity.name}`);
      }
    }
  }

  private async scheduleSeasonalActivities(program: any, season: string): Promise<any[]> {
    // Create scheduled activities based on seasonal program
    return program.activities.map((activity: string, index: number) => ({
      id: `seasonal_${season}_${index}`,
      name: activity,
      season,
      frequency: 'weekly',
      therapeuticFocus: program.therapeuticFocus,
    }));
  }

  private async updateSeasonalPlantCare(plants: string[], season: string): Promise<void> {
    // Update plant care schedules for seasonal plants
    plants.forEach(plant => {
      console.log(`Updated ${season} care schedule for ${plant}`);
    });
  }

  private async initializePlantCareSchedules(): Promise<void> {
    // Initialize with sample plant care schedules
    const sampleSchedule: PlantCareSchedule = {
      plantId: 'herb_garden_01',
      plantName: 'Mixed Herb Garden',
      gardenAreaId: 'sensory_garden',
      careActivities: [{
        type: 'watering',
        frequency: 'daily',
        nextDue: new Date(),
        instructions: 'Water gently in the morning',
        season: 'year_round',
      }],
      therapeuticValue: ['sensory_stimulation', 'culinary_connection'],
      sensoryAttributes: {
        visual: ['green_foliage', 'var ied_textures'],
        tactile: ['soft_leaves', 'different_textures'],
        olfactory: ['fresh_herbs', 'aromatic'],
        auditory: ['rustling_leaves'],
      },
    };

    this.plantCareSchedules.set(sampleSchedule.plantId, sampleSchedule);
  }

  private async createSensoryLayout(sensoryFocus: string[]): Promise<any> {
    return {
      zones: sensoryFocus.map(sense => ({ sense, area: '25sqm' })),
      pathways: 'accessible_circular',
      centralFeature: 'water_fountain',
    };
  }

  private selectSensoryPlants(sensoryFocus: string[], elements: any): any[] {
    return sensoryFocus.map(sense => ({
      sense,
      plants: elements[sense]?.plants || [],
    }));
  }

  private designSensoryFeatures(sensoryFocus: string[], elements: any): any[] {
    return sensoryFocus.map(sense => ({
      sense,
      features: elements[sense]?.features || [],
    }));
  }

  private designAccessiblePathways(): any {
    return {
      width: '1.5m',
      surface: 'smooth_non_slip',
      handrails: true,
      restAreas: 'every_25m',
    };
  }

  private designTherapeuticSeating(): any {
    return {
      types: ['benches', 'wheelchair_accessible', 'adjustable_height'],
      placement: 'strategic_garden_views',
      comfort: 'weather_resistant_cushions',
    };
  }

  private calculateMaintenanceNeeds(): any {
    return {
      daily: ['watering', 'basic_tidying'],
      weekly: ['pruning', 'weeding'],
      monthly: ['fertilizing', 'deep_maintenance'],
      seasonal: ['plant_replacement', 'major_pruning'],
    };
  }

  private async createImplementationPlan(design: any): Promise<any> {
    return {
      phases: [
        { phase: 1, description: 'Site preparation', duration: '2 weeks' },
        { phase: 2, description: 'Infrastructure installation', duration: '3 weeks' },
        { phase: 3, description: 'Planting and features', duration: '2 weeks' },
        { phase: 4, description: 'Final setup and testing', duration: '1 week' },
      ],
      budget: 'estimated_15000_gbp',
      timeline: '8_weeks_total',
      resources: ['landscape_designer', 'horticultural_therapist', 'maintenance_team'],
    };
  }

  private async assignPlantCareTasks(upcomingTasks: PlantCareSchedule[]): Promise<any[]> {
    // Assign plant care tasks to interested residents
    return upcomingTasks.map(task => ({
      taskId: task.plantId,
      plantName: task.plantName,
      assignedResident: 'resident_' + Math.floor(Math.random() * 20),
      taskType: task.careActivities[0]?.type,
      scheduledTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));
  }
}
