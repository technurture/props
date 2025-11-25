import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import LabTest from '@/models/LabTest';
import Prescription from '@/models/Prescription';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import { addConsultationFeeToVisit } from '@/lib/services/billingService';
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
          { error: 'Invalid visit ID' },
          { status: 400 }
        );
      }

      const visit = await PatientVisit.findById(id)
        .populate('patient', 'firstName lastName patientId phoneNumber email allergies chronicConditions')
        .populate('branchId', 'name address city state')
        .populate('appointment')
        .populate('assignedDoctor', 'firstName lastName email role')
        .populate('assignedNurse', 'firstName lastName email role')
        .populate('stages.frontDesk.clockedInBy', 'firstName lastName')
        .populate('stages.frontDesk.clockedOutBy', 'firstName lastName')
        .populate('stages.nurse.clockedInBy', 'firstName lastName')
        .populate('stages.nurse.clockedOutBy', 'firstName lastName')
        .populate('stages.doctor.clockedInBy', 'firstName lastName')
        .populate('stages.doctor.clockedOutBy', 'firstName lastName')
        .populate('stages.lab.clockedInBy', 'firstName lastName')
        .populate('stages.lab.clockedOutBy', 'firstName lastName')
        .populate('stages.pharmacy.clockedInBy', 'firstName lastName')
        .populate('stages.pharmacy.clockedOutBy', 'firstName lastName')
        .populate('stages.billing.clockedInBy', 'firstName lastName')
        .populate('stages.billing.clockedOutBy', 'firstName lastName')
        .populate('finalClockOut.clockedOutBy', 'firstName lastName')
        .lean() as any;

      if (!visit) {
        return NextResponse.json(
          { error: 'Visit not found' },
          { status: 404 }
        );
      }

      const visitBranchId = (visit.branchId as any)?._id || visit.branchId;
      
      if (!canAccessResource(session.user, visitBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this visit.' },
          { status: 403 }
        );
      }

      const [labTests, prescriptions] = await Promise.all([
        LabTest.find({ visit: id })
          .populate('doctor', 'firstName lastName')
          .populate('result.performedBy', 'firstName lastName')
          .lean(),
        Prescription.find({ visit: id })
          .populate('doctor', 'firstName lastName')
          .populate('dispensedBy', 'firstName lastName')
          .lean()
      ]);

      return NextResponse.json({
        visit,
        labTests,
        prescriptions
      });

    } catch (error: any) {
      console.error('Get visit error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch visit', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([
    UserRole.ADMIN,
    UserRole.FRONT_DESK,
    UserRole.NURSE,
    UserRole.DOCTOR,
    UserRole.LAB,
    UserRole.PHARMACY,
    UserRole.BILLING
  ])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid visit ID' },
            { status: 400 }
          );
        }

        const existingVisit = await PatientVisit.findById(id);

        if (!existingVisit) {
          return NextResponse.json(
            { error: 'Visit not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, existingVisit.branchId?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        if (existingVisit.status === 'cancelled') {
          return NextResponse.json(
            { error: 'Cannot update a cancelled visit' },
            { status: 400 }
          );
        }

        const body = await req.json();

        const updateData: any = {};

        const allowedFields = ['visitDate', 'currentStage', 'status', 'assignedDoctor', 'assignedNurse'];

        allowedFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        if (body.visitDate) {
          updateData.visitDate = new Date(body.visitDate);
        }

        if (body.stages) {
          updateData.stages = {
            ...existingVisit.stages,
            ...body.stages
          };
        }

        const updatedVisit = await PatientVisit.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('branchId', 'name address city state')
          .populate('appointment')
          .populate('assignedDoctor', 'firstName lastName email role')
          .populate('assignedNurse', 'firstName lastName email role')
          .populate('stages.frontDesk.clockedInBy', 'firstName lastName')
          .populate('stages.frontDesk.clockedOutBy', 'firstName lastName')
          .populate('stages.nurse.clockedInBy', 'firstName lastName')
          .populate('stages.nurse.clockedOutBy', 'firstName lastName')
          .populate('stages.doctor.clockedInBy', 'firstName lastName')
          .populate('stages.doctor.clockedOutBy', 'firstName lastName')
          .populate('stages.lab.clockedInBy', 'firstName lastName')
          .populate('stages.lab.clockedOutBy', 'firstName lastName')
          .populate('stages.pharmacy.clockedInBy', 'firstName lastName')
          .populate('stages.pharmacy.clockedOutBy', 'firstName lastName')
          .populate('stages.billing.clockedInBy', 'firstName lastName')
          .populate('stages.billing.clockedOutBy', 'firstName lastName')
          .populate('finalClockOut.clockedOutBy', 'firstName lastName');

        if (body.assignedDoctor && !existingVisit.assignedDoctor) {
          const consultationResult = await addConsultationFeeToVisit(
            id,
            existingVisit.branchId.toString(),
            existingVisit.patient.toString(),
            session.user.id
          );

          if (!consultationResult.success) {
            console.warn('Failed to add consultation fee:', consultationResult.message);
          }
        }

        return NextResponse.json({
          message: 'Visit updated successfully',
          visit: updatedVisit
        });

      } catch (error: any) {
        console.error('Update visit error:', error);

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
          { error: 'Failed to update visit', message: error.message },
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
  return checkRole([UserRole.ADMIN, UserRole.FRONT_DESK, UserRole.DOCTOR])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid visit ID' },
            { status: 400 }
          );
        }

        const visit = await PatientVisit.findById(id);

        if (!visit) {
          return NextResponse.json(
            { error: 'Visit not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, visit.branchId?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        if (visit.status === 'completed') {
          return NextResponse.json(
            { error: 'Cannot cancel a completed visit' },
            { status: 400 }
          );
        }

        await PatientVisit.findByIdAndUpdate(
          id,
          { $set: { status: 'cancelled' } },
          { new: true }
        );

        return NextResponse.json({
          message: 'Visit cancelled successfully',
          visitId: visit._id,
          visitNumber: visit.visitNumber
        });

      } catch (error: any) {
        console.error('Delete visit error:', error);
        return NextResponse.json(
          { error: 'Failed to cancel visit', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
