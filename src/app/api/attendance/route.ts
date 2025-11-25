import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import { requireAuth, UserRole } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      const userId = body.userId || session.user.id;
      const branchId = body.branchId || session.user.branch?._id || session.user.branch;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeSession = await Attendance.findOne({
        user: userId,
        date: today,
        clockOut: null
      });

      if (activeSession) {
        return NextResponse.json(
          { error: 'Already clocked in. Please clock out before starting a new session.' },
          { status: 409 }
        );
      }

      const existingSessions = await Attendance.find({
        user: userId,
        date: today
      }).sort({ sessionNumber: -1 }).limit(1);

      const sessionNumber = existingSessions.length > 0 ? existingSessions[0].sessionNumber + 1 : 1;

      const attendanceData = {
        user: userId,
        branchId: branchId,
        date: today,
        clockIn: new Date(),
        sessionNumber: sessionNumber,
        status: 'present',
        notes: body.notes
      };

      const attendance = await Attendance.create(attendanceData);

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('user', 'firstName lastName email')
        .populate('branchId', 'name');

      return NextResponse.json(
        {
          message: sessionNumber === 1 ? 'Clock-in successful' : `Clock-in successful - Session ${sessionNumber}`,
          attendance: populatedAttendance
        },
        { status: 201 }
      );

    } catch (error: any) {
      console.error('Clock-in error:', error);

      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys(error.errors).map(
          key => error.errors[key].message
        );
        return NextResponse.json(
          { error: 'Validation error', details: validationErrors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to record attendance', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '30');
      const userId = searchParams.get('user');
      const branchId = searchParams.get('branch');
      const status = searchParams.get('status');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      const query: any = {};

      if (userId) {
        query.user = userId;
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (status && ['present', 'absent', 'on_leave', 'half_day'].includes(status)) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) {
          query.date.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.date.$lte = new Date(dateTo);
        }
      }

      const userRole = session.user.role as UserRole;
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.FRONT_DESK) {
        if (!userId || userId !== session.user.id) {
          query.user = session.user.id;
        }
      }

      if (userRole !== UserRole.ADMIN && session.user.branch) {
        const userBranchId = session.user.branch._id || session.user.branch;
        if (!branchId || branchId !== userBranchId.toString()) {
          query.branchId = userBranchId;
        }
      }

      // Fetch all matching records (no skip/limit yet - we need to group first)
      const attendanceRecords = await Attendance.find(query)
        .populate('user', 'firstName lastName email role')
        .populate('branchId', 'name')
        .sort({ date: -1, sessionNumber: 1 })
        .lean();

      const groupedAttendance: any[] = [];
      const groupMap = new Map();

      attendanceRecords.forEach((record: any) => {
        const key = `${record.user._id}-${new Date(record.date).toISOString().split('T')[0]}`;
        
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            _id: record._id,
            user: record.user,
            branchId: record.branchId,
            date: record.date,
            sessions: [],
            totalHours: 0,
            status: record.status,
            activeSession: null
          });
          groupedAttendance.push(groupMap.get(key));
        }
        
        const group = groupMap.get(key);
        group.sessions.push(record);
        
        if (record.workHours) {
          group.totalHours += record.workHours;
        }
        
        if (!record.clockOut) {
          group.activeSession = record;
        }
      });

      // Calculate proper first/last times for each grouped day
      groupedAttendance.forEach(group => {
        group.totalHours = parseFloat(group.totalHours.toFixed(2));
        
        if (group.sessions.length > 0) {
          // First session (sorted ascending) has the earliest clock-in
          const firstSession = group.sessions[0];
          group.firstClockIn = firstSession.clockIn;
          group.clockIn = firstSession.clockIn;
          
          // Last session has the latest clock-out (or null if still active)
          const lastSession = group.sessions[group.sessions.length - 1];
          group.lastClockOut = lastSession.clockOut;
          group.clockOut = lastSession.clockOut;
          
          group.workHours = group.totalHours;
          group.sessionCount = group.sessions.length;
          group.allSessions = group.sessions;
        }
      });

      // Pagination based on GROUPED records, not raw sessions
      const totalCount = groupedAttendance.length;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      
      // Apply pagination to the grouped array
      const paginatedRecords = groupedAttendance.slice(skip, skip + limit);

      return NextResponse.json({
        attendance: paginatedRecords.length > 0 ? paginatedRecords : attendanceRecords,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error: any) {
      console.error('Get attendance error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      const userId = body.userId || session.user.id;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne({
        user: userId,
        date: today,
        clockOut: null
      }).sort({ sessionNumber: -1 });

      if (!attendance) {
        return NextResponse.json(
          { error: 'No active session found. Please clock in first.' },
          { status: 404 }
        );
      }

      const clockOutTime = new Date();
      const sessionHours = (clockOutTime.getTime() - attendance.clockIn.getTime()) / (1000 * 60 * 60);

      attendance.clockOut = clockOutTime;
      attendance.workHours = parseFloat(sessionHours.toFixed(2));

      const allSessionsToday = await Attendance.find({
        user: userId,
        date: today,
        clockOut: { $ne: null }
      });

      const totalHoursToday = allSessionsToday.reduce((sum, session) => sum + (session.workHours || 0), 0) + sessionHours;
      
      if (totalHoursToday < 4) {
        attendance.status = 'half_day';
      } else {
        attendance.status = 'present';
      }

      if (body.notes) {
        attendance.notes = body.notes;
      }

      await attendance.save();

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('user', 'firstName lastName email')
        .populate('branchId', 'name');

      return NextResponse.json({
        message: 'Clock-out successful',
        attendance: populatedAttendance
      });

    } catch (error: any) {
      console.error('Clock-out error:', error);
      return NextResponse.json(
        { error: 'Failed to clock out', message: error.message },
        { status: 500 }
      );
    }
  });
}
