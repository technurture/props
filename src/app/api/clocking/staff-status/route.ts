import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const userId = session.user.id;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne({
        user: userId,
        date: today
      }).sort({ sessionNumber: -1 });

      if (attendance && !attendance.clockOut) {
        return NextResponse.json({
          hasClockedIn: true,
          attendanceId: attendance._id.toString()
        });
      }

      return NextResponse.json({
        hasClockedIn: false
      });

    } catch (error: any) {
      console.error('Staff status check error:', error);
      return NextResponse.json(
        { error: 'Failed to check staff status', message: error.message },
        { status: 500 }
      );
    }
  });
}
