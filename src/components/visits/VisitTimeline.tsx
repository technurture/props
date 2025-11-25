"use client";
import React from 'react';
import { PatientVisit } from '@/types/emr';

interface VisitTimelineProps {
  visit: PatientVisit;
}

interface StageInfo {
  key: keyof NonNullable<PatientVisit['stages']>;
  label: string;
  icon: string;
  color: string;
}

const STAGES: StageInfo[] = [
  { key: 'frontDesk', label: 'Front Desk', icon: 'ti-clipboard-check', color: 'primary' },
  { key: 'nurse', label: 'Nurse', icon: 'ti-heartbeat', color: 'info' },
  { key: 'doctor', label: 'Doctor', icon: 'ti-stethoscope', color: 'success' },
  { key: 'lab', label: 'Lab', icon: 'ti-test-pipe', color: 'warning' },
  { key: 'pharmacy', label: 'Pharmacy', icon: 'ti-pill', color: 'purple' },
  { key: 'billing', label: 'Billing', icon: 'ti-receipt', color: 'danger' },
];

export default function VisitTimeline({ visit }: VisitTimelineProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate: Date | string | undefined, endDate: Date | string | undefined) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const durationMinutes = Math.round((end - start) / 60000);
    if (durationMinutes < 60) {
      return `${durationMinutes} min`;
    }
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getPersonName = (person: any) => {
    if (!person) return 'N/A';
    if (typeof person === 'object' && person.firstName && person.lastName) {
      return `${person.firstName} ${person.lastName}`;
    }
    return 'N/A';
  };

  const isStageCompleted = (stageKey: keyof NonNullable<PatientVisit['stages']>) => {
    const stage = visit.stages?.[stageKey];
    return stage && stage.clockedInAt && stage.clockedOutAt;
  };

  const isStageActive = (stageKey: keyof NonNullable<PatientVisit['stages']>) => {
    const stageKeyMap: Record<string, string> = {
      frontDesk: 'front_desk',
      nurse: 'nurse',
      doctor: 'doctor',
      lab: 'lab',
      pharmacy: 'pharmacy',
      billing: 'billing'
    };
    return visit.currentStage === stageKeyMap[stageKey];
  };

  const hasStageData = (stageKey: keyof NonNullable<PatientVisit['stages']>) => {
    const stage = visit.stages?.[stageKey];
    return stage && stage.clockedInAt;
  };

  return (
    <div className="visit-timeline">
      <style jsx>{`
        .visit-timeline {
          position: relative;
        }
        .timeline-item {
          position: relative;
          padding-left: 60px;
          padding-bottom: 30px;
        }
        .timeline-item:last-child {
          padding-bottom: 0;
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: 24px;
          top: 40px;
          bottom: 0;
          width: 2px;
          background: #e5e7eb;
        }
        .timeline-item:last-child::before {
          display: none;
        }
        .timeline-icon {
          position: absolute;
          left: 0;
          top: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          z-index: 1;
          transition: all 0.3s ease;
        }
        .timeline-icon.completed {
          background: #10b981;
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .timeline-icon.active {
          background: white;
          border: 3px solid #3b82f6;
          color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          animation: pulse 2s infinite;
        }
        .timeline-icon.pending {
          background: #f3f4f6;
          color: #9ca3af;
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
          }
        }
        .timeline-content {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.3s ease;
        }
        .timeline-content.active {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }
        .timeline-content.completed {
          background: #f0fdf4;
          border-color: #86efac;
        }
      `}</style>

      {STAGES.map((stageInfo) => {
        const stage = visit.stages?.[stageInfo.key];
        const completed = isStageCompleted(stageInfo.key);
        const active = isStageActive(stageInfo.key);
        const hasData = hasStageData(stageInfo.key);

        if (!hasData) return null;

        return (
          <div key={stageInfo.key} className="timeline-item">
            <div className={`timeline-icon ${completed ? 'completed' : active ? 'active' : 'pending'}`}>
              <i className={`ti ${completed ? 'ti-check' : stageInfo.icon}`}></i>
            </div>
            <div className={`timeline-content ${completed ? 'completed' : active ? 'active' : ''}`}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="mb-0 fw-semibold">{stageInfo.label}</h6>
                {completed && (
                  <span className="badge badge-soft-success">
                    <i className="ti ti-check me-1"></i>Completed
                  </span>
                )}
                {active && (
                  <span className="badge badge-soft-primary">
                    <i className="ti ti-clock me-1"></i>In Progress
                  </span>
                )}
              </div>

              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <div className="text-muted small mb-1">Clocked In</div>
                  <div className="fw-medium">{getPersonName(stage?.clockedInBy)}</div>
                  <div className="text-muted small">{formatDate(stage?.clockedInAt)}</div>
                </div>
                {stage?.clockedOutAt && (
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Clocked Out</div>
                    <div className="fw-medium">{getPersonName(stage?.clockedOutBy)}</div>
                    <div className="text-muted small">{formatDate(stage?.clockedOutAt)}</div>
                    {stage?.clockedInAt && (
                      <div className="text-success small mt-1">
                        <i className="ti ti-clock-hour-3 me-1"></i>
                        Duration: {formatDuration(stage.clockedInAt, stage.clockedOutAt)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {stageInfo.key === 'nurse' && (stage as any)?.vitalSigns && (
                <div className="mt-3 pt-3 border-top">
                  <h6 className="mb-2 small text-muted">Vital Signs</h6>
                  <div className="row g-2">
                    {(stage as any).vitalSigns.bloodPressure && (
                      <div className="col-md-4">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-activity text-danger me-2"></i>
                          <div>
                            <div className="small text-muted">BP</div>
                            <div className="fw-medium">{(stage as any).vitalSigns.bloodPressure}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(stage as any).vitalSigns.temperature && (
                      <div className="col-md-4">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-temperature text-warning me-2"></i>
                          <div>
                            <div className="small text-muted">Temp</div>
                            <div className="fw-medium">{(stage as any).vitalSigns.temperature}°F</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(stage as any).vitalSigns.pulse && (
                      <div className="col-md-4">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-heartbeat text-danger me-2"></i>
                          <div>
                            <div className="small text-muted">Pulse</div>
                            <div className="fw-medium">{(stage as any).vitalSigns.pulse} bpm</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(stage as any).vitalSigns.weight && (
                      <div className="col-md-4">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-weight text-primary me-2"></i>
                          <div>
                            <div className="small text-muted">Weight</div>
                            <div className="fw-medium">{(stage as any).vitalSigns.weight} kg</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {stageInfo.key === 'doctor' && (
                <div className="mt-3 pt-3 border-top">
                  <h6 className="mb-3 small text-muted fw-bold">Consultation Details</h6>
                  
                  {(stage as any)?.chiefComplaint && (
                    <div className="mb-3">
                      <h6 className="mb-1 small text-muted">Chief Complaint</h6>
                      <p className="mb-0">{(stage as any).chiefComplaint}</p>
                    </div>
                  )}

                  {(stage as any)?.historyOfPresentIllness && (
                    <div className="mb-3">
                      <h6 className="mb-1 small text-muted">History of Present Illness</h6>
                      <p className="mb-0">{(stage as any).historyOfPresentIllness}</p>
                    </div>
                  )}

                  {(stage as any)?.physicalExamination && (
                    <div className="mb-3">
                      <h6 className="mb-1 small text-muted">Physical Examination</h6>
                      <p className="mb-0">{(stage as any).physicalExamination}</p>
                    </div>
                  )}

                  {(stage as any)?.diagnosis && (
                    <div className="mb-3">
                      <h6 className="mb-1 small text-muted">Diagnosis</h6>
                      <p className="mb-0 fw-medium text-success">{(stage as any).diagnosis}</p>
                    </div>
                  )}

                  {(stage as any)?.treatmentPlan && (
                    <div className="mb-3">
                      <h6 className="mb-1 small text-muted">Treatment Plan</h6>
                      <p className="mb-0">{(stage as any).treatmentPlan}</p>
                    </div>
                  )}

                  {(stage as any)?.prescriptions && (stage as any).prescriptions.length > 0 && (
                    <div className="mb-3">
                      <h6 className="mb-2 small text-muted">Prescriptions</h6>
                      <div className="row g-2">
                        {(stage as any).prescriptions.map((prescription: any, index: number) => (
                          <div key={index} className="col-12">
                            <div className="card bg-light border-0">
                              <div className="card-body p-2">
                                <div className="d-flex align-items-start">
                                  <i className="ti ti-pill text-primary me-2 mt-1"></i>
                                  <div className="flex-grow-1">
                                    <div className="fw-medium">{prescription.medicineName}</div>
                                    <div className="small text-muted">
                                      <span className="me-3">
                                        <i className="ti ti-medicine-syrup me-1"></i>
                                        {prescription.dosage}
                                      </span>
                                      <span className="me-3">
                                        <i className="ti ti-clock me-1"></i>
                                        {prescription.frequency}
                                      </span>
                                      <span>
                                        <i className="ti ti-calendar me-1"></i>
                                        {prescription.duration}
                                      </span>
                                    </div>
                                    {prescription.instructions && (
                                      <div className="small text-muted mt-1">
                                        <i className="ti ti-info-circle me-1"></i>
                                        {prescription.instructions}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(stage as any)?.labOrders && (stage as any).labOrders.length > 0 && (
                    <div className="mb-3">
                      <h6 className="mb-2 small text-muted">Lab Orders</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {(stage as any).labOrders.map((order: any, index: number) => (
                          <span key={index} className="badge bg-warning text-dark">
                            <i className="ti ti-test-pipe me-1"></i>
                            {typeof order === 'string' ? order : order.testName || 'Unknown Test'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(stage as any)?.followUpInstructions && (
                    <div className="mb-3">
                      <h6 className="mb-1 small text-muted">Follow-up Instructions</h6>
                      <div className="alert alert-info mb-0 py-2">
                        <i className="ti ti-calendar-event me-2"></i>
                        {(stage as any).followUpInstructions}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stage?.notes && (
                <div className="mt-3 pt-3 border-top">
                  <h6 className="mb-1 small text-muted">Notes</h6>
                  <p className="mb-0">{stage.notes}</p>
                </div>
              )}

              {stage?.nextAction && (
                <div className="mt-2">
                  <div className="alert alert-info mb-0 py-2">
                    <i className="ti ti-arrow-right me-2"></i>
                    <strong>Next Action:</strong> {stage.nextAction}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {visit.finalClockOut && (
        <div className="timeline-item">
          <div className="timeline-icon completed">
            <i className="ti ti-check-circle"></i>
          </div>
          <div className="timeline-content completed">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0 fw-semibold text-success">Visit Completed</h6>
              <span className="badge badge-soft-success">
                <i className="ti ti-check-circle me-1"></i>Finished
              </span>
            </div>
            <div className="text-muted small">
              Completed by {getPersonName(visit.finalClockOut.clockedOutBy)} on {formatDate(visit.finalClockOut.clockedOutAt)}
            </div>
            {visit.finalClockOut.notes && (
              <div className="mt-2 p-2 bg-white rounded border">
                <strong>Notes:</strong> {visit.finalClockOut.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
