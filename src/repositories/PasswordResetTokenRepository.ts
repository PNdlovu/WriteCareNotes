/**
 * @fileoverview Password Reset Token Repository
 * @module Repositories/PasswordResetTokenRepository
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description
 * Repository pattern for PasswordResetToken entity operations.
 * Handles password reset token lifecycle:
 * - Token creation and storage
 * - Token validation
 * - Token usage tracking
 * - Cleanup of expired/used tokens
 */

import { Repository, DataSource, FindOptionsWhere, LessThan } from 'typeorm';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { logger } from '../utils/logger';

export interface CreatePasswordResetTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class PasswordResetTokenRepository {
  private repository: Repository<PasswordResetToken>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(PasswordResetToken);
  }

  /**
   * Create new password reset token
   * @param tokenData - Password reset token data
   * @returns Created password reset token entity
   */
  async create(tokenData: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    try {
      const resetToken = this.repository.create({
        userId: tokenData.userId,
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        ipAddress: tokenData.ipAddress,
        userAgent: tokenData.userAgent,
        used: false
      });

      const savedToken = await this.repository.save(resetToken);
      logger.info('Password reset token created', { 
        tokenId: savedToken.id, 
        userId: savedToken.userId 
      });

      return savedToken;
    } catch (error: unknown) {
      logger.error('Error creating password reset token', { 
        userId: tokenData.userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Find password reset token by token string
   * @param token - Password reset token string (hashed)
   * @returns PasswordResetToken entity or null
   */
  async findByToken(token: string): Promise<PasswordResetToken | null> {
    try {
      const resetToken = await this.repository.findOne({
        where: { 
          token,
          used: false
        } as FindOptionsWhere<PasswordResetToken>
      });

      return resetToken;
    } catch (error: unknown) {
      logger.error('Error finding password reset token', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Find password reset token by ID
   * @param id - Token UUID
   * @returns PasswordResetToken entity or null
   */
  async findById(id: string): Promise<PasswordResetToken | null> {
    try {
      const resetToken = await this.repository.findOne({
        where: { id } as FindOptionsWhere<PasswordResetToken>
      });

      return resetToken;
    } catch (error: unknown) {
      logger.error('Error finding password reset token by ID', { 
        tokenId: id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Find all unused tokens for user
   * @param userId - User UUID
   * @returns Array of unused password reset tokens
   */
  async findUnusedByUser(userId: string): Promise<PasswordResetToken[]> {
    try {
      const tokens = await this.repository.find({
        where: {
          userId,
          used: false
        } as FindOptionsWhere<PasswordResetToken>
      });

      return tokens;
    } catch (error: unknown) {
      logger.error('Error finding unused tokens for user', { 
        userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Mark token as used
   * @param tokenId - Token UUID
   */
  async markAsUsed(tokenId: string): Promise<void> {
    try {
      await this.repository.update(
        { id: tokenId },
        {
          used: true,
          usedAt: new Date()
        }
      );

      logger.info('Password reset token marked as used', { tokenId });
    } catch (error: unknown) {
      logger.error('Error marking token as used', { 
        tokenId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Invalidate all unused tokens for user
   * @param userId - User UUID
   */
  async invalidateAllForUser(userId: string): Promise<void> {
    try {
      await this.repository.update(
        { userId, used: false },
        {
          used: true,
          usedAt: new Date()
        }
      );

      logger.info('All password reset tokens invalidated for user', { userId });
    } catch (error: unknown) {
      logger.error('Error invalidating tokens for user', { 
        userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Delete expired tokens (cleanup job)
   * @returns Number of tokens deleted
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await this.repository.delete({
        expiresAt: LessThan(new Date())
      } as FindOptionsWhere<PasswordResetToken>);

      const deletedCount = result.affected || 0;
      logger.info('Expired password reset tokens deleted', { count: deletedCount });

      return deletedCount;
    } catch (error: unknown) {
      logger.error('Error deleting expired tokens', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Delete used tokens older than specified days
   * @param daysOld - Number of days (default: 7)
   * @returns Number of tokens deleted
   */
  async deleteUsedOlderThan(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.repository.delete({
        used: true,
        usedAt: LessThan(cutoffDate)
      } as FindOptionsWhere<PasswordResetToken>);

      const deletedCount = result.affected || 0;
      logger.info('Old used password reset tokens deleted', { count: deletedCount, daysOld });

      return deletedCount;
    } catch (error: unknown) {
      logger.error('Error deleting old used tokens', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Check if token is valid (not used, not expired)
   * @param token - Password reset token string (hashed)
   * @returns True if token is valid
   */
  async isTokenValid(token: string): Promise<boolean> {
    try {
      const resetToken = await this.findByToken(token);
      
      if (!resetToken) return false;
      if (resetToken.used) return false;
      if (resetToken.expiresAt < new Date()) return false;

      return true;
    } catch (error: unknown) {
      logger.error('Error checking token validity', { 
        error: (error as Error).message 
      });
      return false;
    }
  }

  /**
   * Count unused tokens for user
   * @param userId - User UUID
   * @returns Number of unused tokens
   */
  async countUnusedByUser(userId: string): Promise<number> {
    try {
      const count = await this.repository.count({
        where: {
          userId,
          used: false
        } as FindOptionsWhere<PasswordResetToken>
      });

      return count;
    } catch (error: unknown) {
      logger.error('Error counting unused tokens for user', { 
        userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }
}
