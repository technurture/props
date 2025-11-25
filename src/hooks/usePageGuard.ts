import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePermissions } from './usePermissions';
import { ResourceAction } from '@/lib/middleware/rbac';

export interface PageGuardConfig {
  requiredParams?: string[];
  permission?: ResourceAction;
  redirectTo?: string;
}

export type PageGuardError = 'missing_param' | 'unauthorized' | 'not_found' | null;

export interface PageGuardReturn {
  isReady: boolean;
  error: PageGuardError;
}

export function usePageGuard(config: PageGuardConfig = {}): PageGuardReturn {
  const { requiredParams = [], permission } = config;
  const searchParams = useSearchParams();
  const { can, isLoading } = usePermissions();

  const result = useMemo(() => {
    if (isLoading) {
      return { isReady: false, error: null as PageGuardError };
    }

    if (requiredParams.length > 0) {
      const missingParam = requiredParams.find(param => !searchParams.get(param));
      if (missingParam) {
        return { isReady: false, error: 'missing_param' as PageGuardError };
      }
    }

    if (permission && !can(permission)) {
      return { isReady: false, error: 'unauthorized' as PageGuardError };
    }

    return { isReady: true, error: null as PageGuardError };
  }, [requiredParams, searchParams, permission, can, isLoading]);

  return result;
}
