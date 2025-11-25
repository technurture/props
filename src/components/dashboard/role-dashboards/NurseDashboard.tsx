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

interface PendingVisit {
  _id: string;
  patient: PatientInfo;
  visitDate: string;
  status: string;
}

interface DashboardStats {
  patientsToday: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  vitalsRecorded: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  pendingVitals: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  visitsToday: number;
  pendingAppointments: PendingVisit[];
}

const NurseDashboard = () => {
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
        showErrorToast: !isBackgroundRefresh
      });
      setStats(data);
    } catch (err: any) {
      const errorMessage = err.data?.error || err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, []);

  useQueueUpdateListener(useCallback(() => {
    console.log('[NurseDashboard] Queue update event received, refreshing stats...');
    fetchDashboardStats(true);
  }, [fetchDashboardStats]));

  useEffect(() => {
    fetchDashboardStats();

    const refreshInterval = setInterval(() => {
      fetchDashboardStats(true);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [fetchDashboardStats]);

  const userName = session?.user?.name || 'Nurse';

  return (
    <div className="page-wrapper" id="main-content">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
          <div className="breadcrumb-arrow">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge" style={{ backgroundColor: '#0DCAF0', color: 'white', padding: '6px 12px', fontSize: '13px' }}>
                <i className="ti ti-heart-rate-monitor me-1" />
                Nurse
              </span>
            </div>
            <h4 className="mb-1 d-flex align-items-center gap-2">
              <i className="ti ti-heartbeat" style={{ color: '#0DCAF0' }} />
              Welcome, Nurse {userName}
            </h4>
            <p className="mb-0">
              Today you have {loading ? '...' : stats?.patientsToday.total || 0} patients
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#0DCAF0' }}>
                    <i className="ti ti-users fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Patients Today</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.patientsToday.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.patientsToday.isIncrease ? 'success' : 'danger'}`}>
                      {stats.patientsToday.isIncrease ? '+' : ''}{stats.patientsToday.change}%
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#0CB3D9' }}>
                    <i className="ti ti-heart-rate-monitor fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Vitals Recorded</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.vitalsRecorded.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.vitalsRecorded.isIncrease ? 'success' : 'danger'}`}>
                      {stats.vitalsRecorded.isIncrease ? '+' : ''}{stats.vitalsRecorded.change}%
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#31D2F2' }}>
                    <i className="ti ti-clipboard-check fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Pending Vitals</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.pendingVitals.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.pendingVitals.isIncrease ? 'danger' : 'success'}`}>
                      {stats.pendingVitals.isIncrease ? '+' : ''}{stats.pendingVitals.change}%
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
                <h5 className="fw-bold mb-0">Pending Vitals Recording</h5>
                <Link
                  href="/nurse-queue"
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
                        {stats.pendingAppointments.filter(visit => visit.patient).map((visit) => {
                          const patient = visit.patient;
                          return (
                            <tr key={visit._id}>
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
                                      Patient ID: {patient.patientId}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-soft-warning">
                                  Pending Vitals
                                </span>
                              </td>
                              <td className="text-end border-0">
                                <Link
                                  href="/nurse-queue"
                                  className="btn btn-sm btn-primary"
                                >
                                  Record Vitals
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
                    <p className="text-muted mb-0">No pending vitals to record</p>
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

export default NurseDashboard;
