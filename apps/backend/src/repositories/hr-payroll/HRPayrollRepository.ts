/**
 * @fileoverview HR & Payroll Repository for WriteCareNotes
 * @module HRPayrollRepository
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Data access layer for HR and payroll management operations
 * providing comprehensive database operations for employee management, payroll processing,
 * training records, shift scheduling, and performance management with full audit support.
 * 
 * @compliance
 * - Employment Rights Act 1996
 * - Working Time Regulations 1998
 * - PAYE (Pay As You Earn) regulations
 * - GDPR data protection requirements
 * - Database audit trail requirements
 */

import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '@/utils/logger';
import {
  Employee,
  PayrollRecord,
  PayrollSummary,
  TrainingRecord,
  Shift,
  PerformanceReview,
  EmploymentContract,
  HRMetrics,
  PensionScheme,
  WorkingTimeCompliance
} from '@/entities/hr-payroll/HRPayrollEntities';
import {
  EmployeeSearchFilters,
  PayrollReportRequest
} from '@/services/hr-payroll/interfaces/HRPayrollInterfaces';

@Injectable()
export class HRPayrollRepository {
  const ructor(private readonlypool: Pool) {}

  // Employee operations

  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const employeeQuery = `
        INSERT INTO employees (
          id, employee_number, first_name, last_name, middle_name, date_of_birth,
          gender, national_insurance_number, email, phone_number, address,
          emergency_contact, start_date, end_date, department, position,
          employment_type, working_pattern, contracted_hours, hourly_rate,
          annual_salary, overtime_rate, bank_name, bank_account_number,
          sort_code, tax_code, pension_scheme_opt_out, status, probation_end_date,
          termination_date, termination_reason, right_to_work_verified,
          right_to_work_expiry_date, dbs_check_date, dbs_check_number,
          dbs_expiry_date, care_home_id, created_at, updated_at, created_by,
          updated_by, version, correlation_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43
        ) RETURNING *
      `;

      const result = await client.query(employeeQuery, [
        employee.id,
        employee.employeeNumber,
        employee.firstName,
        employee.lastName,
        employee.middleName,
        employee.dateOfBirth,
        employee.gender,
        employee.nationalInsuranceNumber,
        employee.email,
        employee.phoneNumber,
        JSON.stringify(employee.address),
        JSON.stringify(employee.emergencyContact),
        employee.startDate,
        employee.endDate,
        employee.department,
        employee.position,
        employee.employmentType,
        employee.workingPattern,
        employee.contractedHours,
        employee.hourlyRate,
        employee.annualSalary,
        employee.overtimeRate,
        employee.bankName,
        employee.bankAccountNumber,
        employee.sortCode,
        employee.taxCode,
        employee.pensionSchemeOptOut || false,
        employee.status,
        employee.probationEndDate,
        employee.terminationDate,
        employee.terminationReason,
        employee.rightToWorkVerified || false,
        employee.rightToWorkExpiryDate,
        employee.dbsCheckDate,
        employee.dbsCheckNumber,
        employee.dbsExpiryDate,
        employee.careHomeId,
        employee.createdAt,
        employee.updatedAt,
        employee.createdBy,
        employee.updatedBy,
        employee.version || 1,
        employee.correlationId
      ]);

      // Insert professional registrations if any
      if (employee.professionalRegistrations && employee.professionalRegistrations.length > 0) {
        for (const registration of employee.professionalRegistrations) {
          await client.query(`
            INSERT INTO professional_registrations (
              id, employee_id, registration_body, registration_number,
              registration_type, issue_date, expiry_date, status,
              verification_date, verified_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            registration.id,
            employee.id,
            registration.registrationBody,
            registration.registrationNumber,
            registration.registrationType,
            registration.issueDate,
            registration.expiryDate,
            registration.status,
            registration.verificationDate,
            registration.verifiedBy
          ]);
        }
      }

      await client.query('COMMIT');
      
      return this.mapRowToEmployee(result.rows[0]);

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create employee', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  async getEmployee(employeeId: string): Promise<Employee | null> {
    const query = `
      SELECT e.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', pr.id,
                   'registrationBody', pr.registration_body,
                   'registrationNumber', pr.registration_number,
                   'registrationType', pr.registration_type,
                   'issueDate', pr.issue_date,
                   'expiryDate', pr.expiry_date,
                   'status', pr.status,
                   'verificationDate', pr.verification_date,
                   'verifiedBy', pr.verified_by
                 )
               ) FILTER (WHERE pr.id IS NOT NULL), '[]'
             ) as professional_registrations
      FROM employees e
      LEFT JOIN professional_registrations pr ON e.id = pr.employee_id
      WHERE e.id = $1 AND e.deleted_at IS NULL
      GROUP BY e.id
    `;

    const result = await this.pool.query(query, [employeeId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEmployee(result.rows[0]);
  }

  async findEmployeeByNumberOrNI(employeeNumber: string, niNumber: string): Promise<Employee | null> {
    const query = `
      SELECT * FROM employees 
      WHERE (employee_number = $1 OR national_insurance_number = $2) 
      AND deleted_at IS NULL
      LIMIT 1
    `;

    const result = await this.pool.query(query, [employeeNumber, niNumber]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEmployee(result.rows[0]);
  }

  async searchEmployees(filters: EmployeeSearchFilters): Promise<{ employees: Employee[], total: number }> {
    let whereConditions = ['e.deleted_at IS NULL'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (filters.careHomeId) {
      whereConditions.push(`e.care_home_id = $${paramIndex}`);
      queryParams.push(filters.careHomeId);
      paramIndex++;
    }

    if (filters.department) {
      whereConditions.push(`e.department = $${paramIndex}`);
      queryParams.push(filters.department);
      paramIndex++;
    }

    if (filters.position) {
      whereConditions.push(`e.position = $${paramIndex}`);
      queryParams.push(filters.position);
      paramIndex++;
    }

    if (filters.employmentType) {
      whereConditions.push(`e.employment_type = $${paramIndex}`);
      queryParams.push(filters.employmentType);
      paramIndex++;
    }

    if (filters.status) {
      whereConditions.push(`e.status = $${paramIndex}`);
      queryParams.push(filters.status);
      paramIndex++;
    }

    if (filters.searchTerm) {
      whereConditions.push(`(
        e.first_name ILIKE $${paramIndex} OR 
        e.last_name ILIKE $${paramIndex} OR 
        e.employee_number ILIKE $${paramIndex} OR 
        e.email ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${filters.searchTerm}%`);
      paramIndex++;
    }

    if (filters.startDateFrom) {
      whereConditions.push(`e.start_date >= $${paramIndex}`);
      queryParams.push(filters.startDateFrom);
      paramIndex++;
    }

    if (filters.startDateTo) {
      whereConditions.push(`e.start_date <= $${paramIndex}`);
      queryParams.push(filters.startDateTo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      WHERE ${whereClause}
    `;

    const countResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query with pagination
    const limit = filters.limit || 50;
    const offset = ((filters.page || 1) - 1) * limit;
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';

    const mainQuery = `
      SELECT e.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', pr.id,
                   'registrationBody', pr.registration_body,
                   'registrationNumber', pr.registration_number,
                   'registrationType', pr.registration_type,
                   'issueDate', pr.issue_date,
                   'expiryDate', pr.expiry_date,
                   'status', pr.status
                 )
               ) FILTER (WHERE pr.id IS NOT NULL), '[]'
             ) as professional_registrations
      FROM employees e
      LEFT JOIN professional_registrations pr ON e.id = pr.employee_id
      WHERE ${whereClause}
      GROUP BY e.id
      ORDER BY e.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await this.pool.query(mainQuery, queryParams);
    const employees = result.rows.map(row => this.mapRowToEmployee(row));

    return { employees, total };
  }

  // Payroll operations

  async createPayrollRecord(payrollRecord: PayrollRecord): Promise<PayrollRecord> {
    const query = `
      INSERT INTO payroll_records (
        id, employee_id, payroll_period, gross_pay, basic_pay, overtime_pay,
        bonuses, allowances, benefits_in_kind, income_tax, national_insurance,
        pension_contribution, student_loan, court_orders, other_deductions,
        net_pay, hours_worked, overtime_hours, sick_hours, holiday_hours,
        employer_ni, employer_pension, apprenticeship_levy, tax_code,
        tax_period, cumulative_gross_pay, cumulative_tax, cumulative_ni,
        status, processed_date, payment_date, payment_method, payment_reference,
        hmrc_submitted, hmrc_submission_date, pension_submitted,
        pension_submission_date, care_home_id, created_at, updated_at,
        processed_by, correlation_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42
      ) RETURNING *
    `;

    const result = await this.pool.query(query, [
      payrollRecord.id,
      payrollRecord.employeeId,
      payrollRecord.payrollPeriod,
      payrollRecord.grossPay,
      payrollRecord.basicPay || 0,
      payrollRecord.overtimePay || 0,
      payrollRecord.bonuses || 0,
      payrollRecord.allowances || 0,
      payrollRecord.benefitsInKind || 0,
      payrollRecord.incomeTax,
      payrollRecord.nationalInsurance,
      payrollRecord.pensionContribution,
      payrollRecord.studentLoan || 0,
      payrollRecord.courtOrders || 0,
      payrollRecord.otherDeductions || 0,
      payrollRecord.netPay,
      payrollRecord.hoursWorked,
      payrollRecord.overtimeHours || 0,
      payrollRecord.sickHours || 0,
      payrollRecord.holidayHours || 0,
      payrollRecord.employerNI,
      payrollRecord.employerPension,
      payrollRecord.apprenticeshipLevy || 0,
      payrollRecord.taxCode,
      payrollRecord.taxPeriod || 1,
      payrollRecord.cumulativeGrossPay || payrollRecord.grossPay,
      payrollRecord.cumulativeTax || payrollRecord.incomeTax,
      payrollRecord.cumulativeNI || payrollRecord.nationalInsurance,
      payrollRecord.status,
      payrollRecord.processedDate,
      payrollRecord.paymentDate,
      payrollRecord.paymentMethod,
      payrollRecord.paymentReference,
      payrollRecord.hmrcSubmitted || false,
      payrollRecord.hmrcSubmissionDate,
      payrollRecord.pensionSubmitted || false,
      payrollRecord.pensionSubmissionDate,
      payrollRecord.careHomeId,
      new Date(),
      new Date(),
      payrollRecord.processedBy,
      payrollRecord.correlationId
    ]);

    return this.mapRowToPayrollRecord(result.rows[0]);
  }

  async createPayrollSummary(summary: PayrollSummary): Promise<PayrollSummary> {
    const query = `
      INSERT INTO payroll_summaries (
        id, payroll_period, processed_date, employee_count, total_gross_pay,
        total_net_pay, total_income_tax, total_national_insurance,
        total_pension_contributions, total_employer_ni, total_employer_pension,
        total_apprenticeship_levy, status, hmrc_submission_required,
        hmrc_submitted, hmrc_submission_date, care_home_id, correlation_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `;

    const result = await this.pool.query(query, [
      summary.id,
      summary.payrollPeriod,
      summary.processedDate,
      summary.employeeCount,
      summary.totalGrossPay,
      summary.totalNetPay,
      summary.totalIncomeTax,
      summary.totalNationalInsurance,
      summary.totalPensionContributions,
      summary.totalEmployerNI,
      summary.totalEmployerPension,
      summary.totalApprenticeshipLevy || 0,
      summary.status,
      summary.hmrcSubmissionRequired || false,
      summary.hmrcSubmitted || false,
      summary.hmrcSubmissionDate,
      summary.careHomeId,
      summary.correlationId
    ]);

    return this.mapRowToPayrollSummary(result.rows[0]);
  }

  async getEmployeeHours(employeeId: string, payrollPeriod: string): Promise<{ regular: number, overtime: number }> {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN shift_type IN ('day', 'evening') THEN duration ELSE 0 END), 0) as regular_hours,
        COALESCE(SUM(CASE WHEN shift_type = 'overtime' OR duration > 8 THEN GREATEST(duration - 8, 0) ELSE 0 END), 0) as overtime_hours
      FROM shifts 
      WHERE employee_id = $1 
      AND DATE_TRUNC('month', shift_date) = DATE_TRUNC('month', $2::date)
      ANDstatus = 'completed'
      AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [employeeId, payrollPeriod + '-01']);
    
    return {
      regular: parseFloat(result.rows[0].regular_hours) || 0,
      overtime: parseFloat(result.rows[0].overtime_hours) || 0
    };
  }

  async getEmployeePensionScheme(employeeId: string): Promise<PensionScheme | null> {
    const query = `
      SELECT ps.* 
      FROM pension_schemes ps
      JOIN employee_pension_schemes eps ON ps.id = eps.pension_scheme_id
      WHERE eps.employee_id = $1 AND eps.is_active = true AND ps.is_active = true
      LIMIT 1
    `;

    const result = await this.pool.query(query, [employeeId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPensionScheme(result.rows[0]);
  }

  // Training operations

  async createTrainingRecord(trainingRecord: TrainingRecord): Promise<TrainingRecord> {
    const query = `
      INSERT INTO training_records (
        id, employee_id, training_type, training_name, provider, completion_date,
        expiry_date, certificate_number, training_hours, cost, is_mandatory,
        training_method, assessment_result, assessment_score, cpd_points,
        regulatory_requirement, compliance_status, certificate_url, notes,
        status, care_home_id, created_at, updated_at, recorded_by, correlation_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25
      ) RETURNING *
    `;

    const result = await this.pool.query(query, [
      trainingRecord.id,
      trainingRecord.employeeId,
      trainingRecord.trainingType,
      trainingRecord.trainingName,
      trainingRecord.provider,
      trainingRecord.completionDate,
      trainingRecord.expiryDate,
      trainingRecord.certificateNumber,
      trainingRecord.trainingHours,
      trainingRecord.cost,
      trainingRecord.isMandatory,
      trainingRecord.trainingMethod,
      trainingRecord.assessmentResult,
      trainingRecord.assessmentScore,
      trainingRecord.cpdPoints,
      trainingRecord.regulatoryRequirement,
      trainingRecord.complianceStatus,
      trainingRecord.certificateUrl,
      trainingRecord.notes,
      trainingRecord.status,
      trainingRecord.careHomeId,
      trainingRecord.createdAt,
      trainingRecord.updatedAt,
      trainingRecord.recordedBy,
      trainingRecord.correlationId
    ]);

    return this.mapRowToTrainingRecord(result.rows[0]);
  }

  // Shift operations

  async createShift(shift: Shift): Promise<Shift> {
    const query = `
      INSERT INTO shifts (
        id, employee_id, shift_date, start_time, end_time, break_duration,
        duration, shift_type, department, location, role, hourly_rate,
        overtime_rate, night_shift_premium, weekend_premium, bank_holiday_premium,
        actual_start_time, actual_end_time, actual_break_duration, actual_duration,
        is_voluntary, requires_special_skills, minimum_staffing_level, status,
        notes, approved_by, approved_at, care_home_id, created_at, updated_at,
        created_by, correlation_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
      ) RETURNING *
    `;

    const result = await this.pool.query(query, [
      shift.id,
      shift.employeeId,
      shift.shiftDate,
      shift.startTime,
      shift.endTime,
      shift.breakDuration,
      shift.duration,
      shift.shiftType,
      shift.department,
      shift.location,
      shift.role,
      shift.hourlyRate,
      shift.overtimeRate,
      shift.nightShiftPremium,
      shift.weekendPremium,
      shift.bankHolidayPremium,
      shift.actualStartTime,
      shift.actualEndTime,
      shift.actualBreakDuration,
      shift.actualDuration,
      shift.isVoluntary,
      JSON.stringify(shift.requiresSpecialSkills),
      shift.minimumStaffingLevel,
      shift.status,
      shift.notes,
      shift.approvedBy,
      shift.approvedAt,
      shift.careHomeId,
      shift.createdAt,
      shift.updatedAt,
      shift.createdBy,
      shift.correlationId
    ]);

    return this.mapRowToShift(result.rows[0]);
  }

  // HR Metrics operations

  async getEmployeeCount(careHomeId: string, period: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHENstatus = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN start_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_hires,
        COUNT(CASE WHEN termination_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as leavers
      FROM employees 
      WHERE care_home_id = $1 AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [careHomeId]);
    return result.rows[0];
  }

  async getTurnoverRate(careHomeId: string, period: string): Promise<number> {
    const query = `
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE (COUNT(CASE WHEN termination_date IS NOT NULL THEN 1 END) * 100.0 / COUNT(*))
        END as turnover_rate
      FROM employees 
      WHERE care_home_id = $1 AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [careHomeId]);
    return parseFloat(result.rows[0].turnover_rate) || 0;
  }

  async getAverageTenure(careHomeId: string): Promise<number> {
    const query = `
      SELECT 
        AVG(
          EXTRACT(EPOCH FROM (COALESCE(termination_date, CURRENT_DATE) - start_date)) / (30.44 * 24 * 3600)
        ) as average_tenure_months
      FROM employees 
      WHERE care_home_id = $1 AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [careHomeId]);
    return parseFloat(result.rows[0].average_tenure_months) || 0;
  }

  async getTrainingComplianceRate(careHomeId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN compliance_rate >= 100 THEN 1 END) as compliant_employees,
        AVG(compliance_rate) as overall_rate,
        AVG(CASE WHEN is_mandatory THEN compliance_rate END) as mandatory_rate,
        COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring,
        SUM(training_hours) as total_hours
      FROM (
        SELECT 
          e.id,
          e.care_home_id,
          COALESCE(
            (COUNT(tr.id) * 100.0 / NULLIF(COUNT(DISTINCT tr.training_type), 0)), 0
          ) as compliance_rate,
          bool_or(tr.is_mandatory) as is_mandatory,
          SUM(tr.training_hours) as training_hours,
          MIN(tr.expiry_date) as expiry_date
        FROM employees e
        LEFT JOIN training_records tr ON e.id = tr.employee_id 
          AND tr.status = 'completed' 
          AND (tr.expiry_date IS NULL OR tr.expiry_date > CURRENT_DATE)
        WHERE e.care_home_id = $1 AND e.deleted_at IS NULL
        GROUP BY e.id, e.care_home_id
      ) compliance_data
    `;

    const result = await this.pool.query(query, [careHomeId]);
    return result.rows[0];
  }

  async getPayrollCosts(careHomeId: string, period: string): Promise<any> {
    const query = `
      SELECT 
        SUM(gross_pay) as total,
        AVG(gross_pay) as average,
        SUM(overtime_pay) as overtime,
        SUM(allowances + benefits_in_kind) as benefits,
        SUM(income_tax + national_insurance + employer_ni) as tax_and_ni
      FROM payroll_records pr
      JOIN employees e ON pr.employee_id = e.id
      WHERE e.care_home_id = $1 
      AND pr.payroll_period LIKE $2
      AND pr.deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [careHomeId, `${period}%`]);
    return result.rows[0];
  }

  async getAbsenteeismRate(careHomeId: string, period: string): Promise<number> {
    const query = `
      SELECT 
        CASE 
          WHEN SUM(s.duration) = 0 THEN 0
          ELSE (SUM(s.sick_hours) * 100.0 / SUM(s.duration))
        END as absenteeism_rate
      FROM shifts s
      JOIN employees e ON s.employee_id = e.id
      WHERE e.care_home_id = $1 
      AND DATE_TRUNC('month', s.shift_date) = DATE_TRUNC('month', $2::date)
      AND s.deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [careHomeId, period + '-01']);
    return parseFloat(result.rows[0].absenteeism_rate) || 0;
  }

  async getOvertimeHours(careHomeId: string, period: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(overtime_hours), 0) as overtime_hours
      FROM payroll_records pr
      JOIN employees e ON pr.employee_id = e.id
      WHERE e.care_home_id = $1 
      AND pr.payroll_period LIKE $2
      AND pr.deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [careHomeId, `${period}%`]);
    return parseFloat(result.rows[0].overtime_hours) || 0;
  }

  // Additional compliance and metrics methods

  async getSickLeaveRate(careHomeId: string, period: string): Promise<number> {
    // Implementation for sick leave rate calculation
    return 0;
  }

  async getAverageHoursWorked(careHomeId: string, period: string): Promise<number> {
    // Implementation for average hours worked calculation
    return 0;
  }

  async getRightToWorkCompliance(careHomeId: string): Promise<number> {
    // Implementation for right to work compliance calculation
    return 0;
  }

  async getDBSCompliance(careHomeId: string): Promise<number> {
    // Implementation for DBS compliance calculation
    return 0;
  }

  async getHealthSafetyCompliance(careHomeId: string): Promise<number> {
    // Implementation for health and safety compliance calculation
    return 0;
  }

  async getProfessionalRegCompliance(careHomeId: string): Promise<number> {
    // Implementation for professional registration compliance calculation
    return 0;
  }

  // Private mapping methods

  private mapRowToEmployee(row: any): Employee {
    return {
      id: row.id,
      employeeNumber: row.employee_number,
      firstName: row.first_name,
      lastName: row.last_name,
      middleName: row.middle_name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      nationalInsuranceNumber: row.national_insurance_number,
      email: row.email,
      phoneNumber: row.phone_number,
      address: typeof row.address === 'string' ? JSON.parse(row.address) : row.address,
      emergencyContact: typeof row.emergency_contact === 'string' ? JSON.parse(row.emergency_contact) : row.emergency_contact,
      startDate: row.start_date,
      endDate: row.end_date,
      department: row.department,
      position: row.position,
      employmentType: row.employment_type,
      workingPattern: row.working_pattern,
      contractedHours: row.contracted_hours,
      hourlyRate: row.hourly_rate,
      annualSalary: row.annual_salary,
      overtimeRate: row.overtime_rate,
      bankName: row.bank_name,
      bankAccountNumber: row.bank_account_number,
      sortCode: row.sort_code,
      taxCode: row.tax_code,
      pensionSchemeOptOut: row.pension_scheme_opt_out,
      status: row.status,
      probationEndDate: row.probation_end_date,
      terminationDate: row.termination_date,
      terminationReason: row.termination_reason,
      rightToWorkVerified: row.right_to_work_verified,
      rightToWorkExpiryDate: row.right_to_work_expiry_date,
      dbsCheckDate: row.dbs_check_date,
      dbsCheckNumber: row.dbs_check_number,
      dbsExpiryDate: row.dbs_expiry_date,
      professionalRegistrations: Array.isArray(row.professional_registrations) ? 
        row.professional_registrations : 
        (typeof row.professional_registrations === 'string' ? 
          JSON.parse(row.professional_registrations) : []),
      careHomeId: row.care_home_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      version: row.version,
      correlationId: row.correlation_id
    };
  }

  private mapRowToPayrollRecord(row: any): PayrollRecord {
    return {
      id: row.id,
      employeeId: row.employee_id,
      payrollPeriod: row.payroll_period,
      grossPay: parseFloat(row.gross_pay),
      basicPay: parseFloat(row.basic_pay) || 0,
      overtimePay: parseFloat(row.overtime_pay) || 0,
      bonuses: parseFloat(row.bonuses) || 0,
      allowances: parseFloat(row.allowances) || 0,
      benefitsInKind: parseFloat(row.benefits_in_kind) || 0,
      incomeTax: parseFloat(row.income_tax),
      nationalInsurance: parseFloat(row.national_insurance),
      pensionContribution: parseFloat(row.pension_contribution),
      studentLoan: parseFloat(row.student_loan) || 0,
      courtOrders: parseFloat(row.court_orders) || 0,
      otherDeductions: parseFloat(row.other_deductions) || 0,
      netPay: parseFloat(row.net_pay),
      hoursWorked: parseFloat(row.hours_worked),
      overtimeHours: parseFloat(row.overtime_hours) || 0,
      sickHours: parseFloat(row.sick_hours) || 0,
      holidayHours: parseFloat(row.holiday_hours) || 0,
      employerNI: parseFloat(row.employer_ni),
      employerPension: parseFloat(row.employer_pension),
      apprenticeshipLevy: parseFloat(row.apprenticeship_levy) || 0,
      taxCode: row.tax_code,
      taxPeriod: row.tax_period,
      cumulativeGrossPay: parseFloat(row.cumulative_gross_pay),
      cumulativeTax: parseFloat(row.cumulative_tax),
      cumulativeNI: parseFloat(row.cumulative_ni),
      status: row.status,
      processedDate: row.processed_date,
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      hmrcSubmitted: row.hmrc_submitted,
      hmrcSubmissionDate: row.hmrc_submission_date,
      pensionSubmitted: row.pension_submitted,
      pensionSubmissionDate: row.pension_submission_date,
      careHomeId: row.care_home_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      processedBy: row.processed_by,
      correlationId: row.correlation_id
    };
  }

  private mapRowToPayrollSummary(row: any): PayrollSummary {
    return {
      id: row.id,
      payrollPeriod: row.payroll_period,
      processedDate: row.processed_date,
      employeeCount: row.employee_count,
      totalGrossPay: parseFloat(row.total_gross_pay),
      totalNetPay: parseFloat(row.total_net_pay),
      totalIncomeTax: parseFloat(row.total_income_tax),
      totalNationalInsurance: parseFloat(row.total_national_insurance),
      totalPensionContributions: parseFloat(row.total_pension_contributions),
      totalEmployerNI: parseFloat(row.total_employer_ni),
      totalEmployerPension: parseFloat(row.total_employer_pension),
      totalApprenticeshipLevy: parseFloat(row.total_apprenticeship_levy) || 0,
      status: row.status,
      hmrcSubmissionRequired: row.hmrc_submission_required,
      hmrcSubmitted: row.hmrc_submitted,
      hmrcSubmissionDate: row.hmrc_submission_date,
      careHomeId: row.care_home_id,
      correlationId: row.correlation_id
    };
  }

  private mapRowToTrainingRecord(row: any): TrainingRecord {
    return {
      id: row.id,
      employeeId: row.employee_id,
      trainingType: row.training_type,
      trainingName: row.training_name,
      provider: row.provider,
      completionDate: row.completion_date,
      expiryDate: row.expiry_date,
      certificateNumber: row.certificate_number,
      trainingHours: row.training_hours,
      cost: parseFloat(row.cost) || 0,
      isMandatory: row.is_mandatory,
      trainingMethod: row.training_method,
      assessmentResult: row.assessment_result,
      assessmentScore: row.assessment_score,
      cpdPoints: row.cpd_points,
      regulatoryRequirement: row.regulatory_requirement,
      complianceStatus: row.compliance_status,
      certificateUrl: row.certificate_url,
      notes: row.notes,
      status: row.status,
      careHomeId: row.care_home_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      recordedBy: row.recorded_by,
      correlationId: row.correlation_id
    };
  }

  private mapRowToShift(row: any): Shift {
    return {
      id: row.id,
      employeeId: row.employee_id,
      shiftDate: row.shift_date,
      startTime: row.start_time,
      endTime: row.end_time,
      breakDuration: row.break_duration,
      duration: parseFloat(row.duration),
      shiftType: row.shift_type,
      department: row.department,
      location: row.location,
      role: row.role,
      hourlyRate: parseFloat(row.hourly_rate) || 0,
      overtimeRate: parseFloat(row.overtime_rate) || 0,
      nightShiftPremium: parseFloat(row.night_shift_premium) || 0,
      weekendPremium: parseFloat(row.weekend_premium) || 0,
      bankHolidayPremium: parseFloat(row.bank_holiday_premium) || 0,
      actualStartTime: row.actual_start_time,
      actualEndTime: row.actual_end_time,
      actualBreakDuration: row.actual_break_duration,
      actualDuration: parseFloat(row.actual_duration) || 0,
      isVoluntary: row.is_voluntary,
      requiresSpecialSkills: Array.isArray(row.requires_special_skills) ? 
        row.requires_special_skills : 
        (typeof row.requires_special_skills === 'string' ? 
          JSON.parse(row.requires_special_skills) : []),
      minimumStaffingLevel: row.minimum_staffing_level,
      status: row.status,
      notes: row.notes,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      careHomeId: row.care_home_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      correlationId: row.correlation_id
    };
  }

  private mapRowToPensionScheme(row: any): PensionScheme {
    return {
      id: row.id,
      schemeName: row.scheme_name,
      provider: row.provider,
      employeeContributionRate: parseFloat(row.employee_contribution_rate),
      employerContributionRate: parseFloat(row.employer_contribution_rate),
      isActive: row.is_active,
      autoEnrolment: row.auto_enrolment
    };
  }
}
