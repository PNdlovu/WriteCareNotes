/**
 * @fileoverview role based access Service
 * @module Auth/RoleBasedAccessService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description role based access Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { Employee } from '../../entities/hr/Employee';
import { AuditService,  AuditTrailService } from '../audit';

export enum UserRole {
  WORKER = 'worker',
  MANAGER = 'manager',
  DEPUTY_MANAGER = 'deputy_manager',
  EXECUTIVE = 'executive',
  OPERATIONS = 'operations',
  HR_ADMIN = 'hr_admin',
  SYSTEM_ADMIN = 'system_admin'
}

export enum Permission {
  // Time Tracking
  CLOCK_IN_OUT = 'clock_in_out',
  VIEW_OWN_TIME_ENTRIES = 'view_own_time_entries',
  VIEW_TEAM_TIME_ENTRIES = 'view_team_time_entries',
  VIEW_ALL_TIME_ENTRIES = 'view_all_time_entries',
  APPROVE_TIME_ENTRIES = 'approve_time_entries',
  EDIT_TIME_ENTRIES = 'edit_time_entries',

  // Payroll
  VIEW_OWN_PAYSLIPS = 'view_own_payslips',
  VIEW_TEAM_PAYSLIPS = 'view_team_payslips',
  VIEW_ALL_PAYSLIPS = 'view_all_payslips',
  PROCESS_PAYROLL = 'process_payroll',
  APPROVE_PAYROLL = 'approve_payroll',

  // Holidays
  REQUEST_HOLIDAY = 'request_holiday',
  VIEW_OWN_HOLIDAYS = 'view_own_holidays',
  VIEW_TEAM_HOLIDAYS = 'view_team_holidays',
  VIEW_ALL_HOLIDAYS = 'view_all_holidays',
  APPROVE_HOLIDAYS = 'approve_holidays',
  CANCEL_HOLIDAYS = 'cancel_holidays',

  // Shifts and Rota
  VIEW_OWN_SHIFTS = 'view_own_shifts',
  VIEW_TEAM_SHIFTS = 'view_team_shifts',
  VIEW_ALL_SHIFTS = 'view_all_shifts',
  CREATE_SHIFTS = 'create_shifts',
  EDIT_SHIFTS = 'edit_shifts',
  DELETE_SHIFTS = 'delete_shifts',
  PUBLISH_ROTA = 'publish_rota',

  // Overtime
  REQUEST_OVERTIME = 'request_overtime',
  VIEW_OWN_OVERTIME = 'view_own_overtime',
  VIEW_TEAM_OVERTIME = 'view_team_overtime',
  VIEW_ALL_OVERTIME = 'view_all_overtime',
  APPROVE_OVERTIME = 'approve_overtime',

  // Employee Management
  VIEW_OWN_PROFILE = 'view_own_profile',
  EDIT_OWN_PROFILE = 'edit_own_profile',
  VIEW_TEAM_PROFILES = 'view_team_profiles',
  VIEW_ALL_PROFILES = 'view_all_profiles',
  CREATE_EMPLOYEES = 'create_employees',
  EDIT_EMPLOYEES = 'edit_employees',
  DELETE_EMPLOYEES = 'delete_employees',

  // Reports and Analytics
  VIEW_BASIC_REPORTS = 'view_basic_reports',
  VIEW_TEAM_REPORTS = 'view_team_reports',
  VIEW_ADVANCED_REPORTS = 'view_advanced_reports',
  EXPORT_REPORTS = 'export_reports',

  // System Administration
  MANAGE_ROLES = 'manage_roles',
  MANAGE_PERMISSIONS = 'manage_permissions',
  SYSTEM_SETTINGS = 'system_settings',
  AUDIT_LOGS = 'audit_logs',

  // Device and Location
  BYPASS_LOCATION_CHECK = 'bypass_location_check',
  ACCESS_FROM_PERSONAL_DEVICE = 'access_from_personal_device',
  ACCESS_SENSITIVE_DATA = 'access_sensitive_data'
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  restrictions?: {
    requireOrganizationDevice?: boolean;
    requireBiometricAuth?: boolean;
    allowOfflineAccess?: boolean;
    maxDataRetentionDays?: number;
  };
}

export interface AccessContext {
  userId: string;
  role: UserRole;
  deviceType: 'organization' | 'personal';
  location?: {
    latitude: number;
    longitude: number;
  };
  biometricVerified: boolean;
  sessionToken: string;
}

export class RoleBasedAccessService {
  privateemployeeRepository: Repository<Employee>;
  privateauditService: AuditService;

  // Role-Permission Matrix
  private readonly ROLE_PERMISSIONS: Map<UserRole, RolePermissions> = new Map([
    [UserRole.WORKER, {
      role: UserRole.WORKER,
      permissions: [
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_TIME_ENTRIES,
        Permission.VIEW_OWN_PAYSLIPS,
        Permission.REQUEST_HOLIDAY,
        Permission.VIEW_OWN_HOLIDAYS,
        Permission.VIEW_OWN_SHIFTS,
        Permission.REQUEST_OVERTIME,
        Permission.VIEW_OWN_OVERTIME,
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_BASIC_REPORTS
      ],
      restrictions: {
        requireOrganizationDevice: false,
        requireBiometricAuth: true,
        allowOfflineAccess: true,
        maxDataRetentionDays: 30
      }
    }],
    
    [UserRole.MANAGER, {
      role: UserRole.MANAGER,
      permissions: [
        // Worker permissions
        ...this.getWorkerPermissions(),
        // Manager-specific permissions
        Permission.VIEW_TEAM_TIME_ENTRIES,
        Permission.APPROVE_TIME_ENTRIES,
        Permission.VIEW_TEAM_PAYSLIPS,
        Permission.VIEW_TEAM_HOLIDAYS,
        Permission.APPROVE_HOLIDAYS,
        Permission.VIEW_TEAM_SHIFTS,
        Permission.CREATE_SHIFTS,
        Permission.EDIT_SHIFTS,
        Permission.VIEW_TEAM_OVERTIME,
        Permission.APPROVE_OVERTIME,
        Permission.VIEW_TEAM_PROFILES,
        Permission.VIEW_TEAM_REPORTS,
        Permission.ACCESS_FROM_PERSONAL_DEVICE
      ],
      restrictions: {
        requireOrganizationDevice: false,
        requireBiometricAuth: true,
        allowOfflineAccess: true,
        maxDataRetentionDays: 90
      }
    }],

    [UserRole.DEPUTY_MANAGER, {
      role: UserRole.DEPUTY_MANAGER,
      permissions: [
        // Manager permissions
        ...this.getManagerPermissions(),
        // Additional deputy permissions
        Permission.PUBLISH_ROTA,
        Permission.CANCEL_HOLIDAYS
      ],
      restrictions: {
        requireOrganizationDevice: false,
        requireBiometricAuth: true,
        allowOfflineAccess: true,
        maxDataRetentionDays: 90
      }
    }],

    [UserRole.EXECUTIVE, {
      role: UserRole.EXECUTIVE,
      permissions: [
        // All previous permissions
        ...this.getDeputyManagerPermissions(),
        // Executive permissions
        Permission.VIEW_ALL_TIME_ENTRIES,
        Permission.VIEW_ALL_PAYSLIPS,
        Permission.PROCESS_PAYROLL,
        Permission.APPROVE_PAYROLL,
        Permission.VIEW_ALL_HOLIDAYS,
        Permission.VIEW_ALL_SHIFTS,
        Permission.DELETE_SHIFTS,
        Permission.VIEW_ALL_OVERTIME,
        Permission.VIEW_ALL_PROFILES,
        Permission.EDIT_EMPLOYEES,
        Permission.VIEW_ADVANCED_REPORTS,
        Permission.EXPORT_REPORTS,
        Permission.ACCESS_SENSITIVE_DATA
      ],
      restrictions: {
        requireOrganizationDevice: true,
        requireBiometricAuth: true,
        allowOfflineAccess: false,
        maxDataRetentionDays: 365
      }
    }],

    [UserRole.OPERATIONS, {
      role: UserRole.OPERATIONS,
      permissions: [
        // Operational permissions
        Permission.VIEW_ALL_TIME_ENTRIES,
        Permission.EDIT_TIME_ENTRIES,
        Permission.VIEW_ALL_SHIFTS,
        Permission.CREATE_SHIFTS,
        Permission.EDIT_SHIFTS,
        Permission.DELETE_SHIFTS,
        Permission.PUBLISH_ROTA,
        Permission.VIEW_ALL_OVERTIME,
        Permission.APPROVE_OVERTIME,
        Permission.VIEW_ADVANCED_REPORTS,
        Permission.EXPORT_REPORTS,
        Permission.BYPASS_LOCATION_CHECK
      ],
      restrictions: {
        requireOrganizationDevice: true,
        requireBiometricAuth: true,
        allowOfflineAccess: false,
        maxDataRetentionDays: 180
      }
    }],

    [UserRole.HR_ADMIN, {
      role: UserRole.HR_ADMIN,
      permissions: [
        // HR-specific permissions
        Permission.VIEW_ALL_PAYSLIPS,
        Permission.PROCESS_PAYROLL,
        Permission.APPROVE_PAYROLL,
        Permission.VIEW_ALL_HOLIDAYS,
        Permission.APPROVE_HOLIDAYS,
        Permission.CANCEL_HOLIDAYS,
        Permission.VIEW_ALL_PROFILES,
        Permission.CREATE_EMPLOYEES,
        Permission.EDIT_EMPLOYEES,
        Permission.DELETE_EMPLOYEES,
        Permission.VIEW_ADVANCED_REPORTS,
        Permission.EXPORT_REPORTS,
        Permission.ACCESS_SENSITIVE_DATA
      ],
      restrictions: {
        requireOrganizationDevice: true,
        requireBiometricAuth: true,
        allowOfflineAccess: false,
        maxDataRetentionDays: 365
      }
    }],

    [UserRole.SYSTEM_ADMIN, {
      role: UserRole.SYSTEM_ADMIN,
      permissions: Object.values(Permission), // All permissions
      restrictions: {
        requireOrganizationDevice: true,
        requireBiometricAuth: true,
        allowOfflineAccess: false,
        maxDataRetentionDays: 365
      }
    }]
  ]);

  const ructor() {
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.auditService = new AuditTrailService();
  }

  // Permission Checking Methods
  async hasPermission(
    userId: string, 
    permission: Permission, 
    context?: AccessContext
  ): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId);
      if (!userRole) return false;

      const rolePermissions = this.ROLE_PERMISSIONS.get(userRole);
      if (!rolePermissions) return false;

      // Check if role has the permission
      if (!rolePermissions.permissions.includes(permission)) {
        return false;
      }

      // Apply context-based restrictions
      if (context) {
        const hasContextualAccess = await this.checkContextualAccess(
          rolePermissions, 
          permission, 
          context
        );
        if (!hasContextualAccess) return false;
      }

      // Log permission check
      await this.auditService.logEvent({
        resource: 'Permission',
        entityType: 'Permission',
        entityId: permission,
        action: 'CHECK',
        details: { 
          userId, 
          permission, 
          granted: true,
          context: context ? {
            deviceType: context.deviceType,
            biometricVerified: context.biometricVerified
          } : undefined
        },
        userId
      });

      return true;
    } catch (error: unknown) {
      console.error('Error checkingpermission:', error);
      return false;
    }
  }

  async hasAnyPermission(
    userId: string, 
    permissions: Permission[], 
    context?: AccessContext
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission, context)) {
        return true;
      }
    }
    return false;
  }

  async hasAllPermissions(
    userId: string, 
    permissions: Permission[], 
    context?: AccessContext
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission, context))) {
        return false;
      }
    }
    return true;
  }

  // Role Management
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const employee = await this.employeeRepository.findOne({
        where: { id: userId }
      });

      if (!employee) return null;

      // Extract role from employee data (this would be stored in employee record)
      // For now, we'll derive it from job title or department
      return this.deriveRoleFromEmployee(employee);
    } catch (error: unknown) {
      console.error('Error getting userrole:', error);
      return null;
    }
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return [];

    const rolePermissions = this.ROLE_PERMISSIONS.get(userRole);
    returnrolePermissions?.permissions || [];
  }

  async getRoleRestrictions(userId: string): Promise<any> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return {};

    const rolePermissions = this.ROLE_PERMISSIONS.get(userRole);
    returnrolePermissions?.restrictions || {};
  }

  // Context-based Access Control
  private async checkContextualAccess(
    rolePermissions: RolePermissions,
    permission: Permission,
    context: AccessContext
  ): Promise<boolean> {
    const restrictions = rolePermissions.restrictions;
    if (!restrictions) return true;

    // Check device requirements
    if (restrictions.requireOrganizationDevice && context.deviceType === 'personal') {
      // Allow personal device access only for specific permissions
      const personalDeviceAllowedPermissions = [
        Permission.CLOCK_IN_OUT,
        Permission.VIEW_OWN_TIME_ENTRIES,
        Permission.VIEW_OWN_PAYSLIPS,
        Permission.REQUEST_HOLIDAY,
        Permission.VIEW_OWN_HOLIDAYS,
        Permission.VIEW_OWN_SHIFTS
      ];

      if (!personalDeviceAllowedPermissions.includes(permission)) {
        return false;
      }
    }

    // Check biometric authentication requirements
    if (restrictions.requireBiometricAuth && !context.biometricVerified) {
      const sensitivePermissions = [
        Permission.ACCESS_SENSITIVE_DATA,
        Permission.PROCESS_PAYROLL,
        Permission.APPROVE_PAYROLL,
        Permission.VIEW_ALL_PAYSLIPS,
        Permission.EDIT_EMPLOYEES,
        Permission.DELETE_EMPLOYEES
      ];

      if (sensitivePermissions.includes(permission)) {
        return false;
      }
    }

    // Additional context checks can be added here
    return true;
  }

  // Company Policy Enforcement
  async enforceCompanyPolicy(
    userId: string,
    action: string,
    context: AccessContext
  ): Promise<{ allowed: boolean; reason?: string }> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) {
      return { allowed: false, reason: 'User role not found' };
    }

    // Example company policies
    const policies = {
      // Sensitive data access only from organization devices
      sensitiveDataPolicy: {
        applies: [Permission.ACCESS_SENSITIVE_DATA, Permission.PROCESS_PAYROLL],
        rule: (ctx: AccessContext) => ctx.deviceType === 'organization',
        message: 'Sensitive data can only be accessed from organization devices'
      },
      
      // Executive actions require biometric authentication
      executiveActionsPolicy: {
        applies: [Permission.APPROVE_PAYROLL, Permission.DELETE_EMPLOYEES],
        rule: (ctx: AccessContext) => ctx.biometricVerified,
        message: 'Executive actions require biometric authentication'
      },

      // Location-based restrictions for clock in/out
      locationPolicy: {
        applies: [Permission.CLOCK_IN_OUT],
        rule: (ctx: AccessContext) => {
          // This would check against allowed work locations
          return true; // Simplified for now
        },
        message: 'Clock in/out must be performed at authorized locations'
      }
    };

    // Check applicable policies
    for (const [policyName, policy] of Object.entries(policies)) {
      if (policy.applies.some(p => p === action as Permission)) {
        if (!policy.rule(context)) {
          await this.auditService.logEvent({
            resource: 'Policy',
        entityType: 'Policy',
            entityId: policyName,
            action: 'VIOLATION',
            details: { 
              userId, 
              action, 
              context: {
                deviceType: context.deviceType,
                biometricVerified: context.biometricVerified
              },
              reason: policy.message
            },
            userId
          });

          return { allowed: false, reason: policy.message };
        }
      }
    }

    return { allowed: true };
  }

  // Helper methods to get permissions for each role
  private getWorkerPermissions(): Permission[] {
    return [
      Permission.CLOCK_IN_OUT,
      Permission.VIEW_OWN_TIME_ENTRIES,
      Permission.VIEW_OWN_PAYSLIPS,
      Permission.REQUEST_HOLIDAY,
      Permission.VIEW_OWN_HOLIDAYS,
      Permission.VIEW_OWN_SHIFTS,
      Permission.REQUEST_OVERTIME,
      Permission.VIEW_OWN_OVERTIME,
      Permission.VIEW_OWN_PROFILE,
      Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_BASIC_REPORTS
    ];
  }

  private getManagerPermissions(): Permission[] {
    return [
      ...this.getWorkerPermissions(),
      Permission.VIEW_TEAM_TIME_ENTRIES,
      Permission.APPROVE_TIME_ENTRIES,
      Permission.VIEW_TEAM_PAYSLIPS,
      Permission.VIEW_TEAM_HOLIDAYS,
      Permission.APPROVE_HOLIDAYS,
      Permission.VIEW_TEAM_SHIFTS,
      Permission.CREATE_SHIFTS,
      Permission.EDIT_SHIFTS,
      Permission.VIEW_TEAM_OVERTIME,
      Permission.APPROVE_OVERTIME,
      Permission.VIEW_TEAM_PROFILES,
      Permission.VIEW_TEAM_REPORTS,
      Permission.ACCESS_FROM_PERSONAL_DEVICE
    ];
  }

  private getDeputyManagerPermissions(): Permission[] {
    return [
      ...this.getManagerPermissions(),
      Permission.PUBLISH_ROTA,
      Permission.CANCEL_HOLIDAYS
    ];
  }

  private deriveRoleFromEmployee(employee: Employee): UserRole {
    const jobTitle = employee.jobDetails.jobTitle.toLowerCase();
    const department = employee.employmentInformation.department.toLowerCase();

    // Role derivation logic based on job title and department
    if (jobTitle.includes('executive') || jobTitle.includes('director')) {
      return UserRole.EXECUTIVE;
    }
    
    if (jobTitle.includes('manager') && jobTitle.includes('deputy')) {
      return UserRole.DEPUTY_MANAGER;
    }
    
    if (jobTitle.includes('manager') || jobTitle.includes('supervisor')) {
      return UserRole.MANAGER;
    }
    
    if (department.includes('hr') || department.includes('human resources')) {
      return UserRole.HR_ADMIN;
    }
    
    if (department.includes('operations') || jobTitle.includes('operations')) {
      return UserRole.OPERATIONS;
    }
    
    if (jobTitle.includes('admin') && jobTitle.includes('system')) {
      return UserRole.SYSTEM_ADMIN;
    }

    // Default to worker
    return UserRole.WORKER;
  }

  // Permission middleware for API routes
  createPermissionMiddleware(requiredPermissions: Permission[]) {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = req.user?.id;
        const context: AccessContext = {
          userId,
          role: await this.getUserRole(userId),
          deviceType: req.headers['device-type'] === 'organization' ? 'organization' : 'personal',
          biometricVerified: req.headers['biometric-verified'] === 'true',
          sessionToken: req.headers['authorization']?.replace('Bearer ', ''),
          location: req.headers['location'] ? JSON.parse(req.headers['location']) : undefined
        };

        const hasAccess = await this.hasAllPermissions(userId, requiredPermissions, context);
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: requiredPermissions,
            message: 'You do not have the required permissions to access this resource'
          });
        }

        // Check company policies
        for (const permission of requiredPermissions) {
          const policyCheck = await this.enforceCompanyPolicy(userId, permission, context);
          if (!policyCheck.allowed) {
            return res.status(403).json({
              error: 'Policy violation',
              message: policyCheck.reason
            });
          }
        }

        req.permissions = await this.getUserPermissions(userId);
        req.accessContext = context;
        next();
      } catch (error: unknown) {
        console.error('Permission middlewareerror:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }
}
