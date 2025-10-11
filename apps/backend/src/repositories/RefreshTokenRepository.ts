/**
 * @fileoverview Refresh Token Repository
 * @module Repositories/RefreshTokenRepository
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description
 * Repository pattern for RefreshToken entity operations.
 * Handles token lifecycle management including:
 * - Token creation and storage
 * - Token validation and revocation
 * - Token cleanup (expired tokens)
 */

import { Repository, DataSource, FindOptionsWhere, LessThan } from 'typeorm';
import { RefreshToken } from '../entities/RefreshToken';
import { logger } from '../utils/logger';

export interface CreateRefreshTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class RefreshTokenRepository {
  private repository: Repository<RefreshToken>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RefreshToken);
  }

  /**
   * Create and store new refresh token
   * @param tokenData - Refresh token data
   * @returns Created refresh token entity
   */
  async create(tokenData: CreateRefreshTokenData): Promise<RefreshToken> {
    try {
      const refreshToken = this.repository.create({
        userId: tokenData.userId,
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        ipAddress: tokenData.ipAddress,
        userAgent: tokenData.userAgent,
        isRevoked: false
      });

      const savedToken = await this.repository.save(refreshToken);
      logger.debug('Refresh token created', { 
        tokenId: savedToken.id, 
        userId: savedToken.userId 
      });

      return savedToken;
    } catch (error: unknown) {
      logger.error('Error creating refresh token', { 
        userId: tokenData.userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Find refresh token by token string
   * @param token - JWT refresh token string
   * @returns RefreshToken entity or null
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await this.repository.findOne({
        where: { token } as FindOptionsWhere<RefreshToken>
      });

      return refreshToken;
    } catch (error: unknown) {
      logger.error('Error finding refresh token', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Find refresh token by ID
   * @param id - Token UUID
   * @returns RefreshToken entity or null
   */
  async findById(id: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await this.repository.findOne({
        where: { id } as FindOptionsWhere<RefreshToken>
      });

      return refreshToken;
    } catch (error: unknown) {
      logger.error('Error finding refresh token by ID', { 
        tokenId: id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Find all active tokens for user
   * @param userId - User UUID
   * @returns Array of active refresh tokens
   */
  async findActiveByUser(userId: string): Promise<RefreshToken[]> {
    try {
      const tokens = await this.repository.find({
        where: {
          userId,
          isRevoked: false,
          expiresAt: LessThan(new Date())
        } as FindOptionsWhere<RefreshToken>
      });

      return tokens;
    } catch (error: unknown) {
      logger.error('Error finding active tokens for user', { 
        userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Revoke a specific refresh token
   * @param tokenId - Token UUID
   * @param revokedBy - User ID who revoked the token (optional)
   * @param reason - Reason for revocation (optional)
   */
  async revoke(tokenId: string, revokedBy?: string, reason?: string): Promise<void> {
    try {
      await this.repository.update(
        { id: tokenId },
        {
          isRevoked: true,
          revokedAt: new Date(),
          revokedBy,
          revocationReason: reason
        }
      );

      logger.info('Refresh token revoked', { 
        tokenId, 
        revokedBy, 
        reason 
      });
    } catch (error: unknown) {
      logger.error('Error revoking refresh token', { 
        tokenId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Revoke refresh token by token string
   * @param token - JWT refresh token string
   * @param revokedBy - User ID who revoked the token (optional)
   * @param reason - Reason for revocation (optional)
   */
  async revokeByToken(token: string, revokedBy?: string, reason?: string): Promise<void> {
    try {
      const refreshToken = await this.findByToken(token);
      if (refreshToken) {
        await this.revoke(refreshToken.id, revokedBy, reason);
      }
    } catch (error: unknown) {
      logger.error('Error revoking refresh token by token', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId - User UUID
   * @param revokedBy - User ID who revoked the tokens (optional)
   * @param reason - Reason for revocation (optional)
   */
  async revokeAllForUser(userId: string, revokedBy?: string, reason?: string): Promise<void> {
    try {
      await this.repository.update(
        { userId, isRevoked: false },
        {
          isRevoked: true,
          revokedAt: new Date(),
          revokedBy,
          revocationReason: reason || 'All tokens revoked for user'
        }
      );

      logger.info('All refresh tokens revoked for user', { 
        userId, 
        revokedBy, 
        reason 
      });
    } catch (error: unknown) {
      logger.error('Error revoking all tokens for user', { 
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
      } as FindOptionsWhere<RefreshToken>);

      const deletedCount = result.affected || 0;
      logger.info('Expired refresh tokens deleted', { count: deletedCount });

      return deletedCount;
    } catch (error: unknown) {
      logger.error('Error deleting expired tokens', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Delete revoked tokens older than specified days
   * @param daysOld - Number of days (default: 30)
   * @returns Number of tokens deleted
   */
  async deleteRevokedOlderThan(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.repository.delete({
        isRevoked: true,
        revokedAt: LessThan(cutoffDate)
      } as FindOptionsWhere<RefreshToken>);

      const deletedCount = result.affected || 0;
      logger.info('Old revoked tokens deleted', { count: deletedCount, daysOld });

      return deletedCount;
    } catch (error: unknown) {
      logger.error('Error deleting old revoked tokens', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Count active tokens for user
   * @param userId - User UUID
   * @returns Number of active tokens
   */
  async countActiveByUser(userId: string): Promise<number> {
    try {
      const count = await this.repository.count({
        where: {
          userId,
          isRevoked: false,
          expiresAt: LessThan(new Date())
        } as FindOptionsWhere<RefreshToken>
      });

      return count;
    } catch (error: unknown) {
      logger.error('Error counting active tokens for user', { 
        userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Check if token is valid (not revoked, not expired)
   * @param token - JWT refresh token string
   * @returns True if token is valid
   */
  async isTokenValid(token: string): Promise<boolean> {
    try {
      const refreshToken = await this.findByToken(token);
      
      if (!refreshToken) return false;
      if (refreshToken.isRevoked) return false;
      if (refreshToken.expiresAt < new Date()) return false;

      return true;
    } catch (error: unknown) {
      logger.error('Error checking token validity', { 
        error: (error as Error).message 
      });
      return false;
    }
  }
}
