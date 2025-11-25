"use client";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { apiClient } from "@/lib/services/api-client";
import { useQueueUpdateListener } from "@/lib/utils/queue-events";

import ChartOne from "../chart/chart1";
import ChartTwo from "../chart/chart2";
import ChartThree from "../chart/chart3";
import ChartFour from "../chart/chart4";
import ChartFive from "../chart/chart5";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import PredefinedDatePicker from "@/core/common-components/common-date-range-picker/PredefinedDatePicker";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";

interface PatientInfo {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  patientId: string;
}

interface PendingAppointment {
  _id: string;
  patient: PatientInfo;
  patientId: PatientInfo;
  appointmentDate: string;
  appointmentTime: string;
  reasonForVisit: string;
  type: string;
}

interface DashboardStats {
  patients: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  appointments: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  doctors: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  transactions: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  visitsToday: number;
  pendingAppointments: PendingAppointment[];
}

const AdminDashboard = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingAppointmentId, setProcessingAppointmentId] = useState<string | null>(null);
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
    console.log('[AdminDashboard] Queue update event received, refreshing stats...');
    fetchDashboardStats(true);
  }, [fetchDashboardStats]));

  useEffect(() => {
    fetchDashboardStats();

    const refreshInterval = setInterval(() => {
      fetchDashboardStats(true);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [fetchDashboardStats]);

  const handleApproveAppointment = async (appointmentId: string) => {
    setProcessingAppointmentId(appointmentId);
    try {
      await apiClient.put(
        `/api/appointments/${appointmentId}`,
        { status: 'CONFIRMED' },
        { successMessage: 'Appointment approved successfully' }
      );
      await fetchDashboardStats();
    } catch (err) {
    } finally {
      setProcessingAppointmentId(null);
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    setProcessingAppointmentId(appointmentId);
    try {
      await apiClient.put(
        `/api/appointments/${appointmentId}`,
        { status: 'CANCELLED' },
        { successMessage: 'Appointment rejected successfully' }
      );
      await fetchDashboardStats();
    } catch (err) {
    } finally {
      setProcessingAppointmentId(null);
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const userName = session?.user?.name || 'Admin';

  return (
    <div className="page-wrapper" id="main-content">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
          <div className="breadcrumb-arrow">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge" style={{ backgroundColor: '#003366', color: 'white', padding: '6px 12px', fontSize: '13px' }}>
                <i className="ti ti-shield me-1" />
                System Administrator
              </span>
            </div>
            <h4 className="mb-1 d-flex align-items-center gap-2">
              <i className="ti ti-crown text-primary" style={{ color: '#003366' }} />
              Welcome, {userName}
            </h4>
            <p className="mb-0">
              Today you have {loading ? '...' : stats?.visitsToday || 0} visits,{" "}
              <Link
                href={all_routes.visits}
                className="text-decoration-underline"
              >
                View Details
              </Link>
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
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card pb-2 flex-fill">
              <div className="d-flex align-items-center justify-content-between gap-1 card-body pb-0 mb-1">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#003366' }}>
                    <i className="ti ti-user-exclamation fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Patients</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.patients.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.patients.isIncrease ? 'success' : 'danger'}`}>
                      {stats.patients.isIncrease ? '+' : ''}{stats.patients.change}%
                    </span>
                  )}
                </div>
              </div>
              <Suspense fallback={<div />}>
                <ChartOne />
              </Suspense>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card pb-2 flex-fill">
              <div className="d-flex align-items-center justify-content-between gap-1 card-body pb-0 mb-1">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar bg-orange rounded-circle flex-shrink-0">
                    <i className="ti ti-calendar-check fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Appointments</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.appointments.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.appointments.isIncrease ? 'success' : 'danger'}`}>
                      {stats.appointments.isIncrease ? '+' : ''}{stats.appointments.change}%
                    </span>
                  )}
                </div>
              </div>
              <Suspense fallback={<div />}>
                <ChartTwo />
              </Suspense>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card pb-2 flex-fill">
              <div className="d-flex align-items-center justify-content-between gap-1 card-body pb-0 mb-1">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar bg-purple rounded-circle flex-shrink-0">
                    <i className="ti ti-stethoscope fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Doctors</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.doctors.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.doctors.isIncrease ? 'success' : 'danger'}`}>
                      {stats.doctors.isIncrease ? '+' : ''}{stats.doctors.change}%
                    </span>
                  )}
                </div>
              </div>
              <Suspense fallback={<div />}>
                <ChartThree />
              </Suspense>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card pb-2 flex-fill">
              <div className="d-flex align-items-center justify-content-between gap-1 card-body pb-0 mb-1">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar bg-pink rounded-circle flex-shrink-0">
                    <i className="ti ti-moneybag fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Transactions</p>
                    <h5 className="mb-0">
                      {loading ? '...' : `₦${stats?.transactions?.total?.toFixed(2) || '0.00'}`}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.transactions.isIncrease ? 'success' : 'danger'}`}>
                      {stats.transactions.isIncrease ? '+' : ''}{stats.transactions.change}%
                    </span>
                  )}
                </div>
              </div>
              <Suspense fallback={<div />}>
                <ChartFour />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-6 d-flex">
            <div className="card flex-fill w-100">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="fw-bold mb-0">Appointment Requests</h5>
                <Link
                  href={all_routes.appointments}
                  className="btn btn-sm btn-outline-light flex-shrink-0"
                >
                  All Appointments
                </Link>
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
                        {stats.pendingAppointments.filter(appointment => appointment.patient || appointment.patientId).map((appointment) => {
                          const patient = appointment.patient || appointment.patientId;
                          return (
                            <tr key={appointment._id}>
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
                                    <div className="d-flex align-items-center">
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
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-soft-success">
                                  {appointment.reasonForVisit || appointment.type}
                                </span>
                              </td>
                              <td className="text-end border-0">
                                <div className="d-flex align-items-center justify-content-end gap-2">
                                  <button
                                    onClick={() => handleRejectAppointment(appointment._id)}
                                    className="btn btn-icon btn-light"
                                    aria-label="Reject appointment"
                                    disabled={processingAppointmentId === appointment._id}
                                  >
                                    {processingAppointmentId === appointment._id ? (
                                      <span className="spinner-border spinner-border-sm" role="status" />
                                    ) : (
                                      <i className="ti ti-xbox-x" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleApproveAppointment(appointment._id)}
                                    className="btn btn-icon btn-light"
                                    aria-label="Accept appointment"
                                    disabled={processingAppointmentId === appointment._id}
                                  >
                                    {processingAppointmentId === appointment._id ? (
                                      <span className="spinner-border spinner-border-sm" role="status" />
                                    ) : (
                                      <i className="ti ti-check" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No pending appointment requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-xl-6 d-flex">
            <div className="card shadow flex-fill w-100">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="fw-bold mb-0">Patients Statistics</h5>
                <Link
                  href={all_routes.allPatientsList}
                  className="btn btn-sm btn-outline-light"
                >
                  View All
                </Link>
              </div>
              <div className="card-body pb-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h6 className="fs-14 fw-semibold mb-0">
                    Total No of Patients : {loading ? '...' : stats?.patients.total || 0}
                  </h6>
                  <div className="d-flex align-items-center gap-3">
                    <p className="mb-0 text-dark">
                      <i className="ti ti-point-filled me-1 text-primary" />
                      New Patients
                    </p>
                    <p className="mb-0 text-dark">
                      <i className="ti ti-point-filled me-1 text-soft-primary" />
                      Old Patients
                    </p>
                  </div>
                </div>
                <Suspense fallback={<div />}>
                  <ChartFive />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-2 col-md-4 col-sm-6">
            <Link href={all_routes.patients} className="card">
              <div className="card-body text-center">
                <span className="badge-soft-primary rounded w-100 d-flex p-3 justify-content-center fs-32 mb-2">
                  <i className="ti ti-users" />
                </span>
                <h6 className="fs-14 fw-semibold text-truncate mb-0">
                  All Patient
                </h6>
              </div>
            </Link>
          </div>
          <div className="col-xl-2 col-md-4 col-sm-6">
            <Link href={all_routes.allDoctorsList} className="card">
              <div className="card-body text-center">
                <span className="badge-soft-success rounded w-100 d-flex p-3 justify-content-center fs-32 mb-2">
                  <i className="ti ti-topology-bus" />
                </span>
                <h6 className="fs-14 fw-semibold text-truncate mb-0">
                  Doctors
                </h6>
              </div>
            </Link>
          </div>
          <div className="col-xl-2 col-md-4 col-sm-6">
            <Link href={all_routes.labResults} className="card">
              <div className="card-body text-center">
                <span className="badge-soft-warning rounded w-100 d-flex p-3 justify-content-center fs-32 mb-2">
                  <i className="ti ti-test-pipe-2" />
                </span>
                <h6 className="fs-14 fw-semibold text-truncate mb-0">
                  Labs Results
                </h6>
              </div>
            </Link>
          </div>
          <div className="col-xl-2 col-md-4 col-sm-6">
            <Link href={all_routes.pharmacy} className="card">
              <div className="card-body text-center">
                <span className="badge-soft-danger rounded w-100 d-flex p-3 justify-content-center fs-32 mb-2">
                  <i className="ti ti-prescription" />
                </span>
                <h6 className="fs-14 fw-semibold text-truncate mb-0">
                  Prescriptions
                </h6>
              </div>
            </Link>
          </div>
          <div className="col-xl-2 col-md-4 col-sm-6">
            <Link href={all_routes.visits} className="card">
              <div className="card-body text-center">
                <span className="badge-soft-purple rounded w-100 d-flex p-3 justify-content-center fs-32 mb-2">
                  <i className="ti ti-e-passport" />
                </span>
                <h6 className="fs-14 fw-semibold text-truncate mb-0">
                  Visits
                </h6>
              </div>
            </Link>
          </div>
          <div className="col-xl-2 col-md-4 col-sm-6">
            <Link href={all_routes.medicalResults} className="card">
              <div className="card-body text-center">
                <span className="badge-soft-teal rounded w-100 d-flex p-3 justify-content-center fs-32 mb-2">
                  <i className="ti ti-file-description" />
                </span>
                <h6 className="fs-14 fw-semibold text-truncate mb-0">
                  Medical Records
                </h6>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
