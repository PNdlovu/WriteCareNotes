/**
 * @fileoverview HR & Payroll Entity Definitions for WriteCareNotes
 * @module HRPayrollEntities
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive entity definitions for HR and payroll management
 * including employees, payroll records, training, shifts, and performance management
 * with full UK employment law and healthcare compliance support.
 * 
 * @compliance
 * - Employment Rights Act 1996
 * - Working Time Regulations 1998
 * - PAYE (Pay As You Earn) regulations
 * - Auto-enrolment pension regulations
 * - GDPR data protection requirements
 * - CQC staff qualification requirements
 */

export interface Employee {
  id: string;
  employeeNumber: string;
  
  // Personal information
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  nationalInsuranceNumber: string; // Encrypted
  email: string;
  phoneNumber: string;
  address: EmployeeAddress;
  emergencyContact: EmergencyContact;
  
  // Employment details
  startDate: Date;
  endDate?: Date;
  department: string;
  position: string;
  employmentType: 'permanent' | 'temporary' | 'contract' | 'apprentice' | 'volunteer';
  workingPattern: 'full_time' | 'part_time' | 'zero_hours' | 'flexible';
  contractedHours: number;
  
  // Compensation
  hourlyRate?: number;
  annualSalary?: number;
  overtimeRate?: number;
  
  // Banking details (encrypted)
  bankName?: string;
  bankAccountNumber?: string; // Encrypted
  sortCode?: string; // Encrypted
  
  // Tax and pension
  taxCode?: string;
  pensionSchemeOptOut: boolean;
  
  // Status and compliance
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  probationEndDate?: Date;
  terminationDate?: Date;
  terminationReason?: string;
  
  // Compliance records
  rightToWorkVerified: boolean;
  rightToWorkExpiryDate?: Date;
  dbsCheckDate?: Date;
  dbsCheckNumber?: string;
  dbsExpiryDate?: Date;
  
  // Professional registrations
  professionalRegistrations: ProfessionalRegistration[];
  
  // System fields
  careHomeId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;
  correlationId?: string;
}

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
  phoneNumber: string; // Encrypted
  alternativePhone?: string; // Encrypted
  email?: string;
  address?: EmployeeAddress;
}

export interface ProfessionalRegistration {
  id: string;
  registrationBody: string;
  registrationNumber: string;
  registrationType: string;
  issueDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  verificationDate?: Date;
  verifiedBy?: string;
}

export interface EmploymentContract {
  id: string;
  employeeId: string;
  contractType: 'permanent' | 'fixed_term' | 'zero_hours' | 'apprenticeship';
  contractStartDate: Date;
  contractEndDate?: Date;
  
  // Terms and conditions
  probationPeriod: number; // Months
  noticePeriod: number; // Days
  workingHours: number;
  overtimePolicy: string;
  holidayEntitlement: number; // Days per year
  sickPayPolicy: string;
  pensionScheme: string;
  
  // Benefits and allowances
  benefits: string[];
  allowances: ContractAllowance[];
  
  // Clauses
  nonCompeteClause: boolean;
  confidentialityClause: boolean;
  gardenLeaveClause: boolean;
  
  // Status
  status: 'active' | 'expired' | 'terminated';
  signedDate?: Date;
  signedByEmployee?: boolean;
  signedByEmployer?: boolean;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  correlationId?: string;
}

export interface ContractAllowance {
  type: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one_time';
  taxable: boolean;
  pensionable: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  payrollPeriod: string;
  
  // Earnings
  grossPay: number;
  basicPay: number;
  overtimePay: number;
  bonuses: number;
  allowances: number;
  benefitsInKind: number;
  
  // Deductions
  incomeTax: number;
  nationalInsurance: number;
  pensionContribution: number;
  studentLoan?: number;
  courtOrders?: number;
  otherDeductions: number;
  
  // Net pay
  netPay: number;
  
  // Hours
  hoursWorked: number;
  overtimeHours: number;
  sickHours?: number;
  holidayHours?: number;
  
  // Employer costs
  employerNI: number;
  employerPension: number;
  apprenticeshipLevy?: number;
  
  // Tax details
  taxCode: string;
  taxPeriod: number;
  cumulativeGrossPay: number;
  cumulativeTax: number;
  cumulativeNI: number;
  
  // Status and processing
  status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  processedDate: Date;
  paymentDate?: Date;
  paymentMethod?: 'bacs' | 'cheque' | 'cash' | 'faster_payments';
  paymentReference?: string;
  
  // Compliance
  hmrcSubmitted: boolean;
  hmrcSubmissionDate?: Date;
  pensionSubmitted: boolean;
  pensionSubmissionDate?: Date;
  
  // System fields
  careHomeId: string;
  createdAt: Date;
  updatedAt: Date;
  processedBy: string;
  correlationId?: string;
}

export interface PayrollSummary {
  id: string;
  payrollPeriod: string;
  processedDate: Date;
  
  // Summary totals
  employeeCount: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalIncomeTax: number;
  totalNationalInsurance: number;
  totalPensionContributions: number;
  
  // Employer costs
  totalEmployerNI: number;
  totalEmployerPension: number;
  totalApprenticeshipLevy: number;
  
  // Status
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  
  // Compliance
  hmrcSubmissionRequired: boolean;
  hmrcSubmitted: boolean;
  hmrcSubmissionDate?: Date;
  
  // System fields
  careHomeId: string;
  correlationId?: string;
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  
  // Training details
  trainingType: string;
  trainingName: string;
  provider: string;
  completionDate: Date;
  expiryDate?: Date;
  certificateNumber?: string;
  trainingHours?: number;
  cost?: number;
  
  // Training characteristics
  isMandatory: boolean;
  trainingMethod: 'classroom' | 'online' | 'practical' | 'blended';
  assessmentResult?: 'pass' | 'fail' | 'distinction' | 'merit';
  assessmentScore?: number;
  
  // Compliance and CPD
  cpdPoints?: number;
  regulatoryRequirement?: string;
  complianceStatus: 'compliant' | 'expired' | 'expiring_soon' | 'not_required';
  
  // Documentation
  certificateUrl?: string;
  notes?: string;
  
  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  
  // System fields
  careHomeId: string;
  createdAt: Date;
  updatedAt: Date;
  recordedBy: string;
  correlationId?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  
  // Shift timing
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  breakDuration: number; // Minutes
  duration: number; // Hours
  
  // Shift details
  shiftType: 'day' | 'night' | 'evening' | 'weekend' | 'bank_holiday' | 'on_call';
  department?: string;
  location?: string;
  role?: string;
  
  // Pay details
  hourlyRate?: number;
  overtimeRate?: number;
  nightShiftPremium?: number;
  weekendPremium?: number;
  bankHolidayPremium?: number;
  
  // Actual vs scheduled
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualBreakDuration?: number;
  actualDuration?: number;
  
  // Compliance
  isVoluntary: boolean;
  requiresSpecialSkills: string[];
  minimumStaffingLevel?: number;
  
  // Status
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  // Notes and approvals
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  
  // System fields
  careHomeId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  correlationId?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  
  // Review period
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  reviewType: 'probation' | 'annual' | 'mid_year' | 'disciplinary' | 'return_to_work';
  
  // Overall assessment
  overallRating: 1 | 2 | 3 | 4 | 5;
  overallComments: string;
  
  // Objectives and competencies
  objectives: PerformanceObjective[];
  competencies: CompetencyAssessment[];
  
  // Development
  strengths: string[];
  areasForImprovement: string[];
  developmentPlan: DevelopmentPlan[];
  trainingNeeds: string[];
  
  // Future planning
  nextReviewDate: Date;
  salaryReviewRecommendation?: 'increase' | 'maintain' | 'decrease';
  salaryIncreaseAmount?: number;
  promotionRecommendation: boolean;
  promotionDetails?: string;
  
  // Comments
  employeeComments?: string;
  managerComments: string;
  hrComments?: string;
  
  // Status and approvals
  status: 'draft' | 'pending_employee' | 'pending_manager' | 'pending_hr' | 'completed';
  employeeSigned: boolean;
  employeeSignedDate?: Date;
  managerSigned: boolean;
  managerSignedDate?: Date;
  hrApproved: boolean;
  hrApprovedDate?: Date;
  
  // System fields
  careHomeId: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedBy: string;
  approvedBy?: string;
  correlationId?: string;
}

export interface PerformanceObjective {
  id: string;
  objective: string;
  description?: string;
  targetDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  rating?: 1 | 2 | 3 | 4 | 5;
  comments?: string;
  evidence?: string;
  weight?: number; // Percentage weight in overall assessment
}

export interface CompetencyAssessment {
  id: string;
  competency: string;
  description?: string;
  requiredLevel: 1 | 2 | 3 | 4 | 5;
  currentLevel: 1 | 2 | 3 | 4 | 5;
  evidence?: string;
  developmentNeeded: boolean;
  developmentPlan?: string;
  weight?: number; // Percentage weight in overall assessment
}

export interface DevelopmentPlan {
  id: string;
  activity: string;
  description?: string;
  targetDate: Date;
  cost?: number;
  provider?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  completionDate?: Date;
  outcome?: string;
}

export interface HRMetrics {
  careHomeId: string;
  period: string;
  generatedAt: Date;
  
  // Employee metrics
  employeeMetrics: {
    totalEmployees: number;
    activeEmployees: number;
    newHires: number;
    leavers: number;
    turnoverRate: number; // Percentage
    averageTenure: number; // Months
    employeesByDepartment: DepartmentMetrics[];
    employeesByType: EmploymentTypeMetrics[];
  };
  
  // Training metrics
  trainingMetrics: {
    complianceRate: number; // Percentage
    mandatoryTrainingCompliance: number; // Percentage
    expiringCertifications: number;
    trainingHours: number;
    trainingCost: number;
    trainingByType: TrainingTypeMetrics[];
  };
  
  // Payroll metrics
  payrollMetrics: {
    totalPayrollCost: number;
    averageSalary: number;
    overtimeCost: number;
    benefitsCost: number;
    taxAndNIContributions: number;
    payrollCostByDepartment: DepartmentPayrollMetrics[];
  };
  
  // Attendance metrics
  attendanceMetrics: {
    absenteeismRate: number; // Percentage
    sickLeaveRate: number; // Percentage
    overtimeHours: number;
    averageHoursWorked: number;
    lateArrivals: number;
    earlyDepartures: number;
  };
  
  // Compliance metrics
  complianceMetrics: {
    rightToWorkChecks: number; // Percentage compliant
    dbsChecks: number; // Percentage compliant
    healthAndSafetyTraining: number; // Percentage compliant
    professionalRegistrations: number; // Percentage compliant
    complianceViolations: ComplianceViolation[];
  };
  
  // System fields
  correlationId?: string;
}

export interface DepartmentMetrics {
  department: string;
  employeeCount: number;
  turnoverRate: number;
  averageTenure: number;
  complianceRate: number;
}

export interface EmploymentTypeMetrics {
  employmentType: string;
  count: number;
  percentage: number;
}

export interface TrainingTypeMetrics {
  trainingType: string;
  required: number;
  completed: number;
  complianceRate: number;
  averageCost: number;
}

export interface DepartmentPayrollMetrics {
  department: string;
  totalCost: number;
  averageSalary: number;
  overtimeCost: number;
  employeeCount: number;
}

export interface ComplianceViolation {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  employeeId?: string;
  employeeName?: string;
  department?: string;
  dueDate?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'overdue';
}

export interface TaxCalculation {
  incomeTax: any; // Decimal type
  taxCode: string;
  personalAllowance: number;
  taxableIncome: number;
  taxBands?: TaxBand[];
}

export interface TaxBand {
  bandName: string;
  lowerLimit: number;
  upperLimit?: number;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface PensionContribution {
  employeeContribution: any; // Decimal type
  employerContribution: any; // Decimal type
  pensionScheme: PensionScheme | null;
}

export interface PensionScheme {
  id: string;
  schemeName: string;
  provider: string;
  employeeContributionRate: number;
  employerContributionRate: number;
  isActive: boolean;
  autoEnrolment: boolean;
}

export interface WorkingTimeCompliance {
  employeeId: string;
  weeklyHours: number;
  maxWeeklyHours: number;
  dailyRestHours: number;
  minDailyRestHours: number;
  weeklyRestHours: number;
  minWeeklyRestHours: number;
  nightWorkHours: number;
  maxNightWorkHours: number;
  violations: WorkingTimeViolation[];
}

export interface WorkingTimeViolation {
  violationType: 'max_weekly_hours' | 'daily_rest' | 'weekly_rest' | 'night_work_limit';
  currentValue: number;
  limitValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export interface PayslipData {
  payrollRecordId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  payPeriod: string;
  payDate: Date;
  
  // Earnings breakdown
  earnings: PayslipEarning[];
  totalEarnings: number;
  
  // Deductions breakdown
  deductions: PayslipDeduction[];
  totalDeductions: number;
  
  // Net pay
  netPay: number;
  
  // Year to date figures
  ytdEarnings: number;
  ytdDeductions: number;
  ytdNetPay: number;
  ytdTax: number;
  ytdNI: number;
  
  // Tax information
  taxCode: string;
  taxPeriod: number;
  
  // Employer information
  employerName: string;
  employerAddress: string;
  payeReference: string;
}

export interface PayslipEarning {
  description: string;
  amount: number;
  rate?: number;
  hours?: number;
  ytdAmount: number;
}

export interface PayslipDeduction {
  description: string;
  amount: number;
  rate?: number;
  ytdAmount: number;
}