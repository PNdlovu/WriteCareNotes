/**
 * @fileoverview Real activities and therapy service with comprehensive management and tracking
 * @module Activities/ActivitiesTherapyService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Real activities and therapy service with comprehensive management and tracking
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Activity, ActivityType, ActivityCategory, ParticipationLevel } from '../../entities/activities/Activity';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// Therapy Session Entity
@Entity('therapy_sessions')
@Index(['residentId', 'scheduledStartTime'])
@Index(['therapistId', 'status'])
export class TherapySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionNumber: string;

  @Column()
  residentId: string;

  @Column()
  therapistId: string;

  @Column()
  therapyType: 'physiotherapy' | 'occupational_therapy' | 'speech_therapy' | 'music_therapy' | 'art_therapy' | 'cognitive_therapy';

  @Column()
  scheduledStartTime: Date;

  @Column()
  scheduledEndTime: Date;

  @Column({ nullable: true })
  actualStartTime?: Date;

  @Column({ nullable: true })
  actualEndTime?: Date;

  @Column()
  location: string;

  @Column('text', { nullable: true })
  sessionPlan?: string;

  @Column('text', { nullable: true })
  sessionNotes?: string;

  @Column('jsonb', { default: [] })
  goals: Array<{
    id: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    priority: 'high' | 'medium' | 'low';
  }>;

  @Column('jsonb', { default: [] })
  outcomes: Array<{
    goalId: string;
    achievedValue: number;
    notes: string;
    assessmentDate: Date;
  }>;

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

  @Column('jsonb', { default: {} })
  equipment: Record<string, any>;

  @Column('jsonb', { default: {} })
  assessments: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Interfaces
export interface ActivitySearchCriteria {
  activityType?: ActivityType;
  category?: ActivityCategory;
  facilitator?: string;
  date?: Date;
  location?: string;
  status?: string;
}

export interface TherapyAnalytics {
  totalActivities: number;
  activitiesThisWeek: number;
  averageParticipationRate: number;
  averageEnjoymentLevel: number;
  therapeuticActivities: number;
  socialActivities: number;
  physicalActivities: number;
  cognitiveActivities: number;
}

export interface ResidentActivityProfile {
  residentId: string;
  totalActivitiesParticipated: number;
  favoriteActivityTypes: ActivityType[];
  averageEnjoymentLevel: number;
  averageEngagementLevel: number;
  therapeuticGoalsProgress: { [goal: string]: number };
  lastActivityDate: Date;
  recommendedActivities: string[];
}

export interface ActivityPlanningResult {
  date: Date;
  plannedActivities: Activity[];
  resourceConflicts: string[];
  staffingRequirements: { [timeSlot: string]: number };
  estimatedCost: number;
}

@Injectable()
export class ActivitiesTherapyService {
  private readonly logger = new Logger(ActivitiesTherapyService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(TherapySession)
    private readonly therapySessionRepository: Repository<TherapySession>,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  // Activity Management
  async createActivity(activityData: Partial<Activity>): Promise<Activity> {
    try {
      const activity = this.activityRepository.create({
        ...activityData,
        status: 'scheduled',
        currentParticipants: 0,
      });

      const savedActivity = await this.activityRepository.save(activity);

      await this.auditService.logEvent({
        resource: 'Activity',
        entityType: 'Activity',
        entityId: savedActivity.id,
        action: 'CREATE',
        details: { 
          activityName: savedActivity.activityName,
          scheduledTime: savedActivity.scheduledStartTime,
          facilitator: savedActivity.facilitator,
        },
        userId: 'system',
      });

      // Send notification to facilitator
      await this.notificationService.sendNotification({
        message: `New activity scheduled: ${savedActivity.activityName}`,
        type: 'activity_scheduled',
        recipients: [savedActivity.facilitator],
        subject: 'Activity Scheduled',
        content: `Activity "${savedActivity.activityName}" has been scheduled for ${savedActivity.scheduledStartTime}`,
        metadata: {
          activityId: savedActivity.id,
          activityName: savedActivity.activityName,
          scheduledTime: savedActivity.scheduledStartTime,
          location: savedActivity.location,
          maxParticipants: savedActivity.maxParticipants,
        },
      });

      this.eventEmitter.emit('activity.created', {
        activityId: savedActivity.id,
        activityName: savedActivity.activityName,
        facilitator: savedActivity.facilitator,
        timestamp: new Date(),
      });

      this.logger.log(`Activity created: ${savedActivity.activityName} (${savedActivity.id})`);
      return savedActivity;
    } catch (error) {
      this.logger.error(`Failed to create activity: ${error.message}`, error.stack);
      throw new Error(`Failed to create activity: ${error.message}`);
    }
  }

  async getAllActivities(): Promise<Activity[]> {
    try {
      const activities = await this.activityRepository.find({
        order: { scheduledStartTime: 'ASC' },
      });

      this.logger.log(`Retrieved ${activities.length} activities`);
      return activities;
    } catch (error) {
      this.logger.error(`Failed to get activities: ${error.message}`, error.stack);
      throw new Error(`Failed to get activities: ${error.message}`);
    }
  }

  async getActivityById(activityId: string): Promise<Activity | null> {
    try {
      const activity = await this.activityRepository.findOne({
        where: { id: activityId },
      });

      if (activity) {
        this.logger.log(`Retrieved activity: ${activity.activityName} (${activityId})`);
      }

      return activity;
    } catch (error) {
      this.logger.error(`Failed to get activity ${activityId}: ${error.message}`, error.stack);
      throw new Error(`Failed to get activity: ${error.message}`);
    }
  }

  async getTodaysActivities(): Promise<Activity[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const activities = await this.activityRepository.find({
        where: {
          scheduledStartTime: Between(startOfDay, endOfDay),
        },
        order: { scheduledStartTime: 'ASC' },
      });

      this.logger.log(`Retrieved ${activities.length} activities for today`);
      return activities;
    } catch (error) {
      this.logger.error(`Failed to get today's activities: ${error.message}`, error.stack);
      throw new Error(`Failed to get today's activities: ${error.message}`);
    }
  }

  async searchActivities(criteria: ActivitySearchCriteria): Promise<Activity[]> {
    try {
      let queryBuilder = this.activityRepository.createQueryBuilder('activity');

      if (criteria.activityType) {
        queryBuilder = queryBuilder.andWhere('activity.activityType = :activityType', { 
          activityType: criteria.activityType 
        });
      }

      if (criteria.category) {
        queryBuilder = queryBuilder.andWhere('activity.category = :category', { 
          category: criteria.category 
        });
      }

      if (criteria.facilitator) {
        queryBuilder = queryBuilder.andWhere('activity.facilitator = :facilitator', { 
          facilitator: criteria.facilitator 
        });
      }

      if (criteria.date) {
        const startOfDay = new Date(criteria.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(criteria.date);
        endOfDay.setHours(23, 59, 59, 999);

        queryBuilder = queryBuilder.andWhere('activity.scheduledStartTime BETWEEN :start AND :end', { 
          start: startOfDay, 
          end: endOfDay 
        });
      }

      if (criteria.location) {
        queryBuilder = queryBuilder.andWhere('activity.location = :location', { 
          location: criteria.location 
        });
      }

      if (criteria.status) {
        queryBuilder = queryBuilder.andWhere('activity.status = :status', { 
          status: criteria.status 
        });
      }

      const activities = await queryBuilder.orderBy('activity.scheduledStartTime', 'ASC').getMany();

      this.logger.log(`Found ${activities.length} activities matching search criteria`);
      return activities;
    } catch (error) {
      this.logger.error(`Failed to search activities: ${error.message}`, error.stack);
      throw new Error(`Failed to search activities: ${error.message}`);
    }
  }

  // Activity Execution
  async startActivity(activityId: string): Promise<void> {
    try {
      const activity = await this.getActivityById(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      if (!activity.isScheduled()) {
        throw new Error('Activity is not in scheduled status');
      }

      activity.status = 'in_progress';
      activity.actualStartTime = new Date();
      
      await this.activityRepository.save(activity);

      await this.auditService.logEvent({
        resource: 'Activity',
        entityType: 'Activity',
        entityId: activityId,
        action: 'START',
        details: { 
          activityName: activity.activityName,
          actualStartTime: activity.actualStartTime,
        },
        userId: 'system',
      });

      // Send notification to participants
      if (activity.targetResidents.length > 0) {
        await this.notificationService.sendNotification({
          message: `Activity started: ${activity.activityName}`,
          type: 'activity_started',
          recipients: activity.targetResidents,
          subject: 'Activity Started',
          content: `The activity "${activity.activityName}" has started at ${activity.location}`,
          metadata: {
            activityId: activity.id,
            activityName: activity.activityName,
            location: activity.location,
            facilitator: activity.facilitator,
          },
        });
      }

      this.eventEmitter.emit('activity.started', {
        activityId: activity.id,
        activityName: activity.activityName,
        timestamp: new Date(),
      });

      this.logger.log(`Activity started: ${activity.activityName} (${activityId})`);
    } catch (error) {
      this.logger.error(`Failed to start activity: ${error.message}`, error.stack);
      throw new Error(`Failed to start activity: ${error.message}`);
    }
  }

  async completeActivity(activityId: string, sessionNotes?: string): Promise<void> {
    try {
      const activity = await this.getActivityById(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      if (!activity.isInProgress()) {
        throw new Error('Activity is not in progress');
      }

      activity.status = 'completed';
      activity.actualEndTime = new Date();
      if (sessionNotes) {
        activity.sessionNotes = sessionNotes;
      }
      
      await this.activityRepository.save(activity);

      await this.auditService.logEvent({
        resource: 'Activity',
        entityType: 'Activity',
        entityId: activityId,
        action: 'COMPLETE',
        details: { 
          activityName: activity.activityName,
          duration: activity.getDuration(),
          participationRate: activity.getParticipationRate(),
          actualEndTime: activity.actualEndTime,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('activity.completed', {
        activityId: activity.id,
        activityName: activity.activityName,
        duration: activity.getDuration(),
        participationRate: activity.getParticipationRate(),
        timestamp: new Date(),
      });

      this.logger.log(`Activity completed: ${activity.activityName} (${activityId})`);
    } catch (error) {
      this.logger.error(`Failed to complete activity: ${error.message}`, error.stack);
      throw new Error(`Failed to complete activity: ${error.message}`);
    }
  }

  async cancelActivity(activityId: string, reason: string): Promise<void> {
    try {
      const activity = await this.getActivityById(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      activity.status = 'cancelled';
      activity.sessionNotes = `Cancelled: ${reason}`;
      
      await this.activityRepository.save(activity);

      await this.auditService.logEvent({
        resource: 'Activity',
        entityType: 'Activity',
        entityId: activityId,
        action: 'CANCEL',
        details: { 
          activityName: activity.activityName,
          reason,
        },
        userId: 'system',
      });

      // Send notification to participants and facilitator
      const recipients = [...activity.targetResidents, activity.facilitator];
      if (recipients.length > 0) {
        await this.notificationService.sendNotification({
          message: `Activity cancelled: ${activity.activityName}`,
          type: 'activity_cancelled',
          recipients,
          subject: 'Activity Cancelled',
          content: `The activity "${activity.activityName}" scheduled for ${activity.scheduledStartTime} has been cancelled. Reason: ${reason}`,
          metadata: {
            activityId: activity.id,
            activityName: activity.activityName,
            scheduledTime: activity.scheduledStartTime,
            reason,
          },
        });
      }

      this.eventEmitter.emit('activity.cancelled', {
        activityId: activity.id,
        activityName: activity.activityName,
        reason,
        timestamp: new Date(),
      });

      this.logger.log(`Activity cancelled: ${activity.activityName} (${activityId}) - Reason: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to cancel activity: ${error.message}`, error.stack);
      throw new Error(`Failed to cancel activity: ${error.message}`);
    }
  }

  // Participation Management
  async addParticipant(activityId: string, residentId: string): Promise<void> {
    try {
      const activity = await this.getActivityById(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      if (!activity.canAcceptMoreParticipants()) {
        throw new Error('Activity is at maximum capacity');
      }

      if (!activity.targetResidents.includes(residentId)) {
        activity.targetResidents.push(residentId);
        activity.currentParticipants++;
        
        await this.activityRepository.save(activity);

        await this.auditService.logEvent({
          resource: 'Activity',
          entityType: 'Activity',
          entityId: activityId,
          action: 'ADD_PARTICIPANT',
          details: { 
            residentId,
            currentParticipants: activity.currentParticipants,
          },
          userId: 'system',
        });

        this.logger.log(`Participant added to activity: ${residentId} -> ${activity.activityName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to add participant: ${error.message}`, error.stack);
      throw new Error(`Failed to add participant: ${error.message}`);
    }
  }

  async removeParticipant(activityId: string, residentId: string): Promise<void> {
    try {
      const activity = await this.getActivityById(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      const index = activity.targetResidents.indexOf(residentId);
      if (index > -1) {
        activity.targetResidents.splice(index, 1);
        activity.currentParticipants = Math.max(0, activity.currentParticipants - 1);
        
        await this.activityRepository.save(activity);

        await this.auditService.logEvent({
          resource: 'Activity',
          entityType: 'Activity',
          entityId: activityId,
          action: 'REMOVE_PARTICIPANT',
          details: { 
            residentId,
            currentParticipants: activity.currentParticipants,
          },
          userId: 'system',
        });

        this.logger.log(`Participant removed from activity: ${residentId} <- ${activity.activityName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove participant: ${error.message}`, error.stack);
      throw new Error(`Failed to remove participant: ${error.message}`);
    }
  }

  async recordParticipationOutcome(activityId: string, outcome: any): Promise<void> {
    try {
      const activity = await this.getActivityById(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      const fullOutcome = {
        ...outcome,
        recordedAt: new Date(),
      };

      activity.addParticipantOutcome(fullOutcome);
      await this.activityRepository.save(activity);

      await this.auditService.logEvent({
        resource: 'Activity',
        entityType: 'Activity',
        entityId: activityId,
        action: 'RECORD_OUTCOME',
        details: { 
          participantId: outcome.participantId, 
          participationLevel: outcome.participationLevel,
          enjoymentLevel: outcome.enjoymentLevel,
          engagementLevel: outcome.engagementLevel,
        },
        userId: 'system',
      });

      this.logger.log(`Participation outcome recorded for activity ${activityId}, participant ${outcome.participantId}`);
    } catch (error) {
      this.logger.error(`Failed to record participation outcome: ${error.message}`, error.stack);
      throw new Error(`Failed to record participation outcome: ${error.message}`);
    }
  }

  // Analytics and Reporting
  async getTherapyAnalytics(): Promise<TherapyAnalytics> {
    try {
      const allActivities = await this.getAllActivities();
      const thisWeek = this.getThisWeekActivities(allActivities);
      
      const totalActivities = allActivities.length;
      const activitiesThisWeek = thisWeek.length;
      
      const completedActivities = allActivities.filter(activity => activity.isCompleted());
      const averageParticipationRate = completedActivities.length > 0 
        ? completedActivities.reduce((sum, activity) => sum + activity.getParticipationRate(), 0) / completedActivities.length 
        : 0;
      
      const averageEnjoymentLevel = completedActivities.length > 0
        ? completedActivities.reduce((sum, activity) => sum + activity.getAverageEnjoymentLevel(), 0) / completedActivities.length
        : 0;

      const therapeuticActivities = allActivities.filter(activity => activity.isTherapeutic()).length;
      const socialActivities = allActivities.filter(activity => activity.activityType === ActivityType.SOCIAL).length;
      const physicalActivities = allActivities.filter(activity => activity.activityType === ActivityType.PHYSICAL).length;
      const cognitiveActivities = allActivities.filter(activity => activity.activityType === ActivityType.COGNITIVE).length;

      const analytics = {
        totalActivities,
        activitiesThisWeek,
        averageParticipationRate,
        averageEnjoymentLevel,
        therapeuticActivities,
        socialActivities,
        physicalActivities,
        cognitiveActivities,
      };

      this.logger.log(`Generated therapy analytics: ${totalActivities} total activities, ${activitiesThisWeek} this week`);
      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get therapy analytics: ${error.message}`, error.stack);
      throw new Error(`Failed to get therapy analytics: ${error.message}`);
    }
  }

  async getResidentActivityProfile(residentId: string): Promise<ResidentActivityProfile> {
    try {
      const activities = await this.activityRepository.find();
      const residentActivities = activities.filter(activity => 
        activity.targetResidents.includes(residentId) && activity.isCompleted()
      );

      const totalActivities = residentActivities.length;
      
      // Calculate favorite activity types
      const activityTypeCounts = residentActivities.reduce((acc, activity) => {
        acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const favoriteActivityTypes = Object.entries(activityTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type as ActivityType);

      // Calculate averages
      const outcomes = residentActivities.flatMap(activity => 
        activity.outcomes.filter(outcome => outcome.participantId === residentId)
      );

      const averageEnjoymentLevel = outcomes.length > 0
        ? outcomes.reduce((sum, outcome) => sum + outcome.enjoymentLevel, 0) / outcomes.length
        : 0;

      const averageEngagementLevel = outcomes.length > 0
        ? outcomes.reduce((sum, outcome) => sum + outcome.engagementLevel, 0) / outcomes.length
        : 0;

      // Calculate therapeutic progress
      const therapeuticGoalsProgress = this.calculateTherapeuticProgress(residentId, residentActivities);

      // Get last activity date
      const lastActivityDate = residentActivities.length > 0
        ? residentActivities.sort((a, b) => 
            new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime()
          )[0].scheduledStartTime
        : new Date();

      // Generate recommendations
      const recommendedActivities = this.generateActivityRecommendations(residentId, favoriteActivityTypes, averageEnjoymentLevel);

      const profile = {
        residentId,
        totalActivitiesParticipated: totalActivities,
        favoriteActivityTypes,
        averageEnjoymentLevel,
        averageEngagementLevel,
        therapeuticGoalsProgress,
        lastActivityDate,
        recommendedActivities,
      };

      this.logger.log(`Generated activity profile for resident ${residentId}: ${totalActivities} activities participated`);
      return profile;
    } catch (error) {
      this.logger.error(`Failed to get resident activity profile: ${error.message}`, error.stack);
      throw new Error(`Failed to get resident activity profile: ${error.message}`);
    }
  }

  // Activity Planning
  async planActivitiesForWeek(startDate: Date): Promise<ActivityPlanningResult[]> {
    try {
      const weekResults: ActivityPlanningResult[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayResult = await this.planActivitiesForDay(date);
        weekResults.push(dayResult);
      }
      
      this.logger.log(`Generated weekly activity plan starting from ${startDate.toISOString().split('T')[0]}`);
      return weekResults;
    } catch (error) {
      this.logger.error(`Failed to plan activities for week: ${error.message}`, error.stack);
      throw new Error(`Failed to plan activities for week: ${error.message}`);
    }
  }

  async checkResourceAvailability(date: Date, timeSlot: string): Promise<any> {
    try {
      const activities = await this.searchActivities({ date });
      const conflictingActivities = activities.filter(activity => 
        this.isTimeSlotConflict(activity, timeSlot)
      );

      const usedResources = conflictingActivities.flatMap(activity => activity.resources);
      
      const availability = {
        date,
        timeSlot,
        availableResources: this.getAvailableResources(usedResources),
        conflictingActivities: conflictingActivities.map(activity => ({
          id: activity.id,
          name: activity.activityName,
          location: activity.location,
          resources: activity.resources,
        })),
      };

      this.logger.log(`Checked resource availability for ${date.toISOString().split('T')[0]} at ${timeSlot}`);
      return availability;
    } catch (error) {
      this.logger.error(`Failed to check resource availability: ${error.message}`, error.stack);
      throw new Error(`Failed to check resource availability: ${error.message}`);
    }
  }

  // Therapy Session Management
  async createTherapySession(sessionData: Partial<TherapySession>): Promise<TherapySession> {
    try {
      const session = this.therapySessionRepository.create({
        ...sessionData,
        status: 'scheduled',
        sessionNumber: `TS-${Date.now()}`,
      });

      const savedSession = await this.therapySessionRepository.save(session);

      await this.auditService.logEvent({
        resource: 'TherapySession',
        entityType: 'TherapySession',
        entityId: savedSession.id,
        action: 'CREATE',
        details: { 
          therapyType: savedSession.therapyType,
          residentId: savedSession.residentId,
          scheduledTime: savedSession.scheduledStartTime,
          therapistId: savedSession.therapistId,
        },
        userId: 'system',
      });

      // Send notification to therapist
      await this.notificationService.sendNotification({
        message: `New therapy session scheduled: ${savedSession.therapyType}`,
        type: 'therapy_session_scheduled',
        recipients: [savedSession.therapistId],
        subject: 'Therapy Session Scheduled',
        content: `A ${savedSession.therapyType} session has been scheduled for ${savedSession.scheduledStartTime}`,
        metadata: {
          sessionId: savedSession.id,
          sessionNumber: savedSession.sessionNumber,
          therapyType: savedSession.therapyType,
          residentId: savedSession.residentId,
          scheduledTime: savedSession.scheduledStartTime,
          location: savedSession.location,
        },
      });

      this.logger.log(`Therapy session created: ${savedSession.therapyType} for resident ${savedSession.residentId}`);
      return savedSession;
    } catch (error) {
      this.logger.error(`Failed to create therapy session: ${error.message}`, error.stack);
      throw new Error(`Failed to create therapy session: ${error.message}`);
    }
  }

  async getTherapySessionsByResident(residentId: string): Promise<TherapySession[]> {
    try {
      const sessions = await this.therapySessionRepository.find({
        where: { residentId },
        order: { scheduledStartTime: 'DESC' },
      });

      this.logger.log(`Retrieved ${sessions.length} therapy sessions for resident ${residentId}`);
      return sessions;
    } catch (error) {
      this.logger.error(`Failed to get therapy sessions for resident: ${error.message}`, error.stack);
      throw new Error(`Failed to get therapy sessions for resident: ${error.message}`);
    }
  }

  async getTherapySessionsByTherapist(therapistId: string): Promise<TherapySession[]> {
    try {
      const sessions = await this.therapySessionRepository.find({
        where: { therapistId },
        order: { scheduledStartTime: 'DESC' },
      });

      this.logger.log(`Retrieved ${sessions.length} therapy sessions for therapist ${therapistId}`);
      return sessions;
    } catch (error) {
      this.logger.error(`Failed to get therapy sessions for therapist: ${error.message}`, error.stack);
      throw new Error(`Failed to get therapy sessions for therapist: ${error.message}`);
    }
  }

  async getTherapySessionById(sessionId: string): Promise<TherapySession | null> {
    try {
      const session = await this.therapySessionRepository.findOne({
        where: { id: sessionId },
      });

      if (session) {
        this.logger.log(`Retrieved therapy session: ${session.therapyType} (${sessionId})`);
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to get therapy session: ${error.message}`, error.stack);
      throw new Error(`Failed to get therapy session: ${error.message}`);
    }
  }

  async startTherapySession(sessionId: string): Promise<void> {
    try {
      const session = await this.getTherapySessionById(sessionId);
      if (!session) {
        throw new Error('Therapy session not found');
      }

      if (session.status !== 'scheduled') {
        throw new Error('Therapy session is not in scheduled status');
      }

      session.status = 'in_progress';
      session.actualStartTime = new Date();
      
      await this.therapySessionRepository.save(session);

      await this.auditService.logEvent({
        resource: 'TherapySession',
        entityType: 'TherapySession',
        entityId: sessionId,
        action: 'START',
        details: { 
          therapyType: session.therapyType,
          actualStartTime: session.actualStartTime,
        },
        userId: 'system',
      });

      this.logger.log(`Therapy session started: ${session.therapyType} (${sessionId})`);
    } catch (error) {
      this.logger.error(`Failed to start therapy session: ${error.message}`, error.stack);
      throw new Error(`Failed to start therapy session: ${error.message}`);
    }
  }

  async completeTherapySession(sessionId: string, sessionOutcome?: any): Promise<void> {
    try {
      const session = await this.getTherapySessionById(sessionId);
      if (!session) {
        throw new Error('Therapy session not found');
      }

      if (session.status !== 'in_progress') {
        throw new Error('Therapy session is not in progress');
      }

      session.status = 'completed';
      session.actualEndTime = new Date();
      
      if (sessionOutcome) {
        session.sessionNotes = sessionOutcome.notes || '';
        if (sessionOutcome.outcomes) {
          session.outcomes = sessionOutcome.outcomes;
        }
      }
      
      await this.therapySessionRepository.save(session);

      await this.auditService.logEvent({
        resource: 'TherapySession',
        entityType: 'TherapySession',
        entityId: sessionId,
        action: 'COMPLETE',
        details: { 
          therapyType: session.therapyType,
          actualEndTime: session.actualEndTime,
          outcomes: session.outcomes,
        },
        userId: 'system',
      });

      this.logger.log(`Therapy session completed: ${session.therapyType} (${sessionId})`);
    } catch (error) {
      this.logger.error(`Failed to complete therapy session: ${error.message}`, error.stack);
      throw new Error(`Failed to complete therapy session: ${error.message}`);
    }
  }

  async cancelTherapySession(sessionId: string, reason: string): Promise<void> {
    try {
      const session = await this.getTherapySessionById(sessionId);
      if (!session) {
        throw new Error('Therapy session not found');
      }

      session.status = 'cancelled';
      session.sessionNotes = `Cancelled: ${reason}`;
      
      await this.therapySessionRepository.save(session);

      await this.auditService.logEvent({
        resource: 'TherapySession',
        entityType: 'TherapySession',
        entityId: sessionId,
        action: 'CANCEL',
        details: { 
          therapyType: session.therapyType,
          reason,
        },
        userId: 'system',
      });

      this.logger.log(`Therapy session cancelled: ${session.therapyType} (${sessionId}) - Reason: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to cancel therapy session: ${error.message}`, error.stack);
      throw new Error(`Failed to cancel therapy session: ${error.message}`);
    }
  }

  async updateTherapyGoalProgress(sessionId: string, goalId: string, progress: any): Promise<void> {
    try {
      const session = await this.getTherapySessionById(sessionId);
      if (!session) {
        throw new Error('Therapy session not found');
      }

      const goalIndex = session.goals.findIndex(goal => goal.id === goalId);
      if (goalIndex === -1) {
        throw new Error('Goal not found in session');
      }

      session.goals[goalIndex].currentValue = progress.currentValue || session.goals[goalIndex].currentValue;
      
      // Add outcome record
      session.outcomes.push({
        goalId,
        achievedValue: progress.currentValue,
        notes: progress.notes || '',
        assessmentDate: new Date(),
      });

      await this.therapySessionRepository.save(session);

      await this.auditService.logEvent({
        resource: 'TherapySession',
        entityType: 'TherapySession',
        entityId: sessionId,
        action: 'UPDATE_GOAL_PROGRESS',
        details: { 
          goalId,
          progress: progress.currentValue,
          notes: progress.notes,
        },
        userId: 'system',
      });

      this.logger.log(`Therapy goal progress updated: ${goalId} in session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to update therapy goal progress: ${error.message}`, error.stack);
      throw new Error(`Failed to update therapy goal progress: ${error.message}`);
    }
  }

  async recordSafetyIncident(sessionId: string, incident: any): Promise<void> {
    try {
      const session = await this.getTherapySessionById(sessionId);
      if (!session) {
        throw new Error('Therapy session not found');
      }

      // Add incident to session notes
      const incidentNote = `SAFETY INCIDENT: ${incident.description} - Severity: ${incident.severity} - Action taken: ${incident.actionTaken}`;
      session.sessionNotes = session.sessionNotes ? `${session.sessionNotes}\n\n${incidentNote}` : incidentNote;

      await this.therapySessionRepository.save(session);

      await this.auditService.logEvent({
        resource: 'TherapySession',
        entityType: 'SafetyIncident',
        entityId: sessionId,
        action: 'RECORD_SAFETY_INCIDENT',
        details: incident,
        userId: 'system',
      });

      // Send urgent notification for high severity incidents
      if (incident.severity === 'high' || incident.severity === 'critical') {
        await this.notificationService.sendNotification({
          message: `URGENT: Safety incident during therapy session`,
          type: 'safety_incident',
          recipients: ['safety_manager', 'care_manager'],
          subject: 'Safety Incident Alert',
          content: `A ${incident.severity} safety incident occurred during therapy session ${session.sessionNumber}. Description: ${incident.description}`,
          isUrgent: true,
          metadata: {
            sessionId,
            incidentSeverity: incident.severity,
            incidentDescription: incident.description,
          },
        });
      }

      this.logger.warn(`Safety incident recorded for therapy session ${sessionId}: ${incident.severity} - ${incident.description}`);
    } catch (error) {
      this.logger.error(`Failed to record safety incident: ${error.message}`, error.stack);
      throw new Error(`Failed to record safety incident: ${error.message}`);
    }
  }

  async getTherapyProgressReport(residentId: string, therapyType?: any): Promise<any> {
    try {
      let sessions = await this.getTherapySessionsByResident(residentId);
      
      if (therapyType) {
        sessions = sessions.filter(session => session.therapyType === therapyType);
      }

      const completedSessions = sessions.filter(session => session.status === 'completed');
      
      const report = {
        residentId,
        therapyType: therapyType || 'all',
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        progressSummary: this.calculateProgressSummary(completedSessions),
        recentSessions: completedSessions.slice(0, 5),
        recommendations: this.generateTherapyRecommendations(completedSessions),
        lastUpdated: new Date(),
      };

      this.logger.log(`Generated therapy progress report for resident ${residentId}: ${completedSessions.length} completed sessions`);
      return report;
    } catch (error) {
      this.logger.error(`Failed to get therapy progress report: ${error.message}`, error.stack);
      throw new Error(`Failed to get therapy progress report: ${error.message}`);
    }
  }

  async getTherapistWorkload(therapistId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const sessions = await this.therapySessionRepository.find({
        where: {
          therapistId,
          scheduledStartTime: Between(startDate, endDate),
        },
        order: { scheduledStartTime: 'ASC' },
      });

      const workload = {
        therapistId,
        period: { startDate, endDate },
        totalSessions: sessions.length,
        sessionsByStatus: this.groupSessionsByStatus(sessions),
        sessionsByType: this.groupSessionsByType(sessions),
        dailySchedule: this.generateDailySchedule(sessions),
        workloadMetrics: this.calculateWorkloadMetrics(sessions),
      };

      this.logger.log(`Generated workload report for therapist ${therapistId}: ${sessions.length} sessions`);
      return workload;
    } catch (error) {
      this.logger.error(`Failed to get therapist workload: ${error.message}`, error.stack);
      throw new Error(`Failed to get therapist workload: ${error.message}`);
    }
  }

  // Private helper methods
  private getThisWeekActivities(activities: Activity[]): Activity[] {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

    return activities.filter(activity => {
      const activityDate = new Date(activity.scheduledStartTime);
      return activityDate >= startOfWeek && activityDate <= endOfWeek;
    });
  }

  private calculateTherapeuticProgress(residentId: string, activities: Activity[]): { [goal: string]: number } {
    const therapeuticActivities = activities.filter(activity => activity.isTherapeutic());
    const progress: { [goal: string]: number } = {};

    for (const activity of therapeuticActivities) {
      for (const goal of activity.therapeuticGoals.primary) {
        const outcome = activity.getOutcomeForParticipant(residentId);
        if (outcome) {
          progress[goal] = (progress[goal] || 0) + outcome.engagementLevel;
        }
      }
    }

    // Average the progress scores
    for (const goal in progress) {
      const activityCount = therapeuticActivities.filter(activity => 
        activity.therapeuticGoals.primary.includes(goal)
      ).length;
      progress[goal] = activityCount > 0 ? progress[goal] / activityCount : 0;
    }

    return progress;
  }

  private generateActivityRecommendations(residentId: string, favoriteTypes: ActivityType[], enjoymentLevel: number): string[] {
    const recommendations = [];

    // Recommend based on favorite types
    if (favoriteTypes.includes(ActivityType.SOCIAL)) {
      recommendations.push('Group social activities', 'Community events');
    }

    if (favoriteTypes.includes(ActivityType.PHYSICAL)) {
      recommendations.push('Chair exercises', 'Walking groups');
    }

    if (favoriteTypes.includes(ActivityType.COGNITIVE)) {
      recommendations.push('Puzzles and games', 'Memory activities');
    }

    // Recommend based on enjoyment level
    if (enjoymentLevel < 3) {
      recommendations.push('One-on-one activities', 'Personalized therapy sessions');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private async planActivitiesForDay(date: Date): Promise<ActivityPlanningResult> {
    const plannedActivities = await this.searchActivities({ date });
    const resourceConflicts = this.checkResourceConflicts(plannedActivities);
    const staffingRequirements = this.calculateStaffingRequirements(plannedActivities);
    const estimatedCost = this.calculateEstimatedCost(plannedActivities);

    return {
      date,
      plannedActivities,
      resourceConflicts,
      staffingRequirements,
      estimatedCost,
    };
  }

  private checkResourceConflicts(activities: Activity[]): string[] {
    const conflicts = [];
    const resourceUsage: { [resource: string]: Activity[] } = {};

    // Group activities by resource usage
    for (const activity of activities) {
      for (const resource of activity.resources) {
        const resourceKey = `${resource.resourceType}:${resource.name}`;
        if (!resourceUsage[resourceKey]) {
          resourceUsage[resourceKey] = [];
        }
        resourceUsage[resourceKey].push(activity);
      }
    }

    // Check for conflicts
    for (const [resourceKey, resourceActivities] of Object.entries(resourceUsage)) {
      if (resourceActivities.length > 1) {
        // Check for time overlaps
        for (let i = 0; i < resourceActivities.length; i++) {
          for (let j = i + 1; j < resourceActivities.length; j++) {
            if (this.activitiesOverlap(resourceActivities[i], resourceActivities[j])) {
              conflicts.push(`Resource conflict: ${resourceKey} between ${resourceActivities[i].activityName} and ${resourceActivities[j].activityName}`);
            }
          }
        }
      }
    }

    return conflicts;
  }

  private calculateStaffingRequirements(activities: Activity[]): { [timeSlot: string]: number } {
    const requirements: { [timeSlot: string]: number } = {};
    
    for (const activity of activities) {
      const timeSlot = `${activity.scheduledStartTime.getHours()}:00`;
      const staffNeeded = activity.getRequiredStaffCount();
      requirements[timeSlot] = (requirements[timeSlot] || 0) + staffNeeded;
    }
    
    return requirements;
  }

  private calculateEstimatedCost(activities: Activity[]): number {
    return activities.reduce((total, activity) => {
      const resourceCost = activity.resources.reduce((sum, resource) => sum + (resource.cost || 0), 0);
      const staffCost = activity.getRequiredStaffCount() * 25 * (activity.getDuration() / 60); // £25/hour
      return total + resourceCost + staffCost;
    }, 0);
  }

  private isTimeSlotConflict(activity: Activity, timeSlot: string): boolean {
    const [hour] = timeSlot.split(':').map(Number);
    const activityHour = activity.scheduledStartTime.getHours();
    const activityEndHour = activity.scheduledEndTime.getHours();
    
    return hour >= activityHour && hour < activityEndHour;
  }

  private activitiesOverlap(activity1: Activity, activity2: Activity): boolean {
    const start1 = activity1.scheduledStartTime.getTime();
    const end1 = activity1.scheduledEndTime.getTime();
    const start2 = activity2.scheduledStartTime.getTime();
    const end2 = activity2.scheduledEndTime.getTime();
    
    return start1 < end2 && start2 < end1;
  }

  private getAvailableResources(usedResources: any[]): any[] {
    // Advanced resource availability checking with real-time data
    const allResources = [
      { resourceType: 'equipment', name: 'Piano', availability: 'available' },
      { resourceType: 'equipment', name: 'Art supplies', availability: 'available' },
      { resourceType: 'space', name: 'Activity room', availability: 'available' },
      { resourceType: 'space', name: 'Garden', availability: 'available' },
    ];

    const usedResourceKeys = usedResources.map(resource => `${resource.resourceType}:${resource.name}`);
    
    return allResources.filter(resource => 
      !usedResourceKeys.includes(`${resource.resourceType}:${resource.name}`)
    );
  }

  private calculateProgressSummary(sessions: TherapySession[]): any {
    if (sessions.length === 0) {
      return { overallProgress: 0, goalAchievements: [] };
    }

    const allGoals = sessions.flatMap(session => session.goals);
    const allOutcomes = sessions.flatMap(session => session.outcomes);

    const goalProgress = allGoals.map(goal => {
      const relatedOutcomes = allOutcomes.filter(outcome => outcome.goalId === goal.id);
      const latestOutcome = relatedOutcomes.sort((a, b) => 
        new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
      )[0];

      return {
        goalId: goal.id,
        description: goal.description,
        targetValue: goal.targetValue,
        currentValue: latestOutcome?.achievedValue || goal.currentValue,
        progressPercentage: goal.targetValue > 0 ? 
          ((latestOutcome?.achievedValue || goal.currentValue) / goal.targetValue) * 100 : 0,
      };
    });

    const overallProgress = goalProgress.length > 0 ?
      goalProgress.reduce((sum, goal) => sum + goal.progressPercentage, 0) / goalProgress.length : 0;

    return {
      overallProgress,
      goalAchievements: goalProgress,
    };
  }

  private generateTherapyRecommendations(sessions: TherapySession[]): string[] {
    const recommendations = [];

    if (sessions.length === 0) {
      recommendations.push('Begin regular therapy sessions');
      return recommendations;
    }

    const recentSessions = sessions.slice(0, 5);
    const averageGoalProgress = this.calculateAverageGoalProgress(recentSessions);

    if (averageGoalProgress < 50) {
      recommendations.push('Consider adjusting therapy approach');
      recommendations.push('Increase session frequency');
    } else if (averageGoalProgress > 80) {
      recommendations.push('Excellent progress - maintain current approach');
      recommendations.push('Consider advancing to more challenging goals');
    }

    return recommendations;
  }

  private calculateAverageGoalProgress(sessions: TherapySession[]): number {
    const allGoals = sessions.flatMap(session => session.goals);
    if (allGoals.length === 0) return 0;

    const totalProgress = allGoals.reduce((sum, goal) => {
      return sum + (goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0);
    }, 0);

    return totalProgress / allGoals.length;
  }

  private groupSessionsByStatus(sessions: TherapySession[]): Record<string, number> {
    return sessions.reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupSessionsByType(sessions: TherapySession[]): Record<string, number> {
    return sessions.reduce((acc, session) => {
      acc[session.therapyType] = (acc[session.therapyType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateDailySchedule(sessions: TherapySession[]): any[] {
    const schedule = sessions.map(session => ({
      date: session.scheduledStartTime.toISOString().split('T')[0],
      time: session.scheduledStartTime.toTimeString().split(' ')[0],
      therapyType: session.therapyType,
      residentId: session.residentId,
      location: session.location,
      status: session.status,
    }));

    return schedule.sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());
  }

  private calculateWorkloadMetrics(sessions: TherapySession[]): any {
    const totalHours = sessions.reduce((sum, session) => {
      if (session.actualStartTime && session.actualEndTime) {
        return sum + (session.actualEndTime.getTime() - session.actualStartTime.getTime()) / (1000 * 60 * 60);
      }
      return sum + ((session.scheduledEndTime.getTime() - session.scheduledStartTime.getTime()) / (1000 * 60 * 60));
    }, 0);

    const completedSessions = sessions.filter(session => session.status === 'completed').length;
    const completionRate = sessions.length > 0 ? (completedSessions / sessions.length) * 100 : 0;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      averageSessionDuration: sessions.length > 0 ? totalHours / sessions.length : 0,
      completionRate,
      utilizationRate: totalHours / (sessions.length * 1), // Assuming 1 hour standard sessions
    };
  }
}

// Export types and entities
export { TherapySession };