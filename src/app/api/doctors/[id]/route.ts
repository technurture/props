import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import StaffProfile from '@/models/StaffProfile';
import Appointment from '@/models/Appointment';
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
          { error: 'Invalid doctor ID' },
          { status: 400 }
        );
      }

      const doctor = await User.findOne({ _id: id, role: UserRole.DOCTOR })
        .populate('branchId', 'name address city state country phone email')
        .lean() as any;

      if (!doctor) {
        return NextResponse.json(
          { error: 'Doctor not found' },
          { status: 404 }
        );
      }

      const doctorBranchId = (doctor.branchId as any)?._id || doctor.branchId;
      
      if (!canAccessResource(session.user, doctorBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this doctor.' },
          { status: 403 }
        );
      }

      const staffProfile = await StaffProfile.findOne({ userId: id }).lean() as any;

      const upcomingAppointments = await Appointment.find({
        doctor: id,
        appointmentDate: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] }
      })
        .sort({ appointmentDate: 1 })
        .limit(10)
        .populate('patient', 'firstName lastName patientId phoneNumber')
        .populate('branch', 'name')
        .lean() as any;

      return NextResponse.json({
        doctor: {
          ...doctor,
          profile: staffProfile
        },
        upcomingAppointments
      });

    } catch (error: any) {
      console.error('Get doctor error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch doctor', message: error.message },
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
            { error: 'Invalid doctor ID' },
            { status: 400 }
          );
        }

        const existingDoctor = await User.findOne({ _id: id, role: UserRole.DOCTOR });

        if (!existingDoctor) {
          return NextResponse.json(
            { error: 'Doctor not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, existingDoctor.branchId?.toString());
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
          'branchId'
        ];

        allowedUserFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        if (body.email && body.email.toLowerCase().trim() !== existingDoctor.email) {
          const normalizedEmail = body.email.toLowerCase().trim();
          const emailExists = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: id }
          });

          if (emailExists) {
            return NextResponse.json(
              { error: 'A doctor with this email address already exists. Please use a different email.' },
              { status: 409 }
            );
          }

          updateData.email = normalizedEmail;
        }

        if (body.password) {
          updateData.password = body.password;
        }

        const updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
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

        if (body.branchId && body.branchId !== existingDoctor.branchId?.toString()) {
          profileUpdateData.branchId = body.branchId;
        }

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
          message: 'Doctor updated successfully',
          doctor: {
            ...updatedUser?.toObject(),
            profile: updatedProfile
          }
        });

      } catch (error: any) {
        console.error('Update doctor error:', error);

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
          { error: 'Failed to update doctor', message: error.message },
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
            { error: 'Invalid doctor ID' },
            { status: 400 }
          );
        }

        const doctor = await User.findOne({ _id: id, role: UserRole.DOCTOR });

        if (!doctor) {
          return NextResponse.json(
            { error: 'Doctor not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, doctor.branchId?.toString());
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
          message: 'Doctor deactivated successfully',
          doctorId: doctor._id
        });

      } catch (error: any) {
        console.error('Delete doctor error:', error);
        return NextResponse.json(
          { error: 'Failed to deactivate doctor', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
