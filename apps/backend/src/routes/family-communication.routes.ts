import { Router } from 'express';
import { DataSource } from 'typeorm';
import {
  FamilyCommunicationController,
  createFamilyMemberValidation,
  updateFamilyMemberValidation,
  createMessageValidation,
  createVisitValidation
} from '../controllers/family/FamilyCommunicationController';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantIsolation } from '../middleware/tenant-isolation.middleware';

/**
 * Service #9: Family Communication Routes
 * 
 * Factory function that creates family communication routes
 * All routes require authentication and tenant isolation
 */
export function createFamilyCommunicationRoutes(dataSource: DataSource): Router {
  const router = Router();
  const controller = new FamilyCommunicationController(dataSource);

  // Apply authentication and tenant isolation to all routes
  router.use(authenticateToken);
  router.use(tenantIsolation);

  /**
   * FAMILY MEMBER ROUTES
   */

  router.post(
    '/family-members',
    createFamilyMemberValidation,
    (req, res) => controller.createFamilyMember(req, res)
  );

  router.get(
    '/family-members/statistics',
    (req, res) => controller.getStatistics(req, res)
  );

  router.get(
    '/family-members/resident/:residentId',
    (req, res) => controller.getFamilyByResident(req, res)
  );

  router.get(
    '/family-members/:id',
    (req, res) => controller.getFamilyMember(req, res)
  );

  router.get(
    '/family-members',
    (req, res) => controller.getAllFamilyMembers(req, res)
  );

  router.put(
    '/family-members/:id',
    updateFamilyMemberValidation,
    (req, res) => controller.updateFamilyMember(req, res)
  );

  router.delete(
    '/family-members/:id',
    (req, res) => controller.deleteFamilyMember(req, res)
  );

  router.post(
    '/family-members/verify/:token',
    (req, res) => controller.verifyFamilyMember(req, res)
  );

  /**
   * MESSAGE ROUTES
   */

  router.post(
    '/messages',
    createMessageValidation,
    (req, res) => controller.createMessage(req, res)
  );

  router.get(
    '/messages/family/:familyId/unread',
    (req, res) => controller.getUnreadMessages(req, res)
  );

  router.get(
    '/messages/:id',
    (req, res) => controller.getMessage(req, res)
  );

  router.get(
    '/messages',
    (req, res) => controller.getAllMessages(req, res)
  );

  router.post(
    '/messages/:id/read',
    (req, res) => controller.markMessageAsRead(req, res)
  );

  router.post(
    '/messages/:id/acknowledge',
    (req, res) => controller.acknowledgeMessage(req, res)
  );

  /**
   * VISIT REQUEST ROUTES
   */

  router.post(
    '/visits',
    createVisitValidation,
    (req, res) => controller.createVisitRequest(req, res)
  );

  router.get(
    '/visits/upcoming',
    (req, res) => controller.getUpcomingVisits(req, res)
  );

  router.get(
    '/visits/pending',
    (req, res) => controller.getPendingVisits(req, res)
  );

  router.get(
    '/visits/:id',
    (req, res) => controller.getVisitRequest(req, res)
  );

  router.get(
    '/visits',
    (req, res) => controller.getAllVisitRequests(req, res)
  );

  router.post(
    '/visits/:id/approve',
    (req, res) => controller.approveVisit(req, res)
  );

  router.post(
    '/visits/:id/deny',
    (req, res) => controller.denyVisit(req, res)
  );

  router.post(
    '/visits/:id/cancel',
    (req, res) => controller.cancelVisit(req, res)
  );

  router.post(
    '/visits/:id/reschedule',
    (req, res) => controller.rescheduleVisit(req, res)
  );

  router.post(
    '/visits/:id/complete',
    (req, res) => controller.completeVisit(req, res)
  );

  return router;
}
