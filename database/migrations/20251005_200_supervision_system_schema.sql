-- WriteCareConnect: Supervision System Database Schema
-- Comprehensive supervision management with AI integration
-- Version: 1.0

-- ==================================================
-- SUPERVISION SESSIONS TABLE
-- ==================================================
CREATE TABLE supervision_sessions (
    -- Core Supervision Data
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES communication_sessions(id), -- Links to video session
    supervision_number VARCHAR(50) UNIQUE NOT NULL, -- SUP-2025-001
    supervision_type VARCHAR(50) NOT NULL CHECK (supervision_type IN (
        'annual_appraisal', 'monthly_supervision', 'disciplinary', 
        'return_to_work', 'probation_review', 'capability', 'grievance'
    )),
    
    -- Participants
    staff_member_id UUID NOT NULL,
    supervisor_id UUID NOT NULL,
    
    -- Scheduling and Duration
    scheduled_date TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    duration INTEGER, -- minutes
    
    -- Status and Progress
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'
    )),
    
    -- Content and Context
    supervision_context JSONB NOT NULL DEFAULT '{}',
    discussion_points JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    outcomes JSONB DEFAULT '[]',
    
    -- AI and Analysis
    ai_summary JSONB, -- AI-generated summary
    sentiment_analysis JSONB, -- Emotional tone analysis
    compliance_rating JSONB, -- Compliance assessment
    
    -- Recording and Documentation
    recording_enabled BOOLEAN DEFAULT false,
    recording_url TEXT,
    transcript_url TEXT,
    documents_attached TEXT[] DEFAULT '{}',
    
    -- Follow-up and Tracking
    next_supervision_due DATE,
    escalation_required BOOLEAN DEFAULT false,
    hr_notification_sent BOOLEAN DEFAULT false,
    compliance_report_generated BOOLEAN DEFAULT false,
    
    -- Audit and Compliance
    gdpr_compliant BOOLEAN DEFAULT true,
    retention_period INTEGER NOT NULL, -- days
    access_level VARCHAR(20) DEFAULT 'internal' CHECK (access_level IN (
        'confidential', 'restricted', 'internal'
    )),
    
    -- Timestamps and Multi-tenancy
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    care_home_id UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (actual_start_time IS NULL OR actual_end_time IS NULL OR actual_start_time <= actual_end_time),
    CONSTRAINT valid_next_due CHECK (next_supervision_due IS NULL OR next_supervision_due > scheduled_date)
);

-- Indexes for performance
CREATE INDEX idx_supervision_sessions_care_home ON supervision_sessions(care_home_id);
CREATE INDEX idx_supervision_sessions_staff ON supervision_sessions(staff_member_id);
CREATE INDEX idx_supervision_sessions_supervisor ON supervision_sessions(supervisor_id);
CREATE INDEX idx_supervision_sessions_status ON supervision_sessions(status);
CREATE INDEX idx_supervision_sessions_type ON supervision_sessions(supervision_type);
CREATE INDEX idx_supervision_sessions_scheduled ON supervision_sessions(scheduled_date);
CREATE INDEX idx_supervision_sessions_due ON supervision_sessions(next_supervision_due) WHERE next_supervision_due IS NOT NULL;
CREATE INDEX idx_supervision_sessions_escalation ON supervision_sessions(escalation_required) WHERE escalation_required = true;

-- ==================================================
-- SUPERVISION ACTION ITEMS TABLE
-- ==================================================
CREATE TABLE supervision_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervision_id UUID NOT NULL REFERENCES supervision_sessions(id) ON DELETE CASCADE,
    
    -- Action Item Details
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'training', 'performance', 'compliance', 'development', 'investigation'
    )),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignment and Timeline
    assigned_to UUID NOT NULL, -- Staff member responsible
    assigned_by UUID NOT NULL, -- Supervisor who assigned
    due_date DATE NOT NULL,
    
    -- Progress Tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
    )),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Evidence and Documentation
    evidence TEXT[],
    completion_notes TEXT,
    completed_date DATE,
    
    -- AI and Automation
    ai_generated BOOLEAN DEFAULT false,
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Multi-tenancy
    care_home_id UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_completion CHECK (
        (status = 'completed' AND completed_date IS NOT NULL) OR 
        (status != 'completed' AND completed_date IS NULL)
    )
);

-- Indexes for action items
CREATE INDEX idx_action_items_supervision ON supervision_action_items(supervision_id);
CREATE INDEX idx_action_items_assigned_to ON supervision_action_items(assigned_to);
CREATE INDEX idx_action_items_status ON supervision_action_items(status);
CREATE INDEX idx_action_items_due_date ON supervision_action_items(due_date);
CREATE INDEX idx_action_items_overdue ON supervision_action_items(due_date) WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled');

-- ==================================================
-- COMPLIANCE REPORTS TABLE
-- ==================================================
CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervision_id UUID REFERENCES supervision_sessions(id),
    
    -- Report Details
    report_type VARCHAR(50) NOT NULL,
    overall_rating DECIMAL(5,2) NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Content
    areas_of_concern JSONB DEFAULT '[]',
    regulatory_implications JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    
    -- Action and Follow-up
    action_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    
    -- Timestamps
    generated_at TIMESTAMP DEFAULT NOW(),
    care_home_id UUID NOT NULL
);

-- Indexes for compliance reports
CREATE INDEX idx_compliance_reports_supervision ON compliance_reports(supervision_id);
CREATE INDEX idx_compliance_reports_risk_level ON compliance_reports(risk_level);
CREATE INDEX idx_compliance_reports_action_required ON compliance_reports(action_required) WHERE action_required = true;

-- ==================================================
-- SUPERVISION TEMPLATES TABLE
-- ==================================================
CREATE TABLE supervision_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    supervision_type VARCHAR(50) NOT NULL,
    
    -- Template Content
    discussion_topics JSONB NOT NULL DEFAULT '[]',
    standard_questions JSONB DEFAULT '[]',
    compliance_checklist JSONB DEFAULT '[]',
    rating_criteria JSONB DEFAULT '{}',
    
    -- Configuration
    estimated_duration INTEGER, -- minutes
    mandatory_topics JSONB DEFAULT '[]',
    
    -- Status and Usage
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    care_home_id UUID NOT NULL
);

-- Indexes for templates
CREATE INDEX idx_supervision_templates_type ON supervision_templates(supervision_type);
CREATE INDEX idx_supervision_templates_active ON supervision_templates(is_active) WHERE is_active = true;

-- ==================================================
-- SUPERVISION NOTIFICATIONS TABLE
-- ==================================================
CREATE TABLE supervision_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervision_id UUID NOT NULL REFERENCES supervision_sessions(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'scheduled', 'reminder', 'overdue', 'completed', 'escalation', 'action_item_due'
    )),
    recipient_id UUID NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN (
        'staff_member', 'supervisor', 'manager', 'hr', 'compliance'
    )),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Delivery
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    care_home_id UUID NOT NULL
);

-- Indexes for notifications
CREATE INDEX idx_supervision_notifications_supervision ON supervision_notifications(supervision_id);
CREATE INDEX idx_supervision_notifications_recipient ON supervision_notifications(recipient_id);
CREATE INDEX idx_supervision_notifications_unread ON supervision_notifications(read_at) WHERE read_at IS NULL;

-- ==================================================
-- ROW LEVEL SECURITY POLICIES
-- ==================================================

-- Enable RLS on all supervision tables
ALTER TABLE supervision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for care home isolation
CREATE POLICY supervision_sessions_care_home_policy ON supervision_sessions
    FOR ALL USING (care_home_id = current_setting('app.current_care_home_id', true)::UUID);

CREATE POLICY supervision_action_items_care_home_policy ON supervision_action_items
    FOR ALL USING (care_home_id = current_setting('app.current_care_home_id', true)::UUID);

CREATE POLICY compliance_reports_care_home_policy ON compliance_reports
    FOR ALL USING (care_home_id = current_setting('app.current_care_home_id', true)::UUID);

CREATE POLICY supervision_templates_care_home_policy ON supervision_templates
    FOR ALL USING (care_home_id = current_setting('app.current_care_home_id', true)::UUID);

CREATE POLICY supervision_notifications_care_home_policy ON supervision_notifications
    FOR ALL USING (care_home_id = current_setting('app.current_care_home_id', true)::UUID);

-- ==================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_supervision_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to supervision tables
CREATE TRIGGER update_supervision_sessions_updated_at
    BEFORE UPDATE ON supervision_sessions
    FOR EACH ROW EXECUTE FUNCTION update_supervision_updated_at();

CREATE TRIGGER update_supervision_action_items_updated_at
    BEFORE UPDATE ON supervision_action_items
    FOR EACH ROW EXECUTE FUNCTION update_supervision_updated_at();

CREATE TRIGGER update_supervision_templates_updated_at
    BEFORE UPDATE ON supervision_templates
    FOR EACH ROW EXECUTE FUNCTION update_supervision_updated_at();

-- Auto-update action item status based on due date
CREATE OR REPLACE FUNCTION update_overdue_action_items()
RETURNS void AS $$
BEGIN
    UPDATE supervision_action_items 
    SET status = 'overdue', updated_at = NOW()
    WHERE due_date < CURRENT_DATE 
    AND status IN ('pending', 'in_progress');
END;
$$ language 'plpgsql';

-- ==================================================
-- VIEWS FOR REPORTING AND ANALYTICS
-- ==================================================

-- Supervision overview view
CREATE VIEW supervision_overview AS
SELECT 
    s.id,
    s.supervision_number,
    s.supervision_type,
    s.staff_member_id,
    s.supervisor_id,
    s.scheduled_date,
    s.status,
    s.duration,
    s.escalation_required,
    COALESCE(ai.total_action_items, 0) as total_action_items,
    COALESCE(ai.completed_action_items, 0) as completed_action_items,
    CASE 
        WHEN ai.total_action_items > 0 
        THEN (ai.completed_action_items::DECIMAL / ai.total_action_items * 100)
        ELSE 0 
    END as action_item_completion_rate,
    s.compliance_rating->>'overallScore' as compliance_score,
    s.care_home_id
FROM supervision_sessions s
LEFT JOIN (
    SELECT 
        supervision_id,
        COUNT(*) as total_action_items,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_action_items
    FROM supervision_action_items
    GROUP BY supervision_id
) ai ON s.id = ai.supervision_id;

-- Staff supervision summary view
CREATE VIEW staff_supervision_summary AS
SELECT 
    staff_member_id,
    care_home_id,
    COUNT(*) as total_supervisions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_supervisions,
    COUNT(*) FILTER (WHERE escalation_required = true) as escalations,
    AVG(duration) as average_duration,
    MAX(scheduled_date) as last_supervision_date,
    MIN(next_supervision_due) as next_supervision_due,
    AVG(CAST(compliance_rating->>'overallScore' AS DECIMAL)) as average_compliance_score
FROM supervision_sessions
GROUP BY staff_member_id, care_home_id;

-- ==================================================
-- COMMENTS
-- ==================================================

COMMENT ON TABLE supervision_sessions IS 'Comprehensive supervision sessions with AI integration and compliance tracking';
COMMENT ON TABLE supervision_action_items IS 'Action items generated from supervision sessions with progress tracking';
COMMENT ON TABLE compliance_reports IS 'AI-generated compliance reports for regulatory oversight';
COMMENT ON TABLE supervision_templates IS 'Reusable templates for different supervision types';
COMMENT ON TABLE supervision_notifications IS 'Notification system for supervision-related events';

COMMENT ON COLUMN supervision_sessions.ai_summary IS 'AI-generated summary with key points and recommendations';
COMMENT ON COLUMN supervision_sessions.sentiment_analysis IS 'AI analysis of emotional tone and engagement';
COMMENT ON COLUMN supervision_sessions.compliance_rating IS 'Automated compliance assessment across multiple areas';
COMMENT ON COLUMN supervision_action_items.ai_generated IS 'Indicates if action item was generated by AI analysis';
COMMENT ON COLUMN compliance_reports.risk_level IS 'Risk assessment for regulatory compliance';