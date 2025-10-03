import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum PainScale {
  NUMERIC_0_10 = 'numeric_0_10',
  WONG_BAKER_FACES = 'wong_baker_faces',
  BEHAVIORAL_PAIN_SCALE = 'behavioral_pain_scale',
  CRITICAL_CARE_PAIN_OBSERVATION = 'critical_care_pain_observation',
  ABBEY_PAIN_SCALE = 'abbey_pain_scale',
  PAINAD = 'painad',
  DOLOPLUS = 'doloplus'
}

export enum PainType {
  ACUTE = 'acute',
  CHRONIC = 'chronic',
  BREAKTHROUGH = 'breakthrough',
  NEUROPATHIC = 'neuropathic',
  NOCICEPTIVE = 'nociceptive',
  VISCERAL = 'visceral',
  SOMATIC = 'somatic',
  REFERRED = 'referred',
  PHANTOM = 'phantom'
}

export enum PainQuality {
  SHARP = 'sharp',
  DULL = 'dull',
  ACHING = 'aching',
  BURNING = 'burning',
  STABBING = 'stabbing',
  THROBBING = 'throbbing',
  CRAMPING = 'cramping',
  SHOOTING = 'shooting',
  TINGLING = 'tingling',
  PRESSURE = 'pressure'
}

export interface BodyMapLocation {
  regionId: string;
  regionName: string;
  anatomicalStructure: string;
  coordinates: {
    x: number; // percentage from left
    y: number; // percentage from top
    z?: number; // depth for 3D mapping
  };
  painIntensity: number; // 0-10 scale
  painQuality: PainQuality[];
  painFrequency: 'constant' | 'intermittent' | 'occasional' | 'rare';
  triggeringFactors: string[];
  relievingFactors: string[];
  radiationPattern?: {
    direction: string;
    intensity: number;
    targetRegions: string[];
  };
}

export interface PainBehaviors {
  verbalIndicators: string[];
  nonVerbalIndicators: string[];
  facialExpressions: string[];
  bodyLanguage: string[];
  vocalizations: string[];
  activityChanges: string[];
  sleepDisturbances: boolean;
  appetiteChanges: boolean;
  moodChanges: string[];
  socialWithdrawal: boolean;
}

export interface PainImpact {
  functionalImpact: {
    mobilityAffected: boolean;
    adlsAffected: string[]; // Activities of Daily Living
    cognitionAffected: boolean;
    communicationAffected: boolean;
    socialInteractionAffected: boolean;
  };
  qualityOfLifeScore: number; // 1-100
  sleepQualityScore: number; // 1-10
  moodScore: number; // 1-10
  independenceLevel: number; // 1-10
  overallWellbeingScore: number; // 1-100
}

export interface PainManagementPlan {
  pharmacologicalInterventions: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    route: string;
    effectiveness: number; // 1-10
    sideEffects: string[];
    startDate: Date;
    reviewDate: Date;
  }>;
  nonPharmacologicalInterventions: Array<{
    interventionType: string;
    description: string;
    frequency: string;
    effectiveness: number; // 1-10
    implementedBy: string;
    startDate: Date;
    reviewDate: Date;
  }>;
  environmentalModifications: string[];
  assistiveDevices: string[];
  caregiverEducation: string[];
  monitoringSchedule: {
    assessmentFrequency: string;
    reassessmentTriggers: string[];
    escalationCriteria: string[];
  };
}

export interface AdvancedVisualization {
  threeDModelEnabled: boolean;
  heatMapGenerated: boolean;
  temporalMapping: boolean;
  interactiveVisualization: boolean;
  augmentedRealitySupport: boolean;
  virtualRealitySupport: boolean;
  exportFormats: string[];
  sharingCapabilities: {
    familySharing: boolean;
    healthcareProviderSharing: boolean;
    researchDataSharing: boolean;
    anonymizedSharing: boolean;
  };
}

@Entity('pain_assessments')
export class PainAssessment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assessmentNumber: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column('timestamp')
  assessmentDate: Date;

  @Column()
  assessedBy: string;

  @Column({
    type: 'enum',
    enum: PainScale
  })
  painScale: PainScale;

  @Column('int')
  overallPainScore: number; // 0-10

  @Column({
    type: 'enum',
    enum: PainType
  })
  painType: PainType;

  @Column('jsonb')
  bodyMapLocations: BodyMapLocation[];

  @Column('jsonb')
  painBehaviors: PainBehaviors;

  @Column('jsonb')
  painImpact: PainImpact;

  @Column('jsonb')
  painManagementPlan: PainManagementPlan;

  @Column('jsonb')
  advancedVisualization: AdvancedVisualization;

  @Column('text', { nullable: true })
  additionalNotes?: string;

  @Column('timestamp', { nullable: true })
  nextAssessmentDate?: Date;

  @Column('jsonb')
  painTrends: Array<{
    date: Date;
    overallScore: number;
    mostPainfulRegion: string;
    interventionEffectiveness: number;
    qualityOfLifeImpact: number;
  }>;

  @Column('jsonb')
  aiAnalysis: {
    painPatternRecognition: {
      identifiedPatterns: string[];
      cyclicalPain: boolean;
      triggerIdentification: string[];
      predictiveInsights: string[];
    };
    interventionEffectiveness: {
      mostEffectiveInterventions: string[];
      leastEffectiveInterventions: string[];
      recommendedAdjustments: string[];
      evidenceBasedSuggestions: string[];
    };
    riskPrediction: {
      chronicPainRisk: number; // percentage
      depressionRisk: number; // percentage
      functionalDeclineRisk: number; // percentage
      medicationDependencyRisk: number; // percentage
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isSeverePain(): boolean {
    return this.overallPainScore >= 7;
  }

  isModeratePain(): boolean {
    return this.overallPainScore >= 4 && this.overallPainScore <= 6;
  }

  isMildPain(): boolean {
    return this.overallPainScore >= 1 && this.overallPainScore <= 3;
  }

  isNoPain(): boolean {
    return this.overallPainScore === 0;
  }

  hasMultiplePainSites(): boolean {
    return this.bodyMapLocations.length > 1;
  }

  getMostPainfulRegion(): BodyMapLocation | null {
    if (this.bodyMapLocations.length === 0) return null;
    
    return this.bodyMapLocations.reduce((max, location) => 
      location.painIntensity > max.painIntensity ? location : max
    );
  }

  getTotalPainSites(): number {
    return this.bodyMapLocations.length;
  }

  getAveragePainIntensity(): number {
    if (this.bodyMapLocations.length === 0) return 0;
    
    const totalIntensity = this.bodyMapLocations.reduce((sum, location) => sum + location.painIntensity, 0);
    return Math.round((totalIntensity / this.bodyMapLocations.length) * 10) / 10;
  }

  hasChronicPain(): boolean {
    return this.painType === PainType.CHRONIC || 
           this.aiAnalysis.riskPrediction.chronicPainRisk > 70;
  }

  requiresUrgentIntervention(): boolean {
    return this.isSeverePain() || 
           this.painType === PainType.ACUTE ||
           this.aiAnalysis.riskPrediction.functionalDeclineRisk > 80;
  }

  isPainManagementEffective(): boolean {
    if (this.painTrends.length < 2) return true; // Insufficient data
    
    const recentTrends = this.painTrends.slice(-3); // Last 3 assessments
    const averageRecentScore = recentTrends.reduce((sum, trend) => sum + trend.overallScore, 0) / recentTrends.length;
    
    return averageRecentScore < this.overallPainScore; // Pain decreasing
  }

  getPainTrend(): 'improving' | 'stable' | 'worsening' | 'insufficient_data' {
    if (this.painTrends.length < 3) return 'insufficient_data';
    
    const recentTrends = this.painTrends.slice(-3);
    const firstScore = recentTrends[0].overallScore;
    const lastScore = recentTrends[recentTrends.length - 1].overallScore;
    
    const change = lastScore - firstScore;
    
    if (change <= -1) return 'improving';
    if (change >= 1) return 'worsening';
    return 'stable';
  }

  generatePainMap(): any {
    return {
      assessmentId: this.id,
      assessmentDate: this.assessmentDate,
      overallPainScore: this.overallPainScore,
      bodyRegions: this.bodyMapLocations.map(location => ({
        region: location.regionName,
        coordinates: location.coordinates,
        intensity: location.painIntensity,
        quality: location.painQuality,
        visualization: {
          color: this.getPainColor(location.painIntensity),
          size: this.getPainSize(location.painIntensity),
          opacity: location.painIntensity / 10
        }
      })),
      legend: {
        intensityScale: 'Numeric Rating Scale (0-10)',
        colorScheme: 'Red (severe) to Green (mild)',
        lastUpdated: this.assessmentDate
      },
      interactiveFeatures: {
        clickableRegions: true,
        hoverDetails: true,
        zoomCapability: true,
        layeredView: true,
        temporalComparison: this.painTrends.length > 1
      }
    };
  }

  generateAdvancedVisualization(): any {
    return {
      threeDModel: this.advancedVisualization.threeDModelEnabled ? {
        modelUrl: `/api/v1/pain-management/3d-models/${this.id}`,
        interactionEnabled: true,
        rotationEnabled: true,
        layerToggle: true,
        measurementTools: true
      } : null,
      heatMap: this.advancedVisualization.heatMapGenerated ? {
        heatMapUrl: `/api/v1/pain-management/heat-maps/${this.id}`,
        intensityGradient: 'blue_to_red',
        overlayOptions: ['anatomy', 'nerves', 'muscles', 'bones'],
        exportFormats: ['png', 'svg', 'pdf']
      } : null,
      temporalVisualization: this.advancedVisualization.temporalMapping ? {
        timeSeriesChart: this.generateTimeSeriesData(),
        animatedProgression: true,
        comparisonMode: true,
        trendAnalysis: this.getPainTrend()
      } : null,
      augmentedReality: this.advancedVisualization.augmentedRealitySupport ? {
        arModelUrl: `/api/v1/pain-management/ar-models/${this.id}`,
        markerRequired: false,
        realTimeOverlay: true,
        measurementCapability: true
      } : null
    };
  }

  private getPainColor(intensity: number): string {
    // Color mapping for pain intensity visualization
    if (intensity === 0) return '#00FF00'; // Green - no pain
    if (intensity <= 3) return '#FFFF00'; // Yellow - mild
    if (intensity <= 6) return '#FFA500'; // Orange - moderate
    if (intensity <= 8) return '#FF4500'; // Red-orange - severe
    return '#FF0000'; // Red - very severe
  }

  private getPainSize(intensity: number): number {
    // Size mapping for pain intensity visualization
    return Math.max(5, intensity * 3); // 5-30 pixel radius
  }

  private generateTimeSeriesData(): any {
    return this.painTrends.map(trend => ({
      date: trend.date,
      overallPain: trend.overallScore,
      qualityOfLife: trend.qualityOfLifeImpact,
      interventionEffectiveness: trend.interventionEffectiveness,
      mostPainfulRegion: trend.mostPainfulRegion
    }));
  }

  updatePainTrend(): void {
    const newTrend = {
      date: new Date(),
      overallScore: this.overallPainScore,
      mostPainfulRegion: this.getMostPainfulRegion()?.regionName || 'none',
      interventionEffectiveness: this.calculateInterventionEffectiveness(),
      qualityOfLifeImpact: this.painImpact.qualityOfLifeScore
    };
    
    this.painTrends.push(newTrend);
    
    // Keep only last 50 trends
    if (this.painTrends.length > 50) {
      this.painTrends = this.painTrends.slice(-50);
    }
  }

  private calculateInterventionEffectiveness(): number {
    const pharmacological = this.painManagementPlan.pharmacologicalInterventions;
    const nonPharmacological = this.painManagementPlan.nonPharmacologicalInterventions;
    
    const allInterventions = [
      ...pharmacological.map(i => i.effectiveness),
      ...nonPharmacological.map(i => i.effectiveness)
    ];
    
    if (allInterventions.length === 0) return 0;
    
    return allInterventions.reduce((sum, eff) => sum + eff, 0) / allInterventions.length;
  }

  generatePainReport(): any {
    return {
      assessmentSummary: {
        assessmentNumber: this.assessmentNumber,
        residentId: this.residentId,
        assessmentDate: this.assessmentDate,
        assessedBy: this.assessedBy,
        overallPainScore: this.overallPainScore,
        painType: this.painType,
        painScale: this.painScale
      },
      bodyMapping: {
        totalPainSites: this.getTotalPainSites(),
        mostPainfulRegion: this.getMostPainfulRegion(),
        averagePainIntensity: this.getAveragePainIntensity(),
        bodyMapVisualization: this.generatePainMap()
      },
      painAnalysis: {
        painTrend: this.getPainTrend(),
        managementEffectiveness: this.isPainManagementEffective(),
        urgentInterventionRequired: this.requiresUrgentIntervention(),
        chronicPainRisk: this.aiAnalysis.riskPrediction.chronicPainRisk
      },
      recommendations: {
        interventionAdjustments: this.aiAnalysis.interventionEffectiveness.recommendedAdjustments,
        evidenceBasedSuggestions: this.aiAnalysis.interventionEffectiveness.evidenceBasedSuggestions,
        riskMitigation: this.generateRiskMitigationPlan()
      },
      visualizations: this.generateAdvancedVisualization()
    };
  }

  private generateRiskMitigationPlan(): string[] {
    const plan = [];
    
    if (this.aiAnalysis.riskPrediction.chronicPainRisk > 50) {
      plan.push('Implement chronic pain management strategies');
    }
    
    if (this.aiAnalysis.riskPrediction.depressionRisk > 40) {
      plan.push('Monitor for depression and provide psychological support');
    }
    
    if (this.aiAnalysis.riskPrediction.functionalDeclineRisk > 60) {
      plan.push('Implement functional maintenance interventions');
    }
    
    if (this.aiAnalysis.riskPrediction.medicationDependencyRisk > 30) {
      plan.push('Monitor for medication dependency and consider alternatives');
    }
    
    return plan;
  }
}