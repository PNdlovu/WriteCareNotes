import { useState, useEffect, useCallback } from 'react';

export interface Permission {
  resource: string;
  action: string;
  granted: boolean;
}

export interface Role {
  name: string;
  permissions: Permission[];
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from a permissions service
      const mockPermissions: Permission[] = [
        { resource: 'blog', action: 'read', granted: true },
        { resource: 'blog', action: 'write', granted: true },
        { resource: 'blog', action: 'delete', granted: false },
        { resource: 'admin', action: 'access', granted: false },
      ];
      setPermissions(mockPermissions);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Failed to load permissions:', error);
    }
  }, []);

  const hasPermission = useCallback((resource: string, action: string) => {
    return permissions.some(p => p.resource === resource && p.action === action && p.granted);
  }, [permissions]);

  const hasAnyPermission = useCallback((requiredPermissions: { resource: string; action: string }[]) => {
    return requiredPermissions.some(perm => hasPermission(perm.resource, perm.action));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((requiredPermissions: { resource: string; action: string }[]) => {
    return requiredPermissions.every(perm => hasPermission(perm.resource, perm.action));
  }, [hasPermission]);

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    reload: loadPermissions,
  };
};