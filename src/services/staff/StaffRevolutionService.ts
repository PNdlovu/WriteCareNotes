import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../core/DatabaseService';
import { Logger } from '../core/Logger';
import { AuditService } from '../core/AuditService';
import { RealtimeMessagingService } from '../communication/RealtimeMessagingService';
import { AIService } from '../core/AIService';
import { AnalyticsService } from '../core/AnalyticsService';

export interface StaffMember {
  id: string;
  tenantId: string;
  userId: string;
  employeeId: string;
  department: StaffDepartment;
  role: StaffRole;
  shiftPatterns: ShiftPattern[];
  wellnessProfile: WellnessProfile;
  burnoutRiskScore: number;
  lastAssessment: string;
  isActive: boolean;
  hiredDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface WellnessProfile {
  stressLevel: number; // 1-10 scale
  workLifeBalance: number; // 1-10 scale
  jobSatisfaction: number; // 1-10 scale
  physicalHealth: number; // 1-10 scale
  mentalHealth: number; // 1-10 scale
  sleepQuality: number; // 1-10 scale
  socialSupport: number; // 1-10 scale
  workloadManagement: number; // 1-10 scale
  lastUpdated: string;
  notes?: string;
}

export interface BurnoutAssessment {
  id: string;
  staffId: string;
  tenantId: string;
  assessmentType: AssessmentType;
  scores: BurnoutScores;
  riskLevel: RiskLevel;
  recommendations: Recommendation[];
  followUpRequired: boolean;
  followUpDate?: string;
  assessedBy?: string;
  notes?: string;
  isConfidential: boolean;
  createdAt: string;
}

export interface BurnoutScores {
  emotionalExhaustion: number; // 0-54 scale (Maslach Burnout Inventory)
  depersonalization: number; // 0-30 scale
  personalAccomplishment: number; // 0-48 scale
  workEngagement: number; // 1-7 scale
  resilience: number; // 1-5 scale
  copingMechanisms: number; // 1-10 scale
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionItems: string[];
  estimatedTimeframe: string;
  resources: Resource[];
  isCompleted: boolean;
  completedAt?: string;
}

export interface Resource {
  type: ResourceType;
  title: string;
  description: string;
  url?: string;
  contactInfo?: string;
  availability?: string;
}

export interface SupportNetwork {
  id: string;
  tenantId: string;
  networkType: NetworkType;
  name: string;
  description: string;
  facilitatorId?: string;
  members: NetworkMember[];
  meetingSchedule?: MeetingSchedule;
  isActive: boolean;
  createdAt: string;
}

export interface NetworkMember {
  staffId: string;
  role: 'facilitator' | 'member' | 'mentor' | 'mentee';
  joinedAt: string;
  participationLevel: 'active' | 'occasional' | 'inactive';
}

export interface WorkloadAnalysis {
  id: string;
  staffId: string;
  tenantId: string;
  analysisDate: string;
  metrics: WorkloadMetrics;
  trends: WorkloadTrend[];
  alerts: WorkloadAlert[];
  recommendations: string[];
  createdAt: string;
}

export interface WorkloadMetrics {
  averageHoursPerWeek: number;
  overtimeHours: number;
  consecutiveDays: number;
  taskComplexity: number; // 1-10 scale
  patientLoad: number;
  administrativeTasks: number;
  emergencyResponses: number;
  trainingHours: number;
}

export interface WellnessProgram {
  id: string;
  tenantId: string;
  programName: string;
  programType: ProgramType;
  description: string;
  objectives: string[];
  activities: WellnessActivity[];
  eligibilityCriteria: string[];
  duration: string;
  maxParticipants?: number;
  facilitatorId?: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  participants: ProgramParticipant[];
  outcomes: ProgramOutcome[];
  createdBy: string;
  createdAt: string;
}

export interface WellnessActivity {
  id: string;
  name: string;
  type: ActivityType;
  description: string;
  duration: number; // minutes
  frequency: string;
  location?: string;
  materials?: string[];
  maxParticipants?: number;
}

export type StaffDepartment = 
  | 'nursing' 
  | 'care_assistance' 
  | 'administration' 
  | 'housekeeping' 
  | 'kitchen' 
  | 'maintenance' 
  | 'activities' 
  | 'social_work'
  | 'management';

export type StaffRole = 
  | 'care_assistant' 
  | 'registered_nurse' 
  | 'nurse_practitioner' 
  | 'care_coordinator' 
  | 'activities_coordinator'
  | 'social_worker' 
  | 'administrator' 
  | 'manager' 
  | 'director';

export type AssessmentType = 
  | 'self_assessment' 
  | 'peer_assessment' 
  | 'supervisor_assessment' 
  | 'professional_evaluation'
  | 'periodic_check' 
  | 'incident_triggered';

export type RiskLevel = 
  | 'low' 
  | 'moderate' 
  | 'high' 
  | 'severe' 
  | 'critical';

export type RecommendationCategory = 
  | 'workload_management' 
  | 'stress_reduction' 
  | 'professional_development'
  | 'peer_support' 
  | 'health_wellness' 
  | 'work_environment' 
  | 'time_management'
  | 'career_development';

export type ResourceType = 
  | 'counseling_service' 
  | 'training_program' 
  | 'support_group'
  | 'wellness_app' 
  | 'educational_material' 
  | 'external_service' 
  | 'internal_program';

export type NetworkType = 
  | 'peer_support' 
  | 'mentorship' 
  | 'department_team' 
  | 'wellness_group'
  | 'professional_development' 
  | 'crisis_support';

export type ProgramType = 
  | 'stress_management' 
  | 'mindfulness' 
  | 'physical_fitness' 
  | 'mental_health'
  | 'work_life_balance' 
  | 'team_building' 
  | 'leadership_development' 
  | 'resilience_training';

export type ActivityType = 
  | 'workshop' 
  | 'exercise_class' 
  | 'meditation' 
  | 'counseling_session'
  | 'team_activity' 
  | 'educational_seminar' 
  | 'support_meeting' 
  | 'wellness_check';

interface ShiftPattern {
  type: 'day' | 'night' | 'rotating' | 'split';
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive: boolean;
}

interface MeetingSchedule {
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'adhoc';
  dayOfWeek?: number;
  time?: string;
  duration: number; // minutes
  location?: string;
}

interface WorkloadTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  periodDays: number;
}

interface WorkloadAlert {
  type: 'overtime_limit' | 'consecutive_days' | 'high_complexity' | 'low_performance';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
}

interface ProgramParticipant {
  staffId: string;
  enrolledAt: string;
  completionStatus: 'enrolled' | 'active' | 'completed' | 'withdrawn';
  progressPercentage: number;
  lastActivity?: string;
}

interface ProgramOutcome {
  metric: string;
  preValue: number;
  postValue: number;
  improvementPercentage: number;
  significanceLevel: number;
}

export class StaffRevolutionService {
  private db: DatabaseService;
  private logger: Logger;
  private audit: AuditService;
  private notifications: NotificationService;
  private ai: AIService;
  private analytics: AnalyticsService;

  constructor() {
    this.db = new DatabaseService();
    this.logger = new Logger('StaffRevolutionService');
    this.audit = new AuditService();
    this.notifications = new NotificationService();
    this.ai = new AIService();
    this.analytics = new AnalyticsService();
  }

  /**
   * Create or update staff wellness profile
   */
  async updateWellnessProfile(req: Request, res: Response): Promise<void> {
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
      const staffId = req.params.staffId;
      const wellnessData: WellnessProfile = req.body;

      // Validate staff member exists and user has permission
      const staffAccess = await this.validateStaffAccess(tenantId, userId, staffId);
      if (!staffAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to staff record'
        });
        return;
      }

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Update or create wellness profile
        const wellnessProfileData = {
          ...wellnessData,
          lastUpdated: new Date().toISOString()
        };

        const updateQuery = `
          UPDATE staff_wellness_profiles 
          SET 
            stress_level = $3,
            work_life_balance = $4,
            job_satisfaction = $5,
            physical_health = $6,
            mental_health = $7,
            sleep_quality = $8,
            social_support = $9,
            workload_management = $10,
            notes = $11,
            last_updated = NOW(),
            updated_at = NOW()
          WHERE staff_id = $1 AND tenant_id = $2
        `;

        const updateResult = await client.query(updateQuery, [
          staffId,
          tenantId,
          wellnessData.stressLevel,
          wellnessData.workLifeBalance,
          wellnessData.jobSatisfaction,
          wellnessData.physicalHealth,
          wellnessData.mentalHealth,
          wellnessData.sleepQuality,
          wellnessData.socialSupport,
          wellnessData.workloadManagement,
          wellnessData.notes || null
        ]);

        if (updateResult.rowCount === 0) {
          // Create new wellness profile
          const insertQuery = `
            INSERT INTO staff_wellness_profiles (
              id, staff_id, tenant_id, stress_level, work_life_balance,
              job_satisfaction, physical_health, mental_health, sleep_quality,
              social_support, workload_management, notes, last_updated, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), NOW()
            )
          `;

          await client.query(insertQuery, [
            uuidv4(),
            staffId,
            tenantId,
            wellnessData.stressLevel,
            wellnessData.workLifeBalance,
            wellnessData.jobSatisfaction,
            wellnessData.physicalHealth,
            wellnessData.mentalHealth,
            wellnessData.sleepQuality,
            wellnessData.socialSupport,
            wellnessData.workloadManagement,
            wellnessData.notes || null,
            new Date()
          ]);
        }

        // Calculate updated burnout risk score
        const burnoutRisk = this.calculateBurnoutRisk(wellnessData);

        // Update staff member burnout risk
        await client.query(`
          UPDATE staff_members 
          SET burnout_risk_score = $1, last_assessment = NOW(), updated_at = NOW()
          WHERE id = $2 AND tenant_id = $3
        `, [burnoutRisk, staffId, tenantId]);

        // Check for high-risk alerts
        if (burnoutRisk >= 7) {
          await this.createHighRiskAlert(tenantId, staffId, burnoutRisk, wellnessData);
        }

        // Generate AI-powered recommendations
        const recommendations = await this.ai.generateWellnessRecommendations({
          wellnessProfile: wellnessData,
          burnoutRisk,
          staffRole: await this.getStaffRole(staffId)
        });

        await client.query('COMMIT');

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'wellness_profile_updated',
          resourceType: 'staff_wellness_profile',
          resourceId: staffId,
          details: {
            burnoutRisk,
            alertGenerated: burnoutRisk >= 7
          }
        });

        this.logger.info('Wellness profile updated', {
          staffId,
          tenantId,
          burnoutRisk,
          updatedBy: userId
        });

        res.json({
          success: true,
          data: {
            wellnessProfile: wellnessProfileData,
            burnoutRisk,
            recommendations
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to update wellness profile', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update wellness profile'
      });
    }
  }

  /**
   * Conduct burnout assessment
   */
  async conductBurnoutAssessment(req: Request, res: Response): Promise<void> {
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
      const staffId = req.params.staffId;
      const assessmentData = req.body;

      // Validate staff access
      const staffAccess = await this.validateStaffAccess(tenantId, userId, staffId);
      if (!staffAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to staff record'
        });
        return;
      }

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Calculate risk level based on scores
        const riskLevel = this.calculateRiskLevel(assessmentData.scores);

        // Generate recommendations based on assessment
        const recommendations = await this.generateRecommendations(
          assessmentData.scores,
          riskLevel,
          staffId
        );

        // Create assessment record
        const assessmentId = uuidv4();
        const insertQuery = `
          INSERT INTO burnout_assessments (
            id, staff_id, tenant_id, assessment_type, scores, risk_level,
            recommendations, follow_up_required, follow_up_date, assessed_by,
            notes, is_confidential, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
          ) RETURNING *
        `;

        const followUpRequired = riskLevel === 'high' || riskLevel === 'severe' || riskLevel === 'critical';
        const followUpDate = followUpRequired ? 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null; // 7 days from now

        const result = await client.query(insertQuery, [
          assessmentId,
          staffId,
          tenantId,
          assessmentData.assessmentType,
          JSON.stringify(assessmentData.scores),
          riskLevel,
          JSON.stringify(recommendations),
          followUpRequired,
          followUpDate,
          assessmentData.assessedBy || userId,
          assessmentData.notes || null,
          assessmentData.isConfidential || false
        ]);

        const assessment = result.rows[0];

        // Update staff member record
        await client.query(`
          UPDATE staff_members 
          SET last_assessment = NOW(), updated_at = NOW()
          WHERE id = $1 AND tenant_id = $2
        `, [staffId, tenantId]);

        // Create notifications for high-risk cases
        if (riskLevel === 'high' || riskLevel === 'severe' || riskLevel === 'critical') {
          await this.createCriticalAssessmentNotifications(tenantId, staffId, assessment);
        }

        await client.query('COMMIT');

        // Generate detailed report
        const reportData = await this.generateAssessmentReport(assessment, recommendations);

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'burnout_assessment_conducted',
          resourceType: 'burnout_assessment',
          resourceId: assessmentId,
          details: {
            riskLevel,
            assessmentType: assessmentData.assessmentType,
            followUpRequired
          }
        });

        this.logger.info('Burnout assessment completed', {
          assessmentId,
          staffId,
          riskLevel,
          assessedBy: userId
        });

        const response: BurnoutAssessment = {
          id: assessment.id,
          staffId: assessment.staff_id,
          tenantId: assessment.tenant_id,
          assessmentType: assessment.assessment_type,
          scores: JSON.parse(assessment.scores),
          riskLevel: assessment.risk_level,
          recommendations: JSON.parse(assessment.recommendations),
          followUpRequired: assessment.follow_up_required,
          followUpDate: assessment.follow_up_date,
          assessedBy: assessment.assessed_by,
          notes: assessment.notes,
          isConfidential: assessment.is_confidential,
          createdAt: assessment.created_at
        };

        res.status(201).json({
          success: true,
          data: {
            assessment: response,
            report: reportData
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to conduct burnout assessment', error);
      res.status(500).json({
        success: false,
        message: 'Failed to conduct assessment'
      });
    }
  }

  /**
   * Create peer support network
   */
  async createSupportNetwork(req: Request, res: Response): Promise<void> {
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
      const networkData = req.body;

      const networkId = uuidv4();
      const insertQuery = `
        INSERT INTO support_networks (
          id, tenant_id, network_type, name, description, facilitator_id,
          meeting_schedule, is_active, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW())
        RETURNING *
      `;

      const result = await this.db.query(insertQuery, [
        networkId,
        tenantId,
        networkData.networkType,
        networkData.name,
        networkData.description,
        networkData.facilitatorId || null,
        JSON.stringify(networkData.meetingSchedule || {}),
        userId
      ]);

      const network = result.rows[0];

      // Add initial members
      if (networkData.initialMembers && networkData.initialMembers.length > 0) {
        const memberPromises = networkData.initialMembers.map(async (member: any) => {
          const memberId = uuidv4();
          return this.db.query(`
            INSERT INTO network_members (
              id, network_id, staff_id, role, joined_at, participation_level
            ) VALUES ($1, $2, $3, $4, NOW(), 'active')
          `, [memberId, networkId, member.staffId, member.role || 'member']);
        });

        await Promise.all(memberPromises);
      }

      // Log audit event
      await this.audit.log({
        tenantId,
        userId,
        action: 'support_network_created',
        resourceType: 'support_network',
        resourceId: networkId,
        details: {
          networkType: networkData.networkType,
          memberCount: networkData.initialMembers?.length || 0
        }
      });

      this.logger.info('Support network created', {
        networkId,
        tenantId,
        networkType: networkData.networkType,
        createdBy: userId
      });

      const response: SupportNetwork = {
        id: network.id,
        tenantId: network.tenant_id,
        networkType: network.network_type,
        name: network.name,
        description: network.description,
        facilitatorId: network.facilitator_id,
        members: [], // Will be populated by separate query
        meetingSchedule: JSON.parse(network.meeting_schedule || '{}'),
        isActive: network.is_active,
        createdAt: network.created_at
      };

      res.status(201).json({
        success: true,
        data: response
      });

    } catch (error) {
      this.logger.error('Failed to create support network', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create support network'
      });
    }
  }

  /**
   * Analyze workload patterns
   */
  async analyzeWorkload(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const staffId = req.params.staffId;
      const period = parseInt(req.query.period as string) || 30; // days

      // Validate staff access
      const staffAccess = await this.validateStaffAccess(tenantId, userId, staffId);
      if (!staffAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to staff record'
        });
        return;
      }

      // Gather workload data from multiple sources
      const workloadData = await this.gatherWorkloadData(tenantId, staffId, period);

      // Calculate metrics
      const metrics = this.calculateWorkloadMetrics(workloadData);

      // Analyze trends
      const trends = await this.analyzeWorkloadTrends(tenantId, staffId, period);

      // Generate alerts
      const alerts = this.generateWorkloadAlerts(metrics, trends);

      // AI-powered recommendations
      const recommendations = await this.ai.generateWorkloadRecommendations({
        metrics,
        trends,
        alerts,
        staffProfile: await this.getStaffProfile(staffId)
      });

      // Create workload analysis record
      const analysisId = uuidv4();
      const insertQuery = `
        INSERT INTO workload_analyses (
          id, staff_id, tenant_id, analysis_date, metrics, trends,
          alerts, recommendations, created_at
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, NOW())
        RETURNING *
      `;

      const result = await this.db.query(insertQuery, [
        analysisId,
        staffId,
        tenantId,
        JSON.stringify(metrics),
        JSON.stringify(trends),
        JSON.stringify(alerts),
        JSON.stringify(recommendations)
      ]);

      const analysis = result.rows[0];

      // Log audit event
      await this.audit.log({
        tenantId,
        userId,
        action: 'workload_analysis_conducted',
        resourceType: 'workload_analysis',
        resourceId: analysisId,
        details: {
          period,
          alertCount: alerts.length,
          riskLevel: this.calculateWorkloadRiskLevel(metrics, alerts)
        }
      });

      this.logger.info('Workload analysis completed', {
        analysisId,
        staffId,
        period,
        alertCount: alerts.length
      });

      const response: WorkloadAnalysis = {
        id: analysis.id,
        staffId: analysis.staff_id,
        tenantId: analysis.tenant_id,
        analysisDate: analysis.analysis_date,
        metrics: JSON.parse(analysis.metrics),
        trends: JSON.parse(analysis.trends),
        alerts: JSON.parse(analysis.alerts),
        recommendations: JSON.parse(analysis.recommendations),
        createdAt: analysis.created_at
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      this.logger.error('Failed to analyze workload', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze workload'
      });
    }
  }

  /**
   * Create wellness program
   */
  async createWellnessProgram(req: Request, res: Response): Promise<void> {
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
      const programData = req.body;

      const programId = uuidv4();
      const insertQuery = `
        INSERT INTO wellness_programs (
          id, tenant_id, program_name, program_type, description,
          objectives, activities, eligibility_criteria, duration,
          max_participants, facilitator_id, is_active, start_date,
          end_date, created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true,
          $12, $13, $14, NOW()
        ) RETURNING *
      `;

      const result = await this.db.query(insertQuery, [
        programId,
        tenantId,
        programData.programName,
        programData.programType,
        programData.description,
        JSON.stringify(programData.objectives),
        JSON.stringify(programData.activities),
        JSON.stringify(programData.eligibilityCriteria),
        programData.duration,
        programData.maxParticipants || null,
        programData.facilitatorId || null,
        programData.startDate,
        programData.endDate || null,
        userId
      ]);

      const program = result.rows[0];

      // Send notifications to eligible staff
      await this.notifyEligibleStaff(tenantId, program);

      // Log audit event
      await this.audit.log({
        tenantId,
        userId,
        action: 'wellness_program_created',
        resourceType: 'wellness_program',
        resourceId: programId,
        details: {
          programType: programData.programType,
          activityCount: programData.activities.length
        }
      });

      this.logger.info('Wellness program created', {
        programId,
        tenantId,
        programType: programData.programType,
        createdBy: userId
      });

      const response: WellnessProgram = {
        id: program.id,
        tenantId: program.tenant_id,
        programName: program.program_name,
        programType: program.program_type,
        description: program.description,
        objectives: JSON.parse(program.objectives),
        activities: JSON.parse(program.activities),
        eligibilityCriteria: JSON.parse(program.eligibility_criteria),
        duration: program.duration,
        maxParticipants: program.max_participants,
        facilitatorId: program.facilitator_id,
        isActive: program.is_active,
        startDate: program.start_date,
        endDate: program.end_date,
        participants: [], // Will be populated as staff enroll
        outcomes: [],
        createdBy: program.created_by,
        createdAt: program.created_at
      };

      res.status(201).json({
        success: true,
        data: response
      });

    } catch (error) {
      this.logger.error('Failed to create wellness program', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create wellness program'
      });
    }
  }

  /**
   * Get staff wellness dashboard data
   */
  async getWellnessDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const period = req.query.period as string || '30d';

      // Get overall wellness metrics
      const overallMetrics = await this.analytics.getWellnessMetrics(tenantId, period);

      // Get risk distribution
      const riskDistribution = await this.getRiskDistribution(tenantId);

      // Get trending concerns
      const trendingConcerns = await this.getTrendingConcerns(tenantId, period);

      // Get program effectiveness
      const programEffectiveness = await this.getProgramEffectiveness(tenantId, period);

      // Get recent alerts
      const recentAlerts = await this.getRecentWellnessAlerts(tenantId, 10);

      // Get support network activity
      const networkActivity = await this.getSupportNetworkActivity(tenantId, period);

      const dashboardData = {
        overallMetrics,
        riskDistribution,
        trendingConcerns,
        programEffectiveness,
        recentAlerts,
        networkActivity,
        period,
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      this.logger.error('Failed to get wellness dashboard', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data'
      });
    }
  }

  // Private helper methods

  private async validateStaffAccess(
    tenantId: string,
    userId: string,
    staffId: string
  ): Promise<boolean> {
    // Self-access or supervisor/admin access
    const accessQuery = `
      SELECT 1 FROM staff_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.id = $1 AND sm.tenant_id = $2 AND (
        sm.user_id = $3 OR
        EXISTS (
          SELECT 1 FROM users mgr 
          WHERE mgr.id = $3 AND mgr.tenant_id = $2 
            AND (mgr.role IN ('admin', 'manager') OR mgr.permissions ? 'staff_management')
        )
      )
    `;

    const result = await this.db.query(accessQuery, [staffId, tenantId, userId]);
    return result.rows.length > 0;
  }

  private calculateBurnoutRisk(wellness: WellnessProfile): number {
    // Weighted calculation based on key wellness indicators
    const weights = {
      stressLevel: 0.25,
      workLifeBalance: -0.20, // negative because higher is better
      jobSatisfaction: -0.15,
      physicalHealth: -0.10,
      mentalHealth: -0.20,
      sleepQuality: -0.10
    };

    let riskScore = 0;
    riskScore += wellness.stressLevel * weights.stressLevel;
    riskScore += (10 - wellness.workLifeBalance) * Math.abs(weights.workLifeBalance);
    riskScore += (10 - wellness.jobSatisfaction) * Math.abs(weights.jobSatisfaction);
    riskScore += (10 - wellness.physicalHealth) * Math.abs(weights.physicalHealth);
    riskScore += (10 - wellness.mentalHealth) * Math.abs(weights.mentalHealth);
    riskScore += (10 - wellness.sleepQuality) * Math.abs(weights.sleepQuality);

    return Math.min(Math.max(riskScore, 0), 10);
  }

  private calculateRiskLevel(scores: BurnoutScores): RiskLevel {
    // Based on Maslach Burnout Inventory thresholds
    const eeHigh = scores.emotionalExhaustion >= 27;
    const dpHigh = scores.depersonalization >= 10;
    const paLow = scores.personalAccomplishment <= 33;

    if (eeHigh && dpHigh && paLow) return 'critical';
    if ((eeHigh && dpHigh) || (eeHigh && paLow)) return 'severe';
    if (eeHigh || dpHigh || paLow) return 'high';
    if (scores.emotionalExhaustion >= 18 || scores.depersonalization >= 6) return 'moderate';
    return 'low';
  }

  private async generateRecommendations(
    scores: BurnoutScores,
    riskLevel: RiskLevel,
    staffId: string
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (scores.emotionalExhaustion >= 27) {
      recommendations.push({
        id: uuidv4(),
        category: 'stress_reduction',
        priority: 'high',
        title: 'Immediate Stress Management',
        description: 'High emotional exhaustion detected requiring immediate intervention',
        actionItems: [
          'Schedule stress counseling session within 48 hours',
          'Implement daily mindfulness practice',
          'Reduce workload for next 2 weeks',
          'Consider temporary schedule adjustment'
        ],
        estimatedTimeframe: '1-2 weeks',
        resources: [
          {
            type: 'counseling_service',
            title: 'Employee Assistance Program',
            description: 'Free confidential counseling services',
            contactInfo: 'EAP Hotline: 1-800-XXX-XXXX'
          }
        ],
        isCompleted: false
      });
    }

    if (scores.workEngagement < 3) {
      recommendations.push({
        id: uuidv4(),
        category: 'professional_development',
        priority: 'medium',
        title: 'Re-engagement Strategy',
        description: 'Low work engagement requiring career development focus',
        actionItems: [
          'Career development discussion with supervisor',
          'Identify areas of interest and strength',
          'Explore new role responsibilities',
          'Consider lateral move or promotion opportunities'
        ],
        estimatedTimeframe: '1-3 months',
        resources: [
          {
            type: 'training_program',
            title: 'Career Development Workshop',
            description: 'Monthly workshops on career planning'
          }
        ],
        isCompleted: false
      });
    }

    return recommendations;
  }

  private async createHighRiskAlert(
    tenantId: string,
    staffId: string,
    burnoutRisk: number,
    wellness: WellnessProfile
  ): Promise<void> {
    // Create notification for managers
    const managersQuery = `
      SELECT DISTINCT u.id FROM users u
      WHERE u.tenant_id = $1 AND (u.role = 'manager' OR u.permissions ? 'staff_management')
    `;
    const managers = await this.db.query(managersQuery, [tenantId]);

    for (const manager of managers.rows) {
      await this.notifications.create({
        tenantId,
        userId: manager.id,
        type: 'high_burnout_risk',
        title: 'High Burnout Risk Alert',
        message: `Staff member requires immediate attention (Risk Score: ${burnoutRisk.toFixed(1)})`,
        data: { staffId, burnoutRisk, wellness },
        actionRequired: true,
        priority: 'high'
      });
    }
  }

  private async createCriticalAssessmentNotifications(
    tenantId: string,
    staffId: string,
    assessment: any
  ): Promise<void> {
    // Notify HR and management for critical assessments
    const notificationQuery = `
      SELECT DISTINCT u.id FROM users u
      WHERE u.tenant_id = $1 AND (
        u.role IN ('admin', 'manager', 'hr') OR 
        u.permissions ? 'crisis_management'
      )
    `;
    const recipients = await this.db.query(notificationQuery, [tenantId]);

    for (const recipient of recipients.rows) {
      await this.notifications.create({
        tenantId,
        userId: recipient.id,
        type: 'critical_assessment',
        title: 'Critical Burnout Assessment',
        message: `Immediate intervention required for staff member`,
        data: { 
          staffId, 
          assessmentId: assessment.id, 
          riskLevel: assessment.risk_level 
        },
        actionRequired: true,
        priority: 'urgent'
      });
    }
  }

  private async gatherWorkloadData(
    tenantId: string,
    staffId: string,
    period: number
  ): Promise<any> {
    // Gather data from multiple sources
    const queries = {
      shifts: `
        SELECT * FROM staff_shifts 
        WHERE staff_id = $1 AND tenant_id = $2 
          AND shift_date >= NOW() - INTERVAL '${period} days'
      `,
      tasks: `
        SELECT * FROM care_tasks 
        WHERE assigned_to = $1 AND tenant_id = $2 
          AND created_at >= NOW() - INTERVAL '${period} days'
      `,
      incidents: `
        SELECT * FROM incident_reports 
        WHERE reported_by = $1 AND tenant_id = $2 
          AND created_at >= NOW() - INTERVAL '${period} days'
      `
    };

    const results = await Promise.all([
      this.db.query(queries.shifts, [staffId, tenantId]),
      this.db.query(queries.tasks, [staffId, tenantId]),
      this.db.query(queries.incidents, [staffId, tenantId])
    ]);

    return {
      shifts: results[0].rows,
      tasks: results[1].rows,
      incidents: results[2].rows
    };
  }

  private calculateWorkloadMetrics(workloadData: any): WorkloadMetrics {
    // Calculate various workload metrics
    const totalHours = workloadData.shifts.reduce((sum: number, shift: any) => {
      return sum + (shift.hours_worked || 0);
    }, 0);

    const weeksInPeriod = workloadData.shifts.length > 0 ? 
      Math.ceil(workloadData.shifts.length / 7) : 1;

    return {
      averageHoursPerWeek: totalHours / weeksInPeriod,
      overtimeHours: workloadData.shifts.reduce((sum: number, shift: any) => {
        return sum + Math.max(0, (shift.hours_worked || 0) - 8);
      }, 0),
      consecutiveDays: this.calculateConsecutiveDays(workloadData.shifts),
      taskComplexity: this.calculateTaskComplexity(workloadData.tasks),
      patientLoad: workloadData.tasks.filter((t: any) => t.task_type === 'resident_care').length,
      administrativeTasks: workloadData.tasks.filter((t: any) => t.task_type === 'administrative').length,
      emergencyResponses: workloadData.incidents.length,
      trainingHours: workloadData.shifts.reduce((sum: number, shift: any) => {
        return sum + (shift.training_hours || 0);
      }, 0)
    };
  }

  private calculateConsecutiveDays(shifts: any[]): number {
    if (shifts.length === 0) return 0;
    
    // Sort shifts by date
    const sortedShifts = shifts.sort((a, b) => 
      new Date(a.shift_date).getTime() - new Date(b.shift_date).getTime()
    );

    let maxConsecutive = 0;
    let currentConsecutive = 1;
    
    for (let i = 1; i < sortedShifts.length; i++) {
      const prevDate = new Date(sortedShifts[i - 1].shift_date);
      const currDate = new Date(sortedShifts[i].shift_date);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        currentConsecutive++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        currentConsecutive = 1;
      }
    }
    
    return Math.max(maxConsecutive, currentConsecutive);
  }

  private calculateTaskComplexity(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    
    const complexityWeights = {
      'basic_care': 1,
      'medication_admin': 3,
      'emergency_response': 5,
      'complex_medical': 4,
      'administrative': 2
    };

    const totalComplexity = tasks.reduce((sum, task) => {
      return sum + (complexityWeights[task.task_type as keyof typeof complexityWeights] || 2);
    }, 0);

    return totalComplexity / tasks.length;
  }

  private generateWorkloadAlerts(metrics: WorkloadMetrics, trends: WorkloadTrend[]): WorkloadAlert[] {
    const alerts: WorkloadAlert[] = [];

    if (metrics.averageHoursPerWeek > 50) {
      alerts.push({
        type: 'overtime_limit',
        severity: 'warning',
        message: 'Excessive weekly hours detected',
        threshold: 50,
        currentValue: metrics.averageHoursPerWeek
      });
    }

    if (metrics.consecutiveDays > 10) {
      alerts.push({
        type: 'consecutive_days',
        severity: 'critical',
        message: 'Too many consecutive working days',
        threshold: 10,
        currentValue: metrics.consecutiveDays
      });
    }

    return alerts;
  }

  private calculateWorkloadRiskLevel(metrics: WorkloadMetrics, alerts: WorkloadAlert[]): string {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

    if (criticalAlerts > 0) return 'critical';
    if (warningAlerts > 2) return 'high';
    if (warningAlerts > 0) return 'moderate';
    return 'low';
  }

  private async getStaffRole(staffId: string): Promise<string> {
    const result = await this.db.query(
      'SELECT role FROM staff_members WHERE id = $1',
      [staffId]
    );
    return result.rows[0]?.role || 'unknown';
  }

  private async getStaffProfile(staffId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT sm.*, swp.* FROM staff_members sm
      LEFT JOIN staff_wellness_profiles swp ON sm.id = swp.staff_id
      WHERE sm.id = $1
    `, [staffId]);
    
    return result.rows[0] || {};
  }

  private async analyzeWorkloadTrends(
    tenantId: string,
    staffId: string,
    period: number
  ): Promise<WorkloadTrend[]> {
    // Implementation would analyze historical data for trends
    return [];
  }

  private async notifyEligibleStaff(tenantId: string, program: any): Promise<void> {
    // Send notifications to staff who meet eligibility criteria
    const eligibleStaff = await this.db.query(`
      SELECT DISTINCT sm.user_id FROM staff_members sm
      WHERE sm.tenant_id = $1 AND sm.is_active = true
    `, [tenantId]);

    for (const staff of eligibleStaff.rows) {
      if (staff.user_id) {
        await this.notifications.create({
          tenantId,
          userId: staff.user_id,
          type: 'wellness_program_available',
          title: 'New Wellness Program Available',
          message: `${program.program_name} - ${program.description}`,
          data: { programId: program.id },
          actionRequired: false
        });
      }
    }
  }

  private async getRiskDistribution(tenantId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT 
        CASE 
          WHEN burnout_risk_score >= 8 THEN 'critical'
          WHEN burnout_risk_score >= 6 THEN 'high'
          WHEN burnout_risk_score >= 4 THEN 'moderate'
          ELSE 'low'
        END as risk_level,
        COUNT(*) as count
      FROM staff_members 
      WHERE tenant_id = $1 AND is_active = true
      GROUP BY risk_level
    `, [tenantId]);

    return result.rows.reduce((acc, row) => {
      acc[row.risk_level] = parseInt(row.count);
      return acc;
    }, {});
  }

  private async getTrendingConcerns(tenantId: string, period: string): Promise<any[]> {
    // Implementation would analyze trending wellness concerns
    return [];
  }

  private async getProgramEffectiveness(tenantId: string, period: string): Promise<any> {
    // Implementation would calculate program effectiveness metrics
    return {};
  }

  private async getRecentWellnessAlerts(tenantId: string, limit: number): Promise<any[]> {
    const result = await this.db.query(`
      SELECT * FROM wellness_alerts 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [tenantId, limit]);

    return result.rows;
  }

  private async getSupportNetworkActivity(tenantId: string, period: string): Promise<any> {
    // Implementation would gather support network activity metrics
    return {};
  }

  // Route definitions
  getRoutes(): express.Router {
    const router = express.Router();

    // Validation middleware
    const wellnessValidation = [
      param('staffId').isUUID(),
      body('stressLevel').isInt({ min: 1, max: 10 }),
      body('workLifeBalance').isInt({ min: 1, max: 10 }),
      body('jobSatisfaction').isInt({ min: 1, max: 10 }),
      body('physicalHealth').isInt({ min: 1, max: 10 }),
      body('mentalHealth').isInt({ min: 1, max: 10 }),
      body('sleepQuality').isInt({ min: 1, max: 10 }),
      body('socialSupport').isInt({ min: 1, max: 10 }),
      body('workloadManagement').isInt({ min: 1, max: 10 })
    ];

    const assessmentValidation = [
      param('staffId').isUUID(),
      body('assessmentType').isIn(['self_assessment', 'peer_assessment', 'supervisor_assessment', 'professional_evaluation', 'periodic_check', 'incident_triggered']),
      body('scores.emotionalExhaustion').isInt({ min: 0, max: 54 }),
      body('scores.depersonalization').isInt({ min: 0, max: 30 }),
      body('scores.personalAccomplishment').isInt({ min: 0, max: 48 })
    ];

    const networkValidation = [
      body('networkType').isIn(['peer_support', 'mentorship', 'department_team', 'wellness_group', 'professional_development', 'crisis_support']),
      body('name').isLength({ min: 3, max: 100 }).trim(),
      body('description').isLength({ min: 10, max: 500 }).trim()
    ];

    const programValidation = [
      body('programName').isLength({ min: 3, max: 100 }).trim(),
      body('programType').isIn(['stress_management', 'mindfulness', 'physical_fitness', 'mental_health', 'work_life_balance', 'team_building', 'leadership_development', 'resilience_training']),
      body('description').isLength({ min: 10, max: 1000 }).trim(),
      body('activities').isArray({ min: 1 })
    ];

    // Routes
    router.put('/staff/:staffId/wellness', wellnessValidation, this.updateWellnessProfile.bind(this));
    router.post('/staff/:staffId/assessment', assessmentValidation, this.conductBurnoutAssessment.bind(this));
    router.post('/support-networks', networkValidation, this.createSupportNetwork.bind(this));
    router.get('/staff/:staffId/workload-analysis', this.analyzeWorkload.bind(this));
    router.post('/wellness-programs', programValidation, this.createWellnessProgram.bind(this));
    router.get('/dashboard', this.getWellnessDashboard.bind(this));

    return router;
  }
}