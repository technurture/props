"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { apiClient } from '@/lib/services/api-client';

interface HandoffButtonProps {
  visitId: string;
  currentStage: string;
  patientName: string;
  onSuccess?: () => void;
  variant?: 'primary' | 'success' | 'info' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const STAGE_OPTIONS: Record<string, { label: string; nextStages: string[] }> = {
  'front_desk': { 
    label: 'Front Desk', 
    nextStages: ['nurse', 'lab', 'pharmacy'] 
  },
  'nurse': { 
    label: 'Nurse', 
    nextStages: ['doctor', 'returned_to_front_desk'] 
  },
  'doctor': { 
    label: 'Doctor', 
    nextStages: ['nurse', 'lab', 'pharmacy', 'billing'] 
  },
  'lab': { 
    label: 'Lab', 
    nextStages: ['doctor', 'pharmacy', 'billing'] 
  },
  'pharmacy': { 
    label: 'Pharmacy', 
    nextStages: ['billing'] 
  },
  'billing': { 
    label: 'Billing', 
    nextStages: ['returned_to_front_desk'] 
  },
  'returned_to_front_desk': { 
    label: 'Returned to Front Desk', 
    nextStages: ['doctor', 'nurse', 'lab', 'pharmacy', 'billing', 'completed'] 
  }
};

const STAGE_LABELS: Record<string, string> = {
  'nurse': 'Nurse',
  'doctor': 'Doctor',
  'lab': 'Lab',
  'pharmacy': 'Pharmacy',
  'billing': 'Billing',
  'returned_to_front_desk': 'Returned to Front Desk',
  'completed': 'Complete Visit'
};

export default function HandoffButton({
  visitId,
  currentStage,
  patientName,
  onSuccess,
  variant = 'primary',
  size = 'md',
  className = ''
}: HandoffButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [targetStage, setTargetStage] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const stageInfo = STAGE_OPTIONS[currentStage];
  const availableNextStages = stageInfo?.nextStages || [];

  useEffect(() => {
    // Always clear selected staff when target stage changes
    setSelectedStaff('');
    setStaffList([]);
    
    if (targetStage && (targetStage === 'nurse' || targetStage === 'lab' || targetStage === 'pharmacy')) {
      fetchStaff(targetStage);
    }
  }, [targetStage]);

  const fetchStaff = async (stage: string) => {
    setLoadingStaff(true);
    try {
      const roleMap: Record<string, string> = {
        'nurse': 'NURSE',
        'lab': 'LAB',
        'pharmacy': 'PHARMACY'
      };
      
      const role = roleMap[stage];
      if (!role) return;

      const response = await apiClient.get<{ staff: StaffMember[] }>(
        `/api/staff?role=${role}&limit=1000&clockedIn=true`,
        { showErrorToast: true }
      );
      setStaffList(response.staff || []);
    } catch (error) {
      console.error(`Failed to fetch ${stage} staff:`, error);
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleOpen = () => {
    setShowModal(true);
    // For returned_to_front_desk, default to 'completed' for clock-out workflow
    // Fall back to first available stage if 'completed' is not in the list
    const defaultStage = currentStage === 'returned_to_front_desk' 
      ? (availableNextStages.includes('completed') ? 'completed' : availableNextStages[0] || '')
      : availableNextStages[0] || '';
    setTargetStage(defaultStage);
  };

  const handleClose = () => {
    setShowModal(false);
    setNotes('');
    setNextAction('');
    setTargetStage('');
    setSelectedStaff('');
    setStaffList([]);
  };

  const handleHandoff = async () => {
    // Validate staff selection when required
    if ((targetStage === 'nurse' || targetStage === 'lab' || targetStage === 'pharmacy') && !selectedStaff) {
      toast.error(`Please select a ${STAGE_LABELS[targetStage]} to hand off to`);
      return;
    }

    setLoading(true);
    try {
      // Update assigned staff if selected
      if (selectedStaff) {
        const assignmentField = targetStage === 'nurse' ? 'assignedNurse' : 
                               targetStage === 'lab' ? 'assignedLabTech' : 
                               targetStage === 'pharmacy' ? 'assignedPharmacist' : null;
        
        if (assignmentField) {
          await apiClient.put(
            `/api/visits/${visitId}`,
            { [assignmentField]: selectedStaff },
            { showErrorToast: true }
          );
        }
      }

      const successMessage = targetStage === 'completed' 
        ? 'Visit completed successfully' 
        : `Patient successfully handed off to ${STAGE_LABELS[targetStage] || 'next stage'}`;
      
      await apiClient.post(
        '/api/clocking/handoff',
        {
          visitId,
          targetStage: targetStage || undefined,
          notes,
          nextAction
        },
        { successMessage }
      );

      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Handoff failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (currentStage === 'returned_to_front_desk') {
      return 'Clock Out';
    }
    if (availableNextStages.length === 1) {
      return `Send to ${STAGE_LABELS[availableNextStages[0]]}`;
    }
    return 'Hand Off Patient';
  };

  const getButtonIcon = () => {
    if (currentStage === 'returned_to_front_desk') {
      return 'ti-logout';
    }
    switch (currentStage) {
      case 'front_desk':
        return 'ti-arrow-right';
      case 'nurse':
        return 'ti-stethoscope';
      case 'doctor':
        return 'ti-arrow-forward';
      case 'lab':
        return 'ti-test-pipe';
      case 'pharmacy':
        return 'ti-pill';
      case 'billing':
        return 'ti-receipt';
      default:
        return 'ti-arrow-right';
    }
  };

  if (!stageInfo || availableNextStages.length === 0) {
    return null;
  }

  const showStaffSelection = targetStage === 'nurse' || targetStage === 'lab' || targetStage === 'pharmacy';

  return (
    <>
      <button
        onClick={handleOpen}
        className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''} ${className}`}
      >
        <i className={`ti ${getButtonIcon()} me-2`}></i>
        {getButtonLabel()}
      </button>

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentStage === 'returned_to_front_desk' ? 'Clock Out Patient' : 'Hand Off Patient'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6 className="mb-2">Patient: <span className="text-primary">{patientName}</span></h6>
            <p className="text-muted mb-0">
              Current Stage: <span className="badge badge-soft-info">{stageInfo.label}</span>
            </p>
          </div>

          {availableNextStages.length > 1 && (
            <div className="mb-3">
              <label className="form-label">
                {currentStage === 'returned_to_front_desk' ? 'Action' : 'Send To'} <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                required
              >
                {availableNextStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                {currentStage === 'returned_to_front_desk' 
                  ? 'Complete the visit or send patient to another department if needed' 
                  : 'Choose where to send the patient next'}
              </small>
            </div>
          )}

          {availableNextStages.length === 1 && (
            <div className="mb-3">
              <label className="form-label">Next Stage</label>
              <div className="alert alert-info mb-0">
                <i className="ti ti-info-circle me-2"></i>
                Patient will be sent to <strong>{STAGE_LABELS[availableNextStages[0]]}</strong>
              </div>
            </div>
          )}

          {showStaffSelection && (
            <div className="mb-3">
              <label className="form-label">
                Assign to {STAGE_LABELS[targetStage]} <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                disabled={loadingStaff}
                required
              >
                <option value="">-- Select {STAGE_LABELS[targetStage]} --</option>
                {staffList.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.firstName} {staff.lastName}
                  </option>
                ))}
              </select>
              {loadingStaff && (
                <small className="text-muted">
                  <i className="spinner-border spinner-border-sm me-1"></i>
                  Loading staff list...
                </small>
              )}
              {!loadingStaff && staffList.length === 0 && (
                <small className="text-warning">
                  <i className="ti ti-alert-circle me-1"></i>
                  No {STAGE_LABELS[targetStage]} staff available
                </small>
              )}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                currentStage === 'returned_to_front_desk' && targetStage === 'completed'
                  ? 'Add any final notes or closing remarks...'
                  : 'Add any notes for the next department...'
              }
            />
          </div>

          {targetStage !== 'completed' && (
            <div className="mb-3">
              <label className="form-label">Next Action Required</label>
              <input
                type="text"
                className="form-control"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g., Check blood pressure, Review test results"
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleHandoff}
            disabled={loading || (showStaffSelection && !selectedStaff)}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {currentStage === 'returned_to_front_desk' && targetStage === 'completed' ? 'Clocking Out...' : 'Handing Off...'}
              </>
            ) : (
              <>
                <i className={`ti ${currentStage === 'returned_to_front_desk' && targetStage === 'completed' ? 'ti-check-circle' : 'ti-check'} me-2`}></i>
                {currentStage === 'returned_to_front_desk' && targetStage === 'completed' ? 'Confirm Clock Out' : 'Confirm Handoff'}
              </>
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
