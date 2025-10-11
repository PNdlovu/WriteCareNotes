/**
 * PathwayPlan JSON Field Parsers
 * 
 * Utility functions to safely parse JSON fields in PathwayPlan entity
 * Handles fields stored as strings but accessed as objects
 * 
 * FIELDS HANDLED:
 * - educationGoals (text -> JSON)
 * - accommodationGoals (text -> JSON)
 * - personalAdvisor (text -> JSON)
 * - relationshipGoals (text -> JSON)
 * 
 * BRITISH ISLES COMPLIANCE:
 * Includes regional variations for education systems, housing types
 */

import { logger } from './logger';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface EducationGoals {
  pepStatus: 'Not Started' | 'In Progress' | 'Active' | 'Review Due' | 'Completed';
  pepReviewDate: Date | null;
  goals: string[];
  currentCourse: string | null;
  institution: string | null;
  courseStartDate: Date | null;
  courseEndDate: Date | null;
  qualifications: Array<{
    name: string;
    level: string;
    subject: string;
    grade?: string;
    achieved: boolean;
  }>;
  careerAspirations: string | null;
  nextSteps: string[];
  educationSystem?: 'England' | 'Scotland' | 'Wales' | 'Northern Ireland'; // Regional variation
}

export interface AccommodationGoals {
  currentStatus: 'Planning' | 'Searching' | 'Viewing' | 'Offered' | 'Moving' | 'Settled';
  currentType?: 'Staying Put' | 'Supported Lodgings' | 'Semi-Independent' | 'Independent' | 'With Family';
  options: Array<{
    type: string;
    address: string;
    rent: number;
    suitable: boolean;
    notes: string;
  }>;
  viewings: Array<{
    date: Date;
    address: string;
    outcome: string;
  }>;
  plannedMoveDate: Date | null;
  tenancyChecklist: string[];
  tenancyChecklistCompleted: number;
  housingOfficer: string | null;
  supportPackage: string | null;
  jurisdiction?: 'England' | 'Scotland' | 'Wales' | 'Northern Ireland'; // Regional housing systems
}

export interface PersonalAdvisor {
  name: string;
  email: string;
  phone: string;
  officeHours: string;
  emergencyContact: string | null;
  role?: 'Personal Advisor' | 'Throughcare Worker' | 'Aftercare Worker'; // Scotland uses different terms
  organization?: string;
}

export interface RelationshipGoals {
  familyContact: string | null;
  supportNetwork: string[];
  mentoringScheme: boolean;
  peerSupport: boolean;
  concernsIdentified: string[];
}

// ==========================================
// PARSER FUNCTIONS
// ==========================================

/**
 * Parse educationGoals field (stored as text JSON)
 */
export function parseEducationGoals(jsonString: string | null): EducationGoals {
  constdefaultGoals: EducationGoals = {
    pepStatus: 'Not Started',
    pepReviewDate: null,
    goals: [],
    currentCourse: null,
    institution: null,
    courseStartDate: null,
    courseEndDate: null,
    qualifications: [],
    careerAspirations: null,
    nextSteps: []
  };

  if (!jsonString) {
    return defaultGoals;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      pepStatus: parsed.pepStatus || defaultGoals.pepStatus,
      pepReviewDate: parsed.pepReviewDate ? new Date(parsed.pepReviewDate) : null,
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      currentCourse: parsed.currentCourse || null,
      institution: parsed.institution || null,
      courseStartDate: parsed.courseStartDate ? new Date(parsed.courseStartDate) : null,
      courseEndDate: parsed.courseEndDate ? new Date(parsed.courseEndDate) : null,
      qualifications: Array.isArray(parsed.qualifications) ? parsed.qualifications : [],
      careerAspirations: parsed.careerAspirations || null,
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      educationSystem: parsed.educationSystem || undefined
    };
  } catch (error) {
    logger.error('Error parsing educationGoals JSON:', error);
    return defaultGoals;
  }
}

/**
 * Parse accommodationGoals field (stored as text JSON)
 */
export function parseAccommodationGoals(jsonString: string | null): AccommodationGoals {
  constdefaultGoals: AccommodationGoals = {
    currentStatus: 'Planning',
    options: [],
    viewings: [],
    plannedMoveDate: null,
    tenancyChecklist: [],
    tenancyChecklistCompleted: 0,
    housingOfficer: null,
    supportPackage: null
  };

  if (!jsonString) {
    return defaultGoals;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      currentStatus: parsed.currentStatus || defaultGoals.currentStatus,
      currentType: parsed.currentType || undefined,
      options: Array.isArray(parsed.options) ? parsed.options : [],
      viewings: Array.isArray(parsed.viewings) 
        ? parsed.viewings.map((v: any) => ({
            ...v,
            date: v.date ? new Date(v.date) : new Date()
          }))
        : [],
      plannedMoveDate: parsed.plannedMoveDate ? new Date(parsed.plannedMoveDate) : null,
      tenancyChecklist: Array.isArray(parsed.tenancyChecklist) ? parsed.tenancyChecklist : [],
      tenancyChecklistCompleted: parsed.tenancyChecklistCompleted || 0,
      housingOfficer: parsed.housingOfficer || null,
      supportPackage: parsed.supportPackage || null,
      jurisdiction: parsed.jurisdiction || undefined
    };
  } catch (error) {
    logger.error('Error parsing accommodationGoals JSON:', error);
    return defaultGoals;
  }
}

/**
 * Parse personalAdvisor field (stored as text JSON)
 */
export function parsePersonalAdvisor(jsonString: string | null): PersonalAdvisor {
  constdefaultAdvisor: PersonalAdvisor = {
    name: 'Not assigned',
    email: '',
    phone: '',
    officeHours: 'Monday-Friday 9am-5pm',
    emergencyContact: null
  };

  if (!jsonString) {
    return defaultAdvisor;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      name: parsed.name || defaultAdvisor.name,
      email: parsed.email || '',
      phone: parsed.phone || '',
      officeHours: parsed.officeHours || defaultAdvisor.officeHours,
      emergencyContact: parsed.emergencyContact || null,
      role: parsed.role || undefined,
      organization: parsed.organization || undefined
    };
  } catch (error) {
    logger.error('Error parsing personalAdvisor JSON:', error);
    return defaultAdvisor;
  }
}

/**
 * Parse relationshipGoals field (stored as text JSON)
 */
export function parseRelationshipGoals(jsonString: string | null): RelationshipGoals {
  constdefaultGoals: RelationshipGoals = {
    familyContact: null,
    supportNetwork: [],
    mentoringScheme: false,
    peerSupport: false,
    concernsIdentified: []
  };

  if (!jsonString) {
    return defaultGoals;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      familyContact: parsed.familyContact || null,
      supportNetwork: Array.isArray(parsed.supportNetwork) ? parsed.supportNetwork : [],
      mentoringScheme: parsed.mentoringScheme || false,
      peerSupport: parsed.peerSupport || false,
      concernsIdentified: Array.isArray(parsed.concernsIdentified) ? parsed.concernsIdentified : []
    };
  } catch (error) {
    logger.error('Error parsing relationshipGoals JSON:', error);
    return defaultGoals;
  }
}

// ==========================================
// SERIALIZATION FUNCTIONS
// ==========================================

/**
 * Serialize educationGoals object to JSON string for database storage
 */
export function serializeEducationGoals(goals: EducationGoals): string {
  try {
    return JSON.stringify(goals);
  } catch (error) {
    logger.error('Error serializing educationGoals:', error);
    return JSON.stringify({});
  }
}

/**
 * Serialize accommodationGoals object to JSON string for database storage
 */
export function serializeAccommodationGoals(goals: AccommodationGoals): string {
  try {
    return JSON.stringify(goals);
  } catch (error) {
    logger.error('Error serializing accommodationGoals:', error);
    return JSON.stringify({});
  }
}

/**
 * Serialize personalAdvisor object to JSON string for database storage
 */
export function serializePersonalAdvisor(advisor: PersonalAdvisor): string {
  try {
    return JSON.stringify(advisor);
  } catch (error) {
    logger.error('Error serializing personalAdvisor:', error);
    return JSON.stringify({});
  }
}

/**
 * Serialize relationshipGoals object to JSON string for database storage
 */
export function serializeRelationshipGoals(goals: RelationshipGoals): string {
  try {
    return JSON.stringify(goals);
  } catch (error) {
    logger.error('Error serializing relationshipGoals:', error);
    return JSON.stringify({});
  }
}

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

/**
 * Validate educationGoals structure
 */
export function validateEducationGoals(goals: Partial<EducationGoals>): boolean {
  if (!goals) return false;
  
  const validStatuses = ['Not Started', 'In Progress', 'Active', 'Review Due', 'Completed'];
  if (goals.pepStatus && !validStatuses.includes(goals.pepStatus)) {
    return false;
  }

  return true;
}

/**
 * Validate accommodationGoals structure
 */
export function validateAccommodationGoals(goals: Partial<AccommodationGoals>): boolean {
  if (!goals) return false;
  
  const validStatuses = ['Planning', 'Searching', 'Viewing', 'Offered', 'Moving', 'Settled'];
  if (goals.currentStatus && !validStatuses.includes(goals.currentStatus)) {
    return false;
  }

  return true;
}

/**
 * Validate personalAdvisor structure
 */
export function validatePersonalAdvisor(advisor: Partial<PersonalAdvisor>): boolean {
  if (!advisor) return false;
  
  // Minimum requirement: must have a name
  if (!advisor.name || advisor.name.trim() === '') {
    return false;
  }

  // Email validation (basic)
  if (advisor.email && advisor.email !== '' && !advisor.email.includes('@')) {
    return false;
  }

  return true;
}
