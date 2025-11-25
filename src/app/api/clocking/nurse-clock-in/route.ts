import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import { requireAuth, UserRole } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      if (!body.visitId) {
        return NextResponse.json(
          { error: 'Visit ID is required' },
          { status: 400 }
        );
      }

      if (!body.vitalSigns) {
        return NextResponse.json(
          { error: 'Vital signs are required' },
          { status: 400 }
        );
      }

      const userRole = session.user.role as UserRole;

      if (userRole !== UserRole.NURSE && userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Only nurses can clock in and record vitals' },
          { status: 403 }
        );
      }

      const visit = await PatientVisit.findById(body.visitId)
        .populate('patient', 'patientId firstName lastName phoneNumber email');

      if (!visit) {
        return NextResponse.json(
          { error: 'Visit not found' },
          { status: 404 }
        );
      }

      if (visit.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'Visit is not in progress' },
          { status: 400 }
        );
      }

      if (visit.currentStage !== 'nurse') {
        return NextResponse.json(
          { 
            error: `Cannot clock in. Patient is currently at ${visit.currentStage} stage`,
            currentStage: visit.currentStage
          },
          { status: 400 }
        );
      }

      if (visit.stages.nurse?.clockedInAt) {
        return NextResponse.json(
          { error: 'Nurse has already clocked in for this visit' },
          { status: 400 }
        );
      }

      const updateData: any = {
        'stages.nurse.clockedInBy': session.user.id,
        'stages.nurse.clockedInAt': new Date(),
        'stages.nurse.vitalSigns': body.vitalSigns
      };

      if (body.notes) {
        updateData['stages.nurse.notes'] = body.notes;
      }

      const updatedVisit = await PatientVisit.findByIdAndUpdate(
        body.visitId,
        updateData,
        { new: true }
      )
        .populate('patient', 'patientId firstName lastName phoneNumber email dateOfBirth gender')
        .populate('appointment')
        .populate('branchId', 'name address city state')
        .populate('stages.frontDesk.clockedInBy', 'firstName lastName email role')
        .populate('stages.frontDesk.clockedOutBy', 'firstName lastName email role')
        .populate('stages.nurse.clockedInBy', 'firstName lastName email role')
        .populate('stages.nurse.clockedOutBy', 'firstName lastName email role')
        .populate('stages.doctor.clockedInBy', 'firstName lastName email role')
        .populate('stages.doctor.clockedOutBy', 'firstName lastName email role')
        .populate('stages.lab.clockedInBy', 'firstName lastName email role')
        .populate('stages.lab.clockedOutBy', 'firstName lastName email role')
        .populate('stages.pharmacy.clockedInBy', 'firstName lastName email role')
        .populate('stages.pharmacy.clockedOutBy', 'firstName lastName email role')
        .populate('stages.billing.clockedInBy', 'firstName lastName email role')
        .populate('stages.billing.clockedOutBy', 'firstName lastName email role')
        .populate('stages.returnedToFrontDesk.clockedInBy', 'firstName lastName email role')
        .populate('stages.returnedToFrontDesk.clockedOutBy', 'firstName lastName email role');

      return NextResponse.json(
        {
          message: 'Vitals recorded and clocked in successfully',
          visit: updatedVisit
        },
        { status: 200 }
      );

    } catch (error: any) {
      console.error('Nurse clock-in error:', error);
      return NextResponse.json(
        { error: 'Failed to clock in and record vitals', message: error.message },
        { status: 500 }
      );
    }
  });
}
