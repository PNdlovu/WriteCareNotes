import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RBACService } from '../../../src/services/security/RBACService';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('RBACService', () => {
  let service: RBACService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    service = new RBACService(mockEventEmitter);
  });

  describe('checkPermission', () => {
    it('should check user permissions successfully', async () => {
      const permissionCheck = {
        userId: 'user-123',
        resource: 'patient',
        action: 'read',
        context: {
          organizationId: 'org-456',
          time: new Date(),
          location: 'London',
          network: 'internal',
        },
      };

      const result = await service.checkPermission(permissionCheck);

      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
      expect(result.reason).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.auditTrail).toBeDefined();
    });

    it('should handle denied permissions', async () => {
      const permissionCheck = {
        userId: 'user-123',
        resource: 'admin',
        action: 'delete',
        context: {
          organizationId: 'org-456',
          time: new Date(),
          location: 'London',
          network: 'internal',
        },
      };

      const result = await service.checkPermission(permissionCheck);

      expect(result).toBeDefined();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('insufficient');
    });

    it('should handle high-risk access attempts', async () => {
      const permissionCheck = {
        userId: 'user-123',
        resource: 'patient',
        action: 'delete',
        context: {
          organizationId: 'org-456',
          time: new Date(),
          location: 'Unknown',
          network: 'external',
        },
      };

      const result = await service.checkPermission(permissionCheck);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThan(50);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('rbac.high.risk.access', expect.any(Object));
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const userId = 'user-123';
      const result = await service.getUserRoles(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const role = result[0];
      expect(role.roleId).toBeDefined();
      expect(role.roleName).toBeDefined();
      expect(role.permissions).toBeDefined();
      expect(Array.isArray(role.permissions)).toBe(true);
    });

    it('should handle non-existent users', async () => {
      const userId = 'non-existent-user';
      const result = await service.getUserRoles(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('assignRole', () => {
    it('should assign roles to users', async () => {
      const assignment = {
        userId: 'user-123',
        roleId: 'nurse',
        assignedBy: 'admin-456',
        reason: 'New employee onboarding',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      };

      const result = await service.assignRole(assignment);

      expect(result).toBeDefined();
      expect(result.assignmentId).toBeDefined();
      expect(result.userId).toBe(assignment.userId);
      expect(result.roleId).toBe(assignment.roleId);
      expect(result.status).toBe('ACTIVE');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('rbac.role.assigned', expect.any(Object));
    });

    it('should handle role assignment errors', async () => {
      const assignment = {
        userId: 'non-existent-user',
        roleId: 'invalid-role',
        assignedBy: 'admin-456',
        reason: 'Test assignment',
      };

      await expect(service.assignRole(assignment)).rejects.toThrow('User not found');
    });
  });

  describe('revokeRole', () => {
    it('should revoke roles from users', async () => {
      const revocation = {
        userId: 'user-123',
        roleId: 'nurse',
        revokedBy: 'admin-456',
        reason: 'Employee termination',
      };

      const result = await service.revokeRole(revocation);

      expect(result).toBeDefined();
      expect(result.revocationId).toBeDefined();
      expect(result.userId).toBe(revocation.userId);
      expect(result.roleId).toBe(revocation.roleId);
      expect(result.status).toBe('REVOKED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('rbac.role.revoked', expect.any(Object));
    });
  });

  describe('getRolePermissions', () => {
    it('should return role permissions', async () => {
      const roleId = 'nurse';
      const result = await service.getRolePermissions(roleId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const permission = result[0];
      expect(permission.permissionId).toBeDefined();
      expect(permission.resource).toBeDefined();
      expect(permission.action).toBeDefined();
      expect(permission.conditions).toBeDefined();
    });
  });

  describe('createRole', () => {
    it('should create new roles', async () => {
      const roleData = {
        roleName: 'Senior Nurse',
        description: 'Senior nursing staff with additional responsibilities',
        permissions: [
          { resource: 'patient', action: 'read' },
          { resource: 'patient', action: 'update' },
          { resource: 'medication', action: 'administer' },
        ],
        createdBy: 'admin-456',
      };

      const result = await service.createRole(roleData);

      expect(result).toBeDefined();
      expect(result.roleId).toBeDefined();
      expect(result.roleName).toBe(roleData.roleName);
      expect(result.description).toBe(roleData.description);
      expect(result.status).toBe('ACTIVE');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('rbac.role.created', expect.any(Object));
    });
  });

  describe('updateRole', () => {
    it('should update existing roles', async () => {
      const roleId = 'nurse';
      const updates = {
        description: 'Updated nursing role description',
        permissions: [
          { resource: 'patient', action: 'read' },
          { resource: 'patient', action: 'update' },
          { resource: 'medication', action: 'administer' },
          { resource: 'care_plan', action: 'update' },
        ],
        updatedBy: 'admin-456',
      };

      const result = await service.updateRole(roleId, updates);

      expect(result).toBeDefined();
      expect(result.roleId).toBe(roleId);
      expect(result.description).toBe(updates.description);
      expect(result.permissions).toEqual(updates.permissions);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('rbac.role.updated', expect.any(Object));
    });
  });

  describe('getAccessHistory', () => {
    it('should return user access history', async () => {
      const userId = 'user-123';
      const result = await service.getAccessHistory(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const access = result[0];
        expect(access.accessId).toBeDefined();
        expect(access.userId).toBe(userId);
        expect(access.resource).toBeDefined();
        expect(access.action).toBeDefined();
        expect(access.timestamp).toBeDefined();
        expect(access.allowed).toBeDefined();
      }
    });
  });

  describe('checkTimeBasedAccess', () => {
    it('should check time-based access controls', async () => {
      const accessCheck = {
        userId: 'user-123',
        resource: 'patient',
        action: 'read',
        time: new Date('2024-01-15T10:00:00Z'), // Business hours
      };

      const result = await service.checkTimeBasedAccess(accessCheck);

      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
      expect(result.reason).toBeDefined();
    });

    it('should deny access outside business hours', async () => {
      const accessCheck = {
        userId: 'user-123',
        resource: 'patient',
        action: 'read',
        time: new Date('2024-01-15T22:00:00Z'), // After hours
      };

      const result = await service.checkTimeBasedAccess(accessCheck);

      expect(result).toBeDefined();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('outside');
    });
  });

  describe('checkLocationBasedAccess', () => {
    it('should check location-based access controls', async () => {
      const accessCheck = {
        userId: 'user-123',
        resource: 'patient',
        action: 'read',
        location: 'London',
        allowedLocations: ['London', 'Manchester'],
      };

      const result = await service.checkLocationBasedAccess(accessCheck);

      expect(result).toBeDefined();
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it('should deny access from unauthorized locations', async () => {
      const accessCheck = {
        userId: 'user-123',
        resource: 'patient',
        action: 'read',
        location: 'Unauthorized Location',
        allowedLocations: ['London', 'Manchester'],
      };

      const result = await service.checkLocationBasedAccess(accessCheck);

      expect(result).toBeDefined();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('location');
    });
  });

  describe('getRBACMetrics', () => {
    it('should return RBAC metrics', async () => {
      const result = await service.getRBACMetrics();

      expect(result).toBeDefined();
      expect(result.totalUsers).toBeGreaterThanOrEqual(0);
      expect(result.totalRoles).toBeGreaterThanOrEqual(0);
      expect(result.totalPermissions).toBeGreaterThanOrEqual(0);
      expect(result.accessAttempts).toBeGreaterThanOrEqual(0);
      expect(result.deniedAccess).toBeGreaterThanOrEqual(0);
      expect(result.highRiskAccess).toBeGreaterThanOrEqual(0);
      expect(result.lastUpdated).toBeDefined();
    });
  });
});