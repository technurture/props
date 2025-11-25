"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { apiClient } from '@/lib/services/api-client';
import { PatientVisit } from '@/types/emr';
import MedicineAutocomplete from '@/components/shared/MedicineAutocomplete';
import LabTestAutocomplete from '@/components/shared/LabTestAutocomplete';

interface DoctorConsultationModalProps {
  visit: PatientVisit;
  patientInfo: {
    name: string;
    patientId: string;
  };
  onSuccess: () => void;
  show: boolean;
  onHide: () => void;
}

interface Prescription {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Medicine {
  _id: string;
  productName: string;
  genericName?: string;
  stock: number;
  unit: string;
  category?: string;
}

interface LabTest {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
}

interface LabOrder {
  testName: string;
  serviceChargeId?: string;
  category?: string;
}

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Before meals',
  'After meals',
];

export default function DoctorConsultationModal({
  visit,
  patientInfo,
  onSuccess,
  show,
  onHide,
}: DoctorConsultationModalProps) {
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicinesLoading, setMedicinesLoading] = useState(false);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labTestsLoading, setLabTestsLoading] = useState(false);
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExamination: '',
    diagnosis: '',
    treatmentPlan: '',
    followUpInstructions: '',
    notes: '',
  });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([
    { testName: '', serviceChargeId: '' }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vitalSigns = visit.stages?.nurse?.vitalSigns;

  // Fetch pharmacy inventory and lab tests when modal opens
  useEffect(() => {
    if (show) {
      fetchMedicines();
      fetchLabTests();
    }
  }, [show]);

  const fetchMedicines = async () => {
    setMedicinesLoading(true);
    try {
      const response = await apiClient.get<{ products: Medicine[] }>(
        '/api/pharmacy?limit=1000&status=active',
        { showErrorToast: false }
      );
      setMedicines(response.products || []);
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      // Don't show error toast, just log it
      setMedicines([]);
    } finally {
      setMedicinesLoading(false);
    }
  };

  const fetchLabTests = async () => {
    setLabTestsLoading(true);
    try {
      const response = await apiClient.get<{ serviceCharges: any[] }>(
        '/api/service-charges?category=laboratory&limit=1000&isActive=true',
        { showErrorToast: false }
      );
      // Transform service charges to LabTest format
      const transformedLabTests: LabTest[] = (response.serviceCharges || []).map((service: any) => ({
        _id: service._id,
        name: service.serviceName, // Map serviceName to name
        description: service.description,
        price: service.price,
        category: service.category,
      }));
      setLabTests(transformedLabTests);
    } catch (error) {
      console.error('Failed to fetch lab tests:', error);
      // Don't show error toast, just log it
      setLabTests([]);
    } finally {
      setLabTestsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required';
    }

    prescriptions.forEach((prescription, index) => {
      if (prescription.medicineName || prescription.dosage || prescription.frequency || prescription.duration) {
        if (!prescription.medicineName.trim()) {
          newErrors[`prescription_${index}_medicineName`] = 'Medicine name is required';
        }
        if (!prescription.dosage.trim()) {
          newErrors[`prescription_${index}_dosage`] = 'Dosage is required';
        }
        if (!prescription.frequency.trim()) {
          newErrors[`prescription_${index}_frequency`] = 'Frequency is required';
        }
        if (!prescription.duration.trim()) {
          newErrors[`prescription_${index}_duration`] = 'Duration is required';
        }
      }
    });

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
      const filledPrescriptions = prescriptions.filter(
        p => p.medicineName.trim() && p.dosage.trim() && p.frequency.trim() && p.duration.trim()
      );

      const labOrdersArray = labOrders
        .filter(order => order.testName.trim())
        .map(order => ({
          testName: order.testName.trim(),
          serviceChargeId: order.serviceChargeId,
          category: order.category || 'laboratory'
        }));

      await apiClient.post(
        '/api/clocking/doctor-clock-in',
        {
          visitId: visit._id,
          chiefComplaint: formData.chiefComplaint || undefined,
          historyOfPresentIllness: formData.historyOfPresentIllness || undefined,
          physicalExamination: formData.physicalExamination || undefined,
          diagnosis: formData.diagnosis,
          treatmentPlan: formData.treatmentPlan || undefined,
          prescriptions: filledPrescriptions.length > 0 ? filledPrescriptions : undefined,
          labOrders: labOrdersArray.length > 0 ? labOrdersArray : undefined,
          followUpInstructions: formData.followUpInstructions || undefined,
          notes: formData.notes || undefined,
        },
        { successMessage: 'Consultation recorded and clocked in successfully' }
      );

      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Clock-in failed:', error);
      toast.error(error.message || 'Failed to record consultation and clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      chiefComplaint: '',
      historyOfPresentIllness: '',
      physicalExamination: '',
      diagnosis: '',
      treatmentPlan: '',
      followUpInstructions: '',
      notes: '',
    });
    setPrescriptions([
      { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    setLabOrders([
      { testName: '', serviceChargeId: '' }
    ]);
    setErrors({});
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

  const handlePrescriptionChange = (index: number, field: keyof Prescription, value: string) => {
    const newPrescriptions = [...prescriptions];
    newPrescriptions[index] = { ...newPrescriptions[index], [field]: value };
    setPrescriptions(newPrescriptions);

    const errorKey = `prescription_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removePrescription = (index: number) => {
    if (prescriptions.length > 1) {
      const newPrescriptions = prescriptions.filter((_, i) => i !== index);
      setPrescriptions(newPrescriptions);
    }
  };

  const handleLabOrderChange = (index: number, field: keyof LabOrder, value: string, serviceChargeId?: string) => {
    const newLabOrders = [...labOrders];
    if (field === 'testName' && serviceChargeId) {
      // When a lab test is selected from autocomplete, also save the serviceChargeId and category
      const selectedLabTest = labTests.find(test => test._id === serviceChargeId);
      newLabOrders[index] = { 
        ...newLabOrders[index], 
        testName: value,
        serviceChargeId: serviceChargeId,
        category: selectedLabTest?.category || 'laboratory'
      };
    } else {
      newLabOrders[index] = { ...newLabOrders[index], [field]: value };
    }
    setLabOrders(newLabOrders);
  };

  const addLabOrder = () => {
    setLabOrders([...labOrders, { testName: '', serviceChargeId: '' }]);
  };

  const removeLabOrder = (index: number) => {
    if (labOrders.length > 1) {
      const newLabOrders = labOrders.filter((_, i) => i !== index);
      setLabOrders(newLabOrders);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="xl" dialogClassName="modal-fullscreen-sm-down">
      <Modal.Header closeButton>
        <Modal.Title>Clock In & Start Consultation</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="mb-3">
            <h6 className="mb-2">
              Patient: <span className="text-primary">{patientInfo.name}</span>
            </h6>
            <p className="text-muted mb-0">ID: {patientInfo.patientId}</p>
          </div>

          {vitalSigns && (
            <>
              <hr />
              <div className="mb-3">
                <h6 className="mb-2 text-muted">Vital Signs Summary</h6>
                <div className="row g-2">
                  {vitalSigns.bloodPressure && (
                    <div className="col-6 col-md-3">
                      <div className="p-2 bg-light rounded">
                        <small className="text-muted d-block">Blood Pressure</small>
                        <strong>{vitalSigns.bloodPressure}</strong>
                      </div>
                    </div>
                  )}
                  {vitalSigns.temperature && (
                    <div className="col-6 col-md-3">
                      <div className="p-2 bg-light rounded">
                        <small className="text-muted d-block">Temperature</small>
                        <strong>{vitalSigns.temperature}°C</strong>
                      </div>
                    </div>
                  )}
                  {vitalSigns.pulse && (
                    <div className="col-6 col-md-3">
                      <div className="p-2 bg-light rounded">
                        <small className="text-muted d-block">Pulse</small>
                        <strong>{vitalSigns.pulse} bpm</strong>
                      </div>
                    </div>
                  )}
                  {vitalSigns.weight && (
                    <div className="col-6 col-md-3">
                      <div className="p-2 bg-light rounded">
                        <small className="text-muted d-block">Weight</small>
                        <strong>{vitalSigns.weight} kg</strong>
                      </div>
                    </div>
                  )}
                  {vitalSigns.height && (
                    <div className="col-6 col-md-3">
                      <div className="p-2 bg-light rounded">
                        <small className="text-muted d-block">Height</small>
                        <strong>{vitalSigns.height} cm</strong>
                      </div>
                    </div>
                  )}
                  {vitalSigns.bmi && (
                    <div className="col-6 col-md-3">
                      <div className="p-2 bg-light rounded">
                        <small className="text-muted d-block">BMI</small>
                        <strong>{vitalSigns.bmi}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <hr />

          <div className="mb-3">
            <label className="form-label">Chief Complaint</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Enter patient's chief complaint..."
              value={formData.chiefComplaint}
              onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">History of Present Illness</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter history of present illness..."
              value={formData.historyOfPresentIllness}
              onChange={(e) => handleInputChange('historyOfPresentIllness', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Physical Examination</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter physical examination findings..."
              value={formData.physicalExamination}
              onChange={(e) => handleInputChange('physicalExamination', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Diagnosis <span className="text-danger">*</span>
            </label>
            <textarea
              className={`form-control ${errors.diagnosis ? 'is-invalid' : ''}`}
              rows={2}
              placeholder="Enter diagnosis..."
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              disabled={loading}
            />
            {errors.diagnosis && (
              <div className="invalid-feedback">{errors.diagnosis}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Treatment Plan</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter treatment plan..."
              value={formData.treatmentPlan}
              onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label mb-0">Prescriptions</label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addPrescription}
                disabled={loading}
              >
                <i className="ti ti-plus me-1"></i>Add Prescription
              </button>
            </div>
            
            {prescriptions.map((prescription, index) => (
              <div key={index} className="card mb-2">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Prescription {index + 1}</h6>
                    {prescriptions.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removePrescription(index)}
                        disabled={loading}
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    )}
                  </div>
                  
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Medicine Name</label>
                      <MedicineAutocomplete
                        value={prescription.medicineName}
                        onChange={(value) => handlePrescriptionChange(index, 'medicineName', value)}
                        className={`form-control ${errors[`prescription_${index}_medicineName`] ? 'is-invalid' : ''}`}
                        placeholder="e.g., Amoxicillin"
                        disabled={loading}
                        medicines={medicines}
                        loading={medicinesLoading}
                      />
                      {errors[`prescription_${index}_medicineName`] && (
                        <div className="invalid-feedback">{errors[`prescription_${index}_medicineName`]}</div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Dosage</label>
                      <input
                        type="text"
                        className={`form-control ${errors[`prescription_${index}_dosage`] ? 'is-invalid' : ''}`}
                        placeholder="e.g., 500mg"
                        value={prescription.dosage}
                        onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                        disabled={loading}
                      />
                      {errors[`prescription_${index}_dosage`] && (
                        <div className="invalid-feedback">{errors[`prescription_${index}_dosage`]}</div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Frequency</label>
                      <select
                        className={`form-select ${errors[`prescription_${index}_frequency`] ? 'is-invalid' : ''}`}
                        value={prescription.frequency}
                        onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Select frequency</option>
                        {FREQUENCY_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {errors[`prescription_${index}_frequency`] && (
                        <div className="invalid-feedback">{errors[`prescription_${index}_frequency`]}</div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Duration</label>
                      <input
                        type="text"
                        className={`form-control ${errors[`prescription_${index}_duration`] ? 'is-invalid' : ''}`}
                        placeholder="e.g., 7 days"
                        value={prescription.duration}
                        onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                        disabled={loading}
                      />
                      {errors[`prescription_${index}_duration`] && (
                        <div className="invalid-feedback">{errors[`prescription_${index}_duration`]}</div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label small">Instructions (Optional)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="e.g., Take with food"
                        value={prescription.instructions}
                        onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label mb-0">Lab Orders</label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addLabOrder}
                disabled={loading}
              >
                <i className="ti ti-plus me-1"></i>Add Lab Test
              </button>
            </div>
            
            {labOrders.map((order, index) => (
              <div key={index} className="card mb-2">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Lab Test {index + 1}</h6>
                    {labOrders.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeLabOrder(index)}
                        disabled={loading}
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    )}
                  </div>
                  
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label small">Test Name</label>
                      <LabTestAutocomplete
                        value={order.testName}
                        onChange={(value, serviceChargeId) => handleLabOrderChange(index, 'testName', value, serviceChargeId)}
                        className="form-control"
                        placeholder="e.g., Complete Blood Count (CBC)"
                        disabled={loading}
                        labTests={labTests}
                        loading={labTestsLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <label className="form-label">Follow-up Instructions</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Enter follow-up instructions..."
              value={formData.followUpInstructions}
              onChange={(e) => handleInputChange('followUpInstructions', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Doctor Notes</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Enter any additional notes..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={loading}
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
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="ti ti-check me-2"></i>
                Clock In & Save
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
