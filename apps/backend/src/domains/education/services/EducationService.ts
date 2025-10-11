/**
 * ============================================================================
 * Education Service
 * ============================================================================
 * 
 * @fileoverview Core business logic for educational management of looked after
 *               children including PEPs, school placements, and Virtual School
 *               coordination.
 * 
 * @module domains/education/services/EducationService
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides comprehensive education functionality for residential children's homes.
 * Manages Personal Education Plans (PEPs), school placements, attendance monitoring,
 * Pupil Premium Plus allocation, and Virtual School liaison. Ensures statutory
 * compliance with education regulations for looked after children.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Education)
 * - Children Act 1989, Section 22(3A)
 * - Promoting the Education of Looked After Children 2018
 * - Designated Teacher Regulations 2009
 * - Pupil Premium Plus Conditions of Grant
 * 
 * @features
 * - Termly PEP creation and review
 * - School placement tracking and transitions
 * - Attendance monitoring and intervention
 * - Pupil Premium Plus budget management
 * - Virtual School coordination
 * - Exclusion monitoring and prevention
 * - Educational target tracking
 * - Post-16 transition planning
 * 
 * @dependencies
 * - PersonalEducationPlan entity
 * - SchoolPlacement entity
 * - Child entity
 * - NotificationService for alerts
 * - AuditService for compliance logging
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { PersonalEducationPlan, PEPStatus, AcademicYear, Term } from '../entities/PersonalEducationPlan';
import { SchoolPlacement, PlacementType, PlacementStatus, OfstedRating } from '../entities/SchoolPlacement';
import { Child } from '../../children/entities/Child';

export class EducationService {
  privatepepRepository: Repository<PersonalEducationPlan>;
  privateplacementRepository: Repository<SchoolPlacement>;
  privatechildRepository: Repository<Child>;

  constructor() {
    this.pepRepository = AppDataSource.getRepository(PersonalEducationPlan);
    this.placementRepository = AppDataSource.getRepository(SchoolPlacement);
    this.childRepository = AppDataSource.getRepository(Child);
  }

  // ========================================
  // PEP MANAGEMENT
  // ========================================

  /**
   * Create a new Personal Education Plan
   * 
   * @param pepData - PEP details
   * @returns Created PEP
   * 
   * @throws Error if child not found or validation fails
   * 
   * @example
   * const pep = await educationService.createPEP({
   *   childId: '123',
   *   academicYear: AcademicYear.YEAR_10,
   *   term: Term.AUTUMN,
   *   schoolName: 'Oakwood Secondary',
   *   designatedTeacherName: 'Jane Smith',
   *   targets: [...],
   *   createdBy: 'Virtual School'
   * });
   */
  async createPEP(pepData: {
    childId: string;
    organizationId: string;
    academicYear: AcademicYear;
    term: Term;
    reviewDate: Date;
    schoolName: string;
    schoolAddress: string;
    schoolPhone: string;
    schoolEmail: string;
    designatedTeacherName: string;
    designatedTeacherEmail: string;
    designatedTeacherPhone: string;
    virtualSchoolHeadName: string;
    virtualSchoolContactEmail: string;
    virtualSchoolContactPhone: string;
    meetingParticipants: Array<any>;
    currentAttendancePercentage: number;
    currentAttainment: Array<any>;
    strengths: string;
    areasForDevelopment: string;
    targets: Array<any>;
    homeworkArrangements: string;
    ppPlusAllocated: number;
    createdBy: string;
  }): Promise<PersonalEducationPlan> {
    // Validate child exists
    const child = await this.childRepository.findOne({
      where: { id: pepData.childId }
    });

    if (!child) {
      throw new Error(`Child with ID ${pepData.childId} not found`);
    }

    // Generate PEP number
    const pepNumber = await this.generatePEPNumber(pepData.organizationId, pepData.academicYear);

    // Calculate next review date (termly - 12-14 weeks)
    const nextReviewDate = new Date(pepData.reviewDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + (13 * 7));

    const pep = this.pepRepository.create({
      pepNumber,
      childId: pepData.childId,
      organizationId: pepData.organizationId,
      academicYear: pepData.academicYear,
      term: pepData.term,
      status: PEPStatus.DRAFT,
      reviewDate: pepData.reviewDate,
      nextReviewDate,
      schoolName: pepData.schoolName,
      schoolAddress: pepData.schoolAddress,
      schoolPhone: pepData.schoolPhone,
      schoolEmail: pepData.schoolEmail,
      designatedTeacherName: pepData.designatedTeacherName,
      designatedTeacherEmail: pepData.designatedTeacherEmail,
      designatedTeacherPhone: pepData.designatedTeacherPhone,
      virtualSchoolHeadName: pepData.virtualSchoolHeadName,
      virtualSchoolContactEmail: pepData.virtualSchoolContactEmail,
      virtualSchoolContactPhone: pepData.virtualSchoolContactPhone,
      meetingParticipants: pepData.meetingParticipants,
      childAttended: pepData.meetingParticipants.some(p => p.role === 'CHILD' && p.attended),
      currentAttendancePercentage: pepData.currentAttendancePercentage,
      attendanceConcern: pepData.currentAttendancePercentage < 95,
      exclusionsThisYear: 0,
      currentAttainment: pepData.currentAttainment,
      strengths: pepData.strengths,
      areasForDevelopment: pepData.areasForDevelopment,
      targets: pepData.targets,
      homeworkArrangements: pepData.homeworkArrangements,
      studySpaceAvailable: false,
      ppPlusAllocated: pepData.ppPlusAllocated,
      ppPlusSpent: 0,
      createdBy: pepData.createdBy,
      updatedBy: pepData.createdBy
    });

    const savedPEP = await this.pepRepository.save(pep);

    // Create audit log
    // await this.auditService.log({...});

    return savedPEP;
  }

  /**
   * Update PEP status
   * 
   * @param pepId - PEP ID
   * @param status - New status
   * @param updatedBy - User making the change
   * @returns Updated PEP
   */
  async updatePEPStatus(
    pepId: string,
    status: PEPStatus,
    updatedBy: string
  ): Promise<PersonalEducationPlan> {
    const pep = await this.pepRepository.findOne({
      where: { id: pepId }
    });

    if (!pep) {
      throw new Error(`PEP with ID ${pepId} not found`);
    }

    pep.status = status;
    pep.updatedBy = updatedBy;

    if (status === PEPStatus.APPROVED) {
      pep.approvalDate = new Date();
    }

    return await this.pepRepository.save(pep);
  }

  /**
   * Record Pupil Premium Plus expenditure
   * 
   * @param pepId - PEP ID
   * @param expenditure - Expenditure details
   * @returns Updated PEP
   */
  async recordPPPlusExpenditure(
    pepId: string,
    expenditure: {
      item: string;
      amount: number;
      date: Date;
      purpose: string;
      impactAssessment: string;
    }
  ): Promise<PersonalEducationPlan> {
    const pep = await this.pepRepository.findOne({
      where: { id: pepId }
    });

    if (!pep) {
      throw new Error(`PEP with ID ${pepId} not found`);
    }

    // Validate budget available
    const remaining = pep.ppPlusAllocated - pep.ppPlusSpent;
    if (expenditure.amount > remaining) {
      throw new Error(
        `Insufficient Pupil Premium Plus budget. Available: £${remaining}, Required: £${expenditure.amount}`
      );
    }

    pep.ppPlusExpenditure.push(expenditure);
    pep.ppPlusSpent += expenditure.amount;

    return await this.pepRepository.save(pep);
  }

  /**
   * Get overdue PEP reviews
   * 
   * @param organizationId - Organization ID
   * @returns Array of overdue PEPs
   */
  async getOverduePEPReviews(organizationId: string): Promise<PersonalEducationPlan[]> {
    const peps = await this.pepRepository.find({
      where: { organizationId, status: PEPStatus.APPROVED },
      relations: ['child']
    });

    return peps.filter(pep => pep.isReviewOverdue());
  }

  /**
   * Update PEP targets progress
   * 
   * @param pepId - PEP ID
   * @param targetNumber - Target number to update
   * @param progress - New progress status
   * @param progressNotes - Progress notes
   * @param updatedBy - User making the change
   * @returns Updated PEP
   */
  async updateTargetProgress(
    pepId: string,
    targetNumber: number,
    progress: 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'NOT_ACHIEVED',
    progressNotes: string,
    updatedBy: string
  ): Promise<PersonalEducationPlan> {
    const pep = await this.pepRepository.findOne({
      where: { id: pepId }
    });

    if (!pep) {
      throw new Error(`PEP with ID ${pepId} not found`);
    }

    const targetIndex = pep.targets.findIndex(t => t.targetNumber === targetNumber);
    if (targetIndex === -1) {
      throw new Error(`Target ${targetNumber} not found`);
    }

    pep.targets[targetIndex].progress = progress;
    pep.targets[targetIndex].progressNotes = progressNotes;
    pep.updatedBy = updatedBy;

    return await this.pepRepository.save(pep);
  }

  // ========================================
  // SCHOOL PLACEMENT MANAGEMENT
  // ========================================

  /**
   * Create a new school placement
   * 
   * @param placementData - Placement details
   * @returns Created school placement
   */
  async createSchoolPlacement(placementData: {
    childId: string;
    organizationId: string;
    placementType: PlacementType;
    startDate: Date;
    institutionName: string;
    institutionAddress: string;
    institutionPostcode: string;
    institutionPhone: string;
    institutionEmail: string;
    headteacherName: string;
    yearGroup: string;
    travelArrangements: any;
    createdBy: string;
  }): Promise<SchoolPlacement> {
    // Validate child exists
    const child = await this.childRepository.findOne({
      where: { id: placementData.childId }
    });

    if (!child) {
      throw new Error(`Child with ID ${placementData.childId} not found`);
    }

    // End any current active placements
    await this.endCurrentSchoolPlacements(placementData.childId, placementData.startDate, 'New placement started');

    const placement = this.placementRepository.create({
      childId: placementData.childId,
      organizationId: placementData.organizationId,
      placementType: placementData.placementType,
      status: PlacementStatus.ACTIVE,
      startDate: placementData.startDate,
      institutionName: placementData.institutionName,
      institutionAddress: placementData.institutionAddress,
      institutionPostcode: placementData.institutionPostcode,
      institutionPhone: placementData.institutionPhone,
      institutionEmail: placementData.institutionEmail,
      headteacherName: placementData.headteacherName,
      yearGroup: placementData.yearGroup,
      travelArrangements: placementData.travelArrangements,
      attendanceTargetPercentage: 95,
      pupilPremiumEligible: true,
      createdBy: placementData.createdBy,
      updatedBy: placementData.createdBy
    });

    const savedPlacement = await this.placementRepository.save(placement);

    return savedPlacement;
  }

  /**
   * End current school placements
   * 
   * @param childId - Child ID
   * @param endDate - End date
   * @param reason - Reason for ending
   */
  private async endCurrentSchoolPlacements(
    childId: string,
    endDate: Date,
    reason: string
  ): Promise<void> {
    const activePlacements = await this.placementRepository.find({
      where: { childId, status: PlacementStatus.ACTIVE }
    });

    for (const placement of activePlacements) {
      placement.status = PlacementStatus.ENDED;
      placement.actualEndDate = endDate;
      placement.endReason = reason;
      await this.placementRepository.save(placement);
    }
  }

  /**
   * Record school exclusion
   * 
   * @param placementId - Placement ID
   * @param exclusionData - Exclusion details
   * @returns Updated placement
   */
  async recordExclusion(
    placementId: string,
    exclusionData: {
      date: Date;
      duration: number;
      reason: string;
      circumstances: string;
      appealMade: boolean;
      appealOutcome?: string;
    }
  ): Promise<SchoolPlacement> {
    const placement = await this.placementRepository.findOne({
      where: { id: placementId }
    });

    if (!placement) {
      throw new Error(`School placement with ID ${placementId} not found`);
    }

    placement.exclusionHistory.push(exclusionData);
    placement.fixedTermExclusionsCount += 1;

    // Check if at risk (3+ exclusions)
    if (placement.fixedTermExclusionsCount >= 3) {
      placement.status = PlacementStatus.AT_RISK;
      placement.placementStabilityConcern = true;
      
      // Send alert
      // await this.notificationService.sendAlert({...});
    }

    return await this.placementRepository.save(placement);
  }

  /**
   * Update attendance
   * 
   * @param placementId - Placement ID
   * @param attendancePercentage - New attendance percentage
   * @param updatedBy - User making the change
   * @returns Updated placement
   */
  async updateAttendance(
    placementId: string,
    attendancePercentage: number,
    updatedBy: string
  ): Promise<SchoolPlacement> {
    const placement = await this.placementRepository.findOne({
      where: { id: placementId }
    });

    if (!placement) {
      throw new Error(`School placement with ID ${placementId} not found`);
    }

    placement.currentAttendancePercentage = attendancePercentage;
    placement.persistentAbsence = attendancePercentage < 90;
    placement.updatedBy = updatedBy;

    // Alert if below target
    if (attendancePercentage < placement.attendanceTargetPercentage) {
      // await this.notificationService.sendAlert({...});
    }

    return await this.placementRepository.save(placement);
  }

  /**
   * Get children not in education (NEET)
   * 
   * @param organizationId - Organization ID
   * @returns Array of children not in education
   */
  async getChildrenNotInEducation(organizationId: string): Promise<Child[]> {
    // Find children with no active school placement
    const allChildren = await this.childRepository.find({
      where: { organizationId }
    });

    constneetChildren: Child[] = [];

    for (const child of allChildren) {
      const activePlacement = await this.placementRepository.findOne({
        where: { childId: child.id, status: PlacementStatus.ACTIVE }
      });

      if (!activePlacement || activePlacement.placementType === PlacementType.NOT_IN_EDUCATION) {
        neetChildren.push(child);
      }
    }

    return neetChildren;
  }

  /**
   * Get placements at risk
   * 
   * @param organizationId - Organization ID
   * @returns Array of at-risk placements
   */
  async getPlacementsAtRisk(organizationId: string): Promise<SchoolPlacement[]> {
    return await this.placementRepository.find({
      where: { organizationId, status: PlacementStatus.AT_RISK },
      relations: ['child']
    });
  }

  /**
   * Get education statistics
   * 
   * @param organizationId - Organization ID
   * @returns Education statistics
   */
  async getEducationStatistics(organizationId: string): Promise<any> {
    const [
      totalPlacements,
      activePlacements,
      atRiskPlacements,
      neetChildren,
      overduePEPs
    ] = await Promise.all([
      this.placementRepository.count({ where: { organizationId } }),
      this.placementRepository.count({ where: { organizationId, status: PlacementStatus.ACTIVE } }),
      this.placementRepository.count({ where: { organizationId, status: PlacementStatus.AT_RISK } }),
      this.getChildrenNotInEducation(organizationId),
      this.getOverduePEPReviews(organizationId)
    ]);

    // Calculate average attendance
    const placements = await this.placementRepository.find({
      where: { organizationId, status: PlacementStatus.ACTIVE }
    });

    const attendanceValues = placements
      .filter(p => p.currentAttendancePercentage !== null)
      .map(p => p.currentAttendancePercentage!);

    const averageAttendance = attendanceValues.length > 0
      ? attendanceValues.reduce((sum, val) => sum + val, 0) / attendanceValues.length
      : 0;

    return {
      placements: {
        total: totalPlacements,
        active: activePlacements,
        atRisk: atRiskPlacements
      },
      attendance: {
        average: Math.round(averageAttendance * 100) / 100,
        belowTarget: placements.filter(p => p.isBelowAttendanceTarget()).length
      },
      neet: neetChildren.length,
      peps: {
        overdue: overduePEPs.length
      }
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generate unique PEP number
   */
  private async generatePEPNumber(organizationId: string, academicYear: AcademicYear): Promise<string> {
    const count = await this.pepRepository.count({
      where: { organizationId, academicYear }
    });
    return `PEP-${academicYear}-${String(count + 1).padStart(4, '0')}`;
  }
}
