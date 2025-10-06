import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../core/DatabaseService';
import { Logger } from '../core/Logger';
import { WebRTCProvider } from '../integrations/WebRTCProvider';
import { SocketService } from '../core/SocketService';
import { ConsentService } from './ConsentService';
import { AuditService } from '../core/AuditService';

interface CreateSessionRequest {
  sessionType: 'supervision' | 'meeting' | 'consultation' | 'safeguarding' | 'incident_review' | 'family_call' | 'team_huddle' | 'training';
  title: string;
  description?: string;
  scheduledStartTime?: string;
  recordingEnabled: boolean;
  careContext?: Record<string, any>;
  participants: SessionParticipant[];
  // Enhanced from VideoCall entity
  callType?: 'family_visit' | 'medical_consultation' | 'therapy_session' | 'social_call' | 'group_activity' | 'emergency_call' | 'telemedicine';
  medicalContext?: MedicalCallContext;
  accessibilityFeatures?: AccessibilityFeatures;
  externalMeetingId?: string;
  externalPlatform?: 'teams' | 'zoom' | 'meet' | 'internal';
}

// Enhanced interfaces from VideoCall entity
interface MedicalCallContext {
  medicalRecordAccess: boolean;
  prescriptionReviewRequired: boolean;
  vitalSignsSharing: boolean;
  diagnosticImageSharing: boolean;
  careTeamInvolved: string[];
  followUpRequired: boolean;
  clinicalNotesGenerated: boolean;
  regulatoryCompliance: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    recordingConsent: boolean;
    dataRetentionPolicy: string;
  };
}

interface AccessibilityFeatures {
  closedCaptionsEnabled: boolean;
  signLanguageInterpreter: boolean;
  hearingLoopCompatible: boolean;
  largeTextInterface: boolean;
  highContrastMode: boolean;
  voiceActivatedControls: boolean;
  assistiveTechnologySupport: string[];
}

interface CallAnalytics {
  totalDuration: number; // seconds
  participantCount: number;
  averageConnectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  disconnectionCount: number;
  reconnectionCount: number;
  audioIssues: number;
  videoIssues: number;
  participantSatisfactionRating?: number; // 1-5
  technicalIssuesReported: string[];
}

interface CallRecording {
  recordingId: string;
  recordingUrl: string;
  recordingSize: number;
  recordingDuration: number;
  recordingQuality: 'excellent' | 'good' | 'fair' | 'poor';
  startTime: Date;
  endTime: Date;
  consentGiven: boolean;
  consentGivenBy: string[];
  retentionPeriod: number; // days
  accessPermissions: string[];
  transcriptionAvailable: boolean;
  transcriptionUrl?: string;
}

interface SessionParticipant {
  userId?: string;
  externalEmail?: string;
  externalName?: string;
  participantType: 'internal_staff' | 'external_professional' | 'family_member' | 'resident' | 'authority';
  permissions: {
    canSpeak: boolean;
    canVideo: boolean;
    canRecord: boolean;
  };
  // Enhanced from VideoCall entity
  displayName: string;
  joinedAt?: Date;
  leftAt?: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharingEnabled: boolean;
  isModerator: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  deviceInfo: {
    deviceType: 'desktop' | 'tablet' | 'mobile' | 'care_home_terminal';
    browser?: string;
    operatingSystem?: string;
    hasCamera: boolean;
    hasMicrophone: boolean;
    hasScreenShare: boolean;
  };
}

interface SessionResponse {
  id: string;
  tenantId: string;
  sessionType: string;
  title: string;
  description?: string;
  scheduledStartTime?: string;
  actualStartTime?: string;
  endTime?: string;
  status: string;
  dailyRoomId?: string;
  recordingEnabled: boolean;
  careContext: Record<string, any>;
  participants: SessionParticipant[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced from VideoCall entity
  callType?: string;
  callQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  medicalContext?: MedicalCallContext;
  accessibilityFeatures?: AccessibilityFeatures;
  callAnalytics?: CallAnalytics;
  recording?: CallRecording;
  externalMeetingId?: string;
  externalPlatform?: string;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // seconds
  meetingPassword?: string;
  dialInNumber?: string;
  cancellationReason?: string;
}

export class CommunicationSessionService {
  private db: DatabaseService;
  private logger: Logger;
  private webrtc: WebRTCProvider;
  private socket: SocketService;
  private consent: ConsentService;
  private audit: AuditService;

  constructor() {
    this.db = new DatabaseService();
    this.logger = new Logger('CommunicationSessionService');
    this.webrtc = new WebRTCProvider();
    this.socket = new SocketService();
    this.consent = new ConsentService();
    this.audit = new AuditService();
  }

  /**
   * Create a new communication session
   */
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const sessionData: CreateSessionRequest = req.body;

      // Validate tenant and user permissions
      const hasPermission = await this.validateSessionCreationPermission(tenantId, userId, sessionData.sessionType);
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create this type of session'
        });
        return;
      }

      // Start database transaction
      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Create WebRTC room if needed
        let dailyRoomId: string | null = null;
        if (sessionData.sessionType !== 'team_huddle') {
          const roomConfig = {
            name: `session-${uuidv4()}`,
            privacy: 'private',
            properties: {
              max_participants: sessionData.participants.length + 5, // Buffer for additional participants
              enable_screenshare: true,
              enable_recording: sessionData.recordingEnabled,
              start_audio_off: false,
              start_video_off: false
            }
          };
          
          const room = await this.webrtc.createRoom(roomConfig);
          dailyRoomId = room.name;
        }

        // Insert session record
        const sessionId = uuidv4();
        const sessionQuery = `
          INSERT INTO communication_sessions (
            id, tenant_id, session_type, title, description, 
            scheduled_start_time, status, daily_room_id, recording_enabled, 
            care_context, created_by, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING *
        `;

        const sessionResult = await client.query(sessionQuery, [
          sessionId,
          tenantId,
          sessionData.sessionType,
          sessionData.title,
          sessionData.description || null,
          sessionData.scheduledStartTime ? new Date(sessionData.scheduledStartTime) : null,
          sessionData.scheduledStartTime ? 'scheduled' : 'active',
          dailyRoomId,
          sessionData.recordingEnabled,
          JSON.stringify(sessionData.careContext || {}),
          userId
        ]);

        const session = sessionResult.rows[0];

        // Add participants
        const participantPromises = sessionData.participants.map(async (participant) => {
          const participantId = uuidv4();
          const participantQuery = `
            INSERT INTO session_participants (
              id, session_id, user_id, external_email, external_name,
              participant_type, permissions, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING *
          `;

          const result = await client.query(participantQuery, [
            participantId,
            sessionId,
            participant.userId || null,
            participant.externalEmail || null,
            participant.externalName || null,
            participant.participantType,
            JSON.stringify(participant.permissions)
          ]);

          // Send invitation if external participant
          if (participant.externalEmail && !participant.userId) {
            await this.sendExternalInvitation(participant.externalEmail, session, dailyRoomId);
          }

          return result.rows[0];
        });

        const participants = await Promise.all(participantPromises);

        // Handle consent requirements if recording is enabled
        if (sessionData.recordingEnabled) {
          await this.handleRecordingConsent(tenantId, sessionId, participants);
        }

        await client.query('COMMIT');

        // Emit real-time events
        const sessionResponse: SessionResponse = {
          id: session.id,
          tenantId: session.tenant_id,
          sessionType: session.session_type,
          title: session.title,
          description: session.description,
          scheduledStartTime: session.scheduled_start_time,
          actualStartTime: session.actual_start_time,
          endTime: session.end_time,
          status: session.status,
          dailyRoomId: session.daily_room_id,
          recordingEnabled: session.recording_enabled,
          careContext: session.care_context,
          participants: participants.map(p => ({
            userId: p.user_id,
            externalEmail: p.external_email,
            externalName: p.external_name,
            participantType: p.participant_type,
            permissions: p.permissions
          })),
          createdBy: session.created_by,
          createdAt: session.created_at,
          updatedAt: session.updated_at
        };

        // Emit to relevant users
        await this.socket.emitToTenant(tenantId, 'session:created', sessionResponse);

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'session_created',
          resourceType: 'communication_session',
          resourceId: sessionId,
          details: {
            sessionType: sessionData.sessionType,
            participantCount: participants.length,
            recordingEnabled: sessionData.recordingEnabled
          }
        });

        this.logger.info('Session created successfully', {
          sessionId,
          tenantId,
          sessionType: sessionData.sessionType
        });

        res.status(201).json({
          success: true,
          data: sessionResponse
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to create session', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create session'
      });
    }
  }

  /**
   * Get session details
   */
  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const sessionId = req.params.sessionId;

      // Get session with participants
      const sessionQuery = `
        SELECT 
          s.*,
          json_agg(
            json_build_object(
              'id', p.id,
              'userId', p.user_id,
              'externalEmail', p.external_email,
              'externalName', p.external_name,
              'participantType', p.participant_type,
              'permissions', p.permissions,
              'joinedAt', p.joined_at,
              'leftAt', p.left_at,
              'connectionQuality', p.connection_quality_metrics
            )
          ) as participants
        FROM communication_sessions s
        LEFT JOIN session_participants p ON s.id = p.session_id
        WHERE s.id = $1 AND s.tenant_id = $2
        GROUP BY s.id
      `;

      const result = await this.db.query(sessionQuery, [sessionId, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Session not found'
        });
        return;
      }

      const session = result.rows[0];

      // Check user has access to this session
      const hasAccess = await this.validateSessionAccess(tenantId, userId, sessionId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this session'
        });
        return;
      }

      const response: SessionResponse = {
        id: session.id,
        tenantId: session.tenant_id,
        sessionType: session.session_type,
        title: session.title,
        description: session.description,
        scheduledStartTime: session.scheduled_start_time,
        actualStartTime: session.actual_start_time,
        endTime: session.end_time,
        status: session.status,
        dailyRoomId: session.daily_room_id,
        recordingEnabled: session.recording_enabled,
        careContext: session.care_context,
        participants: session.participants.filter((p: any) => p.id !== null),
        createdBy: session.created_by,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      this.logger.error('Failed to get session', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session'
      });
    }
  }

  /**
   * Start a session
   */
  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const sessionId = req.params.sessionId;

      // Validate access
      const hasAccess = await this.validateSessionAccess(tenantId, userId, sessionId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this session'
        });
        return;
      }

      // Update session status
      const updateQuery = `
        UPDATE communication_sessions 
        SET status = 'active', actual_start_time = NOW(), updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND status = 'scheduled'
        RETURNING *
      `;

      const result = await this.db.query(updateQuery, [sessionId, tenantId]);

      if (result.rows.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Session cannot be started (already active or completed)'
        });
        return;
      }

      const session = result.rows[0];

      // Start recording if enabled
      if (session.recording_enabled && session.daily_room_id) {
        await this.webrtc.startRecording(session.daily_room_id);
      }

      // Emit real-time event
      await this.socket.emitToTenant(tenantId, 'session:started', {
        sessionId,
        startTime: session.actual_start_time
      });

      // Log audit event
      await this.audit.log({
        tenantId,
        userId,
        action: 'session_started',
        resourceType: 'communication_session',
        resourceId: sessionId
      });

      res.json({
        success: true,
        data: {
          sessionId,
          status: 'active',
          startTime: session.actual_start_time
        }
      });

    } catch (error) {
      this.logger.error('Failed to start session', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start session'
      });
    }
  }

  /**
   * End a session
   */
  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const sessionId = req.params.sessionId;

      // Validate access
      const hasAccess = await this.validateSessionAccess(tenantId, userId, sessionId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this session'
        });
        return;
      }

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Update session status
        const updateQuery = `
          UPDATE communication_sessions 
          SET status = 'completed', end_time = NOW(), updated_at = NOW()
          WHERE id = $1 AND tenant_id = $2 AND status = 'active'
          RETURNING *
        `;

        const result = await client.query(updateQuery, [sessionId, tenantId]);

        if (result.rows.length === 0) {
          res.status(400).json({
            success: false,
            message: 'Session cannot be ended (not active)'
          });
          return;
        }

        const session = result.rows[0];

        // Stop recording if it was enabled
        if (session.recording_enabled && session.daily_room_id) {
          await this.webrtc.stopRecording(session.daily_room_id);
        }

        // Update participant left times
        await client.query(`
          UPDATE session_participants 
          SET left_at = NOW() 
          WHERE session_id = $1 AND left_at IS NULL
        `, [sessionId]);

        await client.query('COMMIT');

        // Emit real-time event
        await this.socket.emitToTenant(tenantId, 'session:ended', {
          sessionId,
          endTime: session.end_time
        });

        // Process post-session activities asynchronously
        this.processPostSessionActivities(tenantId, sessionId);

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'session_ended',
          resourceType: 'communication_session',
          resourceId: sessionId
        });

        res.json({
          success: true,
          data: {
            sessionId,
            status: 'completed',
            endTime: session.end_time
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to end session', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end session'
      });
    }
  }

  /**
   * List sessions for a tenant
   */
  async listSessions(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      
      // Query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const status = req.query.status as string;
      const sessionType = req.query.sessionType as string;
      const from = req.query.from as string;
      const to = req.query.to as string;

      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = ['s.tenant_id = $1'];
      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (status) {
        conditions.push(`s.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (sessionType) {
        conditions.push(`s.session_type = $${paramIndex}`);
        params.push(sessionType);
        paramIndex++;
      }

      if (from) {
        conditions.push(`s.created_at >= $${paramIndex}`);
        params.push(new Date(from));
        paramIndex++;
      }

      if (to) {
        conditions.push(`s.created_at <= $${paramIndex}`);
        params.push(new Date(to));
        paramIndex++;
      }

      // Add access control - user must be participant or have admin access
      const hasAdminAccess = await this.validateAdminAccess(tenantId, userId);
      if (!hasAdminAccess) {
        conditions.push(`(
          s.created_by = $${paramIndex} OR 
          EXISTS (
            SELECT 1 FROM session_participants sp 
            WHERE sp.session_id = s.id AND sp.user_id = $${paramIndex}
          )
        )`);
        params.push(userId);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Count query
      const countQuery = `
        SELECT COUNT(*) 
        FROM communication_sessions s 
        WHERE ${whereClause}
      `;
      const countResult = await this.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Data query
      const dataQuery = `
        SELECT 
          s.*,
          json_agg(
            json_build_object(
              'userId', p.user_id,
              'externalEmail', p.external_email,
              'externalName', p.external_name,
              'participantType', p.participant_type
            )
          ) as participants
        FROM communication_sessions s
        LEFT JOIN session_participants p ON s.id = p.session_id
        WHERE ${whereClause}
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const dataResult = await this.db.query(dataQuery, params);

      const sessions = dataResult.rows.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        sessionType: row.session_type,
        title: row.title,
        description: row.description,
        scheduledStartTime: row.scheduled_start_time,
        actualStartTime: row.actual_start_time,
        endTime: row.end_time,
        status: row.status,
        recordingEnabled: row.recording_enabled,
        careContext: row.care_context,
        participantCount: row.participants.filter((p: any) => p.userId !== null).length,
        createdBy: row.created_by,
        createdAt: row.created_at
      }));

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      this.logger.error('Failed to list sessions', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sessions'
      });
    }
  }

  /**
   * Join a session
   */
  async joinSession(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const sessionId = req.params.sessionId;

      // Validate access
      const hasAccess = await this.validateSessionAccess(tenantId, userId, sessionId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this session'
        });
        return;
      }

      // Get session details
      const sessionQuery = `
        SELECT * FROM communication_sessions 
        WHERE id = $1 AND tenant_id = $2
      `;
      const sessionResult = await this.db.query(sessionQuery, [sessionId, tenantId]);

      if (sessionResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Session not found'
        });
        return;
      }

      const session = sessionResult.rows[0];

      if (session.status !== 'active' && session.status !== 'scheduled') {
        res.status(400).json({
          success: false,
          message: 'Session is not available for joining'
        });
        return;
      }

      // Update participant join time
      await this.db.query(`
        UPDATE session_participants 
        SET joined_at = NOW() 
        WHERE session_id = $1 AND user_id = $2 AND joined_at IS NULL
      `, [sessionId, userId]);

      // Generate access token for WebRTC room
      let accessToken = null;
      if (session.daily_room_id) {
        accessToken = await this.webrtc.generateAccessToken(session.daily_room_id, {
          userId,
          userName: await this.getUserName(userId),
          permissions: {
            canAdmin: false,
            canSend: true,
            canReceive: true
          }
        });
      }

      // Emit real-time event
      await this.socket.emitToTenant(tenantId, 'session:participant_joined', {
        sessionId,
        userId,
        joinedAt: new Date()
      });

      res.json({
        success: true,
        data: {
          sessionId,
          roomId: session.daily_room_id,
          accessToken,
          recordingEnabled: session.recording_enabled
        }
      });

    } catch (error) {
      this.logger.error('Failed to join session', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join session'
      });
    }
  }

  // Private helper methods

  private async validateSessionCreationPermission(
    tenantId: string, 
    userId: string, 
    sessionType: string
  ): Promise<boolean> {
    // Check user permissions based on session type
    const permissionQuery = `
      SELECT 1 FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.tenant_id = $2 
      AND (
        r.name IN ('admin', 'manager') OR
        (r.name IN ('senior_nurse', 'supervisor') AND $3 IN ('supervision', 'team_huddle')) OR
        (r.name = 'care_worker' AND $3 = 'team_huddle')
      )
    `;

    const result = await this.db.query(permissionQuery, [userId, tenantId, sessionType]);
    return result.rows.length > 0;
  }

  private async validateSessionAccess(
    tenantId: string, 
    userId: string, 
    sessionId: string
  ): Promise<boolean> {
    const accessQuery = `
      SELECT 1 FROM communication_sessions s
      WHERE s.id = $1 AND s.tenant_id = $2 AND (
        s.created_by = $3 OR
        EXISTS (
          SELECT 1 FROM session_participants sp 
          WHERE sp.session_id = s.id AND sp.user_id = $3
        )
      )
    `;

    const result = await this.db.query(accessQuery, [sessionId, tenantId, userId]);
    return result.rows.length > 0;
  }

  private async validateAdminAccess(tenantId: string, userId: string): Promise<boolean> {
    const adminQuery = `
      SELECT 1 FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.tenant_id = $2 AND r.name IN ('admin', 'manager')
    `;

    const result = await this.db.query(adminQuery, [userId, tenantId]);
    return result.rows.length > 0;
  }

  private async handleRecordingConsent(
    tenantId: string, 
    sessionId: string, 
    participants: any[]
  ): Promise<void> {
    for (const participant of participants) {
      if (participant.user_id) {
        await this.consent.ensureConsent(
          tenantId,
          participant.user_id,
          'communication_recording',
          {
            sessionId,
            recordingType: 'session_recording'
          }
        );
      }
    }
  }

  private async sendExternalInvitation(
    email: string, 
    session: any, 
    roomId: string | null
  ): Promise<void> {
    // Implementation would integrate with email service
    this.logger.info('External invitation sent', { email, sessionId: session.id });
  }

  private async getUserName(userId: string): Promise<string> {
    const result = await this.db.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return `${user.first_name} ${user.last_name}`;
    }
    return 'Unknown User';
  }

  private async processPostSessionActivities(tenantId: string, sessionId: string): Promise<void> {
    // Asynchronous post-processing
    setTimeout(async () => {
      try {
        // Process recordings, extract action items, etc.
        this.logger.info('Processing post-session activities', { sessionId });
      } catch (error) {
        this.logger.error('Failed to process post-session activities', error);
      }
    }, 1000);
  }

  // ========================================
  // ENHANCED METHODS FROM VIDEOCALL ENTITY
  // ========================================

  /**
   * Enhanced session management with medical context and accessibility
   */
  async enhanceSessionWithMedicalContext(sessionId: string, medicalContext: MedicalCallContext): Promise<void> {
    try {
      const updateQuery = `
        UPDATE communication_sessions 
        SET medical_context = $2, updated_at = NOW()
        WHERE id = $1
      `;
      
      await this.db.query(updateQuery, [sessionId, JSON.stringify(medicalContext)]);
      
      this.logger.info('Enhanced session with medical context', { 
        sessionId, 
        hasGdprCompliance: medicalContext.regulatoryCompliance.gdprCompliant 
      });
    } catch (error) {
      this.logger.error('Failed to enhance session with medical context', error);
      throw error;
    }
  }

  /**
   * Configure accessibility features for session
   */
  async configureAccessibilityFeatures(sessionId: string, features: AccessibilityFeatures): Promise<void> {
    try {
      const updateQuery = `
        UPDATE communication_sessions 
        SET accessibility_features = $2, updated_at = NOW()
        WHERE id = $1
      `;
      
      await this.db.query(updateQuery, [sessionId, JSON.stringify(features)]);
      
      this.logger.info('Configured accessibility features', { 
        sessionId, 
        closedCaptions: features.closedCaptionsEnabled,
        signLanguage: features.signLanguageInterpreter
      });
    } catch (error) {
      this.logger.error('Failed to configure accessibility features', error);
      throw error;
    }
  }

  /**
   * Check if session can start recording with proper consent
   */
  async canStartRecording(sessionId: string): Promise<boolean> {
    try {
      const sessionQuery = `
        SELECT recording_enabled, participants, recording_consent
        FROM communication_sessions 
        WHERE id = $1
      `;
      
      const result = await this.db.query(sessionQuery, [sessionId]);
      if (result.rows.length === 0) return false;
      
      const session = result.rows[0];
      if (!session.recording_enabled) return false;
      
      // Check if all participants have given consent
      const participants = JSON.parse(session.participants || '[]');
      const recordingConsent = JSON.parse(session.recording_consent || '{}');
      
      return participants.every((p: any) => 
        recordingConsent.consentGivenBy?.includes(p.userId || p.externalEmail)
      );
    } catch (error) {
      this.logger.error('Failed to check recording permissions', error);
      return false;
    }
  }

  /**
   * Start recording with enhanced consent tracking
   */
  async startRecordingWithConsent(sessionId: string, consentGivenBy: string[]): Promise<CallRecording> {
    try {
      const canRecord = await this.canStartRecording(sessionId);
      if (!canRecord) {
        throw new Error('Cannot start recording without proper consent from all participants');
      }

      // Start WebRTC recording
      const session = await this.getSessionDetails(sessionId);
      if (!session.dailyRoomId) {
        throw new Error('No Daily.co room ID found for session');
      }

      await this.webrtc.startRecording(session.dailyRoomId);

      const recording: CallRecording = {
        recordingId: uuidv4(),
        recordingUrl: `recordings/${sessionId}_${Date.now()}.mp4`,
        recordingSize: 0,
        recordingDuration: 0,
        recordingQuality: 'good',
        startTime: new Date(),
        endTime: new Date(),
        consentGiven: true,
        consentGivenBy,
        retentionPeriod: this.calculateRetentionPeriod(session.callType),
        accessPermissions: this.generateAccessPermissions(sessionId, consentGivenBy),
        transcriptionAvailable: false
      };

      const updateQuery = `
        UPDATE communication_sessions 
        SET recording_data = $2, updated_at = NOW()
        WHERE id = $1
      `;
      
      await this.db.query(updateQuery, [sessionId, JSON.stringify(recording)]);

      this.logger.info('Started recording with consent', { sessionId, recordingId: recording.recordingId });
      return recording;
    } catch (error) {
      this.logger.error('Failed to start recording', error);
      throw error;
    }
  }

  /**
   * Update call analytics in real-time
   */
  async updateCallAnalytics(sessionId: string, analytics: Partial<CallAnalytics>): Promise<void> {
    try {
      const currentQuery = `
        SELECT call_analytics FROM communication_sessions WHERE id = $1
      `;
      
      const result = await this.db.query(currentQuery, [sessionId]);
      if (result.rows.length === 0) return;

      const currentAnalytics = JSON.parse(result.rows[0].call_analytics || '{}');
      const updatedAnalytics = { ...currentAnalytics, ...analytics };

      const updateQuery = `
        UPDATE communication_sessions 
        SET call_analytics = $2, updated_at = NOW()
        WHERE id = $1
      `;
      
      await this.db.query(updateQuery, [sessionId, JSON.stringify(updatedAnalytics)]);

      this.logger.debug('Updated call analytics', { sessionId, analytics: updatedAnalytics });
    } catch (error) {
      this.logger.error('Failed to update call analytics', error);
    }
  }

  /**
   * Add participant with enhanced device and connection tracking
   */
  async addParticipantWithDeviceInfo(sessionId: string, participant: SessionParticipant): Promise<void> {
    try {
      const sessionQuery = `
        SELECT participants FROM communication_sessions WHERE id = $1
      `;
      
      const result = await this.db.query(sessionQuery, [sessionId]);
      if (result.rows.length === 0) {
        throw new Error('Session not found');
      }

      const participants = JSON.parse(result.rows[0].participants || '[]');
      
      // Add or update participant
      const participantId = participant.userId || participant.externalEmail;
      const existingIndex = participants.findIndex((p: any) => 
        (p.userId && p.userId === participant.userId) || 
        (p.externalEmail && p.externalEmail === participant.externalEmail)
      );

      const enhancedParticipant = {
        ...participant,
        joinedAt: new Date(),
        connectionQuality: 'good' as const,
        audioEnabled: true,
        videoEnabled: true,
        screenSharingEnabled: false,
        isModerator: false
      };

      if (existingIndex >= 0) {
        participants[existingIndex] = enhancedParticipant;
      } else {
        participants.push(enhancedParticipant);
      }

      const updateQuery = `
        UPDATE communication_sessions 
        SET participants = $2, updated_at = NOW()
        WHERE id = $1
      `;
      
      await this.db.query(updateQuery, [sessionId, JSON.stringify(participants)]);

      // Update analytics
      await this.updateCallAnalytics(sessionId, { 
        participantCount: participants.length 
      });

      this.logger.info('Added participant with device info', { 
        sessionId, 
        participantId,
        deviceType: participant.deviceInfo?.deviceType 
      });
    } catch (error) {
      this.logger.error('Failed to add participant', error);
      throw error;
    }
  }

  /**
   * Check if session is a medical call requiring special handling
   */
  async isMedicalCall(sessionId: string): Promise<boolean> {
    try {
      const sessionQuery = `
        SELECT call_type, medical_context FROM communication_sessions WHERE id = $1
      `;
      
      const result = await this.db.query(sessionQuery, [sessionId]);
      if (result.rows.length === 0) return false;

      const session = result.rows[0];
      return session.call_type === 'medical_consultation' || 
             session.call_type === 'telemedicine' ||
             !!session.medical_context;
    } catch (error) {
      this.logger.error('Failed to check if medical call', error);
      return false;
    }
  }

  /**
   * Calculate retention period based on call type
   */
  private calculateRetentionPeriod(callType?: string): number {
    const retentionPeriods: Record<string, number> = {
      medical_consultation: 2555, // 7 years (medical records)
      telemedicine: 2555,
      therapy_session: 1825, // 5 years
      family_visit: 365, // 1 year
      social_call: 90, // 3 months
      emergency_call: 2555, // 7 years
      group_activity: 180 // 6 months
    };
    
    return retentionPeriods[callType || 'family_visit'] || 365;
  }

  /**
   * Generate access permissions for recording
   */
  private generateAccessPermissions(sessionId: string, consentGivenBy: string[]): string[] {
    const permissions = [...consentGivenBy];
    
    // Add role-based access
    permissions.push('medical_team', 'care_managers', 'admin');
    
    return [...new Set(permissions)];
  }

  /**
   * Get session details for internal use
   */
  private async getSessionDetails(sessionId: string): Promise<any> {
    const sessionQuery = `
      SELECT * FROM communication_sessions WHERE id = $1
    `;
    
    const result = await this.db.query(sessionQuery, [sessionId]);
    return result.rows[0];
  }

  // Route definitions
  getRoutes(): express.Router {
    const router = express.Router();

    // Validation middleware
    const createSessionValidation = [
      body('sessionType').isIn(['supervision', 'meeting', 'consultation', 'safeguarding', 'incident_review', 'family_call', 'team_huddle', 'training']),
      body('title').isLength({ min: 1, max: 255 }).trim(),
      body('description').optional().isLength({ max: 1000 }).trim(),
      body('recordingEnabled').isBoolean(),
      body('participants').isArray({ min: 1 }),
      body('participants.*.participantType').isIn(['internal_staff', 'external_professional', 'family_member', 'resident', 'authority']),
      body('participants.*.permissions').isObject(),
      // Enhanced validation
      body('callType').optional().isIn(['family_visit', 'medical_consultation', 'therapy_session', 'social_call', 'group_activity', 'emergency_call', 'telemedicine']),
      body('medicalContext').optional().isObject(),
      body('accessibilityFeatures').optional().isObject(),
      body('externalPlatform').optional().isIn(['teams', 'zoom', 'meet', 'internal'])
    ];

    const sessionIdValidation = [
      param('sessionId').isUUID()
    ];

    const listSessionsValidation = [
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('status').optional().isIn(['scheduled', 'active', 'completed', 'cancelled']),
      query('sessionType').optional().isIn(['supervision', 'meeting', 'consultation', 'safeguarding', 'incident_review', 'family_call', 'team_huddle', 'training'])
    ];

    // Routes
    router.post('/sessions', createSessionValidation, this.createSession.bind(this));
    router.get('/sessions', listSessionsValidation, this.listSessions.bind(this));
    router.get('/sessions/:sessionId', sessionIdValidation, this.getSession.bind(this));
    router.post('/sessions/:sessionId/start', sessionIdValidation, this.startSession.bind(this));
    router.post('/sessions/:sessionId/end', sessionIdValidation, this.endSession.bind(this));
    router.post('/sessions/:sessionId/join', sessionIdValidation, this.joinSession.bind(this));

    // Enhanced routes from VideoCall entity
    router.post('/sessions/:sessionId/medical-context', sessionIdValidation, this.enhanceWithMedicalContext.bind(this));
    router.post('/sessions/:sessionId/accessibility', sessionIdValidation, this.configureAccessibility.bind(this));
    router.post('/sessions/:sessionId/start-recording', sessionIdValidation, this.startRecordingEndpoint.bind(this));
    router.post('/sessions/:sessionId/participants', sessionIdValidation, this.addParticipantEndpoint.bind(this));
    router.put('/sessions/:sessionId/analytics', sessionIdValidation, this.updateAnalyticsEndpoint.bind(this));
    router.get('/sessions/:sessionId/medical-status', sessionIdValidation, this.getMedicalStatusEndpoint.bind(this));

    return router;
  }

  // ========================================
  // ENHANCED ROUTE HANDLERS
  // ========================================

  /**
   * Enhance session with medical context endpoint
   */
  async enhanceWithMedicalContext(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const medicalContext: MedicalCallContext = req.body;

      await this.enhanceSessionWithMedicalContext(sessionId, medicalContext);

      res.json({
        success: true,
        message: 'Medical context added to session',
        data: { sessionId, medicalContext }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to enhance session with medical context', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enhance session with medical context',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Configure accessibility features endpoint
   */
  async configureAccessibility(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const features: AccessibilityFeatures = req.body;

      await this.configureAccessibilityFeatures(sessionId, features);

      res.json({
        success: true,
        message: 'Accessibility features configured',
        data: { sessionId, features }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to configure accessibility features', error);
      res.status(500).json({
        success: false,
        message: 'Failed to configure accessibility features',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start recording endpoint
   */
  async startRecordingEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { consentGivenBy } = req.body;

      const recording = await this.startRecordingWithConsent(sessionId, consentGivenBy);

      res.json({
        success: true,
        message: 'Recording started with consent',
        data: { sessionId, recording }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to start recording', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start recording',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Add participant endpoint
   */
  async addParticipantEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const participant: SessionParticipant = req.body;

      await this.addParticipantWithDeviceInfo(sessionId, participant);

      res.json({
        success: true,
        message: 'Participant added with device info',
        data: { sessionId, participant }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to add participant', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add participant',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update analytics endpoint
   */
  async updateAnalyticsEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const analytics: Partial<CallAnalytics> = req.body;

      await this.updateCallAnalytics(sessionId, analytics);

      res.json({
        success: true,
        message: 'Call analytics updated',
        data: { sessionId, analytics }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to update analytics', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get medical status endpoint
   */
  async getMedicalStatusEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const isMedical = await this.isMedicalCall(sessionId);

      res.json({
        success: true,
        data: { sessionId, isMedicalCall: isMedical }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to get medical status', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get medical status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}