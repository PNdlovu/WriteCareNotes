/**
 * @fileoverview activities therapy Controller
 * @module Activities/ActivitiesTherapyController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description activities therapy Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { ActivitiesTherapyService, ActivitySearchCriteria } from '../../services/activities/ActivitiesTherapyService';
import { Activity } from '../../entities/activities/Activity';

export class ActivitiesTherapyController {
  privateactivitiesService: ActivitiesTherapyService;

  const ructor() {
    this.activitiesService = new ActivitiesTherapyService();
  }

  // Activity Management
  async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const activityData = req.body as Partial<Activity>;
      const activity = await this.activitiesService.createActivity(activityData);
      
      res.status(201).json({
        success: true,
        message: 'Activity created successfully',
        data: activity
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create activity',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAllActivities(req: Request, res: Response): Promise<void> {
    try {
      const activities = await this.activitiesService.getAllActivities();
      
      res.json({
        success: true,
        data: activities,
        total: activities.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activities',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getTodaysActivities(req: Request, res: Response): Promise<void> {
    try {
      const activities = await this.activitiesService.getTodaysActivities();
      
      res.json({
        success: true,
        data: activities,
        total: activities.length,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve today\'s activities',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async searchActivities(req: Request, res: Response): Promise<void> {
    try {
      const criteria: ActivitySearchCriteria = {
        activityType: req.query['activityType'] as any,
        category: req.query['category'] as any,
        facilitator: req.query['facilitator'] as string,
        date: req.query['date'] ? new Date(req.query['date'] as string) : undefined,
        location: req.query['location'] as string,
        status: req.query['status'] as string
      };

      const activities = await this.activitiesService.searchActivities(criteria);
      
      res.json({
        success: true,
        data: activities,
        total: activities.length,
        criteria
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to search activities',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Activity Execution
  async startActivity(req: Request, res: Response): Promise<void> {
    try {
      const { activityId } = req.params;
      if (!activityId) {
        res.status(400).json({ error: 'Activity ID is required' });
        return;
      }
      await this.activitiesService.startActivity(activityId);
      
      res.json({
        success: true,
        message: 'Activity started successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to start activity',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async completeActivity(req: Request, res: Response): Promise<void> {
    try {
      const { activityId } = req.params;
      if (!activityId) {
        res.status(400).json({ error: 'Activity ID is required' });
        return;
      }
      const { sessionNotes } = req.body;
      
      await this.activitiesService.completeActivity(activityId, sessionNotes);
      
      res.json({
        success: true,
        message: 'Activity completed successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete activity',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async cancelActivity(req: Request, res: Response): Promise<void> {
    try {
      const { activityId } = req.params;
      if (!activityId) {
        res.status(400).json({ error: 'Activity ID is required' });
        return;
      }
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Cancellation reason is required'
        });
        return;
      }

      await this.activitiesService.cancelActivity(activityId, reason);
      
      res.json({
        success: true,
        message: 'Activity cancelled successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to cancel activity',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Participation Management
  async addParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { activityId, residentId } = req.params;
      if (!activityId || !residentId) {
        res.status(400).json({ error: 'Activity ID and Resident ID are required' });
        return;
      }
      await this.activitiesService.addParticipant(activityId, residentId);
      
      res.json({
        success: true,
        message: 'Participant added successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to add participant',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { activityId, residentId } = req.params;
      if (!activityId || !residentId) {
        res.status(400).json({ error: 'Activity ID and Resident ID are required' });
        return;
      }
      await this.activitiesService.removeParticipant(activityId, residentId);
      
      res.json({
        success: true,
        message: 'Participant removed successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to remove participant',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async recordOutcome(req: Request, res: Response): Promise<void> {
    try {
      const { activityId } = req.params;
      if (!activityId) {
        res.status(400).json({ error: 'Activity ID is required' });
        return;
      }
      const outcome = req.body;
      
      await this.activitiesService.recordParticipationOutcome(activityId, outcome);
      
      res.json({
        success: true,
        message: 'Participation outcome recorded successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to record participation outcome',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Analytics
  async getTherapyAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.activitiesService.getTherapyAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve therapy analytics',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getResidentActivityProfile(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      if (!residentId) {
        res.status(400).json({ error: 'Resident ID is required' });
        return;
      }
      const profile = await this.activitiesService.getResidentActivityProfile(residentId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve resident activity profile',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Planning
  async planActivitiesForWeek(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : new Date();
      const weekPlan = await this.activitiesService.planActivitiesForWeek(startDate);
      
      res.json({
        success: true,
        data: weekPlan,
        startDate
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to plan activities for week',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async checkResourceAvailability(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
      const timeSlot = req.query['timeSlot'] as string || '10:00';
      
      const availability = await this.activitiesService.checkResourceAvailability(date, timeSlot);
      
      res.json({
        success: true,
        data: availability
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to check resource availability',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Therapy Session Management
  async createTherapySession(req: Request, res: Response): Promise<void> {
    try {
      const sessionData = req.body;
      const session = await this.activitiesService.createTherapySession(sessionData);
      
      res.status(201).json({
        success: true,
        message: 'Therapy session created successfully',
        data: session
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create therapy session',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getTherapySessionsByResident(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      if (!residentId) {
        res.status(400).json({ error: 'Resident ID is required' });
        return;
      }
      const sessions = await this.activitiesService.getTherapySessionsByResident(residentId);
      
      res.json({
        success: true,
        data: sessions,
        total: sessions.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve therapy sessions',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getTherapySessionsByTherapist(req: Request, res: Response): Promise<void> {
    try {
      const { therapistId } = req.params;
      if (!therapistId) {
        res.status(400).json({
          success: false,
          message: 'Therapist ID is required'
        });
        return;
      }
      const sessions = await this.activitiesService.getTherapySessionsByTherapist(therapistId);
      
      res.json({
        success: true,
        data: sessions,
        total: sessions.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve therapist sessions',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getTherapySessionById(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
        return;
      }
      const session = await this.activitiesService.getTherapySessionById(sessionId);
      
      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Therapy session not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: session
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve therapy session',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async startTherapySession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
        return;
      }
      await this.activitiesService.startTherapySession(sessionId);
      
      res.json({
        success: true,
        message: 'Therapy session started successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to start therapy session',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async completeTherapySession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
        return;
      }
      const { sessionOutcome } = req.body;
      
      await this.activitiesService.completeTherapySession(sessionId, sessionOutcome);
      
      res.json({
        success: true,
        message: 'Therapy session completed successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete therapy session',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async cancelTherapySession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
        return;
      }
      const { reason } = req.body;
      
      await this.activitiesService.cancelTherapySession(sessionId, reason);
      
      res.json({
        success: true,
        message: 'Therapy session cancelled successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to cancel therapy session',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async updateTherapyGoalProgress(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, goalId } = req.params;
      if (!sessionId || !goalId) {
        res.status(400).json({
          success: false,
          message: 'Session ID and Goal ID are required'
        });
        return;
      }
      const { progress } = req.body;
      
      await this.activitiesService.updateTherapyGoalProgress(sessionId, goalId, progress);
      
      res.json({
        success: true,
        message: 'Therapy goal progress updated successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to update therapy goal progress',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async recordSafetyIncident(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
        return;
      }
      const incident = req.body;
      
      await this.activitiesService.recordSafetyIncident(sessionId, incident);
      
      res.json({
        success: true,
        message: 'Safety incident recorded successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to record safety incident',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getTherapyProgressReport(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      if (!residentId) {
        res.status(400).json({
          success: false,
          message: 'Resident ID is required'
        });
        return;
      }
      const therapyType = req.query['therapyType'] as string;
      
      const report = await this.activitiesService.getTherapyProgressReport(residentId, therapyType as any);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve therapy progress report',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getTherapistWorkload(req: Request, res: Response): Promise<void> {
    try {
      const { therapistId } = req.params;
      if (!therapistId) {
        res.status(400).json({
          success: false,
          message: 'Therapist ID is required'
        });
        return;
      }
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : new Date();
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const workload = await this.activitiesService.getTherapistWorkload(therapistId, startDate, endDate);
      
      res.json({
        success: true,
        data: workload
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve therapist workload',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
