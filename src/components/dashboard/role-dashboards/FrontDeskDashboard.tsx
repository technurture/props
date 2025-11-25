"use client";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";
import { useQueueUpdateListener } from "@/lib/utils/queue-events";

import ChartOne from "../chart/chart1";
import ChartTwo from "../chart/chart2";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import PredefinedDatePicker from "@/core/common-components/common-date-range-picker/PredefinedDatePicker";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CreateLabVisitModal from "../CreateLabVisitModal";
import HandoffButton from "@/components/visits/handoff/HandoffButton";

interface PatientInfo {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  patientId: string;
}

interface PendingCheckIn {
  _id: string;
  patient: PatientInfo;
  patientId: PatientInfo;
  appointmentDate: string;
  appointmentTime: string;
  reasonForVisit: string;
  status: string;
  visit?: any;
  currentStage?: string;
  visitStatus?: string;
  isWalkIn?: boolean;
  isReturnedPatient?: boolean;
}

interface DashboardStats {
  appointmentsToday: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  newPatientsToday: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  pendingCheckIns: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  visitsToday: number;
  pendingAppointments: PendingCheckIn[];
}

const FrontDeskDashboard = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingVisit, setStartingVisit] = useState<string | null>(null);
  const [showLabVisitModal, setShowLabVisitModal] = useState(false);
  const isRefreshingRef = useRef(false);

  const fetchDashboardStats = useCallback(async (isBackgroundRefresh = false) => {
    if (isRefreshingRef.current) return;
    
    try {
      isRefreshingRef.current = true;
      if (!isBackgroundRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      const data = await apiClient.get<DashboardStats>('/api/dashboard/stats', {
        showErrorToast: false
      });
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, []);

  useQueueUpdateListener(useCallback(() => {
    console.log('[FrontDeskDashboard] Queue update event received, refreshing stats...');
    fetchDashboardStats(true);
  }, [fetchDashboardStats]));

  useEffect(() => {
    fetchDashboardStats();

    const refreshInterval = setInterval(() => {
      fetchDashboardStats(true);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [fetchDashboardStats]);

  const handleStartVisit = async (appointment: PendingCheckIn) => {
    const appointmentId = appointment._id;
    const patient = appointment.patient || appointment.patientId;
    
    if (!patient?._id) {
      toast.error('Patient information is missing. Cannot start visit.');
      return;
    }

    try {
      setStartingVisit(appointmentId);
      
      const visitData = {
        patient: patient._id,
        branchId: session?.user?.branch?._id || session?.user?.branch,
        visitDate: new Date().toISOString(),
        appointment: appointmentId,
      };

      const response = await apiClient.post<{ visit: { _id: string } }>(
        '/api/visits',
        visitData,
        { 
          successMessage: 'Visit started successfully. Redirecting...',
          showErrorToast: true 
        }
      );

      if (response?.visit?._id) {
        router.push(`${all_routes.startVisits}?id=${response.visit._id}`);
      }
    } catch (error: any) {
      console.error('Failed to start visit:', error);
      toast.error(error.message || 'Failed to start visit. Please try again.');
    } finally {
      setStartingVisit(null);
    }
  };

  const handleCheckOut = async (appointment: PendingCheckIn) => {
    const appointmentId = appointment._id;
    const visitId = appointment.visit?._id;

    if (!visitId) {
      toast.error('Visit information is missing. Cannot check out patient.');
      return;
    }

    try {
      setStartingVisit(appointmentId);

      await apiClient.post(
        `/api/visits/${visitId}/checkout`,
        {},
        {
          successMessage: 'Patient checked out successfully',
          showErrorToast: true
        }
      );

      // Refresh the dashboard
      await fetchDashboardStats();
    } catch (error: any) {
      console.error('Failed to check out patient:', error);
      toast.error(error.message || 'Failed to check out patient. Please try again.');
    } finally {
      setStartingVisit(null);
    }
  };

  const getAppointmentActionButton = (appointment: PendingCheckIn) => {
    const isLoading = startingVisit === appointment._id;
    const patient = appointment.patient || appointment.patientId;

    // WALK-IN PATIENT IN FRONT DESK - Show Handoff button
    if (appointment.currentStage === 'front_desk' && appointment.visitStatus === 'in_progress') {
      return (
        <HandoffButton
          visitId={appointment.visit?._id}
          currentStage="front_desk"
          patientName={patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
          onSuccess={fetchDashboardStats}
          variant="success"
          size="sm"
        />
      );
    }

    // RETURNED TO FRONT DESK - Show Handoff button
    if (appointment.currentStage === 'returned_to_front_desk' && appointment.visitStatus === 'in_progress') {
      return (
        <HandoffButton
          visitId={appointment.visit?._id}
          currentStage="returned_to_front_desk"
          patientName={patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
          onSuccess={fetchDashboardStats}
          variant="primary"
          size="sm"
        />
      );
    }

    // VISIT COMPLETED (but appointment not checked out yet) - Show Check Out button
    if (appointment.visitStatus === 'completed' && appointment.status !== 'COMPLETED') {
      return (
        <button
          onClick={() => handleCheckOut(appointment)}
          className="btn btn-sm"
          style={{ backgroundColor: '#CC0000', color: 'white', borderColor: '#CC0000' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Checking Out...
            </>
          ) : (
            <>
              <i className="ti ti-check me-1"></i>
              Check Out Patient
            </>
          )}
        </button>
      );
    }

    // SCHEDULED or CONFIRMED - Show Check In button
    if (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') {
      return (
        <button
          onClick={() => handleStartVisit(appointment)}
          className="btn btn-sm btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Starting...
            </>
          ) : (
            'Check In & Start Visit'
          )}
        </button>
      );
    }

    // IN_PROGRESS - Show status badge with current department
    if (appointment.status === 'IN_PROGRESS' && appointment.visitStatus === 'in_progress') {
      const stageLabels: Record<string, string> = {
        front_desk: 'Front Desk',
        nurse: 'With Nurse',
        doctor: 'With Doctor',
        lab: 'Laboratory',
        pharmacy: 'Pharmacy',
        billing: 'Billing'
      };
      
      const stageLabel = stageLabels[appointment.currentStage || ''] || 'In Progress';
      
      return (
        <span className="badge badge-soft-info">
          <i className="ti ti-activity me-1"></i>
          {stageLabel}
        </span>
      );
    }

    // Default - Show status badge  
    const statusLabels: Record<string, string> = {
      'SCHEDULED': 'Scheduled',
      'CONFIRMED': 'Confirmed',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
      'NO_SHOW': 'No Show'
    };
    
    return (
      <span className="badge badge-soft-secondary">
        {statusLabels[appointment.status] || appointment.status}
      </span>
    );
  };

  const formatAppointmentDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const userName = session?.user?.name || 'Front Desk';

  return (
    <div className="page-wrapper" id="main-content">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
          <div className="breadcrumb-arrow">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge" style={{ backgroundColor: '#CC0000', color: 'white', padding: '6px 12px', fontSize: '13px' }}>
                <i className="ti ti-calendar-user me-1" />
                Front Desk
              </span>
            </div>
            <h4 className="mb-1 d-flex align-items-center gap-2">
              <i className="ti ti-building-community" style={{ color: '#CC0000' }} />
              Welcome, {userName}
            </h4>
            <p className="mb-0">
              Today you have {loading ? '...' : stats?.appointmentsToday.total || 0} appointments
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => fetchDashboardStats(false)}
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              disabled={loading || refreshing}
              title="Refresh dashboard"
            >
              <i className={`ti ti-refresh ${refreshing ? 'fa-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <PredefinedDatePicker />
          </div>
        </div>

        {refreshing && !loading && (
          <div className="alert alert-info d-flex align-items-center gap-2 mb-3" role="status">
            <i className="ti ti-refresh fa-spin" />
            <span>Auto-refreshing dashboard data...</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="row">
          <div className="col-xl-4 col-md-6 d-flex">
            <div className="card pb-2 flex-fill">
              <div className="d-flex align-items-center justify-content-between gap-1 card-body pb-0 mb-1">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#CC0000' }}>
                    <i className="ti ti-calendar-check fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Appointments Today</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.appointmentsToday.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.appointmentsToday.isIncrease ? 'success' : 'danger'}`}>
                      {stats.appointmentsToday.isIncrease ? '+' : ''}{stats.appointmentsToday.change}%
                    </span>
                  )}
                </div>
              </div>
              <Suspense fallback={<div />}>
                <ChartOne />
              </Suspense>
            </div>
          </div>

          <div className="col-xl-4 col-md-6 d-flex">
            <div className="card pb-2 flex-fill">
              <div className="d-flex align-items-center justify-content-between gap-1 card-body pb-0 mb-1">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#DC2626' }}>
                    <i className="ti ti-user-plus fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">New Patients Today</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.newPatientsToday.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.newPatientsToday.isIncrease ? 'success' : 'danger'}`}>
                      {stats.newPatientsToday.isIncrease ? '+' : ''}{stats.newPatientsToday.change}%
                    </span>
                  )}
                </div>
              </div>
              <Suspense fallback={<div />}>
                <ChartTwo />
              </Suspense>
            </div>
          </div>

          <div className="col-xl-4 col-md-6 d-flex">
            <div className="card pb-2 flex-fill">
              <div className="d-flex align-items-center justify-content-between gap-1 card-body pb-0 mb-1">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#EF4444' }}>
                    <i className="ti ti-clipboard-check fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Pending Check-ins</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.pendingCheckIns.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.pendingCheckIns.isIncrease ? 'danger' : 'success'}`}>
                      {stats.pendingCheckIns.isIncrease ? '+' : ''}{stats.pendingCheckIns.change}%
                    </span>
                  )}
                </div>
              </div>
              <Suspense fallback={<div />}>
                <ChartOne />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card flex-fill w-100">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="fw-bold mb-0">Today's Patient Activity</h5>
                <div className="d-flex gap-2">
                  <button
                    onClick={() => setShowLabVisitModal(true)}
                    className="btn btn-sm btn-primary flex-shrink-0"
                    title="Create walk-in lab visit"
                  >
                    <i className="ti ti-test-pipe-2 me-1"></i>
                    Lab Visit
                  </button>
                  <Link
                    href={all_routes.frontdeskQueue}
                    className="btn btn-sm btn-success flex-shrink-0"
                  >
                    <i className="ti ti-list-check me-1"></i>
                    My Queue
                  </Link>
                  <Link
                    href={all_routes.appointments}
                    className="btn btn-sm btn-outline-light flex-shrink-0"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="card-body p-1 py-2">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : stats?.pendingAppointments && stats.pendingAppointments.length > 0 ? (
                  <div className="table-responsive table-nowrap">
                    <table className="table table-borderless mb-0">
                      <tbody>
                        {stats.pendingAppointments.filter(appointment => {
                          const hasPatient = appointment.patient || appointment.patientId;
                          const hasActiveVisit = appointment.visit && (appointment.visit.status === 'in_progress' || appointment.visit.status === 'completed');
                          const isWalkInOrReturned = appointment.isWalkIn || appointment.isReturnedPatient;
                          return hasPatient && (hasActiveVisit || isWalkInOrReturned);
                        }).map((appointment) => {
                          const patient = appointment.patient || appointment.patientId;
                          return (
                            <tr key={appointment._id} style={{
                              backgroundColor: 
                                appointment.currentStage === 'returned_to_front_desk' ? '#FFF3CD' : 
                                appointment.visitStatus === 'completed' ? '#D4EDDA' : 'transparent'
                            }}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link
                                    href={all_routes.patientDetails}
                                    className="avatar me-2"
                                  >
                                    {patient.profileImage ? (
                                      <ImageWithBasePath
                                        src={patient.profileImage}
                                        alt="patient"
                                        className="rounded"
                                      />
                                    ) : (
                                      <span className="avatar-text bg-primary rounded">
                                        {patient.firstName?.[0]}{patient.lastName?.[0]}
                                      </span>
                                    )}
                                  </Link>
                                  <div>
                                    <h6 className="fs-14 mb-1 fw-semibold">
                                      <Link href={all_routes.patientDetails}>
                                        {patient.firstName} {patient.lastName}
                                      </Link>
                                    </h6>
                                    <div className="d-flex align-items-center flex-wrap gap-1">
                                      <p className="mb-0 fs-13 d-inline-flex align-items-center text-body">
                                        <i className="ti ti-calendar me-1" />
                                        {formatAppointmentDate(appointment.appointmentDate)}
                                      </p>
                                      <span>
                                        <i className="ti ti-minus-vertical text-light fs-14 mx-1" />
                                      </span>
                                      <p className="mb-0 fs-13 d-inline-flex align-items-center text-body">
                                        <i className="ti ti-clock-hour-7 me-1" />
                                        {appointment.appointmentTime}
                                      </p>
                                      {appointment.currentStage === 'front_desk' && appointment.visitStatus === 'in_progress' && (
                                        <span className="badge ms-2" style={{ backgroundColor: '#17A2B8', color: 'white' }}>
                                          <i className="ti ti-walk me-1"></i>
                                          Walk-in
                                        </span>
                                      )}
                                      {appointment.currentStage === 'returned_to_front_desk' && (
                                        <span className="badge ms-2" style={{ backgroundColor: '#FFC107', color: '#000' }}>
                                          <i className="ti ti-arrow-back-up me-1"></i>
                                          Returned
                                        </span>
                                      )}
                                      {appointment.visitStatus === 'completed' && appointment.status !== 'COMPLETED' && (
                                        <span className="badge ms-2" style={{ backgroundColor: '#28A745', color: 'white' }}>
                                          <i className="ti ti-circle-check me-1"></i>
                                          Ready for Checkout
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-soft-warning">
                                  {appointment.reasonForVisit || 'Check-in'}
                                </span>
                              </td>
                              <td className="text-end border-0">
                                {getAppointmentActionButton(appointment)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No appointments today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateLabVisitModal
        show={showLabVisitModal}
        onHide={() => setShowLabVisitModal(false)}
        onSuccess={() => {
          setShowLabVisitModal(false);
          fetchDashboardStats();
        }}
      />
    </div>
  );
};

export default FrontDeskDashboard;
