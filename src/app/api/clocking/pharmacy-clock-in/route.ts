import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import Prescription from '@/models/Prescription';
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

      const userRole = session.user.role as UserRole;

      if (userRole !== UserRole.PHARMACY && userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Only pharmacy staff can clock in and dispense medications' },
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

      if (visit.currentStage !== 'pharmacy') {
        return NextResponse.json(
          { 
            error: `Cannot clock in. Patient is currently at ${visit.currentStage} stage`,
            currentStage: visit.currentStage
          },
          { status: 400 }
        );
      }

      if (visit.stages.pharmacy?.clockedInAt) {
        return NextResponse.json(
          { error: 'Pharmacy has already clocked in for this visit' },
          { status: 400 }
        );
      }

      const updateData: any = {
        'stages.pharmacy.clockedInBy': session.user.id,
        'stages.pharmacy.clockedInAt': new Date(),
      };

      if (body.notes && body.notes.trim()) {
        updateData['stages.pharmacy.notes'] = body.notes.trim();
      }

      if (body.prescriptionIds && Array.isArray(body.prescriptionIds) && body.prescriptionIds.length > 0) {
        await Prescription.updateMany(
          { 
            _id: { $in: body.prescriptionIds },
            visit: body.visitId,
            status: 'active'
          },
          { 
            $set: { 
              status: 'dispensed',
              dispensedBy: session.user.id,
              dispensedAt: new Date()
            } 
          }
        );
      }

      const updatedVisit = await PatientVisit.findByIdAndUpdate(
        body.visitId,
        { $set: updateData },
        { new: true }
      )
        .populate('patient', 'patientId firstName lastName phoneNumber email dateOfBirth gender')
        .populate('appointment')
        .populate('branchId', 'name address city state')
        .populate('assignedDoctor', 'firstName lastName email')
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
          message: 'Medications dispensed and clocked in successfully',
          visit: updatedVisit
        },
        { status: 200 }
      );

    } catch (error: any) {
      console.error('Pharmacy clock-in error:', error);
      return NextResponse.json(
        { error: 'Failed to clock in and dispense medications', message: error.message },
        { status: 500 }
      );
    }
  });
}
