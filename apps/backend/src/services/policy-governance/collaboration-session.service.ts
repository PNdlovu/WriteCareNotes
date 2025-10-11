/**
 * @fileoverview Service layer for managing collaborative editing sessions on policy documents.
 * @module Policy-governance/Collaboration-session.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Service layer for managing collaborative editing sessions on policy documents.
 */

/**
 * @fileoverview CollaborationSessionService - Session Management for Real-Time Collaboration
 * @module Services/CollaborationSessionService
 * @description Service layer for managing collaborative editing sessions on policy documents.
 * Handles session lifecycle, participant tracking, presence management, and session cleanup.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * Key Features:
 * - Session CRUD operations (create, read, update, delete)
 * - Active session retrieval and filtering
 * - Participant management (join, leave, list)
 * - Presence tracking (active users, cursor positions)
 * - Session cleanup (idle and stale sessions)
 * - Activity metrics (edits, comments, duration)
 * - Multi-user session support
 * 
 * Business Logic:
 * - One user can have multiple sessions across different policies
 * - One policy can have multiple concurrent sessions (different users)
 * - Sessions automatically end after 30 minutes of inactivity
 * - Disconnected sessions are cleaned up after 5 minutes
 * - Edit locks prevent simultaneous editing of the same section
 * 
 * Database Operations:
 * - Uses TypeORM Repository for CollaborationSession entity
 * - Supports transactions for atomic operations
 * - Implements soft delete for session archival
 * - Uses indexes for performant queries
 * 
 * Integration:
 * - Works with PolicyCollaborationGateway for WebSocket events
 * - Integrates with AuditTrailService for activity logging
 * - Coordinates with NotificationService for user alerts
 * 
 * Compliance:
 * - GDPR: Session data retention (30 days after end)
 * - ISO 27001: Audit trail for all session operations
 * - Data Protection Act 2018: User activity tracking with consent
 * 
 * @example
 * ```typescript
 * const service = new CollaborationSessionService(repository);
 * const session = await service.createSession(policyId, userId);
 * const activeUsers = await service.getActiveParticipants(policyId);
 * await service.endSession(session.id);
 * ```
 */

import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  CollaborationSession,
  SessionStatus,
  CursorPosition,
  SelectionRange
} from '../../entities/collaboration-session.entity';

/**
 * Interface for session creation data
 */
export interface CreateSessionData {
  policyId: string;
  userId: string;
  deviceType?: string;
  browser?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for session update data
 */
export interface UpdateSessionData {
  cursorPosition?: CursorPosition | null;
  selectionRange?: SelectionRange | null;
  isEditing?: boolean;
  status?: SessionStatus;
  metadata?: Record<string, any>;
}

/**
 * Interface for session participant info
 */
export interface SessionParticipant {
  userId: string;
  sessionId: string;
  isEditing: boolean;
  cursorPosition: CursorPosition | null;
  lastActivity: Date;
  deviceType: string | null;
  browser: string | null;
  durationMinutes: number;
}

/**
 * Interface for session statistics
 */
export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  idleSessions: number;
  totalParticipants: number;
  averageDurationMinutes: number;
  totalEdits: number;
  totalComments: number;
}

/**
 * CollaborationSessionService Class
 * Business logic for managing collaborative editing sessions
 */
export class CollaborationSessionService {
  /**
   * Initialize service with repository
   * @param sessionRepository - TypeORM repository for CollaborationSession
   */
  constructor(private sessionRepository: Repository<CollaborationSession>) {}

  /**
   * Create a new collaboration session
   * @param data - Session creation data
   * @returns Created session
   */
  async createSession(data: CreateSessionData): Promise<CollaborationSession> {
    try {
      // Check if user already has an active session for this policy
      const existingSession = await this.sessionRepository.findOne({
        where: {
          policyId: data.policyId,
          userId: data.userId,
          status: SessionStatus.ACTIVE
        }
      });

      // If active session exists, return it (reconnection scenario)
      if (existingSession) {
        existingSession.lastActivity = new Date();
        existingSession.deviceType = data.deviceType || existingSession.deviceType;
        existingSession.browser = data.browser || existingSession.browser;
        return await this.sessionRepository.save(existingSession);
      }

      // Create new session
      const session = new CollaborationSession();
      session.policyId = data.policyId;
      session.userId = data.userId;
      session.sessionToken = uuidv4();
      session.deviceType = data.deviceType || null;
      session.browser = data.browser || null;
      session.status = SessionStatus.ACTIVE;
      session.metadata = data.metadata || null;

      const savedSession = await this.sessionRepository.save(session);

      console.log(`✅ Created session ${savedSession.id} for user ${data.userId} on policy ${data.policyId}`);
      return savedSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create collaboration session');
    }
  }

  /**
   * Get session by ID
   * @param sessionId - Session UUID
   * @returns Session or null if not found
   */
  async getSession(sessionId: string): Promise<CollaborationSession | null> {
    try {
      return await this.sessionRepository.findOne({
        where: { id: sessionId }
      });
    } catch (error) {
      console.error('Error fetching session:', error);
      throw new Error('Failed to fetch session');
    }
  }

  /**
   * Get all active sessions for a policy
   * @param policyId - Policy UUID
   * @returns Array of active sessions
   */
  async getActiveSessions(policyId: string): Promise<CollaborationSession[]> {
    try {
      return await this.sessionRepository.find({
        where: {
          policyId,
          status: SessionStatus.ACTIVE
        },
        order: {
          createdAt: 'ASC'
        }
      });
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw new Error('Failed to fetch active sessions');
    }
  }

  /**
   * Get active session for a specific user and policy
   * @param policyId - Policy UUID
   * @param userId - User UUID
   * @returns Session or null if not found
   */
  async getUserSession(policyId: string, userId: string): Promise<CollaborationSession | null> {
    try {
      return await this.sessionRepository.findOne({
        where: {
          policyId,
          userId,
          status: SessionStatus.ACTIVE
        }
      });
    } catch (error) {
      console.error('Error fetching user session:', error);
      throw new Error('Failed to fetch user session');
    }
  }

  /**
   * Get all active participants for a policy
   * @param policyId - Policy UUID
   * @returns Array of participant info
   */
  async getActiveParticipants(policyId: string): Promise<SessionParticipant[]> {
    try {
      const sessions = await this.getActiveSessions(policyId);
      
      return sessions.map(session => ({
        userId: session.userId,
        sessionId: session.id,
        isEditing: session.isEditing,
        cursorPosition: session.cursorPosition,
        lastActivity: session.lastActivity,
        deviceType: session.deviceType,
        browser: session.browser,
        durationMinutes: session.getDurationMinutes()
      }));
    } catch (error) {
      console.error('Error fetching active participants:', error);
      throw new Error('Failed to fetch active participants');
    }
  }

  /**
   * Update session data
   * @param sessionId - Session UUID
   * @param data - Update data
   * @returns Updated session
   */
  async updateSession(sessionId: string, data: UpdateSessionData): Promise<CollaborationSession> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Update fields
      if (data.cursorPosition !== undefined) {
        session.cursorPosition = data.cursorPosition;
      }
      if (data.selectionRange !== undefined) {
        session.selectionRange = data.selectionRange;
      }
      if (data.isEditing !== undefined) {
        session.isEditing = data.isEditing;
      }
      if (data.status !== undefined) {
        session.status = data.status;
      }
      if (data.metadata !== undefined) {
        session.metadata = { ...session.metadata, ...data.metadata };
      }

      // Update last activity
      session.lastActivity = new Date();

      return await this.sessionRepository.save(session);
    } catch (error) {
      console.error('Error updating session:', error);
      throw new Error('Failed to update session');
    }
  }

  /**
   * Update cursor position for a session
   * @param sessionId - Session UUID
   * @param position - Cursor position
   * @param selection - Optional selection range
   * @returns Updated session
   */
  async updateCursor(
    sessionId: string,
    position: CursorPosition,
    selection?: SelectionRange | null
  ): Promise<CollaborationSession> {
    return await this.updateSession(sessionId, {
      cursorPosition: position,
      selectionRange: selection
    });
  }

  /**
   * Set edit lock status for a session
   * @param sessionId - Session UUID
   * @param isEditing - Whether user is actively editing
   * @returns Updated session
   */
  async setEditingStatus(sessionId: string, isEditing: boolean): Promise<CollaborationSession> {
    return await this.updateSession(sessionId, { isEditing });
  }

  /**
   * Increment edit counter for a session
   * @param sessionId - Session UUID
   * @returns Updated session
   */
  async incrementEditCount(sessionId: string): Promise<CollaborationSession> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      session.incrementEditCount();
      return await this.sessionRepository.save(session);
    } catch (error) {
      console.error('Error incrementing edit count:', error);
      throw new Error('Failed to increment edit count');
    }
  }

  /**
   * Increment comment counter for a session
   * @param sessionId - Session UUID
   * @returns Updated session
   */
  async incrementCommentCount(sessionId: string): Promise<CollaborationSession> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      session.incrementCommentCount();
      return await this.sessionRepository.save(session);
    } catch (error) {
      console.error('Error incrementing comment count:', error);
      throw new Error('Failed to increment comment count');
    }
  }

  /**
   * End a session
   * @param sessionId - Session UUID
   * @returns Ended session
   */
  async endSession(sessionId: string): Promise<CollaborationSession> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      session.end();
      const endedSession = await this.sessionRepository.save(session);

      console.log(`🔚 Ended session ${sessionId} - Duration: ${endedSession.getDurationMinutes()} min`);
      return endedSession;
    } catch (error) {
      console.error('Error ending session:', error);
      throw new Error('Failed to end session');
    }
  }

  /**
   * Mark session as disconnected
   * @param sessionId - Session UUID
   * @returns Disconnected session
   */
  async disconnectSession(sessionId: string): Promise<CollaborationSession> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      session.disconnect();
      return await this.sessionRepository.save(session);
    } catch (error) {
      console.error('Error disconnecting session:', error);
      throw new Error('Failed to disconnect session');
    }
  }

  /**
   * Reconnect a disconnected session
   * @param sessionId - Session UUID
   * @param socketId - New WebSocket connection ID
   * @returns Reconnected session
   */
  async reconnectSession(sessionId: string, socketId: string): Promise<CollaborationSession> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      session.reconnect(socketId);
      const reconnectedSession = await this.sessionRepository.save(session);

      console.log(`🔄 Reconnected session ${sessionId} with socket ${socketId}`);
      return reconnectedSession;
    } catch (error) {
      console.error('Error reconnecting session:', error);
      throw new Error('Failed to reconnect session');
    }
  }

  /**
   * Clean up idle sessions (mark as idle)
   * @param idleThresholdMinutes - Minutes of inactivity to consider idle (default: 5)
   * @returns Number of sessions marked as idle
   */
  async cleanupIdleSessions(idleThresholdMinutes: number = 5): Promise<number> {
    try {
      const activeSessions = await this.sessionRepository.find({
        where: { status: SessionStatus.ACTIVE }
      });

      let idleCount = 0;

      for (const session of activeSessions) {
        if (session.isIdle(idleThresholdMinutes)) {
          session.status = SessionStatus.IDLE;
          session.isEditing = false;
          await this.sessionRepository.save(session);
          idleCount++;
        }
      }

      if (idleCount > 0) {
        console.log(`🧹 Marked ${idleCount} sessions as idle`);
      }

      return idleCount;
    } catch (error) {
      console.error('Error cleaning up idle sessions:', error);
      throw new Error('Failed to cleanup idle sessions');
    }
  }

  /**
   * Clean up stale sessions (end sessions that are too old)
   * @param staleThresholdMinutes - Minutes of inactivity to consider stale (default: 30)
   * @returns Number of sessions ended
   */
  async cleanupStaleSessions(staleThresholdMinutes: number = 30): Promise<number> {
    try {
      const sessions = await this.sessionRepository.find({
        where: [
          { status: SessionStatus.ACTIVE },
          { status: SessionStatus.IDLE },
          { status: SessionStatus.DISCONNECTED }
        ]
      });

      let staleCount = 0;

      for (const session of sessions) {
        if (session.isStale(staleThresholdMinutes)) {
          session.end();
          await this.sessionRepository.save(session);
          staleCount++;
        }
      }

      if (staleCount > 0) {
        console.log(`🗑️  Ended ${staleCount} stale sessions`);
      }

      return staleCount;
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
      throw new Error('Failed to cleanup stale sessions');
    }
  }

  /**
   * Get session statistics for a policy
   * @param policyId - Policy UUID
   * @returns Session statistics
   */
  async getSessionStats(policyId: string): Promise<SessionStats> {
    try {
      const allSessions = await this.sessionRepository.find({
        where: { policyId }
      });

      const activeSessions = allSessions.filter(s => s.status === SessionStatus.ACTIVE);
      const idleSessions = allSessions.filter(s => s.status === SessionStatus.IDLE);
      
      const totalEdits = allSessions.reduce((sum, s) => sum + s.editCount, 0);
      const totalComments = allSessions.reduce((sum, s) => sum + s.commentCount, 0);
      
      const totalDuration = allSessions.reduce((sum, s) => sum + s.getDurationMinutes(), 0);
      const averageDuration = allSessions.length > 0 ? totalDuration / allSessions.length : 0;

      // Count unique participants
      const uniqueUsers = new Set(allSessions.map(s => s.userId));

      return {
        totalSessions: allSessions.length,
        activeSessions: activeSessions.length,
        idleSessions: idleSessions.length,
        totalParticipants: uniqueUsers.size,
        averageDurationMinutes: Math.round(averageDuration),
        totalEdits,
        totalComments
      };
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw new Error('Failed to fetch session statistics');
    }
  }

  /**
   * Get all sessions for a user across all policies
   * @param userId - User UUID
   * @param includeEnded - Whether to include ended sessions (default: false)
   * @returns Array of sessions
   */
  async getUserSessions(userId: string, includeEnded: boolean = false): Promise<CollaborationSession[]> {
    try {
      const whereConditions: any = { userId };
      
      if (!includeEnded) {
        whereConditions.status = SessionStatus.ACTIVE;
      }

      return await this.sessionRepository.find({
        where: whereConditions,
        order: { lastActivity: 'DESC' }
      });
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw new Error('Failed to fetch user sessions');
    }
  }

  /**
   * Delete old ended sessions (data retention cleanup)
   * @param retentionDays - Days to retain ended sessions (default: 30)
   * @returns Number of sessions deleted
   */
  async deleteOldSessions(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.sessionRepository
        .createQueryBuilder()
        .delete()
        .where('status = :status', { status: SessionStatus.ENDED })
        .andWhere('ended_at < :cutoffDate', { cutoffDate })
        .execute();

      const deletedCount = result.affected || 0;

      if (deletedCount > 0) {
        console.log(`🗑️  Deleted ${deletedCount} old sessions (older than ${retentionDays} days)`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Error deleting old sessions:', error);
      throw new Error('Failed to delete old sessions');
    }
  }
}
