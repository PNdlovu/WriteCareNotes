-- ===============================================
-- WRITECARENOTES ENTERPRISE DATABASE SCHEMA
-- Complete Healthcare Management System
-- Version: 2.0.0 - Enterprise Edition
-- ===============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ===============================================
-- CORE TENANT AND ORGANIZATION TABLES
-- ===============================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    configuration JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'enterprise',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('CARE_HOME', 'NURSING_HOME', 'ASSISTED_LIVING', 'DOMICILIARY', 'NHS_TRUST')),
    cqc_registration VARCHAR(50),
    ofsted_registration VARCHAR(50),
    address JSONB,
    contact_info JSONB,
    settings JSONB DEFAULT '{}',
    compliance_status JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ===============================================
-- USER MANAGEMENT AND AUTHENTICATION
-- ===============================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    preferred_name VARCHAR(100),
    employee_id VARCHAR(50),
    role_id UUID REFERENCES roles(id),
    department VARCHAR(100),
    job_title VARCHAR(100),
    phone_number VARCHAR(20),
    emergency_contact JSONB,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- RESIDENT MANAGEMENT
-- ===============================================

CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    resident_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY')),
    marital_status VARCHAR(20),
    nhs_number VARCHAR(20) UNIQUE,
    ni_number VARCHAR(20),
    passport_number VARCHAR(50),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address JSONB,
    next_of_kin JSONB,
    emergency_contacts JSONB DEFAULT '[]',
    care_level VARCHAR(20) NOT NULL CHECK (care_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'PALLIATIVE')),
    mobility_level VARCHAR(20) CHECK (mobility_level IN ('INDEPENDENT', 'WALKING_AID', 'WHEELCHAIR', 'BEDBOUND')),
    cognitive_level VARCHAR(20) CHECK (cognitive_level IN ('INDEPENDENT', 'MILD_IMPAIRMENT', 'MODERATE_IMPAIRMENT', 'SEVERE_IMPAIRMENT')),
    admission_date DATE NOT NULL,
    discharge_date DATE,
    room_number VARCHAR(20),
    bed_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'DISCHARGED', 'DECEASED', 'TRANSFERRED')),
    funding_source VARCHAR(50),
    care_package_hours INTEGER,
    dna_profile JSONB,
    advance_directives JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    allergies JSONB DEFAULT '[]',
    medical_conditions JSONB DEFAULT '[]',
    dietary_requirements JSONB DEFAULT '[]',
    mobility_aids JSONB DEFAULT '[]',
    photo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ===============================================
-- MEDICATION MANAGEMENT
-- ===============================================

CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_names JSONB DEFAULT '[]',
    dosage_forms JSONB DEFAULT '[]',
    strength VARCHAR(100),
    classification VARCHAR(100),
    controlled_substance_class VARCHAR(10),
    interactions JSONB DEFAULT '[]',
    contraindications JSONB DEFAULT '[]',
    side_effects JSONB DEFAULT '[]',
    monitoring_requirements JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id),
    medication_id UUID NOT NULL REFERENCES medications(id),
    prescriber_id UUID NOT NULL REFERENCES users(id),
    prescription_number VARCHAR(100) UNIQUE NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL,
    instructions TEXT,
    indication VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    review_date DATE,
    quantity_prescribed INTEGER,
    quantity_remaining INTEGER DEFAULT 0,
    refills_remaining INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DISCONTINUED', 'COMPLETED', 'ON_HOLD')),
    discontinuation_reason TEXT,
    is_prn BOOLEAN DEFAULT false,
    prn_indication TEXT,
    max_doses_per_day INTEGER,
    min_interval_hours INTEGER,
    allergies_checked_at TIMESTAMP WITH TIME ZONE,
    interactions_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS medication_administrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    resident_id UUID NOT NULL REFERENCES residents(id),
    administered_by UUID NOT NULL REFERENCES users(id),
    witnessed_by UUID REFERENCES users(id),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_time TIMESTAMP WITH TIME ZONE,
    dosage_given VARCHAR(100),
    route_given VARCHAR(50),
    status VARCHAR(20) NOT NULL CHECK (status IN ('SCHEDULED', 'GIVEN', 'REFUSED', 'WITHHELD', 'MISSED', 'RETURNED')),
    refusal_reason TEXT,
    withhold_reason TEXT,
    miss_reason TEXT,
    notes TEXT,
    side_effects_observed TEXT,
    vital_signs_before JSONB,
    vital_signs_after JSONB,
    pain_score_before INTEGER CHECK (pain_score_before BETWEEN 0 AND 10),
    pain_score_after INTEGER CHECK (pain_score_after BETWEEN 0 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- CARE PLANNING AND ASSESSMENTS
-- ===============================================

CREATE TABLE IF NOT EXISTS care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id),
    plan_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objectives JSONB DEFAULT '[]',
    interventions JSONB DEFAULT '[]',
    target_outcomes JSONB DEFAULT '[]',
    risk_factors JSONB DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'EXPIRED', 'SUPERSEDED')),
    start_date DATE NOT NULL,
    end_date DATE,
    review_frequency_days INTEGER DEFAULT 30,
    next_review_date DATE,
    version INTEGER DEFAULT 1,
    parent_plan_id UUID REFERENCES care_plans(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id),
    assessor_id UUID NOT NULL REFERENCES users(id),
    assessment_type VARCHAR(100) NOT NULL,
    template_id UUID,
    title VARCHAR(255) NOT NULL,
    assessment_data JSONB NOT NULL DEFAULT '{}',
    scores JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'ARCHIVED')),
    completed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    next_assessment_due DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- INCIDENT AND SAFETY MANAGEMENT
-- ===============================================

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    incident_number VARCHAR(100) UNIQUE NOT NULL,
    resident_id UUID REFERENCES residents(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    location VARCHAR(255),
    description TEXT NOT NULL,
    immediate_actions TEXT,
    injuries JSONB DEFAULT '[]',
    witnesses JSONB DEFAULT '[]',
    equipment_involved JSONB DEFAULT '[]',
    environmental_factors TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    discovered_at TIMESTAMP WITH TIME ZONE,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'INVESTIGATING', 'COMPLETED', 'CLOSED')),
    investigation_findings TEXT,
    root_cause_analysis TEXT,
    corrective_actions JSONB DEFAULT '[]',
    preventive_measures JSONB DEFAULT '[]',
    lessons_learned TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    regulatory_notification_required BOOLEAN DEFAULT false,
    regulatory_notified_at TIMESTAMP WITH TIME ZONE,
    family_notified BOOLEAN DEFAULT false,
    family_notified_at TIMESTAMP WITH TIME ZONE,
    gp_notified BOOLEAN DEFAULT false,
    gp_notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ===============================================
-- CARE NOTES AND DOCUMENTATION
-- ===============================================

CREATE TABLE IF NOT EXISTS care_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id),
    author_id UUID NOT NULL REFERENCES users(id),
    note_type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(255),
    content TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
    pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
    appetite_rating INTEGER CHECK (appetite_rating BETWEEN 1 AND 5),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
    behavior_observations TEXT,
    vital_signs JSONB,
    activities_participated JSONB DEFAULT '[]',
    visitors JSONB DEFAULT '[]',
    concerns JSONB DEFAULT '[]',
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    is_significant BOOLEAN DEFAULT false,
    is_confidential BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    shift_type VARCHAR(20) CHECK (shift_type IN ('DAY', 'EVENING', 'NIGHT', 'LONG_DAY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ===============================================
-- STAFFING AND WORKFORCE MANAGEMENT
-- ===============================================

CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    staff_id UUID NOT NULL REFERENCES users(id),
    shift_date DATE NOT NULL,
    shift_start_time TIME NOT NULL,
    shift_end_time TIME NOT NULL,
    shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('DAY', 'EVENING', 'NIGHT', 'LONG_DAY', 'ON_CALL')),
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    break_minutes INTEGER DEFAULT 0,
    is_overtime BOOLEAN DEFAULT false,
    overtime_reason TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id),
    schedule_id UUID REFERENCES staff_schedules(id),
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_end_time TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(5,2),
    break_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    clock_in_location VARCHAR(255),
    clock_out_location VARCHAR(255),
    clock_in_method VARCHAR(20) CHECK (clock_in_method IN ('MANUAL', 'BIOMETRIC', 'RFID', 'MOBILE')),
    clock_out_method VARCHAR(20) CHECK (clock_out_method IN ('MANUAL', 'BIOMETRIC', 'RFID', 'MOBILE')),
    device_info JSONB,
    ip_address INET,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISPUTED', 'APPROVED', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- FINANCIAL MANAGEMENT
-- ===============================================

CREATE TABLE IF NOT EXISTS billing_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id),
    account_number VARCHAR(100) UNIQUE NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    billing_address JSONB,
    primary_payer VARCHAR(100),
    secondary_payer VARCHAR(100),
    payment_terms INTEGER DEFAULT 30,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    billing_account_id UUID NOT NULL REFERENCES billing_accounts(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    service_period_start DATE,
    service_period_end DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_due DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED')),
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ===============================================
-- AUDIT AND COMPLIANCE
-- ===============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    api_endpoint VARCHAR(255),
    compliance_flags JSONB DEFAULT '[]',
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    template_content JSONB NOT NULL,
    fields JSONB DEFAULT '[]',
    validation_rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

-- Core entity indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- Resident indexes
CREATE INDEX idx_residents_tenant_id ON residents(tenant_id);
CREATE INDEX idx_residents_organization_id ON residents(organization_id);
CREATE INDEX idx_residents_status ON residents(status);
CREATE INDEX idx_residents_care_level ON residents(care_level);
CREATE INDEX idx_residents_name ON residents(last_name, first_name);
CREATE INDEX idx_residents_nhs_number ON residents(nhs_number);
CREATE INDEX idx_residents_resident_number ON residents(resident_number);

-- Medication indexes
CREATE INDEX idx_prescriptions_tenant_id ON prescriptions(tenant_id);
CREATE INDEX idx_prescriptions_resident_id ON prescriptions(resident_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_medication_administrations_tenant_id ON medication_administrations(tenant_id);
CREATE INDEX idx_medication_administrations_prescription_id ON medication_administrations(prescription_id);
CREATE INDEX idx_medication_administrations_scheduled_time ON medication_administrations(scheduled_time);

-- Care notes indexes
CREATE INDEX idx_care_notes_tenant_id ON care_notes(tenant_id);
CREATE INDEX idx_care_notes_resident_id ON care_notes(resident_id);
CREATE INDEX idx_care_notes_author_id ON care_notes(author_id);
CREATE INDEX idx_care_notes_created_at ON care_notes(created_at);
CREATE INDEX idx_care_notes_note_type ON care_notes(note_type);

-- Incident indexes
CREATE INDEX idx_incidents_tenant_id ON incidents(tenant_id);
CREATE INDEX idx_incidents_organization_id ON incidents(organization_id);
CREATE INDEX idx_incidents_resident_id ON incidents(resident_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_occurred_at ON incidents(occurred_at);

-- Audit indexes
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Full-text search indexes
CREATE INDEX idx_care_notes_content_gin ON care_notes USING gin(to_tsvector('english', content));
CREATE INDEX idx_incidents_description_gin ON incidents USING gin(to_tsvector('english', description));

-- ===============================================
-- TRIGGERS FOR AUTOMATED TIMESTAMPS
-- ===============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_administrations_updated_at BEFORE UPDATE ON medication_administrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_care_notes_updated_at BEFORE UPDATE ON care_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_accounts_updated_at BEFORE UPDATE ON billing_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- SEED DEFAULT DATA
-- ===============================================

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions, is_system_role) VALUES
('SUPER_ADMIN', 'Super Administrator', 'Full system access across all tenants', '["*"]', true),
('ADMIN', 'Administrator', 'Full organizational access', '["admin.*"]', true),
('MANAGER', 'Manager', 'Management access', '["manage.*", "read.*"]', true),
('NURSE', 'Registered Nurse', 'Clinical access', '["clinical.*", "medication.*", "assessment.*"]', true),
('CARER', 'Care Assistant', 'Basic care access', '["care.*", "notes.*"]', true),
('FAMILY', 'Family Member', 'Limited resident access', '["family.*"]', true),
('MAINTENANCE', 'Maintenance', 'Facilities access', '["maintenance.*"]', false),
('KITCHEN', 'Kitchen Staff', 'Catering access', '["catering.*"]', false),
('CLEANER', 'Cleaning Staff', 'Cleaning access', '["cleaning.*"]', false),
('VOLUNTEER', 'Volunteer', 'Activity access', '["activities.*"]', false)
ON CONFLICT (name) DO NOTHING;

-- Insert default medications (common ones)
INSERT INTO medications (name, generic_name, classification, controlled_substance_class) VALUES
('Paracetamol', 'Acetaminophen', 'Analgesic', NULL),
('Ibuprofen', 'Ibuprofen', 'NSAID', NULL),
('Aspirin', 'Acetylsalicylic Acid', 'Antiplatelet', NULL),
('Simvastatin', 'Simvastatin', 'Statin', NULL),
('Amlodipine', 'Amlodipine', 'Calcium Channel Blocker', NULL),
('Metformin', 'Metformin', 'Antidiabetic', NULL),
('Omeprazole', 'Omeprazole', 'Proton Pump Inhibitor', NULL),
('Morphine', 'Morphine Sulfate', 'Opioid Analgesic', 'CD2'),
('Lorazepam', 'Lorazepam', 'Benzodiazepine', 'CD4'),
('Codeine', 'Codeine Phosphate', 'Opioid Analgesic', 'CD5')
ON CONFLICT (name) DO NOTHING;

COMMIT;