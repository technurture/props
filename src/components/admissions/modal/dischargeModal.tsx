"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";
import CommonDatePicker from "@/core/common-components/common-date-picker/commonDatePicker";

interface DischargeModalProps {
  admissionId: string;
  patientName: string;
  onSuccess: () => void;
}

const DischargeModal = ({ admissionId, patientName, onSuccess }: DischargeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeSummary: "",
    dischargeNotes: ""
  });

  const resetForm = () => {
    setFormData({
      dischargeDate: new Date().toISOString().split('T')[0],
      dischargeSummary: "",
      dischargeNotes: ""
    });
  };

  useEffect(() => {
    resetForm();
  }, [admissionId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: any) => {
    if (date) {
      setFormData(prev => ({ ...prev, [name]: date.format('YYYY-MM-DD') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dischargeDate) {
      toast.error("Discharge date is required");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(`/api/admissions/${admissionId}/discharge`, formData, {
        successMessage: "Patient discharged successfully"
      });

      onSuccess();
      
      const modalElement = document.getElementById("discharge_modal");
      if (modalElement) {
        const bootstrap = await import('bootstrap/dist/js/bootstrap.bundle.min.js');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      }

      resetForm();
    } catch (error: any) {
      console.error("Discharge failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="discharge_modal">
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Discharge Patient</h4>
            <button
              type="button"
              className="btn-close custom-btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <p className="text-muted">
                  You are about to discharge <strong>{patientName}</strong>
                </p>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Discharge Date <span className="text-danger">*</span>
                </label>
                <div className="input-icon-start position-relative">
                  <input
                    type="date"
                    className="form-control"
                    name="dischargeDate"
                    value={formData.dischargeDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dischargeDate: e.target.value }))}
                    placeholder="Select Date"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Discharge Summary</label>
                <textarea
                  className="form-control"
                  name="dischargeSummary"
                  value={formData.dischargeSummary}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter discharge summary"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Discharge Notes</label>
                <textarea
                  className="form-control"
                  name="dischargeNotes"
                  value={formData.dischargeNotes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter discharge notes"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light border"
                data-bs-dismiss="modal"
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
                    Discharging...
                  </>
                ) : (
                  "Discharge Patient"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DischargeModal;
