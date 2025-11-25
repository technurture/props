import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Prescription from '@/models/Prescription';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';
import { PrescriptionLean, getBranchId } from '@/types/db';

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
          { error: 'Invalid prescription ID' },
          { status: 400 }
        );
      }

      const prescription = await Prescription.findById(id)
        .populate('patient', 'firstName lastName patientId phoneNumber email allergies')
        .populate('doctor', 'firstName lastName')
        .populate('branch', 'name address city state')
        .populate('visit')
        .populate('dispensedBy', 'firstName lastName')
        .lean<PrescriptionLean>();

      if (!prescription) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        );
      }

      const prescriptionBranchId = getBranchId(prescription.branch);
      
      if (!canAccessResource(session.user, prescriptionBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this prescription.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ prescription });

    } catch (error: any) {
      console.error('Get prescription error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prescription', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.PHARMACY, UserRole.DOCTOR, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid prescription ID' },
            { status: 400 }
          );
        }

        const existingPrescription = await Prescription.findById(id);

        if (!existingPrescription) {
          return NextResponse.json(
            { error: 'Prescription not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, existingPrescription.branch?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        if (session.user.role === UserRole.DOCTOR && existingPrescription.doctor?.toString() !== session.user.id) {
          return NextResponse.json(
            { error: 'Forbidden. Doctors can only edit their own prescriptions.' },
            { status: 403 }
          );
        }

        const body = await req.json();

        const updateData: any = {};

        const allowedFields = ['medications', 'diagnosis', 'notes', 'status'];

        allowedFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        if (body.dispense && session.user.role === UserRole.PHARMACY) {
          updateData.status = 'dispensed';
          updateData.dispensedBy = session.user.id;
          updateData.dispensedAt = new Date();
        }

        const updatedPrescription = await Prescription.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('patient', 'firstName lastName patientId')
          .populate('doctor', 'firstName lastName')
          .populate('branch', 'name')
          .populate('dispensedBy', 'firstName lastName');

        return NextResponse.json({
          message: 'Prescription updated successfully',
          prescription: updatedPrescription
        });

      } catch (error: any) {
        console.error('Update prescription error:', error);

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
          { error: 'Failed to update prescription', message: error.message },
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
  return checkRole([UserRole.DOCTOR, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid prescription ID' },
            { status: 400 }
          );
        }

        const prescription = await Prescription.findById(id);

        if (!prescription) {
          return NextResponse.json(
            { error: 'Prescription not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, prescription.branch?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        if (session.user.role === UserRole.DOCTOR && prescription.doctor?.toString() !== session.user.id) {
          return NextResponse.json(
            { error: 'Forbidden. Doctors can only delete their own prescriptions.' },
            { status: 403 }
          );
        }

        if (prescription.status === 'dispensed') {
          return NextResponse.json(
            { error: 'Cannot cancel a dispensed prescription' },
            { status: 400 }
          );
        }

        await Prescription.findByIdAndUpdate(
          id,
          { $set: { status: 'cancelled' } },
          { new: true }
        );

        return NextResponse.json({
          message: 'Prescription cancelled successfully',
          prescriptionNumber: prescription.prescriptionNumber
        });

      } catch (error: any) {
        console.error('Cancel prescription error:', error);
        return NextResponse.json(
          { error: 'Failed to cancel prescription', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
