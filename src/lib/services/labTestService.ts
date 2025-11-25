import { ILabTest } from '@/models/LabTest';

export interface LabTestFilters {
  page?: number;
  limit?: number;
  search?: string;
  branch?: string;
  patient?: string;
  doctor?: string;
  visit?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'routine' | 'urgent' | 'stat';
  category?: string;
}

export interface LabTestResponse {
  labTests: ILabTest[];
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface CreateLabTestData {
  patient: string;
  doctor: string;
  visit: string;
  branchId: string;
  testName: string;
  testCategory: string;
  description?: string;
  priority?: 'routine' | 'urgent' | 'stat';
}

export interface UpdateLabTestData {
  testName?: string;
  testCategory?: string;
  description?: string;
  priority?: 'routine' | 'urgent' | 'stat';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  result?: {
    findings: string;
    normalRange?: string;
    remarks?: string;
    attachments?: string[];
  };
}

export const labTestService = {
  async getAll(filters: LabTestFilters = {}): Promise<LabTestResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`/api/lab-tests?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch lab tests');
    }
    
    return response.json();
  },

  async getById(id: string): Promise<{ labTest: ILabTest }> {
    const response = await fetch(`/api/lab-tests/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch lab test');
    }
    
    return response.json();
  },

  async create(data: CreateLabTestData): Promise<{ message: string; labTest: ILabTest }> {
    const response = await fetch('/api/lab-tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create lab test');
    }
    
    return response.json();
  },

  async update(id: string, data: UpdateLabTestData): Promise<{ message: string; labTest: ILabTest }> {
    const response = await fetch(`/api/lab-tests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update lab test');
    }
    
    return response.json();
  },

  async delete(id: string): Promise<{ message: string; testNumber: string }> {
    const response = await fetch(`/api/lab-tests/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete lab test');
    }
    
    return response.json();
  },
};
