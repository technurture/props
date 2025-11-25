import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Admission, { AdmissionStatus } from '@/models/Admission';
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
          { error: 'Invalid admission ID' },
          { status: 400 }
        );
      }

      const admission = await Admission.findById(id)
        .populate('patientId', 'patientId firstName lastName phoneNumber email dateOfBirth gender bloodGroup')
        .populate('admittingDoctorId', 'firstName lastName email phoneNumber role')
        .populate('primaryDoctorId', 'firstName lastName email phoneNumber role')
        .populate('branchId', 'name address city state country phone email')
        .populate('visitId')
        .populate('dailyNotes.doctorId', 'firstName lastName email role')
        .populate('dailyNotes.nurseId', 'firstName lastName email role')
        .populate('dischargedBy', 'firstName lastName email role')
        .populate('createdBy', 'firstName lastName email')
        .lean() as any;

      if (!admission) {
        return NextResponse.json(
          { error: 'Admission not found' },
          { status: 404 }
        );
      }

      const admissionBranchId = admission.branchId?._id || admission.branchId;
      
      if (!canAccessResource(session.user, admissionBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this admission.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ admission });

    } catch (error: any) {
      console.error('Get admission error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admission', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid admission ID' },
            { status: 400 }
          );
        }

        const existingAdmission = await Admission.findById(id);

        if (!existingAdmission) {
          return NextResponse.json(
            { error: 'Admission not found' },
            { status: 404 }
          );
        }

        if (!canAccessResource(session.user, existingAdmission.branchId)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to update this admission.' },
            { status: 403 }
          );
        }

        const body = await req.json();

        const updateData: any = {};

        const allowedFields = [
          'primaryDoctorId',
          'ward',
          'room',
          'bed',
          'diagnosis',
          'treatmentPlan',
          'expectedDischargeDate',
          'dailyRate'
        ];

        allowedFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        const updatedAdmission = await Admission.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('patientId', 'patientId firstName lastName phoneNumber email')
          .populate('admittingDoctorId', 'firstName lastName email role')
          .populate('primaryDoctorId', 'firstName lastName email role')
          .populate('branchId', 'name address city state')
          .populate('createdBy', 'firstName lastName email');

        return NextResponse.json({
          message: 'Admission updated successfully',
          admission: updatedAdmission
        });

      } catch (error: any) {
        console.error('Update admission error:', error);

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
          { error: 'Failed to update admission', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
