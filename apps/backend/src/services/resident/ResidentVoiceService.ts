/**
 * @fileoverview resident voice Service
 * @module Resident/ResidentVoiceService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description resident voice Service
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../core/DatabaseService';
import { Logger } from '../core/Logger';
import { AuditService } from '../core/AuditService';
import { RealtimeMessagingService } from '../communication/RealtimeMessagingService';
import { AIService } from '../core/AIService';
import { AdvocacyManagementService } from './AdvocacyManagementService';
import { QualityOfLifeAssessmentService } from './QualityOfLifeAssessmentService';

export interface ResidentProfile {
  id: string;
  tenantId: string;
  residentId: string;
  voicePreferences: VoicePreferences;
  communicationAbilities: CommunicationAbilities;
  advocacySettings: AdvocacySettings;
  qualityOfLifeMetrics: QualityOfLifeMetrics;
  feedbackHistory: FeedbackSummary;
  lastAssessment: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoicePreferences {
  preferredCommunicationMethod: CommunicationMethod[];
  languagePreferences: string[];
  assistiveTechnology: AssistiveTechnology[];
  bestCommunicationTimes: TimeSlot[];
  supportPersonRequired: boolean;
  supportPersonDetails?: SupportPerson;
  documentationPreferences: DocumentationPreferences;
}

export interface CommunicationAbilities {
  verbalCommunication: AbilityLevel;
  writtenCommunication: AbilityLevel;
  nonVerbalCommunication: AbilityLevel;
  cognitiveAbility: AbilityLevel;
  hearingAbility: AbilityLevel;
  visionAbility: AbilityLevel;
  mobilityForCommunication: AbilityLevel;
  specificNeeds: string[];
  adaptationStrategies: string[];
}

export interface AdvocacySettings {
  selfAdvocacyLevel: AdvocacyLevel;
  advocateRequired: boolean;
  advocateDetails?: AdvocateInfo;
  consentForAdvocacy: boolean;
  advocacyAreas: AdvocacyArea[];
  escalationPreferences: EscalationPreferences;
  rightsAwarenessLevel: number; // 1-10 scale
}

export interface QualityOfLifeMetrics {
  overallSatisfaction: number; // 1-10 scale
  autonomyLevel: number; // 1-10 scale
  socialEngagement: number; // 1-10 scale
  personalChoice: number; // 1-10 scale
  dignityRespect: number; // 1-10 scale
  privacyLevel: number; // 1-10 scale
  comfortLevel: number; // 1-10 scale
  meaningfulActivity: number; // 1-10 scale
  lastUpdated: string;
  trends: QualityTrend[];
}

export interface ResidentFeedback {
  id: string;
  residentId: string;
  tenantId: string;
  feedbackType: FeedbackType;
  category: FeedbackCategory;
  severity: FeedbackSeverity;
  title: string;
  description: string;
  communicationMethod: CommunicationMethod;
  supportPersonPresent: boolean;
  feedbackData: Record<string, any>;
  attachments: FeedbackAttachment[];
  status: FeedbackStatus;
  responseRequired: boolean;
  responseDeadline?: string;
  assignedTo?: string;
  resolutionNotes?: string;
  resolutionDate?: string;
  satisfactionWithResponse?: number; // 1-10 scale
  followUpRequired: boolean;
  followUpDate?: string;
  submittedBy: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvocacyRequest {
  id: string;
  residentId: string;
  tenantId: string;
  requestType: AdvocacyRequestType;
  priority: AdvocacyPriority;
  subject: string;
  description: string;
  requestedOutcome: string;
  advocacyAreas: AdvocacyArea[];
  supportingEvidence: Evidence[];
  advocateRequired: boolean;
  assignedAdvocate?: string;
  status: AdvocacyStatus;
  escalationLevel: number;
  responseTimeframe: number; // hours
  resolutionDate?: string;
  outcome?: string;
  residentSatisfaction?: number; // 1-10 scale
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CommunicationMethod = 
  | 'verbal' 
  | 'written' 
  | 'digital_device' 
  | 'sign_language' 
  | 'picture_cards' 
  | 'assistive_technology'
  | 'family_supported' 
  | 'advocate_supported';

export type AssistiveTechnology = 
  | 'speech_device' 
  | 'text_to_speech' 
  | 'large_print' 
  | 'magnifier'
  | 'hearing_aid' 
  | 'communication_board' 
  | 'tablet_device' 
  | 'eye_gaze_system';

export type AbilityLevel = 
  | 'independent' 
  | 'minimal_support' 
  | 'moderate_support' 
  | 'significant_support' 
  | 'unable';

export type AdvocacyLevel = 
  | 'independent' 
  | 'supported' 
  | 'representative' 
  | 'guardianship';

export type FeedbackType = 
  | 'compliment' 
  | 'concern' 
  | 'complaint' 
  | 'suggestion' 
  | 'incident_report'
  | 'quality_feedback' 
  | 'rights_issue' 
  | 'safety_concern';

export type FeedbackCategory = 
  | 'care_quality' 
  | 'staff_behavior' 
  | 'food_services' 
  | 'activities'
  | 'environment' 
  | 'personal_care' 
  | 'dignity_respect' 
  | 'choice_control'
  | 'safety_security' 
  | 'communication';

export type FeedbackSeverity = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type FeedbackStatus = 
  | 'submitted' 
  | 'acknowledged' 
  | 'investigating' 
  | 'resolved' 
  | 'closed';

export type AdvocacyRequestType = 
  | 'care_concern' 
  | 'rights_violation' 
  | 'dignity_issue' 
  | 'choice_freedom'
  | 'safety_concern' 
  | 'financial_matter' 
  | 'family_relationship' 
  | 'medical_decision';

export type AdvocacyPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type AdvocacyArea = 
  | 'personal_care' 
  | 'medical_treatment' 
  | 'dignity_respect' 
  | 'choice_control'
  | 'privacy_rights' 
  | 'financial_affairs' 
  | 'social_relationships' 
  | 'activities_engagement';

export type AdvocacyStatus = 
  | 'submitted' 
  | 'assigned' 
  | 'investigating' 
  | 'escalated' 
  | 'resolved';

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  preferred: boolean;
}

interface SupportPerson {
  name: string;
  relationship: string;
  contactInfo: string;
  availabilityNotes: string;
}

interface DocumentationPreferences {
  recordInteractions: boolean;
  shareWithFamily: boolean;
  confidentialityLevel: 'full' | 'limited' | 'restricted';
  accessPermissions: string[];
}

interface AdvocateInfo {
  name: string;
  type: 'independent' | 'family' | 'professional' | 'statutory';
  contactInfo: string;
  specializationAreas: AdvocacyArea[];
  appointmentDate: string;
}

interface EscalationPreferences {
  automaticEscalation: boolean;
  escalationTimeframe: number; // hours
  escalationContacts: string[];
  externalAdvocateContact?: string;
}

interface QualityTrend {
  metric: string;
  previousValue: number;
  currentValue: number;
  changeDate: string;
  trend: 'improving' | 'declining' | 'stable';
}

interface FeedbackSummary {
  totalFeedback: number;
  feedbackByType: Record<FeedbackType, number>;
  averageResponseTime: number; // hours
  resolutionRate: number; // percentage
  satisfactionScore: number; // 1-10 scale
}

interface FeedbackAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
}

interface Evidence {
  type: 'document' | 'witness' | 'photo' | 'video' | 'audio' | 'timeline';
  description: string;
  attachmentId?: string;
  dateRecorded: string;
}

export class ResidentVoiceService {
  privatedb: DatabaseService;
  privatelogger: Logger;
  privateaudit: AuditService;
  privatenotifications: NotificationService;
  privateai: AIService;
  privateadvocacyService: AdvocacyManagementService;
  privatequalityService: QualityOfLifeAssessmentService;

  const ructor() {
    this.db = new DatabaseService();
    this.logger = new Logger('ResidentVoiceService');
    this.audit = new AuditService();
    this.notifications = new NotificationService();
    this.ai = new AIService();
    this.advocacyService = new AdvocacyManagementService();
    this.qualityService = new QualityOfLifeAssessmentService();
  }

  /**
   * Create or update resident voice profile
   */
  async updateResidentProfile(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const residentId = req.params.residentId;
      const profileData = req.body;

      // Validate resident access
      const hasAccess = await this.validateResidentAccess(tenantId, userId, residentId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to resident record'
        });
        return;
      }

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Check if profile exists
        const existingProfile = await client.query(`
          SELECT id FROM resident_voice_profiles 
          WHERE resident_id = $1 AND tenant_id = $2
        `, [residentId, tenantId]);

        let profileId: string;
        let operation: string;

        if (existingProfile.rows.length > 0) {
          // Update existing profile
          profileId = existingProfile.rows[0].id;
          operation = 'updated';

          const updateQuery = `
            UPDATE resident_voice_profiles 
            SET 
              voice_preferences = $3,
              communication_abilities = $4,
              advocacy_settings = $5,
              quality_of_life_metrics = $6,
              last_assessment = NOW(),
              updated_at = NOW(),
              updated_by = $7
            WHEREid = $1 AND tenant_id = $2
          `;

          await client.query(updateQuery, [
            profileId,
            tenantId,
            JSON.stringify(profileData.voicePreferences),
            JSON.stringify(profileData.communicationAbilities),
            JSON.stringify(profileData.advocacySettings),
            JSON.stringify(profileData.qualityOfLifeMetrics),
            userId
          ]);
        } else {
          // Create new profile
          profileId = uuidv4();
          operation = 'created';

          const insertQuery = `
            INSERT INTO resident_voice_profiles (
              id, tenant_id, resident_id, voice_preferences,
              communication_abilities, advocacy_settings, quality_of_life_metrics,
              last_assessment, is_active, created_by, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, NOW(), true, $8, NOW(), NOW()
            )
          `;

          await client.query(insertQuery, [
            profileId,
            tenantId,
            residentId,
            JSON.stringify(profileData.voicePreferences),
            JSON.stringify(profileData.communicationAbilities),
            JSON.stringify(profileData.advocacySettings),
            JSON.stringify(profileData.qualityOfLifeMetrics),
            userId
          ]);
        }

        // Update feedback history summary
        await this.updateFeedbackHistorySummary(profileId, tenantId);

        // Check for quality of life concerns
        await this.assessQualityOfLifeConcerns(
          tenantId, 
          residentId, 
          profileData.qualityOfLifeMetrics
        );

        await client.query('COMMIT');

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: `resident_voice_profile_${operation}`,
          resourceType: 'resident_voice_profile',
          resourceId: profileId,
          details: {
            residentId,
            operation,
            hasAdvocacyNeeds: profileData.advocacySettings?.advocateRequired || false
          }
        });

        this.logger.info(`Resident voice profile ${operation}`, {
          profileId,
          residentId,
          tenantId,
          updatedBy: userId
        });

        res.json({
          success: true,
          data: {
            profileId,
            operation,
            lastAssessment: new Date().toISOString()
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to update resident voice profile', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update resident profile'
      });
    }
  }

  /**
   * Submit resident feedback
   */
  async submitResidentFeedback(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const residentId = req.params.residentId;
      const feedbackData = req.body;

      // Validate resident access
      const hasAccess = await this.validateResidentAccess(tenantId, userId, residentId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to submit feedback for this resident'
        });
        return;
      }

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        const feedbackId = uuidv4();

        // Calculate response deadline based on severity
        const responseDeadline = this.calculateResponseDeadline(feedbackData.severity);

        // Determine if response is required
        const responseRequired = ['concern', 'complaint', 'incident_report', 'rights_issue', 'safety_concern']
          .includes(feedbackData.feedbackType);

        const insertQuery = `
          INSERT INTO resident_feedback (
            id, resident_id, tenant_id, feedback_type, category, severity,
            title, description, communication_method, support_person_present,
            feedback_data, attachments, status, response_required, response_deadline,
            follow_up_required, submitted_by, submitted_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'submitted',
            $13, $14, $15, $16, NOW(), NOW(), NOW()
          ) RETURNING *
        `;

        const result = await client.query(insertQuery, [
          feedbackId,
          residentId,
          tenantId,
          feedbackData.feedbackType,
          feedbackData.category,
          feedbackData.severity,
          feedbackData.title,
          feedbackData.description,
          feedbackData.communicationMethod,
          feedbackData.supportPersonPresent || false,
          JSON.stringify(feedbackData.feedbackData || {}),
          JSON.stringify(feedbackData.attachments || []),
          responseRequired,
          responseDeadline,
          feedbackData.followUpRequired || false,
          userId
        ]);

        const feedback = result.rows[0];

        // Auto-assign based on category and severity
        const assignedTo = await this.autoAssignFeedback(
          tenantId, 
          feedbackData.category, 
          feedbackData.severity
        );

        if (assignedTo) {
          await client.query(`
            UPDATE resident_feedback 
            SET assigned_to = $1, status = 'acknowledged', updated_at = NOW()
            WHEREid = $2
          `, [assignedTo, feedbackId]);
        }

        await client.query('COMMIT');

        // Send notifications
        await this.sendFeedbackNotifications(tenantId, feedback, assignedTo);

        // Analyze feedback with AI for patterns/concerns
        await this.analyzeFeedbackPatterns(tenantId, residentId, feedbackData);

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'resident_feedback_submitted',
          resourceType: 'resident_feedback',
          resourceId: feedbackId,
          details: {
            residentId,
            feedbackType: feedbackData.feedbackType,
            category: feedbackData.category,
            severity: feedbackData.severity,
            responseRequired
          }
        });

        this.logger.info('Resident feedback submitted', {
          feedbackId,
          residentId,
          feedbackType: feedbackData.feedbackType,
          severity: feedbackData.severity,
          submittedBy: userId
        });

        const response: ResidentFeedback = {
          id: feedback.id,
          residentId: feedback.resident_id,
          tenantId: feedback.tenant_id,
          feedbackType: feedback.feedback_type,
          category: feedback.category,
          severity: feedback.severity,
          title: feedback.title,
          description: feedback.description,
          communicationMethod: feedback.communication_method,
          supportPersonPresent: feedback.support_person_present,
          feedbackData: JSON.parse(feedback.feedback_data),
          attachments: JSON.parse(feedback.attachments),
          status: feedback.status,
          responseRequired: feedback.response_required,
          responseDeadline: feedback.response_deadline,
          assignedTo: assignedTo || undefined,
          followUpRequired: feedback.follow_up_required,
          submittedBy: feedback.submitted_by,
          submittedAt: feedback.submitted_at,
          createdAt: feedback.created_at,
          updatedAt: feedback.updated_at
        };

        res.status(201).json({
          success: true,
          data: response
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to submit resident feedback', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback'
      });
    }
  }

  // Private helper methods

  private async validateResidentAccess(
    tenantId: string,
    userId: string,
    residentId: string
  ): Promise<boolean> {
    const accessQuery = `
      SELECT 1 FROM residents r
      LEFT JOIN care_team_assignments cta ON r.id = cta.resident_id
      WHERE r.id = $1 AND r.tenant_id = $2 AND (
        cta.staff_id = $3 OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = $3 AND u.tenant_id = $2 
            AND (u.role IN ('admin', 'manager') OR u.permissions ? 'resident_management')
        )
      )
    `;

    const result = await this.db.query(accessQuery, [residentId, tenantId, userId]);
    return result.rows.length > 0;
  }

  private async updateFeedbackHistorySummary(
    profileId: string,
    tenantId: string
  ): Promise<void> {
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_feedback,
        AVG(EXTRACT(EPOCH FROM (resolved_date - submitted_at)) / 3600) as avg_response_time,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
        AVG(satisfaction_with_response) as avg_satisfaction,
        feedback_type,
        COUNT(*) as type_count
      FROM resident_feedback rf
      JOIN resident_voice_profiles rvp ON rf.resident_id = rvp.resident_id
      WHERE rvp.id = $1 AND rf.tenant_id = $2
        AND rf.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY feedback_type
    `;

    const result = await this.db.query(summaryQuery, [profileId, tenantId]);
    
    // Process results into summary format
    const feedbackByType: Record<string, number> = {};
    let totalFeedback = 0;
    let avgResponseTime = 0;
    let resolutionRate = 0;
    let satisfactionScore = 0;

    result.rows.forEach((row: any) => {
      feedbackByType[row.feedback_type] = parseInt(row.type_count);
      totalFeedback += parseInt(row.type_count);
      if (row.avg_response_time) avgResponseTime = parseFloat(row.avg_response_time);
      if (row.resolved_count && row.total_feedback) {
        resolutionRate = (parseInt(row.resolved_count) / parseInt(row.total_feedback)) * 100;
      }
      if (row.avg_satisfaction) satisfactionScore = parseFloat(row.avg_satisfaction);
    });

    const feedbackHistory: FeedbackSummary = {
      totalFeedback,
      feedbackByType: feedbackByType as Record<FeedbackType, number>,
      averageResponseTime: Math.round(avgResponseTime * 10) / 10,
      resolutionRate: Math.round(resolutionRate),
      satisfactionScore: Math.round(satisfactionScore * 10) / 10
    };

    // Update the profile with feedback history
    await this.db.query(`
      UPDATE resident_voice_profiles 
      SET feedback_history = $1, updated_at = NOW()
      WHEREid = $2
    `, [JSON.stringify(feedbackHistory), profileId]);
  }

  private async assessQualityOfLifeConcerns(
    tenantId: string,
    residentId: string,
    qualityMetrics: QualityOfLifeMetrics
  ): Promise<void> {
    // Check for concerning quality of life scores (below 6/10)
    const concernThreshold = 6;
    const concernAreas: string[] = [];

    if (qualityMetrics.overallSatisfaction < concernThreshold) concernAreas.push('overall satisfaction');
    if (qualityMetrics.autonomyLevel < concernThreshold) concernAreas.push('autonomy');
    if (qualityMetrics.socialEngagement < concernThreshold) concernAreas.push('social engagement');
    if (qualityMetrics.personalChoice < concernThreshold) concernAreas.push('personal choice');
    if (qualityMetrics.dignityRespect < concernThreshold) concernAreas.push('dignity and respect');
    if (qualityMetrics.privacyLevel < concernThreshold) concernAreas.push('privacy');

    if (concernAreas.length > 0) {
      // Create alert for care team
      const managersQuery = `
        SELECT DISTINCT u.id FROM users u
        WHERE u.tenant_id = $1 AND (u.role IN ('admin', 'manager') OR u.permissions ? 'resident_management')
      `;
      const managers = await this.db.query(managersQuery, [tenantId]);

      for (const manager of managers.rows) {
        await this.notifications.create({
          tenantId,
          userId: manager.id,
          type: 'quality_of_life_concern',
          title: 'Quality of Life Concerns Identified',
          message: `Resident shows concerning scoresin: ${concernAreas.join(', ')}`,
          data: { 
            residentId, 
            concernAreas, 
            scores: qualityMetrics 
          },
          actionRequired: true,
          priority: 'high'
        });
      }
    }
  }

  private calculateResponseDeadline(severity: FeedbackSeverity): Date {
    const deadlineHours = {
      'low': 72,      // 3 days
      'medium': 48,   // 2 days
      'high': 24,     // 1 day
      'urgent': 4     // 4 hours
    };

    const hours = deadlineHours[severity];
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private async autoAssignFeedback(
    tenantId: string,
    category: FeedbackCategory,
    severity: FeedbackSeverity
  ): Promise<string | null> {
    // Auto-assign based on category and severity
    const assignmentQuery = `
      SELECT u.id FROM users u
      WHERE u.tenant_id = $1 
        AND u.is_active = true
        AND (
          (u.role = 'manager' AND $3 IN ('high', 'urgent')) OR
          (u.permissions ? 'feedback_management') OR
          (u.permissions ? $2)
        )
      ORDER BY 
        CASE WHEN $3 = 'urgent' THEN u.role = 'manager' ELSE false END DESC,
        RANDOM()
      LIMIT 1
    `;

    const result = await this.db.query(assignmentQuery, [tenantId, category, severity]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  private async sendFeedbackNotifications(
    tenantId: string,
    feedback: any,
    assignedTo?: string
  ): Promise<void> {
    // Send notification to assigned person
    if (assignedTo) {
      await this.notifications.create({
        tenantId,
        userId: assignedTo,
        type: 'feedback_assigned',
        title: 'New Feedback Assigned',
        message: `${feedback.feedback_type}: ${feedback.title}`,
        data: { 
          feedbackId: feedback.id,
          residentId: feedback.resident_id,
          severity: feedback.severity,
          category: feedback.category
        },
        actionRequired: true,
        priority: feedback.severity === 'urgent' ? 'urgent' : 'medium'
      });
    }
  }

  private async analyzeFeedbackPatterns(
    tenantId: string,
    residentId: string,
    feedbackData: any
  ): Promise<void> {
    // Use AI to analyze feedback patterns and concerns
    try {
      const recentFeedback = await this.db.query(`
        SELECT feedback_type, category, description, created_at
        FROM resident_feedback 
        WHERE resident_id = $1 AND tenant_id = $2 
          AND created_at >= NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT 10
      `, [residentId, tenantId]);

      if (recentFeedback.rows.length >= 3) {
        const patterns = await this.ai.analyzeFeedbackPatterns({
          residentId,
          recentFeedback: recentFeedback.rows,
          currentFeedback: feedbackData
        });

        if (patterns.concernsDetected) {
          this.logger.warn('Feedback patterns indicate potential concerns', {
            residentId,
            tenantId,
            patterns: patterns.summary
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to analyze feedback patterns', error);
    }
  }

  // Route definitions
  getRoutes(): express.Router {
    const router = express.Router();

    // Validation middleware
    const profileValidation = [
      param('residentId').isUUID(),
      body('voicePreferences.preferredCommunicationMethod').isArray(),
      body('communicationAbilities').isObject(),
      body('advocacySettings').isObject(),
      body('qualityOfLifeMetrics.overallSatisfaction').isInt({ min: 1, max: 10 }),
      body('qualityOfLifeMetrics.autonomyLevel').isInt({ min: 1, max: 10 }),
      body('qualityOfLifeMetrics.socialEngagement').isInt({ min: 1, max: 10 })
    ];

    const feedbackValidation = [
      param('residentId').isUUID(),
      body('feedbackType').isIn(['compliment', 'concern', 'complaint', 'suggestion', 'incident_report', 'quality_feedback', 'rights_issue', 'safety_concern']),
      body('category').isIn(['care_quality', 'staff_behavior', 'food_services', 'activities', 'environment', 'personal_care', 'dignity_respect', 'choice_control', 'safety_security', 'communication']),
      body('severity').isIn(['low', 'medium', 'high', 'urgent']),
      body('title').isLength({ min: 5, max: 200 }).trim(),
      body('description').isLength({ min: 10, max: 2000 }).trim(),
      body('communicationMethod').isIn(['verbal', 'written', 'digital_device', 'sign_language', 'picture_cards', 'assistive_technology', 'family_supported', 'advocate_supported'])
    ];

    const assessmentValidation = [
      param('residentId').isUUID(),
      body('assessmentType').isIn(['comprehensive', 'focused', 'emergency', 'routine', 'discharge_planning', 'complaint_triggered', 'regulatory_required']),
      body('domains').isArray({ min: 1 })
    ];

    const advocacyValidation = [
      param('residentId').isUUID(),
      body('requestType').isIn(['rights_violation', 'care_concern', 'choice_restriction', 'dignity_issue', 'safety_concern']),
      body('priority').isIn(['low', 'medium', 'high', 'urgent']),
      body('description').isLength({ min: 10, max: 2000 }).trim()
    ];

    const preferencesValidation = [
      param('residentId').isUUID(),
      body('preferences').isObject(),
      body('importanceLevel').isIn(['low', 'medium', 'high', 'critical'])
    ];

    // Routes
    router.put('/residents/:residentId/voice-profile', profileValidation, this.updateResidentProfile.bind(this));
    router.post('/residents/:residentId/feedback', feedbackValidation, this.submitResidentFeedback.bind(this));
    router.post('/residents/:residentId/quality-assessment', assessmentValidation, this.conductQualityAssessment.bind(this));
    router.post('/residents/:residentId/advocacy-request', advocacyValidation, this.createAdvocacyRequest.bind(this));
    router.get('/residents/:residentId/empowerment-dashboard', this.getEmpowermentDashboard.bind(this));
    router.put('/residents/:residentId/preferences', preferencesValidation, this.updateResidentPreferences.bind(this));
    router.get('/residents/:residentId/feedback/analysis', this.getResidentFeedbackAnalysis.bind(this));

    return router;
  }
}
