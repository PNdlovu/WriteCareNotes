-- Create pilots table
CREATE TABLE IF NOT EXISTS pilots (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) UNIQUE NOT NULL,
    care_home_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE NULL,
    features JSON NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_region (region),
    INDEX idx_created_at (created_at)
);

-- Create pilot_feedback table
CREATE TABLE IF NOT EXISTS pilot_feedback (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    suggested_fix TEXT NULL,
    submitted_by VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    resolution TEXT NULL,
    resolved_by VARCHAR(255) NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (tenant_id) REFERENCES pilots(tenant_id) ON DELETE CASCADE
);

-- Create pilot_metrics table
CREATE TABLE IF NOT EXISTS pilot_metrics (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    -- Engagement metrics
    active_users INT DEFAULT 0,
    total_logins INT DEFAULT 0,
    avg_session_duration INT DEFAULT 0,
    weekly_active_users INT DEFAULT 0,
    monthly_active_users INT DEFAULT 0,
    -- Compliance metrics
    audit_trail_completeness DECIMAL(5,2) DEFAULT 0,
    consent_records INT DEFAULT 0,
    nhs_sync_success_rate DECIMAL(5,2) DEFAULT 0,
    gdpr_compliance DECIMAL(5,2) DEFAULT 0,
    cqc_compliance DECIMAL(5,2) DEFAULT 0,
    -- Adoption metrics
    modules_used INT DEFAULT 0,
    medication_logs INT DEFAULT 0,
    care_plans INT DEFAULT 0,
    consent_events INT DEFAULT 0,
    nhs_integrations INT DEFAULT 0,
    -- Feedback metrics
    total_feedback INT DEFAULT 0,
    feedback_resolution_rate DECIMAL(5,2) DEFAULT 0,
    avg_resolution_time DECIMAL(8,2) DEFAULT 0,
    severity_breakdown JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (tenant_id) REFERENCES pilots(tenant_id) ON DELETE CASCADE
);

-- Create pilot_alerts table
CREATE TABLE IF NOT EXISTS pilot_alerts (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    action TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(255) NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_type (type),
    INDEX idx_severity (severity),
    INDEX idx_is_resolved (is_resolved),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (tenant_id) REFERENCES pilots(tenant_id) ON DELETE CASCADE
);

-- Create pilot_onboarding_checklist table
CREATE TABLE IF NOT EXISTS pilot_onboarding_checklist (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    -- Pre-onboarding
    nda_signed BOOLEAN DEFAULT FALSE,
    data_processing_agreement_signed BOOLEAN DEFAULT FALSE,
    tenant_environment_provisioned BOOLEAN DEFAULT FALSE,
    admin_credentials_issued BOOLEAN DEFAULT FALSE,
    -- Technical setup
    database_schema_migrated BOOLEAN DEFAULT FALSE,
    nhs_api_keys_configured BOOLEAN DEFAULT FALSE,
    audit_logging_verified BOOLEAN DEFAULT FALSE,
    health_checks_passing BOOLEAN DEFAULT FALSE,
    -- Training
    staff_onboarding_session_delivered BOOLEAN DEFAULT FALSE,
    feedback_process_explained BOOLEAN DEFAULT FALSE,
    support_contact_shared BOOLEAN DEFAULT FALSE,
    -- Go-live
    pilot_tenant_activated BOOLEAN DEFAULT FALSE,
    feature_flags_set BOOLEAN DEFAULT FALSE,
    monitoring_dashboard_enabled BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    completed_by VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_completed_at (completed_at),
    FOREIGN KEY (tenant_id) REFERENCES pilots(tenant_id) ON DELETE CASCADE
);

-- Create pilot_case_studies table
CREATE TABLE IF NOT EXISTS pilot_case_studies (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    care_home_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    pilot_duration VARCHAR(100) NOT NULL,
    number_of_residents INT NOT NULL,
    number_of_staff_users INT NOT NULL,
    objectives JSON NOT NULL,
    implementation JSON NOT NULL,
    results JSON NOT NULL,
    feedback JSON NOT NULL,
    outcomes JSON NOT NULL,
    trust_signals JSON NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_is_published (is_published),
    INDEX idx_published_at (published_at),
    FOREIGN KEY (tenant_id) REFERENCES pilots(tenant_id) ON DELETE CASCADE
);