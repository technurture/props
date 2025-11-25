"use client";
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/services/api-client';
import { toast } from 'react-toastify';
import { exportAndDownloadCSV, exportAndDownloadPDF } from '@/lib/services/attendanceExportService';

interface StaffInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface BranchInfo {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface AttendanceSession {
  _id: string;
  clockIn: string;
  clockOut?: string;
  workHours: number;
  sessionNumber: number;
  status: 'present' | 'absent' | 'on_leave' | 'half_day';
  notes?: string;
}

interface DailyAttendance {
  date: string;
  sessions: AttendanceSession[];
  firstClockIn: string;
  lastClockOut?: string;
  totalHours: number;
  status: 'present' | 'absent' | 'on_leave' | 'half_day';
}

interface AttendanceSummary {
  totalHours: number;
  totalDays: number;
  totalDaysPresent: number;
  totalDaysAbsent: number;
  totalDaysHalfDay: number;
  totalDaysOnLeave: number;
  daysInMonth: number;
  attendanceRate: number;
  averageHoursPerDay: number;
}

interface DetailedAttendanceResponse {
  staffId: string;
  month: number;
  year: number;
  staff: StaffInfo;
  branch: BranchInfo;
  summary: AttendanceSummary;
  dailyAttendance: DailyAttendance[];
  totalRecords: number;
}

interface StaffAttendanceDetailModalProps {
  staffId: string;
  staffName: string;
  onClose: () => void;
}

export default function StaffAttendanceDetailModal({ staffId, staffName, onClose }: StaffAttendanceDetailModalProps) {
  const [attendanceData, setAttendanceData] = useState<DetailedAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchAttendanceDetails();
  }, [staffId, selectedMonth, selectedYear]);

  const fetchAttendanceDetails = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<DetailedAttendanceResponse>(
        `/api/attendance/staff/${staffId}?month=${selectedMonth}&year=${selectedYear}`,
        { showErrorToast: true }
      );
      setAttendanceData(response);
    } catch (error) {
      console.error('Failed to fetch attendance details:', error);
      toast.error('Failed to load attendance details');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!attendanceData) return;
    setExporting('csv');
    try {
      exportAndDownloadCSV(
        attendanceData,
        staffName,
        selectedMonth,
        selectedYear
      );
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!attendanceData) return;
    setExporting('pdf');
    try {
      exportAndDownloadPDF(
        attendanceData,
        staffName,
        selectedMonth,
        selectedYear
      );
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-success-transparent';
      case 'absent':
        return 'bg-danger-transparent';
      case 'on_leave':
        return 'bg-warning-transparent';
      case 'half_day':
        return 'bg-info-transparent';
      default:
        return 'bg-secondary-transparent';
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <div>
              <h4 className="modal-title mb-1">
                <i className="ti ti-user-check me-2"></i>
                {staffName} - Attendance Details
              </h4>
              {attendanceData && (
                <small className="text-white-50">
                  {attendanceData.staff.email} • {attendanceData.staff.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </small>
              )}
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-4">
                <label className="form-label">Month</label>
                <select
                  className="form-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Year</label>
                <select
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 d-flex align-items-end gap-2">
                <button
                  className="btn btn-outline-success flex-fill"
                  onClick={handleExportCSV}
                  disabled={loading || exporting === 'csv' || !attendanceData}
                >
                  <i className="ti ti-file-spreadsheet me-2"></i>
                  {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
                </button>
                <button
                  className="btn btn-outline-danger flex-fill"
                  onClick={handleExportPDF}
                  disabled={loading || exporting === 'pdf' || !attendanceData}
                >
                  <i className="ti ti-file-type-pdf me-2"></i>
                  {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading attendance data...</p>
              </div>
            ) : attendanceData && attendanceData.totalRecords > 0 ? (
              <>
                <div className="row mb-4">
                  <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card bg-primary-transparent border-0">
                      <div className="card-body text-center">
                        <i className="ti ti-clock text-primary mb-2" style={{ fontSize: '2rem' }}></i>
                        <h3 className="mb-0 text-primary">{attendanceData.summary.totalHours.toFixed(1)}</h3>
                        <p className="text-muted mb-0 small">Total Hours</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card bg-success-transparent border-0">
                      <div className="card-body text-center">
                        <i className="ti ti-calendar-check text-success mb-2" style={{ fontSize: '2rem' }}></i>
                        <h3 className="mb-0 text-success">{attendanceData.summary.totalDaysPresent}</h3>
                        <p className="text-muted mb-0 small">Days Present</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card bg-info-transparent border-0">
                      <div className="card-body text-center">
                        <i className="ti ti-percentage text-info mb-2" style={{ fontSize: '2rem' }}></i>
                        <h3 className="mb-0 text-info">{attendanceData.summary.attendanceRate.toFixed(0)}%</h3>
                        <p className="text-muted mb-0 small">Attendance Rate</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card bg-warning-transparent border-0">
                      <div className="card-body text-center">
                        <i className="ti ti-chart-line text-warning mb-2" style={{ fontSize: '2rem' }}></i>
                        <h3 className="mb-0 text-warning">{attendanceData.summary.averageHoursPerDay.toFixed(1)}</h3>
                        <p className="text-muted mb-0 small">Avg Hours/Day</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-0">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">
                      <i className="ti ti-list-details me-2"></i>
                      Daily Attendance Log
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive" style={{ maxHeight: '400px' }}>
                      <table className="table table-hover mb-0">
                        <thead className="sticky-top bg-light">
                          <tr>
                            <th>Date</th>
                            <th>First Clock In</th>
                            <th>Last Clock Out</th>
                            <th>Total Hours</th>
                            <th>Sessions</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.dailyAttendance.map((day) => (
                            <tr key={day.date}>
                              <td>
                                <strong>{formatDate(day.date)}</strong>
                              </td>
                              <td>
                                <i className="ti ti-clock-play text-success me-1"></i>
                                {formatTime(day.firstClockIn)}
                              </td>
                              <td>
                                {day.lastClockOut ? (
                                  <>
                                    <i className="ti ti-clock-stop text-danger me-1"></i>
                                    {formatTime(day.lastClockOut)}
                                  </>
                                ) : (
                                  <span className="badge bg-warning-transparent">Active</span>
                                )}
                              </td>
                              <td>
                                <strong>{day.totalHours.toFixed(2)} hrs</strong>
                              </td>
                              <td>
                                <span className="badge bg-info-transparent">
                                  {day.sessions.length} session{day.sessions.length > 1 ? 's' : ''}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(day.status)}`}>
                                  {day.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <i className="ti ti-calendar-off text-muted mb-3 d-block" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted">No attendance records found for the selected period</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-light border"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
