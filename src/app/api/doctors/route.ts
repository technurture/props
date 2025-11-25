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
          'branchId'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        const normalizedEmail = body.email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          return NextResponse.json(
            { error: 'A doctor with this email address already exists. Please use a different email.' },
            { status: 409 }
          );
        }

        const userData = {
          email: normalizedEmail,
          password: body.password,
          firstName: body.firstName,
          lastName: body.lastName,
          phoneNumber: body.phoneNumber,
          role: UserRole.DOCTOR,
          branchId: body.branchId,
          isActive: true
        };

        const user = await User.create(userData);

        const staffProfileData = {
          userId: user._id,
          branchId: body.branchId,
          specialization: body.specialization,
          licenseNumber: body.licenseNumber,
          department: body.department,
          bio: body.bio,
          profileImage: body.profileImage,
          workSchedule: body.workSchedule || []
        };

        await StaffProfile.create(staffProfileData);

        const populatedUser = await User.findById(user._id)
          .populate('branchId', 'name address city state')
          .lean();

        const staffProfile = await StaffProfile.findOne({ userId: user._id }).lean();

        return NextResponse.json(
          {
            message: 'Doctor created successfully',
            doctor: {
              ...populatedUser,
              profile: staffProfile
            }
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create doctor error:', error);

        if (error.code === 11000) {
          const field = Object.keys(error.keyPattern || {})[0] || 'field';
          return NextResponse.json(
            { error: `A doctor with this ${field} already exists. Please use a different ${field}.` },
            { status: 409 }
          );
        }

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
          { error: 'Failed to create doctor', message: error.message },
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
      const department = searchParams.get('department');
      const specialization = searchParams.get('specialization');
      const status = searchParams.get('status');
      const clockedIn = searchParams.get('clockedIn') === 'true';

      const query: any = { role: UserRole.DOCTOR };

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

      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      const allowCrossBranch = true;
      applyBranchFilter(query, session.user, allowCrossBranch);

      const skip = (page - 1) * limit;

      const [doctors, totalCount] = await Promise.all([
        User.find(query)
          .populate('branchId', 'name address city state')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      const doctorIds = doctors.map(doc => doc._id);
      const staffProfiles = await StaffProfile.find({ 
        userId: { $in: doctorIds } 
      }).lean();

      const profileMap = new Map(
        staffProfiles.map(profile => [profile.userId.toString(), profile])
      );

      const doctorsWithProfiles = doctors.map(doctor => ({
        ...doctor,
        profile: profileMap.get((doctor._id as any).toString()) || null
      }));

      let filteredDoctors = doctorsWithProfiles;
      
      if (department) {
        filteredDoctors = filteredDoctors.filter(
          doc => doc.profile?.department?.toLowerCase().includes(department.toLowerCase())
        );
      }

      if (specialization) {
        filteredDoctors = filteredDoctors.filter(
          doc => doc.profile?.specialization?.toLowerCase().includes(specialization.toLowerCase())
        );
      }

      if (clockedIn) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeAttendance = await Attendance.find({
          user: { $in: doctorIds },
          date: { $gte: today, $lt: tomorrow },
          clockOut: null
        }).lean();

        const clockedInDoctorIds = new Set(
          activeAttendance.map(att => att.user.toString())
        );

        filteredDoctors = filteredDoctors.filter(
          doc => clockedInDoctorIds.has((doc._id as any).toString())
        );
      }

      const finalCount = (department || specialization || clockedIn) ? filteredDoctors.length : totalCount;
      const pagination = buildPaginationResponse(page, finalCount, limit);

      return NextResponse.json({
        doctors: filteredDoctors,
        pagination
      });

    } catch (error: any) {
      console.error('Get doctors error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch doctors', message: error.message },
        { status: 500 }
      );
    }
  });
}
