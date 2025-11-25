"use client";

import { useState, useEffect } from "react";
import { visitService } from "@/lib/services/visitService";
import { toast } from "react-toastify";
import { IPatientVisit } from "@/models/PatientVisit";
import { format } from "date-fns";

interface VisitModalProps {
  selectedVisit: any | null;
  mode: "view" | "edit" | "delete";
  onVisitUpdated?: () => void;
  onVisitDeleted?: () => void;
  onClose: () => void;
}

const VisitModal = ({
  selectedVisit,
  mode,
  onVisitUpdated,
  onVisitDeleted,
  onClose,
}: VisitModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitDate: "",
    currentStage: "",
    status: "",
  });

  useEffect(() => {
    if (selectedVisit) {
      setFormData({
        visitDate: selectedVisit.visitDate
          ? format(new Date(selectedVisit.visitDate), "yyyy-MM-dd'T'HH:mm")
          : "",
        currentStage: selectedVisit.currentStage || "",
        status: selectedVisit.status || "",
      });
    }
  }, [selectedVisit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVisit?._id) {
      toast.error("Visit ID is missing");
      return;
    }

    try {
      setLoading(true);
      await visitService.update(selectedVisit._id.toString(), {
        visitDate: new Date(formData.visitDate),
        currentStage: formData.currentStage as any,
        status: formData.status as any,
      });
      toast.success("Visit updated successfully");
      onVisitUpdated?.();
      onClose();
    } catch (error: any) {
      console.error("Error updating visit:", error);
      toast.error(error.message || "Failed to update visit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVisit?._id) {
      toast.error("Visit ID is missing");
      return;
    }

    try {
      setLoading(true);
      await visitService.delete(selectedVisit._id.toString());
      toast.success("Visit cancelled successfully");
      onVisitDeleted?.();
      onClose();
    } catch (error: any) {
      console.error("Error cancelling visit:", error);
      toast.error(error.message || "Failed to cancel visit");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy, hh:mm a");
    } catch {
      return "N/A";
    }
  };

  const getStageLabel = (stage: string) => {
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (mode === "delete") {
    return (
      <>
        <div className="modal-backdrop fade show" onClick={onClose} />
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-body text-center position-relative">
                <div className="mb-2 position-relative z-1">
                  <span className="avatar avatar-md bg-danger rounded-circle">
                    <i className="ti ti-trash fs-24" />
                  </span>
                </div>
                <h5 className="mb-1">Cancel Visit</h5>
                <p className="mb-3">
                  Are you sure you want to cancel visit{" "}
                  <strong>{selectedVisit?.visitNumber}</strong>?
                  <br />
                  <small className="text-muted">
                    This will mark the visit as cancelled.
                  </small>
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    className="btn btn-white position-relative z-1 w-100"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger position-relative z-1 w-100"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        Cancelling...
                      </>
                    ) : (
                      "Yes, Cancel Visit"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (mode === "view") {
    return (
      <>
        <div className="modal-backdrop fade show" onClick={onClose} />
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Visit Details - {selectedVisit?.visitNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Visit Number
                      </label>
                      <p className="mb-0">{selectedVisit?.visitNumber || "N/A"}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Visit Date</label>
                      <p className="mb-0">
                        {selectedVisit?.visitDate
                          ? formatDateTime(selectedVisit.visitDate)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Current Stage
                      </label>
                      <p className="mb-0">
                        <span className="badge bg-primary">
                          {getStageLabel(selectedVisit?.currentStage || "")}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Status</label>
                      <p className="mb-0">
                        <span
                          className={`badge ${
                            selectedVisit?.status === "completed"
                              ? "bg-success"
                              : selectedVisit?.status === "in_progress"
                              ? "bg-info"
                              : "bg-danger"
                          }`}
                        >
                          {getStatusLabel(selectedVisit?.status || "")}
                        </span>
                      </p>
                    </div>
                  </div>

                  {selectedVisit?.stages?.nurse?.vitalSigns && (
                    <div className="col-12">
                      <div className="card border">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">
                            <i className="ti ti-heart-rate-monitor me-2 text-danger" />
                            Vital Signs
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            {selectedVisit.stages.nurse.vitalSigns.bloodPressure && (
                              <div className="col-md-4 mb-2">
                                <small className="text-muted">Blood Pressure</small>
                                <p className="mb-0">
                                  {selectedVisit.stages.nurse.vitalSigns.bloodPressure}
                                </p>
                              </div>
                            )}
                            {selectedVisit.stages.nurse.vitalSigns.temperature && (
                              <div className="col-md-4 mb-2">
                                <small className="text-muted">Temperature</small>
                                <p className="mb-0">
                                  {selectedVisit.stages.nurse.vitalSigns.temperature}°F
                                </p>
                              </div>
                            )}
                            {selectedVisit.stages.nurse.vitalSigns.pulse && (
                              <div className="col-md-4 mb-2">
                                <small className="text-muted">Pulse</small>
                                <p className="mb-0">
                                  {selectedVisit.stages.nurse.vitalSigns.pulse} bpm
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedVisit?.stages?.doctor?.diagnosis && (
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          <i className="ti ti-stethoscope me-1 text-primary" />
                          Diagnosis
                        </label>
                        <p className="mb-0">
                          {selectedVisit.stages.doctor.diagnosis}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show" style={{ display: "block" }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Visit - {selectedVisit?.visitNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                  disabled={loading}
                />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">
                      Visit Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.visitDate}
                      onChange={(e) =>
                        setFormData({ ...formData, visitDate: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Current Stage <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.currentStage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentStage: e.target.value,
                        })
                      }
                      required
                      disabled={loading}
                    >
                      <option value="">Select Stage</option>
                      <option value="front_desk">Front Desk</option>
                      <option value="nurse">Nurse</option>
                      <option value="doctor">Doctor</option>
                      <option value="lab">Lab</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="billing">Billing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      required
                      disabled={loading}
                    >
                      <option value="">Select Status</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
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
                      <span className="spinner-border spinner-border-sm me-1" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-1" />
                      Update Visit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default VisitModal;
