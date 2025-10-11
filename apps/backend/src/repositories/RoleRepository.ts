/**
 * @fileoverview Role Repository
 * @module Repositories/RoleRepository
 * @version 1.0.0
 * @since 2025-10-09
 * @description Repository for role and permission management
 */

import { DataSource, Repository } from 'typeorm';
import { Role } from '../entities/Role';
import { logger } from '../utils/logger';

export class RoleRepository {
  privaterepository: Repository<Role>;

  const ructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Role);
  }

  /**
   * Find role by ID
   */
  async findById(roleId: string): Promise<Role | null> {
    try {
      const role = await this.repository.findOne({
        where: { id: roleId }
      });

      return role;
    } catch (error) {
      logger.error('Error finding role by ID', { roleId, error });
      throw error;
    }
  }

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    try {
      const role = await this.repository.findOne({
        where: { name }
      });

      return role;
    } catch (error) {
      logger.error('Error finding role by name', { name, error });
      throw error;
    }
  }

  /**
   * Get all permissions for a role
   */
  async getPermissionsForRole(roleId: string): Promise<string[]> {
    try {
      const role = await this.findById(roleId);
      
      if (!role) {
        logger.warn('Role not found when fetching permissions', { roleId });
        return [];
      }

      return role.permissions || [];
    } catch (error) {
      logger.error('Error fetching permissions for role', { roleId, error });
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async findAll(): Promise<Role[]> {
    try {
      return await this.repository.find({
        order: { name: 'ASC' }
      });
    } catch (error) {
      logger.error('Error finding all roles', { error });
      throw error;
    }
  }

  /**
   * Get system roles only
   */
  async findSystemRoles(): Promise<Role[]> {
    try {
      return await this.repository.find({
        where: { isSystemRole: true },
        order: { name: 'ASC' }
      });
    } catch (error) {
      logger.error('Error finding system roles', { error });
      throw error;
    }
  }

  /**
   * Check if role has specific permission
   */
  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    try {
      const permissions = await this.getPermissionsForRole(roleId);
      return permissions.includes(permission);
    } catch (error) {
      logger.error('Error checking role permission', { roleId, permission, error });
      return false;
    }
  }

  /**
   * Get multiple roles by IDs
   */
  async findByIds(roleIds: string[]): Promise<Role[]> {
    try {
      if (roleIds.length === 0) {
        return [];
      }

      return await this.repository
        .createQueryBuilder('role')
        .where('role.id IN (:...roleIds)', { roleIds })
        .getMany();
    } catch (error) {
      logger.error('Error finding roles by IDs', { roleIds, error });
      throw error;
    }
  }

  /**
   * Get aggregated permissions for multiple roles
   */
  async getAggregatedPermissions(roleIds: string[]): Promise<string[]> {
    try {
      if (roleIds.length === 0) {
        return [];
      }

      const roles = await this.findByIds(roleIds);
      
      // Merge all permissions from all roles and deduplicate
      const allPermissions = roles.reduce((acc, role) => {
        return [...acc, ...(role.permissions || [])];
      }, [] as string[]);

      return Array.from(new Set(allPermissions));
    } catch (error) {
      logger.error('Error getting aggregated permissions', { roleIds, error });
      throw error;
    }
  }
}
