-- WriteCareConnect: Unified Communication Database Schema
-- Consolidates legacy communication tables with WriteCareConnect schema
-- Replaces: video_calls, communication_channels, communication_messages
-- Version: 2.0 (Consolidated)

-- ==================================================
-- ENHANCED COMMUNICATION SESSIONS TABLE
-- Replaces: video_calls + communication_sessions
-- ==================================================
DROP TABLE IF EXISTS communication_sessions CASCADE;
CREATE TABLE communication_sessions (
    -- Core WriteCareConnect fields
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number VARCHAR(50) UNIQUE NOT NULL, -- WCC-SESS-001, etc.
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN (
        'video_call', 'audio_call', 'screen_share', 'meeting', 
        'consultation', 'supervision', 'training'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'starting', 'active', 'paused', 'ended', 'cancelled', 'failed'
    )),
    
    -- Enhanced Video Call Features (from VideoCall entity)
    call_type VARCHAR(50) CHECK (call_type IN (
        'family_visit', 'medical_consultation', 'therapy_session', 
        'social_call', 'group_activity', 'emergency_call', 'telemedicine'
    )),
    call_quality VARCHAR(20) DEFAULT 'good' CHECK (call_quality IN (
        'excellent', 'good', 'fair', 'poor'
    )),
    
    -- WebRTC and External Platform Integration
    daily_room_id VARCHAR(255), -- Daily.co room ID
    daily_room_url TEXT, -- Daily.co room URL
    external_meeting_id VARCHAR(255), -- Teams/Zoom meeting ID
    external_platform VARCHAR(20) CHECK (external_platform IN (
        'teams', 'zoom', 'meet', 'internal'
    )),
    meeting_password VARCHAR(100),
    dial_in_number VARCHAR(50),
    
    -- Participant Management
    host_id UUID NOT NULL,
    host_type VARCHAR(50) NOT NULL,
    participants JSONB NOT NULL DEFAULT '[]', -- Enhanced participant tracking
    max_participants INTEGER DEFAULT 10,
    
    -- Scheduling and Duration
    scheduled_start_time TIMESTAMP NOT NULL,
    scheduled_end_time TIMESTAMP,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    estimated_duration INTEGER, -- minutes
    actual_duration INTEGER, -- seconds
    
    -- Enhanced Medical Context (from VideoCall entity)
    medical_context JSONB CHECK (medical_context IS NULL OR (
        medical_context ? 'medicalRecordAccess' AND
        medical_context ? 'prescriptionReviewRequired' AND
        medical_context ? 'vitalSignsSharing' AND
        medical_context ? 'regulatoryCompliance'
    )),
    
    -- Advanced Accessibility Features (from VideoCall entity)
    accessibility_features JSONB NOT NULL DEFAULT '{
        "closedCaptionsEnabled": false,
        "signLanguageInterpreter": false,
        "hearingLoopCompatible": false,
        "largeTextInterface": false,
        "highContrastMode": false,
        "voiceActivatedControls": false,
        "assistiveTechnologySupport": []
    }',
    
    -- Comprehensive Analytics (from VideoCall entity)
    call_analytics JSONB NOT NULL DEFAULT '{
        "totalDuration": 0,
        "participantCount": 0,
        "averageConnectionQuality": "good",
        "disconnectionCount": 0,
        "reconnectionCount": 0,
        "audioIssues": 0,
        "videoIssues": 0,
        "participantSatisfactionRating": null,
        "technicalIssuesReported": []
    }',
    
    -- Enhanced Recording Management (from VideoCall entity)
    recording_config JSONB DEFAULT '{
        "recordingEnabled": false,
        "screenSharingEnabled": true,
        "chatEnabled": true,
        "waitingRoomEnabled": false,
        "encryptionEnabled": true,
        "qualitySettings": "high"
    }',
    recording_consent JSONB, -- Per-participant consent tracking
    recording_data JSONB, -- Recording URLs, transcripts, etc.
    
    -- Consent and Compliance
    consent_session_id UUID REFERENCES consent_sessions(id),
    gdpr_compliant BOOLEAN DEFAULT true,
    data_retention_days INTEGER DEFAULT 365,
    
    -- Audit and Metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags VARCHAR(255)[],
    notes TEXT,
    cancellation_reason TEXT,
    
    -- Timestamps and Versioning
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Multi-tenant Security
    care_home_id UUID NOT NULL,
    
    -- Row Level Security
    CONSTRAINT valid_schedule CHECK (scheduled_start_time < scheduled_end_time OR scheduled_end_time IS NULL),
    CONSTRAINT valid_duration CHECK (actual_start_time IS NULL OR actual_end_time IS NULL OR actual_start_time <= actual_end_time)
);

-- Indexes for performance
CREATE INDEX idx_communication_sessions_care_home ON communication_sessions(care_home_id);
CREATE INDEX idx_communication_sessions_status ON communication_sessions(status);
CREATE INDEX idx_communication_sessions_scheduled ON communication_sessions(scheduled_start_time);
CREATE INDEX idx_communication_sessions_host ON communication_sessions(host_id);
CREATE INDEX idx_communication_sessions_type ON communication_sessions(session_type, call_type);
CREATE INDEX idx_communication_sessions_external ON communication_sessions(external_platform, external_meeting_id);

-- ==================================================
-- ENHANCED MESSAGES TABLE
-- Replaces: messages + communication_messages
-- ==================================================
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
    -- Core WriteCareConnect fields
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    session_id UUID REFERENCES communication_sessions(id), -- Link to video session
    thread_id UUID, -- Message threading
    parent_message_id UUID REFERENCES messages(id), -- Reply to message
    
    -- Enhanced Message Types and Content
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN (
        'text', 'file', 'image', 'video', 'audio', 'location', 
        'contact', 'poll', 'system', 'announcement', 'emergency',
        'medical_note', 'care_update', 'family_message'
    )),
    content TEXT NOT NULL,
    formatted_content JSONB, -- Rich text formatting
    subject VARCHAR(255), -- For email-style messages
    
    -- Enhanced Delivery Tracking (from CommunicationService)
    delivery_method VARCHAR(20) CHECK (delivery_method IN (
        'in_app', 'email', 'sms', 'push', 'voice', 'webhook'
    )),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN (
        'pending', 'sending', 'sent', 'delivered', 'failed', 'bounced'
    )),
    delivery_attempts INTEGER DEFAULT 0,
    last_delivery_attempt TIMESTAMP,
    delivery_errors JSONB,
    
    -- Bulk Messaging Support (from CommunicationService)
    bulk_campaign_id UUID,
    template_id UUID,
    template_data JSONB, -- Template variable values
    
    -- Enhanced Recipients and Targeting
    sender_id UUID NOT NULL,
    sender_type VARCHAR(50) NOT NULL, -- resident, family, staff, external
    recipients JSONB NOT NULL, -- Enhanced recipient tracking
    total_recipients INTEGER DEFAULT 1,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    
    -- Message Features
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    requires_acknowledgment BOOLEAN DEFAULT false,
    expires_at TIMESTAMP, -- Auto-delete after expiry
    scheduled_at TIMESTAMP, -- Scheduled delivery
    
    -- File Attachments
    attachments JSONB DEFAULT '[]', -- File metadata and URLs
    attachment_count INTEGER DEFAULT 0,
    total_attachment_size BIGINT DEFAULT 0, -- bytes
    
    -- Reactions and Interactions
    reactions JSONB DEFAULT '{}', -- {emoji: [user_ids]}
    mentions JSONB DEFAULT '[]', -- [@user_id, @channel_id]
    hashtags VARCHAR(50)[], -- [#urgent, #family]
    
    -- Read Receipts and Analytics
    read_receipts JSONB DEFAULT '[]', -- [{user_id, read_at}]
    delivery_receipts JSONB DEFAULT '[]', -- [{user_id, delivered_at}]
    interaction_count INTEGER DEFAULT 0,
    
    -- Medical and Care Context
    medical_relevance VARCHAR(20) CHECK (medical_relevance IN (
        'none', 'low', 'medium', 'high', 'critical'
    )),
    care_context JSONB, -- Care plan references, medication notes, etc.
    requires_clinical_review BOOLEAN DEFAULT false,
    
    -- Consent and Compliance
    consent_required BOOLEAN DEFAULT false,
    consent_obtained BOOLEAN DEFAULT false,
    gdpr_category VARCHAR(50), -- personal_data, medical_data, etc.
    
    -- Security and Encryption
    is_encrypted BOOLEAN DEFAULT false,
    encryption_key_id VARCHAR(255),
    
    -- Audit and Metadata
    edit_history JSONB DEFAULT '[]', -- Message edit tracking
    flagged_content JSONB, -- Content moderation flags
    translation_data JSONB, -- Multi-language support
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Multi-tenant Security
    care_home_id UUID NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_messages_care_home ON messages(care_home_id);
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_parent ON messages(parent_message_id);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_status ON messages(delivery_status);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_scheduled ON messages(scheduled_at);
CREATE INDEX idx_messages_priority ON messages(priority) WHERE priority IN ('high', 'urgent');
CREATE INDEX idx_messages_bulk ON messages(bulk_campaign_id) WHERE bulk_campaign_id IS NOT NULL;

-- ==================================================
-- ENHANCED CHANNELS TABLE
-- Consolidates channel management from both systems
-- ==================================================
DROP TABLE IF EXISTS channels CASCADE;
CREATE TABLE channels (
    -- Core WriteCareConnect fields
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Enhanced Channel Types (from CommunicationService)
    channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN (
        'direct_message', 'group_chat', 'family_group', 'care_team', 
        'emergency', 'announcements', 'social', 'medical', 'activities',
        'email', 'sms', 'push', 'webhook', 'api', 'voice', 'video'
    )),
    
    -- Channel Configuration
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    topic VARCHAR(500),
    
    -- Enhanced Capabilities (from CommunicationService)
    capabilities JSONB NOT NULL DEFAULT '{
        "messaging": true,
        "fileSharing": true,
        "voiceCalls": false,
        "videoCalls": false,
        "screenSharing": false,
        "recording": false,
        "translation": false,
        "moderation": false
    }',
    
    -- Provider Integration (from CommunicationService)
    provider VARCHAR(100), -- daily, teams, zoom, internal
    provider_id VARCHAR(255),
    provider_config JSONB,
    
    -- Channel Settings
    is_private BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_read_only BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    max_members INTEGER DEFAULT 100,
    message_retention_days INTEGER DEFAULT 365,
    
    -- Member Management
    members JSONB NOT NULL DEFAULT '[]', -- [{user_id, role, joined_at}]
    member_count INTEGER DEFAULT 0,
    admin_ids UUID[] DEFAULT '{}',
    moderator_ids UUID[] DEFAULT '{}',
    
    -- Enhanced Statistics (from CommunicationService)
    statistics JSONB NOT NULL DEFAULT '{
        "totalMessages": 0,
        "totalMembers": 0,
        "totalFiles": 0,
        "totalCalls": 0,
        "lastActivity": null,
        "averageResponseTime": 0,
        "engagementScore": 0
    }',
    
    -- Health Monitoring (from CommunicationService)
    health_status VARCHAR(20) DEFAULT 'healthy' CHECK (health_status IN (
        'healthy', 'degraded', 'unhealthy', 'maintenance'
    )),
    last_health_check TIMESTAMP DEFAULT NOW(),
    health_metrics JSONB,
    
    -- Notification Settings
    notification_settings JSONB DEFAULT '{
        "muteAll": false,
        "muteKeywords": [],
        "highlightKeywords": [],
        "emailDigest": false,
        "pushNotifications": true
    }',
    
    -- Consent and Compliance
    requires_consent BOOLEAN DEFAULT false,
    gdpr_category VARCHAR(50),
    medical_channel BOOLEAN DEFAULT false,
    
    -- Audit and Metadata
    tags VARCHAR(255)[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP,
    
    -- Multi-tenant Security
    care_home_id UUID NOT NULL,
    created_by UUID NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_channels_care_home ON channels(care_home_id);
CREATE INDEX idx_channels_type ON channels(channel_type);
CREATE INDEX idx_channels_members ON channels USING GIN (members);
CREATE INDEX idx_channels_active ON channels(is_archived, last_message_at DESC);
CREATE INDEX idx_channels_private ON channels(is_private);
CREATE INDEX idx_channels_health ON channels(health_status);

-- ==================================================
-- ROW LEVEL SECURITY POLICIES
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE communication_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Communication Sessions RLS
CREATE POLICY communication_sessions_care_home_policy ON communication_sessions
    FOR ALL USING (
        care_home_id = current_setting('app.current_care_home_id', true)::UUID
    );

-- Messages RLS
CREATE POLICY messages_care_home_policy ON messages
    FOR ALL USING (
        care_home_id = current_setting('app.current_care_home_id', true)::UUID
    );

-- Channels RLS
CREATE POLICY channels_care_home_policy ON channels
    FOR ALL USING (
        care_home_id = current_setting('app.current_care_home_id', true)::UUID
    );

-- ==================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_communication_sessions_updated_at
    BEFORE UPDATE ON communication_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- MIGRATION COMMENTS
-- ==================================================

COMMENT ON TABLE communication_sessions IS 'Unified video calls and communication sessions table, replacing both video_calls and communication_sessions from legacy system';
COMMENT ON TABLE messages IS 'Unified messaging table, replacing both messages and communication_messages from legacy system';
COMMENT ON TABLE channels IS 'Unified channel management table, replacing communication_channels from legacy system';

COMMENT ON COLUMN communication_sessions.medical_context IS 'Enhanced medical context from VideoCall entity including GDPR/HIPAA compliance';
COMMENT ON COLUMN communication_sessions.accessibility_features IS 'Advanced accessibility features from VideoCall entity';
COMMENT ON COLUMN communication_sessions.call_analytics IS 'Comprehensive analytics from VideoCall entity';
COMMENT ON COLUMN messages.delivery_method IS 'Multi-channel delivery support from CommunicationService';
COMMENT ON COLUMN channels.capabilities IS 'Enhanced channel capabilities from CommunicationService';