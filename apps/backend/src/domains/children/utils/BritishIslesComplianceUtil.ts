/**
 * @fileoverview British Isles Compliance Utility
 * Provides jurisdiction-specific compliance validation, terminology mapping,
 * and regulatory requirement checking for all 8 British Isles jurisdictions.
 *
 * @module domains/children/utils
 * @version 1.0.0
 * @author WCNotes Development Team
 * @since 2025
 *
 * @description
 * This utility ensures the Children's Care System complies with regulatory
 * requirements across all British Isles jurisdictions:
 * - England (OFSTED)
 * - Wales (Care Inspectorate Wales - CIW)
 * - Scotland (Care Inspectorate Scotland)
 * - Northern Ireland (RQIA)
 * - Republic of Ireland (HIQA)
 * - Jersey (Jersey Care Commission)
 * - Guernsey (Committee for Health & Social Care)
 * - Isle of Man (Registration and Inspection Unit)
 *
 * @see docs/childrens-care-system/BRITISH-ISLES-COMPLIANCE.md
 */

import { Jurisdiction, LegalStatus } from '../entities/Child';

/**
 * Jurisdiction-specific terminology for care planning
 */
export const CARE_PLAN_TERMINOLOGY = {
  [Jurisdiction.ENGLAND]: 'Care Plan',
  [Jurisdiction.WALES]: 'Care and Support Plan',
  [Jurisdiction.SCOTLAND]: "Child's Plan",
  [Jurisdiction.NORTHERN_IRELAND]: 'Care Plan',
  [Jurisdiction.IRELAND]: 'Care Plan',
  [Jurisdiction.JERSEY]: 'Care Plan',
  [Jurisdiction.GUERNSEY]: 'Care Plan',
  [Jurisdiction.ISLE_OF_MAN]: 'Care Plan'
} as const;

/**
 * Jurisdiction-specific regulatory body names
 */
export const REGULATORY_BODY = {
  [Jurisdiction.ENGLAND]: 'OFSTED (Office for Standards in Education, Children\'s Services and Skills)',
  [Jurisdiction.WALES]: 'Care Inspectorate Wales (CIW) / Arolygiaeth Gofal Cymru',
  [Jurisdiction.SCOTLAND]: 'Care Inspectorate Scotland',
  [Jurisdiction.NORTHERN_IRELAND]: 'RQIA (Regulation and Quality Improvement Authority)',
  [Jurisdiction.IRELAND]: 'HIQA (Health Information and Quality Authority)',
  [Jurisdiction.JERSEY]: 'Jersey Care Commission',
  [Jurisdiction.GUERNSEY]: 'States of Guernsey Committee for Health & Social Care',
  [Jurisdiction.ISLE_OF_MAN]: 'Department of Health and Social Care - Registration and Inspection Unit'
} as const;

/**
 * Primary legislation by jurisdiction
 */
export const PRIMARY_LEGISLATION = {
  [Jurisdiction.ENGLAND]: ['Children Act 1989', 'Children Act 2004', 'Care Planning Regulations 2010'],
  [Jurisdiction.WALES]: ['Social Services and Well-being (Wales) Act 2014', 'Regulation and Inspection of Social Care (Wales) Act 2016'],
  [Jurisdiction.SCOTLAND]: ['Children (Scotland) Act 1995', 'Children and Young People (Scotland) Act 2014'],
  [Jurisdiction.NORTHERN_IRELAND]: ['Children (Northern Ireland) Order 1995', 'Children\'s Services Co-operation Act (NI) 2015'],
  [Jurisdiction.IRELAND]: ['Child Care Act 1991', 'Children First Act 2015', 'Child and Family Agency Act 2013'],
  [Jurisdiction.JERSEY]: ['Children (Jersey) Law 2002', 'Regulation of Care (Jersey) Law 2014'],
  [Jurisdiction.GUERNSEY]: ['Children (Guernsey and Alderney) Law 2008'],
  [Jurisdiction.ISLE_OF_MAN]: ['Children and Young Persons Act 2001', 'Care Services Registration and Inspection Act 2013']
} as const;

/**
 * Valid legal statuses by jurisdiction
 */
export const VALID_LEGAL_STATUSES: Record<Jurisdiction, LegalStatus[]> = {
  [Jurisdiction.ENGLAND]: [
    LegalStatus.SECTION_20,
    LegalStatus.SECTION_31,
    LegalStatus.SECTION_38,
    LegalStatus.POLICE_PROTECTION,
    LegalStatus.EMERGENCY_PROTECTION_ORDER,
    LegalStatus.REMAND,
    LegalStatus.CRIMINAL_JUSTICE,
    LegalStatus.IMMIGRATION_DETENTION
  ],
  [Jurisdiction.WALES]: [
    LegalStatus.SECTION_20,
    LegalStatus.SECTION_31,
    LegalStatus.SECTION_38,
    LegalStatus.POLICE_PROTECTION,
    LegalStatus.EMERGENCY_PROTECTION_ORDER,
    LegalStatus.REMAND,
    LegalStatus.CRIMINAL_JUSTICE,
    LegalStatus.IMMIGRATION_DETENTION
  ],
  [Jurisdiction.SCOTLAND]: [
    LegalStatus.COMPULSORY_SUPERVISION_ORDER,
    LegalStatus.PERMANENCE_ORDER,
    LegalStatus.CHILD_PROTECTION_ORDER,
    LegalStatus.REMAND,
    LegalStatus.CRIMINAL_JUSTICE,
    LegalStatus.IMMIGRATION_DETENTION
  ],
  [Jurisdiction.NORTHERN_IRELAND]: [
    LegalStatus.CARE_ORDER_NI,
    LegalStatus.RESIDENCE_ORDER_NI,
    LegalStatus.EMERGENCY_PROTECTION_ORDER_NI,
    LegalStatus.REMAND,
    LegalStatus.CRIMINAL_JUSTICE,
    LegalStatus.IMMIGRATION_DETENTION
  ],
  [Jurisdiction.IRELAND]: [
    LegalStatus.CARE_ORDER_IE,
    LegalStatus.INTERIM_CARE_ORDER_IE,
    LegalStatus.EMERGENCY_CARE_ORDER_IE,
    LegalStatus.VOLUNTARY_CARE_IE,
    LegalStatus.REMAND,
    LegalStatus.CRIMINAL_JUSTICE,
    LegalStatus.IMMIGRATION_DETENTION
  ],
  [Jurisdiction.JERSEY]: [
    LegalStatus.CARE_ORDER_JERSEY,
    LegalStatus.SUPERVISION_ORDER_JERSEY,
    LegalStatus.REMAND,
    LegalStatus.CRIMINAL_JUSTICE,
    LegalStatus.IMMIGRATION_DETENTION
  ],
  [Jurisdiction.GUERNSEY]: [
    LegalStatus.CARE_ORDER_GUERNSEY,
    LegalStatus.SUPERVISION_ORDER_GUERNSEY,
    LegalStatus.REMAND,
    LegalStatus.CRIMINAL_JUSTICE,
    LegalStatus.IMMIGRATION_DETENTION
  ],
  [Jurisdiction.ISLE_OF_MAN]: [
    LegalStatus.CARE_ORDER_IOM,
    LegalStatus.SUPERVISION_ORDER_IOM,
    LegalStatus.REMAND,
    LegalStatus.CRIMINAL_JUSTICE,
    LegalStatus.IMMIGRATION_DETENTION
  ]
};

/**
 * Statutory review timescales (in days) by jurisdiction
 * First review, second review, subsequent reviews
 */
export const REVIEW_TIMESCALES = {
  [Jurisdiction.ENGLAND]: { first: 20, second: 90, subsequent: 180 },
  [Jurisdiction.WALES]: { first: 20, second: 90, subsequent: 180 },
  [Jurisdiction.SCOTLAND]: { first: 28, second: 90, subsequent: 180 }, // Varies by Children's Hearings
  [Jurisdiction.NORTHERN_IRELAND]: { first: 28, second: 90, subsequent: 180 },
  [Jurisdiction.IRELAND]: { first: 28, second: 90, subsequent: 180 },
  [Jurisdiction.JERSEY]: { first: 28, second: 90, subsequent: 180 },
  [Jurisdiction.GUERNSEY]: { first: 28, second: 90, subsequent: 180 },
  [Jurisdiction.ISLE_OF_MAN]: { first: 28, second: 90, subsequent: 180 }
} as const;

/**
 * Initial health assessment timescale (working days)
 */
export const INITIAL_HEALTH_ASSESSMENT_DAYS = {
  [Jurisdiction.ENGLAND]: 20,
  [Jurisdiction.WALES]: 20,
  [Jurisdiction.SCOTLAND]: 28,
  [Jurisdiction.NORTHERN_IRELAND]: 28,
  [Jurisdiction.IRELAND]: 28,
  [Jurisdiction.JERSEY]: 28,
  [Jurisdiction.GUERNSEY]: 28,
  [Jurisdiction.ISLE_OF_MAN]: 28
} as const;

/**
 * Personal Education Plan (PEP) timescale (working days)
 */
export const PEP_TIMESCALE_DAYS = {
  [Jurisdiction.ENGLAND]: 20,
  [Jurisdiction.WALES]: 20,
  [Jurisdiction.SCOTLAND]: 28,
  [Jurisdiction.NORTHERN_IRELAND]: 28,
  [Jurisdiction.IRELAND]: 28,
  [Jurisdiction.JERSEY]: 28,
  [Jurisdiction.GUERNSEY]: 28,
  [Jurisdiction.ISLE_OF_MAN]: 28
} as const;

/**
 * British Isles Compliance Utility Class
 */
export class BritishIslesComplianceUtil {
  
  /**
   * Validate if legal status is valid for jurisdiction
   */
  static isLegalStatusValidForJurisdiction(
    legalStatus: LegalStatus,
    jurisdiction: Jurisdiction
  ): boolean {
    return VALID_LEGAL_STATUSES[jurisdiction].includes(legalStatus);
  }

  /**
   * Get appropriate care plan terminology for jurisdiction
   */
  static getCarePlanTerminology(jurisdiction: Jurisdiction): string {
    return CARE_PLAN_TERMINOLOGY[jurisdiction];
  }

  /**
   * Get regulatory body name for jurisdiction
   */
  static getRegulatoryBody(jurisdiction: Jurisdiction): string {
    return REGULATORY_BODY[jurisdiction];
  }

  /**
   * Get primary legislation for jurisdiction
   */
  static getPrimaryLegislation(jurisdiction: Jurisdiction): readonly string[] {
    return PRIMARY_LEGISLATION[jurisdiction];
  }

  /**
   * Get review timescales for jurisdiction
   */
  static getReviewTimescales(jurisdiction: Jurisdiction): {
    first: number;
    second: number;
    subsequent: number;
  } {
    return REVIEW_TIMESCALES[jurisdiction];
  }

  /**
   * Get initial health assessment timescale for jurisdiction (working days)
   */
  static getInitialHealthAssessmentDays(jurisdiction: Jurisdiction): number {
    return INITIAL_HEALTH_ASSESSMENT_DAYS[jurisdiction];
  }

  /**
   * Get PEP (Personal Education Plan) timescale for jurisdiction (working days)
   */
  static getPEPTimescaleDays(jurisdiction: Jurisdiction): number {
    return PEP_TIMESCALE_DAYS[jurisdiction];
  }

  /**
   * Calculate next review date based on jurisdiction and review number
   */
  static calculateNextReviewDate(
    jurisdiction: Jurisdiction,
    admissionDate: Date,
    reviewNumber: number
  ): Date {
    const timescales = this.getReviewTimescales(jurisdiction);
    let daysToAdd: number;

    if (reviewNumber === 1) {
      daysToAdd = timescales.first;
    } else if (reviewNumber === 2) {
      daysToAdd = timescales.first + timescales.second;
    } else {
      // Subsequent reviews
      const subsequentReviews = reviewNumber - 2;
      daysToAdd = timescales.first + timescales.second + (subsequentReviews * timescales.subsequent);
    }

    const nextReview = new Date(admissionDate);
    nextReview.setDate(nextReview.getDate() + daysToAdd);
    return nextReview;
  }

  /**
   * Calculate initial health assessment due date
   */
  static calculateHealthAssessmentDueDate(
    jurisdiction: Jurisdiction,
    admissionDate: Date
  ): Date {
    const workingDays = this.getInitialHealthAssessmentDays(jurisdiction);
    const dueDate = new Date(admissionDate);
    dueDate.setDate(dueDate.getDate() + workingDays);
    return dueDate;
  }

  /**
   * Calculate PEP due date
   */
  static calculatePEPDueDate(
    jurisdiction: Jurisdiction,
    admissionDate: Date
  ): Date {
    const workingDays = this.getPEPTimescaleDays(jurisdiction);
    const dueDate = new Date(admissionDate);
    dueDate.setDate(dueDate.getDate() + workingDays);
    return dueDate;
  }

  /**
   * Get language requirements for jurisdiction
   */
  static getLanguageRequirements(jurisdiction: Jurisdiction): {
    primary: string;
    activeOffer?: string;
  } {
    switch (jurisdiction) {
      case Jurisdiction.WALES:
        return { primary: 'English', activeOffer: 'Welsh' };
      case Jurisdiction.IRELAND:
        return { primary: 'English', activeOffer: 'Irish (Gaeilge)' };
      case Jurisdiction.SCOTLAND:
        return { primary: 'English', activeOffer: 'Scots Gaelic' };
      default:
        return { primary: 'English' };
    }
  }

  /**
   * Validate complete British Isles compliance for a child record
   */
  static validateCompliance(data: {
    jurisdiction: Jurisdiction;
    legalStatus: LegalStatus;
    admissionDate: Date;
    nextLACReviewDate?: Date;
    initialHealthAssessmentDate?: Date;
    pepDate?: Date;
  }): {
    isCompliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check legal status validity
    if (!this.isLegalStatusValidForJurisdiction(data.legalStatus, data.jurisdiction)) {
      violations.push(
        `Legal status ${data.legalStatus} is not valid for ${data.jurisdiction}. ` +
        `Valid statuses: ${VALID_LEGAL_STATUSES[data.jurisdiction].join(', ')}`
      );
    }

    // Check review date
    if (data.nextLACReviewDate) {
      const expectedFirstReview = this.calculateNextReviewDate(
        data.jurisdiction,
        data.admissionDate,
        1
      );
      if (data.nextLACReviewDate > expectedFirstReview) {
        violations.push(
          `First review date (${data.nextLACReviewDate.toISOString()}) exceeds ` +
          `${data.jurisdiction} requirement of ${REVIEW_TIMESCALES[data.jurisdiction].first} days ` +
          `(expected by ${expectedFirstReview.toISOString()})`
        );
      }
    }

    // Check health assessment
    if (data.initialHealthAssessmentDate) {
      const expectedHealthAssessment = this.calculateHealthAssessmentDueDate(
        data.jurisdiction,
        data.admissionDate
      );
      if (data.initialHealthAssessmentDate > expectedHealthAssessment) {
        violations.push(
          `Initial health assessment date (${data.initialHealthAssessmentDate.toISOString()}) exceeds ` +
          `${data.jurisdiction} requirement of ${INITIAL_HEALTH_ASSESSMENT_DAYS[data.jurisdiction]} working days ` +
          `(expected by ${expectedHealthAssessment.toISOString()})`
        );
      }
    }

    // Check PEP
    if (data.pepDate) {
      const expectedPEP = this.calculatePEPDueDate(
        data.jurisdiction,
        data.admissionDate
      );
      if (data.pepDate > expectedPEP) {
        violations.push(
          `PEP date (${data.pepDate.toISOString()}) exceeds ` +
          `${data.jurisdiction} requirement of ${PEP_TIMESCALE_DAYS[data.jurisdiction]} working days ` +
          `(expected by ${expectedPEP.toISOString()})`
        );
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations
    };
  }

  /**
   * Get all valid legal statuses for a jurisdiction
   */
  static getValidLegalStatuses(jurisdiction: Jurisdiction): LegalStatus[] {
    return VALID_LEGAL_STATUSES[jurisdiction];
  }

  /**
   * Get jurisdiction display name
   */
  static getJurisdictionDisplayName(jurisdiction: Jurisdiction): string {
    const names = {
      [Jurisdiction.ENGLAND]: 'England',
      [Jurisdiction.WALES]: 'Wales (Cymru)',
      [Jurisdiction.SCOTLAND]: 'Scotland (Alba)',
      [Jurisdiction.NORTHERN_IRELAND]: 'Northern Ireland (Tuaisceart Éireann)',
      [Jurisdiction.IRELAND]: 'Republic of Ireland (Poblacht na hÉireann)',
      [Jurisdiction.JERSEY]: 'Jersey (Bailiwick of Jersey)',
      [Jurisdiction.GUERNSEY]: 'Guernsey (Bailiwick of Guernsey)',
      [Jurisdiction.ISLE_OF_MAN]: 'Isle of Man (Ellan Vannin)'
    };
    return names[jurisdiction];
  }
}

export default BritishIslesComplianceUtil;
