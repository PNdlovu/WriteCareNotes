/**
 * @fileoverview Policy Import Job Entity
 * @description Entity model for tracking policy file import jobs
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-06
 * @lastModified 2025-10-06
 * 
 * @compliance
 * - GDPR Article 5 (Data minimization)
 * - ISO 27001 (Information Security)
 * - File processing audit requirements
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { PolicyCategory, Jurisdiction, RichTextContent } from './policy-draft.entity';

/**
 * Import status enumeration
 */
export enum ImportStatus {
  PENDING = 'pending',
  CONVERTING = 'converting',
  CONVERTED = 'converted',
  ERROR = 'error',
  COMPLETED = 'completed'
}

/**
 * PolicyImportJob Entity
 * 
 * Tracks the import and conversion of policy documents from
 * Word/PDF files into the structured format used by the system.
 */
@Entity('policy_import_jobs')
@Index(['organizationId', 'status'])
@Index(['importedBy'])
@Index(['createdAt'])
export class PolicyImportJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Path to uploaded file
   */
  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  /**
   * Original filename
   */
  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  /**
   * File size in bytes
   */
  @Column({ type: 'integer' })
  fileSize: number;

  /**
   * File MIME type
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  /**
   * Policy category for imported document
   */
  @Column({
    type: 'enum',
    enum: PolicyCategory
  })
  category: PolicyCategory;

  /**
   * Target jurisdictions for imported policy
   */
  @Column({
    type: 'enum',
    enum: Jurisdiction,
    array: true
  })
  jurisdiction: Jurisdiction[];

  /**
   * Current import status
   */
  @Column({
    type: 'enum',
    enum: ImportStatus,
    default: ImportStatus.PENDING
  })
  @Index()
  status: ImportStatus;

  /**
   * Whether to extract metadata from file
   */
  @Column({ type: 'boolean', default: true })
  extractMetadata: boolean;

  /**
   * Parsed content in rich text format
   */
  @Column({ type: 'jsonb', nullable: true })
  parsedContent?: RichTextContent;

  /**
   * Extracted metadata from file
   */
  @Column({ type: 'jsonb', nullable: true })
  extractedMetadata?: Record<string, any>;

  /**
   * Whether metadata was successfully extracted
   */
  @Column({ type: 'boolean', default: false })
  metadataExtracted: boolean;

  /**
   * Error message if processing failed
   */
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  /**
   * Processing start time
   */
  @Column({ type: 'timestamp', nullable: true })
  processingStartedAt?: Date;

  /**
   * Processing completion time
   */
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  /**
   * Organization that owns this import
   */
  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  /**
   * User who initiated the import
   */
  @Column({ type: 'uuid' })
  @Index()
  importedBy: string;

  /**
   * ID of policy draft created from import (if completed)
   */
  @Column({ type: 'uuid', nullable: true })
  policyDraftId?: string;

  /**
   * When import job was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * When import job was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Reference to organization
   */
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  /**
   * Reference to importing user
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'importedBy' })
  importer: User;

  /**
   * Check if import is in progress
   */
  isInProgress(): boolean {
    return this.status === ImportStatus.PENDING || 
           this.status === ImportStatus.CONVERTING;
  }

  /**
   * Check if import completed successfully
   */
  isCompleted(): boolean {
    return this.status === ImportStatus.COMPLETED || 
           this.status === ImportStatus.CONVERTED;
  }

  /**
   * Check if import failed
   */
  hasFailed(): boolean {
    return this.status === ImportStatus.ERROR;
  }

  /**
   * Get processing duration in milliseconds
   */
  getProcessingDuration(): number | null {
    if (!this.processingStartedAt || !this.completedAt) {
      return null;
    }
    return this.completedAt.getTime() - this.processingStartedAt.getTime();
  }

  /**
   * Get file size in human readable format
   */
  getFileSizeFormatted(): string {
    const bytes = this.fileSize;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get import progress percentage
   */
  getProgressPercentage(): number {
    switch (this.status) {
      case ImportStatus.PENDING:
        return 0;
      case ImportStatus.CONVERTING:
        return 50;
      case ImportStatus.CONVERTED:
        return 90;
      case ImportStatus.COMPLETED:
        return 100;
      case ImportStatus.ERROR:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Get import metadata for API responses
   */
  getMetadata() {
    return {
      id: this.id,
      fileName: this.fileName,
      fileSize: this.fileSize,
      fileSizeFormatted: this.getFileSizeFormatted(),
      mimeType: this.mimeType,
      category: this.category,
      jurisdiction: this.jurisdiction,
      status: this.status,
      progressPercentage: this.getProgressPercentage(),
      extractMetadata: this.extractMetadata,
      metadataExtracted: this.metadataExtracted,
      hasError: this.hasFailed(),
      errorMessage: this.errorMessage,
      isInProgress: this.isInProgress(),
      isCompleted: this.isCompleted(),
      processingDuration: this.getProcessingDuration(),
      policyDraftId: this.policyDraftId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt
    };
  }
}