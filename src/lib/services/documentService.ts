/**
 * Document Service
 * 
 * This service handles patient document operations including upload, retrieval, and management.
 * 
 * IMPORTANT: Type Definitions
 * ---------------------------
 * This file defines TWO sets of interfaces to handle different API response patterns:
 * 
 * 1. PatientDocument - Used for CREATE/UPDATE operations where references are string IDs
 * 2. PatientDocumentPopulated - Used for GET operations where references are populated objects
 * 
 * The Document API automatically populates related objects (patient, branchId, uploadedBy) 
 * when retrieving documents, so all GET methods return PatientDocumentPopulated.
 */

/**
 * Populated patient reference as returned by the API
 * Includes only the fields selected in the populate query
 */
export interface PopulatedPatient {
  _id: string;
  firstName: string;
  lastName: string;
  patientId: string;
  phoneNumber: string;
}

/**
 * Populated branch reference as returned by the API
 * Includes only the fields selected in the populate query
 */
export interface PopulatedBranch {
  _id: string;
  name: string;
}

/**
 * Populated user reference as returned by the API
 * Includes only the fields selected in the populate query
 */
export interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
}

/**
 * Base Patient Document interface
 * Used for CREATE and UPDATE operations where references are string IDs
 * Note: Date fields are ISO 8601 strings as returned by REST APIs, not Date objects
 */
export interface PatientDocument {
  _id: string;
  patient: string;
  documentName: string;
  documentType: 'lab_report' | 'imaging' | 'prescription' | 'consent_form' | 'medical_record' | 'insurance' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  /** ISO 8601 date string */
  uploadedAt: string;
  visit?: string;
  labTest?: string;
  prescription?: string;
  notes?: string;
  tags?: string[];
  branchId: string;
  isActive: boolean;
  /** ISO 8601 date string */
  createdAt: string;
  /** ISO 8601 date string */
  updatedAt: string;
}

/**
 * Populated Patient Document interface
 * Used for GET operations where the API returns populated objects
 * 
 * The Document API automatically populates:
 * - patient: Full patient object with firstName, lastName, patientId, phoneNumber
 * - branchId: Branch object with name
 * - uploadedBy: User object with firstName, lastName
 * 
 * Note: Date fields are ISO 8601 strings as returned by REST APIs, not Date objects
 */
export interface PatientDocumentPopulated {
  _id: string;
  patient: PopulatedPatient;
  documentName: string;
  documentType: 'lab_report' | 'imaging' | 'prescription' | 'consent_form' | 'medical_record' | 'insurance' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: PopulatedUser;
  /** ISO 8601 date string */
  uploadedAt: string;
  visit?: string;
  labTest?: string;
  prescription?: string;
  notes?: string;
  tags?: string[];
  branchId: PopulatedBranch;
  isActive: boolean;
  /** ISO 8601 date string */
  createdAt: string;
  /** ISO 8601 date string */
  updatedAt: string;
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  search?: string;
  patient?: string;
  documentType?: string;
  visit?: string;
  branch?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Response from GET /api/documents
 * Returns populated documents with full related objects
 */
export interface DocumentResponse {
  documents: PatientDocumentPopulated[];
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

/**
 * Data required to create a new document
 * Uses string IDs for all references
 */
export interface CreateDocumentData {
  patient: string;
  documentName: string;
  documentType: 'lab_report' | 'imaging' | 'prescription' | 'consent_form' | 'medical_record' | 'insurance' | 'other';
  file: File;
  visit?: string;
  labTest?: string;
  prescription?: string;
  notes?: string;
  tags?: string[];
  branchId: string;
}

/**
 * Data allowed for updating an existing document
 * Does not include file or reference updates
 */
export interface UpdateDocumentData {
  documentName?: string;
  documentType?: string;
  notes?: string;
  tags?: string[];
}

export const documentService = {
  /**
   * Get documents for a specific patient
   * @returns Populated documents with full related objects
   */
  async getByPatient(patientId: string, filters: DocumentFilters = {}): Promise<DocumentResponse> {
    const params = new URLSearchParams({
      patient: patientId,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      )
    });

    const response = await fetch(`/api/documents?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch documents');
    }
    
    return response.json();
  },

  /**
   * Get all documents with optional filters
   * @returns Populated documents with full related objects
   */
  async getAll(filters: DocumentFilters = {}): Promise<DocumentResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`/api/documents?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch documents');
    }
    
    return response.json();
  },

  /**
   * Get a single document by ID
   * @returns Populated document with full related objects
   */
  async getById(id: string): Promise<{ document: PatientDocumentPopulated }> {
    const response = await fetch(`/api/documents/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch document');
    }
    
    return response.json();
  },

  /**
   * Upload a new document
   * @returns Populated document with full related objects
   */
  async upload(data: CreateDocumentData): Promise<{ message: string; document: PatientDocumentPopulated }> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('patient', data.patient);
    formData.append('documentName', data.documentName);
    formData.append('documentType', data.documentType);
    formData.append('branchId', data.branchId);
    
    if (data.visit) formData.append('visit', data.visit);
    if (data.labTest) formData.append('labTest', data.labTest);
    if (data.prescription) formData.append('prescription', data.prescription);
    if (data.notes) formData.append('notes', data.notes);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));

    const response = await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload document');
    }
    
    return response.json();
  },

  /**
   * Update an existing document
   * @returns Populated document with full related objects
   */
  async update(id: string, data: UpdateDocumentData): Promise<{ message: string; document: PatientDocumentPopulated }> {
    const response = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update document');
    }
    
    return response.json();
  },

  /**
   * Delete a document
   * @returns Success message with document name
   */
  async delete(id: string): Promise<{ message: string; documentName: string }> {
    const response = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete document');
    }
    
    return response.json();
  },

  /**
   * Download a document file
   * @returns Blob containing the file data
   */
  async download(id: string): Promise<Blob> {
    const response = await fetch(`/api/documents/${id}/download`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to download document');
    }
    
    return response.blob();
  },
};
