import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ActivityWellbeingService } from '../../services/activities/ActivityWellbeingService';
import { ActivityType, ActivityCategory } from '../../entities/activities/Activity';

/**
 * Controller #12: Activity & Wellbeing
 * 
 * 11 endpoints for activity coordination and wellbeing tracking
 */
export class ActivityWellbeingController {
  const ructor(private activityService: ActivityWellbeingService) {}

  /**
   * POST /activities
   * Create new activity
   */
  async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const activity = await this.activityService.createActivity({
        ...req.body,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: activity,
        message: 'Activity created successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create activity',
      });
    }
  }

  /**
   * GET /activities/:id
   * Get activity by ID
   */
  async getActivityById(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const activity = await this.activityService.getActivityById(req.params.id, organizationId);

      if (!activity) {
        res.status(404).json({
          success: false,
          error: 'Activity not found',
        });
        return;
      }

      res.json({
        success: true,
        data: activity,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve activity',
      });
    }
  }

  /**
   * GET /activities
   * List activities with filtering
   */
  async getActivities(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.activityType) filters.activityType = req.query.activityType;
      if (req.query.activityCategory) filters.activityCategory = req.query.activityCategory;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await this.activityService.getActivities(organizationId, filters, page, limit);

      res.json({
        success: true,
        data: result.activities,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve activities',
      });
    }
  }

  /**
   * PUT /activities/:id
   * Update activity
   */
  async updateActivity(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.body.organizationId;
      const activity = await this.activityService.updateActivity(req.params.id, organizationId, req.body);

      res.json({
        success: true,
        data: activity,
        message: 'Activity updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update activity',
      });
    }
  }

  /**
   * DELETE /activities/:id
   * Delete activity
   */
  async deleteActivity(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      await this.activityService.deleteActivity(req.params.id, organizationId);

      res.json({
        success: true,
        message: 'Activity deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete activity',
      });
    }
  }

  /**
   * POST /activities/attendance
   * Record attendance
   */
  async recordAttendance(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const attendance = await this.activityService.recordAttendance({
        ...req.body,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: attendance,
        message: 'Attendance recorded successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record attendance',
      });
    }
  }

  /**
   * GET /activities/:id/attendance
   * Get attendance by activity
   */
  async getAttendanceByActivity(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const attendance = await this.activityService.getAttendanceByActivity(req.params.id, organizationId);

      res.json({
        success: true,
        data: attendance,
        count: attendance.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve attendance',
      });
    }
  }

  /**
   * GET /activities/resident/:residentId/attendance
   * Get attendance by resident
   */
  async getAttendanceByResident(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const days = parseInt(req.query.days as string) || 30;

      const attendance = await this.activityService.getAttendanceByResident(
        req.params.residentId,
        organizationId,
        days
      );

      res.json({
        success: true,
        data: attendance,
        count: attendance.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve attendance',
      });
    }
  }

  /**
   * GET /activities/upcoming
   * Get upcoming activities
   */
  async getUpcomingActivities(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const days = parseInt(req.query.days as string) || 7;

      const activities = await this.activityService.getUpcomingActivities(organizationId, days);

      res.json({
        success: true,
        data: activities,
        count: activities.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve upcoming activities',
      });
    }
  }

  /**
   * GET /activities/participation-stats
   * Get participation statistics
   */
  async getParticipationStats(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const stats = await this.activityService.getParticipationStats(organizationId, startDate, endDate);

      res.json({
        success: true,
        data: stats,
        period: {
          startDate,
          endDate,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve participation stats',
      });
    }
  }

  /**
   * GET /activities/wellbeing-trends/:residentId
   * Get wellbeing trends
   */
  async getWellbeingTrends(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const months = parseInt(req.query.months as string) || 6;

      const trends = await this.activityService.getWellbeingTrends(req.params.residentId, organizationId, months);

      res.json({
        success: true,
        data: trends,
        metadata: {
          residentId: req.params.residentId,
          months,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve wellbeing trends',
      });
    }
  }

  /**
   * GET /activities/statistics
   * Get activity statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const statistics = await this.activityService.getStatistics(organizationId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve statistics',
      });
    }
  }
}

/**
 * Validation rules
 */

export const createActivityValidation = [
  body('activityName').notEmpty().withMessage('Activity name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('activityType').isIn(Object.values(ActivityType)).withMessage('Invalid activity type'),
  body('activityCategory').isIn(Object.values(ActivityCategory)).withMessage('Invalid activity category'),
  body('scheduledDate').isISO8601().withMessage('Invalid scheduled date'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('location').notEmpty().withMessage('Location is required'),
  body('facilitatorId').notEmpty().withMessage('Facilitator is required'),
];

export const recordAttendanceValidation = [
  body('activityId').notEmpty().withMessage('Activity ID is required'),
  body('residentId').notEmpty().withMessage('Resident ID is required'),
  body('attended').isBoolean().withMessage('Attended must be a boolean'),
  body('participationLevel')
    .isIn(['full', 'partial', 'observer', 'declined'])
    .withMessage('Invalid participation level'),
  body('enjoymentLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Enjoyment level must be 1-5'),
  body('engagementLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Engagement level must be 1-5'),
  body('recordedBy').notEmpty().withMessage('Recorded by is required'),
];
