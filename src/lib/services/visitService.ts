import { IPatientVisit } from '@/models/PatientVisit';

export interface VisitFilters {
  page?: number;
  limit?: number;
  search?: string;
  branch?: string;
  patient?: string;
  status?: 'in_progress' | 'completed' | 'cancelled';
  currentStage?: string;
}

export interface VisitResponse {
  visits: IPatientVisit[];
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface VitalSignsData {
  bloodPressure?: string;
  temperature?: number;
  pulse?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface UpdateVisitVitalSignsData {
  vitalSigns: VitalSignsData;
  notes?: string;
}

export const visitService = {
  async getAll(filters: VisitFilters = {}): Promise<VisitResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`/api/visits?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch visits');
    }
    
    return response.json();
  },

  async getById(id: string): Promise<{ visit: IPatientVisit }> {
    const response = await fetch(`/api/visits/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch visit');
    }
    
    return response.json();
  },

  async updateVitalSigns(visitId: string, data: UpdateVisitVitalSignsData): Promise<{ message: string; visit: IPatientVisit }> {
    const response = await fetch(`/api/visits/${visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stages: {
          nurse: {
            vitalSigns: data.vitalSigns,
            notes: data.notes,
          },
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update vital signs');
    }
    
    return response.json();
  },

  async update(visitId: string, data: Partial<IPatientVisit>): Promise<{ message: string; visit: IPatientVisit }> {
    const response = await fetch(`/api/visits/${visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update visit');
    }
    
    return response.json();
  },

  async delete(visitId: string): Promise<{ message: string; visitId: string; visitNumber: string }> {
    const response = await fetch(`/api/visits/${visitId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel visit');
    }
    
    return response.json();
  },
};
