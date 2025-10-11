/**
 * @fileoverview community connection hub Service
 * @module Community/CommunityConnectionHubService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description community connection hub Service
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../core/DatabaseService';
import { Logger } from '../core/Logger';
import { AuditService } from '../core/AuditService';
import { NotificationService } from '../core/NotificationService';
import { AIService } from '../core/AIService';
import { EventService } from '../core/EventService';

export interface CommunityGroup {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  groupType: GroupType;
  category: GroupCategory;
  visibility: GroupVisibility;
  capacity: number;
  currentMembers: number;
  location?: string;
  schedule: GroupSchedule;
  facilitators: GroupFacilitator[];
  requirements: GroupRequirements;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupSchedule {
  frequency: ScheduleFrequency;
  dayOfWeek?: number[];
  timeOfDay: string;
  duration: number; // minutes
  recurringPattern?: RecurringPattern;
  exceptions: ScheduleException[];
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  endDate?: string;
  occurrences?: number;
}

export interface ScheduleException {
  date: string;
  type: 'cancelled' | 'rescheduled' | 'special_event';
  reason: string;
  alternativeTime?: string;
}

export interface GroupFacilitator {
  id: string;
  staffId?: string;
  volunteerId?: string;
  externalFacilitatorId?: string;
  role: FacilitatorRole;
  qualifications: string[];
  isLead: boolean;
}

export interface GroupRequirements {
  cognitiveLevel?: CognitiveLevel[];
  mobilityLevel?: MobilityLevel[];
  healthRestrictions?: string[];
  ageRange?: AgeRange;
  interests?: string[];
  permissions?: string[];
}

export interface AgeRange {
  min?: number;
  max?: number;
}

export interface CommunityActivity {
  id: string;
  tenantId: string;
  groupId?: string;
  title: string;
  description: string;
  activityType: ActivityType;
  category: ActivityCategory;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  location: string;
  facilitators: string[];
  participants: ActivityParticipant[];
  resources: ActivityResource[];
  outcomes: ActivityOutcome[];
  status: ActivityStatus;
  feedback: ActivityFeedback[];
  isRecurring: boolean;
  recurringGroupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityParticipant {
  residentId: string;
  participationType: ParticipationType;
  engagementLevel?: EngagementLevel;
  attendanceStatus: AttendanceStatus;
  notes?: string;
  adaptations?: string[];
}

export interface ActivityResource {
  type: ResourceType;
  name: string;
  quantity: number;
  isRequired: boolean;
  status: ResourceStatus;
  requestedBy?: string;
  notes?: string;
}

export interface ActivityOutcome {
  participantId: string;
  outcomeType: OutcomeType;
  measurement: string;
  value: number | string;
  notes?: string;
  measuredBy: string;
  measuredAt: string;
}

export interface ActivityFeedback {
  participantId: string;
  rating: number; // 1-5
  comments?: string;
  enjoymentLevel: number; // 1-5
  difficultyLevel: number; // 1-5
  wouldRepeat: boolean;
  suggestions?: string;
  submittedAt: string;
}

export interface Volunteer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  emergencyContact: EmergencyContact;
  skills: VolunteerSkill[];
  interests: string[];
  availability: VolunteerAvailability;
  background: BackgroundCheck;
  training: TrainingRecord[];
  assignments: VolunteerAssignment[];
  performance: VolunteerPerformance;
  status: VolunteerStatus;
  joinedAt: string;
  lastActiveAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternativePhone?: string;
}

export interface VolunteerSkill {
  category: SkillCategory;
  name: string;
  level: SkillLevel;
  certified: boolean;
  certificationDate?: string;
  expiryDate?: string;
}

export interface VolunteerAvailability {
  daysOfWeek: DayAvailability[];
  restrictions: string[];
  preferredActivities: string[];
  blackoutDates: string[];
}

export interface DayAvailability {
  day: number; // 0-6 (Sunday-Saturday)
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
  type: 'preferred' | 'available' | 'unavailable';
}

export interface BackgroundCheck {
  status: BackgroundStatus;
  completedDate?: string;
  expiryDate?: string;
  checkType: string[];
  verifiedBy: string;
  notes?: string;
}

export interface TrainingRecord {
  id: string;
  trainingType: string;
  title: string;
  completedDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  trainer: string;
  hours: number;
  status: TrainingStatus;
}

export interface VolunteerAssignment {
  id: string;
  type: AssignmentType;
  entityId: string; // group ID, activity ID, or resident ID
  role: string;
  startDate: string;
  endDate?: string;
  status: AssignmentStatus;
  feedback?: string;
  hours: number;
}

export interface VolunteerPerformance {
  totalHours: number;
  activitiesLed: number;
  residentInteractions: number;
  averageRating: number;
  feedbackCount: number;
  reliability: number; // percentage
  lastEvaluation?: string;
  strengths: string[];
  improvementAreas: string[];
}

export interface CommunityEvent {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  eventType: EventType;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  organizer: EventOrganizer;
  targetAudience: TargetAudience;
  capacity: number;
  registrations: EventRegistration[];
  resources: EventResource[];
  partnerships: CommunityPartnership[];
  promotion: EventPromotion;
  outcomes: EventOutcome;
  status: EventStatus;
  isPublic: boolean;
  requiresRegistration: boolean;
  cost?: number;
  accessibility: AccessibilityFeatures;
  createdAt: string;
  updatedAt: string;
}

export interface EventOrganizer {
  type: 'staff' | 'volunteer' | 'external' | 'family';
  id: string;
  name: string;
  role: string;
  contact: ContactInfo;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
}

export interface TargetAudience {
  residents: boolean;
  families: boolean;
  staff: boolean;
  community: boolean;
  ageGroups: string[];
  interests: string[];
  accessibilityNeeds: string[];
}

export interface EventRegistration {
  id: string;
  participantType: 'resident' | 'family' | 'staff' | 'community';
  participantId: string;
  participantName: string;
  registrationDate: string;
  status: RegistrationStatus;
  specialRequests?: string;
  emergencyContact?: EmergencyContact;
  attendanceStatus?: AttendanceStatus;
  feedback?: EventFeedback;
}

export interface EventFeedback {
  rating: number; // 1-5
  enjoyed: boolean;
  learned: boolean;
  wouldAttend: boolean;
  comments?: string;
  suggestions?: string;
  submittedAt: string;
}

export interface EventResource {
  type: ResourceType;
  name: string;
  quantity: number;
  status: ResourceStatus;
  supplier?: string;
  cost?: number;
  deliveryDate?: string;
}

export interface CommunityPartnership {
  id: string;
  organizationName: string;
  partnershipType: PartnershipType;
  contactPerson: string;
  contactInfo: ContactInfo;
  services: string[];
  agreement: PartnershipAgreement;
  isActive: boolean;
}

export interface PartnershipAgreement {
  startDate: string;
  endDate?: string;
  terms: string;
  responsibilities: PartnerResponsibilities;
  costs?: PartnershipCosts;
  reviewDate?: string;
}

export interface PartnerResponsibilities {
  careHome: string[];
  partner: string[];
  shared: string[];
}

export interface PartnershipCosts {
  type: 'free' | 'paid' | 'revenue_share' | 'cost_share';
  amount?: number;
  frequency?: string;
  notes?: string;
}

export interface EventPromotion {
  channels: PromotionChannel[];
  materials: PromotionMaterial[];
  timeline: PromotionTimeline;
  budget?: number;
  responsible: string;
}

export interface PromotionMaterial {
  type: MaterialType;
  title: string;
  content: string;
  mediaUrl?: string;
  targetAudience: string[];
  distributionDate: string;
}

export interface PromotionTimeline {
  announcementDate: string;
  promotionStartDate: string;
  reminderDates: string[];
  registrationDeadline?: string;
}

export interface EventOutcome {
  attendance: AttendanceData;
  satisfaction: SatisfactionData;
  engagement: EngagementData;
  impact: ImpactAssessment;
  financials: FinancialSummary;
  media: MediaCoverage[];
}

export interface AttendanceData {
  registered: number;
  attended: number;
  noShows: number;
  walkIns: number;
  byCategory: Record<string, number>;
}

export interface SatisfactionData {
  averageRating: number;
  responseRate: number;
  positiveResponses: number;
  suggestions: string[];
  improvementAreas: string[];
}

export interface EngagementData {
  activeParticipation: number;
  questions: number;
  interactions: number;
  followupInterest: number;
}

export interface ImpactAssessment {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  metrics: Record<string, number>;
  stories: string[];
}

export interface FinancialSummary {
  budget: number;
  actualCost: number;
  revenue?: number;
  costPerParticipant: number;
  variance: number;
}

export interface MediaCoverage {
  outlet: string;
  type: 'article' | 'video' | 'social' | 'radio';
  url?: string;
  reach: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  date: string;
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  hearingLoop: boolean;
  signLanguage: boolean;
  largeText: boolean;
  braille: boolean;
  sensoryFriendly: boolean;
  other: string[];
}

// Enums
type GroupType = 'activity' | 'therapy' | 'educational' | 'social' | 'spiritual' | 'recreational' | 'support';
type GroupCategory = 'physical_activity' | 'cognitive_stimulation' | 'creative_arts' | 'music_therapy' | 'gardening' | 'cooking' | 'reminiscence' | 'technology' | 'reading' | 'games';
type GroupVisibility = 'public' | 'private' | 'invitation_only' | 'staff_only';
type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'irregular' | 'one_time';
type FacilitatorRole = 'lead' | 'assistant' | 'specialist' | 'observer' | 'volunteer';
type CognitiveLevel = 'high' | 'moderate' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
type MobilityLevel = 'independent' | 'walking_aid' | 'wheelchair' | 'bed_bound' | 'assisted';
type ActivityType = 'group_activity' | 'one_on_one' | 'community_event' | 'therapy_session' | 'educational_program' | 'entertainment';
type ActivityCategory = 'physical' | 'cognitive' | 'social' | 'creative' | 'spiritual' | 'educational' | 'recreational' | 'therapeutic';
type ParticipationType = 'active' | 'observer' | 'assisted' | 'reluctant' | 'engaged';
type EngagementLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
type AttendanceStatus = 'registered' | 'attended' | 'no_show' | 'cancelled' | 'rescheduled';
type ResourceType = 'equipment' | 'supplies' | 'venue' | 'staff' | 'volunteer' | 'external_service';
type ResourceStatus = 'available' | 'reserved' | 'in_use' | 'maintenance' | 'unavailable';
type OutcomeType = 'engagement' | 'satisfaction' | 'learning' | 'physical' | 'cognitive' | 'social' | 'emotional';
type VolunteerStatus = 'active' | 'inactive' | 'on_hold' | 'training' | 'application_pending' | 'background_check' | 'terminated';
type SkillCategory = 'care' | 'activities' | 'education' | 'administration' | 'maintenance' | 'technology' | 'arts' | 'music' | 'sports';
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'certified';
type BackgroundStatus = 'pending' | 'in_progress' | 'cleared' | 'flagged' | 'expired' | 'rejected';
type TrainingStatus = 'enrolled' | 'in_progress' | 'completed' | 'expired' | 'failed';
type AssignmentType = 'group' | 'activity' | 'resident_companion' | 'administrative' | 'special_project';
type AssignmentStatus = 'active' | 'completed' | 'paused' | 'cancelled';
type EventType = 'celebration' | 'education' | 'entertainment' | 'fundraising' | 'community_outreach' | 'family_day' | 'cultural' | 'seasonal';
type EventStatus = 'planning' | 'promoted' | 'active_registration' | 'full' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
type RegistrationStatus = 'confirmed' | 'waitlist' | 'cancelled' | 'no_show' | 'attended';
type PartnershipType = 'service_provider' | 'educational' | 'healthcare' | 'entertainment' | 'volunteer_source' | 'resource_sharing' | 'advocacy';
type PromotionChannel = 'website' | 'email' | 'social_media' | 'flyers' | 'local_media' | 'word_of_mouth' | 'community_boards';
type MaterialType = 'flyer' | 'poster' | 'email' | 'social_post' | 'press_release' | 'video' | 'brochure';

export class CommunityConnectionHubService {
  private router = express.Router();
  privatedb: DatabaseService;
  privatelogger: Logger;
  privateauditService: AuditService;
  privatenotificationService: NotificationService;
  privateaiService: AIService;
  privateeventService: EventService;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.logger = Logger.getInstance();
    this.auditService = AuditService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.aiService = AIService.getInstance();
    this.eventService = EventService.getInstance();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Community Groups Management
    this.router.post('/groups', this.validateCommunityGroup(), this.createCommunityGroup.bind(this));
    this.router.get('/groups', this.getCommunityGroups.bind(this));
    this.router.get('/groups/:groupId', this.getCommunityGroup.bind(this));
    this.router.put('/groups/:groupId', this.validateCommunityGroup(), this.updateCommunityGroup.bind(this));
    this.router.delete('/groups/:groupId', this.deleteCommunityGroup.bind(this));
    this.router.post('/groups/:groupId/members', this.addGroupMember.bind(this));
    this.router.delete('/groups/:groupId/members/:residentId', this.removeGroupMember.bind(this));

    // Activities Management
    this.router.post('/activities', this.validateActivity(), this.createActivity.bind(this));
    this.router.get('/activities', this.getActivities.bind(this));
    this.router.get('/activities/:activityId', this.getActivity.bind(this));
    this.router.put('/activities/:activityId', this.validateActivity(), this.updateActivity.bind(this));
    this.router.delete('/activities/:activityId', this.deleteActivity.bind(this));
    this.router.post('/activities/:activityId/participants', this.addActivityParticipant.bind(this));
    this.router.put('/activities/:activityId/participants/:residentId', this.updateParticipantStatus.bind(this));
    this.router.post('/activities/:activityId/feedback', this.submitActivityFeedback.bind(this));
    this.router.post('/activities/:activityId/outcomes', this.recordActivityOutcome.bind(this));

    // Volunteer Management
    this.router.post('/volunteers', this.validateVolunteer(), this.createVolunteer.bind(this));
    this.router.get('/volunteers', this.getVolunteers.bind(this));
    this.router.get('/volunteers/:volunteerId', this.getVolunteer.bind(this));
    this.router.put('/volunteers/:volunteerId', this.validateVolunteer(), this.updateVolunteer.bind(this));
    this.router.post('/volunteers/:volunteerId/assignments', this.assignVolunteer.bind(this));
    this.router.put('/volunteers/:volunteerId/assignments/:assignmentId', this.updateVolunteerAssignment.bind(this));
    this.router.post('/volunteers/:volunteerId/training', this.recordTraining.bind(this));
    this.router.get('/volunteers/:volunteerId/performance', this.getVolunteerPerformance.bind(this));

    // Community Events
    this.router.post('/events', this.validateEvent(), this.createCommunityEvent.bind(this));
    this.router.get('/events', this.getCommunityEvents.bind(this));
    this.router.get('/events/:eventId', this.getCommunityEvent.bind(this));
    this.router.put('/events/:eventId', this.validateEvent(), this.updateCommunityEvent.bind(this));
    this.router.post('/events/:eventId/register', this.registerForEvent.bind(this));
    this.router.put('/events/:eventId/registrations/:registrationId', this.updateEventRegistration.bind(this));
    this.router.post('/events/:eventId/feedback', this.submitEventFeedback.bind(this));
    this.router.post('/events/:eventId/outcomes', this.recordEventOutcomes.bind(this));

    // Partnerships
    this.router.post('/partnerships', this.validatePartnership(), this.createPartnership.bind(this));
    this.router.get('/partnerships', this.getPartnerships.bind(this));
    this.router.get('/partnerships/:partnershipId', this.getPartnership.bind(this));
    this.router.put('/partnerships/:partnershipId', this.validatePartnership(), this.updatePartnership.bind(this));

    // Analytics and Reporting
    this.router.get('/analytics/engagement', this.getEngagementAnalytics.bind(this));
    this.router.get('/analytics/activities', this.getActivityAnalytics.bind(this));
    this.router.get('/analytics/volunteers', this.getVolunteerAnalytics.bind(this));
    this.router.get('/analytics/events', this.getEventAnalytics.bind(this));
    this.router.get('/analytics/community-impact', this.getCommunityImpactAnalytics.bind(this));

    // Recommendations and Matching
    this.router.get('/recommendations/activities/:residentId', this.getActivityRecommendations.bind(this));
    this.router.get('/recommendations/volunteers/:activityId', this.getVolunteerRecommendations.bind(this));
    this.router.post('/matching/optimize', this.optimizeMatching.bind(this));

    // Scheduling and Calendar
    this.router.get('/calendar', this.getCommunityCalendar.bind(this));
    this.router.post('/schedule/bulk', this.bulkScheduleActivities.bind(this));
    this.router.get('/schedule/conflicts', this.getScheduleConflicts.bind(this));
    this.router.post('/schedule/optimize', this.optimizeSchedule.bind(this));
  }

  // Community Groups Management
  private async createCommunityGroup(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const {
        name,
        description,
        groupType,
        category,
        visibility,
        capacity,
        location,
        schedule,
        facilitators,
        requirements,
        tags = []
      } = req.body;

      const groupId = uuidv4();
      constgroup: CommunityGroup = {
        id: groupId,
        tenantId,
        name,
        description,
        groupType,
        category,
        visibility,
        capacity,
        currentMembers: 0,
        location,
        schedule,
        facilitators,
        requirements,
        tags,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.db.query(
        `INSERT INTO community.groups (
          id, tenant_id, name, description, group_type, category, visibility,
          capacity, current_members, location, schedule, facilitators,
          requirements, tags, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          groupId, tenantId, name, description, groupType, category, visibility,
          capacity, 0, location, JSON.stringify(schedule), JSON.stringify(facilitators),
          JSON.stringify(requirements), JSON.stringify(tags), true,
          group.createdAt, group.updatedAt
        ]
      );

      // Create recurring activities based on schedule
      await this.createRecurringActivities(tenantId, groupId, schedule);

      // Notify relevant stakeholders
      await this.notificationService.sendNotification({
        tenantId,
        type: 'community_group_created',
        recipients: await this.getGroupStakeholders(tenantId, facilitators),
        title: 'New Community Group Created',
        message: `${name} group has been created and is ready for members`,
        metadata: { groupId, groupType, category }
      });

      await this.auditService.logActivity(
        tenantId,
        userId,
        'create_community_group',
        'CommunityConnectionHubService',
        groupId,
        { name, groupType, capacity }
      );

      this.logger.info('Community group created', { tenantId, groupId, name });
      res.status(201).json(group);
    } catch (error) {
      this.logger.error('Error creating community group', { error });
      res.status(500).json({ error: 'Failed to create community group' });
    }
  }

  private async getCommunityGroups(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const {
        groupType,
        category,
        visibility,
        isActive = 'true',
        hasCapacity = 'false',
        page = '1',
        limit = '50'
      } = req.query;

      let query = `
        SELECT g.*, 
               COUNT(gm.resident_id) as current_members,
               ARRAY_AGG(DISTINCT r.first_name || ' ' || r.last_name) FILTER (WHERE r.id IS NOT NULL) as member_names
        FROM community.groups g
        LEFT JOIN community.group_members gm ON g.id = gm.group_id AND gm.is_active = true
        LEFT JOIN residents r ON gm.resident_id = r.id
        WHERE g.tenant_id = $1
      `;
      constparams: any[] = [tenantId];
      let paramCount = 1;

      if (groupType) {
        query += ` AND g.group_type = $${++paramCount}`;
        params.push(groupType);
      }

      if (category) {
        query += ` AND g.category = $${++paramCount}`;
        params.push(category);
      }

      if (visibility) {
        query += ` AND g.visibility = $${++paramCount}`;
        params.push(visibility);
      }

      if (isActive !== 'all') {
        query += ` AND g.is_active = $${++paramCount}`;
        params.push(isActive === 'true');
      }

      query += ` GROUP BY g.id`;

      if (hasCapacity === 'true') {
        query += ` HAVING COUNT(gm.resident_id) < g.capacity`;
      }

      query += ` ORDER BY g.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(parseInt(limit as string));
      params.push((parseInt(page as string) - 1) * parseInt(limit as string));

      const result = await this.db.query(query, params);

      const groups = result.rows.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        description: row.description,
        groupType: row.group_type,
        category: row.category,
        visibility: row.visibility,
        capacity: row.capacity,
        currentMembers: parseInt(row.current_members),
        location: row.location,
        schedule: row.schedule,
        facilitators: row.facilitators,
        requirements: row.requirements,
        tags: row.tags,
        isActive: row.is_active,
        memberNames: row.member_names.filter(name => name),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json({
        groups,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: groups.length
        }
      });
    } catch (error) {
      this.logger.error('Error fetching community groups', { error });
      res.status(500).json({ error: 'Failed to fetch community groups' });
    }
  }

  private async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const {
        groupId,
        title,
        description,
        activityType,
        category,
        scheduledStart,
        scheduledEnd,
        location,
        facilitators = [],
        resources = [],
        isRecurring = false,
        recurringGroupId
      } = req.body;

      const activityId = uuidv4();
      constactivity: CommunityActivity = {
        id: activityId,
        tenantId,
        groupId,
        title,
        description,
        activityType,
        category,
        scheduledStart,
        scheduledEnd,
        location,
        facilitators,
        participants: [],
        resources,
        outcomes: [],
        status: 'planning',
        feedback: [],
        isRecurring,
        recurringGroupId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.db.query(
        `INSERT INTO community.activities (
          id, tenant_id, group_id, title, description, activity_type, category,
          scheduled_start, scheduled_end, location, facilitators, participants,
          resources, outcomes, status, feedback, is_recurring, recurring_group_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          activityId, tenantId, groupId, title, description, activityType, category,
          scheduledStart, scheduledEnd, location, JSON.stringify(facilitators),
          JSON.stringify([]), JSON.stringify(resources), JSON.stringify([]),
          'planning', JSON.stringify([]), isRecurring, recurringGroupId,
          activity.createdAt, activity.updatedAt
        ]
      );

      // Auto-enroll group members if this is a group activity
      if (groupId) {
        await this.autoEnrollGroupMembers(tenantId, activityId, groupId);
      }

      // Schedule resources
      for (const resource of resources) {
        await this.scheduleResource(tenantId, activityId, resource, scheduledStart, scheduledEnd);
      }

      // Send notifications to facilitators
      await this.notificationService.sendBulkNotifications({
        tenantId,
        type: 'activity_created',
        recipients: facilitators,
        title: 'New Activity Scheduled',
        message: `You have been assigned to facilitate: ${title}`,
        metadata: { activityId, scheduledStart, location }
      });

      await this.auditService.logActivity(
        tenantId,
        userId,
        'create_activity',
        'CommunityConnectionHubService',
        activityId,
        { title, activityType, scheduledStart }
      );

      this.logger.info('Community activity created', { tenantId, activityId, title });
      res.status(201).json(activity);
    } catch (error) {
      this.logger.error('Error creating activity', { error });
      res.status(500).json({ error: 'Failed to create activity' });
    }
  }

  private async createVolunteer(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        emergencyContact,
        skills = [],
        interests = [],
        availability
      } = req.body;

      const volunteerId = uuidv4();
      constvolunteer: Volunteer = {
        id: volunteerId,
        tenantId,
        firstName,
        lastName,
        email,
        phone,
        address,
        emergencyContact,
        skills,
        interests,
        availability,
        background: {
          status: 'pending',
          checkType: ['DBS', 'references'],
          verifiedBy: userId
        },
        training: [],
        assignments: [],
        performance: {
          totalHours: 0,
          activitiesLed: 0,
          residentInteractions: 0,
          averageRating: 0,
          feedbackCount: 0,
          reliability: 100,
          strengths: [],
          improvementAreas: []
        },
        status: 'application_pending',
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.db.query(
        `INSERT INTO community.volunteers (
          id, tenant_id, first_name, last_name, email, phone, address,
          emergency_contact, skills, interests, availability, background,
          training, assignments, performance, status, joined_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          volunteerId, tenantId, firstName, lastName, email, phone,
          JSON.stringify(address), JSON.stringify(emergencyContact),
          JSON.stringify(skills), JSON.stringify(interests),
          JSON.stringify(availability), JSON.stringify(volunteer.background),
          JSON.stringify([]), JSON.stringify([]), JSON.stringify(volunteer.performance),
          'application_pending', volunteer.joinedAt, volunteer.createdAt, volunteer.updatedAt
        ]
      );

      // Send welcome email
      await this.notificationService.sendEmail({
        to: email,
        subject: 'Welcome to Our Volunteer Program',
        template: 'volunteer_welcome',
        data: { firstName, tenantId }
      });

      // Notify volunteer coordinator
      await this.notificationService.sendNotification({
        tenantId,
        type: 'volunteer_application',
        recipients: await this.getVolunteerCoordinators(tenantId),
        title: 'New Volunteer Application',
        message: `${firstName} ${lastName} has applied to volunteer`,
        metadata: { volunteerId, email }
      });

      await this.auditService.logActivity(
        tenantId,
        userId,
        'create_volunteer',
        'CommunityConnectionHubService',
        volunteerId,
        { name: `${firstName} ${lastName}`, email }
      );

      this.logger.info('Volunteer created', { tenantId, volunteerId, email });
      res.status(201).json(volunteer);
    } catch (error) {
      this.logger.error('Error creating volunteer', { error });
      res.status(500).json({ error: 'Failed to create volunteer' });
    }
  }

  private async createCommunityEvent(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const {
        title,
        description,
        eventType,
        category,
        startDate,
        endDate,
        location,
        organizer,
        targetAudience,
        capacity,
        resources = [],
        partnerships = [],
        isPublic = false,
        requiresRegistration = true,
        cost,
        accessibility
      } = req.body;

      const eventId = uuidv4();
      constevent: CommunityEvent = {
        id: eventId,
        tenantId,
        title,
        description,
        eventType,
        category,
        startDate,
        endDate,
        location,
        organizer,
        targetAudience,
        capacity,
        registrations: [],
        resources,
        partnerships,
        promotion: {
          channels: ['website', 'email'],
          materials: [],
          timeline: {
            announcementDate: new Date().toISOString(),
            promotionStartDate: new Date().toISOString(),
            reminderDates: []
          },
          responsible: userId
        },
        outcomes: {
          attendance: { registered: 0, attended: 0, noShows: 0, walkIns: 0, byCategory: {} },
          satisfaction: { averageRating: 0, responseRate: 0, positiveResponses: 0, suggestions: [], improvementAreas: [] },
          engagement: { activeParticipation: 0, questions: 0, interactions: 0, followupInterest: 0 },
          impact: { immediate: [], shortTerm: [], longTerm: [], metrics: {}, stories: [] },
          financials: { budget: 0, actualCost: 0, costPerParticipant: 0, variance: 0 },
          media: []
        },
        status: 'planning',
        isPublic,
        requiresRegistration,
        cost,
        accessibility,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.db.query(
        `INSERT INTO community.events (
          id, tenant_id, title, description, event_type, category, start_date, end_date,
          location, organizer, target_audience, capacity, registrations, resources,
          partnerships, promotion, outcomes, status, is_public, requires_registration,
          cost, accessibility, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
        [
          eventId, tenantId, title, description, eventType, category, startDate, endDate,
          location, JSON.stringify(organizer), JSON.stringify(targetAudience), capacity,
          JSON.stringify([]), JSON.stringify(resources), JSON.stringify(partnerships),
          JSON.stringify(event.promotion), JSON.stringify(event.outcomes), 'planning',
          isPublic, requiresRegistration, cost, JSON.stringify(accessibility),
          event.createdAt, event.updatedAt
        ]
      );

      // Create promotional materials
      await this.createEventPromotionalMaterials(tenantId, eventId, event);

      // Schedule resource bookings
      for (const resource of resources) {
        await this.scheduleEventResource(tenantId, eventId, resource, startDate, endDate);
      }

      await this.auditService.logActivity(
        tenantId,
        userId,
        'create_community_event',
        'CommunityConnectionHubService',
        eventId,
        { title, eventType, startDate }
      );

      this.logger.info('Community event created', { tenantId, eventId, title });
      res.status(201).json(event);
    } catch (error) {
      this.logger.error('Error creating community event', { error });
      res.status(500).json({ error: 'Failed to create community event' });
    }
  }

  private async getEngagementAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { timeframe = '30d', groupBy = 'week' } = req.query;

      // Get activity participation rates
      const participationData = await this.db.query(`
        SELECT 
          DATE_TRUNC($3, a.scheduled_start) as period,
          COUNT(DISTINCT a.id) as total_activities,
          COUNT(DISTINCT ap.resident_id) as unique_participants,
          AVG(CASE WHEN ap.engagement_level = 'very_high' THEN 5
                   WHEN ap.engagement_level = 'high' THEN 4
                   WHEN ap.engagement_level = 'moderate' THEN 3
                   WHEN ap.engagement_level = 'low' THEN 2
                   WHEN ap.engagement_level = 'very_low' THEN 1
                   ELSE 3 END) as avg_engagement,
          COUNT(ap.resident_id) as total_participations
        FROM community.activities a
        LEFT JOIN community.activity_participants ap ON a.id = ap.activity_id
        WHERE a.tenant_id = $1 
          AND a.scheduled_start > NOW() - INTERVAL $2
        GROUP BY period
        ORDER BY period
      `, [tenantId, timeframe, groupBy]);

      // Get resident engagement scores
      const residentEngagement = await this.db.query(`
        SELECT 
          r.id,
          r.first_name || ' ' || r.last_name as name,
          COUNT(ap.activity_id) as activities_participated,
          AVG(CASE WHEN ap.engagement_level = 'very_high' THEN 5
                   WHEN ap.engagement_level = 'high' THEN 4
                   WHEN ap.engagement_level = 'moderate' THEN 3
                   WHEN ap.engagement_level = 'low' THEN 2
                   WHEN ap.engagement_level = 'very_low' THEN 1
                   ELSE 3 END) as avg_engagement_score,
          COUNT(af.activity_id) as feedback_given,
          AVG(af.rating) as avg_satisfaction
        FROM residents r
        LEFT JOIN community.activity_participants ap ON r.id = ap.resident_id
        LEFT JOIN community.activities a ON ap.activity_id = a.id
        LEFT JOIN community.activity_feedback af ON a.id = af.activity_id AND r.id = af.participant_id
        WHERE r.tenant_id = $1
          AND (a.scheduled_start IS NULL OR a.scheduled_start > NOW() - INTERVAL $2)
        GROUP BY r.id, r.first_name, r.last_name
        ORDER BY avg_engagement_score DESC NULLS LAST
        LIMIT 20
      `, [tenantId, timeframe]);

      // Get group engagement metrics
      const groupMetrics = await this.db.query(`
        SELECT 
          g.id,
          g.name,
          g.category,
          COUNT(gm.resident_id) as member_count,
          COUNT(a.id) as activities_held,
          AVG(af.rating) as avg_satisfaction,
          COUNT(DISTINCT ap.resident_id) as active_participants
        FROM community.groups g
        LEFT JOIN community.group_members gm ON g.id = gm.group_id AND gm.is_active = true
        LEFT JOIN community.activities a ON g.id = a.group_id
        LEFT JOIN community.activity_participants ap ON a.id = ap.activity_id
        LEFT JOIN community.activity_feedback af ON a.id = af.activity_id
        WHERE g.tenant_id = $1
          AND (a.scheduled_start IS NULL OR a.scheduled_start > NOW() - INTERVAL $2)
        GROUP BY g.id, g.name, g.category
        ORDER BY avg_satisfaction DESC NULLS LAST
      `, [tenantId, timeframe]);

      const analytics = {
        timeframe,
        participationTrends: participationData.rows,
        residentEngagement: residentEngagement.rows,
        groupMetrics: groupMetrics.rows,
        summary: {
          totalActivities: participationData.rows.reduce((sum, row) => sum + row.total_activities, 0),
          totalParticipations: participationData.rows.reduce((sum, row) => sum + row.total_participations, 0),
          averageEngagement: participationData.rows.reduce((sum, row) => sum + row.avg_engagement, 0) / participationData.rows.length || 0,
          activeResidents: residentEngagement.rows.filter(r => r.activities_participated > 0).length,
          activeGroups: groupMetrics.rows.filter(g => g.activities_held > 0).length
        },
        generatedAt: new Date().toISOString()
      };

      res.json(analytics);
    } catch (error) {
      this.logger.error('Error fetching engagement analytics', { error });
      res.status(500).json({ error: 'Failed to fetch engagement analytics' });
    }
  }

  // Helper Methods
  private async createRecurringActivities(tenantId: string, groupId: string, schedule: GroupSchedule): Promise<void> {
    if (schedule.frequency === 'one_time') return;

    const recurringGroupId = uuidv4();
    const activities = this.generateRecurringActivities(tenantId, groupId, schedule, recurringGroupId);

    for (const activity of activities) {
      await this.db.query(
        `INSERT INTO community.activities (
          id, tenant_id, group_id, title, description, activity_type, category,
          scheduled_start, scheduled_end, location, facilitators, participants,
          resources, outcomes, status, feedback, is_recurring, recurring_group_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          activity.id, tenantId, groupId, activity.title, activity.description,
          activity.activityType, activity.category, activity.scheduledStart,
          activity.scheduledEnd, activity.location, JSON.stringify(activity.facilitators),
          JSON.stringify([]), JSON.stringify(activity.resources), JSON.stringify([]),
          'planning', JSON.stringify([]), true, recurringGroupId,
          activity.createdAt, activity.updatedAt
        ]
      );
    }
  }

  private generateRecurringActivities(
    tenantId: string,
    groupId: string,
    schedule: GroupSchedule,
    recurringGroupId: string,
    weeksAhead: number = 12
  ): CommunityActivity[] {
    constactivities: CommunityActivity[] = [];
    const startDate = new Date();
    
    for (let week = 0; week < weeksAhead; week++) {
      if (schedule.dayOfWeek) {
        for (const dayOfWeek of schedule.dayOfWeek) {
          const activityDate = new Date(startDate);
          activityDate.setDate(activityDate.getDate() + (week * 7) + (dayOfWeek - startDate.getDay()));
          
          // Skip if exception exists
          const dateStr = activityDate.toISOString().split('T')[0];
          const hasException = schedule.exceptions.some(ex => ex.date === dateStr);
          if (hasException) continue;

          const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);
          activityDate.setHours(hours, minutes, 0, 0);
          
          const endDate = new Date(activityDate);
          endDate.setMinutes(endDate.getMinutes() + schedule.duration);

          activities.push({
            id: uuidv4(),
            tenantId,
            groupId,
            title: `Group Activity - Week ${week + 1}`,
            description: 'Recurring group activity',
            activityType: 'group_activity',
            category: 'social',
            scheduledStart: activityDate.toISOString(),
            scheduledEnd: endDate.toISOString(),
            location: '',
            facilitators: [],
            participants: [],
            resources: [],
            outcomes: [],
            status: 'planning',
            feedback: [],
            isRecurring: true,
            recurringGroupId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    return activities;
  }

  private async autoEnrollGroupMembers(tenantId: string, activityId: string, groupId: string): Promise<void> {
    const members = await this.db.query(
      'SELECT resident_id FROM community.group_members WHERE group_id = $1 AND is_active = true',
      [groupId]
    );

    for (const member of members.rows) {
      await this.db.query(
        `INSERT INTO community.activity_participants (
          activity_id, resident_id, participation_type, attendance_status
        ) VALUES ($1, $2, $3, $4)`,
        [activityId, member.resident_id, 'active', 'registered']
      );
    }
  }

  private async getGroupStakeholders(tenantId: string, facilitators: GroupFacilitator[]): Promise<string[]> {
    const stakeholders = [];
    
    for (const facilitator of facilitators) {
      if (facilitator.staffId) {
        stakeholders.push(facilitator.staffId);
      }
    }

    // Add activity coordinators
    const coordinators = await this.db.query(
      'SELECT user_id FROM user_roles WHERE tenant_id = $1 AND role = $2',
      [tenantId, 'activity_coordinator']
    );
    
    stakeholders.push(...coordinators.rows.map(row => row.user_id));
    
    return stakeholders;
  }

  // Validation middleware
  private validateCommunityGroup() {
    return [
      body('name').isLength({ min: 1, max: 255 }).trim(),
      body('description').isLength({ min: 1 }).trim(),
      body('groupType').isIn(['activity', 'therapy', 'educational', 'social', 'spiritual', 'recreational', 'support']),
      body('category').isIn(['physical_activity', 'cognitive_stimulation', 'creative_arts', 'music_therapy', 'gardening', 'cooking', 'reminiscence', 'technology', 'reading', 'games']),
      body('visibility').isIn(['public', 'private', 'invitation_only', 'staff_only']),
      body('capacity').isInt({ min: 1, max: 100 }),
      body('schedule').isObject(),
      body('facilitators').isArray(),
      body('requirements').isObject()
    ];
  }

  private validateActivity() {
    return [
      body('title').isLength({ min: 1, max: 255 }).trim(),
      body('description').isLength({ min: 1 }).trim(),
      body('activityType').isIn(['group_activity', 'one_on_one', 'community_event', 'therapy_session', 'educational_program', 'entertainment']),
      body('category').isIn(['physical', 'cognitive', 'social', 'creative', 'spiritual', 'educational', 'recreational', 'therapeutic']),
      body('scheduledStart').isISO8601(),
      body('scheduledEnd').isISO8601(),
      body('location').isLength({ min: 1, max: 255 }).trim(),
      body('facilitators').isArray()
    ];
  }

  private validateVolunteer() {
    return [
      body('firstName').isLength({ min: 1, max: 100 }).trim(),
      body('lastName').isLength({ min: 1, max: 100 }).trim(),
      body('email').isEmail().normalizeEmail(),
      body('phone').optional().isMobilePhone('any'),
      body('emergencyContact').isObject(),
      body('skills').isArray(),
      body('interests').isArray(),
      body('availability').isObject()
    ];
  }

  private validateEvent() {
    return [
      body('title').isLength({ min: 1, max: 255 }).trim(),
      body('description').isLength({ min: 1 }).trim(),
      body('eventType').isIn(['celebration', 'education', 'entertainment', 'fundraising', 'community_outreach', 'family_day', 'cultural', 'seasonal']),
      body('startDate').isISO8601(),
      body('endDate').isISO8601(),
      body('location').isLength({ min: 1, max: 255 }).trim(),
      body('organizer').isObject(),
      body('targetAudience').isObject(),
      body('capacity').isInt({ min: 1 })
    ];
  }

  private validatePartnership() {
    return [
      body('organizationName').isLength({ min: 1, max: 255 }).trim(),
      body('partnershipType').isIn(['service_provider', 'educational', 'healthcare', 'entertainment', 'volunteer_source', 'resource_sharing', 'advocacy']),
      body('contactPerson').isLength({ min: 1, max: 255 }).trim(),
      body('contactInfo').isObject(),
      body('services').isArray(),
      body('agreement').isObject()
    ];
  }

  // Additional helper methods would be implemented here...
  private async scheduleResource(tenantId: string, activityId: string, resource: ActivityResource, start: string, end: string): Promise<void> {
    // Implementation for resource scheduling
  }

  private async getVolunteerCoordinators(tenantId: string): Promise<string[]> {
    // Implementation for getting volunteer coordinators
    return [];
  }

  private async createEventPromotionalMaterials(tenantId: string, eventId: string, event: CommunityEvent): Promise<void> {
    // Implementation for creating promotional materials
  }

  private async scheduleEventResource(tenantId: string, eventId: string, resource: EventResource, start: string, end: string): Promise<void> {
    // Implementation for event resource scheduling
  }

  public getRouter(): express.Router {
    return this.router;
  }
}

export default CommunityConnectionHubService;
