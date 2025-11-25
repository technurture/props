import { IPatient } from '@/models/Patient';

export interface PatientFilters {
  page?: number;
  limit?: number;
  search?: string;
  branch?: string;
  status?: 'active' | 'inactive';
}

export interface PatientResponse {
  patients: IPatient[];
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface PatientDetailResponse {
  patient: IPatient & {
    branchId?: {
      name: string;
      address: string;
      city: string;
      state: string;
      country: string;
      phone: string;
      email: string;
    };
    registeredBy?: {
      name: string;
      email: string;
      role: string;
    };
  };
  recentVisits?: any[];
  clockingData?: any[];
}

export const patientService = {
  async getAll(filters: PatientFilters = {}): Promise<PatientResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`/api/patients?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch patients');
    }
    
    return response.json();
  },

  async getById(id: string): Promise<PatientDetailResponse> {
    const response = await fetch(`/api/patients/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch patient');
    }
    
    return response.json();
  },

  async create(data: any): Promise<{ message: string; patient: IPatient }> {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create patient');
    }
    
    return response.json();
  },

  async update(id: string, data: any): Promise<{ message: string; patient: IPatient }> {
    const response = await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update patient');
    }
    
    return response.json();
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await fetch(`/api/patients/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete patient');
    }
    
    return response.json();
  },
};
