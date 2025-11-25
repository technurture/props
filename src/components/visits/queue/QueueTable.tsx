"use client";
import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PatientVisit, Patient, UserRole } from '@/types/emr';
import { getStageBadgeClass, getStageLabel } from '@/lib/constants/stages';
import AssignedDoctorCell from '../AssignedDoctorCell';
import { all_routes } from '@/router/all_routes';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';

interface QueueTableProps {
  queue: PatientVisit[];
  loading: boolean;
  onHandoffSuccess: (visitId: string) => void;
  onClockInSuccess?: () => void;
  onOpenClockInModal?: (visit: PatientVisit) => void;
  onOpenDoctorModal?: (visit: PatientVisit) => void;
  onOpenLabModal?: (visit: PatientVisit) => void;
  onOpenPharmacyModal?: (visit: PatientVisit) => void;
  onOpenBillingModal?: (visit: PatientVisit) => void;
  onOpenAdmitModal?: (visit: PatientVisit) => void;
  onOpenRecordModal?: (visit: PatientVisit) => void;
  onOpenHandoffModal?: (visit: PatientVisit) => void;
  onOpenReassignModal?: (visit: PatientVisit) => void;
}

export default function QueueTable({ 
  queue, 
  loading, 
  onHandoffSuccess, 
  onClockInSuccess,
  onOpenClockInModal,
  onOpenDoctorModal,
  onOpenLabModal,
  onOpenPharmacyModal,
  onOpenBillingModal,
  onOpenAdmitModal,
  onOpenRecordModal,
  onOpenHandoffModal,
  onOpenReassignModal
}: QueueTableProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;
  const userId = session?.user?.id;
  
  const formatTimeWaiting = (clockedInAt?: Date) => {
    if (!clockedInAt) return 'N/A';
    try {
      return formatDistanceToNow(new Date(clockedInAt), { addSuffix: true });
    } catch {
      return 'N/A';
    }
  };

  const getWaitingTimeAlertClass = (clockedInAt?: Date): string => {
    if (!clockedInAt) return '';
    try {
      const minutes = differenceInMinutes(new Date(), new Date(clockedInAt));
      if (minutes > 60) return 'text-danger';
      if (minutes > 30) return 'text-warning';
      return '';
    } catch {
      return '';
    }
  };

  const getPatientName = (patient: string | Patient) => {
    if (typeof patient === 'string') return 'Unknown';
    return `${patient.firstName} ${patient.lastName}`;
  };

  const getPatientId = (patient: string | Patient) => {
    if (typeof patient === 'string') return 'N/A';
    return patient.patientId || 'N/A';
  };

  const getCurrentStageClockIn = (visit: PatientVisit) => {
    const stage = visit.currentStage;
    
    // If current stage has clocked in, use that time
    switch (stage) {
      case 'front_desk':
        return visit.stages.frontDesk?.clockedInAt;
      case 'nurse':
        // If nurse has clocked in, use that. Otherwise, use when front desk handed off (clocked out)
        return visit.stages.nurse?.clockedInAt || visit.stages.frontDesk?.clockedOutAt;
      case 'doctor':
        // If doctor has clocked in, use that. Otherwise, use when nurse handed off (clocked out)
        return visit.stages.doctor?.clockedInAt || visit.stages.nurse?.clockedOutAt;
      case 'lab':
        // If lab has clocked in, use that. Otherwise, use when doctor handed off (clocked out)
        return visit.stages.lab?.clockedInAt || visit.stages.doctor?.clockedOutAt;
      case 'pharmacy':
        // If pharmacy has clocked in, use that. Otherwise, use when lab handed off (clocked out)
        return visit.stages.pharmacy?.clockedInAt || visit.stages.lab?.clockedOutAt;
      case 'billing':
        // If billing has clocked in, use that. Otherwise, use when pharmacy handed off (clocked out)
        return visit.stages.billing?.clockedInAt || visit.stages.pharmacy?.clockedOutAt;
      case 'returned_to_front_desk':
        // Use when billing handed off (clocked out)
        return visit.stages.returnedToFrontDesk?.clockedInAt || visit.stages.billing?.clockedOutAt;
      default:
        return undefined;
    }
  };

  const isAssignedToCurrentUser = (visit: PatientVisit): boolean => {
    if (!userId) return false;
    
    switch (userRole) {
      case UserRole.NURSE:
        const assignedNurseId = typeof visit.assignedNurse === 'string' 
          ? visit.assignedNurse 
          : visit.assignedNurse?._id;
        return assignedNurseId === userId;
      case UserRole.DOCTOR:
        const assignedDoctorId = typeof visit.assignedDoctor === 'string'
          ? visit.assignedDoctor
          : visit.assignedDoctor?._id;
        return assignedDoctorId === userId;
      case UserRole.LAB:
        const assignedLabId = typeof visit.assignedLab === 'string'
          ? visit.assignedLab
          : visit.assignedLab?._id;
        return assignedLabId === userId;
      case UserRole.PHARMACY:
        const assignedPharmacyId = typeof visit.assignedPharmacy === 'string'
          ? visit.assignedPharmacy
          : visit.assignedPharmacy?._id;
        return assignedPharmacyId === userId;
      case UserRole.BILLING:
        const assignedBillingId = typeof visit.assignedBilling === 'string'
          ? visit.assignedBilling
          : visit.assignedBilling?._id;
        return assignedBillingId === userId;
      default:
        return false;
    }
  };


  const renderActionButtons = (visit: PatientVisit) => {
    const patient = visit.patient;
    const isNurse = userRole === UserRole.NURSE;
    const isDoctor = userRole === UserRole.DOCTOR;
    const isLab = userRole === UserRole.LAB;
    const isPharmacy = userRole === UserRole.PHARMACY;
    const isBilling = userRole === UserRole.BILLING;
    const isFrontDesk = userRole === UserRole.FRONT_DESK;
    const hasNurseClockedIn = !!visit.stages.nurse?.clockedInAt;
    const hasDoctorClockedIn = !!visit.stages.doctor?.clockedInAt;
    const hasLabClockedIn = !!visit.stages.lab?.clockedInAt;
    const hasPharmacyClockedIn = !!visit.stages.pharmacy?.clockedInAt;
    const hasBillingClockedIn = !!visit.stages.billing?.clockedInAt;

    if (isNurse && visit.currentStage === 'nurse' && !hasNurseClockedIn) {
      const isAssignedToMe = isAssignedToCurrentUser(visit);
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          {isAssignedToMe && onOpenReassignModal && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => onOpenReassignModal(visit)}
              title="Reassign to another nurse if you're unavailable"
            >
              <i className="ti ti-user-share me-1"></i>
              Reassign
            </button>
          )}
          <button
            className="btn btn-sm btn-success"
            onClick={() => onOpenClockInModal?.(visit)}
          >
            <i className="ti ti-stethoscope me-1"></i>
            Clock In & Record Vitals
          </button>
        </>
      );
    }

    if (isDoctor && visit.currentStage === 'doctor' && !hasDoctorClockedIn) {
      const isAssignedToMe = isAssignedToCurrentUser(visit);
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          {isAssignedToMe && onOpenReassignModal && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => onOpenReassignModal(visit)}
              title="Reassign to another doctor if you're unavailable"
            >
              <i className="ti ti-user-share me-1"></i>
              Reassign
            </button>
          )}
          <button
            className="btn btn-sm btn-success"
            onClick={() => onOpenDoctorModal?.(visit)}
          >
            <i className="ti ti-stethoscope me-1"></i>
            Clock In & Start Consultation
          </button>
        </>
      );
    }

    if (isLab && visit.currentStage === 'lab' && !hasLabClockedIn) {
      const isAssignedToMe = isAssignedToCurrentUser(visit);
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          {isAssignedToMe && onOpenReassignModal && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => onOpenReassignModal(visit)}
              title="Reassign to another lab technician if you're unavailable"
            >
              <i className="ti ti-user-share me-1"></i>
              Reassign
            </button>
          )}
          <button
            className="btn btn-sm btn-success"
            onClick={() => onOpenLabModal?.(visit)}
            style={{ backgroundColor: '#6F42C1', borderColor: '#6F42C1' }}
          >
            <i className="ti ti-test-pipe-2 me-1"></i>
            Clock In & Add Results
          </button>
        </>
      );
    }

    if (isPharmacy && visit.currentStage === 'pharmacy' && !hasPharmacyClockedIn) {
      const isAssignedToMe = isAssignedToCurrentUser(visit);
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          {isAssignedToMe && onOpenReassignModal && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => onOpenReassignModal(visit)}
              title="Reassign to another pharmacist if you're unavailable"
            >
              <i className="ti ti-user-share me-1"></i>
              Reassign
            </button>
          )}
          <button
            className="btn btn-sm btn-success"
            onClick={() => onOpenPharmacyModal?.(visit)}
            style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}
          >
            <i className="ti ti-pill me-1"></i>
            Clock In & Dispense
          </button>
        </>
      );
    }

    if (isBilling && visit.currentStage === 'billing' && !hasBillingClockedIn) {
      const isAssignedToMe = isAssignedToCurrentUser(visit);
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          {isAssignedToMe && onOpenReassignModal && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => onOpenReassignModal(visit)}
              title="Reassign to another billing staff if you're unavailable"
            >
              <i className="ti ti-user-share me-1"></i>
              Reassign
            </button>
          )}
          <button
            className="btn btn-sm btn-success"
            onClick={() => onOpenBillingModal?.(visit)}
            style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
          >
            <i className="ti ti-receipt me-1"></i>
            Clock In & Process Payment
          </button>
        </>
      );
    }

    if (isDoctor && visit.currentStage === 'doctor' && hasDoctorClockedIn) {
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          <button
            className="btn btn-sm btn-info"
            onClick={() => onOpenAdmitModal?.(visit)}
          >
            <i className="ti ti-bed me-1"></i>
            Admit Patient
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onOpenHandoffModal?.(visit)}
          >
            <i className="ti ti-arrow-right me-1"></i>
            Transfer Patient
          </button>
        </>
      );
    }

    if (isNurse && visit.currentStage === 'nurse' && hasNurseClockedIn) {
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onOpenHandoffModal?.(visit)}
          >
            <i className="ti ti-arrow-right me-1"></i>
            Transfer Patient
          </button>
        </>
      );
    }

    if (isLab && visit.currentStage === 'lab' && hasLabClockedIn) {
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onOpenHandoffModal?.(visit)}
          >
            <i className="ti ti-arrow-right me-1"></i>
            Transfer Patient
          </button>
        </>
      );
    }

    if (isPharmacy && visit.currentStage === 'pharmacy' && hasPharmacyClockedIn) {
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onOpenHandoffModal?.(visit)}
          >
            <i className="ti ti-arrow-right me-1"></i>
            Transfer Patient
          </button>
        </>
      );
    }

    if (isBilling && visit.currentStage === 'billing' && hasBillingClockedIn) {
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onOpenHandoffModal?.(visit)}
          >
            <i className="ti ti-arrow-right me-1"></i>
            Transfer Patient
          </button>
        </>
      );
    }

    if (isFrontDesk && visit.currentStage === 'returned_to_front_desk') {
      return (
        <>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => onOpenRecordModal?.(visit)}
          >
            <i className="ti ti-file-text me-1"></i>
            View Record
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onOpenHandoffModal?.(visit)}
          >
            <i className="ti ti-arrow-right me-1"></i>
            Transfer Patient
          </button>
        </>
      );
    }

    return (
      <>
        <button
          className="btn btn-sm btn-outline-info"
          onClick={() => onOpenRecordModal?.(visit)}
        >
          <i className="ti ti-file-text me-1"></i>
          View Record
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => onOpenHandoffModal?.(visit)}
        >
          <i className="ti ti-arrow-right me-1"></i>
          Transfer Patient
        </button>
      </>
    );
  };

  const renderSkeletonRow = (key: number) => (
    <tr key={key}>
      <td><span className="placeholder col-8"></span></td>
      <td><span className="placeholder col-10"></span></td>
      <td><span className="placeholder col-6"></span></td>
      <td><span className="placeholder col-8"></span></td>
      <td><span className="placeholder col-8"></span></td>
      <td><span className="placeholder col-6"></span></td>
      <td><span className="placeholder col-4"></span></td>
    </tr>
  );

  const renderMobileCard = (visit: PatientVisit) => {
    const patient = visit.patient;
    const clockInTime = getCurrentStageClockIn(visit);

    return (
      <div key={visit._id} className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 className="mb-1">
                <Link href={`${all_routes.patientDetails}?id=${typeof patient === 'string' ? patient : patient._id}`}>
                  {getPatientName(patient)}
                </Link>
              </h6>
              <p className="text-muted small mb-0">ID: {getPatientId(patient)}</p>
            </div>
            <div className="d-flex flex-column align-items-end gap-1">
              <span className={`badge ${getStageBadgeClass(visit.currentStage)}`}>
                {getStageLabel(visit.currentStage)}
              </span>
              {visit.labOnly && (
                <span className="badge bg-info" style={{ fontSize: '0.7rem' }}>
                  <i className="ti ti-flask"></i> Lab Only
                </span>
              )}
            </div>
          </div>
          <div className="mb-2">
            <small className="text-muted d-block">Visit #: {visit.visitNumber}</small>
            <small className="text-muted d-block">Waiting: {formatTimeWaiting(clockInTime)}</small>
            <div className="mt-1">
              <small className="text-muted d-block">Assigned Doctor:</small>
              <AssignedDoctorCell
                visitId={visit._id!}
                assignedDoctor={visit.assignedDoctor as any}
                onUpdate={onClockInSuccess}
              />
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link
              href={`${all_routes.startVisits}?id=${visit._id}`}
              className="btn btn-sm btn-outline-primary flex-grow-1"
            >
              <i className="ti ti-eye me-1"></i>
              View
            </Link>
            {renderActionButtons(visit)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="d-none d-md-block">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Visit Number</th>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Assigned Doctor</th>
                <th>Current Stage</th>
                <th>Time Waiting</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => renderSkeletonRow(index))
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <i className="ti ti-inbox fs-1 text-muted d-block mb-2"></i>
                    <p className="text-muted mb-0">No patients in queue</p>
                  </td>
                </tr>
              ) : (
                queue.map((visit) => {
                  const patient = visit.patient;
                  const clockInTime = getCurrentStageClockIn(visit);

                  return (
                    <tr key={visit._id}>
                      <td>
                        <Link href={`${all_routes.startVisits}?id=${visit._id}`} className="text-primary">
                          {visit.visitNumber}
                        </Link>
                        {visit.labOnly && (
                          <span className="badge bg-info ms-2" style={{ fontSize: '0.7rem' }}>
                            <i className="ti ti-flask"></i> Lab Only
                          </span>
                        )}
                      </td>
                      <td>
                        <Link href={`${all_routes.patientDetails}?id=${typeof patient === 'string' ? patient : patient._id}`}>
                          {getPatientName(patient)}
                        </Link>
                      </td>
                      <td>{getPatientId(patient)}</td>
                      <td>
                        <AssignedDoctorCell
                          visitId={visit._id!}
                          assignedDoctor={visit.assignedDoctor as any}
                          onUpdate={onClockInSuccess}
                        />
                      </td>
                      <td>
                        <span className={`badge ${getStageBadgeClass(visit.currentStage)}`}>
                          {getStageLabel(visit.currentStage)}
                        </span>
                      </td>
                      <td>{formatTimeWaiting(clockInTime)}</td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <Link
                            href={`${all_routes.startVisits}?id=${visit._id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="ti ti-eye"></i>
                          </Link>
                          {renderActionButtons(visit)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-md-none">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card mb-3">
              <div className="card-body">
                <span className="placeholder col-12 mb-2"></span>
                <span className="placeholder col-8 mb-2"></span>
                <span className="placeholder col-6"></span>
              </div>
            </div>
          ))
        ) : queue.length === 0 ? (
          <div className="text-center py-5">
            <i className="ti ti-inbox fs-1 text-muted d-block mb-2"></i>
            <p className="text-muted mb-0">No patients in queue</p>
          </div>
        ) : (
          queue.map(renderMobileCard)
        )}
      </div>

    </>
  );
}
