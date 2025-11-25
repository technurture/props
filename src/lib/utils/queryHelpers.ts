import { NextRequest } from 'next/server';
import { UserRole } from '@/types/emr';
import { extractBranchId } from '@/lib/middleware/branchFilter';

export interface QueryFilterOptions {
  allowCrossBranch?: boolean;
  requireBranch?: boolean;
}

/**
 * Apply branch-based filtering to database queries
 * - ADMIN users bypass all filtering
 * - MANAGER users are ALWAYS filtered to their assignedBranch (cannot view cross-branch)
 * - When allowCrossBranch is true, other non-admin users can view data from all branches
 * - When allowCrossBranch is false, all non-admin users can only view their branch's data
 * 
 * Cross-branch viewing is enabled by default for READ operations to allow inter-branch
 * communication and coordination. WRITE operations should always enforce branch restrictions.
 */
export function applyBranchFilter(
  query: any,
  user: any,
  allowCrossBranch: boolean = false,
  fieldName: string = 'branchId'
): any {
  const userRole = user?.role as UserRole;
  
  // ADMIN can bypass all filtering
  if (userRole === UserRole.ADMIN) {
    return query;
  }
  
  // MANAGER is ALWAYS restricted to their assigned branch
  if (userRole === UserRole.MANAGER) {
    const branchId = extractBranchId({ user });
    if (!branchId) {
      // Security: Default-deny if MANAGER has no branch - set impossible filter
      query[fieldName] = 'INVALID_BRANCH_NO_ACCESS';
      return query;
    }
    query[fieldName] = branchId;
    return query;
  }
  
  // For other roles, respect the allowCrossBranch parameter
  if (allowCrossBranch) {
    return query;
  }
  
  // Apply branch filtering for non-cross-branch queries
  if (user?.branch) {
    const branchId = user.branch._id || user.branch;
    query[fieldName] = branchId;
  }
  
  return query;
}

export function getBranchFilter(
  user: any,
  allowCrossBranch: boolean = false
): any {
  const userRole = user?.role as UserRole;
  
  // ADMIN can bypass all filtering
  if (userRole === UserRole.ADMIN) {
    return {};
  }
  
  // MANAGER is ALWAYS restricted to their assigned branch
  if (userRole === UserRole.MANAGER) {
    const branchId = extractBranchId({ user });
    if (!branchId) {
      // Security: Default-deny if MANAGER has no branch - return impossible filter
      return { branchId: 'INVALID_BRANCH_NO_ACCESS' };
    }
    return { branchId };
  }
  
  // For other roles, respect the allowCrossBranch parameter
  if (allowCrossBranch) {
    return {};
  }
  
  if (user?.branch) {
    const branchId = user.branch._id || user.branch;
    return { branchId };
  }
  
  return {};
}

export function shouldAllowCrossBranch(req: NextRequest): boolean {
  const { searchParams } = new URL(req.url);
  return searchParams.get('allBranches') === 'true';
}

export function getUserBranchId(user: any): string | null {
  // Use extractBranchId to properly handle MANAGER's assignedBranch
  return extractBranchId({ user });
}

export function isAdminUser(user: any): boolean {
  return user?.role === UserRole.ADMIN;
}

/**
 * Check if a user can EDIT/DELETE a resource based on branch ownership
 * - ADMIN users have full access
 * - MANAGER users can edit/delete resources from their assigned branch only
 * - Other non-admin users can only edit/delete resources from their own branch
 * 
 * Note: This function enforces WRITE restrictions. For READ operations,
 * cross-branch viewing is enabled by default for non-MANAGER roles (see applyBranchFilter).
 */
export function canAccessResource(
  user: any,
  resourceBranchId: string | undefined | null
): boolean {
  if (isAdminUser(user)) {
    return true;
  }
  
  if (!resourceBranchId) {
    return false;
  }
  
  // Use getUserBranchId which handles MANAGER's assignedBranch correctly
  const userBranchId = getUserBranchId(user);
  
  if (!userBranchId) {
    return false;
  }
  
  return userBranchId === resourceBranchId.toString();
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export function extractPaginationParams(searchParams: URLSearchParams): PaginationParams {
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20')
  };
}

export function buildPaginationResponse(
  currentPage: number,
  totalCount: number,
  limit: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    currentPage,
    totalPages,
    totalCount,
    limit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}
