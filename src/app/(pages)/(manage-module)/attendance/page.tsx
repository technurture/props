'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/services/api-client';
import { UserRole } from '@/types/emr';
import Link from 'next/link';
import { all_routes } from '@/router/all_routes';
import dynamic from 'next/dynamic';

const StaffAttendanceDetailModal = dynamic(() => import('@/components/attendance/StaffAttendanceDetailModal'), {
  ssr: false
});

interface Session {
  _id: string;
  clockIn: string;
  clockOut?: string;
  workHours?: number;
  sessionNumber: number;
  notes?: string;
}

interface AttendanceRecord {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  branchId: {
    _id: string;
    name: string;
  };
  date: string;
  clockIn: string;
  clockOut?: string;
  status: string;
  workHours?: number;
  totalHours?: number;
  sessions?: Session[];
  activeSession?: Session | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceResponse {
  attendance: AttendanceRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(30);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string } | null>(null);
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    search: ''
  });

  const isAdmin = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.FRONT_DESK;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (!isAdmin && status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [isAdmin, status, router]);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.status) params.append('status', filters.status);

      const response: AttendanceResponse = await apiClient.get(
        `/api/attendance?${params.toString()}`,
        { showErrorToast: true }
      );

      let records = response.attendance || [];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        records = records.filter(record => 
          record.user.firstName.toLowerCase().includes(searchLower) ||
          record.user.lastName.toLowerCase().includes(searchLower) ||
          record.user.email.toLowerCase().includes(searchLower)
        );
      }

      setAttendanceRecords(records);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.totalCount || 0);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, filters]);

  useEffect(() => {
    if (isAdmin && status === 'authenticated') {
      fetchAttendance();
    }
  }, [isAdmin, status, fetchAttendance]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      present: 'success',
      absent: 'danger',
      on_leave: 'warning',
      half_day: 'info'
    };
    return statusColors[status] || 'secondary';
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const toggleRow = (recordId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRows(newExpanded);
  };

  const getTotalWorkHours = (record: AttendanceRecord) => {
    if (record.totalHours !== undefined) {
      return record.totalHours;
    }
    return record.workHours || 0;
  };

  const hasMultipleSessions = (record: AttendanceRecord) => {
    return record.sessions && record.sessions.length > 1;
  };

  const handleStaffClick = (record: AttendanceRecord) => {
    setSelectedStaff({
      id: record.user._id,
      name: `${record.user.firstName} ${record.user.lastName}`
    });
  };

  if (status === 'loading') {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between flex-wrap mb-4">
          <div className="page-header mb-0">
            <div className="row align-items-center">
              <div className="col-sm-12">
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <i className="ti ti-chevron-right"></i>
                  </li>
                  <li className="breadcrumb-item active">Staff Attendance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card bg-primary-transparent border-0">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-lg bg-primary text-white rounded me-3">
                    <i className="ti ti-users" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-1 small">Total Records</p>
                    <h4 className="mb-0">{totalCount}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card bg-success-transparent border-0">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-lg bg-success text-white rounded me-3">
                    <i className="ti ti-calendar-check" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-1 small">Present Today</p>
                    <h4 className="mb-0">{attendanceRecords.filter(r => r.status === 'present').length}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card bg-warning-transparent border-0">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-lg bg-warning text-white rounded me-3">
                    <i className="ti ti-clock" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-1 small">Active Sessions</p>
                    <h4 className="mb-0">{attendanceRecords.filter(r => r.activeSession).length}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card bg-info-transparent border-0">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-lg bg-info text-white rounded me-3">
                    <i className="ti ti-calendar-time" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-1 small">Half Day</p>
                    <h4 className="mb-0">{attendanceRecords.filter(r => r.status === 'half_day').length}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="row align-items-center">
                  <div className="col">
                    <h5 className="card-title mb-0">
                      <i className="ti ti-clock me-2"></i>
                      Staff Attendance Records
                    </h5>
                    <p className="text-muted small mb-0 mt-1">
                      <i className="ti ti-info-circle me-1"></i>
                      Click on any staff member to view detailed monthly attendance
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3 col-sm-6 mb-3">
                    <label className="form-label">Search Staff</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name or email"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 col-sm-6 mb-3">
                    <label className="form-label">From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 col-sm-6 mb-3">
                    <label className="form-label">To Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 col-sm-6 mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="on_leave">On Leave</option>
                      <option value="half_day">Half Day</option>
                    </select>
                  </div>
                  <div className="col-md-3 col-sm-12 mb-3 d-flex align-items-end">
                    <button
                      className="btn btn-primary me-2"
                      onClick={() => fetchAttendance()}
                    >
                      <i className="ti ti-refresh me-2"></i>
                      Refresh
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setFilters({ dateFrom: '', dateTo: '', status: '', search: '' });
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading attendance records...</p>
                  </div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-calendar-off text-muted mb-3 d-block" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted">No attendance records found</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Staff Name</th>
                            <th>Role</th>
                            <th>Date</th>
                            <th>First Clock In</th>
                            <th>Last Clock Out</th>
                            <th>Total Hours</th>
                            <th>Sessions</th>
                            <th>Status</th>
                            <th>Branch</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.map((record) => (
                            <React.Fragment key={record._id}>
                              <tr className={expandedRows.has(record._id) ? 'table-active' : ''}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {hasMultipleSessions(record) && (
                                      <button
                                        className="btn btn-sm btn-link p-0 me-2"
                                        onClick={() => toggleRow(record._id)}
                                        type="button"
                                      >
                                        <i className={`ti ${expandedRows.has(record._id) ? 'ti-chevron-down' : 'ti-chevron-right'}`}></i>
                                      </button>
                                    )}
                                    <div className="avatar avatar-sm rounded-circle bg-primary text-white me-2 d-flex align-items-center justify-content-center">
                                      {record.user.firstName.charAt(0)}{record.user.lastName.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="mb-0 fw-medium">{record.user.firstName} {record.user.lastName}</p>
                                      <small className="text-muted">{record.user.email}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-info-transparent">
                                    {record.user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                  </span>
                                </td>
                                <td>{isMounted ? formatDate(record.date) : record.date.split('T')[0]}</td>
                                <td>
                                  <i className="ti ti-clock-play text-success me-1"></i>
                                  {isMounted ? formatTime(record.clockIn) : '--:--'}
                                </td>
                                <td>
                                  {record.activeSession ? (
                                    <span className="badge bg-warning-transparent">
                                      <i className="ti ti-dots me-1"></i>
                                      Still Working
                                    </span>
                                  ) : record.clockOut ? (
                                    <>
                                      <i className="ti ti-clock-stop text-danger me-1"></i>
                                      {isMounted ? formatTime(record.clockOut) : '--:--'}
                                    </>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  <span className="fw-medium">
                                    <i className="ti ti-briefcase me-1 text-primary"></i>
                                    {getTotalWorkHours(record).toFixed(2)} hrs
                                  </span>
                                  {hasMultipleSessions(record) && (
                                    <small className="d-block text-muted">
                                      {record.sessions!.length} sessions
                                    </small>
                                  )}
                                </td>
                                <td>
                                  {hasMultipleSessions(record) ? (
                                    <span className="badge bg-info-transparent">
                                      {record.sessions!.length} Sessions
                                    </span>
                                  ) : (
                                    <span className="text-muted">1 Session</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge bg-${getStatusBadge(record.status)}-transparent`}>
                                    {getStatusText(record.status)}
                                  </span>
                                </td>
                                <td>{record.branchId?.name || 'N/A'}</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleStaffClick(record)}
                                    title="View detailed monthly attendance"
                                  >
                                    <i className="ti ti-eye me-1"></i>
                                    View Details
                                  </button>
                                </td>
                              </tr>
                              {expandedRows.has(record._id) && hasMultipleSessions(record) && (
                                <tr>
                                  <td colSpan={10} className="bg-light">
                                    <div className="p-3">
                                      <h6 className="mb-3">Session Details:</h6>
                                      <div className="table-responsive">
                                        <table className="table table-sm mb-0">
                                          <thead>
                                            <tr>
                                              <th>Session #</th>
                                              <th>Clock In</th>
                                              <th>Clock Out</th>
                                              <th>Hours</th>
                                              <th>Notes</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {record.sessions!.map((session, idx) => (
                                              <tr key={session._id}>
                                                <td>Session {session.sessionNumber || idx + 1}</td>
                                                <td>{isMounted ? formatTime(session.clockIn) : '--:--'}</td>
                                                <td>
                                                  {session.clockOut ? (
                                                    isMounted ? formatTime(session.clockOut) : '--:--'
                                                  ) : (
                                                    <span className="badge bg-warning-transparent">Active</span>
                                                  )}
                                                </td>
                                                <td>{session.workHours ? `${session.workHours.toFixed(2)} hrs` : '-'}</td>
                                                <td>{session.notes || '-'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="text-muted">
                          Showing page {currentPage} of {totalPages}
                        </div>
                        <nav>
                          <ul className="pagination mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </button>
                            </li>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                  <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                </li>
                              );
                            })}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedStaff && (
        <StaffAttendanceDetailModal
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
}
