import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { body, param, query, validationResult } from 'express-validator';
import { 
  SimpleDocumentService, 
  CreateDocumentDTO, 
  UpdateDocumentDTO, 
  CreateVersionDTO, 
  ApprovalDTO,
  DocumentFilters 
} from '../../services/document/SimpleDocumentService';
import { DocumentType, DocumentStatus } from '../../entities/document/DocumentManagement';

/**
 * Service #8: Simple Document Controller
 * 
 * HTTP API layer for document management with:
 * - Document CRUD operations
 * - Version control
 * - Workflow management (submit → review → approve → publish)
 * - Search and filtering
 * - Expiry tracking
 * - Statistics
 */
export class SimpleDocumentController {
  privatedocumentService: SimpleDocumentService;

  constructor(private dataSource: DataSource) {
    this.documentService = new SimpleDocumentService(dataSource);
  }

  /**
   * POST /documents
   * Create a new document
   */
  async createDocument(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const organizationId = (req as any).organizationId;
      if (!organizationId) {
        return res.status(400).json({ success: false, error: 'Organization ID is required' });
      }

      constdto: CreateDocumentDTO = {
        ...req.body,
        organizationId,
      };

      const document = await this.documentService.create(dto);

      return res.status(201).json({
        success: true,
        data: document,
        message: 'Document created successfully',
      });
    } catch (error: any) {
      console.error('Error creating document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /documents/:id
   * Get document by ID
   */
  async getDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const document = await this.documentService.findById(id, organizationId);

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      return res.json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      console.error('Error fetching document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /documents
   * Get all documents with filtering and pagination
   */
  async getAllDocuments(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      constfilters: DocumentFilters = {};

      if (req.query.documentType) {
        filters.documentType = req.query.documentType as DocumentType;
      }
      if (req.query.status) {
        filters.status = req.query.status as DocumentStatus;
      }
      if (req.query.department) {
        filters.department = req.query.department as string;
      }
      if (req.query.confidentialityLevel) {
        filters.confidentialityLevel = req.query.confidentialityLevel as any;
      }
      if (req.query.legalRequirement !== undefined) {
        filters.legalRequirement = req.query.legalRequirement === 'true';
      }
      if (req.query.tags) {
        filters.tags = Array.isArray(req.query.tags) 
          ? req.query.tags as string[]
          : [req.query.tags as string];
      }
      if (req.query.searchTerm) {
        filters.searchTerm = req.query.searchTerm as string;
      }

      const result = await this.documentService.findAll(organizationId, filters, page, limit);

      return res.json({
        success: true,
        data: result.documents,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * PUT /documents/:id
   * Update document
   */
  async updateDocument(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      constdto: UpdateDocumentDTO = req.body;

      const document = await this.documentService.update(id, organizationId, dto);

      return res.json({
        success: true,
        data: document,
        message: 'Document updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * DELETE /documents/:id
   * Delete document (soft delete)
   */
  async deleteDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      await this.documentService.delete(id, organizationId);

      return res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /documents/:id/versions
   * Create new version
   */
  async createVersion(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      constdto: CreateVersionDTO = req.body;

      const document = await this.documentService.createNewVersion(id, organizationId, dto);

      return res.status(201).json({
        success: true,
        data: document,
        message: 'New document version created successfully',
      });
    } catch (error: any) {
      console.error('Error creating document version:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /documents/:id/submit
   * Submit for review
   */
  async submitForReview(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const document = await this.documentService.submitForReview(id, organizationId);

      return res.json({
        success: true,
        data: document,
        message: 'Document submitted for review',
      });
    } catch (error: any) {
      console.error('Error submitting document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /documents/:id/approve
   * Approve document
   */
  async approveDocument(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      constdto: ApprovalDTO = req.body;

      const document = await this.documentService.approve(id, organizationId, dto);

      return res.json({
        success: true,
        data: document,
        message: 'Document approved successfully',
      });
    } catch (error: any) {
      console.error('Error approving document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /documents/:id/publish
   * Publish document
   */
  async publishDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const document = await this.documentService.publish(id, organizationId);

      return res.json({
        success: true,
        data: document,
        message: 'Document published successfully',
      });
    } catch (error: any) {
      console.error('Error publishing document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /documents/:id/archive
   * Archive document
   */
  async archiveDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const document = await this.documentService.archive(id, organizationId);

      return res.json({
        success: true,
        data: document,
        message: 'Document archived successfully',
      });
    } catch (error: any) {
      console.error('Error archiving document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /documents/:documentId/history
   * Get version history
   */
  async getVersionHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { documentId } = req.params;
      const organizationId = (req as any).organizationId;

      const history = await this.documentService.getVersionHistory(documentId, organizationId);

      return res.json({
        success: true,
        data: history,
        message: `Found ${history.length} versions`,
      });
    } catch (error: any) {
      console.error('Error fetching version history:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /documents/expiring
   * Get documents expiring soon
   */
  async getExpiringSoon(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;
      const daysAhead = parseInt(req.query.daysAhead as string) || 30;

      const documents = await this.documentService.getExpiringSoon(organizationId, daysAhead);

      return res.json({
        success: true,
        data: documents,
        message: `Found ${documents.length} documents expiring within ${daysAhead} days`,
      });
    } catch (error: any) {
      console.error('Error fetching expiring documents:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /documents/expired
   * Get expired documents
   */
  async getExpired(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;

      const documents = await this.documentService.getExpired(organizationId);

      return res.json({
        success: true,
        data: documents,
        message: `Found ${documents.length} expired documents`,
      });
    } catch (error: any) {
      console.error('Error fetching expired documents:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /documents/type/:type
   * Get documents by type
   */
  async getByType(req: Request, res: Response): Promise<Response> {
    try {
      const { type } = req.params;
      const organizationId = (req as any).organizationId;

      const documents = await this.documentService.getByType(organizationId, type as DocumentType);

      return res.json({
        success: true,
        data: documents,
        message: `Found ${documents.length} ${type} documents`,
      });
    } catch (error: any) {
      console.error('Error fetching documents by type:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /documents/legal
   * Get legal documents
   */
  async getLegalDocuments(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;

      const documents = await this.documentService.getLegalDocuments(organizationId);

      return res.json({
        success: true,
        data: documents,
        message: `Found ${documents.length} legal requirement documents`,
      });
    } catch (error: any) {
      console.error('Error fetching legal documents:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /documents/statistics
   * Get statistics
   */
  async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;

      const stats = await this.documentService.getStatistics(organizationId);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /documents/:id/restore
   * Restore soft-deleted document
   */
  async restoreDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const document = await this.documentService.restore(id, organizationId);

      return res.json({
        success: true,
        data: document,
        message: 'Document restored successfully',
      });
    } catch (error: any) {
      console.error('Error restoring document:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}

/**
 * Validation Rules
 */
export const createDocumentValidation = [
  body('documentType')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(Object.values(DocumentType))
    .withMessage('Invalid document type'),
  body('metadata').isObject().withMessage('Metadata must be an object'),
  body('metadata.title').notEmpty().withMessage('Document title is required'),
  body('metadata.description').notEmpty().withMessage('Document description is required'),
  body('metadata.author').notEmpty().withMessage('Document author is required'),
  body('metadata.department').notEmpty().withMessage('Department is required'),
  body('metadata.tags').isArray().withMessage('Tags must be an array'),
  body('metadata.confidentialityLevel')
    .isIn(['public', 'internal', 'confidential', 'restricted'])
    .withMessage('Invalid confidentiality level'),
  body('metadata.retentionPeriod')
    .isInt({ min: 0 })
    .withMessage('Retention period must be a positive number'),
  body('metadata.legalRequirement')
    .isBoolean()
    .withMessage('Legal requirement must be a boolean'),
  body('content').notEmpty().withMessage('Document content is required'),
  body('fileUrl').optional().isString(),
  body('expiryDate').optional().isISO8601(),
];

export const updateDocumentValidation = [
  body('metadata').optional().isObject(),
  body('content').optional().isString(),
  body('fileUrl').optional().isString(),
  body('expiryDate').optional().isISO8601(),
  body('status').optional().isIn(Object.values(DocumentStatus)),
];

export const createVersionValidation = [
  body('changeDescription').notEmpty().withMessage('Change description is required'),
  body('changedBy').notEmpty().withMessage('Changed by is required'),
  body('majorChange').isBoolean().withMessage('Major change must be a boolean'),
  body('content').notEmpty().withMessage('Content is required'),
  body('fileUrl').optional().isString(),
  body('metadata').optional().isObject(),
];

export const approvalValidation = [
  body('approvedBy').notEmpty().withMessage('Approver is required'),
  body('approvalNotes').optional().isString(),
];
