import { IPrescription } from '@/models/Prescription';

export interface PrescriptionFilters {
  page?: number;
  limit?: number;
  search?: string;
  branch?: string;
  patient?: string;
  doctor?: string;
  visit?: string;
  status?: 'active' | 'dispensed' | 'cancelled';
}

export interface PrescriptionResponse {
  prescriptions: IPrescription[];
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface MedicationData {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
}

export interface CreatePrescriptionData {
  patient: string;
  doctor: string;
  visit: string;
  branchId: string;
  medications: MedicationData[];
  diagnosis: string;
  notes?: string;
}

export interface UpdatePrescriptionData {
  medications?: MedicationData[];
  diagnosis?: string;
  notes?: string;
  status?: 'active' | 'dispensed' | 'cancelled';
  dispense?: boolean;
}

export const prescriptionService = {
  async getAll(filters: PrescriptionFilters = {}): Promise<PrescriptionResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`/api/prescriptions?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch prescriptions');
    }
    
    return response.json();
  },

  async getById(id: string): Promise<{ prescription: IPrescription }> {
    const response = await fetch(`/api/prescriptions/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch prescription');
    }
    
    return response.json();
  },

  async create(data: CreatePrescriptionData): Promise<{ message: string; prescription: IPrescription }> {
    const response = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create prescription');
    }
    
    return response.json();
  },

  async update(id: string, data: UpdatePrescriptionData): Promise<{ message: string; prescription: IPrescription }> {
    const response = await fetch(`/api/prescriptions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update prescription');
    }
    
    return response.json();
  },

  async delete(id: string): Promise<{ message: string; prescriptionNumber: string }> {
    const response = await fetch(`/api/prescriptions/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete prescription');
    }
    
    return response.json();
  },
};
