"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { apiClient } from '@/lib/services/api-client';
import { emitClockInEvent } from '@/lib/utils/queue-events';

interface NurseClockInModalProps {
  visitId: string;
  patientInfo: {
    name: string;
    patientId: string;
  };
  onSuccess: () => void;
  show: boolean;
  onHide: () => void;
}

export default function NurseClockInModal({
  visitId,
  patientInfo,
  onSuccess,
  show,
  onHide,
}: NurseClockInModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodPressure: '',
    temperature: '',
    pulse: '',
    weight: '',
    height: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bmi, setBmi] = useState<string>('');

  useEffect(() => {
    calculateBMI();
  }, [formData.weight, formData.height]);

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);

    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const bmiValue = weight / (heightInMeters * heightInMeters);
      setBmi(bmiValue.toFixed(1));
    } else {
      setBmi('');
    }
  };

  const validateBloodPressure = (bp: string): boolean => {
    if (!bp) return false;
    const regex = /^\d{2,3}\/\d{2,3}$/;
    if (!regex.test(bp)) return false;

    const [systolic, diastolic] = bp.split('/').map(Number);
    return systolic >= 80 && systolic <= 200 && diastolic >= 50 && diastolic <= 120;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bloodPressure) {
      newErrors.bloodPressure = 'Blood pressure is required';
    } else if (!validateBloodPressure(formData.bloodPressure)) {
      newErrors.bloodPressure = 'Invalid format (e.g., 120/80). Range: 80/50-200/120';
    }

    const temp = parseFloat(formData.temperature);
    if (!formData.temperature) {
      newErrors.temperature = 'Temperature is required';
    } else if (temp < 35 || temp > 42) {
      newErrors.temperature = 'Temperature must be between 35-42°C';
    }

    const pulse = parseFloat(formData.pulse);
    if (!formData.pulse) {
      newErrors.pulse = 'Pulse is required';
    } else if (pulse < 40 || pulse > 200) {
      newErrors.pulse = 'Pulse must be between 40-200 bpm';
    }

    const weight = parseFloat(formData.weight);
    if (!formData.weight) {
      newErrors.weight = 'Weight is required';
    } else if (weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    }

    if (formData.height) {
      const height = parseFloat(formData.height);
      if (height <= 0) {
        newErrors.height = 'Height must be greater than 0';
      }
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
      const vitalSigns: any = {
        bloodPressure: formData.bloodPressure,
        temperature: parseFloat(formData.temperature),
        pulse: parseFloat(formData.pulse),
        weight: parseFloat(formData.weight),
      };

      if (formData.height) {
        vitalSigns.height = parseFloat(formData.height);
      }

      if (bmi) {
        vitalSigns.bmi = parseFloat(bmi);
      }

      await apiClient.post(
        '/api/clocking/nurse-clock-in',
        {
          visitId,
          vitalSigns,
          notes: formData.notes || undefined,
        },
        { successMessage: 'Vitals recorded and clocked in successfully' }
      );

      emitClockInEvent(visitId, 'nurse');
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Clock-in failed:', error);
      toast.error(error.message || 'Failed to record vitals and clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      bloodPressure: '',
      temperature: '',
      pulse: '',
      weight: '',
      height: '',
      notes: '',
    });
    setErrors({});
    setBmi('');
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

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" dialogClassName="modal-fullscreen-sm-down">
      <Modal.Header closeButton>
        <Modal.Title>Clock In & Record Vital Signs</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <h6 className="mb-2">
              Patient: <span className="text-primary">{patientInfo.name}</span>
            </h6>
            <p className="text-muted mb-0">ID: {patientInfo.patientId}</p>
          </div>

          <hr />

          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">
                Blood Pressure <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.bloodPressure ? 'is-invalid' : ''}`}
                placeholder="e.g., 120/80"
                value={formData.bloodPressure}
                onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                disabled={loading}
              />
              {errors.bloodPressure && (
                <div className="invalid-feedback">{errors.bloodPressure}</div>
              )}
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">
                Temperature (°C) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                className={`form-control ${errors.temperature ? 'is-invalid' : ''}`}
                placeholder="e.g., 37.0"
                value={formData.temperature}
                onChange={(e) => handleInputChange('temperature', e.target.value)}
                disabled={loading}
              />
              {errors.temperature && (
                <div className="invalid-feedback">{errors.temperature}</div>
              )}
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">
                Pulse (bpm) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className={`form-control ${errors.pulse ? 'is-invalid' : ''}`}
                placeholder="e.g., 72"
                value={formData.pulse}
                onChange={(e) => handleInputChange('pulse', e.target.value)}
                disabled={loading}
              />
              {errors.pulse && (
                <div className="invalid-feedback">{errors.pulse}</div>
              )}
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">
                Weight (kg) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                className={`form-control ${errors.weight ? 'is-invalid' : ''}`}
                placeholder="e.g., 70.5"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                disabled={loading}
              />
              {errors.weight && (
                <div className="invalid-feedback">{errors.weight}</div>
              )}
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">
                Height (cm) <span className="text-muted">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.1"
                className={`form-control ${errors.height ? 'is-invalid' : ''}`}
                placeholder="e.g., 170"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                disabled={loading}
              />
              {errors.height && (
                <div className="invalid-feedback">{errors.height}</div>
              )}
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">BMI (Calculated)</label>
              <input
                type="text"
                className="form-control"
                value={bmi ? `${bmi} kg/m²` : 'Enter weight and height'}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Nurse Observations / Notes</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any observations or notes about the patient..."
              disabled={loading}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleClose}
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
                ></span>
                Recording Vitals...
              </>
            ) : (
              <>
                <i className="ti ti-check me-2"></i>
                Clock In & Record Vitals
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
