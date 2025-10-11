/**
 * WriteCareConnect - Enhanced Communication Schemas
 * Designed to integrate seamlessly with existing WriteCareNotes architecture
 */

// =====================================================
// AUDIT AND COMPLIANCE TYPES
// =====================================================

export interface AccessLog {
  id: string
  timestamp: Date
  userId: string
  action: string
  ipAddress?: string
  userAgent?: string
}

// =====================================================
// CORE COMMUNICATION ENTITIES
// =====================================================

interface CommunicationSession {
  id: string
  sessionType: 'supervision' | 'meeting' | 'consultation' | 'safeguarding' | 'incident_review' | 'family_call'
  
  // Participants
  participants: SessionParticipant[]
  organizer: string // userId
  
  // Timing
  scheduledAt?: Date
  startedAt?: Date
  endedAt?: Date
  duration?: number // seconds
  
  // Recording & Consent
  recordingEnabled: boolean
  consentStatus: ConsentStatus
  recordingUrl?: string
  recordingSize?: number // bytes
  
  // Content
  title: string
  description?: string
  transcript?: string
  summary?: string
  actionItems?: ActionItem[]
  
  // Care Context Integration (NEW - Links to existing WriteCareNotes data)
  careContext: CareContext
  
  // Compliance
  auditTrail: AuditEvent[]
  complianceFlags: ComplianceFlag[]
  retentionDate: Date
  
  // Technical
  sessionState: 'scheduled' | 'active' | 'completed' | 'cancelled'
  connectionQuality?: ConnectionMetrics
  
  // Integration
  externalMeetingId?: string // For Teams/Zoom bridge
  externalPlatform?: 'teams' | 'zoom' | 'meet' | 'internal'
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
  tenantId: string // Multi-tenant support
}

interface SessionParticipant {
  userId: string
  role: 'host' | 'participant' | 'observer' | 'external'
  joinedAt?: Date
  leftAt?: Date
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  permissions: ParticipantPermissions
  
  // External participant support
  isExternal: boolean
  externalEmail?: string
  externalName?: string
  externalOrganization?: string
}

interface ParticipantPermissions {
  canSpeak: boolean
  canVideo: boolean
  canScreenShare: boolean
  canRecord: boolean
  canChat: boolean
  canInviteOthers: boolean
}

// =====================================================
// CARE CONTEXT INTEGRATION
// =====================================================

interface CareContext {
  // Link to existing WriteCareNotes entities
  residentIds?: string[]        // Which residents are being discussed
  incidentIds?: string[]        // Related to incident reviews
  careplanIds?: string[]        // Care plan discussions
  medicationIds?: string[]      // Medication reviews
  staffIds?: string[]          // Staff being supervised/discussed
  
  // Supervision context
  supervisionType?: 'annual_appraisal' | 'monthly_supervision' | 'disciplinary' | 'return_to_work' | 'probation_review'
  supervisionDueDate?: Date
  previousSupervisionId?: string
  
  // Safeguarding context
  safeguardingLevel?: 'low' | 'medium' | 'high' | 'critical'
  safeguardingCategories?: string[]
  
  // Meeting context  
  meetingType?: 'team_meeting' | 'handover' | 'case_conference' | 'family_meeting' | 'multidisciplinary'
  
  // Compliance context
  complianceAreas?: string[] // CQC domains, regulations
  inspectionRelated?: boolean
}

// =====================================================
// REAL-TIME MESSAGING
// =====================================================

interface ChatMessage {
  id: string
  
  // Core message data
  content: string
  messageType: 'text' | 'file' | 'image' | 'audio' | 'system' | 'ai_summary'
  
  // Participants
  senderId: string
  recipientId?: string // For direct messages
  channelId?: string   // For group chats
  
  // Threading
  threadId?: string    // Reply threading
  parentMessageId?: string
  
  // Care-specific tagging
  tags: MessageTag[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  
  // File attachments
  attachments?: MessageAttachment[]
  
  // Care context
  careContext?: CareContext
  
  // Status tracking
  deliveryStatus: 'sending' | 'delivered' | 'read' | 'failed'
  readBy: MessageRead[]
  
  // Compliance
  encrypted: boolean
  auditLogged: boolean
  retentionDate: Date
  
  // Integration
  externalMessageId?: string
  externalPlatform?: 'teams' | 'slack' | 'internal'
  
  // Metadata
  timestamp: Date
  editedAt?: Date
  deletedAt?: Date
  tenantId: string
}

interface MessageTag {
  type: 'safeguarding' | 'medication' | 'incident' | 'family' | 'supervision' | 'urgent' | 'confidential'
  value: string
  color?: string
}

interface MessageAttachment {
  id: string
  filename: string
  fileType: string
  fileSize: number
  url: string
  thumbnailUrl?: string
  scanStatus: 'pending' | 'clean' | 'infected' | 'failed'
}

interface MessageRead {
  userId: string
  readAt: Date
  deviceType: 'web' | 'mobile' | 'desktop'
}

// =====================================================
// RECORDING & TRANSCRIPTION
// =====================================================

interface Recording {
  id: string
  sessionId: string
  
  // Recording details
  recordingType: 'audio' | 'video' | 'screen' | 'audio_video'
  duration: number // seconds
  fileSize: number // bytes
  
  // Storage
  storageUrl: string
  encryptionKey: string
  storageProvider: 'aws_s3' | 'azure_blob' | 'local'
  
  // Quality metrics
  audioQuality: 'low' | 'medium' | 'high'
  videoQuality?: 'low' | 'medium' | 'high' | '4k'
  
  // Processing status
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed'
  
  // Content
  transcript?: TranscriptData
  summary?: string
  keyMoments?: KeyMoment[]
  
  // Compliance
  consentVerified: boolean
  retentionDate: Date
  auditAccess: AccessLog[]
  
  // Metadata
  createdAt: Date
  tenantId: string
}

interface TranscriptData {
  id: string
  content: string
  confidence: number // 0-1
  language: string
  
  // Speaker identification
  speakers: SpeakerIdentification[]
  
  // Timestamps
  wordTimestamps?: WordTimestamp[]
  
  // AI Analysis
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
  topics?: string[]
  safeguardingFlags?: SafeguardingFlag[]
  actionItems?: ActionItem[]
  
  // Processing metadata
  transcriptionEngine: 'whisper' | 'assemblyai' | 'google' | 'azure'
  processedAt: Date
}

interface SpeakerIdentification {
  speakerId: string
  userId?: string // If identified as known user
  name: string
  confidence: number
  segments: SpeechSegment[]
}

interface SpeechSegment {
  startTime: number // seconds
  endTime: number   // seconds
  text: string
  confidence: number
}

interface WordTimestamp {
  word: string
  startTime: number
  endTime: number
  confidence: number
}

interface KeyMoment {
  timestamp: number // seconds
  type: 'important_decision' | 'action_item' | 'safeguarding_concern' | 'escalation' | 'key_information'
  description: string
  participants: string[]
  severity?: 'low' | 'medium' | 'high'
}

// =====================================================
// CONSENT MANAGEMENT
// =====================================================

interface ConsentStatus {
  recordingConsent: ConsentRecord
  transcriptionConsent: ConsentRecord
  aiAnalysisConsent: ConsentRecord
  externalSharingConsent?: ConsentRecord
}

interface ConsentRecord {
  granted: boolean
  grantedBy: string
  grantedAt?: Date
  consentType: 'explicit' | 'implied' | 'professional_duty'
  withdrawnAt?: Date
  withdrawnBy?: string
  
  // For external participants
  ipAddress?: string
  userAgent?: string
  consentText: string
  legalBasis: string
}

// =====================================================
// AUDIT & COMPLIANCE
// =====================================================

interface AuditEvent {
  id: string
  eventType: 'session_created' | 'participant_joined' | 'recording_started' | 'consent_given' | 'message_sent' | 'file_shared' | 'transcript_generated'
  
  // Actor information
  actorId: string
  actorType: 'user' | 'system' | 'external'
  actorDetails?: {
    name: string
    role: string
    organization?: string
    ipAddress?: string
  }
  
  // Target information
  targetType: 'session' | 'message' | 'recording' | 'user'
  targetId: string
  
  // Event details
  description: string
  metadata: Record<string, any>
  
  // Compliance
  complianceArea: string[] // CQC domains, regulations
  riskLevel: 'low' | 'medium' | 'high'
  
  // Timing
  timestamp: Date
  tenantId: string
}

interface ComplianceFlag {
  id: string
  type: 'safeguarding_concern' | 'professional_boundary' | 'data_protection' | 'medication_safety' | 'incident_reporting'
  severity: 'info' | 'warning' | 'error' | 'critical'
  
  // Detection
  detectedBy: 'ai_analysis' | 'user_report' | 'system_rule'
  detectedAt: Date
  confidence?: number // For AI detection
  
  // Content
  description: string
  evidence: string[]
  recommendations: string[]
  
  // Resolution
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  resolvedAt?: Date
  resolution?: string
  
  // Context
  careContext?: CareContext
  relatedFlags?: string[]
}

interface SafeguardingFlag {
  category: 'physical_abuse' | 'emotional_abuse' | 'financial_abuse' | 'neglect' | 'self_harm' | 'discrimination' | 'institutional_abuse'
  confidence: number
  evidence: string
  timestamp: number
  requiresEscalation: boolean
}

interface ActionItem {
  id: string
  description: string
  assignedTo: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  
  // Care context
  relatedTo?: {
    type: 'resident' | 'staff' | 'incident' | 'care_plan'
    id: string
  }
  
  // Tracking
  createdAt: Date
  completedAt?: Date
  notes?: string[]
}

// =====================================================
// EXTERNAL INTEGRATION
// =====================================================

interface ExternalIntegration {
  id: string
  platform: 'teams' | 'zoom' | 'google_meet' | 'slack'
  
  // Configuration
  enabled: boolean
  configuredBy: string
  configuredAt: Date
  
  // Authentication
  authType: 'oauth' | 'api_key' | 'webhook'
  credentials: Record<string, string> // Encrypted
  
  // Sync settings
  syncMessages: boolean
  syncCalendar: boolean
  syncPresence: boolean
  syncRecordings: boolean
  
  // Compliance
  dataRetentionPolicy: string
  auditingEnabled: boolean
  
  // Status
  connectionStatus: 'connected' | 'disconnected' | 'error'
  lastSyncAt?: Date
  syncErrors?: string[]
  
  tenantId: string
}

interface ExternalPresence {
  userId: string
  platform: 'teams' | 'zoom' | 'slack'
  status: 'available' | 'busy' | 'away' | 'do_not_disturb' | 'offline'
  message?: string
  lastUpdated: Date
}

// =====================================================
// ANALYTICS & REPORTING
// =====================================================

interface CommunicationAnalytics {
  tenantId: string
  period: {
    startDate: Date
    endDate: Date
  }
  
  // Usage metrics
  totalSessions: number
  totalMinutes: number
  totalMessages: number
  activeUsers: number
  
  // Session analytics
  sessionsByType: Record<string, number>
  averageSessionDuration: number
  recordingUtilization: number
  
  // Communication patterns
  peakUsageHours: number[]
  mostActiveUsers: UserActivity[]
  messageVolumeByTag: Record<string, number>
  
  // Compliance metrics
  consentComplianceRate: number
  auditTrailCompleteness: number
  retentionPolicyCompliance: number
  
  // Quality metrics
  connectionSuccessRate: number
  averageConnectionQuality: number
  transcriptionAccuracy: number
  
  // AI insights
  safeguardingFlagsDetected: number
  actionItemsGenerated: number
  sentimentAnalysis: {
    positive: number
    neutral: number
    negative: number
  }
}

interface UserActivity {
  userId: string
  userName: string
  role: string
  sessionsHosted: number
  sessionsParticipated: number
  messagesSent: number
  totalMinutes: number
  lastActive: Date
}

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================

interface CommunicationNotification {
  id: string
  type: 'meeting_reminder' | 'message_received' | 'recording_ready' | 'consent_required' | 'safeguarding_alert' | 'action_item_due'
  
  // Recipients
  recipientId: string
  recipientType: 'user' | 'role' | 'group'
  
  // Content
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  
  // Action
  actionRequired: boolean
  actionUrl?: string
  actionText?: string
  
  // Delivery
  channels: NotificationChannel[]
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  
  // Context
  relatedEntityType: 'session' | 'message' | 'recording' | 'action_item'
  relatedEntityId: string
  
  // Scheduling
  scheduledFor?: Date
  expiresAt?: Date
  
  // Metadata
  createdAt: Date
  tenantId: string
}

interface NotificationChannel {
  type: 'in_app' | 'email' | 'sms' | 'push' | 'teams' | 'slack'
  enabled: boolean
  address?: string // email, phone, webhook url
  deliveredAt?: Date
  error?: string
}

// =====================================================
// CONNECTION & QUALITY MONITORING
// =====================================================

interface ConnectionMetrics {
  participantMetrics: ParticipantConnectionMetrics[]
  overallQuality: 'poor' | 'fair' | 'good' | 'excellent'
  networkStability: number // 0-1
  audioQuality: number     // 0-1
  videoQuality: number     // 0-1
  
  // Technical details
  serverRegion: string
  bandwidth: {
    upload: number   // kbps
    download: number // kbps
  }
  latency: number    // ms
  packetLoss: number // percentage
  
  // Issues
  connectionIssues: ConnectionIssue[]
  qualityWarnings: string[]
}

interface ParticipantConnectionMetrics {
  participantId: string
  connectionQuality: number // 0-1
  bandwidth: { upload: number; download: number }
  latency: number
  packetLoss: number
  
  // Device info
  deviceType: 'web' | 'mobile' | 'desktop'
  browser?: string
  operatingSystem: string
  
  // Issues
  disconnections: number
  reconnections: number
  qualityIssues: string[]
}

interface ConnectionIssue {
  type: 'disconnection' | 'poor_quality' | 'bandwidth_limit' | 'device_issue'
  participantId: string
  timestamp: Date
  duration?: number // seconds
  resolved: boolean
  resolution?: string
}

export {
  // Core entities
  CommunicationSession,
  SessionParticipant,
  CareContext,
  
  // Messaging
  ChatMessage,
  MessageTag,
  MessageAttachment,
  
  // Recording & Transcription
  Recording,
  TranscriptData,
  SpeakerIdentification,
  KeyMoment,
  
  // Consent & Compliance
  ConsentStatus,
  ConsentRecord,
  AuditEvent,
  ComplianceFlag,
  SafeguardingFlag,
  ActionItem,
  
  // External Integration
  ExternalIntegration,
  ExternalPresence,
  
  // Analytics
  CommunicationAnalytics,
  UserActivity,
  
  // Notifications
  CommunicationNotification,
  NotificationChannel,
  
  // Quality & Monitoring
  ConnectionMetrics,
  ParticipantConnectionMetrics,
  ConnectionIssue
}