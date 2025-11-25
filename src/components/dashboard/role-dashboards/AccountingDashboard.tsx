"use client";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { apiClient } from "@/lib/services/api-client";
import { useQueueUpdateListener } from "@/lib/utils/queue-events";

import ChartOne from "../chart/chart1";
import ChartTwo from "../chart/chart2";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import PredefinedDatePicker from "@/core/common-components/common-date-range-picker/PredefinedDatePicker";

interface RecentTransaction {
  _id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  status: string;
}

interface DashboardStats {
  revenueToday: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  revenueThisMonth: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  paymentsToday: {
    total: number;
    change: number;
    isIncrease: boolean;
  };
  visitsToday: number;
  recentTransactions: RecentTransaction[];
}

const AccountingDashboard = () => {
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
    console.log('[AccountingDashboard] Queue update event received, refreshing stats...');
    fetchDashboardStats(true);
  }, [fetchDashboardStats]));

  useEffect(() => {
    fetchDashboardStats();

    const refreshInterval = setInterval(() => {
      fetchDashboardStats(true);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [fetchDashboardStats]);

  const formatTransactionDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
    } catch {
      return dateString;
    }
  };

  const userName = session?.user?.name || 'Accountant';

  return (
    <div className="page-wrapper" id="main-content">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
          <div className="breadcrumb-arrow">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge" style={{ backgroundColor: '#EAB308', color: 'white', padding: '6px 12px', fontSize: '13px' }}>
                <i className="ti ti-calculator me-1" />
                Accountant
              </span>
            </div>
            <h4 className="mb-1 d-flex align-items-center gap-2">
              <i className="ti ti-calculator" style={{ color: '#EAB308' }} />
              Welcome, {userName}
            </h4>
            <p className="mb-0">
              Revenue Today: {loading ? '...' : `₦${stats?.revenueToday?.total?.toFixed(2) || '0.00'}`}
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#EAB308' }}>
                    <i className="ti ti-cash fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Revenue Today</p>
                    <h5 className="mb-0">
                      {loading ? '...' : `₦${stats?.revenueToday?.total?.toFixed(2) || '0.00'}`}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.revenueToday.isIncrease ? 'success' : 'danger'}`}>
                      {stats.revenueToday.isIncrease ? '+' : ''}{stats.revenueToday.change}%
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#CA8A04' }}>
                    <i className="ti ti-chart-line fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Revenue This Month</p>
                    <h5 className="mb-0">
                      {loading ? '...' : `₦${stats?.revenueThisMonth?.total?.toFixed(2) || '0.00'}`}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.revenueThisMonth.isIncrease ? 'success' : 'danger'}`}>
                      {stats.revenueThisMonth.isIncrease ? '+' : ''}{stats.revenueThisMonth.change}%
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
                  <span className="avatar rounded-circle flex-shrink-0" style={{ backgroundColor: '#F59E0B' }}>
                    <i className="ti ti-credit-card fs-20" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="mb-1 text-truncate">Payments Today</p>
                    <h5 className="mb-0">
                      {loading ? '...' : stats?.paymentsToday.total || 0}
                    </h5>
                  </div>
                </div>
                <div className="text-end">
                  {!loading && stats && (
                    <span className={`badge badge-soft-${stats.paymentsToday.isIncrease ? 'success' : 'danger'}`}>
                      {stats.paymentsToday.isIncrease ? '+' : ''}{stats.paymentsToday.change}%
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
                <h5 className="fw-bold mb-0">Recent Transactions</h5>
                <Link
                  href={all_routes.accounting}
                  className="btn btn-sm btn-outline-light flex-shrink-0"
                >
                  View All
                </Link>
              </div>
              <div className="card-body p-1 py-2">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                  <div className="table-responsive table-nowrap">
                    <table className="table table-borderless mb-0">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentTransactions.map((transaction) => (
                          <tr key={transaction._id}>
                            <td>
                              <h6 className="fs-14 mb-0">
                                {transaction.description || 'Transaction'}
                              </h6>
                            </td>
                            <td>
                              <span className={`badge badge-soft-${transaction.type === 'income' ? 'success' : 'warning'}`}>
                                {transaction.type || 'Payment'}
                              </span>
                            </td>
                            <td>
                              <span className={transaction.type === 'income' ? 'text-success' : 'text-dark'}>
                                ₦{transaction.amount?.toFixed(2) || '0.00'}
                              </span>
                            </td>
                            <td>
                              <p className="mb-0 fs-13 text-muted">
                                {formatTransactionDate(transaction.createdAt)}
                              </p>
                            </td>
                            <td>
                              <span className={`badge badge-soft-${transaction.status === 'completed' ? 'success' : 'warning'}`}>
                                {transaction.status || 'Completed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No recent transactions</p>
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

export default AccountingDashboard;
