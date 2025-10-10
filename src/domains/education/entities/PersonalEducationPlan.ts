/**
 * ============================================================================
 * Personal Education Plan (PEP) Entity
 * ============================================================================
 * 
 * @fileoverview Entity representing Personal Education Plans for looked after
 *               children as required by statutory guidance.
 * 
 * @module domains/education/entities/PersonalEducationPlan
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Manages Personal Education Plans (PEPs) for all looked after children.
 * PEPs are statutory documents that must be reviewed termly and focus on
 * educational progress, targets, and support. Includes Pupil Premium Plus
 * funding allocation and tracking.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Education)
 * - Children Act 1989, Section 22(3A)
 * - Promoting the Education of Looked After Children 2018
 * - Designated Teacher Regulations 2009
 * - Pupil Premium Plus Conditions of Grant
 * 
 * @features
 * - Termly PEP reviews (minimum 3 per year)
 * - SMART educational targets
 * - Pupil Premium Plus funding tracking
 * - Virtual School oversight
 * - Multi-agency participation tracking
 * - Progress monitoring
 * - Exam preparation planning
 * - Post-16 planning
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Child } from '../../children/entities/Child';
import { Organization } from '../../../entities/Organization';

export enum PEPStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REQUIRES_UPDATE = 'REQUIRES_UPDATE',
  SUPERSEDED = 'SUPERSEDED'
}

export enum AcademicYear {
  YEAR_1 = 'YEAR_1',
  YEAR_2 = 'YEAR_2',
  YEAR_3 = 'YEAR_3',
  YEAR_4 = 'YEAR_4',
  YEAR_5 = 'YEAR_5',
  YEAR_6 = 'YEAR_6',
  YEAR_7 = 'YEAR_7',
  YEAR_8 = 'YEAR_8',
  YEAR_9 = 'YEAR_9',
  YEAR_10 = 'YEAR_10',
  YEAR_11 = 'YEAR_11',
  YEAR_12 = 'YEAR_12',
  YEAR_13 = 'YEAR_13',
  POST_16 = 'POST_16'
}

export enum Term {
  AUTUMN = 'AUTUMN',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER'
}

@Entity('personal_education_plans')
@Index(['childId'])
@Index(['status'])
@Index(['reviewDate'])
@Index(['academicYear', 'term'])
export class PersonalEducationPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Child Reference
  @Column({ name: 'child_id' })
  childId: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'child_id' })
  child: Child;

  // Organization
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // PEP Details
  @Column({ name: 'pep_number', length: 100, unique: true })
  pepNumber: string;

  @Column({ name: 'academic_year', type: 'enum', enum: AcademicYear })
  academicYear: AcademicYear;

  @Column({ name: 'term', type: 'enum', enum: Term })
  term: Term;

  @Column({ name: 'status', type: 'enum', enum: PEPStatus, default: PEPStatus.DRAFT })
  status: PEPStatus;

  @Column({ name: 'review_date', type: 'timestamp' })
  reviewDate: Date;

  @Column({ name: 'next_review_date', type: 'timestamp', nullable: true })
  nextReviewDate?: Date;

  // School Details
  @Column({ name: 'school_name', length: 255 })
  schoolName: string;

  @Column({ name: 'school_address', type: 'text' })
  schoolAddress: string;

  @Column({ name: 'school_phone', length: 50 })
  schoolPhone: string;

  @Column({ name: 'school_email', length: 255 })
  schoolEmail: string;

  @Column({ name: 'school_urn', length: 50, nullable: true })
  schoolURN?: string;

  // Designated Teacher
  @Column({ name: 'designated_teacher_name', length: 255 })
  designatedTeacherName: string;

  @Column({ name: 'designated_teacher_email', length: 255 })
  designatedTeacherEmail: string;

  @Column({ name: 'designated_teacher_phone', length: 50 })
  designatedTeacherPhone: string;

  // Virtual School
  @Column({ name: 'virtual_school_head_name', length: 255 })
  virtualSchoolHeadName: string;

  @Column({ name: 'virtual_school_contact_email', length: 255 })
  virtualSchoolContactEmail: string;

  @Column({ name: 'virtual_school_contact_phone', length: 50 })
  virtualSchoolContactPhone: string;

  // Meeting Attendance
  @Column({ name: 'meeting_participants', type: 'jsonb' })
  meetingParticipants: Array<{
    name: string;
    role: 'CHILD' | 'CARER' | 'SOCIAL_WORKER' | 'DESIGNATED_TEACHER' | 'VIRTUAL_SCHOOL' | 'PARENT' | 'OTHER';
    attended: boolean;
    apologies?: string;
  }>;

  @Column({ name: 'child_attended', type: 'boolean', default: false })
  childAttended: boolean;

  @Column({ name: 'child_views_obtained', type: 'boolean', default: false })
  childViewsObtained: boolean;

  @Column({ name: 'child_views', type: 'text', nullable: true })
  childViews?: string;

  // Current Educational Status
  @Column({ name: 'current_attendance_percentage', type: 'decimal', precision: 5, scale: 2 })
  currentAttendancePercentage: number;

  @Column({ name: 'attendance_concern', type: 'boolean', default: false })
  attendanceConcern: boolean;

  @Column({ name: 'exclusions_this_year', type: 'integer', default: 0 })
  exclusionsThisYear: number;

  @Column({ name: 'behavioral_concerns', type: 'text', nullable: true })
  behavioralConcerns?: string;

  // Academic Progress
  @Column({ name: 'current_attainment', type: 'jsonb' })
  currentAttainment: Array<{
    subject: string;
    currentLevel: string;
    targetLevel: string;
    onTrack: boolean;
    teacherComment: string;
  }>;

  @Column({ name: 'strengths', type: 'text' })
  strengths: string;

  @Column({ name: 'areas_for_development', type: 'text' })
  areasForDevelopment: string;

  @Column({ name: 'predicted_grades', type: 'jsonb', nullable: true })
  predictedGrades?: Array<{
    subject: string;
    grade: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;

  // SMART Targets
  @Column({ name: 'targets', type: 'jsonb' })
  targets: Array<{
    targetNumber: number;
    category: 'ACADEMIC' | 'ATTENDANCE' | 'BEHAVIOR' | 'SOCIAL' | 'WELLBEING';
    target: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: Date;
    responsible: string;
    progress: 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'NOT_ACHIEVED';
    progressNotes: string;
  }>;

  // Support and Interventions
  @Column({ name: 'support_in_place', type: 'jsonb', default: '[]' })
  supportInPlace: Array<{
    intervention: string;
    provider: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    effectiveness: 'VERY_EFFECTIVE' | 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE';
  }>;

  @Column({ name: 'additional_support_needed', type: 'text', nullable: true })
  additionalSupportNeeded?: string;

  // Pupil Premium Plus
  @Column({ name: 'pp_plus_allocated', type: 'decimal', precision: 10, scale: 2, default: 0 })
  ppPlusAllocated: number;

  @Column({ name: 'pp_plus_spent', type: 'decimal', precision: 10, scale: 2, default: 0 })
  ppPlusSpent: number;

  @Column({ name: 'pp_plus_expenditure', type: 'jsonb', default: '[]' })
  ppPlusExpenditure: Array<{
    item: string;
    amount: number;
    date: Date;
    purpose: string;
    impactAssessment: string;
  }>;

  // Exam Preparation (for Year 11, 13)
  @Column({ name: 'exam_preparation', type: 'jsonb', nullable: true })
  examPreparation?: {
    examsThisYear: Array<{ subject: string; level: string; date: Date }>;
    revisionSupport: string[];
    studyLeaveArrangements: string;
    examAnxietySupport: boolean;
    accessArrangements: string[];
  };

  // Post-16 Planning
  @Column({ name: 'post_16_planning', type: 'jsonb', nullable: true })
  post16Planning?: {
    careerAspirations: string;
    post16Options: string[];
    applicationsMade: Array<{ institution: string; course: string; status: string }>;
    supportNeeded: string[];
    careersGuidanceReceived: boolean;
  };

  // Barriers to Learning
  @Column({ name: 'barriers_to_learning', type: 'jsonb', default: '[]' })
  barriersToLearning: Array<{
    barrier: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    strategyToOvercome: string;
  }>;

  // SEN/EHCP Reference
  @Column({ name: 'sen_support', type: 'boolean', default: false })
  senSupport: boolean;

  @Column({ name: 'ehcp_in_place', type: 'boolean', default: false })
  ehcpInPlace: boolean;

  @Column({ name: 'ehcp_reference', length: 100, nullable: true })
  ehcpReference?: string;

  // Homework and Study
  @Column({ name: 'homework_arrangements', type: 'text' })
  homeworkArrangements: string;

  @Column({ name: 'study_space_available', type: 'boolean', default: false })
  studySpaceAvailable: boolean;

  @Column({ name: 'homework_support_needed', type: 'text', nullable: true })
  homeworkSupportNeeded?: string;

  // Extracurricular
  @Column({ name: 'extracurricular_activities', type: 'jsonb', default: '[]' })
  extracurricularActivities: Array<{
    activity: string;
    frequency: string;
    benefits: string;
  }>;

  // Actions and Decisions
  @Column({ name: 'actions_agreed', type: 'jsonb', default: '[]' })
  actionsAgreed: Array<{
    action: string;
    responsible: string;
    deadline: Date;
    completed: boolean;
    completedDate?: Date;
    notes?: string;
  }>;

  @Column({ name: 'decisions_made', type: 'text', nullable: true })
  decisionsMade?: string;

  // Sign-offs
  @Column({ name: 'signed_by_child', type: 'boolean', default: false })
  signedByChild: boolean;

  @Column({ name: 'signed_by_carer', type: 'boolean', default: false })
  signedByCarer: boolean;

  @Column({ name: 'signed_by_social_worker', type: 'boolean', default: false })
  signedBySocialWorker: boolean;

  @Column({ name: 'signed_by_designated_teacher', type: 'boolean', default: false })
  signedByDesignatedTeacher: boolean;

  @Column({ name: 'signed_by_virtual_school', type: 'boolean', default: false })
  signedByVirtualSchool: boolean;

  @Column({ name: 'approval_date', type: 'timestamp', nullable: true })
  approvalDate?: Date;

  // Documents
  @Column({ name: 'documents', type: 'jsonb', default: '[]' })
  documents: Array<{
    documentType: string;
    documentName: string;
    documentUrl: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  // Audit Trail
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 255 })
  createdBy: string;

  @Column({ name: 'updated_by', length: 255 })
  updatedBy: string;

  // ========================================
  // METHODS
  // ========================================

  /**
   * Check if PEP review is overdue
   */
  isReviewOverdue(): boolean {
    if (!this.nextReviewDate) return false;
    return new Date() > this.nextReviewDate;
  }

  /**
   * Calculate targets completion percentage
   */
  getTargetsCompletionPercentage(): number {
    if (this.targets.length === 0) return 0;
    
    const achieved = this.targets.filter(t => t.progress === 'ACHIEVED').length;
    return Math.round((achieved / this.targets.length) * 100);
  }

  /**
   * Calculate Pupil Premium Plus remaining budget
   */
  getPPPlusRemaining(): number {
    return this.ppPlusAllocated - this.ppPlusSpent;
  }

  /**
   * Check if all required signatures obtained
   */
  isFullySigned(): boolean {
    return (
      this.signedByChild &&
      this.signedByCarer &&
      this.signedBySocialWorker &&
      this.signedByDesignatedTeacher &&
      this.signedByVirtualSchool
    );
  }

  /**
   * Get PEP age in weeks since review date
   */
  getAgeInWeeks(): number {
    const now = new Date();
    const review = new Date(this.reviewDate);
    const diffTime = now.getTime() - review.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  }

  /**
   * Check if attendance is a concern (below 95%)
   */
  hasAttendanceConcern(): boolean {
    return this.currentAttendancePercentage < 95;
  }

  /**
   * Calculate days until next review
   */
  getDaysUntilNextReview(): number | null {
    if (!this.nextReviewDate) return null;
    
    const now = new Date();
    const next = new Date(this.nextReviewDate);
    const diffTime = next.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
