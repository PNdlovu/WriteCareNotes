import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum AssistanceType {
  REAL_TIME_WRITING = 'real_time_writing',
  VOICE_TRANSCRIPTION = 'voice_transcription',
  CLINICAL_SUGGESTIONS = 'clinical_suggestions',
  COMPLIANCE_CHECKING = 'compliance_checking',
  TEMPLATE_GENERATION = 'template_generation',
  QUALITY_REVIEW = 'quality_review',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization'
}

export enum ClinicalContext {
  MEDICATION_ADMINISTRATION = 'medication_administration',
  PERSONAL_CARE = 'personal_care',
  CLINICAL_OBSERVATION = 'clinical_observation',
  INCIDENT_REPORTING = 'incident_reporting',
  CARE_PLANNING = 'care_planning',
  FAMILY_COMMUNICATION = 'family_communication',
  HANDOVER_NOTES = 'handover_notes',
  ASSESSMENT_DOCUMENTATION = 'assessment_documentation'
}

export interface RealTimeAssistance {
  contextualSuggestions: Array<{
    suggestionId: string;
    suggestionType: 'completion' | 'enhancement' | 'correction' | 'template';
    suggestion: string;
    confidence: number; // 0-100
    reasoning: string;
    clinicalEvidence: string[];
    complianceNote: string;
    position: { start: number; end: number };
  }>;
  clinicalIntelligence: {
    medicalTerminology: Array<{
      term: string;
      definition: string;
      context: string;
      alternatives: string[];
      usage: string;
    }>;
    clinicalGuidelines: Array<{
      guideline: string;
      relevance: number; // 0-100
      source: string;
      recommendation: string;
      evidenceLevel: 'A' | 'B' | 'C' | 'D';
    }>;
    riskAlerts: Array<{
      alertType: 'safety' | 'compliance' | 'clinical' | 'legal';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
      urgency: boolean;
    }>;
  };
  qualityEnhancement: {
    grammarCorrections: Array<{
      correction: string;
      position: { start: number; end: number };
      explanation: string;
      confidence: number;
    }>;
    styleImprovements: Array<{
      improvement: string;
      position: { start: number; end: number };
      reasoning: string;
      impact: string;
    }>;
    clarityEnhancements: Array<{
      enhancement: string;
      position: { start: number; end: number };
      clarification: string;
      benefit: string;
    }>;
  };
}

export interface VoiceProcessingCapabilities {
  speechRecognition: {
    languageSupport: string[];
    dialectSupport: string[];
    medicalTerminologySupport: boolean;
    realTimeTranscription: boolean;
    speakerIdentification: boolean;
  };
  audioProcessing: {
    noiseReduction: boolean;
    audioEnhancement: boolean;
    qualityOptimization: boolean;
    backgroundNoiseFiltering: boolean;
    speechClarity: boolean;
  };
  transcriptionAccuracy: {
    overallAccuracy: number; // percentage
    medicalTermAccuracy: number; // percentage
    punctuationAccuracy: number; // percentage
    speakerDiarization: boolean;
    confidenceScoring: boolean;
  };
  postProcessing: {
    grammarCorrection: boolean;
    punctuationInsertion: boolean;
    paragraphFormatting: boolean;
    clinicalStructuring: boolean;
    complianceFormatting: boolean;
  };
}

export interface ClinicalDecisionSupport {
  evidenceBasedRecommendations: Array<{
    recommendationId: string;
    clinicalArea: string;
    recommendation: string;
    evidenceLevel: 'A' | 'B' | 'C' | 'D';
    confidenceInterval: number;
    applicableConditions: string[];
    contraindications: string[];
    monitoring: string[];
    reviewPeriod: number; // days
    costEffectiveness: number;
    qualityImpact: number;
  }>;
  riskAssessments: Array<{
    riskType: string;
    riskScore: number; // 0-100
    riskFactors: string[];
    mitigationStrategies: string[];
    monitoringRequirements: string[];
    escalationCriteria: string[];
    timeframe: string;
  }>;
  treatmentOptimization: {
    medicationRecommendations: Array<{
      medication: string;
      indication: string;
      dosage: string;
      frequency: string;
      duration: string;
      monitoring: string[];
      interactions: string[];
      sideEffects: string[];
    }>;
    therapyRecommendations: Array<{
      therapy: string;
      indication: string;
      frequency: string;
      duration: string;
      provider: string;
      expectedOutcomes: string[];
    }>;
    environmentalRecommendations: string[];
    socialRecommendations: string[];
    familyRecommendations: string[];
  };
}

@Entity('care_notes_assistant')
export class CareNotesAssistant extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assistantSessionId: string;

  @Column()
  userId: string;

  @Column()
  residentId: string;

  @Column({
    type: 'enum',
    enum: AssistanceType
  })
  assistanceType: AssistanceType;

  @Column({
    type: 'enum',
    enum: ClinicalContext
  })
  clinicalContext: ClinicalContext;

  @Column('text')
  originalText: string;

  @Column('text', { nullable: true })
  enhancedText?: string;

  @Column('jsonb')
  realTimeAssistance: RealTimeAssistance;

  @Column('jsonb')
  voiceProcessing: VoiceProcessingCapabilities;

  @Column('jsonb')
  clinicalDecisionSupport: ClinicalDecisionSupport;

  @Column('int')
  improvementScore: number; // 0-100

  @Column('int')
  complianceScore: number; // 0-100

  @Column('int')
  qualityScore: number; // 0-100

  @Column('timestamp')
  sessionStartTime: Date;

  @Column('timestamp', { nullable: true })
  sessionEndTime?: Date;

  @Column('int', { nullable: true })
  sessionDuration?: number; // seconds

  @Column('boolean', { default: false })
  userAcceptedSuggestions: boolean;

  @Column('text', { nullable: true })
  userFeedback?: string;

  @Column('int', { nullable: true })
  userRating?: number; // 1-5

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business Methods
  isSessionActive(): boolean {
    return !this.sessionEndTime;
  }

  calculateSessionDuration(): number {
    const endTime = this.sessionEndTime || new Date();
    return Math.floor((endTime.getTime() - this.sessionStartTime.getTime()) / 1000);
  }

  hasHighQualityAssistance(): boolean {
    return this.qualityScore >= 85 && 
           this.complianceScore >= 90 && 
           this.improvementScore >= 70;
  }

  getEffectiveSuggestions(): any[] {
    return this.realTimeAssistance.contextualSuggestions.filter(suggestion => 
      suggestion.confidence >= 80
    );
  }

  getCriticalAlerts(): any[] {
    return this.realTimeAssistance.clinicalIntelligence.riskAlerts.filter(alert => 
      alert.severity === 'critical' || alert.urgency
    );
  }

  calculateAssistanceEffectiveness(): number {
    const suggestionCount = this.realTimeAssistance.contextualSuggestions.length;
    const highConfidenceSuggestions = this.getEffectiveSuggestions().length;
    
    if (suggestionCount === 0) return 0;
    
    let effectiveness = (highConfidenceSuggestions / suggestionCount) * 100;
    
    // Adjust based on user acceptance
    if (this.userAcceptedSuggestions) effectiveness += 10;
    
    // Adjust based on user rating
    if (this.userRating) {
      effectiveness += (this.userRating - 3) * 5; // +/- 10 points based on rating
    }
    
    return Math.max(0, Math.min(100, effectiveness));
  }

  endSession(userFeedback?: string, userRating?: number): void {
    this.sessionEndTime = new Date();
    this.sessionDuration = this.calculateSessionDuration();
    
    if (userFeedback) {
      this.userFeedback = userFeedback;
    }
    
    if (userRating) {
      this.userRating = userRating;
    }
  }

  addRealTimeSuggestion(suggestion: {
    suggestionType: 'completion' | 'enhancement' | 'correction' | 'template';
    suggestion: string;
    confidence: number;
    reasoning: string;
    position: { start: number; end: number };
  }): void {
    this.realTimeAssistance.contextualSuggestions.push({
      suggestionId: crypto.randomUUID(),
      ...suggestion,
      clinicalEvidence: [],
      complianceNote: 'Suggestion follows clinical documentation standards'
    });
  }

  addClinicalAlert(alert: {
    alertType: 'safety' | 'compliance' | 'clinical' | 'legal';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    urgency: boolean;
  }): void {
    this.realTimeAssistance.clinicalIntelligence.riskAlerts.push(alert);
    
    // Update quality scores based on alert severity
    if (alert.severity === 'critical') {
      this.complianceScore = Math.max(0, this.complianceScore - 10);
    } else if (alert.severity === 'high') {
      this.complianceScore = Math.max(0, this.complianceScore - 5);
    }
  }

  updateQualityScores(scores: {
    improvementScore?: number;
    complianceScore?: number;
    qualityScore?: number;
  }): void {
    if (scores.improvementScore !== undefined) {
      this.improvementScore = scores.improvementScore;
    }
    if (scores.complianceScore !== undefined) {
      this.complianceScore = scores.complianceScore;
    }
    if (scores.qualityScore !== undefined) {
      this.qualityScore = scores.qualityScore;
    }
  }

  generateAssistanceReport(): any {
    return {
      sessionSummary: {
        assistantSessionId: this.assistantSessionId,
        userId: this.userId,
        residentId: this.residentId,
        assistanceType: this.assistanceType,
        clinicalContext: this.clinicalContext,
        sessionDuration: this.sessionDuration,
        sessionActive: this.isSessionActive()
      },
      assistanceMetrics: {
        totalSuggestions: this.realTimeAssistance.contextualSuggestions.length,
        effectiveSuggestions: this.getEffectiveSuggestions().length,
        criticalAlerts: this.getCriticalAlerts().length,
        assistanceEffectiveness: this.calculateAssistanceEffectiveness(),
        userAcceptance: this.userAcceptedSuggestions
      },
      qualityMetrics: {
        improvementScore: this.improvementScore,
        complianceScore: this.complianceScore,
        qualityScore: this.qualityScore,
        overallQuality: this.hasHighQualityAssistance()
      },
      clinicalSupport: {
        clinicalSuggestions: this.realTimeAssistance.clinicalIntelligence.medicalTerminology.length,
        guidelinesProvided: this.realTimeAssistance.clinicalIntelligence.clinicalGuidelines.length,
        riskAlertsGenerated: this.realTimeAssistance.clinicalIntelligence.riskAlerts.length,
        decisionSupportProvided: this.clinicalDecisionSupport.evidenceBasedRecommendations.length
      },
      userExperience: {
        userRating: this.userRating,
        userFeedback: this.userFeedback,
        suggestionAcceptance: this.userAcceptedSuggestions,
        sessionSatisfaction: this.userRating ? this.userRating >= 4 : null
      }
    };
  }
}
