"use client";

import { useState, useEffect } from "react";
import { prescriptionService, CreatePrescriptionData, UpdatePrescriptionData } from "@/lib/services/prescriptionService";
import { toast } from "react-toastify";
import { IPrescription } from "@/models/Prescription";

interface PrescriptionModalProps {
  selectedPrescription: any | null;
  isEditing: boolean;
  isViewing?: boolean;
  patientId: string | null;
  onPrescriptionCreated: () => void;
  onPrescriptionUpdated: () => void;
  onClose: () => void;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
}

const PrescriptionModal = ({
  selectedPrescription,
  isEditing,
  isViewing = false,
  patientId,
  onPrescriptionCreated,
  onPrescriptionUpdated,
  onClose,
}: PrescriptionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [createFormData, setCreateFormData] = useState<{
    patient: string;
    doctor: string;
    visit: string;
    medications: Medication[];
    diagnosis: string;
    notes: string;
  }>({
    patient: patientId || "",
    doctor: "",
    visit: "",
    medications: [
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        quantity: 0,
      },
    ],
    diagnosis: "",
    notes: "",
  });

  const [editFormData, setEditFormData] = useState<{
    medications: Medication[];
    diagnosis: string;
    notes: string;
    status: "active" | "dispensed" | "cancelled";
  }>({
    medications: [],
    diagnosis: "",
    notes: "",
    status: "active",
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    if (selectedPrescription && isEditing) {
      setEditFormData({
        medications: selectedPrescription.medications || [],
        diagnosis: selectedPrescription.diagnosis || "",
        notes: selectedPrescription.notes || "",
        status: selectedPrescription.status || "active",
      });
    }
  }, [selectedPrescription, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      fetchDropdownData(patientId || undefined);
    }
  }, [isEditing, patientId]);

  const fetchDropdownData = async (selectedPatientId?: string) => {
    try {
      setLoadingDropdowns(true);
      const [patientsRes, doctorsRes] = await Promise.all([
        fetch("/api/patients?limit=100").then((res) => res.json()),
        fetch("/api/doctors?limit=100").then((res) => res.json()),
      ]);

      setPatients(patientsRes.patients || []);
      setDoctors(doctorsRes.doctors || []);

      if (selectedPatientId) {
        const visitsRes = await fetch(
          `/api/visits?patient=${selectedPatientId}&limit=50`
        ).then((res) => res.json());
        setVisits(visitsRes.visits || []);
      }
    } catch (error: any) {
      console.error("Error fetching dropdown data:", error);
      toast.error("Failed to load form data");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handlePatientChange = async (selectedPatientId: string) => {
    setCreateFormData({ ...createFormData, patient: selectedPatientId, visit: "" });
    if (selectedPatientId) {
      try {
        const visitsRes = await fetch(
          `/api/visits?patient=${selectedPatientId}&limit=50`
        ).then((res) => res.json());
        setVisits(visitsRes.visits || []);
      } catch (error) {
        console.error("Error fetching visits:", error);
        setVisits([]);
      }
    } else {
      setVisits([]);
    }
  };

  const addMedication = () => {
    if (isEditing) {
      setEditFormData({
        ...editFormData,
        medications: [
          ...editFormData.medications,
          {
            name: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
            quantity: 0,
          },
        ],
      });
    } else {
      setCreateFormData({
        ...createFormData,
        medications: [
          ...createFormData.medications,
          {
            name: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
            quantity: 0,
          },
        ],
      });
    }
  };

  const removeMedication = (index: number) => {
    if (isEditing) {
      const newMedications = editFormData.medications.filter((_, i) => i !== index);
      setEditFormData({ ...editFormData, medications: newMedications });
    } else {
      const newMedications = createFormData.medications.filter((_, i) => i !== index);
      setCreateFormData({ ...createFormData, medications: newMedications });
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    if (isEditing) {
      const newMedications = [...editFormData.medications];
      newMedications[index] = { ...newMedications[index], [field]: value };
      setEditFormData({ ...editFormData, medications: newMedications });
    } else {
      const newMedications = [...createFormData.medications];
      newMedications[index] = { ...newMedications[index], [field]: value };
      setCreateFormData({ ...createFormData, medications: newMedications });
    }
  };

  const validateCreateForm = () => {
    const errors: any = {};
    if (!createFormData.patient) errors.patient = "Patient is required";
    if (!createFormData.doctor) errors.doctor = "Doctor is required";
    if (!createFormData.visit) errors.visit = "Visit is required";
    if (!createFormData.diagnosis) errors.diagnosis = "Diagnosis is required";

    if (createFormData.medications.length === 0) {
      errors.medications = "At least one medication is required";
    } else {
      createFormData.medications.forEach((med, index) => {
        if (!med.name) errors[`medication_${index}_name`] = "Medication name is required";
        if (!med.dosage) errors[`medication_${index}_dosage`] = "Dosage is required";
        if (!med.frequency) errors[`medication_${index}_frequency`] = "Frequency is required";
        if (!med.duration) errors[`medication_${index}_duration`] = "Duration is required";
        if (!med.quantity || med.quantity <= 0)
          errors[`medication_${index}_quantity`] = "Valid quantity is required";
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors: any = {};
    if (!editFormData.diagnosis) errors.diagnosis = "Diagnosis is required";

    if (editFormData.medications.length === 0) {
      errors.medications = "At least one medication is required";
    } else {
      editFormData.medications.forEach((med, index) => {
        if (!med.name) errors[`medication_${index}_name`] = "Medication name is required";
        if (!med.dosage) errors[`medication_${index}_dosage`] = "Dosage is required";
        if (!med.frequency) errors[`medication_${index}_frequency`] = "Frequency is required";
        if (!med.duration) errors[`medication_${index}_duration`] = "Duration is required";
        if (!med.quantity || med.quantity <= 0)
          errors[`medication_${index}_quantity`] = "Valid quantity is required";
      });
    }

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

      const selectedVisit = visits.find((v) => v._id === createFormData.visit);
      const branchId = selectedVisit?.branchId?._id || selectedVisit?.branchId;

      if (!branchId) {
        toast.error("Branch ID not found for the selected visit");
        return;
      }

      const data: CreatePrescriptionData = {
        patient: createFormData.patient,
        doctor: createFormData.doctor,
        visit: createFormData.visit,
        branchId: branchId,
        medications: createFormData.medications,
        diagnosis: createFormData.diagnosis,
        notes: createFormData.notes || undefined,
      };

      await prescriptionService.create(data);
      toast.success("Prescription created successfully");
      onPrescriptionCreated();
      handleModalClose();
    } catch (error: any) {
      console.error("Error creating prescription:", error);
      toast.error(error.message || "Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEditForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedPrescription?._id) {
      toast.error("No prescription selected");
      return;
    }

    try {
      setLoading(true);

      const data: UpdatePrescriptionData = {
        medications: editFormData.medications,
        diagnosis: editFormData.diagnosis,
        notes: editFormData.notes || undefined,
        status: editFormData.status,
      };

      await prescriptionService.update(selectedPrescription._id, data);
      toast.success("Prescription updated successfully");
      onPrescriptionUpdated();
      handleModalClose();
    } catch (error: any) {
      console.error("Error updating prescription:", error);
      toast.error(error.message || "Failed to update prescription");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setCreateFormData({
      patient: patientId || "",
      doctor: "",
      visit: "",
      medications: [
        {
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
          quantity: 0,
        },
      ],
      diagnosis: "",
      notes: "",
    });
    setEditFormData({
      medications: [],
      diagnosis: "",
      notes: "",
      status: "active",
    });
    setFormErrors({});
    onClose();
  };

  const medications = isEditing ? editFormData.medications : createFormData.medications;

  if (isViewing && selectedPrescription) {
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
                Prescription Details - {selectedPrescription.prescriptionNumber}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Prescription Number</label>
                  <p className="mb-0">{selectedPrescription.prescriptionNumber || "N/A"}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Date</label>
                  <p className="mb-0">
                    {selectedPrescription.createdAt
                      ? new Date(selectedPrescription.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Prescribed By</label>
                  <p className="mb-0">
                    {selectedPrescription.doctor
                      ? `Dr. ${selectedPrescription.doctor.firstName} ${selectedPrescription.doctor.lastName}`
                      : "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Status</label>
                  <p className="mb-0">
                    <span className={`badge ${
                      selectedPrescription.status === "dispensed"
                        ? "bg-success"
                        : selectedPrescription.status === "active"
                        ? "bg-info"
                        : "bg-danger"
                    }`}>
                      {selectedPrescription.status?.charAt(0).toUpperCase() + selectedPrescription.status?.slice(1)}
                    </span>
                  </p>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Diagnosis</label>
                  <p className="mb-0">{selectedPrescription.diagnosis || "N/A"}</p>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Medications</label>
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                          <th>Quantity</th>
                          <th>Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescription.medications?.map((med: any, index: number) => (
                          <tr key={index}>
                            <td>{med.name}</td>
                            <td>{med.dosage}</td>
                            <td>{med.frequency}</td>
                            <td>{med.duration}</td>
                            <td>{med.quantity}</td>
                            <td>{med.instructions || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {selectedPrescription.notes && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">Notes</label>
                    <p className="mb-0">{selectedPrescription.notes}</p>
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
    );
  }

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
              {isEditing ? "Edit Prescription" : "Create Prescription"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleModalClose}
              disabled={loading}
            />
          </div>
          <form onSubmit={isEditing ? handleEditSubmit : handleCreateSubmit}>
            <div className="modal-body">
              {loadingDropdowns && !isEditing ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  {!isEditing && (
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label">
                          Patient <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${formErrors.patient ? "is-invalid" : ""}`}
                          value={createFormData.patient}
                          onChange={(e) => handlePatientChange(e.target.value)}
                          disabled={loading || !!patientId}
                        >
                          <option value="">Select Patient</option>
                          {patients.map((patient) => (
                            <option key={patient._id} value={patient._id}>
                              {patient.firstName} {patient.lastName}
                            </option>
                          ))}
                        </select>
                        {formErrors.patient && (
                          <div className="invalid-feedback">{formErrors.patient}</div>
                        )}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">
                          Doctor <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${formErrors.doctor ? "is-invalid" : ""}`}
                          value={createFormData.doctor}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, doctor: e.target.value })
                          }
                          disabled={loading}
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

                      <div className="col-md-4">
                        <label className="form-label">
                          Visit <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${formErrors.visit ? "is-invalid" : ""}`}
                          value={createFormData.visit}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, visit: e.target.value })
                          }
                          disabled={loading || !createFormData.patient}
                        >
                          <option value="">Select Visit</option>
                          {visits.map((visit) => (
                            <option key={visit._id} value={visit._id}>
                              {visit.visitNumber} - {new Date(visit.visitDate).toLocaleDateString()}
                            </option>
                          ))}
                        </select>
                        {formErrors.visit && (
                          <div className="invalid-feedback">{formErrors.visit}</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label mb-0">
                        Medications <span className="text-danger">*</span>
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={addMedication}
                        disabled={loading}
                      >
                        <i className="ti ti-plus me-1" />
                        Add Medication
                      </button>
                    </div>

                    {medications.map((medication, index) => (
                      <div key={index} className="border rounded p-3 mb-2 position-relative">
                        {medications.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                            onClick={() => removeMedication(index)}
                            disabled={loading}
                          >
                            <i className="ti ti-x" />
                          </button>
                        )}

                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <label className="form-label">
                              Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className={`form-control ${
                                formErrors[`medication_${index}_name`] ? "is-invalid" : ""
                              }`}
                              value={medication.name}
                              onChange={(e) => updateMedication(index, "name", e.target.value)}
                              disabled={loading}
                            />
                            {formErrors[`medication_${index}_name`] && (
                              <div className="invalid-feedback">
                                {formErrors[`medication_${index}_name`]}
                              </div>
                            )}
                          </div>

                          <div className="col-md-3 mb-2">
                            <label className="form-label">
                              Dosage <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className={`form-control ${
                                formErrors[`medication_${index}_dosage`] ? "is-invalid" : ""
                              }`}
                              value={medication.dosage}
                              onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                              placeholder="e.g., 500mg"
                              disabled={loading}
                            />
                            {formErrors[`medication_${index}_dosage`] && (
                              <div className="invalid-feedback">
                                {formErrors[`medication_${index}_dosage`]}
                              </div>
                            )}
                          </div>

                          <div className="col-md-3 mb-2">
                            <label className="form-label">
                              Quantity <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              className={`form-control ${
                                formErrors[`medication_${index}_quantity`] ? "is-invalid" : ""
                              }`}
                              value={medication.quantity}
                              onChange={(e) =>
                                updateMedication(index, "quantity", parseInt(e.target.value) || 0)
                              }
                              disabled={loading}
                              min="1"
                            />
                            {formErrors[`medication_${index}_quantity`] && (
                              <div className="invalid-feedback">
                                {formErrors[`medication_${index}_quantity`]}
                              </div>
                            )}
                          </div>

                          <div className="col-md-6 mb-2">
                            <label className="form-label">
                              Frequency <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className={`form-control ${
                                formErrors[`medication_${index}_frequency`] ? "is-invalid" : ""
                              }`}
                              value={medication.frequency}
                              onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                              placeholder="e.g., 3 times daily"
                              disabled={loading}
                            />
                            {formErrors[`medication_${index}_frequency`] && (
                              <div className="invalid-feedback">
                                {formErrors[`medication_${index}_frequency`]}
                              </div>
                            )}
                          </div>

                          <div className="col-md-6 mb-2">
                            <label className="form-label">
                              Duration <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className={`form-control ${
                                formErrors[`medication_${index}_duration`] ? "is-invalid" : ""
                              }`}
                              value={medication.duration}
                              onChange={(e) => updateMedication(index, "duration", e.target.value)}
                              placeholder="e.g., 7 days"
                              disabled={loading}
                            />
                            {formErrors[`medication_${index}_duration`] && (
                              <div className="invalid-feedback">
                                {formErrors[`medication_${index}_duration`]}
                              </div>
                            )}
                          </div>

                          <div className="col-12 mb-2">
                            <label className="form-label">Instructions</label>
                            <textarea
                              className="form-control"
                              rows={2}
                              value={medication.instructions}
                              onChange={(e) =>
                                updateMedication(index, "instructions", e.target.value)
                              }
                              placeholder="e.g., Take after meals"
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Diagnosis <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className={`form-control ${formErrors.diagnosis ? "is-invalid" : ""}`}
                      rows={3}
                      value={isEditing ? editFormData.diagnosis : createFormData.diagnosis}
                      onChange={(e) =>
                        isEditing
                          ? setEditFormData({ ...editFormData, diagnosis: e.target.value })
                          : setCreateFormData({ ...createFormData, diagnosis: e.target.value })
                      }
                      disabled={loading}
                    />
                    {formErrors.diagnosis && (
                      <div className="invalid-feedback">{formErrors.diagnosis}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={isEditing ? editFormData.notes : createFormData.notes}
                      onChange={(e) =>
                        isEditing
                          ? setEditFormData({ ...editFormData, notes: e.target.value })
                          : setCreateFormData({ ...createFormData, notes: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  {isEditing && (
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editFormData.status}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            status: e.target.value as "active" | "dispensed" | "cancelled",
                          })
                        }
                        disabled={loading}
                      >
                        <option value="active">Active</option>
                        <option value="dispensed">Dispensed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
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
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Prescription"
                ) : (
                  "Create Prescription"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;
