import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import StaffProfile from '@/models/StaffProfile';
import Attendance from '@/models/Attendance';
import { requireAuth } from '@/lib/middleware/auth';
import { hasPermission } from '@/lib/middleware/rbac';
import { 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      if (!hasPermission(session.user.role, 'staff_directory:read')) {
        return NextResponse.json(
          { error: 'You do not have permission to view the staff directory' },
          { status: 403 }
        );
      }

      await dbConnect();

      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role');
      const branchId = searchParams.get('branch');
      const onDutyOnly = searchParams.get('onDuty') === 'true';

      const query: any = {
        isActive: true
      };

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (role) {
        query.role = role;
      }

      let userIds: string[] = [];
      
      if (onDutyOnly) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendanceRecords = await Attendance.find({
          date: {
            $gte: today,
            $lt: tomorrow
          },
          clockInTime: { $exists: true },
          $or: [
            { clockOutTime: { $exists: false } },
            { clockOutTime: null }
          ]
        }).distinct('user');

        userIds = attendanceRecords.map((id: any) => id.toString());
        
        if (userIds.length > 0) {
          query._id = { $in: userIds };
        } else {
          return NextResponse.json({
            staff: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalCount: 0,
              limit,
              hasNextPage: false,
              hasPreviousPage: false
            }
          });
        }
      }

      const skip = (page - 1) * limit;

      const totalCount = await User.countDocuments(query);
      
      const staff = await User.find(query)
        .select('firstName lastName role branchId isActive')
        .populate('branchId', 'name city')
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const userIdsForProfiles = staff.map((s: any) => s._id);
      const profiles = await StaffProfile.find({ 
        userId: { $in: userIdsForProfiles } 
      })
        .select('userId profileImage department specialization')
        .lean();

      const profileMap = new Map(
        profiles.map((p: any) => [p.userId.toString(), p])
      );

      let onDutyMap = new Map();
      if (onDutyOnly || userIdsForProfiles.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendanceRecords = await Attendance.find({
          user: { $in: userIdsForProfiles },
          date: {
            $gte: today,
            $lt: tomorrow
          },
          clockInTime: { $exists: true },
          $or: [
            { clockOutTime: { $exists: false } },
            { clockOutTime: null }
          ]
        })
        .sort({ clockInTime: -1 })
        .lean();

        attendanceRecords.forEach((record: any) => {
          const userId = record.user.toString();
          if (!onDutyMap.has(userId)) {
            onDutyMap.set(userId, true);
          }
        });
      }

      const enrichedStaff = staff.map((member: any) => {
        const userId = member._id.toString();
        const profile = profileMap.get(userId);
        const isOnDuty = onDutyMap.get(userId) || false;

        const branchInfo = member.branchId && typeof member.branchId === 'object' 
          ? { name: member.branchId.name, city: member.branchId.city }
          : null;

        return {
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          fullName: `${member.firstName} ${member.lastName}`,
          role: member.role,
          branch: branchInfo,
          isActive: member.isActive,
          isOnDuty,
          profileImage: profile?.profileImage,
          department: profile?.department,
          specialization: profile?.specialization
        };
      });

      const pagination = buildPaginationResponse(page, limit, totalCount);

      return NextResponse.json({
        staff: enrichedStaff,
        pagination
      });

    } catch (error: any) {
      console.error('Staff directory error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff directory', message: error.message },
        { status: 500 }
      );
    }
  });
}
