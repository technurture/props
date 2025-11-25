import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import StaffProfile from '@/models/StaffProfile';
import Attendance from '@/models/Attendance';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { id } = await params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: 'Invalid staff ID' },
          { status: 400 }
        );
      }

      const staff = await User.findById(id)
        .populate('branchId', 'name address city state country phone email')
        .lean() as any;

      if (!staff) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      const staffBranchId = (staff.branchId as any)?._id || staff.branchId;
      
      if (!canAccessResource(session.user, staffBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this staff member.' },
          { status: 403 }
        );
      }

      const staffProfile = await StaffProfile.findOne({ userId: id }).lean() as any;

      const recentAttendance = await Attendance.find({ user: id })
        .sort({ date: -1 })
        .limit(30)
        .populate('branch', 'name')
        .lean() as any;

      return NextResponse.json({
        staff: {
          ...staff,
          profile: staffProfile
        },
        recentAttendance
      });

    } catch (error: any) {
      console.error('Get staff error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff member', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid staff ID' },
            { status: 400 }
          );
        }

        const existingStaff = await User.findById(id);

        if (!existingStaff) {
          return NextResponse.json(
            { error: 'Staff member not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, existingStaff.branchId?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        const body = await req.json();

        const updateData: any = {};
        const allowedUserFields = [
          'firstName',
          'lastName',
          'phoneNumber',
          'role',
          'branchId'
        ];

        allowedUserFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        if (body.email && body.email.toLowerCase() !== existingStaff.email) {
          const emailExists = await User.findOne({
            email: body.email.toLowerCase(),
            _id: { $ne: id }
          });

          if (emailExists) {
            return NextResponse.json(
              { error: 'Email already exists' },
              { status: 409 }
            );
          }

          updateData.email = body.email;
        }

        allowedUserFields.forEach(field => {
          if (updateData[field] !== undefined) {
            existingStaff[field] = updateData[field];
          }
        });

        if (updateData.email) {
          existingStaff.email = updateData.email;
        }

        if (body.password) {
          if (typeof body.password !== 'string' || body.password.length < 6) {
            return NextResponse.json(
              { error: 'Password must be at least 6 characters long' },
              { status: 400 }
            );
          }
          existingStaff.password = body.password;
        }

        await existingStaff.save();

        const updatedUser = await User.findById(id)
          .populate('branchId', 'name address city state');

        const profileUpdateData: any = {};
        const allowedProfileFields = [
          'specialization',
          'licenseNumber',
          'department',
          'bio',
          'profileImage',
          'workSchedule'
        ];

        allowedProfileFields.forEach(field => {
          if (body[field] !== undefined) {
            profileUpdateData[field] = body[field];
          }
        });

        let updatedProfile = null;
        if (Object.keys(profileUpdateData).length > 0) {
          updatedProfile = await StaffProfile.findOneAndUpdate(
            { userId: id },
            { $set: profileUpdateData },
            { new: true, upsert: true, runValidators: true }
          );
        } else {
          updatedProfile = await StaffProfile.findOne({ userId: id });
        }

        return NextResponse.json({
          message: 'Staff member updated successfully',
          staff: {
            ...updatedUser?.toObject(),
            profile: updatedProfile
          }
        });

      } catch (error: any) {
        console.error('Update staff error:', error);

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
          { error: 'Failed to update staff member', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid staff ID' },
            { status: 400 }
          );
        }

        const staff = await User.findById(id);

        if (!staff) {
          return NextResponse.json(
            { error: 'Staff member not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, staff.branchId?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        await User.findByIdAndUpdate(
          id,
          { $set: { isActive: false } },
          { new: true }
        );

        return NextResponse.json({
          message: 'Staff member deactivated successfully',
          staffId: staff._id
        });

      } catch (error: any) {
        console.error('Delete staff error:', error);
        return NextResponse.json(
          { error: 'Failed to deactivate staff member', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
