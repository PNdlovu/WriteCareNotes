/**
 * @fileoverview User Repository
 * @module Repositories/UserRepository
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description
 * Repository pattern for User entity operations.
 * Handles all database interactions for user management including:
 * - User CRUD operations
 * - Authentication-related queries
 * - Account security (login attempts, locking)
 * - Password management
 */

import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

export interface CreateUserData {
  tenantId: string;
  organizationId?: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  employeeId?: string;
  roleId?: string;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
  emergencyContact?: Record<string, any>;
  isActive?: boolean;
  isVerified?: boolean;
  createdBy?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  preferredName?: string;
  employeeId?: string;
  roleId?: string;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
  emergencyContact?: Record<string, any>;
  isActive?: boolean;
  isVerified?: boolean;
  updatedBy?: string;
}

export class UserRepository {
  privaterepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  /**
   * Find user by email address
   * @param email - User's email address
   * @returns User entity or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.repository.findOne({ 
        where: { email, deletedAt: null } as FindOptionsWhere<User>
      });
      return user;
    } catch (error: unknown) {
      logger.error('Error finding user by email', { email, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param id - User's UUID
   * @returns User entity or null if not found
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.repository.findOne({ 
        where: { id, deletedAt: null } as FindOptionsWhere<User>
      });
      return user;
    } catch (error: unknown) {
      logger.error('Error finding user by ID', { userId: id, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Find user by employee ID
   * @param employeeId - Employee identifier
   * @param tenantId - Tenant UUID for isolation
   * @returns User entity or null if not found
   */
  async findByEmployeeId(employeeId: string, tenantId: string): Promise<User | null> {
    try {
      const user = await this.repository.findOne({ 
        where: { 
          employeeId, 
          tenantId,
          deletedAt: null 
        } as FindOptionsWhere<User>
      });
      return user;
    } catch (error: unknown) {
      logger.error('Error finding user by employee ID', { employeeId, tenantId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Find all users in organization
   * @param organizationId - Organization UUID
   * @param includeInactive - Include inactive users (default: false)
   * @returns Array of users
   */
  async findByOrganization(organizationId: string, includeInactive: boolean = false): Promise<User[]> {
    try {
      constwhere: FindOptionsWhere<User> = { 
        organizationId,
        deletedAt: null
      } as FindOptionsWhere<User>;

      if (!includeInactive) {
        (where as any).isActive = true;
      }

      const users = await this.repository.find({ where });
      return users;
    } catch (error: unknown) {
      logger.error('Error finding users by organization', { organizationId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Find all users in tenant
   * @param tenantId - Tenant UUID
   * @param includeInactive - Include inactive users (default: false)
   * @returns Array of users
   */
  async findByTenant(tenantId: string, includeInactive: boolean = false): Promise<User[]> {
    try {
      constwhere: FindOptionsWhere<User> = { 
        tenantId,
        deletedAt: null
      } as FindOptionsWhere<User>;

      if (!includeInactive) {
        (where as any).isActive = true;
      }

      const users = await this.repository.find({ where });
      return users;
    } catch (error: unknown) {
      logger.error('Error finding users by tenant', { tenantId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Create new user
   * @param userData - User data for creation
   * @returns Created user entity
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      const user = this.repository.create({
        ...userData,
        isActive: userData.isActive ?? true,
        isVerified: userData.isVerified ?? false,
        loginAttempts: 0,
        twoFactorEnabled: false
      });

      const savedUser = await this.repository.save(user);
      logger.info('User created successfully', { userId: savedUser.id, email: savedUser.email });
      
      return savedUser;
    } catch (error: unknown) {
      logger.error('Error creating user', { email: userData.email, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Update user
   * @param userId - User UUID
   * @param userData - User data to update
   * @returns Updated user entity
   */
  async update(userId: string, userData: UpdateUserData): Promise<User> {
    try {
      await this.repository.update({ id: userId }, userData);
      
      const updatedUser = await this.findById(userId);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      logger.info('User updated successfully', { userId });
      return updatedUser;
    } catch (error: unknown) {
      logger.error('Error updating user', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Soft delete user
   * @param userId - User UUID
   * @param deletedBy - UUID of user performing deletion
   */
  async softDelete(userId: string, deletedBy: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { 
          deletedAt: new Date(),
          updatedBy: deletedBy,
          isActive: false
        }
      );

      logger.info('User soft deleted', { userId, deletedBy });
    } catch (error: unknown) {
      logger.error('Error soft deleting user', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Hard delete user (use with caution, violates GDPR right to be forgotten audit trail)
   * @param userId - User UUID
   */
  async hardDelete(userId: string): Promise<void> {
    try {
      await this.repository.delete({ id: userId });
      logger.warn('User hard deleted', { userId });
    } catch (error: unknown) {
      logger.error('Error hard deleting user', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Increment login attempts counter
   * @param userId - User UUID
   */
  async incrementLoginAttempts(userId: string): Promise<void> {
    try {
      await this.repository.increment({ id: userId }, 'loginAttempts', 1);
      logger.debug('Login attempts incremented', { userId });
    } catch (error: unknown) {
      logger.error('Error incrementing login attempts', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Reset login attempts counter
   * @param userId - User UUID
   */
  async resetLoginAttempts(userId: string): Promise<void> {
    try {
      await this.repository.update({ id: userId }, { loginAttempts: 0, lockedUntil: null });
      logger.debug('Login attempts reset', { userId });
    } catch (error: unknown) {
      logger.error('Error resetting login attempts', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Lock user account until specified time
   * @param userId - User UUID
   * @param lockUntil - Date when account lockout expires
   */
  async lockAccount(userId: string, lockUntil: Date): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { lockedUntil: lockUntil, loginAttempts: 0 }
      );
      logger.warn('User account locked', { userId, lockUntil });
    } catch (error: unknown) {
      logger.error('Error locking account', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Unlock user account
   * @param userId - User UUID
   */
  async unlockAccount(userId: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { lockedUntil: null, loginAttempts: 0 }
      );
      logger.info('User account unlocked', { userId });
    } catch (error: unknown) {
      logger.error('Error unlocking account', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Update last login timestamp
   * @param userId - User UUID
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { lastLogin: new Date() }
      );
      logger.debug('Last login updated', { userId });
    } catch (error: unknown) {
      logger.error('Error updating last login', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Update user password
   * @param userId - User UUID
   * @param passwordHash - New password hash
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { 
          passwordHash,
          passwordChangedAt: new Date()
        }
      );
      logger.info('User password updated', { userId });
    } catch (error: unknown) {
      logger.error('Error updating password', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Activate user account
   * @param userId - User UUID
   */
  async activateAccount(userId: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { isActive: true }
      );
      logger.info('User account activated', { userId });
    } catch (error: unknown) {
      logger.error('Error activating account', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param userId - User UUID
   */
  async deactivateAccount(userId: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { isActive: false }
      );
      logger.info('User account deactivated', { userId });
    } catch (error: unknown) {
      logger.error('Error deactivating account', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Verify user email
   * @param userId - User UUID
   */
  async verifyEmail(userId: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { isVerified: true }
      );
      logger.info('User email verified', { userId });
    } catch (error: unknown) {
      logger.error('Error verifying email', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Enable two-factor authentication
   * @param userId - User UUID
   * @param secret - 2FA secret
   */
  async enableTwoFactor(userId: string, secret: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { 
          twoFactorEnabled: true,
          twoFactorSecret: secret
        }
      );
      logger.info('Two-factor authentication enabled', { userId });
    } catch (error: unknown) {
      logger.error('Error enabling 2FA', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   * @param userId - User UUID
   */
  async disableTwoFactor(userId: string): Promise<void> {
    try {
      await this.repository.update(
        { id: userId },
        { 
          twoFactorEnabled: false,
          twoFactorSecret: null
        }
      );
      logger.info('Two-factor authentication disabled', { userId });
    } catch (error: unknown) {
      logger.error('Error disabling 2FA', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Count users in organization
   * @param organizationId - Organization UUID
   * @param activeOnly - Count only active users (default: true)
   * @returns User count
   */
  async countByOrganization(organizationId: string, activeOnly: boolean = true): Promise<number> {
    try {
      constwhere: FindOptionsWhere<User> = { 
        organizationId,
        deletedAt: null
      } as FindOptionsWhere<User>;

      if (activeOnly) {
        (where as any).isActive = true;
      }

      const count = await this.repository.count({ where });
      return count;
    } catch (error: unknown) {
      logger.error('Error counting users by organization', { organizationId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Count users in tenant
   * @param tenantId - Tenant UUID
   * @param activeOnly - Count only active users (default: true)
   * @returns User count
   */
  async countByTenant(tenantId: string, activeOnly: boolean = true): Promise<number> {
    try {
      constwhere: FindOptionsWhere<User> = { 
        tenantId,
        deletedAt: null
      } as FindOptionsWhere<User>;

      if (activeOnly) {
        (where as any).isActive = true;
      }

      const count = await this.repository.count({ where });
      return count;
    } catch (error: unknown) {
      logger.error('Error counting users by tenant', { tenantId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Check if email is already in use
   * @param email - Email address to check
   * @param excludeUserId - User ID to exclude (for update operations)
   * @returns True if email is taken
   */
  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      constwhere: FindOptionsWhere<User> = { 
        email,
        deletedAt: null
      } as FindOptionsWhere<User>;

      const user = await this.repository.findOne({ where });
      
      if (!user) return false;
      if (excludeUserId && user.id === excludeUserId) return false;
      
      return true;
    } catch (error: unknown) {
      logger.error('Error checking email availability', { email, error: (error as Error).message });
      throw error;
    }
  }
}
