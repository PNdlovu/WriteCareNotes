-- =====================================================
-- WriteCareConnect Database Migration
-- Extends existing WriteCareNotes schema with communication tables
-- Compatible with existing multi-tenant architecture
-- =====================================================

-- Create communication schema
CREATE SCHEMA IF NOT EXISTS communication;

-- =====================================================
-- COMMUNICATION SESSIONS
-- =====================================================

CREATE TABLE communication.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Session details
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN (
        'supervision', 'meeting', 'consultation', 'safeguarding', 
        'incident_review', 'family_call', 'training', 'appraisal'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Recording & consent
    recording_enabled BOOLEAN DEFAULT FALSE,
    recording_url TEXT,
    recording_size BIGINT,
    consent_verified BOOLEAN DEFAULT FALSE,
    
    -- Content
    transcript_id UUID,
    summary TEXT,
    
    -- Care context (links to existing WriteCareNotes entities)
    resident_ids UUID[] DEFAULT '{}',
    incident_ids UUID[] DEFAULT '{}',
    care_plan_ids UUID[] DEFAULT '{}',
    medication_ids UUID[] DEFAULT '{}',
    staff_ids UUID[] DEFAULT '{}',
    
    -- Supervision context
    supervision_type VARCHAR(100),
    supervision_due_date DATE,
    previous_supervision_id UUID,
    
    -- Safeguarding context
    safeguarding_level VARCHAR(20) CHECK (safeguarding_level IN ('low', 'medium', 'high', 'critical')),
    safeguarding_categories TEXT[],
    
    -- Meeting context
    meeting_type VARCHAR(100),
    compliance_areas TEXT[],
    inspection_related BOOLEAN DEFAULT FALSE,
    
    -- Status and technical
    session_state VARCHAR(20) DEFAULT 'scheduled' CHECK (session_state IN (
        'scheduled', 'active', 'completed', 'cancelled', 'error'
    )),
    connection_quality JSONB,
    
    -- External integration
    external_meeting_id VARCHAR(255),
    external_platform VARCHAR(50),
    external_meeting_url TEXT,
    
    -- Compliance
    retention_date DATE NOT NULL,
    compliance_flags JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    organizer_id UUID NOT NULL REFERENCES users(id),
    
    -- Indexes for performance
    CONSTRAINT valid_timing CHECK (
        (scheduled_at IS NULL OR started_at IS NULL OR started_at >= scheduled_at) AND
        (started_at IS NULL OR ended_at IS NULL OR ended_at >= started_at)
    )
);

-- Indexes for sessions
CREATE INDEX idx_sessions_tenant_id ON communication.sessions(tenant_id);
CREATE INDEX idx_sessions_session_type ON communication.sessions(session_type);
CREATE INDEX idx_sessions_state ON communication.sessions(session_state);
CREATE INDEX idx_sessions_scheduled_at ON communication.sessions(scheduled_at);
CREATE INDEX idx_sessions_created_at ON communication.sessions(created_at);
CREATE INDEX idx_sessions_organizer ON communication.sessions(organizer_id);
CREATE INDEX idx_sessions_care_context ON communication.sessions USING GIN(resident_ids, incident_ids, care_plan_ids);

-- =====================================================
-- SESSION PARTICIPANTS
-- =====================================================

CREATE TABLE communication.session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES communication.sessions(id) ON DELETE CASCADE,
    
    -- Participant details
    user_id UUID REFERENCES users(id),
    participant_role VARCHAR(20) NOT NULL CHECK (participant_role IN (
        'host', 'participant', 'observer', 'external'
    )),
    
    -- External participant support
    is_external BOOLEAN DEFAULT FALSE,
    external_email VARCHAR(255),
    external_name VARCHAR(255),
    external_organization VARCHAR(255),
    
    -- Permissions
    permissions JSONB NOT NULL DEFAULT '{
        "canSpeak": true,
        "canVideo": true,
        "canScreenShare": false,
        "canRecord": false,
        "canChat": true,
        "canInviteOthers": false
    }',
    
    -- Connection tracking
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    connection_status VARCHAR(20) DEFAULT 'disconnected' CHECK (connection_status IN (
        'connected', 'disconnected', 'reconnecting'
    )),
    connection_metrics JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id, user_id, external_email)
);

-- Indexes for participants
CREATE INDEX idx_participants_session_id ON communication.session_participants(session_id);
CREATE INDEX idx_participants_user_id ON communication.session_participants(user_id);
CREATE INDEX idx_participants_external ON communication.session_participants(is_external, external_email);

-- =====================================================
-- CHAT MESSAGES
-- =====================================================

CREATE TABLE communication.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Message details
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN (
        'text', 'file', 'image', 'audio', 'system', 'ai_summary'
    )),
    
    -- Participants
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID REFERENCES users(id), -- For direct messages
    channel_id UUID, -- For group chats
    session_id UUID REFERENCES communication.sessions(id), -- For session-based chat
    
    -- Threading
    thread_id UUID,
    parent_message_id UUID REFERENCES communication.chat_messages(id),
    
    -- Care-specific tagging
    tags JSONB DEFAULT '[]',
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Care context (same as sessions)
    care_context JSONB,
    
    -- Status tracking
    delivery_status VARCHAR(20) DEFAULT 'delivered' CHECK (delivery_status IN (
        'sending', 'delivered', 'read', 'failed'
    )),
    read_by JSONB DEFAULT '[]',
    
    -- Compliance
    encrypted BOOLEAN DEFAULT TRUE,
    audit_logged BOOLEAN DEFAULT TRUE,
    retention_date DATE NOT NULL,
    
    -- External integration
    external_message_id VARCHAR(255),
    external_platform VARCHAR(50),
    
    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_recipients CHECK (
        (recipient_id IS NOT NULL AND channel_id IS NULL) OR
        (recipient_id IS NULL AND (channel_id IS NOT NULL OR session_id IS NOT NULL))
    )
);

-- Indexes for messages
CREATE INDEX idx_messages_tenant_id ON communication.chat_messages(tenant_id);
CREATE INDEX idx_messages_sender_id ON communication.chat_messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON communication.chat_messages(recipient_id);
CREATE INDEX idx_messages_session_id ON communication.chat_messages(session_id);
CREATE INDEX idx_messages_timestamp ON communication.chat_messages(timestamp);
CREATE INDEX idx_messages_thread_id ON communication.chat_messages(thread_id);
CREATE INDEX idx_messages_tags ON communication.chat_messages USING GIN(tags);
CREATE INDEX idx_messages_delivery_status ON communication.chat_messages(delivery_status);
CREATE INDEX idx_messages_search ON communication.chat_messages USING GIN(to_tsvector('english', content));

-- =====================================================
-- RECORDINGS
-- =====================================================

CREATE TABLE communication.recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES communication.sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Recording details
    recording_type VARCHAR(20) NOT NULL CHECK (recording_type IN (
        'audio', 'video', 'screen', 'audio_video'
    )),
    duration_seconds INTEGER NOT NULL,
    file_size BIGINT NOT NULL,
    
    -- Storage
    storage_url TEXT NOT NULL,
    encryption_key_hash TEXT NOT NULL, -- Hashed encryption key reference
    storage_provider VARCHAR(50) DEFAULT 'aws_s3',
    
    -- Quality metrics
    audio_quality VARCHAR(10) CHECK (audio_quality IN ('low', 'medium', 'high')),
    video_quality VARCHAR(10) CHECK (video_quality IN ('low', 'medium', 'high', '4k')),
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    transcription_status VARCHAR(20) DEFAULT 'pending' CHECK (transcription_status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    
    -- Compliance
    consent_verified BOOLEAN NOT NULL DEFAULT FALSE,
    consent_participants UUID[] NOT NULL DEFAULT '{}',
    retention_date DATE NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_seconds > 0),
    CONSTRAINT valid_file_size CHECK (file_size > 0)
);

-- Indexes for recordings
CREATE INDEX idx_recordings_session_id ON communication.recordings(session_id);
CREATE INDEX idx_recordings_tenant_id ON communication.recordings(tenant_id);
CREATE INDEX idx_recordings_processing_status ON communication.recordings(processing_status);
CREATE INDEX idx_recordings_created_at ON communication.recordings(created_at);

-- =====================================================
-- TRANSCRIPTIONS
-- =====================================================

CREATE TABLE communication.transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES communication.recordings(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Transcription content
    content TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    language VARCHAR(10) DEFAULT 'en-GB',
    
    -- Speaker identification
    speakers JSONB DEFAULT '[]',
    word_timestamps JSONB,
    
    -- AI Analysis
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    topics TEXT[],
    safeguarding_flags JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    key_moments JSONB DEFAULT '[]',
    
    -- Processing metadata
    transcription_engine VARCHAR(50) NOT NULL,
    processing_time_seconds INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Indexes for transcriptions
CREATE INDEX idx_transcriptions_recording_id ON communication.transcriptions(recording_id);
CREATE INDEX idx_transcriptions_tenant_id ON communication.transcriptions(tenant_id);
CREATE INDEX idx_transcriptions_search ON communication.transcriptions USING GIN(to_tsvector('english', content));
CREATE INDEX idx_transcriptions_topics ON communication.transcriptions USING GIN(topics);

-- =====================================================
-- CONSENT MANAGEMENT
-- =====================================================

CREATE TABLE communication.consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES communication.sessions(id) ON DELETE CASCADE,
    participant_id UUID, -- Can be null for external participants
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Consent details
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'recording', 'transcription', 'ai_analysis', 'external_sharing'
    )),
    granted BOOLEAN NOT NULL,
    
    -- Grant details
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ,
    consent_method VARCHAR(20) CHECK (consent_method IN ('explicit', 'implied', 'professional_duty')),
    
    -- Legal basis
    legal_basis TEXT NOT NULL,
    consent_text TEXT NOT NULL,
    
    -- Technical details
    ip_address INET,
    user_agent TEXT,
    
    -- Withdrawal
    withdrawn_at TIMESTAMPTZ,
    withdrawn_by UUID REFERENCES users(id),
    withdrawal_reason TEXT,
    
    -- External participant details
    external_email VARCHAR(255),
    external_name VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id, participant_id, consent_type, external_email)
);

-- Indexes for consent
CREATE INDEX idx_consent_session_id ON communication.consent_records(session_id);
CREATE INDEX idx_consent_participant_id ON communication.consent_records(participant_id);
CREATE INDEX idx_consent_tenant_id ON communication.consent_records(tenant_id);
CREATE INDEX idx_consent_type ON communication.consent_records(consent_type);

-- =====================================================
-- AUDIT EVENTS
-- =====================================================

CREATE TABLE communication.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    
    -- Actor information
    actor_id UUID REFERENCES users(id),
    actor_type VARCHAR(20) DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'external')),
    actor_details JSONB,
    
    -- Target information
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    
    -- Event metadata
    metadata JSONB DEFAULT '{}',
    
    -- Compliance
    compliance_areas TEXT[] DEFAULT '{}',
    risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Timing
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Retention
    retention_date DATE NOT NULL
);

-- Indexes for audit events
CREATE INDEX idx_audit_tenant_id ON communication.audit_events(tenant_id);
CREATE INDEX idx_audit_event_type ON communication.audit_events(event_type);
CREATE INDEX idx_audit_actor_id ON communication.audit_events(actor_id);
CREATE INDEX idx_audit_target ON communication.audit_events(target_type, target_id);
CREATE INDEX idx_audit_timestamp ON communication.audit_events(timestamp);
CREATE INDEX idx_audit_risk_level ON communication.audit_events(risk_level);

-- =====================================================
-- EXTERNAL INTEGRATIONS
-- =====================================================

CREATE TABLE communication.external_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Integration details
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('teams', 'zoom', 'google_meet', 'slack')),
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Configuration
    configured_by UUID NOT NULL REFERENCES users(id),
    configured_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Authentication (encrypted)
    auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('oauth', 'api_key', 'webhook')),
    credentials_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    
    -- Sync settings
    sync_messages BOOLEAN DEFAULT FALSE,
    sync_calendar BOOLEAN DEFAULT FALSE,
    sync_presence BOOLEAN DEFAULT FALSE,
    sync_recordings BOOLEAN DEFAULT FALSE,
    
    -- Compliance
    data_retention_policy TEXT,
    auditing_enabled BOOLEAN DEFAULT TRUE,
    
    -- Status
    connection_status VARCHAR(20) DEFAULT 'disconnected' CHECK (connection_status IN (
        'connected', 'disconnected', 'error', 'expired'
    )),
    last_sync_at TIMESTAMPTZ,
    sync_errors JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, platform)
);

-- Indexes for integrations
CREATE INDEX idx_integrations_tenant_id ON communication.external_integrations(tenant_id);
CREATE INDEX idx_integrations_platform ON communication.external_integrations(platform);
CREATE INDEX idx_integrations_enabled ON communication.external_integrations(enabled);

-- =====================================================
-- EXTERNAL PRESENCE
-- =====================================================

CREATE TABLE communication.external_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Presence details
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'available', 'busy', 'away', 'do_not_disturb', 'offline'
    )),
    message TEXT,
    
    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform)
);

-- Indexes for presence
CREATE INDEX idx_presence_user_id ON communication.external_presence(user_id);
CREATE INDEX idx_presence_platform ON communication.external_presence(platform);
CREATE INDEX idx_presence_status ON communication.external_presence(status);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE communication.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'meeting_reminder', 'message_received', 'recording_ready', 
        'consent_required', 'safeguarding_alert', 'action_item_due'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Recipients
    recipient_id UUID NOT NULL REFERENCES users(id),
    recipient_type VARCHAR(20) DEFAULT 'user' CHECK (recipient_type IN ('user', 'role', 'group')),
    
    -- Action
    action_required BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_text VARCHAR(100),
    
    -- Delivery
    channels JSONB NOT NULL DEFAULT '[]',
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN (
        'pending', 'sent', 'delivered', 'read', 'failed'
    )),
    
    -- Context
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

-- Indexes for notifications
CREATE INDEX idx_notifications_tenant_id ON communication.notifications(tenant_id);
CREATE INDEX idx_notifications_recipient_id ON communication.notifications(recipient_id);
CREATE INDEX idx_notifications_type ON communication.notifications(type);
CREATE INDEX idx_notifications_delivery_status ON communication.notifications(delivery_status);
CREATE INDEX idx_notifications_scheduled_for ON communication.notifications(scheduled_for);

-- =====================================================
-- ACTION ITEMS
-- =====================================================

CREATE TABLE communication.action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES communication.sessions(id) ON DELETE CASCADE,
    
    -- Action details
    description TEXT NOT NULL,
    assigned_to UUID NOT NULL REFERENCES users(id),
    due_date DATE,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'cancelled'
    )),
    
    -- Care context
    related_to_type VARCHAR(50),
    related_to_id UUID,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    notes TEXT[]
);

-- Indexes for action items
CREATE INDEX idx_action_items_tenant_id ON communication.action_items(tenant_id);
CREATE INDEX idx_action_items_session_id ON communication.action_items(session_id);
CREATE INDEX idx_action_items_assigned_to ON communication.action_items(assigned_to);
CREATE INDEX idx_action_items_status ON communication.action_items(status);
CREATE INDEX idx_action_items_due_date ON communication.action_items(due_date);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON communication.sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at 
    BEFORE UPDATE ON communication.session_participants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at 
    BEFORE UPDATE ON communication.external_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE communication.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.external_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication.action_items ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY sessions_tenant_isolation ON communication.sessions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY messages_tenant_isolation ON communication.chat_messages
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY recordings_tenant_isolation ON communication.recordings
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY transcriptions_tenant_isolation ON communication.transcriptions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY consent_tenant_isolation ON communication.consent_records
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY audit_tenant_isolation ON communication.audit_events
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY integrations_tenant_isolation ON communication.external_integrations
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY notifications_tenant_isolation ON communication.notifications
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY action_items_tenant_isolation ON communication.action_items
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =====================================================
-- INITIAL DATA & CONFIGURATION
-- =====================================================

-- Insert default retention policies
INSERT INTO system_config (key, value, description) VALUES 
('communication.default_retention_months', '84', 'Default retention period for communication data (7 years)'),
('communication.recording_max_duration_hours', '8', 'Maximum recording duration in hours'),
('communication.max_file_size_mb', '100', 'Maximum file attachment size in MB'),
('communication.allowed_file_types', '["pdf","doc","docx","jpg","jpeg","png","mp3","mp4"]', 'Allowed file attachment types'),
('communication.auto_transcription_enabled', 'true', 'Enable automatic transcription for recordings'),
('communication.safeguarding_detection_enabled', 'true', 'Enable AI safeguarding detection'),
('communication.external_integration_enabled', 'true', 'Enable external platform integrations');

-- Create indexes for foreign key relationships to existing tables
-- Note: These assume existing WriteCareNotes tables exist
-- CREATE INDEX idx_sessions_resident_context ON communication.sessions USING GIN(resident_ids) WHERE array_length(resident_ids, 1) > 0;
-- CREATE INDEX idx_sessions_incident_context ON communication.sessions USING GIN(incident_ids) WHERE array_length(incident_ids, 1) > 0;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Communication dashboard view
CREATE VIEW communication.dashboard_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    session_type,
    COUNT(*) as session_count,
    AVG(duration_seconds) as avg_duration,
    COUNT(*) FILTER (WHERE recording_enabled) as recorded_sessions,
    COUNT(DISTINCT organizer_id) as active_organizers
FROM communication.sessions 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), session_type
ORDER BY date DESC;

-- User activity summary
CREATE VIEW communication.user_activity_summary AS
SELECT 
    u.id as user_id,
    u.name,
    COUNT(DISTINCT s.id) as sessions_organized,
    COUNT(DISTINCT sp.session_id) as sessions_participated,
    COUNT(DISTINCT m.id) as messages_sent,
    SUM(s.duration_seconds) as total_session_time
FROM users u
LEFT JOIN communication.sessions s ON u.id = s.organizer_id
LEFT JOIN communication.session_participants sp ON u.id = sp.user_id
LEFT JOIN communication.chat_messages m ON u.id = m.sender_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name;

-- Grant permissions to application role
GRANT USAGE ON SCHEMA communication TO writecarenotes_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA communication TO writecarenotes_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA communication TO writecarenotes_app;
GRANT SELECT ON ALL TABLES IN SCHEMA communication TO writecarenotes_readonly;