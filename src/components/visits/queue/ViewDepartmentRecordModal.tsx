"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { apiClient } from '@/lib/services/api-client';
import { formatDistanceToNow, format } from 'date-fns';

interface ViewDepartmentRecordModalProps {
  visitId: string;
  patientInfo: {
    name: string;
    patientId: string;
  };
  show: boolean;
  onHide: () => void;
}

interface StaffInfo {
  _id: string;
  firstName: string;
  lastName: string;
}

interface VitalSigns {
  bloodPressure?: string;
  temperature?: number;
  pulse?: number;
  weight?: number;
  height?: number;
  bmi?: number;
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
  doctor: StaffInfo;
  dispensedBy?: StaffInfo;
  dispensedAt?: Date;
  createdAt: Date;
}

interface LabTest {
  _id: string;
  testNumber: string;
  testName: string;
  status: string;
  result?: {
    findings: string;
    normalRange?: string;
    remarks?: string;
    performedBy?: StaffInfo;
    completedAt?: Date;
  };
  doctor: StaffInfo;
  createdAt: Date;
}

interface StageData {
  clockedInBy?: StaffInfo;
  clockedInAt?: Date;
  clockedOutBy?: StaffInfo;
  clockedOutAt?: Date;
  notes?: string;
  vitalSigns?: VitalSigns;
  diagnosis?: string;
  nextAction?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  labOrders?: string[];
}

interface VisitData {
  _id: string;
  visitNumber: string;
  stages: {
    frontDesk?: StageData;
    nurse?: StageData;
    doctor?: StageData;
    lab?: StageData;
    pharmacy?: StageData;
    billing?: StageData;
  };
}

export default function ViewDepartmentRecordModal({
  visitId,
  patientInfo,
  show,
  onHide,
}: ViewDepartmentRecordModalProps) {
  const [loading, setLoading] = useState(false);
  const [visitData, setVisitData] = useState<VisitData | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);

  useEffect(() => {
    if (show && visitId) {
      fetchVisitData();
    }
  }, [show, visitId]);

  const fetchVisitData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{
        visit: VisitData;
        prescriptions: Prescription[];
        labTests: LabTest[];
      }>(`/api/visits/${visitId}`, { showErrorToast: true });

      setVisitData(response.visit);
      setPrescriptions(response.prescriptions || []);
      setLabTests(response.labTests || []);
    } catch (error) {
      console.error('Error fetching visit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date?: Date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy hh:mm a');
    } catch {
      return 'N/A';
    }
  };

  const getStaffName = (staff?: StaffInfo) => {
    if (!staff) return 'N/A';
    return `${staff.firstName} ${staff.lastName}`;
  };

  const renderFrontDeskRecord = () => {
    const stage = visitData?.stages?.frontDesk;
    if (!stage?.clockedInAt && !stage?.clockedOutAt && !stage?.notes) return null;

    return (
      <div className="card mb-3">
        <div className="card-header bg-primary text-white">
          <h6 className="mb-0">
            <i className="ti ti-user-check me-2"></i>
            Front Desk
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Attended By</small>
              <strong>{getStaffName(stage.clockedInBy)}</strong>
            </div>
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Time</small>
              <strong>{formatDateTime(stage.clockedInAt)}</strong>
            </div>
            {stage.notes && (
              <div className="col-12 mb-2">
                <small className="text-muted d-block">Notes</small>
                <p className="mb-0">{stage.notes}</p>
              </div>
            )}
            {stage.nextAction && (
              <div className="col-12">
                <small className="text-muted d-block">Next Action</small>
                <p className="mb-0">{stage.nextAction}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNurseRecord = () => {
    const stage = visitData?.stages?.nurse;
    if (!stage?.clockedInAt && !stage?.clockedOutAt && !stage?.vitalSigns && !stage?.notes) return null;

    return (
      <div className="card mb-3">
        <div className="card-header bg-success text-white">
          <h6 className="mb-0">
            <i className="ti ti-nurse me-2"></i>
            Nurse Assessment
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Attended By</small>
              <strong>{getStaffName(stage.clockedInBy)}</strong>
            </div>
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Time</small>
              <strong>{formatDateTime(stage.clockedInAt)}</strong>
            </div>
          </div>

          {stage.vitalSigns && (
            <div className="mt-3">
              <h6 className="mb-2">Vital Signs</h6>
              <div className="row">
                {stage.vitalSigns.bloodPressure && (
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Blood Pressure</small>
                    <strong>{stage.vitalSigns.bloodPressure} mmHg</strong>
                  </div>
                )}
                {stage.vitalSigns.temperature && (
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Temperature</small>
                    <strong>{stage.vitalSigns.temperature}°C</strong>
                  </div>
                )}
                {stage.vitalSigns.pulse && (
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Pulse</small>
                    <strong>{stage.vitalSigns.pulse} bpm</strong>
                  </div>
                )}
                {stage.vitalSigns.weight && (
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Weight</small>
                    <strong>{stage.vitalSigns.weight} kg</strong>
                  </div>
                )}
                {stage.vitalSigns.height && (
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Height</small>
                    <strong>{stage.vitalSigns.height} cm</strong>
                  </div>
                )}
                {stage.vitalSigns.bmi && (
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">BMI</small>
                    <strong>{stage.vitalSigns.bmi}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {stage.notes && (
            <div className="mt-3">
              <small className="text-muted d-block">Notes</small>
              <p className="mb-0">{stage.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDoctorRecord = () => {
    const stage = visitData?.stages?.doctor;
    if (!stage?.clockedInAt && !stage?.clockedOutAt && !stage?.diagnosis && !stage?.notes) return null;

    return (
      <div className="card mb-3">
        <div className="card-header bg-warning text-dark">
          <h6 className="mb-0">
            <i className="ti ti-stethoscope me-2"></i>
            Doctor Consultation
          </h6>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Attended By</small>
              <strong>{getStaffName(stage.clockedInBy)}</strong>
            </div>
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Time</small>
              <strong>{formatDateTime(stage.clockedInAt)}</strong>
            </div>
            {stage.clockedOutAt && (
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Clocked Out</small>
                <strong>{formatDateTime(stage.clockedOutAt)}</strong>
              </div>
            )}
          </div>

          {stage.chiefComplaint && (
            <div className="mb-3">
              <h6 className="mb-1">
                <i className="ti ti-alert-circle me-1"></i>
                Chief Complaint
              </h6>
              <p className="mb-0">{stage.chiefComplaint}</p>
            </div>
          )}

          {stage.historyOfPresentIllness && (
            <div className="mb-3">
              <h6 className="mb-1">
                <i className="ti ti-clipboard-text me-1"></i>
                History of Present Illness
              </h6>
              <p className="mb-0">{stage.historyOfPresentIllness}</p>
            </div>
          )}

          {stage.physicalExamination && (
            <div className="mb-3">
              <h6 className="mb-1">
                <i className="ti ti-stethoscope me-1"></i>
                Physical Examination
              </h6>
              <p className="mb-0">{stage.physicalExamination}</p>
            </div>
          )}

          {stage.diagnosis && (
            <div className="mb-3">
              <h6 className="mb-1">
                <i className="ti ti-file-description me-1"></i>
                Diagnosis
              </h6>
              <p className="mb-0"><strong className="text-danger">{stage.diagnosis}</strong></p>
            </div>
          )}

          {stage.treatmentPlan && (
            <div className="mb-3">
              <h6 className="mb-1">
                <i className="ti ti-medical-cross me-1"></i>
                Treatment Plan
              </h6>
              <p className="mb-0">{stage.treatmentPlan}</p>
            </div>
          )}

          {prescriptions.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2">
                <i className="ti ti-pill me-2"></i>
                Prescribed Medications
              </h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((prescription) =>
                      prescription.medications.map((med, index) => (
                        <tr key={`${prescription._id}-${index}`}>
                          <td><strong>{med.name}</strong></td>
                          <td>{med.dosage}</td>
                          <td>{med.frequency}</td>
                          <td>{med.duration}</td>
                          <td>{med.instructions || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-2">
                {prescriptions.map((prescription) => (
                  <div key={prescription._id} className="d-inline-flex align-items-center me-3">
                    <small className="text-muted">Rx #{prescription.prescriptionNumber}</small>
                    <span className={`badge ${prescription.status === 'dispensed' ? 'bg-success' : 'bg-warning'} ms-2`}>
                      {prescription.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage.labOrders && stage.labOrders.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2">
                <i className="ti ti-test-pipe me-2"></i>
                Lab Orders
              </h6>
              <ul className="mb-0">
                {stage.labOrders.map((labOrder: any, index: number) => (
                  <li key={index}>
                    {typeof labOrder === 'string' ? labOrder : labOrder.testName}
                    {labOrder.category && typeof labOrder === 'object' && (
                      <span className="badge bg-info-transparent ms-2 small">{labOrder.category}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {labTests.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2">
                <i className="ti ti-test-pipe-2 me-2"></i>
                Lab Test Results
              </h6>
              <div className="alert alert-info py-2 px-3 mb-2">
                <small className="mb-0">
                  <i className="ti ti-info-circle me-1"></i>
                  Lab test results from this visit
                </small>
              </div>
              {labTests.map((test) => (
                <div key={test._id} className="border rounded p-3 mb-2 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong className="text-primary">{test.testName}</strong>
                      <div className="text-muted small">Test #{test.testNumber}</div>
                    </div>
                    <span className={`badge ${test.status === 'completed' ? 'bg-success' : test.status === 'in_progress' ? 'bg-info' : 'bg-warning'}`}>
                      {test.status === 'completed' ? 'Completed' : test.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                  {test.result ? (
                    <div className="mt-2 ps-3 border-start border-primary border-3">
                      <div className="mb-1">
                        <strong className="text-success">Result:</strong> 
                        <span className="ms-2 fs-5">{test.result.findings}</span>
                      </div>
                      {test.result.normalRange && (
                        <div className="text-muted small mb-1">
                          <i className="ti ti-chart-line me-1"></i>
                          Normal Range: {test.result.normalRange}
                        </div>
                      )}
                      {test.result.remarks && (
                        <div className="mb-1">
                          <strong>Interpretation:</strong> 
                          <span className="ms-2">{test.result.remarks}</span>
                        </div>
                      )}
                      {test.result.performedBy && (
                        <div className="text-muted small mt-2">
                          <i className="ti ti-user-check me-1"></i>
                          Performed by: {getStaffName(test.result.performedBy)}
                          {test.result.completedAt && ` on ${formatDateTime(test.result.completedAt)}`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted small mt-2">
                      <i className="ti ti-clock me-1"></i>
                      {test.status === 'pending' ? 'Awaiting lab processing' : 'Test in progress'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {stage.followUpInstructions && (
            <div className="mb-3">
              <h6 className="mb-1">
                <i className="ti ti-calendar-event me-1"></i>
                Follow-up Instructions
              </h6>
              <p className="mb-0">{stage.followUpInstructions}</p>
            </div>
          )}

          {stage.notes && (
            <div className="mb-3">
              <h6 className="mb-1">
                <i className="ti ti-note me-1"></i>
                Additional Notes
              </h6>
              <p className="mb-0">{stage.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLabRecord = () => {
    const stage = visitData?.stages?.lab;
    if (!stage?.clockedInAt && !stage?.clockedOutAt && !stage?.notes && labTests.length === 0) return null;

    return (
      <div className="card mb-3">
        <div className="card-header text-white" style={{ backgroundColor: '#6F42C1' }}>
          <h6 className="mb-0">
            <i className="ti ti-test-pipe-2 me-2"></i>
            Laboratory
          </h6>
        </div>
        <div className="card-body">
          {stage?.clockedInAt && (
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Attended By</small>
                <strong>{getStaffName(stage.clockedInBy)}</strong>
              </div>
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Time</small>
                <strong>{formatDateTime(stage.clockedInAt)}</strong>
              </div>
            </div>
          )}

          {labTests.length > 0 && (
            <div className="mt-3">
              <h6 className="mb-2">Lab Tests</h6>
              {labTests.map((test) => (
                <div key={test._id} className="border rounded p-2 mb-2">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>{test.testName}</strong>
                      <div className="text-muted small">Test #{test.testNumber}</div>
                    </div>
                    <span className={`badge ${test.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                      {test.status}
                    </span>
                  </div>
                  {test.result && (
                    <div className="mt-2">
                      <div><strong>Result:</strong> {test.result.findings}</div>
                      {test.result.normalRange && (
                        <div className="text-muted small">Normal Range: {test.result.normalRange}</div>
                      )}
                      {test.result.remarks && (
                        <div className="text-muted small">Interpretation: {test.result.remarks}</div>
                      )}
                      {test.result.performedBy && (
                        <div className="text-muted small mt-1">
                          Performed by: {getStaffName(test.result.performedBy)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {stage?.notes && (
            <div className="mt-3">
              <small className="text-muted d-block">Notes</small>
              <p className="mb-0">{stage.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPharmacyRecord = () => {
    const stage = visitData?.stages?.pharmacy;
    if (!stage?.clockedInAt && !stage?.clockedOutAt && !stage?.notes && prescriptions.length === 0) return null;

    const dispensedPrescriptions = prescriptions.filter(p => p.status === 'dispensed');
    const pendingPrescriptions = prescriptions.filter(p => p.status === 'active');

    return (
      <div className="card mb-3">
        <div className="card-header text-white" style={{ backgroundColor: '#8B5CF6' }}>
          <h6 className="mb-0">
            <i className="ti ti-pill me-2"></i>
            Pharmacy
          </h6>
        </div>
        <div className="card-body">
          {stage?.clockedInAt && (
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Attended By</small>
                <strong>{getStaffName(stage.clockedInBy)}</strong>
              </div>
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Time</small>
                <strong>{formatDateTime(stage.clockedInAt)}</strong>
              </div>
              {stage.clockedOutAt && (
                <div className="col-md-6 mb-2">
                  <small className="text-muted d-block">Clocked Out</small>
                  <strong>{formatDateTime(stage.clockedOutAt)}</strong>
                </div>
              )}
            </div>
          )}

          {dispensedPrescriptions.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2">
                <i className="ti ti-check me-1"></i>
                Dispensed Medications
              </h6>
              {dispensedPrescriptions.map((prescription) => (
                <div key={prescription._id} className="border border-success rounded p-2 mb-2">
                  <div className="mb-2">
                    <small className="text-muted">Rx #{prescription.prescriptionNumber}</small>
                    <span className="badge bg-success ms-2">Dispensed</span>
                    {prescription.dispensedBy && (
                      <div className="text-muted small mt-1">
                        Dispensed by: {getStaffName(prescription.dispensedBy)} on {formatDateTime(prescription.dispensedAt)}
                      </div>
                    )}
                  </div>
                  <ul className="mb-0">
                    {prescription.medications.map((med, index) => (
                      <li key={index}>
                        <strong>{med.name}</strong> - {med.dosage}, {med.frequency}, {med.duration} (Qty: {med.quantity})
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {pendingPrescriptions.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2">
                <i className="ti ti-clock me-1"></i>
                Pending Prescriptions
              </h6>
              {pendingPrescriptions.map((prescription) => (
                <div key={prescription._id} className="border border-warning rounded p-2 mb-2">
                  <div className="mb-2">
                    <small className="text-muted">Rx #{prescription.prescriptionNumber}</small>
                    <span className="badge bg-warning text-dark ms-2">Pending</span>
                  </div>
                  <ul className="mb-0">
                    {prescription.medications.map((med, index) => (
                      <li key={index}>
                        <strong>{med.name}</strong> - {med.dosage}, {med.frequency}, {med.duration}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {stage?.notes && (
            <div className="mt-3">
              <h6 className="mb-1">
                <i className="ti ti-note me-1"></i>
                Notes
              </h6>
              <p className="mb-0">{stage.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBillingRecord = () => {
    const stage = visitData?.stages?.billing;
    if (!stage?.clockedInAt && !stage?.clockedOutAt && !stage?.notes) return null;

    return (
      <div className="card mb-3">
        <div className="card-header bg-info text-white">
          <h6 className="mb-0">
            <i className="ti ti-receipt me-2"></i>
            Billing
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Attended By</small>
              <strong>{getStaffName(stage.clockedInBy)}</strong>
            </div>
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Time</small>
              <strong>{formatDateTime(stage.clockedInAt)}</strong>
            </div>
            {stage.clockedOutAt && (
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Clocked Out</small>
                <strong>{formatDateTime(stage.clockedOutAt)}</strong>
              </div>
            )}
          </div>

          {stage.notes && (
            <div className="mt-3">
              <h6 className="mb-1">
                <i className="ti ti-note me-1"></i>
                Notes
              </h6>
              <p className="mb-0">{stage.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVisitSummary = () => {
    if (!visitData) return null;

    return (
      <div className="card mb-3 border-primary">
        <div className="card-header bg-primary text-white">
          <h6 className="mb-0">
            <i className="ti ti-info-circle me-2"></i>
            Visit Summary
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Visit Number</small>
              <strong>{visitData.visitNumber}</strong>
            </div>
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Patient</small>
              <strong>{patientInfo.name} (ID: {patientInfo.patientId})</strong>
            </div>
          </div>
          
          <div className="mt-3">
            <small className="text-muted d-block mb-2">Visit Progress</small>
            <div className="d-flex flex-wrap gap-2">
              {visitData.stages?.frontDesk?.clockedInAt && (
                <span className="badge bg-primary">
                  <i className="ti ti-check me-1"></i>Front Desk
                </span>
              )}
              {visitData.stages?.nurse?.clockedInAt && (
                <span className="badge bg-success">
                  <i className="ti ti-check me-1"></i>Nurse
                </span>
              )}
              {visitData.stages?.doctor?.clockedInAt && (
                <span className="badge bg-warning text-dark">
                  <i className="ti ti-check me-1"></i>Doctor
                </span>
              )}
              {labTests.length > 0 && (
                <span className="badge" style={{ backgroundColor: '#6F42C1', color: 'white' }}>
                  <i className="ti ti-check me-1"></i>Lab ({labTests.length} test{labTests.length > 1 ? 's' : ''})
                </span>
              )}
              {prescriptions.length > 0 && (
                <span className="badge" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>
                  <i className="ti ti-check me-1"></i>Pharmacy ({prescriptions.length} Rx)
                </span>
              )}
              {visitData.stages?.billing?.clockedInAt && (
                <span className="badge bg-info">
                  <i className="ti ti-check me-1"></i>Billing
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ti ti-file-text me-2"></i>
          Complete Visit Record - {patientInfo.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading visit records...</p>
          </div>
        ) : (
          <div>
            {renderVisitSummary()}
            {renderFrontDeskRecord()}
            {renderNurseRecord()}
            {renderDoctorRecord()}
            {renderLabRecord()}
            {renderPharmacyRecord()}
            {renderBillingRecord()}

            {!visitData?.stages?.frontDesk?.clockedInAt &&
             !visitData?.stages?.frontDesk?.clockedOutAt &&
             !visitData?.stages?.frontDesk?.notes &&
             !visitData?.stages?.nurse?.clockedInAt &&
             !visitData?.stages?.nurse?.clockedOutAt &&
             !visitData?.stages?.nurse?.vitalSigns &&
             !visitData?.stages?.nurse?.notes &&
             !visitData?.stages?.doctor?.clockedInAt &&
             !visitData?.stages?.doctor?.clockedOutAt &&
             !visitData?.stages?.doctor?.diagnosis &&
             !visitData?.stages?.doctor?.notes &&
             !visitData?.stages?.lab?.clockedInAt &&
             !visitData?.stages?.lab?.clockedOutAt &&
             !visitData?.stages?.lab?.notes &&
             labTests.length === 0 &&
             !visitData?.stages?.pharmacy?.clockedInAt &&
             !visitData?.stages?.pharmacy?.clockedOutAt &&
             !visitData?.stages?.pharmacy?.notes &&
             prescriptions.length === 0 &&
             !visitData?.stages?.billing?.clockedInAt &&
             !visitData?.stages?.billing?.clockedOutAt &&
             !visitData?.stages?.billing?.notes && (
              <div className="text-center py-5">
                <i className="ti ti-info-circle fs-1 text-muted d-block mb-2"></i>
                <p className="text-muted mb-0">No department records available yet</p>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}
