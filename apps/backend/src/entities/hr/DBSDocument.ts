import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview DBS Document Entity for WriteCareNotes
 * @module DBSDocumentEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description DBS document entity for managing document uploads, verification,
 * and compliance tracking for DBS verification processes.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { IsUUID, IsEnum, IsString, IsBoolean, IsDate, Length, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { DBSVerification } from './DBSVerification';
import { logger } from '@/utils/logger';

/**
 * DBS document type enumeration
 */
export enum DBSDocumentType {
  APPLICATION_FORM = 'application_form',
  IDENTITY_DOCUMENT = 'identity_document',
  ADDRESS_PROOF = 'address_proof',
  CERTIFICATE = 'certificate',
  CORRESPONDENCE = 'correspondence',
  SUPPORTING_DOCUMENT = 'supporting_document',
  RENEWAL_FORM = 'renewal_form',
  APPEAL_DOCUMENT = 'appeal_document'
}

/**
 * DBS document status enumeration
 */
export enum DBSDocumentStatus {
  UPLOADED = 'uploaded',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  ARCHIVED = 'archived'
}

/**
 * DBS document entity for comprehensive document management
 */
@Entity('wcn_dbs_documents')
@Index(['dbsVerificationId', 'documentType'])
@Index(['status', 'uploadedAt'])
@Index(['documentType', 'status'])
export class DBSDocument extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // DBS Verification Reference
  @Column({ type: 'uuid' })
  @IsUUID()
  dbsVerificationId!: string;

  @ManyToOne(() => DBSVerification, verification => verification.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dbsVerificationId' })
  dbsVerification?: DBSVerification;

  // Document Details
  @Column({ type: 'enum', enum: DBSDocumentType })
  @IsEnum(DBSDocumentType)
  documentType!: DBSDocumentType;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @Column({ type: 'var char', length: 100 })
  @IsString()
  @Length(1, 100)
  originalFileName!: string;

  @Column({ type: 'var char', length: 50 })
  @IsString()
  @Length(1, 50)
  mimeType!: string;

  @Column({ type: 'var char', length: 500 })
  @IsString()
  @Length(1, 500)
  filePath!: string;

  @Column({ type: 'var char', length: 64 })
  @IsString()
  @Length(64, 64)
  fileHash!: string;

  @Column({ type: 'bigint' })
  @IsNumber()
  fileSize!: number;

  // Document Status
  @Column({ type: 'enum', enum: DBSDocumentStatus, default: DBSDocumentStatus.UPLOADED })
  @IsEnum(DBSDocumentStatus)
  status!: DBSDocumentStatus;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isRequired!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isConfidential!: boolean;

  // Verification Details
  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  verifiedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  verifiedBy?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  uploadedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  uploadedBy?: string;

  // Document Metadata
  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  documentNumber?: string;

  @Column({ type: 'date', nullable: true })
  @IsDate()
  @IsOptional()
  issueDate?: Date;

  @Column({ type: 'date', nullable: true })
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  issuingAuthority?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  documentVersion?: string;

  // Security & Compliance
  @Column({ type: 'var char', length: 64, nullable: true })
  @IsString()
  @IsOptional()
  @Length(64, 64)
  encryptionKey?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isEncrypted!: boolean;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  accessCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  lastAccessedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  lastAccessedBy?: string;

  // Healthcare-Specific Fields
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  careHomeId?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  department?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  containsPII!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresRetention!: boolean;

  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  @IsOptional()
  retentionPeriodYears?: number;

  // Audit Fields
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  /**
   * Validate DBS document before insert
   */
  @BeforeInsert()
  async validateDBSDocumentBeforeInsert(): Promise<void> {
    this.validateDBSDocumentData();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.uploadedAt) {
      this.uploadedAt = new Date();
    }
    
    console.info('DBS document created', {
      documentId: this.id,
      dbsVerificationId: this.dbsVerificationId,
      documentType: this.documentType,
      fileName: this.fileName,
      auditTrail: true
    });
  }

  /**
   * Validate DBS document before update
   */
  @BeforeUpdate()
  async validateDBSDocumentBeforeUpdate(): Promise<void> {
    this.validateDBSDocumentData();
    
    console.info('DBS document updated', {
      documentId: this.id,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate DBS document data
   */
  private validateDBSDocumentData(): void {
    if (this.fileSize <= 0) {
      throw new Error('File size must be greater than 0');
    }

    if (this.fileSize > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File size cannot exceed 50MB');
    }

    if (this.expiryDate && this.issueDate && this.issueDate > this.expiryDate) {
      throw new Error('Issue date cannot be after expiry date');
    }

    if (this.isRequired && this.status === DBSDocumentStatus.REJECTED) {
      throw new Error('Required documents cannot be rejected');
    }
  }

  /**
   * Upload document
   */
  uploadDocument(
    fileName: string,
    originalFileName: string,
    mimeType: string,
    filePath: string,
    fileHash: string,
    fileSize: number,
    uploadedBy: string,
    isRequired: boolean = false
  ): void {
    this.fileName = fileName;
    this.originalFileName = originalFileName;
    this.mimeType = mimeType;
    this.filePath = filePath;
    this.fileHash = fileHash;
    this.fileSize = fileSize;
    this.uploadedBy = uploadedBy;
    this.isRequired = isRequired;
    this.uploadedAt = new Date();
    this.status = DBSDocumentStatus.UPLOADED;

    console.info('DBS document uploaded', {
      documentId: this.id,
      fileName: this.fileName,
      fileSize: this.fileSize,
      uploadedBy,
      auditTrail: true
    });
  }

  /**
   * Verify document
   */
  verifyDocument(verifiedBy: string, notes?: string): void {
    if (this.status !== DBSDocumentStatus.PENDING_VERIFICATION) {
      throw new Error('Document must be pending verification to be verified');
    }

    this.status = DBSDocumentStatus.VERIFIED;
    this.isVerified = true;
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.verificationNotes = notes;

    console.info('DBS document verified', {
      documentId: this.id,
      verifiedBy,
      auditTrail: true
    });
  }

  /**
   * Reject document
   */
  rejectDocument(reason: string, rejectedBy: string): void {
    if (this.status !== DBSDocumentStatus.PENDING_VERIFICATION) {
      throw new Error('Document must be pending verification to be rejected');
    }

    if (this.isRequired) {
      throw new Error('Required documents cannot be rejected');
    }

    this.status = DBSDocumentStatus.REJECTED;
    this.isVerified = false;
    this.rejectionReason = reason;
    this.verifiedAt = new Date();
    this.verifiedBy = rejectedBy;

    console.info('DBS document rejected', {
      documentId: this.id,
      reason,
      rejectedBy,
      auditTrail: true
    });
  }

  /**
   * Check if document is expired
   */
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  /**
   * Check if document is due for renewal
   */
  isDueForRenewal(withinDays: number = 30): boolean {
    if (!this.expiryDate) return false;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.expiryDate <= futureDate && this.status === DBSDocumentStatus.VERIFIED;
  }

  /**
   * Get document summary
   */
  getDocumentSummary(): {
    id: string;
    documentType: DBSDocumentType;
    fileName: string;
    status: DBSDocumentStatus;
    isVerified: boolean;
    isRequired: boolean;
    isExpired: boolean;
    uploadedAt: Date | null;
    verifiedAt: Date | null;
  } {
    return {
      id: this.id,
      documentType: this.documentType,
      fileName: this.fileName,
      status: this.status,
      isVerified: this.isVerified,
      isRequired: this.isRequired,
      isExpired: this.isExpired(),
      uploadedAt: this.uploadedAt || null,
      verifiedAt: this.verifiedAt || null
    };
  }

  /**
   * Get document metadata for compliance
   */
  getComplianceMetadata(): {
    isEncrypted: boolean;
    containsPII: boolean;
    requiresRetention: boolean;
    retentionPeriodYears: number | null;
    accessCount: number;
    lastAccessedAt: Date | null;
  } {
    return {
      isEncrypted: this.isEncrypted,
      containsPII: this.containsPII,
      requiresRetention: this.requiresRetention,
      retentionPeriodYears: this.retentionPeriodYears || null,
      accessCount: this.accessCount,
      lastAccessedAt: this.lastAccessedAt || null
    };
  }

  /**
   * Record document access
   */
  recordAccess(accessedBy: string): void {
    this.accessCount += 1;
    this.lastAccessedAt = new Date();
    this.lastAccessedBy = accessedBy;

    console.info('DBS document accessed', {
      documentId: this.id,
      accessedBy,
      accessCount: this.accessCount,
      auditTrail: true
    });
  }

  /**
   * Archive document
   */
  archiveDocument(archivedBy: string): void {
    this.status = DBSDocumentStatus.ARCHIVED;
    this.updatedBy = archivedBy;

    console.info('DBS document archived', {
      documentId: this.id,
      archivedBy,
      auditTrail: true
    });
  }
}

export default DBSDocument;
