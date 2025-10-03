import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum RegulatoryBody {
  CQC = 'cqc', // England
  CARE_INSPECTORATE = 'care_inspectorate', // Scotland
  CIW = 'ciw', // Wales
  RQIA = 'rqia', // Northern Ireland
  MHRA = 'mhra',
  NICE = 'nice',
  NHS_ENGLAND = 'nhs_england',
  LOCAL_AUTHORITY = 'local_authority'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  IMPROVEMENT_REQUIRED = 'improvement_required'
}

@Entity('regulatory_compliance')
export class RegulatoryCompliance extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: RegulatoryBody })
  regulatoryBody: RegulatoryBody;

  @Column()
  requirementName: string;

  @Column({ enum: ComplianceStatus })
  status: ComplianceStatus;

  @Column('jsonb')
  evidenceDocuments: Array<{
    documentId: string;
    documentName: string;
    documentUrl: string;
    uploadDate: Date;
    expiryDate?: Date;
  }>;

  @Column('timestamp')
  lastAssessmentDate: Date;

  @Column('timestamp')
  nextAssessmentDate: Date;

  @Column('text', { nullable: true })
  complianceNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isCompliant(): boolean {
    return this.status === ComplianceStatus.COMPLIANT;
  }

  requiresAction(): boolean {
    return [ComplianceStatus.NON_COMPLIANT, ComplianceStatus.IMPROVEMENT_REQUIRED].includes(this.status);
  }
}