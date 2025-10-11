import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsEnum, IsOptional, IsJSON, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { SpaceEntity } from './space.entity';

export enum EnvironmentType {
  RESIDENTIAL_ROOM = 'residential_room',
  COMMON_AREA = 'common_area',
  DINING_AREA = 'dining_area',
  ACTIVITY_ROOM = 'activity_room',
  THERAPY_ROOM = 'therapy_room',
  GARDEN_AREA = 'garden_area',
  OUTDOOR_SPACE = 'outdoor_space',
  CORRIDOR = 'corridor',
  RECEPTION_AREA = 'reception_area',
  QUIET_ROOM = 'quiet_room',
  SENSORY_ROOM = 'sensory_room',
  LIBRARY = 'library',
  CHAPEL = 'chapel',
  HAIR_SALON = 'hair_salon',
  CAFE = 'cafe',
}

export enum LightingType {
  NATURAL = 'natural',
  LED_WARM = 'led_warm',
  LED_COOL = 'led_cool',
  LED_CIRCADIAN = 'led_circadian',
  AMBIENT = 'ambient',
  TASK = 'task',
  ACCENT = 'accent',
  THERAPEUTIC = 'therapeutic',
}

export enum ColorScheme {
  WARM_NEUTRAL = 'warm_neutral',
  COOL_CALMING = 'cool_calming',
  NATURE_INSPIRED = 'nature_inspired',
  VIBRANT_STIMULATING = 'vibrant_stimulating',
  DEMENTIA_FRIENDLY = 'dementia_friendly',
  TRADITIONAL = 'traditional',
  MODERN_MINIMALIST = 'modern_minimalist',
}

export enum AccessibilityLevel {
  BASIC = 'basic',
  ENHANCED = 'enhanced',
  FULL_ACCESSIBILITY = 'full_accessibility',
  SPECIALIZED = 'specialized',
}

@Entity('environments')
@Index(['environmentType', 'isActive'])
@Index(['floor', 'building'])
@Index(['accessibilityLevel'])
export class EnvironmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  name: string;

  @Column({ type: 'enum', enum: EnvironmentType })
  @IsEnum(EnvironmentType)
  environmentType: EnvironmentType;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty()
  building: string;

  @Column({ type: 'int' })
  @IsNumber()
  floor: number;

  @Column({ type: 'varchar', length: 50 })
  @IsNotEmpty()
  roomNumber: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  @IsNumber()
  @Min(0)
  floorArea: number; // square meters

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  @Min(0)
  ceilingHeight: number; // meters

  @Column({ type: 'int', default: 1 })
  @IsNumber()
  @Min(1)
  capacity: number; // maximum occupancy

  @Column({ type: 'enum', enum: ColorScheme })
  @IsEnum(ColorScheme)
  colorScheme: ColorScheme;

  @Column({ type: 'jsonb' })
  @IsJSON()
  lighting: {
    types: LightingType[];
    naturalLightSources: number;
    artificialLightSources: number;
    lightingControls: string[];
    circadianSupport: boolean;
    dimmable: boolean;
    colorTemperatureRange: { min: number; max: number };
  };

  @Column({ type: 'jsonb' })
  @IsJSON()
  ambientControls: {
    temperature: {
      min: number;
      max: number;
      currentSetting: number;
      zoneControlled: boolean;
    };
    humidity: {
      min: number;
      max: number;
      currentLevel: number;
      controlled: boolean;
    };
    airQuality: {
      ventilationRate: number;
      filtrationLevel: string;
      freshAirSupply: boolean;
    };
    sound: {
      acousticTreatment: boolean;
      backgroundMusicCapable: boolean;
      noiseLevel: number; // dB
      soundMasking: boolean;
    };
  };

  @Column({ type: 'enum', enum: AccessibilityLevel })
  @IsEnum(AccessibilityLevel)
  accessibilityLevel: AccessibilityLevel;

  @Column({ type: 'jsonb' })
  @IsJSON()
  accessibilityFeatures: {
    wheelchairAccessible: boolean;
    wideDoorways: boolean;
    levelAccess: boolean;
    tactileIndicators: boolean;
    visualAlerts: boolean;
    hearingLoop: boolean;
    lowVisionSupport: boolean;
    cognitiveSupport: boolean;
    emergencyAccessible: boolean;
  };

  @Column({ type: 'jsonb' })
  @IsJSON()
  furniture: {
    items: Array<{
      type: string;
      quantity: number;
      accessible: boolean;
      therapeutic: boolean;
      description: string;
    }>;
    layout: string;
    flexibility: 'fixed' | 'semi_flexible' | 'fully_flexible';
    ageAppropriate: boolean;
  };

  @Column({ type: 'jsonb' })
  @IsJSON()
  safetyFeatures: {
    emergencyExits: number;
    fireSuppressionSystem: boolean;
    emergencyCallSystem: boolean;
    fallPrevention: string[];
    slipResistantFlooring: boolean;
    cornerProtection: boolean;
    temperatureControl: boolean;
    securityFeatures: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  therapeuticFeatures: {
    sensoryElements: string[];
    calmingFeatures: string[];
    stimulatingFeatures: string[];
    reminiscenceItems: string[];
    natureElements: string[];
    artTherapySupport: boolean;
    musicTherapySupport: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  technology: {
    smartLighting: boolean;
    climateControl: boolean;
    entertainmentSystem: boolean;
    assistiveTechnology: string[];
    monitoringSystems: string[];
    communicationSystems: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  wayfinding: {
    signage: string[];
    landmarks: string[];
    colorCoding: boolean;
    tactileGuidance: boolean;
    digitalWayfinding: boolean;
    memoryAids: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  maintenanceSchedule: {
    dailyTasks: string[];
    weeklyTasks: string[];
    monthlyTasks: string[];
    annualInspections: string[];
    lastMaintenance: Date;
    nextScheduledMaintenance: Date;
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(5)
  residentSatisfactionScore: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(5)
  staffSatisfactionScore: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(5)
  familySatisfactionScore: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  utilizationRate: number; // percentage

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresRenovation: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastRenovationDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  renovationBudget: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  managedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => SpaceEntity, space => space.environment)
  spaces: SpaceEntity[];

  // Helper methods
  isWheelchairAccessible(): boolean {
    return this.accessibilityFeatures.wheelchairAccessible && 
           this.accessibilityFeatures.wideDoorways && 
           this.accessibilityFeatures.levelAccess;
  }

  isDementiaFriendly(): boolean {
    return this.colorScheme === ColorScheme.DEMENTIA_FRIENDLY &&
           this.accessibilityFeatures.cognitiveSupport &&
           this.wayfinding?.colorCoding &&
           this.therapeuticFeatures?.calmingFeatures?.length > 0;
  }

  getAverageTemperature(): number {
    return this.ambientControls.temperature.currentSetting;
  }

  getLightingScore(): number {
    let score = 0;
    if (this.lighting.naturalLightSources > 0) score += 2;
    if (this.lighting.circadianSupport) score += 2;
    if (this.lighting.dimmable) score += 1;
    return Math.min(5, score);
  }

  getAccessibilityScore(): number {
    const features = this.accessibilityFeatures;
    let score = 0;
    
    if (features.wheelchairAccessible) score += 1;
    if (features.wideDoorways) score += 1;
    if (features.levelAccess) score += 1;
    if (features.visualAlerts) score += 0.5;
    if (features.hearingLoop) score += 0.5;
    if (features.lowVisionSupport) score += 0.5;
    if (features.cognitiveSupport) score += 0.5;
    
    return Math.min(5, score);
  }

  getSafetyScore(): number {
    const safety = this.safetyFeatures;
    let score = 0;
    
    if (safety.emergencyExits >= 2) score += 1;
    if (safety.fireSuppressionSystem) score += 1;
    if (safety.emergencyCallSystem) score += 1;
    if (safety.slipResistantFlooring) score += 1;
    if (safety.fallPrevention.length > 0) score += 1;
    
    return Math.min(5, score);
  }

  getOverallScore(): number {
    const scores = [
      this.residentSatisfactionScore,
      this.getLightingScore(),
      this.getAccessibilityScore(),
      this.getSafetyScore(),
    ];
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  needsMaintenance(): boolean {
    if (!this.maintenanceSchedule?.nextScheduledMaintenance) return false;
    return new Date() >= new Date(this.maintenanceSchedule.nextScheduledMaintenance);
  }

  isUnderUtilized(): boolean {
    return this.utilizationRate < 60; // Less than 60% utilization
  }

  isOverUtilized(): boolean {
    return this.utilizationRate > 90; // More than 90% utilization
  }

  updateSatisfactionScore(type: 'resident' | 'staff' | 'family', score: number): void {
    switch (type) {
      case 'resident':
        this.residentSatisfactionScore = Math.max(0, Math.min(5, score));
        break;
      case 'staff':
        this.staffSatisfactionScore = Math.max(0, Math.min(5, score));
        break;
      case 'family':
        this.familySatisfactionScore = Math.max(0, Math.min(5, score));
        break;
    }
    this.updatedAt = new Date();
  }

  updateUtilization(rate: number): void {
    this.utilizationRate = Math.max(0, Math.min(100, rate));
    this.updatedAt = new Date();
  }

  scheduleRenovation(budget: number, notes?: string): void {
    this.requiresRenovation = true;
    this.renovationBudget = budget;
    if (notes) {
      this.notes = notes;
    }
    this.updatedAt = new Date();
  }

  completeRenovation(): void {
    this.requiresRenovation = false;
    this.lastRenovationDate = new Date();
    this.renovationBudget = null;
    this.updatedAt = new Date();
  }

  updateAmbientSettings(temperature?: number, humidity?: number): void {
    if (temperature !== undefined) {
      this.ambientControls.temperature.currentSetting = Math.max(
        this.ambientControls.temperature.min,
        Math.min(this.ambientControls.temperature.max, temperature)
      );
    }
    
    if (humidity !== undefined) {
      this.ambientControls.humidity.currentLevel = Math.max(
        this.ambientControls.humidity.min,
        Math.min(this.ambientControls.humidity.max, humidity)
      );
    }
    
    this.updatedAt = new Date();
  }

  addTherapeuticFeature(category: keyof typeof this.therapeuticFeatures, feature: string): void {
    if (!this.therapeuticFeatures) {
      this.therapeuticFeatures = {
        sensoryElements: [],
        calmingFeatures: [],
        stimulatingFeatures: [],
        reminiscenceItems: [],
        natureElements: [],
        artTherapySupport: false,
        musicTherapySupport: false,
      };
    }
    
    if (Array.isArray(this.therapeuticFeatures[category])) {
      (this.therapeuticFeatures[category] as string[]).push(feature);
    }
    
    this.updatedAt = new Date();
  }
}