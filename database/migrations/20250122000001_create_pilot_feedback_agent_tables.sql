-- Migration: Create pilot feedback agent tables
-- Description: Creates all necessary tables for the pilot feedback agent orchestration system
-- Author: AI Assistant
-- Date: 2025-01-22

-- Pilot feedback events table
CREATE TABLE IF NOT EXISTS pilot_feedback_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP NOT NULL,
    module VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    role ENUM('care_worker', 'admin', 'manager', 'family', 'resident') NOT NULL,
    text TEXT NOT NULL,
    attachments JSON,
    consents JSON NOT NULL,
    correlation_id VARCHAR(255),
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_module (module),
    INDEX idx_severity (severity),
    INDEX idx_processed_at (processed_at),
    INDEX idx_correlation_id (correlation_id)
);

-- Agent configurations table
CREATE TABLE IF NOT EXISTS agent_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT FALSE,
    autonomy ENUM('recommend-only', 'limited-autonomous', 'full-autonomous') DEFAULT 'recommend-only',
    batch_size INT DEFAULT 10,
    processing_interval INT DEFAULT 60000,
    max_retries INT DEFAULT 3,
    features JSON,
    thresholds JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_enabled (enabled)
);

-- Agent summaries table
CREATE TABLE IF NOT EXISTS agent_summaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    summary_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    window_from TIMESTAMP NOT NULL,
    window_to TIMESTAMP NOT NULL,
    top_themes JSON,
    total_events INT NOT NULL,
    risk_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_created_at (created_at),
    INDEX idx_window (window_from, window_to)
);

-- Agent clusters table
CREATE TABLE IF NOT EXISTS agent_clusters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cluster_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    theme VARCHAR(255) NOT NULL,
    event_count INT NOT NULL,
    event_ids JSON,
    keywords JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_module (module),
    INDEX idx_severity (severity),
    INDEX idx_theme (theme),
    INDEX idx_created_at (created_at)
);

-- Agent recommendations table
CREATE TABLE IF NOT EXISTS agent_recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    theme VARCHAR(255) NOT NULL,
    proposed_actions JSON,
    requires_approval BOOLEAN DEFAULT TRUE,
    linked_feedback_ids JSON,
    privacy_review TEXT,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    status ENUM('pending', 'approved', 'dismissed') DEFAULT 'pending',
    approved_by VARCHAR(255),
    approved_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_theme (theme),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Agent approval actions table
CREATE TABLE IF NOT EXISTS agent_approval_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    action ENUM('create_ticket', 'dismiss', 'escalate', 'request_more_info') NOT NULL,
    notes TEXT,
    approved_by VARCHAR(255) NOT NULL,
    approved_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_approved_by (approved_by),
    INDEX idx_approved_at (approved_at),
    
    FOREIGN KEY (recommendation_id) REFERENCES agent_recommendations(recommendation_id) ON DELETE CASCADE
);

-- Agent audit log table
CREATE TABLE IF NOT EXISTS agent_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    audit_id VARCHAR(255) NOT NULL UNIQUE,
    correlation_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    event_id VARCHAR(255),
    recommendation_id VARCHAR(255),
    metadata JSON,
    error TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_correlation_id (correlation_id),
    INDEX idx_action (action),
    INDEX idx_event_id (event_id),
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_created_at (created_at)
);

-- Agent health checks table
CREATE TABLE IF NOT EXISTS agent_health_checks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    check_id VARCHAR(255) NOT NULL UNIQUE,
    service VARCHAR(100) NOT NULL,
    status ENUM('healthy', 'degraded', 'unhealthy') NOT NULL,
    checks JSON,
    metrics JSON,
    last_check TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_service (service),
    INDEX idx_status (status),
    INDEX idx_last_check (last_check),
    INDEX idx_created_at (created_at)
);

-- Agent alerts table
CREATE TABLE IF NOT EXISTS agent_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    message TEXT NOT NULL,
    tenant_id VARCHAR(255),
    metadata JSON,
    status ENUM('open', 'acknowledged', 'resolved') DEFAULT 'open',
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP NULL,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP NULL,
    resolution TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_type (type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_timestamp (timestamp),
    INDEX idx_created_at (created_at)
);

-- Compliance violations table
CREATE TABLE IF NOT EXISTS compliance_violations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    violation_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    description TEXT NOT NULL,
    metadata JSON,
    status ENUM('open', 'acknowledged', 'resolved') DEFAULT 'open',
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP NULL,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP NULL,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_violation_type (violation_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Agent notifications table
CREATE TABLE IF NOT EXISTS agent_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    notification_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    metadata JSON,
    recipients JSON,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_read_at (read_at),
    INDEX idx_created_at (created_at)
);

-- Agent feature flags table
CREATE TABLE IF NOT EXISTS agent_feature_flags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    flag VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INT DEFAULT 0,
    conditions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_tenant_flag (tenant_id, flag),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_flag (flag),
    INDEX idx_enabled (enabled)
);

-- Agent metrics table (for storing aggregated metrics)
CREATE TABLE IF NOT EXISTS agent_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    period_from TIMESTAMP NOT NULL,
    period_to TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_metric_name (metric_name),
    INDEX idx_period (period_from, period_to),
    INDEX idx_created_at (created_at)
);

-- Create views for common queries
CREATE OR REPLACE VIEW agent_dashboard_summary AS
SELECT 
    tenant_id,
    COUNT(DISTINCT CASE WHEN status = 'pending' THEN recommendation_id END) as pending_recommendations,
    COUNT(DISTINCT CASE WHEN status = 'approved' THEN recommendation_id END) as approved_recommendations,
    COUNT(DISTINCT CASE WHEN status = 'dismissed' THEN recommendation_id END) as dismissed_recommendations,
    AVG(CASE WHEN status != 'pending' THEN TIMESTAMPDIFF(HOUR, created_at, updated_at) END) as avg_review_time_hours
FROM agent_recommendations 
GROUP BY tenant_id;

CREATE OR REPLACE VIEW agent_processing_stats AS
SELECT 
    tenant_id,
    DATE(timestamp) as processing_date,
    COUNT(*) as total_events,
    SUM(CASE WHEN error IS NULL THEN 1 ELSE 0 END) as successful_events,
    SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as failed_events,
    AVG(JSON_EXTRACT(metadata, '$.durationMs')) as avg_processing_time_ms
FROM agent_audit_log 
WHERE action IN ('EVENT_RECEIVED', 'BATCH_PROCESSED')
GROUP BY tenant_id, DATE(timestamp);

-- Insert default agent configuration for all tenants
INSERT IGNORE INTO agent_configurations (tenant_id, enabled, autonomy, batch_size, processing_interval, max_retries, features, thresholds)
SELECT 
    DISTINCT tenant_id,
    FALSE as enabled,
    'recommend-only' as autonomy,
    10 as batch_size,
    60000 as processing_interval,
    3 as max_retries,
    JSON_OBJECT(
        'clustering', true,
        'summarization', true,
        'recommendations', true,
        'notifications', true
    ) as features,
    JSON_OBJECT(
        'minClusterSize', 2,
        'minRecommendationEvents', 3,
        'maxProcessingTime', 300000
    ) as thresholds
FROM pilot_feedback_events
WHERE tenant_id IS NOT NULL;

-- Insert default feature flags
INSERT IGNORE INTO agent_feature_flags (tenant_id, flag, enabled, rollout_percentage, conditions)
SELECT 
    DISTINCT tenant_id,
    'agent.pilotFeedback.enabled' as flag,
    FALSE as enabled,
    0 as rollout_percentage,
    JSON_OBJECT() as conditions
FROM pilot_feedback_events
WHERE tenant_id IS NOT NULL;

INSERT IGNORE INTO agent_feature_flags (tenant_id, flag, enabled, rollout_percentage, conditions)
SELECT 
    DISTINCT tenant_id,
    'agent.pilotFeedback.autonomy' as flag,
    FALSE as enabled,
    0 as rollout_percentage,
    JSON_OBJECT('autonomy', 'recommend-only') as conditions
FROM pilot_feedback_events
WHERE tenant_id IS NOT NULL;