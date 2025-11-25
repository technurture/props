import { apiClient } from './api-client';
import { Branch, PaginationInfo } from '@/types/emr';

export interface BranchesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface BranchesResponse {
  branches: Branch[];
  pagination: PaginationInfo;
}

export const getBranches = async (params: BranchesParams = {}): Promise<BranchesResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));

  const url = `/api/branches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  return apiClient.get<BranchesResponse>(url, {
    showErrorToast: true,
  });
};

export const getBranch = async (id: string): Promise<Branch> => {
  return apiClient.get<Branch>(`/api/branches/${id}`, {
    showErrorToast: true,
  });
};

export const createBranch = async (data: Partial<Branch>): Promise<Branch> => {
  return apiClient.post<Branch>('/api/branches', data, {
    successMessage: 'Branch created successfully',
    showSuccessToast: true,
    showErrorToast: true,
  });
};

export const updateBranch = async (id: string, data: Partial<Branch>): Promise<Branch> => {
  return apiClient.put<Branch>(`/api/branches/${id}`, data, {
    successMessage: 'Branch updated successfully',
    showSuccessToast: true,
    showErrorToast: true,
  });
};

export const deleteBranch = async (id: string): Promise<void> => {
  return apiClient.delete<void>(`/api/branches/${id}`, {
    successMessage: 'Branch deleted successfully',
    showSuccessToast: true,
    showErrorToast: true,
  });
};
