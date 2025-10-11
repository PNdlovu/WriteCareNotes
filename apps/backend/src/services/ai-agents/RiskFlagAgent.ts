import { OpenAIAdapter } from './OpenAIAdapter';
import { LLMIntegrationService } from './LLMIntegrationService';
import { AIAgentSessionService } from './AIAgentSessionService';

export interface RiskAssessmentRequest {
  vitalSigns: VitalSigns;
  movementData: MovementData;
  environmentalData: EnvironmentalData;
  alertHistory: AlertHistory[];
  recentNotes: CareNote[];
  medicationChanges: MedicationChange[];
  behavioralObservations: BehavioralObservation[];
  familyConcerns: FamilyConcern[];
  residentProfile: ResidentProfile;
  context: AssessmentContext;
}

export interface VitalSigns {
  bloodPressure: {
    systolic: number;
    diastolic: number;
    timestamp: string;
  };
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  bloodGlucose?: number;
  weight?: number;
  timestamp: string;
}

export interface MovementData {
  steps: number;
  activityLevel: 'low' | 'moderate' | 'high';
  fallDetected: boolean;
  bedExitEvents: number;
  roomExitEvents: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  timestamp: string;
}

export interface EnvironmentalData {
  roomTemperature: number;
  humidity: number;
  lightLevel: number;
  noiseLevel: number;
  airQuality: 'good' | 'moderate' | 'poor';
  timestamp: string;
}

export interface AlertHistory {
  id: string;
  type: 'medical' | 'safety' | 'behavioral' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  resolved: boolean;
  resolutionNotes?: string;
}

export interface CareNote {
  id: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  staffMember: string;
  tags: string[];
}

export interface MedicationChange {
  medication: string;
  changeType: 'started' | 'stopped' | 'dosage_changed' | 'timing_changed';
  oldDosage?: string;
  newDosage?: string;
  reason: string;
  timestamp: string;
  prescriber: string;
}

export interface BehavioralObservation {
  behavior: string;
  frequency: 'rare' | 'occasional' | 'frequent' | 'const ant';
  severity: 'mild' | 'moderate' | 'severe';
  triggers: string[];
  interventions: string[];
  timestamp: string;
  observer: string;
}

export interface FamilyConcern {
  concern: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
  notes?: string;
}

export interface ResidentProfile {
  age: number;
  medicalConditions: string[];
  mobilityStatus: 'independent' | 'assisted' | 'wheelchair' | 'bedbound';
  cognitiveStatus: 'intact' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  fallRisk: 'low' | 'medium' | 'high' | 'very_high';
  medicationCount: number;
  careLevel: 'low' | 'medium' | 'high' | 'very_high';
}

export interface AssessmentContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'weekday' | 'weekend';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  recentEvents: string[];
  staffAvailability: 'low' | 'normal' | 'high';
}

export interface RiskAssessmentResult {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  alerts: RiskAlert[];
  recommendations: RiskRecommendation[];
  monitoringPlan: MonitoringPlan;
  confidence: number; // 0-1
  metadata: RiskMetadata;
}

export interface RiskFactor {
  category: 'medical' | 'safety' | 'behavioral' | 'environmental' | 'social';
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  impact: string;
  likelihood: number; // 0-1
}

export interface RiskAlert {
  id: string;
  type: 'immediate' | 'urgent' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionRequired: string;
  timeframe: string;
  responsibleRole: string;
  escalationPath: string[];
  relatedFactors: string[];
}

export interface RiskRecommendation {
  category: 'prevention' | 'intervention' | 'monitoring' | 'training';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  implementation: string;
  expectedOutcome: string;
  timeframe: string;
  resources: string[];
  successMetrics: string[];
}

export interface MonitoringPlan {
  vitalSigns: {
    frequency: string;
    parameters: string[];
    thresholds: Record<string, { min: number; max: number }>;
  };
  behavioral: {
    observations: string[];
    frequency: string;
    triggers: string[];
  };
  environmental: {
    checks: string[];
    frequency: string;
    thresholds: Record<string, { min: number; max: number }>;
  };
  reviewSchedule: {
    nextReview: string;
    frequency: string;
    responsibleRole: string;
  };
}

export interface RiskMetadata {
  processingTime: number;
  tokensUsed: number;
  model: string;
  assessmentVersion: string;
  dataQuality: number; // 0-1
  confidenceFactors: string[];
}

export class RiskFlagAgent {
  privateopenAIAdapter: OpenAIAdapter;
  privatellmService: LLMIntegrationService;
  privatesessionService: AIAgentSessionService;

  const ructor() {
    this.openAIAdapter = new OpenAIAdapter();
    this.llmService = new LLMIntegrationService();
    this.sessionService = new AIAgentSessionService();
  }

  /**
   * Assess risk using AI
   */
  async assessRisk(
    request: RiskAssessmentRequest,
    context: { tenantId: string; securityLevel: string }
  ): Promise<RiskAssessmentResult> {
    const startTime = Date.now();

    try {
      // Prepare risk assessment data
      const assessmentData = this.prepareAssessmentData(request);

      // Call OpenAI for risk assessment
      const result = await this.openAIAdapter.assessRisk(
        assessmentData,
        context
      );

      // Parse and validate the result
      const riskAssessment = this.parseRiskAssessment(result.response);
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(riskAssessment, request);
      
      // Generate alerts
      const alerts = this.generateAlerts(riskAssessment, request);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(riskAssessment, request);
      
      // Create monitoring plan
      const monitoringPlan = this.createMonitoringPlan(riskAssessment, request);

      const processingTime = Date.now() - startTime;

      return {
        overallRiskLevel: this.determineOverallRiskLevel(riskScore),
        riskScore,
        riskFactors: riskAssessment.riskFactors,
        alerts,
        recommendations,
        monitoringPlan,
        confidence: result.confidence,
        metadata: {
          processingTime,
          tokensUsed: result.tokensUsed,
          model: result.metadata.model,
          assessmentVersion: '1.0.0',
          dataQuality: this.assessDataQuality(request),
          confidenceFactors: this.identifyConfidenceFactors(request)
        }
      };
    } catch (error) {
      console.error('Risk assessmentfailed:', error);
      throw new Error(`Risk assessmentfailed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare assessment data for AI processing
   */
  private prepareAssessmentData(request: RiskAssessmentRequest): Record<string, any> {
    return {
      vital_signs: JSON.stringify(request.vitalSigns),
      movement_data: JSON.stringify(request.movementData),
      environmental_data: JSON.stringify(request.environmentalData),
      alert_history: JSON.stringify(request.alertHistory),
      recent_notes: JSON.stringify(request.recentNotes),
      medication_changes: JSON.stringify(request.medicationChanges),
      behavioral_observations: JSON.stringify(request.behavioralObservations),
      family_concerns: JSON.stringify(request.familyConcerns),
      resident_profile: JSON.stringify(request.residentProfile),
      assessment_context: JSON.stringify(request.context)
    };
  }

  /**
   * Parse risk assessment from AI response
   */
  private parseRiskAssessment(response: string): {
    riskFactors: RiskFactor[];
    analysis: string;
    patterns: string[];
  } {
    try {
      // In a real implementation, this would parse the AI response
      // For now, we'll create a mock risk assessment
      return this.generateMockRiskAssessment();
    } catch (error) {
      console.error('Failed to parse riskassessment:', error);
      return {
        riskFactors: [],
        analysis: 'Unable to parse risk assessment',
        patterns: []
      };
    }
  }

  /**
   * Generate mock risk assessment for demonstration
   */
  private generateMockRiskAssessment(): {
    riskFactors: RiskFactor[];
    analysis: string;
    patterns: string[];
  } {
    return {
      riskFactors: [
        {
          category: 'medical',
          factor: 'Elevated blood pressure',
          severity: 'medium',
          description: 'Systolic pressure consistently above 140 mmHg',
          evidence: ['BP readings: 145/90, 148/92, 142/88'],
          impact: 'Increased risk of cardiovascular events',
          likelihood: 0.7
        },
        {
          category: 'safety',
          factor: 'Fall risk indicators',
          severity: 'high',
          description: 'Multiple fall risk factors present',
          evidence: ['Previous fall history', 'Mobility impairment', 'Medication side effects'],
          impact: 'High risk of injury from falls',
          likelihood: 0.8
        },
        {
          category: 'behavioral',
          factor: 'Agitation and confusion',
          severity: 'medium',
          description: 'Increased episodes of confusion and agitation',
          evidence: ['Nighttime wandering', 'Sundowning symptoms', 'Medication non-compliance'],
          impact: 'Safety risk and care complexity',
          likelihood: 0.6
        }
      ],
      analysis: 'Resident shows multiple risk factors requiring immediate attention. Blood pressure management and fall prevention are critical priorities.',
      patterns: ['Circadian rhythm disruption', 'Medication timing issues', 'Environmental triggers']
    };
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(
    assessment: { riskFactors: RiskFactor[] },
    request: RiskAssessmentRequest
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Weight factors by severity and likelihood
    assessment.riskFactors.forEach(factor => {
      const severityWeight = this.getSeverityWeight(factor.severity);
      const likelihoodWeight = factor.likelihood;
      const weight = severityWeight * likelihoodWeight;
      
      score += weight * 25; // Scale to 0-100
      totalWeight += weight;
    });

    // Add baseline risk from resident profile
    const baselineRisk = this.calculateBaselineRisk(request.residentProfile);
    score += baselineRisk;

    // Normalize to 0-100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get severity weight
   */
  private getSeverityWeight(severity: string): number {
    const weights = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    return weights[severity as keyof typeof weights] || 1;
  }

  /**
   * Calculate baseline risk from resident profile
   */
  private calculateBaselineRisk(profile: ResidentProfile): number {
    let risk = 0;

    // Age factor
    if (profile.age >= 85) risk += 15;
    else if (profile.age >= 75) risk += 10;
    else if (profile.age >= 65) risk += 5;

    // Medical conditions
    risk += profile.medicalConditions.length * 5;

    // Mobility status
    const mobilityRisk = {
      'independent': 0,
      'assisted': 10,
      'wheelchair': 20,
      'bedbound': 25
    };
    risk += mobilityRisk[profile.mobilityStatus] || 0;

    // Cognitive status
    const cognitiveRisk = {
      'intact': 0,
      'mild_impairment': 5,
      'moderate_impairment': 15,
      'severe_impairment': 25
    };
    risk += cognitiveRisk[profile.cognitiveStatus] || 0;

    // Fall risk
    const fallRisk = {
      'low': 0,
      'medium': 10,
      'high': 20,
      'very_high': 30
    };
    risk += fallRisk[profile.fallRisk] || 0;

    return Math.min(50, risk); // Cap baseline risk at 50
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  /**
   * Generate alerts
   */
  private generateAlerts(
    assessment: { riskFactors: RiskFactor[] },
    request: RiskAssessmentRequest
  ): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    // Check for critical risk factors
    const criticalFactors = assessment.riskFactors.filter(f => f.severity === 'critical');
    if (criticalFactors.length > 0) {
      alerts.push({
        id: `alert_${Date.now()}_critical`,
        type: 'immediate',
        severity: 'critical',
        title: 'Critical Risk Factors Detected',
        description: `${criticalFactors.length} critical risk factors require immediate attention`,
        actionRequired: 'Notify medical team and implement immediate interventions',
        timeframe: 'Immediate',
        responsibleRole: 'Registered Nurse',
        escalationPath: ['Nurse Manager', 'Medical Director', 'Emergency Services'],
        relatedFactors: criticalFactors.map(f => f.factor)
      });
    }

    // Check for high blood pressure
    if (request.vitalSigns.bloodPressure.systolic > 160) {
      alerts.push({
        id: `alert_${Date.now()}_bp`,
        type: 'urgent',
        severity: 'high',
        title: 'Severe Hypertension',
        description: `Blood pressure criticallyhigh: ${request.vitalSigns.bloodPressure.systolic}/${request.vitalSigns.bloodPressure.diastolic}`,
        actionRequired: 'Check medication compliance and consider immediate medical review',
        timeframe: 'Within 1 hour',
        responsibleRole: 'Registered Nurse',
        escalationPath: ['Nurse Manager', 'Medical Director'],
        relatedFactors: ['blood_pressure', 'medication_compliance']
      });
    }

    // Check for fall risk
    if (request.movementData.fallDetected) {
      alerts.push({
        id: `alert_${Date.now()}_fall`,
        type: 'immediate',
        severity: 'critical',
        title: 'Fall Detected',
        description: 'Fall event detected by monitoring system',
        actionRequired: 'Immediate assessment and medical evaluation',
        timeframe: 'Immediate',
        responsibleRole: 'Registered Nurse',
        escalationPath: ['Nurse Manager', 'Medical Director', 'Emergency Services'],
        relatedFactors: ['fall_risk', 'mobility', 'safety']
      });
    }

    return alerts;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    assessment: { riskFactors: RiskFactor[] },
    request: RiskAssessmentRequest
  ): RiskRecommendation[] {
    const recommendations: RiskRecommendation[] = [];

    // Blood pressure management
    if (request.vitalSigns.bloodPressure.systolic > 140) {
      recommendations.push({
        category: 'intervention',
        priority: 'high',
        title: 'Blood Pressure Management',
        description: 'Implement comprehensive blood pressure monitoring and management plan',
        implementation: 'Daily BP monitoring, medication review, lifestyle modifications',
        expectedOutcome: 'Blood pressure within normal range',
        timeframe: '2-4 weeks',
        resources: ['BP monitor', 'Medication review', 'Dietary consultation'],
        successMetrics: ['BP readings <140/90', 'Medication compliance >95%']
      });
    }

    // Fall prevention
    if (request.residentProfile.fallRisk === 'high' || request.residentProfile.fallRisk === 'very_high') {
      recommendations.push({
        category: 'prevention',
        priority: 'critical',
        title: 'Fall Prevention Program',
        description: 'Implement comprehensive fall prevention measures',
        implementation: 'Environmental modifications, mobility aids, staff training',
        expectedOutcome: 'Reduced fall risk and improved safety',
        timeframe: '1-2 weeks',
        resources: ['Mobility aids', 'Environmental assessment', 'Staff training'],
        successMetrics: ['Zero falls', 'Improved mobility scores', 'Staff competency']
      });
    }

    // Behavioral management
    const behavioralFactors = assessment.riskFactors.filter(f => f.category === 'behavioral');
    if (behavioralFactors.length > 0) {
      recommendations.push({
        category: 'intervention',
        priority: 'medium',
        title: 'Behavioral Support Plan',
        description: 'Develop individualized behavioral support strategies',
        implementation: 'Behavioral assessment, intervention strategies, staff training',
        expectedOutcome: 'Reduced agitation and improved quality of life',
        timeframe: '2-3 weeks',
        resources: ['Behavioral specialist', 'Staff training', 'Environmental modifications'],
        successMetrics: ['Reduced agitation episodes', 'Improved sleep quality', 'Staff confidence']
      });
    }

    return recommendations;
  }

  /**
   * Create monitoring plan
   */
  private createMonitoringPlan(
    assessment: { riskFactors: RiskFactor[] },
    request: RiskAssessmentRequest
  ): MonitoringPlan {
    return {
      vitalSigns: {
        frequency: 'Every 4 hours',
        parameters: ['blood_pressure', 'heart_rate', 'temperature', 'oxygen_saturation'],
        thresholds: {
          blood_pressure: { min: 90, max: 140 },
          heart_rate: { min: 60, max: 100 },
          temperature: { min: 36.1, max: 37.2 },
          oxygen_saturation: { min: 95, max: 100 }
        }
      },
      behavioral: {
        observations: ['agitation', 'confusion', 'sleep_patterns', 'appetite'],
        frequency: 'Every shift',
        triggers: ['sundowning', 'medication_changes', 'environmental_changes']
      },
      environmental: {
        checks: ['room_temperature', 'lighting', 'noise_level', 'safety_hazards'],
        frequency: 'Daily',
        thresholds: {
          room_temperature: { min: 20, max: 24 },
          noise_level: { min: 0, max: 60 }
        }
      },
      reviewSchedule: {
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'Weekly',
        responsibleRole: 'Registered Nurse'
      }
    };
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(request: RiskAssessmentRequest): number {
    let quality = 0;
    let totalChecks = 0;

    // Check vital signs completeness
    if (request.vitalSigns.bloodPressure.systolic > 0) quality += 1;
    if (request.vitalSigns.heartRate > 0) quality += 1;
    if (request.vitalSigns.temperature > 0) quality += 1;
    if (request.vitalSigns.oxygenSaturation > 0) quality += 1;
    totalChecks += 4;

    // Check movement data
    if (request.movementData.steps >= 0) quality += 1;
    if (request.movementData.activityLevel) quality += 1;
    totalChecks += 2;

    // Check recent notes
    if (request.recentNotes.length > 0) quality += 1;
    totalChecks += 1;

    return totalChecks > 0 ? quality / totalChecks : 0;
  }

  /**
   * Identify confidence factors
   */
  private identifyConfidenceFactors(request: RiskAssessmentRequest): string[] {
    const factors: string[] = [];

    if (request.vitalSigns.bloodPressure.systolic > 0) {
      factors.push('Complete vital signs data');
    }
    if (request.recentNotes.length > 0) {
      factors.push('Recent care documentation available');
    }
    if (request.alertHistory.length > 0) {
      factors.push('Historical alert data available');
    }
    if (request.medicationChanges.length > 0) {
      factors.push('Medication change history available');
    }

    return factors;
  }

  /**
   * Get risk trends
   */
  async getRiskTrends(
    residentId: string,
    timeRange: { start: string; end: string },
    context: { tenantId: string; securityLevel: string }
  ): Promise<{
    trends: any[];
    patterns: string[];
    predictions: any[];
  }> {
    // Mock implementation for risk trends
    return {
      trends: [
        {
          date: new Date().toISOString(),
          riskScore: 65,
          factors: ['blood_pressure', 'mobility']
        }
      ],
      patterns: ['Increasing blood pressure trend', 'Decreasing mobility scores'],
      predictions: [
        {
          timeframe: '7 days',
          predictedRisk: 'high',
          confidence: 0.8,
          factors: ['blood_pressure', 'medication_compliance']
        }
      ]
    };
  }

  /**
   * Generate risk report
   */
  async generateRiskReport(
    assessment: RiskAssessmentResult,
    context: { tenantId: string; securityLevel: string }
  ): Promise<{
    summary: string;
    detailedAnalysis: string;
    actionPlan: string;
    followUpSchedule: string[];
  }> {
    return {
      summary: `Risk assessment completed with overall risklevel: ${assessment.overallRiskLevel} (Score: ${assessment.riskScore}/100)`,
      detailedAnalysis: `Identified ${assessment.riskFactors.length} risk factors across multiple categories. ${assessment.alerts.length} alerts generated requiring attention.`,
      actionPlan: `Implement ${assessment.recommendations.length} recommendations with priority focus on ${assessment.recommendations.filter(r => r.priority === 'critical').length} critical items.`,
      followUpSchedule: [
        'Daily vital signs monitoring',
        'Weekly risk factor review',
        'Monthly comprehensive assessment'
      ]
    };
  }
}

export default RiskFlagAgent;
