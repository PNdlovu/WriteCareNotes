-- NHS Integration Tables Migration
-- Creates tables for NHS Digital, GP Connect, and DSCR integration
-- Critical for British Isles care home market entry

-- NHS Patient Links Table
CREATE TABLE IF NOT EXISTS nhs_patient_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    nhs_number VARCHAR(10) UNIQUE NOT NULL,
    gp_practice_code VARCHAR(6),
    gp_practice_name VARCHAR(255),
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'failed', 'expired')),
    sync_error_message TEXT,
    consent_status VARCHAR(20) DEFAULT 'pending',
    consent_date TIMESTAMP,
    data_sharing_agreement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GP Connect Sessions Table
CREATE TABLE IF NOT EXISTS gp_connect_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP NOT NULL,
    scope TEXT[] NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    session_state VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DSCR Submissions Table
CREATE TABLE IF NOT EXISTS dscr_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id VARCHAR(255) UNIQUE NOT NULL,
    facility_id UUID NOT NULL,
    submission_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'failed')),
    data_hash VARCHAR(64) NOT NULL,
    record_count INTEGER DEFAULT 0,
    submission_type VARCHAR(50) NOT NULL,
    nhs_response JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NHS Integration Audit Log Table
CREATE TABLE IF NOT EXISTS nhs_integration_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation VARCHAR(100) NOT NULL,
    patient_id VARCHAR(255),
    nhs_number VARCHAR(10),
    user_id UUID REFERENCES staff(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    ip_address INET,
    user_agent TEXT
);

-- NHS Medication Transfers Table
CREATE TABLE IF NOT EXISTS nhs_medication_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(255) NOT NULL,
    nhs_number VARCHAR(10) NOT NULL,
    transfer_type VARCHAR(20) NOT NULL CHECK (transfer_type IN ('admission', 'discharge', 'transfer')),
    source_organization VARCHAR(10) NOT NULL,
    target_organization VARCHAR(10) NOT NULL,
    transfer_date TIMESTAMP NOT NULL,
    medication_data JSONB NOT NULL,
    clinical_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'received', 'failed')),
    eredbag_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NHS Compliance Standards Table
CREATE TABLE IF NOT EXISTS nhs_compliance_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_code VARCHAR(20) NOT NULL,
    standard_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    requirements JSONB NOT NULL,
    assessment_criteria JSONB NOT NULL,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    last_assessment TIMESTAMP,
    next_assessment TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'compliant', 'non-compliant', 'under-review')),
    evidence_documents TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NHS Integration Configuration Table
CREATE TABLE IF NOT EXISTS nhs_integration_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    gp_connect_endpoint VARCHAR(500) NOT NULL,
    eredbag_endpoint VARCHAR(500) NOT NULL,
    dscr_endpoint VARCHAR(500) NOT NULL,
    auto_sync_interval INTEGER DEFAULT 60,
    real_time_updates BOOLEAN DEFAULT TRUE,
    retry_attempts INTEGER DEFAULT 3,
    timeout_ms INTEGER DEFAULT 30000,
    credentials_encrypted TEXT,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nhs_patient_links_nhs_number ON nhs_patient_links(nhs_number);
CREATE INDEX IF NOT EXISTS idx_nhs_patient_links_resident_id ON nhs_patient_links(resident_id);
CREATE INDEX IF NOT EXISTS idx_nhs_patient_links_sync_status ON nhs_patient_links(sync_status);
CREATE INDEX IF NOT EXISTS idx_nhs_patient_links_last_sync ON nhs_patient_links(last_sync_at);

CREATE INDEX IF NOT EXISTS idx_gp_connect_sessions_expires_at ON gp_connect_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_gp_connect_sessions_is_active ON gp_connect_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_gp_connect_sessions_client_id ON gp_connect_sessions(client_id);

CREATE INDEX IF NOT EXISTS idx_dscr_submissions_facility_id ON dscr_submissions(facility_id);
CREATE INDEX IF NOT EXISTS idx_dscr_submissions_status ON dscr_submissions(status);
CREATE INDEX IF NOT EXISTS idx_dscr_submissions_submission_date ON dscr_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_dscr_submissions_next_retry ON dscr_submissions(next_retry_at) WHERE next_retry_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nhs_audit_timestamp ON nhs_integration_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_nhs_audit_operation ON nhs_integration_audit(operation);
CREATE INDEX IF NOT EXISTS idx_nhs_audit_user_id ON nhs_integration_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_nhs_audit_nhs_number ON nhs_integration_audit(nhs_number);

CREATE INDEX IF NOT EXISTS idx_nhs_transfers_patient_id ON nhs_medication_transfers(patient_id);
CREATE INDEX IF NOT EXISTS idx_nhs_transfers_nhs_number ON nhs_medication_transfers(nhs_number);
CREATE INDEX IF NOT EXISTS idx_nhs_transfers_status ON nhs_medication_transfers(status);
CREATE INDEX IF NOT EXISTS idx_nhs_transfers_date ON nhs_medication_transfers(transfer_date);

CREATE INDEX IF NOT EXISTS idx_nhs_compliance_standard_code ON nhs_compliance_standards(standard_code);
CREATE INDEX IF NOT EXISTS idx_nhs_compliance_status ON nhs_compliance_standards(status);
CREATE INDEX IF NOT EXISTS idx_nhs_compliance_next_assessment ON nhs_compliance_standards(next_assessment);

CREATE INDEX IF NOT EXISTS idx_nhs_config_facility_id ON nhs_integration_config(facility_id);
CREATE INDEX IF NOT EXISTS idx_nhs_config_enabled ON nhs_integration_config(enabled);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nhs_patient_links_updated_at BEFORE UPDATE ON nhs_patient_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gp_connect_sessions_updated_at BEFORE UPDATE ON gp_connect_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dscr_submissions_updated_at BEFORE UPDATE ON dscr_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nhs_medication_transfers_updated_at BEFORE UPDATE ON nhs_medication_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nhs_compliance_standards_updated_at BEFORE UPDATE ON nhs_compliance_standards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nhs_integration_config_updated_at BEFORE UPDATE ON nhs_integration_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default NHS compliance standards
INSERT INTO nhs_compliance_standards (standard_code, standard_name, version, description, requirements, assessment_criteria) VALUES
('DCB0129', 'Clinical Risk Management', '3.0', 'Clinical risk management system for health IT systems', 
 '{"risk_assessment": true, "risk_management_plan": true, "clinical_safety_officer": true}',
 '{"documentation": "Complete", "processes": "Implemented", "training": "Current"}'),
 
('DCB0160', 'Clinical Safety Case Report', '2.0', 'Clinical safety case report for health IT systems',
 '{"safety_case_report": true, "hazard_analysis": true, "risk_analysis": true}',
 '{"report_quality": "High", "hazard_coverage": "Complete", "mitigation_plans": "Adequate"}'),
 
('DCB0154', 'Clinical Safety Officer', '1.0', 'Clinical safety officer requirements',
 '{"qualified_officer": true, "ongoing_training": true, "regular_reviews": true}',
 '{"qualifications": "Valid", "training_current": true, "review_frequency": "Monthly"}'),
 
('DCB0155', 'Clinical Risk Management File', '1.0', 'Clinical risk management file maintenance',
 '{"risk_file": true, "regular_updates": true, "version_control": true}',
 '{"file_completeness": "100%", "update_frequency": "Weekly", "version_control": "Active"}'),
 
('DSPT', 'Data Security and Protection Toolkit', '2024', 'NHS Digital data security standards',
 '{"data_security": true, "staff_training": true, "incident_management": true}',
 '{"security_score": 95, "training_completion": 100, "incident_response": "Excellent"}');

-- Create initial NHS integration configuration
INSERT INTO nhs_integration_config (
    facility_id, 
    enabled, 
    gp_connect_endpoint, 
    eredbag_endpoint, 
    dscr_endpoint,
    auto_sync_interval,
    real_time_updates
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    FALSE,
    'https://api.gpconnect.nhs.uk/fhir',
    'https://api.eredbag.nhs.uk/fhir',
    'https://api.service.nhs.uk/dscr',
    60,
    TRUE
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON nhs_patient_links TO care_home_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON gp_connect_sessions TO care_home_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON dscr_submissions TO care_home_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nhs_integration_audit TO care_home_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nhs_medication_transfers TO care_home_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nhs_compliance_standards TO care_home_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nhs_integration_config TO care_home_app;

-- Add comments for documentation
COMMENT ON TABLE nhs_patient_links IS 'Links care home residents to their NHS records for GP Connect integration';
COMMENT ON TABLE gp_connect_sessions IS 'Stores OAuth2 authentication sessions for GP Connect API access';
COMMENT ON TABLE dscr_submissions IS 'Tracks Digital Social Care Records submissions to NHS Digital';
COMMENT ON TABLE nhs_integration_audit IS 'Comprehensive audit trail for all NHS integration operations';
COMMENT ON TABLE nhs_medication_transfers IS 'Tracks medication transfers via eRedBag system';
COMMENT ON TABLE nhs_compliance_standards IS 'NHS Digital compliance standards and assessment results';
COMMENT ON TABLE nhs_integration_config IS 'Configuration settings for NHS integration per facility';

COMMENT ON COLUMN nhs_patient_links.nhs_number IS 'Valid NHS number (10 digits with checksum validation)';
COMMENT ON COLUMN nhs_patient_links.consent_status IS 'Patient consent status for data sharing';
COMMENT ON COLUMN nhs_patient_links.data_sharing_agreement IS 'Signed data sharing agreement on file';

COMMENT ON COLUMN gp_connect_sessions.expires_at IS 'OAuth2 token expiration timestamp';
COMMENT ON COLUMN gp_connect_sessions.scope IS 'OAuth2 scope permissions for this session';

COMMENT ON COLUMN dscr_submissions.data_hash IS 'SHA-256 hash of submitted data for integrity verification';
COMMENT ON COLUMN dscr_submissions.retry_count IS 'Number of retry attempts for failed submissions';

-- Create view for active NHS patient links with resident details
CREATE OR REPLACE VIEW active_nhs_patients AS
SELECT 
    npl.id,
    npl.nhs_number,
    npl.gp_practice_code,
    npl.gp_practice_name,
    npl.last_sync_at,
    npl.sync_status,
    npl.consent_status,
    r.id as resident_id,
    r.first_name,
    r.last_name,
    r.date_of_birth,
    r.room_number
FROM nhs_patient_links npl
JOIN residents r ON npl.resident_id = r.id
WHERE npl.sync_status = 'success' 
AND npl.consent_status = 'granted'
AND r.status = 'active';

COMMENT ON VIEW active_nhs_patients IS 'Active NHS patient links with resident details for quick access';

-- Create function to validate NHS number checksum
CREATE OR REPLACE FUNCTION validate_nhs_number(nhs_number VARCHAR(10))
RETURNS BOOLEAN AS $$
DECLARE
    digits INTEGER[];
    check_digit INTEGER;
    calculated_check_digit INTEGER;
    total INTEGER := 0;
    i INTEGER;
BEGIN
    -- Check format
    IF nhs_number !~ '^\d{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Convert to array of integers
    FOR i IN 1..10 LOOP
        digits[i] := CAST(SUBSTRING(nhs_number FROM i FOR 1) AS INTEGER);
    END LOOP;
    
    check_digit := digits[10];
    
    -- Calculate checksum
    FOR i IN 1..9 LOOP
        total := total + (digits[i] * (11 - i));
    END LOOP;
    
    calculated_check_digit := 11 - (total % 11);
    
    IF calculated_check_digit = 11 THEN
        calculated_check_digit := 0;
    END IF;
    
    IF calculated_check_digit = 10 THEN
        RETURN FALSE;
    END IF;
    
    RETURN calculated_check_digit = check_digit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_nhs_number IS 'Validates NHS number using official checksum algorithm';

-- Create constraint to ensure valid NHS numbers
ALTER TABLE nhs_patient_links ADD CONSTRAINT check_valid_nhs_number 
CHECK (validate_nhs_number(nhs_number));

-- Migration complete
SELECT 'NHS Integration tables created successfully' AS status;