import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview AI Agent WebSocket Service
 * @module AIAgentWebSocketService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description WebSocket service for real-time AI agent conversations with tenant isolation
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AIAgentSessionService } from './AIAgentSessionService';
import { PublicCustomerSupportAIService } from './PublicCustomerSupportAIService';
import { TenantCareAssistantAIService } from './TenantCareAssistantAIService';

export interface SocketSession {
  socketId: string;
  sessionId: string;
  agentType: 'PUBLIC' | 'TENANT';
  tenantId?: string;
  userId?: string;
  userRole?: string;
  authenticated: boolean;
  lastActivity: Date;
  messageCount: number;
  rateLimitTokens: number;
  securityViolations: number;
}

export interface WebSocketMessage {
  messageId: string;
  sessionId: string;
  type: 'USER_MESSAGE' | 'AGENT_RESPONSE' | 'SYSTEM_MESSAGE' | 'TYPING_INDICATOR';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface RealTimeResponse {
  responseId: string;
  content: string;
  confidence: number;
  typing: boolean;
  complete: boolean;
  chunks?: string[];
  metadata?: any;
}

export class AIAgentWebSocketService {
  // Logger removed
  private io: SocketIOServer;
  private activeSessions: Map<string, SocketSession> = new Map();
  private sessionService: AIAgentSessionService;
  private publicAIService: PublicCustomerSupportAIService;
  private tenantAIService: TenantCareAssistantAIService;
  private rateLimitWindow = 60000; // 1 minute
  private maxMessagesPerWindow = 20;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.sessionService = new AIAgentSessionService();
    this.publicAIService = new PublicCustomerSupportAIService();
    this.tenantAIService = new TenantCareAssistantAIService();
    this.setupSocketHandlers();
    this.startCleanupScheduler();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('WebSocket connection established', {
        socketId: socket.id,
        ip: socket.handshake.address
      });

      // Authentication middleware
      socket.use(async (packet, next) => {
        try {
          await this.authenticateSocket(socket, packet);
          next();
        } catch (error: unknown) {
          console.warn('Socket authentication failed', {
            socketId: socket.id,
            error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
          });
          next(new Error('Authentication failed'));
        }
      });

      // Rate limiting middleware
      socket.use(async (packet, next) => {
        try {
          await this.enforceRateLimit(socket);
          next();
        } catch (error: unknown) {
          console.warn('Socket rate limit exceeded', {
            socketId: socket.id,
            error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
          });
          next(new Error('Rate limit exceeded'));
        }
      });

      // Event handlers
      socket.on('join_ai_session', (data) => this.handleJoinSession(socket, data));
      socket.on('send_message', (data) => this.handleSendMessage(socket, data));
      socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
      socket.on('leave_ai_session', (data) => this.handleLeaveSession(socket, data));
      socket.on('disconnect', (reason) => this.handleDisconnect(socket, reason));

      // Error handling
      socket.on('error', (error) => {
        console.error('Socket error', {
          socketId: socket.id,
          error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
        });
      });
    });

    console.log('WebSocket handlers configured for AI agents');
  }

  /**
   * Authenticate WebSocket connection
   */
  private async authenticateSocket(socket: Socket, packet: any): Promise<void> {
    const sessionData = this.activeSessions.get(socket.id);
    
    // Skip authentication for initial connection
    if (!sessionData && packet[0] === 'join_ai_session') {
      return;
    }

    // Require authentication for tenant operations
    if (sessionData?.agentType === 'TENANT' && !sessionData.authenticated) {
      throw new Error('Tenant agent requires authentication');
    }
  }

  /**
   * Enforce rate limiting per socket
   */
  private async enforceRateLimit(socket: Socket): Promise<void> {
    const sessionData = this.activeSessions.get(socket.id);
    if (!sessionData) return;

    const now = Date.now();
    const windowStart = now - this.rateLimitWindow;

    // Reset tokens if window has passed
    if (sessionData.lastActivity.getTime() < windowStart) {
      sessionData.rateLimitTokens = this.maxMessagesPerWindow;
      sessionData.lastActivity = new Date();
    }

    // Check if tokens available
    if (sessionData.rateLimitTokens <= 0) {
      throw new Error('Rate limit exceeded');
    }

    // Consume token
    sessionData.rateLimitTokens -= 1;
    sessionData.messageCount += 1;
  }

  /**
   * Handle join AI session
   */
  private async handleJoinSession(socket: Socket, data: {
    agentType: 'PUBLIC' | 'TENANT';
    token?: string;
    tenantId?: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      let authenticated = false;
      let userId: string | undefined;
      let userRole: string | undefined;
      let tenantId: string | undefined;

      // Authenticate for tenant sessions
      if (data.agentType === 'TENANT') {
        if (!data.token) {
          socket.emit('error', { message: 'Authentication token required for tenant agent' });
          return;
        }

        try {

          const decoded = jwt.verify(data.token, process.env['JWT_SECRET']!) as any;

          userId = decoded.userId;
          userRole = decoded.roles?.[0];
          tenantId = decoded.tenantId;
          authenticated = true;

          // Validate tenant ID matches
          if (data.tenantId && data.tenantId !== tenantId) {
            socket.emit('error', { message: 'Tenant ID mismatch' });
            return;
          }

        } catch (error: unknown) {
          socket.emit('error', { message: 'Invalid authentication token' });
          return;
        }
      } else {
        // Public sessions don't require authentication
        authenticated = true;
      }

      // Create or retrieve session
      let sessionId = data.sessionId;
      if (!sessionId) {
        const session = await this.sessionService.createSession(
          data.agentType,
          tenantId,
          userId,
          userRole
        );
        sessionId = session.id;
      }

      // Create socket session
      const socketSession: SocketSession = {
        socketId: socket.id,
        sessionId,
        agentType: data.agentType,
        tenantId,
        userId,
        userRole,
        authenticated,
        lastActivity: new Date(),
        messageCount: 0,
        rateLimitTokens: this.maxMessagesPerWindow,
        securityViolations: 0
      };

      this.activeSessions.set(socket.id, socketSession);

      // Join socket room for session isolation
      const roomName = this.getSessionRoomName(sessionId, tenantId);
      socket.join(roomName);

      socket.emit('session_joined', {
        sessionId,
        agentType: data.agentType,
        tenantId,
        authenticated
      });

      console.log('AI agent session joined', {
        socketId: socket.id,
        sessionId,
        agentType: data.agentType,
        tenantId,
        authenticated
      });

    } catch (error: unknown) {
      console.error('Failed to join AI session', {
        socketId: socket.id,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      
      socket.emit('error', { 
        message: 'Failed to join AI session',
        code: 'SESSION_JOIN_ERROR'
      });
    }
  }

  /**
   * Handle send message
   */
  private async handleSendMessage(socket: Socket, data: {
    message: string;
    inquiryType?: string;
    residentId?: string;
    careContext?: any;
    urgencyLevel?: string;
  }): Promise<void> {
    const sessionData = this.activeSessions.get(socket.id);
    if (!sessionData) {
      socket.emit('error', { message: 'No active session' });
      return;
    }

    try {
      // Validate message
      if (!data.message || data.message.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      // Security validation
      await this.validateMessageSecurity(data.message, sessionData);

      // Show typing indicator
      socket.to(this.getSessionRoomName(sessionData.sessionId, sessionData.tenantId))
        .emit('agent_typing', { sessionId: sessionData.sessionId, typing: true });

      // Process message based on agent type
      let response: any;
      
      if (sessionData.agentType === 'PUBLIC') {
        response = await this.processPublicMessage(data, sessionData);
      } else {
        response = await this.processTenantMessage(data, sessionData);
      }

      // Stop typing indicator
      socket.to(this.getSessionRoomName(sessionData.sessionId, sessionData.tenantId))
        .emit('agent_typing', { sessionId: sessionData.sessionId, typing: false });

      // Send response
      socket.emit('agent_response', {
        messageId: response.responseId,
        sessionId: sessionData.sessionId,
        content: response.message,
        confidence: response.confidence,
        timestamp: new Date(),
        suggestedActions: response.suggestedActions,
        careRecommendations: response.careRecommendations,
        complianceAlerts: response.complianceAlerts,
        escalationRequired: response.escalationRequired
      });

      // Update session
      await this.sessionService.updateSessionConversation(
        sessionData.sessionId,
        data.message,
        response.message,
        response.confidence,
        response.responseTime
      );

      sessionData.lastActivity = new Date();

    } catch (error: unknown) {
      console.error('Failed to process WebSocket message', {
        socketId: socket.id,
        sessionId: sessionData.sessionId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });

      socket.emit('error', {
        message: 'Failed to process message',
        code: 'MESSAGE_PROCESSING_ERROR'
      });
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingStart(socket: Socket, data: { sessionId: string }): void {
    const sessionData = this.activeSessions.get(socket.id);
    if (!sessionData) return;

    socket.to(this.getSessionRoomName(sessionData.sessionId, sessionData.tenantId))
      .emit('user_typing', { sessionId: data.sessionId, typing: true });
  }

  private handleTypingStop(socket: Socket, data: { sessionId: string }): void {
    const sessionData = this.activeSessions.get(socket.id);
    if (!sessionData) return;

    socket.to(this.getSessionRoomName(sessionData.sessionId, sessionData.tenantId))
      .emit('user_typing', { sessionId: data.sessionId, typing: false });
  }

  /**
   * Handle leave session
   */
  private async handleLeaveSession(socket: Socket, data: { sessionId: string }): Promise<void> {
    const sessionData = this.activeSessions.get(socket.id);
    if (!sessionData) return;

    try {
      // Leave socket room
      const roomName = this.getSessionRoomName(sessionData.sessionId, sessionData.tenantId);
      socket.leave(roomName);

      // Remove from active sessions
      this.activeSessions.delete(socket.id);

      socket.emit('session_left', { sessionId: data.sessionId });

      console.log('AI agent session left', {
        socketId: socket.id,
        sessionId: data.sessionId
      });

    } catch (error: unknown) {
      console.error('Failed to leave AI session', {
        socketId: socket.id,
        sessionId: data.sessionId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket, reason: string): void {
    const sessionData = this.activeSessions.get(socket.id);
    
    if (sessionData) {
      this.activeSessions.delete(socket.id);
      
      console.log('WebSocket disconnected', {
        socketId: socket.id,
        sessionId: sessionData.sessionId,
        reason,
        messageCount: sessionData.messageCount,
        sessionDuration: Date.now() - sessionData.lastActivity.getTime()
      });
    }
  }

  /**
   * Process public agent message
   */
  private async processPublicMessage(data: any, sessionData: SocketSession): Promise<any> {
    const inquiry = {
      sessionId: sessionData.sessionId,
      inquiryType: data.inquiryType || 'GENERAL',
      message: data.message,
      userContext: data.userContext,
      metadata: {
        ipAddress: 'websocket',
        userAgent: 'WebSocket Client',
        timestamp: new Date(),
        sessionDuration: Date.now() - sessionData.lastActivity.getTime()
      }
    };

    return await this.publicAIService.processCustomerInquiry(inquiry);
  }

  /**
   * Process tenant agent message
   */
  private async processTenantMessage(data: any, sessionData: SocketSession): Promise<any> {
    if (!sessionData.authenticated || !sessionData.tenantId || !sessionData.userId) {
      throw new Error('Tenant authentication required');
    }

    const inquiry = {
      sessionId: sessionData.sessionId,
      tenantId: sessionData.tenantId,
      userId: sessionData.userId,
      inquiryType: data.inquiryType || 'DOCUMENTATION',
      message: data.message,
      residentId: data.residentId,
      careContext: data.careContext,
      urgencyLevel: data.urgencyLevel || 'LOW',
      confidentialityLevel: data.residentId ? 'SENSITIVE' : 'STANDARD',
      metadata: {
        timestamp: new Date(),
        sessionDuration: Date.now() - sessionData.lastActivity.getTime(),
        userRole: sessionData.userRole || 'USER',
        accessLevel: 'STANDARD'
      }
    };

    return await this.tenantAIService.processTenantCareInquiry(inquiry);
  }

  /**
   * Validate message security
   */
  private async validateMessageSecurity(message: string, sessionData: SocketSession): Promise<void> {
    // Check for prompt injection
    const injectionPatterns = [
      /ignore\s+previous\s+instructions/i,
      /you\s+are\s+now/i,
      /system\s*:/i,
      /assistant\s*:/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(message)) {
        sessionData.securityViolations += 1;
        
        // Terminate session after multiple violations
        if (sessionData.securityViolations >= 3) {
          await this.terminateSocketSession(sessionData.socketId, 'SECURITY_VIOLATION');
        }
        
        throw new Error('Security violation detected');
      }
    }

    // Check for cross-tenant attempts (tenant sessions only)
    if (sessionData.agentType === 'TENANT') {
      const crossTenantPatterns = [
        /other\s+tenant/i,
        /different\s+organization/i,
        /switch\s+tenant/i
      ];

      for (const pattern of crossTenantPatterns) {
        if (pattern.test(message)) {
          sessionData.securityViolations += 1;
          await this.terminateSocketSession(sessionData.socketId, 'CROSS_TENANT_ATTEMPT');
          throw new Error('Cross-tenant access attempt detected');
        }
      }
    }
  }

  /**
   * Get session room name for socket isolation
   */
  private getSessionRoomName(sessionId: string, tenantId?: string): string {
    if (tenantId) {
      return `ai_session_tenant_${tenantId}_${sessionId}`;
    } else {
      return `ai_session_public_${sessionId}`;
    }
  }

  /**
   * Terminate socket session
   */
  private async terminateSocketSession(socketId: string, reason: string): Promise<void> {
    try {
      const sessionData = this.activeSessions.get(socketId);
      if (!sessionData) return;

      // Terminate the AI agent session
      await this.sessionService.terminateSession(sessionData.sessionId, reason);

      // Remove from active sessions
      this.activeSessions.delete(socketId);

      // Disconnect the socket
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('session_terminated', { 
          reason,
          message: 'Session terminated due to security violation' 
        });
        socket.disconnect(true);
      }

      console.warn('Socket session terminated', {
        socketId,
        sessionId: sessionData.sessionId,
        reason,
        securityViolations: sessionData.securityViolations
      });

    } catch (error: unknown) {
      console.error('Failed to terminate socket session', {
        socketId,
        reason,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Broadcast system message to session
   */
  async broadcastSystemMessage(
    sessionId: string,
    message: string,
    tenantId?: string
  ): Promise<void> {
    try {
      const roomName = this.getSessionRoomName(sessionId, tenantId);
      
      this.io.to(roomName).emit('system_message', {
        messageId: `system_${Date.now()}`,
        sessionId,
        content: message,
        timestamp: new Date(),
        type: 'SYSTEM_MESSAGE'
      });

    } catch (error: unknown) {
      console.error('Failed to broadcast system message', {
        sessionId,
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Broadcast emergency alert
   */
  async broadcastEmergencyAlert(
    tenantId: string,
    alert: {
      type: string;
      message: string;
      residentId?: string;
      urgency: 'HIGH' | 'CRITICAL';
    }
  ): Promise<void> {
    try {
      // Find all active tenant sessions
      const tenantSessions = Array.from(this.activeSessions.values())
        .filter(session => session.tenantId === tenantId && session.authenticated);

      for (const session of tenantSessions) {
        const socket = this.io.sockets.sockets.get(session.socketId);
        if (socket) {
          socket.emit('emergency_alert', {
            alertId: `emergency_${Date.now()}`,
            type: alert.type,
            message: alert.message,
            residentId: alert.residentId,
            urgency: alert.urgency,
            timestamp: new Date()
          });
        }
      }

      console.log('Emergency alert broadcasted', {
        tenantId,
        alertType: alert.type,
        sessionsNotified: tenantSessions.length
      });

    } catch (error: unknown) {
      console.error('Failed to broadcast emergency alert', {
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Get active session statistics
   */
  getActiveSessionStatistics(): {
    totalSessions: number;
    publicSessions: number;
    tenantSessions: number;
    sessionsByTenant: { [tenantId: string]: number };
    avgMessageCount: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const tenantSessionCounts: { [tenantId: string]: number } = {};

    sessions.forEach(session => {
      if (session.tenantId) {
        tenantSessionCounts[session.tenantId] = (tenantSessionCounts[session.tenantId] || 0) + 1;
      }
    });

    const avgMessageCount = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.messageCount, 0) / sessions.length 
      : 0;

    return {
      totalSessions: sessions.length,
      publicSessions: sessions.filter(s => s.agentType === 'PUBLIC').length,
      tenantSessions: sessions.filter(s => s.agentType === 'TENANT').length,
      sessionsByTenant: tenantSessionCounts,
      avgMessageCount
    };
  }

  /**
   * Cleanup inactive sessions
   */
  private startCleanupScheduler(): void {
    setInterval(async () => {
      await this.cleanupInactiveSessions();
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('WebSocket cleanup scheduler started');
  }

  /**
   * Cleanup inactive sessions
   */
  private async cleanupInactiveSessions(): Promise<void> {
    try {
      const now = Date.now();
      const inactivityThreshold = 30 * 60 * 1000; // 30 minutes
      const inactiveSessions: string[] = [];

      for (const [socketId, sessionData] of this.activeSessions) {
        const inactiveTime = now - sessionData.lastActivity.getTime();
        
        if (inactiveTime > inactivityThreshold) {
          inactiveSessions.push(socketId);
        }
      }

      for (const socketId of inactiveSessions) {
        await this.terminateSocketSession(socketId, 'INACTIVITY_TIMEOUT');
      }

      if (inactiveSessions.length > 0) {
        console.log('Inactive WebSocket sessions cleaned up', {
          cleanedCount: inactiveSessions.length
        });
      }

    } catch (error: unknown) {
      console.error('WebSocket session cleanup failed', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Handle tenant isolation emergency lockdown
   */
  async emergencyLockdownTenant(tenantId: string, reason: string): Promise<void> {
    try {
      // Find all sessions for the tenant
      const tenantSessions = Array.from(this.activeSessions.values())
        .filter(session => session.tenantId === tenantId);

      // Terminate all tenant sessions
      for (const session of tenantSessions) {
        await this.terminateSocketSession(session.socketId, `EMERGENCY_LOCKDOWN: ${reason}`);
      }

      console.warn('Emergency tenant lockdown completed', {
        tenantId,
        reason,
        terminatedSessions: tenantSessions.length
      });

    } catch (error: unknown) {
      console.error('Emergency tenant lockdown failed', {
        tenantId,
        reason,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Get WebSocket service health
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeSessions: number;
    avgResponseTime: number;
    errorRate: number;
    lastError?: string;
  } {
    const stats = this.getActiveSessionStatistics();
    
    return {
      status: stats.totalSessions > 0 ? 'healthy' : 'degraded',
      activeSessions: stats.totalSessions,
      avgResponseTime: 1200, // Placeholder - in production, track actual metrics
      errorRate: 0.01, // Placeholder - in production, track actual error rate
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      // Terminate all active sessions
      const sessionIds = Array.from(this.activeSessions.keys());
      for (const socketId of sessionIds) {
        await this.terminateSocketSession(socketId, 'SERVICE_SHUTDOWN');
      }

      console.log('AI agent WebSocket service cleanup completed');
    } catch (error: unknown) {
      console.error('WebSocket service cleanup failed', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }
}

export default AIAgentWebSocketService;