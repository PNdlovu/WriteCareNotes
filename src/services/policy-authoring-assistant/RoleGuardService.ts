/**
 * 🛡️ ROLE GUARD SERVICE
 * 
 * Enforces role-based access control for AI assistant features
 * 
 * Key Features:
 * - Intent-based authorization
 * - Organization-level permissions
 * - Audit trail integration
 * - Granular feature access
 * 
 * @module RoleGuardService
 * @version 1.0.0
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { User, UserRole } from '../../entities/user.entity';

/**
 * 🎯 AI ASSISTANT PERMISSION MATRIX
 */
const PERMISSION_MATRIX = {
  suggest_clause: [
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ],
  map_policy: [
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.MANAGER,
    UserRole.ADMIN,
  ],
  review_policy: [
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SENIOR_CARER,
  ],
  suggest_improvement: [
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.MANAGER,
  ],
  validate_compliance: [
    UserRole.SUPER_ADMIN,
    UserRole.COMPLIANCE_OFFICER,
  ],
};

/**
 * 🔒 PUBLISHING PERMISSION MATRIX
 */
const PUBLISHING_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPLIANCE_OFFICER,
  UserRole.MANAGER,
];

@Injectable()
export class RoleGuardService {
  private readonly logger = new Logger(RoleGuardService.name);

  /**
   * ✅ VALIDATE USER ACCESS TO AI INTENT
   */
  async validateAccess(user: User, intent: string): Promise<void> {
    if (!user) {
      throw new UnauthorizedException('User authentication required for AI assistant');
    }

    // Check if user's role is authorized for this intent
    const authorizedRoles = PERMISSION_MATRIX[intent];
    
    if (!authorizedRoles) {
      throw new UnauthorizedException(`Unknown AI assistant intent: ${intent}`);
    }

    if (!authorizedRoles.includes(user.role)) {
      this.logger.warn(
        `Access denied: User ${user.id} (${user.role}) attempted unauthorized AI intent: ${intent}`
      );
      
      throw new UnauthorizedException(
        `Your role (${user.role}) does not have access to ${intent} feature. ` +
        `Required roles: ${authorizedRoles.join(', ')}`
      );
    }

    this.logger.log(`Access granted: User ${user.id} (${user.role}) → ${intent}`);
  }

  /**
   * ✅ VALIDATE PUBLISHING PERMISSION
   */
  async validatePublishingAccess(user: User): Promise<void> {
    if (!user) {
      throw new UnauthorizedException('User authentication required for policy publishing');
    }

    if (!PUBLISHING_ROLES.includes(user.role)) {
      throw new UnauthorizedException(
        `Your role (${user.role}) does not have permission to publish AI-assisted policies. ` +
        `Required roles: ${PUBLISHING_ROLES.join(', ')}`
      );
    }

    this.logger.log(`Publishing access granted: User ${user.id} (${user.role})`);
  }

  /**
   * 📊 GET USER PERMISSIONS
   */
  async getUserPermissions(user: User): Promise<{
    availableIntents: string[];
    canPublish: boolean;
    role: string;
  }> {
    const availableIntents = Object.entries(PERMISSION_MATRIX)
      .filter(([_, roles]) => roles.includes(user.role))
      .map(([intent, _]) => intent);

    const canPublish = PUBLISHING_ROLES.includes(user.role);

    return {
      availableIntents,
      canPublish,
      role: user.role,
    };
  }

  /**
   * 🔍 CHECK SPECIFIC PERMISSION
   */
  async hasPermission(user: User, intent: string): Promise<boolean> {
    if (!user || !intent) return false;

    const authorizedRoles = PERMISSION_MATRIX[intent];
    if (!authorizedRoles) return false;

    return authorizedRoles.includes(user.role);
  }

  /**
   * 📋 GET PERMISSION MATRIX
   */
  getPermissionMatrix(): typeof PERMISSION_MATRIX {
    return PERMISSION_MATRIX;
  }

  /**
   * 🏢 VALIDATE ORGANIZATION ACCESS
   */
  async validateOrganizationAccess(
    user: User,
    resourceOrganizationId: string,
  ): Promise<void> {
    // Super admins can access all organizations
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Other users must belong to the same organization
    if (user.organizationId !== resourceOrganizationId) {
      throw new UnauthorizedException(
        'You do not have access to resources from this organization'
      );
    }
  }

  /**
   * 🔐 VALIDATE TEMPLATE ACCESS
   */
  async validateTemplateAccess(
    user: User,
    templateVisibility: 'public' | 'organization' | 'private',
    templateOwnerId?: string,
  ): Promise<void> {
    // Public templates are accessible to everyone
    if (templateVisibility === 'public') {
      return;
    }

    // Organization templates accessible within same org
    if (templateVisibility === 'organization') {
      // Super admins can access all
      if (user.role === UserRole.SUPER_ADMIN) {
        return;
      }
      // Will be validated at organization level
      return;
    }

    // Private templates only accessible by owner or super admin
    if (templateVisibility === 'private') {
      if (user.role === UserRole.SUPER_ADMIN || user.id === templateOwnerId) {
        return;
      }
      
      throw new UnauthorizedException(
        'This template is private and can only be accessed by its owner'
      );
    }
  }

  /**
   * ⚠️ VALIDATE SAFETY OVERRIDE PERMISSION
   */
  async validateSafetyOverride(user: User): Promise<void> {
    const SAFETY_OVERRIDE_ROLES = [UserRole.SUPER_ADMIN];

    if (!SAFETY_OVERRIDE_ROLES.includes(user.role)) {
      throw new UnauthorizedException(
        'AI safety overrides require Super Admin permission'
      );
    }

    this.logger.warn(
      `AI safety override accessed by User ${user.id} (${user.role})`
    );
  }

  /**
   * 📊 GET ROLE HIERARCHY
   */
  getRoleHierarchy(): { [key in UserRole]: number } {
    return {
      [UserRole.SUPER_ADMIN]: 100,
      [UserRole.COMPLIANCE_OFFICER]: 90,
      [UserRole.MANAGER]: 80,
      [UserRole.ADMIN]: 70,
      [UserRole.SENIOR_CARER]: 60,
      [UserRole.CARER]: 50,
      [UserRole.NURSE]: 55,
      [UserRole.KITCHEN_STAFF]: 30,
      [UserRole.MAINTENANCE]: 30,
      [UserRole.VIEWER]: 10,
    };
  }

  /**
   * 🔍 COMPARE ROLE LEVELS
   */
  isRoleHigherOrEqual(userRole: UserRole, requiredRole: UserRole): boolean {
    const hierarchy = this.getRoleHierarchy();
    return hierarchy[userRole] >= hierarchy[requiredRole];
  }

  /**
   * 📈 LOG ACCESS ATTEMPT
   */
  private logAccessAttempt(
    user: User,
    intent: string,
    granted: boolean,
    reason?: string,
  ): void {
    const logLevel = granted ? 'log' : 'warn';
    const status = granted ? 'GRANTED' : 'DENIED';
    
    this.logger[logLevel](
      `AI Access ${status}: User ${user.id} (${user.role}) → ${intent}${reason ? ` (${reason})` : ''}`
    );
  }
}
