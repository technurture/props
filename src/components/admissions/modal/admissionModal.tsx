"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonSelect from "@/core/common-components/common-select/commonSelect";
import CommonDatePicker from "@/core/common-components/common-date-picker/commonDatePicker";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";

interface AdmissionModalProps {
  onSuccess: () => void;
  selectedAdmission?: any;
  editAdmissionId?: string | null;
  preSelectedPatientId?: string;
}

interface PatientOption {
  value: string;
  label: string;
}

interface DoctorOption {
  value: string;
  label: string;
}

interface PatientsResponse {
  patients: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  }>;
}

interface DoctorsResponse {
  doctors: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
}

interface AdmissionResponse {
  admission: {
    admissionNumber: string;
    patientId: { _id: string } | string;
    type: string;
    admittingDoctorId: { _id: string } | string;
    primaryDoctorId: { _id: string } | string;
    ward?: string;
    room?: string;
    bed?: string;
    admissionReason: string;
    diagnosis?: string;
    treatmentPlan?: string;
    dailyRate?: number;
    expectedDischargeDate?: string;
  };
}

const admissionTypeOptions = [
  { value: "EMERGENCY", label: "Emergency" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "OBSERVATION", label: "Observation" },
  { value: "DAY_CARE", label: "Day Care" }
];

const AdmissionModal = ({ 
  onSuccess, 
  selectedAdmission, 
  editAdmissionId,
  preSelectedPatientId 
}: AdmissionModalProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [formData, setFormData] = useState({
    admissionNumber: `ADM${Date.now().toString().slice(-6)}`,
    patientId: preSelectedPatientId || "",
    type: "",
    admittingDoctorId: "",
    primaryDoctorId: "",
    ward: "",
    room: "",
    bed: "",
    admissionReason: "",
    diagnosis: "",
    treatmentPlan: "",
    dailyRate: "",
    expectedDischargeDate: "",
  });

  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    fetchPatientsAndDoctors();
  }, []);

  useEffect(() => {
    if (preSelectedPatientId) {
      setFormData(prev => ({ ...prev, patientId: preSelectedPatientId }));
    }
  }, [preSelectedPatientId]);

  useEffect(() => {
    if (editAdmissionId) {
      fetchAdmissionDetails(editAdmissionId);
    } else {
      resetForm();
    }
  }, [editAdmissionId]);

  const fetchPatientsAndDoctors = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        apiClient.get<PatientsResponse>('/api/patients?limit=1000'),
        apiClient.get<DoctorsResponse>('/api/doctors?limit=1000')
      ]);

      const patientOptions = patientsRes.patients?.map((patient) => ({
        value: patient._id,
        label: `${patient.firstName} ${patient.lastName} (${patient.patientId})`
      })) || [];

      const doctorOptions = doctorsRes.doctors?.map((doctor) => ({
        value: doctor._id,
        label: `Dr. ${doctor.firstName} ${doctor.lastName}`
      })) || [];

      setPatients(patientOptions);
      setDoctors(doctorOptions);
    } catch (error) {
      console.error("Failed to fetch patients/doctors:", error);
    }
  };

  const fetchAdmissionDetails = async (id: string) => {
    setLoadingData(true);
    try {
      const response = await apiClient.get<AdmissionResponse>(`/api/admissions/${id}`);
      const admission = response.admission;
      
      setEditData(admission);

      setFormData({
        admissionNumber: admission.admissionNumber,
        patientId: typeof admission.patientId === 'string' ? admission.patientId : admission.patientId._id,
        type: admission.type,
        admittingDoctorId: typeof admission.admittingDoctorId === 'string' ? admission.admittingDoctorId : admission.admittingDoctorId._id,
        primaryDoctorId: typeof admission.primaryDoctorId === 'string' ? admission.primaryDoctorId : admission.primaryDoctorId._id,
        ward: admission.ward || "",
        room: admission.room || "",
        bed: admission.bed || "",
        admissionReason: admission.admissionReason,
        diagnosis: admission.diagnosis || "",
        treatmentPlan: admission.treatmentPlan || "",
        dailyRate: admission.dailyRate?.toString() || "",
        expectedDischargeDate: admission.expectedDischargeDate ? new Date(admission.expectedDischargeDate).toISOString().split('T')[0] : "",
      });
    } catch (error) {
      console.error("Failed to fetch admission details:", error);
      toast.error("Failed to load admission details");
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      admissionNumber: `ADM${Date.now().toString().slice(-6)}`,
      patientId: preSelectedPatientId || "",
      type: "",
      admittingDoctorId: "",
      primaryDoctorId: "",
      ward: "",
      room: "",
      bed: "",
      admissionReason: "",
      diagnosis: "",
      treatmentPlan: "",
      dailyRate: "",
      expectedDischargeDate: "",
    });
    setEditData(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: any) => {
    if (date) {
      setFormData(prev => ({ ...prev, [name]: date.format('YYYY-MM-DD') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const requiredFields = [
      { field: 'patientId', label: 'Patient' },
      { field: 'type', label: 'Admission Type' },
      { field: 'admittingDoctorId', label: 'Admitting Doctor' },
      { field: 'primaryDoctorId', label: 'Primary Doctor' },
      { field: 'admissionReason', label: 'Admission Reason' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`${label} is required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const branchId = session?.user?.branch?._id || session?.user?.branch;
      
      if (!branchId) {
        toast.error("Branch information is missing");
        return;
      }

      const payload: any = {
        admissionNumber: formData.admissionNumber,
        patientId: formData.patientId,
        branchId: branchId,
        type: formData.type,
        admittingDoctorId: formData.admittingDoctorId,
        primaryDoctorId: formData.primaryDoctorId,
        admissionReason: formData.admissionReason,
      };

      if (formData.ward) payload.ward = formData.ward;
      if (formData.room) payload.room = formData.room;
      if (formData.bed) payload.bed = formData.bed;
      if (formData.diagnosis) payload.diagnosis = formData.diagnosis;
      if (formData.treatmentPlan) payload.treatmentPlan = formData.treatmentPlan;
      if (formData.dailyRate) payload.dailyRate = parseFloat(formData.dailyRate);
      if (formData.expectedDischargeDate) payload.expectedDischargeDate = formData.expectedDischargeDate;

      if (editAdmissionId) {
        await apiClient.put(`/api/admissions/${editAdmissionId}`, payload, {
          successMessage: "Admission updated successfully"
        });
      } else {
        await apiClient.post("/api/admissions", payload, {
          successMessage: "Admission created successfully"
        });
      }

      resetForm();
      onSuccess();
      
      const modalElement = document.getElementById("admission_modal");
      if (modalElement) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
      }
    } catch (error: any) {
      console.error("Admission operation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    resetForm();
    const modalElement = document.getElementById("admission_modal");
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
  };

  return (
    <div className="modal fade" id="admission_modal">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <div className="d-flex align-items-center">
              <h4 className="modal-title">
                {editAdmissionId ? "Edit Admission" : "Add New Admission"}
              </h4>
            </div>
            <button
              type="button"
              className="btn-close custom-btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={handleCloseModal}
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {loadingData ? (
                <div className="d-flex justify-content-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Admission Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="admissionNumber"
                        value={formData.admissionNumber}
                        onChange={handleInputChange}
                        disabled={!!editAdmissionId}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Patient <span className="text-danger">*</span>
                      </label>
                      {editAdmissionId || preSelectedPatientId ? (
                        <input
                          type="text"
                          className="form-control"
                          value={patients.find(p => p.value === formData.patientId)?.label || ''}
                          disabled
                          readOnly
                        />
                      ) : (
                        <CommonSelect
                          className="select"
                          options={patients}
                          value={patients.find(p => p.value === formData.patientId)}
                          onChange={(option: any) => handleSelectChange('patientId', option?.value || '')}
                          placeholder="Select Patient"
                        />
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Admission Type <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={admissionTypeOptions}
                        value={admissionTypeOptions.find(t => t.value === formData.type)}
                        onChange={(option: any) => handleSelectChange('type', option?.value || '')}
                        placeholder="Select Type"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Admitting Doctor <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={doctors}
                        value={doctors.find(d => d.value === formData.admittingDoctorId)}
                        onChange={(option: any) => handleSelectChange('admittingDoctorId', option?.value || '')}
                        placeholder="Select Doctor"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Primary Doctor <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={doctors}
                        value={doctors.find(d => d.value === formData.primaryDoctorId)}
                        onChange={(option: any) => handleSelectChange('primaryDoctorId', option?.value || '')}
                        placeholder="Select Primary Doctor"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Expected Discharge Date</label>
                      <div className="input-icon-start position-relative">
                        <input
                          type="date"
                          className="form-control"
                          name="expectedDischargeDate"
                          value={formData.expectedDischargeDate}
                          onChange={handleInputChange}
                          placeholder="Select Date"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Ward</label>
                      <input
                        type="text"
                        className="form-control"
                        name="ward"
                        value={formData.ward}
                        onChange={handleInputChange}
                        placeholder="Enter ward"
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Room</label>
                      <input
                        type="text"
                        className="form-control"
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        placeholder="Enter room"
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Bed</label>
                      <input
                        type="text"
                        className="form-control"
                        name="bed"
                        value={formData.bed}
                        onChange={handleInputChange}
                        placeholder="Enter bed"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Admission Reason <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        name="admissionReason"
                        value={formData.admissionReason}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="Enter admission reason"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Diagnosis</label>
                      <textarea
                        className="form-control"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="Enter diagnosis"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Treatment Plan</label>
                      <textarea
                        className="form-control"
                        name="treatmentPlan"
                        value={formData.treatmentPlan}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Enter treatment plan"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Daily Rate</label>
                      <input
                        type="number"
                        className="form-control"
                        name="dailyRate"
                        value={formData.dailyRate}
                        onChange={handleInputChange}
                        placeholder="Enter daily rate"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light border"
                data-bs-dismiss="modal"
                onClick={handleCloseModal}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || loadingData}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  editAdmissionId ? "Update Admission" : "Create Admission"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionModal;
