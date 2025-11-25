import { UserRole } from '@/types/emr';

export type Permission = string;

export type ResourceAction = 
  | 'patient:read'
  | 'patient:create'
  | 'patient:update'
  | 'patient:delete'
  | 'appointment:read'
  | 'appointment:create'
  | 'appointment:update'
  | 'appointment:delete'
  | 'appointment:assign'
  | 'admission:read'
  | 'admission:create'
  | 'admission:update'
  | 'admission:discharge'
  | 'vitals:read'
  | 'vitals:create'
  | 'vitals:update'
  | 'diagnosis:read'
  | 'diagnosis:create'
  | 'diagnosis:update'
  | 'prescription:read'
  | 'prescription:create'
  | 'prescription:update'
  | 'prescription:delete'
  | 'lab:read'
  | 'lab:create'
  | 'lab:update'
  | 'lab:delete'
  | 'lab:approve'
  | 'pharmacy:read'
  | 'pharmacy:create'
  | 'pharmacy:update'
  | 'pharmacy:dispense'
  | 'billing:read'
  | 'billing:create'
  | 'billing:update'
  | 'billing:delete'
  | 'billing:process'
  | 'accounting:read'
  | 'accounting:create'
  | 'accounting:update'
  | 'accounting:reports'
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'staff_directory:read'
  | 'branch:read'
  | 'branch:create'
  | 'branch:update'
  | 'branch:delete'
  | 'service_charge:read'
  | 'service_charge:create'
  | 'service_charge:update'
  | 'service_charge:delete'
  | 'settings:read'
  | 'settings:update'
  | 'reports:read'
  | 'reports:generate';

export const ROLE_PERMISSIONS: Record<UserRole, ResourceAction[]> = {
  [UserRole.ADMIN]: [
    'patient:read',
    'patient:create',
    'patient:update',
    'patient:delete',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:delete',
    'appointment:assign',
    'admission:read',
    'admission:create',
    'admission:update',
    'admission:discharge',
    'vitals:read',
    'vitals:create',
    'vitals:update',
    'diagnosis:read',
    'diagnosis:create',
    'diagnosis:update',
    'prescription:read',
    'prescription:create',
    'prescription:update',
    'prescription:delete',
    'lab:read',
    'lab:create',
    'lab:update',
    'lab:delete',
    'lab:approve',
    'pharmacy:read',
    'pharmacy:create',
    'pharmacy:update',
    'pharmacy:dispense',
    'billing:read',
    'billing:create',
    'billing:update',
    'billing:delete',
    'billing:process',
    'accounting:read',
    'accounting:create',
    'accounting:update',
    'accounting:reports',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'staff_directory:read',
    'branch:read',
    'branch:create',
    'branch:update',
    'branch:delete',
    'service_charge:read',
    'service_charge:create',
    'service_charge:update',
    'service_charge:delete',
    'settings:read',
    'settings:update',
    'reports:read',
    'reports:generate',
  ],
  [UserRole.MANAGER]: [
    'patient:read',
    'patient:create',
    'patient:update',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:assign',
    'admission:read',
    'admission:create',
    'admission:update',
    'admission:discharge',
    'vitals:read',
    'vitals:create',
    'vitals:update',
    'diagnosis:read',
    'prescription:read',
    'lab:read',
    'lab:create',
    'lab:update',
    'pharmacy:read',
    'pharmacy:create',
    'pharmacy:update',
    'billing:read',
    'billing:create',
    'billing:update',
    'billing:process',
    'accounting:read',
    'accounting:reports',
    'user:read',
    'staff_directory:read',
    'branch:read',
    'service_charge:read',
    'service_charge:create',
    'service_charge:update',
    'settings:read',
    'reports:read',
    'reports:generate',
  ],
  [UserRole.FRONT_DESK]: [
    'patient:read',
    'patient:create',
    'patient:update',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:assign',
    'admission:read',
    'admission:create',
    'billing:read',
    'billing:create',
    'billing:update',
    'billing:process',
    'staff_directory:read',
    'reports:read',
  ],
  [UserRole.NURSE]: [
    'patient:read',
    'appointment:read',
    'appointment:update',
    'admission:read',
    'admission:update',
    'vitals:read',
    'vitals:create',
    'vitals:update',
    'prescription:read',
    'lab:read',
    'pharmacy:read',
    'staff_directory:read',
  ],
  [UserRole.DOCTOR]: [
    'patient:read',
    'patient:update',
    'appointment:read',
    'appointment:update',
    'admission:read',
    'admission:create',
    'admission:update',
    'admission:discharge',
    'vitals:read',
    'vitals:create',
    'vitals:update',
    'diagnosis:read',
    'diagnosis:create',
    'diagnosis:update',
    'prescription:read',
    'prescription:create',
    'prescription:update',
    'prescription:delete',
    'lab:read',
    'pharmacy:read',
    'staff_directory:read',
    'reports:read',
  ],
  [UserRole.LAB]: [
    'patient:read',
    'appointment:read',
    'lab:read',
    'lab:create',
    'lab:update',
    'lab:approve',
    'staff_directory:read',
    'reports:read',
  ],
  [UserRole.PHARMACY]: [
    'patient:read',
    'appointment:read',
    'prescription:read',
    'pharmacy:read',
    'pharmacy:create',
    'pharmacy:update',
    'pharmacy:dispense',
    'staff_directory:read',
    'reports:read',
  ],
  [UserRole.BILLING]: [
    'patient:read',
    'appointment:read',
    'billing:read',
    'billing:create',
    'billing:update',
    'billing:process',
    'service_charge:read',
    'service_charge:create',
    'service_charge:update',
    'staff_directory:read',
    'reports:read',
  ],
  [UserRole.ACCOUNTING]: [
    'patient:read',
    'billing:read',
    'accounting:read',
    'accounting:create',
    'accounting:update',
    'accounting:reports',
    'service_charge:read',
    'service_charge:create',
    'service_charge:update',
    'service_charge:delete',
    'staff_directory:read',
    'reports:read',
    'reports:generate',
  ],
};

export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.MANAGER]: 90,
  [UserRole.DOCTOR]: 80,
  [UserRole.NURSE]: 60,
  [UserRole.LAB]: 50,
  [UserRole.PHARMACY]: 50,
  [UserRole.BILLING]: 40,
  [UserRole.ACCOUNTING]: 40,
  [UserRole.FRONT_DESK]: 30,
};

export function hasPermission(
  userRole: UserRole,
  requiredPermission: ResourceAction
): boolean {
  try {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    
    if (!rolePermissions) {
      return false;
    }

    return rolePermissions.includes(requiredPermission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export function hasAnyPermission(
  userRole: UserRole,
  requiredPermissions: ResourceAction[]
): boolean {
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(
  userRole: UserRole,
  requiredPermissions: ResourceAction[]
): boolean {
  return requiredPermissions.every(permission => hasPermission(userRole, permission));
}

export function getRolePermissions(userRole: UserRole): ResourceAction[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  return roleHierarchy[role1] > roleHierarchy[role2];
}

export function canAccessResource(
  userRole: UserRole,
  resourceAction: ResourceAction,
  resourceOwnerId?: string,
  userId?: string
): boolean {
  if (!hasPermission(userRole, resourceAction)) {
    return false;
  }

  if (resourceOwnerId && userId && resourceOwnerId !== userId) {
    if (userRole === UserRole.ADMIN) {
      return true;
    }
    
    const readOnlyAction = resourceAction.endsWith(':read');
    return readOnlyAction;
  }

  return true;
}
