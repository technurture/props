import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { requireAuth, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';
import { UserLean, normalizeBranchId } from '@/types/mongoose-lean';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { staffId } = await params;

      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return NextResponse.json(
          { error: 'Invalid staff ID' },
          { status: 400 }
        );
      }

      const { searchParams } = new URL(req.url);
      const month = searchParams.get('month');
      const year = searchParams.get('year');

      if (!month || !year) {
        return NextResponse.json(
          { error: 'Month and year parameters are required' },
          { status: 400 }
        );
      }

      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: 'Invalid month. Must be between 1 and 12' },
          { status: 400 }
        );
      }

      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return NextResponse.json(
          { error: 'Invalid year' },
          { status: 400 }
        );
      }

      const staff = await User.findById(staffId).lean<UserLean>();

      if (!staff) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      const staffBranchId = normalizeBranchId(staff.branchId);

      const userRole = session.user.role as UserRole;
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.FRONT_DESK) {
        if (staffId !== session.user.id) {
          return NextResponse.json(
            { error: 'Forbidden. You can only view your own attendance records.' },
            { status: 403 }
          );
        }
      } else {
        if (!canAccessResource(session.user, staffBranchId)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this staff member.' },
            { status: 403 }
          );
        }
      }

      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

      const attendanceRecords = await Attendance.find({
        user: staffId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .populate('user', 'firstName lastName email role')
        .populate('branchId', 'name address city state')
        .sort({ date: 1, sessionNumber: 1 })
        .lean();

      const dailyAttendance: any[] = [];
      const dailyMap = new Map();
      let totalMonthHours = 0;
      let totalDaysPresent = 0;
      let totalDaysAbsent = 0;
      let totalDaysHalfDay = 0;
      let totalDaysOnLeave = 0;

      attendanceRecords.forEach((record: any) => {
        const dateKey = new Date(record.date).toISOString().split('T')[0];

        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: record.date,
            sessions: [],
            totalHours: 0,
            status: record.status,
            user: record.user,
            branchId: record.branchId
          });
          dailyAttendance.push(dailyMap.get(dateKey));
        }

        const dailyGroup = dailyMap.get(dateKey);
        dailyGroup.sessions.push({
          _id: record._id,
          sessionNumber: record.sessionNumber,
          clockIn: record.clockIn,
          clockOut: record.clockOut,
          workHours: record.workHours || 0,
          notes: record.notes,
          status: record.status
        });

        if (record.workHours) {
          dailyGroup.totalHours += record.workHours;
          totalMonthHours += record.workHours;
        }
      });

      dailyAttendance.forEach(day => {
        day.totalHours = parseFloat(day.totalHours.toFixed(2));
        day.sessionCount = day.sessions.length;

        if (day.sessions.length > 0) {
          day.firstClockIn = day.sessions[0].clockIn;
          const lastSession = day.sessions[day.sessions.length - 1];
          day.lastClockOut = lastSession.clockOut;
          day.hasActiveSession = !lastSession.clockOut;
        }

        switch (day.status) {
          case 'present':
            totalDaysPresent++;
            break;
          case 'absent':
            totalDaysAbsent++;
            break;
          case 'half_day':
            totalDaysHalfDay++;
            break;
          case 'on_leave':
            totalDaysOnLeave++;
            break;
        }
      });

      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const workingDaysInMonth = daysInMonth;
      const attendanceRate = workingDaysInMonth > 0
        ? ((totalDaysPresent + totalDaysHalfDay * 0.5) / workingDaysInMonth * 100).toFixed(2)
        : '0.00';

      return NextResponse.json({
        staffId,
        month: monthNum,
        year: yearNum,
        staff: attendanceRecords.length > 0 ? attendanceRecords[0].user : null,
        branch: attendanceRecords.length > 0 ? attendanceRecords[0].branchId : null,
        summary: {
          totalHours: parseFloat(totalMonthHours.toFixed(2)),
          totalDays: dailyAttendance.length,
          totalDaysPresent,
          totalDaysAbsent,
          totalDaysHalfDay,
          totalDaysOnLeave,
          daysInMonth,
          attendanceRate: parseFloat(attendanceRate),
          averageHoursPerDay: dailyAttendance.length > 0
            ? parseFloat((totalMonthHours / dailyAttendance.length).toFixed(2))
            : 0
        },
        dailyAttendance,
        totalRecords: attendanceRecords.length
      });

    } catch (error: any) {
      console.error('Get staff monthly attendance error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff attendance records', message: error.message },
        { status: 500 }
      );
    }
  });
}
