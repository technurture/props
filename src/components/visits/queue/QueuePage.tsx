"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { all_routes } from '@/router/all_routes';
import { useQueue } from './useQueue';
import QueueTable from './QueueTable';
import QueueOverviewMetrics from './QueueOverviewMetrics';
import QueueFilterBar from './QueueFilterBar';
import QueuePatientCard from './QueuePatientCard';
import NurseClockInModal from './NurseClockInModal';
import DoctorConsultationModal from './DoctorConsultationModal';
import LabClockInModal from './LabClockInModal';
import PharmacyClockInModal from './PharmacyClockInModal';
import BillingClockInModal from './BillingClockInModal';
import AdmitPatientModal from '@/components/visits/modal/AdmitPatientModal';
import ViewDepartmentRecordModal from './ViewDepartmentRecordModal';
import EnhancedHandoffModal from './EnhancedHandoffModal';
import { canAccessStage } from '@/lib/constants/stages';
import { PatientVisit, Patient, UserRole } from '@/types/emr';
import { differenceInMinutes } from 'date-fns';

interface QueuePageProps {
  requiredRole: string;
  pageTitle: string;
  stageName: string;
}

export default function QueuePage({ requiredRole, pageTitle, stageName }: QueuePageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role as UserRole | undefined;
  
  const {
    queue,
    loading,
    pagination,
    searchTerm,
    currentPage,
    fetchQueue,
    handleSearch,
    handlePageChange,
    removeFromQueue,
    autoRefreshEnabled,
    countdown,
    toggleAutoRefresh,
  } = useQueue();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'waitTime' | 'arrival' | 'name'>('waitTime');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'overdue' | 'atRisk' | 'normal'>('all');

  const [showClockInModal, setShowClockInModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<PatientVisit | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctorVisit, setSelectedDoctorVisit] = useState<PatientVisit | null>(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [selectedLabVisit, setSelectedLabVisit] = useState<PatientVisit | null>(null);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [selectedPharmacyVisit, setSelectedPharmacyVisit] = useState<PatientVisit | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedBillingVisit, setSelectedBillingVisit] = useState<PatientVisit | null>(null);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedVisitForAdmission, setSelectedVisitForAdmission] = useState<PatientVisit | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedVisitForRecord, setSelectedVisitForRecord] = useState<PatientVisit | null>(null);
  const [showEnhancedHandoffModal, setShowEnhancedHandoffModal] = useState(false);
  const [selectedVisitForHandoff, setSelectedVisitForHandoff] = useState<PatientVisit | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedVisitForReassign, setSelectedVisitForReassign] = useState<PatientVisit | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(all_routes.login);
      return;
    }

    if (status === 'authenticated' && session?.user?.role) {
      const userRole = session.user.role;
      
      if (userRole !== 'ADMIN' && !canAccessStage(userRole, stageName)) {
        router.push(all_routes.dashboard);
        return;
      }
    }
  }, [status, session, router, requiredRole, stageName]);

  const getWaitingMinutes = (visit: PatientVisit) => {
    const stage = visit.currentStage;
    let clockInTime: Date | undefined;

    switch (stage) {
      case 'front_desk':
        clockInTime = visit.stages.frontDesk?.clockedInAt;
        break;
      case 'nurse':
        clockInTime = visit.stages.nurse?.clockedInAt || visit.stages.frontDesk?.clockedOutAt;
        break;
      case 'doctor':
        clockInTime = visit.stages.doctor?.clockedInAt || visit.stages.nurse?.clockedOutAt;
        break;
      case 'lab':
        clockInTime = visit.stages.lab?.clockedInAt || visit.stages.doctor?.clockedOutAt;
        break;
      case 'pharmacy':
        clockInTime = visit.stages.pharmacy?.clockedInAt || visit.stages.lab?.clockedOutAt;
        break;
      case 'billing':
        clockInTime = visit.stages.billing?.clockedInAt || visit.stages.pharmacy?.clockedOutAt;
        break;
      case 'returned_to_front_desk':
        clockInTime = visit.stages.returnedToFrontDesk?.clockedInAt || visit.stages.billing?.clockedOutAt;
        break;
    }

    if (!clockInTime) return 0;
    return differenceInMinutes(new Date(), new Date(clockInTime));
  };

  const getPatientName = (patient: string | Patient) => {
    if (typeof patient === 'string') return 'Unknown';
    return `${patient.firstName} ${patient.lastName}`;
  };

  const getPatientId = (patient: string | Patient) => {
    if (typeof patient === 'string') return 'N/A';
    return patient.patientId || 'N/A';
  };

  const getFilteredAndSortedQueue = () => {
    let filtered = [...queue];

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(visit => {
        const waitingMinutes = getWaitingMinutes(visit);
        
        switch (urgencyFilter) {
          case 'overdue':
            return waitingMinutes > 60;
          case 'atRisk':
            return waitingMinutes > 30 && waitingMinutes <= 60;
          case 'normal':
            return waitingMinutes <= 30;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'waitTime':
          return getWaitingMinutes(b) - getWaitingMinutes(a);
        case 'arrival': {
          const aTime = a.stages.frontDesk?.clockedInAt || a.createdAt || new Date();
          const bTime = b.stages.frontDesk?.clockedInAt || b.createdAt || new Date();
          return new Date(aTime).getTime() - new Date(bTime).getTime();
        }
        case 'name': {
          const aName = getPatientName(a.patient);
          const bName = getPatientName(b.patient);
          return aName.localeCompare(bName);
        }
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleOpenClockInModal = (visit: PatientVisit) => {
    setSelectedVisit(visit);
    setShowClockInModal(true);
  };

  const handleCloseClockInModal = () => {
    setShowClockInModal(false);
    setSelectedVisit(null);
  };

  const handleClockInSuccess = () => {
    fetchQueue();
    handleCloseClockInModal();
  };

  const handleOpenAdmitModal = (visit: PatientVisit) => {
    setSelectedVisitForAdmission(visit);
    setShowAdmitModal(true);
  };

  const handleCloseAdmitModal = () => {
    setShowAdmitModal(false);
    setSelectedVisitForAdmission(null);
  };

  const handleAdmitSuccess = () => {
    fetchQueue();
    handleCloseAdmitModal();
  };

  const handleOpenDoctorModal = (visit: PatientVisit) => {
    setSelectedDoctorVisit(visit);
    setShowDoctorModal(true);
  };

  const handleCloseDoctorModal = () => {
    setShowDoctorModal(false);
    setSelectedDoctorVisit(null);
  };

  const handleDoctorClockInSuccess = () => {
    fetchQueue();
    handleCloseDoctorModal();
  };

  const handleOpenLabModal = (visit: PatientVisit) => {
    setSelectedLabVisit(visit);
    setShowLabModal(true);
  };

  const handleCloseLabModal = () => {
    setShowLabModal(false);
    setSelectedLabVisit(null);
  };

  const handleLabClockInSuccess = () => {
    fetchQueue();
    handleCloseLabModal();
  };

  const handleOpenPharmacyModal = (visit: PatientVisit) => {
    setSelectedPharmacyVisit(visit);
    setShowPharmacyModal(true);
  };

  const handleClosePharmacyModal = () => {
    setShowPharmacyModal(false);
    setSelectedPharmacyVisit(null);
  };

  const handlePharmacyClockInSuccess = () => {
    fetchQueue();
    handleClosePharmacyModal();
  };

  const handleOpenBillingModal = (visit: PatientVisit) => {
    setSelectedBillingVisit(visit);
    setShowBillingModal(true);
  };

  const handleCloseBillingModal = () => {
    setShowBillingModal(false);
    setSelectedBillingVisit(null);
  };

  const handleBillingClockInSuccess = () => {
    fetchQueue();
    handleCloseBillingModal();
  };

  const handleOpenRecordModal = (visit: PatientVisit) => {
    setSelectedVisitForRecord(visit);
    setShowRecordModal(true);
  };

  const handleCloseRecordModal = () => {
    setShowRecordModal(false);
    setSelectedVisitForRecord(null);
  };

  const handleOpenEnhancedHandoffModal = (visit: PatientVisit) => {
    setSelectedVisitForHandoff(visit);
    setShowEnhancedHandoffModal(true);
  };

  const handleCloseEnhancedHandoffModal = () => {
    setShowEnhancedHandoffModal(false);
    setSelectedVisitForHandoff(null);
  };

  const handleEnhancedHandoffSuccess = () => {
    if (selectedVisitForHandoff) {
      removeFromQueue(selectedVisitForHandoff._id!);
    }
    handleCloseEnhancedHandoffModal();
  };

  const handleOpenReassignModal = (visit: PatientVisit) => {
    setSelectedVisitForReassign(visit);
    setShowReassignModal(true);
  };

  const handleCloseReassignModal = () => {
    setShowReassignModal(false);
    setSelectedVisitForReassign(null);
  };

  const handleReassignSuccess = () => {
    fetchQueue();
    handleCloseReassignModal();
  };

  const handleUpdateDoctor = () => {
    fetchQueue();
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <nav aria-label="Queue pagination">
        <ul className="pagination justify-content-center mb-0">
          <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              Previous
            </button>
          </li>
          {startPage > 1 && (
            <>
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(1)}>
                  1
                </button>
              </li>
              {startPage > 2 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
            </>
          )}
          {pages.map((page) => (
            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(page)}>
                {page}
              </button>
            </li>
          ))}
          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => handlePageChange(pagination.totalPages)}
                >
                  {pagination.totalPages}
                </button>
              </li>
            </>
          )}
          <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const isAssignedToCurrentUser = (visit: PatientVisit): boolean => {
    const userId = session?.user?.id;
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

  const getActionCapabilities = (visit: PatientVisit) => {
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

    let canClockIn = false;
    let hasClocked = false;
    let canHandoff = false;
    let onClockIn: (() => void) | undefined;

    if (isNurse && visit.currentStage === 'nurse') {
      canClockIn = !hasNurseClockedIn;
      hasClocked = hasNurseClockedIn;
      canHandoff = hasNurseClockedIn;
      onClockIn = () => handleOpenClockInModal(visit);
    } else if (isDoctor && visit.currentStage === 'doctor') {
      canClockIn = !hasDoctorClockedIn;
      hasClocked = hasDoctorClockedIn;
      canHandoff = hasDoctorClockedIn;
      onClockIn = () => handleOpenDoctorModal(visit);
    } else if (isLab && visit.currentStage === 'lab') {
      canClockIn = !hasLabClockedIn;
      hasClocked = hasLabClockedIn;
      canHandoff = hasLabClockedIn;
      onClockIn = () => handleOpenLabModal(visit);
    } else if (isPharmacy && visit.currentStage === 'pharmacy') {
      canClockIn = !hasPharmacyClockedIn;
      hasClocked = hasPharmacyClockedIn;
      canHandoff = hasPharmacyClockedIn;
      onClockIn = () => handleOpenPharmacyModal(visit);
    } else if (isBilling && visit.currentStage === 'billing') {
      canClockIn = !hasBillingClockedIn;
      hasClocked = hasBillingClockedIn;
      canHandoff = hasBillingClockedIn;
      onClockIn = () => handleOpenBillingModal(visit);
    } else if (isFrontDesk && visit.currentStage === 'returned_to_front_desk') {
      canHandoff = true;
    }

    return { canClockIn, hasClocked, canHandoff, onClockIn };
  };

  const filteredAndSortedQueue = getFilteredAndSortedQueue();

  if (status === 'loading') {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
          <div className="breadcrumb-arrow">
            <h4 className="mb-1">{pageTitle}</h4>
            <div className="text-end">
              <ol className="breadcrumb m-0 py-0">
                <li className="breadcrumb-item">
                  <Link href={all_routes.dashboard}>Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href={all_routes.visits}>Visits</Link>
                </li>
                <li className="breadcrumb-item active">{pageTitle}</li>
              </ol>
            </div>
          </div>
          <div className="gap-2 d-flex align-items-center flex-wrap">
            <div className="d-flex align-items-center gap-2 me-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="autoRefreshToggle"
                  checked={autoRefreshEnabled}
                  onChange={toggleAutoRefresh}
                  disabled={!!searchTerm}
                />
                <label className="form-check-label" htmlFor="autoRefreshToggle">
                  Auto-refresh
                </label>
              </div>
              {autoRefreshEnabled && !searchTerm && (
                <span className="badge bg-success">
                  ON (refreshing in {countdown}s)
                </span>
              )}
              {searchTerm && (
                <span className="badge bg-warning text-dark">
                  Disabled while searching
                </span>
              )}
            </div>
            <button
              onClick={fetchQueue}
              className="btn btn-icon btn-white"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              aria-label="Refresh"
              data-bs-original-title="Refresh"
              disabled={loading}
            >
              <i className={`ti ti-refresh ${loading ? 'fa-spin' : ''}`} />
            </button>
          </div>
        </div>

        <QueueOverviewMetrics queue={queue} currentStage={stageName} />

        <QueueFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          urgencyFilter={urgencyFilter}
          onUrgencyFilterChange={setUrgencyFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {viewMode === 'cards' ? (
          <div className="card mb-4">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredAndSortedQueue.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-inbox fs-1 text-muted d-block mb-2"></i>
                  <p className="text-muted mb-0">No patients in queue</p>
                </div>
              ) : (
                <div className="row g-3">
                  {filteredAndSortedQueue.map((visit) => {
                    const waitingMinutes = getWaitingMinutes(visit);
                    const { canClockIn, hasClocked, canHandoff, onClockIn } = getActionCapabilities(visit);
                    const isAssignedToMe = isAssignedToCurrentUser(visit);

                    return (
                      <div key={visit._id} className="col-12 col-md-6 col-xl-4">
                        <QueuePatientCard
                          visit={visit}
                          waitingMinutes={waitingMinutes}
                          userRole={userRole}
                          onViewRecord={() => handleOpenRecordModal(visit)}
                          onClockIn={onClockIn}
                          onHandoff={() => handleOpenEnhancedHandoffModal(visit)}
                          onAdmit={hasClocked && userRole === UserRole.DOCTOR ? () => handleOpenAdmitModal(visit) : undefined}
                          onSelectDoctor={visit.currentStage === 'returned_to_front_desk' ? () => handleOpenEnhancedHandoffModal(visit) : undefined}
                          onUpdateDoctor={handleUpdateDoctor}
                          onReassign={canClockIn && isAssignedToMe ? () => handleOpenReassignModal(visit) : undefined}
                          hasClocked={hasClocked}
                          canClockIn={canClockIn}
                          canHandoff={canHandoff}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="card mb-4">
              <div className="card-body">
                <QueueTable
                  queue={filteredAndSortedQueue}
                  loading={loading}
                  onHandoffSuccess={removeFromQueue}
                  onClockInSuccess={fetchQueue}
                  onOpenClockInModal={handleOpenClockInModal}
                  onOpenDoctorModal={handleOpenDoctorModal}
                  onOpenLabModal={handleOpenLabModal}
                  onOpenPharmacyModal={handleOpenPharmacyModal}
                  onOpenBillingModal={handleOpenBillingModal}
                  onOpenAdmitModal={handleOpenAdmitModal}
                  onOpenRecordModal={handleOpenRecordModal}
                  onOpenHandoffModal={handleOpenEnhancedHandoffModal}
                  onOpenReassignModal={handleOpenReassignModal}
                />
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="card">
                <div className="card-body">
                  {renderPagination()}
                </div>
              </div>
            )}
          </>
        )}

        {selectedVisit && (
          <NurseClockInModal
            visitId={selectedVisit._id!}
            patientInfo={{
              name: getPatientName(selectedVisit.patient),
              patientId: getPatientId(selectedVisit.patient),
            }}
            onSuccess={handleClockInSuccess}
            show={showClockInModal}
            onHide={handleCloseClockInModal}
          />
        )}

        {selectedDoctorVisit && (
          <DoctorConsultationModal
            visit={selectedDoctorVisit}
            patientInfo={{
              name: getPatientName(selectedDoctorVisit.patient),
              patientId: getPatientId(selectedDoctorVisit.patient),
            }}
            onSuccess={handleDoctorClockInSuccess}
            show={showDoctorModal}
            onHide={handleCloseDoctorModal}
          />
        )}

        {selectedLabVisit && (
          <LabClockInModal
            visit={selectedLabVisit}
            patientInfo={{
              name: getPatientName(selectedLabVisit.patient),
              patientId: getPatientId(selectedLabVisit.patient),
            }}
            onSuccess={handleLabClockInSuccess}
            show={showLabModal}
            onHide={handleCloseLabModal}
          />
        )}

        {selectedVisitForAdmission && (
          <AdmitPatientModal
            show={showAdmitModal}
            onHide={handleCloseAdmitModal}
            visitId={selectedVisitForAdmission._id!}
            patientId={typeof selectedVisitForAdmission.patient === 'string' ? selectedVisitForAdmission.patient : selectedVisitForAdmission.patient._id!}
            patientName={getPatientName(selectedVisitForAdmission.patient)}
            assignedDoctorId={typeof selectedVisitForAdmission.assignedDoctor === 'string' ? selectedVisitForAdmission.assignedDoctor : selectedVisitForAdmission.assignedDoctor?._id}
            onSuccess={handleAdmitSuccess}
          />
        )}

        {selectedPharmacyVisit && (
          <PharmacyClockInModal
            visit={selectedPharmacyVisit}
            patientInfo={{
              name: getPatientName(selectedPharmacyVisit.patient),
              patientId: getPatientId(selectedPharmacyVisit.patient),
            }}
            onSuccess={handlePharmacyClockInSuccess}
            show={showPharmacyModal}
            onHide={handleClosePharmacyModal}
          />
        )}

        {selectedBillingVisit && (
          <BillingClockInModal
            visit={selectedBillingVisit}
            patientInfo={{
              name: getPatientName(selectedBillingVisit.patient),
              patientId: getPatientId(selectedBillingVisit.patient),
            }}
            onSuccess={handleBillingClockInSuccess}
            show={showBillingModal}
            onHide={handleCloseBillingModal}
          />
        )}

        {selectedVisitForRecord && (
          <ViewDepartmentRecordModal
            visitId={selectedVisitForRecord._id!}
            patientInfo={{
              name: getPatientName(selectedVisitForRecord.patient),
              patientId: getPatientId(selectedVisitForRecord.patient),
            }}
            show={showRecordModal}
            onHide={handleCloseRecordModal}
          />
        )}

        {showEnhancedHandoffModal && selectedVisitForHandoff && (
          <EnhancedHandoffModal
            visit={selectedVisitForHandoff}
            currentStage={selectedVisitForHandoff.currentStage}
            onSuccess={handleEnhancedHandoffSuccess}
            onClose={handleCloseEnhancedHandoffModal}
          />
        )}

        {showReassignModal && selectedVisitForReassign && (
          <EnhancedHandoffModal
            visit={selectedVisitForReassign}
            currentStage={selectedVisitForReassign.currentStage}
            onSuccess={handleReassignSuccess}
            onClose={handleCloseReassignModal}
            isReassignment={true}
          />
        )}
      </div>
    </div>
  );
}
