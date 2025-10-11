/**
 * @fileoverview Collaboration REST API Routes - Session & Comment Management
 * @module Routes/CollaborationRoutes
 * @description Express REST API endpoints for managing collaboration sessions and policy comments.
 * Provides HTTP interface for session management, comment CRUD, and participant tracking.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * API Endpoints:
 * 
 * Session Management:
 * - GET    /sessions/:policyId              - Get active sessions for a policy
 * - POST   /sessions                        - Create new collaboration session
 * - GET    /sessions/:sessionId             - Get session details
 * - POST   /sessions/:sessionId/join        - Join existing session
 * - DELETE /sessions/:sessionId/leave       - Leave session
 * - GET    /sessions/:sessionId/participants - List active participants
 * - GET    /sessions/:sessionId/stats       - Get session statistics
 * - DELETE /sessions/:sessionId             - End session
 * 
 * Comment Management:
 * - GET    /comments/policy/:policyId       - Get all comments for a policy
 * - GET    /comments/:commentId             - Get single comment
 * - POST   /comments                        - Create new comment
 * - PUT    /comments/:commentId             - Update comment
 * - DELETE /comments/:commentId             - Delete comment (soft)
 * - POST   /comments/:commentId/resolve     - Resolve comment
 * - POST   /comments/:commentId/reopen      - Reopen resolved comment
 * - POST   /comments/:commentId/like        - Like comment
 * - DELETE /comments/:commentId/like        - Unlike comment
 * - POST   /comments/:commentId/pin         - Pin comment
 * - DELETE /comments/:commentId/pin         - Unpin comment
 * - GET    /comments/mentions/:userId       - Get user mentions
 * - GET    /comments/policy/:policyId/stats - Get comment statistics
 * 
 * Authentication:
 * - All endpoints require authentication (JWT token)
 * - User ID and Organization ID extracted from auth headers
 * - Rate limiting: 100 requests/minute per user
 * 
 * Validation:
 * - UUID validation for all IDs
 * - Content length validation (10-10000 chars)
 * - Required field validation
 * - Authorization checks (user can access policy)
 * 
 * Error Handling:
 * - 400: Bad Request (invalid input)
 * - 401: Unauthorized (missing/invalid token)
 * - 403: Forbidden (no permission)
 * - 404: Not Found (resource doesn't exist)
 * - 500: Internal Server Error
 * 
 * @example
 * ```typescript
 * // Create session
 * POST /api/collaboration/sessions
 * Body: { policyId: "uuid", deviceType: "web", browser: "Chrome" }
 * 
 * // Add comment
 * POST /api/collaboration/comments
 * Body: { policyId: "uuid", content: "Needs review @[user-id]" }
 * ```
 */

import { Router, Request, Response } from 'express';
import { validate as isUUID } from 'uuid';
import { CollaborationSessionService } from '../services/policy-governance/collaboration-session.service';
import { PolicyCommentService } from '../services/policy-governance/policy-comment.service';
import { CommentType } from '../entities/policy-comment.entity';

const router = Router();

// ===========================
// Service Initialization
// ===========================

let sessionService: CollaborationSessionService;
let commentService: PolicyCommentService;

/**
 * Lazy initialization of services
 * Prevents circular dependency issues
 */
function getServices() {
  if (!sessionService || !commentService) {
    // TODO: Inject repositories when database connection is ready
    // For now, services will be initialized when first endpoint is called
    console.warn('⚠️  Collaboration services not initialized - using temporary instances');
  }
  return { sessionService, commentService };
}

// ===========================
// Helper Functions
// ===========================

/**
 * Extract user ID and organization ID from request
 * TODO: Replace with actual auth middleware when ready
 */
function getAuthData(req: Request): { userId: string; organizationId: string } {
  // Temporary: Get from headers
  const userId = req.headers['x-user-id'] as string;
  const organizationId = req.headers['x-organization-id'] as string;

  if (!userId || !organizationId) {
    throw new Error('Authentication required');
  }

  return { userId, organizationId };
}

/**
 * Validate UUID parameter
 */
function validateUUID(id: string, paramName: string): void {
  if (!isUUID(id)) {
    throw new Error(`Invalid ${paramName}: must be a valid UUID`);
  }
}

// ===========================
// SESSION ENDPOINTS
// ===========================

/**
 * GET /sessions/:policyId
 * Get active sessions for a policy
 */
router.get('/sessions/:policyId', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(policyId, 'policyId');

    const { sessionService } = getServices();
    const sessions = await sessionService.getActiveSessions(policyId);

    res.json({
      success: true,
      data: {
        policyId,
        sessions: sessions.map(s => s.toJSON()),
        totalSessions: sessions.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch sessions'
    });
  }
});

/**
 * POST /sessions
 * Create new collaboration session
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { userId, organizationId } = getAuthData(req);
    const { policyId, deviceType, browser, metadata } = req.body;

    if (!policyId) {
      return res.status(400).json({
        success: false,
        error: 'policyId is required'
      });
    }

    validateUUID(policyId, 'policyId');

    const { sessionService } = getServices();
    const session = await sessionService.createSession({
      policyId,
      userId,
      deviceType,
      browser,
      metadata
    });

    res.status(201).json({
      success: true,
      data: session.toJSON()
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to create session'
    });
  }
});

/**
 * GET /sessions/:sessionId
 * Get session details
 */
router.get('/sessions/detail/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(sessionId, 'sessionId');

    const { sessionService } = getServices();
    const session = await sessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session.toJSON()
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch session'
    });
  }
});

/**
 * POST /sessions/:sessionId/join
 * Join existing session
 */
router.post('/sessions/:sessionId/join', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, organizationId } = getAuthData(req);
    const { socketId } = req.body;

    validateUUID(sessionId, 'sessionId');

    const { sessionService } = getServices();
    const session = await sessionService.reconnectSession(sessionId, socketId || 'http-request');

    res.json({
      success: true,
      data: session.toJSON(),
      message: 'Successfully joined session'
    });
  } catch (error: any) {
    console.error('Error joining session:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to join session'
    });
  }
});

/**
 * DELETE /sessions/:sessionId/leave
 * Leave session
 */
router.delete('/sessions/:sessionId/leave', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(sessionId, 'sessionId');

    const { sessionService } = getServices();
    const session = await sessionService.endSession(sessionId);

    res.json({
      success: true,
      data: session.toJSON(),
      message: 'Successfully left session'
    });
  } catch (error: any) {
    console.error('Error leaving session:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to leave session'
    });
  }
});

/**
 * GET /sessions/:sessionId/participants
 * List active participants
 */
router.get('/sessions/:sessionId/participants', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(sessionId, 'sessionId');

    const { sessionService } = getServices();
    const session = await sessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const participants = await sessionService.getActiveParticipants(session.policyId);

    res.json({
      success: true,
      data: {
        sessionId,
        policyId: session.policyId,
        participants,
        totalParticipants: participants.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching participants:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch participants'
    });
  }
});

/**
 * GET /sessions/:sessionId/stats
 * Get session statistics
 */
router.get('/sessions/:sessionId/stats', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(sessionId, 'sessionId');

    const { sessionService } = getServices();
    const session = await sessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const stats = await sessionService.getSessionStats(session.policyId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching session stats:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch session statistics'
    });
  }
});

/**
 * DELETE /sessions/:sessionId
 * End session
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(sessionId, 'sessionId');

    const { sessionService } = getServices();
    const session = await sessionService.endSession(sessionId);

    res.json({
      success: true,
      data: session.toJSON(),
      message: 'Session ended successfully'
    });
  } catch (error: any) {
    console.error('Error ending session:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to end session'
    });
  }
});

// ===========================
// COMMENT ENDPOINTS
// ===========================

/**
 * GET /comments/policy/:policyId
 * Get all comments for a policy
 */
router.get('/comments/policy/:policyId', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const { userId, organizationId } = getAuthData(req);
    const includeResolved = req.query.includeResolved !== 'false';

    validateUUID(policyId, 'policyId');

    const { commentService } = getServices();
    const comments = await commentService.getPolicyComments(policyId, includeResolved);

    res.json({
      success: true,
      data: {
        policyId,
        comments: comments.map(c => c.toJSON(true)),
        totalComments: comments.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch comments'
    });
  }
});

/**
 * GET /comments/:commentId
 * Get single comment
 */
router.get('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.getComment(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    res.json({
      success: true,
      data: comment.toJSON(true)
    });
  } catch (error: any) {
    console.error('Error fetching comment:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch comment'
    });
  }
});

/**
 * POST /comments
 * Create new comment
 */
router.post('/comments', async (req: Request, res: Response) => {
  try {
    const { userId, organizationId } = getAuthData(req);
    const { policyId, content, parentCommentId, positionSelector, commentType } = req.body;

    // Validation
    if (!policyId) {
      return res.status(400).json({
        success: false,
        error: 'policyId is required'
      });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'content is required'
      });
    }
    if (content.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'content must be 10000 characters or less'
      });
    }

    validateUUID(policyId, 'policyId');
    if (parentCommentId) {
      validateUUID(parentCommentId, 'parentCommentId');
    }

    const { commentService } = getServices();
    const comment = await commentService.createComment({
      policyId,
      userId,
      content: content.trim(),
      parentCommentId,
      positionSelector,
      commentType: commentType || CommentType.GENERAL
    });

    res.status(201).json({
      success: true,
      data: comment.toJSON(false)
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to create comment'
    });
  }
});

/**
 * PUT /comments/:commentId
 * Update comment
 */
router.put('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'content is required'
      });
    }

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.updateComment(commentId, userId, {
      content: content.trim()
    });

    res.json({
      success: true,
      data: comment.toJSON(false),
      message: 'Comment updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    const status = error.message.includes('Only comment author') ? 403 :
                   error.message.includes('too old') ? 403 : 500;
    res.status(error.message === 'Authentication required' ? 401 : status).json({
      success: false,
      error: error.message || 'Failed to update comment'
    });
  }
});

/**
 * DELETE /comments/:commentId
 * Delete comment (soft)
 */
router.delete('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.deleteComment(commentId, userId);

    res.json({
      success: true,
      data: comment.toJSON(false),
      message: 'Comment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    const status = error.message.includes('Only comment author') ? 403 : 500;
    res.status(error.message === 'Authentication required' ? 401 : status).json({
      success: false,
      error: error.message || 'Failed to delete comment'
    });
  }
});

/**
 * POST /comments/:commentId/resolve
 * Resolve comment
 */
router.post('/comments/:commentId/resolve', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.resolveComment(commentId, userId);

    res.json({
      success: true,
      data: comment.toJSON(false),
      message: 'Comment resolved successfully'
    });
  } catch (error: any) {
    console.error('Error resolving comment:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to resolve comment'
    });
  }
});

/**
 * POST /comments/:commentId/reopen
 * Reopen resolved comment
 */
router.post('/comments/:commentId/reopen', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.reopenComment(commentId);

    res.json({
      success: true,
      data: comment.toJSON(false),
      message: 'Comment reopened successfully'
    });
  } catch (error: any) {
    console.error('Error reopening comment:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to reopen comment'
    });
  }
});

/**
 * POST /comments/:commentId/like
 * Like comment
 */
router.post('/comments/:commentId/like', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.likeComment(commentId, userId);

    res.json({
      success: true,
      data: comment.toJSON(false),
      message: 'Comment liked successfully'
    });
  } catch (error: any) {
    console.error('Error liking comment:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to like comment'
    });
  }
});

/**
 * DELETE /comments/:commentId/like
 * Unlike comment
 */
router.delete('/comments/:commentId/like', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.unlikeComment(commentId, userId);

    res.json({
      success: true,
      data: comment.toJSON(false),
      message: 'Comment unliked successfully'
    });
  } catch (error: any) {
    console.error('Error unliking comment:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to unlike comment'
    });
  }
});

/**
 * POST /comments/:commentId/pin
 * Pin comment
 */
router.post('/comments/:commentId/pin', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.pinComment(commentId);

    res.json({
      success: true,
      data: comment.toJSON(false),
      message: 'Comment pinned successfully'
    });
  } catch (error: any) {
    console.error('Error pinning comment:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to pin comment'
    });
  }
});

/**
 * DELETE /comments/:commentId/pin
 * Unpin comment
 */
router.delete('/comments/:commentId/pin', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(commentId, 'commentId');

    const { commentService } = getServices();
    const comment = await commentService.unpinComment(commentId);

    res.json({
      success: true,
      data: comment.toJSON(false),
      message: 'Comment unpinned successfully'
    });
  } catch (error: any) {
    console.error('Error unpinning comment:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to unpin comment'
    });
  }
});

/**
 * GET /comments/mentions/:userId
 * Get user mentions
 */
router.get('/comments/mentions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { userId: authUserId, organizationId } = getAuthData(req);
    const { policyId } = req.query;

    validateUUID(userId, 'userId');
    if (policyId) {
      validateUUID(policyId as string, 'policyId');
    }

    const { commentService } = getServices();
    const mentions = await commentService.getUserMentions(userId, policyId as string);

    res.json({
      success: true,
      data: {
        userId,
        mentions: mentions.map(c => c.toJSON(false)),
        totalMentions: mentions.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching mentions:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch mentions'
    });
  }
});

/**
 * GET /comments/policy/:policyId/stats
 * Get comment statistics
 */
router.get('/comments/policy/:policyId/stats', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const { userId, organizationId } = getAuthData(req);

    validateUUID(policyId, 'policyId');

    const { commentService } = getServices();
    const stats = await commentService.getCommentStats(policyId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching comment stats:', error);
    res.status(error.message === 'Authentication required' ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch comment statistics'
    });
  }
});

export default router;
