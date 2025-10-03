-- HR & Payroll Service Database Schema
-- WriteCareNotes - British Isles Adult Care Home Management System
-- 
-- This schema supports comprehensive HR and payroll management including:
-- - Employee management with UK employment law compliance
-- - Payroll processing with PAYE and pension calculations
-- - Training records and compliance tracking
-- - Shift scheduling and working time regulations
-- - Performance management and reviews
-- - Professional registrations and certifications
-- 
-- Compliance: Employment Rights Act 1996, Working Time Regulations 1998,
-- PAYE regulations, Auto-enrolment pension regulations, GDPR

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table - Core employee information
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal information (some fields encrypted)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(30),
    national_insurance_number TEXT NOT NULL, -- Encrypted
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address JSONB NOT NULL,
    emergency_contact JSONB NOT NULL, -- Contains encrypted phone numbers
    
    -- Employment details
    start_date DATE NOT NULL,
    end_date DATE,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL CHECK (employment_type IN ('permanent', 'temporary', 'contract', 'apprentice', 'volunteer')),
    working_pattern VARCHAR(50) NOT NULL CHECK (working_pattern IN ('full_time', 'part_time', 'zero_hours', 'flexible')),
    contracted_hours DECIMAL(5,2) NOT NULL CHECK (contracted_hours >= 0),
    
    -- Compensation (encrypted sensitive data)
    hourly_rate DECIMAL(10,4) CHECK (hourly_rate >= 0),
    annual_salary DECIMAL(12,2) CHECK (annual_salary >= 0),
    overtime_rate DECIMAL(10,4) CHECK (overtime_rate >= 0),
    
    -- Banking details (encrypted)
    bank_name VARCHAR(100),
    bank_account_number TEXT, -- Encrypted
    sort_code TEXT, -- Encrypted
    
    -- Tax and pension
    tax_code VARCHAR(20),
    pension_scheme_opt_out BOOLEAN DEFAULT FALSE,
    
    -- Status and compliance
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
    probation_end_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    
    -- Compliance records
    right_to_work_verified BOOLEAN DEFAULT FALSE,
    right_to_work_expiry_date DATE,
    dbs_check_date DATE,
    dbs_check_number VARCHAR(50),
    dbs_expiry_date DATE,
    
    -- System fields
    care_home_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    version INTEGER DEFAULT 1,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_employee_dates CHECK (start_date <= COALESCE(end_date, start_date)),
    CONSTRAINT chk_probation_date CHECK (probation_end_date IS NULL OR probation_end_date >= start_date),
    CONSTRAINT chk_termination_date CHECK (termination_date IS NULL OR termination_date >= start_date),
    CONSTRAINT chk_compensation CHECK (hourly_rate IS NOT NULL OR annual_salary IS NOT NULL)
);

-- Professional registrations table
CREATE TABLE professional_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    registration_body VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    registration_type VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
    verification_date DATE,
    verified_by UUID,
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uk_professional_registration UNIQUE (employee_id, registration_body, registration_number),
    CONSTRAINT chk_registration_dates CHECK (issue_date <= COALESCE(expiry_date, issue_date))
);

-- Employment contracts table
CREATE TABLE employment_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('permanent', 'fixed_term', 'zero_hours', 'apprenticeship')),
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    
    -- Terms and conditions
    probation_period INTEGER DEFAULT 6 CHECK (probation_period >= 0), -- Months
    notice_period INTEGER DEFAULT 28 CHECK (notice_period >= 0), -- Days
    working_hours DECIMAL(5,2) NOT NULL CHECK (working_hours >= 0),
    overtime_policy TEXT,
    holiday_entitlement INTEGER DEFAULT 28 CHECK (holiday_entitlement >= 0), -- Days per year
    sick_pay_policy TEXT,
    pension_scheme VARCHAR(255),
    
    -- Benefits and allowances
    benefits JSONB DEFAULT '[]',
    allowances JSONB DEFAULT '[]',
    
    -- Clauses
    non_compete_clause BOOLEAN DEFAULT FALSE,
    confidentiality_clause BOOLEAN DEFAULT TRUE,
    garden_leave_clause BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    signed_date DATE,
    signed_by_employee BOOLEAN DEFAULT FALSE,
    signed_by_employer BOOLEAN DEFAULT FALSE,
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_contract_dates CHECK (contract_start_date <= COALESCE(contract_end_date, contract_start_date))
);

-- Payroll records table
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    payroll_period VARCHAR(20) NOT NULL, -- Format: YYYY-MM or YYYY-WW
    
    -- Earnings
    gross_pay DECIMAL(12,4) NOT NULL CHECK (gross_pay >= 0),
    basic_pay DECIMAL(12,4) DEFAULT 0 CHECK (basic_pay >= 0),
    overtime_pay DECIMAL(12,4) DEFAULT 0 CHECK (overtime_pay >= 0),
    bonuses DECIMAL(12,4) DEFAULT 0 CHECK (bonuses >= 0),
    allowances DECIMAL(12,4) DEFAULT 0 CHECK (allowances >= 0),
    benefits_in_kind DECIMAL(12,4) DEFAULT 0 CHECK (benefits_in_kind >= 0),
    
    -- Deductions
    income_tax DECIMAL(12,4) NOT NULL CHECK (income_tax >= 0),
    national_insurance DECIMAL(12,4) NOT NULL CHECK (national_insurance >= 0),
    pension_contribution DECIMAL(12,4) DEFAULT 0 CHECK (pension_contribution >= 0),
    student_loan DECIMAL(12,4) DEFAULT 0 CHECK (student_loan >= 0),
    court_orders DECIMAL(12,4) DEFAULT 0 CHECK (court_orders >= 0),
    other_deductions DECIMAL(12,4) DEFAULT 0 CHECK (other_deductions >= 0),
    
    -- Net pay
    net_pay DECIMAL(12,4) NOT NULL CHECK (net_pay >= 0),
    
    -- Hours
    hours_worked DECIMAL(6,2) NOT NULL CHECK (hours_worked >= 0),
    overtime_hours DECIMAL(6,2) DEFAULT 0 CHECK (overtime_hours >= 0),
    sick_hours DECIMAL(6,2) DEFAULT 0 CHECK (sick_hours >= 0),
    holiday_hours DECIMAL(6,2) DEFAULT 0 CHECK (holiday_hours >= 0),
    
    -- Employer costs
    employer_ni DECIMAL(12,4) NOT NULL CHECK (employer_ni >= 0),
    employer_pension DECIMAL(12,4) NOT NULL CHECK (employer_pension >= 0),
    apprenticeship_levy DECIMAL(12,4) DEFAULT 0 CHECK (apprenticeship_levy >= 0),
    
    -- Tax details
    tax_code VARCHAR(20) NOT NULL,
    tax_period INTEGER DEFAULT 1 CHECK (tax_period > 0),
    cumulative_gross_pay DECIMAL(12,4) NOT NULL CHECK (cumulative_gross_pay >= 0),
    cumulative_tax DECIMAL(12,4) NOT NULL CHECK (cumulative_tax >= 0),
    cumulative_ni DECIMAL(12,4) NOT NULL CHECK (cumulative_ni >= 0),
    
    -- Status and processing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid', 'cancelled')),
    processed_date TIMESTAMP NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(20) CHECK (payment_method IN ('bacs', 'cheque', 'cash', 'faster_payments')),
    payment_reference VARCHAR(100),
    
    -- Compliance
    hmrc_submitted BOOLEAN DEFAULT FALSE,
    hmrc_submission_date TIMESTAMP,
    pension_submitted BOOLEAN DEFAULT FALSE,
    pension_submission_date TIMESTAMP,
    
    -- System fields
    care_home_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    processed_by UUID NOT NULL,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT uk_payroll_record UNIQUE (employee_id, payroll_period),
    CONSTRAINT chk_net_pay_calculation CHECK (
        net_pay = gross_pay - income_tax - national_insurance - pension_contribution - 
        student_loan - court_orders - other_deductions
    )
);

-- Payroll summaries table
CREATE TABLE payroll_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period VARCHAR(20) NOT NULL,
    processed_date TIMESTAMP NOT NULL,
    
    -- Summary totals
    employee_count INTEGER NOT NULL CHECK (employee_count > 0),
    total_gross_pay DECIMAL(15,4) NOT NULL CHECK (total_gross_pay >= 0),
    total_net_pay DECIMAL(15,4) NOT NULL CHECK (total_net_pay >= 0),
    total_income_tax DECIMAL(15,4) NOT NULL CHECK (total_income_tax >= 0),
    total_national_insurance DECIMAL(15,4) NOT NULL CHECK (total_national_insurance >= 0),
    total_pension_contributions DECIMAL(15,4) NOT NULL CHECK (total_pension_contributions >= 0),
    
    -- Employer costs
    total_employer_ni DECIMAL(15,4) NOT NULL CHECK (total_employer_ni >= 0),
    total_employer_pension DECIMAL(15,4) NOT NULL CHECK (total_employer_pension >= 0),
    total_apprenticeship_levy DECIMAL(15,4) DEFAULT 0 CHECK (total_apprenticeship_levy >= 0),
    
    -- Status
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    
    -- Compliance
    hmrc_submission_required BOOLEAN DEFAULT TRUE,
    hmrc_submitted BOOLEAN DEFAULT FALSE,
    hmrc_submission_date TIMESTAMP,
    
    -- System fields
    care_home_id UUID NOT NULL,
    correlation_id UUID
);

-- Training records table
CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    
    -- Training details
    training_type VARCHAR(100) NOT NULL,
    training_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    completion_date DATE NOT NULL,
    expiry_date DATE,
    certificate_number VARCHAR(100),
    training_hours DECIMAL(6,2) CHECK (training_hours >= 0),
    cost DECIMAL(10,2) CHECK (cost >= 0),
    
    -- Training characteristics
    is_mandatory BOOLEAN DEFAULT FALSE,
    training_method VARCHAR(50) NOT NULL CHECK (training_method IN ('classroom', 'online', 'practical', 'blended')),
    assessment_result VARCHAR(20) CHECK (assessment_result IN ('pass', 'fail', 'distinction', 'merit')),
    assessment_score DECIMAL(5,2) CHECK (assessment_score >= 0 AND assessment_score <= 100),
    
    -- Compliance and CPD
    cpd_points DECIMAL(5,2) CHECK (cpd_points >= 0),
    regulatory_requirement VARCHAR(255),
    compliance_status VARCHAR(20) DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'expired', 'expiring_soon', 'not_required')),
    
    -- Documentation
    certificate_url TEXT,
    notes TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
    
    -- System fields
    care_home_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    recorded_by UUID NOT NULL,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_training_dates CHECK (completion_date <= COALESCE(expiry_date, completion_date))
);

-- Shifts table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    
    -- Shift timing
    shift_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    break_duration INTEGER DEFAULT 0 CHECK (break_duration >= 0), -- Minutes
    duration DECIMAL(6,2) NOT NULL CHECK (duration > 0), -- Hours
    
    -- Shift details
    shift_type VARCHAR(50) NOT NULL CHECK (shift_type IN ('day', 'night', 'evening', 'weekend', 'bank_holiday', 'on_call')),
    department VARCHAR(100),
    location VARCHAR(100),
    role VARCHAR(100),
    
    -- Pay details
    hourly_rate DECIMAL(10,4) CHECK (hourly_rate >= 0),
    overtime_rate DECIMAL(10,4) CHECK (overtime_rate >= 0),
    night_shift_premium DECIMAL(10,4) DEFAULT 0 CHECK (night_shift_premium >= 0),
    weekend_premium DECIMAL(10,4) DEFAULT 0 CHECK (weekend_premium >= 0),
    bank_holiday_premium DECIMAL(10,4) DEFAULT 0 CHECK (bank_holiday_premium >= 0),
    
    -- Actual vs scheduled
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_break_duration INTEGER CHECK (actual_break_duration >= 0),
    actual_duration DECIMAL(6,2) CHECK (actual_duration >= 0),
    
    -- Compliance
    is_voluntary BOOLEAN DEFAULT TRUE,
    requires_special_skills JSONB DEFAULT '[]',
    minimum_staffing_level INTEGER CHECK (minimum_staffing_level > 0),
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    
    -- Notes and approvals
    notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- System fields
    care_home_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID NOT NULL,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_shift_times CHECK (start_time < end_time),
    CONSTRAINT chk_actual_times CHECK (actual_start_time IS NULL OR actual_end_time IS NULL OR actual_start_time < actual_end_time)
);

-- Performance reviews table
CREATE TABLE performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    
    -- Review period
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('probation', 'annual', 'mid_year', 'disciplinary', 'return_to_work')),
    
    -- Overall assessment
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    overall_comments TEXT NOT NULL,
    
    -- Objectives and competencies (stored as JSONB for flexibility)
    objectives JSONB DEFAULT '[]',
    competencies JSONB DEFAULT '[]',
    
    -- Development
    strengths TEXT[],
    areas_for_improvement TEXT[],
    development_plan JSONB DEFAULT '[]',
    training_needs TEXT[],
    
    -- Future planning
    next_review_date DATE NOT NULL,
    salary_review_recommendation VARCHAR(20) CHECK (salary_review_recommendation IN ('increase', 'maintain', 'decrease')),
    salary_increase_amount DECIMAL(10,2) CHECK (salary_increase_amount >= 0),
    promotion_recommendation BOOLEAN DEFAULT FALSE,
    promotion_details TEXT,
    
    -- Comments
    employee_comments TEXT,
    manager_comments TEXT NOT NULL,
    hr_comments TEXT,
    
    -- Status and approvals
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_employee', 'pending_manager', 'pending_hr', 'completed')),
    employee_signed BOOLEAN DEFAULT FALSE,
    employee_signed_date DATE,
    manager_signed BOOLEAN DEFAULT FALSE,
    manager_signed_date DATE,
    hr_approved BOOLEAN DEFAULT FALSE,
    hr_approved_date DATE,
    
    -- System fields
    care_home_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    reviewed_by UUID NOT NULL,
    approved_by UUID,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_review_period CHECK (review_period_start <= review_period_end),
    CONSTRAINT chk_next_review_date CHECK (next_review_date > review_period_end)
);

-- Pension schemes table
CREATE TABLE pension_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    employee_contribution_rate DECIMAL(5,4) NOT NULL CHECK (employee_contribution_rate >= 0 AND employee_contribution_rate <= 1),
    employer_contribution_rate DECIMAL(5,4) NOT NULL CHECK (employer_contribution_rate >= 0 AND employer_contribution_rate <= 1),
    is_active BOOLEAN DEFAULT TRUE,
    auto_enrolment BOOLEAN DEFAULT TRUE,
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee pension schemes junction table
CREATE TABLE employee_pension_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    pension_scheme_id UUID NOT NULL REFERENCES pension_schemes(id),
    enrollment_date DATE NOT NULL,
    opt_out_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uk_employee_pension_scheme UNIQUE (employee_id, pension_scheme_id),
    CONSTRAINT chk_pension_dates CHECK (enrollment_date <= COALESCE(opt_out_date, enrollment_date))
);

-- HR metrics cache table for performance
CREATE TABLE hr_metrics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_home_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    period VARCHAR(50) NOT NULL,
    metric_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT uk_hr_metrics_cache UNIQUE (care_home_id, metric_type, period)
);

-- Audit trail table for HR operations
CREATE TABLE hr_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    correlation_id UUID,
    ip_address INET,
    user_agent TEXT,
    
    -- Compliance flags
    gdpr_relevant BOOLEAN DEFAULT FALSE,
    employment_law_relevant BOOLEAN DEFAULT FALSE,
    payroll_relevant BOOLEAN DEFAULT FALSE
);

-- Indexes for performance optimization

-- Employee indexes
CREATE INDEX idx_employees_care_home_id ON employees(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_employee_number ON employees(employee_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_status ON employees(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_department ON employees(department) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_start_date ON employees(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_probation_end_date ON employees(probation_end_date) WHERE probation_end_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_employees_dbs_expiry ON employees(dbs_expiry_date) WHERE dbs_expiry_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_employees_correlation_id ON employees(correlation_id) WHERE correlation_id IS NOT NULL;

-- Professional registrations indexes
CREATE INDEX idx_professional_registrations_employee_id ON professional_registrations(employee_id);
CREATE INDEX idx_professional_registrations_expiry_date ON professional_registrations(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_professional_registrations_status ON professional_registrations(status);

-- Employment contracts indexes
CREATE INDEX idx_employment_contracts_employee_id ON employment_contracts(employee_id);
CREATE INDEX idx_employment_contracts_status ON employment_contracts(status);
CREATE INDEX idx_employment_contracts_contract_end_date ON employment_contracts(contract_end_date) WHERE contract_end_date IS NOT NULL;

-- Payroll records indexes
CREATE INDEX idx_payroll_records_employee_id ON payroll_records(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_records_care_home_id ON payroll_records(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_records_payroll_period ON payroll_records(payroll_period) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_records_status ON payroll_records(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_records_processed_date ON payroll_records(processed_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_records_hmrc_submitted ON payroll_records(hmrc_submitted) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_records_correlation_id ON payroll_records(correlation_id) WHERE correlation_id IS NOT NULL;

-- Payroll summaries indexes
CREATE INDEX idx_payroll_summaries_care_home_id ON payroll_summaries(care_home_id);
CREATE INDEX idx_payroll_summaries_payroll_period ON payroll_summaries(payroll_period);
CREATE INDEX idx_payroll_summaries_status ON payroll_summaries(status);
CREATE INDEX idx_payroll_summaries_processed_date ON payroll_summaries(processed_date);

-- Training records indexes
CREATE INDEX idx_training_records_employee_id ON training_records(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_records_care_home_id ON training_records(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_records_training_type ON training_records(training_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_records_expiry_date ON training_records(expiry_date) WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_training_records_compliance_status ON training_records(compliance_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_records_is_mandatory ON training_records(is_mandatory) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_records_completion_date ON training_records(completion_date) WHERE deleted_at IS NULL;

-- Shifts indexes
CREATE INDEX idx_shifts_employee_id ON shifts(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shifts_care_home_id ON shifts(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shifts_shift_date ON shifts(shift_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_shifts_start_time ON shifts(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_shifts_status ON shifts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_shifts_department ON shifts(department) WHERE deleted_at IS NULL;
CREATE INDEX idx_shifts_shift_type ON shifts(shift_type) WHERE deleted_at IS NULL;

-- Performance reviews indexes
CREATE INDEX idx_performance_reviews_employee_id ON performance_reviews(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_performance_reviews_care_home_id ON performance_reviews(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_performance_reviews_review_type ON performance_reviews(review_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_performance_reviews_next_review_date ON performance_reviews(next_review_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_performance_reviews_status ON performance_reviews(status) WHERE deleted_at IS NULL;

-- Pension schemes indexes
CREATE INDEX idx_pension_schemes_is_active ON pension_schemes(is_active);
CREATE INDEX idx_employee_pension_schemes_employee_id ON employee_pension_schemes(employee_id);
CREATE INDEX idx_employee_pension_schemes_is_active ON employee_pension_schemes(is_active);

-- HR metrics cache indexes
CREATE INDEX idx_hr_metrics_cache_care_home_id ON hr_metrics_cache(care_home_id);
CREATE INDEX idx_hr_metrics_cache_expires_at ON hr_metrics_cache(expires_at);

-- HR audit trail indexes
CREATE INDEX idx_hr_audit_trail_entity_type_id ON hr_audit_trail(entity_type, entity_id);
CREATE INDEX idx_hr_audit_trail_user_id ON hr_audit_trail(user_id);
CREATE INDEX idx_hr_audit_trail_timestamp ON hr_audit_trail(timestamp);
CREATE INDEX idx_hr_audit_trail_correlation_id ON hr_audit_trail(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_hr_audit_trail_gdpr_relevant ON hr_audit_trail(gdpr_relevant) WHERE gdpr_relevant = true;
CREATE INDEX idx_hr_audit_trail_employment_law_relevant ON hr_audit_trail(employment_law_relevant) WHERE employment_law_relevant = true;
CREATE INDEX idx_hr_audit_trail_payroll_relevant ON hr_audit_trail(payroll_relevant) WHERE payroll_relevant = true;

-- Composite indexes for common query patterns
CREATE INDEX idx_employees_care_home_status ON employees(care_home_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_department_status ON employees(department, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_records_employee_period ON payroll_records(employee_id, payroll_period) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_records_employee_mandatory ON training_records(employee_id, is_mandatory) WHERE deleted_at IS NULL;
CREATE INDEX idx_shifts_employee_date ON shifts(employee_id, shift_date) WHERE deleted_at IS NULL;

-- Partial indexes for specific use cases
CREATE INDEX idx_employees_probation_ending ON employees(probation_end_date) 
    WHERE probation_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
    AND status = 'active' AND deleted_at IS NULL;

CREATE INDEX idx_training_records_expiring ON training_records(expiry_date) 
    WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' 
    AND status = 'completed' AND deleted_at IS NULL;

CREATE INDEX idx_dbs_checks_expiring ON employees(dbs_expiry_date) 
    WHERE dbs_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' 
    AND status = 'active' AND deleted_at IS NULL;

-- Functions and triggers for audit trail
CREATE OR REPLACE FUNCTION hr_audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO hr_audit_trail (
            entity_type, entity_id, action, new_values, user_id, correlation_id,
            gdpr_relevant, employment_law_relevant, payroll_relevant
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), 
            COALESCE(NEW.created_by, NEW.updated_by), NEW.correlation_id,
            TG_TABLE_NAME IN ('employees', 'professional_registrations'),
            TG_TABLE_NAME IN ('employees', 'employment_contracts', 'performance_reviews'),
            TG_TABLE_NAME IN ('payroll_records', 'payroll_summaries')
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO hr_audit_trail (
            entity_type, entity_id, action, old_values, new_values, user_id, correlation_id,
            gdpr_relevant, employment_law_relevant, payroll_relevant
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW),
            NEW.updated_by, NEW.correlation_id,
            TG_TABLE_NAME IN ('employees', 'professional_registrations'),
            TG_TABLE_NAME IN ('employees', 'employment_contracts', 'performance_reviews'),
            TG_TABLE_NAME IN ('payroll_records', 'payroll_summaries')
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO hr_audit_trail (
            entity_type, entity_id, action, old_values, user_id,
            gdpr_relevant, employment_law_relevant, payroll_relevant
        ) VALUES (
            TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), 
            OLD.updated_by,
            TG_TABLE_NAME IN ('employees', 'professional_registrations'),
            TG_TABLE_NAME IN ('employees', 'employment_contracts', 'performance_reviews'),
            TG_TABLE_NAME IN ('payroll_records', 'payroll_summaries')
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all main tables
CREATE TRIGGER employees_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION hr_audit_trigger_function();

CREATE TRIGGER professional_registrations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON professional_registrations
    FOR EACH ROW EXECUTE FUNCTION hr_audit_trigger_function();

CREATE TRIGGER employment_contracts_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON employment_contracts
    FOR EACH ROW EXECUTE FUNCTION hr_audit_trigger_function();

CREATE TRIGGER payroll_records_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION hr_audit_trigger_function();

CREATE TRIGGER training_records_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON training_records
    FOR EACH ROW EXECUTE FUNCTION hr_audit_trigger_function();

CREATE TRIGGER shifts_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shifts
    FOR EACH ROW EXECUTE FUNCTION hr_audit_trigger_function();

CREATE TRIGGER performance_reviews_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON performance_reviews
    FOR EACH ROW EXECUTE FUNCTION hr_audit_trigger_function();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER employees_updated_at_trigger
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER professional_registrations_updated_at_trigger
    BEFORE UPDATE ON professional_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER employment_contracts_updated_at_trigger
    BEFORE UPDATE ON employment_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payroll_records_updated_at_trigger
    BEFORE UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER training_records_updated_at_trigger
    BEFORE UPDATE ON training_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER shifts_updated_at_trigger
    BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER performance_reviews_updated_at_trigger
    BEFORE UPDATE ON performance_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Active employees view
CREATE VIEW active_employees AS
SELECT 
    e.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', pr.id,
                'registrationBody', pr.registration_body,
                'registrationNumber', pr.registration_number,
                'registrationType', pr.registration_type,
                'status', pr.status,
                'expiryDate', pr.expiry_date
            )
        ) FILTER (WHERE pr.id IS NOT NULL), '[]'
    ) as professional_registrations
FROM employees e
LEFT JOIN professional_registrations pr ON e.id = pr.employee_id
WHERE e.status = 'active' AND e.deleted_at IS NULL
GROUP BY e.id;

-- Training compliance view
CREATE VIEW training_compliance_summary AS
SELECT 
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.department,
    e.care_home_id,
    COUNT(tr.id) as total_training_records,
    COUNT(CASE WHEN tr.is_mandatory = true THEN 1 END) as mandatory_training_count,
    COUNT(CASE WHEN tr.is_mandatory = true AND tr.compliance_status = 'compliant' THEN 1 END) as compliant_mandatory_count,
    COUNT(CASE WHEN tr.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 1 END) as expiring_soon_count,
    CASE 
        WHEN COUNT(CASE WHEN tr.is_mandatory = true THEN 1 END) = 0 THEN 100
        ELSE (COUNT(CASE WHEN tr.is_mandatory = true AND tr.compliance_status = 'compliant' THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN tr.is_mandatory = true THEN 1 END))
    END as compliance_percentage
FROM employees e
LEFT JOIN training_records tr ON e.id = tr.employee_id AND tr.deleted_at IS NULL
WHERE e.status = 'active' AND e.deleted_at IS NULL
GROUP BY e.id, e.first_name, e.last_name, e.department, e.care_home_id;

-- Payroll summary view
CREATE VIEW payroll_summary_view AS
SELECT 
    ps.*,
    (ps.total_gross_pay + ps.total_employer_ni + ps.total_employer_pension + ps.total_apprenticeship_levy) as total_employer_cost,
    CASE 
        WHEN ps.total_gross_pay > 0 THEN (ps.total_income_tax + ps.total_national_insurance) * 100.0 / ps.total_gross_pay
        ELSE 0
    END as effective_tax_rate
FROM payroll_summaries ps;

-- Comments for documentation
COMMENT ON TABLE employees IS 'Core employee information with UK employment law compliance';
COMMENT ON TABLE professional_registrations IS 'Professional body registrations and certifications';
COMMENT ON TABLE employment_contracts IS 'Employment contract terms and conditions';
COMMENT ON TABLE payroll_records IS 'Individual employee payroll records with PAYE calculations';
COMMENT ON TABLE payroll_summaries IS 'Payroll period summaries for reporting and compliance';
COMMENT ON TABLE training_records IS 'Employee training records and compliance tracking';
COMMENT ON TABLE shifts IS 'Shift scheduling with Working Time Regulations compliance';
COMMENT ON TABLE performance_reviews IS 'Employee performance reviews and development planning';
COMMENT ON TABLE pension_schemes IS 'Available pension schemes for auto-enrolment';
COMMENT ON TABLE employee_pension_schemes IS 'Employee pension scheme enrollments';
COMMENT ON TABLE hr_metrics_cache IS 'Cached HR metrics for performance optimization';
COMMENT ON TABLE hr_audit_trail IS 'Comprehensive audit trail for all HR operations';

-- Grant permissions (adjust as needed for your security model)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hr_service_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hr_service_role;