-- Resident Service Database Schema
-- Creates tables for resident management with NHS compliance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create residents table
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    nhs_number VARCHAR(10) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    admission_date DATE NOT NULL,
    discharge_date DATE,
    care_level VARCHAR(50) NOT NULL CHECK (care_level IN ('residential', 'nursing', 'dementia', 'mental-health')),
    room_id UUID,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'deceased', 'transferred')),
    
    -- Healthcare specific fields
    medical_conditions TEXT[],
    allergies TEXT[],
    dietary_requirements TEXT[],
    mobility_level VARCHAR(50),
    communication_needs TEXT,
    
    -- Address information
    previous_address JSONB,
    next_of_kin JSONB,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    version INTEGER DEFAULT 1,
    
    -- Compliance fields
    gdpr_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    data_retention_date DATE,
    
    CONSTRAINT residents_tenant_id_check CHECK (tenant_id IS NOT NULL),
    CONSTRAINT residents_admission_discharge_check CHECK (discharge_date IS NULL OR discharge_date >= admission_date)
);

-- Create emergency contacts table
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_next_of_kin BOOLEAN DEFAULT FALSE,
    can_make_decisions BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT emergency_contacts_resident_id_check CHECK (resident_id IS NOT NULL)
);

-- Create resident preferences table
CREATE TABLE resident_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(resident_id, category, preference_key)
);

-- Create resident documents table
CREATE TABLE resident_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    is_confidential BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_residents_tenant_id ON residents(tenant_id);
CREATE INDEX idx_residents_nhs_number ON residents(nhs_number) WHERE nhs_number IS NOT NULL;
CREATE INDEX idx_residents_status ON residents(status);
CREATE INDEX idx_residents_admission_date ON residents(admission_date);
CREATE INDEX idx_residents_care_level ON residents(care_level);
CREATE INDEX idx_residents_room_id ON residents(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_residents_name_search ON residents USING gin((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX idx_emergency_contacts_resident_id ON emergency_contacts(resident_id);
CREATE INDEX idx_emergency_contacts_primary ON emergency_contacts(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_emergency_contacts_next_of_kin ON emergency_contacts(is_next_of_kin) WHERE is_next_of_kin = TRUE;

CREATE INDEX idx_resident_preferences_resident_id ON resident_preferences(resident_id);
CREATE INDEX idx_resident_preferences_category ON resident_preferences(category);
CREATE INDEX idx_resident_preferences_active ON resident_preferences(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_resident_documents_resident_id ON resident_documents(resident_id);
CREATE INDEX idx_resident_documents_type ON resident_documents(document_type);
CREATE INDEX idx_resident_documents_confidential ON resident_documents(is_confidential);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resident_preferences_updated_at BEFORE UPDATE ON resident_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resident_documents_updated_at BEFORE UPDATE ON resident_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create NHS number validation function
CREATE OR REPLACE FUNCTION validate_nhs_number(nhs_number VARCHAR(10))
RETURNS BOOLEAN AS $$
DECLARE
    digits INTEGER[];
    check_digit INTEGER;
    sum_value INTEGER := 0;
    remainder INTEGER;
    calculated_check_digit INTEGER;
BEGIN
    -- Check if NHS number is exactly 10 digits
    IF nhs_number !~ '^\d{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Convert to array of integers
    FOR i IN 1..10 LOOP
        digits[i] := CAST(SUBSTRING(nhs_number FROM i FOR 1) AS INTEGER);
    END LOOP;
    
    check_digit := digits[10];
    
    -- Calculate check digit
    FOR i IN 1..9 LOOP
        sum_value := sum_value + (digits[i] * (11 - i));
    END LOOP;
    
    remainder := sum_value % 11;
    calculated_check_digit := 11 - remainder;
    
    -- Handle special cases
    IF calculated_check_digit = 11 THEN
        calculated_check_digit := 0;
    END IF;
    
    IF calculated_check_digit = 10 THEN
        RETURN FALSE; -- Invalid NHS number
    END IF;
    
    RETURN calculated_check_digit = check_digit;
END;
$$ LANGUAGE plpgsql;

-- Add NHS number validation constraint
ALTER TABLE residents ADD CONSTRAINT residents_nhs_number_valid 
    CHECK (nhs_number IS NULL OR validate_nhs_number(nhs_number));

-- Create audit log table for residents
CREATE TABLE resident_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    correlation_id UUID,
    user_agent TEXT,
    ip_address INET
);

CREATE INDEX idx_resident_audit_log_resident_id ON resident_audit_log(resident_id);
CREATE INDEX idx_resident_audit_log_action ON resident_audit_log(action);
CREATE INDEX idx_resident_audit_log_changed_at ON resident_audit_log(changed_at);
CREATE INDEX idx_resident_audit_log_correlation_id ON resident_audit_log(correlation_id) WHERE correlation_id IS NOT NULL;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_resident_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO resident_audit_log (resident_id, action, new_values, changed_by)
        VALUES (NEW.id, 'INSERT', to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO resident_audit_log (resident_id, action, old_values, new_values, changed_by)
        VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), NEW.updated_by);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO resident_audit_log (resident_id, action, old_values, changed_by)
        VALUES (OLD.id, 'DELETE', to_jsonb(OLD), OLD.updated_by);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_residents_changes
    AFTER INSERT OR UPDATE OR DELETE ON residents
    FOR EACH ROW EXECUTE FUNCTION audit_resident_changes();

-- Create view for active residents with emergency contacts
CREATE VIEW active_residents_with_contacts AS
SELECT 
    r.id,
    r.tenant_id,
    r.nhs_number,
    r.first_name,
    r.last_name,
    r.preferred_name,
    r.date_of_birth,
    r.gender,
    r.admission_date,
    r.care_level,
    r.room_id,
    r.medical_conditions,
    r.allergies,
    r.dietary_requirements,
    r.mobility_level,
    r.communication_needs,
    ec.name as primary_contact_name,
    ec.phone_primary as primary_contact_phone,
    ec.relationship as primary_contact_relationship
FROM residents r
LEFT JOIN emergency_contacts ec ON r.id = ec.resident_id AND ec.is_primary = TRUE
WHERE r.status = 'active';

-- Grant permissions to resident service user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO resident_service;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO resident_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO resident_service;