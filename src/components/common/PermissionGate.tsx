"use client";
import React from 'react';
import { ResourceAction } from '@/lib/middleware/rbac';
import { usePermissions } from '@/hooks/usePermissions';

export interface PermissionGateProps {
  required: ResourceAction | ResourceAction[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export function PermissionGate({
  required,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGateProps) {
  const { canAny, canAll, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const permissions = Array.isArray(required) ? required : [required];

  const hasPermission = requireAll 
    ? canAll(permissions)
    : canAny(permissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
