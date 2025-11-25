"use client";

import { useState, useEffect } from "react";
import { vitalSignService, CreateVitalSignsData, UpdateVitalSignsData } from "@/lib/services/vitalSignService";
import { toast } from "react-toastify";

interface VitalSignsModalProps {
  patientId: string | null;
  selectedVisit: any | null;
  isEditing: boolean;
  onVitalSignsCreated: () => void;
  onVitalSignsUpdated: () => void;
  onClose: () => void;
}

const VitalSignsModal = ({
  patientId,
  selectedVisit,
  isEditing,
  onVitalSignsCreated,
  onVitalSignsUpdated,
  onClose,
}: VitalSignsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<any[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const [formData, setFormData] = useState({
    visitId: selectedVisit?._id || selectedVisit?.visitId || "",
    bloodPressure: "",
    temperature: "",
    pulse: "",
    weight: "",
    height: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<any>({});
  const [calculatedBMI, setCalculatedBMI] = useState<string>("");

  useEffect(() => {
    if (selectedVisit && isEditing) {
      const vs = selectedVisit.vitalSigns || {};
      setFormData({
        visitId: selectedVisit._id || selectedVisit.visitId || "",
        bloodPressure: vs.bloodPressure || "",
        temperature: vs.temperature?.toString() || "",
        pulse: vs.pulse?.toString() || "",
        weight: vs.weight?.toString() || "",
        height: vs.height?.toString() || "",
        notes: selectedVisit.notes || "",
      });
    }
  }, [selectedVisit, isEditing]);

  useEffect(() => {
    if (!isEditing && patientId) {
      fetchVisits();
    }
  }, [isEditing, patientId]);

  useEffect(() => {
    calculateBMI();
  }, [formData.weight, formData.height]);

  const fetchVisits = async () => {
    if (!patientId) return;

    try {
      setLoadingVisits(true);
      const response = await fetch(
        `/api/visits?patient=${patientId}&status=in_progress,completed&limit=50`
      );
      const data = await response.json();
      setVisits(data.visits || []);
    } catch (error) {
      console.error("Error fetching visits:", error);
      toast.error("Failed to load visits");
      setVisits([]);
    } finally {
      setLoadingVisits(false);
    }
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);

    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      setCalculatedBMI(bmi.toFixed(1));
    } else {
      setCalculatedBMI("");
    }
  };

  const validateBloodPressure = (bp: string): boolean => {
    if (!bp) return true;
    const regex = /^\d{2,3}\/\d{2,3}$/;
    if (!regex.test(bp)) return false;

    const [systolic, diastolic] = bp.split("/").map(Number);
    return systolic >= 80 && systolic <= 200 && diastolic >= 50 && diastolic <= 120;
  };

  const validateForm = () => {
    const errors: any = {};

    if (!formData.visitId) {
      errors.visitId = "Visit is required";
    }

    if (formData.bloodPressure && !validateBloodPressure(formData.bloodPressure)) {
      errors.bloodPressure = "Invalid BP format (e.g., 120/80). Range: 80/50-200/120";
    }

    const temp = parseFloat(formData.temperature);
    if (formData.temperature && (temp < 35 || temp > 42)) {
      errors.temperature = "Temperature must be between 35-42°C";
    }

    const pulse = parseFloat(formData.pulse);
    if (formData.pulse && (pulse < 40 || pulse > 200)) {
      errors.pulse = "Pulse must be between 40-200 bpm";
    }

    const weight = parseFloat(formData.weight);
    if (formData.weight && (weight < 0.5 || weight > 500)) {
      errors.weight = "Weight must be between 0.5-500 kg";
    }

    const height = parseFloat(formData.height);
    if (formData.height && (height < 20 || height > 300)) {
      errors.height = "Height must be between 20-300 cm";
    }

    if (
      !formData.bloodPressure &&
      !formData.temperature &&
      !formData.pulse &&
      !formData.weight &&
      !formData.height
    ) {
      errors.general = "At least one vital sign must be recorded";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setLoading(true);

      const vitalSignsData = {
        bloodPressure: formData.bloodPressure || undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        pulse: formData.pulse ? parseFloat(formData.pulse) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        bmi: calculatedBMI ? parseFloat(calculatedBMI) : undefined,
      };

      if (isEditing) {
        const data: UpdateVitalSignsData = {
          vitalSigns: vitalSignsData,
          notes: formData.notes || undefined,
        };

        await vitalSignService.update(formData.visitId, data);
        toast.success("Vital signs updated successfully");
        onVitalSignsUpdated();
      } else {
        const data: CreateVitalSignsData = {
          visitId: formData.visitId,
          vitalSigns: vitalSignsData,
          notes: formData.notes || undefined,
        };

        await vitalSignService.create(data);
        toast.success("Vital signs recorded successfully");
        onVitalSignsCreated();
      }

      handleModalClose();
    } catch (error: any) {
      console.error("Error saving vital signs:", error);
      toast.error(error.message || "Failed to save vital signs");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setFormData({
      visitId: "",
      bloodPressure: "",
      temperature: "",
      pulse: "",
      weight: "",
      height: "",
      notes: "",
    });
    setFormErrors({});
    setCalculatedBMI("");
    onClose();
  };

  const getBMICategory = (bmi: number): { category: string; className: string } => {
    if (bmi < 18.5) return { category: "Underweight", className: "text-warning" };
    if (bmi < 25) return { category: "Normal", className: "text-success" };
    if (bmi < 30) return { category: "Overweight", className: "text-warning" };
    return { category: "Obese", className: "text-danger" };
  };

  const bmiInfo = calculatedBMI ? getBMICategory(parseFloat(calculatedBMI)) : null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isEditing ? "Edit Vital Signs" : "Record Vital Signs"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleModalClose}
              disabled={loading}
            />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {loadingVisits && !isEditing ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  {!isEditing && (
                    <div className="mb-3">
                      <label className="form-label">
                        Visit <span className="text-danger">*</span>
                      </label>
                      {visits.length === 0 ? (
                        <div className="alert alert-warning mb-0">
                          <i className="ti ti-alert-triangle me-2" />
                          No active visits found for this patient. Please create a visit first.
                        </div>
                      ) : (
                        <select
                          className={`form-select ${formErrors.visitId ? "is-invalid" : ""}`}
                          value={formData.visitId}
                          onChange={(e) =>
                            setFormData({ ...formData, visitId: e.target.value })
                          }
                          disabled={loading}
                        >
                          <option value="">Select Visit</option>
                          {visits.map((visit) => (
                            <option key={visit._id} value={visit._id}>
                              {visit.visitNumber} - {new Date(visit.visitDate).toLocaleDateString()} (
                              {visit.status})
                            </option>
                          ))}
                        </select>
                      )}
                      {formErrors.visitId && (
                        <div className="invalid-feedback d-block">{formErrors.visitId}</div>
                      )}
                    </div>
                  )}

                  {formErrors.general && (
                    <div className="alert alert-danger">{formErrors.general}</div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Blood Pressure (mmHg)</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.bloodPressure ? "is-invalid" : ""}`}
                        value={formData.bloodPressure}
                        onChange={(e) =>
                          setFormData({ ...formData, bloodPressure: e.target.value })
                        }
                        placeholder="e.g., 120/80"
                        disabled={loading}
                      />
                      {formErrors.bloodPressure && (
                        <div className="invalid-feedback">{formErrors.bloodPressure}</div>
                      )}
                      <small className="text-muted">Format: systolic/diastolic (e.g., 120/80)</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={`form-control ${formErrors.temperature ? "is-invalid" : ""}`}
                        value={formData.temperature}
                        onChange={(e) =>
                          setFormData({ ...formData, temperature: e.target.value })
                        }
                        placeholder="e.g., 37.5"
                        disabled={loading}
                      />
                      {formErrors.temperature && (
                        <div className="invalid-feedback">{formErrors.temperature}</div>
                      )}
                      <small className="text-muted">Normal range: 36.5-37.5°C</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Pulse (bpm)</label>
                      <input
                        type="number"
                        className={`form-control ${formErrors.pulse ? "is-invalid" : ""}`}
                        value={formData.pulse}
                        onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                        placeholder="e.g., 72"
                        disabled={loading}
                      />
                      {formErrors.pulse && (
                        <div className="invalid-feedback">{formErrors.pulse}</div>
                      )}
                      <small className="text-muted">Normal range: 60-100 bpm</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={`form-control ${formErrors.weight ? "is-invalid" : ""}`}
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="e.g., 70.5"
                        disabled={loading}
                      />
                      {formErrors.weight && (
                        <div className="invalid-feedback">{formErrors.weight}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={`form-control ${formErrors.height ? "is-invalid" : ""}`}
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="e.g., 175"
                        disabled={loading}
                      />
                      {formErrors.height && (
                        <div className="invalid-feedback">{formErrors.height}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">BMI</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={calculatedBMI || "Auto-calculated"}
                          disabled
                          readOnly
                        />
                        {bmiInfo && (
                          <span className={`input-group-text ${bmiInfo.className}`}>
                            {bmiInfo.category}
                          </span>
                        )}
                      </div>
                      <small className="text-muted">
                        Auto-calculated from weight and height
                      </small>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional observations..."
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleModalClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (visits.length === 0 && !isEditing)}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    {isEditing ? "Updating..." : "Recording..."}
                  </>
                ) : isEditing ? (
                  "Update Vital Signs"
                ) : (
                  "Record Vital Signs"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsModal;
