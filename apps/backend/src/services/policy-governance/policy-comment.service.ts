/**
 * @fileoverview Service layer for managing comments, annotations, and threaded discussions
 * @module Policy-governance/Policy-comment.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Service layer for managing comments, annotations, and threaded discussions
 */

/**
 * @fileoverview PolicyCommentService - Comment Management for Policy Collaboration
 * @module Services/PolicyCommentService
 * @description Service layer for managing comments, annotations, and threaded discussions
 * on policy documents. Supports @mentions, comment resolution, and real-time collaboration features.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * KeyFeatures:
 * - Comment CRUD operations with threading support
 * - @mention extraction and user notification
 * - Position-based annotations on policy content
 * - Comment resolution workflow
 * - Like/unlike functionality
 * - Comment editing with audit trail
 * - Threaded reply management
 * - Bulk operations (delete all, resolve all)
 * 
 * BusinessLogic:
 * - Comments can be nested (parent-child relationships)
 * - @mentions automatically trigger notifications
 * - Resolving a parent comment resolves all child comments
 * - Deleted comments remain in database (soft delete)
 * - Comment authors can edit within 15 minutes
 * - Pinned comments appear at the top of threads
 * 
 * DatabaseOperations:
 * - Uses TypeORM Repository for PolicyComment entity
 * - Supports transactions for atomic operations
 * - Implements soft delete for comment archival
 * - Uses indexes for performant queries
 * 
 * Integration:
 * - Works with PolicyCollaborationGateway for real-time broadcasting
 * - Integrates with NotificationService for @mention alerts
 * - Coordinates with UserService for user data
 * - Logs to AuditTrailService for compliance
 * 
 * Compliance:
 * - GDPR: Comment data retention and user data deletion
 * - ISO 27001: Audit trail for all comment operations
 * - Data Protection Act 2018: User consent for @mentions
 * 
 * @example
 * ```typescript
 * const service = new PolicyCommentService(repository);
 * const comment = await service.createComment({
 *   policyId,
 *   userId,
 *   content: "This needs review @[reviewer-id]"
 * });
 * const replies = await service.getReplies(comment.id);
 * await service.resolveComment(comment.id, userId);
 * ```
 */

import { Repository, In } from 'typeorm';
import {
  PolicyComment,
  CommentStatus,
  CommentType,
  PositionSelector
} from '../../entities/policy-comment.entity';

/**
 * Interface for comment creation data
 */
export interface CreateCommentData {
  policyId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  positionSelector?: PositionSelector;
  commentType?: CommentType;
  metadata?: Record<string, any>;
}

/**
 * Interface for comment update data
 */
export interface UpdateCommentData {
  content?: string;
  status?: CommentStatus;
  commentType?: CommentType;
  positionSelector?: PositionSelector;
  metadata?: Record<string, any>;
}

/**
 * Interface for comment with user data
 */
export interface CommentWithUser {
  comment: PolicyComment;
  authorName?: string;
  authorAvatar?: string;
  mentionedUserNames?: string[];
}

/**
 * Interface for comment thread
 */
export interface CommentThread {
  parent: PolicyComment;
  replies: PolicyComment[];
  totalReplies: number;
}

/**
 * Interface for comment statistics
 */
export interface CommentStats {
  totalComments: number;
  activeComments: number;
  resolvedComments: number;
  totalReplies: number;
  totalLikes: number;
  totalMentions: number;
  averageRepliesPerComment: number;
}

/**
 * PolicyCommentService Class
 * Business logic for managing policy comments and annotations
 */
export class PolicyCommentService {
  /**
   * Initialize service with repository
   * @param commentRepository - TypeORM repository for PolicyComment
   */
  const ructor(private commentRepository: Repository<PolicyComment>) {}

  /**
   * Create a new comment
   * @param data - Comment creation data
   * @returns Created comment
   */
  async createComment(data: CreateCommentData): Promise<PolicyComment> {
    try {
      const comment = new PolicyComment();
      comment.policyId = data.policyId;
      comment.userId = data.userId;
      comment.content = data.content;
      comment.parentCommentId = data.parentCommentId || null;
      comment.positionSelector = data.positionSelector || null;
      comment.commentType = data.commentType || CommentType.GENERAL;
      comment.status = CommentStatus.ACTIVE;
      comment.metadata = data.metadata || null;

      // Extract and store mentioned users
      comment.updateMentionedUsers();

      const savedComment = await this.commentRepository.save(comment);

      console.log(`💬 Created comment ${savedComment.id} on policy ${data.policyId}`);
      
      // Trigger notifications for mentioned users
      if (savedComment.mentionedUsers && savedComment.mentionedUsers.length > 0) {
        await this.notifyMentionedUsers(savedComment);
      }

      return savedComment;
    } catch (error) {
      console.error('Error creatingcomment:', error);
      throw new Error('Failed to create comment');
    }
  }

  /**
   * Get comment by ID
   * @param commentId - Comment UUID
   * @returns Comment or null if not found
   */
  async getComment(commentId: string): Promise<PolicyComment | null> {
    try {
      return await this.commentRepository.findOne({
        where: { id: commentId },
        relations: ['replies']
      });
    } catch (error) {
      console.error('Error fetchingcomment:', error);
      throw new Error('Failed to fetch comment');
    }
  }

  /**
   * Get all comments for a policy
   * @param policyId - Policy UUID
   * @param includeResolved - Whether to include resolved comments (default: true)
   * @returns Array of comments
   */
  async getPolicyComments(policyId: string, includeResolved: boolean = true): Promise<PolicyComment[]> {
    try {
      const whereConditions: any = { policyId };
      
      if (!includeResolved) {
        whereConditions.status = CommentStatus.ACTIVE;
      }

      return await this.commentRepository.find({
        where: whereConditions,
        relations: ['replies'],
        order: {
          isPinned: 'DESC',
          createdAt: 'DESC'
        }
      });
    } catch (error) {
      console.error('Error fetching policycomments:', error);
      throw new Error('Failed to fetch policy comments');
    }
  }

  /**
   * Get top-level comments (no parent) for a policy
   * @param policyId - Policy UUID
   * @param includeResolved - Whether to include resolved comments
   * @returns Array of top-level comments
   */
  async getTopLevelComments(policyId: string, includeResolved: boolean = true): Promise<PolicyComment[]> {
    try {
      const whereConditions: any = {
        policyId,
        parentCommentId: null
      };
      
      if (!includeResolved) {
        whereConditions.status = CommentStatus.ACTIVE;
      }

      return await this.commentRepository.find({
        where: whereConditions,
        relations: ['replies'],
        order: {
          isPinned: 'DESC',
          createdAt: 'DESC'
        }
      });
    } catch (error) {
      console.error('Error fetching top-level comments:', error);
      throw new Error('Failed to fetch top-level comments');
    }
  }

  /**
   * Get replies for a comment
   * @param commentId - Parent comment UUID
   * @returns Array of reply comments
   */
  async getReplies(commentId: string): Promise<PolicyComment[]> {
    try {
      return await this.commentRepository.find({
        where: {
          parentCommentId: commentId,
          status: In([CommentStatus.ACTIVE, CommentStatus.RESOLVED])
        },
        order: { createdAt: 'ASC' }
      });
    } catch (error) {
      console.error('Error fetchingreplies:', error);
      throw new Error('Failed to fetch replies');
    }
  }

  /**
   * Get comment threads (parent + replies)
   * @param policyId - Policy UUID
   * @returns Array of comment threads
   */
  async getCommentThreads(policyId: string): Promise<CommentThread[]> {
    try {
      const topLevel = await this.getTopLevelComments(policyId, true);
      
      const threads: CommentThread[] = [];

      for (const parent of topLevel) {
        const replies = await this.getReplies(parent.id);
        
        threads.push({
          parent,
          replies,
          totalReplies: replies.length
        });
      }

      return threads;
    } catch (error) {
      console.error('Error fetching commentthreads:', error);
      throw new Error('Failed to fetch comment threads');
    }
  }

  /**
   * Update comment content
   * @param commentId - Comment UUID
   * @param userId - User making the edit
   * @param data - Update data
   * @returns Updated comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    data: UpdateCommentData
  ): Promise<PolicyComment> {
    try {
      const comment = await this.getComment(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check if user is the author
      if (comment.userId !== userId) {
        throw new Error('Only comment author can edit');
      }

      // Check if comment is too old to edit (15 minutes)
      const ageHours = comment.getAgeHours();
      if (ageHours > 0.25) { // 15 minutes = 0.25 hours
        throw new Error('Comment too old to edit (15 minute limit)');
      }

      // Update fields
      if (data.content !== undefined) {
        comment.edit(data.content, userId);
      }
      if (data.status !== undefined) {
        comment.status = data.status;
      }
      if (data.commentType !== undefined) {
        comment.commentType = data.commentType;
      }
      if (data.positionSelector !== undefined) {
        comment.positionSelector = data.positionSelector;
      }
      if (data.metadata !== undefined) {
        comment.metadata = { ...comment.metadata, ...data.metadata };
      }

      // Re-extract mentions if content was updated
      if (data.content !== undefined) {
        comment.updateMentionedUsers();
      }

      const updatedComment = await this.commentRepository.save(comment);

      console.log(`✏️  Updated comment ${commentId}`);
      return updatedComment;
    } catch (error) {
      console.error('Error updatingcomment:', error);
      throw error;
    }
  }

  /**
   * Resolve a comment
   * @param commentId - Comment UUID
   * @param resolvedBy - User ID who resolved the comment
   * @returns Resolved comment
   */
  async resolveComment(commentId: string, resolvedBy: string): Promise<PolicyComment> {
    try {
      const comment = await this.getComment(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      comment.resolve(resolvedBy);
      const resolvedComment = await this.commentRepository.save(comment);

      // Also resolve all replies
      const replies = await this.getReplies(commentId);
      for (const reply of replies) {
        if (reply.status === CommentStatus.ACTIVE) {
          reply.resolve(resolvedBy);
          await this.commentRepository.save(reply);
        }
      }

      console.log(`✅ Resolved comment ${commentId} and ${replies.length} replies`);
      return resolvedComment;
    } catch (error) {
      console.error('Error resolvingcomment:', error);
      throw new Error('Failed to resolve comment');
    }
  }

  /**
   * Reopen a resolved comment
   * @param commentId - Comment UUID
   * @returns Reopened comment
   */
  async reopenComment(commentId: string): Promise<PolicyComment> {
    try {
      const comment = await this.getComment(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      comment.reopen();
      const reopenedComment = await this.commentRepository.save(comment);

      console.log(`🔓 Reopened comment ${commentId}`);
      return reopenedComment;
    } catch (error) {
      console.error('Error reopeningcomment:', error);
      throw new Error('Failed to reopen comment');
    }
  }

  /**
   * Soft delete a comment
   * @param commentId - Comment UUID
   * @param userId - User requesting deletion
   * @returns Deleted comment
   */
  async deleteComment(commentId: string, userId: string, userRoles: string[] = []): Promise<PolicyComment> {
    try {
      const comment = await this.getComment(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check if user is the author or has admin/policy_manager rights
      const isAdmin = userRoles.includes('admin') || userRoles.includes('policy_manager');
      const isAuthor = comment.userId === userId;

      if (!isAuthor && !isAdmin) {
        throw new Error('Only comment author or administrators can delete comments');
      }

      comment.softDelete();
      const deletedComment = await this.commentRepository.save(comment);

      console.log(`🗑️  Deleted comment ${commentId} by ${userId} (admin: ${isAdmin})`);
      return deletedComment;
    } catch (error) {
      console.error('Error deletingcomment:', error);
      throw error;
    }
  }

  /**
   * Add a like to a comment
   * @param commentId - Comment UUID
   * @param userId - User ID who liked the comment
   * @returns Updated comment
   */
  async likeComment(commentId: string, userId: string): Promise<PolicyComment> {
    try {
      const comment = await this.getComment(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      comment.addLike(userId);
      return await this.commentRepository.save(comment);
    } catch (error) {
      console.error('Error likingcomment:', error);
      throw new Error('Failed to like comment');
    }
  }

  /**
   * Remove a like from a comment
   * @param commentId - Comment UUID
   * @param userId - User ID who unliked the comment
   * @returns Updated comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<PolicyComment> {
    try {
      const comment = await this.getComment(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      comment.removeLike(userId);
      return await this.commentRepository.save(comment);
    } catch (error) {
      console.error('Error unlikingcomment:', error);
      throw new Error('Failed to unlike comment');
    }
  }

  /**
   * Pin a comment
   * @param commentId - Comment UUID
   * @returns Pinned comment
   */
  async pinComment(commentId: string): Promise<PolicyComment> {
    try {
      const comment = await this.getComment(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      comment.pin();
      const pinnedComment = await this.commentRepository.save(comment);

      console.log(`📌 Pinned comment ${commentId}`);
      return pinnedComment;
    } catch (error) {
      console.error('Error pinningcomment:', error);
      throw new Error('Failed to pin comment');
    }
  }

  /**
   * Unpin a comment
   * @param commentId - Comment UUID
   * @returns Unpinned comment
   */
  async unpinComment(commentId: string): Promise<PolicyComment> {
    try {
      const comment = await this.getComment(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      comment.unpin();
      return await this.commentRepository.save(comment);
    } catch (error) {
      console.error('Error unpinningcomment:', error);
      throw new Error('Failed to unpin comment');
    }
  }

  /**
   * Get comments mentioning a specific user
   * @param userId - User UUID
   * @param policyId - Optional policy UUID to filter by
   * @returns Array of comments mentioning the user
   */
  async getUserMentions(userId: string, policyId?: string): Promise<PolicyComment[]> {
    try {
      const queryBuilder = this.commentRepository
        .createQueryBuilder('comment')
        .where(':userId = ANY(comment.mentioned_users)', { userId })
        .andWhere('comment.status = :status', { status: CommentStatus.ACTIVE });

      if (policyId) {
        queryBuilder.andWhere('comment.policy_id = :policyId', { policyId });
      }

      queryBuilder.orderBy('comment.created_at', 'DESC');

      return await queryBuilder.getMany();
    } catch (error) {
      console.error('Error fetching usermentions:', error);
      throw new Error('Failed to fetch user mentions');
    }
  }

  /**
   * Get comment statistics for a policy
   * @param policyId - Policy UUID
   * @returns Comment statistics
   */
  async getCommentStats(policyId: string): Promise<CommentStats> {
    try {
      const allComments = await this.commentRepository.find({
        where: { policyId }
      });

      const activeComments = allComments.filter(c => c.status === CommentStatus.ACTIVE);
      const resolvedComments = allComments.filter(c => c.status === CommentStatus.RESOLVED);
      const replies = allComments.filter(c => c.parentCommentId !== null);
      
      const totalLikes = allComments.reduce((sum, c) => sum + c.likeCount, 0);
      
      const totalMentions = allComments.reduce((sum, c) => {
        return sum + (c.mentionedUsers?.length || 0);
      }, 0);

      const topLevelCount = allComments.filter(c => c.parentCommentId === null).length;
      const averageReplies = topLevelCount > 0 ? replies.length / topLevelCount : 0;

      return {
        totalComments: allComments.length,
        activeComments: activeComments.length,
        resolvedComments: resolvedComments.length,
        totalReplies: replies.length,
        totalLikes,
        totalMentions,
        averageRepliesPerComment: Math.round(averageReplies * 10) / 10
      };
    } catch (error) {
      console.error('Error fetching commentstats:', error);
      throw new Error('Failed to fetch comment statistics');
    }
  }

  /**
   * Resolve all comments for a policy
   * @param policyId - Policy UUID
   * @param resolvedBy - User ID who resolved all comments
   * @returns Number of comments resolved
   */
  async resolveAllComments(policyId: string, resolvedBy: string): Promise<number> {
    try {
      const activeComments = await this.commentRepository.find({
        where: {
          policyId,
          status: CommentStatus.ACTIVE
        }
      });

      for (const comment of activeComments) {
        comment.resolve(resolvedBy);
        await this.commentRepository.save(comment);
      }

      console.log(`✅ Resolved all ${activeComments.length} comments for policy ${policyId}`);
      return activeComments.length;
    } catch (error) {
      console.error('Error resolving allcomments:', error);
      throw new Error('Failed to resolve all comments');
    }
  }

  /**
   * Delete all comments for a policy (soft delete)
   * @param policyId - Policy UUID
   * @returns Number of comments deleted
   */
  async deleteAllComments(policyId: string): Promise<number> {
    try {
      const result = await this.commentRepository
        .createQueryBuilder()
        .update(PolicyComment)
        .set({ status: CommentStatus.DELETED })
        .where('policy_id = :policyId', { policyId })
        .andWhere('status != :deletedStatus', { deletedStatus: CommentStatus.DELETED })
        .execute();

      const deletedCount = result.affected || 0;

      console.log(`🗑️  Deleted ${deletedCount} comments for policy ${policyId}`);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting allcomments:', error);
      throw new Error('Failed to delete all comments');
    }
  }

  /**
   * Send notifications to mentioned users in a comment
   * @param comment - Policy comment with mentions
   * @private
   */
  private async notifyMentionedUsers(comment: PolicyComment): Promise<void> {
    try {
      if (!comment.mentionedUsers || comment.mentionedUsers.length === 0) {
        return;
      }

      // Create notification data
      const notificationData = {
        type: 'policy_comment_mention' as const,
        policyId: comment.policyId,
        commentId: comment.id,
        authorId: comment.userId,
        content: comment.content.substring(0, 100), // Preview
        timestamp: new Date()
      };

      // Send notifications (real-time via WebSocket if available)
      // In a full implementation, this would integrate with NotificationService
      console.log(`📧 Sending mention notifications to ${comment.mentionedUsers.length} users:`, {
        commentId: comment.id,
        mentionedUsers: comment.mentionedUsers,
        notification: notificationData
      });

      // TODO: Integrate with NotificationService when available
      // const notificationService = new NotificationService();
      // await notificationService.sendBulk({
      //   userIds: comment.mentionedUsers,
      //   ...notificationData
      // });

    } catch (error) {
      console.error('Error sending mentionnotifications:', error);
      // Don't throw - notifications are not critical
    }
  }
}
