import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum SummaryType {
  DAILY_CARE_SUMMARY = 'daily_care_summary',
  WEEKLY_PROGRESS_REPORT = 'weekly_progress_report',
  INCIDENT_SUMMARY = 'incident_summary',
  FAMILY_UPDATE = 'family_update',
  HANDOVER_NOTES = 'handover_notes',
  CLINICAL_SUMMARY = 'clinical_summary',
  MEDICATION_REVIEW = 'medication_review',
  CARE_PLAN_UPDATE = 'care_plan_update'
}

export enum AIModel {
  GPT4_TURBO = 'gpt4_turbo',
  GPT4_VISION = 'gpt4_vision',
  CLAUDE_3_OPUS = 'claude_3_opus',
  CLAUDE_3_SONNET = 'claude_3_sonnet',
  GEMINI_ULTRA = 'gemini_ultra',
  CUSTOM_HEALTHCARE_MODEL = 'custom_healthcare_model'
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface SourceDataReference {
  sourceType: 'care_note' | 'medication_record' | 'incident_report' | 'assessment' | 'vital_signs';
  sourceId: string;
  relevanceScore: number; // 0-100
  dataTimestamp: Date;
  contributionWeight: number; // 0-1
  qualityScore: number; // 0-100
}

export interface KeyPoint {
  pointId: string;
  category: 'clinical' | 'behavioral' | 'social' | 'medication' | 'safety' | 'progress';
  content: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  evidenceLevel: 'strong' | 'moderate' | 'weak' | 'anecdotal';
  actionRequired: boolean;
  deadline?: Date;
  responsibleParty?: string;
  relatedRecommendations: string[];
}

export interface AIGenerationMetrics {
  modelUsed: AIModel;
  processingTime: number; // milliseconds
  tokenCount: {
    input: number;
    output: number;
    total: number;
  };
  costEstimate: number; // GBP
  qualityScore: number; // 0-100
  humanReviewRequired: boolean;
  complianceChecked: boolean;
  biasDetectionScore: number; // 0-100
  factualAccuracyScore: number; // 0-100
}

export interface ClinicalValidation {
  validatedBy: string;
  validationDate: Date;
  clinicalAccuracy: number; // 0-100
  complianceStatus: 'compliant' | 'non_compliant' | 'requires_review';
  clinicalRecommendations: string[];
  riskFactorsIdentified: string[];
  followUpRequired: boolean;
  escalationNeeded: boolean;
  evidenceBase: string[];
}

export interface PersonalizationContext {
  residentId: string;
  careLevel: string;
  cognitiveStatus: string;
  communicationPreferences: string[];
  familyPreferences: string[];
  culturalConsiderations: string[];
  previousSummaryFeedback: Array<{
    feedbackDate: Date;
    rating: number; // 1-5
    comments: string;
    improvementSuggestions: string[];
  }>;
}

export interface MultiModalAnalysis {
  textAnalysis: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'concerning';
    emotionalTone: string[];
    clinicalTerminology: string[];
    riskIndicators: string[];
    qualityIndicators: string[];
  };
  voiceAnalysis?: {
    transcriptionAccuracy: number;
    emotionalState: string;
    stressIndicators: string[];
    confidenceMarkers: string[];
  };
  imageAnalysis?: {
    medicalImages: Array<{
      imageType: 'wound' | 'skin' | 'mobility' | 'general';
      findings: string[];
      severity: 'none' | 'mild' | 'moderate' | 'severe';
      actionRequired: boolean;
    }>;
  };
  sensorData?: {
    vitalSigns: any;
    activityLevels: any;
    environmentalFactors: any;
    behavioralPatterns: any;
  };
}

@Entity('ai_summaries')
export class AISummary extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  summaryId: string;

  @Column({
    type: 'enum',
    enum: SummaryType
  })
  summaryType: SummaryType;

  @Column('jsonb')
  sourceData: SourceDataReference[];

  @Column('text')
  generatedSummary: string;

  @Column('jsonb')
  keyPoints: KeyPoint[];

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.MEDIUM
  })
  confidence: ConfidenceLevel;

  @Column('jsonb')
  aiGenerationMetrics: AIGenerationMetrics;

  @Column('jsonb')
  clinicalValidation: ClinicalValidation;

  @Column('jsonb')
  personalizationContext: PersonalizationContext;

  @Column('jsonb')
  multiModalAnalysis: MultiModalAnalysis;

  @Column('timestamp')
  generatedAt: Date;

  @Column('timestamp', { nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  reviewedBy?: string;

  @Column('text', { nullable: true })
  humanFeedback?: string;

  @Column('int', { nullable: true })
  qualityRating?: number; // 1-5

  @Column('jsonb')
  translations: Array<{
    language: string;
    translatedSummary: string;
    translationQuality: number;
    culturalAdaptations: string[];
  }>;

  @Column('jsonb')
  accessibilityVersions: {
    largeText?: string;
    simplifiedLanguage?: string;
    audioVersion?: string;
    visualAids?: string[];
    cognitiveFriendly?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column('timestamp', { nullable: true })
  archivedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isHighConfidence(): boolean {
    return [ConfidenceLevel.HIGH, ConfidenceLevel.VERY_HIGH].includes(this.confidence);
  }

  requiresHumanReview(): boolean {
    return this.aiGenerationMetrics.humanReviewRequired ||
           !this.isHighConfidence() ||
           this.hasHighRiskIndicators();
  }

  hasHighRiskIndicators(): boolean {
    return this.keyPoints.some(point => 
      point.importance === 'critical' && point.actionRequired
    ) || this.clinicalValidation.escalationNeeded;
  }

  isClinicallyValidated(): boolean {
    return !!this.clinicalValidation.validatedBy &&
           this.clinicalValidation.complianceStatus === 'compliant';
  }

  getCriticalKeyPoints(): KeyPoint[] {
    return this.keyPoints.filter(point => point.importance === 'critical');
  }

  getActionableKeyPoints(): KeyPoint[] {
    return this.keyPoints.filter(point => point.actionRequired);
  }

  getOverdueActions(): KeyPoint[] {
    const now = new Date();
    return this.keyPoints.filter(point => 
      point.actionRequired && 
      point.deadline && 
      new Date(point.deadline) < now
    );
  }

  calculateQualityScore(): number {
    let score = this.aiGenerationMetrics.qualityScore * 0.4;
    score += this.aiGenerationMetrics.factualAccuracyScore * 0.3;
    score += (100 - this.aiGenerationMetrics.biasDetectionScore) * 0.2; // Lower bias = higher score
    score += (this.qualityRating || 3) * 20 * 0.1; // Human rating contribution
    
    return Math.min(100, Math.max(0, score));
  }

  addHumanFeedback(rating: number, feedback: string, reviewedBy: string): void {
    this.qualityRating = rating;
    this.humanFeedback = feedback;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    
    // Learn from feedback for future improvements
    this.updatePersonalizationContext(rating, feedback);
  }

  generateAccessibilityVersions(): void {
    // Generate accessibility-friendly versions
    this.accessibilityVersions = {
      largeText: this.formatForLargeText(),
      simplifiedLanguage: this.simplifyLanguage(),
      cognitiveFriendly: this.makeCognitiveFriendly()
    };
  }

  translateSummary(language: string, translatedText: string, quality: number): void {
    const existingIndex = this.translations.findIndex(t => t.language === language);
    const translation = {
      language,
      translatedSummary: translatedText,
      translationQuality: quality,
      culturalAdaptations: this.generateCulturalAdaptations(language)
    };
    
    if (existingIndex >= 0) {
      this.translations[existingIndex] = translation;
    } else {
      this.translations.push(translation);
    }
  }

  getTranslation(language: string): any | null {
    return this.translations.find(t => t.language === language) || null;
  }

  updateConfidenceLevel(): void {
    const qualityScore = this.calculateQualityScore();
    
    if (qualityScore >= 90) this.confidence = ConfidenceLevel.VERY_HIGH;
    else if (qualityScore >= 80) this.confidence = ConfidenceLevel.HIGH;
    else if (qualityScore >= 70) this.confidence = ConfidenceLevel.MEDIUM;
    else if (qualityScore >= 60) this.confidence = ConfidenceLevel.LOW;
    else this.confidence = ConfidenceLevel.VERY_LOW;
  }

  needsRegeneration(): boolean {
    return this.calculateQualityScore() < 70 ||
           this.clinicalValidation.complianceStatus === 'non_compliant' ||
           (this.qualityRating && this.qualityRating <= 2);
  }

  isExpired(): boolean {
    const maxAge = this.getMaxAgeForSummaryType();
    const age = new Date().getTime() - new Date(this.generatedAt).getTime();
    return age > maxAge;
  }

  private getMaxAgeForSummaryType(): number {
    // Maximum age in milliseconds before summary should be regenerated
    const maxAges = {
      [SummaryType.DAILY_CARE_SUMMARY]: 24 * 60 * 60 * 1000, // 24 hours
      [SummaryType.WEEKLY_PROGRESS_REPORT]: 7 * 24 * 60 * 60 * 1000, // 7 days
      [SummaryType.INCIDENT_SUMMARY]: 30 * 24 * 60 * 60 * 1000, // 30 days
      [SummaryType.FAMILY_UPDATE]: 7 * 24 * 60 * 60 * 1000, // 7 days
      [SummaryType.HANDOVER_NOTES]: 8 * 60 * 60 * 1000, // 8 hours
      [SummaryType.CLINICAL_SUMMARY]: 30 * 24 * 60 * 60 * 1000, // 30 days
      [SummaryType.MEDICATION_REVIEW]: 90 * 24 * 60 * 60 * 1000, // 90 days
      [SummaryType.CARE_PLAN_UPDATE]: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    
    return maxAges[this.summaryType] || 24 * 60 * 60 * 1000;
  }

  private updatePersonalizationContext(rating: number, feedback: string): void {
    this.personalizationContext.previousSummaryFeedback.push({
      feedbackDate: new Date(),
      rating,
      comments: feedback,
      improvementSuggestions: this.extractImprovementSuggestions(feedback)
    });
    
    // Keep only last 10 feedback entries
    if (this.personalizationContext.previousSummaryFeedback.length > 10) {
      this.personalizationContext.previousSummaryFeedback = 
        this.personalizationContext.previousSummaryFeedback.slice(-10);
    }
  }

  private extractImprovementSuggestions(feedback: string): string[] {
    // AI-powered extraction of improvement suggestions from feedback
    const suggestions = [];
    
    if (feedback.toLowerCase().includes('too long')) {
      suggestions.push('Make summaries more concise');
    }
    if (feedback.toLowerCase().includes('missing')) {
      suggestions.push('Include more comprehensive details');
    }
    if (feedback.toLowerCase().includes('unclear')) {
      suggestions.push('Improve clarity and readability');
    }
    if (feedback.toLowerCase().includes('medical')) {
      suggestions.push('Enhance clinical terminology accuracy');
    }
    
    return suggestions;
  }

  private formatForLargeText(): string {
    return this.generatedSummary
      .replace(/\./g, '.\n\n') // Add spacing after sentences
      .replace(/:/g, ':\n') // Add line breaks after colons
      .toUpperCase(); // Large text formatting
  }

  private simplifyLanguage(): string {
    return this.generatedSummary
      .replace(/\b(medication|medicine|pharmaceutical)\b/gi, 'medicine')
      .replace(/\b(physiotherapy|physical therapy)\b/gi, 'exercise help')
      .replace(/\b(assessment|evaluation)\b/gi, 'check-up')
      .replace(/\b(intervention|treatment)\b/gi, 'help')
      .replace(/\b(administration|giving)\b/gi, 'giving')
      .replace(/\b(observation|noting)\b/gi, 'watching')
      .replace(/\b(deterioration|worsening)\b/gi, 'getting worse')
      .replace(/\b(improvement|better)\b/gi, 'getting better');
  }

  private makeCognitiveFriendly(): string {
    // Create cognitive-friendly version with simple structure
    const keyPoints = this.getCriticalKeyPoints();
    let cognitiveFriendly = `Summary for ${this.personalizationContext.residentId}:\n\n`;
    
    cognitiveFriendly += 'Important things today:\n';
    keyPoints.forEach((point, index) => {
      cognitiveFriendly += `${index + 1}. ${this.simplifyLanguage(point.content)}\n`;
    });
    
    if (this.getActionableKeyPoints().length > 0) {
      cognitiveFriendly += '\nThings to do:\n';
      this.getActionableKeyPoints().forEach((point, index) => {
        cognitiveFriendly += `${index + 1}. ${this.simplifyLanguage(point.content)}\n`;
      });
    }
    
    return cognitiveFriendly;
  }

  private generateCulturalAdaptations(language: string): string[] {
    const adaptations = [];
    
    // Cultural adaptations based on language/region
    switch (language) {
      case 'cy': // Welsh
        adaptations.push('Include Welsh cultural references');
        adaptations.push('Use appropriate Welsh healthcare terminology');
        break;
      case 'gd': // Scottish Gaelic
        adaptations.push('Include Scottish cultural context');
        adaptations.push('Use appropriate Scottish healthcare terms');
        break;
      case 'ga': // Irish
        adaptations.push('Include Irish cultural considerations');
        adaptations.push('Use appropriate Irish healthcare terminology');
        break;
      default:
        adaptations.push('Standard English healthcare terminology');
    }
    
    return adaptations;
  }

  generateExecutiveSummary(): string {
    const criticalPoints = this.getCriticalKeyPoints();
    const actionablePoints = this.getActionableKeyPoints();
    
    let executive = `Executive Summary - ${this.summaryType.replace('_', ' ').toUpperCase()}\n`;
    executive += `Generated: ${this.generatedAt.toLocaleDateString()}\n`;
    executive += `Confidence: ${this.confidence.toUpperCase()}\n\n`;
    
    if (criticalPoints.length > 0) {
      executive += `CRITICAL ITEMS (${criticalPoints.length}):\n`;
      criticalPoints.forEach((point, index) => {
        executive += `${index + 1}. ${point.content}\n`;
      });
      executive += '\n';
    }
    
    if (actionablePoints.length > 0) {
      executive += `ACTION REQUIRED (${actionablePoints.length}):\n`;
      actionablePoints.forEach((point, index) => {
        executive += `${index + 1}. ${point.content}`;
        if (point.deadline) {
          executive += ` (Due: ${new Date(point.deadline).toLocaleDateString()})`;
        }
        executive += '\n';
      });
    }
    
    return executive;
  }
}