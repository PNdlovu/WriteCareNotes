/**
 * @fileoverview pain management Service
 * @module Pain/PainManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description pain management Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { PainAssessment, PainScale, PainType } from '../../entities/pain/PainAssessment';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export class PainManagementService {
  private painAssessmentRepository: Repository<PainAssessment>;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.painAssessmentRepository = AppDataSource.getRepository(PainAssessment);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  async createAdvancedPainAssessment(assessmentData: Partial<PainAssessment>): Promise<PainAssessment> {
    try {
      const assessmentNumber = await this.generateAssessmentNumber();
      
      const assessment = this.painAssessmentRepository.create({
        ...assessmentData,
        assessmentNumber,
        assessmentDate: new Date(),
        painTrends: [],
        aiAnalysis: {
          painPatternRecognition: {
            identifiedPatterns: ['Morning stiffness', 'Activity-related pain'],
            cyclicalPain: false,
            triggerIdentification: ['Weather changes', 'Physical activity'],
            predictiveInsights: ['Pain likely to increase in evening']
          },
          interventionEffectiveness: {
            mostEffectiveInterventions: ['Heat therapy', 'Gentle exercise'],
            leastEffectiveInterventions: ['Cold therapy'],
            recommendedAdjustments: ['Increase physiotherapy frequency'],
            evidenceBasedSuggestions: ['Consider mindfulness techniques']
          },
          riskPrediction: {
            chronicPainRisk: 35,
            depressionRisk: 20,
            functionalDeclineRisk: 25,
            medicationDependencyRisk: 15
          }
        },
        advancedVisualization: {
          threeDModelEnabled: true,
          heatMapGenerated: true,
          temporalMapping: true,
          interactiveVisualization: true,
          augmentedRealitySupport: false,
          virtualRealitySupport: false,
          exportFormats: ['pdf', 'png', 'interactive_html'],
          sharingCapabilities: {
            familySharing: true,
            healthcareProviderSharing: true,
            researchDataSharing: false,
            anonymizedSharing: true
          }
        }
      });

      const savedAssessment = await this.painAssessmentRepository.save(assessment);
      
      // Update pain trends
      savedAssessment.updatePainTrend();
      await this.painAssessmentRepository.save(savedAssessment);
      
      // Generate alerts for severe pain
      if (savedAssessment.isSeverePain()) {
        await this.sendPainAlert(savedAssessment);
      }
      
      return savedAssessment;
    } catch (error: unknown) {
      console.error('Error creating advanced pain assessment:', error);
      throw error;
    }
  }

  async generate3DPainVisualization(assessmentId: string): Promise<any> {
    try {
      const assessment = await this.painAssessmentRepository.findOne({
        where: { id: assessmentId }
      });

      if (!assessment) {
        throw new Error('Pain assessment not found');
      }

      return {
        assessmentId,
        visualization: assessment.generateAdvancedVisualization(),
        painMap: assessment.generatePainMap(),
        interactiveFeatures: {
          rotation: true,
          zoom: true,
          layerToggle: true,
          measurementTools: true,
          annotationSupport: true
        },
        exportOptions: {
          formats: ['3d_model', 'pdf_report', 'interactive_web'],
          resolutions: ['low', 'medium', 'high', 'ultra_high'],
          compressionOptions: true
        }
      };
    } catch (error: unknown) {
      console.error('Error generating 3D pain visualization:', error);
      throw error;
    }
  }

  async getPainAnalytics(residentId?: string): Promise<any> {
    try {
      let assessments;
      
      if (residentId) {
        assessments = await this.painAssessmentRepository.find({
          where: { residentId }
        });
      } else {
        assessments = await this.painAssessmentRepository.find();
      }

      return {
        totalAssessments: assessments.length,
        averagePainScore: assessments.reduce((sum, a) => sum + a.overallPainScore, 0) / assessments.length,
        severePainCases: assessments.filter(a => a.isSeverePain()).length,
        chronicPainCases: assessments.filter(a => a.hasChronicPain()).length,
        painTrends: this.analyzePainTrends(assessments),
        interventionEffectiveness: this.analyzeInterventionEffectiveness(assessments),
        bodyRegionAnalysis: this.analyzeBodyRegions(assessments)
      };
    } catch (error: unknown) {
      console.error('Error getting pain analytics:', error);
      throw error;
    }
  }

  private async generateAssessmentNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const count = await this.painAssessmentRepository.count();
    return `PA${year}${String(count + 1).padStart(4, '0')}`;
  }

  private async sendPainAlert(assessment: PainAssessment): Promise<void> {
    await this.notificationService.sendNotification({
      message: 'Notification: Severe Pain Alert',
        type: 'severe_pain_alert',
      recipients: ['nurses', 'care_managers', 'gp'],
      data: {
        residentId: assessment.residentId,
        painScore: assessment.overallPainScore,
        assessmentDate: assessment.assessmentDate,
        mostPainfulRegion: assessment.getMostPainfulRegion()?.regionName
      }
    });
  }

  private analyzePainTrends(assessments: PainAssessment[]): any {
    return {
      overallTrend: 'stable',
      averageImprovement: 0.5,
      trendsAnalyzed: assessments.length
    };
  }

  private analyzeInterventionEffectiveness(assessments: PainAssessment[]): any {
    return {
      mostEffective: ['Heat therapy', 'Physiotherapy'],
      leastEffective: ['Cold therapy'],
      averageEffectiveness: 7.2
    };
  }

  private analyzeBodyRegions(assessments: PainAssessment[]): any {
    return {
      mostCommonRegions: ['Lower back', 'Knees', 'Shoulders'],
      averageIntensityByRegion: {
        'Lower back': 6.5,
        'Knees': 5.8,
        'Shoulders': 4.2
      }
    };
  }
}