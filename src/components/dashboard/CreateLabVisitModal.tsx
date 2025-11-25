"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "react-bootstrap";
import CommonSelect from "@/core/common-components/common-select/commonSelect";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";

interface CreateLabVisitModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
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

const priorityOptions = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "stat", label: "STAT (Immediate)" }
];

const testCategoryOptions = [
  { value: "Hematology", label: "Hematology" },
  { value: "Biochemistry", label: "Biochemistry" },
  { value: "Microbiology", label: "Microbiology" },
  { value: "Immunology", label: "Immunology" },
  { value: "Radiology", label: "Radiology" },
  { value: "Pathology", label: "Pathology" },
  { value: "Cardiology", label: "Cardiology" },
  { value: "Other", label: "Other" }
];

export default function CreateLabVisitModal({
  show,
  onHide,
  onSuccess
}: CreateLabVisitModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    patientId: "",
    supervisingDoctorId: "",
    testName: "",
    testCategory: "",
    description: "",
    priority: "routine",
    frontDeskNotes: ""
  });

  useEffect(() => {
    if (show) {
      fetchDoctors();
      fetchPatients();
      resetForm();
    }
  }, [show]);

  const fetchPatients = async (search: string = "") => {
    try {
      const response = await apiClient.get<PatientsResponse>(
        `/api/patients?limit=100${search ? `&search=${search}` : ''}`
      );
      const patientOptions = response.patients?.map((patient) => ({
        value: patient._id,
        label: `${patient.firstName} ${patient.lastName} (${patient.patientId})`
      })) || [];
      setPatients(patientOptions);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

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

  const handlePatientSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      fetchPatients(value);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      supervisingDoctorId: "",
      testName: "",
      testCategory: "",
      description: "",
      priority: "routine",
      frontDeskNotes: ""
    });
    setSearchTerm("");
  };

  const validateForm = () => {
    const requiredFields = [
      { field: 'patientId', label: 'Patient' },
      { field: 'supervisingDoctorId', label: 'Supervising Doctor' },
      { field: 'testName', label: 'Test Name' },
      { field: 'testCategory', label: 'Test Category' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`${label} is required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await apiClient.post(
        '/api/visits/lab-only',
        formData,
        {
          successMessage: 'Lab visit created successfully! Patient has been added to lab queue.',
          showErrorToast: true
        }
      );

      resetForm();
      onHide();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to create lab visit:", error);
      toast.error(error.message || 'Failed to create lab visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onHide();
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      backdrop={loading ? "static" : true}
      keyboard={!loading}
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          <i className="ti ti-test-pipe-2 me-2" style={{ color: '#6F42C1' }}></i>
          Create Lab-Only Visit
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="alert alert-info d-flex align-items-start gap-2 mb-3">
          <i className="ti ti-info-circle mt-1"></i>
          <div>
            <strong>Walk-In Lab Test Request</strong>
            <p className="mb-0 mt-1">
              Use this form for patients who come directly for lab tests without a doctor consultation.
              A supervising doctor must be assigned to review the results.
            </p>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              Patient <span className="text-danger">*</span>
            </label>
            <CommonSelect
              options={patients}
              placeholder="Search and select patient..."
              value={patients.find(p => p.value === formData.patientId) || null}
              onChange={(option) => handleSelectChange('patientId', option?.value || '')}
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">
              Supervising Doctor <span className="text-danger">*</span>
            </label>
            <CommonSelect
              options={doctors}
              placeholder="Select supervising doctor..."
              value={doctors.find(d => d.value === formData.supervisingDoctorId) || null}
              onChange={(option) => handleSelectChange('supervisingDoctorId', option?.value || '')}
            />
          </div>

          <div className="col-md-8 mb-3">
            <label className="form-label">
              Test Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              name="testName"
              placeholder="e.g., Complete Blood Count (CBC)"
              value={formData.testName}
              onChange={handleInputChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">
              Priority <span className="text-danger">*</span>
            </label>
            <CommonSelect
              options={priorityOptions}
              placeholder="Select priority..."
              value={priorityOptions.find(p => p.value === formData.priority) || null}
              onChange={(option) => handleSelectChange('priority', option?.value || 'routine')}
            />
          </div>

          <div className="col-md-12 mb-3">
            <label className="form-label">
              Test Category <span className="text-danger">*</span>
            </label>
            <CommonSelect
              options={testCategoryOptions}
              placeholder="Select test category..."
              value={testCategoryOptions.find(c => c.value === formData.testCategory) || null}
              onChange={(option) => handleSelectChange('testCategory', option?.value || '')}
            />
          </div>

          <div className="col-md-12 mb-3">
            <label className="form-label">
              Test Description
            </label>
            <textarea
              className="form-control"
              name="description"
              rows={2}
              placeholder="Any additional details about the test..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="col-md-12 mb-3">
            <label className="form-label">
              Front Desk Notes
            </label>
            <textarea
              className="form-control"
              name="frontDeskNotes"
              rows={2}
              placeholder="Any notes or special instructions..."
              value={formData.frontDeskNotes}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          className="btn btn-outline-light"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating...
            </>
          ) : (
            <>
              <i className="ti ti-check me-2"></i>
              Create Lab Visit
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
