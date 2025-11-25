"use client";
import React, { useState } from 'react';
import { useHandoff } from './useHandoff';
import { getAllowedTransitions, getStageLabel } from '@/lib/constants/stages';

interface HandoffButtonProps {
  visitId: string;
  currentStage: string;
  onHandoffSuccess?: () => void;
}

export default function HandoffButton({ visitId, currentStage, onHandoffSuccess }: HandoffButtonProps) {
  const { handoff, loading } = useHandoff();
  const [showConfirm, setShowConfirm] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const allowedTransitions = getAllowedTransitions(currentStage);

  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
    setShowDropdown(false);
    setShowConfirm(true);
  };

  const handleHandoff = async () => {
    if (!selectedStage) return;

    try {
      await handoff({
        visitId,
        currentStage,
        targetStage: selectedStage,
        notes: notes || undefined,
        onSuccess: () => {
          setShowConfirm(false);
          setNotes('');
          setSelectedStage(null);
          if (onHandoffSuccess) {
            onHandoffSuccess();
          }
        },
      });
    } catch (error) {
      console.error('Handoff failed:', error);
    }
  };

  if (allowedTransitions.length === 0) {
    return null;
  }

  const selectedStageLabel = selectedStage === 'completed' 
    ? 'Complete Visit' 
    : selectedStage 
    ? getStageLabel(selectedStage) 
    : '';

  return (
    <>
      <div className="btn-group">
        <button
          type="button"
          className="btn btn-sm btn-primary dropdown-toggle"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Transferring...
            </>
          ) : (
            <>
              <i className="ti ti-arrow-right me-1"></i>
              Transfer Patient
            </>
          )}
        </button>
        {showDropdown && (
          <ul className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0 }}>
            {allowedTransitions.map((stage) => (
              <li key={stage}>
                <button
                  className="dropdown-item"
                  onClick={() => handleStageSelect(stage)}
                  disabled={loading}
                >
                  {stage === 'completed' ? (
                    <>
                      <i className="ti ti-check-circle me-2"></i>
                      Complete Visit
                    </>
                  ) : (
                    <>
                      <i className="ti ti-arrow-right me-2"></i>
                      Transfer to {getStageLabel(stage)}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showConfirm && selectedStage && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedStage === 'completed' ? 'Complete Visit' : `Transfer Patient to ${selectedStageLabel}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowConfirm(false);
                    setSelectedStage(null);
                  }}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  {selectedStage === 'completed' 
                    ? 'Are you sure you want to complete this visit?' 
                    : `Are you sure you want to transfer this patient to ${selectedStageLabel}?`}
                </p>
                <div className="mb-3">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={selectedStage === 'completed' 
                      ? 'Add any closing notes...' 
                      : 'Add any notes for the next stage...'}
                    disabled={loading}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirm(false);
                    setSelectedStage(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleHandoff}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      {selectedStage === 'completed' ? 'Completing...' : 'Transferring...'}
                    </>
                  ) : (
                    selectedStage === 'completed' ? 'Confirm Complete' : 'Confirm Transfer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
