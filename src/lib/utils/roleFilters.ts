import { UserRole } from '@/types/emr';
import { Session } from 'next-auth';
import { extractBranchId } from '@/lib/middleware/branchFilter';

export interface RoleScopedFilter {
  branchFilter: Record<string, any>;
  doctorFilter?: Record<string, any>;
  nurseFilter?: Record<string, any>;
  labFilter?: Record<string, any>;
  pharmacyFilter?: Record<string, any>;
  billingFilter?: Record<string, any>;
  accountingFilter?: Record<string, any>;
  appointmentFilter?: Record<string, any>;
  patientFilter?: Record<string, any>;
  admissionFilter?: Record<string, any>;
}

export function buildRoleScopedFilters(session: Session): RoleScopedFilter {
  const userRole = session.user.role as UserRole;
  const userId = session.user.id;
  const branchId = extractBranchId(session);

  // Security: For MANAGER without valid branch, apply default-deny
  if (userRole === UserRole.MANAGER && !branchId) {
    const denyAllBranchId = 'INVALID_BRANCH_NO_ACCESS';
    return {
      branchFilter: { branchId: denyAllBranchId },
      appointmentFilter: { branchId: denyAllBranchId },
      patientFilter: { branchId: denyAllBranchId, isActive: true },
      admissionFilter: { branchId: denyAllBranchId },
      billingFilter: { branchId: denyAllBranchId },
      accountingFilter: { branchId: denyAllBranchId },
      labFilter: { branchId: denyAllBranchId },
      pharmacyFilter: { branchId: denyAllBranchId },
    };
  }

  const baseFilter = {
    branchFilter: { branchId },
  };

  switch (userRole) {
    case UserRole.ADMIN:
      return {
        ...baseFilter,
        appointmentFilter: { branchId },
        patientFilter: { branchId, isActive: true },
        admissionFilter: { branchId },
      };

    case UserRole.MANAGER:
      return {
        ...baseFilter,
        appointmentFilter: { branchId },
        patientFilter: { branchId, isActive: true },
        admissionFilter: { branchId },
        billingFilter: { branchId },
        accountingFilter: { branchId },
        labFilter: { branchId },
        pharmacyFilter: { branchId },
      };

    case UserRole.DOCTOR:
      return {
        ...baseFilter,
        doctorFilter: { doctorId: userId },
        appointmentFilter: { branchId, doctorId: userId },
        patientFilter: { branchId, isActive: true },
        admissionFilter: { branchId },
      };

    case UserRole.NURSE:
      return {
        ...baseFilter,
        nurseFilter: { nurseId: userId },
        appointmentFilter: { branchId },
        patientFilter: { branchId, isActive: true },
        admissionFilter: { branchId },
      };

    case UserRole.FRONT_DESK:
      return {
        ...baseFilter,
        appointmentFilter: { branchId },
        patientFilter: { branchId, isActive: true },
        admissionFilter: { branchId },
        billingFilter: { branchId },
      };

    case UserRole.LAB:
      return {
        ...baseFilter,
        labFilter: { branchId, status: { $in: ['pending', 'in_progress'] } },
        patientFilter: { branchId, isActive: true },
      };

    case UserRole.PHARMACY:
      return {
        ...baseFilter,
        pharmacyFilter: { branchId, status: { $in: ['pending', 'ready'] } },
        patientFilter: { branchId, isActive: true },
      };

    case UserRole.BILLING:
      return {
        ...baseFilter,
        billingFilter: { branchId, status: { $in: ['pending', 'partial'] } },
        patientFilter: { branchId, isActive: true },
      };

    case UserRole.ACCOUNTING:
      return {
        ...baseFilter,
        accountingFilter: { branchId },
        patientFilter: { branchId, isActive: true },
      };

    default:
      return baseFilter;
  }
}

export function canEditResource(
  userRole: UserRole,
  userId: string,
  resourceOwnerId?: string
): boolean {
  // Admin can edit everything
  if (userRole === UserRole.ADMIN) return true;
  
  // Validate inputs
  if (!userId) return false;
  
  // If no resource owner ID provided, DENY by default for security
  if (!resourceOwnerId) {
    return false;
  }
  
  // Strict ownership check: user must own the resource
  return userId.toString() === resourceOwnerId.toString();
}

export function canViewResource(
  userRole: UserRole,
  userId: string,
  resourceType: string,
  resourceOwnerId?: string
): boolean {
  // Admin can view everything
  if (userRole === UserRole.ADMIN) return true;
  
  // Validate required inputs
  if (!userId || !resourceType) return false;
  
  // Define resource types that allow queue-wide viewing (no ownership check needed)
  // These are resources that users can view across the branch for operational purposes
  const queueWideViewTypes: Record<UserRole, string[]> = {
    [UserRole.DOCTOR]: ['patient', 'appointment', 'visit', 'prescription', 'lab', 'diagnosis', 'vital'],
    [UserRole.NURSE]: ['patient', 'appointment', 'visit', 'vital'],
    [UserRole.LAB]: ['patient', 'lab', 'appointment'],
    [UserRole.PHARMACY]: ['patient', 'prescription', 'appointment'],
    [UserRole.BILLING]: ['patient', 'invoice', 'billing', 'appointment', 'visit'],
    [UserRole.ACCOUNTING]: ['patient', 'invoice', 'billing', 'accounting', 'appointment'],
    [UserRole.FRONT_DESK]: ['patient', 'appointment', 'visit'],
    [UserRole.MANAGER]: ['patient', 'appointment', 'visit', 'invoice', 'billing', 'accounting'],
    [UserRole.ADMIN]: []
  };
  
  // Define read-only resource types (can view but not edit unless owner)
  const readOnlyViewTypes: Record<UserRole, string[]> = {
    [UserRole.DOCTOR]: [],
    [UserRole.NURSE]: ['prescription', 'lab'],
    [UserRole.LAB]: [],
    [UserRole.PHARMACY]: [],
    [UserRole.BILLING]: [],
    [UserRole.ACCOUNTING]: [],
    [UserRole.FRONT_DESK]: ['billing', 'invoice'],
    [UserRole.MANAGER]: [],
    [UserRole.ADMIN]: []
  };
  
  // Define completely forbidden resource types
  const forbiddenTypes: Record<UserRole, string[]> = {
    [UserRole.DOCTOR]: [],
    [UserRole.NURSE]: ['accounting', 'diagnosis'],
    [UserRole.LAB]: ['prescription', 'billing', 'accounting', 'diagnosis', 'vital'],
    [UserRole.PHARMACY]: ['lab', 'billing', 'accounting', 'diagnosis', 'vital'],
    [UserRole.BILLING]: ['lab', 'prescription', 'diagnosis', 'vital'],
    [UserRole.ACCOUNTING]: ['lab', 'prescription', 'diagnosis', 'vital'],
    [UserRole.FRONT_DESK]: ['prescription', 'lab', 'diagnosis', 'vital', 'accounting'],
    [UserRole.MANAGER]: [],
    [UserRole.ADMIN]: []
  };
  
  // Check if resource type is forbidden
  const forbidden = forbiddenTypes[userRole] || [];
  if (forbidden.includes(resourceType)) {
    return false;
  }
  
  // Check if this resource type allows queue-wide viewing
  const queueTypes = queueWideViewTypes[userRole] || [];
  const readOnlyTypes = readOnlyViewTypes[userRole] || [];
  
  const allowsQueueView = queueTypes.includes(resourceType) || readOnlyTypes.includes(resourceType);
  
  if (allowsQueueView) {
    // Queue-wide viewing allowed - no ownership check needed
    return true;
  }
  
  // For all other resource types, validate ownership if resourceOwnerId provided
  if (resourceOwnerId) {
    return userId.toString() === resourceOwnerId.toString();
  }
  
  // Default DENY when ownership cannot be validated
  return false;
}
