import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import StaffProfile from '@/models/StaffProfile';
import Attendance from '@/models/Attendance';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, _session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'email',
          'password',
          'firstName',
          'lastName',
          'phoneNumber',
          'role',
          'branchId'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        if (!Object.values(UserRole).includes(body.role)) {
          return NextResponse.json(
            { error: 'Invalid role specified' },
            { status: 400 }
          );
        }

        const existingUser = await User.findOne({ email: body.email.toLowerCase() });
        if (existingUser) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          );
        }

        const userData = {
          email: body.email,
          password: body.password,
          firstName: body.firstName,
          lastName: body.lastName,
          phoneNumber: body.phoneNumber,
          role: body.role,
          branchId: body.branchId,
          isActive: true
        };

        const user = await User.create(userData);

        if (body.specialization || body.licenseNumber || body.department || body.bio || body.workSchedule) {
          const staffProfileData = {
            userId: user._id,
            specialization: body.specialization,
            licenseNumber: body.licenseNumber,
            department: body.department,
            bio: body.bio,
            profileImage: body.profileImage,
            workSchedule: body.workSchedule || []
          };

          await StaffProfile.create(staffProfileData);
        }

        const populatedUser = await User.findById(user._id)
          .populate('branchId', 'name address city state')
          .lean();

        const staffProfile = await StaffProfile.findOne({ userId: user._id }).lean();

        return NextResponse.json(
          {
            message: 'Staff member created successfully',
            staff: {
              ...populatedUser,
              profile: staffProfile
            }
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create staff error:', error);

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
          { error: 'Failed to create staff member', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const branchId = searchParams.get('branch');
      const role = searchParams.get('role');
      const department = searchParams.get('department');
      const status = searchParams.get('status');
      const clockedIn = searchParams.get('clockedIn') === 'true';

      const query: any = {};

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (role && Object.values(UserRole).includes(role as UserRole)) {
        query.role = role;
      }

      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      } else if (status === 'all') {
        // Show all staff (both active and inactive)
      } else {
        // Default to showing only active staff
        query.isActive = true;
      }

      const allowCrossBranch = true;
      applyBranchFilter(query, session.user, allowCrossBranch);

      if (clockedIn) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeAttendance = await Attendance.find({
          date: { $gte: today, $lt: tomorrow },
          clockOut: null
        }).lean();

        const clockedInUserIds = activeAttendance.map(att => att.user);

        query._id = { $in: clockedInUserIds };
      }

      const skip = (page - 1) * limit;

      const [staff, totalCount] = await Promise.all([
        User.find(query)
          .populate('branchId', 'name address city state')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      const staffIds = staff.map(s => s._id);
      const staffProfiles = await StaffProfile.find({ 
        userId: { $in: staffIds } 
      }).lean();

      const profileMap = new Map(
        staffProfiles.map(profile => [profile.userId.toString(), profile])
      );

      let staffWithProfiles = staff.map(s => ({
        ...s,
        profile: profileMap.get((s._id as any).toString()) || null
      }));

      if (department) {
        staffWithProfiles = staffWithProfiles.filter(
          s => s.profile?.department?.toLowerCase().includes(department.toLowerCase())
        );
      }

      const finalCount = department ? staffWithProfiles.length : totalCount;
      const pagination = buildPaginationResponse(page, finalCount, limit);

      return NextResponse.json({
        staff: staffWithProfiles,
        pagination
      });

    } catch (error: any) {
      console.error('Get staff error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff', message: error.message },
        { status: 500 }
      );
    }
  });
}
