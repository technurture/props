"use client";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/services/api-client";
import { useQueueUpdateListener } from "@/lib/utils/queue-events";

import ChartOne from "../chart/chart1";
import ChartTwo from "../chart/chart2";
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

interface DoctorInfo {
  _id: string;
  firstName: string;
  lastName: string;
}

interface PendingPrescription {
  _id: string;
  patient: PatientInfo;
  doctor: DoctorInfo;
  medications: any[];
  status: string;
  visit: {
    _id: string;
    status: string;
    currentStage: string;
  };
}

interface DashboardStats {
  pendingPrescriptions: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  dispensedToday: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  activePrescriptions: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  visitsToday: number;
  pendingAppointments: PendingPrescription[];
}

const PharmacyDashboard = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    console.log('[PharmacyDashboard] Queue update event received, refreshing stats...');
    fetchDashboardStats(true);
  }, [fetchDashboardStats]));

  useEffect(() => {
    fetchDashboardStats();

    const refreshInterval = setInterval(() => {
      fetchDashboardStats(true);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [fetchDashboardStats]);

  const userName = session?.user?.name || 'Pharmacist';

  return (
    <div className="page-wrapper" id="main-content">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
          <div className="breadcrumb-arrow">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge" style={{ backgroundColor: '#10B981', color: 'white', padding: '6px 12px', fontSize: '13px' }}>
                <i className="ti ti-pill me-1" />
                Pharmacist
              </span>
            </div>
            <h4 className="mb-1 d-flex align-items-center gap-2">
              <i className="ti ti-prescription" style={{ color: '#10B981' }} />
              Welcome, {userName}
            </h4>
            <p className="mb-0">
              You have {loading ? '...' : stats?.pendingPrescriptions.total || 0} pending prescriptions
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#10B981' }}>
                    <i className="ti ti-clock-hour-3 fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Pending Prescriptions</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.pendingPrescriptions.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.pendingPrescriptions.isIncrease ? 'danger' : 'success'}`}>
                      {stats.pendingPrescriptions.isIncrease ? '+' : ''}{stats.pendingPrescriptions.change}%
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#14C38E' }}>
                    <i className="ti ti-check fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Dispensed Today</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.dispensedToday.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.dispensedToday.isIncrease ? 'success' : 'danger'}`}>
                      {stats.dispensedToday.isIncrease ? '+' : ''}{stats.dispensedToday.change}%
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#059669' }}>
                    <i className="ti ti-prescription fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Active Prescriptions</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.activePrescriptions.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.activePrescriptions.isIncrease ? 'success' : 'danger'}`}>
                      {stats.activePrescriptions.isIncrease ? '+' : ''}{stats.activePrescriptions.change}%
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
                <h5 className="fw-bold mb-0">Pending Prescriptions</h5>
                <Link
                  href="/pharmacy-queue"
                  className="btn btn-sm btn-success flex-shrink-0"
                >
                  <i className="ti ti-list-check me-1"></i>
                  My Queue
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
                        {stats.pendingAppointments.filter(prescription => prescription.patient && prescription.visit?.status === 'in_progress').map((prescription) => {
                          const patient = prescription.patient;
                          return (
                            <tr key={prescription._id}>
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
                                    <p className="mb-0 fs-13 text-muted">
                                      {prescription.medications?.length || 0} medication(s)
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-soft-warning">
                                  Pending
                                </span>
                              </td>
                              <td className="text-end border-0">
                                <Link
                                  href="/pharmacy-queue"
                                  className="btn btn-sm btn-primary"
                                >
                                  Dispense
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No pending prescriptions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
