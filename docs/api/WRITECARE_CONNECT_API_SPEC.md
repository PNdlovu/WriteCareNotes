/**
 * WriteCareConnect API Specifications
 * RESTful API design for communication microservices
 * Integrates with existing WriteCareNotes API patterns
 */

// =====================================================
// COMMUNICATION SESSION SERVICE
// Path: /api/v1/communication/sessions
// =====================================================

/**
 * Communication Session Management
 * Handles voice/video calls, meetings, and supervision sessions
 */

// Create a new communication session
POST /api/v1/communication/sessions
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "sessionType": "supervision" | "meeting" | "consultation" | "safeguarding" | "incident_review" | "family_call",
  "title": string,
  "description"?: string,
  "scheduledAt"?: string, // ISO 8601
  "participants": [
    {
      "userId": string,
      "role": "host" | "participant" | "observer",
      "permissions": {
        "canSpeak": boolean,
        "canVideo": boolean,
        "canScreenShare": boolean,
        "canRecord": boolean,
        "canChat": boolean
      }
    }
  ],
  "careContext"?: {
    "residentIds"?: string[],
    "incidentIds"?: string[],
    "careplanIds"?: string[],
    "medicationIds"?: string[],
    "staffIds"?: string[],
    "supervisionType"?: string,
    "safeguardingLevel"?: "low" | "medium" | "high" | "critical"
  },
  "recordingEnabled": boolean,
  "externalIntegration"?: {
    "platform": "teams" | "zoom" | "meet",
    "externalMeetingId"?: string
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "sessionId": string,
    "joinUrl": string,
    "hostUrl": string,
    "sessionToken": string,
    "consentRequired": boolean,
    "externalMeetingUrl"?: string
  }
}

// Join a communication session
POST /api/v1/communication/sessions/{sessionId}/join
Authorization: Bearer {token}

Request Body:
{
  "deviceType": "web" | "mobile" | "desktop",
  "consentGiven"?: boolean
}

Response: 200 OK
{
  "success": true,
  "data": {
    "sessionToken": string,
    "iceServers": ICEServer[],
    "mediaConstraints": MediaConstraints,
    "participantId": string
  }
}

// Get session details
GET /api/v1/communication/sessions/{sessionId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": CommunicationSession
}

// End a session
POST /api/v1/communication/sessions/{sessionId}/end
Authorization: Bearer {token}

Request Body:
{
  "reason"?: string,
  "generateSummary": boolean
}

Response: 200 OK
{
  "success": true,
  "data": {
    "endedAt": string,
    "duration": number,
    "recordingUrl"?: string,
    "participantCount": number
  }
}

// Update session (change title, add participants, etc.)
PATCH /api/v1/communication/sessions/{sessionId}
Authorization: Bearer {token}

Request Body:
{
  "title"?: string,
  "description"?: string,
  "addParticipants"?: SessionParticipant[],
  "removeParticipants"?: string[],
  "updatePermissions"?: {
    "participantId": string,
    "permissions": ParticipantPermissions
  }[]
}

// Get user's sessions (with filtering)
GET /api/v1/communication/sessions
Authorization: Bearer {token}
Query Parameters:
- status: "scheduled" | "active" | "completed" | "cancelled"
- sessionType: "supervision" | "meeting" | "consultation" | etc.
- dateFrom: ISO 8601 date
- dateTo: ISO 8601 date
- participantId: string
- careContext.residentId: string
- limit: number (default: 50)
- offset: number (default: 0)

Response: 200 OK
{
  "success": true,
  "data": {
    "sessions": CommunicationSession[],
    "total": number,
    "hasMore": boolean
  }
}

// =====================================================
// REAL-TIME MESSAGING SERVICE
// Path: /api/v1/communication/messages
// =====================================================

/**
 * Real-time Chat and Messaging
 * WebSocket + REST API for instant messaging
 */

// Send a message
POST /api/v1/communication/messages
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "recipientId"?: string, // For direct messages
  "channelId"?: string,   // For group/session chats
  "sessionId"?: string,   // For session-based chat
  "content": string,
  "messageType": "text" | "file" | "image" | "audio",
  "tags"?: MessageTag[],
  "priority": "low" | "normal" | "high" | "urgent",
  "attachments"?: {
    "filename": string,
    "fileType": string,
    "fileSize": number,
    "base64Data": string
  }[],
  "careContext"?: CareContext,
  "threadId"?: string,
  "parentMessageId"?: string
}

Response: 201 Created
{
  "success": true,
  "data": {
    "messageId": string,
    "timestamp": string,
    "deliveryStatus": "sending"
  }
}

// Get message history
GET /api/v1/communication/messages
Authorization: Bearer {token}
Query Parameters:
- recipientId: string
- channelId: string
- sessionId: string
- before: string (message ID for pagination)
- limit: number (default: 50)
- tags: string[] (comma-separated)
- priority: "high" | "urgent"
- dateFrom: ISO 8601 date
- dateTo: ISO 8601 date

Response: 200 OK
{
  "success": true,
  "data": {
    "messages": ChatMessage[],
    "hasMore": boolean,
    "nextCursor": string
  }
}

// Mark messages as read
POST /api/v1/communication/messages/mark-read
Authorization: Bearer {token}

Request Body:
{
  "messageIds": string[],
  "conversationId"?: string // Mark all in conversation as read
}

Response: 200 OK
{
  "success": true,
  "data": {
    "markedCount": number
  }
}

// Edit a message
PATCH /api/v1/communication/messages/{messageId}
Authorization: Bearer {token}

Request Body:
{
  "content": string,
  "tags"?: MessageTag[]
}

Response: 200 OK
{
  "success": true,
  "data": ChatMessage
}

// Delete a message
DELETE /api/v1/communication/messages/{messageId}
Authorization: Bearer {token}

Response: 204 No Content

// Search messages
GET /api/v1/communication/messages/search
Authorization: Bearer {token}
Query Parameters:
- q: string (search query)
- tags: string[] (comma-separated)
- dateFrom: ISO 8601 date
- dateTo: ISO 8601 date
- senderIds: string[] (comma-separated)
- limit: number (default: 50)

Response: 200 OK
{
  "success": true,
  "data": {
    "messages": ChatMessage[],
    "total": number,
    "highlights": {
      "messageId": string,
      "snippets": string[]
    }[]
  }
}

// WebSocket Events for Real-time Messaging
WebSocket: wss://api.writecarenotes.com/ws/communication
Authentication: ?token={jwt_token}

Events:
- message.sent
- message.delivered
- message.read
- typing.start
- typing.stop
- user.online
- user.offline
- session.participant.joined
- session.participant.left

// =====================================================
// RECORDING SERVICE
// Path: /api/v1/communication/recordings
// =====================================================

/**
 * Recording Management
 * Handle session recordings, storage, and playback
 */

// Start recording
POST /api/v1/communication/recordings/start
Authorization: Bearer {token}

Request Body:
{
  "sessionId": string,
  "recordingType": "audio" | "video" | "screen" | "audio_video",
  "quality": "low" | "medium" | "high",
  "consentVerified": boolean,
  "participants": string[] // IDs of participants consenting
}

Response: 200 OK
{
  "success": true,
  "data": {
    "recordingId": string,
    "status": "starting",
    "estimatedSize": number
  }
}

// Stop recording
POST /api/v1/communication/recordings/{recordingId}/stop
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "recordingId": string,
    "duration": number,
    "fileSize": number,
    "processingStatus": "pending"
  }
}

// Get recording details
GET /api/v1/communication/recordings/{recordingId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": Recording
}

// Get recording playback URL
GET /api/v1/communication/recordings/{recordingId}/playback
Authorization: Bearer {token}
Query Parameters:
- quality: "low" | "medium" | "high"
- startTime: number (seconds)
- endTime: number (seconds)

Response: 200 OK
{
  "success": true,
  "data": {
    "playbackUrl": string,
    "expiresAt": string,
    "duration": number,
    "qualityAvailable": string[]
  }
}

// Download recording
GET /api/v1/communication/recordings/{recordingId}/download
Authorization: Bearer {token}
Query Parameters:
- format: "mp4" | "mp3" | "wav"
- quality: "low" | "medium" | "high"

Response: 200 OK (File download)
Headers:
- Content-Type: video/mp4 | audio/mp3 | audio/wav
- Content-Disposition: attachment; filename="recording-{id}.{ext}"

// Get recordings for session
GET /api/v1/communication/recordings
Authorization: Bearer {token}
Query Parameters:
- sessionId: string
- dateFrom: ISO 8601 date
- dateTo: ISO 8601 date
- status: "pending" | "processing" | "completed" | "failed"
- limit: number (default: 50)
- offset: number (default: 0)

Response: 200 OK
{
  "success": true,
  "data": {
    "recordings": Recording[],
    "total": number
  }
}

// =====================================================
// TRANSCRIPTION SERVICE
// Path: /api/v1/communication/transcriptions
// =====================================================

/**
 * AI Transcription and Analysis
 * Convert recordings to text with AI insights
 */

// Start transcription
POST /api/v1/communication/transcriptions
Authorization: Bearer {token}

Request Body:
{
  "recordingId": string,
  "language": "en-GB" | "en-US" | etc.,
  "enableSpeakerIdentification": boolean,
  "enableSentimentAnalysis": boolean,
  "enableSafeguardingDetection": boolean,
  "enableActionItemExtraction": boolean
}

Response: 202 Accepted
{
  "success": true,
  "data": {
    "transcriptionId": string,
    "status": "processing",
    "estimatedCompletionTime": string
  }
}

// Get transcription
GET /api/v1/communication/transcriptions/{transcriptionId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": TranscriptData
}

// Update transcription (manual corrections)
PATCH /api/v1/communication/transcriptions/{transcriptionId}
Authorization: Bearer {token}

Request Body:
{
  "content": string,
  "speakerCorrections"?: {
    "speakerId": string,
    "userId": string,
    "name": string
  }[]
}

Response: 200 OK
{
  "success": true,
  "data": TranscriptData
}

// Generate summary
POST /api/v1/communication/transcriptions/{transcriptionId}/summary
Authorization: Bearer {token}

Request Body:
{
  "summaryType": "brief" | "detailed" | "action_items" | "safeguarding_focus",
  "includeTimestamps": boolean,
  "includeSpeakerNames": boolean
}

Response: 200 OK
{
  "success": true,
  "data": {
    "summary": string,
    "keyPoints": string[],
    "actionItems": ActionItem[],
    "safeguardingFlags": SafeguardingFlag[]
  }
}

// =====================================================
// CONSENT MANAGEMENT SERVICE
// Path: /api/v1/communication/consent
// =====================================================

/**
 * GDPR Consent Management
 * Handle recording and processing consent
 */

// Record consent
POST /api/v1/communication/consent
Authorization: Bearer {token}

Request Body:
{
  "sessionId": string,
  "participantId": string,
  "consentTypes": ("recording" | "transcription" | "ai_analysis" | "external_sharing")[],
  "ipAddress": string,
  "userAgent": string,
  "consentText": string,
  "legalBasis": string
}

Response: 201 Created
{
  "success": true,
  "data": {
    "consentId": string,
    "timestamp": string,
    "verified": boolean
  }
}

// Withdraw consent
POST /api/v1/communication/consent/{consentId}/withdraw
Authorization: Bearer {token}

Request Body:
{
  "reason": string,
  "effectiveDate": string // ISO 8601
}

Response: 200 OK
{
  "success": true,
  "data": {
    "withdrawnAt": string,
    "dataProcessingStatus": "stopping" | "stopped"
  }
}

// Get consent status
GET /api/v1/communication/consent
Authorization: Bearer {token}
Query Parameters:
- sessionId: string
- participantId: string
- consentType: "recording" | "transcription" | "ai_analysis"

Response: 200 OK
{
  "success": true,
  "data": {
    "consents": ConsentRecord[]
  }
}

// =====================================================
// EXTERNAL INTEGRATION SERVICE
// Path: /api/v1/communication/integrations
// =====================================================

/**
 * External Platform Integration
 * Teams, Zoom, Google Meet bridge
 */

// Configure integration
POST /api/v1/communication/integrations
Authorization: Bearer {token}

Request Body:
{
  "platform": "teams" | "zoom" | "google_meet",
  "authCode": string, // OAuth authorization code
  "syncSettings": {
    "syncMessages": boolean,
    "syncCalendar": boolean,
    "syncPresence": boolean,
    "syncRecordings": boolean
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "integrationId": string,
    "status": "connected",
    "expiresAt": string
  }
}

// Create external meeting
POST /api/v1/communication/integrations/{platform}/meetings
Authorization: Bearer {token}

Request Body:
{
  "title": string,
  "startTime": string, // ISO 8601
  "duration": number, // minutes
  "participants": string[], // email addresses
  "recordInWriteCareNotes": boolean
}

Response: 201 Created
{
  "success": true,
  "data": {
    "externalMeetingId": string,
    "joinUrl": string,
    "wrappedMeetingId": string // Internal session ID
  }
}

// Get external presence
GET /api/v1/communication/integrations/presence
Authorization: Bearer {token}
Query Parameters:
- userIds: string[] (comma-separated)
- platforms: string[] (comma-separated)

Response: 200 OK
{
  "success": true,
  "data": {
    "presence": ExternalPresence[]
  }
}

// Sync external messages
POST /api/v1/communication/integrations/{platform}/sync
Authorization: Bearer {token}

Request Body:
{
  "syncType": "messages" | "calendar" | "contacts",
  "dateFrom": string, // ISO 8601
  "dateTo": string
}

Response: 202 Accepted
{
  "success": true,
  "data": {
    "syncJobId": string,
    "status": "processing"
  }
}

// =====================================================
// ANALYTICS SERVICE
// Path: /api/v1/communication/analytics
// =====================================================

/**
 * Communication Analytics
 * Usage metrics, compliance reports, insights
 */

// Get communication analytics
GET /api/v1/communication/analytics
Authorization: Bearer {token}
Query Parameters:
- period: "day" | "week" | "month" | "quarter" | "year"
- dateFrom: ISO 8601 date
- dateTo: ISO 8601 date
- groupBy: "user" | "department" | "session_type"

Response: 200 OK
{
  "success": true,
  "data": CommunicationAnalytics
}

// Get compliance report
GET /api/v1/communication/analytics/compliance
Authorization: Bearer {token}
Query Parameters:
- reportType: "consent" | "retention" | "audit" | "safeguarding"
- dateFrom: ISO 8601 date
- dateTo: ISO 8601 date
- format: "json" | "pdf" | "csv"

Response: 200 OK
{
  "success": true,
  "data": {
    "reportId": string,
    "downloadUrl": string,
    "generatedAt": string
  }
}

// Get user activity report
GET /api/v1/communication/analytics/users/{userId}
Authorization: Bearer {token}
Query Parameters:
- period: "week" | "month" | "quarter"
- includeDetailedSessions: boolean

Response: 200 OK
{
  "success": true,
  "data": UserActivity
}

// =====================================================
// AUDIT SERVICE
// Path: /api/v1/communication/audit
// =====================================================

/**
 * Audit Trail and Compliance Logging
 * Complete audit trail for all communication activities
 */

// Get audit trail
GET /api/v1/communication/audit
Authorization: Bearer {token}
Query Parameters:
- entityType: "session" | "message" | "recording" | "user"
- entityId: string
- eventType: "session_created" | "participant_joined" | etc.
- actorId: string
- dateFrom: ISO 8601 date
- dateTo: ISO 8601 date
- riskLevel: "low" | "medium" | "high"
- complianceArea: string
- limit: number (default: 100)
- offset: number (default: 0)

Response: 200 OK
{
  "success": true,
  "data": {
    "auditEvents": AuditEvent[],
    "total": number
  }
}

// Create manual audit entry
POST /api/v1/communication/audit
Authorization: Bearer {token}

Request Body:
{
  "eventType": string,
  "targetType": "session" | "message" | "recording" | "user",
  "targetId": string,
  "description": string,
  "metadata": Record<string, any>,
  "complianceArea": string[],
  "riskLevel": "low" | "medium" | "high"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "auditEventId": string,
    "timestamp": string
  }
}

// Export audit trail
GET /api/v1/communication/audit/export
Authorization: Bearer {token}
Query Parameters:
- format: "json" | "csv" | "pdf"
- dateFrom: ISO 8601 date
- dateTo: ISO 8601 date
- entityIds: string[] (comma-separated)

Response: 200 OK (File download)

// =====================================================
// COMMON ERROR RESPONSES
// =====================================================

// Validation Error
Response: 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "sessionType",
      "error": "Must be one of: supervision, meeting, consultation, safeguarding, incident_review, family_call"
    }
  }
}

// Unauthorized
Response: 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}

// Forbidden (insufficient permissions)
Response: 403 Forbidden
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "User does not have permission to access this resource",
    "requiredPermissions": ["COMMUNICATION_ADMIN"]
  }
}

// Resource Not Found
Response: 404 Not Found
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Session not found",
    "resourceType": "CommunicationSession",
    "resourceId": "sess_123456"
  }
}

// Rate Limit Exceeded
Response: 429 Too Many Requests
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}

// Internal Server Error
Response: 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "correlationId": "corr_789012"
  }
}