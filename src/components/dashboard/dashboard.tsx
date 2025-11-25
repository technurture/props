"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { apiClient } from "@/lib/services/api-client";

import ChartOne from "./chart/chart1";
import ChartTwo from "./chart/chart2";
import ChartThree from "./chart/chart3";
import ChartFour from "./chart/chart4";
import ChartFive from "./chart/chart5";
import PatientsVisitsChart from "./chart/patientsVisitsChart";
import SemiDonutChart from "./chart/semiDonutChart";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import PredefinedDatePicker from "@/core/common-components/common-date-range-picker/PredefinedDatePicker";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";

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

const DashboardComponent = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingAppointmentId, setProcessingAppointmentId] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);

  const fetchDashboardStats = async (isBackgroundRefresh = false) => {
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
  };

  useEffect(() => {
    fetchDashboardStats();

    const refreshInterval = setInterval(() => {
      fetchDashboardStats(true);
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

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
    <>
      {/* ========================
                        Start Page Content
                ========================= */}
      <div className="page-wrapper" id="main-content">
        {/* Start Content */}
        <div className="content">
          {/* Page Header */}
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Welcome, {userName}</h4>
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
          {/* End Page Header */}

          {refreshing && !loading && (
            <div className="alert alert-info d-flex align-items-center gap-2 mb-3" role="status">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Updating...</span>
              </div>
              <span>Updating dashboard data...</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card pb-2 flex-fill">
                <div className="d-flex align-items-center justify-content-between gap-1 card-body pb-0 mb-1">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar bg-primary rounded-circle flex-shrink-0">
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
            {/* col end */}
            {/* col start */}
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
            {/* col end */}
            {/* col start */}
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
            {/* col end */}
            {/* col start */}
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
                        {loading ? '...' : `$${stats?.transactions?.total?.toFixed(2) || '0.00'}`}
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
            {/* col end */}
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h5 className="fw-bold mb-0">Appointment Request</h5>
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
                          {stats.pendingAppointments.filter(appointment => appointment.patient).map((appointment) => (
                            <tr key={appointment._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link
                                    href={all_routes.patientDetails}
                                    className="avatar me-2"
                                  >
                                    {appointment.patient.profileImage ? (
                                      <ImageWithBasePath
                                        src={appointment.patient.profileImage}
                                        alt="patient"
                                        className="rounded"
                                      />
                                    ) : (
                                      <span className="avatar-text bg-primary rounded">
                                        {appointment.patient.firstName?.[0]}{appointment.patient.lastName?.[0]}
                                      </span>
                                    )}
                                  </Link>
                                  <div>
                                    <h6 className="fs-14 mb-1 fw-semibold">
                                      <Link href={all_routes.patientDetails}>
                                        {appointment.patient.firstName} {appointment.patient.lastName}
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
                          ))}
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
            {/* col end */}
            {/* col start */}
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
            {/* col end */}
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row">
            {/* col start */}
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
            {/* col end */}
            {/* col start */}
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
            {/* col end */}
            {/* col start */}
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
            {/* col end */}
            {/* col start */}
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
            {/* col end */}
            {/* col start */}
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
            {/* col end */}
            {/* col start */}
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
            {/* col end */}
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h5 className="mb-0">Patient Reports</h5>
                  <Link
                    href={all_routes.labResults}
                    className="btn btn-sm btn-outline-light flex-shrink-0"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body pb-1">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        href="#"
                        className="avatar me-2 badge-soft-primary rounded-circle"
                        aria-label="Hemoglobin test report"
                      >
                        <i className="ti ti-droplet fs-20" />
                      </Link>
                      <div>
                        <h6 className="fs-14 fw-semibold text-truncate mb-1">
                          <Link href={all_routes.patientDetails}>
                            David Marshall
                          </Link>
                        </h6>
                        <p className="mb-0 fs-13">Hemoglobin</p>
                      </div>
                    </div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-light me-1"
                      aria-label="Download report"
                    >
                      <i className="ti ti-download" />
                    </Link>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        href="#"
                        className="avatar me-2 badge-soft-success rounded-circle"
                        aria-label="X-Ray report"
                      >
                        <i className="ti ti-mood-neutral fs-20" />
                      </Link>
                      <div>
                        <h6 className="fs-14 fw-semibold text-truncate mb-1">
                          <Link href={all_routes.patientDetails}>
                            Thomas McLean
                          </Link>
                        </h6>
                        <p className="mb-0 fs-13">X Ray</p>
                      </div>
                    </div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-light me-1"
                      aria-label="Download report"
                    >
                      <i className="ti ti-download" />
                    </Link>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        href="#"
                        className="avatar me-2 badge-soft-danger rounded-circle"
                        aria-label="MRI Scan report"
                      >
                        <i className="ti ti-rainbow fs-20" />
                      </Link>
                      <div>
                        <h6 className="fs-14 fw-semibold text-truncate mb-1">
                          <Link href={all_routes.patientDetails}>
                            Greta Kinney
                          </Link>
                        </h6>
                        <p className="mb-0 fs-13">MRI Scan</p>
                      </div>
                    </div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-light me-1"
                      aria-label="Download report"
                    >
                      <i className="ti ti-download" />
                    </Link>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        href="#"
                        className="avatar me-2 badge-soft-purple rounded-circle"
                        aria-label="Blood test report"
                      >
                        <i className="ti ti-rosette fs-20" />
                      </Link>
                      <div>
                        <h6 className="fs-14 fw-semibold text-truncate mb-1">
                          <Link href={all_routes.patientDetails}>
                            Larry Wilburn
                          </Link>
                        </h6>
                        <p className="mb-0 fs-13">Blood Test</p>
                      </div>
                    </div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-light me-1"
                      aria-label="Download report"
                    >
                      <i className="ti ti-download" />
                    </Link>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        href="#"
                        className="avatar me-2 badge-soft-teal rounded-circle"
                        aria-label="CT Scan report"
                      >
                        <i className="ti ti-radio fs-20" />
                      </Link>
                      <div>
                        <h6 className="fs-14 fw-semibold text-truncate mb-1">
                          <Link href={all_routes.patientDetails}>
                            Reyan Verol
                          </Link>
                        </h6>
                        <p className="mb-0 fs-13">CT Scan</p>
                      </div>
                    </div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-light me-1"
                      aria-label="Download report"
                    >
                      <i className="ti ti-download" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-md-6 d-flex">
              <div className="card shadow flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h5 className="mb-0">Patient Visits</h5>
                  <Link
                    href={all_routes.visits}
                    className="btn btn-sm btn-outline-light flex-shrink-0"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  <Suspense fallback={<div />}>
                    <PatientsVisitsChart />
                  </Suspense>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-primary rounded-circle flex-shrink-0">
                        <i className="ti ti-gender-male fs-20" />
                      </span>
                      <div className="ms-2">
                        <h6 className="mb-1 fs-14 fw-semibold">Male</h6>
                        <p className="mb-1 fs-13 text-truncate">
                          <span className="text-success">-15%</span> Since Last
                          Week
                        </p>
                      </div>
                    </div>
                    <h6 className="mb-0">69%</h6>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-0">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-purple rounded-circle flex-shrink-0">
                        <i className="ti ti-gender-female fs-20" />
                      </span>
                      <div className="ms-2">
                        <h6 className="mb-1 fs-14 fw-semibold">Female</h6>
                        <p className="mb-1 fs-13 text-truncate">
                          <span className="text-success">-15%</span> Since Last
                          Week
                        </p>
                      </div>
                    </div>
                    <h6 className="mb-0">31%</h6>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-md-6 d-flex">
              <div className="card flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h5 className="mb-0">Doctors Availability</h5>
                  <Link
                    href={all_routes.allDoctorsList}
                    className="btn btn-sm btn-outline-light flex-shrink-0"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  <Suspense fallback={<div />}>
                    <SemiDonutChart />
                  </Suspense>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-success rounded-circle flex-shrink-0">
                        <i className="ti ti-check fs-20" />
                      </span>
                      <div className="ms-2">
                        <h6 className="mb-1 fs-14 fw-semibold">Available</h6>
                        <p className="mb-1 fs-13 text-truncate">
                          <span className="text-success">-15%</span> Since Last
                          Week
                        </p>
                      </div>
                    </div>
                    <h6 className="mb-0">73%</h6>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-0">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-danger rounded-circle flex-shrink-0">
                        <i className="ti ti-xbox-x fs-20" />
                      </span>
                      <div className="ms-2">
                        <h6 className="mb-1 fs-14 fw-semibold">On Leave</h6>
                        <p className="mb-1 fs-13 text-truncate">
                          <span className="text-danger">+5%</span> Since Last
                          Week
                        </p>
                      </div>
                    </div>
                    <h6 className="mb-0">27%</h6>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-12 d-flex">
              <div className="card flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h5 className="mb-0">Recent Appointments</h5>
                  <Link
                    href={all_routes.appointments}
                    className="btn btn-sm btn-outline-light flex-shrink-0"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body p-1 py-2">
                  <div className="table-responsive table-nowrap">
                    <table className="table table-borderless mb-0">
                      <thead>
                        <tr>
                          <th>Appt ID</th>
                          <th>Patient Name</th>
                          <th>Department</th>
                          <th>Consulting Doctor</th>
                          <th>Date &amp; Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <Link
                              href="#"
                              className="link-muted"
                              data-bs-toggle="modal"
                              data-bs-target="#view_appointment_modal"
                            >
                              #PT0019
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={all_routes.patientDetails}
                                className="avatar avatar-xs me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-05.jpg"
                                  alt="patient"
                                  className="rounded"
                                />
                              </Link>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link href={all_routes.patientDetails}>
                                    Jessica Anderson
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>Consultation</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={all_routes.doctorDetails}
                                className="avatar avatar-xs me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/doctors/doctor-01.jpg"
                                  alt="doctor"
                                  className="rounded"
                                />
                              </Link>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link href={all_routes.doctorDetails}>
                                    Dr. Ethan Williams
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>30 May 2025, 08:30 AM to 09:30 AM</td>
                          <td>
                            <span className="badge badge-soft-warning">
                              Scheduled
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link
                              href="#"
                              className="link-muted"
                              data-bs-toggle="modal"
                              data-bs-target="#view_appointment_modal"
                            >
                              #PT0020
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={all_routes.patientDetails}
                                className="avatar avatar-xs me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-25.jpg"
                                  alt="patient"
                                  className="rounded"
                                />
                              </Link>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link href={all_routes.patientDetails}>
                                    Olivia Miller
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>Consultation</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={all_routes.doctorDetails}
                                className="avatar avatar-xs me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/doctors/doctor-03.jpg"
                                  alt="doctor"
                                  className="rounded"
                                />
                              </Link>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link href={all_routes.doctorDetails}>
                                    Dr. Laura Mitchell
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>15 May 2025, 11:30 AM to 12:30 PM</td>
                          <td>
                            <span className="badge badge-soft-success">
                              Completed
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link
                              href="#"
                              className="link-muted"
                              data-bs-toggle="modal"
                              data-bs-target="#view_appointment_modal"
                            >
                              #PT0021
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={all_routes.patientDetails}
                                className="avatar avatar-xs me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/users/user-14.jpg"
                                  alt="patient"
                                  className="rounded"
                                />
                              </Link>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link href={all_routes.patientDetails}>
                                    David Smith
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>Consultation</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={all_routes.doctorDetails}
                                className="avatar avatar-xs me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/doctors/doctor-15.jpg"
                                  alt="doctor"
                                  className="rounded"
                                />
                              </Link>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link href={all_routes.doctorDetails}>
                                    Dr. Christopher Lewis
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>30 Apr 2025, 12:20 PM to 01:20 PM</td>
                          <td>
                            <span className="badge badge-soft-success">
                              Completed
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* row end */}
        </div>
        {/* End Content */}
        {/* Start Footer */}
        <CommonFooter />
        {/* End Footer */}
      </div>
      {/* ========================
                        End Page Content
                ========================= */}
    </>
  );
};

export default DashboardComponent;
