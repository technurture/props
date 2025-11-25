"use client";

import { useState, useEffect } from "react";
import { labTestService, CreateLabTestData, UpdateLabTestData } from "@/lib/services/labTestService";
import { toast } from "react-toastify";
import { format } from "date-fns";

interface LabResultsModalProps {
  selectedLabTest: any | null;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  onLabTestCreated: () => void;
  onLabTestUpdated: () => void;
  onLabTestDeleted: () => void;
  onClose: () => void;
}

const LabResultsModal = ({
  selectedLabTest,
  isEditing,
  setIsEditing,
  onLabTestCreated,
  onLabTestUpdated,
  onLabTestDeleted,
  onClose,
}: LabResultsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateLabTestData>({
    patient: "",
    doctor: "",
    visit: "",
    branchId: "",
    testName: "",
    testCategory: "",
    description: "",
    priority: "routine",
  });

  const [editFormData, setEditFormData] = useState({
    testName: "",
    testCategory: "",
    description: "",
    priority: "routine" as "routine" | "urgent" | "stat",
    status: "pending" as "pending" | "in_progress" | "completed" | "cancelled",
    findings: "",
    normalRange: "",
    remarks: "",
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    if (selectedLabTest && isEditing) {
      setEditFormData({
        testName: selectedLabTest.testName || "",
        testCategory: selectedLabTest.testCategory || "",
        description: selectedLabTest.description || "",
        priority: selectedLabTest.priority || "routine",
        status: selectedLabTest.status || "pending",
        findings: selectedLabTest.result?.findings || "",
        normalRange: selectedLabTest.result?.normalRange || "",
        remarks: selectedLabTest.result?.remarks || "",
      });
    }
  }, [selectedLabTest, isEditing]);

  const fetchDropdownData = async (selectedPatientId?: string) => {
    try {
      setLoadingDropdowns(true);
      const [patientsRes, doctorsRes] = await Promise.all([
        fetch("/api/patients?limit=100").then(res => res.json()),
        fetch("/api/doctors?limit=100").then(res => res.json()),
      ]);

      setPatients(patientsRes.patients || []);
      setDoctors(doctorsRes.doctors || []);

      if (selectedPatientId) {
        const visitsRes = await fetch(`/api/visits?patient=${selectedPatientId}&limit=50`).then(res => res.json());
        setVisits(visitsRes.visits || []);
      }
    } catch (error: any) {
      console.error("Error fetching dropdown data:", error);
      toast.error("Failed to load form data");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handlePatientChange = async (patientId: string) => {
    setCreateFormData({ ...createFormData, patient: patientId, visit: "" });
    if (patientId) {
      try {
        const visitsRes = await fetch(`/api/visits?patient=${patientId}&limit=50`).then(res => res.json());
        setVisits(visitsRes.visits || []);
      } catch (error) {
        console.error("Error fetching visits:", error);
        setVisits([]);
      }
    } else {
      setVisits([]);
    }
  };

  const validateCreateForm = () => {
    const errors: any = {};
    if (!createFormData.patient) errors.patient = "Patient is required";
    if (!createFormData.doctor) errors.doctor = "Doctor is required";
    if (!createFormData.visit) errors.visit = "Visit is required";
    if (!createFormData.testName) errors.testName = "Test name is required";
    if (!createFormData.testCategory) errors.testCategory = "Test category is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCreateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      const selectedVisit = visits.find(v => v._id === createFormData.visit);
      const branchId = selectedVisit?.branchId?._id || selectedVisit?.branchId;

      if (!branchId) {
        toast.error("Could not determine branch ID from visit");
        return;
      }

      const data: CreateLabTestData = {
        ...createFormData,
        branchId: branchId,
      };

      await labTestService.create(data);
      toast.success("Lab test created successfully");
      
      setCreateFormData({
        patient: "",
        doctor: "",
        visit: "",
        branchId: "",
        testName: "",
        testCategory: "",
        description: "",
        priority: "routine",
      });
      setFormErrors({});
      setVisits([]);
      
      onLabTestCreated();
      
      const modal = document.getElementById("create_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    } catch (error: any) {
      console.error("Error creating lab test:", error);
      toast.error(error.message || "Failed to create lab test");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLabTest) return;

    try {
      setLoading(true);
      
      const updateData: UpdateLabTestData = {
        testName: editFormData.testName,
        testCategory: editFormData.testCategory,
        description: editFormData.description,
        priority: editFormData.priority,
        status: editFormData.status,
      };

      if (editFormData.findings || editFormData.normalRange || editFormData.remarks) {
        updateData.result = {
          findings: editFormData.findings,
          normalRange: editFormData.normalRange,
          remarks: editFormData.remarks,
        };
      }

      await labTestService.update(selectedLabTest._id, updateData);
      toast.success("Lab test updated successfully");
      
      setIsEditing(false);
      onLabTestUpdated();
      
      const modal = document.getElementById("view_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    } catch (error: any) {
      console.error("Error updating lab test:", error);
      toast.error(error.message || "Failed to update lab test");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLabTest) return;

    try {
      setLoading(true);
      const response = await labTestService.delete(selectedLabTest._id);
      toast.success(`Lab test ${response.testNumber} deleted successfully`);
      onLabTestDeleted();
      
      const modal = document.getElementById("delete_modal");
      if (modal) {
        const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    } catch (error: any) {
      console.error("Error deleting lab test:", error);
      toast.error(error.message || "Failed to delete lab test");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy, hh:mm a");
    } catch {
      return "N/A";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "badge badge-soft-success";
      case "in_progress":
        return "badge badge-soft-info";
      case "pending":
        return "badge badge-soft-warning";
      case "cancelled":
        return "badge badge-soft-danger";
      default:
        return "badge badge-soft-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <>
      {/* Create Modal */}
      <div id="create_modal" className="modal fade" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Lab Test</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setCreateFormData({
                    patient: "",
                    doctor: "",
                    visit: "",
                    branchId: "",
                    testName: "",
                    testCategory: "",
                    description: "",
                    priority: "routine",
                  });
                  setFormErrors({});
                  setVisits([]);
                }}
              />
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Patient <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${formErrors.patient ? "is-invalid" : ""}`}
                      value={createFormData.patient}
                      onChange={(e) => handlePatientChange(e.target.value)}
                      onFocus={() => !patients.length && fetchDropdownData()}
                      disabled={loadingDropdowns}
                    >
                      <option value="">Select Patient</option>
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.firstName} {patient.lastName} ({patient.patientId})
                        </option>
                      ))}
                    </select>
                    {formErrors.patient && (
                      <div className="invalid-feedback">{formErrors.patient}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Doctor <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${formErrors.doctor ? "is-invalid" : ""}`}
                      value={createFormData.doctor}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, doctor: e.target.value })
                      }
                      onFocus={() => !doctors.length && fetchDropdownData()}
                      disabled={loadingDropdowns}
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.firstName} {doctor.lastName}
                        </option>
                      ))}
                    </select>
                    {formErrors.doctor && (
                      <div className="invalid-feedback">{formErrors.doctor}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Visit <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${formErrors.visit ? "is-invalid" : ""}`}
                      value={createFormData.visit}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, visit: e.target.value })
                      }
                      disabled={!createFormData.patient || visits.length === 0}
                    >
                      <option value="">
                        {!createFormData.patient
                          ? "Select a patient first"
                          : visits.length === 0
                          ? "No visits available for this patient"
                          : "Select Visit"}
                      </option>
                      {visits.map((visit) => (
                        <option key={visit._id} value={visit._id}>
                          {visit.visitNumber} - {formatDate(visit.visitDate)} ({visit.status})
                        </option>
                      ))}
                    </select>
                    {formErrors.visit && (
                      <div className="invalid-feedback">{formErrors.visit}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Test Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.testName ? "is-invalid" : ""}`}
                      value={createFormData.testName}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, testName: e.target.value })
                      }
                      placeholder="e.g., Complete Blood Count"
                    />
                    {formErrors.testName && (
                      <div className="invalid-feedback">{formErrors.testName}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Test Category <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.testCategory ? "is-invalid" : ""}`}
                      value={createFormData.testCategory}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, testCategory: e.target.value })
                      }
                      placeholder="e.g., Hematology"
                    />
                    {formErrors.testCategory && (
                      <div className="invalid-feedback">{formErrors.testCategory}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={createFormData.priority}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          priority: e.target.value as "routine" | "urgent" | "stat",
                        })
                      }
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={createFormData.description}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, description: e.target.value })
                      }
                      placeholder="Additional notes or instructions"
                    />
                  </div>
                </div>

                <div className="modal-footer mt-4 px-0 pb-0">
                  <button
                    type="button"
                    className="btn btn-white"
                    data-bs-dismiss="modal"
                    disabled={loading}
                    onClick={() => {
                      setCreateFormData({
                        patient: "",
                        doctor: "",
                        visit: "",
                        branchId: "",
                        testName: "",
                        testCategory: "",
                        description: "",
                        priority: "routine",
                      });
                      setFormErrors({});
                      setVisits([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Lab Test"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* View/Edit Modal */}
      <div id="view_modal" className="modal fade" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEditing ? "Edit Lab Test" : "Lab Test Details"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setIsEditing(false)}
              />
            </div>
            <div className="modal-body">
              {!selectedLabTest ? (
                <p className="text-center text-muted">No lab test selected</p>
              ) : isEditing ? (
                <form onSubmit={handleUpdateSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Test Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.testName}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, testName: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Test Category</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.testCategory}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, testCategory: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={editFormData.priority}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            priority: e.target.value as "routine" | "urgent" | "stat",
                          })
                        }
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="stat">STAT</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editFormData.status}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            status: e.target.value as "pending" | "in_progress" | "completed" | "cancelled",
                          })
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editFormData.description}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, description: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-12">
                      <h6 className="mb-3">Lab Results</h6>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Findings</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editFormData.findings}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, findings: e.target.value })
                        }
                        placeholder="Enter test findings"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Normal Range</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.normalRange}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, normalRange: e.target.value })
                        }
                        placeholder="e.g., 70-100 mg/dL"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Remarks</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.remarks}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, remarks: e.target.value })
                        }
                        placeholder="Additional remarks"
                      />
                    </div>
                  </div>

                  <div className="modal-footer mt-4 px-0 pb-0">
                    <button
                      type="button"
                      className="btn btn-white"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <p className="mb-1 text-muted">Test Number</p>
                      <h6 className="mb-0">#{selectedLabTest.testNumber}</h6>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1 text-muted">Status</p>
                      <span className={getStatusBadgeClass(selectedLabTest.status)}>
                        {getStatusLabel(selectedLabTest.status)}
                      </span>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <p className="mb-1 text-muted">Patient</p>
                      <h6 className="mb-0">
                        {selectedLabTest.patient?.firstName} {selectedLabTest.patient?.lastName}
                      </h6>
                      <small className="text-muted">{selectedLabTest.patient?.patientId}</small>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1 text-muted">Doctor</p>
                      <h6 className="mb-0">
                        Dr. {selectedLabTest.doctor?.firstName} {selectedLabTest.doctor?.lastName}
                      </h6>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <p className="mb-1 text-muted">Test Name</p>
                      <h6 className="mb-0">{selectedLabTest.testName}</h6>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1 text-muted">Category</p>
                      <h6 className="mb-0">{selectedLabTest.testCategory}</h6>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <p className="mb-1 text-muted">Priority</p>
                      <h6 className="mb-0 text-capitalize">{selectedLabTest.priority}</h6>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1 text-muted">Requested Date</p>
                      <h6 className="mb-0">{formatDate(selectedLabTest.requestedAt)}</h6>
                    </div>
                  </div>

                  {selectedLabTest.description && (
                    <div className="mb-4">
                      <p className="mb-1 text-muted">Description</p>
                      <p className="mb-0">{selectedLabTest.description}</p>
                    </div>
                  )}

                  {selectedLabTest.result && (
                    <>
                      <hr />
                      <h6 className="mb-3">Test Results</h6>
                      {selectedLabTest.result.findings && (
                        <div className="mb-3">
                          <p className="mb-1 text-muted">Findings</p>
                          <p className="mb-0">{selectedLabTest.result.findings}</p>
                        </div>
                      )}
                      {selectedLabTest.result.normalRange && (
                        <div className="mb-3">
                          <p className="mb-1 text-muted">Normal Range</p>
                          <p className="mb-0">{selectedLabTest.result.normalRange}</p>
                        </div>
                      )}
                      {selectedLabTest.result.remarks && (
                        <div className="mb-3">
                          <p className="mb-1 text-muted">Remarks</p>
                          <p className="mb-0">{selectedLabTest.result.remarks}</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="modal-footer mt-4 px-0 pb-0">
                    <button
                      type="button"
                      className="btn btn-white"
                      data-bs-dismiss="modal"
                    >
                      Close
                    </button>
                    {selectedLabTest.status !== "completed" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setIsEditing(true)}
                      >
                        <i className="ti ti-edit me-1" />
                        Edit
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative">
              <div className="mb-2 position-relative z-1">
                <span className="avatar avatar-md bg-danger rounded-circle">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="mb-1">Delete Lab Test</h5>
              <p className="mb-3">
                Are you sure you want to delete lab test{" "}
                <strong>#{selectedLabTest?.testNumber}</strong>?
                <br />
                <span className="text-danger">This action cannot be undone.</span>
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-white position-relative w-100 z-1"
                  data-bs-dismiss="modal"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative w-100 z-1"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LabResultsModal;
