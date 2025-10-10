/**
 * Children Routes
 * Routes configuration for children and young persons care
 */

import { Router } from 'express';
import { ChildProfileController } from '../controllers/ChildProfileController';

const router = Router();
const controller = new ChildProfileController(null); // Will be injected by DI container

// Child Profile Management
router.post('/children', (req, res) => controller.createChild(req.body, req));
router.get('/children/:id', (req, res) => controller.getChild(req.params.id));
router.put('/children/:id', (req, res) => controller.updateChild(req.params.id, req.body, req));
router.delete('/children/:id', (req, res) => controller.deleteChild(req.params.id, req));
router.get('/children', (req, res) => controller.listChildren(req.query, req));

// Child Placement Operations
router.post('/children/:id/admit', (req, res) => controller.admitChild(req.params.id, req.body, req));
router.post('/children/:id/discharge', (req, res) => controller.dischargeChild(req.params.id, req.body, req));
router.post('/children/:id/transfer', (req, res) => controller.transferChild(req.params.id, req.body, req));

// Child Timeline and Alerts
router.get('/children/:id/timeline', (req, res) => controller.getChildTimeline(req.params.id));
router.get('/children/:id/alerts', (req, res) => controller.getChildAlerts(req.params.id));

// Legal Status
router.put('/children/:id/legal-status', (req, res) => controller.updateLegalStatus(req.params.id, req.body, req));

// Missing Child Protocol
router.post('/children/:id/missing', (req, res) => controller.markAsMissing(req.params.id, req));
router.post('/children/:id/returned', (req, res) => controller.markAsReturned(req.params.id, req));

// Reports and Statistics
router.get('/children/statistics', (req, res) => controller.getStatistics(req.query.organizationId, req));
router.get('/children/overdue-reviews', (req, res) => controller.getOverdueReviews(req.query.organizationId, req));
router.get('/children/urgent-attention', (req, res) => controller.getUrgentAttention(req.query.organizationId, req));

export default router;
