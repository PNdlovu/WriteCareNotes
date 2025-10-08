import { DataSource, Repository, Between, LessThanOrEqual } from 'typeorm';
import { 
  DocumentManagement, 
  DocumentType, 
  DocumentStatus, 
  DocumentMetadata, 
  VersionControl 
} from '../../entities/document/DocumentManagement';

// DTOs
export interface CreateDocumentDTO {
  documentType: DocumentType;
  metadata: DocumentMetadata;
  content: string;
  fileUrl?: string;
  expiryDate?: Date;
  organizationId: string;
}

export interface UpdateDocumentDTO {
  metadata?: Partial<DocumentMetadata>;
  content?: string;
  fileUrl?: string;
  expiryDate?: Date;
  status?: DocumentStatus;
}

export interface CreateVersionDTO {
  changeDescription: string;
  changedBy: string;
  majorChange: boolean;
  content: string;
  fileUrl?: string;
  metadata?: Partial<DocumentMetadata>;
}

export interface DocumentFilters {
  documentType?: DocumentType | DocumentType[];
  status?: DocumentStatus | DocumentStatus[];
  tags?: string[];
  department?: string;
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  legalRequirement?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  expiringBefore?: Date;
  searchTerm?: string;
}

export interface ApprovalDTO {
  approvedBy: string;
  approvalNotes?: string;
}

/**
 * Service #8: Simple Document Management Service
 * 
 * Comprehensive document lifecycle management with:
 * - Document CRUD operations
 * - Version control and history
 * - Document approval workflow
 * - Compliance tracking
 * - Expiry management
 * - Full-text search
 * 
 * Compliance: GDPR, CQC, ISO 27001, Records Management Code of Practice
 */
export class SimpleDocumentService {
  private documentRepository: Repository<DocumentManagement>;

  constructor(private dataSource: DataSource) {
    this.documentRepository = this.dataSource.getRepository(DocumentManagement);
  }

  /**
   * Create a new document
   */
  async create(dto: CreateDocumentDTO): Promise<DocumentManagement> {
    const documentId = await this.generateDocumentId(dto.documentType);

    const versionControl: VersionControl = {
      versionNumber: '1.0',
      changeDescription: 'Initial version',
      changedBy: dto.metadata.author,
      changeDate: new Date(),
      majorChange: true,
    };

    // Create initial AI analysis placeholder (to be populated by AI service)
    const aiAnalysis = {
      contentAnalysis: {
        wordCount: dto.content.split(/\s+/).length,
        readabilityScore: 0,
        sentimentAnalysis: 'neutral' as const,
        keyTopics: [],
        complianceKeywords: [],
      },
      qualityAssessment: {
        completeness: 0,
        accuracy: 0,
        clarity: 0,
        consistency: 0,
        overallQuality: 0,
      },
      riskAssessment: {
        complianceRisks: [],
        dataProtectionRisks: [],
        operationalRisks: [],
        mitigationSuggestions: [],
      },
    };

    const document = this.documentRepository.create({
      documentId,
      documentType: dto.documentType,
      status: DocumentStatus.DRAFT,
      metadata: dto.metadata,
      versionControl,
      aiAnalysis,
      content: dto.content,
      fileUrl: dto.fileUrl || '',
      expiryDate: dto.expiryDate,
      organizationId: dto.organizationId,
    });

    return await this.documentRepository.save(document);
  }

  /**
   * Find document by ID
   */
  async findById(id: string, organizationId: string): Promise<DocumentManagement | null> {
    return await this.documentRepository.findOne({
      where: { id, organizationId },
    });
  }

  /**
   * Find all documents with filtering and pagination
   */
  async findAll(
    organizationId: string,
    filters: DocumentFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ documents: DocumentManagement[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('doc')
      .where('doc.organizationId = :organizationId', { organizationId });

    // Apply filters
    if (filters.documentType) {
      if (Array.isArray(filters.documentType)) {
        queryBuilder.andWhere('doc.documentType IN (:...types)', { types: filters.documentType });
      } else {
        queryBuilder.andWhere('doc.documentType = :type', { type: filters.documentType });
      }
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryBuilder.andWhere('doc.status IN (:...statuses)', { statuses: filters.status });
      } else {
        queryBuilder.andWhere('doc.status = :status', { status: filters.status });
      }
    }

    if (filters.department) {
      queryBuilder.andWhere("doc.metadata->>'department' = :department", { department: filters.department });
    }

    if (filters.confidentialityLevel) {
      queryBuilder.andWhere("doc.metadata->>'confidentialityLevel' = :level", { level: filters.confidentialityLevel });
    }

    if (filters.legalRequirement !== undefined) {
      queryBuilder.andWhere("(doc.metadata->>'legalRequirement')::boolean = :legal", { legal: filters.legalRequirement });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere("doc.metadata->>'tags' ?| array[:...tags]", { tags: filters.tags });
    }

    if (filters.createdAfter) {
      queryBuilder.andWhere('doc.createdAt >= :after', { after: filters.createdAfter });
    }

    if (filters.createdBefore) {
      queryBuilder.andWhere('doc.createdAt <= :before', { before: filters.createdBefore });
    }

    if (filters.expiringBefore) {
      queryBuilder.andWhere('doc.expiryDate <= :expiringBefore', { expiringBefore: filters.expiringBefore });
      queryBuilder.andWhere('doc.expiryDate IS NOT NULL');
    }

    if (filters.searchTerm) {
      queryBuilder.andWhere(
        `(doc.metadata->>'title' ILIKE :search OR doc.metadata->>'description' ILIKE :search OR doc.content ILIKE :search)`,
        { search: `%${filters.searchTerm}%` }
      );
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by created date (newest first)
    queryBuilder.orderBy('doc.createdAt', 'DESC');

    const [documents, total] = await queryBuilder.getManyAndCount();

    return {
      documents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update document
   */
  async update(id: string, organizationId: string, dto: UpdateDocumentDTO): Promise<DocumentManagement> {
    const document = await this.findById(id, organizationId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if document is locked (published/archived)
    if (document.status === DocumentStatus.PUBLISHED || document.status === DocumentStatus.ARCHIVED) {
      throw new Error('Cannot update published or archived documents. Create a new version instead.');
    }

    if (dto.metadata) {
      document.metadata = { ...document.metadata, ...dto.metadata };
    }

    if (dto.content !== undefined) {
      document.content = dto.content;
    }

    if (dto.fileUrl !== undefined) {
      document.fileUrl = dto.fileUrl;
    }

    if (dto.expiryDate !== undefined) {
      document.expiryDate = dto.expiryDate;
    }

    if (dto.status) {
      document.status = dto.status;
    }

    return await this.documentRepository.save(document);
  }

  /**
   * Delete document (soft delete)
   */
  async delete(id: string, organizationId: string): Promise<void> {
    const document = await this.findById(id, organizationId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if it's a legal requirement document
    if (document.metadata.legalRequirement) {
      throw new Error('Cannot delete documents marked as legal requirements. Archive them instead.');
    }

    await this.documentRepository.softRemove(document);
  }

  /**
   * Create a new version of a document
   */
  async createNewVersion(
    id: string,
    organizationId: string,
    dto: CreateVersionDTO
  ): Promise<DocumentManagement> {
    const previousDocument = await this.findById(id, organizationId);
    if (!previousDocument) {
      throw new Error('Previous document version not found');
    }

    // Parse current version and increment
    const currentVersion = previousDocument.versionControl.versionNumber;
    const [major, minor] = currentVersion.split('.').map(Number);
    const newVersion = dto.majorChange ? `${major + 1}.0` : `${major}.${minor + 1}`;

    const versionControl: VersionControl = {
      versionNumber: newVersion,
      previousVersionId: previousDocument.id,
      changeDescription: dto.changeDescription,
      changedBy: dto.changedBy,
      changeDate: new Date(),
      majorChange: dto.majorChange,
    };

    // Merge metadata if provided
    const metadata = dto.metadata
      ? { ...previousDocument.metadata, ...dto.metadata }
      : previousDocument.metadata;

    const newDocument = this.documentRepository.create({
      documentId: previousDocument.documentId,
      documentType: previousDocument.documentType,
      status: DocumentStatus.DRAFT,
      metadata,
      versionControl,
      aiAnalysis: previousDocument.aiAnalysis, // Copy AI analysis, will be updated
      content: dto.content,
      fileUrl: dto.fileUrl || previousDocument.fileUrl,
      expiryDate: previousDocument.expiryDate,
      organizationId,
    });

    // Archive the previous version
    previousDocument.status = DocumentStatus.ARCHIVED;
    await this.documentRepository.save(previousDocument);

    return await this.documentRepository.save(newDocument);
  }

  /**
   * Submit document for review
   */
  async submitForReview(id: string, organizationId: string): Promise<DocumentManagement> {
    const document = await this.findById(id, organizationId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status !== DocumentStatus.DRAFT) {
      throw new Error('Only draft documents can be submitted for review');
    }

    document.status = DocumentStatus.UNDER_REVIEW;
    return await this.documentRepository.save(document);
  }

  /**
   * Approve document
   */
  async approve(id: string, organizationId: string, dto: ApprovalDTO): Promise<DocumentManagement> {
    const document = await this.findById(id, organizationId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status !== DocumentStatus.UNDER_REVIEW) {
      throw new Error('Only documents under review can be approved');
    }

    document.versionControl = {
      ...document.versionControl,
      approvedBy: dto.approvedBy,
      approvalDate: new Date(),
    };

    document.status = DocumentStatus.APPROVED;
    return await this.documentRepository.save(document);
  }

  /**
   * Publish document
   */
  async publish(id: string, organizationId: string): Promise<DocumentManagement> {
    const document = await this.findById(id, organizationId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status !== DocumentStatus.APPROVED) {
      throw new Error('Only approved documents can be published');
    }

    document.status = DocumentStatus.PUBLISHED;
    return await this.documentRepository.save(document);
  }

  /**
   * Archive document
   */
  async archive(id: string, organizationId: string): Promise<DocumentManagement> {
    const document = await this.findById(id, organizationId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.status = DocumentStatus.ARCHIVED;
    return await this.documentRepository.save(document);
  }

  /**
   * Get document version history
   */
  async getVersionHistory(documentId: string, organizationId: string): Promise<DocumentManagement[]> {
    return await this.documentRepository.find({
      where: { documentId, organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get documents expiring soon
   */
  async getExpiringSoon(organizationId: string, daysAhead: number = 30): Promise<DocumentManagement[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await this.documentRepository.find({
      where: {
        organizationId,
        expiryDate: Between(new Date(), futureDate),
      },
      order: { expiryDate: 'ASC' },
    });
  }

  /**
   * Get expired documents
   */
  async getExpired(organizationId: string): Promise<DocumentManagement[]> {
    return await this.documentRepository.find({
      where: {
        organizationId,
        expiryDate: LessThanOrEqual(new Date()),
      },
      order: { expiryDate: 'DESC' },
    });
  }

  /**
   * Get documents by type
   */
  async getByType(organizationId: string, type: DocumentType): Promise<DocumentManagement[]> {
    return await this.documentRepository.find({
      where: { organizationId, documentType: type },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get documents requiring legal retention
   */
  async getLegalDocuments(organizationId: string): Promise<DocumentManagement[]> {
    return await this.documentRepository
      .createQueryBuilder('doc')
      .where('doc.organizationId = :organizationId', { organizationId })
      .andWhere("(doc.metadata->>'legalRequirement')::boolean = true")
      .orderBy('doc.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Search documents by tags
   */
  async searchByTags(organizationId: string, tags: string[]): Promise<DocumentManagement[]> {
    return await this.documentRepository
      .createQueryBuilder('doc')
      .where('doc.organizationId = :organizationId', { organizationId })
      .andWhere("doc.metadata->>'tags' ?| array[:...tags]", { tags })
      .orderBy('doc.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get statistics
   */
  async getStatistics(organizationId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    expiringSoon: number;
    expired: number;
    legalDocuments: number;
    averageQualityScore: number;
  }> {
    const documents = await this.documentRepository.find({ where: { organizationId } });

    const byType = documents.reduce((acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const expiringSoon = await this.getExpiringSoon(organizationId, 30);
    const expired = documents.filter(doc => doc.isExpired()).length;
    const legalDocuments = documents.filter(doc => doc.metadata.legalRequirement).length;
    
    const averageQualityScore = documents.length > 0
      ? documents.reduce((sum, doc) => sum + (doc.aiAnalysis?.qualityAssessment?.overallQuality || 0), 0) / documents.length
      : 0;

    return {
      total: documents.length,
      byType,
      byStatus,
      expiringSoon: expiringSoon.length,
      expired,
      legalDocuments,
      averageQualityScore: Math.round(averageQualityScore * 100) / 100,
    };
  }

  /**
   * Restore soft-deleted document
   */
  async restore(id: string, organizationId: string): Promise<DocumentManagement> {
    const document = await this.documentRepository.findOne({
      where: { id, organizationId },
      withDeleted: true,
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.deletedAt) {
      throw new Error('Document is not deleted');
    }

    await this.documentRepository.recover(document);
    return document;
  }

  /**
   * Generate unique document ID
   */
  private async generateDocumentId(type: DocumentType): Promise<string> {
    const prefix = this.getDocumentPrefix(type);
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get document prefix based on type
   */
  private getDocumentPrefix(type: DocumentType): string {
    const prefixes: Record<DocumentType, string> = {
      [DocumentType.CARE_PLAN]: 'CP',
      [DocumentType.MEDICAL_RECORD]: 'MR',
      [DocumentType.POLICY]: 'POL',
      [DocumentType.PROCEDURE]: 'PROC',
      [DocumentType.TRAINING_MATERIAL]: 'TRN',
      [DocumentType.REGULATORY_DOCUMENT]: 'REG',
      [DocumentType.CONTRACT]: 'CON',
      [DocumentType.INCIDENT_REPORT]: 'INC',
    };
    return prefixes[type] || 'DOC';
  }
}
