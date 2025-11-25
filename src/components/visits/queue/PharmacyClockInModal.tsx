"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { apiClient } from '@/lib/services/api-client';
import { PatientVisit } from '@/types/emr';
import { emitClockInEvent } from '@/lib/utils/queue-events';

interface PharmacyClockInModalProps {
  visit: PatientVisit;
  patientInfo: {
    name: string;
    patientId: string;
  };
  onSuccess: () => void;
  show: boolean;
  onHide: () => void;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
}

interface Prescription {
  _id: string;
  prescriptionNumber: string;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  status: string;
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export default function PharmacyClockInModal({
  visit,
  patientInfo,
  onSuccess,
  show,
  onHide,
}: PharmacyClockInModalProps) {
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const frontDeskNotes = visit.stages?.frontDesk?.notes;
  const vitalSigns = visit.stages?.nurse?.vitalSigns;
  const nurseNotes = visit.stages?.nurse?.notes;
  const doctorData = visit.stages?.doctor;

  useEffect(() => {
    if (show && visit._id) {
      fetchPrescriptions();
    }
  }, [show, visit._id]);

  const fetchPrescriptions = async () => {
    try {
      const response = await apiClient.get<{
        visit: any;
        prescriptions: Prescription[];
      }>(`/api/visits/${visit._id}`, { showErrorToast: false });

      const activePrescriptions = response.prescriptions.filter(
        (p) => p.status === 'active'
      );
      setPrescriptions(activePrescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (prescriptions.length > 0 && selectedPrescriptions.length === 0) {
      newErrors.prescriptions = 'Please select at least one prescription to dispense';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(
        '/api/clocking/pharmacy-clock-in',
        {
          visitId: visit._id,
          prescriptionIds: selectedPrescriptions,
          notes: formData.notes || undefined,
        },
        { successMessage: 'Medications dispensed and clocked in successfully' }
      );

      emitClockInEvent(visit._id!, 'pharmacy');
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Clock-in failed:', error);
      toast.error(error.message || 'Failed to dispense medications and clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      notes: '',
    });
    setSelectedPrescriptions([]);
    setErrors({});
    setPrescriptions([]);
    onHide();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const togglePrescriptionSelection = (prescriptionId: string) => {
    setSelectedPrescriptions((prev) => {
      if (prev.includes(prescriptionId)) {
        return prev.filter((id) => id !== prescriptionId);
      }
      return [...prev, prescriptionId];
    });

    if (errors.prescriptions) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.prescriptions;
        return newErrors;
      });
    }
  };

  const getDoctorName = (doctor: any) => {
    if (!doctor) return 'N/A';
    if (typeof doctor === 'object') {
      return `${doctor.firstName} ${doctor.lastName}`;
    }
    return 'N/A';
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="xl" dialogClassName="modal-fullscreen-sm-down">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ti ti-pill me-2" style={{ color: '#8B5CF6' }}></i>
          Clock In & Dispense Medications
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <div className="mb-3">
            <h6 className="mb-2">
              Patient: <span className="text-primary">{patientInfo.name}</span>
            </h6>
            <p className="text-muted mb-0">ID: {patientInfo.patientId}</p>
          </div>

          <hr />

          {/* Patient Journey Information */}
          <div className="mb-4">
            <h6 className="mb-3 text-secondary">
              <i className="ti ti-timeline me-2"></i>
              Patient Journey Record
            </h6>

            {/* Front Desk Notes */}
            {frontDeskNotes && (
              <div className="mb-3">
                <div className="card bg-light border-0">
                  <div className="card-body py-2">
                    <h6 className="mb-2 text-muted small">
                      <i className="ti ti-user-check me-1"></i>
                      Front Desk Notes - Attended by: {getDoctorName(visit.stages?.frontDesk?.clockedInBy)}
                    </h6>
                    <p className="mb-0 small">{frontDeskNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nurse Vital Signs */}
            {vitalSigns && (
              <div className="mb-3">
                <div className="card bg-light border-0">
                  <div className="card-body py-2">
                    <h6 className="mb-2 text-muted small">
                      <i className="ti ti-stethoscope me-1"></i>
                      Nurse - Vital Signs - Attended by: {getDoctorName(visit.stages?.nurse?.clockedInBy)}
                    </h6>
                    <div className="row g-2">
                      {vitalSigns.bloodPressure && (
                        <div className="col-md-3 col-6">
                          <div className="p-2 bg-white rounded">
                            <small className="text-muted d-block">Blood Pressure</small>
                            <strong className="small">{vitalSigns.bloodPressure}</strong>
                          </div>
                        </div>
                      )}
                      {vitalSigns.temperature && (
                        <div className="col-md-3 col-6">
                          <div className="p-2 bg-white rounded">
                            <small className="text-muted d-block">Temperature</small>
                            <strong className="small">{vitalSigns.temperature}°C</strong>
                          </div>
                        </div>
                      )}
                      {vitalSigns.pulse && (
                        <div className="col-md-3 col-6">
                          <div className="p-2 bg-white rounded">
                            <small className="text-muted d-block">Pulse</small>
                            <strong className="small">{vitalSigns.pulse} bpm</strong>
                          </div>
                        </div>
                      )}
                      {vitalSigns.weight && (
                        <div className="col-md-3 col-6">
                          <div className="p-2 bg-white rounded">
                            <small className="text-muted d-block">Weight</small>
                            <strong className="small">{vitalSigns.weight} kg</strong>
                          </div>
                        </div>
                      )}
                      {vitalSigns.height && (
                        <div className="col-md-3 col-6">
                          <div className="p-2 bg-white rounded">
                            <small className="text-muted d-block">Height</small>
                            <strong className="small">{vitalSigns.height} cm</strong>
                          </div>
                        </div>
                      )}
                      {vitalSigns.bmi && (
                        <div className="col-md-3 col-6">
                          <div className="p-2 bg-white rounded">
                            <small className="text-muted d-block">BMI</small>
                            <strong className="small">{vitalSigns.bmi}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                    {nurseNotes && (
                      <div className="mt-2">
                        <small className="text-muted d-block">Notes:</small>
                        <p className="mb-0 small">{nurseNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Diagnosis and Prescriptions */}
            {doctorData && (
              <div className="mb-3">
                <div className="card bg-light border-0">
                  <div className="card-body py-2">
                    <h6 className="mb-2 text-muted small">
                      <i className="ti ti-user-star me-1"></i>
                      Doctor - Diagnosis & Prescriptions - Attended by: {getDoctorName(visit.stages?.doctor?.clockedInBy)}
                    </h6>
                    
                    {doctorData.diagnosis && (
                      <div className="mb-2">
                        <small className="text-muted d-block">Diagnosis:</small>
                        <p className="mb-0 small"><strong>{doctorData.diagnosis}</strong></p>
                      </div>
                    )}

                    {doctorData.notes && (
                      <div className="mb-2">
                        <small className="text-muted d-block">Doctor Notes:</small>
                        <p className="mb-0 small">{doctorData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr />

          {/* Prescriptions to Dispense */}
          <div className="mb-4">
            <h6 className="mb-3">
              <i className="ti ti-prescription me-2"></i>
              Prescriptions to Dispense
            </h6>

            {prescriptions.length === 0 ? (
              <div className="alert alert-info">
                <i className="ti ti-info-circle me-2"></i>
                No active prescriptions found for this visit. You can still clock in.
              </div>
            ) : (
              <>
                {errors.prescriptions && (
                  <div className="alert alert-danger">
                    <i className="ti ti-alert-circle me-2"></i>
                    {errors.prescriptions}
                  </div>
                )}

                {prescriptions.map((prescription) => (
                  <div
                    key={prescription._id}
                    className={`card mb-3 ${
                      selectedPrescriptions.includes(prescription._id)
                        ? 'border-primary'
                        : ''
                    }`}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`prescription-${prescription._id}`}
                            checked={selectedPrescriptions.includes(prescription._id)}
                            onChange={() => togglePrescriptionSelection(prescription._id)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`prescription-${prescription._id}`}
                          >
                            <strong>Rx #{prescription.prescriptionNumber}</strong>
                          </label>
                        </div>
                        <span className="badge bg-warning">
                          {prescription.status}
                        </span>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted d-block">Prescribed by: {getDoctorName(prescription.doctor)}</small>
                        <small className="text-muted d-block">Diagnosis: {prescription.diagnosis}</small>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-sm table-bordered mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Medication</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Qty</th>
                              <th>Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prescription.medications.map((med, index) => (
                              <tr key={index}>
                                <td><strong>{med.name}</strong></td>
                                <td>{med.dosage}</td>
                                <td>{med.frequency}</td>
                                <td>{med.duration}</td>
                                <td>{med.quantity}</td>
                                <td>{med.instructions || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {prescription.notes && (
                        <div className="mt-2">
                          <small className="text-muted d-block">Prescription Notes:</small>
                          <p className="mb-0 small">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <hr />

          {/* Pharmacy Notes */}
          <div className="mb-3">
            <label htmlFor="notes" className="form-label">
              Pharmacy Notes (Optional)
            </label>
            <textarea
              id="notes"
              className="form-control"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes or observations..."
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <i className="ti ti-check me-1"></i>
                Dispense & Clock In
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
