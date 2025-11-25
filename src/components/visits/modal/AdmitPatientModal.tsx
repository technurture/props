"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "react-bootstrap";
import CommonSelect from "@/core/common-components/common-select/commonSelect";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";

interface AdmitPatientModalProps {
  show: boolean;
  onHide: () => void;
  visitId: string;
  patientId: string;
  patientName: string;
  assignedDoctorId?: string;
  onSuccess?: () => void;
}

interface DoctorOption {
  value: string;
  label: string;
}

interface DoctorsResponse {
  doctors: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
}

const admissionTypeOptions = [
  { value: "EMERGENCY", label: "Emergency" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "OBSERVATION", label: "Observation" },
  { value: "DAY_CARE", label: "Day Care" }
];

export default function AdmitPatientModal({
  show,
  onHide,
  visitId,
  patientId,
  patientName,
  assignedDoctorId,
  onSuccess
}: AdmitPatientModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  const [formData, setFormData] = useState({
    admissionNumber: `ADM${Date.now().toString().slice(-6)}`,
    type: "",
    admittingDoctorId: session?.user?.id || "",
    primaryDoctorId: assignedDoctorId || "",
    ward: "",
    room: "",
    bed: "",
    admissionReason: "",
    diagnosis: "",
    treatmentPlan: "",
    dailyRate: "",
    expectedDischargeDate: "",
  });

  useEffect(() => {
    if (show) {
      fetchDoctors();
      setFormData(prev => ({
        ...prev,
        admissionNumber: `ADM${Date.now().toString().slice(-6)}`,
        admittingDoctorId: session?.user?.id || "",
        primaryDoctorId: assignedDoctorId || "",
      }));
    }
  }, [show, session?.user?.id, assignedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get<DoctorsResponse>('/api/doctors?limit=1000&clockedIn=true');
      const doctorOptions = response.doctors?.map((doctor) => ({
        value: doctor._id,
        label: `Dr. ${doctor.firstName} ${doctor.lastName}`
      })) || [];
      setDoctors(doctorOptions);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      admissionNumber: `ADM${Date.now().toString().slice(-6)}`,
      type: "",
      admittingDoctorId: session?.user?.id || "",
      primaryDoctorId: assignedDoctorId || "",
      ward: "",
      room: "",
      bed: "",
      admissionReason: "",
      diagnosis: "",
      treatmentPlan: "",
      dailyRate: "",
      expectedDischargeDate: "",
    });
  };

  const validateForm = () => {
    const requiredFields = [
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
        patientId: patientId,
        branchId: branchId,
        visitId: visitId,
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

      await apiClient.post("/api/admissions", payload, {
        successMessage: "Patient admitted successfully"
      });

      resetForm();
      onHide();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Admission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Admit Patient</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="alert alert-info mb-3">
            <i className="ti ti-info-circle me-2"></i>
            <strong>Patient:</strong> {patientName}
          </div>

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
                  required
                  readOnly
                />
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
                  placeholder="Select Admitting Doctor"
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
                <input
                  type="date"
                  className="form-control"
                  name="expectedDischargeDate"
                  value={formData.expectedDischargeDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
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
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-light border"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Admitting Patient...
              </>
            ) : (
              <>
                <i className="ti ti-bed me-2"></i>
                Admit Patient
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
