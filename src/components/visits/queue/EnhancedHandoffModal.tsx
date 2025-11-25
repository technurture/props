"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/services/api-client';
import { useHandoff } from './useHandoff';
import { getAllowedTransitions, getStageLabel } from '@/lib/constants/stages';
import { PatientVisit, Patient } from '@/types/emr';
import { formatDistanceToNow } from 'date-fns';

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EnhancedHandoffModalProps {
  visit: PatientVisit;
  currentStage: string;
  onSuccess: () => void;
  onClose: () => void;
  isReassignment?: boolean;
}

export default function EnhancedHandoffModal({ 
  visit, 
  currentStage,
  onSuccess, 
  onClose,
  isReassignment = false
}: EnhancedHandoffModalProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [step, setStep] = useState<'select' | 'confirm'>(isReassignment ? 'confirm' : (visit.currentStage === 'returned_to_front_desk' ? 'select' : 'select'));
  const [selectedStage, setSelectedStage] = useState<string>(isReassignment ? currentStage : '');
  const [selectedDoctor, setSelectedDoctor] = useState<string>(visit.assignedDoctor?._id || '');
  const [selectedNurse, setSelectedNurse] = useState<string>(visit.assignedNurse?._id || '');
  const [selectedLab, setSelectedLab] = useState<string>(visit.assignedLab?._id || '');
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>(visit.assignedPharmacy?._id || '');
  const [selectedBilling, setSelectedBilling] = useState<string>(visit.assignedBilling?._id || '');
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [nurses, setNurses] = useState<Staff[]>([]);
  const [labStaff, setLabStaff] = useState<Staff[]>([]);
  const [pharmacyStaff, setPharmacyStaff] = useState<Staff[]>([]);
  const [billingStaff, setBillingStaff] = useState<Staff[]>([]);
  const [notes, setNotes] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingNurses, setLoadingNurses] = useState(false);
  const [loadingLab, setLoadingLab] = useState(false);
  const [loadingPharmacy, setLoadingPharmacy] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const { handoff, loading } = useHandoff();

  const allowedTransitions = getAllowedTransitions(currentStage);
  const patient = typeof visit.patient === 'string' ? null : visit.patient as Patient;

  useEffect(() => {
    if (isReassignment) {
      if (currentStage === 'doctor') {
        fetchDoctors();
      } else if (currentStage === 'nurse') {
        fetchNurses();
      } else if (currentStage === 'lab') {
        fetchLabStaff();
      } else if (currentStage === 'pharmacy') {
        fetchPharmacyStaff();
      } else if (currentStage === 'billing') {
        fetchBillingStaff();
      }
    } else {
      if (currentStage === 'returned_to_front_desk' || selectedStage === 'doctor' || (currentStage === 'nurse' && selectedStage === 'doctor')) {
        fetchDoctors();
      }
      if ((currentStage === 'front_desk' && selectedStage === 'nurse') || (currentStage === 'doctor' && selectedStage === 'nurse')) {
        fetchNurses();
      }
      if (selectedStage === 'lab') {
        fetchLabStaff();
      }
      if (selectedStage === 'pharmacy') {
        fetchPharmacyStaff();
      }
      if (selectedStage === 'billing') {
        fetchBillingStaff();
      }
    }
  }, [currentStage, selectedStage, isReassignment]);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await apiClient.get<{ doctors: Staff[] }>(
        '/api/doctors?limit=1000&clockedIn=true',
        { showErrorToast: true }
      );
      let filteredDoctors = response.doctors || [];
      if (isReassignment && userId) {
        filteredDoctors = filteredDoctors.filter(d => d._id !== userId);
      }
      setDoctors(filteredDoctors);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchNurses = async () => {
    setLoadingNurses(true);
    try {
      const response = await apiClient.get<{ staff: Staff[] }>(
        '/api/staff?role=NURSE&limit=1000&clockedIn=true',
        { showErrorToast: true }
      );
      let filteredNurses = response.staff || [];
      if (isReassignment && userId) {
        filteredNurses = filteredNurses.filter(n => n._id !== userId);
      }
      setNurses(filteredNurses);
    } catch (error) {
      console.error('Failed to fetch nurses:', error);
    } finally {
      setLoadingNurses(false);
    }
  };

  const fetchLabStaff = async () => {
    setLoadingLab(true);
    try {
      const response = await apiClient.get<{ staff: Staff[] }>(
        '/api/staff?role=LAB&limit=1000&clockedIn=true',
        { showErrorToast: true }
      );
      let filteredLab = response.staff || [];
      if (isReassignment && userId) {
        filteredLab = filteredLab.filter(l => l._id !== userId);
      }
      setLabStaff(filteredLab);
    } catch (error) {
      console.error('Failed to fetch lab staff:', error);
    } finally {
      setLoadingLab(false);
    }
  };

  const fetchPharmacyStaff = async () => {
    setLoadingPharmacy(true);
    try {
      const response = await apiClient.get<{ staff: Staff[] }>(
        '/api/staff?role=PHARMACY&limit=1000&clockedIn=true',
        { showErrorToast: true }
      );
      let filteredPharmacy = response.staff || [];
      if (isReassignment && userId) {
        filteredPharmacy = filteredPharmacy.filter(p => p._id !== userId);
      }
      setPharmacyStaff(filteredPharmacy);
    } catch (error) {
      console.error('Failed to fetch pharmacy staff:', error);
    } finally {
      setLoadingPharmacy(false);
    }
  };

  const fetchBillingStaff = async () => {
    setLoadingBilling(true);
    try {
      const response = await apiClient.get<{ staff: Staff[] }>(
        '/api/staff?role=BILLING&limit=1000&clockedIn=true',
        { showErrorToast: true }
      );
      let filteredBilling = response.staff || [];
      if (isReassignment && userId) {
        filteredBilling = filteredBilling.filter(b => b._id !== userId);
      }
      setBillingStaff(filteredBilling);
    } catch (error) {
      console.error('Failed to fetch billing staff:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedStage('');
  };

  const handleConfirm = async () => {
    if (!selectedStage) return;

    try {
      if (isReassignment) {
        let updatePayload: any = {};
        
        if (currentStage === 'nurse' && selectedNurse) {
          updatePayload.assignedNurse = selectedNurse;
        } else if (currentStage === 'doctor' && selectedDoctor) {
          updatePayload.assignedDoctor = selectedDoctor;
        } else if (currentStage === 'lab' && selectedLab) {
          updatePayload.assignedLab = selectedLab;
        } else if (currentStage === 'pharmacy' && selectedPharmacy) {
          updatePayload.assignedPharmacy = selectedPharmacy;
        } else if (currentStage === 'billing' && selectedBilling) {
          updatePayload.assignedBilling = selectedBilling;
        }

        if (Object.keys(updatePayload).length > 0) {
          await apiClient.put(
            `/api/visits/${visit._id}`,
            updatePayload,
            { showErrorToast: true }
          );
          onSuccess();
          onClose();
        }
      } else {
        if (((currentStage === 'front_desk' && selectedStage === 'nurse') || (currentStage === 'doctor' && selectedStage === 'nurse')) && selectedNurse && selectedNurse !== visit.assignedNurse?._id) {
          await apiClient.put(
            `/api/visits/${visit._id}`,
            { assignedNurse: selectedNurse },
            { showErrorToast: true }
          );
        }

        if ((currentStage === 'returned_to_front_desk' || selectedStage === 'doctor' || (currentStage === 'nurse' && selectedStage === 'doctor')) && selectedDoctor && selectedDoctor !== visit.assignedDoctor?._id) {
          await apiClient.put(
            `/api/visits/${visit._id}`,
            { assignedDoctor: selectedDoctor },
            { showErrorToast: true }
          );
        }

        if (selectedStage === 'lab' && selectedLab && selectedLab !== visit.assignedLab?._id) {
          await apiClient.put(
            `/api/visits/${visit._id}`,
            { assignedLab: selectedLab },
            { showErrorToast: true }
          );
        }

        if (selectedStage === 'pharmacy' && selectedPharmacy && selectedPharmacy !== visit.assignedPharmacy?._id) {
          await apiClient.put(
            `/api/visits/${visit._id}`,
            { assignedPharmacy: selectedPharmacy },
            { showErrorToast: true }
          );
        }

        if (selectedStage === 'billing' && selectedBilling && selectedBilling !== visit.assignedBilling?._id) {
          await apiClient.put(
            `/api/visits/${visit._id}`,
            { assignedBilling: selectedBilling },
            { showErrorToast: true }
          );
        }

        await handoff({
          visitId: visit._id!,
          currentStage,
          targetStage: selectedStage,
          notes: notes || undefined,
          onSuccess: () => {
            onSuccess();
            onClose();
          },
        });
      }
    } catch (error) {
      console.error('Failed to handoff:', error);
    }
  };

  const getWaitingTime = () => {
    const clockInTime = visit.stages[currentStage as keyof typeof visit.stages]?.clockedInAt;
    if (!clockInTime) return 'N/A';
    try {
      return formatDistanceToNow(new Date(clockInTime), { addSuffix: false });
    } catch {
      return 'N/A';
    }
  };

  const getVitalsSummary = () => {
    if (!visit.stages.nurse?.vitalSigns) return null;
    const vitals = visit.stages.nurse.vitalSigns;
    return (
      <div className="alert alert-info mb-3">
        <h6 className="alert-heading mb-2">
          <i className="ti ti-heartbeat me-2"></i>
          Recent Vital Signs
        </h6>
        <div className="row g-2 small">
          {vitals.bloodPressure && (
            <div className="col-6">
              <strong>BP:</strong> {vitals.bloodPressure}
            </div>
          )}
          {vitals.temperature && (
            <div className="col-6">
              <strong>Temp:</strong> {vitals.temperature}°C
            </div>
          )}
          {vitals.pulse && (
            <div className="col-6">
              <strong>Pulse:</strong> {vitals.pulse} bpm
            </div>
          )}
          {vitals.weight && (
            <div className="col-6">
              <strong>Weight:</strong> {vitals.weight} kg
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedDoctorInfo = doctors.find(d => d._id === selectedDoctor);
  const selectedNurseInfo = nurses.find(n => n._id === selectedNurse);
  const isCompletingVisit = selectedStage === 'completed' || selectedStage === 'returned_to_front_desk';

  const getReassignmentRole = () => {
    switch (currentStage) {
      case 'nurse': return 'Nurse';
      case 'doctor': return 'Doctor';
      case 'lab': return 'Lab Technician';
      case 'pharmacy': return 'Pharmacist';
      case 'billing': return 'Billing Staff';
      default: return 'Colleague';
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down">
        <div className="modal-content">
          <div className="modal-header border-bottom" style={{ backgroundColor: '#003366', color: 'white' }}>
            <h5 className="modal-title d-flex align-items-center">
              <i className={`ti ${isReassignment ? 'ti-user-share' : isCompletingVisit ? 'ti-check-circle' : 'ti-transfer'} me-2`}></i>
              {isReassignment ? `Reassign Patient to ${getReassignmentRole()}` : isCompletingVisit ? 'Complete Visit' : 'Transfer Patient'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {patient && (
              <div className="card bg-light mb-3">
                <div className="card-body py-2">
                  <div className="row align-items-center">
                    <div className="col-12 col-md-8">
                      <h6 className="mb-0" style={{ color: '#003366' }}>
                        {patient.firstName} {patient.lastName}
                      </h6>
                      <small className="text-muted">
                        Visit #{visit.visitNumber} • ID: {patient.patientId}
                      </small>
                    </div>
                    <div className="col-12 col-md-4 text-md-end mt-2 mt-md-0">
                      <span className="badge" style={{ backgroundColor: '#4A90E2', color: 'white' }}>
                        {getStageLabel(currentStage)}
                      </span>
                      <div className="small text-muted mt-1">
                        Waiting: {getWaitingTime()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'select' && (
              <div className="handoff-step-select">
                <h6 className="mb-3" style={{ color: '#003366' }}>
                  <i className="ti ti-arrow-right me-2"></i>
                  Select Transfer Destination
                </h6>

                <div className="list-group">
                  {allowedTransitions.map((stage) => {
                    const isCompletion = stage === 'completed' || stage === 'returned_to_front_desk';
                    const getStageDescription = () => {
                      if (stage === 'returned_to_front_desk') {
                        return 'Patient returns to front desk for clockout';
                      }
                      if (stage === 'completed') {
                        return 'Mark this visit as complete';
                      }
                      if (stage === 'nurse' && currentStage === 'doctor') {
                        return 'Send back to nurse for injection, vitals re-check, and other nursing tasks';
                      }
                      return `Send patient to ${getStageLabel(stage).toLowerCase()} queue`;
                    };
                    
                    return (
                      <button
                        key={stage}
                        type="button"
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onClick={() => handleStageSelect(stage)}
                        disabled={loading}
                        style={{ 
                          borderLeft: `4px solid ${isCompletion ? '#09800F' : '#4A90E2'}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <i className={`ti ${isCompletion ? 'ti-check-circle' : 'ti-arrow-right'} me-3 fs-5`} 
                             style={{ color: isCompletion ? '#09800F' : '#4A90E2' }}></i>
                          <div>
                            <div className="fw-medium">
                              {isCompletion ? getStageLabel(stage) : stage === 'nurse' && currentStage === 'doctor' ? 'Send back to Nurse' : `Transfer to ${getStageLabel(stage)}`}
                            </div>
                            <small className="text-muted">
                              {getStageDescription()}
                            </small>
                          </div>
                        </div>
                        <i className="ti ti-chevron-right text-muted"></i>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="handoff-step-confirm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0" style={{ color: '#003366' }}>
                    <i className="ti ti-clipboard-check me-2"></i>
                    {isReassignment ? 'Confirm Reassignment' : 'Confirm Transfer Details'}
                  </h6>
                  {!isReassignment && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      <i className="ti ti-arrow-left me-1"></i>
                      Back
                    </button>
                  )}
                </div>

                {isReassignment ? (
                  <div className="alert mb-3" style={{ 
                    backgroundColor: '#FFF3CD',
                    borderLeft: '4px solid #FFC107',
                    color: '#0F172A'
                  }}>
                    <div className="d-flex align-items-center">
                      <i className="ti ti-info-circle fs-4 me-3" style={{ color: '#FFC107' }}></i>
                      <div>
                        <strong>Patient is currently assigned to you</strong>
                        <div className="small mt-1">
                          Reassign to another {getReassignmentRole().toLowerCase()} in your department if you're unavailable
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert mb-3" style={{ 
                    backgroundColor: isCompletingVisit ? '#E8F5E9' : '#E3F2FD',
                    borderLeft: `4px solid ${isCompletingVisit ? '#09800F' : '#003366'}`,
                    color: '#0F172A'
                  }}>
                    <div className="d-flex align-items-center">
                      <i className={`ti ${isCompletingVisit ? 'ti-check-circle' : 'ti-arrow-right'} fs-4 me-3`} 
                         style={{ color: isCompletingVisit ? '#09800F' : '#003366' }}></i>
                      <div>
                        <strong>
                          {isCompletingVisit 
                            ? 'This visit will be marked as complete' 
                            : `Patient will be transferred to ${getStageLabel(selectedStage)}`}
                        </strong>
                        <div className="small mt-1">
                          Current stage: <span className="badge badge-soft-secondary">{getStageLabel(currentStage)}</span>
                          <i className="ti ti-arrow-right mx-2"></i>
                          Next: <span className={`badge ${isCompletingVisit ? 'badge-soft-success' : 'badge-soft-primary'}`}>
                            {isCompletingVisit ? 'Completed' : getStageLabel(selectedStage)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {getVitalsSummary()}

                {(isReassignment && currentStage === 'nurse') && (
                  <div className="mb-3">
                    <label className="form-label">
                      Reassign to Nurse <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedNurse}
                      onChange={(e) => setSelectedNurse(e.target.value)}
                      disabled={loadingNurses || loading}
                    >
                      <option value="">-- Select a Nurse --</option>
                      {nurses.map((nurse) => (
                        <option key={nurse._id} value={nurse._id}>
                          {nurse.firstName} {nurse.lastName}
                        </option>
                      ))}
                    </select>
                    {nurses.length === 0 && !loadingNurses && (
                      <div className="mt-2 small text-warning">
                        <i className="ti ti-alert-circle me-1"></i>
                        No other nurses are currently available
                      </div>
                    )}
                  </div>
                )}

                {(isReassignment && currentStage === 'doctor') && (
                  <div className="mb-3">
                    <label className="form-label">
                      Reassign to Doctor <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      disabled={loadingDoctors || loading}
                    >
                      <option value="">-- Select a Doctor --</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.firstName} {doctor.lastName}
                        </option>
                      ))}
                    </select>
                    {doctors.length === 0 && !loadingDoctors && (
                      <div className="mt-2 small text-warning">
                        <i className="ti ti-alert-circle me-1"></i>
                        No other doctors are currently available
                      </div>
                    )}
                  </div>
                )}

                {(isReassignment && currentStage === 'lab') && (
                  <div className="mb-3">
                    <label className="form-label">
                      Reassign to Lab Technician <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      disabled={loadingLab || loading}
                    >
                      <option value="">-- Select a Lab Technician --</option>
                      {labStaff.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                    {labStaff.length === 0 && !loadingLab && (
                      <div className="mt-2 small text-warning">
                        <i className="ti ti-alert-circle me-1"></i>
                        No other lab technicians are currently available
                      </div>
                    )}
                  </div>
                )}

                {(isReassignment && currentStage === 'pharmacy') && (
                  <div className="mb-3">
                    <label className="form-label">
                      Reassign to Pharmacist <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedPharmacy}
                      onChange={(e) => setSelectedPharmacy(e.target.value)}
                      disabled={loadingPharmacy || loading}
                    >
                      <option value="">-- Select a Pharmacist --</option>
                      {pharmacyStaff.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                    {pharmacyStaff.length === 0 && !loadingPharmacy && (
                      <div className="mt-2 small text-warning">
                        <i className="ti ti-alert-circle me-1"></i>
                        No other pharmacists are currently available
                      </div>
                    )}
                  </div>
                )}

                {(isReassignment && currentStage === 'billing') && (
                  <div className="mb-3">
                    <label className="form-label">
                      Reassign to Billing Staff <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedBilling}
                      onChange={(e) => setSelectedBilling(e.target.value)}
                      disabled={loadingBilling || loading}
                    >
                      <option value="">-- Select Billing Staff --</option>
                      {billingStaff.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                    {billingStaff.length === 0 && !loadingBilling && (
                      <div className="mt-2 small text-warning">
                        <i className="ti ti-alert-circle me-1"></i>
                        No other billing staff are currently available
                      </div>
                    )}
                  </div>
                )}

                {!isReassignment && ((currentStage === 'front_desk' && selectedStage === 'nurse') || (currentStage === 'doctor' && selectedStage === 'nurse')) && (
                  <div className="mb-3">
                    <label className="form-label">
                      Assigned Nurse <span className="text-danger">*</span>
                    </label>
                    {currentStage === 'doctor' && (
                      <div className="alert alert-info mb-2 py-2">
                        <small>
                          <i className="ti ti-info-circle me-1"></i>
                          Assign a nurse for injection, vitals monitoring, or other nursing tasks
                        </small>
                      </div>
                    )}
                    <select
                      className="form-select"
                      value={selectedNurse}
                      onChange={(e) => setSelectedNurse(e.target.value)}
                      disabled={loadingNurses || loading}
                    >
                      <option value="">-- Select a Nurse --</option>
                      {nurses.map((nurse) => (
                        <option key={nurse._id} value={nurse._id}>
                          {nurse.firstName} {nurse.lastName}
                        </option>
                      ))}
                    </select>
                    {selectedNurseInfo && (
                      <div className="mt-2 small" style={{ color: '#4A90E2' }}>
                        <i className="ti ti-info-circle me-1"></i>
                        Patient will be assigned to {selectedNurseInfo.firstName} {selectedNurseInfo.lastName}
                      </div>
                    )}
                  </div>
                )}

                {!isReassignment && (currentStage === 'returned_to_front_desk' || selectedStage === 'doctor' || (currentStage === 'nurse' && selectedStage === 'doctor')) && (
                  <div className="mb-3">
                    <label className="form-label">
                      Assigned Doctor {(currentStage === 'returned_to_front_desk' || (currentStage === 'nurse' && selectedStage === 'doctor')) && <span className="text-danger">*</span>}
                    </label>
                    <select
                      className="form-select"
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      disabled={loadingDoctors || loading}
                    >
                      <option value="">-- Select a Doctor --</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.firstName} {doctor.lastName}
                        </option>
                      ))}
                    </select>
                    {selectedDoctorInfo && (
                      <div className="mt-2 small" style={{ color: '#4A90E2' }}>
                        <i className="ti ti-info-circle me-1"></i>
                        Patient will be assigned to Dr. {selectedDoctorInfo.firstName} {selectedDoctorInfo.lastName}
                      </div>
                    )}
                  </div>
                )}

                {!isReassignment && selectedStage === 'lab' && (
                  <div className="mb-3">
                    <label className="form-label">
                      Assigned Lab Technician <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      disabled={loadingLab || loading}
                    >
                      <option value="">-- Select a Lab Technician --</option>
                      {labStaff.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                    {labStaff.find(s => s._id === selectedLab) && (
                      <div className="mt-2 small" style={{ color: '#6F42C1' }}>
                        <i className="ti ti-info-circle me-1"></i>
                        Patient will be assigned to {labStaff.find(s => s._id === selectedLab)?.firstName} {labStaff.find(s => s._id === selectedLab)?.lastName}
                      </div>
                    )}
                  </div>
                )}

                {!isReassignment && selectedStage === 'pharmacy' && (
                  <div className="mb-3">
                    <label className="form-label">
                      Assigned Pharmacist <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedPharmacy}
                      onChange={(e) => setSelectedPharmacy(e.target.value)}
                      disabled={loadingPharmacy || loading}
                    >
                      <option value="">-- Select a Pharmacist --</option>
                      {pharmacyStaff.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                    {pharmacyStaff.find(s => s._id === selectedPharmacy) && (
                      <div className="mt-2 small" style={{ color: '#8B5CF6' }}>
                        <i className="ti ti-info-circle me-1"></i>
                        Patient will be assigned to {pharmacyStaff.find(s => s._id === selectedPharmacy)?.firstName} {pharmacyStaff.find(s => s._id === selectedPharmacy)?.lastName}
                      </div>
                    )}
                  </div>
                )}

                {!isReassignment && selectedStage === 'billing' && (
                  <div className="mb-3">
                    <label className="form-label">
                      Assigned Billing Staff <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedBilling}
                      onChange={(e) => setSelectedBilling(e.target.value)}
                      disabled={loadingBilling || loading}
                    >
                      <option value="">-- Select Billing Staff --</option>
                      {billingStaff.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                    {billingStaff.find(s => s._id === selectedBilling) && (
                      <div className="mt-2 small" style={{ color: '#F59E0B' }}>
                        <i className="ti ti-info-circle me-1"></i>
                        Patient will be assigned to {billingStaff.find(s => s._id === selectedBilling)?.firstName} {billingStaff.find(s => s._id === selectedBilling)?.lastName}
                      </div>
                    )}
                  </div>
                )}

                {!isReassignment && (
                  <div className="mb-3">
                    <label className="form-label">
                      Handoff Notes {!isCompletingVisit && <span className="text-muted">(Optional)</span>}
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        isCompletingVisit 
                          ? 'Add any closing notes or summary...' 
                          : `Add notes for ${getStageLabel(selectedStage).toLowerCase()} team...`
                      }
                      disabled={loading}
                    ></textarea>
                    <div className="form-text">
                      <i className="ti ti-info-circle me-1"></i>
                      These notes will be visible to the receiving department
                    </div>
                  </div>
                )}

                <div className="border rounded p-3" style={{ backgroundColor: '#F8F9FA' }}>
                  <h6 className="small text-muted mb-2">{isReassignment ? 'Reassignment Summary' : 'Transfer Summary'}</h6>
                  <ul className="list-unstyled mb-0 small">
                    <li><strong>Patient:</strong> {patient?.firstName} {patient?.lastName}</li>
                    {isReassignment ? (
                      <>
                        <li><strong>Current Stage:</strong> {getStageLabel(currentStage)}</li>
                        <li><strong>Action:</strong> Reassigning to colleague</li>
                      </>
                    ) : (
                      <>
                        <li><strong>From:</strong> {getStageLabel(currentStage)}</li>
                        <li><strong>To:</strong> {isCompletingVisit ? 'Completed' : getStageLabel(selectedStage)}</li>
                      </>
                    )}
                    {selectedNurseInfo && (
                      <li><strong>Nurse:</strong> {selectedNurseInfo.firstName} {selectedNurseInfo.lastName}</li>
                    )}
                    {selectedDoctorInfo && (
                      <li><strong>Doctor:</strong> Dr. {selectedDoctorInfo.firstName} {selectedDoctorInfo.lastName}</li>
                    )}
                    {labStaff.find(s => s._id === selectedLab) && (
                      <li><strong>Lab Technician:</strong> {labStaff.find(s => s._id === selectedLab)?.firstName} {labStaff.find(s => s._id === selectedLab)?.lastName}</li>
                    )}
                    {pharmacyStaff.find(s => s._id === selectedPharmacy) && (
                      <li><strong>Pharmacist:</strong> {pharmacyStaff.find(s => s._id === selectedPharmacy)?.firstName} {pharmacyStaff.find(s => s._id === selectedPharmacy)?.lastName}</li>
                    )}
                    {billingStaff.find(s => s._id === selectedBilling) && (
                      <li><strong>Billing Staff:</strong> {billingStaff.find(s => s._id === selectedBilling)?.firstName} {billingStaff.find(s => s._id === selectedBilling)?.lastName}</li>
                    )}
                    <li><strong>Time in current stage:</strong> {getWaitingTime()}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-top gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={step === 'confirm' && !isReassignment ? handleBack : onClose}
              disabled={loading}
            >
              {step === 'confirm' && !isReassignment ? (
                <>
                  <i className="ti ti-arrow-left me-1"></i>
                  Back
                </>
              ) : (
                'Cancel'
              )}
            </button>
            {step === 'confirm' && (
              <button
                type="button"
                className="btn"
                style={{ 
                  backgroundColor: isReassignment ? '#FFC107' : isCompletingVisit ? '#09800F' : '#003366',
                  color: 'white'
                }}
                onClick={handleConfirm}
                disabled={loading || 
                  (isReassignment && (
                    (currentStage === 'nurse' && !selectedNurse) ||
                    (currentStage === 'doctor' && !selectedDoctor) ||
                    (currentStage === 'lab' && !selectedLab) ||
                    (currentStage === 'pharmacy' && !selectedPharmacy) ||
                    (currentStage === 'billing' && !selectedBilling)
                  )) ||
                  (!isReassignment && (
                    (currentStage === 'returned_to_front_desk' && !selectedDoctor) ||
                    (currentStage === 'front_desk' && selectedStage === 'nurse' && !selectedNurse) ||
                    (currentStage === 'doctor' && selectedStage === 'nurse' && !selectedNurse) ||
                    (currentStage === 'nurse' && selectedStage === 'doctor' && !selectedDoctor) ||
                    (selectedStage === 'lab' && !selectedLab) ||
                    (selectedStage === 'pharmacy' && !selectedPharmacy) ||
                    (selectedStage === 'billing' && !selectedBilling)
                  ))}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {isReassignment ? 'Reassigning...' : isCompletingVisit ? 'Completing...' : 'Transferring...'}
                  </>
                ) : (
                  <>
                    <i className={`ti ${isReassignment ? 'ti-user-share' : isCompletingVisit ? 'ti-check' : 'ti-arrow-right'} me-1`}></i>
                    {isReassignment ? 'Confirm Reassignment' : isCompletingVisit ? 'Confirm Complete' : 'Confirm Transfer'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
