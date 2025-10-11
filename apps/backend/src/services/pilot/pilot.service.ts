/**
 * @fileoverview pilot.service
 * @module Pilot/Pilot.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description pilot.service
 */

import { PilotRepository } from '../../repositories/pilot.repository';
import { CreatePilotDto, PilotFeedbackDto, PilotMetricsDto } from '../../dto/pilot.dto';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class PilotService {
  privatepilotRepository: PilotRepository;

  constructor() {
    this.pilotRepository = new PilotRepository();
  }

  /**
   * Register a new pilot tenant
   */
  async registerPilot(pilotData: CreatePilotDto): Promise<any> {
    const pilotId = uuidv4();
    const tenantId = pilotData.tenantId || uuidv4();
    
    const pilot = {
      id: pilotId,
      tenantId,
      careHomeName: pilotData.careHomeName,
      location: pilotData.location,
      region: pilotData.region,
      size: pilotData.size,
      type: pilotData.type,
      contactEmail: pilotData.contactEmail,
      contactPhone: pilotData.contactPhone,
      status: 'pending',
      startDate: pilotData.startDate || new Date(),
      endDate: pilotData.endDate,
      features: pilotData.features || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.pilotRepository.createPilot(pilot);
    
    // Initialize pilot metrics
    await this.pilotRepository.initializePilotMetrics(tenantId);
    
    logger.info('Pilot registered', { 
      pilotId, 
      tenantId, 
      careHomeName: pilotData.careHomeName 
    });
    
    return result;
  }

  /**
   * Get pilot status and progress
   */
  async getPilotStatus(tenantId: string): Promise<any> {
    const pilot = await this.pilotRepository.getPilotByTenantId(tenantId);
    if (!pilot) {
      throw new Error('Pilot not found');
    }

    const metrics = await this.pilotRepository.getPilotMetrics(tenantId);
    const feedback = await this.pilotRepository.getRecentFeedback(tenantId, 10);
    
    return {
      ...pilot,
      metrics,
      recentFeedback: feedback,
      progress: this.calculateProgress(pilot, metrics)
    };
  }

  /**
   * Submit structured feedback
   */
  async submitFeedback(feedbackData: PilotFeedbackDto): Promise<any> {
    const feedbackId = uuidv4();
    
    const feedback = {
      id: feedbackId,
      tenantId: feedbackData.tenantId,
      module: feedbackData.module,
      description: feedbackData.description,
      severity: feedbackData.severity,
      suggestedFix: feedbackData.suggestedFix,
      submittedBy: feedbackData.submittedBy,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.pilotRepository.createFeedback(feedback);
    
    // Update pilot metrics
    await this.pilotRepository.updateFeedbackMetrics(tenantId, feedbackData.severity);
    
    logger.info('Feedback submitted', { 
      feedbackId, 
      tenantId: feedbackData.tenantId,
      module: feedbackData.module,
      severity: feedbackData.severity
    });
    
    return result;
  }

  /**
   * Get pilot metrics and KPIs
   */
  async getPilotMetrics(params: PilotMetricsDto): Promise<any> {
    const { tenantId, startDate, endDate } = params;
    
    const metrics = await this.pilotRepository.getPilotMetrics(tenantId, startDate, endDate);
    const engagement = await this.pilotRepository.getEngagementMetrics(tenantId, startDate, endDate);
    const compliance = await this.pilotRepository.getComplianceMetrics(tenantId, startDate, endDate);
    const adoption = await this.pilotRepository.getAdoptionMetrics(tenantId, startDate, endDate);
    
    return {
      engagement,
      compliance,
      adoption,
      feedback: metrics.feedback,
      overall: this.calculateOverallScore(engagement, compliance, adoption, metrics.feedback)
    };
  }

  /**
   * Get all pilots with optional filtering
   */
  async getAllPilots(filters: { status?: string; region?: string }): Promise<any[]> {
    return await this.pilotRepository.getAllPilots(filters);
  }

  /**
   * Update pilot status
   */
  async updatePilotStatus(tenantId: string, status: string, notes?: string): Promise<any> {
    const pilot = await this.pilotRepository.getPilotByTenantId(tenantId);
    if (!pilot) {
      throw new Error('Pilot not found');
    }

    const updateData = {
      status,
      notes,
      updatedAt: new Date()
    };

    return await this.pilotRepository.updatePilot(tenantId, updateData);
  }

  /**
   * Calculate pilot progress percentage
   */
  private calculateProgress(pilot: any, metrics: any): number {
    const weights = {
      onboarding: 20,
      engagement: 30,
      compliance: 25,
      feedback: 15,
      adoption: 10
    };

    let progress = 0;
    
    // Onboarding progress (checklist completion)
    if (pilot.status === 'active') progress += weights.onboarding;
    
    // Engagement progress (based on active users)
    const engagementScore = Math.min(100, (metrics.engagement?.activeUsers || 0) / 10 * 100);
    progress += (engagementScore / 100) * weights.engagement;
    
    // Compliance progress (based on audit trail completeness)
    const complianceScore = metrics.compliance?.auditTrailCompleteness || 0;
    progress += (complianceScore / 100) * weights.compliance;
    
    // Feedback progress (based on feedback volume and resolution)
    const feedbackScore = Math.min(100, (metrics.feedback?.totalFeedback || 0) * 10);
    progress += (feedbackScore / 100) * weights.feedback;
    
    // Adoption progress (based on modules used)
    const adoptionScore = Math.min(100, (metrics.adoption?.modulesUsed || 0) / 5 * 100);
    progress += (adoptionScore / 100) * weights.adoption;
    
    return Math.round(progress);
  }

  /**
   * Calculate overall pilot success score
   */
  private calculateOverallScore(engagement: any, compliance: any, adoption: any, feedback: any): number {
    const weights = {
      engagement: 0.3,
      compliance: 0.4,
      adoption: 0.2,
      feedback: 0.1
    };

    const engagementScore = engagement?.activeUsers > 0 ? 100 : 0;
    const complianceScore = compliance?.auditTrailCompleteness || 0;
    const adoptionScore = Math.min(100, (adoption?.modulesUsed || 0) / 5 * 100);
    const feedbackScore = feedback?.resolutionRate || 0;

    return Math.round(
      engagementScore * weights.engagement +
      complianceScore * weights.compliance +
      adoptionScore * weights.adoption +
      feedbackScore * weights.feedback
    );
  }
}
