import { IPatientVisit } from '@/models/PatientVisit';

export interface VitalSigns {
  bloodPressure?: string;
  temperature?: number;
  pulse?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

/**
 * Vital sign record interface
 * Note: Date fields are ISO 8601 strings as returned by REST APIs, not Date objects
 */
export interface VitalSignRecord {
  visitId: string;
  visitNumber: string;
  /** ISO 8601 date string */
  visitDate: string;
  vitalSigns: VitalSigns;
  notes?: string;
  recordedBy?: {
    id: string;
    name: string;
  };
  /** ISO 8601 date string */
  recordedAt?: string;
}

export interface VitalSignsResponse {
  vitalSigns: VitalSignRecord[];
  totalCount: number;
}

export interface CreateVitalSignsData {
  visitId: string;
  vitalSigns: VitalSigns;
  notes?: string;
}

export interface UpdateVitalSignsData {
  vitalSigns?: VitalSigns;
  notes?: string;
}

export const vitalSignService = {
  async getByPatient(patientId: string): Promise<VitalSignsResponse> {
    const response = await fetch(`/api/visits?patient=${patientId}&status=in_progress,completed`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch vital signs');
    }
    
    const data = await response.json();
    const visits: IPatientVisit[] = data.visits || [];
    
    const vitalSignRecords: VitalSignRecord[] = visits
      .filter(visit => visit.stages?.nurse?.vitalSigns)
      .map(visit => ({
        visitId: (visit._id as any)?.toString() || '',
        visitNumber: visit.visitNumber,
        visitDate: new Date(visit.visitDate).toISOString(),
        vitalSigns: visit.stages.nurse!.vitalSigns!,
        notes: visit.stages.nurse!.notes,
        recordedBy: visit.stages.nurse!.clockedInBy ? {
          id: visit.stages.nurse!.clockedInBy.toString(),
          name: 'Nurse'
        } : undefined,
        recordedAt: visit.stages.nurse!.clockedInAt ? new Date(visit.stages.nurse!.clockedInAt).toISOString() : undefined
      }));
    
    return {
      vitalSigns: vitalSignRecords,
      totalCount: vitalSignRecords.length
    };
  },

  async getByVisit(visitId: string): Promise<{ vitalSigns: VitalSignRecord | null }> {
    const response = await fetch(`/api/visits/${visitId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch visit');
    }
    
    const data = await response.json();
    const visit: IPatientVisit = data.visit;
    
    if (!visit.stages?.nurse?.vitalSigns) {
      return { vitalSigns: null };
    }
    
    const vitalSignRecord: VitalSignRecord = {
      visitId: (visit._id as any)?.toString() || '',
      visitNumber: visit.visitNumber,
      visitDate: new Date(visit.visitDate).toISOString(),
      vitalSigns: visit.stages.nurse.vitalSigns,
      notes: visit.stages.nurse.notes,
      recordedBy: visit.stages.nurse.clockedInBy ? {
        id: visit.stages.nurse.clockedInBy.toString(),
        name: 'Nurse'
      } : undefined,
      recordedAt: visit.stages.nurse.clockedInAt ? new Date(visit.stages.nurse.clockedInAt).toISOString() : undefined
    };
    
    return { vitalSigns: vitalSignRecord };
  },

  async create(data: CreateVitalSignsData): Promise<{ message: string; vitalSigns: VitalSignRecord }> {
    /**
     * DATA INTEGRITY FIX:
     * To prevent losing data from other stages, we must:
     * 1. First fetch the existing visit to get current stage data
     * 2. Merge the new vital signs into the existing stages.nurse object
     * 3. Preserve all other stage data (frontDesk, doctor, lab, pharmacy, billing)
     */
    
    // Step 1: Fetch existing visit data
    const existingVisitResponse = await fetch(`/api/visits/${data.visitId}`);
    
    if (!existingVisitResponse.ok) {
      const error = await existingVisitResponse.json();
      throw new Error(error.error || 'Failed to fetch existing visit data');
    }
    
    const existingData = await existingVisitResponse.json();
    const existingVisit: IPatientVisit = existingData.visit;
    
    // Step 2: Merge new vital signs with existing stages data
    // This preserves all existing stage information while updating only nurse stage
    const mergedStages = {
      ...existingVisit.stages, // Preserve all existing stages (frontDesk, doctor, lab, etc.)
      nurse: {
        ...existingVisit.stages?.nurse, // Preserve existing nurse stage data (clockIn, etc.)
        vitalSigns: data.vitalSigns,    // Update vital signs
        notes: data.notes,               // Update notes
      },
    };
    
    // Step 3: Send complete merged stages object to API
    const response = await fetch(`/api/visits/${data.visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stages: mergedStages, // Send complete merged stages object
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create vital signs');
    }
    
    const result = await response.json();
    const visit: IPatientVisit = result.visit;
    
    const vitalSignRecord: VitalSignRecord = {
      visitId: (visit._id as any)?.toString() || '',
      visitNumber: visit.visitNumber,
      visitDate: new Date(visit.visitDate).toISOString(),
      vitalSigns: visit.stages.nurse!.vitalSigns!,
      notes: visit.stages.nurse!.notes,
      recordedBy: visit.stages.nurse!.clockedInBy ? {
        id: visit.stages.nurse!.clockedInBy.toString(),
        name: 'Nurse'
      } : undefined,
      recordedAt: visit.stages.nurse!.clockedInAt ? new Date(visit.stages.nurse!.clockedInAt).toISOString() : undefined
    };
    
    return {
      message: result.message || 'Vital signs created successfully',
      vitalSigns: vitalSignRecord
    };
  },

  async update(visitId: string, data: UpdateVitalSignsData): Promise<{ message: string; vitalSigns: VitalSignRecord }> {
    /**
     * DATA INTEGRITY FIX:
     * To prevent losing data from other stages, we must:
     * 1. First fetch the existing visit to get current stage data
     * 2. Merge the updated vital signs into the existing stages.nurse object
     * 3. Preserve all other stage data (frontDesk, doctor, lab, pharmacy, billing)
     */
    
    // Step 1: Fetch existing visit data
    const existingVisitResponse = await fetch(`/api/visits/${visitId}`);
    
    if (!existingVisitResponse.ok) {
      const error = await existingVisitResponse.json();
      throw new Error(error.error || 'Failed to fetch existing visit data');
    }
    
    const existingData = await existingVisitResponse.json();
    const existingVisit: IPatientVisit = existingData.visit;
    
    // Step 2: Merge updated vital signs with existing stages data
    // This preserves all existing stage information while updating only nurse stage
    const mergedStages = {
      ...existingVisit.stages, // Preserve all existing stages (frontDesk, doctor, lab, etc.)
      nurse: {
        ...existingVisit.stages?.nurse, // Preserve existing nurse stage data (clockIn, etc.)
        vitalSigns: data.vitalSigns || existingVisit.stages?.nurse?.vitalSigns, // Update or keep existing
        notes: data.notes !== undefined ? data.notes : existingVisit.stages?.nurse?.notes, // Update or keep existing
      },
    };
    
    // Step 3: Send complete merged stages object to API
    const response = await fetch(`/api/visits/${visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stages: mergedStages, // Send complete merged stages object
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update vital signs');
    }
    
    const result = await response.json();
    const visit: IPatientVisit = result.visit;
    
    const vitalSignRecord: VitalSignRecord = {
      visitId: (visit._id as any)?.toString() || '',
      visitNumber: visit.visitNumber,
      visitDate: new Date(visit.visitDate).toISOString(),
      vitalSigns: visit.stages.nurse!.vitalSigns!,
      notes: visit.stages.nurse!.notes,
      recordedBy: visit.stages.nurse!.clockedInBy ? {
        id: visit.stages.nurse!.clockedInBy.toString(),
        name: 'Nurse'
      } : undefined,
      recordedAt: visit.stages.nurse!.clockedInAt ? new Date(visit.stages.nurse!.clockedInAt).toISOString() : undefined
    };
    
    return {
      message: result.message || 'Vital signs updated successfully',
      vitalSigns: vitalSignRecord
    };
  },
};
