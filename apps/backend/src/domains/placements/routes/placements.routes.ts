/**
 * Placement Routes
 * Routes configuration for placement management
 */

import { Router } from 'express';
import { PlacementController } from '../controllers/PlacementController';

const router = Router();
const controller = new PlacementController(null, null); // Will be injected by DI container

// Placement Management
router.post('/placements', (req, res) => controller.createPlacement(req.body, req));
router.get('/placements/:id', (req, res) => controller.getPlacement(req.params.id));
router.put('/placements/:id', (req, res) => controller.updatePlacement(req.params.id, req.body, req));
router.post('/placements/:id/activate', (req, res) => controller.activatePlacement(req.params.id, req));
router.post('/placements/:id/end', (req, res) => controller.endPlacement(req.params.id, req.body, req));
router.post('/placements/:id/breakdown', (req, res) => controller.markAsBreakdown(req.params.id, req.body, req));

// Placement Queries
router.get('/placements/child/:childId', (req, res) => controller.getPlacementsByChild(req.params.childId));
router.get('/placements/organization/:orgId/active', (req, res) => controller.getActivePlacements(req.params.orgId));
router.get('/placements/organization/:orgId/overdue-72hr-reviews', (req, res) => controller.getOverdue72HourReviews(req.params.orgId));
router.get('/placements/organization/:orgId/overdue-reviews', (req, res) => controller.getOverduePlacementReviews(req.params.orgId));
router.get('/placements/organization/:orgId/at-risk', (req, res) => controller.getPlacementsAtRisk(req.params.orgId));
router.get('/placements/organization/:orgId/statistics', (req, res) => controller.getPlacementStatistics(req.params.orgId));

// Placement Requests
router.post('/placements/requests', (req, res) => controller.createPlacementRequest(req.body, req));
router.get('/placements/requests/:id', (req, res) => controller.getPlacementRequest(req.params.id));
router.put('/placements/requests/:id/status', (req, res) => controller.updateRequestStatus(req.params.id, req.body, req));
router.post('/placements/requests/:id/match', (req, res) => controller.matchPlacementRequest(req.params.id, req.body, req));
router.get('/placements/requests/:id/find-matches', (req, res) => controller.findMatches(req.params.id));
router.get('/placements/requests/urgent', (req, res) => controller.getUrgentRequests());
router.get('/placements/requests/overdue', (req, res) => controller.getOverdueRequests());

// Placement Reviews
router.post('/placements/:id/reviews', (req, res) => controller.createReview(req.params.id, req.body, req));
router.put('/placements/reviews/:reviewId/complete', (req, res) => controller.completeReview(req.params.reviewId, req.body, req));

export default router;
