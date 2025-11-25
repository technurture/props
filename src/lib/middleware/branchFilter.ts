import { NextRequest } from 'next/server';
import { UserRole } from '@/types/emr';

export interface BranchFilterOptions {
  allowCrossBranch?: boolean;
  requireBranch?: boolean;
}

/**
 * Extracts the appropriate branch ID from the session based on user role.
 * 
 * For MANAGER role:
 * - Returns assignedBranch if it exists (the branch they manage)
 * - Falls back to branchId if assignedBranch is not set (backward compatibility)
 * 
 * For other roles:
 * - Returns their home branchId
 * 
 * @param session - The user session object
 * @returns The branch ID as a string, or null if not found
 */
export function extractBranchId(session: any): string | null {
  const userRole = session?.user?.role as UserRole;
  
  // For MANAGER role, prioritize assignedBranch over branchId
  // This allows managers to access only their assigned branch's data
  if (userRole === UserRole.MANAGER) {
    // Check for assignedBranch first
    if (session?.user?.assignedBranch) {
      return session.user.assignedBranch._id?.toString() || session.user.assignedBranch.toString();
    }
    // Fall back to branchId for backward compatibility
    if (session?.user?.branch) {
      return session.user.branch._id?.toString() || session.user.branch.toString();
    }
    return null;
  }
  
  // For all other roles, use their home branchId
  if (!session?.user?.branch) {
    return null;
  }
  return session.user.branch._id?.toString() || session.user.branch.toString();
}

/**
 * Determines whether branch filtering should be applied for the current request.
 * 
 * Branch filtering is applied to:
 * - MANAGER: Always filtered to their assignedBranch (or branchId if not set)
 * - All other non-ADMIN roles: Filtered to their home branchId
 * 
 * Branch filtering is NOT applied to:
 * - ADMIN: Can access all branches by default
 * - ADMIN with allowCrossBranch option and allBranches=true query param
 * 
 * @param session - The user session object
 * @param req - The Next.js request object
 * @param options - Optional configuration for cross-branch access
 * @returns true if branch filtering should be applied, false otherwise
 */
export function shouldApplyBranchFilter(
  session: any,
  req: NextRequest,
  options: BranchFilterOptions = {}
): boolean {
  const userRole = session?.user?.role as UserRole;
  
  // Only ADMIN can bypass branch filtering
  if (userRole === UserRole.ADMIN) {
    const { searchParams } = new URL(req.url);
    const allBranches = searchParams.get('allBranches') === 'true';
    
    // Allow ADMIN to access all branches if explicitly requested
    if (options.allowCrossBranch && allBranches) {
      return false;
    }
  }
  
  // Apply branch filtering to all non-ADMIN roles (including MANAGER)
  return userRole !== UserRole.ADMIN;
}

export function getBranchFilterFromSession(
  session: any,
  req: NextRequest,
  options: BranchFilterOptions = {}
): string | null {
  const shouldFilter = shouldApplyBranchFilter(session, req, options);
  
  if (!shouldFilter) {
    return null;
  }
  
  const branchId = extractBranchId(session);
  
  if (!branchId && options.requireBranch) {
    throw new Error('User branch not found in session');
  }
  
  return branchId;
}

export function applyBranchFilterToQuery(
  query: any,
  session: any,
  req: NextRequest,
  options: BranchFilterOptions = {}
): void {
  const branchId = getBranchFilterFromSession(session, req, options);
  
  if (branchId) {
    const branchIdField = query.branchId !== undefined ? 'branchId' : 'branch';
    query[branchIdField] = branchId;
  }
}

/**
 * Validates if a user has access to a resource based on branch assignment.
 * 
 * Access rules:
 * - ADMIN: Full access to all branches
 * - MANAGER: Access to resources matching their assignedBranch (if set) or branchId (fallback)
 * - Other roles: Access to resources matching their home branchId
 * 
 * @param session - The user session object
 * @param resourceBranchId - The branch ID of the resource being accessed
 * @returns true if user has access, false otherwise
 */
export function validateBranchAccess(
  session: any,
  resourceBranchId: string | undefined | null
): boolean {
  const userRole = session?.user?.role as UserRole;
  
  // ADMIN has access to all branches
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Resource must have a branch ID
  if (!resourceBranchId) {
    return false;
  }
  
  // Get the appropriate branch ID for the user (handles MANAGER assignedBranch logic)
  const userBranchId = extractBranchId(session);
  
  if (!userBranchId) {
    return false;
  }
  
  // Check if user's branch matches the resource's branch
  return userBranchId.toString() === resourceBranchId.toString();
}
