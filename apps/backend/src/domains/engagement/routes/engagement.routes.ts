import { Router, Request, Response } from 'express';
import { EngagementService } from '../services/EngagementService';

const router = Router();
const engagementService = new EngagementService();

// Activity routes
router.post('/activities', async (req: Request, res: Response) => {
  try {
    const activity = await engagementService.createActivity(req.body, req.user?.id || 'system');
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/activities', async (req: Request, res: Response) => {
  try {
    const filters = {
      type: req.query.type as any,
      status: req.query.status as any,
      location: req.query.location as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      facilitatorId: req.query.facilitatorId as string,
      requiresRSVP: req.query.requiresRSVP === 'true',
      isRecurring: req.query.isRecurring === 'true',
    };
    
    const activities = await engagementService.getActivities(filters);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await engagementService.getActivity(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await engagementService.updateActivity(req.params.id, req.body, req.user?.id || 'system');
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/activities/:id/start', async (req: Request, res: Response) => {
  try {
    const activity = await engagementService.startActivity(req.params.id, req.user?.id || 'system');
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/activities/:id/complete', async (req: Request, res: Response) => {
  try {
    const activity = await engagementService.completeActivity(req.params.id, req.user?.id || 'system');
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/activities/:id/cancel', async (req: Request, res: Response) => {
  try {
    const activity = await engagementService.cancelActivity(
      req.params.id, 
      req.user?.id || 'system',
      req.body.reason
    );
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// RSVP routes
router.post('/rsvp', async (req: Request, res: Response) => {
  try {
    const rsvp = await engagementService.rsvpToActivity(req.body, req.user?.id || 'system');
    res.status(201).json(rsvp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/rsvp/:activityId/:participantId', async (req: Request, res: Response) => {
  try {
    await engagementService.cancelRSVP(req.params.activityId, req.params.participantId, req.user?.id || 'system');
    res.json({ message: 'RSVP cancelled successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Attendance routes
router.post('/attendance', async (req: Request, res: Response) => {
  try {
    const attendance = await engagementService.recordAttendance(req.body, req.user?.id || 'system');
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/attendance/activity/:activityId', async (req: Request, res: Response) => {
  try {
    const attendance = await engagementService.getActivityAttendance(req.params.activityId);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/attendance/participant/:participantId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const attendance = await engagementService.getParticipantAttendance(req.params.participantId, limit);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard routes
router.get('/dashboard/upcoming', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await engagementService.getUpcomingActivities(limit);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard/today', async (req: Request, res: Response) => {
  try {
    const activities = await engagementService.getTodaysActivities();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const metrics = await engagementService.getEngagementMetrics(startDate, endDate);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calendar routes
router.get('/calendar', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const activities = await engagementService.getActivities({
      startDate,
      endDate,
    });
    
    // Format for calendar view
    const calendarEvents = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      start: activity.startTime,
      end: activity.endTime,
      type: activity.type,
      status: activity.status,
      location: activity.specificLocation || activity.location,
      maxParticipants: activity.maxParticipants,
      currentParticipants: activity.currentParticipants,
      requiresRSVP: activity.requiresRSVP,
      facilitator: activity.facilitator?.getFullName() || '',
    }));
    
    res.json(calendarEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search routes
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const type = req.query.type as any;
    const location = req.query.location as string;
    
    const activities = await engagementService.searchActivities(query, type, location);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;