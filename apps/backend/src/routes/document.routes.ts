import { Router } from 'express';
import { DataSource } from 'typeorm';
import { 
  SimpleDocumentController,
  createDocumentValidation,
  updateDocumentValidation,
  createVersionValidation,
  approvalValidation
} from '../controllers/document/SimpleDocumentController';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantIsolation } from '../middleware/tenant-isolation.middleware';

/**
 * Service #8: Document Management Routes
 * 
 * Factory function that creates document routes with middleware chains
 * All routes require authentication and tenant isolation
 */
export function createDocumentRoutes(dataSource: DataSource): Router {
  const router = Router();
  const controller = new SimpleDocumentController(dataSource);

  // Apply authentication and tenant isolation to all routes
  router.use(authenticateToken);
  router.use(tenantIsolation);

  /**
   * POST /documents
   * Create a new document
   */
  router.post(
    '/',
    createDocumentValidation,
    (req, res) => controller.createDocument(req, res)
  );

  /**
   * GET /documents/statistics
   * Get document statistics
   * Note: Must be before /:id route to avoid conflicts
   */
  router.get(
    '/statistics',
    (req, res) => controller.getStatistics(req, res)
  );

  /**
   * GET /documents/expiring
   * Get documents expiring soon
   */
  router.get(
    '/expiring',
    (req, res) => controller.getExpiringSoon(req, res)
  );

  /**
   * GET /documents/expired
   * Get expired documents
   */
  router.get(
    '/expired',
    (req, res) => controller.getExpired(req, res)
  );

  /**
   * GET /documents/legal
   * Get legal requirement documents
   */
  router.get(
    '/legal',
    (req, res) => controller.getLegalDocuments(req, res)
  );

  /**
   * GET /documents/type/:type
   * Get documents by type
   */
  router.get(
    '/type/:type',
    (req, res) => controller.getByType(req, res)
  );

  /**
   * GET /documents/:id
   * Get document by ID
   */
  router.get(
    '/:id',
    (req, res) => controller.getDocument(req, res)
  );

  /**
   * GET /documents
   * Get all documents with filtering and pagination
   */
  router.get(
    '/',
    (req, res) => controller.getAllDocuments(req, res)
  );

  /**
   * PUT /documents/:id
   * Update document
   */
  router.put(
    '/:id',
    updateDocumentValidation,
    (req, res) => controller.updateDocument(req, res)
  );

  /**
   * DELETE /documents/:id
   * Delete document (soft delete)
   */
  router.delete(
    '/:id',
    (req, res) => controller.deleteDocument(req, res)
  );

  /**
   * POST /documents/:id/versions
   * Create new version
   */
  router.post(
    '/:id/versions',
    createVersionValidation,
    (req, res) => controller.createVersion(req, res)
  );

  /**
   * POST /documents/:id/submit
   * Submit document for review
   */
  router.post(
    '/:id/submit',
    (req, res) => controller.submitForReview(req, res)
  );

  /**
   * POST /documents/:id/approve
   * Approve document
   */
  router.post(
    '/:id/approve',
    approvalValidation,
    (req, res) => controller.approveDocument(req, res)
  );

  /**
   * POST /documents/:id/publish
   * Publish document
   */
  router.post(
    '/:id/publish',
    (req, res) => controller.publishDocument(req, res)
  );

  /**
   * POST /documents/:id/archive
   * Archive document
   */
  router.post(
    '/:id/archive',
    (req, res) => controller.archiveDocument(req, res)
  );

  /**
   * GET /documents/:documentId/history
   * Get version history
   */
  router.get(
    '/:documentId/history',
    (req, res) => controller.getVersionHistory(req, res)
  );

  /**
   * POST /documents/:id/restore
   * Restore soft-deleted document
   */
  router.post(
    '/:id/restore',
    (req, res) => controller.restoreDocument(req, res)
  );

  return router;
}
