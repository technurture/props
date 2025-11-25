"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/services/api-client";
import { Patient, Branch } from "@/types/emr";

interface VisitsModalProps {
  onVisitCreated?: () => void;
}

interface PatientsResponse {
  patients: Patient[];
}

interface BranchesResponse {
  branches: Branch[];
}

const VisitsModal = ({ onVisitCreated }: VisitsModalProps) => {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patient: '',
    branchId: '',
    visitDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientsRes, branchesRes] = await Promise.all([
        apiClient.get<PatientsResponse>('/api/patients?limit=1000', { showErrorToast: false }),
        apiClient.get<BranchesResponse>('/api/branches', { showErrorToast: false })
      ]);

      setPatients(patientsRes.patients || []);
      setBranches(branchesRes.branches || []);
      
      if (branchesRes.branches && branchesRes.branches.length > 0) {
        setFormData(prev => ({
          ...prev,
          branchId: branchesRes.branches[0]._id || ''
        }));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient || !formData.branchId) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(
        '/api/visits',
        {
          patient: formData.patient,
          branchId: formData.branchId,
          visitDate: formData.visitDate,
        },
        { successMessage: "Visit created successfully" }
      );

      const modalElement = document.getElementById('add_visit');
      if (modalElement) {
        const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
        modal?.hide();
      }

      setFormData({
        patient: '',
        branchId: branches[0]?._id || '',
        visitDate: new Date().toISOString().split('T')[0],
      });

      if (onVisitCreated) {
        onVisitCreated();
      }
    } catch (error) {
      console.error("Failed to create visit:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div id="add_visit" className="modal fade">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold text-truncate">
                Add New Visit
              </h5>
              <button
                type="button"
                className="btn-close btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-circle-x-filled" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Select Patient <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.patient}
                        onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                        required
                        disabled={loading}
                      >
                        <option value="">Choose Patient</option>
                        {patients.map((patient) => (
                          <option key={patient._id} value={patient._id}>
                            {patient.firstName} {patient.lastName} ({patient.patientId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Select Branch <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.branchId}
                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        required
                        disabled={loading}
                      >
                        <option value="">Choose Branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Date of Visit <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.visitDate}
                        onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-white"
                  data-bs-dismiss="modal"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting || loading}
                >
                  {submitting ? 'Creating...' : 'Create Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default VisitsModal;
