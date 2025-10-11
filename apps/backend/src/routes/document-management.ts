import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Document Management Routes
 * @module DocumentManagementRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Enterprise document management routes with AI-powered analysis,
 * version control, and comprehensive compliance validation.
 */

import { Router } from 'express';
import { DocumentManagementController } from '../controllers/document/DocumentManagementController';
import { authMiddleware } from '../middleware/auth-middleware';
import { roleCheckMiddleware } from '../middleware/role-check-middleware';
import { tenantMiddleware } from '../middleware/tenant-middleware';
import { validationMiddleware } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware';
import { fileUploadMiddleware } from '../middleware/file-upload-middleware';

const router = Router();
const documentController = new DocumentManagementController();

// Apply middleware stack
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(auditMiddleware);
router.use(rateLimitMiddleware);

/**
 * @route POST /api/v1/document-management/upload
 * @description Upload and process document with AI analysis
 * @access MANAGER, QUALITY_MANAGER, ADMIN, DOCUMENT_COORDINATOR
 */
router.post('/upload',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN', 'DOCUMENT_COORDINATOR']),
  fileUploadMiddleware,
  validationMiddleware('createDocument'),
  documentController.uploadDocument
);

/**
 * @route GET /api/v1/document-management
 * @description Get documents with advanced filtering
 * @access MANAGER, QUALITY_MANAGER, ADMIN, DOCUMENT_COORDINATOR, STAFF
 */
router.get('/',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN', 'DOCUMENT_COORDINATOR', 'STAFF']),
  documentController.getDocuments
);

/**
 * @route GET /api/v1/document-management/:id
 * @description Get document by ID
 * @access MANAGER, QUALITY_MANAGER, ADMIN, DOCUMENT_COORDINATOR, STAFF
 */
router.get('/:id',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN', 'DOCUMENT_COORDINATOR', 'STAFF']),
  documentController.getDocumentById
);

/**
 * @route PUT /api/v1/document-management/:id
 * @description Update document with version control
 * @access MANAGER, QUALITY_MANAGER, ADMIN, DOCUMENT_COORDINATOR
 */
router.put('/:id',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN', 'DOCUMENT_COORDINATOR']),
  validationMiddleware('updateDocument'),
  documentController.updateDocument
);

/**
 * @route POST /api/v1/document-management/:id/approve
 * @description Approve document for publication
 * @access MANAGER, QUALITY_MANAGER, ADMIN
 */
router.post('/:id/approve',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN']),
  validationMiddleware('approveDocument'),
  documentController.approveDocument
);

/**
 * @route GET /api/v1/document-management/analytics/dashboard
 * @description Get document analytics dashboard
 * @access MANAGER, QUALITY_MANAGER, ADMIN
 */
router.get('/analytics/dashboard',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN']),
  documentController.getDocumentAnalytics
);

/**
 * @route POST /api/v1/document-management/:id/version
 * @description Create new document version
 * @access MANAGER, QUALITY_MANAGER, ADMIN, DOCUMENT_COORDINATOR
 */
router.post('/:id/version',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN', 'DOCUMENT_COORDINATOR']),
  fileUploadMiddleware,
  validationMiddleware('createDocumentVersion'),
  documentController.createDocumentVersion
);

/**
 * @route DELETE /api/v1/document-management/:id
 * @description Archive document with retention policy
 * @access MANAGER, QUALITY_MANAGER, ADMIN
 */
router.delete('/:id',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN']),
  validationMiddleware('archiveDocument'),
  documentController.archiveDocument
);

/**
 * @route POST /api/v1/document-management/search/semantic
 * @description Advanced AI-powered semantic search
 * @access MANAGER, QUALITY_MANAGER, ADMIN, DOCUMENT_COORDINATOR, STAFF
 */
router.post('/search/semantic',
  roleCheckMiddleware(['MANAGER', 'QUALITY_MANAGER', 'ADMIN', 'DOCUMENT_COORDINATOR', 'STAFF']),
  validationMiddleware('semanticSearch'),
  documentController.semanticSearch
);

export default router;
