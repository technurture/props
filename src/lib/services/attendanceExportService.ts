/**
 * Attendance Export Service
 * 
 * This service handles exporting attendance data to CSV and PDF formats.
 * It provides utilities for generating formatted reports with staff information,
 * monthly summaries, and detailed session data.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AttendanceSession {
  _id?: string;
  sessionNumber: number;
  clockIn: string | Date;
  clockOut?: string | Date;
  workHours: number;
  notes?: string;
  status: 'present' | 'absent' | 'on_leave' | 'half_day';
}

export interface DailyAttendance {
  date: string | Date;
  sessions: AttendanceSession[];
  totalHours: number;
  status: 'present' | 'absent' | 'on_leave' | 'half_day';
  sessionCount?: number;
  firstClockIn?: string | Date;
  lastClockOut?: string | Date;
  hasActiveSession?: boolean;
}

export interface AttendanceSummary {
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

export interface AttendanceData {
  staffId: string;
  month: number;
  year: number;
  staff?: {
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;
  };
  branch?: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  summary: AttendanceSummary;
  dailyAttendance: DailyAttendance[];
}

const formatDate = (date: string | Date | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (date: string | Date | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDateTime = (date: string | Date | undefined): string => {
  if (!date) return 'N/A';
  return `${formatDate(date)} ${formatTime(date)}`;
};

const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

const capitalizeStatus = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Export attendance data to CSV format
 * Generates a CSV file with columns: Date, Session#, Clock In, Clock Out, Hours, Status, Notes
 * 
 * @param attendanceData - The attendance data from the API
 * @param staffName - The name of the staff member
 * @param month - The month number (1-12)
 * @param year - The year
 * @returns CSV string
 */
export function exportAttendanceToCSV(
  attendanceData: AttendanceData,
  staffName: string,
  month: number,
  year: number
): string {
  const monthName = getMonthName(month);
  
  const csvRows: string[] = [];
  
  csvRows.push(`Attendance Report for ${staffName}`);
  csvRows.push(`Period: ${monthName} ${year}`);
  csvRows.push('');
  
  csvRows.push('Summary');
  csvRows.push(`Total Hours,${attendanceData.summary.totalHours.toFixed(2)}`);
  csvRows.push(`Total Days,${attendanceData.summary.totalDays}`);
  csvRows.push(`Days Present,${attendanceData.summary.totalDaysPresent}`);
  csvRows.push(`Days Absent,${attendanceData.summary.totalDaysAbsent}`);
  csvRows.push(`Half Days,${attendanceData.summary.totalDaysHalfDay}`);
  csvRows.push(`Days On Leave,${attendanceData.summary.totalDaysOnLeave}`);
  csvRows.push(`Attendance Rate,${attendanceData.summary.attendanceRate.toFixed(2)}%`);
  csvRows.push(`Average Hours/Day,${attendanceData.summary.averageHoursPerDay.toFixed(2)}`);
  csvRows.push('');
  
  csvRows.push('Date,Session#,Clock In,Clock Out,Hours,Status,Notes');
  
  attendanceData.dailyAttendance.forEach(day => {
    day.sessions.forEach(session => {
      const row = [
        formatDate(day.date),
        session.sessionNumber.toString(),
        formatDateTime(session.clockIn),
        session.clockOut ? formatDateTime(session.clockOut) : 'In Progress',
        session.workHours ? session.workHours.toFixed(2) : '0.00',
        capitalizeStatus(session.status),
        (session.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
      ];
      csvRows.push(row.map(cell => `"${cell}"`).join(','));
    });
  });
  
  csvRows.push('');
  csvRows.push(`Generated on ${formatDateTime(new Date())}`);
  
  return csvRows.join('\n');
}

/**
 * Export attendance data to PDF format
 * Generates a PDF report with header, summary, and detailed session table
 * 
 * @param attendanceData - The attendance data from the API
 * @param staffName - The name of the staff member
 * @param month - The month number (1-12)
 * @param year - The year
 * @returns jsPDF instance
 */
export function exportAttendanceToPDF(
  attendanceData: AttendanceData,
  staffName: string,
  month: number,
  year: number
): jsPDF {
  const doc = new jsPDF();
  const monthName = getMonthName(month);
  
  let yPosition = 20;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Report', 105, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${monthName} ${year}`, 105, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Staff Information', 14, yPosition);
  
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${staffName}`, 14, yPosition);
  
  if (attendanceData.staff?.email) {
    yPosition += 6;
    doc.text(`Email: ${attendanceData.staff.email}`, 14, yPosition);
  }
  
  if (attendanceData.staff?.role) {
    yPosition += 6;
    doc.text(`Role: ${capitalizeStatus(attendanceData.staff.role)}`, 14, yPosition);
  }
  
  if (attendanceData.branch?.name) {
    yPosition += 6;
    doc.text(`Branch: ${attendanceData.branch.name}`, 14, yPosition);
  }
  
  yPosition += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Summary', 14, yPosition);
  
  yPosition += 7;
  
  const summaryData = [
    ['Total Hours Worked', `${attendanceData.summary.totalHours.toFixed(2)} hours`],
    ['Total Days Recorded', attendanceData.summary.totalDays.toString()],
    ['Days Present', attendanceData.summary.totalDaysPresent.toString()],
    ['Days Absent', attendanceData.summary.totalDaysAbsent.toString()],
    ['Half Days', attendanceData.summary.totalDaysHalfDay.toString()],
    ['Days On Leave', attendanceData.summary.totalDaysOnLeave.toString()],
    ['Attendance Rate', `${attendanceData.summary.attendanceRate.toFixed(2)}%`],
    ['Average Hours/Day', `${attendanceData.summary.averageHoursPerDay.toFixed(2)} hours`]
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 60;
  yPosition = finalY + 15;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Detailed Session Log', 14, yPosition);
  
  yPosition += 7;
  
  const sessionTableData: any[] = [];
  
  attendanceData.dailyAttendance.forEach(day => {
    day.sessions.forEach(session => {
      sessionTableData.push([
        formatDate(day.date),
        session.sessionNumber.toString(),
        formatDateTime(session.clockIn),
        session.clockOut ? formatDateTime(session.clockOut) : 'In Progress',
        session.workHours ? session.workHours.toFixed(2) : '0.00',
        capitalizeStatus(session.status),
        session.notes || '-'
      ]);
    });
  });
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Date', 'Session#', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Notes']],
    body: sessionTableData,
    theme: 'striped',
    headStyles: {
      fillColor: [52, 152, 219],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 22 },
      6: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });
  
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Generated on ${formatDateTime(new Date())}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return doc;
}

/**
 * Trigger browser download of a file
 * 
 * @param content - File content (string or Blob)
 * @param filename - Name of the file to download
 * @param mimeType - MIME type of the file (default: 'text/plain')
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: mimeType });
  
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export attendance to CSV and trigger download
 * 
 * @param attendanceData - The attendance data from the API
 * @param staffName - The name of the staff member
 * @param month - The month number (1-12)
 * @param year - The year
 */
export function exportAndDownloadCSV(
  attendanceData: AttendanceData,
  staffName: string,
  month: number,
  year: number
): void {
  const csv = exportAttendanceToCSV(attendanceData, staffName, month, year);
  const monthName = getMonthName(month);
  const filename = `${staffName.replace(/\s+/g, '_')}_Attendance_${monthName}_${year}.csv`;
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export attendance to PDF and trigger download
 * 
 * @param attendanceData - The attendance data from the API
 * @param staffName - The name of the staff member
 * @param month - The month number (1-12)
 * @param year - The year
 */
export function exportAndDownloadPDF(
  attendanceData: AttendanceData,
  staffName: string,
  month: number,
  year: number
): void {
  const pdf = exportAttendanceToPDF(attendanceData, staffName, month, year);
  const monthName = getMonthName(month);
  const filename = `${staffName.replace(/\s+/g, '_')}_Attendance_${monthName}_${year}.pdf`;
  pdf.save(filename);
}
