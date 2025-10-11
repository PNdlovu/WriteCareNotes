/**
 * @fileoverview Policy Tracking Entity - Database entity for policy management
 * @module PolicyTracking
 * @version 1.0.0
 * @description Entity definitions for comprehensive policy tracking system
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsOptional, IsArray, IsBoolean, IsNumber, IsDate, Length, IsUUID } from 'class-validator';

/**
 * Policy Status Enumeration
 */
export enum PolicyStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  REQUIRES_UPDATE = 'requires_update',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
  REJECTED = 'rejected'
}

/**
 * Policy Priority Levels
 */
export enum PolicyPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Policy Categories
 */
export enum PolicyCategory {
  SAFEGUARDING = 'safeguarding',
  DATA_PROTECTION = 'data_protection',
  MEDICATION = 'medication',
  HEALTH_SAFETY = 'health_safety',
  STAFF_TRAINING = 'staff_training',
  EMERGENCY = 'emergency',
  INFECTION_CONTROL = 'infection_control',
  DIGNITY_RESPECT = 'dignity_respect',
  COMPLAINTS = 'complaints',
  NUTRITION = 'nutrition',
  VISITORS = 'visitors',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  END_OF_LIFE = 'end_of_life',
  MENTAL_CAPACITY = 'mental_capacity'
}

/**
 * Jurisdiction Types
 */
export enum Jurisdiction {
  ENGLAND_CQC = 'england_cqc',
  SCOTLAND_CI = 'scotland_ci',
  WALES_CIW = 'wales_ciw',
  NORTHERN_IRELAND_RQIA = 'northern_ireland_rqia',
  JERSEY_JCC = 'jersey_jcc',
  GUERNSEY_GCC = 'guernsey_gcc',
  ISLE_OF_MAN_IMC = 'isle_of_man_imc',
  EU_GDPR = 'eu_gdpr',
  UK_DATA_PROTECTION = 'uk_data_protection'
}

/**
 * Workflow Stage Enumeration
 */
export enum WorkflowStage {
  INITIATION = 'initiation',
  DRAFTING = 'drafting',
  STAKEHOLDER_REVIEW = 'stakeholder_review',
  COMPLIANCE_CHECK = 'compliance_check',
  MANAGEMENT_APPROVAL = 'management_approval',
  LEGAL_REVIEW = 'legal_review',
  FINAL_APPROVAL = 'final_approval',
  PUBLICATION = 'publication',
  IMPLEMENTATION = 'implementation',
  MONITORING = 'monitoring',
  REVIEW_CYCLE = 'review_cycle'
}

/**
 * Main Policy Tracking Entity
 */
@Entity('policy_tracking')
@Index(['organizationId', 'status'])
@Index(['category', 'priority'])
@Index(['dueDate'])
@Index(['reviewDate'])
export class PolicyTracking {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  organizationId: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Column({
    type: 'enum',
    enum: PolicyStatus,
    default: PolicyStatus.DRAFT
  })
  @IsEnum(PolicyStatus)
  status: PolicyStatus;

  @Column({
    type: 'enum',
    enum: PolicyPriority,
    default: PolicyPriority.MEDIUM
  })
  @IsEnum(PolicyPriority)
  priority: PolicyPriority;

  @Column({
    type: 'enum',
    enum: PolicyCategory
  })
  @IsEnum(PolicyCategory)
  category: PolicyCategory;

  @Column({
    type: 'enum',
    enum: WorkflowStage,
    default: WorkflowStage.INITIATION
  })
  @IsEnum(WorkflowStage)
  currentStage: WorkflowStage;

  @Column({ length: 50, default: '1.0.0' })
  @IsString()
  @Length(1, 50)
  version: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  authorId: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  authorName: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @Column({ length: 255, nullable: true })
  @IsString()
  @IsOptional()
  assigneeName?: string;

  @Column({ type: 'text', array: true, default: [] })
  @IsArray()
  @IsEnum(Jurisdiction, { each: true })
  jurisdiction: Jurisdiction[];

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresCQCApproval: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresStaffTraining: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresLegalReview: boolean;

  @Column({ type: 'text', array: true, default: [] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    workflowSteps?: {
      stage: WorkflowStage;
      completed: boolean;
      completedAt?: Date;
      assignee?: string;
      notes?: string;
    }[];
    customFields?: Record<string, any>;
    relatedPolicies?: string[];
    stakeholders?: {
      userId: string;
      userName: string;
      role: string;
      permissions: string[];
    }[];
  };

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  reviewDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  lastReviewedAt?: Date;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  attachmentCount: number;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  commentCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  progressPercentage: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  currentNotes?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => PolicyStatusTransition, transition => transition.policy, { cascade: true })
  statusTransitions: PolicyStatusTransition[];

  @OneToMany(() => PolicyComment, comment => comment.policy, { cascade: true })
  comments: PolicyComment[];

  @OneToMany(() => PolicyAttachment, attachment => attachment.policy, { cascade: true })
  attachments: PolicyAttachment[];

  @OneToMany(() => PolicyApproval, approval => approval.policy, { cascade: true })
  approvals: PolicyApproval[];

  @OneToMany(() => PolicyReview, review => review.policy, { cascade: true })
  reviews: PolicyReview[];
}

/**
 * Policy Status Transition Entity
 */
@Entity('policy_status_transitions')
@Index(['policyId', 'timestamp'])
export class PolicyStatusTransition {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  policyId: string;

  @Column({
    type: 'enum',
    enum: PolicyStatus
  })
  @IsEnum(PolicyStatus)
  fromStatus: PolicyStatus;

  @Column({
    type: 'enum',
    enum: PolicyStatus
  })
  @IsEnum(PolicyStatus)
  toStatus: PolicyStatus;

  @Column({ type: 'uuid' })
  @IsUUID()
  userId: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  userName: string;

  @Column({ length: 500 })
  @IsString()
  @Length(1, 500)
  reason: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    systemGenerated?: boolean;
    workflowStepCompleted?: WorkflowStage;
  };

  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;

  // Relationships
  @ManyToOne(() => PolicyTracking, policy => policy.statusTransitions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy: PolicyTracking;
}

/**
 * Policy Comment Entity
 */
@Entity('policy_comments')
@Index(['policyId', 'createdAt'])
export class PolicyComment {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  policyId: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  userId: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  userName: string;

  @Column({ type: 'text' })
  @IsString()
  @Length(1, 2000)
  content: string;

  @Column({
    type: 'enum',
    enum: ['feedback', 'question', 'approval', 'rejection', 'suggestion'],
    default: 'feedback'
  })
  @IsString()
  type: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isInternal: boolean;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  parentCommentId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    attachments?: string[];
    mentions?: string[];
    priority?: 'low' | 'medium' | 'high';
  };

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => PolicyTracking, policy => policy.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy: PolicyTracking;
}

/**
 * Policy Attachment Entity
 */
@Entity('policy_attachments')
@Index(['policyId'])
export class PolicyAttachment {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  policyId: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  fileName: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  originalName: string;

  @Column({ length: 100 })
  @IsString()
  mimeType: string;

  @Column({ type: 'bigint' })
  @IsNumber()
  fileSize: number;

  @Column({ length: 500 })
  @IsString()
  filePath: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  uploadedBy: string;

  @Column({ length: 255 })
  @IsString()
  uploaderName: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'template', 'reference', 'evidence', 'approval'],
    default: 'draft'
  })
  @IsString()
  attachmentType: string;

  @CreateDateColumn({ type: 'timestamp' })
  uploadedAt: Date;

  // Relationships
  @ManyToOne(() => PolicyTracking, policy => policy.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy: PolicyTracking;
}

/**
 * Policy Approval Entity
 */
@Entity('policy_approvals')
@Index(['policyId', 'status'])
export class PolicyApproval {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  policyId: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  approverId: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  approverName: string;

  @Column({ length: 100 })
  @IsString()
  approverRole: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending'
  })
  @IsString()
  status: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  comments?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  approvedAt?: Date;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isRequired: boolean;

  @Column({ type: 'integer', default: 1 })
  @IsNumber()
  approvalOrder: number;

  @CreateDateColumn({ type: 'timestamp' })
  requestedAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => PolicyTracking, policy => policy.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy: PolicyTracking;
}

/**
 * Policy Review Entity
 */
@Entity('policy_reviews')
@Index(['policyId', 'reviewDate'])
export class PolicyReview {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  policyId: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  reviewerId: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  reviewerName: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  reviewDate: Date;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'completed', 'overdue'],
    default: 'scheduled'
  })
  @IsString()
  status: string;

  @Column({
    type: 'enum',
    enum: ['no_changes', 'minor_updates', 'major_revision', 'retire_policy'],
    nullable: true
  })
  @IsString()
  @IsOptional()
  outcome?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  findings?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  recommendations?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  nextReviewDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    compliance_rating?: number;
    effectiveness_rating?: number;
    stakeholder_feedback?: {
      userId: string;
      userName: string;
      feedback: string;
    }[];
  };

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => PolicyTracking, policy => policy.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy: PolicyTracking;
}

// Enums are already exported above with their declarations
