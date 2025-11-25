"use client";
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/services/api-client";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";

interface PatientInfo {
  _id: string;
  firstName: string;
  lastName: string;
  patientId: string;
  profileImage?: string;
  phoneNumber?: string;
}

interface Visit {
  _id: string;
  patient: PatientInfo;
  waitTimeMinutes: number;
  waitTimeStatus: 'green' | 'yellow' | 'red';
  currentStage: string;
  visitDate: string;
}

interface BusiestDepartment {
  stage: string;
  count: number;
  displayName: string;
}

interface QueueMonitoringData {
  stageCounts: {
    front_desk: number;
    nurse: number;
    doctor: number;
    lab: number;
    pharmacy: number;
    billing: number;
  };
  stageVisits: {
    front_desk: Visit[];
    nurse: Visit[];
    doctor: Visit[];
    lab: Visit[];
    pharmacy: Visit[];
    billing: Visit[];
  };
  summary: {
    totalPatients: number;
    averageWaitTime: number;
    busiestDepartment: BusiestDepartment;
  };
  activeVisits: Visit[];
}

const DEPARTMENTS = [
  { key: 'front_desk', label: 'Front Desk', icon: 'ti-user-check', color: 'primary', route: null },
  { key: 'nurse', label: 'Nurse', icon: 'ti-nurse', color: 'success', route: '/nurse-queue' },
  { key: 'doctor', label: 'Doctor', icon: 'ti-stethoscope', color: 'warning', route: '/doctor-queue' },
  { key: 'lab', label: 'Laboratory', icon: 'ti-test-pipe-2', color: 'danger', route: '/lab-queue' },
  { key: 'pharmacy', label: 'Pharmacy', icon: 'ti-pill', color: 'purple', route: '/pharmacy-queue' },
  { key: 'billing', label: 'Billing', icon: 'ti-receipt', color: 'info', route: '/billing-queue' },
];

const AUTO_REFRESH_INTERVAL = 30000;

export default function QueueMonitoringDashboard() {
  const [data, setData] = useState<QueueMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);

  const fetchQueueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<{ success: boolean; data: QueueMonitoringData }>(
        '/api/admin/queue-monitoring',
        { showErrorToast: false }
      );
      setData(response.data);
      setCountdown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to load queue monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    const refreshInterval = setInterval(() => {
      fetchQueueData();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [autoRefresh, fetchQueueData]);

  const getWaitTimeColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'success';
      case 'yellow':
        return 'warning';
      case 'red':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading queue monitoring data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="ti ti-alert-circle me-2" />
        {error}
        <button
          onClick={fetchQueueData}
          className="btn btn-sm btn-danger ms-3"
        >
          <i className="ti ti-reload me-1" />
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-info" role="alert">
        No queue data available
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-1">
            <i className="ti ti-chart-bar me-2" />
            Queue Monitoring Dashboard
          </h4>
          <p className="text-muted mb-0">Real-time view of all department queues</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            <i className={`ti ${autoRefresh ? 'ti-player-pause' : 'ti-player-play'} me-1`} />
            {autoRefresh ? `Auto-refresh (${countdown}s)` : 'Enable Auto-refresh'}
          </button>
          <button
            onClick={fetchQueueData}
            className="btn btn-sm btn-outline-secondary"
            disabled={loading}
          >
            <i className="ti ti-reload me-1" />
            Refresh Now
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-xl-4 col-md-6 d-flex">
          <div className="card flex-fill">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <span className="avatar bg-primary rounded-circle flex-shrink-0">
                  <i className="ti ti-users fs-20" />
                </span>
                <div className="ms-3">
                  <p className="text-muted mb-1">Total Patients in Queue</p>
                  <h3 className="mb-0">{data.summary.totalPatients}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6 d-flex">
          <div className="card flex-fill">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <span className="avatar bg-warning rounded-circle flex-shrink-0">
                  <i className="ti ti-clock fs-20" />
                </span>
                <div className="ms-3">
                  <p className="text-muted mb-1">Average Wait Time</p>
                  <h3 className="mb-0">{formatWaitTime(data.summary.averageWaitTime)}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-12 d-flex">
          <div className="card flex-fill">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <span className="avatar bg-danger rounded-circle flex-shrink-0">
                  <i className="ti ti-flame fs-20" />
                </span>
                <div className="ms-3">
                  <p className="text-muted mb-1">Busiest Department</p>
                  <h3 className="mb-0">
                    {data.summary.busiestDepartment.displayName}
                    <span className="badge bg-danger ms-2 fs-14">
                      {data.summary.busiestDepartment.count}
                    </span>
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {DEPARTMENTS.map((dept) => {
          const count = data.stageCounts[dept.key as keyof typeof data.stageCounts];
          const visits = data.stageVisits[dept.key as keyof typeof data.stageVisits] || [];

          return (
            <div key={dept.key} className="col-xl-6 col-lg-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i className={`ti ${dept.icon} me-2 text-${dept.color}`} />
                    {dept.label}
                    <span className={`badge bg-${dept.color} ms-2`}>{count}</span>
                  </h5>
                  {dept.route && (
                    <Link
                      href={dept.route}
                      className="btn btn-sm btn-outline-light"
                    >
                      View Queue
                    </Link>
                  )}
                </div>
                <div className="card-body p-0">
                  {visits.length === 0 ? (
                    <div className="text-center py-4">
                      <i className={`ti ${dept.icon} fs-48 text-muted mb-3`} />
                      <p className="text-muted mb-0">No patients in queue</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Patient</th>
                            <th>Patient ID</th>
                            <th className="text-end">Wait Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visits.slice(0, 5).map((visit) => (
                            <tr key={visit._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link
                                    href={`${all_routes.patientDetails}?id=${visit.patient._id}`}
                                    className="avatar avatar-sm me-2"
                                  >
                                    {visit.patient.profileImage ? (
                                      <ImageWithBasePath
                                        src={visit.patient.profileImage}
                                        alt="patient"
                                        className="rounded"
                                      />
                                    ) : (
                                      <span className={`avatar-text bg-${dept.color} rounded`}>
                                        {visit.patient.firstName?.[0]}{visit.patient.lastName?.[0]}
                                      </span>
                                    )}
                                  </Link>
                                  <div>
                                    <h6 className="fs-14 mb-0">
                                      <Link href={`${all_routes.patientDetails}?id=${visit.patient._id}`}>
                                        {visit.patient.firstName} {visit.patient.lastName}
                                      </Link>
                                    </h6>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-muted">{visit.patient.patientId}</span>
                              </td>
                              <td className="text-end">
                                <span className={`badge bg-${getWaitTimeColor(visit.waitTimeStatus)}`}>
                                  {formatWaitTime(visit.waitTimeMinutes)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {visits.length > 5 && dept.route && (
                        <div className="card-footer bg-light text-center py-2">
                          <Link
                            href={dept.route}
                            className="text-muted small"
                          >
                            +{visits.length - 5} more patients
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="ti ti-info-circle me-2" />
                Wait Time Status Legend
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-4 flex-wrap">
                <div className="d-flex align-items-center">
                  <span className="badge bg-success me-2">Good</span>
                  <span className="text-muted">Less than 30 minutes</span>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-warning me-2">Moderate</span>
                  <span className="text-muted">30-60 minutes</span>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-danger me-2">Critical</span>
                  <span className="text-muted">Over 60 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
