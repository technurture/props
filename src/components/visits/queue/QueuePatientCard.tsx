"use client";
import React from 'react';
import Link from 'next/link';
import { PatientVisit, Patient, UserRole } from '@/types/emr';
import { getStageBadgeClass, getStageLabel } from '@/lib/constants/stages';
import PriorityPill from './PriorityPill';
import AssignedDoctorCell from '../AssignedDoctorCell';
import { all_routes } from '@/router/all_routes';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';

interface QueuePatientCardProps {
  visit: PatientVisit;
  waitingMinutes: number;
  userRole?: UserRole;
  onViewRecord: () => void;
  onClockIn?: () => void;
  onHandoff: () => void;
  onAdmit?: () => void;
  onSelectDoctor?: () => void;
  onUpdateDoctor?: () => void;
  onReassign?: () => void;
  hasClocked: boolean;
  canClockIn: boolean;
  canHandoff: boolean;
}

export default function QueuePatientCard({
  visit,
  waitingMinutes,
  userRole,
  onViewRecord,
  onClockIn,
  onHandoff,
  onAdmit,
  onSelectDoctor,
  onUpdateDoctor,
  onReassign,
  hasClocked,
  canClockIn,
  canHandoff
}: QueuePatientCardProps) {
  const patient = typeof visit.patient === 'string' ? null : visit.patient as Patient;
  
  const getPatientName = () => {
    if (!patient) return 'Unknown';
    return `${patient.firstName} ${patient.lastName}`;
  };

  const getPatientId = () => {
    if (!patient) return 'N/A';
    return patient.patientId || 'N/A';
  };

  const getBorderColor = () => {
    if (waitingMinutes > 60) return '#CC0000';
    if (waitingMinutes > 30) return '#FDAF22';
    return '#4A90E2';
  };

  const getBackgroundColor = () => {
    if (waitingMinutes > 60) return 'rgba(204, 0, 0, 0.02)';
    if (waitingMinutes > 30) return 'rgba(253, 175, 34, 0.02)';
    return '#ffffff';
  };

  return (
    <div 
      className="queue-patient-card card h-100"
      style={{
        borderLeft: `4px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        transition: 'all 0.2s ease'
      }}
    >
      <div className="card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1">
            <h6 className="card-title mb-1" style={{ color: '#003366', fontWeight: '600' }}>
              <Link href={`${all_routes.patientDetails}?id=${patient?._id || ''}`} className="text-decoration-none" style={{ color: '#003366' }}>
                {getPatientName()}
              </Link>
            </h6>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-light text-muted border">
                <i className="ti ti-id me-1"></i>
                ID: {getPatientId()}
              </span>
              <span className="badge bg-light text-muted border">
                <i className="ti ti-file-text me-1"></i>
                #{visit.visitNumber}
              </span>
              {visit.labOnly && (
                <span className="badge" style={{ backgroundColor: '#4A90E2', color: 'white' }}>
                  <i className="ti ti-flask me-1"></i>
                  Lab Only
                </span>
              )}
            </div>
          </div>
          <PriorityPill waitingMinutes={waitingMinutes} />
        </div>

        {/* Stage & Doctor Info */}
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="small text-muted">Current Stage:</span>
            <span className={`badge ${getStageBadgeClass(visit.currentStage)}`}>
              {getStageLabel(visit.currentStage)}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Assigned Doctor:</span>
            <div className="flex-grow-1">
              <AssignedDoctorCell
                visitId={visit._id!}
                assignedDoctor={visit.assignedDoctor as any}
                onUpdate={onUpdateDoctor}
              />
            </div>
          </div>
        </div>

        {/* Waiting Time */}
        <div className="mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(74, 144, 226, 0.05)' }}>
          <div className="d-flex align-items-center justify-content-between">
            <span className="small" style={{ color: '#64748B' }}>
              <i className="ti ti-clock me-1"></i>
              Waiting Time
            </span>
            <span className="fw-semibold" style={{ color: getBorderColor() }}>
              {formatDistanceToNow(new Date(Date.now() - waitingMinutes * 60000))}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 flex-wrap">
          <Link
            href={`${all_routes.startVisits}?id=${visit._id}`}
            className="btn btn-sm btn-outline-primary"
            style={{ borderColor: '#003366', color: '#003366' }}
          >
            <i className="ti ti-eye me-1"></i>
            View
          </Link>
          <Link
            href={`${all_routes.patientDetails}?id=${patient?._id || ''}`}
            className="btn btn-sm btn-outline-info"
            style={{ borderColor: '#4A90E2', color: '#4A90E2' }}
          >
            <i className="ti ti-file-text me-1"></i>
            Record
          </Link>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onViewRecord}
            style={{ borderColor: '#6c757d', color: '#6c757d' }}
          >
            <i className="ti ti-clipboard-list me-1"></i>
            Visit Record
          </button>
          
          {canClockIn && onReassign && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={onReassign}
              title="Reassign to another colleague if you're unavailable"
              style={{ borderColor: '#FFC107', color: '#FFC107' }}
            >
              <i className="ti ti-user-share me-1"></i>
              Reassign
            </button>
          )}

          {canClockIn && onClockIn && (
            <button
              className="btn btn-sm btn-success"
              onClick={onClockIn}
              style={{ backgroundColor: '#09800F', borderColor: '#09800F' }}
            >
              <i className="ti ti-stethoscope me-1"></i>
              Clock In
            </button>
          )}

          {hasClocked && onAdmit && userRole === UserRole.DOCTOR && (
            <button
              className="btn btn-sm btn-info"
              onClick={onAdmit}
              style={{ backgroundColor: '#4A90E2', borderColor: '#4A90E2' }}
            >
              <i className="ti ti-bed me-1"></i>
              Admit
            </button>
          )}

          {visit.currentStage === 'returned_to_front_desk' && onSelectDoctor && (
            <button
              className="btn btn-sm btn-primary"
              onClick={onSelectDoctor}
              style={{ backgroundColor: '#003366', borderColor: '#003366' }}
            >
              <i className="ti ti-user-check me-1"></i>
              Select Doctor
            </button>
          )}

          {canHandoff && (
            <button
              className="btn btn-sm btn-primary"
              onClick={onHandoff}
              style={{ backgroundColor: '#003366', borderColor: '#003366' }}
            >
              <i className="ti ti-arrow-right me-1"></i>
              Transfer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
