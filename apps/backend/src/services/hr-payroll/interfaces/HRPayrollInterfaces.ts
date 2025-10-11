/**
 * @fileoverview HR & Payroll Service Interfaces for WriteCareNotes
 * @module HRPayrollInterfaces
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive interfaces for HR and payroll management operations
 * including employee management, payroll processing, training records, shift scheduling,
 * and performance management with UK employment law compliance.
 * 
 * @compliance
 * - Employment Rights Act 1996
 * - Working Time Regulations 1998
 * - PAYE (Pay As You Earn) regulations
 * - Auto-enrolment pension regulations
 * - GDPR data protection requirements
 */

export interface CreateEmployeeRequest {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  nationalInsuranceNumber: string;
  email: string;
  phoneNumber: string;
  address: EmployeeAddress;
  emergencyContact: EmergencyContact;
  
  // Employment details
  startDate: Date;
  department: string;
  position: string;
  employmentType: 'permanent' | 'temporary' | 'contract' | 'apprentice' | 'volunteer';
  workingPattern: 'full_time' | 'part_time' | 'zero_hours' | 'flexible';
  contractedHours: number;
  hourlyRate?: number;
  annualSalary?: number;
  overtimeRate?: number;
  
  // Banking details
  bankName?: string;
  bankAccountNumber?: string;
  sortCode?: string;
  
  // Tax and pension
  taxCode?: string;
  pensionSchemeOptOut?: boolean;
  
  // Compliance
  rightToWorkDocuments: RightToWorkDocument[];
  dbsCheckDate?: Date;
  dbsCheckNumber?: string;
  professionalRegistrations?: ProfessionalRegistration[];
  
  // Contract details
  contractDetails?: EmploymentContractDetails;
  
  // System fields
  careHomeId: string;
  createdBy: string;
}

export interface UpdateEmployeeRequest {
  employeeId: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phoneNumber?: string;
  address?: Partial<EmployeeAddress>;
  emergencyContact?: Partial<EmergencyContact>;
  
  // Employment updates
  department?: string;
  position?: string;
  contractedHours?: number;
  hourlyRate?: number;
  annualSalary?: number;
  overtimeRate?: number;
  
  // Banking updates
  bankName?: string;
  bankAccountNumber?: string;
  sortCode?: string;
  
  // Tax and pension updates
  taxCode?: string;
  pensionSchemeOptOut?: boolean;
  
  // Status updates
  status?: 'active' | 'inactive' | 'suspended' | 'terminated';
  terminationDate?: Date;
  terminationReason?: string;
  
  // System fields
  updatedBy: string;
}

export interface ProcessPayrollRequest {
  payrollPeriod: string; // Format: "YYYY-MM" for monthly, "YYYY-WW" for weekly
  payrollType: 'monthly' | 'weekly' | 'quarterly';
  employeeIds?: string[]; // If not provided, process all active employees
  careHomeId: string;
  processedBy: string;
  
  // Payroll adjustments
  bonuses?: PayrollAdjustment[];
  deductions?: PayrollAdjustment[];
  
  // Processing options
  includeBackPay?: boolean;
  includeBenefitsInKind?: boolean;
  generatePayslips?: boolean;
  submitToHMRC?: boolean;
}

export interface CreateTrainingRecordRequest {
  employeeId: string;
  trainingType: string;
  trainingName: string;
  provider: string;
  completionDate?: Date;
  expiryDate?: Date;
  certificateNumber?: string;
  trainingHours?: number;
  cost?: number;
  isMandatory: boolean;
  
  // Training details
  trainingMethod: 'classroom' | 'online' | 'practical' | 'blended';
  assessmentResult?: 'pass' | 'fail' | 'distinction' | 'merit';
  assessmentScore?: number;
  
  // Compliance
  cpdPoints?: number;
  regulatoryRequirement?: string;
  
  // Documentation
  certificateUrl?: string;
  notes?: string;
  
  // System fields
  recordedBy: string;
}

export interface CreateShiftRequest {
  employeeId: string;
  shiftType: 'day' | 'night' | 'evening' | 'weekend' | 'bank_holiday' | 'on_call';
  startTime: Date;
  endTime: Date;
  breakDuration?: number; // Minutes
  
  // Shift details
  department?: string;
  location?: string;
  role?: string;
  
  // Pay details
  hourlyRate?: number;
  overtimeRate?: number;
  nightShiftPremium?: number;
  weekendPremium?: number;
  
  // Compliance
  isVoluntary?: boolean;
  requiresSpecialSkills?: string[];
  minimumStaffingLevel?: number;
  
  // Notes
  notes?: string;
  
  // System fields
  careHomeId: string;
  createdBy: string;
}

export interface CreatePerformanceReviewRequest {
  employeeId: string;
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  reviewType: 'probation' | 'annual' | 'mid_year' | 'disciplinary' | 'return_to_work';
  
  // Review details
  overallRating: 1 | 2 | 3 | 4 | 5;
  objectives: PerformanceObjective[];
  competencies: CompetencyAssessment[];
  
  // Development
  strengths: string[];
  areasForImprovement: string[];
  developmentPlan: DevelopmentPlan[];
  trainingNeeds: string[];
  
  // Goals
  nextReviewDate: Date;
  salaryReviewRecommendation?: 'increase' | 'maintain' | 'decrease';
  promotionRecommendation?: boolean;
  
  // Documentation
  employeeComments?: string;
  managerComments: string;
  hrComments?: string;
  
  // System fields
  reviewedBy: string;
  approvedBy?: string;
}

export interface EmployeeSearchFilters {
  careHomeId?: string;
  department?: string;
  position?: string;
  employmentType?: string;
  status?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  
  // Search terms
  searchTerm?: string; // Search in name, employee number, email
  
  // Compliance filters
  dbsExpiringBefore?: Date;
  trainingExpiringBefore?: Date;
  probationEndingBefore?: Date;
  
  // Pagination
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PayrollReportRequest {
  reportType: 'payroll_summary' | 'tax_summary' | 'pension_summary' | 'payslips' | 'p60' | 'p45';
  payrollPeriod?: string;
  startDate?: Date;
  endDate?: Date;
  employeeIds?: string[];
  careHomeId: string;
  
  // Report options
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeDetails?: boolean;
  groupBy?: 'department' | 'position' | 'employment_type';
  
  // Compliance
  hmrcSubmission?: boolean;
  pensionProviderSubmission?: boolean;
}

export interface HRMetricsRequest {
  careHomeId: string;
  period: 'current_month' | 'last_month' | 'current_quarter' | 'last_quarter' | 'current_year' | 'last_year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  
  // Metric categories
  includeEmployeeMetrics?: boolean;
  includePayrollMetrics?: boolean;
  includeTrainingMetrics?: boolean;
  includeAttendanceMetrics?: boolean;
  includeComplianceMetrics?: boolean;
  
  // Comparison
  compareWithPrevious?: boolean;
  benchmarkAgainstIndustry?: boolean;
}

// Supporting interfaces

export interface EmployeeAddress {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  alternativePhone?: string;
  email?: string;
  address?: EmployeeAddress;
}

export interface RightToWorkDocument {
  documentType: 'passport' | 'driving_licence' | 'birth_certificate' | 'visa' | 'work_permit' | 'other';
  documentNumber: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  verifiedDate: Date;
  verifiedBy: string;
}

export interface ProfessionalRegistration {
  registrationBody: string;
  registrationNumber: string;
  registrationType: string;
  issueDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
}

export interface EmploymentContractDetails {
  contractType: 'permanent' | 'fixed_term' | 'zero_hours' | 'apprenticeship';
  contractStartDate: Date;
  contractEndDate?: Date;
  probationPeriod: number; // Months
  noticePeriod: number; // Days
  
  // Terms
  workingHours: number;
  overtimePolicy: string;
  holidayEntitlement: number; // Days per year
  sickPayPolicy: string;
  pensionScheme: string;
  
  // Benefits
  benefits?: string[];
  allowances?: ContractAllowance[];
  
  // Restrictions
  nonCompeteClause?: boolean;
  confidentialityClause?: boolean;
  gardenLeaveClause?: boolean;
}

export interface ContractAllowance {
  type: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one_time';
  taxable: boolean;
}

export interface PayrollAdjustment {
  employeeId: string;
  type: 'bonus' | 'deduction' | 'reimbursement' | 'correction';
  amount: number;
  description: string;
  taxable: boolean;
  pensionable: boolean;
}

export interface PerformanceObjective {
  objective: string;
  targetDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  rating?: 1 | 2 | 3 | 4 | 5;
  comments?: string;
}

export interface CompetencyAssessment {
  competency: string;
  requiredLevel: 1 | 2 | 3 | 4 | 5;
  currentLevel: 1 | 2 | 3 | 4 | 5;
  evidence?: string;
  developmentNeeded: boolean;
}

export interface DevelopmentPlan {
  activity: string;
  targetDate: Date;
  cost?: number;
  provider?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

// Response interfaces

export interface EmployeeListResponse {
  employees: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: EmployeeSearchFilters;
}

export interface PayrollProcessingResponse {
  payrollSummaryId: string;
  status: 'processing' | 'completed' | 'failed';
  employeesProcessed: number;
  totalGrossPay: number;
  totalNetPay: number;
  errors?: PayrollProcessingError[];
  warnings?: PayrollProcessingWarning[];
}

export interface PayrollProcessingError {
  employeeId: string;
  employeeName: string;
  error: string;
  errorCode: string;
}

export interface PayrollProcessingWarning {
  employeeId: string;
  employeeName: string;
  warning: string;
  warningCode: string;
}

export interface TrainingComplianceReport {
  careHomeId: string;
  reportDate: Date;
  overallComplianceRate: number;
  mandatoryTrainingCompliance: number;
  
  // By training type
  trainingCompliance: {
    trainingType: string;
    required: number;
    completed: number;
    expired: number;
    expiringSoon: number;
    complianceRate: number;
  }[];
  
  // By employee
  employeeCompliance: {
    employeeId: string;
    employeeName: string;
    complianceRate: number;
    missingTraining: string[];
    expiringTraining: string[];
  }[];
}

export interface ShiftScheduleResponse {
  shifts: Shift[];
  conflicts: ShiftConflict[];
  workingTimeViolations: WorkingTimeViolation[];
  staffingLevels: StaffingLevel[];
}

export interface ShiftConflict {
  employeeId: string;
  employeeName: string;
  conflictType: 'double_booking' | 'insufficient_rest' | 'overtime_limit';
  conflictingShifts: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface WorkingTimeViolation {
  employeeId: string;
  employeeName: string;
  violationType: 'max_weekly_hours' | 'daily_rest' | 'weekly_rest' | 'night_work_limit';
  currentValue: number;
  limitValue: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface StaffingLevel {
  department: string;
  shift: string;
  requiredStaff: number;
  scheduledStaff: number;
  actualStaff?: number;
  status: 'understaffed' | 'adequate' | 'overstaffed';
}

// Import types from entities
import type { Employee, PayrollRecord, TrainingRecord, Shift, PerformanceReview } from '@/entities/hr-payroll/HRPayrollEntities';