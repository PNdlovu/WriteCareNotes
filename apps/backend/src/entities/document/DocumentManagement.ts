import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum DocumentType {
  CARE_PLAN = 'care_plan',
  MEDICAL_RECORD = 'medical_record',
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  TRAINING_MATERIAL = 'training_material',
  REGULATORY_DOCUMENT = 'regulatory_document',
  CONTRACT = 'contract',
  INCIDENT_REPORT = 'incident_report'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  EXPIRED = 'expired'
}

export interface DocumentMetadata {
  title: string;
  description: string;
  author: string;
  department: string;
  tags: string[];
  confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  retentionPeriod: number; // years
  legalRequirement: boolean;
}

export interface VersionControl {
  versionNumber: string;
  previousVersionId?: string;
  changeDescription: string;
  changedBy: string;
  changeDate: Date;
  approvedBy?: string;
  approvalDate?: Date;
  majorChange: boolean;
}

export interface AIDocumentAnalysis {
  contentAnalysis: {
    wordCount: number;
    readabilityScore: number;
    sentimentAnalysis: 'positive' | 'neutral' | 'negative';
    keyTopics: string[];
    complianceKeywords: string[];
  };
  qualityAssessment: {
    completeness: number; // percentage
    accuracy: number;
    clarity: number;
    consistency: number;
    overallQuality: number;
  };
  riskAssessment: {
    complianceRisks: string[];
    dataProtectionRisks: string[];
    operationalRisks: string[];
    mitigationSuggestions: string[];
  };
}

@Entity('documents')
export class DocumentManagement extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  documentId: string;

  @Column({ enum: DocumentType })
  documentType: DocumentType;

  @Column({ enum: DocumentStatus, default: DocumentStatus.DRAFT })
  status: DocumentStatus;

  @Column('jsonb')
  metadata: DocumentMetadata;

  @Column('jsonb')
  versionControl: VersionControl;

  @Column('jsonb')
  aiAnalysis: AIDocumentAnalysis;

  @Column('text')
  content: string;

  @Column()
  fileUrl: string;

  @Column('timestamp', { nullable: true })
  expiryDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isExpired(): boolean {
    return this.expiryDate ? new Date() > this.expiryDate : false;
  }

  isHighQuality(): boolean {
    return this.aiAnalysis.qualityAssessment.overallQuality >= 85;
  }

  hasComplianceRisks(): boolean {
    return this.aiAnalysis.riskAssessment.complianceRisks.length > 0;
  }
}