/**
 * @fileoverview Manages user session validation and security for healthcare compliance
 * @module Auth/SessionValidationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Manages user session validation and security for healthcare compliance
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Session Validation Service for WriteCareNotes
 * @module SessionValidationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Manages user session validation and security for healthcare compliance
 * 
 * @compliance
 * - GDPR Article 32 (Security of processing)
 * - NHS Digital Data Security Standards
 * - Healthcare session management requirements
 */

import { logger, healthcareLogger } from '@/utils/logger';
import { redis } from '@/config/redis';
import { database } from '@/config/database';

/**
 * Session information interface
 */
export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  expiresAt: Date;
}

/**
 * Session validation service
 */
export class SessionValidationService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly SESSION_TIMEOUT = 3600; // 1 hour in seconds
  private readonly MAX_CONCURRENT_SESSIONS = 5;

  /**
   * Validate if a session is active and valid
   */
  async validateSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Check session in Redis cache first
      const cachedSession = await this.getSessionFromCache(sessionId);
      if (cachedSession) {
        // Update last activity
        await this.updateSessionActivity(sessionId);
        return cachedSession.userId === userId && cachedSession.isActive;
      }

      // Check session in database
      const dbSession = await this.getSessionFromDatabase(sessionId);
      if (!dbSession) {
        healthcareLogger.security('warning', 'Session not found', {
          sessionId,
          userId,
          auditTrail: true,
          securityIncident: true
        });
        return false;
      }

      // Validate session
      if (dbSession.userId !== userId) {
        healthcareLogger.security('error', 'Session user mismatch', {
          sessionId,
          expectedUserId: userId,
          actualUserId: dbSession.userId,
          auditTrail: true,
          securityIncident: true
        });
        return false;
      }

      if (!dbSession.isActive) {
        healthcareLogger.security('info', 'Session is inactive', {
          sessionId,
          userId,
          auditTrail: true
        });
        return false;
      }

      if (dbSession.expiresAt < new Date()) {
        healthcareLogger.security('info', 'Session has expired', {
          sessionId,
          userId,
          expiresAt: dbSession.expiresAt,
          auditTrail: true
        });
        await this.invalidateSession(sessionId);
        return false;
      }

      // Cache valid session
      await this.cacheSession(dbSession);
      await this.updateSessionActivity(sessionId);

      return true;

    } catch (error: unknown) {
      healthcareLogger.security('error', 'Session validation failed', {
        sessionId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        auditTrail: true,
        securityIncident: true
      });
      return false;
    }
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    deviceId?: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    try {
      // Generate unique session ID
      const sessionId = this.generateSessionId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.SESSION_TIMEOUT * 1000);

      const sessionInfo: SessionInfo = {
        sessionId,
        userId,
        deviceId,
        ipAddress,
        userAgent,
        createdAt: now,
        lastActivity: now,
        isActive: true,
        expiresAt
      };

      // Check concurrent session limit
      await this.enforceSessionLimit(userId);

      // Store session in database
      await this.storeSessionInDatabase(sessionInfo);

      // Cache session
      await this.cacheSession(sessionInfo);

      // Track user sessions
      await this.addUserSession(userId, sessionId);

      healthcareLogger.security('info', 'Session created successfully', {
        sessionId,
        userId,
        deviceId,
        ipAddress,
        auditTrail: true
      });

      return sessionId;

    } catch (error: unknown) {
      healthcareLogger.security('error', 'Session creation failed', {
        userId,
        deviceId,
        ipAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
        auditTrail: true,
        securityIncident: true
      });
      throw new Error('Failed to create session');
    }
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      // Get session info for logging
      const session = await this.getSessionFromCache(sessionId) || 
                     await this.getSessionFromDatabase(sessionId);

      // Remove from cache
      await redis.del(`${this.SESSION_PREFIX}${sessionId}`);

      // Mark as inactive in database
      await database.query(
        'UPDATE user_sessions SET is_active = false, updated_at = NOW() WHERE session_id = ?',
        [sessionId]
      );

      // Remove from user sessions list
      if (session) {
        await this.removeUserSession(session.userId, sessionId);

        healthcareLogger.security('info', 'Session invalidated', {
          sessionId,
          userId: session.userId,
          auditTrail: true
        });
      }

    } catch (error: unknown) {
      healthcareLogger.security('error', 'Session invalidation failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        auditTrail: true,
        securityIncident: true
      });
      throw new Error('Failed to invalidate session');
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      // Get all user sessions
      const sessionIds = await this.getUserSessions(userId);

      // Invalidate each session
      for (const sessionId of sessionIds) {
        await this.invalidateSession(sessionId);
      }

      // Clear user sessions list
      await redis.del(`${this.USER_SESSIONS_PREFIX}${userId}`);

      healthcareLogger.security('info', 'All user sessions invalidated', {
        userId,
        sessionCount: sessionIds.length,
        auditTrail: true
      });

    } catch (error: unknown) {
      healthcareLogger.security('error', 'Failed to invalidate all user sessions', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        auditTrail: true,
        securityIncident: true
      });
      throw new Error('Failed to invalidate user sessions');
    }
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const now = new Date();

      // Update in cache
      const cachedSession = await this.getSessionFromCache(sessionId);
      if (cachedSession) {
        cachedSession.lastActivity = now;
        await this.cacheSession(cachedSession);
      }

      // Update in database (less frequently to reduce load)
      await database.query(
        'UPDATE user_sessions SET last_activity = NOW() WHERE session_id = ? AND is_active = true',
        [sessionId]
      );

    } catch (error: unknown) {
      console.error('Failed to update session activity', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get session from Redis cache
   */
  private async getSessionFromCache(sessionId: string): Promise<SessionInfo | null> {
    try {
      const cached = await redis.get(`${this.SESSION_PREFIX}${sessionId}`);
      if (!cached) return null;

      const session = JSON.parse(cached) as SessionInfo;
      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.lastActivity = new Date(session.lastActivity);
      session.expiresAt = new Date(session.expiresAt);

      return session;
    } catch (error: unknown) {
      console.error('Failed to get session from cache', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get session from database
   */
  private async getSessionFromDatabase(sessionId: string): Promise<SessionInfo | null> {
    try {
      const result = await database.query(
        `SELECT session_id, user_id, device_id, ip_address, user_agent, 
                created_at, last_activity, is_active, expires_at
         FROM user_sessions 
         WHERE session_id = ?`,
        [sessionId]
      );

      if (!result.rows.length) return null;

      const row = result.rows[0];
      return {
        sessionId: row.session_id,
        userId: row.user_id,
        deviceId: row.device_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
        lastActivity: row.last_activity,
        isActive: row.is_active,
        expiresAt: row.expires_at
      };

    } catch (error: unknown) {
      console.error('Failed to get session from database', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Cache session in Redis
   */
  private async cacheSession(session: SessionInfo): Promise<void> {
    try {
      await redis.setex(
        `${this.SESSION_PREFIX}${session.sessionId}`,
        this.SESSION_TIMEOUT,
        JSON.stringify(session)
      );
    } catch (error: unknown) {
      console.error('Failed to cache session', {
        sessionId: session.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Store session in database
   */
  private async storeSessionInDatabase(session: SessionInfo): Promise<void> {
    await database.query(
      `INSERT INTO user_sessions 
       (session_id, user_id, device_id, ip_address, user_agent, 
        created_at, last_activity, is_active, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.sessionId,
        session.userId,
        session.deviceId,
        session.ipAddress,
        session.userAgent,
        session.createdAt,
        session.lastActivity,
        session.isActive,
        session.expiresAt
      ]
    );
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const activeSessions = await this.getUserSessions(userId);
    
    if (activeSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      // Remove oldest session
      const oldestSession = activeSessions[0];
      await this.invalidateSession(oldestSession);
      
      healthcareLogger.security('info', 'Session limit enforced, oldest session invalidated', {
        userId,
        invalidatedSession: oldestSession,
        auditTrail: true
      });
    }
  }

  /**
   * Get all active sessions for a user
   */
  private async getUserSessions(userId: string): Promise<string[]> {
    try {
      const sessions = await redis.lrange(`${this.USER_SESSIONS_PREFIX}${userId}`, 0, -1);
      return sessions;
    } catch (error: unknown) {
      console.error('Failed to get user sessions', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Add session to user's session list
   */
  private async addUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      await redis.lpush(`${this.USER_SESSIONS_PREFIX}${userId}`, sessionId);
      await redis.expire(`${this.USER_SESSIONS_PREFIX}${userId}`, this.SESSION_TIMEOUT);
    } catch (error: unknown) {
      console.error('Failed to add user session', {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Remove session from user's session list
   */
  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      await redis.lrem(`${this.USER_SESSIONS_PREFIX}${userId}`, 0, sessionId);
    } catch (error: unknown) {
      console.error('Failed to remove user session', {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export singleton instance
export const sessionValidationService = new SessionValidationService();

// Export validation function for middleware
export async function validateSession(sessionId: string, userId: string): Promise<boolean> {
  return sessionValidationService.validateSession(sessionId, userId);
}
