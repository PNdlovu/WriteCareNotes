import { Router } from 'express';
import { DataSource } from 'typeorm';
import {
  ActivityWellbeingController,
  createActivityValidation,
  recordAttendanceValidation,
} from '../../controllers/activities/ActivityWellbeingController';
import { ActivityWellbeingService } from '../../services/activities/ActivityWellbeingService';
import { authenticateToken } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';

/**
 * Factory function to create activity & wellbeing routes with DataSource injection
 */
export function createActivityWellbeingRoutes(dataSource: DataSource): Router {
  const router = Router();
  const activityService = new ActivityWellbeingService(dataSource);
  const activityController = new ActivityWellbeingController(activityService);

  // Apply authentication and tenant isolation middleware to all routes
  router.use(authenticateToken);
  router.use(tenantIsolation);

  /**
   * POST /activities
   * Create new activity
   */
  router.post('/', createActivityValidation, (req, res) => activityController.createActivity(req, res));

  /**
   * GET /activities/:id
   * Get activity by ID
   */
  router.get('/:id', (req, res) => activityController.getActivityById(req, res));

  /**
   * GET /activities
   * List all activities with filtering
   * Query params: activityType, activityCategory, startDate, endDate, page, limit
   */
  router.get('/', (req, res) => activityController.getActivities(req, res));

  /**
   * PUT /activities/:id
   * Update activity
   */
  router.put('/:id', (req, res) => activityController.updateActivity(req, res));

  /**
   * DELETE /activities/:id
   * Delete activity
   */
  router.delete('/:id', (req, res) => activityController.deleteActivity(req, res));

  /**
   * POST /activities/attendance
   * Record attendance
   */
  router.post('/attendance', recordAttendanceValidation, (req, res) => activityController.recordAttendance(req, res));

  /**
   * GET /activities/:id/attendance
   * Get attendance by activity
   */
  router.get('/:id/attendance', (req, res) => activityController.getAttendanceByActivity(req, res));

  /**
   * GET /activities/resident/:residentId/attendance
   * Get attendance by resident
   * Query params: days
   */
  router.get('/resident/:residentId/attendance', (req, res) =>
    activityController.getAttendanceByResident(req, res)
  );

  /**
   * GET /activities/upcoming
   * Get upcoming activities
   * Query params: days
   */
  router.get('/upcoming', (req, res) => activityController.getUpcomingActivities(req, res));

  /**
   * GET /activities/participation-stats
   * Get participation statistics
   * Query params: startDate, endDate
   */
  router.get('/participation-stats', (req, res) => activityController.getParticipationStats(req, res));

  /**
   * GET /activities/wellbeing-trends/:residentId
   * Get wellbeing trends for resident
   * Query params: months
   */
  router.get('/wellbeing-trends/:residentId', (req, res) => activityController.getWellbeingTrends(req, res));

  /**
   * GET /activities/statistics
   * Get activity statistics
   */
  router.get('/statistics', (req, res) => activityController.getStatistics(req, res));

  return router;
}
