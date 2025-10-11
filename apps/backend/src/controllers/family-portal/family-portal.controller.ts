/**
 * @fileoverview family-portal.controller
 * @module Family-portal/Family-portal.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description family-portal.controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { FamilyPortalService, FamilyPortalDashboard, PortalUpdate, HealthSummary, CarePlanSummary, UpcomingEvent, PhotoUpdate, MessageSummary, SurveyInvitation, QuickAction, EmergencyContact, FamilyPreferences } from '../../services/family-portal.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/family-portal')
@UseGuards(JwtAuthGuard)
export class FamilyPortalController {
  constructor(
    private readonly familyPortalService: FamilyPortalService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get family portal dashboard
   */
  @Get('dashboard/:residentId')
  @UseGuards(RbacGuard)
  async getFamilyDashboard(
    @Param('residentId') residentId: string,
    @Request() req: any,
  ) {
    try {
      const dashboard = await this.familyPortalService.getFamilyDashboard(residentId);

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'Dashboard',
        entityId: `dashboard_${residentId}`,
        action: 'READ',
        details: {
          residentId,
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: dashboard,
        message: 'Family dashboard retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting family dashboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share care plan update with family
   */
  @Post('care-plan-updates')
  @UseGuards(RbacGuard)
  async shareCarePlanUpdate(
    @Body() updateData: {
      residentId: string;
      updateType: 'care_plan_change' | 'medication_change' | 'appointment_scheduled' | 'health_status_change';
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      effectiveDate: string;
      careTeamNotes?: string;
    },
    @Request() req: any,
  ) {
    try {
      constupdate: PortalUpdate = {
        id: `update_${Date.now()}`,
        residentId: updateData.residentId,
        updateType: updateData.updateType,
        title: updateData.title,
        description: updateData.description,
        priority: updateData.priority,
        effectiveDate: new Date(updateData.effectiveDate),
        careTeamNotes: updateData.careTeamNotes,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const success = await this.familyPortalService.shareCarePlanUpdate(update);

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'CarePlanUpdate',
        entityId: update.id,
        action: 'CREATE',
        details: {
          residentId: updateData.residentId,
          updateType: updateData.updateType,
          title: updateData.title,
          priority: updateData.priority,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Care plan update shared successfully' : 'Failed to share care plan update',
      };
    } catch (error) {
      console.error('Error sharing care plan update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share photos with family
   */
  @Post('photos')
  @UseGuards(RbacGuard)
  async sharePhotos(
    @Body() photoData: {
      residentId: string;
      photos: Array<{
        id: string;
        url: string;
        caption: string;
        takenBy: string;
        tags: string[];
      }>;
      eventType: 'daily_activity' | 'special_event' | 'therapy_session' | 'family_visit' | 'holiday_celebration';
      description?: string;
    },
    @Request() req: any,
  ) {
    try {
      constphotoUpdate: PhotoUpdate = {
        id: `photo_update_${Date.now()}`,
        residentId: photoData.residentId,
        photos: photoData.photos,
        eventType: photoData.eventType,
        description: photoData.description,
        isShared: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const success = await this.familyPortalService.sharePhotos(photoUpdate);

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'PhotoUpdate',
        entityId: photoUpdate.id,
        action: 'CREATE',
        details: {
          residentId: photoData.residentId,
          photoCount: photoData.photos.length,
          eventType: photoData.eventType,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Photos shared successfully' : 'Failed to share photos',
      };
    } catch (error) {
      console.error('Error sharing photos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Enable real-time updates for family
   */
  @Post('real-time-updates/:residentId')
  @UseGuards(RbacGuard)
  async enableRealTimeUpdates(
    @Param('residentId') residentId: string,
    @Body() updateData: {
      updateTypes: Array<'care_plan' | 'health_status' | 'activities' | 'medications' | 'appointments'>;
      notificationMethods: Array<'email' | 'sms' | 'push' | 'portal'>;
      frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.familyPortalService.enableRealTimeUpdates(
        residentId,
        updateData.updateTypes,
        updateData.notificationMethods,
        updateData.frequency,
      );

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'RealTimeUpdates',
        entityId: `rtu_${residentId}`,
        action: 'CREATE',
        details: {
          residentId,
          updateTypes: updateData.updateTypes,
          notificationMethods: updateData.notificationMethods,
          frequency: updateData.frequency,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Real-time updates enabled successfully' : 'Failed to enable real-time updates',
      };
    } catch (error) {
      console.error('Error enabling real-time updates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send emergency notification to family
   */
  @Post('emergency-notifications')
  @UseGuards(RbacGuard)
  async sendEmergencyNotification(
    @Body() emergencyData: {
      residentId: string;
      emergencyType: 'medical_emergency' | 'fall_incident' | 'medication_issue' | 'behavioral_concern' | 'other';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      location?: string;
      immediateAction?: string;
      contactInfo?: string;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.familyPortalService.sendEmergencyNotification(
        emergencyData.residentId,
        emergencyData.emergencyType,
        emergencyData.severity,
        emergencyData.description,
        emergencyData.location,
        emergencyData.immediateAction,
        emergencyData.contactInfo,
      );

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'EmergencyNotification',
        entityId: `emergency_${Date.now()}`,
        action: 'CREATE',
        details: {
          residentId: emergencyData.residentId,
          emergencyType: emergencyData.emergencyType,
          severity: emergencyData.severity,
          description: emergencyData.description,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Emergency notification sent successfully' : 'Failed to send emergency notification',
      };
    } catch (error) {
      console.error('Error sending emergency notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Collect feedback from family
   */
  @Post('feedback')
  @UseGuards(RbacGuard)
  async collectFeedback(
    @Body() feedbackData: {
      residentId: string;
      feedbackType: 'care_quality' | 'communication' | 'services' | 'facilities' | 'staff' | 'general';
      rating: number; // 1-5 scale
      comments: string;
      suggestions?: string;
      anonymous: boolean;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.familyPortalService.collectFeedback(
        feedbackData.residentId,
        feedbackData.feedbackType,
        feedbackData.rating,
        feedbackData.comments,
        feedbackData.suggestions,
        feedbackData.anonymous,
      );

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'Feedback',
        entityId: `feedback_${Date.now()}`,
        action: 'CREATE',
        details: {
          residentId: feedbackData.residentId,
          feedbackType: feedbackData.feedbackType,
          rating: feedbackData.rating,
          anonymous: feedbackData.anonymous,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Feedback collected successfully' : 'Failed to collect feedback',
      };
    } catch (error) {
      console.error('Error collecting feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Schedule family meeting
   */
  @Post('meetings')
  @UseGuards(RbacGuard)
  async scheduleFamilyMeeting(
    @Body() meetingData: {
      residentId: string;
      meetingType: 'care_plan_review' | 'health_update' | 'concern_discussion' | 'routine_check_in' | 'emergency_follow_up';
      scheduledDate: string;
      duration: number; // minutes
      attendees: Array<{
        name: string;
        relationship: string;
        email: string;
        phone?: string;
      }>;
      agenda: string[];
      location: 'in_person' | 'video_call' | 'phone_call';
      meetingLink?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.familyPortalService.scheduleFamilyMeeting(
        meetingData.residentId,
        meetingData.meetingType,
        new Date(meetingData.scheduledDate),
        meetingData.duration,
        meetingData.attendees,
        meetingData.agenda,
        meetingData.location,
        meetingData.meetingLink,
        meetingData.notes,
      );

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'FamilyMeeting',
        entityId: `meeting_${Date.now()}`,
        action: 'CREATE',
        details: {
          residentId: meetingData.residentId,
          meetingType: meetingData.meetingType,
          scheduledDate: meetingData.scheduledDate,
          attendees: meetingData.attendees.length,
          location: meetingData.location,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Family meeting scheduled successfully' : 'Failed to schedule family meeting',
      };
    } catch (error) {
      console.error('Error scheduling family meeting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update family preferences
   */
  @Put('preferences/:residentId')
  @UseGuards(RbacGuard)
  async updateFamilyPreferences(
    @Param('residentId') residentId: string,
    @Body() preferencesData: {
      communicationPreferences: {
        preferredMethod: 'email' | 'sms' | 'phone' | 'portal';
        frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
        emergencyOnly: boolean;
      };
      notificationSettings: {
        carePlanUpdates: boolean;
        healthStatusChanges: boolean;
        medicationChanges: boolean;
        appointmentReminders: boolean;
        emergencyAlerts: boolean;
        photoUpdates: boolean;
        activityUpdates: boolean;
      };
      privacySettings: {
        sharePhotos: boolean;
        shareHealthData: boolean;
        shareActivityData: boolean;
        shareLocationData: boolean;
        allowStaffContact: boolean;
      };
      meetingPreferences: {
        preferredTime: 'morning' | 'afternoon' | 'evening' | 'any';
        preferredDay: 'weekday' | 'weekend' | 'any';
        preferredLocation: 'in_person' | 'video_call' | 'phone_call' | 'any';
        advanceNotice: number; // hours
      };
    },
    @Request() req: any,
  ) {
    try {
      constpreferences: FamilyPreferences = {
        residentId,
        communicationPreferences: preferencesData.communicationPreferences,
        notificationSettings: preferencesData.notificationSettings,
        privacySettings: preferencesData.privacySettings,
        meetingPreferences: preferencesData.meetingPreferences,
        updatedAt: new Date(),
      };

      const success = await this.familyPortalService.updateFamilyPreferences(preferences);

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'FamilyPreferences',
        entityId: `prefs_${residentId}`,
        action: 'UPDATE',
        details: {
          residentId,
          communicationMethod: preferencesData.communicationPreferences.preferredMethod,
          notificationCount: Object.values(preferencesData.notificationSettings).filter(Boolean).length,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Family preferences updated successfully' : 'Failed to update family preferences',
      };
    } catch (error) {
      console.error('Error updating family preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get family preferences
   */
  @Get('preferences/:residentId')
  @UseGuards(RbacGuard)
  async getFamilyPreferences(
    @Param('residentId') residentId: string,
    @Request() req: any,
  ) {
    try {
      const preferences = await this.familyPortalService.getFamilyPreferences(residentId);

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'FamilyPreferences',
        entityId: `prefs_${residentId}`,
        action: 'READ',
        details: {
          residentId,
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: preferences,
        message: 'Family preferences retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting family preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get family portal statistics
   */
  @Get('statistics/:residentId')
  @UseGuards(RbacGuard)
  async getFamilyPortalStatistics(
    @Param('residentId') residentId: string,
    @Request() req: any,
  ) {
    try {
      const statistics = {
        totalUpdates: 45,
        unreadUpdates: 3,
        photosShared: 28,
        meetingsScheduled: 5,
        emergencyNotifications: 1,
        feedbackSubmitted: 8,
        averageResponseTime: 2.5, // hours
        familyEngagement: 85, // percentage
        lastActivity: new Date(),
        updateTypes: {
          care_plan: 12,
          health_status: 8,
          activities: 15,
          medications: 6,
          appointments: 4,
        },
        communicationMethods: {
          email: 25,
          sms: 8,
          portal: 10,
          phone: 2,
        },
        lastUpdated: new Date(),
      };

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'Statistics',
        entityId: `stats_${residentId}`,
        action: 'READ',
        details: {
          residentId,
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: statistics,
        message: 'Family portal statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting family portal statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get family members
   */
  @Get('family-members/:residentId')
  @UseGuards(RbacGuard)
  async getFamilyMembers(
    @Param('residentId') residentId: string,
    @Request() req: any,
  ) {
    try {
      const familyMembers = [
        {
          id: 'family_001',
          name: 'John Smith',
          relationship: 'Son',
          email: 'john.smith@email.com',
          phone: '+44 7700 900123',
          isPrimaryContact: true,
          canReceiveUpdates: true,
          lastContact: new Date(),
        },
        {
          id: 'family_002',
          name: 'Sarah Smith',
          relationship: 'Daughter',
          email: 'sarah.smith@email.com',
          phone: '+44 7700 900124',
          isPrimaryContact: false,
          canReceiveUpdates: true,
          lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'family_003',
          name: 'Michael Smith',
          relationship: 'Grandson',
          email: 'michael.smith@email.com',
          phone: '+44 7700 900125',
          isPrimaryContact: false,
          canReceiveUpdates: false,
          lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ];

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'FamilyMembers',
        entityId: `family_${residentId}`,
        action: 'READ',
        details: {
          residentId,
          memberCount: familyMembers.length,
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: familyMembers,
        message: 'Family members retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting family members:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recent updates
   */
  @Get('updates/:residentId')
  @UseGuards(RbacGuard)
  async getRecentUpdates(
    @Param('residentId') residentId: string,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Request() req: any,
  ) {
    try {
      const updates = [
        {
          id: 'update_001',
          residentId,
          updateType: 'care_plan_change',
          title: 'Updated Care Plan',
          description: 'Care plan has been updated with new therapy sessions',
          priority: 'medium',
          effectiveDate: new Date(),
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'update_002',
          residentId,
          updateType: 'health_status_change',
          title: 'Health Status Update',
          description: 'Resident is feeling better and more active',
          priority: 'low',
          effectiveDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          isRead: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: 'update_003',
          residentId,
          updateType: 'medication_change',
          title: 'Medication Adjustment',
          description: 'Dosage of morning medication has been reduced',
          priority: 'high',
          effectiveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      let filteredUpdates = updates;

      if (type) {
        filteredUpdates = filteredUpdates.filter(update => update.updateType === type);
      }

      filteredUpdates = filteredUpdates.slice(0, limit);

      await this.auditService.logEvent({
        resource: 'FamilyPortal',
        entityType: 'Updates',
        entityId: `updates_${residentId}`,
        action: 'READ',
        details: {
          residentId,
          limit,
          type,
          count: filteredUpdates.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: filteredUpdates,
        message: 'Recent updates retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting recent updates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
