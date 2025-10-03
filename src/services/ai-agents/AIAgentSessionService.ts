import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview AI Agent Session Service with Redis
 * @module AIAgentSessionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Session management service for AI agents using Redis for performance and scalability
 */

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { AIAgentSession, SessionType, SessionStatus } from '../../entities/ai-agents/AIAgentSession';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface SessionConfig {
  ttlMinutes: number;
  maxSessionsPerUser: number;
  maxSessionsPerTenant: number;
  cleanupIntervalMinutes: number;
  encryptionRequired: boolean;
}

export interface SessionData {
  sessionId: string;
  sessionType: SessionType;
  tenantId?: string;
  userId?: string;
  conversationHistory: ConversationEntry[];
  userPreferences: any;
  securityContext: any;
  performanceMetrics: any;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

interface ConversationEntry {
  timestamp: Date;
  userMessage: string;
  agentResponse: string;
  confidence: number;
  responseTime: number;
}

export class AIAgentSessionService {
  // Logger removed
  private sessionRepository: Repository<AIAgentSession>;
  private redis: Redis;
  private config: SessionConfig;

  constructor() {
    this.sessionRepository = AppDataSource.getRepository(AIAgentSession);
    this.initializeRedis();
    this.initializeConfig();
    this.startCleanupScheduler();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    try {
      const redisConfig = {

        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        password: process.env['REDIS_PASSWORD'],
        db: parseInt(process.env['AI_AGENT_REDIS_DB'] || '2'),

        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keyPrefix: 'ai_agent:',
        family: 4
      };

      this.redis = new Redis(redisConfig);

      this.redis.on('connect', () => {
        console.log('Redis connected for AI agent sessions');
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error', {
          error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
        });
      });

    } catch (error: unknown) {
      console.error('Failed to initialize Redis', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Initialize session configuration
   */
  private initializeConfig(): void {
    this.config = {

      ttlMinutes: parseInt(process.env['AI_AGENT_SESSION_TTL_MINUTES'] || '30'),
      maxSessionsPerUser: parseInt(process.env['AI_AGENT_MAX_SESSIONS_PER_USER'] || '5'),
      maxSessionsPerTenant: parseInt(process.env['AI_AGENT_MAX_SESSIONS_PER_TENANT'] || '100'),
      cleanupIntervalMinutes: parseInt(process.env['AI_AGENT_CLEANUP_INTERVAL_MINUTES'] || '15'),
      encryptionRequired: process.env['AI_AGENT_ENCRYPTION_REQUIRED'] === 'true'

    };
  }

  /**
   * Create new AI agent session
   */
  async createSession(
    sessionType: SessionType,
    tenantId?: string,
    userId?: string,
    userRole?: string
  ): Promise<AIAgentSession> {
    try {
      // Validate session limits
      await this.validateSessionLimits(sessionType, tenantId, userId);

      // Generate session ID
      const sessionId = this.generateSessionId(sessionType);

      // Calculate expiry
      const expiresAt = new Date(Date.now() + (this.config.ttlMinutes * 60 * 1000));

      // Create session entity
      const session = this.sessionRepository.create({
        id: sessionId,
        sessionType,
        tenantId: tenantId || null,
        userId: userId || null,
        userRole: userRole || null,
        status: 'ACTIVE',
        sessionData: {
          conversationHistory: [],
          userPreferences: {},
          securityContext: {
            createdAt: new Date(),
            lastSecurityCheck: new Date()
          },
          performanceMetrics: {
            interactionCount: 0,
            totalResponseTime: 0,
            avgConfidence: 0
          }
        },
        expiresAt,
        isActive: true
      });

      // Save to database
      const savedSession = await this.sessionRepository.save(session);

      // Cache in Redis
      await this.cacheSession(savedSession);

      console.log('AI agent session created', {
        sessionId,
        sessionType,
        tenantId,
        userId,
        expiresAt
      });

      return savedSession;

    } catch (error: unknown) {
      console.error('Failed to create AI agent session', {
        sessionType,
        tenantId,
        userId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<AIAgentSession | null> {
    try {
      // Try Redis cache first
      const cachedSession = await this.getCachedSession(sessionId);
      if (cachedSession) {
        return cachedSession;
      }

      // Fallback to database
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, isActive: true }
      });

      if (session && session.isValid()) {
        // Cache the session
        await this.cacheSession(session);
        return session;
      }

      return null;

    } catch (error: unknown) {
      console.error('Failed to get AI agent session', {
        sessionId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      return null;
    }
  }

  /**
   * Update session with new conversation entry
   */
  async updateSessionConversation(
    sessionId: string,
    userMessage: string,
    agentResponse: string,
    confidence: number,
    responseTime: number
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Add conversation entry
      const conversationEntry: ConversationEntry = {
        timestamp: new Date(),
        userMessage,
        agentResponse,
        confidence,
        responseTime
      };

      session.sessionData.conversationHistory = session.sessionData.conversationHistory || [];
      session.sessionData.conversationHistory.push(conversationEntry);

      // Update performance metrics
      session.sessionData.performanceMetrics.interactionCount += 1;
      session.sessionData.performanceMetrics.totalResponseTime += responseTime;
      session.sessionData.performanceMetrics.avgConfidence = 
        ((session.sessionData.performanceMetrics.avgConfidence * (session.sessionData.performanceMetrics.interactionCount - 1)) + confidence) / 
        session.sessionData.performanceMetrics.interactionCount;

      // Increment interaction count
      session.incrementInteractions();

      // Update in database
      await this.sessionRepository.save(session);

      // Update cache
      await this.cacheSession(session);

      console.log('Session conversation updated', {
        sessionId,
        interactionCount: session.interactionCount,
        avgConfidence: session.sessionData.performanceMetrics.avgConfidence
      });

    } catch (error: unknown) {
      console.error('Failed to update session conversation', {
        sessionId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Extend session expiry
   */
  async extendSession(sessionId: string, additionalMinutes: number = 30): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.extendSession(additionalMinutes);
      
      // Update in database
      await this.sessionRepository.save(session);

      // Update cache with new TTL
      await this.cacheSession(session);

      console.log('Session extended', {
        sessionId,
        newExpiryAt: session.expiresAt,
        additionalMinutes
      });

    } catch (error: unknown) {
      console.error('Failed to extend session', {
        sessionId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string, reason: string = 'USER_LOGOUT'): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return; // Session already terminated or doesn't exist
      }

      session.terminate();
      
      // Update in database
      await this.sessionRepository.save(session);

      // Remove from cache
      await this.removeCachedSession(sessionId);

      console.log('Session terminated', {
        sessionId,
        reason,
        sessionDuration: session.getSessionDuration()
      });

    } catch (error: unknown) {
      console.error('Failed to terminate session', {
        sessionId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Get active sessions for tenant
   */
  async getActiveSessionsForTenant(tenantId: string): Promise<AIAgentSession[]> {
    try {
      const sessions = await this.sessionRepository.find({
        where: {
          tenantId,
          isActive: true,
          status: 'ACTIVE'
        },
        order: {
          createdAt: 'DESC'
        }
      });

      return sessions.filter(session => session.isValid());

    } catch (error: unknown) {
      console.error('Failed to get active sessions for tenant', {
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      return [];
    }
  }

  /**
   * Cache session in Redis
   */
  private async cacheSession(session: AIAgentSession): Promise<void> {
    try {
      const cacheKey = `session:${session.id}`;
      const sessionData = JSON.stringify(session);
      const ttlSeconds = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);

      if (ttlSeconds > 0) {
        await this.redis.setex(cacheKey, ttlSeconds, sessionData);
      }

    } catch (error: unknown) {
      console.error('Failed to cache session', {
        sessionId: session.id,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Get cached session from Redis
   */
  private async getCachedSession(sessionId: string): Promise<AIAgentSession | null> {
    try {
      const cacheKey = `session:${sessionId}`;
      const cachedData = await this.redis.get(cacheKey);

      if (cachedData) {
        const sessionData = JSON.parse(cachedData);
        const session = this.sessionRepository.create(sessionData);
        
        // Validate session is still valid
        if (session.isValid()) {
          return session;
        } else {
          // Remove invalid session from cache
          await this.redis.del(cacheKey);
        }
      }

      return null;

    } catch (error: unknown) {
      console.error('Failed to get cached session', {
        sessionId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      return null;
    }
  }

  /**
   * Remove cached session
   */
  private async removeCachedSession(sessionId: string): Promise<void> {
    try {
      const cacheKey = `session:${sessionId}`;
      await this.redis.del(cacheKey);
    } catch (error: unknown) {
      console.error('Failed to remove cached session', {
        sessionId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Validate session limits
   */
  private async validateSessionLimits(
    sessionType: SessionType,
    tenantId?: string,
    userId?: string
  ): Promise<void> {
    if (sessionType === 'TENANT' && tenantId) {
      // Check tenant session limit
      const tenantSessionCount = await this.sessionRepository.count({
        where: {
          tenantId,
          isActive: true,
          status: 'ACTIVE'
        }
      });

      if (tenantSessionCount >= this.config.maxSessionsPerTenant) {
        throw new Error('Maximum sessions per tenant exceeded');
      }
    }

    if (userId) {
      // Check user session limit
      const userSessionCount = await this.sessionRepository.count({
        where: {
          userId,
          isActive: true,
          status: 'ACTIVE'
        }
      });

      if (userSessionCount >= this.config.maxSessionsPerUser) {
        throw new Error('Maximum sessions per user exceeded');
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(sessionType: SessionType): string {
    const prefix = sessionType === 'PUBLIC' ? 'pub' : 'tenant';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}_session_${timestamp}_${random}`;
  }

  /**
   * Start cleanup scheduler for expired sessions
   */
  private startCleanupScheduler(): void {
    setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, this.config.cleanupIntervalMinutes * 60 * 1000);

    console.log('Session cleanup scheduler started', {
      intervalMinutes: this.config.cleanupIntervalMinutes
    });
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const expiredSessions = await this.sessionRepository.find({
        where: {
          isActive: true
        }
      });

      const expiredSessionIds: string[] = [];
      const now = new Date();

      for (const session of expiredSessions) {
        if (session.expiresAt <= now) {
          session.status = 'EXPIRED';
          session.isActive = false;
          expiredSessionIds.push(session.id);
        }
      }

      if (expiredSessionIds.length > 0) {
        // Update database
        await this.sessionRepository.save(expiredSessions.filter(s => !s.isActive));

        // Remove from cache
        const cacheKeys = expiredSessionIds.map(id => `session:${id}`);
        if (cacheKeys.length > 0) {
          await this.redis.del(...cacheKeys);
        }

        console.log('Expired sessions cleaned up', {
          expiredCount: expiredSessionIds.length
        });
      }

    } catch (error: unknown) {
      console.error('Session cleanup failed', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(tenantId?: string): Promise<{
    activeSessions: number;
    totalSessions: number;
    avgSessionDuration: number;
    avgInteractionsPerSession: number;
    topUserRoles: { role: string; count: number }[];
  }> {
    try {
      const whereConditions: any = {};
      if (tenantId) {
        whereConditions.tenantId = tenantId;
      }

      const activeSessions = await this.sessionRepository.count({
        where: {
          ...whereConditions,
          isActive: true,
          status: 'ACTIVE'
        }
      });

      const totalSessions = await this.sessionRepository.count({
        where: whereConditions
      });

      // Calculate average session duration and interactions
      const sessions = await this.sessionRepository.find({
        where: whereConditions,
        take: 1000 // Sample for statistics
      });

      const avgSessionDuration = sessions.reduce((sum, session) => 
        sum + session.getSessionDuration(), 0
      ) / sessions.length;

      const avgInteractionsPerSession = sessions.reduce((sum, session) => 
        sum + session.interactionCount, 0
      ) / sessions.length;

      // Get top user roles
      const roleStats = new Map<string, number>();
      sessions.forEach(session => {
        if (session.userRole) {
          roleStats.set(session.userRole, (roleStats.get(session.userRole) || 0) + 1);
        }
      });

      const topUserRoles = Array.from(roleStats.entries())
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        activeSessions,
        totalSessions,
        avgSessionDuration,
        avgInteractionsPerSession,
        topUserRoles
      };

    } catch (error: unknown) {
      console.error('Failed to get session statistics', {
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });

      return {
        activeSessions: 0,
        totalSessions: 0,
        avgSessionDuration: 0,
        avgInteractionsPerSession: 0,
        topUserRoles: []
      };
    }
  }

  /**
   * Bulk terminate sessions for security incident
   */
  async bulkTerminateSessions(criteria: {
    tenantId?: string;
    userId?: string;
    ipAddress?: string;
    reason: string;
  }): Promise<number> {
    try {
      const whereConditions: any = {
        isActive: true,
        status: 'ACTIVE'
      };

      if (criteria.tenantId) {
        whereConditions.tenantId = criteria.tenantId;
      }

      if (criteria.userId) {
        whereConditions.userId = criteria.userId;
      }

      if (criteria.ipAddress) {
        whereConditions.ipAddress = criteria.ipAddress;
      }

      const sessions = await this.sessionRepository.find({
        where: whereConditions
      });

      // Terminate all matching sessions
      const terminatedSessions = sessions.map(session => {
        session.terminate();
        return session;
      });

      // Update database
      await this.sessionRepository.save(terminatedSessions);

      // Remove from cache
      const cacheKeys = sessions.map(session => `session:${session.id}`);
      if (cacheKeys.length > 0) {
        await this.redis.del(...cacheKeys);
      }

      console.warn('Bulk session termination completed', {
        criteria,
        terminatedCount: terminatedSessions.length
      });

      return terminatedSessions.length;

    } catch (error: unknown) {
      console.error('Bulk session termination failed', {
        criteria,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      return 0;
    }
  }

  /**
   * Get session health status
   */
  async getSessionHealthStatus(): Promise<{
    redisConnected: boolean;
    databaseConnected: boolean;
    activeSessionsCount: number;
    cacheHitRate: number;
    avgResponseTime: number;
  }> {
    try {
      // Check Redis connection
      const redisConnected = this.redis.status === 'ready';

      // Check database connection
      const databaseConnected = AppDataSource.isInitialized;

      // Get active sessions count
      const activeSessionsCount = await this.sessionRepository.count({
        where: {
          isActive: true,
          status: 'ACTIVE'
        }
      });

      // Calculate cache hit rate (simplified)
      const cacheHitRate = 0.85; // In production, track actual hit rate

      // Calculate average response time (simplified)
      const avgResponseTime = 1200; // In production, calculate from actual metrics

      return {
        redisConnected,
        databaseConnected,
        activeSessionsCount,
        cacheHitRate,
        avgResponseTime
      };

    } catch (error: unknown) {
      console.error('Failed to get session health status', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });

      return {
        redisConnected: false,
        databaseConnected: false,
        activeSessionsCount: 0,
        cacheHitRate: 0,
        avgResponseTime: 0
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      console.log('AI agent session service cleanup completed');
    } catch (error: unknown) {
      console.error('Session service cleanup failed', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }
}

export default AIAgentSessionService;