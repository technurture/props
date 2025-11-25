import { useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/emr';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  canAccessResource,
  ResourceAction 
} from '@/lib/middleware/rbac';
import { 
  buildRoleScopedFilters,
  canEditResource as utilCanEditResource,
  canViewResource as utilCanViewResource,
  RoleScopedFilter 
} from '@/lib/utils/roleFilters';

export interface UsePermissionsReturn {
  can: (permission: ResourceAction) => boolean;
  canAny: (permissions: ResourceAction[]) => boolean;
  canAll: (permissions: ResourceAction[]) => boolean;
  canEditResource: (resourceOwnerId?: string) => boolean;
  canViewResource: (resourceType: string, resourceOwnerId?: string) => boolean;
  getRoleFilters: () => RoleScopedFilter;
  isLoading: boolean;
  userRole: UserRole | null;
  userId: string | null;
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  const userRole = useMemo(() => {
    if (!session?.user?.role) return null;
    return session.user.role as UserRole;
  }, [session?.user?.role]);

  const userId = useMemo(() => {
    return session?.user?.id || null;
  }, [session?.user?.id]);

  const can = useCallback((permission: ResourceAction): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  }, [userRole]);

  const canAny = useCallback((permissions: ResourceAction[]): boolean => {
    if (!userRole) return false;
    return hasAnyPermission(userRole, permissions);
  }, [userRole]);

  const canAll = useCallback((permissions: ResourceAction[]): boolean => {
    if (!userRole) return false;
    return hasAllPermissions(userRole, permissions);
  }, [userRole]);

  const canEditResource = useCallback((resourceOwnerId?: string): boolean => {
    if (!userRole || !userId) return false;
    return utilCanEditResource(userRole, userId, resourceOwnerId);
  }, [userRole, userId]);

  const canViewResource = useCallback((resourceType: string, resourceOwnerId?: string): boolean => {
    if (!userRole || !userId) return false;
    return utilCanViewResource(userRole, userId, resourceType, resourceOwnerId);
  }, [userRole, userId]);

  const getRoleFilters = useCallback((): RoleScopedFilter => {
    if (!session) {
      return { branchFilter: {} };
    }
    return buildRoleScopedFilters(session);
  }, [session]);

  return {
    can,
    canAny,
    canAll,
    canEditResource,
    canViewResource,
    getRoleFilters,
    isLoading,
    userRole,
    userId,
  };
}
