"use client";
import Link from "next/link";
import PatientDetailsHeader from "./PatientDetailsHeader";
import { all_routes } from "@/router/all_routes";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { patientService } from "@/lib/services/patientService";
import { IPatient } from "@/models/Patient";
import { toast } from "react-toastify";

const PatientDetailsMedicalHistoryComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  
  const [patient, setPatient] = useState<IPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    chronicConditions: [] as string[],
    medications: [] as string[],
    allergies: [] as string[],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    } else {
      setLoading(false);
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      const response = await patientService.getById(patientId);
      setPatient(response.patient);
      
      setFormData({
        chronicConditions: response.patient.chronicConditions || [],
        medications: response.patient.medications || [],
        allergies: response.patient.allergies || [],
        notes: response.patient.notes || "",
      });
    } catch (error: any) {
      console.error("Error fetching patient data:", error);
      toast.error(error.message || "Failed to fetch patient data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (patient) {
      setFormData({
        chronicConditions: patient.chronicConditions || [],
        medications: patient.medications || [],
        allergies: patient.allergies || [],
        notes: patient.notes || "",
      });
      setShowEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: string, value: string) => {
    const arrayValue = value.split(",").map(item => item.trim()).filter(item => item !== "");
    setFormData(prev => ({
      ...prev,
      [field]: arrayValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) return;
    
    try {
      setSubmitting(true);
      
      await patientService.update(patientId, {
        chronicConditions: formData.chronicConditions,
        medications: formData.medications,
        allergies: formData.allergies,
        notes: formData.notes,
      });
      
      toast.success("Medical history updated successfully");
      await fetchPatientData();
      handleCloseEditModal();
    } catch (error: any) {
      console.error("Error updating medical history:", error);
      toast.error(error.message || "Failed to update medical history");
    } finally {
      setSubmitting(false);
    }
  };

  if (!patientId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <i className="ti ti-alert-circle display-1 text-danger mb-3" />
            <h5 className="text-danger">No Patient ID Provided</h5>
            <p className="text-muted">Please select a patient to view medical history</p>
            <Link href={all_routes.patients} className="btn btn-primary mt-3">
              Go to Patients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========================
                        Start Page Content
                ========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Page Header */}
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Patient Details</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Patient Details</li>
                </ol>
              </div>
            </div>
            <Link
              href={all_routes.patients}
              className="fw-medium d-flex align-items-center"
            >
              <i className="ti ti-arrow-left me-1" />
              Back to Patient
            </Link>
          </div>
          {/* End Page Header */}
          {/* tabs start */}
          <PatientDetailsHeader />
          {/* tabs end */}
          {/* card start */}
          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Medical History
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                {!loading && patient && (
                  <button
                    onClick={handleOpenEditModal}
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#edit_medical_history_modal"
                  >
                    <i className="ti ti-edit me-1" />
                    Edit Medical History
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading medical history...</p>
                </div>
              ) : !patient ? (
                <div className="text-center py-5">
                  <i className="ti ti-alert-circle display-1 text-muted mb-3" />
                  <h5 className="text-muted">Patient Not Found</h5>
                  <p className="text-muted">Unable to load patient data</p>
                </div>
              ) : (
                <div className="row g-4">
                  {/* Chronic Conditions */}
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 d-flex align-items-center">
                          <i className="ti ti-heart-pulse me-2 text-danger" />
                          Chronic Conditions
                        </h6>
                      </div>
                      <div className="card-body">
                        {formData.chronicConditions.length === 0 ? (
                          <p className="text-muted mb-0">No chronic conditions recorded</p>
                        ) : (
                          <ul className="list-unstyled mb-0">
                            {formData.chronicConditions.map((condition, index) => (
                              <li key={index} className="mb-2">
                                <i className="ti ti-point-filled text-primary me-1" />
                                {condition}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Current Medications */}
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 d-flex align-items-center">
                          <i className="ti ti-pill me-2 text-success" />
                          Current Medications
                        </h6>
                      </div>
                      <div className="card-body">
                        {formData.medications.length === 0 ? (
                          <p className="text-muted mb-0">No medications recorded</p>
                        ) : (
                          <ul className="list-unstyled mb-0">
                            {formData.medications.map((medication, index) => (
                              <li key={index} className="mb-2">
                                <i className="ti ti-point-filled text-success me-1" />
                                {medication}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 d-flex align-items-center">
                          <i className="ti ti-alert-triangle me-2 text-warning" />
                          Allergies
                        </h6>
                      </div>
                      <div className="card-body">
                        {formData.allergies.length === 0 ? (
                          <p className="text-muted mb-0">No allergies recorded</p>
                        ) : (
                          <ul className="list-unstyled mb-0">
                            {formData.allergies.map((allergy, index) => (
                              <li key={index} className="mb-2">
                                <i className="ti ti-point-filled text-warning me-1" />
                                {allergy}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medical Notes */}
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 d-flex align-items-center">
                          <i className="ti ti-notes me-2 text-info" />
                          Medical Notes
                        </h6>
                      </div>
                      <div className="card-body">
                        {!formData.notes ? (
                          <p className="text-muted mb-0">No medical notes recorded</p>
                        ) : (
                          <p className="mb-0">{formData.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* card end */}
        </div>
        {/* End Content */}
        {/* Start Footer */}
        <CommonFooter />
        {/* End Footer */}
      </div>
      {/* ========================
                        End Page Content
                ========================= */}

      {/* Edit Medical History Modal */}
      <div 
        className={`modal fade ${showEditModal ? "show" : ""}`} 
        id="edit_medical_history_modal"
        style={{ display: showEditModal ? "block" : "none" }}
        aria-hidden={!showEditModal}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Medical History</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseEditModal}
                  aria-label="Close"
                  disabled={submitting}
                />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Chronic Conditions */}
                  <div className="col-12">
                    <label className="form-label">
                      <i className="ti ti-heart-pulse me-1 text-danger" />
                      Chronic Conditions
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter chronic conditions separated by commas (e.g., Diabetes, Hypertension, Asthma)"
                      value={formData.chronicConditions.join(", ")}
                      onChange={(e) => handleArrayInputChange("chronicConditions", e.target.value)}
                      disabled={submitting}
                    />
                    <small className="text-muted">Separate multiple conditions with commas</small>
                  </div>

                  {/* Current Medications */}
                  <div className="col-12">
                    <label className="form-label">
                      <i className="ti ti-pill me-1 text-success" />
                      Current Medications
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter current medications separated by commas (e.g., Metformin 500mg, Lisinopril 10mg)"
                      value={formData.medications.join(", ")}
                      onChange={(e) => handleArrayInputChange("medications", e.target.value)}
                      disabled={submitting}
                    />
                    <small className="text-muted">Separate multiple medications with commas</small>
                  </div>

                  {/* Allergies */}
                  <div className="col-12">
                    <label className="form-label">
                      <i className="ti ti-alert-triangle me-1 text-warning" />
                      Allergies
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter allergies separated by commas (e.g., Penicillin, Peanuts, Latex)"
                      value={formData.allergies.join(", ")}
                      onChange={(e) => handleArrayInputChange("allergies", e.target.value)}
                      disabled={submitting}
                    />
                    <small className="text-muted">Separate multiple allergies with commas</small>
                  </div>

                  {/* Medical Notes */}
                  <div className="col-12">
                    <label className="form-label">
                      <i className="ti ti-notes me-1 text-info" />
                      Medical Notes
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Enter any additional medical notes or observations"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseEditModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-1" />
                      Update Medical History
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showEditModal && <div className="modal-backdrop fade show" onClick={handleCloseEditModal} />}
    </>
  );
};

export default PatientDetailsMedicalHistoryComponent;
